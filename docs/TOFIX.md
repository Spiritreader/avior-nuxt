# Avior — Vue 3 / Vuetify 4 migration: outstanding visual issues

Handoff document. The functional migration is complete and verified (data, API, routing,
behaviour). What remains is visual fidelity: Vuetify 4 is Material Design 3 and changed a
lot of component defaults, and the port left a number of genuinely broken layouts behind.

Branch: `migration/vue3`. All items below were reported by the user against the running app.

---

## How to work on this

```bash
# the new app
pnpm dev        # Vite (5173) — has host:true and allowedHosts:true, reachable by hostname
pnpm dev:api    # Express + Mongo (10009)

# production path (what the user has been testing)
pnpm build && node server/index.js     # serves dist/ + /api on 10009

# the OLD Nuxt app, for side-by-side comparison — THIS IS THE GROUND TRUTH
cd ../avior-nuxt-reference && pnpm dev   # pinned to port 3300
```

`../avior-nuxt-reference` is a git worktree pinned to commit `baff6fe`, the last commit
where Nuxt still ran. Its `nuxt.config.js` is locally patched to pin port 3300 and set
`http.baseURL` to match (under SSR, `@nuxt/http` otherwise falls back to `localhost:3000`
and its own API calls time out).

Environment: MongoDB at `mongodb://192.168.178.75:27017/Avior`. Daemons VDR-U/-1/-2 at
`192.168.178.61:10000-10002`. Phoenix and VAVA are genuinely offline.

### Do not guess — measure

Every fix below that stuck was found by measuring computed styles in BOTH apps with
Playwright and diffing them. Reading Vuetify's CSS is unreliable: `vuetify/styles`
resolves to `lib/styles/main.css`, NOT `dist/vuetify.css`, and component styles are
injected per-component by `vite-plugin-vuetify`. `scripts/inspect-page.mjs` is the
headless inspector (console + semantic structure dump + screenshot). Write throwaway
Playwright scripts under `scripts/` to compare computed styles; several examples are in
the git history.

---

## STILL BROKEN

### 1. Tab / window slide animation not visible to the user
The user reports NO animations anywhere — tab switches, expand transitions.

What was verified: the transition demonstrably runs in the built app. Sampling
`.v-window-item` transforms every 40ms across a tab switch shows a real 320ms slide
(outgoing `x=0 → -911px`, incoming `x=912 → 0`). `VWindow.css` is loaded, the transition
classes fire, duration is `0.3s`.

Leading hypothesis, NOT yet confirmed: **Vuetify 4 honours `prefers-reduced-motion` and
Vuetify 2 does not.** Vuetify 2's CSS has zero such rules; Vuetify 4's `VWindow.css` has
`@media (prefers-reduced-motion: reduce) { transition-duration: 0s }`. Verified in
Playwright: `no-preference` → `0.3s`, `reduce` → `0s`. Windows reports `MinAnimate = 1`
(animations on), so it is not the OS setting — but Windows 11's Accessibility → Visual
effects → "Animation effects" toggle is separate, and browser flags/extensions can force
it too.

NEXT STEP — ask the user to run this in their browser console:
```js
matchMedia('(prefers-reduced-motion: reduce)').matches
```
- `true`  → that is the whole cause. Decide whether to override it (the app can opt out
  by re-declaring the transition durations outside the media query in
  `src/styles/vuetify2-compat.css`).
- `false` → the built app animates but the user's does not. Check whether they are on the
  Vite dev server vs the built output, and re-test there.

### 2. Resolutions list (config → Resolutions) row spacing
Rows are too far apart vs the original. `Property.vue`'s markup is IDENTICAL to the
original, so this is Vuetify 4's `v-container` / `v-row` / `v-col` / text-field metrics.
NOT yet measured. Measure `v-container` padding, `v-row` margins, `v-col` padding and the
outlined text-field height in both apps and reconcile.

