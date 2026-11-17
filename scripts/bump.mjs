// Sets a new asset version in index.html and app.js, so browsers load matching files after a deploy.
// Run before committing a change to the site: npm run bump
import fs from 'fs';
const v = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
const html = 'public/index.html', js = 'public/app.js';
fs.writeFileSync(html, fs.readFileSync(html, 'utf8').replace(/\?v=[\w-]+/g, `?v=${v}`));
fs.writeFileSync(js, fs.readFileSync(js, 'utf8').replace(/const VERSION = "[\w-]+";/, `const VERSION = "${v}";`));
console.log('asset version', v);
