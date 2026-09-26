// Copies the static web app into www/, which Capacitor bundles into the Android app.
import { cpSync, rmSync, mkdirSync } from "node:fs";

const FILES = ["index.html", "manifest.webmanifest", "sw.js", "css", "js", "icons"];

rmSync("www", { recursive: true, force: true });
mkdirSync("www");
for (const f of FILES) cpSync(f, `www/${f}`, { recursive: true });
console.log("Copied web app to www/");
