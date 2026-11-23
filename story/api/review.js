/* POST /api/review: store one answer of the M10 review form in the private Blob store of the project.
   The function keeps only the fields that the form sends, cuts long texts and adds the time it received the answer.
   Nobody can read the answers from the browser; the team reads them through /api/reviews with its passcode. */
import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";

const ROLES = ["sv-nau", "sv-it-nau", "nhom-khac", "khac"];
const BUYS = ["cho", "sieu-thi", "app", "nhieu-noi", ""];
const RATINGS = ["story", "charts", "tool", "animation", "design", "trust", "use"];
const PEER = ["titles", "colours", "sources", "honest", "tool", "story"];
const PEER_VALUES = ["co", "mot-phan", "khong", ""];
const SCENES = ["", "khong", "s-cong", "s-an", "s-gio", "s-mua", "s-phi", "s-mon", "s-tien", "s-tuan", "s-quan", "s-cpi", "s-thu", "s-goiy", "s-chon"];
const CHOICES = ["Chợ", "Siêu thị", "App", "Không nhớ", ""];

const text = (v, n = 1200) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, " ").trim().slice(0, n) : "");
const pick = (v, list) => (list.includes(v) ? v : "");
const num = (v, lo, hi) => (typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi ? Math.round(v * 10) / 10 : null);
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
});

export async function POST(request) {
  const raw = await request.text();
  if (raw.length > 20000) return json({ ok: false, error: "too_large" }, 413);
  let a;
  try { a = JSON.parse(raw); } catch { return json({ ok: false, error: "bad_json" }, 400); }
  if (!a || typeof a !== "object") return json({ ok: false, error: "bad_json" }, 400);
  if (text(a.website)) return json({ ok: true });                       // a filled hidden field means a bot; drop it quietly

  const ratings = {};
  for (const k of RATINGS) ratings[k] = Number.isInteger(a.ratings?.[k]) && a.ratings[k] >= 1 && a.ratings[k] <= 5 ? a.ratings[k] : null;
  const role = pick(a.role, ROLES);
  const peer = {};
  if (role === "nhom-khac") for (const k of PEER) peer[k] = pick(a.peer?.[k], PEER_VALUES);
  const tasks = Array.isArray(a.tasks) ? a.tasks.slice(0, 5).map(t => ({
    id: text(t?.id, 8), answer: text(t?.answer, 80), correct: t?.correct === true,
    skipped: t?.skipped === true, seconds: num(t?.seconds, 0, 3600),
  })) : [];
  const five = a.five_sec && typeof a.five_sec === "object" ? {
    text: text(a.five_sec.text, 600), choice: pick(a.five_sec.choice, CHOICES), correct: a.five_sec.correct === true,
  } : null;

  if (!role && RATINGS.every(k => ratings[k] == null) && !text(a.fix)) return json({ ok: false, error: "empty" }, 400);

  const now = new Date();
  const id = randomUUID().slice(0, 8);
  const record = {
    v: 1, id, received_at: now.toISOString(), mode: a.mode === "test" ? "test" : "view",
    role, buys_at: pick(a.buys_at, BUYS), team_name: role === "nhom-khac" ? text(a.team_name, 80) : "",
    ratings, hard_part: pick(a.hard_part, SCENES), hard_text: text(a.hard_text), fix: text(a.fix), like: text(a.like),
    peer, five_sec: five, tasks, minutes_total: num(a.minutes_total, 0, 600),
    screen: pick(a.screen, ["phone", "tablet", "desktop"]),
  };
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  await put(`reviews/${stamp}-${id}.json`, JSON.stringify(record), {
    access: "private", contentType: "application/json", addRandomSuffix: false,
  });
  return json({ ok: true, id });
}

export function GET() {
  return json({ ok: false, error: "method" }, 405);
}
