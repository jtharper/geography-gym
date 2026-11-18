/* Geography Gym: one quiz engine shared by every topic. No build step: edit and deploy. */
"use strict";
// Bump with every deploy that changes data or code, so browsers never mix old and new files (index.html uses the same value).
const VERSION = "202611181618";
const vurl = u => u + "?v=" + VERSION;

/* ---------- topics ----------
   kind: flag      flag image → name (also "pick the flag")
         fact      flag + name → a fact (capital, currency, language, domain, phone code)
         text      a word or code → name (capital → country, "OH" → Ohio)
         shape     outline → name
         locate    name → click it on the map
         neighbors country → pick a country that borders it
         compare   two places → which is bigger / has more people
*/
const WORLD_REGIONS = ["All", "Africa", "Asia", "Europe", "North America", "South America", "Oceania"];
const US_REGIONS = ["All", "Northeast", "Midwest", "South", "West"];
const ALL_MODES = ["practice", "quiz", "name-all", "browse"];
const PQB = ["practice", "quiz", "browse"];
const ONE_REGION = ["All"];
const TOPICS = [
  { id: "flags", group: "World", name: "Country flags", unit: "flags", set: "countries", kind: "flag", regions: WORLD_REGIONS, terr: true,
    styles: ["choice", "type", "reverse"], ask: "Which country is this?", find: "Find the flag of", typeHolder: "Type the country",
    nameHint: "Type every country you can think of. Short names like USA, UK and Ivory Coast work too.", groups: true },
  { id: "capitals", group: "World", name: "Country capitals", unit: "capitals", set: "countries", kind: "fact", field: "cap", regions: WORLD_REGIONS, terr: true,
    styles: ["choice", "type"], ask: "What's the capital?", typeHolder: "Type the capital", nameHint: "Type every capital city you can think of." },
  { id: "capitals-rev", group: "World", name: "Capitals → country", unit: "capitals", set: "countries", kind: "text", field: "cap", regions: WORLD_REGIONS, terr: true,
    styles: ["choice", "type"], ask: "Which country's capital is this?", typeHolder: "Type the country", modes: PQB },
  { id: "map", group: "World", name: "Find it on the map", unit: "countries", set: "countries", kind: "locate", regions: WORLD_REGIONS, terr: true,
    styles: ["map"], ask: "Find", modes: ["practice", "quiz"] },
  { id: "shapes", group: "World", name: "Country shapes", unit: "shapes", set: "countries", kind: "shape", regions: WORLD_REGIONS, terr: true,
    styles: ["choice", "type"], ask: "Which country has this shape?", typeHolder: "Type the country", nameHint: "Name every country from its outline." },
  { id: "neighbors", group: "World", name: "Neighbors", unit: "countries", set: "countries", kind: "neighbors", regions: WORLD_REGIONS, terr: false,
    styles: ["choice", "type"], ask: "Which country borders it?", typeHolder: "Type any country that borders it", modes: PQB },
  { id: "area", group: "World", name: "Bigger or smaller", set: "countries", kind: "compare", field: "area", regions: WORLD_REGIONS, terr: false,
    styles: ["pair"], ask: "Which country is bigger?", verb: "is bigger", modes: PQB },
  { id: "population", group: "World", name: "More or fewer people", set: "countries", kind: "compare", field: "pop", regions: WORLD_REGIONS, terr: false,
    styles: ["pair"], ask: "Which country has more people?", verb: "has more people", modes: PQB },
  { id: "landlocked", group: "World", name: "Landlocked countries", unit: "landlocked countries", set: "countries", kind: "odd", field: "ll", regions: WORLD_REGIONS, terr: false,
    styles: ["choice"], ask: "Which of these countries is landlocked?", nameHint: "Type every landlocked country you can think of." },

  { id: "currencies", group: "Trivia", name: "Currencies", unit: "currencies", set: "countries", kind: "fact", field: "cur", multi: true, regions: WORLD_REGIONS, terr: false,
    styles: ["choice", "type"], ask: "Which currency is used here?", typeHolder: "Type the currency", modes: PQB, mapPick: false },
  { id: "languages", group: "Trivia", name: "Languages", unit: "countries", set: "countries", kind: "fact", field: "lang", multi: true, regions: WORLD_REGIONS, terr: false,
    styles: ["choice", "type"], ask: "Which language is official here?", typeHolder: "Type an official language", modes: PQB, mapPick: false },
  { id: "domains", group: "Trivia", name: "Internet domains", unit: "domains", set: "countries", kind: "fact", field: "tld", regions: WORLD_REGIONS, terr: true,
    styles: ["choice", "type"], ask: "What's its internet domain?", typeHolder: "Type the domain, like .fr", modes: PQB },
  { id: "phone", group: "Trivia", name: "Phone codes", unit: "codes", set: "countries", kind: "fact", field: "ph", regions: WORLD_REGIONS, terr: false,
    styles: ["choice", "type"], ask: "What's its phone code?", typeHolder: "Type the code, like +33", modes: PQB, mapPick: false },
  { id: "demonyms", group: "Trivia", name: "Demonyms", unit: "demonyms", set: "countries", kind: "fact", field: "dem", altField: "dems", regions: WORLD_REGIONS, terr: false,
    styles: ["choice", "type"], ask: "What do you call someone from here?", typeHolder: "Type the word, like French", modes: PQB },
  { id: "continents", group: "Trivia", name: "Which continent?", unit: "countries", set: "countries", kind: "fact", field: "r", altField: "conta", regions: ONE_REGION, terr: false, repeatAnswers: true,
    styles: ["choice", "type"], ask: "Which continent is it in?", typeHolder: "Type the continent", modes: PQB, mapPick: false },
  { id: "driving", group: "Trivia", name: "Driving side", unit: "countries", set: "countries", kind: "fact", field: "drive", regions: WORLD_REGIONS, terr: true, repeatAnswers: true,
    styles: ["choice"], ask: "Which side of the road do they drive on?", modes: PQB, mapPick: false },
  { id: "landmarks", group: "Trivia", name: "Famous landmarks", unit: "landmarks", set: "trivia", kind: "text", field: "n", types: ["landmark"], photos: true, regions: WORLD_REGIONS, terr: false,
    styles: ["choice", "type"], ask: "Which country is it in?", typeHolder: "Type the country", modes: PQB },
  { id: "former", group: "Trivia", name: "Former names", unit: "former names", set: "trivia", kind: "text", field: "n", types: ["former-country", "former-city"], regions: WORLD_REGIONS, terr: false,
    styles: ["choice", "type"], ask: "What's it called now?", typeHolder: "Type today's name", modes: PQB },

  { id: "lakes", group: "Nature", name: "Lakes", unit: "lakes", set: "nature", kind: "feature", type: "lake", regions: WORLD_REGIONS, terr: false,
    styles: ["choice", "type"], ask: "Which lake is highlighted?", typeHolder: "Type the lake", modes: PQB },
  { id: "rivers", group: "Nature", name: "Rivers", unit: "rivers", set: "nature", kind: "feature", type: "river", regions: WORLD_REGIONS, terr: false,
    styles: ["choice", "type"], ask: "Which river is highlighted?", typeHolder: "Type the river", modes: PQB },
  { id: "ranges", group: "Nature", name: "Mountain ranges", unit: "ranges", set: "nature", kind: "feature", type: "range", regions: WORLD_REGIONS, terr: false,
    styles: ["choice", "type"], ask: "Which mountain range is highlighted?", typeHolder: "Type the mountain range", modes: PQB },
  { id: "peaks", group: "Nature", name: "Mountain peaks", unit: "peaks", set: "nature", kind: "feature", type: "peak", regions: WORLD_REGIONS, terr: false,
    styles: ["choice", "type"], ask: "Which mountain is marked?", typeHolder: "Type the mountain", modes: PQB },
  { id: "seas", group: "Nature", name: "Seas and straits", unit: "seas and straits", set: "nature", kind: "feature", type: "sea", regions: WORLD_REGIONS, terr: false,
    styles: ["choice", "type"], ask: "Which sea or strait is highlighted?", typeHolder: "Type the sea, gulf or strait", modes: PQB },

  { id: "state-flags", group: "United States", name: "State flags", unit: "state flags", set: "states", kind: "flag", regions: US_REGIONS, terr: false,
    styles: ["choice", "type", "reverse"], ask: "Which state is this?", find: "Find the flag of", typeHolder: "Type the state", nameHint: "Type every state you can think of." },
  { id: "state-capitals", group: "United States", name: "State capitals", unit: "state capitals", set: "states", kind: "fact", field: "cap", regions: US_REGIONS, terr: false,
    styles: ["choice", "type"], ask: "What's the capital?", typeHolder: "Type the capital", nameHint: "Type every state capital you can think of." },
  { id: "state-map", group: "United States", name: "Find states on the map", unit: "states", set: "states", kind: "locate", regions: US_REGIONS, terr: false,
    styles: ["map"], ask: "Find", modes: ["practice", "quiz"] },
  { id: "state-shapes", group: "United States", name: "State shapes", unit: "shapes", set: "states", kind: "shape", regions: US_REGIONS, terr: false,
    styles: ["choice", "type"], ask: "Which state has this shape?", typeHolder: "Type the state", nameHint: "Name every state from its outline." },
  { id: "state-abbr", group: "United States", name: "State abbreviations", unit: "abbreviations", set: "states", kind: "text", field: "code", regions: US_REGIONS, terr: false,
    styles: ["choice", "type"], ask: "Which state is this?", typeHolder: "Type the state", nameHint: "Type the state for every abbreviation." },
  { id: "state-nicknames", group: "United States", name: "State nicknames", unit: "nicknames", set: "states", kind: "text", field: "nick", regions: US_REGIONS, terr: false,
    styles: ["choice", "type"], ask: "Which state is this?", typeHolder: "Type the state", nameHint: "Type the state for every nickname." }
];
// Provinces and states of other countries: same engine, one set per country
const ONE = ["All"];
const placeTopics = (set, group, adj, one, many, opts) => {
  const base = { group, set, regions: ONE, terr: !!opts.terr, terrOn: !!opts.terr };
  const q = `Which ${one} is this?`, typ = `Type the ${one.split(" ")[0]}`;
  return [
    opts.flags && { ...base, id: `${set}-flags`, short: "Flags", name: `${adj} flags`, unit: "flags", kind: "flag", styles: ["choice", "type", "reverse"],
      ask: q, find: "Find the flag of", typeHolder: typ, nameHint: `Type every ${one} you can think of.` },
    { ...base, id: `${set}-capitals`, short: "Capitals", name: `${adj} capitals`, unit: "capitals", kind: "fact", field: "cap", styles: ["choice", "type"],
      ask: "What's the capital?", typeHolder: "Type the capital", nameHint: `Type every ${one} capital you can think of.` },
    { ...base, id: `${set}-map`, short: "Find on the map", name: `Map of ${group}`, unit: many, kind: "locate", styles: ["map"], ask: "Find", modes: ["practice", "quiz"] },
    { ...base, id: `${set}-shapes`, short: "Shapes", name: `${adj} shapes`, unit: "shapes", kind: "shape", styles: ["choice", "type"],
      ask: `Which ${one} has this shape?`, typeHolder: typ, nameHint: `Name every ${one} from its outline.` },
    opts.abbr && { ...base, id: `${set}-abbr`, short: "Abbreviations", name: `${adj} abbreviations`, unit: "abbreviations", kind: "text", field: "code", styles: ["choice", "type"],
      ask: q, typeHolder: typ, nameHint: "Type the name for every abbreviation." }
  ].filter(Boolean);
};
TOPICS.push(
  ...placeTopics("ca", "Canada", "Canadian", "province or territory", "provinces", { flags: true, abbr: true, terr: true }),
  ...placeTopics("au", "Australia", "Australian", "state or territory", "states", { flags: true, abbr: true, terr: true }),
  ...placeTopics("de", "Germany", "German", "state", "states", { flags: true }),
  ...placeTopics("mx", "Mexico", "Mexican", "state", "states", {})
);
TOPICS.forEach(t => { t.modes = t.modes || ALL_MODES; });
const TOPIC = Object.fromEntries(TOPICS.map(t => [t.id, t]));
const MODES = ["practice", "quiz", "name-all", "browse"];
const MODE_NAMES = { practice: "Practice", quiz: "Quiz", "name-all": "Name them", browse: "Browse" };
const SETS = {
  countries: { data: "data/countries.json", images: "data/flags.json", map: "data/world-map.json", whole: "the whole world" },
  states: { data: "data/states.json", images: "data/state-flags.json", map: "data/us-map.json", whole: "all 50 states" },
  nature: { data: "data/nature.json", images: null, map: "data/world-map.json", whole: "the whole world", needs: ["countries"] },
  trivia: { data: "data/trivia.json", images: null, map: "data/world-map.json", whole: "the whole world", needs: ["countries"] },
  ca: { data: "data/ca.json", images: "data/ca-flags.json", map: "data/ca-map.json", whole: "all of Canada" },
  au: { data: "data/au.json", images: "data/au-flags.json", map: "data/au-map.json", whole: "all of Australia" },
  de: { data: "data/de.json", images: "data/de-flags.json", map: "data/de-map.json", whole: "all of Germany" },
  mx: { data: "data/mx.json", images: null, map: "data/mx-map.json", whole: "all of Mexico" }
};
Object.values(SETS).forEach(s => Object.assign(s, { rows: null, img: {}, loading: null }));
const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);

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
    .replace(/[^a-z0-9+ ]/g, " ").replace(/\b(the|of|and)\b/g, " ").replace(/\s+/g, " ").trim();
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
    const old = JSON.parse(localStorage.getItem("geography-gym-flags-v1") || localStorage.getItem("flag-atlas-v1") || "null");
    if (old) { settings.sound = !!old.sound; settings.per.flags = { style: old.style, region: old.region, terr: old.terr }; }
  }
} catch (e) {}
if (!TOPIC[settings.topic]) settings.topic = "flags";
function saveSettings() { try { localStorage.setItem(SKEY, JSON.stringify(settings)); } catch (e) {} }
function prefs(def) {
  const p = settings.per[def.id] || (settings.per[def.id] = {});
  if (!def.styles.includes(p.style)) p.style = def.styles[0];
  if (!def.regions.includes(p.region)) p.region = "All";
  p.terr = def.terr && (p.terr === undefined ? !!def.terrOn : !!p.terr);
  return p;
}
function loadProgress(id) {
  let s = { p: {}, best: {} };
  try {
    const raw = localStorage.getItem(`geography-gym-${id}-v1`) || (id === "flags" ? localStorage.getItem("flag-atlas-v1") : null);
    if (raw) { const o = JSON.parse(raw); s = { p: o.p || {}, best: o.best || {}, n: o.n || 0 }; }
  } catch (e) {}
  return s;
}

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const pick = a => a[Math.floor(Math.random() * a.length)];
const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const fmtTenths = s => `${Math.floor(s / 60)}:${(Math.floor(s % 60 * 10) / 10).toFixed(1).padStart(4, "0")}`;
const listJoin = a => a.length <= 1 ? (a[0] || "") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
function fmtVal(field, v) {
  if (v == null) return "–";
  if (field === "area") return (v < 10 ? v.toLocaleString("en-US", { maximumFractionDigits: 2 }) : Math.round(v).toLocaleString("en-US")) + " km²";
  if (v >= 1e9) return (v / 1e9).toFixed(2) + " billion";
  if (v >= 1e6) return (v / 1e6).toFixed(1) + " million";
  return Math.round(v).toLocaleString("en-US");
}

