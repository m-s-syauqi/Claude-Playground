<div align="center">

# 🏃 Stride

**A simple, private running schedule tracker that lives in your browser.**

Plan your week, tick off runs as you go, and watch your distance build up.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/screenshot-dark.png">
  <img src="docs/screenshot-light.png" alt="Stride showing a week of planned and completed runs, weekly stats, a distance chart and a list of upcoming runs" width="900">
</picture>

</div>

---

## Why Stride?

Most running apps want an account, a subscription or a GPS watch. Stride doesn't. It's one web page you open to plan your training and record how it went.

- **No sign-up.** Open it and start planning.
- **Private.** Your runs are stored in your own browser and never leave your device.
- **Works anywhere.** Desktop or phone, light mode or dark.
- **Nothing to install.** It's three plain files: HTML, CSS and JavaScript.

## What you can do

| | |
|---|---|
| 📅 **Plan your week** | A Monday-to-Sunday view of every run, with today highlighted. Add a run to any day in a couple of clicks. |
| 🗓️ **30-day calendar** | Switch from **Week** to **30 days** to see a month-style calendar of the next 30 days, or step back through earlier 30-day spans. Tap a day to add a run there. |
| 🏷️ **Mix your training** | Easy runs, long runs, tempo, intervals, recovery and races, each with its own colour. |
| ✅ **Log as you go** | Tick a run to mark it done. Open it to add actual distance, time and notes, and Stride works out your pace. |
| 📰 **Serba-serbi Lari (blog)** | A blog page (**Blog**, next to the logo) with articles in Indonesian about running: types of runs, pace, heart-rate zones, gear and shoes, running in heat, warm-ups and injuries, eating and drinking, technique, your first race and a glossary. It includes a pace and race-time calculator and a heart-rate zone calculator. |
| 💡 **Suggest a run** | Tap **Suggest run** for your next run (rest, recovery, easy, long or tempo) with a distance, a target pace and the reasons, based on what you've logged: days since your last run, this week compared with your 4-week average, whether you've done a long or faster run this week, and heart rate from your notes. **Add to plan** puts it in your schedule. |
| 📷 **Add from a screenshot** | Tap **From screenshot** and pick a screenshot of a run from Strava or your watch app. Stride reads the date, start time, distance, moving time, heart rate and calories and fills in the form for you to check. You can also paste or drop an image onto the page. |
| 🔁 **Repeat weekly** | Schedule a regular run for 2–16 weeks in one go. |
| 📊 **See your progress** | Weekly totals for distance, runs done, time on feet and average pace, plus a chart of the last 8 weeks. |
| ⏭️ **Know what's next** | A "Coming up" list of your next planned runs. |
| 📏 **km or miles** | Switch units at any time. |
| 🔄 **Sync between devices** | Tap **Sync → Turn on sync** to get a private sync code, then open the sync link (or enter the code) on your other devices. Runs, edits and deletions show up everywhere within a minute. |
| 💾 **Back up your data** | Export your runs to a file as a backup. |

## Getting started

1. **Open Stride.** Open `index.html` in any modern browser, or use the hosted version if GitHub Pages is turned on for this repository.
2. **Plan a week.** Click **+ Add run**, or **+ Add** under a day. New here? Click **Load sample plan** for a beginner 10K plan you can edit.
3. **Go run.** 👟
4. **Tick it off.** Mark the run as done, and open it if you want to add your time and notes.

### Install it as an app

On your phone, open Stride in Chrome and choose **⋮ → Add to Home screen** (or **Install app**). On iPhone, use Safari's **Share → Add to Home Screen**. Opened from the home screen icon, Stride runs full-screen without the browser's title and address bar, and it keeps working offline.

Once installed on Android, Stride also shows up in the **share sheet**. In Strava (or your gallery), share a screenshot of a run and pick **Stride**: the app opens with the run filled in, ready to save.

### Keyboard shortcuts

| Key | Action |
|---|---|
| `N` | Add a new run |
| `T` | Jump to this week |
| `←` / `→` | Previous / next week (or 30 days) |

## Running it yourself

There is nothing to build. Serve the folder with any static file server:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

To publish it for free, go to **Settings → Pages** in this repository, choose **Deploy from a branch**, then pick the `stride` branch and the root folder.

## About your data

Without sync, Stride saves your runs only in your browser's `localStorage`, so:

- your data stays on the device and browser you used;
- clearing your browser data deletes it;
- using **Export** every so often gives you a backup file, and turning on **Sync** keeps a copy online.

**With sync turned on**, your runs are also stored online (in the project's Upstash Redis database on Vercel) under a fingerprint of your sync code. There is no account: anyone who has your code can see and change your runs, so keep it to yourself. Turning sync off on a device keeps its runs on that device. Unit and view settings are not synced.

Screenshots are read on your device. The text reader ([Tesseract.js](https://github.com/naptha/tesseract.js), about 7 MB) is downloaded from the jsDelivr CDN the first time you use it, but your image is never uploaded anywhere.

## Setting up sync on Vercel

Sync needs a small database, connected once to the Vercel project:

1. In the Vercel dashboard, open the project and go to **Storage**.
2. Choose **Create Database → Upstash for Redis** (from the Marketplace), pick the free plan and create it.
3. Connect it to this project for **Production** (and Preview, if you use preview links). This adds `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to the project.
4. Redeploy. Until then, the Sync screen says sync is not set up on the server.

The sync endpoint is `api/sync.js`, a Vercel Function with no dependencies. It merges what each device sends with the stored copy: the newest version of each run wins, and deletions are kept as markers so they reach every device.

## Project structure

```
index.html   page layout and the add/edit dialog
styles.css   styling, light and dark themes
app.js       planner, stats, chart, storage, import/export
screenshot.js  reads a run from a screenshot (on-device text recognition)
coach.js     run suggestions and their reasons (simple training rules)
blog.html, blog.js  Serba-serbi Lari: articles, labels, search and calculators
sync-merge.js  merge rules shared by the app and the sync function
api/sync.js  Vercel Function that stores and merges synced runs (Upstash Redis)
manifest.webmanifest, sw.js, icons/   installable app (home screen, offline)
docs/        screenshots used in this README
```

---

<div align="center">
Happy running! 🏃‍♀️🏃‍♂️
</div>
