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
// Population: World Bank (datasets/population on GitHub), latest year for each country
const popCsv = await (await fetch('https://raw.githubusercontent.com/datasets/population/main/data/population.csv')).text();
const POP = {};
for (const line of popCsv.trim().split(/\r?\n/).slice(1)) {
  const parts = line.split(',');
  const val = parts.pop(), year = parts.pop(), iso3 = parts.pop();
  if (!/^[A-Z0-9]{3}$/.test(iso3) || !/^\d{4}$/.test(year) || !val) continue;
  if (!POP[iso3] || +year > POP[iso3].y) POP[iso3] = { y: +year, v: Math.round(+val) };
}
const cca3to2 = Object.fromEntries(all.map(c => [c.cca3, c.cca2]));
const PHONE_FIX = { VA: '+39', SH: '+290' }; // Vatican City uses Italy's +39; Saint Helena is +290
const phoneOf = c => {
  if (PHONE_FIX[c.cca2]) return PHONE_FIX[c.cca2];
  const r = c.idd && c.idd.root; if (!r) return '';
  const sx = c.idd.suffixes || [];
  return sx.length === 1 ? r + sx[0] : r;
};
// flag-icons draws a few countries with their plain civil flag. Use the flag most people know instead.
// Costa Rica: the state flag, with the coat of arms (niemela/flags, from Wikimedia Commons, public domain).
const FLAG_OVERRIDE = { CR: 'https://raw.githubusercontent.com/niemela/flags/master/data/CR_state.svg' };
const flagOverride = {};
for (const [code, url] of Object.entries(FLAG_OVERRIDE)) flagOverride[code] = await (await fetch(url)).text();
// Countries that drive on the left (everything else drives on the right)
const LEFT = new Set(('AG AU BS BD BB BT BW BN CY DM FJ GD GY IN ID IE JM JP KE KI LS MW MY MV MT MU MZ NA NR NP NZ PK PG KN LC VC WS SC SG SB ZA LK SR SZ TZ TH TL TO TT TV UG GB ZM ZW ' +
  'AI BM VG KY FK GG IM JE MS SH TC CK NU NF PN HK MO VI CC CX TK').split(' '));
