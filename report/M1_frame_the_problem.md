# M1 · Frame the problem

**Project:** P10 · The Price of Dinner
**Client:** Consumer Lab
**Module lead (Story lead):** *(fill in)*
**Last update:** 26 October 2026

This file holds everything that my group hands in for Module M1: the team card for CP0, the interview notes, the question tree, Big Idea v0, the proposal on one page for CP1 and the team contract.

## 1. Team card (CP0)

| Field | Value |
|---|---|
| Team name | *(not chosen yet)* |
| Project | P10 · The Price of Dinner |
| Client | Consumer Lab, a consumer rights association |
| Big question | Where should a student on a tight budget buy food in Ho Chi Minh City: at the wet market, at the supermarket or through a delivery app? |
| Districts | Quận 10 and Quận 3 |
| Repository | https://github.com/hwinhwork-dot/DataViz_Final_P10 |

| Member | Items whose specification they wrote | Module leads |
|---|---|---|
| Nguyễn Hoàng Minh (leader) | SP01 Pork belly, SP02 Water spinach | *(fill in)* |
| Phạm Quang Minh | SP03 Mackerel, SP04 Tomato | *(fill in)* |
| Phạm Tuấn Anh | SP05 Beef, SP06 Free range chicken | *(fill in)* |
| Trần Nhã Đoan | SP07 Watermelon, SP08 Onion | *(fill in)* |
| Nguyễn Minh Nguyệt | SP09 Đà Lạt potato, SP10 White tofu | *(fill in)* |
| Trần Nguyễn Thanh Thảo | SP11 Chicken eggs, SP12 Red tilapia | *(fill in)* |

The brief asks each member to lead at least two modules. My group has six members and the course has ten modules, so two modules need two leads each. My group will confirm this with the lecturer before CP0.

## 2. Stakeholder interview

### 2.1 How my group ran the interview

| Item | Detail |
|---|---|
| Date and format | 22 October 2026, 21:09, Microsoft Teams, audio only |
| Respondent | A woman who shops for her family and lives in Tân Phú District. She did not give her name, and my group keeps her anonymous |
| Why this person | The lecturer asked each group to interview someone who buys food for a household. Her shopping covers all three channels in our study |
| Interviewers | Members of my group; Nguyễn Hoàng Minh organised the call and Phạm Quang Minh recorded it |
| Consent | At 04:04, the interviewer explained that the interview was for a course project and asked for permission. She agreed at 04:22. At 22:57, the interviewer promised that her answers would be used only for the course and that no personal details would be shared |
| Length | The whole recording lasts 24 minutes 16 seconds. The interview itself runs from 04:04 to 23:15, which is about 19 minutes |
| Questions | Eight open questions based on *The Mom Test*: each question asks about a recent, real event instead of an opinion about the future |
| Transcript | The audio was transcribed with Whisper (model `large-v3-turbo`). A member then listened again and corrected the wrong words. The full transcript stays in `evidence/`, which git does not publish |

**A gap that my group must close.** The brief asks for an interview of at least 20 minutes. Our formal interview is about one minute short. My group will make a second, short call with the same person, of about 10 minutes, for three reasons. First, the call brings the interview time above 20 minutes. Second, two parts of the recording are unclear: the shop that sold watermelon at 18,000 to 19,000 VND per kg (08:54), and the area she called "near 12" (11:39). Third, the brief says that the lecturer may contact the respondent, so my group needs her permission to share a phone number or an email with the lecturer.

### 2.2 What my group learned

The table links each finding to one of our four smaller questions (Section 3). The times refer to the recording.

