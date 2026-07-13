# Task 12: Port globalconfig.vue and TextDataTable.vue

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

`VTimePicker` is registered from `vuetify/labs/VTimePicker` in Task 3. If it fails to render, the labs import is the first thing to check. Being in labs, its props may differ from the Vuetify 2 component — read the labs docs rather than assuming.

The availability window (`client.AvailabilityStart` / `client.AvailabilityEnd`) is what it drives. Set a start and end time, save, reload, and confirm the values persist and display identically to the old app.

- [ ] Step 4: Verify the rest

Open `http://localhost:5173/globalconfig` and `http://localhost:3000/globalconfig` side by side.

Expected: identical tabs; the client list renders with the same layout (this is where `v-layout`/`v-flex` became `v-row`/`v-col`, so column widths are the most likely thing to be subtly wrong — compare carefully at more than one browser width); all four TextDataTables populate; adding, editing, and deleting a field in each of the four works; import and export both work. Console clean.

- [ ] Step 5: Commit

```bash
git add -A
git commit -m "feat: port global config page and TextDataTable to Vue 3 + Vuetify 3

Heaviest Vuetify conversion: v-layout/v-flex (Vuetify 1-era grid) become
v-row/v-col; v-tabs-items becomes v-window; v-menu and v-overlay activator
slots move from {on,attrs} to {props}. VTimePicker comes from Vuetify labs.

TextDataTable's 'value' prop becomes 'modelValue' for Vue 3's v-model
contract."
```