// Other accepted spellings of demonyms
const DEMONYM_ALTS = { KM: ['Comorian'], LS: ['Basotho', 'Lesothan'], BW: ['Batswana', 'Botswanan'], GB: ['Briton'], NL: ['Netherlander'], PH: ['Philippine'], MG: ['Madagascan'], CI: ['Ivoirian'], US: ['US American'] };
// Countries that sit on two continents: the other one is also accepted
const ALSO_CONTINENT = { RU: 'Asia', TR: 'Europe', KZ: 'Europe', AZ: 'Europe', GE: 'Europe', AM: 'Europe', CY: 'Asia', EG: 'Asia', PA: 'South America' };
const countries = [], flags = [];
for (const c of all) {
  const code = c.cca2;
  let kind = null;
  if (c.unMember || extraCountries.includes(code)) kind = 'country';
  else if (territories.includes(code)) kind = 'territory';
  if (!kind) continue;
  flags.push({ c: code, s: svgo(flagOverride[code] || fs.readFileSync(`node_modules/flag-icons/flags/4x3/${code.toLowerCase()}.svg`, 'utf8')) });
  const alt = new Set([c.name.common, c.name.official, ...(aliases[code] || []), ...c.altSpellings.filter(a => a.length > 3 && /^[\x00-\x7F]+$/.test(a))]);
  const caps = capitalFix[code] || [...(c.capital || [])];
  const cur = Object.values(c.currencies || {}).map(x => x.name);
  const lang = Object.values(c.languages || {});
  const pop = POP[c.cca3] || (code === 'XK' ? POP.XKX : null);
  countries.push({
    c: code, n: c.name.common, a: [...alt].filter(x => x !== c.name.common), r: regionOf(c), sr: c.subregion, cap: caps[0] || '', caps, k: kind,
    cur, lang, tld: (c.tld || [])[0] || '', ph: phoneOf(c),
    nb: (c.borders || []).map(x => cca3to2[x]).filter(x => x && (extraCountries.includes(x) || all.find(y => y.cca2 === x && (y.unMember || territories.includes(x))))),
    area: c.area < 10 ? Math.round(c.area * 100) / 100 : Math.round(c.area), pop: pop ? pop.v : null, popY: pop ? pop.y : null,
    dem: (c.demonyms && c.demonyms.eng && c.demonyms.eng.m) || '', dems: [...(c.demonyms && c.demonyms.eng && c.demonyms.eng.f !== c.demonyms.eng.m ? [c.demonyms.eng.f] : []), ...(DEMONYM_ALTS[code] || [])],
    drive: LEFT.has(code) ? 'Left' : 'Right', ll: !!c.landlocked, conta: ALSO_CONTINENT[code] ? [ALSO_CONTINENT[code]] : []
  });
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
// Best-known nickname of each state (other common ones are accepted when typed)
const NICK = {
  AL: 'Yellowhammer State', AK: 'The Last Frontier', AZ: 'Grand Canyon State', AR: 'The Natural State', CA: 'Golden State', CO: 'Centennial State',
  CT: 'Constitution State', DE: 'First State', FL: 'Sunshine State', GA: 'Peach State', HI: 'Aloha State', ID: 'Gem State', IL: 'Prairie State',
  IN: 'Hoosier State', IA: 'Hawkeye State', KS: 'Sunflower State', KY: 'Bluegrass State', LA: 'Pelican State', ME: 'Pine Tree State',
  MD: 'Old Line State', MA: 'Bay State', MI: 'Great Lakes State', MN: 'North Star State', MS: 'Magnolia State', MO: 'Show-Me State',
  MT: 'Treasure State', NE: 'Cornhusker State', NV: 'Silver State', NH: 'Granite State', NJ: 'Garden State', NM: 'Land of Enchantment',
  NY: 'Empire State', NC: 'Tar Heel State', ND: 'Peace Garden State', OH: 'Buckeye State', OK: 'Sooner State', OR: 'Beaver State',
  PA: 'Keystone State', RI: 'Ocean State', SC: 'Palmetto State', SD: 'Mount Rushmore State', TN: 'Volunteer State', TX: 'Lone Star State',
  UT: 'Beehive State', VT: 'Green Mountain State', VA: 'Old Dominion', WA: 'Evergreen State', WV: 'Mountain State', WI: 'Badger State', WY: 'Equality State'
};
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
  states.push({ c: code, n, a: [], r, cap, caps: [cap, ...(stateCapAlts[code] || [])], k: 'state', nick: NICK[code] });
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

/* ---------------- Nature: lakes, rivers, mountain ranges (Natural Earth 1:50m, public domain) ---------------- */
const NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/';
const getJSON = async f => (await fetch(NE + f)).json();
const [neLakes, neRivers, neRegions] = await Promise.all([getJSON('ne_50m_lakes.geojson'), getJSON('ne_50m_rivers_lake_centerlines.geojson'), getJSON('ne_50m_geography_regions_polys.geojson')]);
const neName = p => p.name_en || p.name || p.NAME_EN || p.NAME || '';
// [display name, Natural Earth names to merge, other accepted answers, optional longitude window [min,max]]
const LAKES = [
  ['Lake Baikal', ['Baikal'], ['Baikal']], ['Lake Victoria', ['Victoria', 'Nyanza'], ['Victoria', 'Victoria Nyanza']], ['Lake Tanganyika', ['Tanganyika'], ['Tanganyika']],
  ['Lake Malawi', ['Malawi'], ['Malawi', 'Lake Nyasa', 'Nyasa']], ['Lake Superior', ['Superior'], ['Superior']], ['Lake Michigan', ['Michigan'], ['Michigan']],
  ['Lake Huron', ['Huron'], ['Huron']], ['Lake Erie', ['Erie'], ['Erie']], ['Lake Ontario', ['Ontario'], ['Ontario']],
  ['Great Bear Lake', ['Great Bear'], ['Great Bear']], ['Great Slave Lake', ['Great Slave'], ['Great Slave']], ['Lake Winnipeg', ['Winnipeg'], ['Winnipeg']],
  ['Lake Athabasca', ['Athabasca'], ['Athabasca']], ['Reindeer Lake', ['Reindeer'], ['Reindeer']], ['Lake Titicaca', ['Titicaca'], ['Titicaca']],
  ['Lake Ladoga', ['Ladoga'], ['Ladoga']], ['Lake Onega', ['Onega'], ['Onega']], ['Lake Balkhash', ['Balkhash'], ['Balkhash']],
  ['Lake Chad', ['Chad'], ['Chad']], ['Lake Turkana', ['Turkana'], ['Turkana', 'Lake Rudolf']], ['Lake Vänern', ['Vänern'], ['Vanern', 'Vänern']],
  ['Issyk-Kul', ['Issyk-Kul'], ['Lake Issyk-Kul', 'Issyk Kul']], ['Tonlé Sap', ['Tonlé Sap'], ['Tonle Sap']], ['Lake Geneva', ['Geneva'], ['Geneva', 'Lac Léman', 'Lake Leman']],
  ['Lake Constance', ['Constance'], ['Constance', 'Bodensee']], ['Lake Nicaragua', ['Nicaragua'], ['Nicaragua']], ['Great Salt Lake', ['Great Salt'], ['Great Salt']],
  ['Dead Sea', ['Dead Sea'], []], ['Lake Volta', ['Volta'], ['Volta']], ['Lake Kariba', ['Kariba'], ['Kariba']], ['Lake Nasser', ['Nasser'], ['Nasser']],
  ['Lake Albert', ['Albert'], ['Albert']], ['Lake Kivu', ['Kivu'], ['Kivu']], ['Lake Tana', ['Tana'], ['Tana']], ['Lake Urmia', ['Urmia'], ['Urmia']],
  ['Lake Van', ['Van'], ['Van']], ['Qinghai Lake', ['Qinghai'], ['Qinghai', 'Koko Nor']], ['Poyang Lake', ['Poyang'], ['Poyang']],
  ['Lake Okeechobee', ['Okeechobee'], ['Okeechobee']], ['Lake of the Woods', ['Woods'], []], ['Lake Champlain', ['Champlain'], ['Champlain']],
  ['Lake Tahoe', ['Tahoe'], ['Tahoe']], ['Lake Inari', ['Inari'], ['Inari']], ['Lake Peipus', ['Peipus', 'Pihkva'], ['Peipus']], ['Lake Balaton', ['Balaton'], ['Balaton']],
  ['Lake Sevan', ['Sevan'], ['Sevan']], ['Lake Toba', ['Toba'], ['Toba']], ['Aral Sea', ['North Aral Sea', 'South Aral Sea'], ['Aral']],
  ['Lake Mead', ['Mead'], ['Mead']], ['Lake Taupō', ['Taupo'], ['Taupo', 'Lake Taupo']], ['Sea of Galilee', ['Sea of Galilee'], ['Lake Tiberias', 'Kinneret', 'Lake Kinneret']],
  ['Lake Biwa', ['Biwa'], ['Biwa']], ['Lake Saimaa', ['Saimaa'], ['Saimaa']], ['Lough Neagh', ['Neagh'], ['Neagh', 'Lake Neagh']], ['Lake Skadar', ['Skadar'], ['Skadar', 'Lake Scutari']],
  ['Lake Eyre', ['Eyre North', 'Eyre South'], ['Eyre', 'Kati Thanda']], ['Lake Chapala', ['Chapala'], ['Chapala']], ['Lake Khövsgöl', ['Khövsgöl Nuur'], ['Khovsgol', 'Lake Khovsgol']]
];
const RIVERS = [
  ['Nile', ['Nile', 'White Nile', 'Mountain Nile', 'Albert Nile', 'Victoria Nile'], ['Nile River', 'River Nile']], ['Blue Nile', ['Blue Nile', 'Abay'], []],
  ['Amazon', ['Amazonas'], ['Amazon River', 'Amazonas']], ['Yangtze', ['Yangtze', 'Tongtian', 'Tuotuo'], ['Chang Jiang', 'Yangtze River']],
  ['Mississippi', ['Mississippi'], ['Mississippi River']], ['Missouri', ['Missouri'], ['Missouri River']], ['Yenisei', ['Yenisey', 'Verkhniy Yenisey'], ['Yenisey']],
  ['Ob', ['Ob'], ['Ob River']], ['Irtysh', ['Irtysh', 'Ertis'], []], ['Lena', ['Lena'], []], ['Amur', ['Amur'], ['Heilong Jiang']],
  ['Congo', ['Congo', 'Lualaba'], ['Congo River', 'Zaire']], ['Mekong', ['Mekong'], ['Mekong River']], ['Niger', ['Niger'], ['Niger River']],
  ['Volga', ['Volga'], ['Volga River']], ['Danube', ['Danube'], ['Danube River', 'Donau']], ['Rhine', ['Rhine', 'Rhein'], ['Rhein']],
  ['Ganges', ['Ganges'], ['Ganga']], ['Indus', ['Indus'], []], ['Brahmaputra', ['Brahmaputra', 'Dihang'], ['Yarlung Tsangpo']],
  ['Yellow River', ['Huang', 'Yellow'], ['Huang He', 'Yellow']], ['Euphrates', ['Euphrates', 'Firat', 'Al Furat'], []], ['Tigris', ['Tigris', 'Dicle'], []],
  ['Zambezi', ['Zambezi'], ['Zambesi']], ['Orinoco', ['Orinoco'], []], ['Paraná', ['Paraná'], ['Parana']], ['Mackenzie', ['Mackenzie'], []],
  ['Yukon', ['Yukon'], []], ['St. Lawrence', ['St. Lawrence'], ['Saint Lawrence']], ['Columbia', ['Columbia'], []],
  ['Colorado', ['Colorado'], ['Colorado River'], [-125, -100]], ['Rio Grande', ['Rio Grande'], ['Río Bravo', 'Rio Bravo']], ['Murray', ['Murray'], []],
  ['Darling', ['Darling', 'Barwon'], []], ['Dnieper', ['Dnieper', 'Dnepre'], ['Dnipro']], ['Don', ['Don'], []], ['Elbe', ['Elbe'], []],
  ['Seine', ['Seine'], []], ['Loire', ['Loire'], []], ['Thames', ['Thames'], []], ['Oder', ['Oder'], ['Odra']], ['Vistula', ['Vistula'], ['Wisła', 'Wisla']],
  ['Po', ['Po'], [], [5, 15]], ['Rhône', ['Rhône'], ['Rhone']], ['Tagus', ['Tagus', 'Tajo'], ['Tejo', 'Tajo']], ['Ebro', ['Ebro'], []], ['Ohio', ['Ohio'], []],
  ['Irrawaddy', ['Ayeyarwady', 'Irrawaddy Delta'], ['Ayeyarwady']], ['Salween', ['Salween', 'Nu'], []], ['Orange', ['Orange'], []], ['Limpopo', ['Limpopo'], []],
  ['Senegal', ['Sénégal'], ['Sénégal']], ['São Francisco', ['São  Francisco'], ['Sao Francisco']], ['Madeira', ['Madeira'], []],
  ['Ural', ['Ural'], []], ['Kolyma', ['Kolyma'], []], ['Syr Darya', ['Syr Darya'], []], ['Amu Darya', ['Amu  Darya'], ['Oxus']], ['Jordan', ['Jordan'], []]
];
const RANGES = [
  ['Himalayas', ['Himalayas'], ['Himalaya', 'Himalayan Mountains']], ['Andes', ['Andes'], ['Andes Mountains']], ['Rocky Mountains', ['Rocky Mountains'], ['Rockies']],
  ['Alps', ['Alps'], ['The Alps']], ['Ural Mountains', ['Ural Mountains'], ['Urals']], ['Appalachian Mountains', ['Appalachian Mountains'], ['Appalachians']],
  ['Atlas Mountains', ['Atlas Mountains', 'High Atlas', 'Anti-Atlas', 'Saharan Atlas'], ['Atlas']], ['Caucasus Mountains', ['Caucasus Mountains', 'Lesser Caucasus'], ['Caucasus']],
  ['Carpathian Mountains', ['Carpathian Mountains'], ['Carpathians']], ['Pyrenees', ['Pyrenees'], []], ['Zagros Mountains', ['Zagros Mountains'], ['Zagros']],
  ['Hindu Kush', ['Hindu Kush'], []], ['Tian Shan', ['Tian Shan'], ['Tien Shan']], ['Altai Mountains', ['Altai Mountains'], ['Altai']],
  ['Great Dividing Range', ['Great Dividing Range'], []], ['Sierra Madre Occidental', ['Sierra Madre Occidental'], []], ['Sierra Madre Oriental', ['Sierra Madre Oriental'], []],
  ['Scandinavian Mountains', ['Scandinavian Mountains'], ['Scandes']], ['Drakensberg', ['Drakensberg'], []], ['Ethiopian Highlands', ['Ethiopian Highlands'], []],
  ['Kunlun Mountains', ['Kunlun Mountains'], ['Kunlun']], ['Karakoram', ['Karakoram'], []], ['Pamir Mountains', ['Pamir mountains'], ['Pamirs', 'Pamir']],
  ['Dinaric Alps', ['Dinaric Alps'], []], ['Balkan Mountains', ['Balkan Mountains'], ['Stara Planina']], ['Sierra Nevada', ['Sierra Nevada'], [], [-125, -110]],
  ['Cascade Range', ['Cascade Range'], ['Cascades']], ['Brooks Range', ['Brooks Range'], []], ['Alaska Range', ['Alaska Range'], []], ['Coast Mountains', ['Coast Mountains'], []],
  ['Verkhoyansk Range', ['Verkhoyansk Range'], []], ['Alborz Mountains', ['Elburz Mountains'], ['Elburz', 'Alborz']], ['Western Ghats', ['Western Ghats'], []],
  ['Eastern Ghats', ['Eastern Ghats'], []], ['Annamite Range', ['Annamite Range'], ['Annamites', 'Truong Son']], ['Southern Alps', ['Southern Alps/Kā Tiritiri o te Moana'], ['Kā Tiritiri o te Moana']],
  ['Tibesti Mountains', ['Tibesti Mountains'], ['Tibesti']], ['Guiana Highlands', ['Guiana Highlands'], []], ['Sikhote-Alin', ['Sikhote-Alin'], []],
  ['Qinling Mountains', ['Qinling'], ['Qinling']], ['Pontic Mountains', ['Pontic Mountains'], []], ['Cantabrian Mountains', ['Cantabrian Mountains'], []]
];
const countryFeats = wfc.features.filter(f => f.id !== '010').map(f => ({ f, code: ccnTo2[f.id] || nameTo2[f.properties.name] || null })).filter(x => x.code && ourCodes.has(x.code));
const regionByCode = Object.fromEntries(countries.map(c => [c.c, c.r]));
function coordsOf(geom) {
  const out = [], walk = a => typeof a[0] === 'number' ? out.push(a) : a.forEach(walk);
  walk(geom.coordinates); return out;
}
function countriesTouched(geom) {
  const pts = coordsOf(geom), step = Math.max(1, Math.floor(pts.length / 60)), hits = new Map();
  for (let i = 0; i < pts.length; i += step) {
    const hit = countryFeats.find(x => geoContains(x.f, pts[i]));
    if (hit) hits.set(hit.code, (hits.get(hit.code) || 0) + 1);
  }
  return [...hits.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
}
function buildFeatures(list, source, type, cla) {
  const out = [];
  for (const [n, neNames, alts, lon] of list) {
    const parts = source.features.filter(f => neNames.includes(neName(f.properties)) && (!cla || f.properties.FEATURECLA === cla) && (!lon || (() => { const c = coordsOf(f.geometry); const x = c.reduce((s, p) => s + p[0], 0) / c.length; return x >= lon[0] && x <= lon[1]; })()));
    if (!parts.length) { console.warn('  missing', type, n); continue; }
    const geoms = parts.map(f => f.geometry);
    const merged = type === 'river'
      ? { type: 'MultiLineString', coordinates: geoms.flatMap(g => g.type === 'LineString' ? [g.coordinates] : g.coordinates) }
      : { type: 'MultiPolygon', coordinates: geoms.flatMap(g => g.type === 'Polygon' ? [g.coordinates] : g.coordinates) };
    const cc = countriesTouched(merged);
    const b = wpath.bounds(merged), c = wpath.centroid(merged);
    const id = type + '-' + n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    out.push({ c: id, n, a: alts, t: type, r: regionByCode[cc[0]] || 'Asia', cc, d: wpath(merged), b: [r1(b[0][0]), r1(b[0][1]), r1(b[1][0]), r1(b[1][1])], p: [r1(c[0]), r1(c[1])] });
  }
  return out;
}
/* Mountain peaks: [name, Natural Earth name (for the location), other names, height in m, countries, [lon, lat] if Natural Earth lacks it] */
const PEAKS = [
  ['Mount Everest', 'Mount Everest', ['Everest', 'Sagarmatha', 'Chomolungma'], 8849, ['NP', 'CN']],
  ['K2', 'K2', ['Mount Godwin-Austen', 'Chhogori'], 8611, ['PK', 'CN']],
  ['Kangchenjunga', 'Kanchenjunga', ['Kanchenjunga'], 8586, ['NP', 'IN']],
  ['Dhaulagiri', 'Dhaulagiri', [], 8167, ['NP']],
  ['Annapurna', null, ['Annapurna I'], 8091, ['NP'], [83.82, 28.6]],
  ['Nanga Parbat', 'Nanga Parbat', [], 8126, ['PK']],
  ['Nanda Devi', 'Nanda Devi', [], 7816, ['IN']],
  ['Ismoil Somoni Peak', 'Pik Imeni Ismail Samani', ['Ismail Samani Peak', 'Communism Peak'], 7495, ['TJ']],
  ['Jengish Chokusu', 'Pik Pobeda', ['Victory Peak', 'Pik Pobeda'], 7439, ['KG', 'CN']],
  ['Mount Kailash', 'Kailash', ['Kailash'], 6638, ['CN']],
  ['Aconcagua', 'Cerro Aconcagua', ['Cerro Aconcagua'], 6961, ['AR']],
  ['Ojos del Salado', 'Nevado Ojos del Salado', [], 6893, ['AR', 'CL']],
  ['Huascarán', 'Nevado Huascarán', ['Huascaran'], 6768, ['PE']],
  ['Illimani', 'Nevado Illimani', [], 6438, ['BO']],
  ['Chimborazo', 'Chimborazo', [], 6263, ['EC']],
  ['Cotopaxi', null, [], 5897, ['EC'], [-78.44, -0.68]],
  ['Pico Bolívar', 'Pico Bolívar', ['Pico Bolivar'], 4978, ['VE']],
  ['Denali', 'Denali', ['Mount McKinley'], 6190, ['US']],
  ['Mount Logan', 'Mount Logan', ['Logan'], 5959, ['CA']],
  ['Pico de Orizaba', 'Pico de Orizaba', ['Citlaltépetl', 'Orizaba'], 5636, ['MX']],
  ['Popocatépetl', 'Volcán Popocatépetl', ['Popocatepetl'], 5426, ['MX']],
  ['Mount Whitney', 'Mount Whitney', ['Whitney'], 4421, ['US']],
  ['Mount Elbert', 'Mount Elbert', ['Elbert'], 4401, ['US']],
  ['Mount Rainier', 'Mount Rainier', ['Rainier', 'Tahoma'], 4392, ['US']],
  ['Mauna Kea', 'Mauna Kea', [], 4207, ['US']],
  ['Mount Hood', null, ['Hood'], 3429, ['US'], [-121.7, 45.37]],
  ['Mount St. Helens', null, ['Mount Saint Helens', 'St Helens'], 2549, ['US'], [-122.19, 46.19]],
  ['Mount Washington', null, [], 1917, ['US'], [-71.3, 44.27]],
  ['Kilimanjaro', 'Mount Kilimanjaro', ['Mount Kilimanjaro', 'Kibo'], 5895, ['TZ']],
  ['Mount Kenya', 'Mount Kenya', [], 5199, ['KE']],
  ['Mount Stanley', 'Mount Stanley', ['Rwenzori', 'Margherita Peak'], 5109, ['CD', 'UG']],
  ['Mount Elgon', 'Mount Elgon', ['Elgon'], 4321, ['UG', 'KE']],
  ['Ras Dashen', 'Ras Dejen', ['Ras Dejen'], 4550, ['ET']],
  ['Toubkal', 'Jebel Toubkal', ['Jebel Toubkal'], 4167, ['MA']],
  ['Mount Cameroon', null, [], 4040, ['CM'], [9.17, 4.2]],
  ['Table Mountain', null, [], 1085, ['ZA'], [18.4, -33.96]],
  ['Mount Sinai', null, ['Jabal Musa'], 2285, ['EG'], [33.97, 28.54]],
  ['Mount Elbrus', 'Gora Elbrus', ['Elbrus'], 5642, ['RU']],
  ['Mont Blanc', 'Mont Blanc', ['Monte Bianco'], 4806, ['FR', 'IT']],
  ['Matterhorn', 'Matterhorn', ['Monte Cervino', 'Cervin'], 4478, ['CH', 'IT']],
  ['Zugspitze', null, [], 2962, ['DE', 'AT'], [10.98, 47.42]],
  ['Mount Olympus', null, ['Olympus'], 2918, ['GR'], [22.36, 40.09]],
  ['Mount Etna', null, ['Etna'], 3357, ['IT'], [14.99, 37.75]],
  ['Mount Vesuvius', null, ['Vesuvius'], 1281, ['IT'], [14.43, 40.82]],
  ['Ben Nevis', null, [], 1345, ['GB'], [-5.0, 56.8]],
  ['Mount Ararat', 'Mount Ararat', ['Ararat', 'Ağrı Dağı'], 5137, ['TR']],
  ['Mount Damavand', 'Mount Damavand', ['Damavand'], 5609, ['IR']],
  ['Klyuchevskaya Sopka', 'Klyuchevskaya Sopka', ['Klyuchevskaya'], 4754, ['RU']],
  ['Mount Fuji', null, ['Fuji', 'Fujisan'], 3776, ['JP'], [138.73, 35.36]],
  ['Mount Kinabalu', 'Gunung Kinabalu', ['Kinabalu'], 4095, ['MY']],
  ['Mayon', null, ['Mayon Volcano', 'Mount Mayon'], 2463, ['PH'], [123.69, 13.26]],
  ['Puncak Jaya', 'Puncak Jaya', ['Carstensz Pyramid'], 4884, ['ID']],
  ['Mount Wilhelm', 'Mount Wilhelm', [], 4509, ['PG']],
  ['Aoraki / Mount Cook', null, ['Mount Cook', 'Aoraki'], 3724, ['NZ'], [170.14, -43.59]],
  ['Mount Kosciuszko', null, ['Kosciuszko', 'Kosciusko'], 2228, ['AU'], [148.26, -36.46]]
];
const slug = (t, n) => t + '-' + n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const neElev = await getJSON('ne_10m_geography_regions_elevation_points.geojson');
const pointFeature = (t, n, alts, lonlat, cc, extra) => {
  const [x, y] = proj(lonlat).map(r1);
  return { c: slug(t, n), n, a: alts, t, r: regionByCode[cc[0]], cc, b: [x, y, x, y], p: [x, y], ...extra };
};
const peaks = PEAKS.map(([n, ne, alts, el, cc, ll]) => {
  const f = ne && neElev.features.find(f => f.properties.name === ne);
  if (ne && !f) console.warn('  missing peak', n);
  const lonlat = ll || f.geometry.coordinates;
  return pointFeature('peak', n, alts, lonlat, cc, { el });
});

/* Seas, gulfs and straits: [name, Natural Earth name, other names, region, kind] (Natural Earth 1:50m, straits from 1:10m) */
const SEAS = [
  ['Mediterranean Sea', 'Mediterranean Sea', ['Mediterranean'], 'Europe', 'sea'], ['Caribbean Sea', 'Caribbean Sea', ['Caribbean'], 'North America', 'sea'],
  ['Red Sea', 'Red Sea', [], 'Africa', 'sea'], ['Black Sea', 'Black Sea', [], 'Europe', 'sea'], ['Baltic Sea', 'Baltic Sea', ['Baltic'], 'Europe', 'sea'],
  ['North Sea', 'North Sea', [], 'Europe', 'sea'], ['Norwegian Sea', 'Norwegian Sea', [], 'Europe', 'sea'], ['Barents Sea', 'Barents Sea', [], 'Europe', 'sea'],
  ['Irish Sea', 'Irish Sea', [], 'Europe', 'sea'], ['White Sea', 'White Sea', [], 'Europe', 'sea'], ['Adriatic Sea', 'Adriatic Sea', ['Adriatic'], 'Europe', 'sea'],
  ['Aegean Sea', 'Aegean Sea', ['Aegean'], 'Europe', 'sea'], ['Ionian Sea', 'Ionian Sea', [], 'Europe', 'sea'], ['Tyrrhenian Sea', 'Tyrrhenian Sea', [], 'Europe', 'sea'],
  ['Arabian Sea', 'Arabian Sea', [], 'Asia', 'sea'], ['Andaman Sea', 'Andaman Sea', [], 'Asia', 'sea'], ['South China Sea', 'South China Sea', [], 'Asia', 'sea'],
  ['East China Sea', 'East China Sea', [], 'Asia', 'sea'], ['Yellow Sea', 'Yellow Sea', [], 'Asia', 'sea'], ['Sea of Japan', 'Sea of Japan', ['East Sea'], 'Asia', 'sea'],
  ['Sea of Okhotsk', 'Sea of Okhotsk', ['Okhotsk'], 'Asia', 'sea'], ['Philippine Sea', 'Philippine Sea', [], 'Asia', 'sea'], ['Java Sea', 'Java Sea', [], 'Asia', 'sea'],
  ['Celebes Sea', 'Celebes Sea', ['Sulawesi Sea'], 'Asia', 'sea'], ['Kara Sea', 'Kara Sea', [], 'Asia', 'sea'], ['Laptev Sea', 'Laptev Sea', [], 'Asia', 'sea'],
  ['Bering Sea', 'Bering Sea', [], 'North America', 'sea'], ['Chukchi Sea', 'Chukchi Sea', [], 'North America', 'sea'], ['Beaufort Sea', 'Beaufort Sea', [], 'North America', 'sea'],
  ['Labrador Sea', 'Labrador Sea', [], 'North America', 'sea'], ['Greenland Sea', 'Greenland Sea', [], 'North America', 'sea'], ['Sargasso Sea', 'Sargasso Sea', [], 'North America', 'sea'],
  ['Coral Sea', 'Coral Sea', [], 'Oceania', 'sea'], ['Tasman Sea', 'Tasman Sea', [], 'Oceania', 'sea'], ['Arafura Sea', 'Arafura Sea', [], 'Oceania', 'sea'],
  ['Gulf of Mexico', 'Gulf of Mexico', [], 'North America', 'sea'], ['Gulf of California', 'Gulf of California', ['Sea of Cortez'], 'North America', 'sea'],
  ['Gulf of Alaska', 'Gulf of Alaska', [], 'North America', 'sea'], ['Gulf of Saint Lawrence', 'Gulf of Saint Lawrence', ['Gulf of St. Lawrence'], 'North America', 'sea'],
  ['Hudson Bay', 'Hudson Bay', [], 'North America', 'sea'], ['Baffin Bay', 'Baffin Bay', [], 'North America', 'sea'], ['Bay of Fundy', 'Bay of Fundy', [], 'North America', 'sea'],
  ['Río de la Plata', 'Río de la Plata', ['River Plate', 'Rio de la Plata'], 'South America', 'sea'],
  ['Persian Gulf', 'Persian Gulf', ['Arabian Gulf', 'The Gulf'], 'Asia', 'sea'], ['Gulf of Oman', 'Gulf of Oman', [], 'Asia', 'sea'], ['Gulf of Aden', 'Gulf of Aden', [], 'Africa', 'sea'],
  ['Gulf of Thailand', 'Gulf of Thailand', ['Gulf of Siam'], 'Asia', 'sea'], ['Gulf of Tonkin', 'Gulf of Tonkin', [], 'Asia', 'sea'], ['Bay of Bengal', 'Bay of Bengal', [], 'Asia', 'sea'],
  ['Gulf of Guinea', 'Gulf of Guinea', [], 'Africa', 'sea'], ['Bay of Biscay', 'Bay of Biscay', [], 'Europe', 'sea'], ['Gulf of Bothnia', 'Gulf of Bothnia', [], 'Europe', 'sea'],
  ['Gulf of Finland', 'Gulf of Finland', [], 'Europe', 'sea'], ['Gulf of Carpentaria', 'Gulf of Carpentaria', [], 'Oceania', 'sea'], ['Great Australian Bight', 'Great Australian Bight', [], 'Oceania', 'sea'],
  ['Strait of Gibraltar', 'Strait of Gibraltar', ['Gibraltar'], 'Europe', 'strait'], ['Bosporus', 'Bosporus', ['Bosphorus'], 'Europe', 'strait'],
  ['Dardanelles', 'Dardanelles', [], 'Europe', 'strait'], ['English Channel', 'English Channel', ['La Manche'], 'Europe', 'strait'], ['Øresund', 'Øresund', ['Oresund', 'The Sound'], 'Europe', 'strait'],
  ['Denmark Strait', 'Denmark Strait', [], 'Europe', 'strait'], ['Strait of Malacca', 'Strait of Malacca', ['Malacca Strait'], 'Asia', 'strait'],
  ['Singapore Strait', 'Singapore Strait', ['Strait of Singapore'], 'Asia', 'strait'], ['Taiwan Strait', 'Taiwan Strait', ['Formosa Strait'], 'Asia', 'strait'],
  ['Korea Strait', 'Korea Strait', ['Tsushima Strait'], 'Asia', 'strait'], ['Tsugaru Strait', 'Tsugaru Strait', [], 'Asia', 'strait'], ['La Pérouse Strait', 'La Pérouse Strait', ['La Perouse Strait', 'Soya Strait'], 'Asia', 'strait'],
  ['Luzon Strait', 'Luzon Strait', [], 'Asia', 'strait'], ['Palk Strait', 'Palk Strait', [], 'Asia', 'strait'], ['Bab-el-Mandeb', 'Bab-el-Mandeb', ['Bab el Mandeb'], 'Africa', 'strait'],
  ['Mozambique Channel', 'Mozambique Channel', [], 'Africa', 'strait'], ['Florida Strait', 'Florida Strait', ['Straits of Florida'], 'North America', 'strait'],
  ['Yucatán Channel', 'Yucatán Channel', ['Yucatan Channel'], 'North America', 'strait'], ['Davis Strait', 'Davis Strait', [], 'North America', 'strait'],
  ['Hudson Strait', 'Hudson Strait', [], 'North America', 'strait'], ['Strait of Magellan', 'Strait of Magellan', ['Magellan Strait'], 'South America', 'strait'],
  ['Drake Passage', 'Drake Passage', [], 'South America', 'strait'], ['Bass Strait', 'Bass Strait', [], 'Oceania', 'strait'], ['Cook Strait', 'Cook Strait', [], 'Oceania', 'strait'],
  ['Torres Strait', 'Torres Strait', [], 'Oceania', 'strait']
];
// Two famous straits that Natural Earth doesn't draw: shown as a point
const STRAIT_POINTS = [['Strait of Hormuz', ['Hormuz'], 'Asia', [56.4, 26.55]], ['Bering Strait', [], 'North America', [-168.95, 65.8]]];
const [neMarine50, neMarine10] = await Promise.all([getJSON('ne_50m_geography_marine_polys.geojson'), getJSON('ne_10m_geography_marine_polys.geojson')]);
const seas = [];
for (const [n, ne, alts, region, st] of SEAS) {
  const src = st === 'strait' ? neMarine10 : neMarine50;
  const parts = src.features.filter(f => neName(f.properties) === ne || f.properties.name === ne);
  if (!parts.length) { console.warn('  missing sea', n); continue; }
  const merged = { type: 'MultiPolygon', coordinates: parts.flatMap(f => f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates) };
  const b = wpath.bounds(merged), c = wpath.centroid(merged);
  seas.push({ c: slug('sea', n), n, a: alts, t: 'sea', st, r: region, cc: [], d: wpath(merged), b: [r1(b[0][0]), r1(b[0][1]), r1(b[1][0]), r1(b[1][1])], p: [r1(c[0]), r1(c[1])] });
}
for (const [n, alts, region, ll] of STRAIT_POINTS) { const f = pointFeature('sea', n, alts, ll, ['XX'], { st: 'strait', pt: 1 }); f.r = region; f.cc = []; seas.push(f); }

const nature = [
  ...buildFeatures(LAKES, neLakes, 'lake'),
  ...buildFeatures(RIVERS, neRivers, 'river'),
  ...buildFeatures(RANGES, neRegions, 'range', 'Range/mtn'),
  ...peaks, ...seas
];
fs.writeFileSync('public/data/nature.json', JSON.stringify(nature));
console.log('nature:', ['lake', 'river', 'range', 'peak', 'sea'].map(t => `${nature.filter(x => x.t === t).length} ${t}s`).join(', '));

/* ---------------- Trivia: famous landmarks and former names ---------------- */
// Landmarks: [name, country, Wikipedia article (if different), other names]
const LANDMARKS = [
  ['Machu Picchu', 'PE'], ['Taj Mahal', 'IN'], ['Great Wall of China', 'CN', null, ['Great Wall']], ['Petra', 'JO'], ['The Colosseum', 'IT', 'Colosseum', ['Colosseum', 'Coliseum']],
  ['Christ the Redeemer', 'BR', 'Christ the Redeemer (statue)'], ['Chichén Itzá', 'MX', 'Chichen Itza', ['Chichen Itza']], ['Eiffel Tower', 'FR'],
  ['Statue of Liberty', 'US'], ['Big Ben', 'GB'], ['Sydney Opera House', 'AU'], ['Pyramids of Giza', 'EG', 'Giza pyramid complex', ['Great Pyramid of Giza']],
  ['Angkor Wat', 'KH'], ['Stonehenge', 'GB'], ['Acropolis of Athens', 'GR', null, ['Acropolis', 'Parthenon']], ['Leaning Tower of Pisa', 'IT'],
  ['Sagrada Família', 'ES', null, ['Sagrada Familia']], ['Alhambra', 'ES'], ['Neuschwanstein Castle', 'DE'], ['Brandenburg Gate', 'DE'],
  ['Mount Rushmore', 'US'], ['Golden Gate Bridge', 'US'], ['Grand Canyon', 'US'], ['Burj Khalifa', 'AE'], ['Hagia Sophia', 'TR'],
  ['Moai of Easter Island', 'CL', 'Moai', ['Moai', 'Easter Island']], ['Uluru', 'AU', null, ['Ayers Rock']], ['Moscow Kremlin', 'RU', null, ['Kremlin']],
  ["Saint Basil's Cathedral", 'RU', null, ["St. Basil's Cathedral"]], ['Forbidden City', 'CN'], ['Terracotta Army', 'CN', null, ['Terracotta Warriors']],
  ['Potala Palace', 'CN'], ['Fushimi Inari Shrine', 'JP', 'Fushimi Inari-taisha'], ['Himeji Castle', 'JP'], ['Kinkaku-ji', 'JP', null, ['Golden Pavilion']],
  ['Tokyo Skytree', 'JP'], ['Borobudur', 'ID'], ['Bagan', 'MM'], ['Shwedagon Pagoda', 'MM'], ['Ha Long Bay', 'VN', null, ['Halong Bay']],
  ['Petronas Towers', 'MY', null, ['Petronas Twin Towers'], 'The Petronas Twin Towers in Kuala Lumpur (Malaysia).JPG'], ['Marina Bay Sands', 'SG'], ['Golden Temple', 'IN', null, ['Harmandir Sahib']], ['Sigiriya', 'LK', null, ['Lion Rock']],
  ['Gyeongbokgung Palace', 'KR', 'Gyeongbokgung'], ['Louvre', 'FR', null, ['Louvre Museum']], ['Mont-Saint-Michel', 'FR', null, ['Mont Saint-Michel']],
  ['Palace of Versailles', 'FR', null, ['Versailles']], ['Tower Bridge', 'GB'], ['Edinburgh Castle', 'GB'], ['Cliffs of Moher', 'IE'],
  ['Atomium', 'BE'], ['Manneken Pis', 'BE'], ['The Little Mermaid', 'DK', 'The Little Mermaid (statue)', ['Little Mermaid']], ['Charles Bridge', 'CZ'],
  ['Schönbrunn Palace', 'AT', null, ['Schonbrunn Palace']], ['Trevi Fountain', 'IT'], ["St. Peter's Basilica", 'VA', null, ["Saint Peter's Basilica"]],
  ['Sistine Chapel', 'VA'], ['Meteora', 'GR'], ['Belém Tower', 'PT', null, ['Belem Tower']], ['Plitvice Lakes', 'HR', 'Plitvice Lakes National Park'],
  ['Lake Bled', 'SI', null, ['Bled']], ['Bran Castle', 'RO', null, ["Dracula's Castle"]], ['Wieliczka Salt Mine', 'PL'], ['Hallgrímskirkja', 'IS', null, ['Hallgrimskirkja']],
  ['Blue Mosque', 'TR', 'Blue Mosque, Istanbul', ['Sultan Ahmed Mosque']], ['Cappadocia', 'TR'], ['Pamukkale', 'TR'], ['Persepolis', 'IR'],
  ['Kaaba', 'SA'], ['Sheikh Zayed Grand Mosque', 'AE'], ['Abu Simbel', 'EG', 'Abu Simbel temples'], ['Valley of the Kings', 'EG'],
  ['Rock-hewn churches of Lalibela', 'ET', 'Rock-hewn Churches, Lalibela', ['Lalibela', 'Church of Saint George'], 'Ethiopia - sunset at Church of Saint George, Lalibela 01.jpg'], ['Great Mosque of Djenné', 'ML', null, ['Great Mosque of Djenne']],
  ['Hassan II Mosque', 'MA'], ['Robben Island', 'ZA'], ['CN Tower', 'CA', null, [], 'Toronto - ON - CN Tower (Bremner Blvd).jpg'], ['Château Frontenac', 'CA', null, ['Chateau Frontenac']],
  ['Hollywood Sign', 'US'], ['Space Needle', 'US'], ['White House', 'US'], ['Teotihuacan', 'MX'], ['Tikal', 'GT'], ['Panama Canal', 'PA', null, [], 'Panama Canal Miraflores Locks.jpg'],
  ['Galápagos Islands', 'EC', null, ['Galapagos Islands']], ['Salar de Uyuni', 'BO'], ['Perito Moreno Glacier', 'AR'], ['Torres del Paine', 'CL', 'Torres del Paine National Park'],
  ['Angel Falls', 'VE'], ['Sugarloaf Mountain', 'BR'], ['Milford Sound', 'NZ'], ['Great Barrier Reef', 'AU'], ['Twelve Apostles', 'AU', 'The Twelve Apostles (Victoria)'],
  // Added 2026-11-18 (names avoid giving the country away where possible)
  ['Burj Al Arab', 'AE'], ['Notre-Dame Cathedral', 'FR', 'Notre-Dame de Paris', ['Notre-Dame', 'Notre Dame', 'Notre-Dame de Paris']], ['Arc de Triomphe', 'FR'],
  ['Buckingham Palace', 'GB'], ['Westminster Abbey', 'GB'], ["Giant's Causeway", 'GB', null, ['Giants Causeway']], ['Cologne Cathedral', 'DE'],
  ['Milan Cathedral', 'IT', null, ['Duomo di Milano']], ['The Pantheon', 'IT', 'Pantheon, Rome', ['Pantheon']], ['Grand Canal of Venice', 'IT', 'Grand Canal (Venice)', ['Grand Canal']],
  ['Mount Fuji', 'JP', null, ['Fuji', 'Fujisan']], ['Itsukushima Shrine', 'JP', null, ['Itsukushima']], ['Temple of Heaven', 'CN'], ['The Bund', 'CN', null, ['Bund']],
  ['Empire State Building', 'US'], ['Times Square', 'US'], ['Las Vegas Strip', 'US', null, ['The Strip']], ['Banff National Park', 'CA', null, ['Banff']],
  ['Parliament Hill', 'CA'], ['Table Mountain', 'ZA'], ['Mount Kilimanjaro', 'TZ', null, ['Kilimanjaro']], ['Serengeti', 'TZ', 'Serengeti National Park', ['Serengeti National Park']],
  ['Great Sphinx of Giza', 'EG', null, ['Great Sphinx', 'Sphinx']], ['Karnak Temple', 'EG', 'Karnak', ['Karnak']], ['Chefchaouen', 'MA'],
  ['Lotus Temple', 'IN'], ['Hawa Mahal', 'IN', null, ['Palace of Winds']], ['Wat Arun', 'TH'], ['Grand Palace', 'TH'], ['Gardens by the Bay', 'SG'],
  ['Tanah Lot', 'ID'], ['Chocolate Hills', 'PH'], ['Palacio de Bellas Artes', 'MX', null, ['Palace of Fine Arts', 'Bellas Artes']],
  ['Copacabana Beach', 'BR', 'Copacabana, Rio de Janeiro', ['Copacabana']], ['Nazca Lines', 'PE', null, ['Nasca Lines']], ['Sydney Harbour Bridge', 'AU', null, ['Harbour Bridge']],
  ['Hobbiton', 'NZ', 'Hobbiton Movie Set', ['Hobbiton Movie Set']], ['Peterhof Palace', 'RU', null, ['Peterhof']], ['Winter Palace', 'RU', null, ['Hermitage']],
  ['Hallstatt', 'AT'], ['Walls of Dubrovnik', 'HR', null, ['Dubrovnik walls', 'Dubrovnik']], ['Prague Castle', 'CZ'],
  ['Parliament Building, Budapest', 'HU', 'Hungarian Parliament Building', ['Hungarian Parliament Building', 'Budapest Parliament']],
  ['Kinderdijk Windmills', 'NL', 'Kinderdijk', ['Kinderdijk']], ['Rijksmuseum', 'NL'], ['Pena Palace', 'PT', null, ['Palácio da Pena']], ['Santorini', 'GR'],
  ['Galata Tower', 'TR'], ['Wadi Rum', 'JO'], ["Tiger's Nest Monastery", 'BT', 'Paro Taktsang', ['Paro Taktsang', "Tiger's Nest", 'Taktsang']]
];
// Former names: [old name, current name, country, year renamed (if one clear year), city?]
const FORMER = [
  ['Burma', 'MM', 1989], ['Siam', 'TH', 1939], ['Ceylon', 'LK', 1972], ['Persia', 'IR', 1935], ['Zaire', 'CD', 1997], ['Belgian Congo', 'CD', 1960],
  ['Dahomey', 'BJ', 1975], ['Upper Volta', 'BF', 1984], ['Gold Coast', 'GH', 1957], ['Rhodesia', 'ZW', 1980], ['Northern Rhodesia', 'ZM', 1964],
  ['Nyasaland', 'MW', 1964], ['Bechuanaland', 'BW', 1966], ['Basutoland', 'LS', 1966], ['Swaziland', 'SZ', 2018], ['Abyssinia', 'ET'],
  ['Kampuchea', 'KH', 1989], ['East Pakistan', 'BD', 1971], ['Formosa', 'TW'], ['Trucial States', 'AE', 1971], ['Transjordan', 'JO', 1949],
  ['British Honduras', 'BZ', 1973], ['Dutch Guiana', 'SR'], ['British Guiana', 'GY', 1966], ['French Sudan', 'ML', 1960], ['Ubangi-Shari', 'CF'],
  ['Spanish Guinea', 'GQ', 1968], ['Portuguese Guinea', 'GW'], ['South West Africa', 'NA', 1990], ['Malagasy Republic', 'MG', 1975],
  ['New Hebrides', 'VU', 1980], ['Ellice Islands', 'TV'], ['Gilbert Islands', 'KI', 1979], ['Western Samoa', 'WS', 1997], ['Byelorussia', 'BY', 1991],
  ['Moldavia', 'MD', 1991], ['Kirghizia', 'KG', 1991], ['Macedonia', 'MK', 2019], ['Muscat and Oman', 'OM', 1970], ['Tanganyika', 'TZ', 1964],
  ['Dutch East Indies', 'ID'],
  ['Constantinople', 'Istanbul', 'TR', 1930], ['Bombay', 'Mumbai', 'IN', 1995], ['Madras', 'Chennai', 'IN', 1996], ['Calcutta', 'Kolkata', 'IN', 2001],
  ['Bangalore', 'Bengaluru', 'IN', 2014], ['Peking', 'Beijing', 'CN'], ['Canton', 'Guangzhou', 'CN'], ['Saigon', 'Ho Chi Minh City', 'VN', 1976],
  ['Leningrad', 'Saint Petersburg', 'RU', 1991], ['Stalingrad', 'Volgograd', 'RU', 1961], ['Königsberg', 'Kaliningrad', 'RU', 1946],
  ['New Amsterdam', 'New York City', 'US', 1664], ['Yerba Buena', 'San Francisco', 'US', 1847], ['Edo', 'Tokyo', 'JP', 1868],
  ['Salisbury', 'Harare', 'ZW', 1982], ['Léopoldville', 'Kinshasa', 'CD', 1966], ['Batavia', 'Jakarta', 'ID'], ['Rangoon', 'Yangon', 'MM', 1989],
  ['Christiania', 'Oslo', 'NO', 1925], ['Lourenço Marques', 'Maputo', 'MZ', 1976], ['Fort-Lamy', "N'Djamena", 'TD', 1973], ['Dacca', 'Dhaka', 'BD', 1982],
  ['Bytown', 'Ottawa', 'CA', 1855], ["Pile o' Bones", 'Regina', 'CA', 1882], ['Danzig', 'Gdańsk', 'PL'], ['Pressburg', 'Bratislava', 'SK']
];
const CITY_ALTS = { 'Saint Petersburg': ['St. Petersburg', 'St Petersburg'], 'New York City': ['New York', 'NYC'], 'Ho Chi Minh City': ['Ho Chi Minh', 'HCMC'], 'Gdańsk': ['Gdansk'], "N'Djamena": ['Ndjamena'], 'Bengaluru': ['Bangalore'] };
const countryByCode = Object.fromEntries(countries.map(c => [c.c, c]));
const trivia = [];
// img: a Wikimedia Commons file to use instead of the article's lead photo (when that one is a poor fit)
for (const [n, cc, wiki, alts, img] of LANDMARKS) {
  const ct = countryByCode[cc]; if (!ct) { console.warn('  landmark country?', n, cc); continue; }
  trivia.push({ c: slug('lm', n), n, t: 'landmark', cc, ans: ct.n, a: ct.a, alts: alts || [], r: ct.r, sr: ct.sr, wiki: wiki || n, ...(img ? { img } : {}) });
}
for (const row of FORMER) {
  const city = typeof row[1] === 'string' && row[1].length > 2;
  const [old, now, cc, year] = city ? row : [row[0], null, row[1], row[2]];
  const ct = countryByCode[cc]; if (!ct) { console.warn('  former country?', old, cc); continue; }
  trivia.push({ c: slug('was', old), n: old, t: city ? 'former-city' : 'former-country', cc, ans: city ? now : ct.n, a: city ? (CITY_ALTS[now] || []) : ct.a, r: ct.r, sr: ct.sr, y: year || null, k: ct.k });
}
fs.writeFileSync('public/data/trivia.json', JSON.stringify(trivia));
console.log('trivia:', trivia.filter(x => x.t === 'landmark').length, 'landmarks,', trivia.filter(x => x.t !== 'landmark').length, 'former names');

/* ---------------- Provinces and states of Canada, Australia, Germany and Mexico ----------------
   Outlines: Natural Earth 1:10m admin-1 (public domain), simplified with shared borders kept.
   Flags: Canada from region-flags; Australia and Germany from niemela/flags (Wikimedia Commons, public domain).
   Mexico: most states have no official flag; region-flags has the banner each state uses (usually its coat of arms on white;
   Jalisco and Tlaxcala have adopted flags). Those files are large (some embed photos), so they're stored as 300px PNGs (p: base64). */
const { Resvg } = require('@resvg/resvg-js');
const REGION_FLAGS = 'https://raw.githubusercontent.com/fonttools/region-flags/gh-pages/svg/';
const { topology } = require('topojson-server');
const { presimplify, simplify, quantile, sphericalTriangleArea } = require('topojson-simplify');
const { geoConicConformal, geoConicEqualArea } = await import('d3-geo');
const NIEMELA = 'https://raw.githubusercontent.com/niemela/flags/master/data/';
// [code, name, capital, kind, other names, other capital spellings]
const PLACES = {
  ca: { a3: 'CAN', label: 'Canada', proj: () => geoConicConformal().parallels([49, 77]).rotate([96, 0]), keep: 0.12, minA: 6,
    flags: code => fs.readFileSync(`node_modules/region-flags/svg/CA-${code}.svg`, 'utf8'),
    rows: [
      ['AB', 'Alberta', 'Edmonton', 'province'], ['BC', 'British Columbia', 'Victoria', 'province'], ['MB', 'Manitoba', 'Winnipeg', 'province'],
      ['NB', 'New Brunswick', 'Fredericton', 'province'], ['NL', 'Newfoundland and Labrador', "St. John's", 'province', ['Newfoundland'], ["Saint John's", 'St Johns']],
      ['NS', 'Nova Scotia', 'Halifax', 'province'], ['ON', 'Ontario', 'Toronto', 'province'], ['PE', 'Prince Edward Island', 'Charlottetown', 'province', ['PEI']],
      ['QC', 'Quebec', 'Quebec City', 'province', ['Québec'], ['Québec City', 'Québec']], ['SK', 'Saskatchewan', 'Regina', 'province'],
      ['NT', 'Northwest Territories', 'Yellowknife', 'territory', ['NWT']], ['NU', 'Nunavut', 'Iqaluit', 'territory'], ['YT', 'Yukon', 'Whitehorse', 'territory']
    ] },
  au: { a3: 'AUS', label: 'Australia', proj: () => geoConicEqualArea().parallels([-18, -36]).rotate([-134, 0]), keep: 0.2, minA: 4,
    flags: async code => (await fetch(`${NIEMELA}AU-${code}.svg`)).text(), drop: ['AU-X03~'],
    rows: [
      ['NSW', 'New South Wales', 'Sydney', 'state'], ['VIC', 'Victoria', 'Melbourne', 'state'], ['QLD', 'Queensland', 'Brisbane', 'state'],
      ['WA', 'Western Australia', 'Perth', 'state'], ['SA', 'South Australia', 'Adelaide', 'state'], ['TAS', 'Tasmania', 'Hobart', 'state'],
      ['ACT', 'Australian Capital Territory', 'Canberra', 'territory', ['Capital Territory']], ['NT', 'Northern Territory', 'Darwin', 'territory']
    ] },
  de: { a3: 'DEU', label: 'Germany', proj: () => geoConicConformal().parallels([48, 54]).rotate([-10.4, 0]), keep: 0.3, minA: 2,
    flags: async code => (await fetch(`${NIEMELA}DE-${code}.svg`)).text(),
    rows: [
      ['BW', 'Baden-Württemberg', 'Stuttgart', 'state'], ['BY', 'Bavaria', 'Munich', 'state', ['Bayern'], ['München']],
      ['BE', 'Berlin', 'Berlin', 'state'], ['BB', 'Brandenburg', 'Potsdam', 'state'], ['HB', 'Bremen', 'Bremen', 'state'],
      ['HH', 'Hamburg', 'Hamburg', 'state'], ['HE', 'Hesse', 'Wiesbaden', 'state', ['Hessen']],
      ['MV', 'Mecklenburg-Vorpommern', 'Schwerin', 'state', ['Mecklenburg-Western Pomerania', 'Mecklenburg']],
      ['NI', 'Lower Saxony', 'Hanover', 'state', ['Niedersachsen'], ['Hannover']], ['NW', 'North Rhine-Westphalia', 'Düsseldorf', 'state', ['Nordrhein-Westfalen', 'NRW']],
      ['RP', 'Rhineland-Palatinate', 'Mainz', 'state', ['Rheinland-Pfalz']], ['SL', 'Saarland', 'Saarbrücken', 'state'],
      ['SN', 'Saxony', 'Dresden', 'state', ['Sachsen']], ['ST', 'Saxony-Anhalt', 'Magdeburg', 'state', ['Sachsen-Anhalt']],
      ['SH', 'Schleswig-Holstein', 'Kiel', 'state'], ['TH', 'Thuringia', 'Erfurt', 'state', ['Thüringen']]
    ] },
  mx: { a3: 'MEX', label: 'Mexico', proj: () => geoConicConformal().parallels([17.5, 29.5]).rotate([102, 0]), keep: 0.25, minA: 3,
    flags: async code => (await fetch(`${REGION_FLAGS}MX-${code}.svg`)).text(), png: true, codeFix: { DIF: 'CMX' }, drop: ['MX-X01~'],
    rows: [
      ['AGU', 'Aguascalientes', 'Aguascalientes', 'state'], ['BCN', 'Baja California', 'Mexicali', 'state'], ['BCS', 'Baja California Sur', 'La Paz', 'state'],
      ['CAM', 'Campeche', 'Campeche', 'state', [], ['San Francisco de Campeche']], ['CHP', 'Chiapas', 'Tuxtla Gutiérrez', 'state', [], ['Tuxtla']],
      ['CHH', 'Chihuahua', 'Chihuahua', 'state'], ['COA', 'Coahuila', 'Saltillo', 'state'], ['COL', 'Colima', 'Colima', 'state'],
      ['CMX', 'Mexico City', 'Mexico City', 'city', ['CDMX', 'Ciudad de México']], ['DUR', 'Durango', 'Durango', 'state', [], ['Victoria de Durango']],
      ['GUA', 'Guanajuato', 'Guanajuato', 'state'], ['GRO', 'Guerrero', 'Chilpancingo', 'state'], ['HID', 'Hidalgo', 'Pachuca', 'state'],
      ['JAL', 'Jalisco', 'Guadalajara', 'state'], ['MEX', 'State of Mexico', 'Toluca', 'state', ['México', 'Estado de México', 'Mexico State']],
      ['MIC', 'Michoacán', 'Morelia', 'state'], ['MOR', 'Morelos', 'Cuernavaca', 'state'], ['NAY', 'Nayarit', 'Tepic', 'state'],
      ['NLE', 'Nuevo León', 'Monterrey', 'state'], ['OAX', 'Oaxaca', 'Oaxaca', 'state', [], ['Oaxaca de Juárez']], ['PUE', 'Puebla', 'Puebla', 'state'],
      ['QUE', 'Querétaro', 'Querétaro', 'state', [], ['Santiago de Querétaro']], ['ROO', 'Quintana Roo', 'Chetumal', 'state'],
      ['SLP', 'San Luis Potosí', 'San Luis Potosí', 'state'], ['SIN', 'Sinaloa', 'Culiacán', 'state'], ['SON', 'Sonora', 'Hermosillo', 'state'],
      ['TAB', 'Tabasco', 'Villahermosa', 'state'], ['TAM', 'Tamaulipas', 'Ciudad Victoria', 'state'], ['TLA', 'Tlaxcala', 'Tlaxcala', 'state'],
      ['VER', 'Veracruz', 'Xalapa', 'state', [], ['Jalapa']], ['YUC', 'Yucatán', 'Mérida', 'state'], ['ZAC', 'Zacatecas', 'Zacatecas', 'state']
    ] }
};
const admin1 = await getJSON('ne_10m_admin_1_states_provinces.geojson');
for (const [key, P] of Object.entries(PLACES)) {
  // Data rows
  const rows = P.rows.map(([c, n, cap, k, alts = [], capAlts = []]) => ({ c, n, a: alts, r: P.label, cap, caps: [cap, ...capAlts], k }));
  fs.writeFileSync(`public/data/${key}.json`, JSON.stringify(rows));
  if (P.flags) {
    const imgs = [];
    for (const r of rows) {
      const svg = await P.flags(r.c);
      if (!svg.trim().startsWith('<')) throw new Error('flag download failed: ' + key + ' ' + r.c);
      imgs.push(P.png ? { c: r.c, p: Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: 300 } }).render().asPng()).toString('base64') }
        : { c: r.c, s: optimize(svg, { multipass: true, floatPrecision: 1, plugins: ['preset-default', 'removeDimensions'] }).data });
    }
    writeImages(`public/data/${key}-flags.json`, imgs);
  }
  // Map: simplify in lon/lat with shared borders, then project
  const feats = admin1.features.filter(f => f.properties.adm0_a3 === P.a3 && !(P.drop || []).includes(f.properties.iso_3166_2))
    .map(f => { let c = f.properties.iso_3166_2.split('-')[1]; c = (P.codeFix || {})[c] || c; return { type: 'Feature', properties: { c }, geometry: f.geometry }; });
  let t = presimplify(topology({ a: { type: 'FeatureCollection', features: feats } }, 1e6), sphericalTriangleArea);
  t = simplify(t, quantile(t, P.keep)); // keep this share of points
  const fc = topo.feature(t, t.objects.a);
  const pj = P.proj().fitWidth(W, fc);
  const path = geoPath(pj).digits(1);
  const shapes = [], info = {}, known = new Set(rows.map(r => r.c));
  for (const f of fc.features) {
    let g = f.geometry;
    if (!g) continue;
    if (g.type === 'MultiPolygon') { // drop specks too small to see; always keep the largest part
      const parts = g.coordinates.map(c => ({ c, a: path.area({ type: 'Polygon', coordinates: c }) })).sort((x, y) => y.a - x.a);
      g = { type: 'MultiPolygon', coordinates: parts.filter((p, i) => i === 0 || p.a >= P.minA).map(p => p.c) };
    }
    const code = known.has(f.properties.c) ? f.properties.c : null;
    shapes.push({ c: code, d: path(g) });
    if (code) { const m = mainInfo(path, g); if (!info[code] || m.a > info[code].a) info[code] = m; }
  }
  for (const k in info) delete info[k].a;
  const b = path.bounds(fc);
  const pad = 8;
  fs.writeFileSync(`public/data/${key}-map.json`, JSON.stringify({ vb: [r1(b[0][0] - pad), r1(b[0][1] - pad), r1(b[1][0] - b[0][0] + 2 * pad), r1(b[1][1] - b[0][1] + 2 * pad)], shapes, info, markers: [] }));
  const missing = rows.filter(r => !info[r.c]).map(r => r.c);
  console.log(`${P.label}: ${rows.length} places, ${shapes.length} shapes${P.flags ? ', flags' : ''}${missing.length ? ', MISSING ' + missing.join(' ') : ''}`);
}
