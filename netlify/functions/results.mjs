import { getStore } from "@netlify/blobs";

const COLS = ["participant","trial","shape","screen_w","screen_h","dpr","box_left","box_top","bbox_cx","bbox_cy","centroid_x","centroid_y","click_x","click_y","dx_centroid","dy_centroid","dx_bbox","dy_bbox","rt_ms","server_time"];
const esc = v => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

export default async (req) => {
  const admin = Netlify.env.get("ADMIN_KEY");
  const key = new URL(req.url).searchParams.get("key");
  if (!admin || key !== admin) return new Response("Forbidden", { status: 403 });
  const store = getStore({ name: "results", consistency: "strong" });
  const { blobs } = await store.list();
  const rows = (await Promise.all(blobs.map(b => store.get(b.key, { type: "json" }))))
    .filter(Boolean)
    .sort((a, b) => (a.server_time < b.server_time ? -1 : 1));
  const csv = [COLS.join(",")].concat(rows.map(r => COLS.map(c => esc(r[c])).join(","))).join("\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="symbolcenterexp-results.csv"'
    }
  });
};
