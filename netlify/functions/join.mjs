import { getStore } from "@netlify/blobs";

const MAX_PARTICIPANTS = 100;
const pad = n => String(n).padStart(3, "0");
const json = (o, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  // Every call issues the next free participant number. Each slot can be claimed only once,
  // so two people never get the same number.
  const slots = getStore({ name: "slots", consistency: "strong" });
  const { blobs } = await slots.list();
  for (let n = blobs.length + 1; n <= MAX_PARTICIPANTS; n++) {
    const token = crypto.randomUUID();
    const r = await slots.set(pad(n), JSON.stringify({ time: new Date().toISOString(), token }), { onlyIfNew: true });
    if (r && r.modified === true) return json({ n });
    if (r && r.modified === false) continue; // slot already taken
    // no result returned by this library version: read back and check the slot is ours
    const cur = await slots.get(pad(n), { type: "json" });
    if (cur && cur.token === token) return json({ n });
  }
  return json({ full: true }, 403);
};
