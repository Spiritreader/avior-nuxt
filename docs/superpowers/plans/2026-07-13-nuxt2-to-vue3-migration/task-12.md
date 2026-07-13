# Task 12: Port globalconfig.vue and TextDataTable.vue

Part of the Nuxt 2 to Vue 3 SPA migration.
Master plan: `docs/superpowers/plans/2026-07-13-nuxt2-to-vue3-migration.md`

You are being given only this task. Do not do work belonging to other tasks.
Read the constraints below before starting; they are not optional.

## Global Constraints

- Package manager is pnpm. Never run `npm install` or `yarn` after Task 1.
- `node` is not on PATH in this environment. pnpm ships its own runtime; use `pnpm env use --global lts` if a bare `node` binary is needed.
- Behaviour is preserved. This is a framework migration, not a redesign. Any visual or functional difference from the current app is a bug unless this plan explicitly calls for it.
- The browser calls the Avior encoding daemons directly at their absolute LAN addresses. Do not introduce a proxy for them. Only MongoDB stays behind Express.
- App-origin API calls use relative paths (`/api/...`) in both dev and prod. No `baseURL` is configured anywhere. This is deliberate: a configured base URL is what broke before.
- Vuetify 4 (currently 4.1.4), not Vuetify 3. Vuetify 4 is still a Vue 3 library — the major bump is not about Vue 4. It requires `vue: ^3.5.0`, which we have.
- LEAN ON VUETIFY 4'S DEFAULTS. Do not add props, CSS, or shims to reproduce Vuetify 2's look or behaviour. Vuetify 4 is Material Design 3: typography, elevation (25 levels down to 6), breakpoints, `VContainer` max-widths and button casing all differ by design. Cosmetic and minor behavioural deviations from the old app are ACCEPTED and will be reviewed later — the user has said so explicitly. Do not fight the framework.
- What DOES have to match: structure and data. The same components, in the same places, in the same hierarchy, with the same labels, showing the same data, and the same interactions working. Fonts, shadows, casing, spacing, counters, transitions: let them differ.
- The exception is when a Vuetify 4 default produces something plainly BROKEN rather than merely different — e.g. a footer that stretches to 320px and shoves content off the page. Fix breakage; do not fix difference. If you are unsure which one you are looking at, leave it and report it.
- List every deviation you leave in place in your report, so it can be reviewed as a batch.
- Docker is out of scope. Do not build or verify images.
- Theme: Vuetify 4 stock dark theme, with exactly two color overrides — `primary: #9E9E9E`, `secondary: #FF8F00`. Do not port the old accent/info/warning/error/success entries. Set `defaultTheme: 'dark'` explicitly: Vuetify 4 changed the default to follow system preference, which would otherwise give a light app.
- Our own components are imported explicitly. Vuetify's components are auto-imported by `vite-plugin-vuetify`. Do not add `unplugin-vue-components` for our components.
- There is no test suite, by the user's explicit choice. Every task's verification step is a manual observation against the running app. Never claim a task works without having actually run the stated command and seen the stated result.
- Every task ends with the app in a runnable state and a commit.
- The old Nuxt app CANNOT run from this working tree once Task 3 lands. Vue 2 and Vue 3 are the same package name at two versions and cannot both occupy `node_modules/vue`, and `shamefullyHoist: true` (required by Nuxt 2) forces the collision; Vuetify 2 and 4 collide identically. The old app runs from a separate git worktree at `../avior-nuxt-reference`, pinned to commit `baff6fe`, with its own `node_modules`. That worktree is the visual reference for every port task.
- Ports: Vite dev on 5173, Express standalone on 10009. The reference worktree's Nuxt picks its own port and prints it.
- `Jenkinsfile` is legacy and out of scope. Do not modify it. CI that matters is `.github/workflows/main.yml`, which only calls `docker build`.
- Server stack is Mongoose 9, Express 5, Node 24 (Task 2b). The upstream MongoDB was upgraded, and Mongoose 9 requires Node >= 20.19. Express 5 rejects a bare `'*'` path — the SPA fallback is `'/*splat'`. Do not reintroduce `body-parser`; Express has the parsers built in.
- MongoDB IS reachable at `mongodb://192.168.178.75:27017/Avior` and returns five real clients. The Avior daemons are NOT reachable (connection refused), so pages will load the real client list from Mongo and then show every client as offline. That is the environment, not a bug.