| Finding | Evidence from the interview | Question |
|---|---|---|
| She splits her basket by channel. She buys vegetables, tofu, onions, lemons and spices at the wet market, and pork, eggs and milk at the supermarket | 06:56. The market is cheaper, she can bargain, and she can buy a small amount. The supermarket keeps meat cold, so she trusts it more | Q1 |
| The price gap for the same item is a few thousand VND | Watermelon: 17,000 VND per kg at the supermarket, 18,000 to 20,000 VND per kg elsewhere (08:54). A 300 g bunch of water spinach: 9,000 VND at one supermarket and 12,000 VND at another (08:54) | Q1 |
| She sees little quality difference between two supermarkets, but the time of day matters | 10:08. The same 300 g bunch looks similar in both shops; freshness depends on morning or afternoon | Q1 |
| Prices differ between areas of the city | Tofu costs 5,000 to 6,000 VND per piece near her home and 3,500 to 4,000 VND near a friend's home in another district (11:03). Some vegetables differ by 3,000 to 4,000 VND | Q2 |
| She notices a price rise by comparing it with her last purchase | Water spinach went from 9,000 to about 12,000 VND per bunch a week before the interview (12:38). She guessed that weather or transport costs were the cause | Q3 |
| One small rise does not matter, but many small rises add up | 13:47. She switches to a cheaper vegetable with similar nutrition | Q3, Q4 |
| Splitting the basket saves money but costs time | 14:58. She saves from 5,000 VND to a few tens of thousands VND per trip, and a few tens of thousands VND per week. She often visits two places. On busy days she goes only to the supermarket | Q4 |
| A cheap price is not always a saving | 18:01. Evening discounts of 30% to 50% gave her vegetables that were wilted inside, and she threw a large part away. Now she checks more carefully or pays more at another shop | Q4 |
| Convenience can beat price | 21:16. Late at night, when the supermarket is closed, she orders fruit on GrabMart or buys it at a convenience store. A bunch of bananas costs about 20,000 VND at the supermarket, while one banana costs about 10,000 VND or more at a convenience store or on an app | Q1, Q4 |

### 2.3 What the interview changes in our design

1. **The unit matters.** She talks about prices per bunch, per piece and per kg. My group therefore records the pack size of every price and converts it to a price per kg (Module M2).
2. **The time of day matters.** Evening discounts and freshness change during the day, so the price sheet records the time of every price.
3. **The cheapest price is not the full cost.** Travel time, the number of trips, the delivery fee and food waste all change what a student really pays. Our student survey will ask about these costs, and the basket cost in Q4 will show the price and the extra costs separately.
4. **The delivery app is a channel for urgent or late purchases.** My group will not judge the app by price alone. The final guide will say when the app is worth its higher price.

## 3. Question tree

**Big question:** Where should a student on a tight budget buy food in Ho Chi Minh City, and how much can the choice of channel save?

| Question | Tasks (action and target) | Main chart | Data | Module |
|---|---|---|---|---|
| **Q1.** How large is the price gap between channels for the same item, and does it stay the same over eight weeks? | Compare the price per kg across the three channels for each of the 12 items. Track the gap between channels week by week. Rank the items by the size of the gap | Dot plot per item; line chart of the weekly gap | Team price sheet | M4, M7 |
| **Q2.** Do prices differ between Quận 10 and Quận 3? | Compare the two districts for each item and channel. Find the items with the largest district gap | Dumbbell chart | Team price sheet | M4, M7 |
| **Q3.** How do the price changes that we observe compare with the official food CPI? | Build a price index from our data (week 1 = 100). Compare it with the NSO CPI groups "Foodstuff" and "Food and foodstuff" for Ho Chi Minh City. Place both against world prices of rice, oil and meat | Two panels on the same time axis (no dual axis) | Team price sheet, NSO, FAOSTAT, World Bank | M4 |
| **Q4.** How much does a real student basket cost, and how much can the channel choice save? | Estimate the weekly basket cost for three student personas. Add travel time, delivery fees and waste to the price. Rank the channels by real saving | Bar chart per persona with the price and the extra costs shown separately | Price sheet, student survey (at least 60 students) | M4, M7, M9 |

Each task needs at least one chart. The chart list in Module M4 will refer to these task names.

## 4. Big Idea v0

My group uses the template from the brief and leaves the numbers open until the eight weeks of data are complete.

> A student who **[persona]** can save **[X to Y]%** of a weekly food basket by buying **[item group]** at the **[channel]**, but this saving **[stays / shrinks]** once **[travel time / delivery fees / food waste]** is counted.

**Our working hypothesis.** The interview suggests that the wet market is cheaper for vegetables and that the supermarket wins on trust for meat. My group expects the delivery app to cost the most, but to be the only option for some late purchases. The first two weeks of our data point in the same direction: for the same item, district and week, the supermarket price is about 1.1 times the wet market price, and the app price is about 1.4 times. These numbers come from only 45 complete comparisons, so my group does not treat them as a result yet.

## 5. Proposal on one page (CP1)

### 5.1 Question and plan

The question tree in Section 3 is our plan. Every smaller question has a task, a chart and a data source.

### 5.2 Sources tested

My group downloaded every source and read one real row from each.

