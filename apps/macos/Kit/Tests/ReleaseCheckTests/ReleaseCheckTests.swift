import Foundation
@testable import ReleaseCheck
import Testing

private let releasesJSON = Data(#"""
[
  {"tag_name":"v0.5.0-beta.1","html_url":"https://github.com/o/r/releases/tag/v0.5.0-beta.1","draft":false,"prerelease":true,"assets":[]},
  {"tag_name":"macos-v9.0.0","html_url":"https://github.com/o/r/releases/tag/macos-v9.0.0","draft":false,"prerelease":false,"assets":[]},
  {"tag_name":"v0.4.0","html_url":"https://github.com/o/r/releases/tag/v0.4.0","draft":false,"prerelease":false,
   "assets":[{"name":"air-conditioner.yunplugin","browser_download_url":"https://example.com/a.yunplugin"},
             {"name":"CuteAC-0.4.0.zip","browser_download_url":"https://example.com/CuteAC-0.4.0.zip"}]},
  {"tag_name":"v0.10.0","html_url":"https://github.com/o/r/releases/tag/v0.10.0","draft":true,"prerelease":false,"assets":[]},
  {"tag_name":"v0.3.0","html_url":"https://github.com/o/r/releases/tag/v0.3.0","draft":false,"prerelease":false,"assets":[]}
]
"""#.utf8)

private func checker(_ data: Data = releasesJSON, prefix: String = "v", status: Int = 200) -> ReleaseChecker {
  ReleaseChecker(repository: "o/r", tagPrefix: prefix, assetPrefix: "CuteAC-") { request in
    (data, HTTPURLResponse(url: request.url!, statusCode: status, httpVersion: nil, headerFields: nil)!)
  }
}

@Suite struct ReleaseCheckerTests {
  @Test func picksTheNewestStableReleaseWithThePrefix() async throws {
    let release = try #require(try await checker().latest())
    #expect(release.version == "0.4.0" && release.tag == "v0.4.0")
    #expect(release.downloadURL?.lastPathComponent == "CuteAC-0.4.0.zip")
    #expect(try await checker(prefix: "macos-v").latest()?.version == "9.0.0")
  }

  @Test func fallsBackToTheLatestReleasePageWhenRateLimited() async throws {
    let limited = ReleaseChecker(repository: "o/r", tagPrefix: "v", assetPrefix: "CuteAC-") { request in
      if request.url?.host == "api.github.com" {
        return (Data(), HTTPURLResponse(url: request.url!, statusCode: 403, httpVersion: nil, headerFields: nil)!)
      }
      // URLSession follows the redirect; the final URL is the tag page.
      let tagPage = URL(string: "https://github.com/o/r/releases/tag/v0.4.0")!
      return (Data(), HTTPURLResponse(url: tagPage, statusCode: 200, httpVersion: nil, headerFields: nil)!)
    }
    let release = try #require(try await limited.latest())
    #expect(release.version == "0.4.0")
    #expect(release.downloadURL?.absoluteString == "https://github.com/o/r/releases/download/v0.4.0/CuteAC-0.4.0.zip")
  }

  @Test func comparesVersionsNumerically() {
    #expect(AppVersion.compare("0.10.0", "0.9.0") == .orderedDescending)
    #expect(AppVersion.compare("0.4.0-beta.1", "0.4.0") == .orderedAscending)
    #expect(AppVersion.compare("1.0", "1.0.0") == .orderedSame)
  }
}

@MainActor
@Suite struct UpdateMonitorTests {
  private func defaults() -> UserDefaults {
    UserDefaults(suiteName: "release-check-\(UUID().uuidString)")!
  }

  @Test func reportsANewerRelease() async {
    let monitor = UpdateMonitor(checker: checker(), currentVersion: "0.3.0", defaults: defaults(), keyPrefix: "test")
    await monitor.check()
    #expect(monitor.available?.version == "0.4.0")
  }

  @Test func staysQuietWhenCurrentOrOffline() async {
    let current = UpdateMonitor(checker: checker(), currentVersion: "0.4.0", defaults: defaults(), keyPrefix: "test")
    await current.check()
    #expect(current.status == .upToDate && current.available == nil)

    let offline = UpdateMonitor(checker: checker(status: 503), currentVersion: "0.3.0", defaults: defaults(), keyPrefix: "test")
    await offline.check()
    #expect(offline.available == nil)
    if case .failed = offline.status {} else { Issue.record("expected a failure status") }
  }

  @Test func automaticChecksRunAtMostOncePerInterval() async {
    let store = defaults()
    let monitor = UpdateMonitor(checker: checker(), currentVersion: "0.3.0", defaults: store, keyPrefix: "test")
    let start = Date(timeIntervalSince1970: 1_000_000)
    await monitor.checkIfDue(now: start)
    #expect(monitor.available != nil)

    // A second monitor sharing the defaults skips until a day has passed.
    let later = UpdateMonitor(checker: checker(), currentVersion: "0.3.0", defaults: store, keyPrefix: "test")
    await later.checkIfDue(now: start.addingTimeInterval(3600))
    #expect(later.status == .idle)
    await later.checkIfDue(now: start.addingTimeInterval(25 * 3600))
    #expect(later.available != nil)

    later.automaticChecks = false
    let disabled = UpdateMonitor(checker: checker(), currentVersion: "0.3.0", defaults: store, keyPrefix: "test")
    await disabled.checkIfDue(now: start.addingTimeInterval(100 * 3600))
    #expect(disabled.status == .idle)
  }

  @Test func unbundledBuildsNeverCheck() async {
    let monitor = UpdateMonitor(checker: checker(), currentVersion: nil, defaults: defaults(), keyPrefix: "test")
    await monitor.checkIfDue()
    #expect(monitor.status == .idle)
  }
}
