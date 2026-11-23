# Story site: Giá của bữa tối

This folder holds the presentation site of Team 10. It tells the findings of the project through An, a student of UEH whom my group made up to guide the talk. An walks from the campus to a wet market, a supermarket and a delivery app with the same basket of 12 foods. The site is in Vietnamese, like `site/`, and it follows the same writing rules. Every number on it comes from `data/facts.json` and `data/m9_basket.json`.

The look takes its idea from Vietnamese festival art: scrolling clouds, a communal house gate, kites and lanterns, over a drifting pattern of line drawings of a rice bowl, a fish, herbs, a price tag, an old coin and a market basket, in violet, pink, peach and mint. The data cards are cream paper, and every data mark keeps the house colours of the project (wet market terracotta, supermarket dark blue, app light blue). All charts are flat, as the M8 test suggests.

## Files

| File | What it holds |
|---|---|
| `index.html` | The 14 scenes, the shared drawings (clouds, kites, lanterns, coins, basket, the 12 foods) and the text |
| `style.css` | Colours, type (Playfair Display and Be Vietnam Pro), the paper cards, the walk cycle of An, the ambient motion, the explorer and the test mode |
| `app.js` | Reads `data/facts.json` and `data/m9_basket.json`, fills every number, draws the charts, and runs one GSAP timeline per scene |
| `an.js` | Shared by every page: the drawing of An, the copy of the shared drawings for the other pages, and the record of one test in the tab |
| `chon.js` | Scene 12, "Đến lượt bạn", and the game of M9, "Đi chợ cùng An": the stage, the shopping animations, the comparison and the two timed questions of the M10 test |
| `test.js` | The test mode (`?test`): the welcome card, the five second test of the key chart, and the pill with the step |
| `review.js`, `danh-gia.html`, `forms.css` | The M10 review form, one question per card: who the reader is, seven ratings with lanterns, comments, and the peer review checklist for another team; it opens over the story or as its own page |
| `nhom.html`, `nhom.js` | The team page: every review, summed up, with a CSV download; it needs the team passcode |
| `api/review.js`, `api/reviews.js` | Vercel functions that store a review in the private Blob store, and read or delete reviews for the team page |
| `storyboard.html`, `storyboard.js` | The storyboard of M9 in eight frames; `tools/render_storyboard.py` saves it to `report/figures/` |
| `data/facts.json`, `data/m9_basket.json` | The numbers and the prices of the explorer, written by `tools/build_story_data.py` from `data/clean/` |
| `package.json`, `vercel.json` | The Blob SDK for the functions, and the headers that keep the team page and the API out of search engines |

## User flow and animations

The presenter moves with the arrow keys, Page Up and Page Down, the space bar, the dots on the right or the stops of the route at the top. A scene plays when its top passes 65% of the window, and it plays again when the reader comes back to it from above. Each card has a "Xem lại" button that replays its scene.

