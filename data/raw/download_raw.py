"""Download every raw file that notebooks/01_data.ipynb reads.

Run from the repository root:  python data/raw/download_raw.py

The script never edits a file after download. Each run saves a dated copy of the team's
price sheet, so earlier snapshots stay available for checking.

Sources
1. Team price sheet (primary data): Google Sheet "P10 · The Price of Dinner · Bảng thu giá",
   exported as xlsx. The sheet is shared by link, so no login is needed.
2. NSO Viet Nam (formerly GSO): monthly CPI press release tables, one xlsx per month,
   found through the CPI listing page https://www.nso.gov.vn/en/cpi/.
3. FAOSTAT: Consumer Price Indices, bulk download (all countries, normalized).
4. World Bank: Commodity Price Data ("Pink Sheet"), monthly prices.
"""

import datetime as dt
import re
import urllib.request
from pathlib import Path

RAW = Path(__file__).resolve().parent
PRIMARY = RAW / "primary"
PUBLIC = RAW / "public"
SHEET_ID = "1f6CMh-ICjBKUe3QGSaUeeAVF4M5Ol_N5suMf_-ZIDo0"
HEADERS = {"User-Agent": "Mozilla/5.0 (P10 student project, UEH)"}


def fetch(url, timeout=90):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def save(content, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)
    print(f"saved {path.relative_to(RAW.parent.parent)} ({len(content) / 1024:,.0f} KB)")


def team_sheet():
    today = dt.date.today().strftime("%Y%m%d")
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=xlsx"
    save(fetch(url), PRIMARY / f"price_sheet_{today}.xlsx")


def nso_cpi():
    pages = set()
    for suffix in ["", "page/2/", "page/3/"]:
        html = fetch(f"https://www.nso.gov.vn/en/cpi/{suffix}").decode("utf-8", "ignore")
        pages |= set(re.findall(r'https://www\.nso\.gov\.vn/en/data-and-statistics/20\d\d/\d\d/consumer-price-index[^"]*', html))
    for page in sorted(pages):
        html = fetch(page).decode("utf-8", "ignore")
        # The period is written either as "9/2026" or as "May 2026".
        period = re.search(r"Reference period:\s*(?:<[^>]+>\s*)*([A-Za-z]+|\d{1,2})[ /](\d{4})", html)
        links = re.findall(r'href="([^"]+\.xlsx)"', html)
        if not (period and links):
            print("skipped (no period or table):", page)
            continue
        m = period.group(1)
        month = int(m) if m.isdigit() else dt.datetime.strptime(m[:3], "%b").month
        year = int(period.group(2))
        save(fetch(links[0]), PUBLIC / "nso_cpi" / f"nso_cpi_{year}_{month:02d}.xlsx")


def faostat_cpi():
    url = "https://bulks-faostat.fao.org/production/ConsumerPriceIndices_E_All_Data_(Normalized).zip"
    save(fetch(url, timeout=180), PUBLIC / "faostat_cpi_normalized.zip")


def world_bank_pink_sheet():
    page = fetch("https://www.worldbank.org/en/research/commodity-markets").decode("utf-8", "ignore")
    url = re.findall(r'https?://[^"]*CMO-Historical-Data-Monthly[^"]*\.xlsx', page)[0]
    save(fetch(url, timeout=180), PUBLIC / "worldbank_cmo_monthly.xlsx")


if __name__ == "__main__":
    for step in [team_sheet, nso_cpi, faostat_cpi, world_bank_pink_sheet]:
        try:
            step()
        except Exception as err:   # keep going: the data card records which source failed and why
            print(f"FAILED {step.__name__}: {err}")
