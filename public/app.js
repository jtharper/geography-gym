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
const REGION_COLOR = { All: "#1d1a3a", Africa: "#ff8a1f", Asia: "#ff4f7b", Europe: "#3a6bff", "North America": "#19b866", "South America": "#d69e00", Oceania: "#8f5cff" };
const groupsOf = {};
GROUPS.forEach(g => g.codes.forEach(k => (groupsOf[k] = groupsOf[k] || []).push(g)));

const CHEERS = ["Nailed it!", "Boom!", "Flag-tastic!", "You got it!", "Spot on!", "Brilliant!", "Yes!", "Smooth!", "Easy!", "Sharp eyes!"];
const OOPS = ["Oops!", "Not quite!", "So close!", "Nope!", "Almost!"];
const LEVELS = [
  [0, "Rookie"], [100, "Explorer"], [300, "Navigator"], [700, "Ambassador"],
  [1400, "Globetrotter"], [2500, "Cartographer"], [4000, "Flag Master"], [6000, "Flag Legend"]
];

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
let store = { p: {}, best: {}, pts: 0, sound: true };
try { const raw = localStorage.getItem(KEY); if (raw) store = Object.assign(store, JSON.parse(raw)); } catch (e) {}
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
const img = (code, cls = "flag", alt = "") => `<img class="${cls}" src="${FLAG[code]}" alt="${esc(alt)}" draggable="false">`;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- sound ---------- */
let actx = null;
function tone(freq, start, dur, type = "sine", vol = 0.18) {
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, actx.currentTime + start);
  g.gain.linearRampToValueAtTime(vol, actx.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + start + dur);
  o.connect(g).connect(actx.destination);
  o.start(actx.currentTime + start); o.stop(actx.currentTime + start + dur + 0.05);
}
function sfx(kind) {
  if (!store.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === "suspended") actx.resume();
    if (kind === "good") { tone(660, 0, 0.12); tone(990, 0.08, 0.2); }
    else if (kind === "bad") { tone(200, 0, 0.18, "square", 0.08); tone(150, 0.12, 0.25, "square", 0.08); }
    else if (kind === "pop") { tone(880, 0, 0.08, "triangle", 0.15); }
    else if (kind === "fanfare") { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.25, "triangle", 0.16)); }
  } catch (e) {}
}
function renderSound() {
  const b = $("#soundBtn"); b.setAttribute("aria-pressed", store.sound); b.setAttribute("aria-label", store.sound ? "Sound on" : "Sound off");
}
$("#soundBtn").addEventListener("click", () => { store.sound = !store.sound; save(); renderSound(); sfx("pop"); });

/* ---------- confetti ---------- */
const confetti = (() => {
  const cv = $("#confetti"), ctx = cv.getContext("2d");
  const colors = ["#ff4f7b", "#ffd23f", "#22c172", "#3a6bff", "#8f5cff", "#ff8a1f", "#4cc3ff"];
  let parts = [], running = false;
  function resize() { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; }
  addEventListener("resize", resize); resize();
  function burst(x, y, n = 70) {
    if (reduceMotion) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 9;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6, s: 6 + Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: pick(colors), life: 90 + Math.random() * 40, shape: Math.random() < .5 ? 0 : 1 });
    }
    if (!running) { running = true; requestAnimationFrame(step); }
  }
  function step() {
    const d = devicePixelRatio;
    ctx.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter(p => p.life > 0 && p.y < innerHeight + 40);
    for (const p of parts) {
      p.vy += 0.32; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life--;
      ctx.save(); ctx.translate(p.x * d, p.y * d); ctx.rotate(p.r); ctx.globalAlpha = Math.min(1, p.life / 30);
      ctx.fillStyle = p.c;
      if (p.shape) ctx.fillRect(-p.s * d / 2, -p.s * d / 4, p.s * d, p.s * d / 2);
      else { ctx.beginPath(); ctx.moveTo(0, -p.s * d / 2); ctx.lineTo(p.s * d / 2, p.s * d / 2); ctx.lineTo(-p.s * d / 2, p.s * d / 2); ctx.fill(); }
      ctx.restore();
    }
    if (parts.length) requestAnimationFrame(step); else { running = false; ctx.clearRect(0, 0, cv.width, cv.height); }
  }
  return { burst, fromEl(el, n) { const r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, n); }, rain() { for (let i = 0; i < 6; i++) setTimeout(() => burst(Math.random() * innerWidth, innerHeight * .25, 45), i * 160); } };
})();

