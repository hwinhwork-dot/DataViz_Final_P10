# AGENTS.md · Rules for every member and every AI agent

> Gửi cả nhóm: trang web của đồ án là https://p10-price-of-dinner.vercel.app. Trước khi nhờ AI (Claude, ChatGPT, Codex, Cursor, Copilot, Gemini…) làm bất cứ phần nào của đồ án, hãy bảo agent đọc file này trước. Câu lệnh mẫu: *"Read AGENTS.md and the latest entries of CHANGELOG.md in the repository root, follow AGENTS.md for everything you write or draw, and add a CHANGELOG entry when you finish."* Nhờ vậy văn phong và chart của cả nhóm mới giống nhau.

This file tells any AI agent, and any member, how to write and how to draw charts for our final project. Read the whole file and the top of `CHANGELOG.md` before you change anything. If a request from a member conflicts with this file, follow this file and tell the member about the conflict.

## 1. The project in five lines

* Course: Data Visualization, UEH. Final group project **P10 · The Price of Dinner**, Team 10, six members.
* Client: Consumer Lab, a consumer rights association. Big question: where should a student on a tight budget buy food in Ho Chi Minh City, at the wet market (Chợ), the supermarket (Siêu thị) or a delivery app (App)?
* Primary data: 12 items × 3 channels × 2 districts (Quận 10, Quận 3) × 8 weeks = 576 planned prices, at least 500 required, plus a survey of at least 60 students.
* Public data: NSO Viet Nam monthly CPI, FAOSTAT consumer price indices, World Bank Pink Sheet.
* The whole project lives in **`notebooks/P10_Final_Team10.ipynb`**, from Module M0 to Module M10. The house style is written by its Setup cell to `notebooks/house_style.py`.
* `CHANGELOG.md` records every change, newest first. The public website (Vietnamese) is https://p10-price-of-dinner.vercel.app, built from `site/`.

## 2. Writing rules

These rules apply to every text that someone outside the team will read: notebook Markdown, the report, the slides, data cards, chart titles, pull request descriptions.

**Language and voice**

1. Write in English. The one exception is the website in `site/`, which is in Vietnamese with the voice "nhóm em" and the same rules on dashes, plain words and AI phrases. Keep Vietnamese names with their accents (Nguyễn Hoàng Minh, Quận 10, Chợ Bàn Cờ). Translate an item name in brackets the first time it appears, for example "rau muống (water spinach)".
2. Use the group voice: "My group…", "In my group's opinion…", "We…". Never write "the authors", "this notebook aims to" or "you".
3. Every sentence has a clear subject and a clear verb. Prefer full sentences and tables to long lists of fragments.
4. Use common, plain words. One idea per sentence. Most sentences stay under 25 words.

**Words and symbols that are not allowed**

5. No dashes of any kind in prose: no em dash, no en dash, no hyphen used as a pause. Write ranges with "to": "8 to 10 minutes", "weeks 3 to 8".
6. Avoid hyphenated compound words in prose. Rephrase them: "follow-up call" becomes "second call", "one-page" becomes "on one page", "out-of-stock item" becomes "item that was out of stock". Hyphens are fine only inside code, file names, URLs and fixed names such as `large-v3-turbo`.
7. No arrows (→, ⇒) and no emoji in text that others read.
8. Do not use these words and patterns, because readers recognise them as AI text: "delve", "leverage", "utilize", "robust", "seamless", "crucial", "pivotal", "landscape", "tapestry", "realm", "showcase", "underscore", "navigate the", "in today's world", "it is worth noting", "it is important to note", "not only … but also", "not X, but Y" as a dramatic turn, a colon that reveals a punchline ("The result: …"), three adjectives in a row, and a closing sentence that only repeats the paragraph.
9. Do not praise the work ("a powerful insight", "a striking pattern"). State the finding and the number.

**Vietnamese text on the website (`site/`)**

