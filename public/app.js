/* Geography Gym: one quiz engine shared by every topic. No build step: edit and deploy. */
"use strict";

/* ---------- topics ---------- */
const WORLD_REGIONS = ["All", "Africa", "Asia", "Europe", "North America", "South America", "Oceania"];
const US_REGIONS = ["All", "Northeast", "Midwest", "South", "West"];
const TOPICS = [
  { id: "flags", name: "Country flags", unit: "flags", set: "countries", kind: "flag", regions: WORLD_REGIONS, terr: true,
    styles: ["choice", "type", "reverse"], ask: "Which country is this?", find: "Find the flag of", typeHolder: "Type the country",
    nameHint: "Type every country you can think of. Short names like USA, UK and Ivory Coast work too.", groups: true },
  { id: "capitals", name: "Country capitals", unit: "capitals", set: "countries", kind: "capital", regions: WORLD_REGIONS, terr: true,
    styles: ["choice", "type"], ask: "What's the capital?", typeHolder: "Type the capital",
    nameHint: "Type every capital city you can think of." },
  { id: "state-flags", name: "US state flags", unit: "state flags", set: "states", kind: "flag", regions: US_REGIONS, terr: false,
    styles: ["choice", "type", "reverse"], ask: "Which state is this?", find: "Find the flag of", typeHolder: "Type the state",
    nameHint: "Type every state you can think of." },
  { id: "state-capitals", name: "US state capitals", unit: "state capitals", set: "states", kind: "capital", regions: US_REGIONS, terr: false,
    styles: ["choice", "type"], ask: "What's the capital?", typeHolder: "Type the capital",
    nameHint: "Type every state capital you can think of." }
];
const TOPIC = Object.fromEntries(TOPICS.map(t => [t.id, t]));
const MODES = ["practice", "quiz", "name-all", "browse"];
const SETS = {
  countries: { data: "data/countries.json", images: "data/flags.json", map: "data/world-map.json", rows: null, img: {}, loading: null },
  states: { data: "data/states.json", images: "data/state-flags.json", map: "data/us-map.json", rows: null, img: {}, loading: null }
};

/* ---------- country flag look-alikes ---------- */
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
const groupsOf = {};
GROUPS.forEach(g => g.codes.forEach(k => (groupsOf[k] = groupsOf[k] || []).push(g)));

/* ---------- text matching ---------- */
function norm(s) {
  return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/&/g, " and ").replace(/\bsaint\b/g, "st").replace(/\bst\./g, "st")
    .replace(/[^a-z0-9 ]/g, " ").replace(/\b(the|of|and)\b/g, " ").replace(/\s+/g, " ").trim();
}
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

/* ---------- storage ---------- */
const SKEY = "geography-gym-settings";
let settings = { topic: "flags", sound: false, per: {} };
try {
  const raw = localStorage.getItem(SKEY);
  if (raw) settings = Object.assign(settings, JSON.parse(raw));
  else {
    // carry over settings saved by the flags-only version
    const old = JSON.parse(localStorage.getItem("geography-gym-flags-v1") || localStorage.getItem("flag-atlas-v1") || "null");
    if (old) { settings.sound = !!old.sound; settings.per.flags = { style: old.style, region: old.region, terr: old.terr }; }
  }
} catch (e) {}
if (!TOPIC[settings.topic]) settings.topic = "flags";
function saveSettings() { try { localStorage.setItem(SKEY, JSON.stringify(settings)); } catch (e) {} }
function prefs(def) {
  const p = settings.per[def.id] || (settings.per[def.id] = {});
  if (!def.styles.includes(p.style)) p.style = "choice";
  if (!def.regions.includes(p.region)) p.region = "All";
  p.terr = def.terr && !!p.terr;
  return p;
}
function loadProgress(id) {
  let s = { p: {}, best: {} };
  try {
    const raw = localStorage.getItem(`geography-gym-${id}-v1`) || (id === "flags" ? localStorage.getItem("flag-atlas-v1") : null);
    if (raw) { const o = JSON.parse(raw); s = { p: o.p || {}, best: o.best || {} }; }
  } catch (e) {}
  return s;
}

