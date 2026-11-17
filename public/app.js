/* Flag Atlas game logic. No build step: edit and deploy. */
"use strict";

let COUNTRIES = [];
let byCode = {};
const FLAG = {};

/* ---------- look-alike groups ---------- */
const GROUPS = [
  { t: "Blue, yellow, red", codes: ["TD", "RO", "AD", "MD"], tip: "Chad and Romania are near twins: Chad's blue is a darker indigo. Andorra and Moldova use the same three colours but add a coat of arms in the middle." },
  { t: "Red over white", codes: ["ID", "MC", "PL"], tip: "Indonesia and Monaco are identical apart from proportions (Monaco's is squarer). Poland flips the order: white on top, red below." },
  { t: "Green, white, orange", codes: ["IE", "CI", "IT"], tip: "Ireland puts green next to the flagpole; Côte d'Ivoire puts orange there. Italy swaps orange for red." },
  { t: "Red, white, blue stripes", codes: ["NL", "LU"], tip: "Luxembourg's bottom stripe is a lighter sky blue. The Netherlands uses a deep navy blue." },
  { t: "Southern Cross", codes: ["AU", "NZ"], tip: "Australia's stars are white, with a big seven-pointed star under the Union Jack. New Zealand has just four red stars outlined in white." },
  { t: "Green, yellow, red", codes: ["ML", "SN", "GN", "CM"], tip: "Mali is the plain one. Senegal adds a green star in the middle. Guinea runs the other way: red, yellow, green. Cameroon goes green, red, yellow with a yellow star." },
  { t: "Nordic crosses", codes: ["DK", "NO", "IS", "SE", "FI"], tip: "Denmark: white cross on red. Norway: blue cross edged in white, on red. Iceland reverses Norway: red cross on blue. Sweden: yellow on blue. Finland: blue on white." },
  { t: "White, blue, red", codes: ["RU", "SK", "SI", "RS"], tip: "Russia is plain. Slovakia has a large shield with a white double cross toward the pole. Slovenia's small shield sits in the upper corner and shows a mountain. Serbia runs red, blue, white." },
  { t: "Yellow, blue, red", codes: ["CO", "EC", "VE"], tip: "Colombia and Ecuador both have a double-height yellow band; Ecuador adds a coat of arms with a condor. Venezuela's stripes are equal, with an arc of eight white stars." },
  { t: "Blue over red", codes: ["HT", "LI"], tip: "Haiti has a coat of arms on a white panel in the centre. Liechtenstein has a small gold crown in the upper corner." },
  { t: "Serrated edge", codes: ["QA", "BH"], tip: "Qatar is maroon with nine white points. Bahrain is brighter red with five points." },
  { t: "Red, white, black", codes: ["EG", "IQ", "YE"], tip: "Yemen is plain. Egypt has a gold eagle in the centre. Iraq has green Arabic script (Allahu Akbar)." },
  { t: "Pan-Arab triangle", codes: ["JO", "PS", "SD", "KW", "AE"], tip: "Jordan is Palestine plus a white seven-pointed star in the red triangle. Sudan has a green triangle on red, white and black. Kuwait has a black trapezoid at the pole, while the UAE has a red vertical band." },
  { t: "A disc in the middle", codes: ["JP", "BD", "PW", "NE"], tip: "Japan: red disc on white. Bangladesh: red disc on green. Palau: yellow disc on light blue. Bangladesh and Palau shift the disc toward the pole. Niger puts an orange disc on orange, white and green stripes." },
  { t: "Orange, white, green", codes: ["IN", "NE"], tip: "India has a navy blue wheel (the Ashoka Chakra). Niger has a plain orange disc." },
  { t: "Red, yellow, green", codes: ["BO", "GH", "LT"], tip: "Bolivia is red, yellow, green. Ghana uses the same order and adds a black star. Lithuania reorders them: yellow, green, red." },
  { t: "Blue, white, blue", codes: ["HN", "NI", "SV"], tip: "Honduras has five blue stars. Nicaragua and El Salvador both have emblems: Nicaragua's is a triangle with a rainbow and volcanoes, El Salvador's has a laurel wreath around it." },
  { t: "Stars and stripes", codes: ["US", "LR", "MY"], tip: "The US has 50 stars and 13 stripes. Liberia has a single white star and 11 stripes. Malaysia has a yellow crescent and star with 14 stripes." },
  { t: "Stripes with a triangle", codes: ["CU", "PR", "CZ", "PH"], tip: "Cuba: blue stripes, red triangle. Puerto Rico flips it: red stripes, blue triangle. Czechia has a blue triangle on white over red. The Philippines adds a sun and three stars on its white triangle." }
];
const TWINS = { ID: "MC", MC: "ID", TD: "RO", RO: "TD" };
const REGIONS = ["All", "Africa", "Asia", "Europe", "North America", "South America", "Oceania"];
const groupsOf = {};
GROUPS.forEach(g => g.codes.forEach(k => (groupsOf[k] = groupsOf[k] || []).push(g)));

