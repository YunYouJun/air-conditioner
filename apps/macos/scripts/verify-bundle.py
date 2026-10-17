#!/usr/bin/env python3
"""Launch a relocated app without its SwiftPM build cache; never controls HA."""
import os
from pathlib import Path
import re
import struct
import subprocess
import sys
import tempfile

package = Path(__file__).resolve().parents[1]
app = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else package / "build/CuteAC.app"
output = Path(os.environ["BUNDLE_VERIFY_OUTPUT_DIR"]).resolve() if os.environ.get("BUNDLE_VERIFY_OUTPUT_DIR") else Path(tempfile.mkdtemp(prefix="cuteac-bundle-check-"))
output.mkdir(parents=True, exist_ok=True)
staged = output / "CuteAC.app"
if staged.exists():
    raise SystemExit(f"Refusing to overwrite an existing verification app: {staged}")
snapshots = output / "snapshots"
log = output / "app.log"
build = package / ".build"
hidden = package / f".build-bundle-check-{os.getpid()}"
moved = False
process = None

try:
    subprocess.run(["ditto", str(app), str(staged)], check=True)
    subprocess.run(["codesign", "--verify", "--deep", "--strict", str(staged)], check=True)
    # Moving the whole cache hides both native and Xcode backend resource paths.
    # Run after builds/tests have finished; the finally block restores the cache.
    if build.exists():
        build.rename(hidden)
        moved = True
    process = subprocess.Popen([
        "open", "-n", "-W", "--stdout", str(log), "--stderr", str(log),
        str(staged), "--args", "--snapshot", str(snapshots),
    ], cwd=output)
    if process.wait(timeout=90) != 0:
        raise RuntimeError("Launch Services failed to launch the app")
    for name in ["scenekit-cold.png","scenekit-hot.png","scenekit-off.png","scenekit-tower-cold.png","scenekit-tower-hot.png","scenekit-tower-off.png"]:
        path = snapshots / name
        header = path.read_bytes()[:24]
        if len(header) != 24 or header[:8] != b"\x89PNG\r\n\x1a\n" or min(struct.unpack(">II", header[16:24])) <= 0:
            raise RuntimeError(f"Missing or invalid rendered PNG: {path}")
    print(f"PASS: relocated CuteAC launched and rendered 6 images without .build")
    print(f"Evidence: {output}")
except Exception:
    if log.exists():
        print(log.read_text(errors="replace")[-8000:], file=sys.stderr)
    raise
finally:
    # This pattern can match only the unique temporary verification app.
    subprocess.run(["pkill", "-TERM", "-f", "^" + re.escape(str(staged / "Contents/MacOS/CuteAC")) + r"(\s|$)"], check=False)
    if process is not None and process.poll() is None:
        process.terminate()
        process.wait(timeout=10)
    if moved:
        hidden.rename(build)

