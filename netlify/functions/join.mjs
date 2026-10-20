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
    const r = await slots.setJSON(pad(n), { time: new Date().toISOString() }, { onlyIfNew: true });
    if (r.modified) return json({ n });
  }
  return json({ full: true }, 403);
};
