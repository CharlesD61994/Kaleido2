import { cp, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "site-vitrine");
const destination = resolve(root, "public", "admin-boutique");

await mkdir(destination, { recursive: true });

for (const entry of [
  "app.js",
  "index.html",
  "storefront-cloud.js",
  "storefront-config.js",
  "styles.css",
  "assets",
]) {
  await cp(resolve(source, entry), resolve(destination, entry), {
    force: true,
    recursive: true,
  });
}

console.log("Storefront synced to the Kaleido app bundle.");