let toastT = null;
function toast(text) {
  const t = $("#toast"); t.textContent = text; t.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 1300);
}

/* ---------- bunting ---------- */
function drawBunting() {
  const svg = $("#bunting"), w = Math.max(320, document.documentElement.clientWidth), h = 54;
  const colors = ["#ff4f7b", "#ffd23f", "#22c172", "#3a6bff", "#8f5cff", "#ff8a1f", "#ffffff"];
  const span = w / 2, sag = 16, step = 40;
  const y = x => { const t = (x % span) / span; return 4 + sag * 4 * t * (1 - t); };
  let path = `M0 ${y(0)}`;
  for (let x = 4; x <= w; x += 4) path += ` L${x} ${y(x).toFixed(1)}`;
  let tris = "";
  let i = 0;
  for (let x = step / 2; x < w; x += step, i++) {
    const y0 = y(x - 13), y1 = y(x + 13), ym = y(x);
    tris += `<path d="M${x - 13} ${y0} L${x + 13} ${y1} L${x} ${ym + 30} Z" fill="${colors[i % colors.length]}" stroke="#1d1a3a" stroke-width="2.5" stroke-linejoin="round"/>`;
  }
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.innerHTML = `<path d="${path}" stroke="#1d1a3a" stroke-width="2.5" fill="none"/>${tris}`;
}
let bt; addEventListener("resize", () => { clearTimeout(bt); bt = setTimeout(drawBunting, 120); });
drawBunting();

/* ---------- filters + HUD ---------- */
const state = { region: "All", terr: false, view: "practice" };
try { const f = JSON.parse(localStorage.getItem(KEY + "-filters") || "{}"); if (REGIONS.includes(f.region)) state.region = f.region; state.terr = !!f.terr; } catch (e) {}
const kindOk = c => state.terr || c.k === "country";
const pool = () => COUNTRIES.filter(c => kindOk(c) && (state.region === "All" || c.r === state.region));
const poolKey = () => state.region + (state.terr ? "+t" : "");
const scopeName = () => (state.region === "All" ? "All countries" : state.region) + (state.terr ? " + territories" : "");

function renderChips() {
  $("#regionChips").innerHTML = REGIONS.map(r => {
    const n = COUNTRIES.filter(c => kindOk(c) && (r === "All" || c.r === r)).length;
    return `<button type="button" class="chip" style="--c:${REGION_COLOR[r]}" data-region="${r}" aria-pressed="${r === state.region}">${r}<span class="n">${n}</span></button>`;
  }).join("");
}
$("#regionChips").addEventListener("click", e => {
  const b = e.target.closest("[data-region]"); if (!b) return;
  state.region = b.dataset.region; filtersChanged();
});
$("#terrToggle").addEventListener("change", e => { state.terr = e.target.checked; filtersChanged(); });
function filtersChanged() {
  try { localStorage.setItem(KEY + "-filters", JSON.stringify({ region: state.region, terr: state.terr })); } catch (e) {}
  renderChips(); updateMeter();
  practice.reset(); quiz.reset(); nameAll.reset(); study.render();
  renderView();
}

function levelOf(pts) {
  let i = 0; while (i + 1 < LEVELS.length && pts >= LEVELS[i + 1][0]) i++;
  return { n: i + 1, name: LEVELS[i][1], next: LEVELS[i + 1] ? LEVELS[i + 1][0] : null };
}
function renderLevel() {
  const L = levelOf(store.pts);
  $("#lvlNum").textContent = L.n; $("#lvlName").textContent = L.name;
  $("#lvlNext").textContent = L.next ? `${store.pts} / ${L.next} pts` : `${store.pts} pts`;
}
function addPoints(n) {
  const before = levelOf(store.pts).n;
  store.pts += n; save(); renderLevel();
  const L = levelOf(store.pts);
  if (L.n > before) { setTimeout(() => { toast(`Level up: ${L.name}!`); sfx("fanfare"); confetti.rain(); }, 350); }
}
const streak = { cur: 0, best: 0 };
function bumpStreak(ok) {
  if (ok) { streak.cur++; streak.best = Math.max(streak.best, streak.cur); } else streak.cur = 0;
  $("#hudStreak").textContent = streak.cur;
  $(".flame").classList.toggle("hot", streak.cur >= 5);
  if (ok && streak.cur >= 5 && streak.cur % 5 === 0) { setTimeout(() => { toast(`${streak.cur} in a row!`); sfx("fanfare"); confetti.rain(); }, 250); }
}

