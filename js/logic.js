// Pure functions with no DOM access, so they can be unit-tested in Node.

export const DAILY_CLASS_CAP_HOURS = 5; // Draft Maharashtra Act, 2026
export const MIN_SLEEP_HOURS = 7;

// Phrases that should surface crisis support immediately. English, Hinglish, Marathi, Hindi.
const CRISIS_PATTERNS = [
  /\bsuicid/i,
  /\bkill (my ?self|me)\b/i,
  /\bend (my|it all|my life)\b/i,
  /\bwant(ed)? to die\b/i,
  /\bno (reason|point) (to|in) liv/i,
  /\bself[- ]?harm/i,
  /\bhurt(ing)? my ?self\b/i,
  /\bcut(ting)? my ?self\b/i,
  /\bbetter off (dead|without me)\b/i,
  /\bmar(na|jaana|jana) (hai|chahta|chahti)/i,
  /आत्महत्या/,
  /मरायचं|मरायचे|मरून जावं/,
  /मरना चाहता|मरना चाहती|जीना नहीं/,
];

export function detectCrisis(text) {
  if (!text) return false;
  return CRISIS_PATTERNS.some((re) => re.test(text));
}

// mood: 1 (very low) – 5 (great); stress: 1 (calm) – 5 (overwhelmed)
export function assessCheckin({ mood, stress, sleepHours, classHours, note = "" }) {
  const flags = [];
  let score = 0;

  if (mood <= 2) { score += 2; flags.push("low-mood"); }
  if (stress >= 4) { score += 2; flags.push("high-stress"); }
  if (sleepHours < MIN_SLEEP_HOURS) { score += sleepHours < 5 ? 2 : 1; flags.push("low-sleep"); }
  if (classHours > DAILY_CLASS_CAP_HOURS) { score += 1; flags.push("over-class-cap"); }

  const crisis = detectCrisis(note);
  if (crisis) flags.push("crisis");

  let level = "ok";
  if (crisis) level = "crisis";
  else if (score >= 4) level = "support";
  else if (score >= 2) level = "watch";

  return { level, score, flags, advice: adviceFor(level, flags) };
}

function adviceFor(level, flags) {
  const tips = [];
  if (level === "crisis") {
    tips.push("You don't have to handle this alone. Please call Tele-MANAS at 14416 now — it's free and confidential.");
    tips.push("Tell a trusted adult (parent, teacher, warden or counsellor) today.");
    return tips;
  }
  if (level === "support") {
    tips.push("This sounds like a heavy day. Talking helps — reach out to your centre's counsellor or call 14416.");
  }
  if (flags.includes("low-sleep")) tips.push("Sleep is study time for your memory. Aim for 7–9 hours tonight.");
  if (flags.includes("high-stress")) tips.push("Try 4 rounds of box breathing before your next session.");
  if (flags.includes("low-mood")) tips.push("Do one small thing you enjoy today, not linked to studies.");
  if (flags.includes("over-class-cap")) {
    tips.push(`You had more than ${DAILY_CLASS_CAP_HOURS} hours of coaching classes. The draft Maharashtra rules propose a ${DAILY_CLASS_CAP_HOURS}-hour daily cap.`);
  }
  if (tips.length === 0) tips.push("Nice balance today. Keep your breaks and your weekly off.");
  return tips;
}

