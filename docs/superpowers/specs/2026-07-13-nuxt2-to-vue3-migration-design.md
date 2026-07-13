# Avior: Nuxt 2 / Vue 2 to Vue 3 SPA migration

Date: 2026-07-13
Status: approved design, pending implementation plan

## Summary

Avior is an internal admin dashboard for controlling Avior encoding daemons. It currently runs on Nuxt 2.17 with Vue 2 and Vuetify 2, served in SSR mode, with an Express + Mongoose API mounted inside Nuxt as `serverMiddleware`.

This project migrates it to a Vue 3 single-page application built by Vite, styled with Vuetify 4, with the Express API extracted into a standalone server that also serves the built SPA. Nuxt is removed entirely. The package manager moves from npm to pnpm. Component scripts end up as `<script setup lang="ts">`.

The application's runtime behaviour is preserved. This is a framework migration, not a redesign or a re-architecture.

## Current state

Roughly 5,600 lines across 6 pages and 20 components. There is no Vuex store, no middleware, and no plugins; those directories contain only README stubs.

Nuxt is providing five things:

- File-based routing over `pages/`
- Layouts (`layouts/default.vue`, `layouts/error.vue`)
- Component auto-import from `components/` and `components/Modules/`
- The Vuetify 2 integration via `@nuxtjs/vuetify`
- Hosting of the Express API at `/api` via `serverMiddleware`

Data flow has two distinct paths, and the distinction matters:

- Mongo path: the browser calls `/api/clients` on the app's own origin. Express handles it and talks to MongoDB through Mongoose. This is the registry of known encoding clients.
- Daemon path: the browser calls the Avior encoding daemons directly at absolute LAN addresses read from that registry (`/alive`, `/config`, `/jobs`, `/logs/*`, `/fields/*`, `/encoder`). Express is not involved.

Every page fetches through Nuxt 2's `fetch()` hook using `$http` from `@nuxt/http`. Four pages (`index`, `config`, `jobs`, `globalconfig`) contain near-identical copies of the same logic: read the client registry, then race each client's candidate addresses against `/alive` to discover which one is reachable. This is the only significant duplication in the codebase.

Deployment is a single Docker image built by both a Jenkinsfile and a GitHub Actions workflow, pushed to `spiritreader/avior-nuxt`.

## Decisions

### Rendering: SPA, no SSR

The app becomes a pure client-rendered SPA. It is an authenticated internal dashboard whose data comes from LAN daemons at runtime, so SSR provides no SEO or first-paint benefit worth its cost.

Removing SSR also eliminates a class of bug this project has already hit. Under SSR, the initial `fetch()` runs in Node, where a relative URL like `/api/clients` cannot resolve. That is why `@nuxt/http` needs both `baseURL` and `browserBaseURL`, and why `nuxt.config.js` carries `browserBaseURL: "/"`. In a SPA every request originates in the browser, where relative URLs resolve against `window.location.origin` natively. The base URL concept disappears from application code, so it cannot be misconfigured.

### Deployment: all-in-one

Express keeps its `/api` routes and additionally serves the built `dist/`. One container, one port, one image, matching the current deployment shape. A separate API container was considered and rejected: it turns one deployable into two for a separation the project has no need for.

MongoDB is the only thing that must remain server-side, since the connection string cannot ship in a browser bundle. Everything else the browser already does directly.

### Daemon calls stay direct

The browser continues to call the encoding daemons at their absolute addresses. It already does this today on client-side navigation, so CORS and LAN reachability are already proven; the SPA merely makes it the only path rather than one of two. No proxy is introduced. The existing model is preserved.

### UI: Vuetify 4, ported component by component

Vuetify 2 does not run on Vue 3, so this is forced. The target is Vuetify 4 (currently 4.1.4), the newest release. Vuetify 4 is still a Vue 3 library — the major version bump is not about Vue 4 — and its peer dependency is `vue: ^3.5.0`, which this project satisfies.

Vuetify 4 uses Material Design 3, where Vuetify 2 used Material Design 2. This means the app will not look pixel-identical when the migration is done, and that is accepted rather than regretted. Typography moves to the MD3 scale, elevation drops from 25 levels to 6, the default breakpoints shrink, `VContainer` max-widths shrink, buttons lose their uppercase default, and the `v-row`/`v-col` grid is rebuilt on CSS `gap` instead of negative margins.

What "preserve the layout" means here, precisely: the same components appear in the same places, in the same hierarchy, with the same interactions and the same data. Font sizes, shadow depths, button label casing, and exact margins may differ. Nobody fights the framework to restore Material Design 2, and Vuetify's revert snippets are deliberately not used.

