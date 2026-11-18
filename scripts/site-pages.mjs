// About, Privacy and Contact pages (built by build-pages.mjs). Plain HTML bodies; the page() shell adds header and footer.
// Keep the privacy policy true to what the site actually does. If ads, analytics or anything else that collects data
// is added, update it (and UPDATED) at the same time.
export const CONTACT = 'support@geogym.party';
export const UPDATED = 'November 18, 2026';

export function aboutBody({ topics }) {
  return `<h1>About GeoGym</h1>
<p class="lead">GeoGym is a free geography game. Learn the flags, capitals, maps and shapes of the world, then race the clock to see how much you know.</p>

<h2>What you can play</h2>
<p>There are ${topics} quizzes: every country's flag, capital, outline and place on the map, plus currencies, languages, landmarks, lakes, rivers, mountains and seas. There are also quizzes on the states and provinces of the United States, Canada, Australia, Germany and Mexico. <a href="/quizzes/">See all of them</a>.</p>
<ul>
  <li><b>Practice</b> brings back the ones you miss until you know them, and shows each answer on a map.</li>
  <li><b>Quiz</b> is a race against the clock, with no repeats. Your best score and time are saved.</li>
  <li><b>Name them</b> asks you to type every answer you can remember.</li>
  <li><b>Browse</b> is a reference list you can search.</li>
  <li>The <a href="/daily/">Daily Challenge</a> has 10 questions, the same for everyone each day, so you can compare scores with friends.</li>
  <li><b>Multiplayer</b> lets you race a friend live: make a game, send them the code, and you both answer the same questions at the same time.</li>
</ul>

<h2>Free, no sign-up</h2>
<p>You don't need an account. Your progress is saved in your own browser, on your device. Read the <a href="/privacy/">privacy policy</a> for the details.</p>

<h2>Where the facts come from</h2>
<p>Flags, borders and country facts come from open data projects: flag-icons, region-flags and Wikimedia Commons for flags; world-countries for capitals, currencies, languages and borders; Natural Earth, world-atlas and the US Census Bureau for maps, lakes, rivers and mountains; and the World Bank for population. Photos of capitals and landmarks are loaded from Wikipedia, and each one links to its article, where the photographer and license are listed. Landmarks, former names, peak heights and state nicknames were written for this game.</p>
<p>Borders follow international recognition, so Crimea is shown as part of Ukraine and Northern Cyprus as part of Cyprus.</p>

<h2>Found a mistake?</h2>
<p>Countries change their flags, capitals and names from time to time. If something looks wrong or out of date, please <a href="/contact/">let us know</a>.</p>`;
}

export function contactBody() {
  return `<h1>Contact</h1>
<p class="lead">Questions, ideas or a wrong answer you spotted? Email us at <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>

<h2>Reporting a mistake</h2>
<p>Please tell us which quiz it was in and what the question said. A screenshot helps too. Flags, capitals and names do change, and we fix mistakes as soon as we can.</p>

<h2>Ideas and requests</h2>
<p>Want a new quiz, a new country's states or provinces, or a feature? We'd like to hear about it.</p>

<p>We read every message, but we can't always reply to each one.</p>`;
}

export function privacyBody() {
  return `<h1>Privacy policy</h1>
<p class="lead">GeoGym is a free geography game with no accounts and no sign-up. This page explains what information is used when you play, and why.</p>
<p><i>Last updated: ${UPDATED}</i></p>

<h2>What we don't collect</h2>
<p>GeoGym has no accounts, logins or forms. We don't ask for your email address or any other personal information to play. The only exception is the name you choose to type in for Multiplayer, described below.</p>

<h2>Your progress stays on your device</h2>
<p>Your progress, best times, Daily Challenge results and settings (like sounds and answer style) are saved in your browser's local storage, on your own device. They are not sent to us. To delete them, clear this site's data in your browser settings. This also resets your progress.</p>

<h2>Hosting</h2>
<p>GeoGym is hosted by Cloudflare. Like any website host, Cloudflare receives technical information when you visit, such as your IP address and browser type, to deliver the site and protect it from attacks. See <a href="https://www.cloudflare.com/privacypolicy/" rel="noopener">Cloudflare's privacy policy</a>.</p>

<h2>Multiplayer</h2>
<p>When you play Multiplayer, your browser connects to our game server (run on Cloudflare) so both players can see each other's progress. The server receives the name you type in (it can be anything; you don't have to use your real name), the game code, which quiz you picked, and your progress and score in that game. Your opponent sees your name and score. This information is used only to run the game and is deleted about an hour after both players leave. Your name is also saved in your browser so you don't have to type it again.</p>

<h2>Photos from Wikipedia</h2>
<p>Photos of capitals and landmarks are loaded directly from Wikipedia (Wikimedia Foundation) by your browser, so Wikimedia receives the request, including your IP address. See the <a href="https://foundation.wikimedia.org/wiki/Policy:Privacy_policy" rel="noopener">Wikimedia privacy policy</a>.</p>

<h2>Advertising</h2>
<p>GeoGym may show ads to keep the site free. Ads are provided by Google (Google AdSense).</p>
<ul>
  <li>Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this website or other websites.</li>
  <li>Google's use of advertising cookies enables it and its partners to serve ads to you based on your visits to this site and/or other sites on the Internet.</li>
  <li>You can opt out of personalized advertising by visiting <a href="https://adssettings.google.com" rel="noopener">Google Ads Settings</a>. You can also opt out of some third-party vendors' use of cookies for personalized advertising at <a href="https://www.aboutads.info/choices/" rel="noopener">www.aboutads.info</a>.</li>
  <li>To learn more, see <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">how Google uses information from sites that use its services</a>.</li>
</ul>
<p>If you are in the European Economic Area, the United Kingdom or Switzerland, you will be asked for your consent before cookies are used for personalized ads, and you can change your choice at any time.</p>

<h2>Sharing your results</h2>
<p>When you tap Share or Copy result, the picture and link are created on your device and passed to the app you choose. Nothing is sent to us.</p>

<h2>Children</h2>
<p>GeoGym is made for a general audience, including students. Because there are no accounts or forms, we don't knowingly collect personal information from anyone, including children under 13.</p>

<h2>Emailing us</h2>
<p>If you email us, we use your email address and message only to reply to you.</p>

<h2>Changes to this policy</h2>
<p>If we change how GeoGym uses information, we'll update this page and the date at the top.</p>

<h2>Contact</h2>
<p>Questions about privacy? Email <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>`;
}
