// Shared helpers for the per-centre build scripts.
import { readFileSync, existsSync } from "node:fs";

export function readBrand(slug) {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`Invalid brand slug "${slug}" (use lowercase letters, digits, dashes).`);
  const dir = `brands/${slug}`;
  if (!existsSync(`${dir}/brand.json`)) throw new Error(`Missing ${dir}/brand.json`);
  const brand = JSON.parse(readFileSync(`${dir}/brand.json`, "utf8"));
  const problems = [];
  if (!brand.name) problems.push("name is required");
  if (!/^#[0-9a-f]{6}$/i.test(brand.primary || "")) problems.push("primary must be a #rrggbb colour");
  if (brand.appId && !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(brand.appId)) problems.push("appId must look like in.promptme.myclass");
  if (brand.logo && !existsSync(`${dir}/${brand.logo}`)) problems.push(`logo file ${brand.logo} not found`);
  if (problems.length) throw new Error(`${dir}/brand.json: ${problems.join("; ")}`);
  for (const key of ["primary", "accent"]) {
    if (brand[key] && contrast(brand[key], "#ffffff") < 4.5) {
      console.warn(`⚠ ${slug}: ${key} ${brand[key]} is too light for white text (contrast ${contrast(brand[key], "#ffffff").toFixed(1)} < 4.5). Pick a darker shade.`);
    }
  }
  return { ...brand, slug, dir, appId: brand.appId || `in.promptme.${slug.replace(/-/g, "")}` };
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

// Square SVG icon: the centre's logo if it is an SVG, else a monogram on the brand colour.
export function iconSvg(brand, { scale = 1, round = false, background = true } = {}) {
  if (brand.logo?.endsWith(".svg") && scale === 1 && !round) return readFileSync(`${brand.dir}/${brand.logo}`, "utf8");
  const initials = (brand.shortName || brand.name).split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  const bg = !background ? "" : round
    ? `<circle cx="256" cy="256" r="256" fill="${brand.primary}"/>`
    : `<rect width="512" height="512" rx="112" fill="${brand.primary}"/>`;
  const size = (initials.length > 1 ? 210 : 280) * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${bg}<text x="256" y="256" dy=".35em" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${size}" fill="#fff">${initials}</text></svg>`;
}