## Ported-file conventions

Tasks 4 through 12 all port Vue 2 + Vuetify 2 SFCs to Vue 3 + Vuetify 4. Every one of them follows the same rules. Read this section before starting any of those tasks; the per-task notes list only which of these apply and any file-specific gotchas.

### Template: Vuetify 2 to Vuetify 3

| Vuetify 2 | Vuetify 3 |
|---|---|
| `<v-list-item-content>…</v-list-item-content>` | removed — unwrap the children into the `v-list-item` directly |
| `<v-list-item-title>` | kept, but now a direct child of `v-list-item` |
| `<v-list-item-subtitle>` | kept, but now a direct child of `v-list-item` |
| `<v-list-item-action>` | removed — use `<template #append>` or `#prepend` on `v-list-item` |
| `<v-list-item-icon>` | removed — use `<template #prepend>` with `<v-icon>` |
| `<v-list-item-group v-model="x">` | removed — put `v-model:selected` on `<v-list>` and give each `v-list-item` a `:value` |
| `<v-tabs-items v-model="tab">` | `<v-window v-model="tab">` |
| `<v-tab-item>` | `<v-window-item>` |
| `<v-tabs-slider>` | removed — no replacement tag; slider is styled via props on `v-tabs` |
| `<v-subheader>` | `<v-list-subheader>` |
| `<v-layout>` / `<v-flex>` | `<v-row>` / `<v-col>` |
| `app`, `clipped`, `clipped-left`, `fixed` props on `v-app-bar` / `v-navigation-drawer` | removed — Vuetify 4 computes layout geometry itself |
| `app` on `v-footer` | KEPT in Vuetify 4. `VFooter` is an opt-in layout item: without `app` it becomes an ordinary flex child, stretches to fill (measured: 320px tall), and shoves the page content up. It emits NO warning, so only a screenshot catches this. Use `<v-footer app absolute>`. |
| `color="grey lighten-1"` (space-separated) | `color="grey-lighten-1"` (hyphenated). The v2 space form silently emits a broken class in v4. |
| `dark` prop on any component | removed — the theme handles it; simply delete the attribute |
| `:mini-variant="x"` on `v-navigation-drawer` | `:rail="x"` |
| `v-data-table` `headers: [{ text, value }]` | `headers: [{ title, key }]` |
| `v-data-table` slot `#item.foo` | `#item.foo` still, but `foo` now matches the header `key` |
| `v-data-table` `:items-per-page` etc. | unchanged, but check the component renders before assuming |
| `<v-time-picker>` | exists and is STABLE in Vuetify 4 (it was in labs in Vuetify 3). No labs import, no manual registration — `vite-plugin-vuetify` auto-imports it. |

### Template: additional Vuetify 4 changes

The table above covers what Vuetify 3 removed. Vuetify 4 changes more on top of it. These apply too:

| Vuetify 3 | Vuetify 4 |
|---|---|
| `<v-row dense>` / `align` / `justify` / `no-gutters` | STILL PRESENT in Vuetify 4.1.4 — verified against `VRow.d.ts`. Leave them alone. (The upgrade guide describes a future direction; the shipped component still accepts them.) |
| `v-select` / `v-combobox` / `v-autocomplete` slot `#item` | renamed `#internalItem`. `item` survives as an alias for `internalItem.raw`, so read the slot body before changing it |
| `v-container fill-height` centering | no longer centers vertically — add `d-flex align-center flex-wrap` if the centering was load-bearing |
| `elevation-8` and similar, up to 24 | elevation is now 0-5 only. Map anything above 5 down; a codemod exists |
| `text-h1` … `text-caption` typography classes | renamed to the MD3 scale (`text-display-large`, `text-headline-small`, `text-body-medium`, …). A codemod exists |
| `v-btn` uppercase by default | no longer uppercase. If a specific button's casing matters, set it explicitly |