/* ---------- active topic ---------- */
let T = null; // { def, items, byId, alias, img, prog, pref }
function buildTopic(def) {
  const set = SETS[def.set];
  const items = set.rows.filter(r => def.kind === "flag" || r.cap).map(r => {
    const where = r.sr || r.r;
    if (def.kind === "flag") return { id: r.c, ans: r.n, alts: r.a, label: r.n, r: r.r, sr: where, k: r.k, cap: r.cap, fact: [r.cap && `Capital: ${r.cap}`, where].filter(Boolean).join(" · ") };
    const alts = r.caps.slice(1);
    if (/ City$/.test(r.cap)) alts.push(r.cap.slice(0, -5));
    return { id: r.c, ans: r.cap, alts, label: r.n, r: r.r, sr: where, k: r.k, fact: `Capital of ${r.n} · ${where}` };
  });
  const alias = new Map();
  items.forEach(it => [it.ans, ...it.alts].forEach(a => { const k = norm(a); if (!k) return; if (!alias.has(k)) alias.set(k, new Set()); alias.get(k).add(it.id); }));
  return { def, items, byId: Object.fromEntries(items.map(i => [i.id, i])), alias, img: set.img, prog: loadProgress(def.id), pref: prefs(def) };
}
function saveProgress() { try { localStorage.setItem(`geography-gym-${T.def.id}-v1`, JSON.stringify(T.prog)); } catch (e) {} }
function rec(id) { return T.prog.p[id] || (T.prog.p[id] = { b: 0, s: 0, r: 0 }); }
function status(id) { const r = T.prog.p[id]; if (!r || !r.s) return "new"; return r.b >= 3 ? "mastered" : "learning"; }
function grade(id, ok) {
  const r = rec(id);
  if (ok) r.b = r.s === 0 ? 2 : Math.min(5, r.b + 1); else r.b = 0;
  r.s++; if (ok) r.r++;
  saveProgress(); updateMeter();
}
const kindOk = it => T.pref.terr || it.k !== "territory";
const pool = () => T.items.filter(it => kindOk(it) && (T.pref.region === "All" || it.r === T.pref.region));
const poolKey = () => T.pref.region + (T.pref.terr ? "+t" : "");

function judgeTyped(input, target) {
  const q = norm(input);
  if (!q) return null;
  if ([target.ans, ...target.alts].some(a => norm(a) === q)) return { ok: true, picked: target.id };
  const exact = T.alias.get(q);
  if (exact) {
    const id = [...exact][0];
    if (T.def.id === "flags" && TWINS[target.id] === id) return { ok: true, picked: id, twin: true };
    return { ok: false, picked: id };
  }
  let bestD = Infinity, bestIds = null, tie = false;
  for (const [k, ids] of T.alias) {
    if (Math.abs(k.length - q.length) > 2) continue;
    const d = lev(q, k);
    if (d < bestD) { bestD = d; bestIds = ids; tie = false; }
    else if (d === bestD && ids !== bestIds) tie = true;
  }
  const tol = q.length >= 9 ? 2 : q.length >= 5 ? 1 : 0;
  if (bestIds && bestD <= tol && !tie) {
    const ok = bestIds.has(target.id);
    return { ok, picked: ok ? target.id : [...bestIds][0], typo: true };
  }
  return { ok: false, picked: null };
}

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const pick = a => a[Math.floor(Math.random() * a.length)];
const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const img = (id, alt = "") => `<img class="flag" src="${T.img[id]}" alt="${esc(alt)}" draggable="false">`;
const minis = ids => `<div class="minis">${ids.filter(k => T.byId[k]).map(k => `<figure>${img(k, "Flag of " + T.byId[k].label)}<figcaption>${esc(T.byId[k].label)}</figcaption></figure>`).join("")}</div>`;

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
  if (!settings.sound) return;
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
  try { localStorage.setItem("geography-gym-theme", next); } catch (e) {}
  applyThemeLabel();
});
applyThemeLabel();

/* ---------- popovers: topic menu + settings panel ---------- */
const menu = $("#menu"), menuBtn = $("#menuBtn"), setPanel = $("#setPanel"), setBtn = $("#setBtn");
const POPS = [[menuBtn, menu], [setBtn, setPanel]];
const anyOpen = () => POPS.some(([, p]) => !p.hidden);
function setPop(btn, open) {
  POPS.forEach(([b, p]) => { const o = b === btn && open; p.hidden = !o; b.setAttribute("aria-expanded", o); });
}
POPS.forEach(([b, p]) => b.addEventListener("click", e => { e.stopPropagation(); setPop(b, p.hidden); }));
document.addEventListener("click", e => { if (anyOpen() && !POPS.some(([b, p]) => p.contains(e.target) || b.contains(e.target))) setPop(null, false); });
document.addEventListener("keydown", e => {
  if (e.key !== "Escape" || !anyOpen()) return;
  const open = POPS.find(([, p]) => !p.hidden); setPop(null, false); open[0].focus();
});
menu.addEventListener("click", e => { if (e.target.closest("a[href^='#']")) setPop(null, false); });