/* ---------- text matching ---------- */
function norm(s) {
  return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/&/g, " and ").replace(/\bsaint\b/g, "st").replace(/\bst\./g, "st")
    .replace(/[^a-z0-9 ]/g, " ").replace(/\b(the|of|and)\b/g, " ").replace(/\s+/g, " ").trim();
}
const aliasIndex = new Map();
function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
function judgeTyped(input, target) {
  const q = norm(input);
  if (!q) return null;
  const exact = aliasIndex.get(q);
  if (exact) {
    if (exact === target.c) return { ok: true, picked: exact };
    if (TWINS[target.c] === exact) return { ok: true, picked: exact, twin: true };
    return { ok: false, picked: exact };
  }
  let best = null, bestD = Infinity, tie = false;
  for (const [k, code] of aliasIndex) {
    if (Math.abs(k.length - q.length) > 2) continue;
    const d = lev(q, k);
    if (d < bestD) { bestD = d; best = code; tie = false; }
    else if (d === bestD && code !== best) tie = true;
  }
  const tol = q.length >= 9 ? 2 : q.length >= 5 ? 1 : 0;
  if (best && bestD <= tol && !tie) return { ok: best === target.c, picked: best, typo: true };
  return { ok: false, picked: null };
}

/* ---------- storage ---------- */
const KEY = "flag-atlas-v1";
let store = { p: {}, best: {}, sound: false, style: "choice", region: "All", terr: false };
try { const raw = localStorage.getItem(KEY); if (raw) store = Object.assign(store, JSON.parse(raw)); } catch (e) {}
if (!REGIONS.includes(store.region)) store.region = "All";
if (!["choice", "type", "reverse"].includes(store.style)) store.style = "choice";
function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} }
function rec(code) { return store.p[code] || (store.p[code] = { b: 0, s: 0, r: 0 }); }
function status(code) { const r = store.p[code]; if (!r || !r.s) return "new"; return r.b >= 3 ? "mastered" : "learning"; }
function grade(code, ok) {
  const r = rec(code);
  if (ok) r.b = r.s === 0 ? 2 : Math.min(5, r.b + 1); else r.b = 0;
  r.s++; if (ok) r.r++;
  save(); updateMeter();
}

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const pick = a => a[Math.floor(Math.random() * a.length)];
const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const img = (code, alt = "") => `<img class="flag" src="${FLAG[code]}" alt="${esc(alt)}" draggable="false">`;
const minis = codes => `<div class="minis">${codes.filter(k => byCode[k]).map(k => `<figure>${img(k, "Flag of " + byCode[k].n)}<figcaption>${esc(byCode[k].n)}</figcaption></figure>`).join("")}</div>`;

/* ---------- sound (off by default) ---------- */
let actx = null;
function tone(freq, start, dur, type, vol) {
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, actx.currentTime + start);
  g.gain.linearRampToValueAtTime(vol, actx.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + start + dur);
  o.connect(g).connect(actx.destination);
  o.start(actx.currentTime + start); o.stop(actx.currentTime + start + dur + 0.05);
}
function sfx(ok) {
  if (!store.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === "suspended") actx.resume();
    if (ok) { tone(660, 0, 0.1, "sine", 0.12); tone(880, 0.07, 0.16, "sine", 0.12); }
    else tone(220, 0, 0.2, "triangle", 0.12);
  } catch (e) {}
}