/* ---------- active topic ---------- */
let T = null; // { def, items, byId, alias, img, prog, pref }
const countryName = c => { const r = SETS.countries.rows && SETS.countries.rows.find(x => x.c === c); return r ? r.n : c; };
function shapeInfo(def, id) {
  const m = mapOf(def.set); const info = m && m.data && m.data.info[id];
  return info && (m.data.markers || []).indexOf(id) < 0 ? info : null;
}
function buildTopic(def) {
  const set = SETS[def.set];
  const where = r => r.sr || r.r;
  let rows = set.rows;
  if (def.kind === "fact" || def.kind === "text") rows = rows.filter(r => def.field === "code" || (Array.isArray(r[def.field]) ? r[def.field].length : r[def.field]));
  if (def.kind === "compare") rows = rows.filter(r => r[def.field] != null && r[def.field] > 0);
  if (def.kind === "neighbors") rows = rows.filter(r => r.nb && r.nb.length);
  if (def.kind === "shape") rows = rows.filter(r => { const i = shapeInfo(def, r.c); return i && Math.max(i.b[2] - i.b[0], i.b[3] - i.b[1]) >= 1.5; });
  if (def.kind === "locate") rows = rows.filter(r => { const m = mapOf(def.set); return m && m.data && m.data.info[r.c]; });
  if (def.kind === "feature") rows = rows.filter(r => r.t === def.type);
  if (def.types) rows = rows.filter(r => def.types.includes(r.t));
  if (def.kind === "odd") rows = rows.filter(r => r[def.field]);
  const items = rows.map(r => {
    const base = { id: r.c, label: r.n, r: r.r, sr: where(r), k: r.k, cap: r.cap, row: r };
    switch (def.kind) {
      case "fact": {
        if (def.field === "cap") {
          const alts = r.caps.slice(1); if (/ City$/.test(r.cap)) alts.push(r.cap.slice(0, -5));
          return { ...base, ans: r.cap, alts, fact: `Capital of ${r.n} · ${where(r)}` };
        }
        if (def.multi) { const vals = r[def.field]; return { ...base, ans: vals.join(" / "), alts: vals, vals, fact: `${r.n} · ${where(r)}` }; }
        const v = r[def.field];
        const alts = def.field === "tld" ? [v.replace(/^\./, "")] : def.field === "ph" ? [v.replace(/^\+/, "")] : def.altField ? (r[def.altField] || []) : [];
        const fact = def.field === "dem" ? `Someone from ${r.n} is ${v}${alts.length ? ` (also ${alts.join(", ")})` : ""}`
          : def.field === "drive" ? `${r.n} drives on the ${v.toLowerCase()} · ${where(r)}`
          : def.field === "r" ? `${r.n} is in ${v}${alts.length ? ` (and partly in ${alts.join(", ")})` : ""} · ${r.sr}` : `${r.n} · ${where(r)}`;
        return { ...base, ans: v, alts, fact };
      }
      case "text": {
        if (def.set === "trivia") {
          const city = r.t === "former-city", lm = r.t === "landmark";
          const fact = lm ? `${r.n} is in ${r.ans} · ${where(r)}` : `${r.n} is now ${r.ans}${r.y ? `, renamed in ${r.y}` : ""} · ${city ? countryName(r.cc) : where(r)}`;
          return { ...base, cap: null, q: r.n, ans: r.ans, alts: r.a || [], mid: r.cc, fact,
            ask: lm ? null : city ? "What's this city called now?" : "What's this country called now?" };
        }
        const q = def.field === "code" ? r.c : r[def.field];
        const fact = def.field === "code" ? `${r.c} is ${r.n}` : def.field === "nick" ? `${r.n} is the ${q.replace(/^The /, "")}` : `${r.cap} is the capital of ${r.n}`;
        return { ...base, q, ans: r.n, alts: r.a || [], fact: `${fact} · ${where(r)}` };
      }
      case "neighbors": return { ...base, ans: r.n, alts: r.a || [], nb: r.nb, fact: `${r.n} · ${where(r)}` };
      case "compare": return { ...base, ans: r.n, alts: r.a || [], val: r[def.field], fact: where(r) };
      case "feature": {
        const names = r.cc.map(countryName), shown = names.slice(0, 5).concat(names.length > 5 ? [`${names.length - 5} more`] : []);
        const verb = r.t === "river" ? "Flows through" : r.t === "lake" ? (names.length > 1 ? "Shared by" : "In") : r.t === "peak" ? (names.length > 1 ? "On the border of" : "In") : "Runs through";
        const fact = r.t === "peak" ? `${fmtElev(r.el)} · ${verb} ${listJoin(shown)}` : r.t === "sea" ? `${r.st === "strait" ? "Strait or channel" : "Sea, gulf or bay"} · ${r.r}` : names.length ? `${verb} ${listJoin(shown)}` : r.r;
        return { ...base, ans: r.n, alts: r.a || [], sr: r.r, feat: r, fact };
      }
      case "odd": return { ...base, ans: r.n, alts: r.a || [], fact: `${r.n} has no coastline · ${where(r)}` };
      default: return { ...base, ans: r.n, alts: r.a || [], fact: [r.cap && `Capital: ${r.cap}`, where(r)].filter(Boolean).join(" · ") };
    }
  });
  const alias = new Map();
  items.forEach(it => [it.ans, ...it.alts].forEach(a => { const k = norm(a); if (!k) return; if (!alias.has(k)) alias.set(k, new Set()); alias.get(k).add(it.id); }));
  // Neighbors: names of every country (neighbors may be outside the item list, e.g. islands have none)
  if (def.kind === "neighbors") set.rows.forEach(r => [r.n, ...(r.a || [])].forEach(a => { const k = norm(a); if (!alias.has(k)) alias.set(k, new Set()); alias.get(k).add(r.c); }));
  const byId = Object.fromEntries(items.map(i => [i.id, i]));
  const rowById = Object.fromEntries(set.rows.map(r => [r.c, r]));
  const prog = loadProgress(def.id), pref = prefs(def);
  // Remember how many items this topic has, for the stats page
  const n = items.filter(it => pref.terr || it.k !== "territory").length;
  if (prog.n !== n) { prog.n = n; if (Object.keys(prog.p).length) try { localStorage.setItem(`geography-gym-${def.id}-v1`, JSON.stringify(prog)); } catch (e) {} }
  // Odd one out (landlocked): the wrong choices come from countries that aren't
  const others = def.kind === "odd" ? set.rows.filter(r => !r[def.field] && r.k === "country").map(r => ({ id: r.c, label: r.n, ans: r.n, alts: r.a || [], r: r.r, sr: where(r), k: r.k, row: r })) : [];
  return { def, items, byId, rowById, alias, img: set.img, prog, pref, others };
}
function saveProgress() { try { localStorage.setItem(`geography-gym-${T.def.id}-v1`, JSON.stringify(T.prog)); } catch (e) {} }
function rec(id) { return T.prog.p[id] || (T.prog.p[id] = { b: 0, s: 0, r: 0 }); }
function status(id) { const r = T.prog.p[id]; if (!r || !r.s) return "new"; return r.b >= 3 ? "mastered" : "learning"; }
function grade(id, ok) {
  const r = rec(id);
  if (ok) r.b = r.s === 0 ? 2 : Math.min(5, r.b + 1); else r.b = 0;
  r.s++; if (ok) r.r++; r.t = Date.now();
  saveProgress(); updateMeter();
}
const kindOk = it => T.pref.terr || it.k !== "territory";
const pool = () => T.items.filter(it => kindOk(it) && (T.pref.region === "All" || it.r === T.pref.region));
const poolKey = () => T.pref.region + (T.pref.terr ? "+t" : "");
const fmtElev = m => `${m.toLocaleString("en-US")} m (${Math.round(m * 3.28084).toLocaleString("en-US")} ft)`;
const nameOf = id => (T.rowById[id] && T.rowById[id].n) || (T.byId[id] && T.byId[id].label) || countryName(id);

function judgeTyped(input, q) {
  const target = q.it, qn = norm(input);
  if (!qn) return null;
  if (T.def.kind !== "neighbors" && [target.ans, ...target.alts].some(a => norm(a) === qn)) return { ok: true, picked: target.id };
  const exact = T.alias.get(qn);
  if (exact) {
    for (const id of exact) if (q.ok.has(id)) return { ok: true, picked: id };
    const id = [...exact][0];
    if (T.def.id === "flags" && TWINS[target.id] === id) return { ok: true, picked: id, twin: true };
    return { ok: false, picked: id };
  }
  let bestD = Infinity, bestIds = null, tie = false;
  for (const [k, ids] of T.alias) {
    if (Math.abs(k.length - qn.length) > 2) continue;
    const d = lev(qn, k);
    if (d < bestD) { bestD = d; bestIds = ids; tie = false; }
    else if (d === bestD && ids !== bestIds) tie = true;
  }
  const tol = qn.length >= 9 ? 2 : qn.length >= 5 ? 1 : 0;
  if (bestIds && bestD <= tol && !tie) {
    const hit = [...bestIds].find(id => q.ok.has(id));
    return hit ? { ok: true, picked: hit, typo: true } : { ok: false, picked: [...bestIds][0], typo: true };
  }
  return { ok: false, picked: null };
}

