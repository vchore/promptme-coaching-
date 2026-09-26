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