/* ---------- theme ---------- */
function applyThemeLabel() {
  const dark = document.documentElement.dataset.theme === "dark";
  $("#themeBtn").setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
}
$("#themeBtn").addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem("flag-atlas-theme", next); } catch (e) {}
  applyThemeLabel();
});
applyThemeLabel();

/* ---------- menu ---------- */
const menu = $("#menu"), menuBtn = $("#menuBtn");
function setMenu(open) {
  menu.hidden = !open; menuBtn.setAttribute("aria-expanded", open);
}
menuBtn.addEventListener("click", e => { e.stopPropagation(); setMenu(menu.hidden); });
document.addEventListener("click", e => { if (!menu.hidden && !menu.contains(e.target)) setMenu(false); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) { setMenu(false); menuBtn.focus(); } });
menu.querySelectorAll("a[data-view]").forEach(a => a.addEventListener("click", () => setMenu(false)));

const kindOk = c => store.terr || c.k === "country";
const pool = () => COUNTRIES.filter(c => kindOk(c) && (store.region === "All" || c.r === store.region));
const poolKey = () => store.region + (store.terr ? "+t" : "");

function renderSettings() {
  $("#regionSel").innerHTML = REGIONS.map(r => {
    const n = COUNTRIES.filter(c => kindOk(c) && (r === "All" || c.r === r)).length;
    return `<option value="${r}"${r === store.region ? " selected" : ""}>${r === "All" ? "Whole world" : r} (${n})</option>`;
  }).join("");
  $("#terrToggle").checked = store.terr;
  $("#soundToggle").checked = store.sound;
  $("#styleSeg").querySelectorAll("[data-style]").forEach(b => b.setAttribute("aria-pressed", b.dataset.style === store.style));
}
$("#regionSel").addEventListener("change", e => { store.region = e.target.value; save(); settingsChanged(); });
$("#terrToggle").addEventListener("change", e => { store.terr = e.target.checked; save(); settingsChanged(); });
$("#soundToggle").addEventListener("change", e => { store.sound = e.target.checked; save(); });
$("#styleSeg").addEventListener("click", e => {
  const b = e.target.closest("[data-style]"); if (!b || b.dataset.style === store.style) return;
  store.style = b.dataset.style; save(); renderSettings();
  practice.restyle(); quiz.reset();
  if (state.view === "practice" || state.view === "quiz") renderView();
});
function settingsChanged() {
  renderSettings(); updateMeter();
  practice.reset(); quiz.reset(); nameAll.reset(); browse.render();
  renderView();
}

let resetArmed = null;
$("#resetBtn").addEventListener("click", e => {
  e.stopPropagation();
  const b = e.currentTarget;
  if (!resetArmed) { b.textContent = "Click again to erase all progress"; resetArmed = setTimeout(() => { resetArmed = null; b.textContent = "Reset progress"; }, 3500); return; }
  clearTimeout(resetArmed); resetArmed = null;
  store.p = {}; store.best = {}; save();
  b.textContent = "Progress erased"; setTimeout(() => b.textContent = "Reset progress", 2000);
  settingsChanged();
});

function updateMeter() {
  const P = pool(); let m = 0;
  P.forEach(c => { if (status(c.c) === "mastered") m++; });
  $("#meterNum").textContent = m; $("#meterTot").textContent = P.length;
  $("#meterFill").style.width = (100 * m / Math.max(1, P.length)) + "%";
}

