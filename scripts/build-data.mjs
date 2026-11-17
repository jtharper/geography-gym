import fs from 'fs';
import { optimize } from 'svgo';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const all = require('world-countries');
const extraCountries = ['PS','XK','TW','VA'];
const territories = 'AW AI AX AS BM CK CW KY FK FO GG GI GL GU HK IM JE MO MP MS NF NU PN PR PF SX TC VG VI TK IO GS SH CX NC'.split(' ');
const aliases = {
 US:['USA','United States of America','America'], GB:['UK','Great Britain','Britain','England'], CI:['Ivory Coast',"Cote d'Ivoire"],
 CZ:['Czech Republic'], CD:['DRC','DR Congo','Congo Kinshasa','Democratic Republic of Congo'], CG:['Congo','Republic of the Congo','Congo Brazzaville'],
 KR:['South Korea','Korea'], KP:['North Korea'], MM:['Burma'], SZ:['Swaziland'], MK:['Macedonia'], TL:['East Timor'], CV:['Cape Verde'],
 VA:['Vatican','Holy See','Vatican City'], RU:['Russia'], AE:['UAE'], NL:['Holland'], TR:['Turkey','Turkiye'], LA:['Laos'], FM:['Micronesia'],
 BA:['Bosnia'], ST:['Sao Tome'], VC:['St Vincent'], KN:['St Kitts','Saint Kitts'], LC:['St Lucia'], TT:['Trinidad'], AG:['Antigua'], PS:['Palestinian Territories'],
 VG:['BVI'], VI:['USVI'], GS:['South Georgia and the South Sandwich Islands'], SH:['Saint Helena','St Helena'], CN:['PRC'], TW:['Republic of China','ROC'],
 GM:['Gambia'], BS:['Bahamas'], PH:['Philippines'], FK:['Falklands','Malvinas'], DO:['Dominican Rep'], CF:['CAR'], GQ:['Eq Guinea'], PG:['PNG']
};
const regionOf = c => c.region==='Antarctic' ? 'South America' : c.region === 'Americas' ? (['South America'].includes(c.subregion) ? 'South America' : 'North America') : c.region;
const out = [], flags = [];
for (const c of all) {
  const code = c.cca2;
  let kind = null;
  if (c.unMember || extraCountries.includes(code)) kind = 'country';
  else if (territories.includes(code)) kind = 'territory';
  if (!kind) continue;
  const raw = fs.readFileSync(`node_modules/flag-icons/flags/4x3/${code.toLowerCase()}.svg`, 'utf8');
  const svg = optimize(raw, { multipass: true, floatPrecision: 2, plugins: ['preset-default', 'removeDimensions'] }).data;
  flags.push({ c: code, s: svg });
  const alt = new Set([c.name.common, c.name.official, ...(aliases[code]||[]), ...c.altSpellings.filter(a => a.length > 3 && /^[\x00-\x7F]+$/.test(a))]);
  out.push({ c: code, n: c.name.common, a: [...alt].filter(x => x !== c.name.common), r: regionOf(c), sr: c.subregion, cap: (c.capital||[])[0]||'', k: kind });
}
out.sort((a,b)=>a.n.localeCompare(b.n));
// fix display names
const nameFix = { CI:"Côte d'Ivoire", VA:'Vatican City', PS:'Palestine', KR:'South Korea', KP:'North Korea', MK:'North Macedonia', CD:'DR Congo', CG:'Republic of the Congo', SH:'Saint Helena', GS:'South Georgia', US:'United States', GB:'United Kingdom' };
for (const o of out) if (nameFix[o.c] && nameFix[o.c] !== o.n) { o.a.push(o.n); o.n = nameFix[o.c]; }
fs.writeFileSync('public/data/countries.json', JSON.stringify(out));
fs.writeFileSync('public/data/flags.json', '[\n' + flags.map(f=>JSON.stringify(f)).join(',\n') + '\n]\n');
console.log(out.filter(o=>o.k==='country').length, 'countries', out.filter(o=>o.k==='territory').length, 'territories');
const reg={}; out.forEach(o=>reg[o.r]=(reg[o.r]||0)+1); console.log(reg);
