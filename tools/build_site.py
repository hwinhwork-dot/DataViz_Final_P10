"""Copy the figures that site/index.html uses from report/figures/ into site/figures/,
and write site/data/m9_basket.json, the prices that the M9 basket tool of the website reads.

Run from the repository root after the notebook has saved new charts:
    python tools/build_site.py
then deploy from the site folder:
    cd site && vercel deploy --prod
"""
import re
import shutil
from pathlib import Path

from basket_data import write_basket_json

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
OUT = SITE / "figures"

used = sorted(set(re.findall(r'src="figures/([^"]+)"', (SITE / "index.html").read_text(encoding="utf-8"))))
OUT.mkdir(exist_ok=True)
for old in OUT.iterdir():                      # remove figures that the page no longer uses
    if old.name not in used:
        old.unlink()
for name in used:
    src = ROOT / "report" / "figures" / name
    if not src.exists():
        raise SystemExit(f"missing figure: {src}")
    shutil.copy2(src, OUT / name)
print(f"copied {len(used)} figures to {OUT.relative_to(ROOT)}")
write_basket_json(SITE / "data" / "m9_basket.json")