/* ---------- visuals ---------- */
const img = (id, alt = "") => T.img[id] ? `<img class="flag" src="${T.img[id]}" alt="${esc(alt)}" draggable="false">` : `<div class="flag noflag" aria-hidden="true"></div>`;
const minis = ids => `<div class="minis">${ids.filter(k => T.byId[k] || T.rowById[k]).map(k => `<figure>${img(k, "Flag of " + nameOf(k))}<figcaption>${esc(nameOf(k))}</figcaption></figure>`).join("")}</div>`;
function shapeSVG(id, cls = "shape") {
  const m = mapOf(T.def.set), info = m.data.info[id];
  const [x0, y0, x1, y1] = info.b, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  let w = (x1 - x0) * 1.12, h = (y1 - y0) * 1.12;
  if (w / h < 4 / 3) w = h * 4 / 3; else h = w * 3 / 4;
  const d = (m.dByCode[id] || []).join(" ");
  return `<svg class="${cls}" viewBox="${(cx - w / 2).toFixed(1)} ${(cy - h / 2).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}" role="img" aria-label="Outline"><path d="${d}"/></svg>`;
}
const textTile = (t, cls = "qtext") => `<div class="${cls}">${esc(t)}</div>`;

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
/* ---------- looks (palette button) ---------- */
const LOOKS = [
  { id: "clean", name: "Clean", theme: "light", sw: ["#f6f7f9", "#2f6bff", "#d3d9e1", "#15171c"] },
  { id: "clean-dark", name: "Clean dark", theme: "dark", sw: ["#0f1115", "#7aa2ff", "#2b313b", "#eef0f3"] },
  { id: "pop", name: "Pop", skin: "pop", theme: "light", sw: ["#fff4dc", "#ff4f8b", "#ffd23f", "#9fd8ff"] },
  { id: "arcade", name: "Arcade", skin: "arcade", theme: "dark", sw: ["#0b0820", "#22e4ff", "#ff3cac", "#2e2470"] },
  { id: "explorer", name: "Explorer", skin: "explorer", theme: "light", sw: ["#efe3c8", "#b9532c", "#b2cfc6", "#3f6b2a"] },
  { id: "tropical", name: "Tropical", skin: "tropical", theme: "light", sw: ["#dff6f3", "#ff6b4a", "#74d3e6", "#ffe3a3"] },
  { id: "chalk", name: "Chalkboard", skin: "chalk", theme: "dark", sw: ["#1f3a30", "#ffd95e", "#f4f1e8", "#3a6252"] }
];
const LOOK_FONT = { pop: "Bricolage Grotesque", arcade: "Silkscreen", explorer: "Fraunces", tropical: "Fredoka", chalk: "Patrick Hand" };
const currentLook = () => { const r = document.documentElement.dataset; return r.skin || (r.theme === "dark" ? "clean-dark" : "clean"); };
function setLook(id) {
  const L = LOOKS.find(l => l.id === id) || LOOKS[0], r = document.documentElement;
  if (L.skin) r.dataset.skin = L.skin; else delete r.dataset.skin;
  r.dataset.theme = L.theme;
  try { localStorage.setItem("geography-gym-look", L.id); localStorage.setItem("geography-gym-theme", L.theme); } catch (e) {}
  renderLooks();
}
function renderLooks() {
  const cur = currentLook();
  $("#looks").innerHTML = LOOKS.map(l => `<button type="button" class="look-btn" data-look="${l.id}" aria-pressed="${l.id === cur}"${LOOK_FONT[l.id] ? ` style="font-family:'${LOOK_FONT[l.id]}',var(--font)"` : ""}>
    <span class="look-sw" style="background:${l.sw[0]}">${l.sw.slice(1).map(c => `<i style="background:${c}"></i>`).join("")}</span>${esc(l.name)}</button>`).join("");
}
$("#looks").addEventListener("click", e => { const b = e.target.closest("[data-look]"); if (b) setLook(b.dataset.look); });
renderLooks();

/* ---------- popovers: topic menu + settings panel ---------- */
const menu = $("#menu"), menuBtn = $("#menuBtn"), setPanel = $("#setPanel"), setBtn = $("#setBtn");
const POPS = [[menuBtn, menu], [setBtn, setPanel], [$("#themeBtn"), $("#lookPanel")]];
const anyOpen = () => POPS.some(([, p]) => !p.hidden);
function setPop(btn, open) {
  POPS.forEach(([b, p]) => { const o = b === btn && open; p.hidden = !o; b.setAttribute("aria-expanded", o); });
}
POPS.forEach(([b, p]) => b.addEventListener("click", e => {
  e.stopPropagation();
  if (p === menu && p.hidden) showMenuGroup(special ? SPECIAL_GROUP : T ? T.def.group : GROUP_NAMES[0]);
  setPop(b, p.hidden);
}));
document.addEventListener("click", e => { if (anyOpen() && !POPS.some(([b, p]) => p.contains(e.target) || b.contains(e.target))) setPop(null, false); });
document.addEventListener("keydown", e => {
  if (e.key !== "Escape" || !anyOpen()) return;
  const open = POPS.find(([, p]) => !p.hidden); setPop(null, false); open[0].focus();
});
menu.addEventListener("click", e => { if (e.target.closest("a[href^='#']")) setPop(null, false); });

const CHECK = `<svg class="chk" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;
// Topic menu: a row of group tabs, then the topics of one group (keeps the list short)
const GROUP_NAMES = [...new Set(TOPICS.map(t => t.group)), "Daily & stats"];
let menuGroup = GROUP_NAMES[0];
function renderTopicMenu() {
  $("#menuTabs").innerHTML = GROUP_NAMES.map(g => `<button type="button" role="tab" data-group="${esc(g)}" aria-selected="${g === menuGroup}">${esc(g)}</button>`).join("");
  $("#topicList").innerHTML = TOPICS.map(t => `<a href="#${t.id}-practice" data-topic="${t.id}" data-group="${esc(t.group)}"${t.group === menuGroup ? "" : " hidden"}>${esc(t.short || t.name)}${CHECK}</a>`).join("") +
    SPECIALS.map(x => `<a href="#${x.id}" data-special="${x.id}" data-group="${SPECIAL_GROUP}"${menuGroup === SPECIAL_GROUP ? "" : " hidden"}>${esc(x.name)}${CHECK}</a>`).join("");
  if (T) syncTopicLinks();
}
function showMenuGroup(g) {
  menuGroup = g;
  $("#menuTabs").querySelectorAll("button").forEach(b => b.setAttribute("aria-selected", b.dataset.group === g));
  $("#topicList").querySelectorAll("a").forEach(a => { a.hidden = a.dataset.group !== g; });
}
$("#menuTabs").addEventListener("click", e => { const b = e.target.closest("[data-group]"); if (b) showMenuGroup(b.dataset.group); });

function syncTopicLinks() {
  document.querySelectorAll("#topicList a").forEach(a => {
    if (a.dataset.special) { if (a.dataset.special === special) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); return; }
    const t = TOPIC[a.dataset.topic];
    a.href = `#${t.id}-${t.modes.includes(state.view) ? state.view : "practice"}`;
    if (T && !special && t.id === T.def.id) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
  });
}
function renderSettings() {
  const def = T.def, p = T.pref;
  $("#menuLabel").textContent = def.name;
  syncTopicLinks();
  document.querySelectorAll("#modeNav a").forEach(a => { a.href = `#${def.id}-${a.dataset.view}`; a.hidden = !def.modes.includes(a.dataset.view); });
  $("#setTopic").textContent = `for ${def.name}`;
  $("#regionSel").innerHTML = def.regions.map(r => {
    const n = T.items.filter(it => kindOk(it) && (r === "All" || it.r === r)).length;
    const label = r === "All" ? cap1(SETS[def.set].whole) : r;
    return `<option value="${r}"${r === p.region ? " selected" : ""}>${label} (${n})</option>`;
  }).join("");
  $("#regionSel").parentElement.hidden = def.regions.length < 2;
  $("#terrRow").hidden = !def.terr;
  $("#terrToggle").checked = p.terr;
  $("#soundToggle").checked = settings.sound;
  $("#styleSeg").parentElement.hidden = def.styles.length < 2;
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
  if (special) return specialMeter();
  $("#meterFill").parentElement.hidden = false;
  if (T.def.kind === "compare") {
    const best = T.prog.best.streak || 0;
    $("#meterText").innerHTML = `Best streak <b>${best}</b>`;
    $("#meterFill").style.width = Math.min(100, best * 5) + "%";
    return;
  }
  const all = T.items.filter(kindOk).length;
  if (T.prog.n !== all) { T.prog.n = all; saveProgress(); } // shown on the stats page
  const P = pool(); let m = 0;
  P.forEach(it => { if (status(it.id) === "mastered") m++; });
  $("#meterText").innerHTML = `<b>${m}</b> of ${P.length} ${esc(T.def.unit)} learned`;
  $("#meterFill").style.width = (100 * m / Math.max(1, P.length)) + "%";
}

/* ---------- map (zoom, pan, hover names, click to answer) ---------- */
const MAPS = {}; // map file -> { data, svg, byCode, dByCode, dots, rings, overlay, loading }
const SVGNS = "http://www.w3.org/2000/svg";
const mapOf = setName => MAPS[SETS[setName].map];
function loadMap(setName) {
  const url = SETS[setName].map;
  const m = MAPS[url] || (MAPS[url] = { data: null, svg: null, marks: [], loading: null });
  if (!m.loading) m.loading = fetch(vurl(url)).then(r => { if (!r.ok) throw new Error("map"); return r.json(); }).then(data => {
    m.data = data;
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("class", "map-svg");
    svg.setAttribute("viewBox", data.vb.join(" "));
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("aria-hidden", "true");
    const g = document.createElementNS(SVGNS, "g");
    m.byCode = {}; m.dByCode = {};
    for (const sh of data.shapes) {
      const path = document.createElementNS(SVGNS, "path");
      path.setAttribute("d", sh.d);
      if (sh.c) { path.dataset.c = sh.c; (m.byCode[sh.c] = m.byCode[sh.c] || []).push(path); (m.dByCode[sh.c] = m.dByCode[sh.c] || []).push(sh.d); }
      g.appendChild(path);
    }
    svg.appendChild(g);
    // Highlighted lake, river or mountain range
    m.overlays = [0, 1].map(() => { const o = document.createElementNS(SVGNS, "path"); svg.appendChild(o); return o; });
    // Clickable dots for places too small to click (shown only in "find it on the map")
    const dg = document.createElementNS(SVGNS, "g"); dg.setAttribute("class", "dots");
    m.dots = [];
    const tinyW = data.vb[2] * 0.004;
    for (const [code, info] of Object.entries(data.info)) {
      const b = info.b;
      if (b[2] - b[0] > tinyW || b[3] - b[1] > tinyW) continue;
      const c = document.createElementNS(SVGNS, "circle");
      c.setAttribute("cx", info.p[0]); c.setAttribute("cy", info.p[1]); c.dataset.c = code; c.setAttribute("class", "dot");
      dg.appendChild(c); m.dots.push(c); (m.byCode[code] = m.byCode[code] || []).push(c);
    }
    svg.appendChild(dg);
    m.rings = ["ring hit", "ring miss"].map(cls => { const c = document.createElementNS(SVGNS, "circle"); c.setAttribute("class", cls); c.style.display = "none"; svg.appendChild(c); return c; });
    m.svg = svg;
    return m;
  }).catch(e => { m.loading = null; throw e; });
  return m.loading;
}
function frameFor(data, ids, aspect, padK = 1.8) {
  return frameBoxes(data, ids.map(id => data.info[id]).filter(Boolean).map(i => i.b), aspect, padK);
}
function frameBoxes(data, boxes, aspect, padK = 1.8, minFrac) {
  if (!boxes.length) return fullFrame(data, aspect);
  const x0 = Math.min(...boxes.map(b => b[0])), y0 = Math.min(...boxes.map(b => b[1]));
  const x1 = Math.max(...boxes.map(b => b[2])), y1 = Math.max(...boxes.map(b => b[3]));
  const [vx, vy, vw, vh] = data.vb;
  let w = (x1 - x0) * padK, h = (y1 - y0) * padK;
  const minW = vw * (minFrac || (vw === 1000 ? 0.16 : 0.32));
  w = Math.max(w, minW); h = Math.max(h, minW / aspect);
  if (w / h < aspect) w = h * aspect; else h = w / aspect;
  if (w > vw) { w = vw; h = w / aspect; }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  let x = cx - w / 2, y = cy - h / 2;
  x = Math.min(Math.max(x, vx), vx + vw - w);
  y = Math.min(Math.max(y, vy - h * 0.1), vy + vh - h * 0.9);
  return [x, y, w, h];
}
function fullFrame(data, aspect) {
  let [x, y, w, h] = data.vb;
  if (w / h < aspect) { const nw = h * aspect; x -= (nw - w) / 2; w = nw; } else { const nh = w / aspect; y -= (nh - h) / 2; h = nh; }
  return [x, y, w, h];
}
const MAP_CONTROLS = `<div class="map-ctrl" role="group" aria-label="Map zoom">
  <button type="button" data-z="in" aria-label="Zoom in"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
  <button type="button" data-z="out" aria-label="Zoom out"><svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button>
  <button type="button" data-z="fit" aria-label="Back to the answer"><svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>
</div><div class="map-tip" hidden></div>`;

/* Puts the shared map into a container and returns a controller:
   ctl.mark({hit, hit2, miss}), ctl.focus(ids), ctl.pick = fn(code) to answer by clicking, ctl.tips = show names on hover. */
