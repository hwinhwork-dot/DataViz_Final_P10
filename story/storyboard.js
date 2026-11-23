/* The storyboard of M9, drawn by an AI tool (Claude Code) with the lecturer's permission, from the drawings of the
   presentation site. Eight frames in the order a reader meets them; ?lang=en gives the English sheet for the report.
   Every number comes from data/facts.json, which tools/build_story_data.py writes from the clean tables. */
(async () => {
  "use strict";
  const EN = new URLSearchParams(location.search).get("lang") === "en";
  document.documentElement.lang = EN ? "en" : "vi";
  await window.P10.loadShared();
  const bg = document.querySelector(".bg");
  if (bg) bg.remove();                                                   // the sheet keeps its own paper background
  const F = await (await fetch("data/facts.json", { cache: "no-store" })).json();

  const num = (v, d = 0) => v.toLocaleString(EN ? "en-GB" : "vi-VN", { minimumFractionDigits: d, maximumFractionDigits: d });
  const money = v => (EN ? num(v) + " VND" : num(v) + " đồng");
  const short = v => (EN ? num(v) : num(v)) + (EN ? "" : "đ");
  const p1 = v => num(v, 1) + "%";
  const an = (x, y, s, pose) => `<g transform="translate(${x} ${y}) scale(${s})">${window.P10.student(pose)}</g>`;
  const sky = id => `<defs><linearGradient id="sky${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#8F9BEA"/><stop offset=".55" stop-color="#5B4FC8"/><stop offset="1" stop-color="#2E2A78"/></linearGradient>
    <filter id="sk${id}" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="${id + 3}"/><feDisplacementMap in="SourceGraphic" scale="2.6"/></filter></defs>
    <rect width="328" height="214" rx="4" fill="url(#sky${id})"/><rect y="176" width="328" height="38" fill="#3B3592"/><path d="M0 177 H328" stroke="#FFF1C9" stroke-width="2"/>`;
  const tag = (x, y, txt, col, w = 86) => `<g transform="translate(${x} ${y})"><line x1="0" y1="-16" x2="0" y2="0" stroke="#FFF1C9" stroke-width="1.5"/>
    <rect x="${-w / 2}" y="0" width="${w}" height="28" rx="7" fill="#FFF7E6" stroke="${col}" stroke-width="3"/><circle cx="0" cy="6" r="2.4" fill="#26235F"/>
    <text x="0" y="21" text-anchor="middle" font-size="11.5" font-weight="800" fill="#26235F">${txt}</text></g>`;

  const T = EN ? {
    h1: "Storyboard · The Price of Dinner", stamp: "M9 · CP3 · Team 10", anim: "Animation:",
    sub: "Eight frames of the presentation site, in the order a reader meets them. Each frame gives what the reader sees and its animation. The lecturer allowed the team to draw the storyboard with AI; Claude Code drew this sheet on 22/11/2026 from the drawings of the site.",
  } : {
    h1: "Storyboard · Giá của bữa tối", stamp: "M9 · CP3 · Nhóm 10", anim: "Hình động:",
    sub: "Tám khung của trang trình bày, theo thứ tự người xem đi qua. Mỗi khung ghi điều người xem thấy và hình động của khung. Giảng viên cho phép dùng AI để vẽ storyboard; bản này do Claude Code vẽ ngày 22/11/2026 từ chính hình vẽ của trang.",
  };

  const v = F.basket.vnd, pc = F.basket.pct_over_market;
  const frames = [
    { t: EN ? "An at UEH" : "An ở UEH",
      see: EN ? "An, a UEH student on a small budget, asks where to buy food: the wet market, the supermarket or an app." : "An, sinh viên UEH, tiền ít, hỏi nên mua đồ ăn ở chợ, siêu thị hay qua app.",
      anim: EN ? "the campus rises, An walks in and waves, a question bubble pops up." : "trường hiện lên, An đi vào vẫy tay, bong bóng câu hỏi bật ra.",
      pic: id => `${sky(id)}<g filter="url(#sk${id})"><rect x="168" y="52" width="140" height="124" rx="4" fill="#6F5FD6" stroke="#FFF1C9" stroke-width="2.5"/>
        ${[0, 1, 2].map(r => [0, 1, 2, 3].map(c => `<rect x="${180 + c * 31}" y="${84 + r * 28}" width="18" height="14" rx="2" fill="${(r + c) % 3 ? "#FFE3A3" : "#B9A8F2"}"/>`).join("")).join("")}
        <rect x="200" y="60" width="76" height="18" rx="4" fill="#F36FA9"/><path d="M40 30 h112 a12 12 0 0 1 12 12 v38 a12 12 0 0 1 -12 12 h-74 l-14 14 v-14 h-24 a12 12 0 0 1 -12 -12 v-38 a12 12 0 0 1 12 -12 z" fill="#FFF7E6" stroke="#26235F" stroke-width="2"/>
        <use href="#basket" x="44" y="44" width="40" height="28"/><use href="#coin" x="90" y="44" width="26" height="26"/><rect x="124" y="42" width="18" height="30" rx="4" fill="#26235F"/></g>
        <text x="238" y="73" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">UEH</text><text x="150" y="122" font-size="40" font-weight="800" fill="#F36FA9" font-family="Playfair Display, serif">?</text>
        ${an(96, 178, .66, "happy")}` },
    { t: EN ? "The basket of 12 foods" : "Giỏ hàng 12 món",
      see: EN ? `The same basket of 12 foods everywhere; my group recorded ${num(F.design.prices)} prices and kept ${num(F.design.usable)} usable prices.` : `Cùng một giỏ 12 món ở mọi nơi; nhóm em ghi ${num(F.design.prices)} giá và giữ lại ${num(F.design.usable)} giá dùng được.`,
      anim: EN ? "the 12 foods fall into the basket one by one, the counters count up." : "12 món lần lượt rơi vào giỏ, các con số đếm lên.",
      pic: id => `${sky(id)}<g filter="url(#sk${id})">${["SP01", "SP02", "SP03", "SP04", "SP05", "SP07", "SP08", "SP11", "SP12"].map((c, i) => `<use href="#i-${c}" x="${92 + (i % 5) * 30 + (i > 4 ? 14 : 0)}" y="${i > 4 ? 28 : 50 + (i % 2) * 10}" width="28" height="28" transform="rotate(${(i * 37) % 50 - 25} ${106 + (i % 5) * 30} ${i > 4 ? 42 : 64})"/>`).join("")}
        <use href="#basket" x="96" y="82" width="136" height="92"/></g>
        <rect x="14" y="184" width="132" height="22" rx="11" fill="#26235F" stroke="#FFE3A3"/><text x="80" y="199" text-anchor="middle" font-size="11.5" font-weight="700" fill="#FFE3A3">${num(F.design.prices)} ${EN ? "prices" : "giá"}</text>
        <rect x="182" y="184" width="132" height="22" rx="11" fill="#26235F" stroke="#FFE3A3"/><text x="248" y="199" text-anchor="middle" font-size="11.5" font-weight="700" fill="#FFE3A3">${num(F.design.usable)} ${EN ? "usable" : "dùng được"}</text>` },
    { t: EN ? "Three places to buy" : "Ba nơi mua",
      see: EN ? `The basket costs ${money(v["Chợ"])} at the wet market, ${p1(pc["Siêu thị"])} more at the supermarket and ${p1(pc.App)} more on the app.` : `Giỏ hàng ở chợ hết ${money(v["Chợ"])}, ở siêu thị đắt hơn ${p1(pc["Siêu thị"])}, qua app đắt hơn ${p1(pc.App)}.`,
      anim: EN ? "An walks to each place; a price tag swings down and counts up." : "An đi qua từng nơi, thẻ giá đung đưa rơi xuống rồi đếm số.",
      pic: id => `${sky(id)}<g filter="url(#sk${id})">
        <path d="M18 70 h82 l-8 -22 h-66 z" fill="#F36FA9"/><path d="M26 48 l-8 22 M44 48 l-4 22 M60 48 v22 M76 48 l4 22 M92 48 l8 22" stroke="#FFF1C9" stroke-width="3"/><rect x="24" y="70" width="70" height="52" fill="#B85C38" stroke="#FFF1C9" stroke-width="2"/>
        <rect x="122" y="44" width="84" height="78" rx="4" fill="#1F3D55" stroke="#FFF1C9" stroke-width="2"/><rect x="132" y="56" width="64" height="14" rx="3" fill="#FFE3A3"/><path d="M140 88 h40 l-6 18 h-28 z" fill="none" stroke="#FFF1C9" stroke-width="2.5"/><circle cx="148" cy="112" r="3.5" fill="#FFF1C9"/><circle cx="170" cy="112" r="3.5" fill="#FFF1C9"/>
        <rect x="244" y="38" width="48" height="84" rx="8" fill="#26235F" stroke="#9BBDD6" stroke-width="3"/><rect x="250" y="48" width="36" height="58" rx="3" fill="#9BBDD6"/><circle cx="268" cy="114" r="3" fill="#FFF1C9"/></g>
        ${tag(59, 140, short(v["Chợ"]), "#B85C38", 94)}${tag(164, 140, "+" + p1(pc["Siêu thị"]), "#1F3D55")}${tag(268, 140, "+" + p1(pc.App), "#9BBDD6")}` },
    { t: EN ? "The delivery fee" : "Phí giao hàng",
      see: EN ? `One delivery fee of ${money(F.fee.one_order_vnd)} brings the app basket to ${p1(F.fee.app_with_fee_pct_over_market)} above the wet market.` : `Thêm một lần phí giao ${money(F.fee.one_order_vnd)}, giỏ app đắt hơn chợ ${p1(F.fee.app_with_fee_pct_over_market)}.`,
      anim: EN ? "a rider drives in with turning wheels; a coin flies to the fee tag." : "xe giao hàng chạy vào, bánh xe quay, đồng xu bay tới thẻ phí.",
      pic: id => `${sky(id)}<g filter="url(#sk${id})"><circle cx="196" cy="160" r="16" fill="none" stroke="#FFF1C9" stroke-width="5"/><circle cx="270" cy="160" r="16" fill="none" stroke="#FFF1C9" stroke-width="5"/>
        <path d="M196 160 L222 128 H258 L270 160" fill="none" stroke="#F36FA9" stroke-width="6" stroke-linejoin="round"/><rect x="226" y="100" width="40" height="30" rx="4" fill="#FFC38B" stroke="#7A4E1E" stroke-width="2"/>
        <circle cx="216" cy="98" r="10" fill="#FFD3B0" stroke="#26235F" stroke-width="2"/><path d="M206 92 a10 10 0 0 1 20 0 z" fill="#8FE3D6"/>
        <path d="M200 92 C160 40 110 40 92 64" fill="none" stroke="#FFE3A3" stroke-width="2" stroke-dasharray="5 5"/><use href="#coin" x="150" y="44" width="24" height="24"/></g>
        ${tag(70, 82, "+" + short(F.fee.one_order_vnd), "#8C8C8C", 104)}
        <text x="70" y="150" text-anchor="middle" font-size="30" font-weight="800" fill="#FFE3A3" font-family="Playfair Display, serif">${p1(F.fee.app_with_fee_pct_over_market)}</text>` },
    { t: EN ? "Percent and money" : "Phần trăm và tiền",
      see: EN ? `Vegetables have the largest percentage gaps, but meat, fish and eggs hold ${100 - F.saving.large_group_share_pct}% of the money the app costs more.` : `Rau củ chênh nhiều nhất theo phần trăm, nhưng thịt, cá và trứng chiếm ${100 - F.saving.large_group_share_pct}% số tiền app đắt hơn.`,
      anim: EN ? "24 coins drop into one stack, then split into two stacks." : "24 đồng xu rơi thành một chồng, rồi tách thành hai chồng.",
      pic: id => { const nA = Math.round(24 * F.saving.large_group_share_pct / 100);
        const stack = (x, n) => Array.from({ length: n }, (_, i) => `<g transform="translate(${x} ${170 - i * 7})"><rect x="-30" y="0" width="60" height="8" fill="#C9973F"/><ellipse cx="0" cy="8" rx="30" ry="7" fill="#B8862E"/><ellipse cx="0" cy="0" rx="30" ry="7" fill="#FFE3A3" stroke="#B8862E" stroke-width="1.5"/></g>`).join("");
        return `${sky(id)}<g filter="url(#sk${id})">${stack(96, nA)}${stack(232, 24 - nA)}</g>
        <text x="96" y="76" text-anchor="middle" font-size="26" font-weight="800" fill="#FFE3A3" font-family="Playfair Display, serif">${F.saving.large_group_share_pct}%</text>
        <text x="232" y="44" text-anchor="middle" font-size="26" font-weight="800" fill="#FFE3A3" font-family="Playfair Display, serif">${100 - F.saving.large_group_share_pct}%</text>
        <text x="96" y="92" text-anchor="middle" font-size="11" font-weight="600" fill="#FFF1C9">${EN ? "6 large gap foods" : "6 món chênh lớn"}</text>
        <text x="232" y="61" text-anchor="middle" font-size="11" font-weight="600" fill="#FFF1C9">${EN ? "meat, fish, eggs" : "thịt, cá, trứng"}</text>`; } },
    { t: EN ? "Eight weeks, two districts" : "8 tuần, hai quận",
      see: EN ? `The app costs ${p1(F.weekly.app_gap_min_pct)} to ${p1(F.weekly.app_gap_max_pct)} more in every complete week; ${F.districts.within_5pct} of 12 foods differ by less than 5% between the districts.` : `App đắt hơn chợ ${p1(F.weekly.app_gap_min_pct)} đến ${p1(F.weekly.app_gap_max_pct)} ở mọi tuần đủ dữ liệu; ${F.districts.within_5pct} trên 12 món chênh dưới 5% giữa hai quận.`,
      anim: EN ? "a calendar flips from week 1 to week 8 while three lines draw themselves." : "tờ lịch lật từ tuần 1 đến tuần 8, ba đường tự vẽ ra.",
      pic: id => `${sky(id)}<g filter="url(#sk${id})"><rect x="18" y="40" width="86" height="96" rx="8" fill="#FFF7E6" stroke="#FFF1C9" stroke-width="2"/><rect x="18" y="40" width="86" height="24" rx="8" fill="#F36FA9"/>
        <path d="M128 140 L160 128 L192 132 L224 118 L256 124 L288 112" fill="none" stroke="#9BBDD6" stroke-width="4" stroke-linecap="round"/>
        <path d="M128 152 L160 146 L192 150 L224 140 L256 144 L288 138" fill="none" stroke="#1F3D55" stroke-width="4" stroke-linecap="round"/>
        <path d="M128 162 L160 160 L192 162 L224 156 L256 160 L288 154" fill="none" stroke="#B85C38" stroke-width="4" stroke-linecap="round"/>
        <path d="M150 40 c0 -14 22 -14 22 0 c0 12 -11 22 -11 22 c0 0 -11 -10 -11 -22 z" fill="#F36FA9" stroke="#FFF1C9" stroke-width="2"/><path d="M250 54 c0 -14 22 -14 22 0 c0 12 -11 22 -11 22 c0 0 -11 -10 -11 -22 z" fill="#8FE3D6" stroke="#FFF1C9" stroke-width="2"/></g>
        <text x="61" y="122" text-anchor="middle" font-size="56" font-weight="800" fill="#26235F" font-family="Playfair Display, serif">8</text>
        <text x="161" y="96" text-anchor="middle" font-size="11" font-weight="700" fill="#FFF1C9">${EN ? "District 3" : "Quận 3"}</text><text x="261" y="96" text-anchor="middle" font-size="11" font-weight="700" fill="#FFF1C9">${EN ? "District 10" : "Quận 10"}</text>` },
    { t: EN ? "Shopping with An" : "Đi chợ cùng An", mod: "M9",
      see: EN ? "The reader picks a district, the foods and a place; An shops at the market, in the supermarket or on an app, and the game compares the three places week by week." : "Người xem chọn quận, chọn món và nơi mua; An đi mua ở chợ, siêu thị hoặc qua app, rồi trò chơi so sánh ba nơi theo từng tuần.",
      anim: EN ? "foods fly into the basket, An walks to the stall, the phone zooms to the screen, coins stack up and a stamp lands." : "món bay vào giỏ, An đi tới sạp, điện thoại phóng to, đồng xu chồng lên và con dấu Rẻ nhất đập xuống.",
      pic: id => `${sky(id)}<g filter="url(#sk${id})"><path d="M148 214 L180 214 L170 150 L158 150 Z M70 214 L100 214 L150 150 L138 150 Z M230 214 L260 214 L190 150 L178 150 Z" fill="#241F5E"/>
        <g transform="translate(66 150)"><rect x="-44" y="-62" width="88" height="14" fill="#F36FA9"/>${[0, 1, 2, 3].map(i => `<rect x="${-44 + i * 22}" y="-62" width="11" height="14" fill="#FFF1C9"/>`).join("")}
          <rect x="-40" y="-48" width="5" height="48" fill="#A86A35"/><rect x="35" y="-48" width="5" height="48" fill="#A86A35"/><rect x="-42" y="-24" width="84" height="24" rx="3" fill="#C98A4B"/>
          <use href="#i-SP04" x="-30" y="-44" width="20" height="20"/><use href="#i-SP02" x="-6" y="-46" width="22" height="22"/><use href="#i-SP07" x="18" y="-42" width="20" height="20"/></g>
        <g transform="translate(164 150)"><rect x="-42" y="-72" width="84" height="72" rx="3" fill="#1F3D55" stroke="#FFF1C9" stroke-width="2"/><rect x="-34" y="-86" width="68" height="14" rx="3" fill="#FFE3A3"/><rect x="-16" y="-34" width="32" height="34" fill="#9CCBF5" opacity=".7"/></g>
        <g transform="translate(262 150)"><rect x="-24" y="-92" width="48" height="92" rx="9" fill="#26235F" stroke="#9BBDD6" stroke-width="3"/><rect x="-18" y="-84" width="36" height="74" rx="4" fill="#9BBDD6"/></g></g>
      <g transform="translate(66 74) rotate(-10)"><rect x="-38" y="-12" width="76" height="24" rx="6" fill="#FFF7E6" stroke="#F36FA9" stroke-width="3"/><text y="5" text-anchor="middle" font-size="12" font-weight="800" fill="#F36FA9">${EN ? "CHEAPEST" : "RẺ NHẤT"}</text></g>
      ${an(164, 210, .38, "waving")}` },
    { t: EN ? "The review" : "Phiếu đánh giá", mod: "M10",
      see: EN ? "Right after the game, the reader rates the site with lanterns, says what to fix, and sends the review; the test link does not let it be skipped." : "Ngay sau trò chơi, người xem chấm điểm bằng lồng đèn, góp ý điều cần sửa rồi gửi phiếu; với link thử nghiệm thì không bỏ qua được.",
      anim: EN ? "one card per question slides in, lanterns light up for the rating, and after sending a sky of lanterns rises." : "mỗi câu hỏi là một thẻ trượt vào, lồng đèn sáng lên theo điểm, gửi xong thì đèn trời bay lên.",
      pic: id => `${sky(id)}<g filter="url(#sk${id})"><rect x="86" y="30" width="156" height="128" rx="12" fill="#FFF7E6" stroke="#F36FA9" stroke-width="3"/>
        <rect x="102" y="46" width="96" height="8" rx="4" fill="#26235F"/><rect x="102" y="60" width="70" height="6" rx="3" fill="#E8CF9A"/>
        ${[0, 1, 2, 3, 4].map(i => `<use href="#lantern" x="${104 + i * 26}" y="76" width="20" height="38" opacity="${i < 4 ? 1 : .35}"/>`).join("")}
        <rect x="128" y="132" width="72" height="16" rx="8" fill="#F36FA9"/>
        ${[[30, 160, 18], [270, 120, 22], [292, 40, 16], [40, 60, 14], [250, 186, 12], [20, 108, 12]].map(([x, y, w]) => `<use href="#lantern" x="${x}" y="${y}" width="${w}" height="${w * 1.85}"/>`).join("")}</g>
      <text x="164" y="144" text-anchor="middle" font-size="10" font-weight="800" fill="#fff">${EN ? "Send" : "Gửi"}</text>` },
  ];

  document.getElementById("h1").textContent = T.h1;
  document.getElementById("sub").textContent = T.sub;
  document.getElementById("stamp").textContent = T.stamp;
  document.getElementById("grid").innerHTML = frames.map((f, i) => `<article class="frame"><span class="no">${i + 1}</span>${f.mod ? `<span class="mod">${f.mod}</span>` : ""}
    <svg class="pic" viewBox="0 0 328 214" role="img" aria-label="${f.t}">${f.pic(i)}</svg>
    <h2>${f.t}</h2><p class="see">${f.see}</p><p class="anim"><b>${T.anim}</b> ${f.anim}</p></article>`).join("");
  document.documentElement.dataset.ready = "1";
})();
