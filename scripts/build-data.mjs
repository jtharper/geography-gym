// Regenerates public/data/*.json. Run with: npm run data
import fs from 'fs';
import { optimize } from 'svgo';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const all = require('world-countries');

const svgo = raw => optimize(raw, { multipass: true, floatPrecision: 2, plugins: ['preset-default', 'removeDimensions'] }).data;
const writeImages = (file, list) => fs.writeFileSync(file, '[\n' + list.map(f => JSON.stringify(f)).join(',\n') + '\n]\n');

/* ---------------- Countries ---------------- */
const extraCountries = ['PS', 'XK', 'TW', 'VA'];
const territories = 'AW AI AX AS BM CK CW KY FK FO GG GI GL GU HK IM JE MO MP MS NF NU PN PR PF SX TC VG VI TK IO GS SH CX NC'.split(' ');
const aliases = {
  US: ['USA', 'United States of America', 'America'], GB: ['UK', 'Great Britain', 'Britain', 'England'], CI: ['Ivory Coast', "Cote d'Ivoire"],
  CZ: ['Czech Republic'], CD: ['DRC', 'DR Congo', 'Congo Kinshasa', 'Democratic Republic of Congo'], CG: ['Congo', 'Republic of the Congo', 'Congo Brazzaville'],
  KR: ['South Korea', 'Korea'], KP: ['North Korea'], MM: ['Burma'], SZ: ['Swaziland'], MK: ['Macedonia'], TL: ['East Timor'], CV: ['Cape Verde'],
  VA: ['Vatican', 'Holy See', 'Vatican City'], RU: ['Russia'], AE: ['UAE'], NL: ['Holland'], TR: ['Turkey', 'Turkiye'], LA: ['Laos'], FM: ['Micronesia'],
  BA: ['Bosnia'], ST: ['Sao Tome'], VC: ['St Vincent'], KN: ['St Kitts', 'Saint Kitts'], LC: ['St Lucia'], TT: ['Trinidad'], AG: ['Antigua'], PS: ['Palestinian Territories'],
  VG: ['BVI'], VI: ['USVI'], GS: ['South Georgia and the South Sandwich Islands'], SH: ['Saint Helena', 'St Helena'], CN: ['PRC'], TW: ['Republic of China', 'ROC'],
  GM: ['Gambia'], BS: ['Bahamas'], PH: ['Philippines'], FK: ['Falklands', 'Malvinas'], DO: ['Dominican Rep'], CF: ['CAR'], GQ: ['Eq Guinea'], PG: ['PNG']
};
// Capital corrections: first entry is the one shown, the rest are also accepted when typed.
const capitalFix = {
  LK: ['Sri Jayawardenepura Kotte', 'Kotte', 'Colombo'],
  SZ: ['Mbabane', 'Lobamba'],
  MN: ['Ulaanbaatar', 'Ulan Bator'],
  SM: ['San Marino', 'City of San Marino'],
  US: ['Washington, D.C.', 'Washington', 'Washington DC'],
  BO: ['Sucre', 'La Paz'],
  BJ: ['Porto-Novo', 'Cotonou'],
  MY: ['Kuala Lumpur', 'Putrajaya'],
  KZ: ['Astana', 'Nur-Sultan'],
  MM: ['Naypyidaw', 'Nay Pyi Taw', 'Naypyitaw'],
  UA: ['Kyiv', 'Kiev'],
  IN: ['New Delhi', 'Delhi'],
  KI: ['South Tarawa', 'Tarawa'],
  PS: ['Ramallah', 'East Jerusalem'],
  AG: ["Saint John's", "St. John's"]
};
const regionOf = c => c.region === 'Antarctic' ? 'South America' : c.region === 'Americas' ? (c.subregion === 'South America' ? 'South America' : 'North America') : c.region;
const countries = [], flags = [];
for (const c of all) {
  const code = c.cca2;
  let kind = null;
  if (c.unMember || extraCountries.includes(code)) kind = 'country';
  else if (territories.includes(code)) kind = 'territory';
  if (!kind) continue;
  flags.push({ c: code, s: svgo(fs.readFileSync(`node_modules/flag-icons/flags/4x3/${code.toLowerCase()}.svg`, 'utf8')) });
  const alt = new Set([c.name.common, c.name.official, ...(aliases[code] || []), ...c.altSpellings.filter(a => a.length > 3 && /^[\x00-\x7F]+$/.test(a))]);
  const caps = capitalFix[code] || [...(c.capital || [])];
  countries.push({ c: code, n: c.name.common, a: [...alt].filter(x => x !== c.name.common), r: regionOf(c), sr: c.subregion, cap: caps[0] || '', caps, k: kind });
}
countries.sort((a, b) => a.n.localeCompare(b.n));
const nameFix = { CI: "Côte d'Ivoire", VA: 'Vatican City', PS: 'Palestine', KR: 'South Korea', KP: 'North Korea', MK: 'North Macedonia', CD: 'DR Congo', CG: 'Republic of the Congo', SH: 'Saint Helena', GS: 'South Georgia', US: 'United States', GB: 'United Kingdom' };
for (const o of countries) if (nameFix[o.c] && nameFix[o.c] !== o.n) { o.a.push(o.n); o.n = nameFix[o.c]; }
fs.writeFileSync('public/data/countries.json', JSON.stringify(countries));
writeImages('public/data/flags.json', flags);
console.log(countries.filter(o => o.k === 'country').length, 'countries,', countries.filter(o => o.k === 'territory').length, 'territories');