async function mountMap(container, { pick = null, tips = true, dots = false } = {}) {
  let m;
  try { m = await loadMap(T.def.set); } catch (e) { container.remove(); return null; }
  if (!container.isConnected) return null;
  const { data, svg } = m;
  m.marks.forEach(el => el.classList.remove("hit", "hit2", "miss")); m.marks = [];
  m.overlays.forEach(o => o.removeAttribute("d"));
  svg.classList.toggle("show-dots", dots);
  container.insertBefore(svg, container.firstChild);
  const aspect = () => container.clientWidth / Math.max(1, container.clientHeight) || 2;
  const fullW = data.vb[2];
  let vb = data.vb.slice(), anim = 0, ringIds = [null, null], ringFeats = [null, null], disposed = false;
  const ctl = { pick, tips, fit: null };
  // The map element is shared: stop whatever the previous question's map was doing
  if (m.ctl) m.ctl.dispose();
  m.ctl = ctl;
  ctl.dispose = () => { disposed = true; cancelAnimationFrame(anim); };
  const setVB = v => {
    if (disposed) return;
    vb = v;
    svg.setAttribute("viewBox", v.join(" "));
    const r = v[2] * 0.006;
    if (dots) m.dots.forEach(c => c.setAttribute("r", r));
    [0, 1].forEach(i => {
      const ring = m.rings[i], info = ringFeats[i] || (ringIds[i] && data.info[ringIds[i]]), b = info && info.b;
      const small = b && (b[2] - b[0] < v[2] * 0.04 && b[3] - b[1] < v[3] * 0.04);
      ring.style.display = small ? "" : "none";
      if (small) { ring.setAttribute("cx", info.p[0]); ring.setAttribute("cy", info.p[1]); ring.setAttribute("r", v[2] * 0.035); svg.appendChild(ring); }
      // Peaks and point features: a marker that keeps its size on screen
      const f = ringFeats[i];
      if (f && !f.d) {
        const [x, y] = f.p, k = v[2] * 0.012;
        m.overlays[i].setAttribute("d", f.t === "peak" ? `M${x} ${y - k}L${x + k * 0.95} ${y + k * 0.7}L${x - k * 0.95} ${y + k * 0.7}Z` : `M${x - k * 0.7} ${y}a${k * 0.7} ${k * 0.7} 0 1 0 ${k * 1.4} 0a${k * 0.7} ${k * 0.7} 0 1 0 ${-k * 1.4} 0`);
      }
    });
  };
  const animateTo = (to, dur = 450) => {
    cancelAnimationFrame(anim);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return setVB(to);
    const from = vb.slice(), t0 = performance.now();
    const step = now => {
      const t = Math.min(1, (now - t0) / dur), e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setVB(from.map((v, i) => v + (to[i] - v) * e));
      if (t < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  };
  const zoomAt = (k, fx = 0.5, fy = 0.5, smooth = false) => {
    const w = Math.min(fullW * 1.3, Math.max(fullW * 0.012, vb[2] * k)), h = w / (vb[2] / vb[3]);
    const px = vb[0] + fx * vb[2], py = vb[1] + fy * vb[3];
    const next = [px - fx * w, py - fy * h, w, h];
    smooth ? animateTo(next, 250) : (cancelAnimationFrame(anim), setVB(next));
  };
  // Starting view: the selected region, or the whole map
  const regionIds = T.pref.region === "All" ? [] : pool().map(it => it.id).filter(id => { const b = data.info[id] && data.info[id].b; return b && b[2] - b[0] < fullW * 0.3; });
  ctl.fit = regionIds.length ? frameFor(data, regionIds, aspect(), 1.15) : fullFrame(data, aspect());
  setVB(ctl.fit);

  ctl.mark = ({ hit = [], hit2 = [], miss = [] }) => {
    m.marks.forEach(el => el.classList.remove("hit", "hit2", "miss")); m.marks = [];
    const add = (id, cls) => (m.byCode[id] || []).forEach(el => { el.classList.add(cls); m.marks.push(el); if (el.tagName === "path") el.parentNode.appendChild(el); });
    hit2.forEach(id => add(id, "hit2")); miss.forEach(id => add(id, "miss")); hit.forEach(id => add(id, "hit"));
    ringIds = [hit[0] || null, miss[0] || null];
    setVB(vb);
  };
  ctl.overlay = (feat, i = 0) => { ringFeats[i] = feat; const o = m.overlays[i]; if (feat.d) o.setAttribute("d", feat.d); setVB(vb); o.setAttribute("class", `feat ${feat.t}${i ? " miss" : ""}`); svg.insertBefore(o, svg.querySelector(".dots")); };
  ctl.focusBox = (b, padK, minFrac, fly = true) => ctl.focusFrame(frameBoxes(data, [b], aspect(), padK, minFrac), fly);
  ctl.focus = (ids, fly = true) => ctl.focusFrame(frameFor(data, ids, aspect()), fly);
  ctl.focusFrame = (f, fly = true) => {
    ctl.fit = f;
    if (fly && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const wide = [f[0] - f[2], f[1] - f[3], f[2] * 3, f[3] * 3];
      if (vb[2] < wide[2]) setVB(wide);
      animateTo(f, 650);
    } else animateTo(f);
  };

  container.querySelector(".map-ctrl").addEventListener("click", e => {
    const bt = e.target.closest("[data-z]"); if (!bt) return;
    if (bt.dataset.z === "in") zoomAt(1 / 1.6, .5, .5, true);
    else if (bt.dataset.z === "out") zoomAt(1.6, .5, .5, true);
    else animateTo(ctl.fit);
  });
  const rel = e => { const r = svg.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
  container.addEventListener("wheel", e => { e.preventDefault(); const [fx, fy] = rel(e); zoomAt(Math.exp(e.deltaY * 0.0015), fx, fy); }, { passive: false });
  const pts = new Map(); let pinch0 = 0, moved = 0, downAt = null;
  container.addEventListener("pointerdown", e => {
    if (e.target.closest(".map-ctrl")) return;
    container.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
    cancelAnimationFrame(anim); container.classList.add("dragging");
    if (pts.size === 1) { moved = 0; downAt = [e.clientX, e.clientY]; }
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); moved = 99; }
  });
  container.addEventListener("pointermove", e => {
    const tip = container.querySelector(".map-tip");
    if (!pts.has(e.pointerId)) {
      const el = e.target.closest && e.target.closest("[data-c]");
      const name = el && ctl.tips && nameOf(el.dataset.c);
      if (name && e.pointerType === "mouse") {
        const r = container.getBoundingClientRect();
        tip.textContent = name; tip.hidden = false;
        tip.style.left = (e.clientX - r.left + 12) + "px"; tip.style.top = (e.clientY - r.top + 12) + "px";
      } else tip.hidden = true;
      return;
    }
    tip.hidden = true;
    const prev = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (downAt) moved = Math.max(moved, Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]));
    const r = svg.getBoundingClientRect();
    if (pts.size === 1) {
      const scale = Math.max(vb[2] / r.width, vb[3] / r.height);
      setVB([vb[0] - (e.clientX - prev[0]) * scale, vb[1] - (e.clientY - prev[1]) * scale, vb[2], vb[3]]);
    } else if (pts.size === 2 && pinch0) {
      const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const fx = ((a[0] + b[0]) / 2 - r.left) / r.width, fy = ((a[1] + b[1]) / 2 - r.top) / r.height;
      zoomAt(pinch0 / d, fx, fy); pinch0 = d;
    }
  });
  const up = e => {
    const wasTap = pts.size === 1 && pts.has(e.pointerId) && moved < 6;
    pts.delete(e.pointerId); if (pts.size < 2) pinch0 = 0; if (!pts.size) container.classList.remove("dragging");
    if (wasTap && ctl.pick && e.type === "pointerup") {
      const el = document.elementsFromPoint(e.clientX, e.clientY).map(x => x.closest && x.closest("[data-c]")).find(Boolean);
      if (el) ctl.pick(el.dataset.c);
    }
  };
  container.addEventListener("pointerup", up); container.addEventListener("pointercancel", up);
  container.addEventListener("pointerleave", () => { const tip = container.querySelector(".map-tip"); if (tip) tip.hidden = true; });
  return ctl;
}

/* ---------- question engine ---------- */
function optLabelFn(target) {
  const def = T.def;
  if (def.multi) {
    const own = new Set(target.vals.map(norm)), first = pick(target.vals);
    return o => o.id === target.id ? first : (o.vals.find(v => !own.has(norm(v))) || null);
  }
  return o => o.ans;
}
function distractors(target, n, label, exclude = new Set(), src = T.items) {
  const ex = new Set([target.id, ...exclude]); if (T.def.id === "flags" && TWINS[target.id]) ex.add(TWINS[target.id]);
  const used = new Set([target.ans, ...target.alts].map(norm));
  if (T.def.multi) target.vals.forEach(v => used.add(norm(v)));
  const out = [];
  const add = (arr, cap) => {
    let k = 0;
    for (const x of shuffle(arr)) {
      if (out.length >= n || k >= cap) break;
      if (ex.has(x.id) || !kindOk(x)) continue;
      if (target.row && x.row && (x.row.t !== target.row.t || x.row.st !== target.row.st)) continue; // same kind: city vs country, sea vs strait
      const l = label(x); if (!l || used.has(norm(l))) continue;
      out.push(x); k++; ex.add(x.id); used.add(norm(l));
      if (T.def.id === "flags" && TWINS[x.id]) ex.add(TWINS[x.id]);
    }
  };
  if (T.def.groups) add((groupsOf[target.id] || []).flatMap(g => g.codes).map(k => T.byId[k]).filter(Boolean), 2);
  add(src.filter(x => x.sr === target.sr), 2);
  add(src.filter(x => x.r === target.r), 3);
  add(src, 3);
  return out;
}
function makeQuestion(it, style) {
  const def = T.def, q = { it, style, ok: new Set([it.id]) };
  if (def.kind === "neighbors") q.ok = new Set(it.nb);
  if (style === "choice" || style === "reverse") {
    let label = optLabelFn(it), opts;
    if (def.kind === "neighbors") {
      const right = pick(it.nb.filter(id => T.rowById[id]));
      const rightItem = T.byId[right] || { id: right, ans: nameOf(right), alts: [], r: it.r, sr: it.sr };
      opts = [rightItem, ...distractors(it, 3, o => o.ans, new Set(it.nb))];
    } else if (def.kind === "odd") opts = [it, ...distractors(it, 3, label, new Set(), T.others)];
    else opts = [it, ...distractors(it, 3, label)];
    q.options = shuffle(opts);
    q.labels = Object.fromEntries(q.options.map(o => [o.id, label(o)]));
  }
  return q;
}
function makeCompare(a, b) {
  const win = a.val >= b.val ? a : b;
  return { compare: true, a, b, it: win, ok: new Set([win.id]), style: "pair" };
}
// Picks an opponent with a similar value most of the time, so it isn't always obvious
function compareOpponent(a, P) {
  const close = P.filter(x => x.id !== a.id && x.val / a.val > 0.4 && x.val / a.val < 2.5 && Math.abs(x.val - a.val) / Math.max(x.val, a.val) > 0.03);
  const any = P.filter(x => x.id !== a.id && Math.abs(x.val - a.val) / Math.max(x.val, a.val) > 0.03);
  return (Math.random() < 0.7 && close.length ? pick(close) : pick(any));
}

