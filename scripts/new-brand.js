// Creates brands/<slug>/brand.json for a new coaching centre.
// Usage: npm run new-brand -- "Shree Classes" "#1b5e20"
import { mkdirSync, writeFileSync, existsSync } from "node:fs";

const [name, primary = "#1b5e20"] = process.argv.slice(2);
if (!name) {
  console.error('Usage: npm run new-brand -- "Centre Name" "#rrggbb"');
  process.exit(1);
}
const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const dir = `brands/${slug}`;
if (existsSync(dir)) {
  console.error(`${dir} already exists`);
  process.exit(1);
}
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/brand.json`, JSON.stringify({
  slug,
  appId: `in.promptme.${slug.replace(/-/g, "")}`,
  name,
  shortName: name.split(/\s+/).slice(0, 2).join(" "),
  tagline: "Your coaching centre's tagline",
  primary,
  accent: primary,
  logo: "",
  city: "",
  phone: "",
  whatsapp: "",
  email: "",
  website: "",
  address: "",
  counsellor: { name: "", phone: "", hours: "" },
  timings: "",
  weeklyOff: "Sunday",
  notices: [],
}, null, 2) + "\n");
console.log(`Created ${dir}/brand.json. Fill in the details, add logo.png or logo.svg, then push.`);
