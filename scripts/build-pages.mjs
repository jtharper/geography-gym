// Builds the pages search engines and link previews see:
//   public/<slug>/index.html   one page per topic (title, description, intro, play buttons, the full answer list)
//   public/quizzes/index.html  every topic
//   public/daily/index.html    the link the Daily challenge shares (sends visitors on to the game)
//   public/cards/*.png         1200×630 preview images
//   public/sitemap.xml, public/robots.txt
// Run after `npm run data`: npm run pages
import { aboutBody, privacyBody, contactBody } from './site-pages.mjs';
import fs from 'fs';
import vm from 'vm';
import { Resvg } from '@resvg/resvg-js';
import { COPY } from './topic-copy.mjs';
import { logoSVG, MARK } from './logo.mjs';

const SITE = 'https://geogym.party';
const read = f => JSON.parse(fs.readFileSync('public/' + f, 'utf8'));
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---------- topics: read straight from app.js so the pages always match the game ---------- */
const appSrc = fs.readFileSync('public/app.js', 'utf8');
const head = appSrc.slice(0, appSrc.indexOf('const TOPIC = '));
const TOPICS = vm.runInNewContext(head + ';TOPICS', {});
const VERSION = (appSrc.match(/const VERSION = "([\w-]+)"/) || [])[1] || '1';

const SLUG = {
  flags: 'flag-quiz', capitals: 'capitals-quiz', 'capitals-rev': 'capital-to-country-quiz', map: 'world-map-quiz', shapes: 'country-shapes-quiz',
  neighbors: 'neighboring-countries-quiz', area: 'country-size-quiz', population: 'population-quiz', landlocked: 'landlocked-countries-quiz',
  currencies: 'currency-quiz', languages: 'official-languages-quiz', domains: 'country-domains-quiz', phone: 'calling-codes-quiz',
  demonyms: 'demonyms-quiz', continents: 'continents-quiz', driving: 'driving-side-quiz', landmarks: 'famous-landmarks-quiz', 'landmark-photos': 'landmark-photos-quiz', former: 'former-names-quiz',
  lakes: 'lakes-quiz', rivers: 'rivers-quiz', ranges: 'mountain-ranges-quiz', peaks: 'mountain-peaks-quiz', seas: 'seas-and-straits-quiz',
  'state-flags': 'us-state-flags-quiz', 'state-capitals': 'us-state-capitals-quiz', 'state-map': 'us-states-map-quiz', 'state-shapes': 'us-state-shapes-quiz',
  'state-abbr': 'us-state-abbreviations-quiz', 'state-nicknames': 'us-state-nicknames-quiz'
};
const PLACE = { ca: ['Canada', 'Canadian', 'province', 'provinces and territories'], au: ['Australia', 'Australian', 'state', 'states and territories'],
  de: ['Germany', 'German', 'state', 'states'], mx: ['Mexico', 'Mexican', 'state', 'states'] };
for (const t of TOPICS) if (!SLUG[t.id]) {
  const [set, kind] = t.id.split('-'); const country = PLACE[set][0].toLowerCase(), one = PLACE[set][2];
  SLUG[t.id] = { flags: `${country}-${one}-flags-quiz`, capitals: `${country}-capitals-quiz`, map: `${country}-map-quiz`, shapes: `${country}-${one}-shapes-quiz`, abbr: `${country}-abbreviations-quiz` }[kind];
}

/* ---------- data ---------- */
const countries = read('data/countries.json'), states = read('data/states.json'), nature = read('data/nature.json'), trivia = read('data/trivia.json');
const places = Object.fromEntries(Object.keys(PLACE).map(k => [k, read(`data/${k}.json`)]));
const rowsOf = set => set === 'countries' ? countries : set === 'states' ? states : set === 'nature' ? nature : set === 'trivia' ? trivia : places[set];
const cname = Object.fromEntries(countries.map(c => [c.c, c.n]));
const fmtNum = n => Math.round(n).toLocaleString('en-US');
const listJoin = a => a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];

