# Task 5: Port settings.vue and SimpleList.vue

Part of the Nuxt 2 to Vue 3 SPA migration.
Master plan: `docs/superpowers/plans/2026-07-13-nuxt2-to-vue3-migration.md`
Design spec: `docs/superpowers/specs/2026-07-13-nuxt2-to-vue3-migration-design.md`

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
- MongoDB at 10.11.194.75 is NOT reachable from the development machine. A hanging or 500-ing `/api/clients` locally is the environment, not a bug. Never claim a successful query.

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
| `app`, `fixed`, `clipped`, `clipped-left` props on `v-app-bar` / `v-navigation-drawer` / `v-footer` / `v-main` | all removed — Vuetify 4 computes layout geometry itself |
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

There is no test suite. Verification means:

1. `pnpm dev` (Vite, port 5173) and `pnpm dev:api` (Express, port 10009) both running.
2. Open the ported page in the browser.
3. Open the OLD Nuxt app at the same page, side by side. It runs from a separate git worktree, NOT from this one:

```bash
cd ../avior-nuxt-reference && pnpm dev
```

The reference worktree is pinned to commit `baff6fe`, the last commit where Nuxt still worked, and has its own isolated `node_modules`. It must exist; if it does not, recreate it with `git worktree add ../avior-nuxt-reference baff6fe --detach && cd ../avior-nuxt-reference && pnpm install`. It prints the port it chose — read it from the output rather than assuming.

Nuxt CANNOT run from the main working tree any more, and `pnpm dev:nuxt` no longer exists. Vue 2 and Vue 3 are the same package name at two versions, so they cannot both occupy `node_modules/vue` — and `shamefullyHoist: true` (which Nuxt 2 itself requires) forces exactly that collision. Vuetify 2 and 4 collide the same way. This is not a bug to fix; it is why the reference lives in its own worktree.
4. Compare them, applying the right standard. What must match: every element is present, the hierarchy and grouping are the same, every interaction works, and the same data appears. What will NOT match, by design, because Vuetify 4 is Material Design 3: font sizes and weights, shadow depths, button label casing, exact spacing and breakpoints. Do not chase those. If you cannot tell whether a difference is intentional MD3 or a real regression, say so in your report rather than guessing — a wrong guess in either direction is worse than an open question.
5. Check the browser console. Zero errors and zero Vue warnings. Vuetify warns loudly about removed props, so a clean console is a real signal here — this, rather than pixel comparison, is now the sharpest tool for catching a bad port.

---

## Task 5: Port settings.vue and SimpleList.vue

Stage 5 of the spec. The smallest page, and the only one that talks exclusively to `/api` and never to a daemon — so it proves the whole browser to Express to Mongoose path end to end before anything harder depends on it.

Files:
- Create: `src/pages/settings.vue` (port of `pages/settings.vue`, 135 lines)
- Create: `src/components/SimpleList.vue` (port of `components/SimpleList.vue`, 71 lines)
- Reference (do not modify): the originals

Interfaces:
- Consumes: `get`, `post` from `@/api/http` (Task 3).
- Produces: `src/components/SimpleList.vue`, reused unchanged by `config.vue` in Task 10.

- [ ] Step 1: Port `SimpleList.vue`

Small but Vuetify-dense. It uses `v-list-item-content`, `v-list-item-icon`, `v-list-item-group`, and `v-subheader` — four removed APIs in 71 lines. Apply the conversion table:

- `v-subheader` becomes `v-list-subheader`.
- `v-list-item-group v-model="x"` is removed; move the binding to `<v-list v-model:selected="x">` and give each `v-list-item` a `:value`.
- `v-list-item-icon` becomes `<template #prepend>`.
- `v-list-item-content` is unwrapped.

Read the file and check whether the `v-list-item-group` selection is actually used by the parent before reproducing it. If it is decorative, say so rather than porting dead state.

- [ ] Step 2: Port `settings.vue`

Template: `v-list-item-content` teardown. Script:

- Replace the four `this.$http.$get`/`$post` calls with `get`/`post` from `@/api/http`.
- The `async fetch()` hook at line 127 becomes `refresh()` in `methods`, called from `mounted()`.
- The two `await this.$fetch()` calls (lines 106 and 123) become `await this.refresh()`.
- Delete the commented-out raw `fetch(...)` blocks — they are dead code referencing `http://localhost:3000` and would be actively misleading in the new app.
- Add `import SimpleList from '@/components/SimpleList.vue'` and register it in `components`.

- [ ] Step 3: Verify

Run `pnpm dev`, `pnpm dev:api`, and `pnpm dev:nuxt`. Open `http://localhost:5173/settings` and `http://localhost:3000/settings` side by side.

Expected: the same list of registered clients, rendered identically. Add a client through the form and confirm it appears in the list and persists across a page reload — this is the write path through Express to Mongo. Delete it again and confirm it disappears. Console clean.

If the list renders but is empty on both, the database is empty rather than the port being broken. Confirm with `curl -s http://localhost:10009/api/clients` before concluding anything.

- [ ] Step 4: Commit

```bash
git add -A
git commit -m "feat: port settings page and SimpleList to Vue 3 + Vuetify 4

First page on the new stack. Proves the browser -> Express -> Mongoose path.
Nuxt's fetch() hook becomes refresh() called from mounted(); $http becomes the
native-fetch wrapper. Drops dead commented-out localhost:3000 fetch calls."
```
