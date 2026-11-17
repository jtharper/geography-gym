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
    area: c.area < 10 ? Math.round(c.area * 100) / 100 : Math.round(c.area), pop: pop ? pop.v : null, popY: pop ? pop.y : null
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
const nature = [
  ...buildFeatures(LAKES, neLakes, 'lake'),
  ...buildFeatures(RIVERS, neRivers, 'river'),
  ...buildFeatures(RANGES, neRegions, 'range', 'Range/mtn')
];
fs.writeFileSync('public/data/nature.json', JSON.stringify(nature));
console.log('nature:', ['lake', 'river', 'range'].map(t => `${nature.filter(x => x.t === t).length} ${t}s`).join(', '));

/* ---------------- Provinces and states of Canada, Australia, Germany and Mexico ----------------
   Outlines: Natural Earth 1:10m admin-1 (public domain), simplified with shared borders kept.
   Flags: Canada from region-flags; Australia and Germany from niemela/flags (Wikimedia Commons, public domain).
   Mexico's states have no official flags, so Mexico has no flag topics. */
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
    flags: null, codeFix: { DIF: 'CMX' }, drop: ['MX-X01~'],
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
    for (const r of rows) imgs.push({ c: r.c, s: optimize(await P.flags(r.c), { multipass: true, floatPrecision: 1, plugins: ['preset-default', 'removeDimensions'] }).data });
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
