import { test } from "node:test";
import assert from "node:assert/strict";
import {
  detectCrisis, assessCheckin, needsFollowUp, missedWeeklyOff, complianceScore, promptOfDay,
} from "../js/logic.js";
import { PROMPTS, CENTRE_CHECKLIST, HELPLINES } from "../js/data.js";

const base = { mood: 4, stress: 2, sleepHours: 8, classHours: 4 };

test("detectCrisis catches English, Hinglish, Marathi and Hindi phrases", () => {
  for (const s of [
    "I want to die", "thinking about suicide", "I might kill myself", "self-harm again",
    "everyone is better off without me", "ab marna chahta hoon",
    "आत्महत्या करावीशी वाटते", "मला मरायचं आहे", "मैं मरना चाहती हूँ",
  ]) assert.equal(detectCrisis(s), true, s);
});

test("detectCrisis ignores ordinary exam stress", () => {
  for (const s of ["", "physics killed me today lol", "tired of organic chemistry", "the test was a disaster"]) {
    assert.equal(detectCrisis(s), false, s);
  }
});

test("balanced day is ok", () => {
  const r = assessCheckin(base);
  assert.equal(r.level, "ok");
  assert.deepEqual(r.flags, []);
});

test("low sleep + high stress escalates to support", () => {
  const r = assessCheckin({ ...base, stress: 5, sleepHours: 4 });
  assert.equal(r.level, "support");
  assert.ok(r.advice.some((t) => t.includes("14416")));
});

test("exceeding 5 class hours is flagged", () => {
  const r = assessCheckin({ ...base, classHours: 7 });
  assert.ok(r.flags.includes("over-class-cap"));
  assert.ok(r.advice.some((t) => t.includes("5-hour")));
});

test("crisis note overrides otherwise good scores", () => {
  const r = assessCheckin({ ...base, note: "I don't see a point, I want to die" });
  assert.equal(r.level, "crisis");
  assert.match(r.advice[0], /14416/);
});

test("needsFollowUp after three consecutive tough days", () => {
  const log = [
    { date: "2026-09-20", level: "ok" },
    { date: "2026-09-21", level: "support" },
    { date: "2026-09-22", level: "support" },
    { date: "2026-09-23", level: "crisis" },
  ];
  assert.equal(needsFollowUp(log), true);
  assert.equal(needsFollowUp(log.slice(0, 3)), false);
});

test("missedWeeklyOff needs 7 consecutive days ending today", () => {
  const seven = ["20", "21", "22", "23", "24", "25", "26"].map((d) => `2026-09-${d}`);
  assert.equal(missedWeeklyOff(seven, "2026-09-26"), true);
  assert.equal(missedWeeklyOff(seven.filter((d) => d !== "2026-09-23"), "2026-09-26"), false);
});

test("complianceScore rounds and handles empty", () => {
  assert.equal(complianceScore(7, 14), 50);
  assert.equal(complianceScore(0, 0), 0);
});

test("promptOfDay is deterministic and in range", () => {
  const a = promptOfDay(PROMPTS.study, "2026-09-26");
  assert.equal(a, promptOfDay(PROMPTS.study, "2026-09-26"));
  assert.ok(PROMPTS.study.includes(a));
});

test("content sanity", () => {
  assert.ok(HELPLINES.some((h) => h.number === "14416"));
  assert.equal(new Set(CENTRE_CHECKLIST.map((c) => c.id)).size, CENTRE_CHECKLIST.length);
});
