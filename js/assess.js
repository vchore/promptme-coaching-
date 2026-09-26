// Assess tab: test-score tracker, topic confidence, habits check, PHQ-4, shareable report.
import { PHQ4, HABITS } from "./data.js";
import {
  testTrend, topicSummary, scoreHabits, scorePhq4, goalStreak, progressReport,
} from "./logic.js";
import { $, el, store, today, uid, fillSelect, formatDate } from "./ui.js";

const SVG = "http://www.w3.org/2000/svg";
const svg = (tag, attrs = {}) => {
  const n = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

export function initAssess(ctx) {
  // ---------- Tests ----------
  const testForm = $("#testForm");
  testForm.elements.date.value = today;
  testForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = testForm.elements;
    const score = +f.score.value;
    const max = +f.max.value;
    if (!(max > 0) || score < 0 || score > max) {
      f.score.setCustomValidity("Marks must be between 0 and the maximum.");
      f.score.reportValidity();
      return;
    }
    const tests = store.get("tests", []);
    tests.push({ id: uid(), date: f.date.value, name: f.name.value.trim(), subject: f.subject.value, score, max });
    store.set("tests", tests);
    f.name.value = ""; f.score.value = ""; f.max.value = max;
    $("#trendSubject").value = f.subject.value;
    renderTests();
  });
  testForm.elements.score.addEventListener("input", (e) => e.target.setCustomValidity(""));
  $("#trendSubject").addEventListener("change", renderTests);

  function renderTests() {
    const tests = store.get("tests", []);
    const sel = $("#trendSubject");
    const current = sel.value;
    fillSelect(sel, ["All subjects", ...ctx.subjects()], current || "All subjects");
    const subject = sel.value === "All subjects" ? null : sel.value;
    const trend = testTrend(tests, subject);

    $("#trendStats").textContent = trend.last
      ? `Latest ${trend.last.pct}% · Best ${trend.best}%${trend.change == null ? "" : ` · ${trend.change >= 0 ? "▲" : "▼"} ${Math.abs(trend.change)}`}`
      : "";
    drawChart($("#chart"), trend.list);

    const table = $("#testTable");
    table.replaceChildren(
      el("tr", {}, ...["Date", "Test", "Subject", "Marks", "%", ""].map((h) => el("th", { textContent: h }))),
      ...trend.list.slice().reverse().map((t) => {
        const del = el("button", { className: "icon", textContent: "✕", ariaLabel: "Delete test" });
        del.addEventListener("click", () => {
          store.set("tests", store.get("tests", []).filter((x) => x.id !== t.id));
          renderTests();
        });
        return el("tr", {},
          el("td", { textContent: formatDate(t.date) }), el("td", { textContent: t.name || "—" }),
          el("td", { textContent: t.subject }), el("td", { textContent: `${t.score}/${t.max}` }),
          el("td", { textContent: `${t.pct}%` }), el("td", {}, del));
      }));
    renderReport();
  }

  // Single-series line chart of % over time for one subject (or all). Own-progress only.
  function drawChart(host, list) {
    host.replaceChildren();
    if (list.length === 0) {
      host.append(el("p", { className: "muted center empty", textContent: "Add your first test to see your progress line." }));
      host.setAttribute("aria-label", "No tests yet");
      return;
    }
    // Draw at the element's real pixel width so text stays legible on phones.
    const W = Math.max(280, host.clientWidth || 600), H = 200, L = 40, R = 44, T = 14, B = 28;
    const x = (i) => (list.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (list.length - 1));
    const y = (p) => T + ((100 - p) * (H - T - B)) / 100;
    const s = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart-svg" });
    for (const g of [0, 50, 100]) {
      s.append(svg("line", { x1: L, x2: W - R, y1: y(g), y2: y(g), class: g === 0 ? "axis" : "grid" }));
      const t = svg("text", { x: L - 6, y: y(g) + 4, class: "tick", "text-anchor": "end" });
      t.textContent = `${g}%`;
      s.append(t);
    }
    const first = svg("text", { x: x(0), y: H - 8, class: "tick", "text-anchor": list.length === 1 ? "middle" : "start" });
    first.textContent = formatDate(list[0].date);
    s.append(first);
    if (list.length > 1) {
      const last = svg("text", { x: x(list.length - 1), y: H - 8, class: "tick", "text-anchor": "end" });
      last.textContent = formatDate(list[list.length - 1].date);
      s.append(last);
    }
    s.append(svg("path", { d: list.map((t, i) => `${i ? "L" : "M"}${x(i)},${y(t.pct)}`).join(" "), class: "line" }));
    const cross = svg("line", { y1: T, y2: H - B, class: "cross", visibility: "hidden" });
    s.append(cross);
    list.forEach((t, i) => s.append(svg("circle", { cx: x(i), cy: y(t.pct), r: 4.5, class: "dot" })));
    const lastT = list[list.length - 1];
    const lbl = svg("text", { x: x(list.length - 1) + 8, y: y(lastT.pct) + 4, class: "value" });
    lbl.textContent = `${lastT.pct}%`;
    s.append(lbl);

    const tip = el("div", { className: "tooltip", hidden: true });
    const showAt = (clientX) => {
      const box = s.getBoundingClientRect();
      const px = ((clientX - box.left) / box.width) * W;
      let i = 0;
      for (let k = 1; k < list.length; k++) if (Math.abs(x(k) - px) < Math.abs(x(i) - px)) i = k;
      const t = list[i];
      cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i));
      cross.setAttribute("visibility", "visible");
      tip.hidden = false;
      tip.replaceChildren(el("strong", { textContent: `${t.pct}%` }), ` ${t.score}/${t.max}`,
        el("div", { className: "muted", textContent: `${t.name || t.subject} · ${formatDate(t.date)}` }));
      const left = (x(i) / W) * box.width;
      tip.style.left = `${Math.min(Math.max(left, 70), box.width - 70)}px`;
      tip.style.top = `${(y(t.pct) / H) * box.height}px`;
    };
    s.addEventListener("pointermove", (e) => showAt(e.clientX));
    s.addEventListener("pointerdown", (e) => showAt(e.clientX));
    s.addEventListener("pointerleave", () => { tip.hidden = true; cross.setAttribute("visibility", "hidden"); });
    host.setAttribute("aria-label", `Test scores over time, latest ${lastT.pct} percent`);
    host.append(s, tip);
  }

  // ---------- Topics ----------
  $("#topicForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target.elements;
    const topics = store.get("topics", []);
    const topic = f.topic.value.trim();
    const existing = topics.find((t) => t.subject === f.subject.value && t.topic.toLowerCase() === topic.toLowerCase());
    if (existing) Object.assign(existing, { rating: +f.rating.value, date: today });
    else topics.push({ id: uid(), subject: f.subject.value, topic, rating: +f.rating.value, date: today });
    store.set("topics", topics);
    f.topic.value = "";
    renderTopics();
  });

  function renderTopics() {
    const topics = store.get("topics", []);
    const sum = topicSummary(topics);
    const group = (title, cls, items, hint) => el("div", { className: `topic-group ${cls}` },
      el("h3", {}, `${title} `, el("span", { className: "count", textContent: items.length })),
      el("p", { className: "muted small", textContent: hint }),
      el("ul", {}, ...items.map((t) => {
        const del = el("button", { className: "icon", textContent: "✕", ariaLabel: `Remove ${t.topic}` });
        del.addEventListener("click", () => {
          store.set("topics", store.get("topics", []).filter((x) => x.id !== t.id));
          renderTopics();
        });
        return el("li", {}, el("span", { className: "src", textContent: t.subject }), ` ${t.topic} `,
          el("span", { className: "rating", textContent: "●".repeat(t.rating) + "○".repeat(5 - t.rating) }), del);
      })));
    $("#topicSummary").replaceChildren(
      topics.length ? "" : el("p", { className: "muted", textContent: "Add chapters you've studied to see where to focus." }),
      group("Focus first", "focus", sum.focus, "Rated 1–2: ask a doubt, re-watch the lecture, do basics."),
      group("Revise", "revise", sum.revise, "Rated 3: practise mixed questions."),
      group("Strong", "strong", sum.strong, "Rated 4–5: keep warm with timed tests."),
    );
  }

  // ---------- Quizzes ----------
  function buildQuiz(form, items, options, key) {
    const saved = store.get(key, null);
    form.replaceChildren(...items.map((item, idx) => el("fieldset", { className: "q" },
      el("legend", { textContent: `${idx + 1}. ${item.text}` }),
      el("div", { className: "opts" }, ...options.map((label, v) => el("label", {},
        el("input", { type: "radio", name: item.id, value: v, required: true, checked: saved?.answers?.[item.id] === v }),
        el("span", { textContent: label })))))),
      el("button", { className: "primary", textContent: "See my result" }));
    return saved;
  }
  const readAnswers = (form, items) =>
    Object.fromEntries(items.map((i) => [i.id, +form.elements[i.id].value]));

  const habitForm = $("#habitForm");
  const phqForm = $("#phqForm");
  const savedHabits = buildQuiz(habitForm, HABITS.items, HABITS.options, "habits");
  const savedPhq = buildQuiz(phqForm, PHQ4.items, PHQ4.options, "phq4");
  phqForm.prepend(el("p", { className: "muted", textContent: PHQ4.intro }));

  function showHabits(answers, date) {
    const r = scoreHabits(answers, HABITS.items);
    $("#habitResult").replaceChildren(
      el("div", { className: "meter" }, el("div", { className: "bar", style: `width:${r.percent}%` })),
      el("p", {}, el("strong", { textContent: `${r.percent}% healthy habits` }), ` · ${formatDate(date)}`),
      r.tips.length ? el("ul", {}, ...r.tips.map((t) => el("li", { textContent: t }))) : el("p", { textContent: "Excellent routine. Keep it up!" }));
  }
  habitForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const answers = readAnswers(habitForm, HABITS.items);
    store.set("habits", { date: today, answers });
    showHabits(answers, today);
    renderReport();
  });
  if (savedHabits) showHabits(savedHabits.answers, savedHabits.date);

  function showPhq(answers, date) {
    const r = scorePhq4(answers, PHQ4.items);
    const msg = {
      normal: "Your answers don't suggest significant anxiety or low mood right now. Keep looking after yourself.",
      mild: "Some signs of stress. Try the Calm tab daily, keep sleep regular, and talk to someone you trust.",
      moderate: "Your answers suggest moderate distress. Please talk to a counsellor this week; it really helps.",
      severe: "Your answers suggest high distress. Please talk to a counsellor or call Tele-MANAS 14416 today. You don't have to handle this alone.",
    }[r.band];
    const box = $("#phqResult");
    box.className = `result ${r.band === "normal" ? "ok" : r.band === "mild" ? "watch" : "support"}`;
    box.replaceChildren(
      el("p", {}, el("strong", { textContent: `Score ${r.total}/12 · ${r.band}` }), ` · ${formatDate(date)}`),
      el("p", { textContent: msg }),
      r.anxietyFlag ? el("p", { className: "small muted", textContent: "Anxiety items were high (3+)." }) : null,
      r.moodFlag ? el("p", { className: "small muted", textContent: "Low-mood items were high (3+)." }) : null,
    );
    if (r.band === "moderate" || r.band === "severe") box.append(ctx.helpLinks());
  }
  phqForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const answers = readAnswers(phqForm, PHQ4.items);
    // Wellbeing answers are kept on-device and never included in the shared report.
    store.set("phq4", { date: today, answers });
    showPhq(answers, today);
  });
  if (savedPhq) showPhq(savedPhq.answers, savedPhq.date);

  // ---------- Report ----------
  function reportText() {
    const habits = store.get("habits", null);
    return progressReport({
      profile: ctx.profile(),
      brand: ctx.brand,
      trend: testTrend(store.get("tests", [])),
      habits: habits ? scoreHabits(habits.answers, HABITS.items) : null,
      streak: goalStreak(store.get("goals", []), today),
      openDoubts: store.get("doubts", []).filter((d) => !d.resolved).length,
    });
  }
  function renderReport() {
    const text = reportText();
    $("#reportPreview").textContent = text;
    $("#waBtn").href = `https://wa.me/?text=${encodeURIComponent(text)}`;
  }
  $("#shareBtn").addEventListener("click", async () => {
    const text = reportText();
    try {
      if (navigator.share) return await navigator.share({ text });
      await navigator.clipboard.writeText(text);
      $("#shareBtn").textContent = "Copied ✓";
    } catch { /* user cancelled */ }
  });

  function refresh() {
    ctx.subjectSelects();
    renderTests();
    renderTopics();
    renderReport();
  }
  refresh();
  return { refresh, renderReport };
}