### Silent traps: wrong in Vuetify 4, but NOT caught by vue-tsc

These are the dangerous ones. An unknown attribute on a Vue component falls through to `$attrs` with no type error, so `pnpm typecheck` passes and the component silently renders wrong. All four were found only by reading the shipped Vuetify typings. Check every one of them in every file you port.

| Vuetify 2 | Vuetify 4 | What happens if you leave it |
|---|---|---|
| `<v-text-field outlined>` (also `v-textarea`, `v-select`) | `variant="outlined"` | `outlined` is NOT a prop in v4 — it is only a value of `variant`. The attribute lands on the DOM node and the field renders as the default `filled` variant. Visibly wrong, no warning. |
| `color="red darken-3"` (space-separated) | `color="red-darken-3"` (hyphenated) | The v2 colour-helper syntax is not a valid v4 colour. The component falls back to its default colour. No warning. |
| `<v-slider ticks="always">` | `show-ticks="always"` | In v4 `ticks` takes `number[]` or `Record<number, string>`; the `"always"` value moved to the separate `show-ticks` prop. Ticks silently vanish. |
| `<v-slider :tick-labels="arr">` | `:ticks="record"` where record is `Record<number, string>` | `tickLabels` does not exist in v4 at all. Labels silently vanish. |
| `v-slider` `#thumb-label` slot arg `{ value }` | `{ modelValue }` | The slot arg was renamed. `props.value` is `undefined`. |
| `<v-btn text>` | `variant="text"` | `VBtn`'s `variant` defaults to `elevated` regardless, so a bare `text` renders a FILLED elevated button instead of a flat one. |
| `<v-btn depressed>` | `variant="flat"` | No boolean `depressed` prop. |
| `<v-btn large>` / `small` / `x-small` / `x-large` | `size="large"` / `size="small"` / … | No boolean size props exist in v4. |
| `<v-alert dismissible>` | `closable` | Renamed. |
| `<v-alert text>` | `variant="text"` | DANGEROUS: in v4 `text` on `VAlert` is a STRING CONTENT prop. A bare `text` does not mean what it looks like. |
| `<v-alert transition="fade-transition">` | removed | Not a valid `VAlert` prop; lands as a dead DOM attribute. |

### Verified as UNCHANGED — do not "fix" these

Agents have wasted effort or introduced regressions by "correcting" things that were already right. All verified against the 4.1.4 typings:

- `flat` is still a real prop on `VCard`, `VBtn`, `VToolbar` and `VAppBar`. Leave it.
- `VRow` still has `dense`, `align`, `justify`, `no-gutters`. Leave them.
- `single-line` is still a real `VTextField` prop.
- `append-icon` / `@click:append` on `VTextField` still work.
- `<v-btn icon>` (boolean) is still valid.
- `xs="6"` on a `v-col`: LEAVE IT. Vuetify 2's `VCol` breakpoints were `['sm','md','lg','xl']` — there has NEVER been an `xs` prop, in either version. It is dead code in both, so converting it to `cols="6"` ADDS a span the page never had. That is a behaviour change, not a fix. The same applies to reasoning about `v-flex xs12` when rewriting the old grid: work out what it ACTUALLY rendered as, not what the name suggests.

Verify any prop you are unsure about against the shipped typings rather than the docs or memory:

```bash
grep -n "propName" node_modules/vuetify/lib/components/VComponent/VComponent.d.ts
```

The current codebase is Vuetify 2, so it does not use the MD3 typography or elevation class names anywhere — those rows matter only if a port introduces them. Do not introduce them.

### Template: Vue 3 core

- Component `v-model` contract changes from `value` + `input` to `modelValue` + `update:modelValue`. This affects `TextDataTable.vue` only (Task 12).
- `v-model` on Vuetify's own components (`v-text-field`, `v-dialog`, `v-tabs`, etc.) is unchanged from the template author's point of view. Leave those alone.