// The rows a topic asks about (default settings: whole world, no territories unless they're on by default)
function topicRows(t) {
  let rows = rowsOf(t.set);
  if (t.set === 'countries') rows = rows.filter(r => r.k === 'country' || (t.terrOn && r.k === 'territory'));
  if (t.set !== 'countries' && t.set !== 'nature' && t.set !== 'trivia' && !t.terrOn) rows = rows.filter(r => r.k !== 'territory');
  if (t.kind === 'feature') rows = rows.filter(r => r.t === t.type);
  if (t.types) rows = rows.filter(r => t.types.includes(r.t));
  if (t.kind === 'odd') rows = rows.filter(r => r[t.field]);
  if (t.kind === 'neighbors') rows = rows.filter(r => r.nb && r.nb.length);
  if (t.kind === 'compare') rows = rows.filter(r => r[t.field] > 0);
  if ((t.kind === 'fact' || t.kind === 'text') && t.field && t.field !== 'code' && t.set !== 'trivia') rows = rows.filter(r => Array.isArray(r[t.field]) ? r[t.field].length : r[t.field]);
  return rows;
}
const byName = (a, b) => a.n.localeCompare(b.n);

// The reference section: everything the topic covers, as tables or lists
function reference(t, rows) {
  const regionOrder = t.regions && t.regions.length > 1 ? t.regions.slice(1) : null;
  const grouped = (fn, cols) => {
    const groups = regionOrder && t.id !== 'continents' ? regionOrder.map(g => [g, rows.filter(r => r.r === g)]) : [[null, rows]];
    return groups.filter(([, rs]) => rs.length).map(([g, rs]) => (g ? `<h3>${esc(g)}</h3>` : '') +
      `<table><thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rs.slice().sort(byName).map(r => `<tr>${fn(r).map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table>`).join('');
  };
  const list = rs => `<ul class="cols">${rs.slice().sort(byName).map(r => `<li>${esc(r.n)}</li>`).join('')}</ul>`;
  const groupedList = () => (regionOrder ? regionOrder.map(g => [g, rows.filter(r => r.r === g)]) : [[null, rows]])
    .filter(([, rs]) => rs.length).map(([g, rs]) => (g ? `<h3>${esc(g)} <span class="n">${rs.length}</span></h3>` : '') + list(rs)).join('');
  const place = t.set === 'states' ? 'State' : PLACE[t.set] ? (PLACE[t.set][2][0].toUpperCase() + PLACE[t.set][2].slice(1)) : 'Country';
  switch (t.kind) {
    case 'flag': case 'shape': case 'locate': return groupedList();
    case 'odd': return groupedList();
    case 'neighbors': return grouped(r => [esc(r.n), esc(listJoin(r.nb.map(c => cname[c] || c)))], ['Country', 'Borders']);
    case 'compare': {
      const ranked = rows.slice().sort((a, b) => b[t.field] - a[t.field]);
      const unit = t.field === 'area' ? 'Area (km²)' : 'Population';
      return `<table><thead><tr><th>#</th><th>Country</th><th class="num">${unit}</th></tr></thead><tbody>${ranked.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.n)}</td><td class="num">${fmtNum(r[t.field])}</td></tr>`).join('')}</tbody></table>`;
    }
    case 'feature': {
      const fact = r => r.t === 'peak' ? `${fmtNum(r.el)} m · ${esc(listJoin(r.cc.map(c => cname[c] || c)))}` : r.t === 'sea' ? `${r.st === 'strait' ? 'Strait or channel' : 'Sea, gulf or bay'}` : esc(listJoin(r.cc.slice(0, 6).map(c => cname[c] || c)));
      const rs = t.type === 'peak' ? rows.slice().sort((a, b) => b.el - a.el) : rows;
      const cols = ['Name', t.type === 'peak' ? 'Height · Country' : t.type === 'sea' ? 'Type' : 'Countries'];
      if (t.type === 'peak') return `<table><thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rs.map(r => `<tr><td>${esc(r.n)}</td><td>${fact(r)}</td></tr>`).join('')}</tbody></table>`;
      return grouped(r => [esc(r.n), fact(r)], cols);
    }
    case 'text': {
      if (t.set === 'trivia' && t.types.includes('landmark')) return grouped(r => [esc(r.n), esc(r.ans)], ['Landmark', 'Country']);
      if (t.set === 'trivia') {
        const part = (ty, label) => { const rs = rows.filter(r => r.t === ty).sort(byName); return `<h3>${label}</h3><table><thead><tr><th>Old name</th><th>Today</th><th>Renamed</th></tr></thead><tbody>${rs.map(r => `<tr><td>${esc(r.n)}</td><td>${esc(r.ans)}${ty === 'former-city' ? ` <span class="of">(${esc(cname[r.cc])})</span>` : ''}</td><td>${r.y || ''}</td></tr>`).join('')}</tbody></table>`; };
        return part('former-country', 'Countries') + part('former-city', 'Cities');
      }
      if (t.field === 'code') return grouped(r => [esc(r.c), esc(r.n)], ['Abbreviation', place]);
      if (t.field === 'nick') return grouped(r => [esc(r.nick), esc(r.n)], ['Nickname', 'State']);
      return grouped(r => [esc(r.cap), esc(r.n)], ['Capital', place]);
    }
    case 'fact': {
      if (t.field === 'drive') {
        const left = rows.filter(r => r.drive === 'Left').sort(byName);
        return `<h3>Drive on the left <span class="n">${left.length}</span></h3>${list(left)}<p>Every other country and territory in the quiz drives on the right.</p>`;
      }
      if (t.field === 'r') return t.regions.length ? ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'].map(g => { const rs = rows.filter(r => r.r === g); return `<h3>${g} <span class="n">${rs.length}</span></h3>${list(rs)}`; }).join('') : '';
      const val = r => t.field === 'cap' ? esc(r.cap) : Array.isArray(r[t.field]) ? esc(r[t.field].join(', ')) : esc(r[t.field]);
      const label = { cap: 'Capital', cur: 'Currency', lang: 'Official languages', tld: 'Domain', ph: 'Phone code', dem: 'Demonym' }[t.field];
      return grouped(r => [esc(r.n), val(r)], [place, label]);
    }
  }
  return '';
}

/* ---------- page shell ---------- */
const THEME_SCRIPT = ''; // one look (Explorer) everywhere, set on <html>
const LOGO = `<img class="logo-mark" src="/logo.svg" alt="" width="30" height="30">`;
function page({ path, title, description, card, body, jsonld, noindex, extraHead = '' }) {
  const url = SITE + path;
  return `<!DOCTYPE html>
<html lang="en" data-skin="explorer" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
${noindex ? '<meta name="robots" content="noindex">\n' : ''}<meta property="og:type" content="website">
<meta property="og:site_name" content="GeoGym">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/cards/${card}.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${SITE}/cards/${card}.png">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#efe3c8">
${THEME_SCRIPT}
<link rel="stylesheet" href="/styles.css?v=${VERSION}">
<link rel="stylesheet" href="/themes.css?v=${VERSION}">
<link rel="stylesheet" href="/pages.css?v=${VERSION}">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>\n` : ''}${extraHead}</head>
<body class="page">
<header class="page-top"><a class="logo" href="/">${LOGO}GeoGym</a><a class="page-all" href="/quizzes/">All quizzes</a></header>
<main class="page-main">
${body}
</main>
<footer class="page-foot"><a href="/">Play</a> · <a href="/quizzes/">All quizzes</a> · <a href="/daily/">Daily challenge</a> · <a href="/about/">About</a> · <a href="/privacy/">Privacy</a> · <a href="/contact/">Contact</a><br><span>Free, no sign-up. Progress is saved in your browser.</span></footer>
</body>
</html>
`;
}

/* ---------- topic pages ---------- */
const MODE_LABEL = { practice: 'Practice', quiz: 'Timed quiz', 'name-all': 'Name them all', browse: 'Browse' };
const groups = [...new Set(TOPICS.map(t => t.group))];
const pages = [];
for (const t of TOPICS) {
  const slug = SLUG[t.id], rows = topicRows(t);
  let [desc, intro] = COPY[t.id] || [];
  if (!desc) {
    const [country, adj, one, many] = PLACE[t.set], n = rows.length, kind = t.id.split('-')[1];
    const what = { flags: [`${adj} ${one} flags`, `Learn the flag of every one of ${country}'s ${n} ${many}.`],
      capitals: [`${adj} capitals`, `Name the capital city of all ${n} ${many} of ${country}, with a map and a photo after each answer.`],
      map: [`${country} map`, `Find all ${n} ${many} of ${country} on a blank map.`],
      shapes: [`${adj} ${one} shapes`, `Name the ${many} of ${country} from their outlines alone.`],
      abbr: [`${adj} abbreviations`, `Match the official abbreviations of ${country}'s ${n} ${many} to their names.`] }[kind];
    desc = `Free ${what[0]} quiz: ${what[1].charAt(0).toLowerCase() + what[1].slice(1)}`;
    intro = what[1] + ' Practice until it sticks, race the clock, or try to name them all.';
  }
  const count = rows.length;
  const title = `${t.name} quiz${['compare'].includes(t.kind) ? '' : ` – ${count} ${t.unit || 'questions'}`} | GeoGym`;
  const modes = t.modes.map((m, i) => `<a class="btn${i ? '' : ' primary'}" href="/#${t.id}-${m}">${MODE_LABEL[m]}</a>`).join('');
  const related = TOPICS.filter(o => o.group === t.group && o.id !== t.id).map(o => `<a href="/${SLUG[o.id]}/">${esc(o.name)}</a>`).join('');
  const refTitle = t.kind === 'compare' ? (t.field === 'area' ? 'Every country by area' : 'Every country by population') : `Everything in this quiz`;
  const body = `<nav class="crumbs"><a href="/quizzes/">Quizzes</a> › <a href="/quizzes/#${esc(t.group.toLowerCase().replace(/[^a-z]+/g, '-'))}">${esc(t.group)}</a></nav>
<h1>${esc(t.name)} quiz</h1>
<p class="lead">${esc(intro)}</p>
<div class="play">${modes}</div>
<ul class="facts">${[t.kind !== 'compare' && `${count} ${t.unit || 'questions'}`, `${t.styles.includes('type') ? 'Multiple choice or typing' : t.styles.includes('map') ? 'Click on the map' : t.styles.includes('pair') ? 'Pick one of two' : 'Multiple choice'}`, 'Free, no sign-up'].filter(Boolean).map(f => `<li>${esc(f)}</li>`).join('')}</ul>
<section class="ref"><h2>${refTitle}</h2>${reference(t, rows)}</section>
<section class="more"><h2>More ${esc(t.group === 'World' || t.group === 'Trivia' || t.group === 'Nature' ? t.group.toLowerCase() : t.group)} quizzes</h2><div class="links">${related}</div></section>`;
  fs.mkdirSync(`public/${slug}`, { recursive: true });
  fs.writeFileSync(`public/${slug}/index.html`, page({ path: `/${slug}/`, title, description: desc, card: slug, body,
    jsonld: { '@context': 'https://schema.org', '@type': 'WebPage', name: `${t.name} quiz`, description: desc, url: `${SITE}/${slug}/`, isPartOf: { '@type': 'WebSite', name: 'GeoGym', alternateName: 'Geography Gym', url: SITE + '/' } } }));
  pages.push({ t, slug, desc, count });
}