/* ---------- question engine ---------- */
function distractors(target, n) {
  const ex = new Set([target.c]); if (TWINS[target.c]) ex.add(TWINS[target.c]);
  const out = [];
  const add = (arr, cap) => {
    let k = 0;
    for (const x of shuffle(arr)) {
      if (out.length >= n || k >= cap) break;
      if (ex.has(x.c) || !kindOk(x)) continue;
      out.push(x); k++; ex.add(x.c); if (TWINS[x.c]) ex.add(TWINS[x.c]);
    }
  };
  add((groupsOf[target.c] || []).flatMap(g => g.codes).map(k => byCode[k]).filter(Boolean), 2);
  add(COUNTRIES.filter(x => x.sr === target.sr), 2);
  add(COUNTRIES.filter(x => x.r === target.r), 3);
  add(COUNTRIES, 3);
  return out;
}
function makeQuestion(country, style) {
  const q = { c: country, style };
  if (style !== "type") q.options = shuffle([country, ...distractors(country, 3)]);
  return q;
}

/* Draws one question into host. top: optional HTML above the flag. below: text under the answers before answering. */
function renderQuestion(host, q, { top = "", below = "", onAnswer, onNext, nextLabel = "Next flag" }) {
  const c = q.c;
  let answered = false;
  let h = top;
  if (q.style === "reverse") {
    h += `<p class="prompt" style="margin-top:0">Find the flag of</p><div class="qname">${esc(c.n)}</div>
      <div class="flag-answers">${q.options.map((o, i) => `<button type="button" class="flag-answer" data-code="${o.c}" aria-label="Option ${i + 1}">${img(o.c)}<span class="cap"></span></button>`).join("")}</div>`;
  } else {
    h += `<div class="qflag">${img(c.c, "Mystery flag")}</div>`;
    if (q.style === "choice") {
      h += `<p class="prompt">Which country is this?</p><div class="answers">${q.options.map(o => `<button type="button" class="answer" data-code="${o.c}">${esc(o.n)}</button>`).join("")}</div>`;
    } else {
      h += `<p class="prompt">Which country is this?</p><form class="type-row" autocomplete="off"><input id="typeIn" type="text" placeholder="Type the country" aria-label="Country name" autocapitalize="off" spellcheck="false"><button class="btn primary" type="submit">Check</button><button class="btn" type="button" data-skip>Skip</button></form>`;
    }
  }
  h += `<div class="below">${below}</div>`;
  host.innerHTML = h;
  const belowEl = host.querySelector(".below");

  function finish(ok, picked, note) {
    if (answered) return; answered = true;
    host.querySelectorAll("[data-code]").forEach(b => {
      b.disabled = true;
      if (b.dataset.code === c.c) b.classList.add("right");
      else if (b.dataset.code === picked) b.classList.add("wrong");
      else if (q.style === "choice") b.classList.add("dim");
      const cap = b.querySelector(".cap"); if (cap) cap.textContent = byCode[b.dataset.code].n;
    });
    const inp = host.querySelector("#typeIn");
    if (inp) { inp.disabled = true; inp.classList.add(ok ? "right" : "wrong"); host.querySelectorAll(".type-row button").forEach(b => b.disabled = true); }
    sfx(ok);
    const p = picked && picked !== c.c ? byCode[picked] : null;
    let r = `<div class="result">`;
    r += ok ? `<div class="result-line good">Correct, it's ${esc(c.n)}.</div>`
            : `<div class="result-line bad">It's ${esc(c.n)}.${p ? ` You picked ${esc(p.n)}.` : ""}</div>`;
    const facts = [c.cap && `Capital: ${c.cap}`, c.sr || c.r, c.k === "territory" && "Territory"].filter(Boolean).join(" · ");
    r += `<div class="result-sub">${esc(facts)}</div>`;
    if (note) r += `<div class="result-sub">${esc(note)}</div>`;
    if (!ok) {
      const gs = groupsOf[c.c] || [];
      const g = (p && gs.find(x => x.codes.includes(p.c))) || gs[0];
      if (g) r += `<div class="tip"><b>${esc(g.t)}.</b>${minis(g.codes)}${esc(g.tip)}</div>`;
      else if (p) r += `<div class="tip"><b>Side by side</b>${minis([c.c, p.c])}</div>`;
    }
    r += `<button type="button" class="btn primary" data-next>${nextLabel}</button><span class="kbd-hint">or press <span class="kbd">Enter</span></span></div>`;
    belowEl.outerHTML = r;
    onAnswer(ok, picked);
    const nb = host.querySelector("[data-next]");
    nb.addEventListener("click", onNext);
    nb.focus({ preventScroll: true });
  }

  host.querySelectorAll("[data-code]").forEach(b => b.addEventListener("click", () => finish(b.dataset.code === c.c, b.dataset.code)));
  const form = host.querySelector("form.type-row");
  if (form) {
    const inp = form.querySelector("input");
    setTimeout(() => inp.focus({ preventScroll: true }), 30);
    form.addEventListener("submit", e => {
      e.preventDefault();
      const r = judgeTyped(inp.value, c); if (!r) return;
      let note = "";
      if (r.ok && r.twin) note = `${byCode[r.picked].n} has an identical flag, so that counts.`;
      else if (r.ok && r.typo) note = `Accepted "${inp.value.trim()}" as a typo.`;
      else if (!r.ok && !r.picked) note = `"${inp.value.trim()}" didn't match a country.`;
      finish(r.ok, r.ok ? c.c : r.picked, note);
    });
    form.querySelector("[data-skip]").addEventListener("click", () => finish(false, null, ""));
  }
  return {
    key(e) {
      if (!menu.hidden) return;
      if (e.target.tagName === "INPUT" && !answered) return;
      if (!answered && /^[1-4]$/.test(e.key) && q.options) {
        const b = host.querySelectorAll("[data-code]")[+e.key - 1]; if (b) { b.click(); e.preventDefault(); }
      } else if (answered && e.key === "Enter" && e.target.tagName !== "BUTTON") {
        e.preventDefault(); onNext();
      }
    }
  };
}

