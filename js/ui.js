// Small DOM + storage helpers shared by all views.
import { todayISO } from "./logic.js";

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const el = (tag, props = {}, ...children) => {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...children.filter((c) => c != null && c !== false));
  return n;
};

export const today = todayISO();

// Storage is best-effort: private mode or blocked storage must not break the app.
// Keys are namespaced per brand so two centre apps in one browser never mix data.
let ns = "pm.";
export const store = {
  setNamespace(slug) { ns = slug === "default" ? "pm." : `pm.${slug}.`; },
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(ns + key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(ns + key, JSON.stringify(value)); } catch { /* ignore */ }
  },
  dump() {
    const out = {};
    try {
      for (const k of Object.keys(localStorage)) if (k.startsWith(ns)) out[k.slice(ns.length)] = JSON.parse(localStorage.getItem(k));
    } catch { /* ignore */ }
    return out;
  },
  clear() {
    try { Object.keys(localStorage).filter((k) => k.startsWith(ns)).forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ }
  },
};

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function fillSelect(select, values, selected) {
  select.replaceChildren(...values.map((v) => el("option", { value: v, textContent: v, selected: v === selected })));
}

export function formatDate(iso) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
}