/* ---------- hub ---------- */
const hubBody = `<h1>All geography quizzes</h1>
<p class="lead">${TOPICS.length} free quizzes: flags, capitals, maps, shapes, nature and trivia for the world, the US, Canada, Australia, Germany and Mexico. Each one has a practice mode that brings back what you miss, a timed quiz and a list of every answer.</p>
<div class="play"><a class="btn primary" href="/">Start playing</a><a class="btn" href="/daily/">Daily challenge</a></div>
${groups.map(g => `<section class="hub" id="${g.toLowerCase().replace(/[^a-z]+/g, '-')}"><h2>${esc(g)}</h2><ul class="hub-list">${pages.filter(p => p.t.group === g).map(p => `<li><a href="/${p.slug}/">${esc(p.t.name)}</a><span>${esc(p.desc.replace(/^Free [^:]+: ?/, '').replace(/^./, c => c.toUpperCase()))}</span></li>`).join('')}</ul></section>`).join('')}`;
fs.mkdirSync('public/quizzes', { recursive: true });
fs.writeFileSync('public/quizzes/index.html', page({ path: '/quizzes/', title: `All ${TOPICS.length} geography quizzes | GeoGym`,
  description: `${TOPICS.length} free geography quizzes: flags, capitals, maps, shapes, lakes, rivers, landmarks and more. No sign-up.`, card: 'home', body: hubBody }));

