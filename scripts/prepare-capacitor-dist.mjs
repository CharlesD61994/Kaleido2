import { rm, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const distDir = "dist";
const indexPath = join(distDir, "index.html");

let index = await readFile(indexPath, "utf8");
index = index
  .replace(/\s*<link rel="manifest" href="\/manifest\.webmanifest">/g, "")
  .replace(/\s*<script id="vite-plugin-pwa:register-sw" src="\/registerSW\.js"><\/script>/g, "");
await writeFile(indexPath, index);

await Promise.all([
  rm(join(distDir, "registerSW.js"), { force: true }),
  rm(join(distDir, "sw.js"), { force: true }),
  rm(join(distDir, "manifest.webmanifest"), { force: true }),
  rm(join(distDir, "workbox-9c191d2f.js"), { force: true }),
]);