function updateMeter() {
  const P = pool(); let m = 0, l = 0;
  P.forEach(c => { const s = status(c.c); if (s === "mastered") m++; else if (s === "learning") l++; });
  $("#meterNum").textContent = m; $("#meterTot").textContent = P.length;
  $("#meterFill").style.width = (100 * m / P.length) + "%";
  $("#pBar").innerHTML = `<span style="width:${100 * m / P.length}%;background:var(--leaf)"></span><span style="width:${100 * l / P.length}%;background:var(--sea)"></span>`;
  $("#pLegend").innerHTML = `<div><span class="sw m"></span>Mastered<b>${m}</b></div><div><span class="sw l"></span>Learning<b>${l}</b></div><div><span class="sw n"></span>Not seen yet<b>${P.length - m - l}</b></div>`;
  $("#poolTitle").textContent = scopeName();
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
const PROMPTS = { choice: "Which country is this?", type: "Name this flag!", reverse: "Find the flag of…" };

function renderQuestion(host, q, header, onAnswer, onNext) {
  const c = q.c;
  let answered = false;
  let html = `<div class="qhead"><h2>${PROMPTS[q.style]}</h2>${header || ""}</div>`;
  if (q.style === "reverse") {
    html += `<div class="qname">${esc(c.n)}</div><div class="flagchoices">` +
      q.options.map((o, i) => `<button type="button" class="flagchoice" data-code="${o.c}" aria-label="Option ${i + 1}"><span class="kbd">${i + 1}</span>${img(o.c)}<span class="cap"></span></button>`).join("") + `</div>`;
  } else {
    html += `<div class="mast"><div class="pole"></div><div class="waver">${img(c.c, "flag", "Mystery flag")}</div></div>`;
    if (q.style === "choice") {
      html += `<div class="choices">` + q.options.map((o, i) => `<button type="button" class="choice" data-code="${o.c}"><span class="kbd">${i + 1}</span>${esc(o.n)}</button>`).join("") + `</div>`;
    } else {
      html += `<form class="typerow" autocomplete="off"><input id="typeIn" type="text" placeholder="Country name" aria-label="Country name" autocapitalize="off" spellcheck="false"><button class="btn go" type="submit">Check</button><button class="btn ghost" type="button" data-skip>No idea</button></form>`;
    }
  }
  html += `<div class="fb"></div>`;
  host.innerHTML = html;
  const fb = host.querySelector(".fb");

  function finish(ok, picked, note) {
    if (answered) return; answered = true;
    let pts = 0;
    if (q.style === "choice" || q.style === "reverse") {
      host.querySelectorAll("[data-code]").forEach(b => {
        b.disabled = true;
        if (b.dataset.code === c.c) b.classList.add("right");
        else if (b.dataset.code === picked) b.classList.add("wrong");
        else if (q.style === "choice") b.classList.add("dim");
        if (q.style === "reverse") b.querySelector(".cap").textContent = byCode[b.dataset.code].n;
      });
    } else {
      const inp = host.querySelector("#typeIn"); inp.disabled = true; inp.classList.add(ok ? "right" : "wrong");
      host.querySelectorAll(".typerow button").forEach(b => b.disabled = true);
    }
    bumpStreak(ok);
    if (ok) {
      pts = 10 + 2 * Math.min(streak.cur - 1, 10) + (q.style === "type" ? 5 : 0);
      addPoints(pts); sfx("good");
      const el = host.querySelector(".right") || host.querySelector("#typeIn") || host.querySelector(".waver");
      if (el) confetti.fromEl(el, 55);
    } else sfx("bad");
    fb.innerHTML = feedbackHTML(c, ok, picked, note, pts);
    onAnswer(ok, picked);
    const nb = fb.querySelector("[data-next]");
    if (nb) { nb.addEventListener("click", onNext); nb.focus({ preventScroll: true }); }
  }

  host.querySelectorAll("[data-code]").forEach(b => b.addEventListener("click", () => finish(b.dataset.code === c.c, b.dataset.code)));
  const form = host.querySelector("form.typerow");
  if (form) {
    const inp = form.querySelector("input");
    setTimeout(() => inp.focus({ preventScroll: true }), 30);
    form.addEventListener("submit", e => {
      e.preventDefault();
      const r = judgeTyped(inp.value, c); if (!r) return;
      let note = "";
      if (r.ok && r.twin) note = `${byCode[r.picked].n} has an identical flag, so that counts.`;
      else if (r.ok && r.typo) note = `Close enough! We'll accept "${inp.value.trim()}".`;
      else if (!r.ok && !r.picked) note = `"${inp.value.trim()}" isn't a country we know.`;
      finish(r.ok, r.ok ? c.c : r.picked, note);
    });
    form.querySelector("[data-skip]").addEventListener("click", () => finish(false, null, ""));
  }
  return {
    key(e) {
      if (e.target.tagName === "INPUT" && !answered) return;
      if (!answered && /^[1-4]$/.test(e.key) && q.options) {
        const b = host.querySelectorAll("[data-code]")[+e.key - 1]; if (b) { b.click(); e.preventDefault(); }
      } else if (answered && (e.key === "Enter" || e.key === " ") && e.target.tagName !== "BUTTON") {
        e.preventDefault(); onNext();
      }
    }
  };
}

function feedbackHTML(c, ok, picked, note, pts) {
  const p = picked && picked !== c.c ? byCode[picked] : null;
  let h = `<div class="feedback">`;
  h += ok
    ? `<div class="cheer good"><h3>${pick(CHEERS)}</h3><span class="sub">${esc(c.n)}</span><span class="plus">+${pts}</span></div>`
    : `<div class="cheer bad"><h3>${pick(OOPS)}</h3><span class="sub">That's ${esc(c.n)}.</span></div>`;
  if (note) h += `<div class="note">${esc(note)}</div>`;
  h += `<div class="facts">${c.cap ? `<span>Capital: <b>${esc(c.cap)}</b></span>` : ""}<span>Region: <b>${esc(c.sr || c.r)}</b></span><span>Code: <b>${c.c}</b></span>${c.k === "territory" ? "<span><b>Territory</b></span>" : ""}</div>`;
  if (!ok && p) {
    h += `<div class="compare"><figure>${img(c.c, "flag", "Flag of " + c.n)}<figcaption>${esc(c.n)}<small>the answer</small></figcaption></figure>` +
         `<figure>${img(p.c, "flag", "Flag of " + p.n)}<figcaption>${esc(p.n)}<small>your pick</small></figcaption></figure></div>`;
  }
  const gs = groupsOf[c.c] || [];
  const g = (p && gs.find(g => g.codes.includes(p.c))) || gs[0];
  if (g) {
    h += `<div class="tip"><h4>Spot the difference: ${esc(g.t)}</h4><div class="minis">` +
      g.codes.filter(k => byCode[k]).map(k => `<figure>${img(k, "flag", "Flag of " + byCode[k].n)}<figcaption>${esc(byCode[k].n)}</figcaption></figure>`).join("") +
      `</div><p>${esc(g.tip)}</p></div>`;
  }
  h += `<div class="next-row"><button type="button" class="btn go" data-next>Next flag →</button><span class="note">or press <span class="key">Enter</span></span></div></div>`;
  return h;
}

function styleSeg(id, current) {
  return `<div class="seg" role="group" aria-label="Answer style" id="${id}">` +
    [["choice", "4 choices"], ["type", "Type it"], ["reverse", "Pick the flag"]]
      .map(([k, l]) => `<button type="button" data-style="${k}" aria-pressed="${k === current}">${l}</button>`).join("") + `</div>`;
}

/* ---------- PRACTICE ---------- */
const practice = (() => {
  let style = "choice", q = null, ctl = null, recent = [];
  const session = { n: 0, ok: 0, log: [] };
  try { const s = localStorage.getItem(KEY + "-style"); if (["choice", "type", "reverse"].includes(s)) style = s; } catch (e) {}
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
    let done = false;
    q = makeQuestion(c, style);
    ctl = renderQuestion($("#practiceCard"), q, styleSeg("pStyle", style), ok => {
      done = true; grade(c.c, ok);
      session.n++; if (ok) session.ok++;
      session.log.push({ c: c.c, ok }); if (session.log.length > 21) session.log.shift();
      renderStats();
    }, next);
    $("#pStyle").addEventListener("click", e => {
      const b = e.target.closest("[data-style]"); if (!b || b.dataset.style === style) return;
      style = b.dataset.style; try { localStorage.setItem(KEY + "-style", style); } catch (err) {}
      if (done) next(); else ask(c);
    });
  }
  function next() {
    const c = choose(); recent.push(c.c); if (recent.length > 8) recent.shift();
    ask(c);
  }
  function renderStats() {
    $("#sCorrect").textContent = session.ok;
    $("#sAcc").textContent = session.n ? Math.round(100 * session.ok / session.n) + "%" : "–";
    $("#sBest").textContent = streak.best;
    $("#sRecent").innerHTML = session.log.slice().reverse().map(l => `<img class="${l.ok ? "ok" : "no"}" src="${FLAG[l.c]}" alt="${esc(byCode[l.c].n)}${l.ok ? " (correct)" : " (missed)"}" title="${esc(byCode[l.c].n)}">`).join("") || `<span class="empty-note">Your answers will pile up here.</span>`;
  }
  return {
    reset() { recent = []; q = null; },
    show() { if (!q) next(); renderStats(); },
    key(e) { ctl && ctl.key(e); }
  };
})();