/* Draws one question into host (one stacked column; fits one screen on desktop). */
/* ---------- capital photos (Practice): the lead photo of the city's Wikipedia article, loaded in the browser ---------- */
const PHOTO_KEY = "geography-gym-photos-v1";
let photoCache = {};
try { photoCache = JSON.parse(localStorage.getItem(PHOTO_KEY)) || {}; } catch (e) {}
// Capitals whose plain name is a different article (usually the state of the same name)
const WIKI_TITLE = {
  "Aguascalientes|Aguascalientes": "Aguascalientes City", "Campeche|Campeche": "Campeche City", "Chihuahua|Chihuahua": "Chihuahua City",
  "Colima|Colima": "Colima City", "Durango|Durango": "Victoria de Durango", "Guanajuato|Guanajuato": "Guanajuato City",
  "Oaxaca|Oaxaca": "Oaxaca City", "Puebla|Puebla": "Puebla City", "Querétaro|Querétaro": "Santiago de Querétaro",
  "San Luis Potosí|San Luis Potosí": "San Luis Potosí City", "Tlaxcala|Tlaxcala": "Tlaxcala City", "Zacatecas|Zacatecas": "Zacatecas City",
  "Mexico City|Mexico City": "Mexico City", "Bremen|Bremen": "Bremen", "Hamburg|Hamburg": "Hamburg", "Berlin|Berlin": "Berlin"
};
const COUNTRY_OF_SET = { states: "United States", ca: "Canada", au: "Australia", de: "Germany", mx: "Mexico" };
const hasPhoto = def => def.photos || (def.field === "cap" && (def.kind === "fact" || def.kind === "text"));
function savePhotos() { try { localStorage.setItem(PHOTO_KEY, JSON.stringify(photoCache)); } catch (e) {} }
async function capitalPhoto(it, def) {
  if (def.set === "trivia") return wikiPhoto("lm|" + it.row.wiki, [it.row.wiki], null);
  const cap = it.cap, place = it.row.n, key = cap + "|" + place;
  if (key in photoCache) return photoCache[key];
  const country = COUNTRY_OF_SET[def.set];
  const names = [place, ...(it.row.a || []), country].filter(Boolean).map(norm);
  const tries = [...new Set([WIKI_TITLE[key], cap, `${cap}, ${place}`, country && `${cap}, ${country}`].filter(Boolean))];
  return wikiPhoto(key, tries, names);
}
// Lead photo of the first Wikipedia article in tries that is a real article (and, with names, mentions one of them)
async function wikiPhoto(key, tries, names) {
  if (key in photoCache) return photoCache[key];
  let failed = false;
  for (const t of tries) {
    try {
      const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(t.replace(/ /g, "_"))}`);
      if (!r.ok) continue;
      const j = await r.json();
      if (j.type !== "standard" || !j.thumbnail) continue;
      // Make sure it's the right city: the article should mention the country or state
      const text = " " + norm(`${j.description || ""} ${(j.extract || "").slice(0, 500)}`) + " ";
      if (names && !names.some(n => n && text.includes(" " + n + " "))) continue;
      const o = j.originalimage, src = o && o.width <= 900 ? o.source : j.thumbnail.source.replace(/\/\d+px-/, "/640px-");
      return (photoCache[key] = { src, page: j.content_urls.desktop.page }, savePhotos(), photoCache[key]);
    } catch (e) { failed = true; }
  }
  if (!failed) { photoCache[key] = null; savePhotos(); }
  return null;
}

/* fast: quiz mode. No map or explanation after answering; a short flash, then the next question. */
function renderQuestion(host, q, { top = "", below = "", onAnswer, onNext, nextLabel = "Next", fast = false }) {
  const it = q.it, def = T.def;
  let answered = false, mapCtl = null, fastTimer = null;
  const goNext = () => { if (fastTimer === -1) return; clearTimeout(fastTimer); fastTimer = -1; onNext(); };
  let h = top + `<div class="q-stack kind-${def.kind}${q.style === "map" ? " locate" : ""}">`;
  if (q.compare) {
    h += `<div class="q-head"><p class="prompt">${esc(def.ask)}</p></div><div class="pair">${[q.a, q.b].map((o, i) => `<button type="button" class="pair-card" data-id="${o.id}"><span class="kbd">${i + 1}</span>${img(o.id, "Flag of " + o.label)}<b>${esc(o.label)}</b><span class="val" aria-live="polite"></span></button>`).join("")}</div>`;
  } else if (q.style === "map") {
    h += `<div class="q-head"><p class="prompt">${esc(def.ask)}</p><div class="qname">${esc(it.label)}</div></div><figure class="map main" data-map>${MAP_CONTROLS}<figcaption class="map-key"><span>Click it on the map. Scroll or use + to zoom.</span></figcaption></figure>`;
  } else if (q.style === "reverse") {
    h += `<div class="q-head"><p class="prompt">${esc(def.find)}</p><div class="qname">${esc(it.ans)}</div></div>
      <div class="flag-answers">${q.options.map((o, i) => `<button type="button" class="flag-answer" data-id="${o.id}" aria-label="Option ${i + 1}">${img(o.id)}<span class="cap"></span></button>`).join("")}</div>`;
  } else {
    if (def.kind === "flag") h += `<div class="q-head"><div class="qflag">${img(it.id, "Mystery flag")}</div><p class="prompt">${esc(def.ask)}</p></div>`;
    else if (def.kind === "feature") h += `<div class="q-head"><p class="prompt">${esc(def.ask)}</p></div><figure class="map main" data-map>${MAP_CONTROLS}<figcaption class="map-key"><span>Scroll or use + and − to zoom</span></figcaption></figure>`;
    else if (def.kind === "shape") h += `<div class="q-head"><div class="qflag qshape">${shapeSVG(it.id)}</div><p class="prompt">${esc(def.ask)}</p></div>`;
    else if (def.kind === "text") h += `<div class="q-head">${textTile(it.q)}<p class="prompt">${esc(it.ask || def.ask)}</p></div>`;
    else if (def.kind === "odd") h += `<div class="q-head"><div class="qname odd-q">${esc(def.ask)}</div></div>`;
    else h += `<div class="q-head"><div class="qflag small">${img(it.id, "Flag of " + it.label)}</div><div class="qname">${esc(it.label)}</div><p class="prompt">${esc(def.ask)}</p></div>`;
    if (q.style === "choice") {
      h += `<div class="answers">${q.options.map(o => `<button type="button" class="answer" data-id="${o.id}">${esc(q.labels[o.id])}</button>`).join("")}</div>`;
    } else {
      h += `<form class="type-row" autocomplete="off"><input id="typeIn" type="text" placeholder="${esc(def.typeHolder)}" aria-label="${esc(def.typeHolder)}" autocapitalize="off" spellcheck="false"><button class="btn primary" type="submit">Check</button><button class="btn" type="button" data-skip>Skip</button></form>`;
    }
  }
  h += `<div class="below">${below}</div><div class="fb"></div></div>`;
  host.innerHTML = h;
  const stack = host.querySelector(".q-stack"), belowEl = host.querySelector(".below"), fbEl = host.querySelector(".fb");

  if (q.style === "map") {
    mountMap(host.querySelector("[data-map]"), { tips: false, dots: true, pick: code => { if (!answered) finish(q.ok.has(code), code, ""); } }).then(c => { mapCtl = c; });
  }
  if (def.kind === "feature") {
    mountMap(host.querySelector("[data-map]")).then(c => { mapCtl = c; if (c) { c.overlay(it.feat); c.focusBox(it.feat.b, 5, 0.22, false); } });
  }

  function finish(ok, picked, note) {
    if (answered) return; answered = true;
    host.querySelectorAll("[data-id]").forEach(b => {
      b.disabled = true;
      if (q.ok.has(b.dataset.id) && (def.kind !== "neighbors" || b.dataset.id === picked || !ok)) b.classList.add("right");
      else if (b.dataset.id === picked) b.classList.add("wrong");
      else if (q.style === "choice") b.classList.add("dim");
      const cap = b.querySelector(".cap"); if (cap) cap.textContent = T.byId[b.dataset.id].ans;
      const val = b.querySelector(".val"); if (val) val.textContent = fmtVal(def.field, T.byId[b.dataset.id].val);
    });
    const inp = host.querySelector("#typeIn");
    if (inp) { inp.disabled = true; inp.classList.add(ok ? "right" : "wrong"); host.querySelectorAll(".type-row button").forEach(b => b.disabled = true); }
    sfx(ok);
    if (fast) {
      // Show the right answer for a moment when wrong, then move on. Enter skips the wait.
      if (!ok && !q.options && !q.compare) fbEl.innerHTML = `<div class="flash bad">It's ${esc(q.style === "map" ? it.label : it.ans)}</div>`;
      if (q.style === "map" && mapCtl) mapCtl.mark({ hit: [it.id], miss: picked && !ok ? [picked] : [] });
      onAnswer(ok, picked);
      fastTimer = setTimeout(() => { if (stack.isConnected) goNext(); }, ok ? 250 : 900);
      return;
    }
    const p = picked && !(ok && picked === it.id) ? picked : null;
    const pLabel = p && ((q.labels && q.labels[p]) || (def.set === "trivia" && T.byId[p] ? T.byId[p].ans : nameOf(p)));
    const mid = x => (T.byId[x] && T.byId[x].mid) || x; // trivia items show their country on the map
    let line, sub = esc(it.fact) + (it.k === "territory" ? " · Territory" : ""), marks, key;
    if (q.compare) {
      const lose = q.a.id === it.id ? q.b : q.a;
      line = ok ? `Correct, ${esc(it.label)} ${esc(def.verb)}.` : `${esc(it.label)} ${esc(def.verb)}.`;
      sub = `${esc(q.a.label)}: ${fmtVal(def.field, q.a.val)} · ${esc(q.b.label)}: ${fmtVal(def.field, q.b.val)}`;
      if (def.field === "pop") sub += ` · World Bank ${T.byId[it.id].row.popY || ""}`;
      marks = { hit: [it.id], hit2: ok ? [lose.id] : [], miss: ok ? [] : [lose.id] };
      key = [[it.id, "hit", def.field === "area" ? "Bigger" : "More people"], [lose.id, ok ? "hit2" : "miss", ""]];
    } else if (def.kind === "neighbors") {
      const nbNames = it.nb.map(nameOf);
      line = ok ? `Yes, ${esc(pLabel)} borders ${esc(it.label)}.` : (p ? `${esc(pLabel)} doesn't border ${esc(it.label)}.` : `${esc(it.label)}'s neighbors are shown in light blue.`);
      sub = `${esc(it.label)} borders ${esc(listJoin(nbNames))}${note ? " · " + esc(note) : ""}`;
      marks = { hit: [it.id], hit2: it.nb, miss: ok || !p ? [] : [p] };
      key = [[it.id, "hit", ""], [it.nb[0], "hit2", "Neighbors"]].concat(!ok && p ? [[p, "miss", "your pick"]] : []);
    } else if (def.kind === "feature") {
      line = ok ? `Correct, it's ${esc(it.ans)}.` : `It's ${esc(it.ans)}.${p ? ` You picked ${esc(pLabel)}.` : ""}`;
      marks = null;
      key = [];
    } else if (def.kind === "locate") {
      line = ok ? `Correct, that's ${esc(it.label)}.` : (p ? `That's ${esc(pLabel)}. ${esc(it.label)} is in blue.` : `${esc(it.label)} is in blue.`);
      marks = { hit: [it.id], miss: p && !ok ? [p] : [] };
      key = [[it.id, "hit", ""]].concat(p && !ok ? [[p, "miss", "your pick"]] : []);
    } else {
      line = ok ? `Correct, it's ${esc(it.ans)}.` : `It's ${esc(it.ans)}.${p ? ` You picked ${esc(pLabel)}.` : ""}`;
      if (!ok && p && def.kind === "fact" && def.field === "cap" && T.byId[p]) sub += ` · ${esc(T.byId[p].ans)} is the capital of ${esc(T.byId[p].label)}`;
      if (!ok && p && def.kind === "text" && T.byId[p]) {
        const o = T.byId[p];
        sub += ` · ${def.set === "trivia" ? (o.row.t === "landmark" ? `${esc(o.q)} is in ${esc(o.ans)}` : `${esc(o.q)} is now ${esc(o.ans)}`)
          : def.field === "cap" ? `${esc(o.label)}'s capital is ${esc(o.q)}` : `${esc(o.q)} is ${esc(o.label)}`}`;
      }
      const showPick = p && !ok && def.mapPick !== false && T.rowById[p] && mid(p) !== mid(it.id);
      marks = { hit: [mid(it.id)], miss: showPick ? [mid(p)] : [] };
      key = [[mid(it.id), "hit", ""]].concat(showPick ? [[mid(p), "miss", "your pick"]] : []);
    }
    if (note && def.kind !== "neighbors") sub += ` · ${esc(note)}`;
    let tip = "";
    if (!ok && (def.kind === "flag" || def.kind === "shape") && !q.compare) {
      const gs = def.groups ? (groupsOf[it.id] || []) : [];
      const g = (p && gs.find(x => x.codes.includes(p))) || gs[0];
      if (g && def.kind === "flag") tip = `<div class="tip">${minis(g.codes)}<div><b>${esc(g.t)}.</b> ${esc(g.tip)}</div></div>`;
      else if (p && T.byId[p] && def.kind === "flag") tip = `<div class="tip">${minis([it.id, p])}<div><b>Side by side.</b> Compare the two flags.</div></div>`;
      else if (p && T.byId[p] && def.kind === "shape") tip = `<div class="tip"><div class="minis">${[it.id, p].map(k => `<figure>${shapeSVG(k, "mini-shape")}<figcaption>${esc(nameOf(k))}</figcaption></figure>`).join("")}</div><div><b>Side by side.</b> Compare the two outlines.</div></div>`;
    }
    let keyHTML = key.filter(k => k[0]).map(([id, cls, extra]) => `<span><i class="k ${cls}"></i>${esc(extra && cls === "hit2" ? extra : nameOf(id))}${extra && cls !== "hit2" ? ` (${esc(extra)})` : ""}</span>`).join("");
    const pf = def.kind === "feature" && p && !ok && T.byId[p] ? T.byId[p].feat : null;
    if (def.kind === "feature") keyHTML = `<span><i class="k hit"></i>${esc(it.ans)}</span>` + (pf ? `<span><i class="k miss"></i>${esc(T.byId[p].ans)} (your pick)</span>` : "");
    belowEl.textContent = "";
    const resultRow = `<div class="result"><div class="result-text"><span class="result-line ${ok ? "good" : "bad"}">${line}</span><span class="result-sub">${sub}</span></div>
      <div class="next-row"><span class="kbd-hint">or press <span class="kbd">Enter</span></span><button type="button" class="btn primary" data-next>${nextLabel}</button></div></div>`;
    if (q.style === "map" || def.kind === "feature") {
      fbEl.innerHTML = resultRow;
      const mapEl = host.querySelector("[data-map]");
      mapEl.querySelector(".map-key").innerHTML = keyHTML;
      const apply = c => {
        if (!c) return;
        c.pick = null; c.tips = true;
        if (def.kind === "feature") {
          if (pf) { c.overlay(pf, 1); const b = it.feat.b, b2 = pf.b; c.focusBox([Math.min(b[0], b2[0]), Math.min(b[1], b2[1]), Math.max(b[2], b2[2]), Math.max(b[3], b2[3])], 1.6, 0.1); }
          else c.focusBox(it.feat.b, 2.2, 0.1);
          return;
        }
        c.mark(marks); c.focus(marks.hit.concat(marks.miss));
      };
      if (mapCtl) apply(mapCtl); else setTimeout(() => apply(mapCtl), 300);
    } else {
      const mapFig = `<figure class="map" data-map>${MAP_CONTROLS}<figcaption class="map-key">${keyHTML}</figcaption></figure>`;
      const photo = hasPhoto(def);
      fbEl.innerHTML = resultRow + (photo ? `<div class="media">${mapFig}<figure class="cap-photo loading"><img alt="${esc(it.cap || it.label)}"><figcaption><b>${esc(it.cap || it.label)}</b><a target="_blank" rel="noopener">Wikipedia</a></figcaption></figure></div>` : mapFig) + tip;
      if (photo) {
        const fig = fbEl.querySelector(".cap-photo"), im = fig.querySelector("img");
        const drop = () => { fig.remove(); };
        capitalPhoto(it, def).then(res => {
          if (!fig.isConnected) return;
          if (!res) return drop();
          im.onload = () => fig.classList.remove("loading"); im.onerror = drop;
          im.src = res.src; fig.querySelector("a").href = res.page;
        });
      }
      mountMap(fbEl.querySelector("[data-map]")).then(c => {
        if (!c) return;
        c.mark(marks);
        const ids = def.kind === "neighbors" ? [it.id, ...it.nb, ...marks.miss] : [...marks.hit, ...(marks.hit2 || []), ...marks.miss];
        c.focus(ids);
      });
    }
    stack.classList.add("answered");
    onAnswer(ok, picked);
    const nb = host.querySelector("[data-next]");
    nb.addEventListener("click", goNext);
    nb.focus({ preventScroll: true });
  }

  host.querySelectorAll("[data-id]").forEach(b => b.addEventListener("click", () => {
    const id = b.dataset.id; finish(q.ok.has(id), id, "");
  }));
  const form = host.querySelector("form.type-row");
  if (form) {
    const inp = form.querySelector("input");
    setTimeout(() => inp.focus({ preventScroll: true }), 30);
    form.addEventListener("submit", e => {
      e.preventDefault();
      const r = judgeTyped(inp.value, q); if (!r) return;
      let note = "";
      if (r.ok && r.twin) note = `${T.byId[r.picked].ans} has an identical flag, so that counts`;
      else if (r.ok && r.typo) note = `accepted "${inp.value.trim()}" as a typo`;
      else if (!r.ok && !r.picked) note = `"${inp.value.trim()}" didn't match any answer`;
      finish(r.ok, r.ok ? (def.kind === "neighbors" ? r.picked : it.id) : r.picked, note);
    });
    form.querySelector("[data-skip]").addEventListener("click", () => finish(false, null, ""));
  }
  return {
    key(e) {
      if (anyOpen()) return;
      if (e.target.tagName === "INPUT" && !answered) return;
      if (!answered && /^[1-4]$/.test(e.key) && (q.options || q.compare)) {
        const b = host.querySelectorAll("[data-id]")[+e.key - 1]; if (b) { b.click(); e.preventDefault(); }
      } else if (answered && e.key === "Enter" && (e.target.tagName !== "BUTTON" || e.target.closest(".map-ctrl"))) {
        e.preventDefault(); goNext();
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
  function ask(q) {
    current = q; done = false;
    const isCompare = !!q.compare;
    ctl = renderQuestion(host(), q, {
      below: streak ? `Streak ${streak}` : "",
      onAnswer(ok) {
        done = true; streak = ok ? streak + 1 : 0;
        if (isCompare) { if (streak > (T.prog.best.streak || 0)) { T.prog.best.streak = streak; saveProgress(); } updateMeter(); }
        else grade(q.it.id, ok);
      },
      onNext: next
    });
  }
  function next() {
    if (T.def.kind === "compare") {
      const P = pool(), a = pick(P);
      return ask(makeCompare(a, compareOpponent(a, P)));
    }
    const it = choose(); recent.push(it.id); if (recent.length > 8) recent.shift();
    ask(makeQuestion(it, T.pref.style));
  }
  return {
    reset() { recent = []; current = null; streak = 0; },
    restyle() { if (current && !done && !current.compare) ask(makeQuestion(current.it, T.pref.style)); else current = null; },
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
    const P = uniquePool(pool());
    const isCompare = T.def.kind === "compare";
    const maxPairs = Math.floor(P.length / 2);
    const lens = isCompare ? ([10, 20, 30].filter(n => n <= maxPairs).length ? [10, 20, 30].filter(n => n <= maxPairs) : [maxPairs])
      : [10, 20, 50].filter(n => n < P.length).concat([P.length]);
    if (!lens.includes(len)) len = lens.includes(20) ? 20 : lens[0];
    const where = T.pref.region === "All" ? SETS[T.def.set].whole : T.pref.region;
    host().innerHTML = `<div class="setup">
      <div><h1>${esc(T.def.name)}</h1><p>A race against the clock, from ${esc(where)}. Answers move on right away; the map and details are in Practice.</p></div>
      <div class="field"><span id="lenLbl">How many</span><div class="seg" role="group" aria-labelledby="lenLbl" id="qLen">${lens.map(n => `<button type="button" data-len="${n}" aria-pressed="${n === len}">${!isCompare && n === P.length ? `All ${n}` : n}</button>`).join("")}</div></div>
      <p class="best-line">${bestText(T.prog.best[quizKey()])}</p>
      <button class="btn primary" type="button" id="qStart">Start</button>
    </div>`;
    $("#qLen").addEventListener("click", e => { const b = e.target.closest("[data-len]"); if (b) { len = +b.dataset.len; setup(); } });
    $("#qStart").addEventListener("click", () => {
      if (isCompare) start(comparePairs(P, len));
      else start(shuffle(P).slice(0, len).map(it => makeQuestion(it, T.pref.style)));
    });
  }
  // No repeats in a quiz: every place once, never the same answer twice, and only one of two identical flags
  function uniquePool(P) {
    const def = T.def, seen = new Set(), out = [];
    for (const it of shuffle(P)) {
      let k = it.id;
      if (def.kind === "flag" && TWINS[it.id]) k = [it.id, TWINS[it.id]].sort().join("+");
      else if (def.repeatAnswers) k = it.id;
      else if (def.kind === "fact" || def.kind === "text") k = def.multi ? it.vals.map(norm).sort().join("+") : norm(it.ans);
      if (seen.has(k)) continue;
      seen.add(k); out.push(it);
    }
    return out;
  }
  // Bigger/smaller: each place shows up in one pair only
  function comparePairs(P, n) {
    const left = shuffle(P), qs = [];
    while (qs.length < n && left.length >= 2) {
      const a = left.shift(), b = compareOpponent(a, left) || left[0];
      left.splice(left.indexOf(b), 1);
      qs.push(makeCompare(a, b));
    }
    return qs;
  }
  // Best result for this topic, region, length and answer style: most right, then fastest
  const quizKey = () => ["quiz", poolKey(), len, T.pref.style].join("|");
  const bestText = b => b ? `Your best: ${b.s} / ${len} in ${fmtTenths(b.t)}` : "No best time yet for this one";
  function start(qs, full = true) {
    run = { qs, i: 0, score: 0, misses: [], t0: Date.now(), full };
    stopTimer(); timer = setInterval(() => { const el = $("#qTime"); if (el && run) el.textContent = fmtTenths((Date.now() - run.t0) / 1000); }, 100);
    ask();
  }
  function stopTimer() { if (timer) clearInterval(timer); timer = null; }
  function ask() {
    if (run.i >= run.qs.length) return results();
    const q = run.qs[run.i], last = run.i === run.qs.length - 1;
    const top = `<div class="qtop"><span>${run.i + 1} / ${run.qs.length}</span><span class="qtrack"><span style="width:${100 * run.i / run.qs.length}%"></span></span><span id="qTime">${fmtTenths((Date.now() - run.t0) / 1000)}</span></div>`;
    ctl = renderQuestion(host(), q, {
      top, below: `${run.score} correct so far`, fast: true,
      nextLabel: last ? "See results" : "Next",
      onAnswer(ok, picked) {
        if (!q.compare) grade(q.it.id, ok);
        if (ok) run.score++; else run.misses.push({ q, p: picked });
        host().querySelector(".qtrack span").style.width = (100 * (run.i + 1) / run.qs.length) + "%";
      },
      onNext() { run.i++; ask(); }
    });
  }
  function results() {
    stopTimer(); ctl = null;
    const secs = (Date.now() - run.t0) / 1000, total = run.qs.length, pct = Math.round(100 * run.score / total);
    const def = T.def;
    let bestLine = "";
    if (run.full) {
      const k = quizKey(), prev = T.prog.best[k];
      const better = !prev || run.score > prev.s || (run.score === prev.s && secs < prev.t);
      if (better) { T.prog.best[k] = { s: run.score, t: Math.round(secs * 10) / 10 }; saveProgress(); }
      bestLine = better ? (prev ? `<p class="best-line new">New best! Your last best was ${prev.s} / ${total} in ${fmtTenths(prev.t)}.</p>` : `<p class="best-line new">That's your first time for this quiz. Beat it next round.</p>`)
        : `<p class="best-line">${bestText(prev)}</p>`;
    }
    const missFig = ({ q, p }) => {
      const it = q.it;
      if (q.compare) return `<figure>${img(it.id, "Flag of " + it.label)}<figcaption>${esc(it.label)}<small>${esc(def.verb)} than ${esc((q.a.id === it.id ? q.b : q.a).label)}</small></figcaption></figure>`;
      const vis = def.kind === "shape" ? shapeSVG(it.id, "mini-shape") : def.kind === "text" ? textTile(it.q, "tile-text") : img(it.id, "Flag of " + it.label);
      const title = def.kind === "fact" ? `${esc(it.ans)} <span class="of">(${esc(it.label)})</span>` : def.kind === "neighbors" ? esc(it.label) : esc(it.ans);
      const said = p ? "you said " + esc((q.labels && q.labels[p]) || nameOf(p)) : "skipped";
      return `<figure>${vis}<figcaption>${title}<small>${said}</small></figcaption></figure>`;
    };
    host().innerHTML = `<div class="setup">
      <div class="score">${run.score}<small> / ${total}</small></div>
      <p class="quiz-time">${pct}% correct in <b>${fmtTenths(secs)}</b></p>
      ${bestLine}
      ${run.misses.length && def.kind !== "compare" ? `<button class="btn primary" type="button" id="qRetry">Retry the ${run.misses.length} you missed</button>` : ""}
      <button class="btn${run.misses.length ? "" : " primary"}" type="button" id="qAgain" style="width:100%">New quiz</button>
    </div>
    ${run.misses.length ? `<div class="misses">${run.misses.map(missFig).join("")}</div>` : ""}`;
    $("#qAgain").addEventListener("click", setup);
    const r = $("#qRetry");
    if (r) r.addEventListener("click", () => start(shuffle(run.misses.map(m => m.q.compare ? makeCompare(m.q.a, m.q.b) : makeQuestion(m.q.it, T.pref.style))), false));
  }
  return {
    reset() { run = null; stopTimer(); setup(); },
    show() { if (!run && !host().querySelector(".setup")) setup(); },
    key(e) { ctl && ctl.key(e); }
  };
})();

/* ---------- NAME THEM (#name-all) ---------- */
const nameAll = (() => {
  let g = null, timer = null, pending = null;
  const input = $("#naInput");
  function reset() {
    if (timer) clearInterval(timer); timer = null; clearTimeout(pending);
    if (!T.def.modes.includes("name-all")) { g = null; return; }
    const P = pool();
    const order = {}; boardSections().forEach(r => order[r] = shuffle(P.filter(it => it.r === r)));
    g = { P, order, found: new Set(), t0: null, done: false, gave: false, ids: new Set(P.map(it => it.id)) };
    input.value = ""; input.disabled = false;
    input.placeholder = T.def.typeHolder;
    $("#naTotal").textContent = P.length; $("#naFound").textContent = 0; $("#naTime").textContent = "0:00";
    $("#naGiveUp").disabled = false;
    render(); banner();
  }
  // One section per region; countries without regions get a single section
  const boardSections = () => T.def.regions.length > 1 ? T.def.regions.slice(1) : [...new Set(T.items.map(it => it.r))];
  function render() {
    let h = "";
    for (const r of boardSections()) {
      const list = g.order[r]; if (!list.length) continue;
      const f = list.filter(it => g.found.has(it.id)).length;
      h += `<div class="region-h"><h2>${r}</h2><span data-rc="${r}">${f} / ${list.length}</span></div><div class="grid">${list.map(tileHTML).join("")}</div>`;
    }
    $("#naBoard").innerHTML = h;
  }
  function tileHTML(it) {
    const found = g.found.has(it.id), missed = g.gave && !found, shown = found || missed, def = T.def;
    const vis = def.kind === "shape" ? shapeSVG(it.id, "tile-shape") : def.kind === "text" ? textTile(it.q, "tile-text") : img(it.id, def.kind === "fact" || shown ? "Flag of " + it.label : "Unnamed flag");
    return `<div class="tile ${found ? "found" : missed ? "missed" : ""}" data-tile="${it.id}">${vis}${def.kind === "fact" ? `<div class="tile-of">${esc(it.label)}</div>` : ""}<div class="lab">${shown ? esc(it.ans) : "?"}</div></div>`;
  }
  function banner(msg, good) {
    const best = T.prog.best[poolKey()];
    $("#naBanner").innerHTML = msg ? `<div class="banner ${good ? "good" : ""}">${msg}</div>`
      : `<p class="na-hint">${esc(T.def.nameHint || "Type every answer you can think of.")} The timer starts with your first letter.${best ? ` Your best: ${fmtTime(best)}.` : ""}</p>`;
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
    if (!g || g.done) return;
    if (!g.t0) { g.t0 = Date.now(); timer = setInterval(() => $("#naTime").textContent = fmtTime((Date.now() - g.t0) / 1000), 500); }
    clearTimeout(pending); pending = null;
    const q = norm(input.value); if (!q) return;
    const ids = T.alias.get(q);
    if (!ids || ![...ids].some(id => !g.found.has(id) && g.ids.has(id))) return;
    let prefix = false;
    for (const [k, other] of T.alias) {
      if (k.length > q.length && k.startsWith(q) && [...other].some(id => !ids.has(id) && !g.found.has(id) && g.ids.has(id))) { prefix = true; break; }
    }
    if (prefix) pending = setTimeout(() => accept(ids), 1100); else accept(ids);
  });
  input.addEventListener("keydown", e => { if (e.key === "Enter" && g) { const ids = T.alias.get(norm(input.value)); if (ids) accept(ids); } });
  $("#naGiveUp").addEventListener("click", () => { if (g && !g.done) finish(true); });
  $("#naRestart").addEventListener("click", () => { reset(); input.focus(); });
  return { reset, show() { if (!g) reset(); setTimeout(() => input.focus({ preventScroll: true }), 30); }, key() {} };
})();

