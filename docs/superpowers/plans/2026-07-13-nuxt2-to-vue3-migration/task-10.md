# Task 10: Port config.vue

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
git commit -m "feat: port client config page to Vue 3 + Vuetify 3

v-tabs-items/v-tab-item become v-window/v-window-item. Removes the last
$set/$delete calls: Vue 3's proxy reactivity tracks plain property add and
delete, so config.Resolutions and config.EncoderConfig mutate directly.
Verified that add/remove of a resolution updates the UI without a refresh."
```
