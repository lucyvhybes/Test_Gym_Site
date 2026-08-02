# FORM/ — Fitness, Nutrition & Weight Tracker

A front-end-only fitness tracking web app: exercise library, workout builder with a live timer, BMI/BMR calculator, weight tracker, nutrition log, calendar, community forum, and an admin panel — all running in the browser with **no backend, no build step, and no dependencies**. Every "page" is really one HTML document; navigation, accounts, and all saved data are handled entirely in JavaScript using the browser's own storage.

Live demo: enable GitHub Pages for this repo (Settings → Pages → Source: **GitHub Actions**) and the included workflow will publish it automatically on every push to `main`.

**Admin login** (seeded automatically the first time the app runs in a browser):
- Email: `admin@form.app`
- Password: `Admin123!`
- Or just click **"autofill a demo login"** on the sign-in screen.

Signing up your own account instead always creates a regular **member** — the admin account above is the only one with catalog-editing rights.

---

## Contents

- [Repository structure](#repository-structure)
- [How the app is architected](#how-the-app-is-architected)
- [index.html: the page shell and all ten views](#indexhtml-the-page-shell-and-all-ten-views)
- [style.css: the design system](#stylecss-the-design-system)
- [script.js: everything the app does](#scriptjs-everything-the-app-does)
- [GitHub Pages deployment files](#github-pages-deployment-files)
- [Running it locally](#running-it-locally)
- [Data, privacy & known limitations](#data-privacy--known-limitations)

---

## Repository structure

```
fitness-app/
├── index.html                       # the entire app's markup (one page, ten views)
├── style.css                        # every style in the app
├── script.js                        # every behaviour in the app
├── .nojekyll                        # tells GitHub Pages not to run Jekyll on this repo
└── .github/
    └── workflows/
        └── deploy-pages.yml         # GitHub Actions workflow that publishes to Pages
```

Everything the browser needs lives in three files. There's no `node_modules`, no package manager, no compiler — you could open `index.html` straight off your desktop and it works (see [Running it locally](#running-it-locally) for the one caveat around that).

## How the app is architected

This is a **single-page application (SPA)** built with plain JavaScript — no framework. The important idea to understand before reading the code:

> There is only ever one HTML document loaded. What look like separate "pages" (Dashboard, Exercises, Calendar, etc.) are really ten `<section>` elements sitting in the same page at once, with all but one hidden by CSS at any given moment. Clicking a sidebar link doesn't load a new page — it just hides the current section, shows another one, and updates the browser's URL hash (`#exercises`, `#calendar`, …) so the address bar and back/forward buttons behave normally.

Everything the app "remembers" — accounts, passwords (yes, really — see the limitations section), logged workouts, weights, food entries, forum posts, favorites, custom photos, your chosen theme — is written to the browser's `localStorage`/`sessionStorage`. There is no server and no database; refreshing the page re-reads whatever was last saved on that device.

## index.html: the page shell and all ten views

`index.html` contains no inline styles or scripts — it links out to `style.css` and `script.js` and otherwise is just markup. It has three top-level pieces:

**1. `<div id="authView">`** — the sign-in / create-account screen. This is what shows before you're logged in: a left-hand panel with the wordmark and tagline, and a right-hand panel with two tabs (`Sign in` / `Create account`). The sign-up tab contains a **3-step onboarding wizard**:
   1. Name, email, password
   2. Gender, age, height, weight
   3. Fitness level, goal, target weight, equipment access, weekly frequency, medical limitations

   All the input fields use real `autocomplete` attributes (`email`, `new-password`, `current-password`, etc.) so browser autofill and password managers work normally, and there's a "remember me" checkbox on both sign-in and sign-up.

**2. `<div id="appShell">`** — everything you see once logged in. It contains:
   - `<nav id="sidenav-mount">` and `<header id="topbar-mount">` — both start **empty**. `script.js` fills them in at runtime (see `initShell()` below) because their content depends on who's logged in (name, avatar, admin link visibility, streak count).
   - `<main id="main-content">`, holding all ten view sections back to back:

     | `data-view` | What it is |
     |---|---|
     | `dashboard` | Stat cards, weekly progress ring, this-week schedule, goal-setting form |
     | `exercises` | The exercise library: anatomy map, filters, exercise cards, video modal |
     | `builder` | Drag-and-drop routine builder |
     | `calculator` | BMI/BMR calculator and weight tracker with a chart |
     | `calendar` | Drag-and-drop monthly workout scheduler |
     | `nutrition` | Food log, food database, recipes, shopping list |
     | `community` | Forum, leaderboard, trainer tips, feedback |
     | `pricing` | Membership plans and promo codes (a UI mock — no real payments) |
     | `settings` | Profile editing, avatar, dark mode, data export |
     | `admin` | Member management, catalog editing, moderation (admin-only) |

     Every section has both a `data-view="name"` attribute and a matching `id="view-name"` — the router uses these to know which section to show and which to hide.

**3. `<div id="timerOverlay">`** — the full-screen workout countdown, sitting outside the main content so it can cover the whole viewport regardless of which view is active underneath it.

## style.css: the design system

One stylesheet, organized top to bottom as:

1. **Design tokens** (`:root` and `[data-theme="dark"]`) — every color, radius, shadow, and font is a CSS custom property here. Dark mode is implemented by swapping the value of these variables on `<html data-theme="dark">`, not by duplicating rules — every component below just references `var(--surface)`, `var(--text)`, etc., so it repaints correctly in both themes for free.
2. **Wordmark / eyebrow / the "rep counter" motif** — the small pill-shaped labels and monospace numbering used throughout as a recurring visual signature.
3. **Buttons & form fields** — every `.btn` variant, inputs, checkboxes, chips, tags.
4. **App shell** — the sidebar, topbar, mobile hamburger menu and its slide-in behaviour, the theme switch and text-size control.
5. **Cards & grids** — the generic `.card`/`.grid` system, stat cards, the progress ring (an SVG `<circle>` with an animated `stroke-dashoffset`), exercise cards, skeleton loading placeholders, toasts, modals, tabs, tables.
6. **Auth page** — the split-panel sign-in/sign-up layout.
7. **Text-size control** — `html[data-fontscale="sm|md|lg|xl"]` rules that scale the root font size (the "A / A / A / A" buttons in the topbar).
8. **Print stylesheet** (`@media print`) — hides the sidebar, topbar, and buttons so "Export as PDF" and "Print routine" produce a clean printed page instead of the full app UI.

There's also a handful of feature-specific rules further down for things that don't fit the generic system: the calendar grid, the anatomy-map SVG, the drag-and-drop builder columns, and the full-screen timer overlay.

## script.js: everything the app does

This file is one long script, but it's really **sixteen modules concatenated in dependency order** — fifteen of them were separate files during development (`data.js`, `store.js`, `main.js`, one file per view, `auth.js`, `router.js`), combined here so the whole app only needs two tags in the `<head>`/`<body>`; the storage shim (module 1, below) sits in front of all of them. Reading it top to bottom:

### 1. Storage shim
Some environments (notably in-app previews) sandbox real `localStorage`/`sessionStorage` away. This block probes for real storage at startup with a throwaway write/read, and — only if that fails — transparently swaps in a same-shaped in-memory object instead, so the app degrades gracefully (you can still click around) rather than throwing errors everywhere. A small dismissible banner (`showStorageFallbackNoticeIfNeeded`) explains when this fallback is active. **In a normal browser tab this never triggers** — the app just uses real storage, which is why data persists across reloads once you've downloaded and opened the file yourself.

### 2. Mock catalog data
`EXERCISE_SEED`, `FOOD_SEED`, and `RECIPE_SEED` are plain arrays standing in for what would normally be an API response. `seedDatabaseIfEmpty()` copies them into `localStorage` the first time the app runs, and only then — so if you (or the admin panel) edit the catalog, those edits stick around instead of being overwritten by the seed data on the next reload.

### 3. Data & auth layer (the "backend")
Every function here is a thin wrapper around `localStorage`, standing in for what a real app would send to a server:
- **Accounts**: `signup()`, `login()`, `logout()`, `currentUser()`, `updateCurrentUser()`, `isAdmin()`. `login()` writes the session to `localStorage` if "remember me" is checked, or `sessionStorage` if not — which is the actual mechanism behind "stay signed in on this device."
- **Health data**: `logWeight()`/`getWeightLog()`, `addFoodEntry()`/`getFoodLog()`, `getCalendar()`/`setCalendar()`, `getGoals()`/`setGoals()`.
- **Community**: `getComments()`/`addComment()`/`deleteComment()` (the feedback inbox).
- **Catalog editing**: `getExercises()`/`saveExercises()`, `getCustomPics()`/`setCustomPic()` (per-exercise photo replacement).
- **Preferences**: `applyStoredTheme()`/`toggleTheme()`, `applyStoredFontScale()`.
- `seedAdminIfEmpty()` creates the one guaranteed `admin@form.app` account the very first time the app runs on a browser with zero accounts — this is what makes the admin login work without you having to sign up first.

### 4. Shared UI shell
- `initShell()` builds the sidebar and topbar HTML from scratch (name, avatar initials, role, streak, dark-mode switch, text-size buttons, logout, mobile menu) and wires up their click handlers. It's written to be **safe to call more than once** — if a different person logs in later in the same browser session, calling it again fully replaces the old sidebar rather than leaving stale info on screen.
- `initTabsWithin(containerEl)` is a small, reusable helper for the tab groups used on the Nutrition, Community, and Admin views. It's deliberately *scoped* to one container element — an earlier version wired tabs globally (`document.querySelectorAll('.tab-btn')`), which meant clicking a tab in Community could accidentally blank out whatever tab was active on the Nutrition view. Scoping it to `containerEl.querySelectorAll(...)` keeps each view's tabs independent.
- `toast()`, `openModal()`/`closeModal()`, `fileToDataUrl()` — generic notification, dialog, and image-upload-to-base64 helpers used throughout the rest of the file.

### 5. Dashboard
`renderDashboard(user)` pulls together the latest weight, computed BMI, current streak, and this week's completed-vs-target workout count into the stat cards, draws the SVG progress ring, lists the 7-day schedule, and wires the goal-setting form.

### 6. Exercises
The largest single module. `filteredExercises()` applies every active filter (equipment, difficulty, body region, duration, gender, the anatomy-map muscle selection, free-text search, favorites-only) to the catalog; `render()` groups whatever's left by body region and paints the cards. `openExerciseModal()` builds the video/description/step-carousel/clips/"add to calendar" detail popup, and `openExerciseEditor()` is the admin add/edit/delete form — both are shared with the Admin view's exercise table.

> Note: the step-carousel's "Next" button inside this modal uses ids like `exStepNext` rather than the shorter `stepNext` you might expect — that's deliberate, because the sign-up wizard on the auth screen *also* has a `stepNext` button, and since both live in the same document at the same time, a generic id would let a click in one accidentally control the other.

### 7. Calculator
`calculate()` runs the Mifflin–St Jeor formula for BMR, multiplies by an activity factor for TDEE, and splits that into protein/carb/fat gram targets. `renderChartAndTable()` draws the weight-history line chart by hand on a `<canvas>` — there's no charting library — and `setUnits()` converts every visible field between metric and imperial on the fly.

### 8. Calendar
`renderCalendar()` builds the month grid and wires native HTML5 drag-and-drop: dragging a favorited exercise from the tray (`renderTray()`) onto a day calls `addToDay()`; clicking a scheduled item calls `toggleDone()`, which also bumps the streak if you're completing something on today's date.

### 9. Nutrition
Four render functions (`renderStats`, `renderLog`, `renderDatabase`, `renderRecipes`, `renderShopping`) cover today's totals, today's logged items, the searchable food database, the recipe cards, and the accumulated shopping list — all reading/writing through the data layer described above.

### 10. Routine builder & workout timer
`renderPool()`/`renderRoutine()` handle the two drag-and-drop columns (including reordering *within* the routine list, not just adding to it). `startWorkout()` kicks off `runInterval()`, which runs a `setInterval`-driven per-exercise countdown, calling `beep()` (a short Web Audio tone, no audio file) in the last five seconds and `nextInterval()` when time's up. `endWorkout(true)` — reached either by finishing the last exercise or clicking "End workout" after completing it — logs the routine onto today's calendar and increments the streak.

### 11. Community
`seedThreadsIfEmpty()` seeds three sample forum threads on first run. `renderThreads()` handles the topic-filtered thread list with inline reply forms; `renderLeaderboard()` ranks every account on the device by streak; `renderFeedback()` is the comments/complaints/suggestions inbox; `renderQa()` lists questions submitted for the (static, illustrative) trainer Q&A session.

### 12. Settings
Pre-fills the profile form from the current account, wires avatar upload/removal (via `fileToDataUrl`), profile saving, the dark-mode switch, the "stay signed in" checkbox (which re-runs `login()` with the new remember-me flag), CSV/print export, and account deletion.

### 13. Admin
Gated entirely behind `isAdmin()` — everyone else sees a plain "access required" message instead of this view's content. Covers member management (promote/revoke admin, delete), the exercise catalog table (reusing the same edit/delete modal as the Exercises view), the food database table, and moderation (deleting feedback submissions and forum threads). It also monkey-patches `saveExercises()` so this table automatically repaints itself whenever an exercise is saved from *anywhere* in the app, including the modal opened from the Exercises view.

### 14. Pricing
A small, explicitly-labelled UI mock: `paintPlan()` updates the "current plan" tag and button text when you pick Free/Plus/Coach, and a `PROMO_CODES` lookup drives the promo-code form. No payment processing happens anywhere.

### 15. Auth screen logic
`initAuthScreen()` wires the sign-in/sign-up tab switch, the "autofill admin login" button, the sign-in form, and the 3-step sign-up wizard's per-step validation and final submission. It's guarded by an `authScreenBooted` flag so its listeners only ever get attached once, even though (see below) the app's boot sequence can technically run twice.

### 16. The router
The piece that makes the single-page-app idea actually work:
- `showView(name)` shows the matching `<section>`, hides the other nine, updates the active sidebar link, updates the topbar heading, and syncs the URL hash — then calls that view's entry in `VIEW_REFRESH` so it always shows current data when you navigate to it.
- `enterApp()` runs right after a successful login or signup: reveals the app shell, rebuilds the sidebar for whoever just logged in, and shows the right view.
- `exitToAuth()` is what `logout()` calls: hides the app shell, shows the auth screen again, clears the hash.
- `bootApp()` is the one genuinely non-obvious trick in the file: because every view's setup code is written as a `document.addEventListener('DOMContentLoaded', …)` block (so it would "just work" if these were still separate pages), and `DOMContentLoaded` only fires once naturally, `bootApp()` manually re-dispatches a synthetic `DOMContentLoaded` event the moment someone actually logs in. That re-runs every view's setup for the first time (they all check `currentUser()` and do nothing until someone's logged in). An `appBooted` flag makes sure this only ever happens once per browser session, so logging out and back in doesn't double up every click handler in the app.
- The final block at the bottom is the true entry point: on the page's real `DOMContentLoaded`, it wires the auth screen, checks whether someone's already logged in (e.g. a remembered session) and jumps straight into the app if so, or shows the sign-in screen if not.

## GitHub Pages deployment files

**`.nojekyll`** — an empty file. GitHub Pages runs everything through Jekyll (a static site generator) by default, which ignores files and folders starting with an underscore and can otherwise interfere with a plain static site. This file tells Pages to skip that processing and serve the files exactly as they are.

**`.github/workflows/deploy-pages.yml`** — a GitHub Actions workflow with two triggers: any push to `main`, or a manual run from the Actions tab (`workflow_dispatch`). It has one job that:
1. Checks out the repository (`actions/checkout`).
2. Uploads the repo root (`path: .`) as a Pages deployment artifact (`actions/upload-pages-artifact`) — this is why `index.html` needs to sit at the repository root rather than in a subfolder.
3. Publishes that artifact to GitHub Pages (`actions/deploy-pages`).

To turn this on: push this repo to GitHub, then go to **Settings → Pages** and set **Source** to **GitHub Actions**. The workflow will run automatically and the Actions tab will show the live URL once it finishes.

## Running it locally

Because the whole app is static files, you can just open `index.html` directly in a browser — no server, no `npm install`. Data you create (accounts, logged weights, etc.) is saved to that browser's `localStorage` and will still be there next time you open the same file from the same location.

If you'd rather serve it (optional, but avoids any browser-specific quirks with the `file://` protocol):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Data, privacy & known limitations

- **Everything is local.** There is no server anywhere in this project. Every account, password, and logged data point lives in that one browser's `localStorage`/`sessionStorage` and never leaves the device.
- **Passwords are stored in plain text** in `localStorage` (see `signup()`/`login()` in `script.js`). That's fine for a demo, but this is *not* an authentication system suitable for real user data — there's no hashing, no server-side validation, and anyone with access to that browser's dev tools can read every password on the device.
- **Exercise and recipe photos** load from `picsum.photos` (a placeholder-image service), so an internet connection is needed to see them — everything else works fully offline.
- **The "Plans & Billing" page** is a visual mock only; no payment provider is integrated.
- Clearing your browser's site data for this page (or opening it in a different browser/device) resets everything, including the seeded admin account — it will simply be re-created the next time the app loads with zero existing accounts.
