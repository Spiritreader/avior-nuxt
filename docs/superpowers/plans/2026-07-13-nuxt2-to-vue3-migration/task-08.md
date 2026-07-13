# Task 8: Port the ten Modules/*Settings components

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
- Ports during coexistence: Nuxt dev on 3000, Vite dev on 5173, Express standalone on 10009. These must not collide.

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
| `<v-time-picker>` | still in Vuetify labs — needs an explicit labs import (see Task 3) |

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
3. Open the old Nuxt app (`pnpm dev:nuxt`, port 3000) at the same page, side by side.
4. Compare them, applying the right standard. What must match: every element is present, the hierarchy and grouping are the same, every interaction works, and the same data appears. What will NOT match, by design, because Vuetify 4 is Material Design 3: font sizes and weights, shadow depths, button label casing, exact spacing and breakpoints. Do not chase those. If you cannot tell whether a difference is intentional MD3 or a real regression, say so in your report rather than guessing — a wrong guess in either direction is worse than an open question.
5. Check the browser console. Zero errors and zero Vue warnings. Vuetify warns loudly about removed props, so a clean console is a real signal here — this, rather than pixel comparison, is now the sharpest tool for catching a bad port.

---

## Task 8: Port the ten Modules/*Settings components

Stage 7a. These ten components are mutually independent, have no shared state, and none imports another (except `Module.vue`, which is Task 9). This is the primary fan-out opportunity in the plan: one subagent per component, running concurrently, on a cheaper model.

Files (all Create, each a port of the same-named file in `components/Modules/`):
- `src/components/Modules/AgeSettings.vue` (60 lines)
- `src/components/Modules/AudioSettings.vue` (90 lines)
- `src/components/Modules/DuplicateLengthCheckSettings.vue` (71 lines)
- `src/components/Modules/ErrorReplaceSettings.vue` (65 lines)
- `src/components/Modules/ErrorSkipSettings.vue` (60 lines)
- `src/components/Modules/LengthSettings.vue` (71 lines)
- `src/components/Modules/LogMatchSettings.vue` (87 lines)
- `src/components/Modules/MaxSizeSettings.vue` (60 lines)
- `src/components/Modules/ResolutionSettings.vue` (75 lines)
- `src/components/Modules/SizeApproxSettings.vue` (139 lines)

Interfaces:
- Produces: ten components with unchanged props and emitted events, consumed by `Module.vue` and `config.vue` in Tasks 9 and 10.

Known Vuetify APIs by file, from a survey of the current code. Each subagent should still read its own file rather than trusting this list to be exhaustive:
- `v-list-item-icon`: `AudioSettings.vue`, `LogMatchSettings.vue`
- `dark` prop: `AudioSettings`, `DuplicateLengthCheckSettings`, `LengthSettings`, `LogMatchSettings`, `ResolutionSettings`, `SizeApproxSettings`
- The rest are mostly `v-text-field`, `v-select`, `v-switch`, and `v-slider`, whose template-facing APIs are stable between Vuetify 2 and 3.

- [ ] Step 1: Agree the conventions before fanning out

All ten ports must apply the same conversion table (above) identically. Inconsistency between ten independently-produced files is the main risk of parallelising this. The dispatching agent passes the conversion table to every subagent verbatim.

- [ ] Step 2: Dispatch one subagent per component

Each subagent receives: the conversion table, the path of its single source file, the path of its single destination file, and the instruction to change nothing except what the table requires. Each is told explicitly not to convert to `<script setup>` or TypeScript.

- [ ] Step 3: Verify each

These render inside `config.vue`, which is not ported until Task 10. Verification here is therefore limited: `pnpm typecheck` must pass, and `pnpm build` must succeed, proving each file at least parses and resolves its imports. Full visual verification happens in Task 10 and must not be claimed before then.

State this limitation plainly rather than implying the components have been seen working.

- [ ] Step 4: Commit

One commit for all ten — they are a single logical unit and none is independently useful.

```bash
git add -A
git commit -m "feat: port ten Modules/*Settings components to Vuetify 4

Mechanical conversion: v-list-item-icon to #prepend slots, dark prop removed
(handled by theme). Scripts unchanged (Options API, JavaScript).

Not yet visually verified — these render inside config.vue, ported next."
```
