# GeoGym

GeoGym (Geography Gym) is a set of free geography quizzes.

https://geogym.party/

Browser geography quizzes, live at [geogym.party](https://geogym.party). It's a plain static site with no framework and no build step. Everything the browser loads is in `public/`.

## Topics

Pick a topic from the menu at the top right. Topics are grouped into five tabs: World, Trivia, Nature, Regions (the United States, Canada, Australia, Germany and Mexico, each under its own header) and Daily.

**World**
- **Country flags**: 197 countries (the 193 UN members plus Kosovo, Palestine, Taiwan and Vatican City), plus an optional 35 territories.
- **Country capitals** and **Capitals → country**: name the capital, or name the country from its capital. In Practice, a photo of the capital appears next to the map after you answer (this works for every capitals topic).
- **Find it on the map**: click the country. Tiny countries get a dot you can click.
- **Country shapes**: name the country from its outline.
- **Neighbors**: pick a country that borders it.
- **Bigger or smaller** (area) and **More or fewer people** (population): pick the larger of two. Your best streak is saved.
- **Landlocked countries**: pick the one of four countries with no coastline (or name them all).

**Trivia**
- **Currencies**, **Languages**, **Internet domains** and **Phone codes**.
- **Demonyms**: what you call someone from each country (Comorian, Mosotho, Kittitian…).
- **Which continent?** Countries on two continents (Russia, Turkey, Egypt…) accept both.
- **Driving side**: left or right.
- **Famous landmarks** (95): a photo and the name of the landmark; which country is it in?
- **Landmark photos** (95): just the photo; name the landmark.
- **Former names** (67): Burma, Siam, Ceylon, Zaire… and cities like Bombay, Constantinople and Saigon, with the year they were renamed.

**Nature**
- **Lakes** (58), **Rivers** (59) and **Mountain ranges** (42), each highlighted on the world map.
- **Mountain peaks** (55), marked on the map, with their height.
- **Seas and straits** (82): seas, gulfs, bays, straits and channels, from the Mediterranean to the Bosporus.

**United States**
- **State flags** (current as of 2026, including Minnesota's and Utah's 2024 flags and Mississippi's 2021 flag), **State capitals**, **Find states on the map**, **State shapes** and **State abbreviations** and **State nicknames** (the Beehive State, the Show-Me State…).

**Canada, Australia, Germany and Mexico**
- Flags (Canada, Australia, Germany), capitals, find on the map and shapes for every province, state and territory. Canada and Australia also have abbreviations. Mexico's states have no official flags, so Mexico has no flag topic.

**Daily**
- **Daily challenge**: 10 questions from 10 different topics, the same for everyone each day. When you finish, **Copy result** copies a short score you can paste anywhere. Your daily streak is shown at the top.
- **Review weak spots**: everything you've gotten wrong in any topic, until you get it right twice.
- **Your stats**: how much you've learned in each topic, how often you're right, and your daily streak.

In Practice, after every answer, a map zooms to the place, highlighted in blue. A wrong pick is shown in red. You can zoom with the + and − buttons, the scroll wheel or a pinch, and drag to pan. Borders follow international recognition: Crimea is shown as part of Ukraine, Somaliland as part of Somalia, and Northern Cyprus as part of Cyprus.

## Modes

- **Practice**: endless spaced repetition. Things you miss come back sooner, and an item counts as learned after 3 correct answers in a row.
- **Quiz**: a race against the clock, 10, 20, 50 or all of them. Every place comes up once, the same answer never repeats (one Euro question, not twenty) and of two identical flags only one appears. Answers move straight on (no map), the clock shows tenths of a second, and your best score and time are saved for each topic, region, length and answer style. Retry the ones you missed at the end. **Share** sends a picture of your score and time (with green and red squares for up to 20 questions) and a link to the same quiz; **Copy result** copies it as text.
- **Name them**: type every one you can think of. The clock is running.
- **Browse**: a gallery you can search. Country flags also has a look-alikes section for flags that are easy to mix up.

Some topics don't have every mode (for example, map topics have Practice and Quiz only).

The gear button holds the settings for the current topic: region, answer style (choices, typing or picking the flag), territories, sounds and reset. The site has one look, Explorer (an old paper atlas). Progress and settings are saved in the browser's `localStorage`.

Each topic keeps its own progress. To add a topic, add an entry to `TOPICS` at the top of `app.js`. If it needs new data, add it to `scripts/build-data.mjs`.

## Pages for search engines and link previews

The game itself is one page (`index.html`). So that each quiz can be found on Google and looks good when shared, `scripts/build-pages.mjs` also builds:

- **A page for every topic**, like `/flag-quiz/` or `/us-state-capitals-quiz/`, with its own title and description, buttons into the game, and a full list of the answers.
- **`/quizzes/`**: every topic on one page. It's linked from the bottom of the topic menu.
- **`/daily/`**: the link the Daily challenge shares. It shows a preview card in chats and on social media, then sends visitors straight into today's challenge.
- **Preview cards** (`/cards/*.png`, 1200×630) for every page, drawn from the game's own flags and maps.
- **The logo and icons**: `logo.svg`, `favicon.svg`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` and `site.webmanifest`, all from `scripts/logo.mjs`.

On phones, the Daily challenge **Share** button also attaches a picture of your result (made in the browser), so the share sheet and Messages show it.
- **`sitemap.xml`** and **`robots.txt`**.

The words for each topic page live in `scripts/topic-copy.mjs`. The page addresses are in `SLUG` in `scripts/build-pages.mjs`: don't change one after it's live, or search engines lose it.

To get the pages into Google, add the site to [Google Search Console](https://search.google.com/search-console) and submit `https://geogym.party/sitemap.xml`.

## Project layout

```
public/              ← the deployed site
  index.html
  styles.css         ← layout and base styles
  themes.css         ← the Explorer look (colors, Fraunces headings)
  app.js             ← all game logic
  data/countries.json, data/flags.json        ← countries and their flags
  data/states.json, data/state-flags.json     ← US states
  data/ca|au|de|mx.json, data/*-flags.json    ← provinces and states of Canada, Australia, Germany, Mexico
  data/nature.json                            ← lakes, rivers, mountain ranges, peaks, seas and straits
  data/trivia.json                            ← landmarks and former names
  data/*-map.json    ← pre-projected map shapes
  _headers           ← Cloudflare Pages cache rules
  pages.css          ← style for the topic pages
  <topic>-quiz/, quizzes/, daily/, cards/, sitemap.xml, robots.txt  ← built by scripts/build-pages.mjs
scripts/build-data.mjs  ← regenerates public/data/*
scripts/build-pages.mjs ← topic pages, /quizzes/, /daily/, preview cards, sitemap (runs as part of npm run bump)
scripts/topic-copy.mjs  ← the description and intro for each topic page
scripts/logo.mjs        ← the logo (gold medal with a globe); build-pages.mjs writes logo.svg, favicon.svg, the home-screen icons and site.webmanifest from it
```

## Run locally

```
npm run dev        # serves public/ at http://localhost:8080
```

Opening `index.html` straight from disk won't work, because the game fetches its data files.

## Regenerate the data

Don't edit `public/data/*.json` by hand. Change `scripts/build-data.mjs`, then run:

```
npm install
npm run data
```

The script downloads a few files as it runs (population figures, Natural Earth outlines, and the Australian and German state flags), so it needs internet access.

## Deploy to Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**, then pick this repo.
2. Build settings:
   - Framework preset: **None**
   - Build command: *(leave empty)*
   - Build output directory: **`public`**
   - Production branch: **`main`**
3. Click **Save and Deploy**.
4. Your project → **Custom domains** → **Set up a custom domain**, then enter your domain. If the domain's DNS is on Cloudflare, the records are added for you.

Every push to `main` deploys automatically. Pushes to other branches get their own preview URLs.

Before committing a change to the site, run `npm run bump`. It stamps a new version on `app.js`, the stylesheets and the data files, so browsers never mix a new page with old cached code. It also rebuilds the topic pages, preview cards and sitemap.

## Credits

- Fonts: [Manrope](https://github.com/sharanda/manrope), plus Fraunces for headings, both self-hosted from [Fontsource](https://fontsource.org) (OFL).
- Country flags: [flag-icons](https://github.com/lipis/flag-icons) (MIT), except Costa Rica, which uses the state flag with the coat of arms from [niemela/flags](https://github.com/niemela/flags) (Wikimedia Commons, public domain).
- Country data (capitals, currencies, languages, domains, phone codes, borders, area): [world-countries](https://github.com/mledoze/countries) (ODbL).
- Population: World Bank, via [datasets/population](https://github.com/datasets/population) (2025 figures).
- US state and Canadian province flags: [region-flags](https://github.com/fonttools/region-flags) (public domain, from Wikimedia Commons), with Minnesota, Utah and Mississippi from [us-state-flags](https://www.npmjs.com/package/us-state-flags) (ISC).
- Australian and German state flags: [niemela/flags](https://github.com/niemela/flags), from Wikimedia Commons (public domain).
- Mountain peak locations and seas: [Natural Earth](https://www.naturalearthdata.com/) (public domain). Peak heights, landmarks, former names, driving sides and state nicknames were written for this game.
- Demonyms and landlocked status: [world-countries](https://github.com/mledoze/countries).
- Sounds (`public/sounds/`, trimmed): "Mission complete chime" by soundshelfstudio (right) and "Error mistake sound effect" by lesiakower (wrong), from [Pixabay](https://pixabay.com) under the Pixabay Content License.
- Capital and landmark photos: the lead image of each city's or landmark's English Wikipedia article, loaded in the browser from the Wikipedia API. Each photo links to its article, where the image's author and license are listed.
- Maps: [world-atlas](https://github.com/topojson/world-atlas) and [Natural Earth](https://www.naturalearthdata.com/) (public domain) for the world, lakes, rivers, mountain ranges and provinces; [us-atlas](https://github.com/topojson/us-atlas) (US Census Bureau, public domain) for the US.
