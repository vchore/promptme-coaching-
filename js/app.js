import {
  REG_STATUS, HELPLINES, MAHARASHTRA_DRAFT, SC_GUIDELINES, CENTRE_CHECKLIST, PROMPTS, STANDARDS, EXAMS,
} from "./data.js";
import {
  assessCheckin, needsFollowUp, missedWeeklyOff, complianceScore, promptOfDay, daysUntil,
} from "./logic.js";
import { $, $$, el, store, today, fillSelect, formatDate } from "./ui.js";
import { loadBrand, applyBrand } from "./brand.js";
import { initPlan } from "./plan.js";
import { initAssess } from "./assess.js";

const brand = await loadBrand();
store.setNamespace(brand.slug);
applyBrand(brand);

const getProfile = () => store.get("profile", null);
const subjects = () => {
  const p = getProfile();
  return p?.subjects?.length ? p.subjects : ["General"];
};

// ---------- Tabs ----------
function showTab(name) {
  $$(".panel").forEach((p) => p.classList.toggle("hidden", p.id !== name));
  $$(".tabs [role=tab]").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === name));
  if (name !== "profile") store.set("tab", name);
  if (name === "assess") assess?.refresh();
  window.scrollTo({ top: 0 });
}
$$("[data-tab]").forEach((b) =>
  b.addEventListener("click", (e) => { e.preventDefault(); showTab(b.dataset.tab); }));

// ---------- Helplines (centre counsellor + trusted adult + national) ----------
function helpLinks() {
  const p = getProfile();
  const lines = [];
  if (brand.counsellor?.phone) {
    lines.push({ number: brand.counsellor.phone, name: `${brand.counsellor.name || "Counsellor"}, ${brand.name}`, note: brand.counsellor.hours || "" });
  }
  if (p?.trustedPhone) lines.push({ number: p.trustedPhone, name: p.trustedName || "My trusted adult", note: "Your saved contact" });
  lines.push(...HELPLINES.map((h) => ({ ...h, note: h.alt ? `${h.note} Also: ${h.alt}` : h.note })));
  return el("div", { className: "helplines" }, ...lines.map((h) =>
    el("a", { className: "helpline", href: `tel:${h.number.replace(/[^\d+]/g, "")}` },
      el("strong", { textContent: h.number }),
      el("span", { textContent: h.name }),
      el("small", { textContent: h.note }))));
}

// ---------- Profile ----------
const pf = $("#profileForm");
fillSelect($("#standardSel"), STANDARDS);
fillSelect($("#examSel"), Object.keys(EXAMS));

function renderSubjectBoxes(exam, chosen) {
  const opts = [...new Set([...(EXAMS[exam] || []), ...(chosen || [])])];
  const picked = chosen?.length ? chosen : EXAMS[exam] || [];
  $("#subjectBoxes").replaceChildren(...opts.map((s) => el("label", { className: "chip" },
    el("input", { type: "checkbox", name: "subjects", value: s, checked: picked.includes(s) }), el("span", { textContent: s }))));
}
$("#examSel").addEventListener("change", (e) => renderSubjectBoxes(e.target.value));

function loadProfileForm() {
  const p = getProfile() || {};
  const f = pf.elements;
  for (const k of ["name", "batch", "examDate", "goal", "trustedName", "trustedPhone"]) f[k].value = p[k] || "";
  f.standard.value = p.standard || STANDARDS[4];
  f.exam.value = p.exam || Object.keys(EXAMS)[0];
  renderSubjectBoxes(f.exam.value, p.subjects);
  $("#profileTitle").textContent = p.name ? "My profile" : `Welcome to ${brand.name}! Set up your profile`;
}

pf.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = pf.elements;
  const subs = $$("input[name=subjects]:checked", pf).map((i) => i.value);
  const extra = f.extraSubject.value.trim();
  if (extra && !subs.includes(extra)) subs.push(extra);
  const isNew = !getProfile();
  store.set("profile", {
    name: f.name.value.trim(), standard: f.standard.value, batch: f.batch.value.trim(),
    exam: f.exam.value, examDate: f.examDate.value, subjects: subs.length ? subs : ["General"],
    goal: f.goal.value.trim(), trustedName: f.trustedName.value.trim(), trustedPhone: f.trustedPhone.value.trim(),
  });
  f.extraSubject.value = "";
  refreshAll();
  showTab("home");
  if (isNew) $("#greeting").scrollIntoView();
});

function renderAvatar() {
  const p = getProfile();
  $("#avatarBtn").textContent = p?.name ? p.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() : "?";
}

// Every subject dropdown follows the profile's subject list.
function subjectSelects() {
  $$(".subject-select").forEach((s) => fillSelect(s, subjects(), s.value));
}

