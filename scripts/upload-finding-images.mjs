#!/usr/bin/env node
// Uploads the archaeology photos named in data/archaeology/findings.json
// (images[].path) from a local folder to the public "findings" storage
// bucket, replacing any existing file at the same path:
//
//   node --env-file=.env.local scripts/upload-finding-images.mjs <folder>
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY. The launch photos
// are 1600px-wide copies of Wikimedia Commons files (sourceUrl), re-encoded
// as JPEG; each finding page credits the photographer and license.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const folder = process.argv[2];
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!folder || !url || !key) {
  process.stderr.write(
    "Usage: node --env-file=.env.local scripts/upload-finding-images.mjs <folder>\n",
  );
  process.exit(1);
}

const TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };
const { findings } = JSON.parse(
  readFileSync(new URL("../data/archaeology/findings.json", import.meta.url), "utf8"),
);
const storage = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
}).storage.from("findings");

let failed = 0;
for (const { path } of findings.flatMap((f) => f.images ?? [])) {
  const body = readFileSync(`${folder}/${path}`);
  const { error } = await storage.upload(path, body, {
    upsert: true,
    contentType: TYPES[path.split(".").pop()],
    // Paths are replaced in place rarely; a day keeps edits visible soon.
    cacheControl: "86400",
  });
  process.stderr.write(`${error ? "FAILED" : "ok"} ${path}${error ? `: ${error.message}` : ""}\n`);
  if (error) failed += 1;
}
process.exit(failed ? 1 : 0);