/* ---------------- US states ---------------- */
// [code, name, capital, Census region]
const STATES = [
  ['AL', 'Alabama', 'Montgomery', 'South'], ['AK', 'Alaska', 'Juneau', 'West'], ['AZ', 'Arizona', 'Phoenix', 'West'],
  ['AR', 'Arkansas', 'Little Rock', 'South'], ['CA', 'California', 'Sacramento', 'West'], ['CO', 'Colorado', 'Denver', 'West'],
  ['CT', 'Connecticut', 'Hartford', 'Northeast'], ['DE', 'Delaware', 'Dover', 'South'], ['FL', 'Florida', 'Tallahassee', 'South'],
  ['GA', 'Georgia', 'Atlanta', 'South'], ['HI', 'Hawaii', 'Honolulu', 'West'], ['ID', 'Idaho', 'Boise', 'West'],
  ['IL', 'Illinois', 'Springfield', 'Midwest'], ['IN', 'Indiana', 'Indianapolis', 'Midwest'], ['IA', 'Iowa', 'Des Moines', 'Midwest'],
  ['KS', 'Kansas', 'Topeka', 'Midwest'], ['KY', 'Kentucky', 'Frankfort', 'South'], ['LA', 'Louisiana', 'Baton Rouge', 'South'],
  ['ME', 'Maine', 'Augusta', 'Northeast'], ['MD', 'Maryland', 'Annapolis', 'South'], ['MA', 'Massachusetts', 'Boston', 'Northeast'],
  ['MI', 'Michigan', 'Lansing', 'Midwest'], ['MN', 'Minnesota', 'Saint Paul', 'Midwest'], ['MS', 'Mississippi', 'Jackson', 'South'],
  ['MO', 'Missouri', 'Jefferson City', 'Midwest'], ['MT', 'Montana', 'Helena', 'West'], ['NE', 'Nebraska', 'Lincoln', 'Midwest'],
  ['NV', 'Nevada', 'Carson City', 'West'], ['NH', 'New Hampshire', 'Concord', 'Northeast'], ['NJ', 'New Jersey', 'Trenton', 'Northeast'],
  ['NM', 'New Mexico', 'Santa Fe', 'West'], ['NY', 'New York', 'Albany', 'Northeast'], ['NC', 'North Carolina', 'Raleigh', 'South'],
  ['ND', 'North Dakota', 'Bismarck', 'Midwest'], ['OH', 'Ohio', 'Columbus', 'Midwest'], ['OK', 'Oklahoma', 'Oklahoma City', 'South'],
  ['OR', 'Oregon', 'Salem', 'West'], ['PA', 'Pennsylvania', 'Harrisburg', 'Northeast'], ['RI', 'Rhode Island', 'Providence', 'Northeast'],
  ['SC', 'South Carolina', 'Columbia', 'South'], ['SD', 'South Dakota', 'Pierre', 'Midwest'], ['TN', 'Tennessee', 'Nashville', 'South'],
  ['TX', 'Texas', 'Austin', 'South'], ['UT', 'Utah', 'Salt Lake City', 'West'], ['VT', 'Vermont', 'Montpelier', 'Northeast'],
  ['VA', 'Virginia', 'Richmond', 'South'], ['WA', 'Washington', 'Olympia', 'West'], ['WV', 'West Virginia', 'Charleston', 'South'],
  ['WI', 'Wisconsin', 'Madison', 'Midwest'], ['WY', 'Wyoming', 'Cheyenne', 'West']
];
const stateCapAlts = { MN: ['St. Paul'], NV: ['Carson'], UT: ['Salt Lake'], MO: ['Jefferson'], OK: ['Oklahoma'] };
// Flags changed since region-flags was published (2022): take these from us-state-flags instead.
const NEWER = ['MN', 'UT', 'MS'];
const fromUsStateFlags = code => {
  const js = fs.readFileSync(`node_modules/us-state-flags/src/components/flags/Flag${code}.js`, 'utf8');
  const vb = js.match(/viewBox: '([^']+)'/)[1];
  const inner = js.match(/__html: `([\s\S]*?)`\s*}/)[1];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${inner}</svg>`;
};
const states = [], stateFlags = [];
for (const [code, n, cap, r] of STATES) {
  const raw = NEWER.includes(code) ? fromUsStateFlags(code) : fs.readFileSync(`node_modules/region-flags/svg/US-${code}.svg`, 'utf8');
  stateFlags.push({ c: code, s: optimize(raw, { multipass: true, floatPrecision: 1, plugins: ['preset-default', 'removeDimensions'] }).data });
  states.push({ c: code, n, a: [], r, cap, caps: [cap, ...(stateCapAlts[code] || [])], k: 'state' });
}
fs.writeFileSync('public/data/states.json', JSON.stringify(states));
writeImages('public/data/state-flags.json', stateFlags);
console.log(states.length, 'states');

/* ---------------- Maps (answer feedback) ---------------- */
const topo = require('topojson-client');
const { geoNaturalEarth1, geoPath, geoContains } = await import('d3-geo');
const r1 = n => Math.round(n * 10) / 10;
const box = b => [r1(b[0][0]), r1(b[0][1]), r1(b[1][0]), r1(b[1][1])];
// Main-polygon bounds and center for zooming (ignores far-flung islands and antimeridian wrap)
function mainInfo(path, geom) {
  const polys = geom.type === 'MultiPolygon' ? geom.coordinates.map(c => ({ type: 'Polygon', coordinates: c })) : [geom];
  let best = null, bestA = -1;
  for (const p of polys) { const a = path.area(p); if (a > bestA) { bestA = a; best = p; } }
  const c = path.centroid(best);
  return { b: box(path.bounds(best)), p: [r1(c[0]), r1(c[1])], a: bestA };
}

// World
const world = require('world-atlas/countries-50m.json');
const wfc = topo.feature(world, world.objects.countries);
const ccnTo2 = {}; all.forEach(c => { if (c.ccn3) ccnTo2[c.ccn3] = c.cca2; });
const nameTo2 = { 'Kosovo': 'XK', 'Somaliland': 'SO', 'N. Cyprus': 'CY' }; // recognized-border assignments
const ourCodes = new Set(countries.map(c => c.c));
const W = 1000;
const proj = geoNaturalEarth1().fitWidth(W, { type: 'Sphere' });
const wpath = geoPath(proj).digits(1);
const wshapes = [], winfo = {};
const addInfo = (code, geom, path) => {
  const m = mainInfo(path, geom);
  if (!winfo[code] || m.a > winfo[code].a) winfo[code] = m;
};
for (const f of wfc.features) {
  if (f.id === '010') continue; // Antarctica
  let code = ccnTo2[f.id] || nameTo2[f.properties.name] || null;
  if (code && !ourCodes.has(code)) code = null;
  let geom = f.geometry;
  if (code === 'RU' && geom.type === 'MultiPolygon') {
    // Crimea: drawn as part of Ukraine, per its internationally recognized border
    const isCrimea = c => geoContains({ type: 'Polygon', coordinates: c }, [34.1, 44.95]);
    const crimea = geom.coordinates.filter(isCrimea);
    if (crimea.length) {
      geom = { type: 'MultiPolygon', coordinates: geom.coordinates.filter(c => !isCrimea(c)) };
      const cg = { type: 'MultiPolygon', coordinates: crimea };
      wshapes.push({ c: 'UA', d: wpath(cg) });
    }
  }
  wshapes.push({ c: code, d: wpath(geom) });
  if (code) addInfo(code, geom, wpath);
}
const allB = wfc.features.filter(f => f.id !== '010').map(f => wpath.bounds(f));
const wy0 = Math.min(...allB.map(b => b[0][1])), wy1 = Math.max(...allB.map(b => b[1][1]));
// Too small for the 50m data (e.g. Tuvalu, Gibraltar): a marker at the country's coordinates
const wmarkers = {};
for (const c of all) {
  if (!ourCodes.has(c.cca2) || winfo[c.cca2] || !c.latlng) continue;
  const p = proj([c.latlng[1], c.latlng[0]]);
  wmarkers[c.cca2] = 1;
  winfo[c.cca2] = { b: [r1(p[0]), r1(p[1]), r1(p[0]), r1(p[1])], p: [r1(p[0]), r1(p[1])], a: 0 };
}
for (const k in winfo) delete winfo[k].a;
fs.writeFileSync('public/data/world-map.json', JSON.stringify({ vb: [0, r1(wy0), W, r1(wy1 - wy0)], shapes: wshapes, info: winfo, markers: Object.keys(wmarkers) }));
console.log('world map:', wshapes.length, 'shapes,', Object.keys(winfo).length, 'located,', Object.keys(wmarkers).length, 'as markers;', countries.filter(c => !winfo[c.c]).map(c => c.c).join(' ') || 'none missing');

// US states (already projected: Albers USA, Alaska and Hawaii inset)
const us = require('us-atlas/states-albers-10m.json');
const ufc = topo.feature(us, us.objects.states);
const upath = geoPath(null).digits(1);
const nameToState = Object.fromEntries(STATES.map(([code, n]) => [n, code]));
const ushapes = [], uinfo = {};
for (const f of ufc.features) {
  const code = nameToState[f.properties.name] || null;
  ushapes.push({ c: code, d: upath(f.geometry) });
  if (code) { const m = mainInfo(upath, f.geometry); delete m.a; uinfo[code] = m; }
}
fs.writeFileSync('public/data/us-map.json', JSON.stringify({ vb: [0, 0, 975, 610], shapes: ushapes, info: uinfo, markers: [] }));
console.log('us map:', ushapes.length, 'shapes,', Object.keys(uinfo).length, 'states located');
