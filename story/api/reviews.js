/* GET /api/reviews: every answer of the M10 review form, for the team page (nhom.html).
   DELETE /api/reviews?id=...: remove one answer, for example a test that a member sent by mistake.
   Both need the team passcode in the x-team-key header; the passcode lives only in the TEAM_KEY variable of Vercel. */
import { list, get, del } from "@vercel/blob";
import { createHash, timingSafeEqual } from "node:crypto";

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" },
});
const digest = s => createHash("sha256").update(String(s)).digest();

function allowed(request) {
  const key = process.env.TEAM_KEY;
  const given = request.headers.get("x-team-key") || "";
  if (!key || !given) return false;
  return timingSafeEqual(digest(key), digest(given));                   // same length digests, so the comparison takes the same time
}

async function allBlobs() {
  const blobs = [];
  let cursor;
  do {
    const page = await list({ prefix: "reviews/", cursor, limit: 1000 });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return blobs;
}

export async function GET(request) {
  if (!allowed(request)) return json({ ok: false, error: "key" }, 401);
  const blobs = await allBlobs();
  const reviews = (await Promise.all(blobs.map(async b => {
    try {
      const r = await get(b.pathname, { access: "private" });
      if (!r || r.statusCode !== 200) return null;
      return JSON.parse(await new Response(r.stream).text());
    } catch { return null; }
  }))).filter(Boolean).sort((x, y) => (y.received_at || "").localeCompare(x.received_at || ""));
  return json({ ok: true, count: reviews.length, reviews });
}

export async function DELETE(request) {
  if (!allowed(request)) return json({ ok: false, error: "key" }, 401);
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!/^[0-9a-f]{8}$/.test(id)) return json({ ok: false, error: "id" }, 400);
  const hit = (await allBlobs()).filter(b => b.pathname.endsWith(`-${id}.json`));
  if (!hit.length) return json({ ok: false, error: "not_found" }, 404);
  await del(hit.map(b => b.url));
  return json({ ok: true, deleted: hit.length });
}
