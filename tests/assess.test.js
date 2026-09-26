import { test } from "node:test";
import assert from "node:assert/strict";
import {
  scorePhq4, scoreHabits, topicSummary, testTrend, daysUntil, goalStreak, progressReport, normalizeBrand,
} from "../js/logic.js";
import { PHQ4, HABITS, EXAMS } from "../js/data.js";
import { readBrand, contrast } from "../scripts/brand-utils.js";
import { readdirSync } from "node:fs";

test("PHQ-4 bands and subscales", () => {
  const all = (v) => Object.fromEntries(PHQ4.items.map((i) => [i.id, v]));
  assert.equal(scorePhq4(all(0), PHQ4.items).band, "normal");
  assert.equal(scorePhq4({ a1: 1, a2: 1, d1: 1, d2: 0 }, PHQ4.items).band, "mild");
  assert.equal(scorePhq4(all(2), PHQ4.items).band, "moderate");
  const severe = scorePhq4(all(3), PHQ4.items);
  assert.equal(severe.band, "severe");
  assert.equal(severe.total, 12);
  const anx = scorePhq4({ a1: 2, a2: 1, d1: 0, d2: 0 }, PHQ4.items);
  assert.equal(anx.anxietyFlag, true);
  assert.equal(anx.moodFlag, false);
});

test("habits score and weakest-first tips", () => {
  const answers = Object.fromEntries(HABITS.items.map((i) => [i.id, 2]));
  assert.deepEqual(scoreHabits(answers, HABITS.items), { percent: 100, tips: [] });
  answers.phone = 0; answers.sleep = 1;
  const r = scoreHabits(answers, HABITS.items);
  assert.equal(r.percent, 81); // 13 of 16
  assert.equal(r.tips[0], HABITS.items.find((i) => i.id === "phone").tip);
  assert.equal(r.tips.length, 2);
});

test("topicSummary groups by confidence, weakest first", () => {
  const s = topicSummary([
    { topic: "A", rating: 5 }, { topic: "B", rating: 3 }, { topic: "C", rating: 2 }, { topic: "D", rating: 1 },
  ]);
  assert.deepEqual(s.strong.map((t) => t.topic), ["A"]);
  assert.deepEqual(s.revise.map((t) => t.topic), ["B"]);
  assert.deepEqual(s.focus.map((t) => t.topic), ["D", "C"]);
});

test("testTrend sorts by date, filters subject, computes change and best", () => {
  const tests = [
    { date: "2026-09-10", subject: "Physics", score: 60, max: 100 },
    { date: "2026-08-01", subject: "Physics", score: 45, max: 90 },
    { date: "2026-09-01", subject: "Chemistry", score: 30, max: 40 },
  ];
  const p = testTrend(tests, "Physics");
  assert.deepEqual(p.list.map((t) => t.pct), [50, 60]);
  assert.equal(p.change, 10);
  assert.equal(p.best, 60);
  assert.equal(testTrend(tests).list.length, 3);
  assert.equal(testTrend([], null).last, null);
});

test("daysUntil and goalStreak", () => {
  assert.equal(daysUntil("2026-10-06", "2026-09-26"), 10);
  assert.equal(daysUntil("", "2026-09-26"), null);
  const goals = [
    { date: "2026-09-23", done: true }, { date: "2026-09-24", done: true },
    { date: "2026-09-25", done: true }, { date: "2026-09-26", done: false },
  ];
  assert.equal(goalStreak(goals, "2026-09-26"), 3, "today not done yet keeps yesterday's streak");
  goals[3].done = true;
  assert.equal(goalStreak(goals, "2026-09-26"), 4);
  assert.equal(goalStreak([{ date: "2026-09-20", done: true }], "2026-09-26"), 0);
});

test("progress report never includes wellbeing answers", () => {
  const text = progressReport({
    profile: { name: "Asha", exam: "NEET-UG" }, brand: { name: "Demo Academy" },
    trend: testTrend([{ date: "2026-09-01", subject: "Biology", score: 300, max: 360 }]),
    habits: { percent: 75 }, streak: 1, openDoubts: 2,
  });
  assert.match(text, /Asha/);
  assert.match(text, /83%/);
  assert.match(text, /1 day\b/);
  assert.doesNotMatch(text, /PHQ|anxi|depress/i);
});

test("normalizeBrand fills defaults and rejects bad colours", () => {
  const b = normalizeBrand({ name: "Shree Classes", primary: "red" });
  assert.equal(b.primary, "#2f5d8a");
  assert.equal(b.initials, "SC");
  assert.deepEqual(b.notices, []);
});

test("every brand folder is valid and readable on white", () => {
  for (const slug of readdirSync("brands")) {
    const b = readBrand(slug);
    assert.ok(contrast(b.primary, "#ffffff") >= 4.5, `${slug} primary too light`);
  }
});

test("every exam has subjects", () => {
  for (const [exam, subs] of Object.entries(EXAMS)) assert.ok(subs.length > 0, exam);
});