/* ---------- daily: the link people share ---------- */
const dailyBody = `<h1>GeoGym Daily Challenge</h1>
<p class="lead">10 questions from 10 different topics. Everyone gets the same ones, and a new set comes out every day at midnight. Can you beat your friend's score?</p>
<div class="play"><a class="btn primary" href="/#daily">Play today's challenge</a></div>
<script>location.replace("/#daily");</script>`;
fs.mkdirSync('public/daily', { recursive: true });
fs.writeFileSync('public/daily/index.html', page({ path: '/daily/', title: 'GeoGym Daily Challenge',
  description: '10 geography questions, the same for everyone, new every day. Flags, capitals, maps and more. Can you get 10 out of 10?', card: 'daily', body: dailyBody }));

/* ---------- about, privacy, contact ---------- */
const SITE_PAGES = [
  ['about', 'About GeoGym', 'GeoGym is a free geography game: flags, capitals, maps, shapes, landmarks and more. No sign-up; progress stays in your browser.', aboutBody({ topics: TOPICS.length })],
  ['privacy', 'Privacy policy | GeoGym', "GeoGym's privacy policy: no accounts, progress saved on your device, and how ads and cookies are used.", privacyBody()],
  ['contact', 'Contact | GeoGym', 'Questions, ideas or a mistake you spotted in a GeoGym quiz? Get in touch.', contactBody()]
];
for (const [slug, title, description, body] of SITE_PAGES) {
  fs.mkdirSync(`public/${slug}`, { recursive: true });
  fs.writeFileSync(`public/${slug}/index.html`, page({ path: `/${slug}/`, title, description, card: 'home', body: `<div class="prose">${body}</div>` }));
}

