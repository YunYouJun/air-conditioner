import Combine
import Foundation

/// A published app version on GitHub Releases.
public struct AppRelease: Equatable, Sendable {
  public var version: String
  public var tag: String
  /// The release page, which lists notes and the downloadable `.zip`.
  public var pageURL: URL
  /// The app's `.zip` asset, when the release has one.
  public var downloadURL: URL?
}

/// Lightweight update check against GitHub Releases: no installer, no
/// background agent. It reads the public releases API and reports the newest
/// stable release whose tag starts with `tagPrefix`; the app then links to it.
public struct ReleaseChecker: Sendable {
  public var repository: String
  public var tagPrefix: String
  /// Asset name prefix, e.g. `CuteAC-` for `CuteAC-0.4.0.zip`.
  public var assetPrefix: String
  private let fetch: @Sendable (URLRequest) async throws -> (Data, URLResponse)

  public init(repository: String, tagPrefix: String = "v", assetPrefix: String,
              fetch: (@Sendable (URLRequest) async throws -> (Data, URLResponse))? = nil) {
    self.repository = repository
    self.tagPrefix = tagPrefix
    self.assetPrefix = assetPrefix
    self.fetch = fetch ?? { try await URLSession.shared.data(for: $0) }
  }

  public func latest() async throws -> AppRelease? {
    do {
      return try await fromAPI()
    } catch {
      // Unauthenticated API calls are limited to 60 an hour per IP, which a
      // shared office address exhausts quickly; the release page is not.
      return try await fromLatestRedirect()
    }
  }

  private func fromAPI() async throws -> AppRelease? {
    var request = URLRequest(url: URL(string: "https://api.github.com/repos/\(repository)/releases?per_page=20")!)
    request.setValue("application/vnd.github+json", forHTTPHeaderField: "Accept")
    request.timeoutInterval = 15
    let (data, response) = try await fetch(request)
    if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
      throw URLError(.badServerResponse)
    }
    return try Self.newest(in: data, tagPrefix: tagPrefix, assetPrefix: assetPrefix)
  }

  /// `github.com/<repo>/releases/latest` redirects to the newest stable
  /// release's tag page. The asset URL follows the release job's naming.
  private func fromLatestRedirect() async throws -> AppRelease? {
    var request = URLRequest(url: URL(string: "https://github.com/\(repository)/releases/latest")!)
    request.httpMethod = "HEAD"
    request.timeoutInterval = 15
    let (_, response) = try await fetch(request)
    // Without releases GitHub lands on the (empty) releases list or a 404:
    // nothing to offer, not an error.
    if let http = response as? HTTPURLResponse, http.statusCode == 404 || http.url?.lastPathComponent == "releases" {
      return nil
    }
    guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode), let url = http.url,
          url.pathComponents.dropLast().last == "tag" else { throw URLError(.badServerResponse) }
    let tag = url.lastPathComponent
    guard tag.hasPrefix(tagPrefix) else { return nil }
    let version = String(tag.dropFirst(tagPrefix.count))
    return AppRelease(
      version: version,
      tag: tag,
      pageURL: url,
      downloadURL: URL(string: "https://github.com/\(repository)/releases/download/\(tag)/\(assetPrefix)\(version).zip")
    )
  }

  /// Picks the highest stable version among releases with the tag prefix.
  static func newest(in data: Data, tagPrefix: String, assetPrefix: String) throws -> AppRelease? {
    struct Release: Decodable {
      struct Asset: Decodable {
        var name: String
        var browser_download_url: URL
      }

      var tag_name: String
      var html_url: URL
      var draft: Bool
      var prerelease: Bool
      var assets: [Asset]
    }
    let releases = try JSONDecoder().decode([Release].self, from: data)
    return releases
      .filter { !$0.draft && !$0.prerelease && $0.tag_name.hasPrefix(tagPrefix) }
      .map { release in
        AppRelease(
          version: String(release.tag_name.dropFirst(tagPrefix.count)),
          tag: release.tag_name,
          pageURL: release.html_url,
          downloadURL: release.assets.first { $0.name.hasPrefix(assetPrefix) && $0.name.hasSuffix(".zip") }?.browser_download_url
        )
      }
      .max { AppVersion.compare($0.version, $1.version) == .orderedAscending }
  }
}

/// Dotted numeric versions; a prerelease suffix sorts before its release.
public enum AppVersion {
  public static func compare(_ lhs: String, _ rhs: String) -> ComparisonResult {
    func split(_ version: String) -> (numbers: [Int], prerelease: Bool) {
      let parts = version.split(separator: "-", maxSplits: 1)
      return ((parts.first ?? "").split(separator: ".").map { Int($0) ?? 0 }, parts.count > 1)
    }
    let (a, aPre) = split(lhs)
    let (b, bPre) = split(rhs)
    for index in 0..<max(a.count, b.count) {
      let x = index < a.count ? a[index] : 0
      let y = index < b.count ? b[index] : 0
      if x != y { return x < y ? .orderedAscending : .orderedDescending }
    }
    if aPre != bPre { return aPre ? .orderedAscending : .orderedDescending }
    return .orderedSame
  }

  /// `CFBundleShortVersionString` of the running app; nil for `swift run`
  /// builds, which have no Info.plist and so never check for updates.
  public static var current: String? {
    Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String
  }
}

/// Checks at most once a day (and on demand), remembering the result so the
/// app can show "有新版本" without another request.
@MainActor
public final class UpdateMonitor: ObservableObject {
  public enum Status: Equatable {
    case idle
    case checking
    case upToDate
    case available(AppRelease)
    case failed(String)
  }

  @Published public private(set) var status = Status.idle
  /// The newer release found by the last successful check.
  @Published public private(set) var available: AppRelease?

  public var automaticChecks: Bool {
    get { defaults.object(forKey: key("automatic")) as? Bool ?? true }
    set {
      objectWillChange.send()
      defaults.set(newValue, forKey: key("automatic"))
    }
  }

  private let checker: ReleaseChecker
  private let currentVersion: String?
  private let defaults: UserDefaults
  private let keyPrefix: String
  private let interval: TimeInterval

  public init(checker: ReleaseChecker, currentVersion: String? = AppVersion.current,
              defaults: UserDefaults = .standard, keyPrefix: String, interval: TimeInterval = 24 * 60 * 60) {
    self.checker = checker
    self.currentVersion = currentVersion
    self.defaults = defaults
    self.keyPrefix = keyPrefix
    self.interval = interval
  }

  /// Automatic check: skipped when disabled, for unbundled builds, or when
  /// the last check was less than `interval` ago.
  public func checkIfDue(now: Date = Date()) async {
    guard automaticChecks, currentVersion != nil else { return }
    if let last = defaults.object(forKey: key("last-check")) as? Date, now.timeIntervalSince(last) < interval { return }
    await check(now: now)
  }

  /// Manual check from a menu item; always hits the network.
  public func check(now: Date = Date()) async {
    guard let currentVersion else {
      status = .failed("开发版本不检查更新")
      return
    }
    status = .checking
    do {
      let latest = try await checker.latest()
      defaults.set(now, forKey: key("last-check"))
      if let latest, AppVersion.compare(latest.version, currentVersion) == .orderedDescending {
        available = latest
        status = .available(latest)
      } else {
        available = nil
        status = .upToDate
      }
    } catch {
      status = .failed("无法连接 GitHub，请稍后再试")
    }
  }

  private func key(_ name: String) -> String { "\(keyPrefix):update:\(name)" }
}