### Script (Tasks 4-12 only — keep Options API and JavaScript)

Do not convert scripts to `<script setup>` or TypeScript in these tasks. That is Task 14, deliberately kept separate so that a broken page has exactly one possible cause. Change only what Vue 3 genuinely breaks:

- `this.$set(obj, key, val)` becomes `obj[key] = val`. `this.$delete(obj, key)` becomes `delete obj[key]`. Vue 3's reactivity is proxy-based and tracks these natively. (Task 10 only.)
- `this.$http.$get(url)` becomes `get(url)` imported from `@/api/http`; likewise `$post`/`$put`/`$delete` become `post`/`put`/`del`. Signatures are identical, so this is a mechanical substitution.
- Nuxt's `async fetch() {…}` hook has no Vue 3 equivalent. Rename the method to `refresh()`, move it into `methods`, and call it from `mounted()`. Any `this.$fetch()` call becomes `this.refresh()`.
- Nuxt's `$fetchState.pending` (if present in a template) becomes a plain `loading` data property that `refresh()` sets true on entry and false on exit.
- `process.env.commitSha` becomes `import.meta.env.VITE_COMMIT_SHA`.
- Add explicit `import` statements for every one of our own components used in the template.

### Verification for every port task

There is no test suite and no browser in the dev environment, so `scripts/inspect-page.mjs` is your eyes. It loads a page headlessly and writes three artifacts: `console.txt` (every console message and page error), `structure.txt` (a semantic dump: headings, nav items, tabs, buttons, links, inputs, table columns, list items, and every Vuetify component that rendered), and `screenshot.png`.

The structure dump is deliberately NOT a DOM diff. Vuetify 2 and Vuetify 4 emit entirely different class names and nesting for the same component, so comparing markup is pure noise. The dump captures what "the same page" actually means: the same controls, with the same labels, in the same order.

Procedure:

1. Start the new app: `pnpm dev` (Vite, 5173) and `pnpm dev:api` (Express, 10009).
2. Inspect the ported page:

```bash
node scripts/inspect-page.mjs http://localhost:5173/<route> /tmp/insp/new-<page>
```

3. Compare against the committed baseline, captured from the real Nuxt app:

```bash
diff docs/superpowers/baselines/<page>.txt /tmp/insp/new-<page>/structure.txt
```

4. What must match: the nav items, headings, tabs, buttons, input labels, and table columns — same content, same order. What may differ: the `vuetify components rendered` list (v2 and v4 have different component names — `v-list-item-content` simply does not exist in v4, and that is the point), and any font/spacing/elevation difference, since Vuetify 4 is Material Design 3.
5. `console.txt` must contain zero `[error]` and zero `[pageerror]` lines from your page. Vuetify warns loudly about removed props, so a clean console is the sharpest automatic signal that a port is correct. Note the reference app itself logs `Request timed out` errors because the database and daemons are unreachable from this machine — those are environmental and expected in both apps.
6. Look at `screenshot.png`. Report anything structurally wrong.

KNOWN GAP, do not paper over it: MongoDB is reachable and the baselines contain its five real clients, so anything driven by the client registry — the `/settings` list, the client selectors, the client cards — IS covered. The Avior DAEMONS are not reachable (connection refused), so anything requiring a live daemon is not: job tables, per-client configs, encoder settings, and log views all render their empty or offline state in both apps. A `v-data-table` showing zero job rows in both proves nothing about its column mapping. Say so in your report rather than claiming a page is fully verified. Daemon-dependent behaviour must be checked by the user on the real network.

To regenerate a baseline (only if asked): run the reference worktree (`cd ../avior-nuxt-reference && pnpm dev`, note the port it prints) and point the inspector at it.

---

## Task 12: Port globalconfig.vue and TextDataTable.vue

Stage 9. The heaviest Vuetify conversion in the project and the only user of `v-time-picker`, which still lives in Vuetify labs. Deliberately last so it cannot block anything else.

