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