/* ---------- BROWSE ---------- */
const browse = (() => {
  let tab = "all";
  const body = () => $("#browseBody");
  function render() {
    if (!T) return;
    const def = T.def;
    if (!def.groups) tab = "all";
    $("#brTabs").hidden = !def.groups;
    const qs = norm($("#brSearch").value || "");
    const hide = $("#brHide").checked;
    $("#brAll").setAttribute("aria-pressed", tab === "all"); $("#brLook").setAttribute("aria-pressed", tab === "look");
    if (tab === "look") {
      const gs = GROUPS.filter(g => !qs || g.codes.some(k => T.byId[k] && norm(T.byId[k].label).includes(qs)) || norm(g.t).includes(qs));
      body().innerHTML = `<div class="groups">${gs.map(g => `<div class="group"><h3>${esc(g.t)}</h3>${minis(g.codes)}<p>${esc(g.tip)}</p></div>`).join("")}</div>`;
      return;
    }
    let list = pool().filter(it => !qs || [it.label, it.ans, it.cap || "", it.q || "", ...it.alts].some(a => norm(a).includes(qs)));
    if (def.kind === "compare") list.sort((a, b) => b.val - a.val); else list.sort((a, b) => a.label.localeCompare(b.label));
    const answerFirst = def.kind === "flag" || def.kind === "shape" || def.kind === "text" || def.kind === "compare" || def.kind === "feature";
    body().innerHTML = list.length ? `<div class="cards">${list.map((it, i) => {
      const s = status(it.id);
      const vis = def.kind === "shape" ? shapeSVG(it.id, "card-shape") : def.kind === "text" ? textTile(it.q, "card-text") : def.kind === "feature" ? "" : img(it.id, hide && answerFirst ? "" : "Flag of " + it.label);
      let title = answerFirst ? it.ans : it.label, sub;
      if (def.kind === "flag") sub = it.cap || "";
      else if (def.kind === "compare") { title = `${i + 1}. ${it.label}`; sub = fmtVal(def.field, it.val); }
      else if (def.kind === "neighbors") sub = "Borders " + listJoin(it.nb.map(nameOf));
      else if (def.kind === "shape" || def.kind === "text") sub = it.sr;
      else if (def.kind === "feature") sub = it.fact;
      else sub = it.ans;
      const hideCls = hide ? (answerFirst ? "hidden" : "hidden sub-only") : "";
      return `<button type="button" class="card ${hideCls}" data-card="${it.id}" aria-label="${hide ? "Hidden answer, click to reveal" : esc(title)}">${vis}<span class="nm">${def.kind === "compare" ? "" : `<span class="dot ${s}" title="${s}"></span>`}<span>${esc(title)}</span></span><span class="sub">${esc(sub || "–")}</span></button>`;
    }).join("")}</div>` : `<div class="empty">Nothing matches "${esc($("#brSearch").value)}".</div>`;
  }
  body().addEventListener("click", e => { const c = e.target.closest(".card.hidden"); if (c) { c.classList.remove("hidden", "sub-only"); c.setAttribute("aria-label", T.byId[c.dataset.card].ans); } });
  $("#brSearch").addEventListener("input", render);
  $("#brHide").addEventListener("change", render);
  $("#brAll").addEventListener("click", () => { tab = "all"; render(); });
  $("#brLook").addEventListener("click", () => { tab = "look"; render(); });
  return { render, show: render, reset() {}, key() {} };
})();

