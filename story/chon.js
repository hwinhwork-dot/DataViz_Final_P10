/* Scene 12 of the presentation site, "Đến lượt bạn", and the game of M9, "Đi chợ cùng An".
   The reader picks a district, the foods and a place to buy; An then shops at the wet market, in the supermarket or on an app,
   and the game compares the three places week by week. Two quick questions and the time of the whole visit feed the M10 test,
   and the end of the game opens the review form (review.js); with ?test the game and the review cannot be skipped.
   The prices come from data/m9_basket.json, which tools/build_story_data.py writes with the rules of Section M9.1 of the notebook. */
window.P10Chon = (() => {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const COLOR = { "Chợ": "#B85C38", "Siêu thị": "#1F3D55", "App": "#9BBDD6" };
  const LOW = { "Chợ": "chợ", "Siêu thị": "siêu thị", "App": "app" };
  const NAME = { "Chợ": "Chợ", "Siêu thị": "Siêu thị", "App": "App" };
  const CHS = ["Chợ", "Siêu thị", "App"];
  const nf = new Intl.NumberFormat("vi-VN");
  const vnd = x => nf.format(Math.round(x));
  const k = x => nf.format(Math.round(x / 1000)) + "k";
  const about = x => "khoảng " + nf.format(Math.round(x / 1000) * 1000) + " đồng";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const listVi = a => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " và " + a[a.length - 1]);
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  let D, F, REDUCED = false, TEST = false;
  const S = { district: null, foods: new Set(), week: 8, tried: {}, weeks: new Set(), t0: 0, tasks: [], done: false };
  let G = null, svg, stage, panelBox, current = null, playTimer = null;

  /* ---------------------------------------------------------------- prices */
  const items = () => D.items.filter(it => S.foods.has(it.code));
  const qtyOf = it => (it.unit === "quả" ? (D.basket[it.code] || 10) : 1);
  const qtyText = it => nf.format(qtyOf(it)) + " " + it.unit;
  const unitPrice = (code, ch, wi) => D.price[code][ch][S.district][wi];
  function receipt(ch, wi) {
    const lines = items().map(it => { const p = unitPrice(it.code, ch, wi); return { it, amount: p == null ? null : p * qtyOf(it) }; });
    const miss = lines.filter(l => l.amount == null).map(l => l.it.name.toLowerCase());
    const sub = lines.reduce((a, l) => a + (l.amount || 0), 0), fee = ch === "App" ? D.fee[S.district][wi] : 0;
    return { lines, sub, fee, total: miss.length ? null : sub + fee, miss };
  }
  const allAt = wi => Object.fromEntries(CHS.map(ch => [ch, receipt(ch, wi)]));
  const bestOf = r => CHS.filter(c => r[c].total != null).reduce((a, c) => (a == null || r[c].total < r[a].total ? c : a), null);
  const market = () => ((F.design.markets || []).find(m => m.includes(S.district)) || "Chợ").replace(/\s*\(.*\)$/, "");

  /* ---------------------------------------------------------------- small drawing helpers */
  const anHTML = () => `<g class="an-flip"><g class="an-body">${window.P10.student("")}</g><use class="an-bk" href="#basket" x="-4" y="-78" width="44" height="30" opacity="0"/><g class="an-ph" opacity="0"><rect x="6" y="-112" width="16" height="28" rx="3" fill="#26235F" stroke="#9BBDD6" stroke-width="2"/><rect x="9" y="-108" width="10" height="20" rx="1.5" fill="#9BBDD6"/></g></g>`;
  const ground = (y = 470, c = "#3B3592") => `<rect y="${y}" width="800" height="${600 - y}" fill="${c}"/><path d="M0 ${y + 1} H800" stroke="#FFF1C9" stroke-width="3" opacity=".8"/>`;
  const awning = (x, y, w, h, a, b) => {
    const n = Math.round(w / 24), sw = w / n;
    let s = "";
    for (let i = 0; i < n; i++) s += `<rect x="${x + i * sw}" y="${y}" width="${sw + .5}" height="${h}" fill="${i % 2 ? b : a}"/><circle cx="${x + i * sw + sw / 2}" cy="${y + h}" r="${sw / 2}" fill="${i % 2 ? b : a}"/>`;
    return s;
  };
  const sign = (x, y, w, text, bg, fg, size = 24) => `<rect x="${x - w / 2}" y="${y - size - 4}" width="${w}" height="${size + 18}" rx="10" fill="${bg}" stroke="#FFF1C9" stroke-width="3"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="${size}" font-weight="800" fill="${fg}" letter-spacing="1">${text}</text>`;
  const person = (shirt, hair) => `<path d="M-30 0 L-26 -62 Q0 -76 26 -62 L30 0 Z" fill="${shirt}" stroke="#2B2A6B" stroke-width="2.5"/><circle cx="0" cy="-92" r="22" fill="#FFD3B0" stroke="#2B2A6B" stroke-width="2.5"/>
    <path d="M-23 -94 C-24 -122 24 -122 23 -94 C14 -106 -12 -108 -23 -94 Z" fill="${hair}"/><circle cx="-8" cy="-90" r="2.6" fill="#2B2A6B"/><circle cx="8" cy="-90" r="2.6" fill="#2B2A6B"/>
    <path d="M-6 -80 Q0 -75 6 -80" fill="none" stroke="#2B2A6B" stroke-width="2" stroke-linecap="round"/><circle cx="-14" cy="-82" r="3.5" fill="#F7A9B8" opacity=".8"/><circle cx="14" cy="-82" r="3.5" fill="#F7A9B8" opacity=".8"/>`;

  function marketPlace() {
    return `<rect x="-100" y="-150" width="200" height="12" fill="#FFF1C9" opacity="0"/>${awning(-100, -158, 200, 36, "#F36FA9", "#FFF1C9")}
      <rect x="-92" y="-122" width="10" height="122" fill="#A86A35"/><rect x="82" y="-122" width="10" height="122" fill="#A86A35"/>
      <rect x="-96" y="-62" width="192" height="62" rx="4" fill="url(#gg-wood)" stroke="#7A4E1E" stroke-width="3"/>
      <use href="#i-SP04" x="-80" y="-104" width="44" height="44"/><use href="#i-SP02" x="-30" y="-108" width="48" height="48"/><use href="#i-SP07" x="26" y="-100" width="46" height="46"/>
      ${sign(0, -190, 110, "CHỢ", "#F36FA9", "#FFF1C9", 26)}`;
  }
  function superPlace() {
    return `<rect x="-112" y="-196" width="224" height="196" rx="6" fill="#1F3D55" stroke="#FFF1C9" stroke-width="3"/>
      ${[0, 1, 2, 3].map(i => `<rect x="${-92 + i * 48}" y="-160" width="32" height="26" rx="3" fill="#FFE3A3" opacity=".9"/>`).join("")}
      <rect x="-48" y="-92" width="96" height="92" fill="#9CCBF5" opacity=".55" stroke="#FFF1C9" stroke-width="3"/><path d="M0 -92 V0" stroke="#FFF1C9" stroke-width="3"/>
      <g transform="translate(-28 -60)"><path d="M0 0 h40 l-6 18 h-28 z" fill="none" stroke="#26235F" stroke-width="3.5"/><circle cx="10" cy="26" r="3.5" fill="#26235F"/><circle cx="30" cy="26" r="3.5" fill="#26235F"/></g>
      ${sign(0, -214, 176, "SIÊU THỊ", "#FFE3A3", "#26235F", 24)}`;
  }
  function appPlace() {
    return `<rect x="-58" y="-236" width="116" height="236" rx="20" fill="#26235F" stroke="#9BBDD6" stroke-width="5"/>
      <rect x="-46" y="-218" width="92" height="196" rx="10" fill="#9BBDD6"/>
      <rect x="-36" y="-204" width="72" height="16" rx="4" fill="#26235F" opacity=".75"/>
      ${[0, 1, 2, 3].map(i => `<rect x="-36" y="${-178 + i * 30}" width="20" height="20" rx="4" fill="#FFF7E6"/><rect x="-10" y="${-174 + i * 30}" width="46" height="6" rx="3" fill="#26235F" opacity=".6"/><rect x="-10" y="${-164 + i * 30}" width="28" height="5" rx="2.5" fill="#26235F" opacity=".35"/>`).join("")}
      <circle cx="0" cy="-10" r="5" fill="#FFF1C9" opacity=".7"/>
      ${sign(0, -258, 100, "APP", "#9BBDD6", "#26235F", 24)}`;
  }
  const PLACE_X = { "Chợ": 160, "Siêu thị": 400, "App": 640 };
  function crossMarkup(withHit) {
    const place = (ch, inner) => `<g class="g-place${withHit ? " g-hit" : ""}" data-ch="${ch}" transform="translate(${PLACE_X[ch]} 384)"${withHit ? ` tabindex="0" role="button" aria-label="Mua ở ${LOW[ch]}"` : ""}>
        <ellipse class="g-focus" cx="0" cy="-100" rx="140" ry="150" fill="#FFE3A3" opacity="0" style="opacity:0"/><g class="g-pin">${inner}</g></g>`;
    return `<rect y="384" width="800" height="216" fill="${withHit ? "#3B3592" : "url(#gg-fade)"}"/><path d="${withHit ? "M0 385 H800" : "M70 385 H730"}" stroke="#FFF1C9" stroke-width="3" opacity="${withHit ? .8 : .5}"/>
      <path d="M352 600 L448 600 L414 386 L386 386 Z" fill="#241F5E"/><path d="M360 600 L420 600 L190 388 L140 388 Z" fill="#241F5E"/><path d="M380 600 L440 600 L660 388 L610 388 Z" fill="#241F5E"/>
      <path d="M400 596 L400 392" stroke="#FFF1C9" stroke-width="3" stroke-dasharray="14 14" opacity=".7"/><path d="M392 596 L166 392" stroke="#FFF1C9" stroke-width="3" stroke-dasharray="14 14" opacity=".55"/><path d="M408 596 L636 392" stroke="#FFF1C9" stroke-width="3" stroke-dasharray="14 14" opacity=".55"/>
      ${place("Chợ", marketPlace())}${place("Siêu thị", superPlace())}${place("App", appPlace())}`;
  }

  /* ---------------------------------------------------------------- the stage of the game, every background in one SVG */
  function stageMarkup() {
    const foods = D.items.map((it, i) => {
      const t = Math.floor(i / 4), c = i % 4, x = 380 + c * 98, y = 166 + t * 100;
      return `<g class="g-hit g-food" data-code="${it.code}" tabindex="0" role="button" aria-pressed="false" aria-label="${it.name}" transform="translate(${x} ${y})">
        <circle class="g-ring" cx="39" cy="42" r="44" fill="#FFE3A3" opacity="0"/><circle class="g-focus" cx="39" cy="42" r="44" fill="none" stroke="#FFE3A3" stroke-width="3"/>
        <use href="#i-${it.code}" width="78" height="78"/>
        <g class="g-tick" opacity="0"><circle cx="72" cy="8" r="13" fill="#F36FA9" stroke="#fff" stroke-width="3"/><path d="M66 8 l4.5 4.5 l8 -8.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></g></g>`;
    }).join("");
    const shelfUnits = [0, 1, 2, 3, 4].map(u => {
      const x0 = 40 + u * 340, colors = ["#F36FA9", "#FFC38B", "#8FE3D6", "#B9A8F2", "#FFE3A3", "#9CCBF5", "#F7897B"];
      let s = `<rect x="${x0}" y="150" width="300" height="320" fill="#33427A"/><rect x="${x0}" y="150" width="10" height="320" fill="#9CCBF5"/><rect x="${x0 + 290}" y="150" width="10" height="320" fill="#9CCBF5"/>`;
      [240, 330, 420].forEach((sy, si) => {
        s += `<rect x="${x0}" y="${sy}" width="300" height="10" fill="#9CCBF5"/>`;
        [0, 1, 4, 5].forEach(j => {
          const h = 34 + ((u * 7 + si * 5 + j * 3) % 4) * 8;
          s += `<rect x="${x0 + 16 + j * 46}" y="${sy - h}" width="36" height="${h}" rx="4" fill="${colors[(u + si + j) % colors.length]}" stroke="#26235F" stroke-width="2"/>`;
        });
      });
      return s;
    }).join("");
    return `<svg class="g-svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Sân khấu của trò chơi Đi chợ cùng An">
      <defs>
        <linearGradient id="gg-sky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#8F9BEA"/><stop offset=".55" stop-color="#6A5FD0"/><stop offset="1" stop-color="#3E3798"/></linearGradient>
        <radialGradient id="gg-glow" cx=".5" cy=".38" r=".6"><stop offset="0" stop-color="#F36FA9" stop-opacity=".35"/><stop offset="1" stop-color="#F36FA9" stop-opacity="0"/></radialGradient>
        <linearGradient id="gg-wood" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#D99A5B"/><stop offset="1" stop-color="#A86A35"/></linearGradient>
        <linearGradient id="gg-night" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#26235F"/><stop offset="1" stop-color="#4B47A8"/></linearGradient>
        ${CHS.map((ch, i) => `<pattern id="gg-coin${i}" width="150" height="14" patternUnits="userSpaceOnUse" patternTransform="translate(${[170, 400, 630][i] - 75} 470)"><rect width="150" height="14" fill="#C9973F"/><ellipse cx="75" cy="3" rx="75" ry="9" fill="#FFE3A3" stroke="#B8862E" stroke-width="2"/></pattern>`).join("")}
        <pattern id="gg-fee" width="150" height="14" patternUnits="userSpaceOnUse" patternTransform="translate(555 470)"><rect width="150" height="14" fill="#8C8C8C"/><ellipse cx="75" cy="3" rx="75" ry="9" fill="#D9D9D9" stroke="#8C8C8C" stroke-width="2"/></pattern>
      </defs>
      <rect width="800" height="600" fill="url(#gg-sky)"/><rect width="800" height="600" fill="url(#gg-glow)"/>
      <use href="#cloud" class="g-cl" x="30" y="50" width="220" height="96" opacity=".55"/><use href="#cloud2" class="g-cl" x="560" y="80" width="200" height="88" opacity=".5"/>
      <path d="M-10 22 Q400 92 810 22" fill="none" stroke="#FFF1C9" stroke-width="2" opacity=".7"/>
      ${[[96, 36], [252, 58], [404, 58], [556, 58], [708, 36]].map(([x, y]) => `<use href="#lantern" class="swing" x="${x - 13}" y="${y}" width="26" height="48"/>`).join("")}

      <g class="g-bg" data-bg="home">${ground()}
        <g transform="translate(455 198) scale(.92)"><path d="M0 110 L150 10 L300 110 Z" fill="url(#gRoof)" stroke="#FFF1C9" stroke-width="3"/>
          <rect x="24" y="110" width="252" height="190" fill="#F36FA9" stroke="#FFF1C9" stroke-width="3"/><rect x="56" y="150" width="70" height="60" fill="#FFE3A3" stroke="#FFF1C9" stroke-width="3" class="win-light"/>
          <rect x="170" y="190" width="70" height="110" fill="#241F5E" stroke="#FFF1C9" stroke-width="3"/><use href="#lantern" class="swing" x="128" y="96" width="36" height="66"/></g>
        <g transform="translate(110 298)"><rect x="-10" y="60" width="20" height="112" fill="#7A4E1E"/><circle cx="0" cy="40" r="62" fill="#8FE3D6" stroke="#FFF1C9" stroke-width="3"/><circle cx="-36" cy="74" r="34" fill="#7DD3C4"/><circle cx="36" cy="70" r="36" fill="#7DD3C4"/></g>
        <g class="g-think" opacity="0"><ellipse cx="250" cy="150" rx="78" ry="54" fill="#FFF7E6" stroke="#26235F" stroke-width="3"/><circle cx="214" cy="226" r="14" fill="#FFF7E6" stroke="#26235F" stroke-width="3"/><circle cx="200" cy="256" r="8" fill="#FFF7E6" stroke="#26235F" stroke-width="3"/>
          <text x="250" y="174" text-anchor="middle" font-size="64" font-weight="800" fill="#F36FA9" font-family="Playfair Display, serif">?</text></g>
        <g class="g-bike" transform="translate(900 386)"><rect x="70" y="-6" width="66" height="54" rx="6" fill="#8FE3D6" stroke="#FFF1C9" stroke-width="3"/>
          <path d="M10 70 Q30 30 80 46 L130 46 Q160 50 170 70 Z" fill="#B9A8F2" stroke="#FFF1C9" stroke-width="3"/><path d="M150 48 L170 20 L186 20" fill="none" stroke="#FFF1C9" stroke-width="5" stroke-linecap="round"/>
          <g class="g-wheel" transform="translate(34 84)"><circle r="22" fill="#241F5E" stroke="#FFF1C9" stroke-width="4"/><path d="M-18 0 H18 M0 -18 V18" stroke="#FFF1C9" stroke-width="3"/></g>
          <g class="g-wheel" transform="translate(150 84)"><circle r="22" fill="#241F5E" stroke="#FFF1C9" stroke-width="4"/><path d="M-18 0 H18 M0 -18 V18" stroke="#FFF1C9" stroke-width="3"/></g>
          <path d="M96 46 L110 0" stroke="#FFD3B0" stroke-width="10" stroke-linecap="round"/><rect x="92" y="-46" width="30" height="48" rx="12" fill="#F7897B" stroke="#FFF1C9" stroke-width="3"/>
          <circle cx="110" cy="-62" r="17" fill="#F36FA9" stroke="#FFF1C9" stroke-width="3"/><path d="M120 -30 L160 20" stroke="#FFD3B0" stroke-width="8" stroke-linecap="round"/></g>
        <g class="g-parcel" opacity="0"><rect x="-26" y="-22" width="52" height="42" rx="6" fill="#8FE3D6" stroke="#2B2A6B" stroke-width="3"/><path d="M-26 -8 H26 M0 -22 V20" stroke="#2B2A6B" stroke-width="2.5"/></g>
      </g>

      <g class="g-bg" data-bg="map"><rect y="520" width="800" height="80" fill="#3B3592" opacity=".55"/>
        <g transform="translate(0 40) scale(.8)">
          <path class="g-hit g-d" data-d="Quận 3" tabindex="0" role="button" aria-label="Quận 3" d="M120 140 C160 70 330 60 400 120 C460 170 440 300 380 350 C310 410 170 400 120 330 C80 270 90 190 120 140 Z" fill="#8E7BE6" stroke="#FFF1C9" stroke-width="5"/>
          <path class="g-hit g-d" data-d="Quận 10" tabindex="0" role="button" aria-label="Quận 10" d="M560 150 C640 80 820 90 880 160 C930 230 900 360 820 400 C740 440 600 420 560 340 C520 270 520 200 560 150 Z" fill="#F36FA9" stroke="#FFF1C9" stroke-width="5"/>
        </g>
        <text x="208" y="132" text-anchor="middle" font-size="30" font-weight="800" fill="#FFF1C9" font-family="Playfair Display, serif" pointer-events="none">QUẬN 3</text>
        <text x="576" y="140" text-anchor="middle" font-size="30" font-weight="800" fill="#FFF1C9" font-family="Playfair Display, serif" pointer-events="none">QUẬN 10</text>
        ${[[176, 240, "Chợ Bàn Cờ", true], [264, 304, "UEH cơ sở A", false], [592, 236, "Chợ Nguyễn Tri Phương", true], [632, 332, "UEH cơ sở B", false]].map(([x, y, t, m]) => `<g transform="translate(${x} ${y})" pointer-events="none">
          <path d="M0 0 C-18 -18 -18 -44 0 -44 C18 -44 18 -18 0 0 Z" fill="#FFF7E6" stroke="#2B2A6B" stroke-width="3"/>${m ? `<use href="#i-SP02" x="-11" y="-40" width="22" height="22"/>` : `<text y="-22" text-anchor="middle" font-size="15" font-weight="800" fill="#2B2A6B">${t.slice(-1)}</text>`}
          <text y="22" text-anchor="middle" font-size="15" font-weight="700" fill="#FFF1C9">${t}</text></g>`).join("")}
        <g class="g-marker" transform="translate(400 520)"><circle r="26" fill="#FFD3B0" stroke="#2B2A6B" stroke-width="3"/><path d="M-27 -2 C-30 -36 28 -38 27 -4 C17 -18 -9 -21 -27 -2 Z" fill="#2B2A6B"/>
          <ellipse cx="-9" cy="2" rx="2.6" ry="3.4" fill="#2B2A6B"/><ellipse cx="9" cy="2" rx="2.6" ry="3.4" fill="#2B2A6B"/><path d="M-6 12 Q0 18 6 12" fill="none" stroke="#2B2A6B" stroke-width="2.2" stroke-linecap="round"/></g>
      </g>

      <g class="g-bg" data-bg="shelf">${ground()}
        ${awning(332, 104, 456, 44, "#F36FA9", "#FFF1C9")}${sign(560, 92, 230, "QUẦY HÀNG", "#26235F", "#FFE3A3", 20)}
        <rect x="350" y="150" width="14" height="320" fill="url(#gg-wood)"/><rect x="772" y="150" width="14" height="320" fill="url(#gg-wood)"/>
        ${[0, 1, 2].map(t => `<rect x="364" y="${158 + t * 100}" width="408" height="92" fill="#FFF1C9" opacity=".08"/><rect x="356" y="${250 + t * 100}" width="424" height="14" rx="4" fill="url(#gg-wood)" stroke="#7A4E1E" stroke-width="2"/>`).join("")}
        ${foods}
        <g class="g-big"><g class="g-pile"></g><use href="#basket" x="128" y="352" width="176" height="120"/></g>
      </g>

      <g class="g-bg" data-bg="cross">${crossMarkup(true)}
        ${CHS.map(ch => `<g class="g-badge" data-ch="${ch}" transform="translate(${PLACE_X[ch]} 420)" opacity="0"><rect x="-74" y="-19" width="148" height="38" rx="19" fill="#FFE3A3" stroke="#B8862E" stroke-width="3"/><text y="7" text-anchor="middle" font-size="18" font-weight="800" fill="#26235F"></text></g>`).join("")}
      </g>

      <g class="g-bg" data-bg="market">${ground()}
        <path d="M0 470 L800 470 L800 600 L0 600 Z" fill="#3B3592"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M${i * 110 - 20} 600 L${i * 100 + 20} 470" stroke="#FFF1C9" stroke-width="1.5" opacity=".18"/>`).join("")}
        <g opacity=".5">${awning(20, 210, 170, 30, "#8FE3D6", "#FFF1C9")}<rect x="30" y="250" width="150" height="220" fill="#4B47A8"/><rect x="24" y="380" width="162" height="90" fill="url(#gg-wood)"/>
          ${awning(206, 230, 160, 28, "#FFC38B", "#FFF1C9")}<rect x="214" y="268" width="144" height="202" fill="#4B47A8"/><rect x="208" y="392" width="156" height="78" fill="url(#gg-wood)"/></g>
        <path d="M0 64 Q400 128 800 64" fill="none" stroke="#FFF1C9" stroke-width="2" opacity=".6"/>${[60, 160, 260, 360, 460, 560, 660, 760].map((x, i) => `<circle cx="${x}" cy="${68 + 26 * Math.sin(Math.PI * x / 800)}" r="6" fill="${i % 2 ? "#FFE3A3" : "#F36FA9"}"/>`).join("")}
        ${awning(428, 130, 364, 48, "#F36FA9", "#FFF1C9")}${sign(610, 116, 230, "RAU · THỊT · CÁ", "#26235F", "#FFE3A3", 18)}
        <rect x="436" y="176" width="12" height="294" fill="#A86A35"/><rect x="772" y="176" width="12" height="294" fill="#A86A35"/>
        <g class="g-vendor" transform="translate(650 356)">${person("#F7897B", "#2B2A6B")}<circle cx="0" cy="-120" r="11" fill="#2B2A6B"/></g>
        <rect x="430" y="346" width="364" height="14" rx="4" fill="#F2C98A" stroke="#7A4E1E" stroke-width="2"/>
        <rect x="436" y="358" width="352" height="112" fill="url(#gg-wood)" stroke="#7A4E1E" stroke-width="3"/>${[0, 1, 2, 3].map(i => `<path d="M436 ${384 + i * 22} H788" stroke="#7A4E1E" stroke-width="1.5" opacity=".5"/>`).join("")}
        <use href="#i-SP09" x="452" y="396" width="52" height="52"/><use href="#i-SP04" x="720" y="398" width="50" height="50"/>
        <g class="g-counter"></g>
      </g>

      <g class="g-bg" data-bg="super"><rect width="800" height="470" fill="#2B3A6E"/>${[0, 1, 2, 3].map(i => `<rect x="${60 + i * 190}" y="16" width="120" height="10" rx="5" fill="#FFF1C9" opacity=".85"/>`).join("")}
        <rect y="470" width="800" height="130" fill="#4B47A8"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `<path d="M${i * 100} 470 L${i * 120 - 80} 600" stroke="#FFF1C9" stroke-width="1.5" opacity=".2"/>`).join("")}<path d="M0 520 H800 M0 562 H800" stroke="#FFF1C9" stroke-width="1.5" opacity=".15"/>
        <g class="g-aisle">${shelfUnits}<g class="g-shelfitems"></g>
          <g transform="translate(1440 0)"><rect x="0" y="380" width="300" height="90" rx="6" fill="#1F3D55" stroke="#FFF1C9" stroke-width="3"/><rect x="0" y="370" width="300" height="14" fill="#241F5E"/>
            <g transform="translate(200 370)">${person("#8FE3D6", "#3B3592")}</g><rect x="236" y="318" width="54" height="52" rx="6" fill="#9CCBF5" stroke="#FFF1C9" stroke-width="3"/>
            ${sign(110, 268, 150, "THU NGÂN", "#FFE3A3", "#26235F", 18)}</g>
        </g>
        ${sign(400, 66, 220, "SIÊU THỊ", "#1F3D55", "#FFF1C9", 26)}
        <g class="g-cart" transform="translate(262 470)"><g class="g-cartload"></g><path d="M0 -78 L100 -78 L88 -24 L12 -24 Z" fill="rgba(255,241,201,.12)" stroke="#FFF1C9" stroke-width="4" stroke-linejoin="round"/>
          <path d="M20 -78 L26 -24 M45 -78 L46 -24 M70 -78 L68 -24 M4 -60 H96 M8 -42 H92" stroke="#FFF1C9" stroke-width="2" opacity=".7"/><path d="M0 -78 L-24 -100" stroke="#FFF1C9" stroke-width="5" stroke-linecap="round"/>
          <circle cx="22" cy="-8" r="9" fill="#241F5E" stroke="#FFF1C9" stroke-width="3"/><circle cx="80" cy="-8" r="9" fill="#241F5E" stroke="#FFF1C9" stroke-width="3"/></g>
      </g>

      <g class="g-bg" data-bg="room"><rect width="800" height="470" fill="#4B47A8"/><path d="M0 400 H800" stroke="#FFF1C9" stroke-width="2" opacity=".25"/>
        <rect x="70" y="80" width="230" height="170" rx="8" fill="url(#gg-night)" stroke="#FFF1C9" stroke-width="4"/><path d="M185 80 V250 M70 165 H300" stroke="#FFF1C9" stroke-width="3"/>
        <circle cx="246" cy="122" r="22" fill="#FFE3A3"/>${[[100, 110], [140, 196], [262, 210], [118, 232], [210, 100]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.5" fill="#FFF1C9"/>`).join("")}
        <rect y="470" width="800" height="130" fill="#3B3592"/><ellipse cx="380" cy="520" rx="240" ry="34" fill="#F36FA9" opacity=".45"/>
        <circle cx="640" cy="300" r="90" fill="#FFE3A3" opacity=".14"/><path d="M612 356 L626 290 L670 290 L684 356 Z" fill="#FFE3A3" stroke="#FFF1C9" stroke-width="3"/><rect x="644" y="356" width="8" height="12" fill="#FFF1C9"/>
        <rect x="520" y="366" width="250" height="16" rx="4" fill="url(#gg-wood)" stroke="#7A4E1E" stroke-width="2"/><rect x="536" y="382" width="12" height="88" fill="#A86A35"/><rect x="744" y="382" width="12" height="88" fill="#A86A35"/>
        <g transform="translate(560 330)"><path d="M-18 36 L-14 0 H14 L18 36 Z" fill="#F7897B" stroke="#2B2A6B" stroke-width="2.5"/><path d="M0 0 C-10 -30 -30 -30 -26 -40 M0 0 C6 -34 20 -40 26 -36 M0 0 C0 -20 -2 -44 2 -50" fill="none" stroke="#7DD3C4" stroke-width="5" stroke-linecap="round"/></g>
        <g class="g-phone-svg" opacity="0"><rect x="-13" y="-24" width="26" height="48" rx="5" fill="#151240" stroke="#9BBDD6" stroke-width="2.5"/><rect x="-10" y="-20" width="20" height="38" rx="2" fill="#9BBDD6"/></g>
      </g>

      <g class="g-bg" data-bg="compare">${ground()}
        ${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M${60 + i * 114} 0 L${40 + i * 120} 470" stroke="#FFF1C9" stroke-width="40" opacity=".03"/>`).join("")}
        ${CHS.map((ch, i) => { const cx = [170, 400, 630][i]; return `<g class="g-tower" data-ch="${ch}">
          <rect class="g-tw" x="${cx - 75}" y="470" width="150" height="0" fill="url(#gg-coin${i})"/>${ch === "App" ? `<rect class="g-tf" x="${cx - 75}" y="470" width="150" height="0" fill="url(#gg-fee)"/>` : ""}
          <ellipse class="g-cap" cx="${cx}" cy="470" rx="75" ry="10" fill="#FFE3A3" stroke="#B8862E" stroke-width="2"/>
          <text class="g-lb" x="${cx}" y="450" text-anchor="middle" font-size="25" font-weight="800" fill="#FFF1C9" stroke="#26235F" stroke-width="6" paint-order="stroke" font-family="Playfair Display, serif"></text>
          <rect x="${cx - 92}" y="474" width="184" height="40" rx="10" fill="${COLOR[ch]}" stroke="#FFF1C9" stroke-width="3"/>
          <text x="${cx}" y="502" text-anchor="middle" font-size="21" font-weight="800" fill="${ch === "App" ? "#26235F" : "#FFF1C9"}">${NAME[ch]}</text>
          <text class="g-sub" x="${cx}" y="540" text-anchor="middle" font-size="16" font-weight="600" fill="#FFF1C9" opacity=".85"></text></g>`; }).join("")}
        <g class="g-stamp" opacity="0"><g class="g-stamp-s"><g transform="rotate(-10)"><rect x="-92" y="-30" width="184" height="60" rx="12" fill="rgba(255,247,230,.92)" stroke="#F36FA9" stroke-width="6"/>
          <text y="12" text-anchor="middle" font-size="32" font-weight="800" fill="#F36FA9" letter-spacing="2">RẺ NHẤT</text></g></g></g>
      </g>

      <g class="g-bg" data-bg="kitchen">${ground()}
        <g transform="translate(0 110) scale(.8)"><rect x="120" y="80" width="760" height="370" rx="18" fill="#4B47A8" stroke="#FFF1C9" stroke-width="3"/>
          <rect x="560" y="120" width="250" height="170" rx="10" fill="#FFE3A3" stroke="#FFF1C9" stroke-width="3" class="win-light"/><path d="M685 120 V290 M560 205 H810" stroke="#FFF1C9" stroke-width="3"/>
          <rect x="160" y="330" width="380" height="120" fill="#6F5FD6" stroke="#FFF1C9" stroke-width="3"/><rect x="200" y="314" width="140" height="18" rx="4" fill="#241F5E"/>
          <path d="M212 314 Q210 260 270 258 Q330 260 328 314 Z" fill="#B9A8F2" stroke="#FFF1C9" stroke-width="3"/><rect x="256" y="246" width="28" height="12" rx="4" fill="#FFF1C9"/>
          <g class="steam"><path d="M246 236 c-14 -18 14 -30 0 -50"/><path d="M270 230 c-14 -18 14 -30 0 -54"/><path d="M294 236 c-14 -18 14 -30 0 -50"/></g>
          <path d="M380 320 Q420 360 460 320 Z" fill="#FFF7E6" stroke="#FFF1C9" stroke-width="3"/><use href="#basket" x="400" y="268" width="90" height="62"/></g>
      </g>

      <g class="g-an">${anHTML()}</g>
      <g class="g-fx"></g>
    </svg>`;
  }

  /* ---------------------------------------------------------------- An */
  const an = () => $(".g-an", svg);
  const MK = { x: 400, y: 520, s: 1 };
  const mkApply = () => $(".g-marker", svg).setAttribute("transform", `translate(${MK.x} ${MK.y}) scale(${MK.s})`);
  const A = { x: 0, y: 470, s: 1, dir: 1 };
  const anApply = () => an().setAttribute("transform", `translate(${A.x} ${A.y}) scale(${A.s})`);
  function anAt(x, y, s) { gsap.killTweensOf(A); Object.assign(A, { x, y, s }); anApply(); }
  function face(dir) { A.dir = dir; $(".an-flip", svg).setAttribute("transform", dir < 0 ? "scale(-1 1)" : ""); }
  function pose(p) { $(".an-body .student", svg).setAttribute("class", "student " + (p || "")); }
  function carry(on) { gsap.set($(".an-bk", svg), { opacity: on ? 1 : 0 }); }
  function phoneInHand(on) { gsap.set($(".an-ph", svg), { opacity: on ? 1 : 0 }); }
  const handBasket = () => ({ x: A.x + A.s * 18 * A.dir, y: A.y - A.s * 64 });
  function walk(tl, toX, dur, at, toY, toS) {
    tl.call(() => { face(toX >= A.x ? 1 : -1); pose("walking"); }, null, at)
      .to(A, { x: toX, y: () => (toY == null ? A.y : toY), s: () => (toS == null ? A.s : toS), duration: dur, ease: "none", onUpdate: anApply }, at)
      .call(() => pose(""), null, at + dur);
  }
  function point(tl, at) {                                              // An lifts the front arm towards the place she looks at
    const arm = $(".an-body .arm-front", svg);
    tl.to(arm, { rotation: -115, transformOrigin: "50% 6%", duration: .35, ease: "back.out(2)" }, at).to(arm, { rotation: 0, duration: .35 }, at + 1.1);
  }

  /* ---------------------------------------------------------------- scenes, bubbles, timelines */
  function scene(name, dur = .55) {
    $$(".g-bg", svg).forEach(g => {
      const on = g.dataset.bg === name;
      if (REDUCED) { g.style.opacity = on ? 1 : 0; g.style.visibility = on ? "visible" : "hidden"; return; }
      if (on) { gsap.set(g, { visibility: "visible" }); gsap.to(g, { opacity: 1, duration: dur, ease: "power2.out" }); }
      else gsap.to(g, { opacity: 0, duration: dur * .7, onComplete: () => gsap.set(g, { visibility: "hidden" }) });
    });
  }
  function bubble(x, y, text, cls = "") {
    const b = document.createElement("div");
    b.className = "g-bub " + cls;
    b.style.left = (x / 8) + "%"; b.style.top = (y / 6) + "%";
    b.textContent = text;
    stage.appendChild(b);
    if (!REDUCED) gsap.from(b, { scale: .3, opacity: 0, duration: .45, ease: "back.out(2.4)", transformOrigin: cls.includes("right") ? "86% 100%" : "14% 100%" });
    return b;
  }
  const clearBubbles = () => $$(".g-bub", stage).forEach(b => b.remove());
  function run(onDone, skippable) {
    if (current) { current.kill(); current = null; }
    const skip = $(".g-skip", stage);
    const tl = gsap.timeline({ onComplete: () => { skip.hidden = true; current = null; if (onDone) onDone(); } });
    current = tl;
    skip.hidden = !skippable;
    skip.onclick = () => { tl.progress(1); };
    if (REDUCED) setTimeout(() => tl.progress(1), 0);
    return tl;
  }
  function fly(code, from, to, size0, size1, tl, at, dur = .55) {
    const u = document.createElementNS(NS, "use");
    u.setAttribute("href", "#i-" + code); u.setAttribute("width", 64); u.setAttribute("height", 64); u.setAttribute("x", -32); u.setAttribute("y", -32);
    $(".g-fx", svg).appendChild(u);
    gsap.set(u, { x: from.x, y: from.y, scale: size0 / 64, opacity: 0, svgOrigin: "0 0" });
    tl.set(u, { opacity: 1 }, at)
      .to(u, { motionPath: { path: [{ x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - 110 }, { x: to.x, y: to.y }], curviness: 1.25 },
        scale: size1 / 64, rotation: gsap.utils.random(-160, 160), duration: dur, ease: "power1.inOut" }, at)
      .to(u, { opacity: 0, duration: .12 }, at + dur - .05)
      .call(() => u.remove(), null, at + dur + .1);
  }
  function pop(x, y, text, tl, at, color = "#FFE3A3") {
    const t = document.createElementNS(NS, "text");
    t.setAttribute("x", x); t.setAttribute("y", y); t.setAttribute("text-anchor", "middle"); t.setAttribute("font-size", "22"); t.setAttribute("font-weight", "800");
    t.setAttribute("fill", color); t.setAttribute("stroke", "#26235F"); t.setAttribute("stroke-width", "5"); t.setAttribute("paint-order", "stroke"); t.setAttribute("opacity", "0");
    t.textContent = text;
    $(".g-fx", svg).appendChild(t);
    tl.fromTo(t, { opacity: 0, y: 0 }, { opacity: 1, y: -10, duration: .25 }, at).to(t, { opacity: 0, y: -40, duration: .5 }, at + .6).call(() => t.remove(), null, at + 1.2);
  }

  /* ---------------------------------------------------------------- the panel */
  const STEPS = ["Quận", "Món", "Nơi mua", "So sánh"];
  function setStep(n) {
    $$(".g-steps li", G).forEach((li, i) => { li.classList.toggle("on", i === n - 1); li.classList.toggle("done", i < n - 1); });
  }
  function panel(html, actions) {
    panelBox.innerHTML = `<div class="paper g-card">${html}${actions ? `<div class="g-actions">${actions}</div>` : ""}</div>`;
    if (!REDUCED) gsap.from(panelBox.firstElementChild, { y: 24, opacity: 0, duration: .45, ease: "power3.out" });
    return panelBox.firstElementChild;
  }
  const icon = ch => `<svg viewBox="-125 -275 250 285" aria-hidden="true">${ch === "Chợ" ? marketPlace() : ch === "Siêu thị" ? superPlace() : appPlace()}</svg>`;

  /* ================================================================ steps */
  function stIntro() {
    setStep(0); clearBubbles(); scene("home"); gsap.set($(".g-think", svg), { opacity: 0 }); gsap.set(an(), { opacity: 1 }); anAt(-90, 470, 1.15); face(1); carry(false); phoneInHand(false); pose("");
    const tl = run();
    walk(tl, 250, 1.6, .3);
    tl.call(() => pose("waving"), null, 2).call(() => bubble(286, 250, "Chào bạn, mình là An, sinh viên UEH. Tuần này bạn đi chợ cùng mình nhé!"), null, 2.1);
    const card = panel(`<p class="g-kicker">Đến lượt bạn</p><h2 class="g-title">Đi chợ cùng An</h2>
      <p class="g-text">Bạn chọn quận, chọn món và nơi mua. An sẽ đi mua cho bạn xem ở chợ, ở siêu thị và qua app, rồi so sánh ba nơi bằng giá nhóm em đã ghi.</p>
      <ol class="g-plan"><li>Chọn quận</li><li>Chọn món</li><li>Chọn nơi mua</li><li>So sánh</li></ol>`,
      `<button type="button" class="cta big" data-go="district">Bắt đầu</button>`);
    $("[data-go]", card).addEventListener("click", stDistrict);
  }

  function stDistrict() {
    setStep(1); clearBubbles(); scene("map"); gsap.to(an(), { opacity: 0, duration: .3 });
    const tl = run();
    Object.assign(MK, { x: 400, y: 600, s: 1 }); mkApply();
    tl.from($$(".g-d", svg), { scale: .85, opacity: 0, transformOrigin: "50% 50%", stagger: .15, duration: .7, ease: "back.out(1.6)" }, 0)
      .to(MK, { y: 520, duration: .6, ease: "back.out(2)", onUpdate: mkApply }, .4)
      .to(MK, { y: 506, yoyo: true, repeat: 3, duration: .35, ease: "sine.inOut", onUpdate: mkApply }, 1);
    const card = panel(`<p class="g-kicker">Bước 1/4</p><h2 class="g-title">An sống ở quận nào?</h2>
      <p class="g-text">Bấm vào một quận trên bản đồ. Nhóm em ghi giá ở chợ, siêu thị và app của cả hai quận.</p>
      <div class="g-choices">${["Quận 3", "Quận 10"].map(d => `<button type="button" class="g-choice" data-d="${d}"><span>${d}<small>${d === "Quận 3" ? "Chợ Bàn Cờ, UEH cơ sở A" : "Chợ Nguyễn Tri Phương, UEH cơ sở B"}</small></span></button>`).join("")}</div>`);
    $$("[data-d]", card).forEach(b => b.addEventListener("click", () => chooseDistrict(b.dataset.d)));
  }
  function chooseDistrict(d) {
    if (!d || G.dataset.busy) return;
    if (S.district !== d) S.tried = {};
    S.district = d;
    G.dataset.busy = "1";
    $$("[data-d]", panelBox).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.d === d)));
    const [tx, ty] = d === "Quận 3" ? [176, 180] : [592, 176];
    const path = $$(".g-d", svg).find(p => p.dataset.d === d);
    const tl = run(() => { delete G.dataset.busy; stFoods(); });
    tl.to(MK, { motionPath: { path: [{ x: (MK.x + tx) / 2, y: 300 }, { x: tx, y: ty }], curviness: 1.3 }, duration: .8, ease: "power2.inOut", onUpdate: mkApply }, 0)
      .to(path, { scale: 1.05, transformOrigin: "50% 50%", duration: .25, yoyo: true, repeat: 1 }, .7)
      .to(MK, { s: 1.25, duration: .2, yoyo: true, repeat: 1, onUpdate: mkApply }, .8)
      .to({}, { duration: .5 });
  }

  function stFoods() {
    setStep(2); clearBubbles(); scene("shelf"); gsap.to(an(), { opacity: 1, duration: .3 }); anAt(70, 470, 1.1); face(1); carry(false); pose("");
    drawPile(true);
    const tl = run();
    tl.from($$(".g-food", svg), { scale: 0, transformOrigin: "50% 50%", stagger: .05, duration: .45, ease: "back.out(2.2)" }, .1)
      .from($(".g-big", svg), { y: -120, opacity: 0, duration: .7, ease: "bounce.out" }, .3)
      .call(() => bubble(110, 250, "Bạn bấm vào món nào, mình bỏ món đó vào giỏ nhé!"), null, .9);
    const card = panel(`<p class="g-kicker">Bước 2/4 · ${S.district}</p><h2 class="g-title">Chọn món cho giỏ</h2>
      <p class="g-text">Bấm vào món trên quầy để bỏ vào giỏ, bấm lần nữa để lấy ra. Mỗi món 1 kg, riêng trứng là 10 quả.</p>
      <div class="g-chosen" aria-live="polite"></div>`,
      `<button type="button" class="cta" data-go="cross">Xong, đi mua</button><button type="button" class="g-link" data-all>Chọn cả 12 món</button>`);
    $("[data-go]", card).addEventListener("click", () => { if (S.foods.size) stCross(); });
    $("[data-all]", card).addEventListener("click", () => {
      const add = D.items.filter(it => !S.foods.has(it.code));
      if (!add.length) { [...S.foods].forEach(c => toggleFood(c, true)); return; }
      add.forEach((it, i) => setTimeout(() => toggleFood(it.code), REDUCED ? 0 : i * 110));
    });
    drawChosen();
  }
  function toggleFood(code, quiet) {
    const on = !S.foods.has(code);
    if (on) S.foods.add(code); else S.foods.delete(code);
    S.tried = {};                                                         // a new basket: the places must be tried again
    const g = $(`.g-food[data-code="${code}"]`, svg);
    g.setAttribute("aria-pressed", String(on));
    gsap.to($(".g-ring", g), { opacity: on ? .9 : 0, duration: .25 });
    gsap.to($(".g-tick", g), { opacity: on ? 1 : 0, scale: on ? 1 : .4, transformOrigin: "50% 50%", duration: .3, ease: "back.out(3)" });
    if (on && !REDUCED && !quiet) {
      const m = g.transform.baseVal.consolidate().matrix, tl = gsap.timeline();
      fly(code, { x: m.e + 39, y: m.f + 39 }, { x: 216, y: 372 }, 78, 40, tl, 0, .6);
      tl.call(() => drawPile(), null, .55).to($(".g-big", svg), { scaleY: .94, scaleX: 1.04, transformOrigin: "50% 100%", duration: .12, yoyo: true, repeat: 1 }, .55);
    } else drawPile();
    drawChosen();
  }
  function drawPile(first) {
    const g = $(".g-pile", svg), want = D.items.filter(it => S.foods.has(it.code)).map(it => it.code);
    const have = new Map($$("use", g).map(u => [u.dataset.code, u]));
    have.forEach((u, c) => { if (!want.includes(c)) { if (REDUCED || first) u.remove(); else gsap.to(u, { y: "-=50", opacity: 0, duration: .3, onComplete: () => u.remove() }); } });
    want.forEach((c, i) => {
      const front = i % 2, kk = Math.floor(i / 2), x = 144 + kk * 24 + front * 12, y = front ? 356 : 342;
      let u = have.get(c);
      if (!u) { u = document.createElementNS(NS, "use"); u.setAttribute("href", "#i-" + c); u.setAttribute("width", 44); u.setAttribute("height", 44); u.dataset.code = c; g.appendChild(u);
        if (!REDUCED && !first) gsap.from(u, { scale: .3, transformOrigin: "50% 50%", duration: .35, ease: "back.out(3)" }); }
      u.setAttribute("x", x); u.setAttribute("y", y);
    });
  }
  function drawChosen() {
    const box = $(".g-chosen", panelBox);
    if (!box) return;
    const list = items();
    box.innerHTML = list.length ? list.map(it => `<svg viewBox="0 0 64 64" aria-label="${it.name}"><use href="#i-${it.code}"/></svg>`).join("") + `<span class="none">${list.length} món</span>`
      : `<span class="none">Giỏ đang trống</span>`;
    const go = $("[data-go]", panelBox);
    if (go) go.disabled = !list.length;
    const all = $("[data-all]", panelBox);
    if (all) all.textContent = list.length === D.items.length ? "Bỏ hết" : "Chọn cả 12 món";
  }

  function stCross() {
    setStep(3); clearBubbles(); scene("cross"); gsap.set(an(), { opacity: 1 }); anAt(400, 598, 1); face(1); carry(false); phoneInHand(false); pose("");
    const tried = Object.keys(S.tried).length;
    CHS.forEach(ch => {
      const b = $(`.g-badge[data-ch="${ch}"]`, svg), t = S.tried[ch];
      $("text", b).textContent = t ? (t.total == null ? "thiếu giá" : vnd(t.total) + "đ") : "";
      gsap.set(b, { opacity: t ? 1 : 0 });
    });
    const tl = run();
    tl.from($$(".g-place .g-pin", svg), { y: 60, scale: .6, opacity: 0, transformOrigin: "50% 100%", stagger: .14, duration: .65, ease: "back.out(1.8)" }, 0)
      .fromTo(A, { y: 680 }, { y: 598, duration: .6, ease: "power2.out", onUpdate: anApply, immediateRender: true }, .2)
      .call(() => bubble(410, 396, tried ? (tried === 3 ? "Đủ ba nơi rồi, mình so sánh thôi!" : "Mình thử thêm nơi khác nhé!") : "Mình mua ở đâu đây?"), null, .9);
    const card = panel(`<p class="g-kicker">Bước 3/4 · ${S.district} · ${S.foods.size} món</p><h2 class="g-title">${tried ? "Thử nơi khác" : "An mua ở đâu?"}</h2>
      <p class="g-text">Bấm vào chợ, siêu thị hoặc app. Thử đủ ba nơi để so sánh giá của cùng một giỏ.</p>
      <div class="g-choices">${CHS.map(ch => { const t = S.tried[ch]; return `<button type="button" class="g-choice${t ? " tried" : ""}" data-ch="${ch}">${icon(ch)}<span>${ch === "App" ? "App giao hàng" : NAME[ch]}<small>${t ? "Đã thử: " + (t.total == null ? "thiếu giá" : vnd(t.total) + " đồng") : ch === "Chợ" ? market() : ch === "Siêu thị" ? "Siêu thị ở " + S.district : "Đặt qua app, có phí giao"}</small></span></button>`; }).join("")}</div>`,
      tried ? `<button type="button" class="${tried === 3 ? "cta" : "cta ghost"}" data-go="compare">So sánh ${tried === 3 ? "ba" : tried === 2 ? "hai" : ""} nơi</button>` : "");
    $$("[data-ch]", card).forEach(b => b.addEventListener("click", () => choosePlace(b.dataset.ch)));
    const cmp = $("[data-go]", card);
    if (cmp) { if (tried === 1) cmp.textContent = "So sánh ngay"; cmp.addEventListener("click", stCompare); }
  }
  function choosePlace(ch) {
    if (G.dataset.busy) return;
    G.dataset.busy = "1"; clearBubbles();
    const tl = run(() => { delete G.dataset.busy; shop(ch); });
    const px = PLACE_X[ch];
    tl.call(() => face(px >= 400 ? 1 : -1), null, 0);
    point(tl, 0);
    tl.to($(`.g-place[data-ch="${ch}"] .g-pin`, svg), { scale: 1.08, transformOrigin: "50% 100%", yoyo: true, repeat: 1, duration: .25 }, .1);
    walk(tl, px, 1.1, .5, 430, .62);
    tl.to(an(), { opacity: 0, duration: .25 }, 1.4);
  }

  /* ---------------------------------------------------------------- the three ways to shop */
  function shop(ch) {
    clearBubbles();
    S.weeks.add(S.week);
    if (ch === "Chợ") shopMarket(); else if (ch === "Siêu thị") shopSuper(); else shopApp();
  }
  function receiptCard(ch, r, live) {
    const wk = D.weeks[S.week - 1];
    const head = ch === "Chợ" ? `<h3>Giấy ghi của cô bán hàng</h3><p class="meta">${market()} · tuần ${S.week}</p>`
      : ch === "Siêu thị" ? `<h3>HOÁ ĐƠN</h3><p class="meta">Siêu thị ở ${S.district} · tuần ${S.week}</p>`
        : `<h3>Đơn hàng qua app</h3><p class="meta">Giá ghi trên ${wk.app} · ${S.district} · tuần ${S.week}</p>`;
    const lines = live ? "" : r.lines.map(l => lineHTML(l)).join("") + (r.fee ? `<div class="ln"><span>Phí giao</span><span>${vnd(r.fee)}đ</span></div>` : "");
    return `<div class="rcpt ${ch === "Chợ" ? "cho" : ch === "Siêu thị" ? "st" : "app"}">${head}<div class="lines">${lines}</div>
      <div class="tot"><span>Tổng</span><span class="sum">${live ? "0đ" : r.total == null ? "thiếu giá" : vnd(r.total) + "đ"}</span></div>${ch === "Siêu thị" ? `<div class="bar"></div>` : ""}</div>`;
  }
  const lineHTML = l => `<div class="ln${l.amount == null ? " miss" : ""}"><span>${l.it.name} ${qtyText(l.it)}</span><span>${l.amount == null ? "không có giá" : vnd(l.amount) + "đ"}</span></div>`;
  function shopPanel(ch, r, live) {
    const card = panel(`<p class="g-kicker">Bước 3/4 · An đang mua ở ${LOW[ch]}</p>${receiptCard(ch, r, live)}`, "");
    return card;
  }
  function addLine(card, l) {
    const box = $(".lines", card), d = document.createElement("div");
    d.innerHTML = lineHTML(l);
    const n = d.firstElementChild;
    box.appendChild(n);
    if (!REDUCED) gsap.from(n, { opacity: 0, x: -14, duration: .3 });
  }
  function countSum(card, to, tl, at, dur = .5) {
    const o = { v: 0 }, el = $(".sum", card);
    tl.to(o, { v: to, duration: dur, ease: "power1.out", onUpdate: () => { el.textContent = vnd(o.v) + "đ"; } }, at);
  }
  function afterShop(ch, r) {
    S.tried[ch] = { total: r.total, week: S.week };
    clearBubbles();
    const tried = Object.keys(S.tried).length;
    const card = panel(`<p class="g-kicker">Bước 3/4 · Đã thử ${tried}/3 nơi</p>${receiptCard(ch, r, false)}`,
      tried < 3 ? `<button type="button" class="cta" data-go="cross">Thử nơi khác</button><button type="button" class="g-link" data-go2="compare">So sánh luôn</button>`
        : `<button type="button" class="cta" data-go="compare">So sánh ba nơi</button>`);
    $("[data-go]", card).addEventListener("click", () => (tried < 3 ? stCross() : stCompare()));
    const c2 = $("[data-go2]", card);
    if (c2) c2.addEventListener("click", stCompare);
  }

  function shopMarket() {
    const r = receipt("Chợ", S.week - 1);
    scene("market"); gsap.set(an(), { opacity: 1 }); anAt(-90, 470, 1.12); face(1); carry(true); pose("");
    const cnt = $(".g-counter", svg);
    cnt.innerHTML = r.lines.map((l, i) => `<use href="#i-${l.it.code}" data-code="${l.it.code}" x="${468 + Math.floor(i / 2) * 50 + (i % 2) * 24}" y="${i % 2 ? 302 : 292}" width="44" height="44"${l.amount == null ? ' opacity=".35"' : ""}/>`).join("");
    const card = shopPanel("Chợ", r, true);
    const tl = run(() => afterShop("Chợ", r), true);
    walk(tl, 340, 2, .2);
    tl.from($$("use", cnt), { y: "-=40", opacity: 0, stagger: .05, duration: .35, ease: "back.out(2)" }, .6)
      .call(() => bubble(320, 236, "Cô ơi, cô bán cho con mấy món này nhé!"), null, 2.3)
      .call(() => bubble(690, 210, "Có liền con ơi!", "right vendor"), null, 3.3)
      .to($(".g-vendor", svg), { y: "-=8", yoyo: true, repeat: 3, duration: .18 }, 3.3);
    let at = 4.2, sum = 0;
    const bk = handBasketAt(340, 470, 1.12, 1);
    r.lines.forEach((l, i) => {
      const u = $$("use", cnt)[i], x = +u.getAttribute("x") + 22, y = +u.getAttribute("y") + 22;
      if (l.amount == null) { tl.call(() => addLine(card, l), null, at); at += .25; return; }
      tl.set(u, { opacity: 0 }, at);
      fly(l.it.code, { x, y }, bk, 44, 26, tl, at, .5);
      pop(x, y - 20, "+" + k(l.amount), tl, at + .1);
      tl.call(() => addLine(card, l), null, at + .3);
      countSum(card, (sum += l.amount), tl, at + .3, .3);
      tl.to(A, { y: 466, yoyo: true, repeat: 1, duration: .08, onUpdate: anApply }, at + .48);
      at += .34;
    });
    tl.call(() => { clearBubbles(); bubble(690, 210, r.total == null ? `Món ${listVi(r.miss)} tuần này cô không có giá nghen.` : `Của con hết ${vnd(r.total)} đồng nha!`, "right vendor"); }, null, at + .3)
      .call(() => pose("waving"), null, at + .9)
      .to({}, { duration: 1.6 }, at + .9);
  }
  const handBasketAt = (x, y, s, dir) => ({ x: x + s * 18 * dir, y: y - s * 64 });

  function shopSuper() {
    const r = receipt("Siêu thị", S.week - 1);
    scene("super"); gsap.set(an(), { opacity: 1 }); anAt(200, 470, 1.1); face(1); carry(false); pose("walking");
    const aisle = $(".g-aisle", svg), shelf = $(".g-shelfitems", svg), load = $(".g-cartload", svg), cart = $(".g-cart", svg);
    gsap.set(aisle, { x: 0 }); gsap.set(cart, { x: 262, y: 470 }); load.innerHTML = "";
    shelf.innerHTML = r.lines.map((l, i) => { const u = Math.floor(i / 3), sy = [240, 330, 420][i % 3]; return `<use href="#i-${l.it.code}" x="${40 + u * 340 + 110}" y="${sy - 56}" width="56" height="56"${l.amount == null ? ' opacity=".35"' : ""}/>`; }).join("");
    const card = shopPanel("Siêu thị", r, true);
    const tl = run(() => afterShop("Siêu thị", r), true), pan = 1080, dur = 6.2, cartX = 312;
    tl.call(() => bubble(250, 230, "Đi một vòng siêu thị nào!"), null, .2)
      .to(aisle, { x: -pan, duration: dur, ease: "none" }, .6)
      .to(cart, { y: 467, yoyo: true, repeat: Math.round(dur / .16), duration: .08 }, .6)
      .call(() => clearBubbles(), null, 2);
    let sum = 0, n = 0;
    r.lines.forEach((l, i) => {
      const uEl = $$("use", shelf)[i], X = +uEl.getAttribute("x") + 28, Y = +uEl.getAttribute("y") + 28;
      const at = .6 + Math.min(1, Math.max(0, (X - cartX - 20) / pan)) * dur + (X < cartX + 20 ? i * .25 : 0);
      if (l.amount == null) { tl.call(() => addLine(card, l), null, at); return; }
      const ox = X - Math.min(pan, Math.max(0, (at - .6) / dur * pan));
      tl.set(uEl, { opacity: 0 }, at);
      const slot = n++, tx = 262 + 22 + (slot % 4) * 18, ty = 470 - 60 - Math.floor(slot / 4) * 12;
      fly(l.it.code, { x: ox, y: Y }, { x: tx, y: ty }, 56, 30, tl, at, .5);
      tl.call(() => {
        const u = document.createElementNS(NS, "use");
        u.setAttribute("href", "#i-" + l.it.code); u.setAttribute("x", 22 + (slot % 4) * 18 - 15); u.setAttribute("y", -76 - Math.floor(slot / 4) * 12); u.setAttribute("width", 30); u.setAttribute("height", 30);
        load.appendChild(u);
        addLine(card, l);
      }, null, at + .5);
      countSum(card, (sum += l.amount), tl, at + .5, .3);
    });
    const end = .6 + dur;
    tl.call(() => pose(""), null, end)
      .call(() => bubble(668, 300, r.total == null ? `Món ${listVi(r.miss)} tuần này không có giá ạ.` : `Của bạn hết ${vnd(r.total)} đồng ạ!`, "right"), null, end + .3)
      .fromTo($(".bar", card), { scaleX: 0, transformOrigin: "0 50%" }, { scaleX: 1, duration: .6 }, end + .4)
      .call(() => pose("waving"), null, end + 1)
      .to({}, { duration: 1.5 }, end + 1);
  }

  function shopApp() {
    const r = receipt("App", S.week - 1), wk = D.weeks[S.week - 1];
    scene("room"); gsap.set(an(), { opacity: 1 }); anAt(300, 470, 1.15); face(1); carry(false); phoneInHand(false); pose("");
    const ph = $(".g-phone", G), sc = $(".g-screen", ph);
    sc.innerHTML = `<div class="ph-head"><b>Đi chợ online</b><small>Giá ghi trên ${wk.app}, ${S.district}, tuần ${S.week}</small>
        <span class="ph-cart"><svg viewBox="0 0 24 24"><path d="M3 4h3l2.4 10.2a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 2-1.5L21 8H7" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="20" r="1.6" fill="#fff"/><circle cx="18" cy="20" r="1.6" fill="#fff"/></svg><i>0</i></span></div>
      <div class="ph-list">${r.lines.map(l => `<div class="ph-row${l.amount == null ? " miss" : ""}" data-code="${l.it.code}"><svg viewBox="0 0 64 64"><use href="#i-${l.it.code}"/></svg><b>${l.it.name}<br><span>${qtyText(l.it)}</span></b><span>${l.amount == null ? "hết giá" : vnd(l.amount) + "đ"}</span><span class="ph-add">+</span></div>`).join("")}</div>
      <div class="ph-sheet"><div class="ln"><span>Tiền hàng</span><span>${vnd(r.sub)}đ</span></div><div class="ln"><span>Phí giao</span><span>${vnd(r.fee)}đ</span></div>
        <div class="ln t"><span>Tổng</span><span>${r.total == null ? "thiếu giá" : vnd(r.total) + "đ"}</span></div><div class="ph-order">Đặt hàng</div></div>
      <span class="ph-finger"></span>`;
    const psvg = $(".g-phone-svg", svg), PH = { x: 318, y: 360, s: 1 };
    const phApply = () => psvg.setAttribute("transform", `translate(${PH.x} ${PH.y}) scale(${PH.s})`);
    phApply(); gsap.set(psvg, { opacity: 0 });
    gsap.set(ph, { display: "none", opacity: 0 });
    const card = panel(`<p class="g-kicker">Bước 3/4 · An đang mua qua app</p><p class="g-text">An mở app, bỏ từng món vào giỏ rồi đặt hàng. Giá trên app chưa gồm phí giao, phí giao được cộng khi đặt.</p>`, "");
    void card;
    const tl = run(() => { ph.style.display = "none"; afterShop("App", r); }, true);
    tl.call(() => bubble(330, 230, "Đặt qua app cho nhanh!"), null, .2)
      .call(() => phoneInHand(true), null, .5)
      .to($(".an-body .arm-front", svg), { rotation: -60, transformOrigin: "50% 6%", duration: .3 }, .5)
      .set(psvg, { opacity: 1 }, 1.2).call(() => phoneInHand(false), null, 1.2)
      .to(PH, { x: 400, y: 300, s: 11, duration: 1, ease: "power3.inOut", onUpdate: phApply }, 1.3)
      .to([an(), ...$$('.g-bg[data-bg="room"] > :not(.g-phone-svg)', svg)], { opacity: .25, duration: .6 }, 1.3)
      .call(() => clearBubbles(), null, 1.3)
      .call(placePhone, null, 2.2).set(ph, { display: "block" }, 2.2).to(ph, { opacity: 1, duration: .3 }, 2.2).set(psvg, { opacity: 0 }, 2.5)
      .from($$(".ph-row", sc), { x: 40, opacity: 0, stagger: .05, duration: .3 }, 2.4);
    let at = 3.2, n = 0;
    r.lines.forEach(l => {
      if (l.amount == null) return;
      const c = l.it.code;
      tl.call(() => tap($(`.ph-row[data-code="${c}"] .ph-add`, sc), sc), null, at)
        .call(() => {
          const row = $(`.ph-row[data-code="${c}"]`, sc); row.classList.add("in"); $(".ph-add", row).textContent = "ok";
          const b = $(".ph-cart i", sc); b.textContent = ++n;
          if (!REDUCED) gsap.fromTo(b, { scale: 1.8 }, { scale: 1, duration: .35, ease: "back.out(3)" });
        }, null, at + .22);
      at += .34;
    });
    tl.to($(".ph-sheet", sc), { yPercent: -105, duration: .5, ease: "power3.out" }, at + .2)
      .call(() => tap($(".ph-order", sc), sc), null, at + 1.1)
      .call(() => { const o = $(".ph-order", sc); o.classList.add("done"); o.textContent = r.total == null ? "Thiếu giá, chưa đặt được" : "Đã đặt hàng"; }, null, at + 1.35)
      .to(ph, { opacity: 0, duration: .4 }, at + 2.2)
      .set(ph, { display: "none" }, at + 2.6)
      .call(() => { scene("home", .4); gsap.set($(".g-think", svg), { opacity: 0 }); gsap.set([an(), ...$$('.g-bg[data-bg="room"] > *', svg)], { opacity: 1 }); anAt(560, 470, 1.05); face(1); pose(""); gsap.set($(".an-body .arm-front", svg), { rotation: 0 }); }, null, at + 2.6)
      .fromTo($(".g-bike", svg), { x: 900 }, { x: 640, duration: 1.4, ease: "power2.out" }, at + 3)
      .fromTo($$(".g-wheel", svg), { rotation: 0 }, { rotation: -720, transformOrigin: "50% 50%", duration: 1.4, ease: "power2.out" }, at + 3)
      .fromTo($(".g-parcel", svg), { x: 720, y: 400, opacity: 0 }, { opacity: 1, duration: .2 }, at + 4.4)
      .to($(".g-parcel", svg), { x: 600, y: 390, duration: .6, ease: "power2.inOut" }, at + 4.6)
      .call(() => { pose("waving"); bubble(560, 250, r.total == null ? "Tuần này app thiếu giá vài món." : `Cả phí giao là ${vnd(r.total)} đồng.`); }, null, at + 5.2)
      .to({}, { duration: 1.6 }, at + 5.2)
      .to($(".g-bike", svg), { x: 900, duration: .1 }, at + 6.8).set($(".g-parcel", svg), { opacity: 0 }, at + 6.8);
  }
  function placePhone() {                                                // over the stage on a computer, larger than the stage on a phone
    const ph = $(".g-phone", G), r = stage.getBoundingClientRect(), short = window.innerHeight < 560;
    const small = window.innerWidth < 900 && !short;
    ph.classList.toggle("wide", short);                                    // sideways phone: a wider screen so that the rows stay readable
    const h = small ? Math.min(window.innerHeight * .8, 660) : short ? window.innerHeight * .9 : r.height * .93;
    ph.style.height = h + "px";
    ph.style.top = (small ? Math.max(58, (window.innerHeight - h) / 2) : short ? window.innerHeight * .05 : r.top + r.height * .035) + "px";
    ph.style.left = (small ? window.innerWidth / 2 : r.left + r.width / 2) + "px";
  }
  function tap(target, screen) {
    if (!target || REDUCED) return;
    const f = $(".ph-finger", screen), a = target.getBoundingClientRect(), b = screen.getBoundingClientRect();
    gsap.to(f, { left: a.left - b.left + a.width / 2, top: a.top - b.top + a.height / 2, opacity: 1, duration: .16, ease: "power2.out" });
    gsap.fromTo(f, { scale: 1 }, { scale: .7, duration: .08, yoyo: true, repeat: 1, delay: .16 });
    gsap.fromTo(target, { scale: 1 }, { scale: 1.25, duration: .1, yoyo: true, repeat: 1, delay: .18 });
  }

  /* ---------------------------------------------------------------- compare the three places */
  function stCompare() {
    setStep(4); clearBubbles(); stop(); scene("compare"); gsap.to(an(), { opacity: 0, duration: .3 });
    S.weeks.add(S.week);
    const tl = run();
    drawTowers(tl, true);
    panelCompare();
  }
  function scaleTop() {
    let top = 1;
    D.weeks.forEach((w, wi) => CHS.forEach(ch => { const r = receipt(ch, wi); if (r.total != null) top = Math.max(top, r.total); }));
    return top;
  }
  function drawTowers(tl, first) {
    const r = allAt(S.week - 1), best = bestOf(r), top = scaleTop(), H = 300;
    CHS.forEach((ch, i) => {
      const g = $(`.g-tower[data-ch="${ch}"]`, svg), cx = [170, 400, 630][i], v = r[ch];
      const hs = v.total == null ? 0 : ((v.total - v.fee) / top) * H, hf = v.total == null ? 0 : (v.fee / top) * H, topY = 470 - hs - hf;
      const tw = $(".g-tw", g), tf = $(".g-tf", g), cap = $(".g-cap", g), lb = $(".g-lb", g), sub = $(".g-sub", g);
      const dur = REDUCED ? 0 : first ? 1.1 : .6, at = first ? .2 + i * .25 : 0;
      tl.to(tw, { attr: { y: 470 - hs, height: hs }, duration: dur, ease: "power3.out" }, at);
      if (tf) tl.to(tf, { attr: { y: topY, height: hf }, duration: dur, ease: "power3.out" }, at);
      tl.to(cap, { attr: { cy: topY }, duration: dur, ease: "power3.out" }, at);
      tl.to(lb, { attr: { y: topY - 18 }, duration: dur, ease: "power3.out" }, at);
      const o = { v: +(lb.dataset.v || 0) };
      if (v.total == null) tl.call(() => { lb.textContent = "thiếu giá"; lb.dataset.v = 0; }, null, at);
      else tl.to(o, { v: v.total, duration: dur, ease: "power1.out", onUpdate: () => { lb.textContent = vnd(o.v) + "đ"; }, onComplete: () => { lb.dataset.v = v.total; } }, at);
      sub.textContent = ch === "App" && v.total != null ? `gồm ${k(v.fee)} phí giao` : v.total == null ? `thiếu ${listVi(v.miss)}` : "";
    });
    const st = $(".g-stamp", svg);
    if (best && CHS.every(c => r[c].total != null)) {
      const i = CHS.indexOf(best), cx = [170, 400, 630][i], h = ((r[best].total - r[best].fee) / top) * H + (r[best].fee / top) * H;
      const at = first ? 1.4 : .1, ks = { s: 2.6 }, inner = $(".g-stamp-s", st);
      tl.call(() => st.setAttribute("transform", `translate(${cx} ${Math.max(70, 470 - h - 98)})`), null, at)
        .fromTo(st, { opacity: 0 }, { opacity: 1, duration: .15 }, at)
        .fromTo(ks, { s: 2.6 }, { s: 1, duration: .35, ease: "power4.in", onUpdate: () => inner.setAttribute("transform", `scale(${ks.s})`) }, at)
        .to(stage, { x: 4, yoyo: true, repeat: 3, duration: .04 }, first ? 1.75 : .45).set(stage, { x: 0 });
    } else tl.to(st, { opacity: 0, duration: .2 }, 0);
  }
  function compareText() {
    const r = allAt(S.week - 1), best = bestOf(r), full = CHS.every(c => r[c].total != null);
    let head, save = "";
    if (!best) head = `Tuần ${S.week} chưa có đủ giá cho giỏ này ở cả ba nơi.`;
    else if (!full) head = `Tuần ${S.week}, ${listVi(CHS.filter(c => r[c].total == null).map(c => LOW[c]))} thiếu giá ${listVi([...new Set(CHS.flatMap(c => r[c].miss))])}. Trong các nơi còn lại, ${LOW[best]} rẻ nhất, hết ${vnd(r[best].total)} đồng.`;
    else {
      head = `Ở ${S.district}, tuần ${S.week}, giỏ ${S.foods.size} món rẻ nhất ở ${LOW[best]}, hết ${vnd(r[best].total)} đồng.`;
      if (best !== "App") {
        const d = r.App.total - r[best].total;
        save = `<div class="g-save"><svg viewBox="0 0 60 60" aria-hidden="true"><use href="#coin"/></svg><span>So với mua qua app, kể cả phí giao, mua ở ${LOW[best]} tiết kiệm <b>${vnd(d)}</b> đồng mỗi tuần, khoảng ${vnd(d * 4)} đồng nếu 4 tuần đều như vậy.</span></div>`;
      }
    }
    return { head, save };
  }
  function panelCompare() {
    const { head, save } = compareText();
    const gaps = D.weeks.map((w, wi) => CHS.some(c => receipt(c, wi).total == null));
    const card = panel(`<p class="g-kicker">Bước 4/4 · ${S.district} · ${S.foods.size} món</p><h2 class="g-title">So sánh ba nơi</h2>
      <p class="g-head" aria-live="polite">${head}</p><div class="g-savebox">${save}</div>
      <div class="g-weekrow"><span class="flabel">Xem tuần khác</span><button type="button" class="g-play">Chạy 8 tuần</button></div>
      <div class="g-weeks" role="group" aria-label="Chọn tuần">${D.weeks.map((w, wi) => `<button type="button" class="g-wk${gaps[wi] ? " gap" : ""}" data-w="${w.week}" aria-label="Tuần ${w.week}${gaps[wi] ? ", thiếu giá" : ""}"><svg viewBox="0 0 60 110" aria-hidden="true"><use href="#lantern"/></svg><span>T${w.week}${gaps[wi] ? "*" : ""}</span></button>`).join("")}</div>
      <p class="g-text" style="font-size:13px;margin:0 0 14px">Cột tiền bắt đầu từ 0. Phần xám trên cột app là phí giao. Tuần có dấu * thiếu giá ở ít nhất một nơi.</p>`,
      `<button type="button" class="cta" data-go="quiz">Xong</button><button type="button" class="g-link" data-back>Đổi món hoặc nơi mua</button>`);
    $$("[data-w]", card).forEach(b => b.addEventListener("click", () => { stop(); setWeek(+b.dataset.w); }));
    $(".g-play", card).addEventListener("click", () => (playTimer ? stop() : play()));
    $("[data-go]", card).addEventListener("click", () => { stop(); stQuiz(0); });
    $("[data-back]", card).addEventListener("click", () => { stop(); stFoods(); });
    markWeeks();
  }
  function markWeeks() {
    $$(".g-wk", panelBox).forEach(b => {
      const w = +b.dataset.w;
      b.classList.toggle("on", w === S.week); b.classList.toggle("off", w > S.week); b.setAttribute("aria-pressed", String(w === S.week));
    });
  }
  function setWeek(w) {
    S.week = w; S.weeks.add(w);
    drawTowers(gsap.timeline(), false);
    const { head, save } = compareText();
    const h = $(".g-head", panelBox), sb = $(".g-savebox", panelBox);
    if (h) h.textContent = head;
    if (sb) sb.innerHTML = save;
    markWeeks();
    const lt = $(`.g-wk[data-w="${w}"] svg`, panelBox);
    if (lt && !REDUCED) gsap.fromTo(lt, { rotation: -14 }, { rotation: 0, duration: 1.1, ease: "elastic.out(1, .3)", transformOrigin: "50% 0" });
  }
  function play() {
    if (S.week >= D.weeks.length) setWeek(1);
    playTimer = setInterval(() => { if (S.week >= D.weeks.length) { stop(); return; } setWeek(S.week + 1); }, REDUCED ? 1800 : 1500);
    const p = $(".g-play", panelBox); if (p) p.textContent = "Dừng";
  }
  function stop() {
    if (playTimer) clearInterval(playTimer);
    playTimer = null;
    const p = $(".g-play", panelBox); if (p) p.textContent = "Chạy 8 tuần";
  }

  /* ---------------------------------------------------------------- two quick questions, timed for the M10 test */
  function quizWeek() {
    if (CHS.every(c => receipt(c, S.week - 1).total != null)) return S.week;
    for (let w = D.weeks.length; w >= 1; w--) if (CHS.every(c => receipt(c, w - 1).total != null)) return w;
    return null;
  }
  function stQuiz(q) {
    setStep(5); clearBubbles(); scene("home"); gsap.to(an(), { opacity: 1, duration: .3 }); anAt(250, 470, 1.15); face(1); carry(false); pose("");
    const w = quizWeek();
    if (w == null) { finishTasks(); return stFinale(); }
    const r = allAt(w - 1), best = bestOf(r);
    const t = run();
    t.fromTo($(".g-think", svg), { opacity: 0, scale: .4, svgOrigin: "250 220" }, { opacity: 1, scale: 1, duration: .5, ease: "back.out(2)" }, .1)
      .to($(".g-think text", svg), { y: -6, yoyo: true, repeat: 5, duration: .4, ease: "sine.inOut" }, .6);
    let qText, opts, answer;
    if (q === 0) {
      qText = `Ở ${S.district}, tuần ${w}, An nên mua giỏ này ở đâu để rẻ nhất?`;
      opts = CHS.map(c => ({ v: c, html: `${icon(c)}<span>${c === "App" ? "App giao hàng" : NAME[c]}</span>` }));
      answer = best;
    } else {
      const d = r.App.total - r[best].total, other = CHS.filter(c => c !== best && c !== "App")[0];
      const cands = [about(d), about(Math.abs(r[other].total - r[best].total)), about(r.App.fee)];
      const seen = new Set();
      opts = cands.map((v, i) => { let x = v; while (seen.has(x)) x = about((Math.round(d / 1000) + 50 * (i + 1)) * 1000); seen.add(x); return x; })
        .map(v => ({ v, html: `<span>${v}</span>` }));
      opts = [opts[1], opts[0], opts[2]];
      answer = about(d);
      qText = `So với mua qua app, kể cả phí giao, mua ở ${LOW[best]} giúp An tiết kiệm bao nhiêu mỗi tuần?`;
      if (best === "App") { finishTasks(); return stFinale(); }
    }
    const t0 = performance.now();
    const card = panel(`<p class="g-kicker">Câu hỏi nhanh ${q + 1}/2</p><h2 class="g-title" style="font-size:22px">${qText}</h2>
      <p class="g-text">Bạn cứ trả lời theo những gì vừa thấy, không cần quay lại xem.</p>
      <div class="g-choices">${opts.map(o => `<button type="button" class="g-choice" data-v="${o.v}">${o.html}</button>`).join("")}</div>`,
      TEST ? "" : `<button type="button" class="g-link" data-skip>Bỏ qua câu này</button>`);
    const done = (v, skipped) => {
      S.tasks[q] = { id: "t" + (q + 1), answer: skipped ? "" : v, correct: !skipped && v === answer, skipped: !!skipped, seconds: Math.round((performance.now() - t0) / 100) / 10 };
      if (q === 0) stQuiz(1); else { finishTasks(); stFinale(); }
    };
    $$("[data-v]", card).forEach(b => b.addEventListener("click", () => { b.setAttribute("aria-pressed", "true"); setTimeout(() => done(b.dataset.v, false), REDUCED ? 0 : 260); }));
    const sk = $("[data-skip]", card);
    if (sk) sk.addEventListener("click", () => done("", true));
  }
  function finishTasks() {
    const tried = Object.keys(S.tried).length;
    S.tasks[2] = { id: "t3", answer: `${S.district} · ${S.foods.size} món · ${tried} nơi · ${S.weeks.size} tuần`.slice(0, 80), correct: tried === 3, skipped: false,
      seconds: Math.round((performance.now() - S.t0) / 100) / 10 };
    window.P10.test.set({ tasks: S.tasks.filter(Boolean), m9done: true });
    document.dispatchEvent(new CustomEvent("p10:tasks"));
  }

  /* ---------------------------------------------------------------- the end of the game opens the review */
  function stFinale() {
    setStep(5); clearBubbles(); scene("kitchen"); gsap.to(an(), { opacity: 1, duration: .3 }); anAt(560, 470, 1.15); face(-1); carry(false); pose("");
    S.done = true;
    const w = quizWeek(), r = w ? allAt(w - 1) : null, best = r && bestOf(r);
    const tl = run();
    tl.call(() => { pose("waving"); bubble(560, 250, "Cảm ơn bạn đã đi chợ cùng mình!", "right"); }, null, .4);
    rain(tl);
    const sum = best && best !== "App" ? `<p class="g-text">Ở ${S.district}, tuần ${w}, giỏ ${S.foods.size} món của bạn rẻ nhất ở ${LOW[best]}. Mua qua app tốn thêm ${vnd(r.App.total - r[best].total)} đồng, kể cả phí giao.</p>` : "";
    const card = panel(`<p class="g-kicker">Xong rồi</p><h2 class="g-title">An đã có giỏ đồ ăn cho tuần này</h2>${sum}
      <p class="g-text"><b>Bước cuối:</b> bạn chấm điểm và góp ý cho trang này, mất khoảng hai phút.</p>
      ${TEST ? `<div class="g-count"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="none" stroke="#F1E3C3" stroke-width="5"/><circle class="arc" cx="20" cy="20" r="16" fill="none" stroke="#F36FA9" stroke-width="5" stroke-linecap="round" stroke-dasharray="100.5" stroke-dashoffset="0"/></svg><span>Phiếu đánh giá mở sau <b class="n">5</b> giây</span></div>` : ""}`,
      `<button type="button" class="cta big" data-go="review">Đánh giá ngay</button>${TEST ? "" : `<button type="button" class="g-link" data-later>Để sau</button>`}`);
    $("[data-go]", card).addEventListener("click", openReview);
    const later = $("[data-later]", card);
    if (later) later.addEventListener("click", close);
    if (TEST) {
      const arc = $(".arc", card), n = $(".n", card), t0 = performance.now();
      const tick = t => {
        if (!G || !card.isConnected) return;
        const kk = Math.min(1, (t - t0) / 5000);
        arc.setAttribute("stroke-dashoffset", String(100.5 * kk)); n.textContent = Math.ceil(5 - kk * 5);
        if (kk < 1) requestAnimationFrame(tick); else openReview();
      };
      requestAnimationFrame(tick);
    }
  }
  function rain(tl) {
    const fx = $(".g-fx", svg);
    for (let i = 0; i < 14; i++) {
      const u = document.createElementNS(NS, "use");
      u.setAttribute("href", i % 3 ? "#lantern" : "#coin"); u.setAttribute("width", i % 3 ? 26 : 30); u.setAttribute("height", i % 3 ? 48 : 30);
      fx.appendChild(u);
      tl.fromTo(u, { x: 40 + Math.random() * 720, y: -60, rotation: gsap.utils.random(-30, 30) },
        { y: 120 + Math.random() * 300, rotation: gsap.utils.random(-20, 20), duration: 1.6 + Math.random(), ease: "bounce.out" }, .3 + i * .08)
        .to(u, { opacity: 0, duration: .6 }, 3.4 + i * .05).call(() => u.remove(), null, 4.2 + i * .05);
    }
  }
  let reviewing = false;
  function openReview() {
    if (reviewing || !window.P10Review) return;
    reviewing = true;
    window.P10Review.open({
      forced: TEST,
      onDone: () => { reviewing = false; close(true); },
      onLater: () => { reviewing = false; },
    });
  }

  /* ---------------------------------------------------------------- open and close the game */
  function open() {
    if (G) return;
    S.district = null; S.foods = new Set(); S.week = D.weeks.length; S.tried = {}; S.weeks = new Set(); S.t0 = performance.now(); S.tasks = []; S.done = false;
    G = document.createElement("div");
    G.className = "game";
    G.setAttribute("role", "dialog"); G.setAttribute("aria-modal", "true"); G.setAttribute("aria-label", "Đi chợ cùng An");
    G.innerHTML = `<header class="g-top"><span class="g-brand">Đi chợ cùng An</span>
        <ol class="g-steps">${STEPS.map((s, i) => `<li><i>${i + 1}</i><span>${s}</span></li>`).join("")}</ol>
        ${TEST ? `<span></span>` : `<button type="button" class="g-close">Đóng</button>`}</header>
      <div class="g-main"><div class="g-stage">${stageMarkup()}<button type="button" class="g-skip" hidden>Bỏ qua hình động</button></div></div>
      <div class="g-phone" aria-live="polite"><div class="g-screen"></div></div>
      <aside class="g-panel" aria-live="polite"></aside>`;
    document.body.appendChild(G);
    document.documentElement.style.overflow = "hidden";
    svg = $(".g-svg", G); stage = $(".g-stage", G); panelBox = $(".g-panel", G);
    $$(".g-bg", svg).forEach(g => { g.style.opacity = 0; g.style.visibility = "hidden"; });
    const cl = $(".g-close", G);
    if (cl) cl.addEventListener("click", () => close());
    svg.addEventListener("click", e => {
      const f = e.target.closest(".g-food"), d = e.target.closest(".g-d"), p = e.target.closest(".g-place");
      if (f && !current) toggleFood(f.dataset.code);
      else if (f && current) { current.progress(1); toggleFood(f.dataset.code); }
      if (d) chooseDistrict(d.dataset.d);
      if (p && !G.dataset.busy) choosePlace(p.dataset.ch);
    });
    svg.addEventListener("keydown", e => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const t = e.target.closest(".g-hit");
      if (!t) return;
      e.preventDefault();
      t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    G.addEventListener("keydown", e => { if (e.key === "Escape" && !TEST) close(); });
    if (!REDUCED) {
      gsap.from(G, { opacity: 0, duration: .45 });
      gsap.from(stage, { scale: .92, y: 30, duration: .7, ease: "back.out(1.4)" });
      $$(".g-cl", svg).forEach((c, i) => gsap.to(c, { x: i ? -24 : 24, duration: 5 + i, yoyo: true, repeat: -1, ease: "sine.inOut" }));
    }
    stIntro();
    setTimeout(() => { const b = $(".cta", panelBox); if (b) b.focus(); }, 500);
  }
  function close(toEnd) {
    if (!G) return;
    stop();
    if (current) { current.kill(); current = null; }
    const g = G;
    G = null;
    const fin = () => {
      g.remove();
      document.documentElement.style.overflow = "";
      if (toEnd) { const e = document.getElementById("s-ket"); if (e) e.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" }); }
    };
    if (REDUCED) fin(); else gsap.to(g, { opacity: 0, duration: .35, onComplete: fin });
  }

  /* ---------------------------------------------------------------- the door in the story */
  function build(tl, sec, Fdata, Bdata, reduced) {
    F = Fdata; D = Bdata; REDUCED = reduced;
    TEST = window.P10.test.get().mode === "test";
    const g = $(".chon-cross", sec);
    g.innerHTML = crossMarkup(false);
    $$("[data-open-game]", sec).forEach(b => b.addEventListener("click", open));
    const slot = $(".an-slot", sec), st = $(".student", slot);
    tl.from($$(".chon-cross .g-pin", sec), { y: 60, scale: .5, opacity: 0, transformOrigin: "50% 100%", stagger: .18, duration: .7, ease: "back.out(1.8)" }, .1)
      .call(() => st.classList.add("walking"), null, .4)
      .fromTo(slot, { y: 700 }, { y: +slot.dataset.y, duration: 1.4, ease: "power2.out" }, .4)
      .call(() => { st.classList.remove("walking"); st.classList.add("waving"); }, null, 1.8)
      .from($$(".chon-steps li", sec), { y: 14, opacity: 0, stagger: .1, duration: .4 }, 1);
    if (TEST) {                                                           // the gate of the test: the game opens when the reader reaches this scene
      new IntersectionObserver((es, ob) => es.forEach(e => {
        if (e.isIntersecting && !G && !window.P10.test.get().m9done) { ob.disconnect(); setTimeout(open, 700); }
      }), { threshold: .45 }).observe(sec);
    }
  }

  return { build, open };
})();
