# Geography Gym

https://geographyquiz.party/

Browser geography quizzes, live at [geographyquiz.party](https://geographyquiz.party). It's a plain static site with no framework and no build step. Everything the browser loads is in `public/`.

## Topics

Pick a topic from the menu at the top right. Topics are grouped by tabs.

**World**
- **Country flags**: 197 countries (the 193 UN members plus Kosovo, Palestine, Taiwan and Vatican City), plus an optional 35 territories.
- **Country capitals** and **Capitals → country**: name the capital, or name the country from its capital.
- **Find it on the map**: click the country. Tiny countries get a dot you can click.
- **Country shapes**: name the country from its outline.
- **Neighbors**: pick a country that borders it.
- **Currencies**, **Languages**, **Internet domains** and **Phone codes**.
- **Bigger or smaller** (area) and **More or fewer people** (population): pick the larger of two. Your best streak is saved.

**Nature**
- **Lakes** (58), **Rivers** (59) and **Mountain ranges** (42), each highlighted on the world map.

**United States**
- **State flags** (current as of 2026, including Minnesota's and Utah's 2024 flags and Mississippi's 2021 flag), **State capitals**, **Find states on the map**, **State shapes** and **State abbreviations**.

**Canada, Australia, Germany and Mexico**
- Flags (Canada, Australia, Germany), capitals, find on the map and shapes for every province, state and territory. Canada and Australia also have abbreviations. Mexico's states have no official flags, so Mexico has no flag topic.

**Daily & stats**
- **Daily challenge**: 10 questions from 10 different topics, the same for everyone each day. When you finish, **Copy result** copies a short score you can paste anywhere. Your daily streak is shown at the top.
- **Review weak spots**: everything you've gotten wrong in any topic, until you get it right twice.
- **Your stats**: how much you've learned in each topic, how often you're right, and your daily streak.

After every answer, a map zooms to the place, highlighted in blue. A wrong pick is shown in red. You can zoom with the + and − buttons, the scroll wheel or a pinch, and drag to pan. Borders follow international recognition: Crimea is shown as part of Ukraine, Somaliland as part of Somalia, and Northern Cyprus as part of Cyprus.

## Modes

- **Practice**: endless spaced repetition. Things you miss come back sooner, and an item counts as learned after 3 correct answers in a row.
- **Quiz**: a timed round of 10, 20, 50 or all of them, with a retry for the ones you missed.
- **Name them**: type every one you can think of. The clock is running.
- **Browse**: a gallery you can search. Country flags also has a look-alikes section for flags that are easy to mix up.

Some topics don't have every mode (for example, map topics have Practice and Quiz only).

The gear button holds the settings for the current topic: region, answer style (choices, typing or picking the flag), territories, sounds and reset. There's also a light/dark toggle. Progress and settings are saved in the browser's `localStorage`.

Each topic keeps its own progress. To add a topic, add an entry to `TOPICS` at the top of `app.js`. If it needs new data, add it to `scripts/build-data.mjs`.

## Project layout

```
public/              ← the deployed site
  index.html
  styles.css
  app.js             ← all game logic
  data/countries.json, data/flags.json        ← countries and their flags
  data/states.json, data/state-flags.json     ← US states
  data/ca|au|de|mx.json, data/*-flags.json    ← provinces and states of Canada, Australia, Germany, Mexico
  data/nature.json                            ← lakes, rivers, mountain ranges
  data/*-map.json    ← pre-projected map shapes
  _headers           ← Cloudflare Pages cache rules
scripts/build-data.mjs  ← regenerates public/data/*
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

## Credits

- Font: [Manrope](https://github.com/sharanda/manrope) (OFL).
- Country flags: [flag-icons](https://github.com/lipis/flag-icons) (MIT).
- Country data (capitals, currencies, languages, domains, phone codes, borders, area): [world-countries](https://github.com/mledoze/countries) (ODbL).
- Population: World Bank, via [datasets/population](https://github.com/datasets/population) (2025 figures).
- US state and Canadian province flags: [region-flags](https://github.com/fonttools/region-flags) (public domain, from Wikimedia Commons), with Minnesota, Utah and Mississippi from [us-state-flags](https://www.npmjs.com/package/us-state-flags) (ISC).
- Australian and German state flags: [niemela/flags](https://github.com/niemela/flags), from Wikimedia Commons (public domain).
- Maps: [world-atlas](https://github.com/topojson/world-atlas) and [Natural Earth](https://www.naturalearthdata.com/) (public domain) for the world, lakes, rivers, mountain ranges and provinces; [us-atlas](https://github.com/topojson/us-atlas) (US Census Bureau, public domain) for the US.