* Viết như một bài báo cáo của sinh viên: câu kể bình thường, có chủ ngữ và vị ngữ, dùng "nhóm em" khi nhóm nói, nhưng không mở đầu câu nào cũng bằng "nhóm em".
* Tiêu đề chỉ mô tả nội dung ("Phỏng vấn và cây câu hỏi", "Thu thập và làm sạch dữ liệu"). Không viết tiêu đề kiểu khẩu hiệu hay chơi chữ ("Một bộ màu, một kiểu chart, cho cả đồ án", "Cùng ba con số, hai câu chuyện").
* Không dùng câu ngắn giật gân ("Rẻ chưa chắc đã lợi."), không dùng dấu hai chấm để "tung" kết luận ("Tín hiệu đầu tiên: …"), không liệt kê ba tính từ liền nhau.
* Tránh các từ hay gặp trong văn AI: "định hình", "tách bạch", "hành trình", "câu chuyện" (khi không có câu chuyện nào), "đáng chú ý", "nổi bật", "then chốt", "toàn diện", "tối ưu", "không chỉ … mà còn", "điều này cho thấy", "có thể thấy rằng".
* Viết "biểu đồ" thay cho "chart". Giữ thuật ngữ tiếng Anh của môn học khi cần (data ink, dot plot, heatmap).

**Numbers and units**

10. Prices: "45,000 VND" in text and tables, "45k" in charts. Percentages: "26%", changes with a sign, "+8%". Index: "108.2 (week 1 = 100)". Dates: "26 October 2026" in text, "26/10/2026" in tables.
11. Every number in a text or a title must come from the data or from a cited source. Never invent or round a number to make a sentence sound better. If a number is not known yet, write *(fill in)* or a bracket such as **[X to Y]%**.
12. Say what a number cannot show: few weeks, two districts, one interview, an association and not a cause.

## 3. Chart rules

The model is the one page figure in the style of a newspaper graphic: serif font, a bold title that states the finding, an italic subtitle with the units, labels next to the data, grey context and one highlight, a short source line at the bottom.

**Always**

1. Start every notebook or script with `from house_style import *` and `apply_style()`. Use the helpers `title(ax, text, subtitle)`, `figure_title(fig, text, subtitle)`, `note(fig, text)` and `save(fig, path)`. Do not set fonts or colours by hand.
2. The title is a full sentence that states the finding, with the number: "The delivery app is the dearest channel for 11 of 12 items". A title that only names the topic ("Prices by channel") is not allowed.
3. The subtitle gives the measure, the unit, the period and the scope: "Price per kg, average of weeks 1 and 2, both districts".
4. Put labels next to the data. Use a legend only when direct labels are impossible.
5. Most marks are grey (`GREY`, `LIGHT`). Only the element that carries the finding gets a colour.
6. Every chart has a source line made with `note()`: the data source, the period and the main limit.
7. A code cell prints the numbers behind every title, so that a reader can check them.
8. Save each final chart with `save(fig, FIG / "mX_name.png")`. It writes a trimmed PNG to `report/figures/`. Only the M5 dashboard also needs a PDF: `save(fig, path, pdf=True)`.

**Colours (fixed for the whole project)**

| Use | Colour | Name in `house_style.py` |
|---|---|---|
| Wet market (Chợ) | #B85C38, terracotta | `CHANNEL["Chợ"]`, also `HIGHLIGHT` |
| Supermarket (Siêu thị) | #1F3D55, dark blue | `CHANNEL["Siêu thị"]` |
| Delivery app (App) | #9BBDD6, light blue | `CHANNEL["App"]` |
| Text and the main mark | #1A1A1A | `INK` |
| Context | #8C8C8C | `GREY` |
| Empty bars, faint context | #D9D9D9 | `LIGHT` |
| Amounts (prices, costs) | light grey to dark blue | `SEQ` |
| Changes (index centred at 100, premium centred at 0) | dark blue, near white, terracotta | `DIV` with `div_norm(center, spread)` |

* Channels always appear in the order Chợ, Siêu thị, App (`CHANNEL_ORDER`), with English labels from `CHANNEL_EN`.
* Districts never get a colour. Quận 10 is a solid line or a circle, Quận 3 a dashed line or a square (`DISTRICT_LINE`, `DISTRICT_MARKER`).
* Never use a rainbow colour map, red against green, or more than four colours in one chart.
* After a new palette or a new colour map, run `cvd_report()`. Every value must stay above 20.

**3D is the team style (required)**

9. Draw every data chart as 3D columns with the helpers of `house_style.py`:
   * `bars3d(ax, x, y, heights, colors)` draws the columns with a light top, the base colour in front and darker sides;
   * `style3d(ax, elev, azim, aspect, zoom)` removes the panes, fades the grid and sets a low view;
   * `label3d(ax, x, y, z, text)` prints a value on top, drawn in 2D so that no column hides it;
   * `title3d(ax, ...)` or `figure_title(fig, ...)` sets the title.
