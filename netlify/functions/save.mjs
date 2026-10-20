import { getStore } from "@netlify/blobs";

const COLS = ["participant","pnum","order","part","segment","trial","shape","img_px","screen_w","screen_h","dpr","box_left","box_top","bbox_cx","bbox_cy","centroid_x","centroid_y","click_x","click_y","click_screen_x","click_screen_y","center_screen_x","center_screen_y","dx_centroid","dy_centroid","dx_bbox","dy_bbox","rt_ms"];
const pad = n => String(n).padStart(3, "0");

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
  if (!row.participant || !row.shape || !Number.isInteger(row.pnum) || row.pnum < 1 || row.pnum > 100)
    return new Response("Missing fields", { status: 400 });
  // the participant number must have been issued by join.mjs
  if (row.participant !== "P" + pad(row.pnum)) return new Response("Bad participant", { status: 400 });
  const slots = getStore({ name: "slots", consistency: "strong" });
  if ((await slots.getMetadata(pad(row.pnum))) === null) return new Response("Not registered", { status: 403 });
  row.server_time = new Date().toISOString();
  const store = getStore({ name: "results", consistency: "strong" });
  const safe = x => String(x).replace(/[^\w.-]/g, "_");
  const group = row.pnum % 2 === 1 ? "odd_participants" : "even_participants";
  const key = `${group}/${row.participant}/${String(row.trial ?? 0).padStart(2, "0")}_${safe(row.shape)}_${row.server_time}`;
  await store.setJSON(key, row);
  return new Response("ok");
};
