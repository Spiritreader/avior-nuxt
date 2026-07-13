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
- Theme: Vuetify 3 stock dark theme, with exactly two color overrides — `primary: #9E9E9E`, `secondary: #FF8F00`. Do not port the old accent/info/warning/error/success entries.
- Our own components are imported explicitly. Vuetify's components are auto-imported by `vite-plugin-vuetify`. Do not add `unplugin-vue-components` for our components.
- There is no test suite, by the user's explicit choice. Every task's verification step is a manual observation against the running app. Never claim a task works without having actually run the stated command and seen the stated result.
- Every task ends with the app in a runnable state and a commit.
- Ports during coexistence: Nuxt dev on 3000, Vite dev on 5173, Express standalone on 10009. These must not collide.

## Ported-file conventions

Tasks 4 through 12 all port Vue 2 + Vuetify 2 SFCs to Vue 3 + Vuetify 3. Every one of them follows the same rules. Read this section before starting any of those tasks; the per-task notes list only which of these apply and any file-specific gotchas.

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
| `app`, `fixed`, `clipped`, `clipped-left` props on `v-app-bar` / `v-navigation-drawer` / `v-footer` / `v-main` | all removed — Vuetify 3 computes layout geometry itself |
| `dark` prop on any component | removed — the theme handles it; simply delete the attribute |
| `:mini-variant="x"` on `v-navigation-drawer` | `:rail="x"` |
| `v-data-table` `headers: [{ text, value }]` | `headers: [{ title, key }]` |
| `v-data-table` slot `#item.foo` | `#item.foo` still, but `foo` now matches the header `key` |
| `v-data-table` `:items-per-page` etc. | unchanged, but check the component renders before assuming |
| `<v-time-picker>` | still in Vuetify labs — needs an explicit labs import (see Task 3) |

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
3. Open the old Nuxt app (`pnpm dev:nuxt`, port 3000) at the same page, side by side.
4. Confirm the layout matches and the page's interactions work.
5. Check the browser console. Zero errors and zero Vue warnings. Vuetify emits loud warnings for removed props, so a clean console is a real signal here.

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
git commit -m "feat: port settings page and SimpleList to Vue 3 + Vuetify 3

First page on the new stack. Proves the browser -> Express -> Mongoose path.
Nuxt's fetch() hook becomes refresh() called from mounted(); $http becomes the
native-fetch wrapper. Drops dead commented-out localhost:3000 fetch calls."
```
