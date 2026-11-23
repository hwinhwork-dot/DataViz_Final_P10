/* The team page of M10: reads every review through /api/reviews with the team passcode, sums them up and
   exports them as CSV for the notebook (improvement log and test results). The passcode stays in this tab only. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const KEY = "p10-team-key";
  const store = {
    get() { try { return sessionStorage.getItem(KEY) || ""; } catch (e) { return ""; } },
    set(v) { try { sessionStorage.setItem(KEY, v); } catch (e) { /* the page asks again next time */ } },
    clear() { try { sessionStorage.removeItem(KEY); } catch (e) { /* nothing to clear */ } },
  };
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const dec = (v, d = 1) => v.toLocaleString("vi-VN", { minimumFractionDigits: d, maximumFractionDigits: d });
  const median = a => { const s = a.filter(v => v != null).sort((x, y) => x - y); if (!s.length) return null; const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const when = iso => new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const ROLE = { "sv-nau": "Sinh viên tự nấu", "sv-it-nau": "Sinh viên ít nấu", "nhom-khac": "Nhóm khác", khac: "Khác", "": "Không rõ" };
  const BUY = { cho: "Chợ", "sieu-thi": "Siêu thị", app: "App", "nhieu-noi": "Nhiều nơi", "": "" };
  const RATE = { story: "Câu chuyện dễ theo dõi", charts: "Biểu đồ dễ đọc", tool: "Công cụ dễ dùng", animation: "Hình động giúp thấy thay đổi",
                 design: "Giao diện đẹp, thống nhất", trust: "Tin các con số", use: "Sẽ dùng công cụ" };
  const PEER = { titles: "Tiêu đề nêu kết luận", colours: "Màu thống nhất", sources: "Nguồn và giới hạn", honest: "Không gây hiểu lầm",
                 tool: "Công cụ trả lời câu hỏi thật", story: "Câu chuyện rõ" };
  const SCENE = { khong: "Không có", "s-cong": "Mở đầu", "s-an": "An, sinh viên UEH", "s-gio": "Giỏ hàng 12 món", "s-mua": "Ba nơi mua",
                  "s-phi": "Phí giao hàng", "s-mon": "Từng món", "s-tien": "Phần trăm và tiền", "s-tuan": "8 tuần", "s-quan": "Hai quận",
                  "s-cpi": "So với CPI", "s-thu": "Thử 2D và 3D", "s-goiy": "Gợi ý cho An", "s-chon": "Đến lượt bạn" };
  let DATA = [];

  async function call(method, query = "") {
    const r = await fetch("/api/reviews" + query, { method, headers: { "x-team-key": store.get() }, cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401) { const e = new Error("key"); e.key = true; throw e; }
    if (!r.ok || !j.ok) throw new Error(j.error || r.status);
    return j;
  }

  async function load() {
    try {
      const j = await call("GET");
      DATA = j.reviews;
      $("#login").hidden = true; $("#dash").hidden = false;
      render();
    } catch (e) {
      $("#dash").hidden = true; $("#login").hidden = false;
      const err = $("#login-err");
      if (store.get()) { err.hidden = false; err.textContent = e.key ? "Mật khẩu chưa đúng." : "Chưa tải được dữ liệu (" + e.message + ")."; }
      if (e.key) store.clear();
    }
  }

  function bars(rows, max, fmt, hiLowest) {
    if (!rows.length) return `<p class="empty">Chưa có dữ liệu.</p>`;
    const lowest = hiLowest ? Math.min(...rows.map(r => r.v)) : null;
    return rows.map(r => `<div class="hbar"><span>${esc(r.k)}${r.n != null ? ` <small style="color:var(--ink-2)">(n = ${r.n})</small>` : ""}</span>` +
      `<span class="tr"><span class="fl${hiLowest && r.v === lowest ? " hi" : ""}" style="width:${max ? (r.v / max) * 100 : 0}%"></span></span><b>${fmt(r.v)}</b></div>`).join("");
  }

  function render() {
    const n = DATA.length;
    $("#stamp").textContent = `${n} phiếu, cập nhật lúc ${when(new Date().toISOString())}`;
    const allRates = DATA.flatMap(d => Object.values(d.ratings || {}).filter(v => v != null));
    const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
    const tested = DATA.filter(d => d.mode === "test").length, peers = DATA.filter(d => d.role === "nhom-khac").length;
    $("#kpis").innerHTML = [
      [n, "phiếu đánh giá"], [tested, "người thử theo link thử nghiệm"], [peers, "phiếu peer review của nhóm khác"],
      [allRates.length ? dec(mean(allRates)) : "chưa có", "điểm trung bình của mọi tiêu chí (1 đến 5)"],
    ].map(([b, s]) => `<div class="kpi"><b>${b}</b><span>${s}</span></div>`).join("");

    $("#rates").innerHTML = bars(Object.keys(RATE).map(k => {
      const v = DATA.map(d => d.ratings && d.ratings[k]).filter(x => x != null);
      return v.length ? { k: RATE[k], v: mean(v), n: v.length } : null;
    }).filter(Boolean), 5, v => dec(v), true);

    const ids = ["t1", "t2", "t3"];
    const trow = ids.map((id, i) => {
      const t = DATA.flatMap(d => (d.tasks || []).filter(x => x.id === id));
      const answered = t.filter(x => !x.skipped);
      return `<tr><td>${["Chọn đúng nơi rẻ nhất", "Chọn đúng mức tiết kiệm", "Đi hết trò chơi (đúng là đã thử đủ 3 nơi)"][i]}</td><td class="num">${t.length}</td><td class="num">${answered.length ? Math.round((answered.filter(x => x.correct).length / answered.length) * 100) + "%" : ""}</td>` +
        `<td class="num">${answered.length ? dec(median(answered.map(x => x.seconds)), 1) + " giây" : ""}</td><td class="num">${t.filter(x => x.skipped).length}</td></tr>`;
    }).join("");
    $("#tasks").innerHTML = `<table><tr><th>Câu hỏi</th><th class="num">Số người</th><th class="num">Đúng</th><th class="num">Thời gian</th><th class="num">Bỏ qua</th></tr>${trow}</table>`;

    const five = DATA.map(d => d.five_sec).filter(Boolean);
    const choices = ["Chợ", "Siêu thị", "App", "Không nhớ"].map(c => ({ k: c, v: five.filter(f => f.choice === c).length })).filter(r => r.v);
    $("#five").innerHTML = five.length ? `<p><b>${Math.round((five.filter(f => f.correct).length / five.length) * 100)}%</b> trong ${five.length} người chọn đúng chợ là nơi rẻ nhất sau 5 giây.</p>` +
      bars(choices, five.length, v => String(v)) + `<h3 style="font:700 14px var(--sans);color:var(--night);margin:14px 0 8px">Người thử nhớ gì</h3>` +
      (five.filter(f => f.text).map(f => `<p class="quote">${esc(f.text)}</p>`).join("") || `<p class="empty">Chưa có câu trả lời bằng chữ.</p>`)
      : `<p class="empty">Chưa có ai làm bài thử 5 giây.</p>`;

    const hard = Object.keys(SCENE).map(k => ({ k: SCENE[k], v: DATA.filter(d => d.hard_part === k).length })).filter(r => r.v).sort((a, b) => b.v - a.v);
    $("#hard").innerHTML = bars(hard, Math.max(1, ...hard.map(r => r.v)), v => String(v));

    const pr = DATA.filter(d => d.role === "nhom-khac");
    $("#peer").innerHTML = pr.length ? `<table><tr><th>Tiêu chí</th><th class="num">Có</th><th class="num">Một phần</th><th class="num">Chưa có</th></tr>` +
      Object.keys(PEER).map(k => `<tr><td>${PEER[k]}</td>` + ["co", "mot-phan", "khong"].map(v => `<td class="num">${pr.filter(d => d.peer && d.peer[k] === v).length}</td>`).join("") + `</tr>`).join("") +
      `</table><p class="note">Nhóm đã đánh giá: ${esc(pr.map(d => d.team_name).filter(Boolean).join(", ") || "không ghi")}</p>` : `<p class="empty">Chưa có phiếu peer review.</p>`;

    $("#rows").innerHTML = n ? `<table><tr><th>Lúc gửi</th><th>Người đánh giá</th><th class="num">Điểm</th><th>Khó hiểu nhất</th><th>Nên sửa</th><th>Thích nhất</th><th class="num">Thử</th><th></th></tr>` +
      DATA.map(d => {
        const r = Object.values(d.ratings || {}).filter(v => v != null), done = (d.tasks || []).filter(t => !t.skipped);
        return `<tr><td>${when(d.received_at)}</td><td><span class="tagr">${ROLE[d.role] || d.role}</span><br><small>${BUY[d.buys_at] || ""} · ${esc(d.screen)}</small></td>` +
          `<td class="num">${r.length ? dec(mean(r)) : ""}</td><td>${esc(SCENE[d.hard_part] || "")}${d.hard_text ? "<br><small>" + esc(d.hard_text) + "</small>" : ""}</td>` +
          `<td>${esc(d.fix)}</td><td>${esc(d.like)}</td><td class="num">${d.mode === "test" ? `${done.filter(t => t.correct).length}/${(d.tasks || []).length} đúng` : "xem"}` +
          `${d.minutes_total != null ? "<br><small>" + dec(d.minutes_total) + " phút</small>" : ""}</td><td><button type="button" class="del" data-id="${esc(d.id)}">Xoá</button></td></tr>`;
      }).join("") + `</table>` : `<p class="empty">Chưa có phiếu nào.</p>`;
  }

  function csv() {
    const cols = ["id", "received_at", "mode", "role", "buys_at", "team_name", ...Object.keys(RATE).map(k => "rate_" + k), "hard_part", "hard_text", "fix", "like",
      "five_text", "five_choice", "five_correct", ...["t1", "t2", "t3"].flatMap(t => [t + "_answer", t + "_correct", t + "_seconds", t + "_skipped"]),
      "minutes_total", "screen", ...Object.keys(PEER).map(k => "peer_" + k)];
    const row = d => {
      const t = id => (d.tasks || []).find(x => x.id === id) || {};
      const v = { id: d.id, received_at: d.received_at, mode: d.mode, role: d.role, buys_at: d.buys_at, team_name: d.team_name, hard_part: d.hard_part,
        hard_text: d.hard_text, fix: d.fix, like: d.like, five_text: d.five_sec && d.five_sec.text, five_choice: d.five_sec && d.five_sec.choice,
        five_correct: d.five_sec ? d.five_sec.correct : "", minutes_total: d.minutes_total, screen: d.screen };
      Object.keys(RATE).forEach(k => { v["rate_" + k] = d.ratings && d.ratings[k]; });
      Object.keys(PEER).forEach(k => { v["peer_" + k] = d.peer && d.peer[k]; });
      ["t1", "t2", "t3"].forEach(id => { const x = t(id); v[id + "_answer"] = x.answer; v[id + "_correct"] = x.correct; v[id + "_seconds"] = x.seconds; v[id + "_skipped"] = x.skipped; });
      return cols.map(c => { const s = v[c] == null ? "" : String(v[c]); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(",");
    };
    const text = "﻿" + [cols.join(","), ...DATA.map(row)].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
    a.download = "m10_reviews_" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a); a.click(); a.remove();
  }

  $("#login-form").addEventListener("submit", e => { e.preventDefault(); store.set($("#key").value.trim()); load(); });
  $("#reload").addEventListener("click", load);
  $("#csv").addEventListener("click", csv);
  $("#logout").addEventListener("click", () => { store.clear(); DATA = []; $("#dash").hidden = true; $("#login").hidden = false; $("#key").value = ""; });
  $("#rows").addEventListener("click", async e => {
    const b = e.target.closest(".del");
    if (!b || !confirm("Xoá phiếu này? Phiếu đã xoá không lấy lại được.")) return;
    try { await call("DELETE", "?id=" + encodeURIComponent(b.dataset.id)); load(); } catch (err) { alert("Chưa xoá được: " + err.message); }
  });
  window.P10.loadShared();
  if (store.get()) load();
})();