### 3. Audio formats list — delete button placement
The add-field now stretches correctly (fixed), but the red X sits immediately after the
item text rather than at the right edge of the list item. In Vuetify 2 the (now-deleted)
`v-list-item-content` stretched and pushed the button to the far right. The `#append`
slot in `SimpleList.vue` should do this — check why the title is not flex-growing.

### 4. Global config: delete / add buttons in the table toolbar
User reported "button margins on the global config card are busted". The toolbar
background and search-bar padding ARE fixed. The red delete and blue `+` buttons at the
right of the toolbar still look cramped/small. Compare against the reference.

### 5. Whole-app sweep not done
The user has been finding these page by page. The pages NOT yet walked in detail:
`/jobs` (beyond the system bar), `/settings`, config → General, config → Encoder,
globalconfig → Clients tab. Expect more of the same class of issue.

---

## FIXED (for reference — these are the failure patterns to look for)

Every one of these was a broken port, not an MD3 aesthetic. The pattern is almost always:
*a Vuetify 2 default that Vuetify 4 changed, silently.* `vue-tsc` catches NONE of them —
unknown attributes on a Vue component fall through to `$attrs` with no type error.

| Symptom | Root cause | Commit |
|---|---|---|
| Everything the wrong font | Roboto was never installed. Vuetify's CSS asks for it but does not ship it; `@nuxtjs/vuetify` used to inject it from Google Fonts. Now self-hosted via `@fontsource/roboto`. | `7e12c1c` |
| Headings rendered at body size | Vuetify 4 DELETED the old typography classes. `.display-1`, `.headline`, `.title`, `.body-1`, `.text-h4`, `.text-overline` do not exist and are not aliased. Mapped to the MD3 scale. | `7e12c1c` |
| Status icons huge | Vuetify 4 derives an icon-button's glyph size from the button size (em-based); Vuetify 2's `.v-icon` was a fixed 24px. | `eafcc63` |
| Icon buttons were filled coloured discs | Vuetify 2's `icon` prop implied flat styling and `color` tinted the ICON. In Vuetify 4 `icon` only sets the shape; `variant` defaults to `elevated`, so `color` became a background. All 30 needed `variant="text"`. | `1f86e77` |
| Card header margins doubled | Vuetify 2's `large` icon button was 44px; Vuetify 4's `size="large"` is 56px. The 12px inflated the flex row. | `b457f9f` |
| Paragraphs too far apart | Vuetify 4 REMOVED Vuetify 2's global `* { margin: 0; padding: 0 }` reset, so every `<p>` picked up the browser's 1em UA margin. Restored in `src/styles/reset.css` — **it must live in Vuetify's `vuetify-core.reset` sublayer**; a bare `@layer reset` orders AFTER Vuetify's layers and starts beating `ma-0`. | `9fad632` |
| Green bar spanned the whole page | `VSystemBar` calls `useLayoutItem` in Vuetify 4 — it is a LAYOUT component and hoists out of the card. No prop restores inline behaviour. Replaced with a plain `v-sheet` strip. | `9fad632` |
| Progress arc started at 9 o'clock | Vuetify 2's arc started at 3 o'clock so the code passed `rotate="-90"`. Vuetify 4 already applies `rotate(calc(-90deg + Xdeg))` internally, so the inherited -90 rotated it a further quarter turn. | `9fad632` |
| Buttons/tabs not uppercase, wrong weight | MD3 dropped the uppercase default and re-specced button text (`uppercase→none`, `1.25px→0.11px`, `500→400`, `14px→16px`). Restored in `src/styles/vuetify2-compat.css`. **These rules are UNLAYERED on purpose** — Vuetify sets them in a cascade layer, and layer order beats specificity, so a rule inside `vuetify-overrides` still lost. | `a01fccd` |
| No stripes on the encoder bar | THREE stacked bugs: (a) Vuetify 2's `VProgressLinear` defaulted to `color="primary"`, Vuetify 4 has no default → white bar, and the stripes are white at 25% alpha; (b) `background-size` went from `40px 40px` to `8px` (the bar's height); (c) `background-repeat` went from `repeat` to `no-repeat`. Any one alone hides them completely. | `1dbadca` |
| Grey box inputs everywhere | Vuetify 4 defaults inputs to `variant="filled"`. This app is an underlined-input design (Vuetify 2's default). Set once via `createVuetify`'s `defaults` — the idiomatic v4 mechanism. | `5e60102` |
| Module card: switch on its own line, title glued to top | Vuetify 4's `v-card-title` is `display: block` with nowrap/ellipsis, not a flex row, so `v-spacer` did nothing. The original's `pt-0` was harmless in v2 (the switch's margins filled the gap) but glues the title to the card edge in v4. | `5e60102` |
| Client select showed `[object Object]` | `selectedClient` was initialised to `{}`. Vuetify 2 rendered that blank; Vuetify 4 falls back to `String(value)` for a model it cannot resolve against `items`. `null` is the correct empty model. | `5e60102` |
| SimpleList add-field would not stretch, caret offset | The input was nested in `<v-list-item-title>`, which in Vuetify 4 is `overflow: hidden` / `nowrap` with a fixed line-height. It belongs in the list item's content slot. | `5e60102` |
| Search bar grey stripe, no left margin | Vuetify 4's `v-toolbar` paints its own surface colour (v2's flat toolbar inherited the card's) and has different content padding. `color="transparent" class="px-2"`. | `cbb02f7` |

---

## Known pre-existing bugs — DO NOT "fix" these silently

Found during the migration, present in the Vuetify 2 original too. They were deliberately
preserved so the migration would not smuggle in behaviour changes. They are the user's
call:

- `jobs.vue`: `selectedJobs.length` bug means the Delete button never shows a count.
- `jobs.vue`: `reassignJobs()`'s `idx % 5` batching is INERT — `idx` is a client-ID string,
  so both branches are always false and the batch never flushes.
- `Client.vue`: a `:v-show=` binding that has never done anything; a duplicated
  `showProcessedLog = false`; the author's own `//todo: BUGGED!!!!` dead branch.
- `Client.vue` emits `offlineClient` as an OBJECT from `onclose` but a bare STRING from
  `onerror`; `index.vue`'s handler would throw on the string. Unreachable today.
- `Age/ErrorReplace/ErrorSkip/MaxSizeSettings`: a `watch` on `selectedFormat`, which does
  not exist in their data or props — so they have NEVER emitted `newdata`.
  `SizeApproxSettings` has the same problem via a missing `deep: true`. It does not matter
  in practice: `settingsInternal` is the SAME object reference as
  `config.Modules.X.Settings`, so `v-model` mutates the config in place (proved by changing
  AgeModule MaxAge 5→99 and confirming the export contained 99).
- `config.vue`: `color="gray darken-3"` is an invalid palette key ("grey" is the real one).
  It was ALREADY a no-op typo in Vuetify 2, so hyphenating it would ADD colour the page
  never had.
- `v-col xs="6"`: dead in BOTH versions. Vuetify 2's `VCol` breakpoints were
  `['sm','md','lg','xl']` — there has never been an `xs` prop. Converting it to `cols`
  would ADD a span the page never had.
- Client ordering on `/` is nondeterministic in BOTH versions — neither sorts; both push
  clients in whatever order their `/alive` probe wins. Verified across three reloads each.
  If active-first sorting is wanted, that is a new feature, not a fix.

## Never verified — needs the user

- **No Docker image has ever been built.** Docker is not installed on this machine and it
  was scoped out. The multi-stage Dockerfile, `node:24-alpine`, and the `VITE_COMMIT_SHA`
  build arg (which drives the footer's commit hash) are all untested.
- Client.vue's FileWalker / Mover render paths were never exercised (no daemon was in
  those states).
