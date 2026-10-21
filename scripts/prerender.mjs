// Build step: render the React page to static HTML so search engines, link previews and
// AI crawlers get the full content without running JavaScript. The client then hydrates it.
import { readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");
const ssrEntry = resolve(root, "dist-ssr/entry-server.js");
const today = new Date().toISOString().slice(0, 10);

const { render } = await import(pathToFileURL(ssrEntry).href);
const appHtml = render();

let html = readFileSync(resolve(dist, "index.html"), "utf8");
if (!html.includes('<div id="root"></div>')) throw new Error("prerender: root placeholder not found");
html = html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

// Preload the hero's monospace font so the terminal renders in its real face on first paint.
const assets = readdirSync(resolve(dist, "assets"));
const heroFont = assets.find((f) => /^martian-mono-latin-wdth-normal-.*\.woff2$/.test(f));
if (heroFont) {
  html = html.replace("</title>", `</title>\n    <link rel="preload" href="/assets/${heroFont}" as="font" type="font/woff2" crossorigin />`);
}

// Stamp the build date into structured data and the sitemap.
html = html.replaceAll("__BUILD_DATE__", today);
writeFileSync(resolve(dist, "index.html"), html);

const sitemap = resolve(dist, "sitemap.xml");
if (existsSync(sitemap)) writeFileSync(sitemap, readFileSync(sitemap, "utf8").replaceAll("__BUILD_DATE__", today));

for (const check of ["<h1", "Selected work", "What I build", "Research"]) {
  if (!html.includes(check)) throw new Error(`prerender: expected "${check}" in the HTML`);
}
rmSync(resolve(root, "dist-ssr"), { recursive: true, force: true });
console.log(`prerendered dist/index.html (${(html.length / 1024).toFixed(1)} KB, ${today})`);
