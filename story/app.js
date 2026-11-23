/* Giá của bữa tối: scenes, charts and animations.
   Every number comes from data/facts.json, which tools/build_story_data.py writes from the clean tables. */
(() => {
  "use strict";
  const PARAMS = new URLSearchParams(location.search);
  if (PARAMS.has("debug")) {                                           // ?debug writes errors and warnings on <html> for headless checks
    const root = document.documentElement, add = (k, m) => { root.dataset[k] = (root.dataset[k] || "") + " | " + m; };
    window.addEventListener("error", e => add("err", e.message));
    window.addEventListener("unhandledrejection", e => add("err", String(e.reason)));
    const warn = console.warn;
    console.warn = (...a) => { add("warn", a.join(" ")); warn(...a); };
  }
  const STILL = PARAMS.has("still");                                   // final state of every scene, for screenshots
  const REDUCED = STILL || matchMedia("(prefers-reduced-motion: reduce)").matches;
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
  if (STILL) document.documentElement.classList.add("still");
  if (PARAMS.has("nolag")) gsap.ticker.lagSmoothing(0);                // headless browsers draw few frames; keep real time
  if (PARAMS.has("speed")) gsap.globalTimeline.timeScale(+PARAMS.get("speed") || 1);   // for headless checks only
  const ONLY = PARAMS.get("only");                                     // ?still&only=s-mua shows one scene, for screenshots
  if (ONLY) document.querySelectorAll(".scene").forEach(s => { if (s.id !== ONLY) s.style.display = "none"; });

  const NS = "http://www.w3.org/2000/svg";
  const C = { cho: "#B85C38", st: "#1F3D55", app: "#9BBDD6", ink: "#1A1A1A", grey: "#8C8C8C", light: "#D9D9D9",
              night: "#26235F", cream: "#FFF1C9", pink: "#F36FA9", gold: "#FFE3A3" };
  const CH = ["Chợ", "Siêu thị", "App"];
  const CH_COLOR = { "Chợ": C.cho, "Siêu thị": C.st, "App": C.app };
  const ITEMS = [["SP01", "Thịt heo ba chỉ"], ["SP02", "Rau muống"], ["SP03", "Cá thu"], ["SP04", "Cà chua"], ["SP05", "Thịt bò"],
                 ["SP06", "Gà ta"], ["SP07", "Dưa hấu"], ["SP08", "Hành tây"], ["SP09", "Khoai tây Đà Lạt"], ["SP10", "Đậu hũ trắng"],
                 ["SP11", "Trứng gà"], ["SP12", "Cá diêu hồng"]];
  const CODE = Object.fromEntries(ITEMS.map(([c, n]) => [n, c]));

  const nf = new Intl.NumberFormat("vi-VN");
  const dec = (v, d) => v.toLocaleString("vi-VN", { minimumFractionDigits: d, maximumFractionDigits: d });
  const FMT = {
    int: v => nf.format(v), vnd: v => nf.format(Math.round(v)) + " đồng", vndShort: v => nf.format(Math.round(v)) + "đ",
    pct0: v => nf.format(Math.round(v)) + "%", pct1: v => dec(v, 1) + "%", pct2: v => dec(v, 2) + "%",
    abs1: v => dec(Math.abs(v), 1) + "%", sec: v => v.toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + " giây",
  };
  const get = (o, path) => path.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  function el(tag, attrs = {}, parent) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  }

  /* ---------------------------------------------------------------- drawings */

  const studentSVG = pose => window.P10.student(pose);           // the drawing of An lives in an.js

  function placeStudents() {
    $$(".an-slot").forEach(slot => {
      slot.innerHTML = studentSVG(slot.dataset.pose);
      gsap.set(slot, { x: +slot.dataset.x, y: +slot.dataset.y, scale: +slot.dataset.scale || 1, svgOrigin: "0 0" });
    });
  }

  function useItem(parent, code, x, y, size, cls = "") {
    return el("use", { href: "#i-" + code, x: 0, y: 0, width: size, height: size, class: cls, transform: `translate(${x} ${y})` }, parent);
  }

  /* ---------------------------------------------------------------- charts in the cards */

  function chartSVG(id, w, h, label) {
    const box = document.getElementById(id);
    box.setAttribute("aria-label", label);
    return el("svg", { viewBox: `0 0 ${w} ${h}` }, box);
  }
  function text(parent, x, y, s, cls, anchor = "start") {
    const t = el("text", { x, y, class: cls, "text-anchor": anchor }, parent);
    t.textContent = s;
    return t;
  }

  function chartBasket(F) {
    const v = F.basket.vnd, max = v.App, W = 440, x0 = 78, bw = 250;
    const svg = chartSVG("ch-basket", W, 128, `Biểu đồ cột ngang: giỏ hàng ở chợ ${FMT.vnd(v["Chợ"])}, ở siêu thị ${FMT.vnd(v["Siêu thị"])}, qua app ${FMT.vnd(v.App)}.`);
    el("line", { x1: x0, x2: x0, y1: 2, y2: 118, class: "axis" }, svg);
    return CH.map((ch, i) => {
      const y = 8 + i * 38, w = (v[ch] / max) * bw;
      text(svg, x0 - 8, y + 19, ch === "App" ? "App" : ch, "lab", "end");
      const bar = el("rect", { x: x0, y, width: w, height: 26, rx: 4, fill: CH_COLOR[ch], stroke: ch === "App" ? C.st : "none", "stroke-width": 1 }, svg);
      const t = text(svg, x0 + w + 8, y + 18, FMT.vndShort(v[ch]), "val");
      el("title", {}, bar).textContent = `${ch}: ${FMT.vnd(v[ch])}`;
      return [bar, t];
    });
  }

  function chartFee(F) {
    const m = F.basket.vnd["Chợ"], a = F.basket.vnd.App, fee = F.fee.one_order_vnd, W = 440, x0 = 92, bw = 240, max = a + fee;
    const svg = chartSVG("ch-fee", W, 96, `Giỏ hàng ở chợ ${FMT.vnd(m)}; qua app ${FMT.vnd(a)} cộng phí giao ${FMT.vnd(fee)}.`);
    el("line", { x1: x0, x2: x0, y1: 2, y2: 88, class: "axis" }, svg);
    text(svg, x0 - 8, 27, "Chợ", "lab", "end");
    const b1 = el("rect", { x: x0, y: 8, width: (m / max) * bw, height: 26, rx: 4, fill: C.cho }, svg);
    text(svg, x0 - 8, 71, "App + phí", "lab", "end");
    const b2 = el("rect", { x: x0, y: 52, width: (a / max) * bw, height: 26, rx: 4, fill: C.app, stroke: C.st, "stroke-width": 1 }, svg);
    const b3 = el("rect", { x: x0 + (a / max) * bw + 2, y: 52, width: Math.max((fee / max) * bw, 6), height: 26, rx: 4, fill: C.grey }, svg);
    const t1 = text(svg, x0 + (m / max) * bw + 8, 26, FMT.vndShort(m), "val");
    const t2 = text(svg, x0 + bw + 12, 70, FMT.vndShort(F.fee.app_with_fee_vnd), "val");
    const t3 = text(svg, x0 + bw + 12, 90, "phần xám: phí giao", "muted");
    return { b1, b2, b3, t1, t2, t3 };
  }

  function chartItems(F) {
    const rows = F.app_by_item, W = 440, x0 = 128, bw = 240, rh = 22, max = 80;
    const svg = chartSVG("ch-items", W, rows.length * rh + 10,
      "Mức app đắt hơn chợ của từng món: " + rows.map(r => `${r.name} ${r.app_pct}%`).join(", "));
    el("line", { x1: x0, x2: x0, y1: 0, y2: rows.length * rh + 4, class: "axis" }, svg);
    return rows.map((r, i) => {
      const y = 4 + i * rh, w = (r.app_pct / max) * bw, col = r.group === "Large channel gap" ? C.cho : C.ink;
      text(svg, x0 - 8, y + 14, r.name, "lab", "end");
      const bar = el("rect", { x: x0, y: y + 2, width: w, height: rh - 7, rx: 3, fill: col }, svg);
      const t = text(svg, x0 + w + 6, y + 14, "+" + r.app_pct + "%", "val");
      el("title", {}, bar).textContent = `${r.name}: app đắt hơn chợ ${r.app_pct}%`;
      return [bar, t];
    });
  }

  function chartSplit(F) {
    const tot = F.saving.app_minus_market_vnd, a = F.saving.large_group_vnd, b = tot - a, W = 440, bw = 420, sa = a / tot;
    const svg = chartSVG("ch-split", W, 92, `Khoản chênh ${FMT.vnd(tot)} mỗi giỏ: sáu món chênh lớn ${FMT.vnd(a)}, thịt, cá và trứng ${FMT.vnd(b)}.`);
    const r1 = el("rect", { x: 10, y: 8, width: bw * sa - 2, height: 30, rx: 4, fill: C.cho }, svg);
    const r2 = el("rect", { x: 10 + bw * sa + 2, y: 8, width: bw * (1 - sa) - 2, height: 30, rx: 4, fill: C.ink }, svg);
    const t1 = text(svg, 10, 60, `6 món chênh lớn: ${FMT.vndShort(a)} (${Math.round(sa * 100)}%)`, "val");
    const t2 = text(svg, 10, 82, `Thịt, cá và trứng: ${FMT.vndShort(b)} (${100 - Math.round(sa * 100)}%)`, "val");
    return { r1, r2, t1, t2 };
  }

  function chartWeeks(F) {
    const W = 440, H = 220, x0 = 46, x1 = 380, y0 = 190, y1 = 14, lo = 950000, hi = 1450000, weeks = F.basket_weeks_all;
    const sx = w => x0 + ((w - 1) / 7) * (x1 - x0), sy = v => y0 - ((v - lo) / (hi - lo)) * (y0 - y1);
    const svg = chartSVG("ch-weeks", W, H + 16, "Biểu đồ đường: tiền giỏ hàng mỗi tuần ở ba kênh, tuần 1 đến tuần 8; app luôn cao nhất.");
    [1000000, 1200000, 1400000].forEach(v => {
      el("line", { x1: x0, x2: x1, y1: sy(v), y2: sy(v), class: "grid" }, svg);
      text(svg, x0 - 6, sy(v) + 4, dec(v / 1e6, 1) + " tr", "muted", "end");
    });
    for (let w = 1; w <= 8; w++) text(svg, sx(w), y0 + 18, "T" + w, "muted", "middle");
    const lines = [], dots = [];
    CH.forEach(ch => {
      const vals = F.weekly.basket_vnd[ch];
      let d = "", pen = false;
      vals.forEach((v, i) => {
        if (v == null) { pen = false; return; }
        d += (pen ? "L" : "M") + sx(i + 1).toFixed(1) + " " + sy(v).toFixed(1);
        pen = true;
      });
      const p = el("path", { d, fill: "none", stroke: CH_COLOR[ch], "stroke-width": 3, "stroke-linejoin": "round", "stroke-linecap": "round" }, svg);
      lines.push(p);
      vals.forEach((v, i) => {
        if (v == null) return;
        const c = el("circle", { cx: sx(i + 1), cy: sy(v), r: 4.5, fill: CH_COLOR[ch], stroke: ch === "App" ? C.st : "#FFF7E6", "stroke-width": 1.5 }, svg);
        el("title", {}, c).textContent = `${ch}, tuần ${i + 1}: ${FMT.vnd(v)}`;
        dots.push(c);
      });
      const lastI = vals.length - 1 - [...vals].reverse().findIndex(v => v != null);
      text(svg, sx(lastI + 1) + 10, sy(vals[lastI]) + 5, ch, "val");
    });
    return { lines, dots };
  }

  function chartDist(F) {
    const rows = F.districts.items, W = 470, xz = 292, sc = 12, rh = 20;
    const svg = chartSVG("ch-dist", W, rows.length * rh + 30,
      "Chênh lệch giá giữa Quận 10 và Quận 3 của từng món: " + rows.map(r => `${r.name} ${dec(r.gap_pct, 1)}%`).join(", "));
    el("rect", { x: xz - 5 * sc, y: 0, width: 10 * sc, height: rows.length * rh + 4, fill: "#F3E5C6" }, svg);
    el("line", { x1: xz, x2: xz, y1: 0, y2: rows.length * rh + 4, class: "axis" }, svg);
    text(svg, xz - 5 * sc, rows.length * rh + 22, "−5%", "muted", "middle");
    text(svg, xz + 5 * sc, rows.length * rh + 22, "+5%", "muted", "middle");
    text(svg, W - 2, rows.length * rh + 22, "Quận 10 đắt hơn", "muted", "end");
    text(svg, 10, rows.length * rh + 22, "Quận 3 đắt hơn", "muted");
    return rows.map((r, i) => {
      const y = 2 + i * rh, w = Math.abs(r.gap_pct) * sc, top = i === 0;
      text(svg, 10, y + 13, r.name, "lab");
      const bar = el("rect", { x: r.gap_pct >= 0 ? xz : xz - w, y: y + 3, width: w, height: rh - 7, rx: 3, fill: top ? C.cho : C.grey }, svg);
      const t = text(svg, r.gap_pct >= 0 ? xz + w + 5 : xz - w - 5, y + 13, (r.gap_pct > 0 ? "+" : "") + dec(r.gap_pct, 1) + "%", top ? "val" : "lab", r.gap_pct >= 0 ? "start" : "end");
      el("title", {}, bar).textContent = `${r.name}: ${dec(r.gap_pct, 1)}%`;
      return [bar, t, r.gap_pct];
    });
  }

  function chartCPI(F) {
    const ch = F.cpi.basket_change_pct, rows = [["Chợ, 8 tuần", ch["Chợ"], C.cho], ["Siêu thị, 8 tuần", ch["Siêu thị"], C.st], ["App, 8 tuần", ch.App, C.app],
                                                 ["CPI thực phẩm, tháng 10", F.cpi.cpi_october_pct, C.grey]];
    const W = 440, xz = 280, sc = 20, rh = 30;
    const svg = chartSVG("ch-cpi", W, rows.length * rh + 26, "Thay đổi so với tuần đầu: " + rows.map(r => `${r[0]} ${dec(r[1], 1)}%`).join(", "));
    el("line", { x1: xz, x2: xz, y1: 0, y2: rows.length * rh, class: "axis" }, svg);
    text(svg, xz, rows.length * rh + 18, "0%", "muted", "middle");
    return rows.map(([name, v, col], i) => {
      const y = 4 + i * rh, w = Math.abs(v) * sc;
      text(svg, 6, y + 17, name, "lab");
      const bar = el("rect", { x: v >= 0 ? xz : xz - w, y: y + 2, width: Math.max(w, 2), height: rh - 10, rx: 3, fill: col, stroke: col === C.app ? C.st : "none", "stroke-width": 1 }, svg);
      const t = text(svg, v >= 0 ? xz + w + 6 : xz - w - 6, y + 17, (v > 0 ? "+" : v < 0 ? "−" : "") + dec(Math.abs(v), Math.abs(v) < 1 ? 2 : 1) + "%", "val", v >= 0 ? "start" : "end");
      return [bar, t, v];
    });
  }

  /* ---------------------------------------------------------------- scene timelines */

  const timelines = [];
  function scene(id, build) {
    const sec = document.getElementById(id);
    const tl = gsap.timeline({ paused: true });
    const card = $(".card", sec);
    if (card) {
      tl.from(card, { x: 70, opacity: 0, duration: .8, ease: "power3.out" }, 0);
      const b = document.createElement("button");
      b.className = "replay"; b.type = "button"; b.textContent = "Xem lại";
      b.addEventListener("click", () => tl.restart());
      card.appendChild(b);
    }
    build(tl, sec);
    timelines.push(tl);
    if (REDUCED) { tl.progress(1); return; }
    SCENE_TL.set(sec, tl);
    playObserver.observe(sec);
    resetObserver.observe(sec);
  }
  // A scene plays when its top passes 65% of the window, and resets when it is fully below the window again,
  // so that it plays again the next time the reader moves forward. A refresh of the page layout never resets it.
  const SCENE_TL = new Map();
  const playObserver = new IntersectionObserver(entries => entries.forEach(e => {
    const tl = SCENE_TL.get(e.target);
    if (e.isIntersecting && tl.progress() === 0 && !tl.isActive()) { window.__restarts = (window.__restarts || 0) + 1; tl.play(); }
  }), { rootMargin: "0px 0px -35% 0px", threshold: 0 });
  const resetObserver = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting && e.boundingClientRect.top > 0) { window.__resets = (window.__resets || 0) + 1; SCENE_TL.get(e.target).pause(0); }
  }), { threshold: 0 });
  const walk = (st, on) => () => st.classList.toggle("walking", on);
  function countTo(tl, node, value, f, at, dur = 1.2) {
    const o = { v: 0 };
    tl.to(o, { v: value, duration: dur, ease: "power1.out", onUpdate: () => { node.textContent = f(o.v); } }, at);
    tl.call(() => { node.textContent = f(value); }, null, at + dur);
  }

  function build(F, B) {
    /* cover */
    scene("s-cong", (tl, sec) => {
      tl.from($$(".frame-top .cl", sec), { y: -170, opacity: 0, stagger: .12, duration: 1.1, ease: "back.out(1.4)" }, 0)
        .from($$(".frame-bottom .cl", sec), { y: 170, opacity: 0, stagger: .12, duration: 1.1, ease: "back.out(1.4)" }, 0)
        .from($(".gate", sec), { scale: .82, opacity: 0, y: 50, transformOrigin: "50% 100%", duration: 1.3, ease: "power3.out" }, .25)
        .from($$("h1 span", sec), { y: 70, opacity: 0, rotation: -8, stagger: .13, duration: .85, ease: "back.out(2)" }, .6)
        .from($$(".eyebrow, .cover-sub", sec), { y: 20, opacity: 0, stagger: .2, duration: .7 }, 1.1)
        .from($(".kite-svg.kite-l", sec), { x: -320, y: 220, opacity: 0, duration: 1.8, ease: "power2.out" }, .4)
        .from($(".kite-svg.kite-r", sec), { x: 320, y: 220, opacity: 0, duration: 1.8, ease: "power2.out" }, .5)
        .from($(".scroll-hint", sec), { opacity: 0, y: 12, duration: .6 }, 1.7);
    });

    /* An at UEH */
    scene("s-an", (tl, sec) => {
      const slot = $(".an-slot", sec), st = $(".student", slot), win = $(".windows", sec);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
        if (r === 3 && (c === 2 || c === 3)) continue;
        el("rect", { x: 452 + c * 64, y: 150 + r * 50, width: 40, height: 30, rx: 3 }, win);
      }
      tl.from($(".ueh", sec), { y: 70, opacity: 0, duration: .9, ease: "power2.out" }, 0)
        .from($$(".windows rect", sec), { opacity: 0, stagger: { each: .03, from: "random" }, duration: .25 }, .4)
        .call(walk(st, true), null, .5)
        .fromTo(slot, { x: -150 }, { x: +slot.dataset.x, duration: 2.3, ease: "none" }, .5)
        .call(() => { st.classList.remove("walking"); st.classList.remove("waving"); void st.offsetWidth; st.classList.add("waving"); }, null, 2.8)
        .from($(".bubble", sec), { scale: 0, transformOrigin: "30% 100%", duration: .6, ease: "back.out(2)" }, 3)
        .from($$(".bi", sec), { y: 24, opacity: 0, stagger: .3, duration: .45, ease: "back.out(2)" }, 3.4)
        .from($(".qmark", sec), { scale: 0, rotation: -40, transformOrigin: "50% 50%", duration: .5, ease: "back.out(3)" }, 4.4);
    });

    /* the basket */
    scene("s-gio", (tl, sec) => {
      const chips = $(".chips", sec);
      ITEMS.forEach(([c, n]) => {
        const li = document.createElement("li");
        li.innerHTML = `<svg viewBox="0 0 64 64" aria-hidden="true"><use href="#i-${c}"/></svg>${n}`;
        chips.appendChild(li);
      });
      const g = $(".items-fall", sec), slot = $(".an-slot", sec), st = $(".student", slot);
      const items = ITEMS.map(([c], i) => {
        const tx = 372 + (i % 6) * 40 + (i >= 6 ? 20 : 0), ty = i < 6 ? 318 : 292;
        const u = useItem(g, c, tx, ty, 64);
        return u;
      });
      tl.from($(".basket-big", sec), { y: 80, opacity: 0, duration: .7, ease: "back.out(1.6)" }, .1)
        .call(walk(st, true), null, .1)
        .fromTo(slot, { x: 1100 }, { x: +slot.dataset.x, duration: 1.4, ease: "none" }, .1)
        .call(walk(st, false), null, 1.5)
        .from(items, { y: -360, rotation: () => gsap.utils.random(-50, 50), transformOrigin: "50% 50%", opacity: 0, stagger: .17, duration: .75, ease: "bounce.out" }, .6)
        .from($$("li", chips), { scale: .4, opacity: 0, stagger: .17, duration: .4, ease: "back.out(2)" }, .7);
      $$(".count", sec).forEach((n, i) => countTo(tl, n, get(F, n.dataset.fact), FMT.int, 1 + i * .3, 1.6));
    });

    /* three places to buy */
    scene("s-mua", (tl, sec) => {
      const slot = $(".an-slot", sec), st = $(".student", slot), tags = $(".tags", sec), bars = chartBasket(F);
      const stops = [["Chợ", 170], ["Siêu thị", 495], ["App", 845]];
      const v = F.basket.vnd, pct = F.basket.pct_over_market;
      tl.from($$(".shop", sec), { y: 90, opacity: 0, stagger: .2, duration: .8, ease: "back.out(1.4)" }, 0);
      bars.forEach(([b, t]) => { gsap.set(b, { scaleX: 0, transformOrigin: "0% 50%" }); gsap.set(t, { opacity: 0 }); });
      let at = .8, x = -80;
      stops.forEach(([ch, sx], i) => {
        const tg = el("g", { class: "ptag", transform: `translate(${sx} 0)` }, tags);
        tg.innerHTML = `<line x1="0" y1="0" x2="0" y2="44" stroke="#FFF1C9" stroke-width="2"/>
          <rect x="-98" y="44" width="196" height="74" rx="12" fill="#FFF7E6" stroke="${CH_COLOR[ch]}" stroke-width="4"/>
          <circle cx="0" cy="54" r="5" fill="#2B2A6B"/>
          <text x="0" y="86" text-anchor="middle" class="tag-price">0đ</text>
          <text x="0" y="108" text-anchor="middle" class="tag-pct">${i ? "đắt hơn chợ " + FMT.pct1(pct[ch]) : "giá cả giỏ hàng"}</text>`;
        const walkDur = Math.abs(sx - x) / 300;
        tl.call(walk(st, true), null, at)
          .fromTo(slot, { x }, { x: sx - 60, duration: walkDur, ease: "none" }, at)
          .call(walk(st, false), null, at + walkDur);
        at += walkDur;
        if (ch === "App") tl.to($(".app-btn", sec), { scale: 1.15, transformOrigin: "50% 50%", yoyo: true, repeat: 3, duration: .18 }, at);
        tl.from(tg, { y: -150, rotation: -12, transformOrigin: "50% 0%", duration: .9, ease: "elastic.out(1, .45)" }, at + .1);
        countTo(tl, $(".tag-price", tg), v[ch], FMT.vndShort, at + .2, 1);
        tl.to(bars[i][0], { scaleX: 1, duration: .8, ease: "power2.out" }, at + .2).to(bars[i][1], { opacity: 1, duration: .3 }, at + .9);
        x = sx - 60; at += 1.3;
      });
    });

    /* delivery fee */
    scene("s-phi", (tl, sec) => {
      const bike = $(".bike", sec), wheels = $$(".wheel", sec), parcel = $(".parcel", sec), coin = $(".fee-coin", sec), c = chartFee(F);
      const feeTag = el("g", { class: "fee-tag", transform: "translate(700 170)", opacity: 0 }, $("svg", sec));
      feeTag.innerHTML = `<rect x="-120" y="-40" width="240" height="70" rx="14" fill="#FFF7E6" stroke="${C.grey}" stroke-width="4"/>
        <text x="0" y="-6" text-anchor="middle" class="tag-pct">phí giao một đơn</text><text x="0" y="22" text-anchor="middle" class="tag-price">+0đ</text>`;
      gsap.set([c.b1, c.b2, c.b3], { scaleX: 0, transformOrigin: "0% 50%" });
      gsap.set(wheels, { transformOrigin: "50% 50%" });
      gsap.set([c.t1, c.t2, c.t3], { opacity: 0 });
      tl.from($(".house", sec), { y: 60, opacity: 0, duration: .8 }, 0)
        .fromTo(bike, { x: 1100 }, { x: 560, duration: 2, ease: "power2.out" }, .4)
        .fromTo(wheels, { rotation: 0 }, { rotation: -900, duration: 2, ease: "power2.out" }, .4)
        .to(bike, { y: "-=6", yoyo: true, repeat: 5, duration: .15 }, .4)
        .fromTo(parcel, { x: 640, y: 300, opacity: 0 }, { opacity: 1, duration: .2 }, 2.4)
        .to(parcel, { x: 380, y: 330, duration: .9, ease: "power2.inOut" }, 2.6)
        .fromTo(coin, { x: 400, y: 300, opacity: 0, scale: .4 }, { opacity: 1, scale: 1, duration: .3 }, 3.4)
        .to(coin, { motionPath: { path: [{ x: 520, y: 140 }, { x: 640, y: 140 }], curviness: 1.2 }, duration: .9, ease: "power1.inOut" }, 3.6)
        .to(feeTag, { opacity: 1, duration: .3 }, 4.2)
        .to(coin, { opacity: 0, duration: .3 }, 4.4)
        .to(c.b1, { scaleX: 1, duration: .7 }, 1).to(c.t1, { opacity: 1, duration: .3 }, 1.6)
        .to(c.b2, { scaleX: 1, duration: .8 }, 2).to(c.b3, { scaleX: 1, duration: .5 }, 4.3).to([c.t2, c.t3], { opacity: 1, duration: .3 }, 4.8);
      countTo(tl, $(".tag-price", feeTag), F.fee.one_order_vnd, v => "+" + FMT.vndShort(v), 4.2, .8);
    });

    /* item by item */
    scene("s-mon", (tl, sec) => {
      const svg = $("svg", sec), g = $(".sort-items", sec);
      svg.insertBefore(g, svg.firstChild);
      const large = F.groups["Large channel gap"].items, rows = chartItems(F);
      rows.forEach(([b, t]) => { gsap.set(b, { scaleX: 0, transformOrigin: "0% 50%" }); gsap.set(t, { opacity: 0 }); });
      let li = 0, si = 0;
      const toks = ITEMS.map(([c, n], i) => {
        const big = large.includes(n), k = big ? li++ : si++;
        const tx = (big ? 150 : 670) + (k % 3) * 62 + (k >= 3 ? 30 : 0), ty = k < 3 ? 322 : 292;
        const u = useItem(g, c, tx, ty, 62);
        return { u, sx: 40 + i * 78, sy: 70 };
      });
      toks.forEach(({ u, sx, sy }, i) => tl.from(u, { x: sx, y: sy, duration: .9, ease: "power2.inOut" }, .9 + i * .12));
      tl.from(toks.map(t => t.u), { opacity: 0, scale: .3, transformOrigin: "50% 50%", stagger: .05, duration: .4 }, .2);
      rows.forEach(([b, t], i) => tl.to(b, { scaleX: 1, duration: .6, ease: "power2.out" }, 1 + i * .1).to(t, { opacity: 1, duration: .25 }, 1.4 + i * .1));
    });

    /* percent and money */
    scene("s-tien", (tl, sec) => {
      const g = $(".coins", sec), N = 24, share = F.saving.large_group_vnd / F.saving.app_minus_market_vnd, nA = Math.round(N * share);
      const coins = [];
      for (let i = 0; i < N; i++) {
        const c = el("g", { class: "scoin" }, g);
        c.innerHTML = `<rect x="-44" y="0" width="88" height="12" fill="#C9973F"/><ellipse cx="0" cy="12" rx="44" ry="11" fill="#B8862E"/><ellipse cx="0" cy="0" rx="44" ry="11" fill="url(#gGold)" stroke="#B8862E" stroke-width="2"/><rect x="-6" y="-4" width="12" height="8" fill="#2B2A6B"/>`;
        coins.push(c);
      }
      const s = chartSplit(F), pa = $(".pile-a", sec), pb = $(".pile-b", sec);
      gsap.set([s.r1, s.r2], { scaleX: 0, transformOrigin: "0% 50%" }); gsap.set([s.t1, s.t2], { opacity: 0 });
      coins.forEach((c, i) => {
        tl.fromTo(c, { x: 500, y: -60, opacity: 0 }, { x: 500, y: 470 - i * 13, opacity: 1, duration: .35, ease: "bounce.out" }, .4 + i * .06);
      });
      coins.forEach((c, i) => {
        const left = i < nA, k = left ? i : i - nA;
        tl.to(c, { x: left ? 300 : 700, y: 470 - k * 13, duration: .7, ease: "power2.inOut" }, 2.4 + i * .03);
      });
      countTo(tl, pa, F.saving.large_group_vnd, FMT.vndShort, 3.2, 1);
      countTo(tl, pb, F.saving.app_minus_market_vnd - F.saving.large_group_vnd, FMT.vndShort, 3.2, 1);
      tl.to(s.r1, { scaleX: 1, duration: .7 }, 3.3).to(s.r2, { scaleX: 1, duration: .7 }, 3.6).to([s.t1, s.t2], { opacity: 1, stagger: .2, duration: .3 }, 4);
    });

    /* eight weeks */
    scene("s-tuan", (tl, sec) => {
      const page = $(".cal-page", sec), pageNum = $(".cal-page .cal-num", sec), under = $(".calendar > .cal-num", sec), c = chartWeeks(F);
      c.lines.forEach(p => { const L = p.getTotalLength() || 600; gsap.set(p, { strokeDasharray: L, strokeDashoffset: L }); });
      gsap.set(c.dots, { scale: 0, transformOrigin: "50% 50%" });
      tl.from($(".calendar", sec), { y: 80, opacity: 0, duration: .7, ease: "back.out(1.5)" }, 0);
      for (let w = 1; w < 8; w++) {
        const at = .7 + (w - 1) * .42;
        tl.call(() => { pageNum.textContent = w; under.textContent = w + 1; gsap.set(page, { scaleY: 1, opacity: 1 }); }, null, at)
          .to(page, { scaleY: 0, transformOrigin: "50% 0%", opacity: .2, duration: .34, ease: "power2.in" }, at + .02);
      }
      tl.call(() => { pageNum.textContent = 8; under.textContent = 8; gsap.set(page, { scaleY: 1, opacity: 1 }); }, null, 3.7);
      c.lines.forEach((p, i) => tl.to(p, { strokeDashoffset: 0, duration: 2.6, ease: "none" }, .8 + i * .15));
      tl.to(c.dots, { scale: 1, stagger: .05, duration: .25, ease: "back.out(3)" }, .9);
    });

    /* two districts */
    scene("s-quan", (tl, sec) => {
      const route = $(".route-path", sec), cyc = $(".cyclist", sec), rows = chartDist(F);
      const L = route.getTotalLength();
      gsap.set(route, { strokeDasharray: "14 12" });
      rows.forEach(([b, t]) => { gsap.set(b, { scaleX: 0, transformOrigin: +b.getAttribute("x") < 292 ? "100% 50%" : "0% 50%" }); gsap.set(t, { opacity: 0 }); });
      tl.from($$(".d3, .d10", sec), { scale: .6, opacity: 0, transformOrigin: "50% 50%", stagger: .2, duration: .7, ease: "back.out(1.6)" }, 0)
        .from($$(".pin", sec), { y: "-=80", opacity: 0, stagger: .2, duration: .7, ease: "bounce.out" }, .6)
        .from(route, { opacity: 0, duration: .4 }, 1.4)
        .fromTo(cyc, { opacity: 0 }, { opacity: 1, duration: .2 }, 1.6)
        .to(cyc, { motionPath: { path: route, align: route, alignOrigin: [.5, 1], autoRotate: false }, duration: 3, ease: "power1.inOut" }, 1.6);
      rows.forEach(([b, t], i) => tl.to(b, { scaleX: 1, duration: .5 }, 1 + i * .08).to(t, { opacity: 1, duration: .2 }, 1.4 + i * .08));
      void L;
    });

    /* CPI */
    scene("s-cpi", (tl, sec) => {
      const ticks = $(".ticks", sec);
      for (let i = 0; i <= 12; i++) {
        const a = -120 + i * 20;
        el("line", { x1: 0, y1: -134, x2: 0, y2: i % 3 ? -120 : -110, stroke: "#2B2A6B", "stroke-width": i % 3 ? 2 : 4, transform: `rotate(${a})` }, ticks);
      }
      const needle = $(".needle", sec), rows = chartCPI(F);
      gsap.set(needle, { transformOrigin: "50% 90.91%" });             // the pivot is the centre of the dial
      rows.forEach(([b, t, v]) => { gsap.set(b, { scaleX: 0, transformOrigin: v >= 0 ? "0% 50%" : "100% 50%" }); gsap.set(t, { opacity: 0 }); });
      tl.from($(".scale", sec), { y: 80, opacity: 0, duration: .8, ease: "back.out(1.4)" }, 0)
        .fromTo(needle, { rotation: -100 }, { rotation: 70, duration: .9, ease: "power2.inOut" }, .6)
        .to(needle, { rotation: -55, duration: .8, ease: "power2.inOut" }, 1.5)
        .to(needle, { rotation: 30, duration: .7, ease: "power2.inOut" }, 2.3)
        .to(needle, { rotation: 4, duration: 1.2, ease: "elastic.out(1, .3)" }, 3);
      rows.forEach(([b, t], i) => tl.to(b, { scaleX: 1, duration: .6 }, 1 + i * .3).to(t, { opacity: 1, duration: .25 }, 1.5 + i * .3));
    });

    /* 2D and 3D */
    scene("s-thu", (tl, sec) => {
      $$(".wticks", sec).forEach(g => {
        for (let i = 0; i < 12; i++) el("line", { x1: 0, y1: -126, x2: 0, y2: i % 3 ? -114 : -104, stroke: "#2B2A6B", "stroke-width": i % 3 ? 2 : 4, transform: `rotate(${i * 30})` }, g);
      });
      const t2 = F.test.median_s["2D"], t3 = F.test.median_s["3D"], full = 30, k = .14;   // one turn = 30 seconds
      [[".w2d", t2], [".w3d", t3]].forEach(([w, secs]) => {
        const hand = $(`${w} .hand`, sec), label = $(`${w} .wtime`, sec);
        gsap.set(hand, { transformOrigin: "50% 93.65%" });              // the pivot is the centre of the watch
        tl.fromTo(hand, { rotation: 0 }, { rotation: (secs / full) * 360, duration: secs * k, ease: "none" }, .8);
        countTo(tl, label, secs, v => dec(v, 1).replace(",0", "") + " giây", .8, secs * k);
      });
      tl.from($$(".watch", sec), { y: 60, opacity: 0, stagger: .2, duration: .6, ease: "back.out(1.6)" }, 0)
        .to($(".w2d", sec), { scale: 1.06, transformOrigin: "50% 50%", yoyo: true, repeat: 1, duration: .2 }, .8 + t2 * k)
        .to($(".w3d", sec), { scale: 1.06, transformOrigin: "50% 50%", yoyo: true, repeat: 1, duration: .2 }, .8 + t3 * k);
    });

    /* advice */
    scene("s-goiy", (tl, sec) => {
      const slot = $(".an-slot", sec), st = $(".student", slot);
      tl.from($(".kitchen", sec), { y: 50, opacity: 0, duration: .8 }, 0)
        .call(walk(st, true), null, .4)
        .fromTo(slot, { x: 1080 }, { x: +slot.dataset.x, duration: 1.6, ease: "none" }, .4)
        .call(() => { st.classList.remove("walking"); st.classList.add("waving"); }, null, 2)
        .from($$(".advice li", sec), { x: 40, opacity: 0, stagger: .35, duration: .6 }, .8)
        .from($(".limits", sec), { opacity: 0, y: 16, duration: .6 }, 2.1);
    });

    /* your turn: the basket explorer of M9 (chon.js) */
    scene("s-chon", (tl, sec) => window.P10Chon.build(tl, sec, F, B, REDUCED));

    /* end */
    scene("s-ket", (tl, sec) => {
      tl.from($$(".frame-top .cl", sec), { y: -170, opacity: 0, stagger: .1, duration: 1 }, 0)
        .from($$(".frame-bottom .cl", sec), { y: 170, opacity: 0, stagger: .1, duration: 1 }, 0)
        .from($(".end-card", sec), { scale: .85, opacity: 0, duration: .9, ease: "back.out(1.6)" }, .4);
      $(".restart", sec).addEventListener("click", () => window.scrollTo({ top: 0, behavior: REDUCED ? "auto" : "smooth" }));
    });
  }

  /* ---------------------------------------------------------------- ambient motion */

  function ambient() {
    if (REDUCED) return;
    $$(".cl").forEach((c, i) => gsap.to(c, { x: (i % 2 ? "+=" : "-=") + 16, duration: 4 + (i % 4), yoyo: true, repeat: -1, ease: "sine.inOut" }));
    gsap.to(".kite-svg.kite-l", { rotation: -6, y: -16, duration: 2.6, yoyo: true, repeat: -1, ease: "sine.inOut" });
    gsap.to(".kite-svg.kite-r", { rotation: 22, y: -12, duration: 3, yoyo: true, repeat: -1, ease: "sine.inOut" });
    gsap.to(".gate-glow", { opacity: .86, duration: 2.2, yoyo: true, repeat: -1, ease: "sine.inOut" });
    gsap.to(".qmark", { y: -8, duration: .9, yoyo: true, repeat: -1, ease: "sine.inOut" });
  }

  /* ---------------------------------------------------------------- navigation */

  function navigation() {
    const sections = $$(".scene"), dots = $(".dots"), stops = $$(".route-stops li"), marker = $(".route-an"), fill = $(".route-fill");
    sections.forEach((s, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.setAttribute("aria-label", s.dataset.title || "Cảnh " + (i + 1));
      b.addEventListener("click", () => s.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" }));
      dots.appendChild(b);
      ScrollTrigger.create({ trigger: s, start: "top center", end: "bottom center",
        onToggle: self => { if (self.isActive) { $$("button", dots).forEach((d, k) => d.classList.toggle("on", k === i)); } } });
    });
    stops.forEach(li => {
      const target = document.getElementById(li.dataset.target);
      li.addEventListener("click", () => target.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" }));
      ScrollTrigger.create({ trigger: target, start: "top center", end: "bottom center", onToggle: self => li.classList.toggle("on", self.isActive) });
    });
    const cover = document.getElementById("s-cong");                  // the route and the key hint stay hidden on the cover
    const onCover = () => document.body.classList.toggle("on-cover", cover.offsetParent !== null && window.scrollY < cover.offsetHeight * .8);
    window.addEventListener("scroll", onCover, { passive: true });
    onCover();
    ScrollTrigger.create({ start: 0, end: "max", onUpdate: self => {
      const track = $(".route-track"), w = track.getBoundingClientRect().width;
      marker.style.left = (track.offsetLeft + self.progress * w) + "px";
      fill.style.width = (self.progress * 100) + "%";
    } });
    const current = () => {
      let best = 0, bd = Infinity;
      sections.forEach((s, i) => { const d = Math.abs(s.getBoundingClientRect().top); if (d < bd) { bd = d; best = i; } });
      return best;
    };
    window.addEventListener("keydown", e => {
      if (e.target.closest && e.target.closest("button, a, input, textarea")) { if (e.key === " ") return; }
      if (e.target.closest && e.target.closest("#s-chon .paper, .test-ov")) return;   // keys inside the explorer and the test stay there
      if (document.querySelector(".test-ov, .game, .rvx")) return;                // the test, the game and the review keep their keys
      const next = ["ArrowRight", "ArrowDown", "PageDown", " "].includes(e.key), prev = ["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key);
      if (!next && !prev) return;
      e.preventDefault();
      const i = Math.min(sections.length - 1, Math.max(0, current() + (next ? 1 : -1)));
      sections[i].scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" });
    });
  }

  /* ---------------------------------------------------------------- start */

  async function start() {
    placeStudents();
    let F, B;
    try {
      F = await (await fetch("data/facts.json", { cache: "no-store" })).json();
      B = await (await fetch("data/m9_basket.json", { cache: "no-store" })).json();
    } catch (err) {
      document.body.insertAdjacentHTML("afterbegin", '<p style="position:fixed;z-index:99;top:70px;left:20px;background:#fff;color:#000;padding:8px">Không đọc được dữ liệu của trang.</p>');
      return;
    }
    F.basket_weeks_all = F.weekly.basket_vnd;
    $$("[data-fact]").forEach(n => {
      const v = get(F, n.dataset.fact);
      if (v != null) n.textContent = (FMT[n.dataset.fmt] || String)(v);
    });
    const css = document.createElement("style");
    css.textContent = ".tag-price{font:800 26px 'Playfair Display',Georgia,serif;fill:#26235F}.tag-pct{font:600 14px 'Be Vietnam Pro',sans-serif;fill:#B85C38}";
    document.head.appendChild(css);
    build(F, B);
    ambient();
    navigation();
    if (location.hash) { const t = document.querySelector(location.hash); if (t) t.scrollIntoView(); }
    // the welcome of the test mode (test.js) covers the cover scene; play the cover again when the reader closes it
    document.addEventListener("p10:test-ready", () => { const tl = timelines[0]; if (tl && !REDUCED) tl.restart(); });
    if (PARAMS.has("debug")) setInterval(() => {
      const r = document.documentElement;
      r.dataset.frame = gsap.ticker.frame;
      r.dataset.routeop = getComputedStyle(document.querySelector(".route")).opacity + "/" + getComputedStyle(document.querySelector(".keyhint")).opacity;
      r.dataset.sw = document.documentElement.scrollWidth + "/" + document.documentElement.clientWidth;
      r.dataset.wide = Array.from(document.querySelectorAll("main *")).filter(n => n.getBoundingClientRect().right > document.documentElement.clientWidth + 1 && n.getBoundingClientRect().width > 0).slice(0, 4).map(n => (n.className && n.className.baseVal !== undefined ? n.tagName + "." + n.className.baseVal : n.tagName + "." + n.className) + ":" + Math.round(n.getBoundingClientRect().right)).join(";");
      r.dataset.prog = timelines.map(t => t.progress().toFixed(2)).join(",");
      r.dataset.restarts = window.__restarts || 0; r.dataset.resets = window.__resets || 0; r.dataset.state = timelines.map(t => (t.paused() ? "p" : "r") + t.time().toFixed(1)).join(",");
    }, 300);
    ScrollTrigger.refresh();
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
})();