/* ---------- PRACTICE ---------- */
const practice = (() => {
  let current = null, ctl = null, recent = [], streak = 0, done = false;
  const host = () => $("#view-practice");
  function choose() {
    const P = pool();
    const avoid = new Set(recent.slice(-Math.min(4, P.length - 1)));
    const ok = P.filter(c => !avoid.has(c.c));
    const unseen = ok.filter(c => status(c.c) === "new");
    const seen = ok.filter(c => status(c.c) !== "new");
    const learning = seen.filter(c => status(c.c) === "learning");
    if (unseen.length && (learning.length < 6 || Math.random() < 0.15 || !seen.length)) return pick(unseen);
    const W = [12, 7, 4, 1.2, 0.6, 0.3];
    const ws = seen.map(c => W[rec(c.c).b] || 0.3);
    let t = Math.random() * ws.reduce((a, b) => a + b, 0);
    for (let i = 0; i < seen.length; i++) { t -= ws[i]; if (t <= 0) return seen[i]; }
    return seen[seen.length - 1] || pick(P);
  }
  function ask(c) {
    current = c; done = false;
    ctl = renderQuestion(host(), makeQuestion(c, store.style), {
      below: streak ? `Streak ${streak}` : "",
      onAnswer(ok) { done = true; grade(c.c, ok); streak = ok ? streak + 1 : 0; },
      onNext: next
    });
  }
  function next() { const c = choose(); recent.push(c.c); if (recent.length > 8) recent.shift(); ask(c); }
  return {
    reset() { recent = []; current = null; },
    restyle() { if (current && !done) ask(current); else current = null; },
    show() { if (!current) next(); },
    key(e) { ctl && ctl.key(e); }
  };
})();