10. Three rules keep a 3D chart honest, and none of them may be broken:
    * columns start at zero (`base=0`), except in the misleading half of the M3 pair, which says so;
    * every value that carries the finding is printed with `label3d()`, and a code cell prints the full table;
    * the view stays low (`elev` between 10 and 25), and the rows are ordered so that the lower columns stand in front.
11. Two categories (items × channels, members × weeks) go on the two floor axes; one category goes on the x axis with `y = 0`.
12. Exceptions, which stay flat: the M3 makeover redesign (its critique is about 3D cylinders), swatches and colour maps, tables, and charts that the brief names as a fixed idiom (the M4 dot plot is kept next to its 3D version). Lines over time may stay flat when a 3D version would hide the trend; say why in the *Why this chart* line.
13. Never use a dual axis, a pie chart, a rainbow colour map, shadows or pictures behind data.

**Text that goes with each chart in the notebook**

Every chart has a Markdown cell before its code, in this form:

```
*Task:* compare the price per kg across the three channels for each of the 12 items.
*Why this chart:* a dot plot puts the three channels of one item on one line, on a common scale.
*Choices:* wet market = 100, items sorted by the app premium, app dots in light blue.
```

## 4. Notebook rules

1. The notebook must run from top to bottom after *Restart and run all*, with no error.
2. The first line of every code cell is a comment that says what the cell does, starting with the module: `# M4.1 Relative price of each item per channel`.
3. Headings follow the module numbers: `# M4 · Core charts`, `### M4.1 · Chart 1 …`.
4. Do not create a separate notebook for one module. Add the work to the module's section in `P10_Final_Team10.ipynb`.
5. Edit the house style only in the `%%writefile house_style.py` cell of Setup, never in the `.py` file directly, because the notebook rewrites that file each time it runs.
6. Keep the repository clean. Every file in `report/figures/` must be used by the notebook, the report or the website. When a chart is renamed or dropped, delete its old image in the same change. Do not commit scratch files, test images, `__pycache__` folders or copies such as `notebook_v2_final.ipynb`.

## 5. Data rules

1. Never edit a file in `data/raw/`. Every change is a function in Module M2 that writes one line to `data/clean/cleaning_log.csv`.
2. Never invent prices, survey answers, interview quotes or experiment results. Never fill a gap with a guess. A missing value stays missing and gets a flag.
3. Flag strange values; do not delete them silently.
4. Never delete, overwrite or reorder data in the team Google Sheet. A script that changes the sheet must copy the affected tab first and must ask a member before it runs.
5. Keep people anonymous: no names of the interviewee, sellers or survey respondents in the repository. Photos, recordings and survey forms stay in `evidence/`, which git ignores.

## 6. Workflow rules

1. Work on your own branch and open a pull request into `dev`. Never push to `dev` or `main` directly.
2. Do not commit or push unless the member asks for it.
3. Add one row to the AI log (Appendix of the notebook and `report/ai_log.md`) for every task that an AI tool helped with: date, member, tool, what it did, and how the member checked it.
4. **Write the changelog.** Every agent or member who changes code, data, text, charts or the website adds an entry at the top of `CHANGELOG.md` in the same change, in the format shown in that file: the date, who (member and tool), what changed, which files, and what the next person must know. Read the latest entries before you start, so that you know the current state of the project.
5. **The website.** `site/` holds the public page of the project (Vietnamese). After a chart changes, run `python tools/build_site.py` to copy the figures, then redeploy with `vercel deploy --prod` from `site/`.

## 7. Checklist before you hand anything over

* [ ] The notebook runs from top to bottom without an error.
* [ ] Every title states a finding, and a cell prints the numbers behind it.
* [ ] Colours come from `house_style.py`; at most one highlight per chart; channel order Chợ, Siêu thị, App.
* [ ] Charts use the 3D column style; columns start at zero; values are printed; the view is low; no dual axis.
* [ ] The text has no dashes, no hyphenated words in prose, no arrows and none of the banned words.
* [ ] Every sentence has a subject and a verb and uses "My group" where the team speaks.
* [ ] No number is invented; every gap is marked *(fill in)*.
* [ ] The AI log has a new row, and `CHANGELOG.md` has a new entry at the top.
* [ ] No unused image or scratch file is left in the repository.
