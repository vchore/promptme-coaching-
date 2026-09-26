// Builds the web app for one coaching centre into www/.
// Usage: node scripts/build-web.js [brand-slug]   (default: "default")
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { readBrand, iconSvg } from "./brand-utils.js";

const brand = readBrand(process.argv[2] || process.env.BRAND || "default");
const FILES = ["index.html", "manifest.webmanifest", "sw.js", "css", "js", "icons"];

rmSync("www", { recursive: true, force: true });
mkdirSync("www");
for (const f of FILES) cpSync(f, `www/${f}`, { recursive: true });
cpSync(brand.dir, "www/brand", { recursive: true });

// Bake the centre's name and colour into the HTML shell and install manifest.
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
let html = readFileSync("www/index.html", "utf8");
html = html.replace(/<title>.*<\/title>/, `<title>${esc(brand.name)}</title>`)
  .replace(/(name="theme-color" content=")[^"]*/, `$1${brand.primary}`);
writeFileSync("www/index.html", html);

const manifest = JSON.parse(readFileSync("www/manifest.webmanifest", "utf8"));
Object.assign(manifest, {
  name: brand.name,
  short_name: (brand.shortName || brand.name).slice(0, 12),
  description: brand.tagline || manifest.description,
  theme_color: brand.primary,
});
writeFileSync("www/manifest.webmanifest", JSON.stringify(manifest, null, 2));
writeFileSync("www/icons/icon.svg", iconSvg(brand));

console.log(`Built www/ for "${brand.name}" (${brand.slug})`);
