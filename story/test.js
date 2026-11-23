/* Test mode of the presentation site, opened with ?test: a welcome card, the five second test of the key chart,
   and a pill that shows the step of the test. The answers go into the record of P10.test (an.js), which the
   review form (danh-gia.html) sends together with the three tasks of the explorer. ?test=new starts a new test. */
(() => {
  "use strict";
  const params = new URLSearchParams(location.search);
  const P = window.P10;
  if (params.has("still") || params.has("only")) return;
  if (params.get("test") === "new") P.test.clear();
  if (params.has("test")) P.test.set({ mode: "test", started: P.test.get().started || Date.now() });
  if (P.test.get().mode !== "test") return;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nf = new Intl.NumberFormat("vi-VN");
  const lockScroll = on => { document.documentElement.style.overflow = on ? "hidden" : ""; };

  /* ---------------------------------------------------------------- the pill with the step */
  const pill = document.createElement("div");
  pill.className = "test-pill";
  pill.setAttribute("role", "status");
  function step() {
    if (pill.dataset.reviewed) { pill.innerHTML = `<span>Thử nghiệm xong · cảm ơn bạn rất nhiều</span>`; return; }
    const t = P.test.get(), done = !!t.m9done;
    const atExplorer = pill.dataset.chon === "1";
    if (done) pill.innerHTML = `<span>Thử nghiệm · bước 4/4: đánh giá</span><a href="danh-gia.html">Đánh giá</a>`;
    else if (atExplorer) pill.innerHTML = `<span>Thử nghiệm · bước 3/4: đi chợ cùng An</span>`;
    else pill.innerHTML = `<span>Thử nghiệm · bước 2/4: xem câu chuyện</span><a href="#s-chon">Đến phần tự chọn</a>`;
  }
  function startPill() {
    document.body.appendChild(pill);
    step();
    const chon = document.getElementById("s-chon");
    if (chon) new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { pill.dataset.chon = "1"; step(); } }), { threshold: .15 }).observe(chon);
    document.addEventListener("p10:tasks", step);
    document.addEventListener("p10:reviewed", () => { pill.dataset.reviewed = "1"; step(); });
  }

  /* ---------------------------------------------------------------- the key chart of the five second test */
  function keyChart(F) {
    const v = F.basket.vnd, p = F.basket.pct_over_market, CH = ["Chợ", "Siêu thị", "App"];
    const col = { "Chợ": "#B85C38", "Siêu thị": "#1F3D55", "App": "#9BBDD6" };
    const W = 440, x0 = 74, bw = 220, max = Math.max(...CH.map(c => v[c]));
    const rows = CH.map((c, i) => {
      const y = 8 + i * 46, w = (v[c] / max) * bw;
      return `<text x="${x0 - 10}" y="${y + 20}" text-anchor="end" font-size="15" font-weight="600" fill="#26235F">${c}</text>` +
        `<rect x="${x0}" y="${y}" width="${w}" height="30" rx="5" fill="${col[c]}"/>` +
        `<text x="${x0 + w + 10}" y="${y + 20}" font-size="15" font-weight="700" fill="#1A1A1A">${nf.format(v[c])}đ` +
        (c === "Chợ" ? "" : `<tspan font-weight="500" fill="#4A4458"> +${Math.round(p[c])}%</tspan>`) + `</text>`;
    }).join("");
    return `<h2 style="margin:0 0 4px">Cùng một giỏ hàng, mua qua app đắt hơn chợ ${Math.round(p.App)}%</h2>
      <p class="note" style="margin:0 0 10px">Giỏ 12 món, trung bình 6 tuần đủ giá, hai quận, chưa tính phí giao</p>
      <svg viewBox="0 0 ${W} 146" role="img" aria-label="Biểu đồ thanh ngang tiền giỏ hàng ở ba nơi">
      <line x1="${x0}" x2="${x0}" y1="0" y2="146" stroke="#1A1A1A" stroke-width="1.2"/>${rows}</svg>`;
  }

  /* ---------------------------------------------------------------- the overlay with its steps */
  function overlay(F) {
    const ov = document.createElement("div");
    ov.className = "test-ov";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.innerHTML = `<div class="paper test-card" tabindex="-1"></div>`;
    document.body.appendChild(ov);
    lockScroll(true);
    const card = ov.firstChild;
    const show = html => {
      card.innerHTML = html;
      card.focus();
      if (!reduced && window.gsap) gsap.from(card.children, { y: 16, opacity: 0, stagger: .07, duration: .4, ease: "power2.out" });
    };
    const answer = { text: "", choice: "" };

    function welcome() {
      show(`<p class="tag">Thử nghiệm M10 · Nhóm 10, UEH</p>
        <h2>Cảm ơn bạn đã nhận lời thử trang của nhóm em</h2>
        <p>Trang này kể lại kết quả 8 tuần nhóm em đi ghi giá đồ ăn ở chợ, siêu thị và app. Phần thử mất khoảng 10 phút, gồm 4 bước:</p>
        <ol class="test-steps"><li>Nhìn một biểu đồ trong 5 giây, rồi trả lời 2 câu hỏi.</li><li>Xem câu chuyện từ đầu đến cuối.</li>
        <li>Đi chợ cùng An: chọn món, chọn nơi mua, so sánh và trả lời 2 câu hỏi nhanh.</li><li>Chấm điểm và góp ý cho trang.</li></ol>
        <p class="note">Nhóm em không hỏi tên bạn. Câu trả lời chỉ nhóm em xem được và chỉ dùng cho đồ án.</p>
        <div class="test-actions"><button type="button" class="cta" data-go="ready">Bắt đầu</button></div>`);
    }
    function ready() {
      show(`<p class="tag">Bước 1/4 · Thử 5 giây</p><h2>Bạn sẽ thấy một biểu đồ trong 5 giây</h2>
        <p>Hãy nhìn thật nhanh và nhớ ý chính. Sau 5 giây biểu đồ sẽ ẩn đi.</p>
        <div class="test-actions"><button type="button" class="cta" data-go="chart">Tôi sẵn sàng</button></div>`);
    }
    function chart() {
      show(`<p class="tag">Bước 1/4 · Thử 5 giây</p><div class="five-chart">${keyChart(F)}</div>
        <div class="ring"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="16" fill="none" stroke="#F1E3C3" stroke-width="5"/>
        <circle class="ring-arc" cx="20" cy="20" r="16" fill="none" stroke="#F36FA9" stroke-width="5" stroke-linecap="round" stroke-dasharray="100.5" stroke-dashoffset="0"/></svg>
        <span class="ring-n">5 giây</span></div>`);
      const arc = card.querySelector(".ring-arc"), n = card.querySelector(".ring-n"), t0 = performance.now();
      const tick = t => {
        const k = Math.min(1, (t - t0) / 5000);
        arc.setAttribute("stroke-dashoffset", String(100.5 * k));
        n.textContent = Math.ceil(5 - k * 5) + " giây";
        if (k < 1) requestAnimationFrame(tick); else questions();
      };
      requestAnimationFrame(tick);
    }
    function questions() {
      show(`<p class="tag">Bước 1/4 · Thử 5 giây</p><h2>Biểu đồ vừa rồi nói điều gì?</h2>
        <label for="five-text" class="flabel">Viết bằng lời của bạn, một câu là đủ</label>
        <textarea id="five-text" rows="3" maxlength="600"></textarea>
        <p class="flabel" style="margin-top:14px">Theo biểu đồ, mua ở đâu rẻ nhất?</p>
        <div class="seg" role="group" aria-label="Nơi rẻ nhất">${["Chợ", "Siêu thị", "App", "Không nhớ"].map(c => `<button type="button" class="pill" data-choice="${c}" aria-pressed="false">${c}</button>`).join("")}</div>
        <div class="test-actions"><button type="button" class="cta" data-go="save">Tiếp tục</button></div>`);
      card.querySelector("#five-text").addEventListener("input", e => { answer.text = e.target.value; });
    }
    function story() {
      P.test.set({ five_sec: { text: answer.text.trim(), choice: answer.choice, correct: answer.choice === "Chợ" } });
      show(`<p class="tag">Bước 2/4 · Xem câu chuyện</p><h2>Bây giờ mời bạn xem câu chuyện</h2>
        <p>Hãy cuộn xuống, hoặc bấm phím mũi tên trên máy tính, để xem từ đầu đến cuối. Mỗi cảnh có hình động, bạn cứ xem hết rồi mới cuộn tiếp.</p>
        <p>Đến cảnh <b>Đến lượt bạn</b>, trò chơi <b>Đi chợ cùng An</b> sẽ tự mở. Chơi xong, phiếu đánh giá mở ngay sau đó.</p>
        <div class="test-actions"><button type="button" class="cta" data-go="close">Xem câu chuyện</button></div>`);
    }
    card.addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.choice) {
        answer.choice = b.dataset.choice;
        card.querySelectorAll("[data-choice]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      }
      const go = b.dataset.go;
      if (go === "ready") ready();
      else if (go === "chart") chart();
      else if (go === "save") story();
      else if (go === "close") {
        lockScroll(false);
        window.scrollTo(0, 0);
        const done = () => { ov.remove(); startPill(); document.dispatchEvent(new CustomEvent("p10:test-ready")); };
        if (!reduced && window.gsap) gsap.to(ov, { opacity: 0, duration: .45, onComplete: done }); else done();
      }
    });
    welcome();
  }

  async function begin() {
    if (P.test.get().five_sec) { startPill(); return; }               // the tester came back to the page: no second five second test
    try {
      const F = await (await fetch("data/facts.json", { cache: "no-store" })).json();
      overlay(F);
    } catch (e) { startPill(); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", begin); else begin();
})();
