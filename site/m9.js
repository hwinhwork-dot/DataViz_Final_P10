/* M9 basket tool of the website.
   The reader picks foods and amounts, a district, a week and the app fee; the tool adds up the
   basket at the wet market, the supermarket and the app with the prices in data/m9_basket.json,
   which tools/build_site.py writes from data/clean/. A week with a missing price stays empty. */
(function () {
  "use strict";
  const tool = document.getElementById("tool");
  if (!tool) return;

  const COLOR = { "Chợ": "#B85C38", "Siêu thị": "#1F3D55", "App": "#9BBDD6" };
  const LOW = { "Chợ": "chợ", "Siêu thị": "siêu thị", "App": "app" };
  const LIGHT = "#D9D9D9", INK = "#1A1A1A", INK2 = "#4A4740", RULE = "#E6E0D4";
  const SVGNS = "http://www.w3.org/2000/svg";
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nf = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
  const vnd = x => nf.format(Math.round(x));
  const pct = x => Math.floor(x * 100 + 0.5);                 // round half up, as the notebook prints it
  const $ = id => document.getElementById(id);

  let D;                                                        // the data
  const S = { qty: {}, district: "both", mine: null, fee: false, week: 8 };
  let clipX = null, timer = null, anim = null;

  fetch("data/m9_basket.json")
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(init)
    .catch(() => { $("headline").textContent = "Không tải được dữ liệu giá của công cụ."; });

  // ---------- state helpers
  const step = it => (it.unit === "quả" ? 5 : 0.5);
  const maxQty = it => (it.unit === "quả" ? 30 : 5);
  const baseQty = it => (it.unit === "quả" ? D.basket[it.code] || 10 : 1);
  const qtyText = (it, q) => nf.format(q) + " " + it.unit;
  const chosen = () => D.items.filter(it => S.qty[it.code] > 0);
  const districts = () => (S.district === "both" ? D.districts : [S.district]);
  const listVi = a => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " và " + a[a.length - 1]);
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  function unitPrice(code, ch, wi) {
    const vals = districts().map(d => D.price[code][ch][d][wi]).filter(v => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }
  const feeOf = wi => districts().reduce((a, d) => a + D.fee[d][wi], 0) / districts().length;

  function basket(wi) {
    const out = {};
    D.channels.forEach(ch => {
      let cost = 0;
      const miss = [];
      chosen().forEach(it => {
        const p = unitPrice(it.code, ch, wi);
        if (p == null) miss.push(it.name.toLowerCase()); else cost += p * S.qty[it.code];
      });
      const fee = ch === "App" && S.fee ? feeOf(wi) : 0;
      out[ch] = { cost, fee, total: miss.length ? null : cost + fee, missing: miss };
    });
    return out;
  }

  // ---------- controls
  function init(data) {
    D = data;
    D.items.forEach(it => { S.qty[it.code] = baseQty(it); });
    const box = $("items");
    ["Đạm", "Rau củ quả"].forEach(g => {
      const h = document.createElement("div");
      h.className = "grp";
      h.textContent = g;
      box.appendChild(h);
      D.items.filter(it => it.group === g).forEach(it => {
        const row = document.createElement("div");
        row.className = "it";
        row.dataset.code = it.code;
        row.innerHTML = `<span class="nm">${it.name}</span><span class="step">` +
          `<button type="button" data-dir="-1" aria-label="Bớt ${it.name.toLowerCase()}">&minus;</button>` +
          `<output aria-live="off"></output>` +
          `<button type="button" data-dir="1" aria-label="Thêm ${it.name.toLowerCase()}">+</button></span>`;
        row.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
          const q = S.qty[it.code] + Number(b.dataset.dir) * step(it);
          S.qty[it.code] = Math.min(maxQty(it), Math.max(0, Math.round(q * 2) / 2));
          update();
        }));
        box.appendChild(row);
      });
    });
    tool.querySelectorAll("[data-preset]").forEach(b => b.addEventListener("click", () => {
      const p = b.dataset.preset;
      D.items.forEach(it => { S.qty[it.code] = p === "all" || it.m6 === p ? baseQty(it) : 0; });
      update();
    }));
    tool.querySelectorAll("[data-d]").forEach(b => b.addEventListener("click", () => { S.district = b.dataset.d; update(); }));
    tool.querySelectorAll("[data-c]").forEach(b => b.addEventListener("click", () => {
      S.mine = S.mine === b.dataset.c ? null : b.dataset.c;
      update();
    }));
    $("fee").addEventListener("change", e => { S.fee = e.target.checked; update(); });
    $("week").addEventListener("input", e => { stop(); S.week = Number(e.target.value); update(); });
    $("play").addEventListener("click", () => (timer ? stop() : play()));
    let lastW = window.innerWidth, wait;
    window.addEventListener("resize", () => {
      clearTimeout(wait);
      wait = setTimeout(() => { if (window.innerWidth !== lastW) { lastW = window.innerWidth; clipX = null; update(); } }, 150);
    });
    // on a phone the controls and the result do not fit on one screen: a bar at the bottom repeats the result
    const bar = document.createElement("div");
    bar.className = "m9-sum";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    const seen = { panel: false, head: false };
    const show = () => bar.classList.toggle("on", seen.panel && !seen.head);
    new IntersectionObserver(es => es.forEach(e => { seen[e.target === $("headline") ? "head" : "panel"] = e.isIntersecting; show(); }))
      .observe(tool.querySelector(".panel"));
    new IntersectionObserver(es => es.forEach(e => { seen.head = e.isIntersecting; show(); })).observe($("headline"));
    update();
  }

  function play() {
    if (S.week >= 8) { S.week = 1; update(); }
    $("play").textContent = "Dừng";
    timer = setInterval(() => {
      if (S.week >= 8) { stop(); return; }
      S.week += 1;
      update();
    }, reduce ? 1800 : 1300);
  }
  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    $("play").textContent = "Chạy 8 tuần";
  }

  // ---------- render everything from the state
  function update() {
    D.items.forEach(it => {
      const row = tool.querySelector(`.it[data-code="${it.code}"]`);
      const q = S.qty[it.code];
      row.classList.toggle("off", q === 0);
      row.querySelector("output").textContent = q === 0 ? "0" : qtyText(it, q);
      row.querySelector('[data-dir="-1"]').disabled = q === 0;
      row.querySelector('[data-dir="1"]').disabled = q >= maxQty(it);
    });
    tool.querySelectorAll("[data-d]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.d === S.district)));
    tool.querySelectorAll("[data-c]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.c === S.mine)));
    $("week").value = S.week;
    const wk = D.weeks[S.week - 1];
    $("weeklabel").innerHTML = `<b>Tuần ${S.week}</b> · giá app từ ${wk.app}`;

    const all = D.weeks.map((w, wi) => basket(wi));
    const b = all[S.week - 1];
    writeText(b);
    const sum = document.querySelector(".m9-sum");
    if (sum) sum.textContent = $("headline").textContent;
    drawBars(b, all);
    drawLines(all);
    drawTable();
  }

  function writeText(b) {
    const w = S.week, H = $("headline"), Sub = $("subline"), You = $("you");
    if (!chosen().length) {
      H.textContent = "Giỏ hàng đang trống. Hãy chọn ít nhất một món.";
      Sub.textContent = "";
      You.textContent = "";
      You.hidden = true;
      return;
    }
    const avail = D.channels.filter(ch => b[ch].total != null);
    const lacking = D.channels.filter(ch => b[ch].total == null);
    const names = ch => listVi(b[ch].missing);
    You.hidden = false;
    if (!avail.length) {
      const miss = [...new Set(lacking.flatMap(ch => b[ch].missing))];
      H.textContent = `Tuần ${w} thiếu giá ${listVi(miss)} ở cả ba kênh, nên chưa tính được giỏ hàng này.`;
      Sub.textContent = `Hãy bỏ ${listVi(miss)} khỏi giỏ hoặc chọn tuần khác.`;
      You.textContent = "";
      You.hidden = true;
      return;
    }
    const best = avail.reduce((a, c) => (b[c].total < b[a].total ? c : a));
    const total = vnd(b[best].total);
    if (!lacking.length) {
      H.textContent = `Ở tuần ${w}, giỏ hàng này rẻ nhất khi mua ở ${LOW[best]}, hết ${total} đồng.`;
    } else {
      const byFoods = {};                                       // "chợ và app thiếu giá hành tây"
      lacking.forEach(ch => { (byFoods[names(ch)] = byFoods[names(ch)] || []).push(LOW[ch]); });
      const gaps = Object.entries(byFoods).map(([f, chs]) => `${listVi(chs)} thiếu giá ${f}`).join(", ");
      H.textContent = `Ở tuần ${w}, ${gaps}. ` + (avail.length === 2
        ? `Trong hai kênh còn lại, ${LOW[best]} rẻ hơn, hết ${total} đồng.`
        : `Chỉ ${LOW[best]} có đủ giá, hết ${total} đồng.`);
    }
    const others = avail.filter(ch => ch !== best).map(ch => {
      const d = b[ch].total - b[best].total;
      return `${LOW[ch]} đắt hơn ${vnd(d)} đồng (${pct(d / b[best].total)}%)`;
    });
    let sub = others.length ? cap(listVi(others)) + "." : "";
    if (avail.includes("App")) sub += S.fee ? ` Giỏ app đã gồm ${vnd(b.App.fee)} đồng phí giao.` : " Giỏ app chưa tính phí giao.";
    Sub.textContent = sub.trim();

    const m = S.mine;
    if (!m) You.textContent = "Chọn nơi bạn thường mua ở mục 3 để xem bạn tiết kiệm được bao nhiêu.";
    else if (b[m].total == null) You.textContent = `Tuần này ${LOW[m]} thiếu giá ${names(m)}, nên chưa so được với nơi bạn thường mua.`;
    else if (m === best) You.textContent = `Bạn đang mua ở nơi rẻ nhất cho giỏ hàng này trong tuần ${w}.`;
    else {
      const d = b[m].total - b[best].total;
      You.textContent = `Nếu chuyển từ ${LOW[m]} sang ${LOW[best]}, bạn tiết kiệm ${vnd(d)} đồng trong tuần ${w}. ` +
        `Nếu tuần nào cũng chênh như vậy, 4 tuần là khoảng ${vnd(d * 4)} đồng.`;
    }
  }

  // ---------- bars of the chosen week; the scale stays the same for all 8 weeks
  function drawBars(b, all) {
    const box = $("bars");
    if (!box.children.length) {
      D.channels.forEach(ch => {
        const row = document.createElement("div");
        row.className = "brow";
        row.innerHTML = `<div class="ch">${ch}<small></small></div><div class="btrack">` +
          `<div class="bfill" style="width:0;background:${COLOR[ch]}"></div><div class="bfee" style="width:0"></div>` +
          `<div class="bval"></div></div>`;
        box.appendChild(row);
      });
    }
    let top = 0;
    all.forEach(x => D.channels.forEach(ch => { if (x[ch].total != null) top = Math.max(top, x[ch].total); }));
    const hasItems = chosen().length > 0;
    D.channels.forEach((ch, i) => {
      const row = box.children[i], v = b[ch];
      row.querySelector("small").textContent = S.mine === ch ? "nơi bạn mua" : "";
      const fill = row.querySelector(".bfill"), fee = row.querySelector(".bfee"), val = row.querySelector(".bval");
      const ok = hasItems && v.total != null && top > 0;
      fill.style.width = ok ? `calc((100% - var(--res)) * ${v.cost / top})` : "0px";
      fee.style.width = ok && v.fee ? `calc((100% - var(--res)) * ${v.fee / top})` : "0px";
      if (!hasItems) { val.innerHTML = ""; return; }
      if (v.total == null) { val.innerHTML = `<span class="bmiss">thiếu giá ${listVi(v.missing)}</span>`; return; }
      let t = `${vnd(v.total)} đ`;
      if (ch !== "Chợ" && b["Chợ"].total != null) {
        const p = pct(v.total / b["Chợ"].total - 1);
        t += ` <span class="d">${p >= 0 ? "+" : ""}${p}% so với chợ</span>`;
      }
      val.innerHTML = t;
    });
    $("barnote").textContent = !hasItems ? "" : "Thang của các thanh giữ nguyên trong 8 tuần." +
      (S.fee ? " Phần gạch chéo ở thanh app là phí giao của một đơn." : "");
  }

  // ---------- line chart of the 8 weeks; the weeks after the chosen week stay light grey
  function el(tag, attrs, parent) {
    const e = document.createElementNS(SVGNS, tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    if (parent) parent.appendChild(e);
    return e;
  }
  function niceStep(span) {
    const c = [5e3, 1e4, 2e4, 25e3, 5e4, 1e5, 2e5, 25e4, 5e5, 1e6];
    return c.find(s => span / s <= 5) || 2e6;
  }

  function drawLines(all) {
    const svg = $("lines");
    svg.innerHTML = "";
    // the drawing takes the real width of the page, so that the text keeps its size on a phone
    const W = Math.max(320, Math.min(680, Math.round(svg.getBoundingClientRect().width) || 680));
    const narrow = W < 520, Hh = narrow ? 230 : 250, L = narrow ? 46 : 56, R = narrow ? 64 : 78, T = 14, B = 32;
    svg.setAttribute("viewBox", `0 0 ${W} ${Hh}`);
    const series = {};
    D.channels.forEach(ch => { series[ch] = all.map(x => (chosen().length ? x[ch].total : null)); });
    const vals = D.channels.flatMap(ch => series[ch]).filter(v => v != null);
    if (!vals.length) {
      el("text", { x: W / 2, y: Hh / 2, "text-anchor": "middle", fill: INK2, "font-size": 14 }, svg).textContent =
        chosen().length ? "Không có tuần nào đủ giá cho giỏ hàng này." : "Chọn món để vẽ biểu đồ.";
      return;
    }
    let lo = Math.min(...vals), hi = Math.max(...vals);
    if (hi - lo < hi * 0.04) { lo -= hi * 0.04; hi += hi * 0.04; }
    const st = niceStep(hi - lo);
    lo = Math.floor(lo / st) * st;
    hi = Math.ceil(hi / st) * st;
    const n = D.weeks.length;
    const x = wi => L + (wi * (W - L - R)) / (n - 1);
    const y = v => T + ((hi - v) * (Hh - T - B)) / (hi - lo);

    for (let v = lo; v <= hi + 1; v += st) {
      el("line", { x1: L, x2: W - R, y1: y(v), y2: y(v), stroke: RULE, "stroke-width": 1 }, svg);
      el("text", { x: L - 8, y: y(v) + 4, "text-anchor": "end", fill: INK2, "font-size": 11.5 }, svg).textContent = vnd(v / 1000) + "k";
    }
    D.weeks.forEach((w, wi) => {
      el("text", { x: x(wi), y: Hh - 10, "text-anchor": "middle", fill: wi === S.week - 1 ? INK : INK2,
        "font-size": 11.5, "font-weight": wi === S.week - 1 ? 600 : 400 }, svg).textContent = wi === 0 ? "Tuần 1" : String(w.week);
    });

    const defs = el("defs", {}, svg);
    const clip = el("clipPath", { id: "m9past" }, defs);
    const target = x(S.week - 1) + 0.5;
    const rect = el("rect", { x: 0, y: 0, height: Hh, width: clipX == null ? target : clipX }, clip);

    const path = arr => {
      let d = "", pen = false;
      arr.forEach((v, wi) => {
        if (v == null) { pen = false; return; }
        d += (pen ? "L" : "M") + x(wi).toFixed(1) + " " + y(v).toFixed(1);
        pen = true;
      });
      return d;
    };
    const lonely = arr => arr.map((v, wi) => (v != null && arr[wi - 1] == null && arr[wi + 1] == null ? wi : -1)).filter(i => i >= 0);
    const grey = el("g", {}, svg), past = el("g", { "clip-path": "url(#m9past)" }, svg);
    D.channels.forEach(ch => {
      const d = path(series[ch]);
      el("path", { d, fill: "none", stroke: LIGHT, "stroke-width": 2, "stroke-linejoin": "round" }, grey);
      el("path", { d, fill: "none", stroke: COLOR[ch], "stroke-width": 2.6, "stroke-linejoin": "round", "stroke-linecap": "round" }, past);
      lonely(series[ch]).forEach(wi => {
        el("circle", { cx: x(wi), cy: y(series[ch][wi]), r: 3, fill: LIGHT }, grey);
        el("circle", { cx: x(wi), cy: y(series[ch][wi]), r: 3.5, fill: COLOR[ch] }, past);
      });
    });

    el("line", { x1: target, x2: target, y1: T - 6, y2: Hh - B, stroke: INK, "stroke-width": 1, "stroke-dasharray": "2 3", opacity: 0.6 }, svg);
    const wi0 = S.week - 1;
    D.channels.forEach(ch => {
      const v = series[ch][wi0];
      if (v != null) el("circle", { cx: x(wi0), cy: y(v), r: 5, fill: COLOR[ch], stroke: "#fff", "stroke-width": 2 }, svg);
    });

    // direct labels at the right end, pushed apart when they would touch
    const labs = D.channels.map(ch => {
      const arr = series[ch];
      let last = -1;
      arr.forEach((v, i) => { if (v != null) last = i; });
      return last < 0 ? null : { ch, y: y(arr[last]) };
    }).filter(Boolean).sort((a, b2) => a.y - b2.y);
    for (let i = 1; i < labs.length; i++) if (labs[i].y - labs[i - 1].y < 15) labs[i].y = labs[i - 1].y + 15;
    labs.forEach(l => {
      el("text", { x: W - R + 10, y: l.y + 4, fill: INK, "font-size": 12.5, "font-weight": 600 }, svg).textContent = l.ch;
    });

    // pointer: a tooltip with the three baskets of the nearest week; a click chooses that week
    const hit = el("rect", { x: L - 20, y: 0, width: W - L - R + 40, height: Hh, fill: "transparent", style: "cursor:pointer" }, svg);
    const tip = $("tip");
    const weekAt = evt => {
      const p = svg.getBoundingClientRect();
      const sx = ((evt.clientX - p.left) * W) / p.width;
      return Math.max(0, Math.min(n - 1, Math.round(((sx - L) * (n - 1)) / (W - L - R))));
    };
    hit.addEventListener("pointermove", evt => {
      const wi = weekAt(evt), p = svg.getBoundingClientRect();
      tip.innerHTML = `<b>Tuần ${wi + 1}</b>` + D.channels.map(ch => {
        const v = series[ch][wi];
        return `<br><i style="background:${COLOR[ch]}"></i>${ch}: ${v == null ? "thiếu giá" : vnd(v) + " đ"}`;
      }).join("");
      const px = (x(wi) * p.width) / W, box = $("lchart").getBoundingClientRect();
      const left = px + 14 + tip.offsetWidth > box.width ? px - 14 - tip.offsetWidth : px + 14;
      tip.style.transform = `translate(${Math.max(0, left)}px, 6px)`;
      tip.classList.add("on");
    });
    hit.addEventListener("pointerleave", () => tip.classList.remove("on"));
    hit.addEventListener("click", evt => { stop(); tip.classList.remove("on"); S.week = weekAt(evt) + 1; update(); });

    // move the coloured part to the chosen week
    if (anim) cancelAnimationFrame(anim);
    const from = clipX == null ? target : clipX;
    if (reduce || Math.abs(from - target) < 1) { clipX = target; rect.setAttribute("width", target); return; }
    const t0 = performance.now(), dur = 600;
    const tick = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      clipX = from + (target - from) * e;
      rect.setAttribute("width", clipX);
      if (k < 1) anim = requestAnimationFrame(tick);
    };
    anim = requestAnimationFrame(tick);
  }

  // ---------- price of each chosen food in the chosen week
  function drawTable() {
    const wi = S.week - 1, tbl = $("tbl");
    const where = S.district === "both" ? "trung bình hai quận" : S.district;
    let h = `<caption style="caption-side:bottom;text-align:left;font-size:12.5px;color:${INK2};padding-top:8px">` +
      `Giá một kg, riêng trứng là giá một quả, tuần ${S.week}, ${where}. Ô tô màu là kênh rẻ nhất của món đó.</caption>` +
      `<tr><th>Món</th><th class="num">Số lượng</th>` + D.channels.map(ch => `<th class="num">${ch}</th>`).join("") + "</tr>";
    const items = chosen();
    if (!items.length) h += `<tr><td colspan="5" class="na">Chưa chọn món nào.</td></tr>`;
    items.forEach(it => {
      const ps = D.channels.map(ch => unitPrice(it.code, ch, wi));
      const ok = ps.filter(p => p != null);
      const min = ok.length ? Math.min(...ok) : null;
      h += `<tr><td>${it.name}</td><td class="num">${qtyText(it, S.qty[it.code])}</td>` + ps.map(p =>
        p == null ? `<td class="num na">không có giá</td>` : `<td class="num${p === min && ok.length > 1 ? " cheap" : ""}">${vnd(p)} đ</td>`).join("") + "</tr>";
    });
    tbl.innerHTML = h;
  }
})();