/* ---------- QUIZ ---------- */
const STAR = on => `<svg viewBox="0 0 24 24" class="${on ? "on" : ""}"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" fill="${on ? "#ffd23f" : "#ffffff"}" stroke="#1d1a3a" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
const quiz = (() => {
  const cfg = { len: 20, style: "choice" };
  let run = null, ctl = null, timer = null;
  const host = () => $("#quizCard");
  function setup() {
    stopTimer(); run = null; ctl = null;
    const P = pool();
    const lens = [10, 20, 50].filter(n => n < P.length).concat([P.length]);
    if (!lens.includes(cfg.len)) cfg.len = lens.includes(20) ? 20 : lens[0];
    host().innerHTML = `<div class="setup">
      <div><h2>Quiz time!</h2><p>${esc(scopeName())}. How many can you get right, and how fast?</p></div>
      <div class="row"><span class="lbl" id="lenLbl">How many flags?</span><div class="seg" role="group" aria-labelledby="lenLbl" id="qLen">${lens.map(n => `<button type="button" data-len="${n}" aria-pressed="${n === cfg.len}">${n === P.length ? `All ${n}` : n}</button>`).join("")}</div></div>
      <div class="row"><span class="lbl">Answer style</span>${styleSeg("qStyle", cfg.style)}</div>
      <button class="btn go" type="button" id="qStart">Let's go!</button>
    </div>`;
    $("#qLen").addEventListener("click", e => { const b = e.target.closest("[data-len]"); if (b) { cfg.len = +b.dataset.len; setup(); } });
    $("#qStyle").addEventListener("click", e => { const b = e.target.closest("[data-style]"); if (b) { cfg.style = b.dataset.style; setup(); } });
    $("#qStart").addEventListener("click", () => start(shuffle(P).slice(0, cfg.len)));
  }
  function start(items) {
    run = { items, i: 0, score: 0, misses: [], t0: Date.now() };
    stopTimer(); timer = setInterval(tick, 500); ask();
  }
  function tick() { const el = $("#qTime"); if (el && run) el.textContent = fmtTime((Date.now() - run.t0) / 1000); }
  function stopTimer() { if (timer) clearInterval(timer); timer = null; }
  function ask() {
    if (run.i >= run.items.length) return results();
    const c = run.items[run.i];
    const q = makeQuestion(c, cfg.style);
    const header = `<div class="qmeta"><span>${run.i + 1} of ${run.items.length}</span><span><span id="qScore">${run.score}</span> right</span><span id="qTime">${fmtTime((Date.now() - run.t0) / 1000)}</span></div>`;
    ctl = renderQuestion(host(), q, header, (ok, picked) => {
      grade(c.c, ok);
      if (ok) run.score++; else run.misses.push({ c: c.c, p: picked });
      $("#qScore").textContent = run.score;
      host().querySelector(".progress span").style.width = (100 * (run.i + 1) / run.items.length) + "%";
      const nb = host().querySelector("[data-next]"); if (nb && run.i === run.items.length - 1) nb.textContent = "See my score →";
    }, () => { run.i++; ask(); });
    host().insertAdjacentHTML("afterbegin", `<div class="progress"><span style="width:${100 * run.i / run.items.length}%"></span></div>`);
  }
  function results() {
    stopTimer(); ctl = null;
    const secs = (Date.now() - run.t0) / 1000, total = run.items.length, pct = Math.round(100 * run.score / total);
    const stars = pct === 100 ? 3 : pct >= 75 ? 2 : pct >= 40 ? 1 : 0;
    const msg = ["Keep practising!", "Nice work!", "Great job!", "Perfect round!"][stars];
    host().innerHTML = `<div class="results">
      <div class="stars">${[0, 1, 2].map(i => STAR(i < stars)).join("")}</div>
      <h2 style="font-size:clamp(2rem,5vw,2.6rem)">${msg}</h2>
      <div class="big">${run.score}<small>/${total}</small></div>
      <div class="qmeta"><span>${pct}%</span><span>${fmtTime(secs)}</span></div>
      <div class="btns">${run.misses.length ? `<button class="btn go" type="button" id="qRetry">Retry the ${run.misses.length} I missed</button>` : ""}<button class="btn ${run.misses.length ? "ghost" : "go"}" type="button" id="qAgain">New quiz</button></div>
      ${run.misses.length ? `<div class="misslist">${run.misses.map(m => `<figure>${img(m.c, "flag", "Flag of " + byCode[m.c].n)}<figcaption>${esc(byCode[m.c].n)}${m.p ? `<small>you said ${esc(byCode[m.p].n)}</small>` : `<small>skipped</small>`}</figcaption></figure>`).join("")}</div>` : ""}
    </div>`;
    if (stars >= 2) { confetti.rain(); sfx("fanfare"); }
    const missed = run.misses.map(m => byCode[m.c]);
    $("#qAgain").addEventListener("click", setup);
    const r = $("#qRetry"); if (r) r.addEventListener("click", () => start(shuffle(missed)));
  }
  return {
    reset() { run = null; stopTimer(); setup(); },
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
      h += `<div class="na-region"><h3>${r}</h3><span class="count" data-rc="${r}">${f} / ${list.length}</span></div><div class="na-grid">` + list.map(tileHTML).join("") + `</div>`;
    }
    $("#naBoard").innerHTML = h;
  }
  function tileHTML(c) {
    const found = g.found.has(c.c), missed = g.gave && !found;
    return `<div class="tile ${found ? "found" : missed ? "missed" : ""}" data-tile="${c.c}">${img(c.c, "flag", found || missed ? "Flag of " + c.n : "Unnamed flag")}<div class="lab">${found || missed ? esc(c.n) : "?"}</div></div>`;
  }
  function banner(msg, bad) {
    $("#naBanner").innerHTML = msg ? `<div class="banner ${bad ? "bad" : ""}">${msg}</div>`
      : `<p class="na-msg">Type every country you can think of. Short names work too (USA, UK, Ivory Coast, DRC). The clock starts on your first letter. Your best for this set: <b>${store.best[poolKey()] ? fmtTime(store.best[poolKey()]) : "none yet"}</b></p>`;
  }
  function accept(code) {
    clearTimeout(pending); pending = null;
    if (g.done || g.found.has(code) || !g.codes.has(code)) return;
    g.found.add(code); grade(code, true); addPoints(5); sfx("pop");
    const el = document.querySelector(`[data-tile="${code}"]`);
    if (el) { el.outerHTML = tileHTML(byCode[code]); const nel = document.querySelector(`[data-tile="${code}"]`); if (nel) confetti.fromEl(nel, 18); }
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
      banner(`You named ${g.found.size} of ${g.P.length} in ${fmtTime(secs)}. The red ones go to the front of the line in Practice.`, true);
    } else {
      const k = poolKey(), prev = store.best[k];
      const isBest = !prev || secs < prev; if (isBest) { store.best[k] = Math.round(secs); save(); }
      banner(`You named all ${g.P.length} in ${fmtTime(secs)}!${isBest ? " That's a new record." : ` Your record is ${fmtTime(prev)}.`}`);
      toast("All of them!"); sfx("fanfare"); confetti.rain();
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

/* ---------- STUDY ---------- */
const study = (() => {
  let tab = "all";
  const body = () => $("#studyBody");
  function render() {
    if (!COUNTRIES.length) return;
    const qs = norm($("#stSearch").value || "");
    const hide = $("#stHide").checked;
    $("#stAll").setAttribute("aria-pressed", tab === "all"); $("#stLook").setAttribute("aria-pressed", tab === "look");
    if (tab === "all") {
      const list = pool().filter(c => !qs || norm(c.n).includes(qs) || norm(c.cap).includes(qs) || c.a.some(a => norm(a).includes(qs)));
      body().innerHTML = list.length ? `<div class="cards">` + list.map(c => {
        const s = status(c.c);
        return `<button type="button" class="scard ${hide ? "hidden" : ""}" data-card="${c.c}" aria-label="${hide ? "Hidden flag, tap to reveal" : esc(c.n)}">${img(c.c, "flag", hide ? "" : "Flag of " + c.n)}<div class="meta"><div class="nm"><span class="pip ${s}" title="${s}"></span><span>${esc(c.n)}</span><span class="iso">${c.c}</span></div><div class="sub">${esc(c.cap || "–")} · ${esc(c.sr || c.r)}</div></div></button>`;
      }).join("") + `</div>` : `<div class="card empty">No flags match "${esc($("#stSearch").value)}" in ${esc(scopeName())}.</div>`;
    } else {
      const gs = GROUPS.filter(g => !qs || g.codes.some(k => byCode[k] && norm(byCode[k].n).includes(qs)) || norm(g.t).includes(qs));
      body().innerHTML = `<p class="intro">These are the flags everyone mixes up. Learn the one detail that sets each apart.</p><div class="groups">` +
        gs.map(g => `<div class="card group"><h3>${esc(g.t)}</h3><div class="minis">${g.codes.filter(k => byCode[k]).map(k => `<figure>${img(k, "flag", "Flag of " + byCode[k].n)}<figcaption>${esc(byCode[k].n)}</figcaption></figure>`).join("")}</div><p>${esc(g.tip)}</p></div>`).join("") + `</div>`;
    }
  }
  body().addEventListener("click", e => { const c = e.target.closest(".scard.hidden"); if (c) { c.classList.remove("hidden"); c.setAttribute("aria-label", byCode[c.dataset.card].n); sfx("pop"); } });
  $("#stSearch").addEventListener("input", render);
  $("#stHide").addEventListener("change", render);
  $("#stAll").addEventListener("click", () => { tab = "all"; render(); });
  $("#stLook").addEventListener("click", () => { tab = "look"; render(); });
  return { render, show: render, reset() {}, key() {} };
})();

