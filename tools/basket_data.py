"""Prices of the basket tool: one usable price per food, channel, district and week, and the app fee.

The M9 explorer of the website (site/) and the "Đến lượt bạn" scene of the presentation site (story/) read
the same data. tools/build_site.py and tools/build_story_data.py call basket_data() and write it as JSON.
The checks stop the build when the data differ from the weekly basket of M4.3 or from Figure 12.
"""
import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
CLEAN = ROOT / "data" / "clean"

CHANNELS = ["Chợ", "Siêu thị", "App"]
DISTRICTS = ["Quận 3", "Quận 10"]
SHORT = {"SP06": "Gà ta", "SP11": "Trứng gà"}      # shorter names for the buttons of the tool


def basket_data():
    """One usable price per food, channel, district and week, the app fee per week and district."""
    master = pd.read_csv(CLEAN / "master_prices.csv", low_memory=False)
    usable = master[master["usable"]]
    weeks = sorted(int(w) for w in master["week"].unique())
    cell = usable.groupby(["item_code", "channel", "district", "week"])["price_std"].mean()
    clusters = pd.read_csv(CLEAN / "m6_clusters.csv", index_col=0)["cluster"]
    info = master.groupby("item_code")[["item_name", "item_group", "std_unit"]].first()

    items = []
    for code, row in info.iterrows():
        items.append({"code": code, "name": SHORT.get(code, row["item_name"]), "group": row["item_group"],
                      "unit": "quả" if row["std_unit"] == "piece" else "kg",
                      "m6": "lớn" if clusters[code].startswith("Large") else "nhỏ"})
    price = {code: {ch: {d: [None if (code, ch, d, w) not in cell.index else round(float(cell[(code, ch, d, w)]))
                             for w in weeks] for d in DISTRICTS} for ch in CHANNELS} for code in info.index}
    app = master[(master["channel"] == "App") & master["collected"]]
    fee = app.groupby(["week", "district"])["delivery_fee"].median().unstack()
    start = master.groupby("week")["week_start"].first()
    app_name = app.groupby("week")["app_name"].first()
    data = {"channels": CHANNELS, "districts": DISTRICTS, "items": items,
            "weeks": [{"week": w, "start": start[w], "app": app_name[w]} for w in weeks],
            "price": price, "fee": {d: [round(float(fee.loc[w, d])) for w in weeks] for d in DISTRICTS},
            "basket": {"SP11": 10}}

    # Check: the standard basket of both districts gives the weekly basket of the notebook (M4.3)
    qty = pd.Series(1.0, index=info.index)
    qty["SP11"] = 10
    wk = usable.groupby(["week", "channel", "item_code"])["price_std"].mean().unstack("item_code")
    nb = (wk[wk.notna().sum(axis=1) == 12] * qty).sum(axis=1).unstack("channel")
    for w in nb.index:
        for ch in CHANNELS:
            vals = [[price[c][ch][d][weeks.index(w)] for d in DISTRICTS] for c in info.index]
            vals = [[v for v in pair if v is not None] for pair in vals]
            if pd.isna(nb.loc[w, ch]):
                assert any(not v for v in vals), (w, ch)
                continue
            tool = sum(sum(v) / len(v) * qty[c] for v, c in zip(vals, info.index))
            assert abs(tool - nb.loc[w, ch]) < 1, (w, ch, tool, nb.loc[w, ch])
    assert round((nb.loc[8, "App"] / nb.loc[8, "Chợ"] - 1) * 100) == 27      # Figure 12, the dashboard of week 8

    return data


def write_basket_json(path):
    """Write the data of basket_data() to a compact JSON file."""
    path = Path(path)
    path.parent.mkdir(exist_ok=True)
    path.write_text(json.dumps(basket_data(), ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("wrote", path.relative_to(ROOT))
