"""Write story/data/facts.json, the numbers of the story site, from the clean tables.

Every number on the story site comes from this file. The formulas repeat the ones of the
notebook (M4.2, M4.3, M4.4, M4.5, M4.6, M6.5, M7.1, M7.2, M8.4), and the checks at the end
stop the script when a number differs from the value that the notebook prints.

Run from the repository root after the notebook:
    python tools/build_story_data.py
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd

from basket_data import write_basket_json

ROOT = Path(__file__).resolve().parent.parent
CLEAN = ROOT / "data" / "clean"
OUT = ROOT / "story" / "data" / "facts.json"

CHANNELS = ["Chợ", "Siêu thị", "App"]
ITEM_VI = {"SP01": "Thịt heo ba chỉ", "SP02": "Rau muống", "SP03": "Cá thu", "SP04": "Cà chua", "SP05": "Thịt bò",
           "SP06": "Gà ta", "SP07": "Dưa hấu", "SP08": "Hành tây", "SP09": "Khoai tây Đà Lạt", "SP10": "Đậu hũ trắng",
           "SP11": "Trứng gà", "SP12": "Cá diêu hồng"}

master = pd.read_csv(CLEAN / "master_prices.csv", low_memory=False)
usable = master[master["usable"]]
weeks = sorted(master.loc[master["collected"], "week"].unique())

# Basket: 1 kg of each food sold by weight and 10 eggs (M4.3)
qty = pd.Series({c: 1.0 for c in master["item_code"].unique()})
qty["SP11"] = 10
wk_items = usable.groupby(["week", "channel", "item_code"])["price_std"].mean().unstack("item_code")
complete = wk_items.notna().sum(axis=1) == len(qty)
basket_wk = (wk_items[complete] * qty).sum(axis=1).unstack("channel").reindex(index=weeks, columns=CHANNELS)
gap_wk = basket_wk.div(basket_wk["Chợ"], axis=0) - 1

# Weeks with a complete basket in all three channels, as in M7.2
common = [int(w) for w in basket_wk.dropna().index]
in_common = wk_items.index.get_level_values("week").isin(common)
item_cost = wk_items.loc[in_common].groupby(level="channel").mean().reindex(CHANNELS) * qty
basket = item_cost.sum(axis=1)

# One delivery fee per app order (M4.6)
fee = float(master[(master["channel"] == "App") & master["collected"]].groupby(["week", "district"])["delivery_fee"].median().mean())

# Matched pairs: the same item, district and week (M4.2)
pairs = usable.pivot_table(index=["item_code", "district", "week"], columns="channel", values="price_std")
ratio = {ch: pairs[["Chợ", ch]].dropna().pipe(lambda p: p[ch] / p["Chợ"]) for ch in ["Siêu thị", "App"]}

# Districts (M4.5)
dpairs = usable.pivot_table(index=["item_code", "channel", "week"], columns="district", values="price_std").dropna()
dist = dpairs.groupby(level=0).mean()
dist["gap"] = dist["Quận 10"] / dist["Quận 3"] - 1
top_d = dist["gap"].abs().idxmax()

# M6 groups (M6.5)
def pct(x):
    """0.6749 -> 67; round half up, as the notebook prints it."""
    return int(np.floor(x * 100 + 0.5))


cl = pd.read_csv(CLEAN / "m6_clusters.csv", index_col=0)
# price level per food and channel at full precision, as make_features() of M6.1 computes it
icw = usable.groupby(["item_code", "channel", "week"])["price_std"].mean().unstack("week").astype(float)
level_raw = icw.mean(axis=1).unstack("channel")[CHANNELS]
level = np.log(level_raw.div(level_raw.mean(axis=1), axis=0))
cl["app_gap"] = np.expm1(level["App"] - level["Chợ"]).reindex(cl.index)
groups = {}
for g, sub in cl.groupby("cluster"):
    order = sub.sort_values("app_gap", ascending=False).index
    groups[g] = {"items": [ITEM_VI[c] for c in order], "codes": list(order),
                 "app_median_pct": pct(sub["app_gap"].median()),
                 "app_min_pct": pct(sub["app_gap"].min()), "app_max_pct": pct(sub["app_gap"].max())}
app_by_item = [{"code": c, "name": ITEM_VI[c], "group": cl.loc[c, "cluster"], "app_pct": pct(cl.loc[c, "app_gap"])}
               for c in cl.sort_values("app_gap", ascending=False).index]

# The saving of the large gap group: buy those foods at the wet market instead of the app
large = groups["Large channel gap"]["codes"]
extra_app = float(basket["App"] - basket["Chợ"])
extra_large = float((item_cost.loc["App", large] - item_cost.loc["Chợ", large]).sum())

# Index of the basket against week 1 and the official CPI (M4.4)
idx = basket_wk.copy()
for ch in ["Chợ", "Siêu thị"]:
    idx[ch] = basket_wk[ch] / basket_wk.loc[1, ch] * 100
idx["App"] = [basket_wk.loc[w, "App"] / basket_wk.loc[1 if w % 2 else 2, "App"] * 100 for w in basket_wk.index]
change_last = {ch: float(idx[ch].dropna().iloc[-1] - 100) for ch in CHANNELS}
pub = pd.read_csv(CLEAN / "public_monthly.csv")
cpi = pub[(pub["source"].str.contains("NSO", case=False)) & (pub["area"] == "Ho Chi Minh City")
          & (pub["measure"] == "index_prev_month_100") & (pub["series"] == "foodstuff")].set_index("year_month")["value"] - 100
cpi_oct = float(cpi[[m for m in cpi.index if str(m).endswith("-10")][0]])

# Heatmap of M7.1: weeks below or above week 1
heat = usable.pivot_table(index="item_code", columns="week", values="index_w1", aggfunc="median").reindex(columns=weeks)
later = heat.drop(columns=weeks[0])
below, above = (later < 100).sum(axis=1), (later > 100).sum(axis=1)

# M8 test (M8.4): the five independent people
res = pd.read_csv(ROOT / "data" / "raw" / "primary" / "m8_experiment.csv", skipinitialspace=True)
res = res[~((res["batch"] == "B2") & (res["participant"] != "P02"))]
t_med = res.groupby("version")["seconds"].median()

facts = {
    "design": {"prices": int(len(master)), "usable": int(master["usable"].sum()), "items": 12, "channels": 3,
               "districts": 2, "weeks": len(weeks), "members": int(master["collector"].nunique()),
               "markets": ["Chợ Bàn Cờ (Quận 3)", "Chợ Nguyễn Tri Phương (Quận 10)"], "apps": ["Grab Mart", "Shopee Mart"]},
    "basket": {"weeks": common, "vnd": {ch: round(float(basket[ch])) for ch in CHANNELS},
               "pct_over_market": {ch: round(float((basket[ch] / basket["Chợ"] - 1) * 100), 1) for ch in CHANNELS},
               "items": {ch: [{"name": ITEM_VI[c], "vnd": round(float(item_cost.loc[ch, c]))} for c in qty.index] for ch in CHANNELS},
               "top_item": ITEM_VI[item_cost.loc["Chợ"].idxmax()],
               "top_item_share_pct": {ch: round(float(item_cost.loc[ch].max() / basket[ch] * 100), 1) for ch in CHANNELS}},
    "fee": {"one_order_vnd": round(fee), "app_with_fee_vnd": round(float(basket["App"]) + fee),
            "app_with_fee_pct_over_market": round(float((basket["App"] + fee) / basket["Chợ"] - 1) * 100, 1)},
    "weekly": {"basket_vnd": {ch: [None if pd.isna(v) else round(float(v)) for v in basket_wk[ch]] for ch in CHANNELS},
               "app_gap_min_pct": round(float(gap_wk["App"].min() * 100), 1), "app_gap_max_pct": round(float(gap_wk["App"].max() * 100), 1),
               "super_gap_min_pct": round(float(gap_wk["Siêu thị"].min() * 100), 1), "super_gap_max_pct": round(float(gap_wk["Siêu thị"].max() * 100), 1)},
    "pairs": {ch: {"median_ratio": round(float(r.median()), 2), "n": int(len(r)), "dearer_pct": round(float((r > 1).mean() * 100))}
              for ch, r in ratio.items()},
    "groups": groups, "app_by_item": app_by_item,
    "saving": {"app_minus_market_vnd": round(extra_app), "large_group_vnd": round(extra_large),
               "large_group_share_pct": round(extra_large / extra_app * 100)},
    "districts": {"within_5pct": int((dist["gap"].abs() < 0.05).sum()), "top_item": ITEM_VI[top_d],
                  "top_gap_pct": round(float(dist.loc[top_d, "gap"] * 100), 1),
                  "items": [{"name": ITEM_VI[c], "gap_pct": round(float(dist.loc[c, "gap"] * 100), 1)}
                            for c in dist["gap"].sort_values(ascending=False).index]},
    "cpi": {"basket_change_pct": {ch: round(v, 1) for ch, v in change_last.items()}, "cpi_october_pct": round(cpi_oct, 2)},
    "heatmap": {"later_weeks": len(later.columns), "always_below": [ITEM_VI[c] for c in below[below == below.max()].index],
                "below_weeks": int(below.max()), "mostly_above": [ITEM_VI[c] for c in above[above == above.max()].index],
                "above_weeks": int(above.max())},
    "test": {"people": int(pd.read_csv(ROOT / "data" / "raw" / "primary" / "m8_experiment.csv")["participant"].nunique()),
             "independent": int(res["participant"].nunique()),
             "median_s": {"2D": float(t_med["2D"]), "3D": float(t_med["3D"])}},
}

# Checks against the values that the notebook prints
assert facts["design"]["usable"] == 558
assert facts["basket"]["weeks"] == [1, 2, 3, 5, 7, 8]
assert facts["basket"]["vnd"] == {"Chợ": 1050381, "Siêu thị": 1185730, "App": 1328135}, facts["basket"]["vnd"]
assert round(fee) == 23297 and facts["fee"]["app_with_fee_pct_over_market"] == 28.7, facts["fee"]
assert (facts["weekly"]["app_gap_min_pct"], facts["weekly"]["app_gap_max_pct"]) == (22.2, 29.3)
assert facts["pairs"]["App"] == {"median_ratio": 1.34, "n": 180, "dearer_pct": 94}, facts["pairs"]
assert {k: facts["districts"][k] for k in ("within_5pct", "top_item", "top_gap_pct")} == {"within_5pct": 7, "top_item": "Rau muống", "top_gap_pct": 10.4}
assert groups["Large channel gap"]["app_median_pct"] == 67 and groups["Small channel gap"]["app_median_pct"] == 21, groups
assert (groups["Large channel gap"]["app_min_pct"], groups["Large channel gap"]["app_max_pct"]) == (34, 74)
assert {k: round(v, 1) for k, v in change_last.items()} == {"Chợ": -1.6, "Siêu thị": 5.3, "App": -5.0}
assert round(cpi_oct, 2) == 0.62
assert facts["heatmap"]["always_below"] == ["Hành tây"] and facts["heatmap"]["below_weeks"] == 7
assert facts["test"]["median_s"] == {"2D": 12.0, "3D": 24.5} and facts["test"]["independent"] == 5

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(facts, ensure_ascii=False, indent=1), encoding="utf-8")
write_basket_json(ROOT / "story" / "data" / "m9_basket.json")   # prices of the "Đến lượt bạn" scene
print(f"wrote {OUT.relative_to(ROOT)}")
print(json.dumps({k: facts[k] for k in ["basket", "fee", "saving", "groups"]}, ensure_ascii=False)[:1500])