/* ---------- views ---------- */
const VIEWS = { practice, quiz, "name-all": nameAll, study };
function renderView() {
  const v = VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : "practice";
  state.view = v;
  document.querySelectorAll(".view").forEach(s => s.hidden = s.id !== "view-" + v);
  document.querySelectorAll(".tabs a").forEach(a => { if (a.dataset.view === v) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  VIEWS[v].show();
}
addEventListener("hashchange", renderView);
document.addEventListener("keydown", e => { const v = VIEWS[state.view]; if (v) v.key(e); });

let resetArmed = null;
$("#resetBtn").addEventListener("click", e => {
  const b = e.currentTarget;
  if (!resetArmed) { b.textContent = "Tap again to erase everything"; resetArmed = setTimeout(() => { resetArmed = null; b.textContent = "Reset progress"; }, 3500); return; }
  clearTimeout(resetArmed); resetArmed = null;
  store = { p: {}, best: {}, pts: 0, sound: store.sound }; save();
  b.textContent = "Progress erased"; setTimeout(() => b.textContent = "Reset progress", 2000);
  renderLevel(); filtersChanged();
});

/* ---------- boot ---------- */
async function boot() {
  try {
    const [cRes, fRes] = await Promise.all([fetch("data/countries.json"), fetch("data/flags.json")]);
    if (!cRes.ok || !fRes.ok) throw new Error("load");
    COUNTRIES = await cRes.json();
    (await fRes.json()).forEach(f => { FLAG[f.c] = URL.createObjectURL(new Blob([f.s], { type: "image/svg+xml" })); });
  } catch (err) {
    $("#loading").innerHTML = "The flags didn't load. Refresh the page to try again.";
    return;
  }
  byCode = Object.fromEntries(COUNTRIES.map(c => [c.c, c]));
  COUNTRIES.forEach(c => [c.n, ...c.a].forEach(a => { const k = norm(a); if (k && !aliasIndex.has(k)) aliasIndex.set(k, c.c); }));
  $("#loading").remove();
  $("#terrToggle").checked = state.terr;
  renderSound(); renderLevel(); renderChips(); updateMeter();
  quiz.reset(); nameAll.reset();
  renderView();
}
boot();