Files:
- Create: `src/pages/globalconfig.vue` (576 lines)
- Create: `src/components/TextDataTable.vue` (207 lines)

Interfaces:
- Consumes: `get`/`post`/`put`/`del` from `@/api/http`; `VTimePicker` (registered globally in `src/plugins/vuetify.ts`, Task 3).

`globalconfig.vue` uses more removed APIs than any other file: `v-layout`, `v-flex`, `v-tabs-items`, `v-tab-item`, `v-tabs-slider`, `v-time-picker`, `v-overlay`, `v-menu`, `v-list-item-content`, and the `dark` prop.

`v-layout` and `v-flex` are Vuetify 1-era grid components that survived into Vuetify 2 as a compatibility shim and are entirely absent from Vuetify 3. They become `v-row` and `v-col`. Do not map them one-to-one without reading what the layout is doing — `v-flex` sizing props (`xs12`, `md6`, and so on) do not translate directly to `v-col`'s `cols` / `md` props.

`v-menu` and `v-overlay` both changed their activator APIs in Vuetify 3, the same way `v-tooltip` did (Task 6): `v-slot:activator="{ on, attrs }"` with `v-on="on" v-bind="attrs"` becomes `v-slot:activator="{ props }"` with `v-bind="props"`.

- [ ] Step 1: Port `TextDataTable.vue`

Two changes beyond the conversion table:

- Header schema at lines 147-149 moves from `{text, value}` to `{title, key}`.
- The `value: Array` prop at line 133 becomes `modelValue: Array`. Vue 3 changes the component `v-model` contract from `value` + `input` to `modelValue` + `update:modelValue`. `globalconfig.vue` binds this component with `v-model` four times (lines 145, 158, 172, 185). The component's `$emit("input")` calls at lines 197 and 201 are already commented out, so the binding is effectively one-way and no emit is needed — but confirm that by reading, and if an emit is live, it becomes `$emit("update:modelValue", …)`.

- [ ] Step 2: Port `globalconfig.vue`

Apply the conversion table and the activator changes above. Add `import TextDataTable from '@/components/TextDataTable.vue'`.

The `async fetch()` at line 278 becomes `refresh()` from `mounted()`. The many `$http` calls (lines 311, 343, 351, 359, 371, 389-392, 416, 427, 437, 447, 476, 489, 514, 523, 532, 552, 564) become the wrapper's helpers. Line 523 (`"api/clients"`) is app-origin and gains a leading slash; the rest are absolute daemon URLs built from `this.url`.

- [ ] Step 3: Verify the time picker specifically

`VTimePicker` is STABLE in Vuetify 4 (it was in labs in Vuetify 3), so it is auto-imported and needs no registration. This was the component flagged as the likeliest blocker in this migration; that risk has evaporated. Its props may still differ from the Vuetify 2 component — check them rather than assuming.

The availability window (`client.AvailabilityStart` / `client.AvailabilityEnd`) is what it drives. Set a start and end time, save, reload, and confirm the values persist and display identically to the old app.

- [ ] Step 4: Verify the rest

Open `http://localhost:5173/globalconfig` and `http://localhost:3000/globalconfig` side by side.

Expected: identical tabs; the client list renders with the same layout (this is where `v-layout`/`v-flex` became `v-row`/`v-col`, so column widths are the most likely thing to be subtly wrong — compare carefully at more than one browser width); all four TextDataTables populate; adding, editing, and deleting a field in each of the four works; import and export both work. Console clean.

- [ ] Step 5: Commit

```bash
git add -A
git commit -m "feat: port global config page and TextDataTable to Vue 3 + Vuetify 4

Heaviest Vuetify conversion: v-layout/v-flex (Vuetify 1-era grid) become
v-row/v-col; v-tabs-items becomes v-window; v-menu and v-overlay activator
slots move from {on,attrs} to {props}. VTimePicker comes from Vuetify labs.

TextDataTable's 'value' prop becomes 'modelValue' for Vue 3's v-model
contract."
```
