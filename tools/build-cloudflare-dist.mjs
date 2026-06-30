import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

const items = [
  "index.html",
  "app.js",
  "styles.css",
  "manifest.webmanifest",
  "data",
  "assets",
];

for (const item of items) {
  const source = path.join(root, item);
  if (!existsSync(source)) {
    throw new Error(`Required app file or folder is missing: ${item}`);
  }
  await cp(source, path.join(dist, item), { recursive: true, force: true });
}

await writeFile(
  path.join(dist, "_headers"),
  `/data/*.json
  Cache-Control: no-cache

/*.html
  Cache-Control: no-cache

/*.js
  Cache-Control: public, max-age=300

/*.css
  Cache-Control: public, max-age=300

/assets/*
  Cache-Control: public, max-age=604800
`,
  "utf8",
);

console.log(`Built Cloudflare dist: ${dist}`);