const CHECK = `<svg class="chk" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;
$("#topicList").innerHTML = TOPICS.map(t => `<a href="#${t.id}-practice" data-topic="${t.id}">${esc(t.name)}${CHECK}</a>`).join("");

function renderSettings() {
  const def = T.def, p = T.pref;
  $("#menuLabel").textContent = def.name;
  document.querySelectorAll("#topicList a").forEach(a => {
    a.href = `#${a.dataset.topic}-${state.view}`;
    if (a.dataset.topic === def.id) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
  });
  document.querySelectorAll("#modeNav a").forEach(a => { a.href = `#${def.id}-${a.dataset.view}`; });
  $("#setTopic").textContent = `for ${def.name}`;
  $("#regionSel").innerHTML = def.regions.map(r => {
    const n = T.items.filter(it => kindOk(it) && (r === "All" || it.r === r)).length;
    const label = r === "All" ? (def.set === "states" ? "All 50 states" : "Whole world") : r;
    return `<option value="${r}"${r === p.region ? " selected" : ""}>${label} (${n})</option>`;
  }).join("");
  $("#terrRow").hidden = !def.terr;
  $("#terrToggle").checked = p.terr;
  $("#soundToggle").checked = settings.sound;
  $("#styleSeg").querySelectorAll("[data-style]").forEach(b => {
    b.hidden = !def.styles.includes(b.dataset.style);
    b.setAttribute("aria-pressed", b.dataset.style === p.style);
  });
}
$("#regionSel").addEventListener("change", e => { if (!T) return; T.pref.region = e.target.value; saveSettings(); settingsChanged(); });
$("#terrToggle").addEventListener("change", e => { if (!T) return; T.pref.terr = e.target.checked; saveSettings(); settingsChanged(); });
$("#soundToggle").addEventListener("change", e => { settings.sound = e.target.checked; saveSettings(); });
$("#styleSeg").addEventListener("click", e => {
  const b = e.target.closest("[data-style]"); if (!T || !b || b.dataset.style === T.pref.style) return;
  T.pref.style = b.dataset.style; saveSettings(); renderSettings();
  practice.restyle(); quiz.reset();
  if (state.view === "practice" || state.view === "quiz") VIEWS[state.view].show();
});
function settingsChanged() {
  renderSettings(); updateMeter();
  practice.reset(); quiz.reset(); nameAll.reset(); browse.render();
  VIEWS[state.view].show();
}

let resetArmed = null;
$("#resetBtn").addEventListener("click", e => {
  e.stopPropagation();
  if (!T) return;
  const b = e.currentTarget;
  if (!resetArmed) { b.textContent = `Click again to erase your ${T.def.name} progress`; resetArmed = setTimeout(() => { resetArmed = null; b.textContent = "Reset progress"; }, 3500); return; }
  clearTimeout(resetArmed); resetArmed = null;
  T.prog = { p: {}, best: {} }; saveProgress();
  b.textContent = "Progress erased"; setTimeout(() => b.textContent = "Reset progress", 2000);
  settingsChanged();
});

function updateMeter() {
  const P = pool(); let m = 0;
  P.forEach(it => { if (status(it.id) === "mastered") m++; });
  $("#meterNum").textContent = m; $("#meterTot").textContent = P.length; $("#meterUnit").textContent = T.def.unit;
  $("#meterFill").style.width = (100 * m / Math.max(1, P.length)) + "%";
}

