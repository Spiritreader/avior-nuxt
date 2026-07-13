# Task 10: Port config.vue

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
- Vuetify 4 uses Material Design 3. Typography, elevation (25 levels down to 6), default breakpoints, `VContainer` max-widths, and button casing (no more uppercase default) all differ from Vuetify 2 by design. These visual differences are EXPECTED and are not migration bugs. Do not "fix" them back. What must match the old app is structure and behaviour: the same elements, the same hierarchy, the same interactions, the same data. Exact pixels, font sizes, and shadows will not match, and that is correct.
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
| `<v-row dense>` | `<v-row density="compact">` (or `gap="8"`) |
| `<v-row align="center">` / `justify="..."` / `align-content="..."` | props removed — use the equivalent utility class on the row (`align-center`, `justify-center`, …), including the responsive variants (`align-sm`, `order-md`, …) |
| `<v-col order="2">` / `align-self="..."` | props removed — use utility classes |
| `v-select` / `v-combobox` / `v-autocomplete` slot `#item` | renamed `#internalItem`. `item` survives as an alias for `internalItem.raw`, so read the slot body before changing it |
| `v-container fill-height` centering | no longer centers vertically — add `d-flex align-center flex-wrap` if the centering was load-bearing |
| `elevation-8` and similar, up to 24 | elevation is now 0-5 only. Map anything above 5 down; a codemod exists |
| `text-h1` … `text-caption` typography classes | renamed to the MD3 scale (`text-display-large`, `text-headline-small`, `text-body-medium`, …). A codemod exists |
| `v-btn` uppercase by default | no longer uppercase. If a specific button's casing matters, set it explicitly |

The grid is the one to be careful with: Vuetify 4 rebuilt `v-row`/`v-col` on CSS `gap` instead of negative margins. Read what a row is actually doing before converting it.

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

## Task 10: Port config.vue

Stage 7c. 584 lines, fifteen component dependencies, and the only user of `$set`/`$delete`. Depends on Tasks 5, 8, and 9.

Files:
- Create: `src/pages/config.vue`
- Reference (do not modify): the original

Interfaces:
- Consumes: all ten Settings components, `EncoderConfig`, `CacheConfig`, `Property`, `Module` (Tasks 8, 9), `SimpleList` (Task 5), and `get`/`post`/`put` from `@/api/http`.

- [ ] Step 1: Port the template

`v-tabs-items` becomes `v-window`; `v-tab-item` becomes `v-window-item`; `v-tabs-slider` is deleted; the `dark` prop is removed. Add explicit imports for all fifteen components.

- [ ] Step 2: Port the script — the `$set`/`$delete` calls

This is the only file using them, at lines 451, 511, 530, 543, and 546. Vue 3's proxy-based reactivity tracks plain property addition and deletion, so these become ordinary operations:

- `this.$set(this.selectedClient, "Address", resolvedClient.Address)` becomes `this.selectedClient.Address = resolvedClient.Address`
- `this.$set(this.config.Resolutions, "", "")` becomes `this.config.Resolutions[""] = ""`
- `this.$delete(this.config.Resolutions, e)` becomes `delete this.config.Resolutions[e]`
- `this.$set(this.config.EncoderConfig, e.tag, e.content)` becomes `this.config.EncoderConfig[e.tag] = e.content`
- `this.$delete(this.config.EncoderConfig, e)` becomes `delete this.config.EncoderConfig[e]`

Verify reactivity actually holds after this change: add a resolution, confirm the UI updates without a manual refresh; delete one, same. This is the exact scenario `$set` existed to work around, so it is the thing most likely to silently regress.

- [ ] Step 3: Port the rest of the script

- `async fetch()` at line 389 becomes `refresh()` called from `mounted()`.
- `$http` calls become `get`/`post`/`put`/`del`. Line 391 (`"api/clients"`) is app-origin and gains a leading slash, as in Task 7. Lines 399, 426, 469, 497 are absolute daemon URLs and stay absolute.
- Line 472 uses a raw `fetch(...)` with an explicit method and headers. Replace it with the `put` helper for consistency, confirming the daemon accepts the identical request.

- [ ] Step 4: Verify

Open `http://localhost:5173/config` and `http://localhost:3000/config` side by side.

Expected: the client selector populates; selecting a client loads its config; every tab renders; all ten Settings modules appear with their current values. Add and remove a resolution and confirm the UI updates immediately (this validates step 2). Export the config and confirm the JSON matches the old app's export byte for byte. Import a config and confirm it applies. Console clean.

- [ ] Step 5: Commit

```bash
git add -A
git commit -m "feat: port client config page to Vue 3 + Vuetify 4

v-tabs-items/v-tab-item become v-window/v-window-item. Removes the last
$set/$delete calls: Vue 3's proxy reactivity tracks plain property add and
delete, so config.Resolutions and config.EncoderConfig mutate directly.
Verified that add/remove of a resolution updates the UI without a refresh."
```
