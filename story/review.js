/* The review form of M10, one question per card: who the reader is, seven ratings with lanterns, the hardest part,
   one thing to fix and the best part, and a peer review checklist for members of another team. It opens over the story
   at the end of the game (chon.js), or as its own page (danh-gia.html). With ?test it cannot be closed before it is sent.
   The form sends the answers, with the five second test and the timed questions of P10.test, to /api/review. */
window.P10Review = (() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const P = window.P10;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const RATE = [
    ["story", "Câu chuyện dễ theo dõi từ đầu đến cuối."],
    ["charts", "Các biểu đồ dễ đọc, tôi hiểu được con số chính."],
    ["tool", "Phần Đi chợ cùng An dễ dùng."],
    ["animation", "Hình động giúp tôi hiểu giá thay đổi thế nào."],
    ["design", "Giao diện đẹp và thống nhất từ đầu đến cuối."],
    ["trust", "Tôi tin các con số trên trang."],
    ["use", "Tôi sẽ dùng công cụ này khi chọn nơi mua đồ ăn."],
  ];
  const LEVEL = ["Hoàn toàn không đồng ý", "Không đồng ý", "Bình thường", "Đồng ý", "Rất đồng ý"];
  const ICON = {
    pot: `<path d="M10 30 H54 V44 Q54 54 44 54 H20 Q10 54 10 44 Z" fill="#B9A8F2" stroke="#26235F" stroke-width="3"/><path d="M5 30 H59" stroke="#26235F" stroke-width="3.5" stroke-linecap="round"/><path d="M25 22 c-5 -6 5 -10 0 -16 M39 22 c-5 -6 5 -10 0 -16" fill="none" stroke="#F36FA9" stroke-width="3" stroke-linecap="round"/>`,
    phone: `<rect x="20" y="6" width="24" height="52" rx="6" fill="#9BBDD6" stroke="#26235F" stroke-width="3"/><rect x="25" y="14" width="14" height="30" rx="2" fill="#FFF7E6"/><circle cx="32" cy="51" r="2.5" fill="#26235F"/><path d="M27 22 h10 M27 28 h10 M27 34 h7" stroke="#F36FA9" stroke-width="2.5" stroke-linecap="round"/>`,
    team: `<circle cx="20" cy="26" r="9" fill="#FFD3B0" stroke="#26235F" stroke-width="3"/><circle cx="44" cy="26" r="9" fill="#FFD3B0" stroke="#26235F" stroke-width="3"/><circle cx="32" cy="20" r="10" fill="#FFD3B0" stroke="#26235F" stroke-width="3"/><path d="M8 54 Q8 38 20 38 Q32 38 32 54 Z M32 54 Q32 38 44 38 Q56 38 56 54 Z" fill="#8FE3D6" stroke="#26235F" stroke-width="3"/>`,
    other: `<path d="M32 6 L39 24 L58 25 L43 37 L48 56 L32 45 L16 56 L21 37 L6 25 L25 24 Z" fill="#FFE3A3" stroke="#26235F" stroke-width="3" stroke-linejoin="round"/>`,
    cho: `<path d="M6 22 H58 V14 H6 Z" fill="#F36FA9"/><path d="M12 14 v8 M24 14 v8 M36 14 v8 M48 14 v8" stroke="#FFF1C9" stroke-width="5"/><rect x="10" y="22" width="44" height="32" rx="3" fill="#B85C38" stroke="#26235F" stroke-width="3"/><circle cx="24" cy="38" r="6" fill="#F0503C"/><circle cx="40" cy="38" r="6" fill="#7DD3C4"/>`,
    st: `<rect x="8" y="16" width="48" height="40" rx="3" fill="#1F3D55" stroke="#26235F" stroke-width="3"/><rect x="12" y="8" width="40" height="10" rx="3" fill="#FFE3A3" stroke="#26235F" stroke-width="2.5"/><rect x="24" y="34" width="16" height="22" fill="#9CCBF5"/><rect x="14" y="24" width="10" height="7" fill="#FFE3A3"/><rect x="40" y="24" width="10" height="7" fill="#FFE3A3"/>`,
    app: `<rect x="18" y="4" width="28" height="56" rx="7" fill="#26235F"/><rect x="22" y="10" width="20" height="40" rx="3" fill="#9BBDD6"/><path d="M26 24 h3 l2 9 h8 l2 -6 h-12" fill="none" stroke="#26235F" stroke-width="2.2" stroke-linejoin="round"/>`,
    many: `<circle cx="20" cy="22" r="10" fill="#F36FA9" stroke="#26235F" stroke-width="3"/><circle cx="44" cy="22" r="10" fill="#9BBDD6" stroke="#26235F" stroke-width="3"/><circle cx="32" cy="44" r="10" fill="#B85C38" stroke="#26235F" stroke-width="3"/>`,
  };
  const svgIcon = k => `<svg viewBox="0 0 64 64" aria-hidden="true">${ICON[k]}</svg>`;
  const ROLES = [["sv-nau", "Sinh viên tự nấu ăn", "pot"], ["sv-it-nau", "Sinh viên, ít khi tự nấu", "phone"], ["nhom-khac", "Thành viên nhóm khác (peer review)", "team"], ["khac", "Khác", "other"]];
  const BUYS = [["cho", "Chợ", "cho"], ["sieu-thi", "Siêu thị", "st"], ["app", "App giao hàng", "app"], ["nhieu-noi", "Nhiều nơi", "many"]];
  const SCENES = [["khong", "Không có phần nào"], ["s-cong", "Mở đầu"], ["s-an", "An, sinh viên UEH"], ["s-gio", "Giỏ hàng 12 món"], ["s-mua", "Ba nơi mua"], ["s-phi", "Phí giao hàng"],
    ["s-mon", "Từng món"], ["s-tien", "Phần trăm và tiền"], ["s-tuan", "8 tuần"], ["s-quan", "Hai quận"], ["s-cpi", "So với CPI"], ["s-thu", "Thử 2D và 3D"], ["s-goiy", "Gợi ý cho An"], ["s-chon", "Đi chợ cùng An"]];
  const PEER = [["titles", "Mỗi biểu đồ có tiêu đề nêu kết luận kèm con số"], ["colours", "Màu sắc thống nhất, chỉ tô màu điều cần nhấn"], ["sources", "Có ghi nguồn dữ liệu và giới hạn của dữ liệu"],
    ["honest", "Không có biểu đồ gây hiểu lầm, như trục bị cắt hay 3D không cần thiết"], ["tool", "Công cụ trả lời được một câu hỏi thật của người dùng"], ["story", "Câu chuyện có mở đầu, phần chính và kết luận rõ ràng"]];

  let R = null, deck, A, pos, opts, stepList;

  function steps() {
    const s = ["intro", "role", "buys", ...RATE.map(r => "rate:" + r[0]), "hard", "say"];
    if (A.role === "nhom-khac") s.push("peer");
    s.push("send");
    return s;
  }
  function progress() {
    const list = steps(), n = list.length - 1, at = Math.min(pos, n);
    const box = $(".rvx-prog", R);
    if (box.children.length !== n) box.innerHTML = Array.from({ length: n }, () => `<span><svg viewBox="0 0 60 110" aria-hidden="true"><use href="#lantern"/></svg></span>`).join("");
    $$("span", box).forEach((s, i) => { const was = s.classList.contains("lit"); s.classList.toggle("lit", i < at); if (!was && i < at && !reduced()) gsap.fromTo(s, { rotation: -20 }, { rotation: 0, transformOrigin: "50% 0", duration: 1, ease: "elastic.out(1, .3)" }); });
    $(".rvx-count", R).textContent = pos > 0 && pos < list.length - 1 ? `Câu ${pos}/${list.length - 2}` : "";
    $(".rvx-back", R).hidden = pos === 0;
  }

  /* ---------------------------------------------------------------- cards */
  function card(html) {
    const c = document.createElement("section");
    c.className = "paper rvx-card";
    c.innerHTML = html;
    return c;
  }
  function show(dir = 1) {
    stepList = steps();
    const key = stepList[pos], old = $(".rvx-card", deck), c = render(key);
    deck.appendChild(c);
    progress();
    if (reduced() || !window.gsap) { if (old) old.remove(); }
    else {
      if (old) gsap.to(old, { x: -90 * dir, rotation: -5 * dir, opacity: 0, duration: .32, ease: "power2.in", onComplete: () => old.remove() });
      gsap.fromTo(c, { x: 110 * dir, rotation: 5 * dir, opacity: 0 }, { x: 0, rotation: 0, opacity: 1, duration: .55, ease: "power3.out", delay: old ? .12 : 0 });
      gsap.from($$(".rvx-anim", c), { y: 16, opacity: 0, stagger: .06, duration: .4, delay: old ? .3 : .15 });
    }
    setTimeout(() => { const f = $("button, textarea", c); if (f && key !== "intro") f.focus({ preventScroll: true }); }, 450);
  }
  const next = () => { pos = Math.min(pos + 1, steps().length - 1); show(1); };
  const back = () => { if (pos > 0) { pos -= 1; show(-1); } };

  function render(key) {
    if (key === "intro") {
      const c = card(`<div class="rvx-hero rvx-anim"><svg viewBox="-70 -200 140 210" aria-hidden="true">${P.student("waving")}</svg>
        <div><p class="tag">Bước cuối · Đánh giá</p><h2>Bạn thấy trang của nhóm em thế nào?</h2></div></div>
        <p class="rvx-anim">Phiếu có ${steps().length - 2} câu ngắn, mất khoảng hai phút. Nhóm em không hỏi tên bạn. Câu trả lời chỉ nhóm em xem được và chỉ dùng để sửa trang cho bản cuối của đồ án.</p>
        <div class="rvx-row rvx-anim"><button type="button" class="cta big" data-next>Bắt đầu</button></div>`);
      $("[data-next]", c).addEventListener("click", next);
      return c;
    }
    if (key === "role" || key === "buys") {
      const list = key === "role" ? ROLES : BUYS, field = key === "role" ? "role" : "buys_at";
      const c = card(`<p class="tag rvx-anim">${key === "role" ? "Về bạn" : "Thói quen mua"}</p><h2 class="rvx-anim">${key === "role" ? "Bạn là ai?" : "Bạn thường mua đồ ăn ở đâu?"}</h2>
        <div class="rvx-tiles" role="radiogroup">${list.map(([v, t, ic]) => `<button type="button" class="rvx-tile rvx-anim" role="radio" aria-checked="${A[field] === v}" data-v="${v}">${svgIcon(ic)}<span>${t}</span></button>`).join("")}</div>`);
      $$(".rvx-tile", c).forEach(b => b.addEventListener("click", () => {
        A[field] = b.dataset.v;
        $$(".rvx-tile", c).forEach(x => x.setAttribute("aria-checked", String(x === b)));
        if (!reduced()) gsap.fromTo($("svg", b), { scale: .6, rotation: -15 }, { scale: 1, rotation: 0, duration: .5, ease: "back.out(3)" });
        setTimeout(next, reduced() ? 0 : 420);
      }));
      return c;
    }
    if (key.startsWith("rate:")) {
      const k = key.slice(5), q = RATE.find(r => r[0] === k)[1], cur = A.ratings[k] || 0;
      const c = card(`<p class="tag rvx-anim">Chấm điểm · thắp lồng đèn</p><p class="rvx-q rvx-anim">${q}</p>
        <div class="rvx-lanterns rvx-anim" role="radiogroup" aria-label="${q}">${[1, 2, 3, 4, 5].map(n => `<button type="button" class="rvx-lt${n <= cur ? " lit" : ""}" role="radio" aria-checked="${n === cur}" aria-label="${n} trên 5, ${LEVEL[n - 1]}" data-n="${n}"><svg viewBox="0 0 60 110" aria-hidden="true"><use href="#lantern"/></svg><span>${n}</span></button>`).join("")}</div>
        <div class="rvx-scale rvx-anim"><span>Không đồng ý</span><span>Rất đồng ý</span></div><p class="rvx-mood" aria-live="polite">${cur ? LEVEL[cur - 1] : "Bấm vào một lồng đèn"}</p>`);
      const lts = $$(".rvx-lt", c), mood = $(".rvx-mood", c);
      const light = n => lts.forEach((b, i) => b.classList.toggle("lit", i < n));
      lts.forEach((b, i) => {
        b.addEventListener("mouseenter", () => { light(i + 1); mood.textContent = LEVEL[i]; });
        b.addEventListener("mouseleave", () => { light(A.ratings[k] || 0); mood.textContent = A.ratings[k] ? LEVEL[A.ratings[k] - 1] : "Bấm vào một lồng đèn"; });
        b.addEventListener("click", () => {
          A.ratings[k] = i + 1;
          light(i + 1); mood.textContent = LEVEL[i];
          lts.forEach((x, j) => x.setAttribute("aria-checked", String(j === i)));
          if (!reduced()) lts.slice(0, i + 1).forEach((x, j) => gsap.fromTo($("svg", x), { rotation: j % 2 ? 16 : -16, y: -6 }, { rotation: 0, y: 0, transformOrigin: "50% 0", duration: 1.1, delay: j * .05, ease: "elastic.out(1, .3)" }));
          setTimeout(next, reduced() ? 0 : 620);
        });
      });
      c.addEventListener("keydown", e => { const n = +e.key; if (n >= 1 && n <= 5) lts[n - 1].click(); });
      return c;
    }
    if (key === "hard") {
      const c = card(`<p class="tag rvx-anim">Góp ý</p><h2 class="rvx-anim">Phần nào khó hiểu nhất?</h2>
        <div class="rvx-chips rvx-anim" role="radiogroup">${SCENES.map(([v, t]) => `<button type="button" class="pill" role="radio" aria-pressed="${A.hard_part === v}" aria-checked="${A.hard_part === v}" data-v="${v}">${t}</button>`).join("")}</div>
        <label class="flabel rvx-why" for="rvx-why"${A.hard_part && A.hard_part !== "khong" ? "" : " hidden"}>Vì sao phần đó khó hiểu? (không bắt buộc)</label>
        <textarea id="rvx-why" rows="2" maxlength="1200"${A.hard_part && A.hard_part !== "khong" ? "" : " hidden"}>${A.hard_text || ""}</textarea>
        <div class="rvx-row"><button type="button" class="cta" data-next${A.hard_part ? "" : " disabled"}>Tiếp</button></div>`);
      const why = $("#rvx-why", c), lab = $(".rvx-why", c), go = $("[data-next]", c);
      $$(".pill", c).forEach(b => b.addEventListener("click", () => {
        A.hard_part = b.dataset.v;
        $$(".pill", c).forEach(x => { x.setAttribute("aria-pressed", String(x === b)); x.setAttribute("aria-checked", String(x === b)); });
        const showWhy = A.hard_part !== "khong";
        if (showWhy && why.hidden && !reduced()) { why.hidden = false; lab.hidden = false; gsap.from([lab, why], { y: 10, opacity: 0, duration: .35 }); }
        why.hidden = !showWhy; lab.hidden = !showWhy;
        go.disabled = false;
      }));
      why.addEventListener("input", () => { A.hard_text = why.value; });
      go.addEventListener("click", next);
      return c;
    }
    if (key === "say") {
      const c = card(`<p class="tag rvx-anim">Góp ý</p><h2 class="rvx-anim">Nhóm em nên sửa gì?</h2>
        <label class="flabel rvx-anim" for="rvx-fix">Một điều nhóm em nên sửa</label>
        <textarea id="rvx-fix" class="rvx-anim" rows="3" maxlength="1200" placeholder="Ví dụ: chữ trên biểu đồ nhỏ, phần đi chợ hơi dài...">${A.fix || ""}</textarea>
        <label class="flabel rvx-anim" for="rvx-like" style="margin-top:14px">Điều bạn thích nhất</label>
        <textarea id="rvx-like" class="rvx-anim" rows="2" maxlength="1200">${A.like || ""}</textarea>
        <div class="rvx-row"><button type="button" class="cta" data-next>Tiếp</button></div>`);
      $("#rvx-fix", c).addEventListener("input", e => { A.fix = e.target.value; });
      $("#rvx-like", c).addEventListener("input", e => { A.like = e.target.value; });
      $("[data-next]", c).addEventListener("click", next);
      return c;
    }
    if (key === "peer") {
      const c = card(`<p class="tag rvx-anim">Peer review</p><h2 class="rvx-anim">Trang của nhóm em đạt đến đâu?</h2>
        ${PEER.map(([k, t]) => `<div class="rvx-pc rvx-anim"><span id="pc-${k}">${t}</span><div class="seg" role="radiogroup" aria-labelledby="pc-${k}">${[["co", "Có"], ["mot-phan", "Một phần"], ["khong", "Chưa có"]].map(([v, x]) => `<button type="button" class="pill" role="radio" aria-pressed="${A.peer[k] === v}" data-k="${k}" data-v="${v}">${x}</button>`).join("")}</div></div>`).join("")}
        <label class="flabel" for="rvx-team" style="margin-top:12px">Tên hoặc số nhóm của bạn (không bắt buộc)</label><input type="text" id="rvx-team" maxlength="80" value="${(A.team_name || "").replace(/"/g, "&quot;")}">
        <div class="rvx-row"><button type="button" class="cta" data-next>Tiếp</button></div>`);
      const go = $("[data-next]", c), check = () => { go.disabled = PEER.some(([k]) => !A.peer[k]); };
      $$(".pill", c).forEach(b => b.addEventListener("click", () => {
        A.peer[b.dataset.k] = b.dataset.v;
        $$(`.pill[data-k="${b.dataset.k}"]`, c).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
        check();
      }));
      $("#rvx-team", c).addEventListener("input", e => { A.team_name = e.target.value; });
      go.addEventListener("click", next);
      check();
      return c;
    }
    // send
    const rates = RATE.map(([k]) => A.ratings[k]).filter(Boolean), mean = rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
    const T = P.test.get();
    const c = card(`<p class="tag rvx-anim">Gửi phiếu</p><h2 class="rvx-anim">Sẵn sàng gửi cho nhóm em</h2>
      <div class="rvx-sum rvx-anim"><div><b>${(ROLES.find(r => r[0] === A.role) || [, "Chưa chọn"])[1]}</b><span>bạn là</span></div>
        <div><b>${mean ? mean.toLocaleString("vi-VN", { maximumFractionDigits: 1 }) : "chưa có"}</b><span>điểm trung bình</span></div>
        <div><b>${(T.tasks || []).filter(t => !t.skipped).length}</b><span>câu hỏi nhanh đã làm</span></div></div>
      <p class="rvx-anim" style="font-size:14px;color:var(--ink-2)">Nhóm em sẽ gửi phiếu này cùng phần bạn đã làm trong lúc xem trang (bài thử 5 giây, các câu hỏi nhanh và thời gian).</p>
      <input type="text" class="rvx-hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="rvx-row rvx-anim"><button type="button" class="cta big" data-send>Gửi đánh giá</button></div><p class="rvx-err" hidden></p>`);
    $("[data-send]", c).addEventListener("click", () => send(c));
    return c;
  }

  /* ---------------------------------------------------------------- sending, then a sky of lanterns */
  async function send(c) {
    const btn = $("[data-send]", c), err = $(".rvx-err", c);
    btn.disabled = true; btn.textContent = "Đang gửi..."; err.hidden = true;
    const T = P.test.get(), w = window.innerWidth;
    const body = {
      mode: T.mode === "test" ? "test" : "view", role: A.role, buys_at: A.buys_at, ratings: A.ratings,
      hard_part: A.hard_part === undefined ? "" : A.hard_part, hard_text: A.hard_text || "", fix: A.fix || "", like: A.like || "",
      peer: A.role === "nhom-khac" ? A.peer : {}, team_name: A.role === "nhom-khac" ? (A.team_name || "") : "",
      five_sec: T.five_sec || null, tasks: T.tasks || [],
      minutes_total: T.started ? Math.round((Date.now() - T.started) / 6000) / 10 : null,
      screen: w < 600 ? "phone" : w < 1024 ? "tablet" : "desktop", website: $(".rvx-hp", c).value,
    };
    try {
      const r = await fetch("/api/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || r.status);
      P.test.clear();
      document.dispatchEvent(new CustomEvent("p10:reviewed"));
      thanks(c);
    } catch (e) {
      btn.disabled = false; btn.textContent = "Gửi lại";
      err.hidden = false; err.textContent = `Chưa gửi được (${String(e.message || e)}). Bạn kiểm tra mạng rồi bấm gửi lại giúp nhóm em nhé.`;
    }
  }
  function thanks(c) {
    $(".rvx-top", R).style.visibility = "hidden"; $(".rvx-nav", R).style.visibility = "hidden";
    const done = document.createElement("section");
    done.className = "paper rvx-card rvx-thanks";
    done.innerHTML = `<svg class="rvx-an" viewBox="-70 -200 140 210" aria-hidden="true">${P.student("waving")}</svg>
      <h2>Cảm ơn bạn rất nhiều!</h2><p>Nhóm em đã nhận được đánh giá của bạn. Góp ý của bạn sẽ được ghi vào nhật ký chỉnh sửa, và trang sẽ được sửa thành bản cuối của đồ án.</p>
      <div class="rvx-row" style="justify-content:center">${opts.page ? `<a class="cta" href="index.html">Xem lại câu chuyện</a>` : `<button type="button" class="cta" data-end>Xem phần kết</button>`}</div>`;
    const end = $("[data-end]", done);
    if (end) end.addEventListener("click", () => { const f = opts.onDone; close(); if (f) f(); });
    if (reduced() || !window.gsap) { c.remove(); deck.appendChild(done); return; }
    const flyer = document.createElement("div");
    flyer.className = "rvx-flyer";
    flyer.innerHTML = `<svg viewBox="0 0 60 110"><use href="#lantern"/></svg>`;
    R.appendChild(flyer);
    gsap.timeline()
      .to(c, { scale: .2, opacity: 0, rotation: -8, y: 40, duration: .55, ease: "power2.in" })
      .call(() => c.remove())
      .fromTo(flyer, { y: 0, scale: .4, opacity: 0 }, { opacity: 1, scale: 1.3, duration: .3 }, .45)
      .to(flyer, { y: -window.innerHeight * .7, x: 40, duration: 1.6, ease: "power1.in" }, .7)
      .to(flyer, { opacity: 0, duration: .4 }, 1.9)
      .call(() => { flyer.remove(); deck.appendChild(done); sky(); }, null, 1.4)
      .from(done, { y: 60, opacity: 0, scale: .9, duration: .8, ease: "back.out(1.6)" }, 1.45);
  }
  function sky() {
    const box = $(".rvx-sky", R), n = window.innerWidth < 600 ? 18 : 30;
    for (let i = 0; i < n; i++) {
      const s = document.createElement("div");
      s.className = "rvx-fly";
      const size = 22 + Math.random() * 34;
      s.style.left = (Math.random() * 96) + "%"; s.style.width = size + "px";
      s.innerHTML = `<svg viewBox="0 0 60 110"><use href="#lantern"/></svg>`;
      box.appendChild(s);
      const dur = 7 + Math.random() * 6;
      gsap.fromTo(s, { y: window.innerHeight + 120, opacity: 0 }, { y: -160, opacity: 1, duration: dur, delay: Math.random() * 3, ease: "none", onComplete: () => s.remove() });
      gsap.to(s, { x: gsap.utils.random(-50, 50), rotation: gsap.utils.random(-10, 10), duration: 2 + Math.random() * 2, yoyo: true, repeat: -1, ease: "sine.inOut" });
    }
  }

  /* ---------------------------------------------------------------- open and close */
  function open(o = {}) {
    if (R) return;
    opts = o;
    A = { role: "", buys_at: "", ratings: {}, peer: {} };
    pos = 0;
    R = document.createElement("div");
    R.className = "rvx" + (o.page ? " page" : "");
    R.setAttribute("role", "dialog"); R.setAttribute("aria-modal", o.page ? "false" : "true"); R.setAttribute("aria-label", "Phiếu đánh giá");
    R.innerHTML = `<div class="rvx-sky" aria-hidden="true"></div>
      <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="gg-wood" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#D99A5B"/><stop offset="1" stop-color="#A86A35"/></linearGradient></defs></svg>
      <header class="rvx-top"><div class="rvx-prog" aria-hidden="true"></div>${o.forced || o.page ? "" : `<button type="button" class="rvx-later">Để sau</button>`}</header>
      <div class="rvx-deck"></div>
      <footer class="rvx-nav"><button type="button" class="rvx-back" hidden>Quay lại</button><span class="rvx-count"></span></footer>`;
    (o.mount || document.body).appendChild(R);
    if (!o.page) document.documentElement.style.overflow = "hidden";
    deck = $(".rvx-deck", R);
    $(".rvx-back", R).addEventListener("click", back);
    const later = $(".rvx-later", R);
    if (later) later.addEventListener("click", () => { const f = opts.onLater; close(); if (f) f(); });
    R.addEventListener("keydown", e => { if (e.key === "Escape" && later) later.click(); });
    if (!reduced() && window.gsap) gsap.from(R, { opacity: 0, duration: .5 });
    show(1);
  }
  function close() {
    if (!R) return;
    const r = R;
    R = null;
    const fin = () => { r.remove(); if (!opts.page) document.documentElement.style.overflow = ""; };
    if (reduced() || !window.gsap) fin(); else gsap.to(r, { opacity: 0, duration: .35, onComplete: fin });
  }

  // the end card of the story and any link with data-review open the form over the page
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest("[data-review]");
    if (!a) return;
    e.preventDefault();
    open({});
  });
  if (document.body && document.body.dataset.review === "page") P.loadShared().then(() => open({ page: true, mount: document.querySelector("main") }));

  return { open, close };
})();
