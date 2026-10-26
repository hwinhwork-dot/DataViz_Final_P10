# Data cards

My group uses one primary dataset and three public datasets. Each card below says where the data come from, what one row means, what my group changed, and what the data cannot tell us. Module M2 of `notebooks/P10_Final_Team10.ipynb` reads every file listed here, and the script `data/raw/download_raw.py` downloads them again.

Last update: 26 October 2026.

## 1. Team price sheet (primary data)

| Field | Value |
|---|---|
| Owner | My group (six members), collected for Consumer Lab |
| Raw file | `data/raw/primary/price_sheet_YYYYMMDD.xlsx`, a dated export of our Google Sheet |
| Clean file | `data/clean/master_prices.csv` |
| Unit of observation | One price of one item, in one channel, one district and one week |
| Design | 12 items × 3 channels (wet market, supermarket, delivery app) × 2 districts (Quận 10, Quận 3) × 8 weeks = 576 planned prices |
| Collection period | Week 1 starts on Monday 12 October 2026; week 8 ends on 6 December 2026 |
| Status now | Weeks 1 and 2 are complete: 144 prices, of which 141 are usable |
| Evidence | A photo of the price tag or a screenshot of the app. The photo column is optional in the sheet; the photos stay in `evidence/`, which git ignores |
| Licence | Our own data. My group will share the clean table with the course only |

**How my group collects the data.** Each member owns two items and checks them in all six channel and district cells every week. The delivery app alternates by week: Grab Mart in odd weeks and Shopee Mart in even weeks, so both apps appear four times. The item specification sheet (`data/clean/item_spec.csv`) fixes the brand, the pack and the quality of each item, so that a price in week 6 describes the same product as a price in week 1.

**What my group changed.** Every change is a function in the notebook, and `data/clean/cleaning_log.csv` lists the rule, the reason and the number of rows it touched. The main rules are the following.

| Rule | Rows touched (weeks 1 and 2) |
|---|---|
| Grab Mart and Shopee Mart become channel "App"; the app name moves to its own column | all App rows |
| A date typed in 2027 goes back to 2026 | 1 |
| A quantity that the sheet turned into a date (2.5 read as 2 May) becomes a number again | 1 |
| The price of an out of stock item is removed; the row stays | 1 |
| Grams become kilograms, millilitres become litres; a tofu piece counts as 0.2 kg | 28 prices converted, 2 tofu prices based on the 0.2 kg assumption |
| Times become HH:MM | 131 |
| A price above twice or below half the item median is flagged, not deleted | 2 |

**Known limits.**

1. Two supermarket prices in week 1 (tomato and watermelon) come from the Co.op Online website. The website shows one price for the whole city, so the two districts have the same value.
2. The App price does not include the delivery fee. My group stores the fee in its own column, because a student who orders several items pays the fee only once.
3. The 12 week 2 prices of pork belly (SP01) and beef (SP05) were entered late, on 26 October 2026; the snapshot `price_sheet_20261026_2006.xlsx` holds the complete two weeks.
4. Thirteen week 2 rows have no time.
5. The 0.2 kg weight of a tofu piece comes from the item specification. A member will weigh one piece at each market in week 3 to check it.
6. Eight weeks in two districts cannot describe the whole city or a whole year. My group reports the results as a case study of two central districts in autumn 2026.

## 2. NSO Viet Nam, monthly consumer price index

| Field | Value |
|---|---|
| Owner | National Statistics Office of Viet Nam (NSO), Ministry of Finance. NSO was called the General Statistics Office (GSO) before 2025 |
| Source page | https://www.nso.gov.vn/en/cpi/ , one press release per month, each with an xlsx table |
| Raw files | `data/raw/public/nso_cpi/nso_cpi_2026_05.xlsx` to `nso_cpi_2026_09.xlsx` |
| Clean file | `data/clean/public_monthly.csv`, rows with `source = NSO` |
| Unit of observation | One index value of one CPI group, one area and one month |
| What my group keeps | The groups "Food and foodstuff", "Food" (grain), "Foodstuff" and "Eating out" plus the overall CPI; for Viet Nam and for Ho Chi Minh City; the index against the previous month (previous month = 100) and the index against the 2024 base |
| Coverage | May to September 2026 |
| Licence | Public statistics; my group cites NSO as the source |

**Why my group uses it.** The client asks whether the official CPI matches what students pay. The "Foodstuff" group (meat, fish, vegetables, eggs) is the closest official series to our twelve items.

**Access notes.** The old GSO address (gso.gov.vn) timed out when my group tried it in late October 2026, so the script reads the new NSO address. The table layout changed between releases: the May file names its first sheet "Ca nuoc" and moves every row down by one. The notebook therefore finds each row by its label, not by its position.

**Known limits.**

1. NSO releases a month's CPI in the first days of the next month. On 26 October 2026, the October value does not exist yet, so the CPI columns of the master table are empty for weeks 1 and 2.
2. The CPI is monthly and our data are weekly. My group compares one month of CPI with the average of the weeks in that month.
3. The Ho Chi Minh City figure covers the whole city, not Quận 10 and Quận 3 only.
4. The CPI follows a fixed basket with fixed weights. Our twelve items are not weighted.

## 3. FAOSTAT, consumer price indices

| Field | Value |
|---|---|
| Owner | Food and Agriculture Organization of the United Nations (FAO) |
| Source | FAOSTAT bulk download "Consumer Price Indices", all countries, normalized |
| Raw file | `data/raw/public/faostat_cpi_normalized.zip` |
| Clean file | `data/clean/public_monthly.csv`, rows with `source = FAOSTAT` |
| Unit of observation | One index value of one country, one month and one series |
| What my group keeps | Viet Nam, "Consumer Prices, Food Indices" and "Consumer Prices, General Indices", 2015 = 100, from January 2024 |
| Coverage | January 2024 to June 2026 |
| Licence | CC BY 4.0 |

**Why my group uses it.** FAOSTAT gives a longer food price series than the NSO files that my group downloaded. It shows whether autumn 2026 is a normal period or a period of fast food inflation.

**Known limits.** FAOSTAT copies the national CPI with a delay of a few months, so it ends in June 2026, before our collection starts. It has no data for a single city.

## 4. World Bank, Commodity Price Data (Pink Sheet)

| Field | Value |
|---|---|
| Owner | World Bank, Prospects Group |
| Source | https://www.worldbank.org/en/research/commodity-markets , file "CMO-Historical-Data-Monthly.xlsx" |
| Raw file | `data/raw/public/worldbank_cmo_monthly.xlsx` |
| Clean file | `data/clean/public_monthly.csv`, rows with `source = World Bank` |
| Unit of observation | One world price of one commodity in one month, in US dollars |
| What my group keeps | Rice (Viet Nam 5% broken), palm oil, soybean oil, sugar, chicken and beef, from January 2024 |
| Coverage | January 2024 to September 2026 |
| Licence | CC BY 4.0 |

**Why my group uses it.** World prices show whether a change in Ho Chi Minh City follows a global trend or a local one.

**Known limits.** These are export and wholesale prices in US dollars. They move retail prices only after weeks or months, and only for items that Viet Nam trades. My group uses them as context, not as a direct comparison.

## Join between the datasets

The key is `year_month` (for example `2026-10`). For the primary data, `year_month` is the month of the Monday that starts the collection week. Week 3 (26 October to 1 November) therefore counts as October. My group chose the Monday because it gives one simple rule: every week belongs to exactly one month.
