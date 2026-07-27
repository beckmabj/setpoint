# Tare — personal nutrition tracker

A single-file web app for tracking calories, macros, fibre and weight, with
adaptive calorie targets. Built as a personal replacement for MacroFactor.
Owner: Brandon. Used almost exclusively on an iPhone, installed to the home
screen as a PWA.

The repo, the GitHub Pages URL and the Firebase project are all still named
`setpoint` — the app was renamed to Tare after they were created. Renaming
them would break the live URL and the installed home-screen app, so the names
stay.

## Project structure

- `index.html` — the ENTIRE app. One file, no build step, no bundler, no npm.
  HTML + CSS + vanilla JS. Do not introduce a framework or build tooling
  without asking; the single-file constraint is deliberate so it can be hosted
  as a static page anywhere.
- `firestore.rules` — record of the published security rules.
- `firebase.json`, `.firebaserc` — so the Firebase CLI can deploy those rules.
- `tools/stamp-build.sh` — writes the build number into `index.html`. Installed
  as a pre-commit hook (`.git/hooks/pre-commit`); re-install it after a clone.

## How it works

**Rendering:** one `render()` rewrites `#app` innerHTML from a global state
object `S`. Handlers are inline `onclick=` exposed via `window.fn = fn`. No
virtual DOM — after mutating `S`, call `render()`. `render()` preserves scroll
position, because replacing innerHTML otherwise jumps you to the top.

**Auth + data:** Firebase Auth + Firestore from CDN in a `<script type="module">`
block that exposes `window.FB` and calls `window.onAuthReady(user)`.

Firestore uses `persistentLocalCache`, so writes made offline are durable and
flush on reconnect. Consequently `setDoc` resolves only when the *server*
acknowledges — which offline may be hours. `saveField()` therefore does NOT
await it; it tracks the promise only to drive the sync indicator in the top
bar. A rejection means a real failure, not merely being offline.

**Storage layout:**

- `users/{uid}` — `profile`, `targets`, `savedFoods`
- `users/{uid}/logs/{YYYY-MM}` — `{ days: { 'YYYY-MM-DD': { weightLbs, foods[] } } }`

Logs are sharded by month because a single document caps at 1 MiB, roughly
4,000 entries. `persistLogs([months])` rewrites only the months touched.
Accounts predating the split still carry a legacy `logs` map on the user
document; the loader merges it and migrates in the background, writing shards
and only clearing the old field once they are acknowledged — never the reverse.

`localStorage` holds the theme preference and the dashboard Consumed/Remaining
toggle. Its key prefix is still `setpoint:` and must stay that way — a
migration path reads pre-Firebase data out of those keys.

**Log entries** carry the food's per-100g values plus the amount and unit that
produced them, so an entry can be re-logged or rescaled after the fact:

```js
{ id, at, name, brand, foodId, amount, unit, servingGrams,
  per100: { calories, protein, carbs, fat, fiber },
  label, calories, protein, carbs, fat, fiber }
```

Entries written before this shape lack `per100`/`amount`/`unit`/`at`. Every
reader must degrade gracefully — `entryToFood()` returns `null` for them, which
keeps them out of Recents rather than producing a broken re-log.

**Adaptive targets** — the reason the app exists. `estimateFromFormula()` gives
a Mifflin-St Jeor starting point (from the *current trend weight*, not the
onboarding weight). `estimateFromData()` re-derives real maintenance by
regressing weight against intake over `TDEE_WINDOW` (14) days, needing
`TDEE_MIN_DAYS` (7) days with both logged. Both the dashboard card and Strategy
call it through `currentEstimate()` so they cannot disagree.

Three things there are easy to get wrong and were all bugs once:

- Regress **raw** weigh-ins, not the EMA. The EMA lags ~8 days, so its slope is
  shallower than reality and understated maintenance by ~158 kcal/day.
- Anchor the window to **today**, not the last logged day, or a stale estimate
  is presented as current.
- Average intake over **every day with food** in the window, not only days that
  also had a weigh-in.

**Food data:**

- **Search** — USDA FoodData Central (primary) and Open Food Facts (secondary),
  run in parallel and merged. USDA curated failing is fatal; the others are
  additive and swallowed. OFF *does* send CORS headers, but rate-limits hard
  with a CORS-less 503, which looks exactly like a hard block if you sample
  during one — hence three spaced retries. It also narrows sharply with each
  extra word, so a failed multi-word query retries on a shorter phrase.
- Ranking matches **name + brand**, since branded products keep the brand in a
  separate field ("Lightly Breaded Chicken Breast Bites", brand "Just Bare").
  It prefers whole foods over prepared, plain forms over processed, and the
  head noun at either end of the query ("ground BEEF" vs "Beef, ground").
- **Barcode** — Open Food Facts `api/v2/product/{code}`, which is CORS-clean.
  Camera scanning uses ZXing, lazily imported from CDN only when opened.

**Charts:** hand-rolled inline SVG (`svgArcGauge`, `svgSparkline`,
`svgTrendChart`, `svgBarChart`, `svgBarWithReference`, `svgRing`). No library.

## Screens

