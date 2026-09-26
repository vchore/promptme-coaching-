import {
  REG_STATUS, HELPLINES, MAHARASHTRA_DRAFT, SC_GUIDELINES, CENTRE_CHECKLIST, PROMPTS,
} from "./data.js";
import {
  assessCheckin, needsFollowUp, missedWeeklyOff, complianceScore, promptOfDay, todayISO,
} from "./logic.js";

const $ = (sel) => document.querySelector(sel);
const el = (tag, props = {}, ...children) => {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...children);
  return n;
};

// Storage is best-effort: private mode or blocked storage must not break the app.
const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  },
  clear() {
    try { Object.keys(localStorage).filter((k) => k.startsWith("pm.")).forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ }
  },
};

const today = todayISO();

// ---------- Tabs ----------
function showTab(name) {
  document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("hidden", p.id !== name));
  document.querySelectorAll(".tabs [role=tab]").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === name));
  store.set("pm.tab", name);
}
document.querySelectorAll("[data-tab]").forEach((b) =>
  b.addEventListener("click", (e) => { e.preventDefault(); showTab(b.dataset.tab); }));

// ---------- Today ----------
$("#pod").textContent = promptOfDay([...PROMPTS.reflect, ...PROMPTS.study], today);

const form = $("#checkin");
for (const name of ["mood", "stress"]) {
  const input = form.elements[name];
  input.addEventListener("input", () => { $(`#${name}Out`).textContent = input.value; });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = form.elements;
  const entry = {
    date: today,
    mood: +f.mood.value,
    stress: +f.stress.value,
    sleepHours: +f.sleepHours.value,
    classHours: +f.classHours.value,
  };
  const result = assessCheckin({ ...entry, note: f.note.value });
  entry.level = result.level;

  // Notes are deliberately not stored.
  const log = store.get("pm.log", []).filter((x) => x.date !== today);
  log.push(entry);
  store.set("pm.log", log);

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
  if (result.level === "crisis" || result.level === "support") box.append(helplineBlock());
  if (needsFollowUp(log)) {
    box.append(el("p", { className: "pill warn", textContent:
      "You've had several hard days in a row. Please talk to a counsellor or call 14416 this week." }));
  }
  box.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderWeek() {
  const log = store.get("pm.log", []);
  const byDate = Object.fromEntries(log.map((x) => [x.date, x]));
  const wrap = $("#week");
  wrap.replaceChildren();
  const d = new Date(today + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - 6);
  for (let i = 0; i < 7; i++) {
    const key = d.toISOString().slice(0, 10);
    const e = byDate[key];
    wrap.append(el("div", { className: `day ${e ? e.level : "none"}`, title: e ? `${key}: ${e.level}` : key },
      el("span", { textContent: d.toLocaleDateString("en-IN", { weekday: "narrow", timeZone: "UTC" }) })));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  const studied = log.filter((x) => x.classHours > 0).map((x) => x.date);
  $("#weekNote").textContent = missedWeeklyOff(studied, today)
    ? "You've studied 7 days straight. Take a full day off — the draft Maharashtra rules require one weekly off."
    : "Green = balanced, amber = watch, red = tough day. Grey = no check-in.";
}

// ---------- Study ----------
function renderPromptList(kind, target) {
  const list = [...PROMPTS[kind]].sort(() => Math.random() - 0.5).slice(0, 3);
  $(target).replaceChildren(...list.map((t) => el("li", { textContent: t })));
}
renderPromptList("study", "#studyList");
renderPromptList("reflect", "#reflectList");
document.querySelectorAll("[data-shuffle]").forEach((b) =>
  b.addEventListener("click", () => renderPromptList(b.dataset.shuffle, `#${b.dataset.shuffle}List`)));

const timer = { focus: 25 * 60, short: 5 * 60, long: 15 * 60, left: 25 * 60, mode: "focus", id: null };
let rounds = store.get(`pm.rounds.${today}`, 0);
$("#rounds").textContent = `Rounds today: ${rounds}`;

function drawTimer() {
  const m = String(Math.floor(timer.left / 60)).padStart(2, "0");
  const s = String(timer.left % 60).padStart(2, "0");
  $("#timer").textContent = `${m}:${s}`;
  $("#timerMode").textContent = { focus: "Focus", short: "Short break — stand up, drink water", long: "Long break — step outside" }[timer.mode];
}
function tick() {
  timer.left -= 1;
  if (timer.left <= 0) {
    if (timer.mode === "focus") {
      rounds += 1;
      store.set(`pm.rounds.${today}`, rounds);
      $("#rounds").textContent = `Rounds today: ${rounds}`;
      timer.mode = rounds % 4 === 0 ? "long" : "short";
    } else {
      timer.mode = "focus";
    }
    timer.left = timer[timer.mode];
    try { navigator.vibrate?.(300); } catch { /* ignore */ }
  }
  drawTimer();
}
$("#timerStart").addEventListener("click", (e) => {
  if (timer.id) { clearInterval(timer.id); timer.id = null; e.target.textContent = "Start"; }
  else { timer.id = setInterval(tick, 1000); e.target.textContent = "Pause"; }
});
$("#timerReset").addEventListener("click", () => {
  clearInterval(timer.id); timer.id = null;
  Object.assign(timer, { mode: "focus", left: timer.focus });
  $("#timerStart").textContent = "Start";
  drawTimer();
});

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

// ---------- Centre checklist ----------
function renderChecklist() {
  const done = store.get("pm.checklist", {});
  const list = $("#checklist");
  list.replaceChildren(...CENTRE_CHECKLIST.map((item) => {
    const box = el("input", { type: "checkbox", checked: !!done[item.id] });
    box.addEventListener("change", () => {
      done[item.id] = box.checked;
      store.set("pm.checklist", done);
      renderChecklist();
    });
    return el("li", {}, el("label", {}, box, ` ${item.text} `, el("span", { className: "src", textContent: item.source })));
  }));
  const n = CENTRE_CHECKLIST.filter((i) => done[i.id]).length;
  const pct = complianceScore(n, CENTRE_CHECKLIST.length);
  $("#meterBar").style.width = `${pct}%`;
  $("#meterText").textContent = `${n} of ${CENTRE_CHECKLIST.length} in place (${pct}%)`;
}
renderChecklist();

// ---------- Help ----------
function helplineBlock() {
  return el("div", { className: "helplines" }, ...HELPLINES.map((h) =>
    el("a", { className: "helpline", href: `tel:${h.number}` },
      el("strong", { textContent: h.number }),
      el("span", { textContent: h.name }),
      el("small", { textContent: h.alt ? `${h.note} Also: ${h.alt}` : h.note }))));
}
$("#helplines").replaceChildren(helplineBlock());

$("#wipe").addEventListener("click", () => {
  if (confirm("Delete all check-ins, timer rounds and checklist data from this device?")) {
    store.clear();
    renderWeek();
    renderChecklist();
    rounds = 0;
    $("#rounds").textContent = "Rounds today: 0";
  }
});

// ---------- Boot ----------
renderWeek();
drawTimer();
showTab(location.hash === "#help" ? "help" : store.get("pm.tab", "today"));

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => { /* offline support is optional */ });
}
