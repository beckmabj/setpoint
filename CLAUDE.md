# Setpoint — personal nutrition tracker

A single-file web app for tracking calories, macros, and weight, with adaptive
calorie targets. Built as a personal replacement for a paid subscription app.
Owner: Brandon.

## Project structure

- `index.html` — the ENTIRE app. One file, no build step, no bundler, no npm.
  HTML + CSS + vanilla JS. Do not introduce a framework or build tooling
  without asking; the single-file constraint is deliberate so it can be
  hosted as a static page anywhere.

## How it works

**Rendering:** A single `render()` function rewrites `#app` innerHTML from a
global state object `S`. Event handlers are wired via inline `onclick=` and
exposed with `window.fnName = fnName`. There is no virtual DOM or reactivity —
after mutating `S`, call `render()`.

**Auth + data:** Firebase (Auth + Firestore), loaded from CDN via
`<script type="module">`. The module exposes a small API on `window.FB`
(createUser, signIn, signOutUser, resetPassword, getUserDoc, setUserDoc) and
calls `window.onAuthReady(user)` when auth state resolves.

All user data (profile, targets, logs, savedFoods) lives in one Firestore doc
at `users/{uid}`. `localStorage` is used ONLY for the theme preference.

**Adaptive targets:** The core feature. `estimateFromFormula()` gives an initial
Mifflin-St Jeor estimate. `estimateFromData()` re-derives actual maintenance
calories by regressing smoothed (EMA) trend weight against logged intake over a
14-day window, requiring 7+ days with both weight and food logged. Surfaced in
the Strategy tab via "Check my numbers".

**Food data:** Open Food Facts public API (search + barcode lookup). No API key.
Requires internet; everything else works offline.

**Charts:** Hand-rolled inline SVG builders (`svgSparkline`, `svgTrendChart`,
`svgBarChart`, `svgBarWithReference`, `svgRing`). No chart library.

## Conventions that matter

- **Colors:** CSS custom properties in `:root` and `:root[data-theme="dark"]`.
  Dark is the default. CSS `var()` does NOT reliably resolve inside raw SVG
  presentation attributes (`fill=`, `stroke=`), so SVG code uses the JS `COLOR`
  proxy instead, which resolves per-theme. If you add a color, add it to BOTH
  CSS blocks AND both `COLOR_LIGHT` / `COLOR_DARK` maps or dark mode breaks.
- **Macro colors:** calories = blue, protein = brick red, fat = amber,
  carbs = purple. Chosen for separation; don't collapse them toward each other.
- Escape user/API-supplied strings with `esc()` when interpolating into HTML.
- Keep new UI inside the existing card / pill-toggle / sheet patterns.

## Verify after editing

There are no tests. At minimum, before considering a change done:

```bash
# extract and syntax-check both script blocks
python3 -c "
import re; h=open('index.html').read()
m=re.findall(r'<script type=\"module\">(.*?)</script>',h,re.S); open('/tmp/m.mjs','w').write(m[0])
p=re.findall(r'<script>(.*?)</script>',h,re.S); open('/tmp/p.js','w').write(p[-1])
"
node --check /tmp/m.mjs && node --check /tmp/p.js
```

Also confirm every `onclick=` target is actually defined, and that any new
`getElementById` id exists in the markup. Broken inline handlers fail silently.

## Testing locally

Open via a local server, NOT file:// — Firebase auth requires an authorized
domain, and `localhost` is authorized by default while `file://` is not:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Current state / next steps

- Firestore security rules must be published in the Firebase console
  (users can only read/write `users/{their own uid}`).
- Deploy target: GitHub Pages, serving `index.html` from repo root.
  Then open on iPhone in Safari → Add to Home Screen (installs as a PWA).
  Note: iOS Safari cannot run JS from a local file, so a real https:// URL
  is required on mobile — this is why hosting is necessary, not optional.
- Not yet built: Recipes / New Recipe (shown as "Soon" in the Shortcuts sheet).
- Barcode entry is currently typed-in, not camera-scanned.
