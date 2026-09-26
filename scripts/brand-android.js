// Applies one coaching centre's branding to the Android project, then syncs web files.
// Usage: node scripts/brand-android.js <brand-slug>
// Changes: app name, applicationId (so each centre's app installs side by side), launcher icons.
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import sharp from "sharp";
import { readBrand, iconSvg } from "./brand-utils.js";

const brand = readBrand(process.argv[2] || process.env.BRAND || "default");
const RES = "android/app/src/main/res";
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const xmlEsc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/'/g, "\\'");

// 1. Web assets for this brand.
execSync(`node scripts/build-web.js ${brand.slug}`, { stdio: "inherit" });

// 2. Capacitor config.
const cap = JSON.parse(readFileSync("capacitor.config.json", "utf8"));
Object.assign(cap, { appId: brand.appId, appName: brand.name });
writeFileSync("capacitor.config.json", JSON.stringify(cap, null, 2) + "\n");

// 3. applicationId + display name. The Java namespace stays fixed; only the install id changes.
const gradle = "android/app/build.gradle";
writeFileSync(gradle, readFileSync(gradle, "utf8").replace(/applicationId "[^"]+"/, `applicationId "${brand.appId}"`));
const strings = `${RES}/values/strings.xml`;
writeFileSync(strings, readFileSync(strings, "utf8")
  .replace(/(<string name="app_name">)[^<]*/, `$1${xmlEsc(brand.name)}`)
  .replace(/(<string name="title_activity_main">)[^<]*/, `$1${xmlEsc(brand.name)}`)
  .replace(/(<string name="package_name">)[^<]*/, `$1${brand.appId}`)
  .replace(/(<string name="custom_url_scheme">)[^<]*/, `$1${brand.appId}`));
writeFileSync(`${RES}/values/ic_launcher_background.xml`,
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${brand.primary.toUpperCase()}</color>\n</resources>\n`);

// 4. Launcher icons. PNG logos are resized; SVG logos and monograms are rendered.
const logoPng = brand.logo && !brand.logo.endsWith(".svg") ? `${brand.dir}/${brand.logo}` : null;
async function render(size, kind) {
  if (logoPng) {
    if (kind === "foreground") {
      const inner = Math.round(size * 0.62);
      const logo = await sharp(logoPng).resize(inner, inner, { fit: "contain", background: "#0000" }).png().toBuffer();
      return sharp({ create: { width: size, height: size, channels: 4, background: "#0000" } })
        .composite([{ input: logo, gravity: "center" }]).png().toBuffer();
    }
    const img = sharp(logoPng).resize(size, size, { fit: "cover" });
    if (kind === "round") {
      const mask = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></svg>`);
      return img.composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
    }
    return img.png().toBuffer();
  }
  let svg;
  if (brand.logo?.endsWith(".svg")) {
    const logo = readFileSync(`${brand.dir}/${brand.logo}`, "utf8").replace("<svg ", '<svg x="0" y="0" width="512" height="512" ');
    const s = kind === "foreground" ? 0.62 : 1;
    const clip = kind === "round" ? '<clipPath id="c"><circle cx="256" cy="256" r="256"/></clipPath>' : "";
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${clip}<g ${clip ? 'clip-path="url(#c)"' : ""} transform="translate(256 256) scale(${s}) translate(-256 -256)">${logo}</g></svg>`;
  } else {
    svg = iconSvg(brand, { round: kind === "round", background: kind !== "foreground", scale: kind === "foreground" ? 0.62 : 1 });
  }
  return sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toBuffer();
}
for (const [dpi, m] of Object.entries(DENSITIES)) {
  const dir = `${RES}/mipmap-${dpi}`;
  writeFileSync(`${dir}/ic_launcher.png`, await render(48 * m, "square"));
  writeFileSync(`${dir}/ic_launcher_round.png`, await render(48 * m, "round"));
  writeFileSync(`${dir}/ic_launcher_foreground.png`, await render(108 * m, "foreground"));
}

// 5. Copy www/ into the Android project.
execSync("npx cap sync android", { stdio: "inherit" });
console.log(`Android project branded for "${brand.name}" (${brand.appId})`);
