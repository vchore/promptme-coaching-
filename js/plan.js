// Plan tab: daily goals, focus timer, doubt diary, study prompts.
import { PROMPTS } from "./data.js";
import { goalStreak } from "./logic.js";
import { $, $$, el, store, today, uid, formatDate } from "./ui.js";

export function initPlan(ctx) {
  // ---------- Goals ----------
  function renderGoals() {
    const goals = store.get("goals", []);
    const todays = goals.filter((g) => g.date === today);
    $("#goalList").replaceChildren(...(todays.length ? todays.map((g) => {
      const box = el("input", { type: "checkbox", checked: g.done });
      box.addEventListener("change", () => {
        g.done = box.checked;
        store.set("goals", goals);
        renderGoals();
        ctx.onChange();
      });
      const del = el("button", { className: "icon", textContent: "✕", ariaLabel: "Remove goal" });
      del.addEventListener("click", () => {
        store.set("goals", goals.filter((x) => x.id !== g.id));
        renderGoals();
      });
      return el("li", { className: g.done ? "done" : "" }, el("label", {}, box, ` ${g.text}`), del);
    }) : [el("li", { className: "muted", textContent: "No goals yet for today." })]));
    const s = goalStreak(goals, today);
    $("#streak").textContent = `🔥 ${s}-day streak`;
  }
  $("#goalForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = e.target.elements.text.value.trim();
    if (!text) return;
    const goals = store.get("goals", []);
    // Keep 60 days of history for the streak; older goals are dropped.
    const cutoff = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
    store.set("goals", [...goals.filter((g) => g.date >= cutoff), { id: uid(), date: today, text, done: false }]);
    e.target.reset();
    renderGoals();
  });

  // ---------- Focus timer ----------
  const timer = { focus: 25 * 60, short: 5 * 60, long: 15 * 60, left: 25 * 60, mode: "focus", id: null };
  let rounds = store.get(`rounds.${today}`, 0);
  const showRounds = () => { $("#rounds").textContent = `Rounds today: ${rounds}`; };
  const draw = () => {
    const m = String(Math.floor(timer.left / 60)).padStart(2, "0");
    const s = String(timer.left % 60).padStart(2, "0");
    $("#timer").textContent = `${m}:${s}`;
    $("#timerMode").textContent = { focus: "Focus", short: "Short break: stand up, drink water", long: "Long break: step outside" }[timer.mode];
  };
  const tick = () => {
    timer.left -= 1;
    if (timer.left <= 0) {
      if (timer.mode === "focus") {
        rounds += 1;
        store.set(`rounds.${today}`, rounds);
        showRounds();
        timer.mode = rounds % 4 === 0 ? "long" : "short";
      } else {
        timer.mode = "focus";
      }
      timer.left = timer[timer.mode];
      try { navigator.vibrate?.(300); } catch { /* ignore */ }
    }
    draw();
  };
  $("#timerStart").addEventListener("click", (e) => {
    if (timer.id) { clearInterval(timer.id); timer.id = null; e.target.textContent = "Start"; }
    else { timer.id = setInterval(tick, 1000); e.target.textContent = "Pause"; }
  });
  $("#timerReset").addEventListener("click", () => {
    clearInterval(timer.id); timer.id = null;
    Object.assign(timer, { mode: "focus", left: timer.focus });
    $("#timerStart").textContent = "Start";
    draw();
  });

  // ---------- Doubt diary ----------
  function renderDoubts() {
    const doubts = store.get("doubts", []);
    const open = doubts.filter((d) => !d.resolved);
    const solved = doubts.filter((d) => d.resolved).slice(-5);
    $("#doubtList").replaceChildren(...[...open, ...solved].map((d) => {
      const btn = el("button", { className: "small-btn", textContent: d.resolved ? "Reopen" : "Cleared ✓" });
      btn.addEventListener("click", () => {
        d.resolved = !d.resolved;
        store.set("doubts", doubts);
        renderDoubts();
        ctx.onChange();
      });
      return el("li", { className: d.resolved ? "done" : "" },
        el("div", {}, el("span", { className: "src", textContent: d.subject }), ` ${d.text}`,
          el("div", { className: "muted small", textContent: formatDate(d.date) })),
        btn);
    }));
    if (!doubts.length) $("#doubtList").append(el("li", { className: "muted", textContent: "No doubts noted. Great, or time to try harder questions!" }));
  }
  $("#doubtForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target.elements;
    const doubts = store.get("doubts", []);
    doubts.push({ id: uid(), date: today, subject: f.subject.value, text: f.text.value.trim(), resolved: false });
    store.set("doubts", doubts);
    f.text.value = "";
    renderDoubts();
    ctx.onChange();
  });

  // ---------- Prompts ----------
  const shuffle = (kind) => {
    const list = [...PROMPTS[kind]].sort(() => Math.random() - 0.5).slice(0, 3);
    $(`#${kind}List`).replaceChildren(...list.map((t) => el("li", { textContent: t })));
  };
  shuffle("study");
  shuffle("reflect");
  $$("[data-shuffle]").forEach((b) => b.addEventListener("click", () => shuffle(b.dataset.shuffle)));

  renderGoals();
  renderDoubts();
  showRounds();
  draw();
  return { renderGoals, renderDoubts };
}
