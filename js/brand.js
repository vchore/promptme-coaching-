// Loads the coaching centre's branding. Order: ?brand=<slug> (preview while developing),
// then brand/brand.json (baked in by scripts/build-web.js), then the built-in default.
import { normalizeBrand } from "./logic.js";
import { $$, el } from "./ui.js";

export async function loadBrand() {
  const slug = new URLSearchParams(location.search).get("brand");
  const bases = slug && /^[a-z0-9-]+$/.test(slug) ? [`brands/${slug}/`] : ["brand/"];
  for (const base of bases) {
    try {
      const res = await fetch(`${base}brand.json`, { cache: "no-cache" });
      if (res.ok) return { ...normalizeBrand(await res.json()), base };
    } catch { /* fall through to default */ }
  }
  return { ...normalizeBrand(), base: "" };
}

export function logoNode(brand) {
  if (brand.logo) return el("img", { src: brand.base + brand.logo, alt: "" });
  return document.createTextNode(brand.initials || "✦");
}

export function applyBrand(brand) {
  const root = document.documentElement.style;
  root.setProperty("--brand", brand.primary);
  root.setProperty("--brand-2", brand.accent);
  document.title = brand.name;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", brand.primary);
  $$(".brand-name").forEach((n) => { n.textContent = brand.name; });
  $$("#brandLogo, #centreLogo").forEach((n) => n.replaceChildren(logoNode(brand)));
  document.getElementById("brandName").textContent = brand.shortName || brand.name;
  document.getElementById("brandTagline").textContent = brand.tagline;
}
