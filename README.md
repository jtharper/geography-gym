# Geography Gym

Browser geography quizzes. Country flags come first, with more topics (capitals, state flags, lakes…) to follow. It's a plain static site with no framework and no build step. Everything the browser loads is in `public/`.

## Modes

- **Practice**: endless spaced repetition. Flags you miss come back sooner, and a flag counts as learned after 3 correct answers in a row.
- **Quiz**: a timed round of 10, 20, 50 or all flags, with a retry for the ones you missed.
- **Name them all**: type every country you can think of, and each flag is revealed as you name it. The clock is running.
- **Browse flags**: a gallery you can search, plus a look-alikes section for flags that are easy to mix up.

Every mode and setting (region, territories, answer style, sounds) is in the one menu at the top right. There's also a light/dark toggle. Progress and settings are saved in the browser's `localStorage`.

## Project layout

```
public/              ← the deployed site
  index.html
  styles.css
  app.js             ← all game logic
  data/countries.json
  data/flags.json    ← optimized SVG for each flag
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

Font: [Manrope](https://github.com/sharanda/manrope) (OFL). Flag artwork: [flag-icons](https://github.com/lipis/flag-icons) (MIT). Country data: [world-countries](https://github.com/mledoze/countries) (ODbL).
