import { getStore } from "@netlify/blobs";

const MAX_PARTICIPANTS = 100;

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let id;
  try {
    id = String((await req.json())?.participant ?? "").trim().slice(0, 100);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }
  if (!id) return new Response("Missing participant", { status: 400 });
  const store = getStore({ name: "participants", consistency: "strong" });
  const key = encodeURIComponent(id);
  if ((await store.getMetadata(key)) !== null) return new Response("ok"); // already registered
  const { blobs } = await store.list();
  if (blobs.length >= MAX_PARTICIPANTS) return new Response("full", { status: 403 });
  await store.set(key, "1", { onlyIfNew: true });
  return new Response("ok");
};