/* ---------- sitemap and robots ---------- */
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync('public/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${['/', '/quizzes/', ...pages.map(p => `/${p.slug}/`), '/about/', '/privacy/', '/contact/'].map(u => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
fs.writeFileSync('public/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

/* ---------- logo and home-screen icons ---------- */
fs.writeFileSync('public/logo.svg', logoSVG());
fs.writeFileSync('public/favicon.svg', logoSVG());
for (const [file, size] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]])
  fs.writeFileSync('public/' + file, new Resvg(logoSVG({ rounded: false, size })).render().asPng());
fs.writeFileSync('public/site.webmanifest', JSON.stringify({ name: 'GeoGym', short_name: 'GeoGym', description: 'Free geography quizzes: flags, capitals, maps and more.',
  start_url: '/', display: 'standalone', background_color: '#15171c', theme_color: '#15171c',
  icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }] }, null, 2) + '\n');

/* ---------- preview cards (1200×630 PNG) ---------- */
const C = { bg: '#f6f7f9', ink: '#15171c', muted: '#5b6270', accent: '#2f6bff', land: '#dfe3e8', line: '#ffffff', good: '#1f9d55', bad: '#e5484d', surface: '#ffffff' };
const imgs = {};
const imagesOf = f => imgs[f] || (imgs[f] = Object.fromEntries(read(f).map(x => [x.c, x.s])));
const svgUri = s => 'data:image/svg+xml;base64,' + Buffer.from(s).toString('base64');
const maps = {};
const mapOf = f => maps[f] || (maps[f] = read(f));
const MAPFILE = { countries: 'data/world-map.json', nature: 'data/world-map.json', trivia: 'data/world-map.json', states: 'data/us-map.json', ca: 'data/ca-map.json', au: 'data/au-map.json', de: 'data/de-map.json', mx: 'data/mx-map.json' };
const FLAGFILE = { countries: 'data/flags.json', states: 'data/state-flags.json', ca: 'data/ca-flags.json', au: 'data/au-flags.json', de: 'data/de-flags.json' };

