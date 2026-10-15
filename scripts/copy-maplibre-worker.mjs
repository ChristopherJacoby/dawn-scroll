#!/usr/bin/env node
// MapLibre loads its web worker from a URL next to its own module, which
// doesn't survive bundling. Copy the worker (and the shared chunk it
// imports) into public/ so the map can load it from our own origin; the
// map points setWorkerUrl at /maplibre/. Runs on postinstall.

import { copyFileSync, mkdirSync } from "node:fs";

const from = new URL("../node_modules/maplibre-gl/dist/", import.meta.url);
const to = new URL("../public/maplibre/", import.meta.url);

mkdirSync(to, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(new URL(file, from), new URL(file, to));
}