// ---------- Home ----------
function renderHome() {
  const p = getProfile() || {};
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  $("#greeting").textContent = `${hello}${p.name ? `, ${p.name.split(" ")[0]}` : ""}`;
  $("#goalLine").textContent = p.goal ? `“${p.goal}”` : "One focused step at a time.";
  $("#examLine").textContent = [p.standard, p.exam, p.batch && `Batch ${p.batch}`].filter(Boolean).join(" · ");
  const d = daysUntil(p.examDate, today);
  $("#countdown").hidden = d == null || d < 0;
  $("#countdownDays").textContent = d ?? "";

  const upcoming = brand.notices.slice(0, 2);
  $("#homeNotices").hidden = upcoming.length === 0;
  $("#homeNoticeList").replaceChildren(...upcoming.map(noticeItem));
}
const noticeItem = (n) => el("li", {}, n.date ? el("span", { className: "src", textContent: formatDate(n.date) }) : "", ` ${n.text}`);

$("#pod").textContent = promptOfDay([...PROMPTS.reflect, ...PROMPTS.study], today);

const form = $("#checkin");
for (const name of ["mood", "stress"]) {
  const input = form.elements[name];
  input.addEventListener("input", () => { $(`#${name}Out`).textContent = input.value; });
}
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = form.elements;
  const entry = { date: today, mood: +f.mood.value, stress: +f.stress.value, sleepHours: +f.sleepHours.value, classHours: +f.classHours.value };
  const result = assessCheckin({ ...entry, note: f.note.value });
  entry.level = result.level;
  // Notes are deliberately not stored.
  const log = store.get("log", []).filter((x) => x.date !== today);
  log.push(entry);
  store.set("log", log.slice(-90));
  renderResult(result, log);
  renderWeek();
  f.note.value = "";
});