function wrap(text, max) {
  const words = text.split(' '), lines = [];
  for (const w of words) { const l = lines[lines.length - 1]; if (l && (l + ' ' + w).length <= max) lines[lines.length - 1] = l + ' ' + w; else lines.push(w); }
  return lines;
}
function flagGrid(set, codes, x, y, w, h) {
  const im = imagesOf(FLAGFILE[set]), gap = 24, fw = (w - gap) / 2, fh = Math.min(fw * 3 / 4, (h - gap) / 2);
  return codes.slice(0, 4).map((c, i) => {
    const fx = x + (i % 2) * (fw + gap), fy = y + Math.floor(i / 2) * (fh + gap);
    return `<rect x="${fx + 4}" y="${fy + 8}" width="${fw}" height="${fh}" rx="14" fill="#000" opacity=".08"/><svg x="${fx}" y="${fy}" width="${fw}" height="${fh}"><clipPath id="f${i}"><rect width="${fw}" height="${fh}" rx="14"/></clipPath><image clip-path="url(#f${i})" href="${svgUri(im[c])}" width="${fw}" height="${fh}" preserveAspectRatio="xMidYMid slice"/></svg>`;
  }).join('');
}
function mapArt(set, x, y, w, h, { hi = [], hi2 = [], feats = [], one = null, focus = null } = {}) {
  const m = mapOf(MAPFILE[set]);
  let vb = m.vb;
  if (focus) { const bs = focus.map(c => m.info[c].b), b = [Math.min(...bs.map(q => q[0])), Math.min(...bs.map(q => q[1])), Math.max(...bs.map(q => q[2])), Math.max(...bs.map(q => q[3]))], pad = (b[2] - b[0]) * 0.12; vb = [b[0] - pad, b[1] - pad, b[2] - b[0] + 2 * pad, b[3] - b[1] + 2 * pad]; }
  if (one && m.info[one]) { const b = m.info[one].b, pad = Math.max(b[2] - b[0], b[3] - b[1]) * 0.08; vb = [b[0] - pad, b[1] - pad, b[2] - b[0] + 2 * pad, b[3] - b[1] + 2 * pad]; }
  const shapes = one ? m.shapes.filter(s => s.c === one) : m.shapes;
  const body = shapes.map(s => `<path d="${s.d}" fill="${hi.includes(s.c) || one ? C.accent : hi2.includes(s.c) ? '#a9c1ff' : C.land}" stroke="${C.line}" stroke-width="${vb[2] / 900}"/>`).join('') +
    feats.map(f => f.t === 'river' ? `<path d="${f.d}" fill="none" stroke="${C.accent}" stroke-width="${vb[2] / 260}" stroke-linecap="round"/>`
      : f.d ? `<path d="${f.d}" fill="${C.accent}" fill-opacity="${f.t === 'range' ? .6 : .85}"/>`
      : `<path d="M${f.p[0]} ${f.p[1] - 7}l7 11h-14z" fill="${C.accent}" stroke="#fff" stroke-width="1"/>`).join('');
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vb.join(' ')}" preserveAspectRatio="xMidYMid meet">${body}</svg>`;
}
function tile(text, x, y, w, h, size = 64) {
  return `<rect x="${x + 4}" y="${y + 8}" width="${w}" height="${h}" rx="22" fill="#000" opacity=".06"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="${C.surface}"/><text x="${x + w / 2}" y="${y + h / 2 + size * 0.35}" text-anchor="middle" font-weight="800" font-size="${size}" fill="${C.ink}">${esc(text)}</text>`;
}
function card(file, { title, sub, art }) {
  // Text column is about 560px wide: ~14 characters a line at 64px
  let ts = 64, lines = wrap(title, 14);
  if (lines.length > 3) { ts = 52; lines = wrap(title, 18); }
  const subLines = wrap(sub, 32).slice(0, lines.length > 2 ? 2 : 3), top = 205 - (lines.length - 1) * 20;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" font-family="Manrope">
<rect width="1200" height="630" fill="${C.bg}"/>
<svg x="62" y="58" width="52" height="52" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="#15171c"/>${MARK}</svg>
<text x="128" y="96" font-weight="800" font-size="36" fill="${C.ink}">GeoGym</text>
${lines.map((l, i) => `<text x="64" y="${top + 60 + i * (ts + 8)}" font-weight="800" font-size="${ts}" fill="${C.ink}" letter-spacing="-1.2">${esc(l)}</text>`).join('')}
${subLines.map((l, i) => `<text x="64" y="${top + 60 + lines.length * (ts + 8) + 22 + i * 38}" font-weight="600" font-size="28" fill="${C.muted}">${esc(l)}</text>`).join('')}
<text x="64" y="566" font-weight="700" font-size="28" fill="${C.accent}">geogym.party</text>
${art}
</svg>`;
  const png = new Resvg(svg, { font: { fontFiles: ['scripts/fonts/manrope-600.ttf', 'scripts/fonts/manrope-700.ttf', 'scripts/fonts/manrope-800.ttf'], loadSystemFonts: false, defaultFontFamily: 'Manrope' } }).render().asPng();
  fs.writeFileSync(`public/cards/${file}.png`, png);
}
const ART = { x: 640, y: 110, w: 500, h: 410 };
const SAMPLE = { countries: ['JP', 'BR', 'KE', 'CA'], states: ['CA', 'TX', 'NM', 'CO'], ca: ['QC', 'BC', 'NS', 'NU'], au: ['NSW', 'VIC', 'QLD', 'WA'], de: ['BY', 'BE', 'HH', 'SN'] };
const LOCATE = { countries: 'BR', states: 'CO', ca: 'QC', au: 'WA', de: 'BY', mx: 'JAL' };
const ONE = { countries: 'IT', states: 'TX', ca: 'NS', au: 'TAS', de: 'BY', mx: 'YUC' };
fs.mkdirSync('public/cards', { recursive: true });
function artFor(t, rows) {
  const { x, y, w, h } = ART;
  const sample = rows.find(r => ['FR', 'JP', 'TX', 'ON', 'VIC', 'BY', 'JAL'].includes(r.c)) || rows[0];
  if (t.kind === 'flag') return flagGrid(t.set, SAMPLE[t.set], x, y + 20, w, h);
  if (t.kind === 'compare') return flagGrid('countries', ['CA', 'AU'], x, y + 90, w, h) + `<circle cx="${x + w / 2}" cy="${y + 90 + 94}" r="34" fill="${C.ink}"/><text x="${x + w / 2}" y="${y + 90 + 104}" text-anchor="middle" font-weight="800" font-size="28" fill="#fff">vs</text>`;
  if (t.kind === 'shape') return mapArt(t.set, x + 40, y, w - 80, h, { one: ONE[t.set] });
  if (t.kind === 'feature') return mapArt('countries', x - 40, y + 40, w + 60, h - 40, { feats: nature.filter(f => f.t === t.type) });
  if (t.kind === 'locate' || t.kind === 'neighbors' || t.kind === 'odd' || t.set === 'trivia' || t.id === 'continents' || t.id === 'driving') {
    const hi = t.kind === 'odd' ? rows.map(r => r.c) : t.id === 'driving' ? rowsOf('countries').filter(r => r.drive === 'Left').map(r => r.c)
      : t.set === 'trivia' ? [...new Set(rows.map(r => r.cc))] : t.kind === 'neighbors' ? ['DE', 'FR', 'PL', 'AT', 'CH', 'CZ', 'BE', 'NL', 'LU', 'DK'] : rows.slice(0, 1).map(r => r.c);
    if (t.kind === 'neighbors') { const nb = rowsOf('countries').find(r => r.c === 'DE').nb; return mapArt('countries', x, y, w, h, { hi: ['DE'], hi2: nb, focus: ['DE', ...nb] }); }
    if (t.kind === 'locate') return mapArt(t.set, x - 40, y + 30, w + 60, h - 30, { hi: [LOCATE[t.set]] });
    const extra = t.id === 'former' ? tile('Siam = ?', x + 70, y + 300, 360, 100, 52) : '';
    return mapArt(t.set === 'trivia' ? 'countries' : t.set, x - 40, y + (extra ? 0 : 30), w + 60, extra ? h - 120 : h - 30, { hi }) + extra;
  }
  if (t.kind === 'text') {
    const q = t.field === 'code' ? sample.c : t.field === 'nick' ? (rows.find(r => r.c === 'UT') || sample).nick : sample.cap;
    return mapArt(t.set, x - 20, y + 10, w + 40, h - 150, {}) + tile(q, x + 20, y + 290, w - 40, 110, q.length > 16 ? 44 : 60);
  }
  if (t.kind === 'fact') {
    const r = rows.find(z => z.c === 'JP') || sample;
    const v = t.field === 'cap' ? r.cap : Array.isArray(r[t.field]) ? r[t.field][0] : r[t.field];
    const flag = FLAGFILE[t.set] ? `<svg x="${x + 90}" y="${y + 10}" width="320" height="240"><clipPath id="ff"><rect width="320" height="240" rx="16"/></clipPath><image clip-path="url(#ff)" href="${svgUri(imagesOf(FLAGFILE[t.set])[r.c])}" width="320" height="240" preserveAspectRatio="xMidYMid slice"/></svg>` : mapArt(t.set, x + 40, y, w - 80, 250, { one: r.c });
    return flag + tile(v, x + 30, y + 290, w - 60, 110, String(v).length > 14 ? 46 : 60);
  }
  return mapArt(t.set, x, y, w, h);
}
for (const p of pages) {
  const sub = p.desc.replace(/^Free [^:]+: ?/, '').replace(/^./, c => c.toUpperCase()).replace(/\.$/, '');
  let short = sub.split(/\.\s/)[0];
  if (short.length > 96) short = short.split(',')[0];
  card(p.slug, { title: `${p.t.name} quiz`.replace(' → ', ' to '), sub: short, art: artFor(p.t, topicRows(p.t)) });
}
card('home', { title: 'Free geography quizzes', sub: `${TOPICS.length} quizzes: flags, capitals, maps and more`, art: flagGrid('countries', ['JP', 'BR', 'ZA', 'CA'], ART.x, ART.y + 20, ART.w, ART.h) });
const squares = [1, 1, 0, 1, 1, 1, 0, 1, 1, 1].map((ok, i) => `<rect x="${ART.x + 10 + (i % 5) * 98}" y="${ART.y + 110 + Math.floor(i / 5) * 98}" width="82" height="82" rx="16" fill="${ok ? C.good : C.bad}"/>`).join('');
card('daily', { title: 'Daily Challenge', sub: '10 questions, the same for everyone, new every day', art: squares });

console.log(`pages: ${pages.length} topics + hub + daily + about/privacy/contact, ${pages.length + 2} cards, sitemap with ${pages.length + 5} URLs`);
