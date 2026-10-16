import { getStore } from "@netlify/blobs";

const COLS = ["participant","trial","shape","screen_w","screen_h","dpr","box_left","box_top","bbox_cx","bbox_cy","centroid_x","centroid_y","click_x","click_y","click_screen_x","click_screen_y","center_screen_x","center_screen_y","dx_centroid","dy_centroid","dx_bbox","dy_bbox","rt_ms"];

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let r;
  try {
    const t = await req.text();
    if (t.length > 5000) return new Response("Too large", { status: 413 });
    r = JSON.parse(t);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }
  const row = {};
  for (const c of COLS) {
    let v = r?.[c];
    if (typeof v === "string") v = v.slice(0, 100);
    else if (typeof v !== "number" || !isFinite(v)) v = null;
    row[c] = v;
  }
  if (!row.participant || !row.shape) return new Response("Missing fields", { status: 400 });
  row.server_time = new Date().toISOString();
  const people = getStore({ name: "participants", consistency: "strong" });
  if ((await people.getMetadata(encodeURIComponent(String(row.participant)))) === null)
    return new Response("Not registered", { status: 403 });
  const store = getStore({ name: "results", consistency: "strong" });
  const safe = x => String(x).replace(/[^\w.-]/g, "_");
  const key = `${encodeURIComponent(String(row.participant))}/${String(row.trial ?? 0).padStart(2, "0")}_${safe(row.shape)}_${row.server_time}`;
  await store.setJSON(key, row);
  return new Response("ok");
};