// entries: [{ date: "YYYY-MM-DD", level }] – returns true if the last `days` check-ins
// are all "support" or worse, which warrants a stronger nudge to talk to someone.
export function needsFollowUp(entries, days = 3) {
  if (entries.length < days) return false;
  const recent = [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(-days);
  return recent.every((e) => e.level === "support" || e.level === "crisis");
}

// dates: array of "YYYY-MM-DD" with any study/class activity.
// Returns true when every one of the last 7 days (ending `today`) had activity.
export function missedWeeklyOff(dates, today) {
  const set = new Set(dates);
  const d = new Date(today + "T00:00:00Z");
  for (let i = 0; i < 7; i++) {
    const key = d.toISOString().slice(0, 10);
    if (!set.has(key)) return false;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return true;
}

export function complianceScore(checked, total) {
  if (total === 0) return 0;
  return Math.round((checked / total) * 100);
}

// Deterministic "prompt of the day" so every student sees the same one on a given date.
export function promptOfDay(list, dateStr) {
  let h = 0;
  for (const ch of dateStr) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return list[h % list.length];
}

export function todayISO(now = new Date()) {
  const tz = now.getTimezoneOffset() * 60000;
  return new Date(now - tz).toISOString().slice(0, 10);
}

// ---------- Self-assessment scoring ----------

// answers: { itemId: 0..3 }. Bands per Kroenke et al. (2009).
export function scorePhq4(answers, items) {
  const sum = (scale) => items.filter((i) => !scale || i.scale === scale)
    .reduce((s, i) => s + (answers[i.id] ?? 0), 0);
  const total = sum();
  const anxiety = sum("anxiety");
  const mood = sum("mood");
  const band = total <= 2 ? "normal" : total <= 5 ? "mild" : total <= 8 ? "moderate" : "severe";
  return { total, anxiety, mood, band, anxietyFlag: anxiety >= 3, moodFlag: mood >= 3 };
}

// answers: { itemId: 0..2 }. Returns percent and the tips for the weakest habits.
export function scoreHabits(answers, items, maxTips = 3) {
  const max = items.length * 2;
  const got = items.reduce((s, i) => s + (answers[i.id] ?? 0), 0);
  const tips = items.filter((i) => (answers[i.id] ?? 0) < 2)
    .sort((a, b) => (answers[a.id] ?? 0) - (answers[b.id] ?? 0))
    .slice(0, maxTips)
    .map((i) => i.tip);
  return { percent: Math.round((got / max) * 100), tips };
}

// topics: [{ subject, topic, rating 1..5 }]
export function topicSummary(topics) {
  const out = { strong: [], revise: [], focus: [] };
  for (const t of topics) {
    if (t.rating >= 4) out.strong.push(t);
    else if (t.rating === 3) out.revise.push(t);
    else out.focus.push(t);
  }
  out.focus.sort((a, b) => a.rating - b.rating);
  return out;
}

// tests: [{ date, subject, score, max }]. Compares a student only with themselves.
export function testTrend(tests, subject) {
  const list = tests
    .filter((t) => !subject || t.subject === subject)
    .map((t) => ({ ...t, pct: t.max > 0 ? Math.round((t.score / t.max) * 100) : 0 }))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (list.length === 0) return { list, best: null, last: null, change: null };
  const last = list[list.length - 1];
  const prev = list.length > 1 ? list[list.length - 2] : null;
  const best = Math.max(...list.map((t) => t.pct));
  return { list, best, last, change: prev ? last.pct - prev.pct : null };
}

export function daysUntil(dateStr, today) {
  if (!dateStr) return null;
  const ms = Date.parse(dateStr + "T00:00:00Z") - Date.parse(today + "T00:00:00Z");
  return Math.round(ms / 86400000);
}

// goals: [{ date, done }] — consecutive days (ending today or yesterday) with ≥1 done goal.
export function goalStreak(goals, today) {
  const days = new Set(goals.filter((g) => g.done).map((g) => g.date));
  const d = new Date(today + "T00:00:00Z");
  if (!days.has(today)) d.setUTCDate(d.getUTCDate() - 1);
  let n = 0;
  while (days.has(d.toISOString().slice(0, 10))) {
    n += 1;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return n;
}

// Text summary a student can choose to share with a parent or mentor.
export function progressReport({ profile, brand, trend, habits, streak, openDoubts }) {
  const lines = [`📘 ${profile.name || "Student"} — progress from ${brand.name}`];
  if (profile.exam) lines.push(`Preparing for: ${profile.exam}`);
  if (trend.last) {
    const ch = trend.change == null ? "" : ` (${trend.change >= 0 ? "+" : ""}${trend.change} vs previous)`;
    lines.push(`Latest test: ${trend.last.name || trend.last.subject} ${trend.last.pct}%${ch}. Personal best: ${trend.best}%`);
  }
  if (habits) lines.push(`Study habits score: ${habits.percent}%`);
  lines.push(`Goal streak: ${streak} day${streak === 1 ? "" : "s"}`);
  lines.push(`Open doubts to clear: ${openDoubts}`);
  lines.push("Shared from the PromptMe app.");
  return lines.join("\n");
}

// ---------- Branding ----------
const HEX = /^#[0-9a-f]{6}$/i;

export function normalizeBrand(raw = {}) {
  const b = { ...DEFAULT_BRAND, ...raw };
  b.shortName = raw.shortName || raw.name || DEFAULT_BRAND.shortName;
  if (!HEX.test(b.primary)) b.primary = DEFAULT_BRAND.primary;
  if (!HEX.test(b.accent)) b.accent = b.primary;
  b.initials = (b.shortName || b.name).split(/\s+/).filter(Boolean).slice(0, 2)
    .map((w) => w[0].toUpperCase()).join("");
  b.notices = Array.isArray(b.notices) ? b.notices : [];
  return b;
}

export const DEFAULT_BRAND = {
  slug: "default",
  name: "PromptMe",
  shortName: "PromptMe",
  tagline: "Study smart. Rest well. Know your rights.",
  primary: "#2f5d8a",
  accent: "#2f5d8a",
  logo: "",
  city: "",
  phone: "",
  whatsapp: "",
  email: "",
  website: "",
  address: "",
  counsellor: null,
  timings: "",
  weeklyOff: "",
  notices: [],
};
