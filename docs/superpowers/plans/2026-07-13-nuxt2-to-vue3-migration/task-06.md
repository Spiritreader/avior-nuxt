# Task 6: Port Client.vue

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

## Task 6: Port Client.vue

Stage 6a. The single highest-risk file in the project: 879 lines, the largest component, described by the user as carefully tuned. It gets its own task and is explicitly excluded from delegation to a cheaper model.

Files:
- Create: `src/components/Client.vue` (port of `components/Client.vue`)
- Reference (do not modify): the original

Interfaces:
- Consumes: `get` from `@/api/http`.
- Produces: `src/components/Client.vue`, consumed by `index.vue` in Task 7. Its props and emitted events must not change.

Treat this as a careful port, not a mechanical one. Read the whole file before changing anything. Preserve the existing behaviour exactly, including quirks; if something looks like a bug, note it in the commit message rather than fixing it silently — a behaviour change here is indistinguishable from a migration regression.

Vuetify APIs in use that change: `v-list-item-content` (unwrap), `v-skeleton-loader`, `v-virtual-scroll`, `v-tooltip`, `v-btn-toggle`, and a `dark` prop. `v-skeleton-loader`, `v-virtual-scroll`, and `v-btn-toggle` all exist in Vuetify 3 but their props and slots differ — check each against the Vuetify 3 docs rather than assuming. `v-tooltip` in particular changed its activator API significantly: the Vuetify 2 `v-slot:activator="{ on, attrs }"` with `v-on="on" v-bind="attrs"` becomes `v-slot:activator="{ props }"` with `v-bind="props"`.

- [ ] Step 1: Read the entire file

All 879 lines. Identify every Vuetify component, every daemon call, and every piece of local state. Write down what the component does before touching it.

- [ ] Step 2: Port the template

Apply the conversion table plus the `v-tooltip` activator change noted above. Change nothing that is not on the list.

- [ ] Step 3: Port the script

The four daemon log calls at lines 590, 600, 610, and 620 (`this.$http.$get(this.client.Ip + "/logs/main/")` and siblings) become `get(...)` from `@/api/http`. These are absolute daemon URLs, not app-origin — they must stay absolute and must not be routed through `/api`.

Everything else in the script stays Options API JavaScript.

- [ ] Step 4: Verify

Client.vue is rendered by `index.vue`, which is not ported until Task 7. To verify it in isolation, temporarily render it from `src/pages/index.vue` with a hardcoded client prop matching the shape `index.vue` passes. Confirm it renders, then confirm the four log tabs each fetch and display log content from a real daemon.

Expected: identical to the same client card on `http://localhost:3000`. The virtual-scrolled log view scrolls. The tooltips appear. The button toggle switches log types. Console clean.

Revert the temporary index.vue change before committing.

- [ ] Step 5: Commit

```bash
git add -A
git commit -m "feat: port Client.vue to Vue 3 + Vuetify 3

Largest and most carefully tuned component in the project (879 lines).
Behaviour preserved exactly. v-tooltip's activator slot API changed
(on/attrs -> props); v-skeleton-loader, v-virtual-scroll and v-btn-toggle
props checked individually against Vuetify 3.

Daemon log calls remain absolute URLs straight from the browser, not proxied."
```