/* ---------- QUIZ ---------- */
const quiz = (() => {
  let len = 20, run = null, ctl = null, timer = null;
  const host = () => $("#view-quiz");
  function setup() {
    stopTimer(); run = null; ctl = null;
    const P = pool();
    const lens = [10, 20, 50].filter(n => n < P.length).concat([P.length]);
    if (!lens.includes(len)) len = lens.includes(20) ? 20 : lens[0];
    const where = store.region === "All" ? "the whole world" : store.region;
    host().innerHTML = `<div class="setup">
      <div><h1>Quiz</h1><p>Flags from ${esc(where)}. You can change this in the menu.</p></div>
      <div class="field"><span id="lenLbl">Number of flags</span><div class="seg" role="group" aria-labelledby="lenLbl" id="qLen">${lens.map(n => `<button type="button" data-len="${n}" aria-pressed="${n === len}">${n === P.length ? `All ${n}` : n}</button>`).join("")}</div></div>
      <button class="btn primary" type="button" id="qStart">Start</button>
    </div>`;
    $("#qLen").addEventListener("click", e => { const b = e.target.closest("[data-len]"); if (b) { len = +b.dataset.len; setup(); } });
    $("#qStart").addEventListener("click", () => start(shuffle(P).slice(0, len)));
  }
  function start(items) {
    run = { items, i: 0, score: 0, misses: [], t0: Date.now() };
    stopTimer(); timer = setInterval(() => { const el = $("#qTime"); if (el && run) el.textContent = fmtTime((Date.now() - run.t0) / 1000); }, 500);
    ask();
  }
  function stopTimer() { if (timer) clearInterval(timer); timer = null; }
  function ask() {
    if (run.i >= run.items.length) return results();
    const c = run.items[run.i], last = run.i === run.items.length - 1;
    const top = `<div class="qtop"><span>${run.i + 1} / ${run.items.length}</span><span class="qtrack"><span style="width:${100 * run.i / run.items.length}%"></span></span><span id="qTime">${fmtTime((Date.now() - run.t0) / 1000)}</span></div>`;
    ctl = renderQuestion(host(), makeQuestion(c, store.style), {
      top, below: `${run.score} correct so far`,
      nextLabel: last ? "See results" : "Next flag",
      onAnswer(ok, picked) {
        grade(c.c, ok);
        if (ok) run.score++; else run.misses.push({ c: c.c, p: picked });
        host().querySelector(".qtrack span").style.width = (100 * (run.i + 1) / run.items.length) + "%";
      },
      onNext() { run.i++; ask(); }
    });
  }
  function results() {
    stopTimer(); ctl = null;
    const secs = (Date.now() - run.t0) / 1000, total = run.items.length, pct = Math.round(100 * run.score / total);
    host().innerHTML = `<div class="setup">
      <div class="score">${run.score}<small> / ${total}</small></div>
      <p>${pct}% correct in ${fmtTime(secs)}</p>
      ${run.misses.length ? `<button class="btn primary" type="button" id="qRetry">Retry the ${run.misses.length} you missed</button>` : ""}
      <button class="btn${run.misses.length ? "" : " primary"}" type="button" id="qAgain" style="width:100%">New quiz</button>
    </div>
    ${run.misses.length ? `<div class="misses">${run.misses.map(m => `<figure>${img(m.c, "Flag of " + byCode[m.c].n)}<figcaption>${esc(byCode[m.c].n)}<small>${m.p ? "you said " + esc(byCode[m.p].n) : "skipped"}</small></figcaption></figure>`).join("")}</div>` : ""}`;
    const missed = run.misses.map(m => byCode[m.c]);
    $("#qAgain").addEventListener("click", setup);
    const r = $("#qRetry"); if (r) r.addEventListener("click", () => start(shuffle(missed)));
  }
  return {
    reset() { run = null; stopTimer(); if (COUNTRIES.length) setup(); },
    show() { if (!host().innerHTML) setup(); },
    key(e) { ctl && ctl.key(e); }
  };
})();

