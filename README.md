# Geography Gym

Browser geography quizzes. Country flags come first, with more topics (capitals, state flags, lakes…) to follow. It's a plain static site with no framework and no build step. Everything the browser loads is in `public/`.

## Topics

- **Country flags**: 197 countries (the 193 UN members plus Kosovo, Palestine, Taiwan and Vatican City), plus an optional 35 territories.
- **Country capitals**: the same countries. A few typed alternates are accepted, such as La Paz for Bolivia and Kiev for Kyiv.
- **US state flags**: all 50, current as of 2026, including Minnesota's and Utah's 2024 flags and Mississippi's 2021 flag.
- **US state capitals**: all 50, grouped by Census region (Northeast, Midwest, South, West).

Each topic keeps its own progress. To add a topic, add an entry to `TOPICS` at the top of `app.js`. If it needs new data, add it to `scripts/build-data.mjs`.

## Modes (every topic)

- **Practice**: endless spaced repetition. Flags you miss come back sooner, and an item counts as learned after 3 correct answers in a row.
- **Quiz**: a timed round of 10, 20, 50 or all flags, with a retry for the ones you missed.
- **Name them all**: type every country you can think of, and each flag is revealed as you name it. The clock is running.
- **Browse**: a gallery you can search. Country flags also has a look-alikes section for flags that are easy to mix up.

The topic, the mode and every setting (region, territories, answer style, sounds) are in the one menu at the top right. There's also a light/dark toggle. Progress and settings are saved in the browser's `localStorage`.

## Project layout

```
public/              ← the deployed site
  index.html
  styles.css
  app.js             ← all game logic
  data/countries.json
  data/flags.json    ← optimized SVG for each country flag
  data/states.json, data/state-flags.json
  _headers           ← Cloudflare Pages cache rules
scripts/build-data.mjs  ← regenerates public/data/*
```

## Run locally

```
npm run dev        # serves public/ at http://localhost:8080
```

Opening `index.html` straight from disk won't work, because the game fetches its data files.

## Regenerate the flag data

You only need this if you update the flag set or change which countries are included:

```
npm install
npm run data
```

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

Font: [Manrope](https://github.com/sharanda/manrope) (OFL). Flag artwork: [flag-icons](https://github.com/lipis/flag-icons) (MIT). Country data: [world-countries](https://github.com/mledoze/countries) (ODbL). State flags: [region-flags](https://github.com/fonttools/region-flags) (public domain, from Wikimedia Commons), with Minnesota, Utah and Mississippi from [us-state-flags](https://www.npmjs.com/package/us-state-flags) (ISC).