- **Dashboard** — date + big title, an open-bottom arc gauge (remaining /
  consumed / target), three macro columns, a Consumed/Remaining toggle that
  changes which number the gauge centres on, then a week tile plotting each
  day's *deviation* from target (up in brick when over, down in green when
  under), then insight cards and streaks.
- **Log** — the day as hour slots from 5 AM to 11 PM, widening only to include
  hours that hold food or the current hour. Time rail, food emoji, per-hour
  totals, tap an entry to edit it, docked search bar with a barcode button.
- **Picker** (bottom sheet) — Recent / Search / My Foods / Custom. Recent opens
  with picks for the hour being logged into, scored by how often each food
  appears within ±1 hour. Selecting a food shows its impact on the day. The
  primary action is sticky at the bottom of the sheet — it must stay reachable
  with the keyboard up.
- **Strategy** — current program, adaptive recalculation, manual target entry,
  profile.
- **More** — export (JSON backup, food-log CSV, daily CSV), import, duplicate
  food merge, theme, reset, build number.

## Conventions that matter

- **Colours:** CSS custom properties in `:root` and `:root[data-theme="dark"]`.
  Dark is the default. CSS `var()` does NOT reliably resolve inside raw SVG
  presentation attributes, so SVG uses the JS `COLOR` proxy. A new colour must
  be added to BOTH CSS blocks AND both `COLOR_LIGHT`/`COLOR_DARK` maps.
- **Macro colours:** calories = blue, protein = brick, fat = amber,
  carbs = green. (Carbs was purple; it read too close to the calories blue.)
- **Type scale:** the `t10`–`t16` classes step 11/12/13/14/15.5/17/19 and
  `.sect-h` is the 21px section heading. The app previously ran 10–14px and
  felt cramped next to its reference; keep new UI at this scale.
- `esc()` every user- or API-supplied string interpolated into HTML. For values
  going into an inline `onclick="fn('...')"`, `esc()` is NOT enough — the HTML
  parser decodes entities before the JS is parsed, so an escaped quote becomes
  a real one again. Use `jsId()`, which allowlists characters.
- Imported files are untrusted. `cleanProfile`/`cleanTargets`/`cleanLogs`/
  `cleanSavedFoods` validate at the boundary rather than escaping at render.
- Keep new UI inside the existing card / pill-toggle / sheet patterns.

## Verify after editing

There are no tests. At minimum, before considering a change done:

```bash
# syntax-check both script blocks
python3 -c "
import re; h=open('index.html').read()
m=re.findall(r'<script type=\"module\">(.*?)</script>',h,re.S); open('/tmp/m.mjs','w').write(m[0])
p=re.findall(r'<script>(.*?)</script>',h,re.S); open('/tmp/p.js','w').write(p[-1])
"
node --check /tmp/m.mjs && node --check /tmp/p.js

# every inline handler must exist on window — broken ones fail silently
python3 -c "
import re; h=open('index.html').read()
calls=set()
for a in ['onclick','onsubmit','oninput','onchange','onfocus','onblur']:
    calls |= set(re.findall(a+r'=\"([a-zA-Z_\$][\w\$]*)\(', h))
js=re.findall(r'<script>(.*?)</script>',h,re.S)[-1]
print('missing:', sorted(calls-set(re.findall(r'window\.([\w\$]+)\s*=', js))-{'this'}) or 'none')
"
```

Then exercise it in a browser. Layout bugs do not show up in measurements:
a white button-face background and a column of dead space were both invisible
until someone looked at a screenshot.

## Testing locally

```bash
python3 -m http.server 8000   # then http://localhost:8000
```

`file://` will not work — Firebase auth only accepts authorised domains, and
`localhost` is authorised while `file://` is not.

**Test signed OUT.** Drive the app by setting `S` directly and calling
`render()`, keeping `currentUid` null so nothing can persist. A browser session
left signed in to the real account once wrote test fixtures into live data.

## Deployment

Push to `main`; GitHub Pages redeploys in about a minute. Confirm with:

```bash
until [ "$(curl -s https://beckmabj.github.io/setpoint/ | wc -c)" = "$(wc -c < index.html)" ]; do sleep 5; done
```

Firestore rules deploy from this repo — the console is no longer the only path:

```bash
firebase deploy --only firestore:rules
```

Rules must match `/users/{userId}/{document=**}`; a document-only match does
not cover the logs subcollection.

Firebase Auth **authorised domains** must list every host the app is served
from or sign-in fails with no obvious error. Currently `localhost`,
`beckmabj.github.io`, `setpoint-f9948.firebaseapp.com`.

The Firebase config and the USDA API key in `index.html` are public by design.
The Firestore rules are what protect the data.

## Current state

Build 40. Deployed and in daily use. 26 days of real history imported from
MacroFactor. Verified end to end: account creation, logging, offline queueing,
sync across devices, PWA install.

## Known gaps / next steps

- Recipes are not built.
- No undo on delete; the toast component could host one.
- Tap targets in older UI are still under 44pt in places.
- Search results do not show fibre, so a food's fibre is only visible after
  selecting it.
- `estimateFromData` needs 7 paired days; with weigh-ins only from 19 July the
  account is near that threshold.
- The onboarding flow has not been revisited since the type-scale change.