function renderResult(result, log) {
  const box = $("#result");
  box.className = `card result ${result.level}`;
  box.replaceChildren(
    el("h2", { textContent: {
      ok: "Thanks for checking in 🌱",
      watch: "Go a little easy on yourself today",
      support: "Today looks tough. Let's get you some support",
      crisis: "Please reach out right now",
    }[result.level] }),
    el("ul", {}, ...result.advice.map((t) => el("li", { textContent: t }))),
  );
  if (result.level === "crisis" || result.level === "support") box.append(helpLinks());
  if (needsFollowUp(log)) {
    box.append(el("p", { className: "pill warn", textContent:
      "You've had several hard days in a row. Please talk to a counsellor or call 14416 this week." }));
  }
  box.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderWeek() {
  const log = store.get("log", []);
  const byDate = Object.fromEntries(log.map((x) => [x.date, x]));
  const d = new Date(today + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - 6);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const key = d.toISOString().slice(0, 10);
    const e = byDate[key];
    days.push(el("div", { className: `day ${e ? e.level : "none"}`, title: e ? `${key}: ${e.level}` : key },
      el("span", { textContent: d.toLocaleDateString("en-IN", { weekday: "narrow", timeZone: "UTC" }) })));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  $("#week").replaceChildren(...days);
  const studied = log.filter((x) => x.classHours > 0).map((x) => x.date);
  $("#weekNote").textContent = missedWeeklyOff(studied, today)
    ? `You've studied 7 days straight. Take a full day off${brand.weeklyOff ? ` (${brand.weeklyOff} is ${brand.name}'s weekly off)` : ""}.`
    : "Green = balanced, amber = watch, red = tough day. Grey = no check-in.";
}

// ---------- Calm ----------
$("#calmList").replaceChildren(...PROMPTS.calm.map((t) => el("li", { textContent: t })));
let breathId = null;
$("#breathBtn").addEventListener("click", (e) => {
  const circle = $("#breath");
  if (breathId) {
    clearInterval(breathId); breathId = null;
    circle.className = "breath";
    $("#breathText").textContent = "Tap start";
    e.target.textContent = "Start";
    return;
  }
  const steps = [["Breathe in", "in"], ["Hold", "hold"], ["Breathe out", "out"], ["Hold", "rest"]];
  let i = 0;
  const step = () => {
    const [label, cls] = steps[i % 4];
    $("#breathText").textContent = label;
    circle.className = `breath ${cls}`;
    i += 1;
  };
  step();
  breathId = setInterval(step, 4000);
  e.target.textContent = "Stop";
});

// ---------- My centre ----------
function renderCentre() {
  $("#centreTagline").textContent = brand.tagline;
  const info = [
    ["Address", brand.address], ["Timings", brand.timings], ["Weekly off", brand.weeklyOff],
    ["Phone", brand.phone], ["Email", brand.email],
  ].filter(([, v]) => v);
  $("#centreInfo").replaceChildren(...info.flatMap(([k, v]) => [el("dt", { textContent: k }), el("dd", { textContent: v })]));
  if (!info.length) $("#centreInfo").append(el("dd", { className: "muted", textContent: "Your coaching centre's details will appear here in their branded app." }));

  const actions = [];
  if (brand.phone) actions.push(el("a", { className: "btn", href: `tel:${brand.phone.replace(/[^\d+]/g, "")}`, textContent: "📞 Call" }));
  if (brand.whatsapp) actions.push(el("a", { className: "btn", href: `https://wa.me/${brand.whatsapp}`, target: "_blank", rel: "noopener", textContent: "💬 WhatsApp" }));
  if (brand.website) actions.push(el("a", { className: "btn", href: brand.website, target: "_blank", rel: "noopener", textContent: "🌐 Website" }));
  if (brand.address) actions.push(el("a", { className: "btn", href: `https://maps.google.com/?q=${encodeURIComponent(brand.address)}`, target: "_blank", rel: "noopener", textContent: "📍 Map" }));
  $("#centreActions").replaceChildren(...actions);

  const c = brand.counsellor;
  $("#counsellorCard").hidden = !c?.phone;
  if (c?.phone) {
    $("#counsellorText").textContent = `${c.name}${c.hours ? ` · ${c.hours}` : ""}. Conversations are confidential.`;
    $("#counsellorCall").href = `tel:${c.phone.replace(/[^\d+]/g, "")}`;
  }
  $("#noticeCard").hidden = brand.notices.length === 0;
  $("#noticeList").replaceChildren(...brand.notices.map(noticeItem));
}

function renderChecklist() {
  const done = store.get("checklist", {});
  $("#checklist").replaceChildren(...CENTRE_CHECKLIST.map((item) => {
    const box = el("input", { type: "checkbox", checked: !!done[item.id] });
    box.addEventListener("change", () => {
      done[item.id] = box.checked;
      store.set("checklist", done);
      renderChecklist();
    });
    return el("li", {}, el("label", {}, box, ` ${item.text} `, el("span", { className: "src", textContent: item.source })));
  }));
  const n = CENTRE_CHECKLIST.filter((i) => done[i.id]).length;
  const pct = complianceScore(n, CENTRE_CHECKLIST.length);
  $("#meterBar").style.width = `${pct}%`;
  $("#meterText").textContent = `${n} of ${CENTRE_CHECKLIST.length} in place (${pct}%)`;
}

// ---------- Rights ----------
$("#regReviewed").textContent = REG_STATUS.lastReviewed;
$("#regStatus").textContent = REG_STATUS.headline;
$("#scTitle").textContent = SC_GUIDELINES.title;
$("#scStatus").textContent = SC_GUIDELINES.status;
$("#scPoints").replaceChildren(...SC_GUIDELINES.points.map((t) => el("li", { textContent: t })));
$("#mhTitle").textContent = MAHARASHTRA_DRAFT.title;
$("#mhPublished").textContent = `Published ${MAHARASHTRA_DRAFT.published}. Status: draft, not yet law.`;
$("#mhTimeline").replaceChildren(...MAHARASHTRA_DRAFT.timeline.map((t) =>
  el("li", {}, el("strong", { textContent: t.date }), ` ${t.text}`)));
$("#mhProvisions").replaceChildren(...MAHARASHTRA_DRAFT.provisions.flatMap((p) =>
  [el("dt", { textContent: p.area }), el("dd", { textContent: p.text })]));
$("#mhDebate").textContent = MAHARASHTRA_DRAFT.debate;

// ---------- Help ----------
function renderHelp() { $("#helplines").replaceChildren(helpLinks()); }

$("#exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ brand: brand.slug, exported: today, data: store.dump() }, null, 2)], { type: "application/json" });
  const a = el("a", { href: URL.createObjectURL(blob), download: `promptme-backup-${today}.json` });
  a.click();
  URL.revokeObjectURL(a.href);
});
$("#wipe").addEventListener("click", () => {
  if (confirm("Delete your profile, check-ins, tests, goals, doubts and assessments from this device?")) {
    store.clear();
    location.reload();
  }
});

// ---------- Boot ----------
const ctx = { brand, profile: () => getProfile() || {}, subjects, subjectSelects, helpLinks, onChange: () => assess?.renderReport() };
subjectSelects();
const plan = initPlan(ctx);
const assess = initAssess(ctx);

function refreshAll() {
  renderAvatar();
  renderHome();
  renderHelp();
  subjectSelects();
  assess.refresh();
  plan.renderGoals();
}

renderAvatar();
renderHome();
renderWeek();
renderCentre();
renderChecklist();
renderHelp();
loadProfileForm();
$("#avatarBtn").addEventListener("click", loadProfileForm);

if (!getProfile()) showTab("profile");
else showTab(location.hash === "#help" ? "help" : store.get("tab", "home"));

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => { /* offline support is optional */ });
}
