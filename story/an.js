/* Shared pieces of the presentation site, used by index.html, danh-gia.html and nhom.html:
   the drawing of An, the shared drawings and background of index.html for the other pages,
   and the record of one M10 test, which the story, the explorer and the review form fill in turn. */
window.P10 = (() => {
  "use strict";

  function student(pose) {
    const carry = pose === "carry" ? '<use href="#basket" x="-4" y="-78" width="44" height="30"/>' : "";
    return `<g class="student ${pose || ""}">
      <g class="torso-g">
        <rect x="-31" y="-121" width="20" height="46" rx="8" fill="#8FE3D6" stroke="#2B2A6B" stroke-width="2.5"/>
        <g class="limb leg-back"><rect x="-7" y="-64" width="13" height="58" rx="6" fill="#3B3592"/><ellipse cx="0" cy="-6" rx="11" ry="6" fill="#F36FA9" stroke="#2B2A6B" stroke-width="2"/></g>
        <g class="limb arm-back"><rect x="-5" y="-118" width="10" height="46" rx="5" fill="#E8B998"/></g>
        <rect x="-19" y="-125" width="38" height="68" rx="15" fill="#FFF4DC" stroke="#2B2A6B" stroke-width="2.5"/>
        <path d="M-10 -123 L0 -111 L10 -123" fill="none" stroke="#F36FA9" stroke-width="3" stroke-linejoin="round"/>
        <g class="limb leg-front"><rect x="-7" y="-64" width="13" height="58" rx="6" fill="#4B47A8"/><ellipse cx="0" cy="-6" rx="11" ry="6" fill="#F36FA9" stroke="#2B2A6B" stroke-width="2"/></g>
        <g class="head">
          <circle cx="0" cy="-151" r="25" fill="#FFD3B0" stroke="#2B2A6B" stroke-width="2.5"/>
          <path d="M-27 -150 C-30 -186 28 -188 27 -152 C17 -167 -9 -170 -27 -150 Z" fill="#2B2A6B"/>
          <ellipse class="eye" cx="-9" cy="-149" rx="2.6" ry="3.4" fill="#2B2A6B"/>
          <ellipse class="eye" cx="9" cy="-149" rx="2.6" ry="3.4" fill="#2B2A6B"/>
          <circle cx="-15" cy="-140" r="4" fill="#F7A9B8" opacity=".85"/><circle cx="15" cy="-140" r="4" fill="#F7A9B8" opacity=".85"/>
          <path d="M-6 -137 Q0 -131 6 -137" fill="none" stroke="#2B2A6B" stroke-width="2.2" stroke-linecap="round"/>
        </g>
        <g class="limb arm-front"><rect x="-5" y="-118" width="10" height="46" rx="5" fill="#FFD3B0" stroke="#2B2A6B" stroke-width="1.5"/></g>
        ${carry}
      </g>
    </g>`;
  }

  // The other pages copy the shared drawings (foods, basket, lantern, coin) and the background pattern of index.html
  async function loadShared() {
    if (document.querySelector("svg.sprite")) return;
    try {
      const html = await (await fetch("index.html", { cache: "force-cache" })).text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      [".bg", "svg.sprite"].forEach(sel => {
        const n = doc.querySelector(sel);
        if (n) document.body.prepend(document.importNode(n, true));
      });
    } catch (e) { /* the page still works without the drawings */ }
  }

  // One test in one browser tab: the five second test, the three tasks and the start time
  const KEY = "p10-test";
  const test = {
    get() { try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch (e) { return {}; } },
    set(patch) {
      const t = Object.assign(test.get(), patch);
      try { sessionStorage.setItem(KEY, JSON.stringify(t)); } catch (e) { /* private mode: the review form still works */ }
      return t;
    },
    clear() { try { sessionStorage.removeItem(KEY); } catch (e) { /* nothing to clear */ } },
  };

  const nf = new Intl.NumberFormat("vi-VN");
  return { student, loadShared, test, vnd: v => nf.format(Math.round(v)) };
})();