| Source | What it gives | One row that my group read |
|---|---|---|
| Team price sheet (primary) | Price of 12 items × 3 channels × 2 districts × 8 weeks | Week 1, SP01 pork belly, Grab Mart, Quận 10, 18 October 2026, 12:00: 192,000 VND per kg, promotion, delivery fee 41,000 VND |
| NSO Viet Nam, monthly CPI | CPI by group for Viet Nam and Ho Chi Minh City | September 2026, Ho Chi Minh City, "Foodstuff": 100.19 (previous month = 100) |
| FAOSTAT, consumer price indices | Viet Nam food CPI, 2015 = 100 | June 2026, Viet Nam, food: 140.87 |
| World Bank, Pink Sheet | World commodity prices in US dollars | September 2026, rice (Viet Nam 5% broken): 418.50 USD per tonne |

The data cards in `data/data_cards.md` describe each source in full. The old GSO address (gso.gov.vn) did not respond, so my group uses the new NSO address.

### 5.3 Field data plan

| Part | Plan |
|---|---|
| Price collection | 576 planned prices from 12 October to 6 December 2026. Each member owns two items and checks them in all six channel and district cells every week. The app alternates between Grab Mart (odd weeks) and Shopee Mart (even weeks) |
| Item specification | Each item has a fixed brand, pack and quality note in the overview tab of the sheet |
| Evidence | A photo of the price tag or a screenshot of the app, with the date visible. Photos keep their original timestamp |
| Student survey | At least 60 students. The survey asks where students buy food, how often, how much they spend, how long a trip takes and how much food they throw away. It gives the three personas for Q4 |
| Status on 26 October 2026 | Weeks 1 and 2 are complete: 144 prices, 141 usable after cleaning. To reach 500 usable prices, each remaining week needs 60 of its 72 prices |

### 5.4 Risks and plan B

| Risk | Sign | Plan B |
|---|---|---|
| Too few prices to reach 500 | A week ends with fewer than 60 usable prices | The leader reminds the member on Sunday evening. A member who has finished their own items takes over the missing cells and is named as the collector |
| An item is out of stock | The stock column says "Hết hàng" | The row stays with no price. If an item is out of stock in three weeks, my group picks a close substitute and notes it in the item specification |
| The 20% collector rule cannot be met | With six members and one collector per price, a full share is 16.7% | My group asks the lecturer whether a price that two members collect together can carry both names |
| The October and November CPI arrive late | NSO publishes each month's CPI in the first days of the next month | Q3 uses the months that exist at the deadline and says clearly which months are missing |
| The app shows a different price at checkout | The final price includes a fee or a voucher | The sheet stores the listed price and the delivery fee separately |
| Fewer than 60 survey answers | Fewer than 40 answers one week before CP2 | Each member shares the survey in two more class groups and asks friends in person |

### 5.5 Constraint card

The constraint card is drawn at CP1. My group will write the card here and say which final chart it applies to.

| Card drawn | Chart it applies to | How the design changes |
|---|---|---|
| *(fill in at CP1)* | *(fill in)* | *(fill in)* |

## 6. Team contract

All six members read and sign this contract. My group can change it only when all members agree.

**Roles.** The leader, Nguyễn Hoàng Minh, merges pull requests into `dev` and `main` and sends the weekly reminder. Each module has a lead, who writes the module and asks one other member to review it before the pull request.

**Meetings.** My group meets online every Sunday at 20:00 for 30 minutes. Before the meeting, each member enters the week's prices in the sheet. The meeting starts with the data status figure of Module M2.

**Decisions.** My group decides by discussion first. If the team cannot agree within the meeting, the team votes, and the majority wins. On a tie, the lead of the module decides.

**Deadlines.** A member who cannot finish a task on time tells the team at least 24 hours before the deadline. The team then moves the task or helps.

**When a member does not deliver.** The first time, the leader sends a private message and agrees on a new date. The second time, the team discusses the problem in the next meeting and writes it in the team log. The third time, or if a member does not answer for one week, the leader informs the lecturer, and the team log shows who did each task.

**Conflicts.** Members talk about a problem directly and politely, first in private and then in the meeting. If the conflict continues, the team asks the lecturer for help.

**AI use.** Every member writes the AI tools that they use, and what they used them for, in the AI log. No member uses AI to create price data or survey answers.

| Member | Signature | Date |
|---|---|---|
| Nguyễn Hoàng Minh | | |
| Phạm Quang Minh | | |
| Phạm Tuấn Anh | | |
| Trần Nhã Đoan | | |
| Nguyễn Minh Nguyệt | | |
| Trần Nguyễn Thanh Thảo | | |