/* ---------- NAME THEM ALL ---------- */
const nameAll = (() => {
  let g = null, timer = null, pending = null;
  const input = $("#naInput");
  function reset() {
    if (timer) clearInterval(timer); timer = null; clearTimeout(pending);
    const P = pool();
    const order = {}; REGIONS.slice(1).forEach(r => order[r] = shuffle(P.filter(c => c.r === r)));
    g = { P, order, found: new Set(), t0: null, done: false, gave: false, codes: new Set(P.map(c => c.c)) };
    input.value = ""; input.disabled = false;
    $("#naTotal").textContent = P.length; $("#naFound").textContent = 0; $("#naTime").textContent = "0:00";
    $("#naGiveUp").disabled = false;
    render(); banner();
  }
  function render() {
    let h = "";
    for (const r of REGIONS.slice(1)) {
      const list = g.order[r]; if (!list.length) continue;
      const f = list.filter(c => g.found.has(c.c)).length;
      h += `<div class="region-h"><h2>${r}</h2><span data-rc="${r}">${f} / ${list.length}</span></div><div class="grid">${list.map(tileHTML).join("")}</div>`;
    }
    $("#naBoard").innerHTML = h;
  }
  function tileHTML(c) {
    const found = g.found.has(c.c), missed = g.gave && !found;
    return `<div class="tile ${found ? "found" : missed ? "missed" : ""}" data-tile="${c.c}">${img(c.c, found || missed ? "Flag of " + c.n : "Unnamed flag")}<div class="lab">${found || missed ? esc(c.n) : "?"}</div></div>`;
  }
  function banner(msg, good) {
    const best = store.best[poolKey()];
    $("#naBanner").innerHTML = msg ? `<div class="banner ${good ? "good" : ""}">${msg}</div>`
      : `<p class="na-hint">Type every country you can think of. Short names like USA, UK and Ivory Coast work too. The timer starts with your first letter.${best ? ` Your best: ${fmtTime(best)}.` : ""}</p>`;
  }
  function accept(code) {
    clearTimeout(pending); pending = null;
    if (g.done || g.found.has(code) || !g.codes.has(code)) return;
    g.found.add(code); grade(code, true); sfx(true);
    const el = document.querySelector(`[data-tile="${code}"]`); if (el) el.outerHTML = tileHTML(byCode[code]);
    const r = byCode[code].r, list = g.order[r];
    const rc = document.querySelector(`[data-rc="${CSS.escape(r)}"]`); if (rc) rc.textContent = `${list.filter(c => g.found.has(c.c)).length} / ${list.length}`;
    $("#naFound").textContent = g.found.size;
    input.value = ""; input.classList.add("flash"); setTimeout(() => input.classList.remove("flash"), 250);
    if (g.found.size === g.P.length) finish(false);
  }
  function finish(gave) {
    g.done = true; g.gave = gave; if (timer) clearInterval(timer); timer = null;
    const secs = g.t0 ? (Date.now() - g.t0) / 1000 : 0;
    input.disabled = true; $("#naGiveUp").disabled = true;
    if (gave) {
      g.P.forEach(c => { if (!g.found.has(c.c)) grade(c.c, false); });
      render();
      banner(`You named ${g.found.size} of ${g.P.length} in ${fmtTime(secs)}. The ones in red will come up first in Practice.`);
    } else {
      const k = poolKey(), prev = store.best[k];
      const isBest = !prev || secs < prev; if (isBest) { store.best[k] = Math.round(secs); save(); }
      banner(`All ${g.P.length} named in ${fmtTime(secs)}.${isBest ? " That's your best time." : ` Your best is ${fmtTime(prev)}.`}`, true);
    }
  }
  input.addEventListener("input", () => {
    if (g.done) return;
    if (!g.t0) { g.t0 = Date.now(); timer = setInterval(() => $("#naTime").textContent = fmtTime((Date.now() - g.t0) / 1000), 500); }
    clearTimeout(pending); pending = null;
    const q = norm(input.value); if (!q) return;
    const code = aliasIndex.get(q);
    if (!code || g.found.has(code) || !g.codes.has(code)) return;
    // Wait a moment if this is also the start of another name still to find (Niger → Nigeria).
    let prefix = false;
    for (const [k, c2] of aliasIndex) {
      if (c2 !== code && !g.found.has(c2) && g.codes.has(c2) && k.length > q.length && k.startsWith(q)) { prefix = true; break; }
    }
    if (prefix) pending = setTimeout(() => accept(code), 1100); else accept(code);
  });
  input.addEventListener("keydown", e => { if (e.key === "Enter") { const code = aliasIndex.get(norm(input.value)); if (code) accept(code); } });
  $("#naGiveUp").addEventListener("click", () => { if (!g.done) finish(true); });
  $("#naRestart").addEventListener("click", () => { reset(); input.focus(); });
  return { reset, show() { if (!g) reset(); setTimeout(() => input.focus({ preventScroll: true }), 30); }, key() {} };
})();

