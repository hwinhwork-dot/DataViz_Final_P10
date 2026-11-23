"""Save the storyboard of M9 (story/storyboard.html) as two images:
report/figures/m9_storyboard.png in English for the notebook and the report, and
report/figures/m9_storyboard_vi.png in Vietnamese for the website.

The lecturer allowed the team to draw the storyboard with an AI tool. The sheet uses the drawings and the numbers
of the presentation site, so run tools/build_story_data.py first. The script needs Google Chrome; set CHROME to its
path when it is not in the usual place. Run from the repository root:
    python tools/render_storyboard.py
"""
import functools
import http.server
import os
import subprocess
import tempfile
import threading
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
STORY = ROOT / "story"
FIG = ROOT / "report" / "figures"
CHROME = os.environ.get("CHROME") or next((p for p in [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "/usr/bin/google-chrome", "/usr/bin/chromium"] if Path(p).exists()), None)
if not CHROME:
    raise SystemExit("Google Chrome not found; set the CHROME variable to its path")

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


handler = functools.partial(Quiet, directory=str(STORY))
server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
port = server.server_address[1]

try:
    for lang, name in [("en", "m9_storyboard.png"), ("vi", "m9_storyboard_vi.png")]:
        out = FIG / name
        with tempfile.TemporaryDirectory() as profile:
            subprocess.run([CHROME, "--headless=new", "--hide-scrollbars", f"--user-data-dir={profile}", "--window-size=1600,1060",
                            "--force-device-scale-factor=1.5", "--virtual-time-budget=15000", f"--screenshot={out}",
                            f"http://127.0.0.1:{port}/storyboard.html?lang={lang}"], check=True, capture_output=True, timeout=120)
        Image.open(out).convert("RGB").save(out, optimize=True)
        print("saved", out.relative_to(ROOT))
finally:
    server.shutdown()