/* ---------- routing ---------- */
/* ---------- DAILY CHALLENGE, REVIEW, STATS (#daily, #review, #stats) ----------
   These pages mix questions from many topics: T is swapped to each question's topic while it's on screen,
   so answers count toward that topic's progress. Going back to a topic rebuilds it. */
let special = null, leftTopic = false, specialCtl = null;
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const hashStr = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
function seeded(a) { return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
async function prepTopics(defs, prefFor) {
  await Promise.all([...new Set(defs.map(d => d.set))].map(loadSet));
  await Promise.all([...new Set(defs.filter(needsMap).map(d => d.set))].map(loadMap));
  const out = {};
  defs.forEach(def => { const t = buildTopic(def); t.pref = { ...t.pref, ...prefFor(def) }; out[def.id] = t; });
  return out;
}
const sHost = () => $("#view-special");
const qTop = (i, n, name, t0) => `<div class="qtop"><span>${i + 1} / ${n} · ${esc(name)}</span><span class="qtrack"><span style="width:${100 * i / n}%"></span></span><span id="qTime">${t0 ? fmtTime((Date.now() - t0) / 1000) : ""}</span></div>`;
function answerText(def, q) {
  const it = q.it;
  if (q.compare) return `${it.label} ${def.verb} than ${(q.a.id === it.id ? q.b : q.a).label}`;
  if (def.kind === "fact") return `${it.label}: ${it.ans}`;
  if (def.kind === "text") return `${it.q} → ${it.ans}`;
  if (def.kind === "neighbors") return `${it.label} borders ${listJoin(it.nb.map(nameOf).slice(0, 3))}${it.nb.length > 3 ? "…" : ""}`;
  return it.ans;
}
// Runs a list of {t, q} questions; calls done(results) at the end
function runMixed(list, { onDone, label }) {
  const t0 = Date.now(), marks = [];
  let i = 0, timer = setInterval(() => { const el = $("#qTime"); if (el) el.textContent = fmtTime((Date.now() - t0) / 1000); }, 500);
  const ask = () => {
    if (special !== label) { clearInterval(timer); return; }
    if (i >= list.length) { clearInterval(timer); specialCtl = null; return onDone({ marks, secs: (Date.now() - t0) / 1000 }); }
    const { t, q } = list[i]; T = t;
    specialCtl = renderQuestion(sHost(), q, {
      top: qTop(i, list.length, t.def.name, t0), below: `${marks.filter(Boolean).length} correct so far`,
      nextLabel: i === list.length - 1 ? "See results" : "Next",
      onAnswer(ok) { if (!q.compare) grade(q.it.id, ok); marks.push(ok); sHost().querySelector(".qtrack span").style.width = (100 * (i + 1) / list.length) + "%"; },
      onNext() { i++; ask(); }
    });
  };
  ask();
}
const resultList = (list, marks) => `<ol class="mix-list">${list.map(({ t, q }, i) => `<li class="${marks[i] ? "ok" : "bad"}"><span>${esc(t.def.name)}</span><b>${esc(answerText(t.def, q))}</b></li>`).join("")}</ol>`;
const loadingCard = txt => `<div class="setup"><p>${esc(txt)}</p></div>`;

/* Daily: the same 10 questions for everyone, from 10 different topics */
const DAILY_POOL = ["flags", "capitals", "capitals-rev", "map", "shapes", "neighbors", "currencies", "languages", "area", "population",
  "lakes", "rivers", "ranges", "state-flags", "state-capitals", "state-map", "ca-capitals", "au-capitals", "de-flags", "mx-map",
  "landlocked", "demonyms", "landmarks", "former", "peaks", "seas", "state-nicknames"];
const DKEY = "geography-gym-daily";
const dailyLog = () => { try { return JSON.parse(localStorage.getItem(DKEY)) || {}; } catch (e) { return {}; } };
function dailyStreak(log = dailyLog()) {
  const d = new Date(); if (!log[ymd(d)]) d.setDate(d.getDate() - 1);
  let n = 0; while (log[ymd(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
const niceDay = day => new Date(day + "T12:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
async function dailyQuestions(day) {
  const rnd = seeded(hashStr("geography-gym-" + day));
  const ids = DAILY_POOL.slice();
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  const defs = ids.slice(0, 10).map(id => TOPIC[id]);
  const topics = await prepTopics(defs, def => ({ style: def.styles[0], region: "All", terr: !!def.terrOn }));
  const real = Math.random; Math.random = rnd; // same answer choices for everyone
  try {
    return defs.map(def => {
      T = topics[def.id];
      const P = pool().sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
      if (def.kind === "compare") { const a = pick(P); return { t: T, q: makeCompare(a, compareOpponent(a, P)) }; }
      return { t: T, q: makeQuestion(pick(P), T.pref.style) };
    });
  } finally { Math.random = real; }
}
function shareText(day, r) {
  const d = new Date(day + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `GeoGym Daily Challenge · ${d}\n${r.s}/${r.n} in ${fmtTime(r.t)}\n${r.m.split("").map(c => c === "1" ? "🟩" : "🟥").join("")}\n${location.origin}/daily/`;
}
// A picture of the result for the share sheet (it shows as the preview, and Messages or Snapchat send it with the text)
async function shareImage(day, r) {
  const S = 1080, c = document.createElement("canvas"); c.width = c.height = S;
  const g = c.getContext("2d");
  try { await Promise.all(["600 40px Manrope", "800 80px Manrope"].map(f => document.fonts.load(f))); } catch (e) {}
  const logo = await new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = "logo.svg"; });
  g.fillStyle = "#15171c"; g.fillRect(0, 0, S, S);
  if (logo) g.drawImage(logo, S / 2 - 90, 90, 180, 180);
  g.textAlign = "center"; g.fillStyle = "#ffffff";
  g.font = "800 64px Manrope, sans-serif"; g.fillText("GeoGym Daily Challenge", S / 2, 360);
  g.fillStyle = "#9aa0aa"; g.font = "600 38px Manrope, sans-serif"; g.fillText(niceDay(day), S / 2, 420);
  g.fillStyle = "#ffffff"; g.font = "800 230px Manrope, sans-serif"; g.fillText(`${r.s}/${r.n}`, S / 2, 660);
  g.fillStyle = "#9aa0aa"; g.font = "600 44px Manrope, sans-serif"; g.fillText(`in ${fmtTime(r.t)}`, S / 2, 730);
  const n = r.m.length, sz = 70, gap = 14, x0 = (S - (n * sz + (n - 1) * gap)) / 2;
  r.m.split("").forEach((m, i) => { g.fillStyle = m === "1" ? "#1f9d55" : "#e5484d"; g.beginPath(); g.roundRect ? g.roundRect(x0 + i * (sz + gap), 800, sz, sz, 14) : g.rect(x0 + i * (sz + gap), 800, sz, sz); g.fill(); });
  g.fillStyle = "#7aa2ff"; g.font = "700 40px Manrope, sans-serif"; g.fillText(location.host + "/daily", S / 2, 1000);
  const blob = await new Promise(res => c.toBlob(res, "image/png"));
  return blob ? new File([blob], "geogym-daily.png", { type: "image/png" }) : null;
}
async function copyText(text, btn) {
  try { await navigator.clipboard.writeText(text); }
  catch (e) { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (e2) {} ta.remove(); }
  btn.textContent = "Copied"; setTimeout(() => { btn.textContent = "Copy result"; }, 1800);
}
const daily = {
  show() {
    const day = ymd(new Date()), log = dailyLog(), done = log[day];
    const streak = dailyStreak(log);
    if (done) return daily.results(day, done, null);
    sHost().innerHTML = `<div class="setup">
      <div><h1>Daily challenge</h1><p>${esc(niceDay(day))}</p></div>
      <p>10 questions from 10 different topics. Everyone gets the same ones today, and a new set comes out at midnight.</p>
      ${streak ? `<p><b>${streak}-day streak.</b> Play today to keep it going.</p>` : ""}
      <button class="btn primary" type="button" id="dStart">Start</button>
    </div>`;
    $("#dStart").addEventListener("click", async () => {
      sHost().innerHTML = loadingCard("Loading today's questions…");
      let list; try { list = await dailyQuestions(day); } catch (e) { sHost().innerHTML = loadingCard("Today's questions didn't load. Refresh the page to try again."); return; }
      if (special !== "daily") return;
      runMixed(list, { label: "daily", onDone({ marks, secs }) {
        const r = { s: marks.filter(Boolean).length, n: marks.length, m: marks.map(x => x ? 1 : 0).join(""), t: Math.round(secs) };
        const lg = dailyLog(); lg[day] = r; try { localStorage.setItem(DKEY, JSON.stringify(lg)); } catch (e) {}
        daily.results(day, r, list);
      } });
    });
  },
  results(day, r, list) {
    specialMeter();
    const streak = dailyStreak();
    sHost().innerHTML = `<div class="setup">
      <div><h1>Daily challenge</h1><p>${esc(niceDay(day))}</p></div>
      <div class="score">${r.s}<small> / ${r.n}</small></div>
      <div class="marks" aria-label="${r.s} right, ${r.n - r.s} wrong">${r.m.split("").map(c => `<span class="${c === "1" ? "ok" : "bad"}"></span>`).join("")}</div>
      <p>${fmtTime(r.t)}${streak ? ` · ${streak}-day streak` : ""}. A new challenge comes out at midnight.</p>
      <div class="share-row">${navigator.share ? `<button class="btn primary" type="button" id="dShare">Share</button>` : ""}<button class="btn${navigator.share ? "" : " primary"}" type="button" id="dCopy">Copy result</button></div>
    </div>${list ? resultList(list, r.m.split("").map(c => c === "1")) : ""}`;
    $("#dCopy").addEventListener("click", e => copyText(shareText(day, r), e.currentTarget));
    const sh = $("#dShare");
    // Phones: the share sheet (Messages, WhatsApp…) with a picture of the result.
    // The picture is made now, so the tap can open the share sheet straight away (phones require that).
    if (sh) {
      let file = null;
      shareImage(day, r).then(f => { file = f; }).catch(() => {});
      sh.addEventListener("click", () => {
        const text = shareText(day, r), title = "GeoGym Daily Challenge";
        const data = file && navigator.canShare && navigator.canShare({ files: [file] }) ? { files: [file], title, text } : { title, text };
        navigator.share(data).catch(e => { if (data.files && e && e.name !== "AbortError") navigator.share({ title, text }).catch(() => {}); });
      });
    }
  }
};

/* Review: everything you got wrong recently, across all topics */
function weakSpots() {
  const out = [];
  TOPICS.forEach(def => {
    if (def.kind === "compare") return;
    Object.entries(loadProgress(def.id).p).forEach(([id, r]) => { if (r.s && r.b < 2) out.push({ def, id, t: r.t || 0 }); });
  });
  return out.sort((a, b) => b.t - a.t);
}
const review = {
  show() {
    const W = weakSpots();
    specialMeter();
    if (!W.length) {
      sHost().innerHTML = `<div class="setup"><div><h1>Review weak spots</h1><p>Nothing to review right now.</p></div>
        <p>Anything you get wrong, in any topic, shows up here until you get it right twice.</p>
        <a class="btn primary" href="#${esc(settings.topic)}-practice">Go practice</a></div>`;
      return;
    }
    const by = {}; W.forEach(w => (by[w.def.id] = by[w.def.id] || { def: w.def, n: 0 }).n++);
    const n = Math.min(20, W.length);
    sHost().innerHTML = `<div class="setup">
      <div><h1>Review weak spots</h1><p>${W.length} ${W.length === 1 ? "thing" : "things"} you got wrong, in ${Object.keys(by).length} ${Object.keys(by).length === 1 ? "topic" : "topics"}</p></div>
      <ul class="weak-list">${Object.values(by).sort((a, b) => b.n - a.n).map(x => `<li><span>${esc(x.def.name)}</span><b>${x.n}</b></li>`).join("")}</ul>
      <button class="btn primary" type="button" id="rStart">Review ${n === W.length ? "them" : `the latest ${n}`}</button>
    </div>`;
    $("#rStart").addEventListener("click", async () => {
      sHost().innerHTML = loadingCard("Loading…");
      const pickd = shuffle(W.slice(0, n));
      let topics; try { topics = await prepTopics([...new Set(pickd.map(w => w.def))], def => ({ region: "All", terr: true })); }
      catch (e) { sHost().innerHTML = loadingCard("This didn't load. Refresh the page to try again."); return; }
      if (special !== "review") return;
      const list = pickd.map(w => { T = topics[w.def.id]; const it = T.byId[w.id]; return it ? { t: T, q: makeQuestion(it, T.pref.style) } : null; }).filter(Boolean);
      runMixed(list, { label: "review", onDone({ marks }) {
        specialMeter();
        const left = weakSpots().length, s = marks.filter(Boolean).length;
        sHost().innerHTML = `<div class="setup">
          <div><h1>Review done</h1><p>${s} of ${marks.length} right. ${left ? `${left} still to review.` : "Nothing left to review."}</p></div>
          ${left ? `<button class="btn primary" type="button" id="rAgain">Keep going</button>` : `<a class="btn primary" href="#stats">See your stats</a>`}
        </div>${resultList(list, marks)}`;
        const a = $("#rAgain"); if (a) a.addEventListener("click", () => review.show());
      } });
    });
  }
};

/* Stats: progress in every topic you've started */
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const stats = {
  show() {
    specialMeter();
    let learned = 0, answers = 0, right = 0, started = 0;
    const rows = {};
    TOPICS.forEach(def => {
      const pr = loadProgress(def.id), recs = Object.values(pr.p);
      if (def.kind === "compare") {
        if (pr.best.streak) { started++; (rows[def.group] = rows[def.group] || []).push(`<a class="stat-row" href="#${def.id}-practice"><span class="nm">${esc(def.name)}</span><span class="sbar"><span style="width:${Math.min(100, pr.best.streak * 5)}%"></span></span><span class="num">Best streak ${pr.best.streak}</span><span class="acc"></span></a>`); }
        return;
      }
      if (!recs.some(r => r.s)) return;
      started++;
      const l = recs.filter(r => r.s && r.b >= 3).length, s = recs.reduce((a, r) => a + (r.s || 0), 0), ok = recs.reduce((a, r) => a + (r.r || 0), 0);
      const total = Math.max(pr.n || 0, l);
      learned += l; answers += s; right += ok;
      (rows[def.group] = rows[def.group] || []).push(`<a class="stat-row" href="#${def.id}-practice"><span class="nm">${esc(def.name)}</span><span class="sbar"><span style="width:${pct(l, total)}%"></span></span><span class="num">${l}${total ? ` / ${total}` : ""} learned</span><span class="acc">${pct(ok, s)}% right</span></a>`);
    });
    const log = dailyLog(), days = Object.values(log);
    const tile = (v, k) => `<div class="tile-stat"><b>${v}</b><span>${k}</span></div>`;
    sHost().innerHTML = `<div class="stats">
      <h1>Your stats</h1>
      <div class="tiles-row">${tile(learned, "learned")}${tile(answers, "answers")}${tile(answers ? pct(right, answers) + "%" : "–", "right")}${tile(dailyStreak(log), "day streak")}</div>
      ${days.length ? `<p class="muted">${days.length} daily ${days.length === 1 ? "challenge" : "challenges"} played, ${(days.reduce((a, d) => a + d.s, 0) / days.length).toFixed(1)} right on average.</p>` : ""}
      ${started ? GROUP_NAMES.filter(g => rows[g]).map(g => `<h2>${esc(g)}</h2><div class="stat-rows">${rows[g].join("")}</div>`).join("") : `<p class="muted">No progress yet. Pick a topic from the menu and your stats will show up here.</p>`}
      ${started ? `<p class="muted">${TOPICS.length - started} topics not started yet. Everything is saved in this browser.</p>` : ""}
    </div>`;
  }
};
const SPECIALS = [
  { id: "daily", name: "Daily challenge", view: daily },
  { id: "review", name: "Review weak spots", view: review },
  { id: "stats", name: "Your stats", view: stats }
];
const SPECIAL_GROUP = "Daily & stats";
function specialMeter() {
  const set = (html, w) => { $("#meterText").innerHTML = html; $("#meterFill").parentElement.hidden = w == null; $("#meterFill").style.width = (w || 0) + "%"; };
  if (special === "daily") { const s = dailyStreak(); set(s ? `<b>${s}</b>-day streak` : "No streak yet", Math.min(100, s * 100 / 7)); }
  else if (special === "review") { const n = weakSpots().length; set(`<b>${n}</b> to review`, null); }
  else set(`<b>${TOPICS.reduce((a, d) => a + Object.values(loadProgress(d.id).p).filter(r => r.s && r.b >= 3).length, 0)}</b> learned in all`, null);
}
function showSpecial(sp) {
  ++routeToken; special = sp.id; leftTopic = true; specialCtl = null;
  document.body.classList.add("special");
  document.querySelectorAll(".view").forEach(s => s.hidden = s.id !== "view-special");
  $("#view-special").classList.toggle("wide", sp.id === "stats");
  $("#loading").hidden = true;
  $("#menuLabel").textContent = sp.name;
  document.title = `${sp.name} · GeoGym`;
  state.view = "special";
  syncTopicLinks(); specialMeter();
  sp.view.show();
}

const VIEWS = { practice, quiz, "name-all": nameAll, browse, special: { show() {}, key(e) { specialCtl && specialCtl.key(e); } } };
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
  if (!s.loading) s.loading = Promise.all([fetch(vurl(s.data)), s.images ? fetch(vurl(s.images)) : null, ...(s.needs || []).map(loadSet)]).then(async ([d, i]) => {
    if (!d.ok || (i && !i.ok)) throw new Error("load");
    s.rows = await d.json();
    if (i) (await i.json()).forEach(f => { s.img[f.c] = URL.createObjectURL(new Blob([f.s], { type: "image/svg+xml" })); });
  }).catch(err => { s.loading = null; throw err; });
  return s.loading;
}
const needsMap = def => def.kind === "shape" || def.kind === "locate" || def.kind === "feature";
let routeToken = 0;
async function route() {
  const sp = SPECIALS.find(x => x.id === location.hash.slice(1));
  if (sp) return showSpecial(sp);
  if (special) { special = null; specialCtl = null; document.body.classList.remove("special"); }
  let { topic, mode } = parseHash();
  const def = TOPIC[topic];
  if (!def.modes.includes(mode)) { location.replace(`#${topic}-practice`); return; }
  const token = ++routeToken;
  if (!T || T.def.id !== topic || leftTopic) {
    leftTopic = false;
    document.querySelectorAll(".view").forEach(s => s.hidden = true);
    $("#loading").hidden = false; $("#loading").textContent = "Loading…";
    try { await loadSet(def.set); if (needsMap(def)) await loadMap(def.set); }
    catch (e) { $("#loading").textContent = "This topic didn't load. Refresh the page to try again."; return; }
    if (token !== routeToken) return;
    settings.topic = topic; saveSettings();
    T = buildTopic(def);
    state.view = mode;
    renderSettings(); updateMeter();
    practice.reset(); quiz.reset(); nameAll.reset();
    setTimeout(() => loadMap(def.set).catch(() => {}), 1200);
  }
  $("#loading").hidden = true;
  state.view = mode;
  document.querySelectorAll(".view").forEach(s => s.hidden = s.id !== "view-" + mode);
  document.querySelectorAll("#modeNav a").forEach(a => { if (a.dataset.view === mode) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  renderSettings();
  document.title = `${T.def.name} · GeoGym`;
  VIEWS[mode].show();
}
renderTopicMenu();
addEventListener("hashchange", route);
document.addEventListener("keydown", e => { const v = VIEWS[state.view]; if (v && (T || state.view === "special")) v.key(e); });
route();