/* ---------- answer map ---------- */
const MAPS = {}; // set name -> { data, svg, hits: [], rings: [], loading }
const SVGNS = "http://www.w3.org/2000/svg";
function loadMap(setName) {
  const m = MAPS[setName] || (MAPS[setName] = { data: null, svg: null, hits: [], loading: null });
  if (!m.loading) m.loading = fetch(SETS[setName].map).then(r => { if (!r.ok) throw new Error("map"); return r.json(); }).then(data => {
    m.data = data;
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("class", "map-svg");
    svg.setAttribute("viewBox", data.vb.join(" "));
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("aria-hidden", "true");
    const g = document.createElementNS(SVGNS, "g");
    m.byCode = {};
    for (const sh of data.shapes) {
      const path = document.createElementNS(SVGNS, "path");
      path.setAttribute("d", sh.d);
      if (sh.c) (m.byCode[sh.c] = m.byCode[sh.c] || []).push(path);
      g.appendChild(path);
    }
    svg.appendChild(g);
    m.rings = ["ring hit", "ring miss"].map(cls => { const c = document.createElementNS(SVGNS, "circle"); c.setAttribute("class", cls); c.style.display = "none"; svg.appendChild(c); return c; });
    m.svg = svg;
    return m;
  }).catch(e => { m.loading = null; throw e; });
  return m.loading;
}
// Pick a view that shows the answer (and the wrong pick, if any) with some context around it.
function frameFor(data, ids, aspect) {
  const boxes = ids.map(id => data.info[id]).filter(Boolean).map(i => i.b);
  if (!boxes.length) return data.vb.slice();
  let x0 = Math.min(...boxes.map(b => b[0])), y0 = Math.min(...boxes.map(b => b[1]));
  let x1 = Math.max(...boxes.map(b => b[2])), y1 = Math.max(...boxes.map(b => b[3]));
  const [vx, vy, vw, vh] = data.vb;
  let w = (x1 - x0) * 1.8, h = (y1 - y0) * 1.8;
  const minW = vw * (data.vb[2] === 1000 ? 0.16 : 0.32);
  w = Math.max(w, minW); h = Math.max(h, minW / aspect);
  if (w / h < aspect) w = h * aspect; else h = w / aspect;
  if (w > vw) { w = vw; h = w / aspect; }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  let x = cx - w / 2, y = cy - h / 2;
  x = Math.min(Math.max(x, vx), vx + vw - w);
  y = Math.min(Math.max(y, vy - h * 0.1), vy + vh - h * 0.9);
  return [x, y, w, h];
}
async function showMap(container, targetId, pickedId) {
  const setName = T.def.set;
  let m;
  try { m = await loadMap(setName); } catch (e) { container.remove(); return; }
  if (!container.isConnected) return;
  const { data, svg } = m;
  m.hits.forEach(p => p.classList.remove("hit", "miss")); m.hits = [];
  const mark = (id, cls) => (m.byCode[id] || []).forEach(p => { p.classList.add(cls); m.hits.push(p); p.parentNode.appendChild(p); });
  if (pickedId) mark(pickedId, "miss");
  mark(targetId, "hit");
  container.appendChild(svg);
  const aspect = container.clientWidth / Math.max(1, container.clientHeight) || 2.5;
  const ids = pickedId ? [targetId, pickedId] : [targetId];
  const to = frameFor(data, ids, aspect);
  // Small places (islands, microstates) get a ring so they can be spotted.
  [[targetId, 0], [pickedId, 1]].forEach(([id, i]) => {
    const ring = m.rings[i], info = id && data.info[id];
    const b = info && info.b, small = b && (b[2] - b[0] < to[2] * 0.04 && b[3] - b[1] < to[3] * 0.04);
    ring.style.display = small ? "" : "none";
    if (small) { ring.setAttribute("cx", info.p[0]); ring.setAttribute("cy", info.p[1]); ring.setAttribute("r", to[2] * 0.035); svg.appendChild(ring); }
  });
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const from = [to[0] - to[2], to[1] - to[3], to[2] * 3, to[3] * 3];
  if (reduce) { svg.setAttribute("viewBox", to.join(" ")); return; }
  const t0 = performance.now(), dur = 650;
  const step = now => {
    if (!container.isConnected) return;
    const t = Math.min(1, (now - t0) / dur), e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    svg.setAttribute("viewBox", from.map((v, i) => v + (to[i] - v) * e).join(" "));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- question engine ---------- */
function distractors(target, n) {
  const ex = new Set([target.id]); if (T.def.id === "flags" && TWINS[target.id]) ex.add(TWINS[target.id]);
  const answers = new Set([norm(target.ans)]);
  const out = [];
  const add = (arr, cap) => {
    let k = 0;
    for (const x of shuffle(arr)) {
      if (out.length >= n || k >= cap) break;
      if (ex.has(x.id) || !kindOk(x) || answers.has(norm(x.ans))) continue;
      out.push(x); k++; ex.add(x.id); answers.add(norm(x.ans));
      if (T.def.id === "flags" && TWINS[x.id]) ex.add(TWINS[x.id]);
    }
  };
  if (T.def.groups) add((groupsOf[target.id] || []).flatMap(g => g.codes).map(k => T.byId[k]).filter(Boolean), 2);
  add(T.items.filter(x => x.sr === target.sr), 2);
  add(T.items.filter(x => x.r === target.r), 3);
  add(T.items, 3);
  return out;
}
function makeQuestion(item, style) {
  const q = { it: item, style };
  if (style !== "type") q.options = shuffle([item, ...distractors(item, 3)]);
  return q;
}

/* Draws one question into host. top: optional HTML above the prompt. below: text under the answers before answering. */
function renderQuestion(host, q, { top = "", below = "", onAnswer, onNext, nextLabel = "Next" }) {
  const it = q.it, def = T.def;
  let answered = false;
  let h = top;
  if (q.style === "reverse") {
    h += `<p class="prompt" style="margin-top:0">${esc(def.find)}</p><div class="qname">${esc(it.ans)}</div>
      <div class="flag-answers">${q.options.map((o, i) => `<button type="button" class="flag-answer" data-id="${o.id}" aria-label="Option ${i + 1}">${img(o.id)}<span class="cap"></span></button>`).join("")}</div>`;
  } else {
    if (def.kind === "flag") h += `<div class="qflag">${img(it.id, "Mystery flag")}</div><p class="prompt">${esc(def.ask)}</p>`;
    else h += `<div class="qflag small">${img(it.id, "Flag of " + it.label)}</div><div class="qname">${esc(it.label)}</div><p class="prompt" style="margin-top:0">${esc(def.ask)}</p>`;
    if (q.style === "choice") {
      h += `<div class="answers">${q.options.map(o => `<button type="button" class="answer" data-id="${o.id}">${esc(o.ans)}</button>`).join("")}</div>`;
    } else {
      h += `<form class="type-row" autocomplete="off"><input id="typeIn" type="text" placeholder="${esc(def.typeHolder)}" aria-label="${esc(def.typeHolder)}" autocapitalize="off" spellcheck="false"><button class="btn primary" type="submit">Check</button><button class="btn" type="button" data-skip>Skip</button></form>`;
    }
  }
  h += `<div class="below">${below}</div>`;
  host.innerHTML = h;
  const belowEl = host.querySelector(".below");

  function finish(ok, picked, note) {
    if (answered) return; answered = true;
    host.querySelectorAll("[data-id]").forEach(b => {
      b.disabled = true;
      if (b.dataset.id === it.id) b.classList.add("right");
      else if (b.dataset.id === picked) b.classList.add("wrong");
      else if (q.style === "choice") b.classList.add("dim");
      const cap = b.querySelector(".cap"); if (cap) cap.textContent = T.byId[b.dataset.id].ans;
    });
    const inp = host.querySelector("#typeIn");
    if (inp) { inp.disabled = true; inp.classList.add(ok ? "right" : "wrong"); host.querySelectorAll(".type-row button").forEach(b => b.disabled = true); }
    sfx(ok);
    const p = picked && picked !== it.id ? T.byId[picked] : null;
    let r = `<div class="result">`;
    r += ok ? `<div class="result-line good">Correct, it's ${esc(it.ans)}.</div>`
            : `<div class="result-line bad">It's ${esc(it.ans)}.${p ? ` You picked ${esc(p.ans)}.` : ""}</div>`;
    r += `<div class="result-sub">${esc(it.fact)}${it.k === "territory" ? " · Territory" : ""}</div>`;
    if (note) r += `<div class="result-sub">${esc(note)}</div>`;
    if (!ok && p && def.kind === "capital") r += `<div class="result-sub">${esc(p.ans)} is the capital of ${esc(p.label)}.</div>`;
    r += `<figure class="map" data-map><figcaption class="map-key">${p ? `<span><i class="k hit"></i>${esc(it.label)}</span><span><i class="k miss"></i>${esc(p.label)} (your pick)</span>` : `<span><i class="k hit"></i>${esc(it.label)}</span>`}</figcaption></figure>`;
    if (!ok && def.kind === "flag") {
      const gs = def.groups ? (groupsOf[it.id] || []) : [];
      const g = (p && gs.find(x => x.codes.includes(p.id))) || gs[0];
      if (g) r += `<div class="tip"><b>${esc(g.t)}.</b>${minis(g.codes)}${esc(g.tip)}</div>`;
      else if (p) r += `<div class="tip"><b>Side by side</b>${minis([it.id, p.id])}</div>`;
    }
    r += `<button type="button" class="btn primary" data-next>${nextLabel}</button><span class="kbd-hint">or press <span class="kbd">Enter</span></span></div>`;
    belowEl.outerHTML = r;
    showMap(host.querySelector("[data-map]"), it.id, p ? p.id : null);
    onAnswer(ok, picked);
    const nb = host.querySelector("[data-next]");
    nb.addEventListener("click", onNext);
    nb.focus({ preventScroll: true });
  }

  host.querySelectorAll("[data-id]").forEach(b => b.addEventListener("click", () => finish(b.dataset.id === it.id, b.dataset.id)));
  const form = host.querySelector("form.type-row");
  if (form) {
    const inp = form.querySelector("input");
    setTimeout(() => inp.focus({ preventScroll: true }), 30);
    form.addEventListener("submit", e => {
      e.preventDefault();
      const r = judgeTyped(inp.value, it); if (!r) return;
      let note = "";
      if (r.ok && r.twin) note = `${T.byId[r.picked].ans} has an identical flag, so that counts.`;
      else if (r.ok && r.typo) note = `Accepted "${inp.value.trim()}" as a typo.`;
      else if (!r.ok && !r.picked) note = `"${inp.value.trim()}" didn't match any answer.`;
      finish(r.ok, r.ok ? it.id : r.picked, note);
    });
    form.querySelector("[data-skip]").addEventListener("click", () => finish(false, null, ""));
  }
  return {
    key(e) {
      if (anyOpen()) return;
      if (e.target.tagName === "INPUT" && !answered) return;
      if (!answered && /^[1-4]$/.test(e.key) && q.options) {
        const b = host.querySelectorAll("[data-id]")[+e.key - 1]; if (b) { b.click(); e.preventDefault(); }
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
    const ok = P.filter(it => !avoid.has(it.id));
    const unseen = ok.filter(it => status(it.id) === "new");
    const seen = ok.filter(it => status(it.id) !== "new");
    const learning = seen.filter(it => status(it.id) === "learning");
    if (unseen.length && (learning.length < 6 || Math.random() < 0.15 || !seen.length)) return pick(unseen);
    const W = [12, 7, 4, 1.2, 0.6, 0.3];
    const ws = seen.map(it => W[rec(it.id).b] || 0.3);
    let t = Math.random() * ws.reduce((a, b) => a + b, 0);
    for (let i = 0; i < seen.length; i++) { t -= ws[i]; if (t <= 0) return seen[i]; }
    return seen[seen.length - 1] || pick(P);
  }
  function ask(it) {
    current = it; done = false;
    ctl = renderQuestion(host(), makeQuestion(it, T.pref.style), {
      below: streak ? `Streak ${streak}` : "",
      onAnswer(ok) { done = true; grade(it.id, ok); streak = ok ? streak + 1 : 0; },
      onNext: next
    });
  }
  function next() { const it = choose(); recent.push(it.id); if (recent.length > 8) recent.shift(); ask(it); }
  return {
    reset() { recent = []; current = null; streak = 0; },
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
    const where = T.pref.region === "All" ? (T.def.set === "states" ? "all 50 states" : "the whole world") : T.pref.region;
    host().innerHTML = `<div class="setup">
      <div><h1>${esc(T.def.name)} quiz</h1><p>From ${esc(where)}. You can change this in settings.</p></div>
      <div class="field"><span id="lenLbl">How many</span><div class="seg" role="group" aria-labelledby="lenLbl" id="qLen">${lens.map(n => `<button type="button" data-len="${n}" aria-pressed="${n === len}">${n === P.length ? `All ${n}` : n}</button>`).join("")}</div></div>
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
    const it = run.items[run.i], last = run.i === run.items.length - 1;
    const top = `<div class="qtop"><span>${run.i + 1} / ${run.items.length}</span><span class="qtrack"><span style="width:${100 * run.i / run.items.length}%"></span></span><span id="qTime">${fmtTime((Date.now() - run.t0) / 1000)}</span></div>`;
    ctl = renderQuestion(host(), makeQuestion(it, T.pref.style), {
      top, below: `${run.score} correct so far`,
      nextLabel: last ? "See results" : "Next",
      onAnswer(ok, picked) {
        grade(it.id, ok);
        if (ok) run.score++; else run.misses.push({ id: it.id, p: picked });
        host().querySelector(".qtrack span").style.width = (100 * (run.i + 1) / run.items.length) + "%";
      },
      onNext() { run.i++; ask(); }
    });
  }
  function results() {
    stopTimer(); ctl = null;
    const secs = (Date.now() - run.t0) / 1000, total = run.items.length, pct = Math.round(100 * run.score / total);
    const cap = T.def.kind === "capital";
    host().innerHTML = `<div class="setup">
      <div class="score">${run.score}<small> / ${total}</small></div>
      <p>${pct}% correct in ${fmtTime(secs)}</p>
      ${run.misses.length ? `<button class="btn primary" type="button" id="qRetry">Retry the ${run.misses.length} you missed</button>` : ""}
      <button class="btn${run.misses.length ? "" : " primary"}" type="button" id="qAgain" style="width:100%">New quiz</button>
    </div>
    ${run.misses.length ? `<div class="misses">${run.misses.map(m => { const it = T.byId[m.id]; return `<figure>${img(m.id, "Flag of " + it.label)}<figcaption>${cap ? `${esc(it.ans)} <span class="of">(${esc(it.label)})</span>` : esc(it.ans)}<small>${m.p ? "you said " + esc(T.byId[m.p].ans) : "skipped"}</small></figcaption></figure>`; }).join("")}</div>` : ""}`;
    const missed = run.misses.map(m => T.byId[m.id]);
    $("#qAgain").addEventListener("click", setup);
    const r = $("#qRetry"); if (r) r.addEventListener("click", () => start(shuffle(missed)));
  }
  return {
    reset() { run = null; stopTimer(); setup(); },
    show() { if (!run && !host().querySelector(".setup")) setup(); },
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
    const order = {}; T.def.regions.slice(1).forEach(r => order[r] = shuffle(P.filter(it => it.r === r)));
    g = { P, order, found: new Set(), t0: null, done: false, gave: false, ids: new Set(P.map(it => it.id)) };
    input.value = ""; input.disabled = false;
    input.placeholder = T.def.typeHolder;
    $("#naTotal").textContent = P.length; $("#naFound").textContent = 0; $("#naTime").textContent = "0:00";
    $("#naGiveUp").disabled = false;
    render(); banner();
  }
  function render() {
    let h = "";
    for (const r of T.def.regions.slice(1)) {
      const list = g.order[r]; if (!list.length) continue;
      const f = list.filter(it => g.found.has(it.id)).length;
      h += `<div class="region-h"><h2>${r}</h2><span data-rc="${r}">${f} / ${list.length}</span></div><div class="grid">${list.map(tileHTML).join("")}</div>`;
    }
    $("#naBoard").innerHTML = h;
  }
  function tileHTML(it) {
    const found = g.found.has(it.id), missed = g.gave && !found, shown = found || missed;
    const cap = T.def.kind === "capital";
    return `<div class="tile ${found ? "found" : missed ? "missed" : ""}" data-tile="${it.id}">${img(it.id, cap || shown ? "Flag of " + it.label : "Unnamed flag")}${cap ? `<div class="tile-of">${esc(it.label)}</div>` : ""}<div class="lab">${shown ? esc(it.ans) : "?"}</div></div>`;
  }
  function banner(msg, good) {
    const best = T.prog.best[poolKey()];
    $("#naBanner").innerHTML = msg ? `<div class="banner ${good ? "good" : ""}">${msg}</div>`
      : `<p class="na-hint">${esc(T.def.nameHint)} The timer starts with your first letter.${best ? ` Your best: ${fmtTime(best)}.` : ""}</p>`;
  }
  function accept(ids) {
    clearTimeout(pending); pending = null;
    const fresh = [...ids].filter(id => !g.found.has(id) && g.ids.has(id));
    if (g.done || !fresh.length) return;
    sfx(true);
    for (const id of fresh) {
      g.found.add(id); grade(id, true);
      const el = document.querySelector(`[data-tile="${id}"]`); if (el) el.outerHTML = tileHTML(T.byId[id]);
      const r = T.byId[id].r, list = g.order[r];
      const rc = document.querySelector(`[data-rc="${CSS.escape(r)}"]`); if (rc) rc.textContent = `${list.filter(it => g.found.has(it.id)).length} / ${list.length}`;
    }
    $("#naFound").textContent = g.found.size;
    input.value = ""; input.classList.add("flash"); setTimeout(() => input.classList.remove("flash"), 250);
    if (g.found.size === g.P.length) finish(false);
  }
  function finish(gave) {
    g.done = true; g.gave = gave; if (timer) clearInterval(timer); timer = null;
    const secs = g.t0 ? (Date.now() - g.t0) / 1000 : 0;
    input.disabled = true; $("#naGiveUp").disabled = true;
    if (gave) {
      g.P.forEach(it => { if (!g.found.has(it.id)) grade(it.id, false); });
      render();
      banner(`You named ${g.found.size} of ${g.P.length} in ${fmtTime(secs)}. The ones in red will come up first in Practice.`);
    } else {
      const k = poolKey(), prev = T.prog.best[k];
      const isBest = !prev || secs < prev; if (isBest) { T.prog.best[k] = Math.round(secs); saveProgress(); }
      banner(`All ${g.P.length} named in ${fmtTime(secs)}.${isBest ? " That's your best time." : ` Your best is ${fmtTime(prev)}.`}`, true);
    }
  }
  input.addEventListener("input", () => {
    if (g.done) return;
    if (!g.t0) { g.t0 = Date.now(); timer = setInterval(() => $("#naTime").textContent = fmtTime((Date.now() - g.t0) / 1000), 500); }
    clearTimeout(pending); pending = null;
    const q = norm(input.value); if (!q) return;
    const ids = T.alias.get(q);
    if (!ids || ![...ids].some(id => !g.found.has(id) && g.ids.has(id))) return;
    // Wait a moment if this is also the start of another answer still to find (Niger → Nigeria).
    let prefix = false;
    for (const [k, other] of T.alias) {
      if (k.length > q.length && k.startsWith(q) && [...other].some(id => !ids.has(id) && !g.found.has(id) && g.ids.has(id))) { prefix = true; break; }
    }
    if (prefix) pending = setTimeout(() => accept(ids), 1100); else accept(ids);
  });
  input.addEventListener("keydown", e => { if (e.key === "Enter") { const ids = T.alias.get(norm(input.value)); if (ids) accept(ids); } });
  $("#naGiveUp").addEventListener("click", () => { if (!g.done) finish(true); });
  $("#naRestart").addEventListener("click", () => { reset(); input.focus(); });
  return { reset, show() { if (!g) reset(); setTimeout(() => input.focus({ preventScroll: true }), 30); }, key() {} };
})();

/* ---------- BROWSE ---------- */
const browse = (() => {
  let tab = "all";
  const body = () => $("#browseBody");
  function render() {
    if (!T) return;
    const cap = T.def.kind === "capital";
    if (!T.def.groups) tab = "all";
    $("#brTabs").hidden = !T.def.groups;
    const qs = norm($("#brSearch").value || "");
    const hide = $("#brHide").checked;
    $("#brAll").setAttribute("aria-pressed", tab === "all"); $("#brLook").setAttribute("aria-pressed", tab === "look");
    if (tab === "all") {
      const list = pool().filter(it => !qs || [it.label, it.ans, it.cap || "", ...it.alts].some(a => norm(a).includes(qs)));
      list.sort((a, b) => a.label.localeCompare(b.label));
      body().innerHTML = list.length ? `<div class="cards">${list.map(it => {
        const s = status(it.id);
        const title = cap ? it.label : it.ans, sub = cap ? it.ans : (it.cap || "");
        return `<button type="button" class="card ${hide ? "hidden" : ""} ${cap ? "cap" : ""}" data-card="${it.id}" aria-label="${hide ? "Hidden answer, click to reveal" : esc(title)}">${img(it.id, hide && !cap ? "" : "Flag of " + it.label)}<span class="nm"><span class="dot ${s}" title="${s}"></span><span>${esc(title)}</span></span><span class="sub">${esc(sub || "–")}</span></button>`;
      }).join("")}</div>` : `<div class="empty">Nothing matches "${esc($("#brSearch").value)}".</div>`;
    } else {
      const gs = GROUPS.filter(g => !qs || g.codes.some(k => T.byId[k] && norm(T.byId[k].label).includes(qs)) || norm(g.t).includes(qs));
      body().innerHTML = `<div class="groups">${gs.map(g => `<div class="group"><h3>${esc(g.t)}</h3>${minis(g.codes)}<p>${esc(g.tip)}</p></div>`).join("")}</div>`;
    }
  }
  body().addEventListener("click", e => { const c = e.target.closest(".card.hidden"); if (c) { c.classList.remove("hidden"); c.setAttribute("aria-label", T.byId[c.dataset.card].ans); } });
  $("#brSearch").addEventListener("input", render);
  $("#brHide").addEventListener("change", render);
  $("#brAll").addEventListener("click", () => { tab = "all"; render(); });
  $("#brLook").addEventListener("click", () => { tab = "look"; render(); });
  return { render, show: render, reset() {}, key() {} };
})();

/* ---------- routing ---------- */
const VIEWS = { practice, quiz, "name-all": nameAll, browse };
const state = { view: "practice" };
function parseHash() {
  const h = location.hash.slice(1);
  for (const t of [...TOPICS].sort((a, b) => b.id.length - a.id.length)) {
    if (h.startsWith(t.id + "-")) { const m = h.slice(t.id.length + 1); if (MODES.includes(m)) return { topic: t.id, mode: m }; }
  }
  if (MODES.includes(h)) return { topic: settings.topic, mode: h };
  return { topic: settings.topic, mode: "practice" };
}
function loadSet(name) {
  const s = SETS[name];
  if (s.rows) return Promise.resolve();
  if (!s.loading) s.loading = Promise.all([fetch(s.data), fetch(s.images)]).then(async ([d, i]) => {
    if (!d.ok || !i.ok) throw new Error("load");
    s.rows = await d.json();
    (await i.json()).forEach(f => { s.img[f.c] = URL.createObjectURL(new Blob([f.s], { type: "image/svg+xml" })); });
  }).catch(err => { s.loading = null; throw err; });
  return s.loading;
}
let routeToken = 0;
async function route() {
  const { topic, mode } = parseHash();
  const token = ++routeToken;
  if (!T || T.def.id !== topic) {
    document.querySelectorAll(".view").forEach(s => s.hidden = true);
    $("#loading").hidden = false; $("#loading").textContent = "Loading…";
    try { await loadSet(TOPIC[topic].set); }
    catch (e) { $("#loading").textContent = "This topic didn't load. Refresh the page to try again."; return; }
    if (token !== routeToken) return;
    settings.topic = topic; saveSettings();
    T = buildTopic(TOPIC[topic]);
    state.view = mode;
    renderSettings(); updateMeter();
    practice.reset(); quiz.reset(); nameAll.reset();
    setTimeout(() => loadMap(TOPIC[topic].set).catch(() => {}), 1200);
  }
  $("#loading").hidden = true;
  state.view = mode;
  document.querySelectorAll(".view").forEach(s => s.hidden = s.id !== "view-" + mode);
  document.querySelectorAll("#modeNav a").forEach(a => { if (a.dataset.view === mode) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  renderSettings();
  document.title = `${T.def.name} · Geography Gym`;
  VIEWS[mode].show();
}
addEventListener("hashchange", route);
document.addEventListener("keydown", e => { if (T) { const v = VIEWS[state.view]; if (v) v.key(e); } });
route();
