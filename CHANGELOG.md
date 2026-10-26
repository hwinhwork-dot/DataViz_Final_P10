# Changelog

Every member and every AI agent adds an entry **at the top** of this file in the same change as their work (rule 6.4 of `AGENTS.md`). The next person, or their agent, reads the latest entries first to learn the current state of the project.

**Format of an entry**

```
## YYYY-MM-DD · short title
**Who:** member name (tool, if an AI agent did the work)
**Changed:** what changed, in one to five plain sentences
**Files:** the files that were added, changed or deleted
**Next:** what the next person must know or do (open questions, known problems)
```

---

## 2026-10-26 · M2, M3 and M4 rerun on the complete weeks 1 and 2
**Who:** Nguyễn Hoàng Minh (Claude Code, Claude Opus 5.5)
**Changed:** The team sheet was exported again at 20:06 and saved as a new snapshot; the old snapshot stays for comparison. The only new data are the 12 week 2 prices of pork belly (SP01) and beef (SP05), entered on 26 October. The notebook now reads the date of a snapshot from any file name that contains eight digits, and the title of the M2 grid is computed from the data. New numbers: 144 prices entered, 141 usable, 60 usable prices needed in each remaining week, basket on the app 28% dearer than at the wet market (misleading chart now shows "7 TIMES"), supermarket about 1.1 times and app about 1.4 times the wet market price over 45 comparisons. The M4 results did not change (app dearest for 11 of 12 items; median premium 13% and 37%). All numbers in the notebook text, the data cards, the M1 and M3 reports and the website were updated, and the site was redeployed.
**Files:** `data/raw/primary/price_sheet_20261026_2006.xlsx` (new), `data/clean/*.csv`, `notebooks/P10_Final_Team10.ipynb`, `report/figures/*.png`, `data/data_cards.md`, `report/M1_frame_the_problem.md`, `report/M3_style.md`, `site/index.html`.
**Next:** Two app prices look low or high but stay inside the outlier rule: pork belly on Shopee Mart, Quận 3, week 2 (114,000 VND per kg with a promotion) and beef on Shopee Mart, week 2 (314,000 VND for 800 g). Check them against the screenshots. Thirteen week 2 rows still have no time.

## 2026-10-26 · Cleaner M3 3D charts, website text rewritten
**Who:** Nguyễn Hoàng Minh (Claude Code, Claude Opus 5.5)
**Changed:** The 3D charts of M3 were redesigned to be easier to read. `style3d()` now hides the grid and can hide the value axis (`zaxis=False`) and the depth axis (`yaxis=False`); `label3d()` places values a little higher. The colour check now draws one simple chart (three columns, median price index per channel) five times instead of a 12 column grid. The honest and misleading pair uses fixed titles and tags, and the honest panel has no grid or value axis because every column carries its value. All Vietnamese text of the website was rewritten in plain report style, and the site was redeployed.
**Files:** `notebooks/P10_Final_Team10.ipynb`, `notebooks/house_style.py`, `site/index.html`, `AGENTS.md`, `report/figures/m3_cvd_check.png`, `report/figures/m3_honest_vs_misleading.png`, `report/figures/m3_house_style.png`.
**Next:** Vietnamese text on the site follows the new rules in section 2 of `AGENTS.md` (plain headings, no slogans).

## 2026-10-26 · 3D charts, website, changelog, M2 and M3 check
**Who:** Nguyễn Hoàng Minh (Claude Code, Claude Opus 5.5)
**Changed:** The team style is now 3D columns. `house_style.py` has new helpers `bars3d`, `style3d`, `label3d`, `title3d`, and `save()` now writes a trimmed PNG only (PDF on request). The M3 colour check, the honest and misleading pair, the M4 channel price chart and the M4 premium chart were redrawn in 3D; the M3 makeover redesign stays flat on purpose, and the M4 dot plot is kept because the brief requires it. M2 gained a promotion rule in the item spec, a weekly table, a unit conversion table and an abstraction table for the public data. M3 gained a note on the change from house style v0 (Group Homework 3) to v1. The week 2 gap in the data card was wrong (it is SP01 and SP05, not SP05 and SP06) and is fixed. A Vietnamese website was built and deployed.
**Files:** `notebooks/P10_Final_Team10.ipynb`, `notebooks/house_style.py`, `AGENTS.md`, `CHANGELOG.md` (new), `site/index.html` (new), `tools/build_site.py` (new), `data/clean/unit_conversions.csv` (new), `data/clean/weekly_table.csv` (new), `data/clean/item_spec.csv`, `data/data_cards.md`, `report/M1_frame_the_problem.md`, `report/M3_style.md`, `report/ai_log.md`, `README.md`, `.gitignore`. Deleted unused images: all PDFs in `report/figures/`, `m4_chart1_dotplot_draft.png`, `m4_chart2_premium_draft.png`.
**Next:** Website: https://p10-price-of-dinner.vercel.app (Vercel project `p10-price-of-dinner`). After a chart changes, run `python tools/build_site.py` and `vercel deploy --prod` from `site/`. Open questions for the team: the promotion rule, a loyalty price column in the sheet, a record of the pilot week with 14 candidate items, the 20% collector rule, and a second call with the interviewee.

## 2026-10-26 · One notebook for the whole project, AGENTS.md
**Who:** Nguyễn Hoàng Minh (Claude Code, Claude Opus 5.5)
**Changed:** All modules moved into `notebooks/P10_Final_Team10.ipynb` (M0 to M10, in the format of the group homework). The separate notebooks `01_data.ipynb` and `m3_style.ipynb` were merged into it and removed. The M3 makeover now uses the NSO Figure 5 that the team chose in Group Homework 3, with its critique and hand sketch. `AGENTS.md` and `CLAUDE.md` were added so that every agent follows the same writing and chart rules.
**Files:** `notebooks/P10_Final_Team10.ipynb` (new), `AGENTS.md` (new), `CLAUDE.md` (new), `report/figures/m3_makeover_original.png` (new), `evidence/sketches/m3_makeover_sketch.jpg` (local only, git ignores it).
**Next:** Fill in the module leads in the module map and in M1.

## 2026-10-25 · First drafts of M1, M2 and M3
**Who:** Nguyễn Hoàng Minh (Claude Code, Claude Opus 5.5)
**Changed:** Download script for the team sheet, NSO, FAOSTAT and the World Bank; cleaning pipeline with a log; master table, price index and CPI join; data cards; M1 report from the interview transcript of 22/10/2026; house style with a colour vision check; first honest and misleading pair.
**Files:** `data/raw/download_raw.py`, `data/raw/primary/`, `data/raw/public/`, `data/clean/`, `data/data_cards.md`, `notebooks/house_style.py`, `report/M1_frame_the_problem.md`, `report/M3_style.md`, `report/ai_log.md`.
**Next:** The formal interview lasts about 19 minutes, one minute short of the brief; plan a second call.