This has one consequence worth stating, because verification depends on it. Since there is no test suite, the check on each ported page is a side-by-side comparison against the old app — and that comparison can no longer be "do these look the same". It is "are the same elements present, in the same arrangement, doing the same things". A clean browser console becomes the sharper signal, since Vuetify warns loudly about removed props.

The theme is not ported wholesale. The app adopts Vuetify 4's built-in dark theme and overrides only two colors to stay recognizable:

- `primary: #9E9E9E` (was `colors.grey.base`)
- `secondary: #FF8F00` (was `colors.amber.darken3`)

The remaining custom theme entries (accent, info, warning, error, success) are dropped in favour of Vuetify 4 defaults. `defaultTheme: 'dark'` must be set explicitly: Vuetify 4 changed the default to follow system preference, which would otherwise render the app light.

`assets/variables.scss` contains only comments and no actual variables, so `customVariables` has always been a no-op; the file is deleted and no SASS override plumbing is needed in the Vite config.

### Routing: file-based, via unplugin-vue-router, on vue-router 4

The `pages/` convention is kept and routes continue to be inferred from filenames, so no route path changes. The directory itself relocates to `src/pages/` along with the rest of the application source; filenames are preserved, so `/jobs`, `/config`, `/globalconfig`, and `/settings` all resolve exactly as before. During stages 4-9 the old root-level `pages/` and the new `src/pages/` coexist, which is what allows both apps to run side by side for comparison.

vue-router is pinned to 4.6.x rather than the newest 5.x. `unplugin-vue-router@0.19.2` (the newest) declares `vue-router: ^4.6.0` as its peer dependency, so choosing file-based routing forces vue-router 4. This is a constraint imposed by the tooling, not a preference; if a later unplugin-vue-router supports vue-router 5, that is a separate upgrade.

### HTTP: native fetch behind a typed wrapper

No HTTP library. A small `src/api/http.ts` exposes get/post/put/del helpers that throw on non-2xx and parse JSON, shaped so the roughly 40 `$http.$get`-style call sites port over nearly one-to-one. Calls to the app's own API use relative `/api/...` paths in both development and production; in development a Vite dev-server proxy forwards `/api` to Express. Daemon calls use the absolute addresses they already use.

`@nuxtjs/axios`, `@nuxt/http`, and `@nuxtjs/proxy` are removed.

### Component internals: two passes, not one

The end state is `<script setup lang="ts">` throughout. It is reached in two separate passes rather than one, because the project has no test suite and a single-pass rewrite would change each file's template, script paradigm, and type surface simultaneously, leaving four candidate causes for any regression and no automated way to isolate them.

The two passes are close to disjoint in the file. The Vuetify migration is almost entirely a `<template>` change; the `<script setup>` and TypeScript migration is almost entirely a `<script>` change. Splitting them is therefore close to free rather than double work.

Pass one (stages 4-9) ports each page's template to Vuetify 4 while leaving the script as JavaScript and Options API. Only what Vue 3 genuinely breaks is touched:

- `$set` / `$delete` become plain assignment (Vue 3's reactivity is proxy-based)
- `$http` becomes the fetch wrapper
- the `fetch()` hook becomes `onMounted` plus an explicit `refresh()` method; `this.$fetch()` becomes a direct call to it
- `process.env.commitSha` becomes `import.meta.env.VITE_COMMIT_SHA`

Pass two (stage 11) converts scripts to `<script setup lang="ts">` against a running, known-good reference.

### Deduplication

The address-resolution logic duplicated across four pages is extracted into a `useClientResolution()` composable during the TypeScript pass, when those scripts are being rewritten anyway. Typing it once is materially easier than typing it four times.

The `promise.any` and `es-abstract` polyfills are dropped; `Promise.any` has been natively available in all target runtimes for years. They are also the only entries in Nuxt's `build.transpile`.

### Verification: manual, by comparison

No test harness is introduced. This is a deliberate, accepted trade-off: the risk is that subtle logic regressions, particularly in job de-duplication and the address race, will not announce themselves.

The plan is built around this constraint rather than ignoring it. The Vue 3 app is scaffolded alongside the working Nuxt app and both run simultaneously until the cutover, so every page can be compared against its live predecessor. Every stage ends with the application in a runnable state. Nuxt is not deleted until every page has been observed working. Tests may be added later; nothing here precludes them.

### Files deleted

- `pages/test.vue` (scratch page, unlinked)
- `components/Logo.vue`, `components/VuetifyLogo.vue` (starter template leftovers, unreferenced)
- `assets/variables.scss` (comments only)

`pages/clients.txt` is retained. It is not a route and unplugin-vue-router would ignore it in any case. Because the root-level `pages/` directory is deleted at cutover, the file relocates to `docs/clients.txt` at stage 10.

### Static assets

Nuxt serves `static/` at the web root; Vite serves `public/`. The directory is copied to `public/` during stage 3, preserving paths, so existing absolute references such as `/dryicons_love_file_icon_6200.png` in the layout and `/favicon.ico` continue to resolve unchanged.

### Build-time git SHA

The footer displays the deployed commit. Nuxt exposes it through `env: { commitSha: process.env.NUXT_ENV_CURRENT_GIT_SHA }`, read in the layout as `process.env.commitSha`. In Vite this becomes `import.meta.env.VITE_COMMIT_SHA`, requiring the Dockerfile to set `VITE_COMMIT_SHA` from its existing `COMMIT` build argument. The `COMMIT` argument itself, and both CI pipelines that pass it, are unchanged.

## Target structure

```
src/
  main.ts                 app bootstrap, Vuetify + router registration
  App.vue                 root, replaces layouts/default.vue
  plugins/vuetify.ts      Vuetify 4 instance, dark theme + 2 color overrides
  router/                 unplugin-vue-router config
  api/http.ts             typed fetch wrapper
  composables/            useClientResolution(), useClients()
  types/                  Client, Job, Config, Field shapes
  pages/                  routed pages (file-based, unchanged names)
  components/             ported components
server/
  app.js                  Express app: /api routes + Mongoose
  index.js                entrypoint: listen + serve dist/
  schema.js               Mongoose model (moved from api/)
public/                   static assets, served at web root (was static/)
```

## Stages

Each stage is independently checkpointed and leaves the app runnable.

1. pnpm. Replace `package-lock.json` with `pnpm-lock.yaml` via `pnpm import` so resolved versions do not shift. Add `.npmrc` with `shamefully-hoist=true`, which Nuxt 2's webpack build requires under pnpm's strict symlinked `node_modules`. Update Dockerfile, Jenkinsfile, and the GitHub Actions workflow. Nothing about Vue changes. Checkpoint: the existing Nuxt app still builds and runs.

2. Extract the API. Split `api/api.js` into `server/app.js` (exports the configured Express app) and `server/index.js` (listens, and later serves `dist/`). Nuxt continues to consume the app as `serverMiddleware`, so nothing breaks, but the server can now also boot standalone. Move the Mongo URL from the committed `api/config.json` to an environment variable, defaulting to the current value so existing deployments are unaffected. Checkpoint: both the Nuxt-hosted and standalone paths serve `/api/clients`.

3. Scaffold the Vue 3 app in `src/`, alongside the still-working Nuxt app. Vite, Vuetify 4, unplugin-vue-router, the fetch wrapper, and the dev proxy. Nothing is deleted. Checkpoint: the shell boots on its own port with an empty page body, and the Nuxt app still runs unchanged.

4. Layout. `layouts/default.vue` becomes `App.vue` plus a layout component; `layouts/error.vue` becomes a router catch-all. Vuetify 4 removes the `app`, `fixed`, `clipped`, and `clipped-left` props and computes layout geometry itself, so the drawer, app bar, and footer are rebuilt rather than renamed. The `v-list-item-content` / `-action` teardown lands here in the nav item loop. Checkpoint: shell renders, navigation works, pages are empty.

5. `settings.vue`, plus `SimpleList.vue`. The smallest page, and the only one talking exclusively to `/api`, so it proves the browser to Express to Mongoose path end to end. Contains the only `this.$fetch()` call. `SimpleList` is shared with `config.vue` and is ported here first.

6. `index.vue`, plus `Client.vue`. `Client.vue` is 879 lines, the largest and most carefully tuned file in the project, and requires proportionate care: it is not a mechanical port and should not be treated as one. It carries the daemon log-fetching calls, so this stage proves direct browser-to-daemon calls work in the SPA.

7. `config.vue`, plus `EncoderConfig`, `CacheConfig`, `Property`, `Module`, and the ten `Modules/*Settings` components. The widest stage by file count. The ten Settings components are independent of one another and are the primary fan-out opportunity. This page is the only user of `$set` / `$delete`, on `config.Resolutions` and `config.EncoderConfig`.

8. `jobs.vue`, plus `JobDataTable`. First `v-data-table` conversion: headers move from `text`/`value` to `title`/`key`, and item slots are renamed accordingly.

9. `globalconfig.vue`, plus `TextDataTable`. A second data table, plus the `v-time-picker` used for the client availability window. `VTimePicker` remains in Vuetify labs and needs an explicit labs import; it is the most likely component to require a workaround, which is why this stage is last.

10. Cutover. Delete Nuxt and all Nuxt dependencies, `nuxt.config.js`, `layouts/`, the root-level `pages/` (relocating `clients.txt` to `docs/`), `api/`, and `static/`. Point Express at `dist/`. Rewrite the Dockerfile as a multi-stage build: build the SPA, then run `server/index.js`. Replace `NUXT_HOST` / `NUXT_PORT` with a single `PORT`, and set `VITE_COMMIT_SHA` from the existing `COMMIT` build argument. Remove `shamefully-hoist` from `.npmrc`, which existed only for Nuxt 2's webpack. This is the first irreversible stage and only runs once every page has been seen working.

11. TypeScript pass. Convert each script to `<script setup lang="ts">` against the now-working app. Extract `useClientResolution()`. Type the Client, Job, Config, and Field shapes. Drop `promise.any` and `es-abstract`. Enable strict mode.

12. Cleanup. Replace ESLint 7 and the Nuxt eslint configs (`@nuxtjs/eslint-config`, `@nuxtjs/eslint-module`, `eslint-plugin-nuxt`, `babel-eslint`) with a Vue 3 + TypeScript setup. Replace `jsconfig.json` with `tsconfig.json`. Remove remaining dead dependencies. Update the README, which currently documents a Nuxt app.

## Vuetify breaking changes inventory (v2 to v4)

Collected up front because they drive most of stages 4-9. Every item below is present in the current codebase.

- `v-list-item-content`, `v-list-item-action`, `v-list-item-icon`: removed. List items are flat.
- `v-list-item-group`: removed. Selection is handled by `v-list` with `v-model` and item `value`.
- `v-tabs-items` / `v-tab-item`: replaced by `v-window` / `v-window-item`.
- `v-tabs-slider`: removed; slider is styled via props.
- `v-subheader`: renamed `v-list-subheader`.
- `v-layout` / `v-flex`: Vuetify 1-era grid, long removed. Become `v-row` / `v-col`.
- `app`, `fixed`, `clipped`, `clipped-left` props on layout components: removed. Vuetify 4 computes layout automatically.
- `dark` prop on `v-app` and various components: removed in favour of theme configuration.
- `v-data-table`: header schema changes from `text`/`value` to `title`/`key`; item slot names change accordingly.
- `v-time-picker`: still in Vuetify labs; requires an explicit labs import.
- Theme configuration format: colors now nest under `themes.dark.colors`.
- Icons: `@mdi/font` was supplied by `@nuxtjs/vuetify` and must now be installed and registered explicitly.

One Vue 3 core breaking change also applies, separate from Vuetify. The component `v-model` contract changes from the `value` prop plus `input` event to `modelValue` plus `update:modelValue`. Only `TextDataTable.vue` is affected: it declares `value: Array` and is bound with `v-model` four times in `globalconfig.vue`. Its `$emit("input")` calls are already commented out, so the binding is effectively one-way and only the prop rename is required.

## Execution model

Implementation runs through workflows with subagent-driven development, fanning out where stages are genuinely independent.

Parallelism is available within stages, not across them, because stages 4-9 all build on the layout from stage 4 and share the Vuetify conventions established there. The main fan-out opportunities:

- Stage 7's ten `Modules/*Settings` components are mutually independent and can be ported concurrently, one subagent each, against a shared set of Vuetify 4 conventions agreed beforehand.
- Stages 5, 8, and 9 touch disjoint pages and components and can proceed in parallel once stage 4 lands, subject to the Vuetify conventions being settled.
- Stage 11's TypeScript conversion is per-file and parallelizes broadly, after shared types and composables exist.

Model selection: chore-shaped work (the pnpm migration, mechanical template renames, dependency cleanup, per-file TypeScript conversion of simple components) is delegated to Sonnet subagents to control cost. Work requiring judgement stays on the stronger model. `components/Client.vue` is explicitly excluded from delegation to a cheaper model: it is a carefully tuned file and is ported with extra care.

## Risks

The largest risk is that no automated verification exists, by choice. Mitigated by keeping both apps runnable side by side until cutover and by porting page by page.

`v-time-picker` sitting in Vuetify labs is the most likely component-level blocker. Deferred to the last stage so it cannot hold up anything else.

`Client.vue` at 879 lines is the highest-risk single file. It gets a dedicated stage and no cost-driven model downgrade.

pnpm under Nuxt 2 requires `shamefully-hoist=true`. This is a known wart, tolerable because it is temporary by construction and removed at stage 10.