/* ---------- BROWSE ---------- */
const browse = (() => {
  let tab = "all";
  const body = () => $("#browseBody");
  function render() {
    if (!COUNTRIES.length) return;
    const qs = norm($("#brSearch").value || "");
    const hide = $("#brHide").checked;
    $("#brAll").setAttribute("aria-pressed", tab === "all"); $("#brLook").setAttribute("aria-pressed", tab === "look");
    if (tab === "all") {
      const list = pool().filter(c => !qs || norm(c.n).includes(qs) || norm(c.cap).includes(qs) || c.a.some(a => norm(a).includes(qs)));
      body().innerHTML = list.length ? `<div class="cards">${list.map(c => {
        const s = status(c.c);
        return `<button type="button" class="card ${hide ? "hidden" : ""}" data-card="${c.c}" aria-label="${hide ? "Hidden flag, click to reveal" : esc(c.n)}">${img(c.c, hide ? "" : "Flag of " + c.n)}<span class="nm"><span class="dot ${s}" title="${s}"></span><span>${esc(c.n)}</span></span><span class="sub">${esc(c.cap || "–")}</span></button>`;
      }).join("")}</div>` : `<div class="empty">No flags match "${esc($("#brSearch").value)}".</div>`;
    } else {
      const gs = GROUPS.filter(g => !qs || g.codes.some(k => byCode[k] && norm(byCode[k].n).includes(qs)) || norm(g.t).includes(qs));
      body().innerHTML = `<div class="groups">${gs.map(g => `<div class="group"><h3>${esc(g.t)}</h3>${minis(g.codes)}<p>${esc(g.tip)}</p></div>`).join("")}</div>`;
    }
  }
  body().addEventListener("click", e => { const c = e.target.closest(".card.hidden"); if (c) { c.classList.remove("hidden"); c.setAttribute("aria-label", byCode[c.dataset.card].n); } });
  $("#brSearch").addEventListener("input", render);
  $("#brHide").addEventListener("change", render);
  $("#brAll").addEventListener("click", () => { tab = "all"; render(); });
  $("#brLook").addEventListener("click", () => { tab = "look"; render(); });
  return { render, show: render, reset() {}, key() {} };
})();

/* ---------- views ---------- */
const VIEWS = { practice, quiz, "name-all": nameAll, browse };
const VIEW_NAMES = { practice: "Practice", quiz: "Quiz", "name-all": "Name them all", browse: "Browse flags" };
const state = { view: "practice" };
function renderView() {
  if (!COUNTRIES.length) return;
  const v = VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : "practice";
  state.view = v;
  document.querySelectorAll(".view").forEach(s => s.hidden = s.id !== "view-" + v);
  menu.querySelectorAll("a[data-view]").forEach(a => { if (a.dataset.view === v) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  $("#menuLabel").textContent = VIEW_NAMES[v];
  VIEWS[v].show();
}
addEventListener("hashchange", renderView);
document.addEventListener("keydown", e => { const v = VIEWS[state.view]; if (v) v.key(e); });

/* ---------- boot ---------- */
async function boot() {
  try {
    const [cRes, fRes] = await Promise.all([fetch("data/countries.json"), fetch("data/flags.json")]);
    if (!cRes.ok || !fRes.ok) throw new Error("load");
    COUNTRIES = await cRes.json();
    (await fRes.json()).forEach(f => { FLAG[f.c] = URL.createObjectURL(new Blob([f.s], { type: "image/svg+xml" })); });
  } catch (err) {
    $("#loading").textContent = "The flags didn't load. Refresh the page to try again.";
    return;
  }
  byCode = Object.fromEntries(COUNTRIES.map(c => [c.c, c]));
  COUNTRIES.forEach(c => [c.n, ...c.a].forEach(a => { const k = norm(a); if (k && !aliasIndex.has(k)) aliasIndex.set(k, c.c); }));
  $("#loading").remove();
  renderSettings(); updateMeter();
  quiz.reset(); nameAll.reset();
  renderView();
}
boot();