| # | Scene | What the reader learns | Animation |
|---|---|---|---|
| 0 | Mở đầu | Title, team, the question in one line | Clouds slide in from the top and the bottom, the gate rises and glows, the words of the title jump in, two kites fly in and sway |
| 1 | An, sinh viên UEH | Who An is, the big question, why Quận 3 and Quận 10 | The UEH building rises and its windows light up, An walks in and waves, a speech bubble pops up with the market, the basket and the phone, a question mark bobs |
| 2 | Giỏ hàng 12 món | The basket (1 kg of each food, 10 eggs) and the data: 576 prices, 558 usable | An walks in with a small basket, the 12 foods fall into the big basket one by one, the food chips pop in, the counters count up |
| 3 | Ba nơi mua | The basket costs 1,050,381 VND at the wet market, 12.9% more at the supermarket and 26.4% more on the app | The three shops rise, An walks to each one, a price tag swings down and counts up at each stop, the matching bar grows in the chart |
| 4 | Phí giao hàng | One delivery fee (23,297 VND) brings the app basket to 28.7% above the wet market | A delivery rider drives in with spinning wheels, a parcel moves to An's door, a coin flies to the fee tag, the fee part of the bar grows |
| 5 | Từng món | Six foods where the app costs a median 67% more, six where it costs 21% more (M6 groups) | The 12 foods line up and fly into two baskets by group, then the 12 bars grow |
| 6 | Phần trăm và tiền | The six foods with the largest percentage gap make up only 43% of the money gap; meat, fish and eggs make up 57% | 24 coins drop into one stack and split into two stacks, the amounts count up, the split bar grows |
| 7 | 8 tuần | The app basket is 22.2% to 29.3% dearer in every complete week; onion, beef and eggs over the weeks | A block calendar flips from week 1 to week 8 while the three lines draw themselves and the points pop |
| 8 | Hai quận | 7 of 12 foods differ by less than 5% between the districts; water spinach is 10.4% dearer in Quận 10 | The two districts pop in, the pins of the markets and campuses drop, An rides a bicycle along the route, the bars grow from zero |
| 9 | So với CPI | The basket moved from minus 5.0% to plus 5.3% by channel in eight weeks; the official foodstuff CPI rose 0.62% in October | A market scale rises and its needle swings and settles, the bars grow left and right of zero |
| 10 | Thử 2D và 3D | The M8 test: 12 s per answer with the flat version, 24.5 s with the 3D block | Two stopwatches run; the flat one stops at 12 s, the 3D one at 24.5 s, and each pulses when it stops |
| 11 | Gợi ý cho An | Three pieces of advice from the data, and what the site cannot show | The kitchen fades in, An walks in and waves, the steam rises from the pot, the advice slides in line by line |
| 12 | Đến lượt bạn (M9) | The door to the game "Đi chợ cùng An". In the game the reader picks a district on a map, taps foods on a stall, and picks the wet market, the supermarket or the app at a crossroads; then the game compares the three places week by week and asks two quick questions | The places rise at the crossroads and An walks in and waves. In the game: foods fly into the basket; at the market An walks to the stall, asks the seller, and each food hops into the basket while a handwritten note adds the line; in the supermarket the camera pans along the shelves while An pushes a cart and a slip is printed; on the app the phone rises from An's hand and zooms to the whole screen, a finger taps each food, the cart badge counts, the order sheet slides up, and a rider brings the parcel; the comparison stacks coins from zero, a "Rẻ nhất" stamp lands, and lanterns pick the week; the end rains lanterns and coins |
| 13 | Kết thúc | Thanks, team, sources, a button to the review form, link to the code | The clouds close in and the end card grows |

Readers who ask their system for less motion get the final state of every scene at once.

## The M10 test

Send testers the link `https://p10-dinner-story.vercel.app/?test` (`?test=new` starts a new test in the same tab). The page shows a welcome card and a five second test of the key chart, then the story with a pill that shows the step. When the tester reaches scene 12, the game opens by itself and cannot be closed; at its end the review form opens by itself and cannot be skipped. The form sends the review, the five second test, the two quick questions and the time of the game together to `/api/review`. Without `?test`, the game opens with the button of scene 12 and the review with the end card, and both can be closed. Nobody can read the answers from a browser: they sit in the private Blob store `p10-m10-reviews` of the Vercel project.

The team reads them on `https://p10-dinner-story.vercel.app/nhom.html` with the team passcode, which the team lead gives to members only. The passcode lives in the `TEAM_KEY` variable of the Vercel project; to change it, run `vercel env rm TEAM_KEY production` and `vercel env add TEAM_KEY production --sensitive` in this folder, then deploy again. The page downloads every review as CSV, and a member can delete a test answer that was sent by mistake.

## Update the numbers

After the notebook runs on new data:

```
python tools/build_story_data.py
```

The script repeats the formulas of the notebook and stops if a number differs from the value that the notebook prints. When the data change on purpose, update the checks at the end of the script.

## Deploy

```
cd story && vercel deploy --prod
```

The folder is linked to the Vercel project `p10-dinner-story`, with the private Blob store `p10-m10-reviews` and the variables `BLOB_READ_WRITE_TOKEN` and `TEAM_KEY`. After a change of the storyboard, run `python tools/render_storyboard.py` from the repository root. Do not pipe the output of `vercel deploy` into `head`: closing the pipe early stops the upload.

## Checks without a browser window

`?still` shows the final state of every scene; `?still&only=s-mua` shows one scene; `?debug` writes errors and the progress of the timelines on the `<html>` element; `?nolag&speed=25` runs the animations faster for a headless browser, which draws few frames.
