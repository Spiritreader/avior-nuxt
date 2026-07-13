# Nuxt 2 to Vue 3 SPA Migration — Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Goal: Migrate the Avior admin dashboard from Nuxt 2 / Vue 2 / Vuetify 2 (SSR) to a Vue 3 / Vite / Vuetify 4 single-page app served by a standalone Express server, on pnpm, with `<script setup lang="ts">` components.

Architecture: The Express + Mongoose API is extracted out of Nuxt's `serverMiddleware` into a standalone server that also serves the built SPA, keeping the current single-container deployment. SSR is removed entirely, which eliminates the dual base-URL problem the project previously hit. The Vue 3 app is scaffolded alongside the still-working Nuxt app and pages are ported one at a time so each can be compared against its live predecessor; Nuxt is deleted only after every page has been seen working.

Tech Stack: Vue 3, Vite, Vuetify 4, vue-router via unplugin-vue-router, native fetch, Express, Mongoose, pnpm, TypeScript.

Design spec: `docs/superpowers/specs/2026-07-13-nuxt2-to-vue3-migration-design.md`

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

## Task 1: Migrate to pnpm

Stage 1 of the spec. Nothing about Vue changes. The app must still build and run on Nuxt 2 at the end of this task.

Files:
- Create: `.npmrc`
- Create: `pnpm-lock.yaml` (generated)
- Delete: `package-lock.json`
- Modify: `package.json` (add `packageManager` field)
- Modify: `Dockerfile`
- Modify: `Jenkinsfile`
- Modify: `.github/workflows/main.yml`

Interfaces:
- Produces: a working pnpm install for the existing Nuxt 2 app. All later tasks assume `pnpm` is the only package manager.

- [ ] Step 1: Import the existing lockfile so resolved versions do not shift

`pnpm import` reads `package-lock.json` and produces a `pnpm-lock.yaml` with the same resolved versions. This is the whole point — a fresh `pnpm install` would silently upgrade transitive dependencies and we would not know whether a later breakage came from that or from our own changes.

```bash
cd /c/repos/avior-nuxt
pnpm import
```

Expected: `pnpm-lock.yaml` is created. Output ends with something like `Importing package-lock.json to pnpm-lock.yaml`.

- [ ] Step 2: Add the hoisting workaround

Nuxt 2's webpack build assumes a flat `node_modules` and breaks under pnpm's strict symlinked layout — concretely, `pnpm build` fails with `Cannot find module 'vue'`. Hoisting reproduces npm's flat layout. This is a wart, and it is deliberately temporary: Task 13 removes it once Nuxt is gone.

Note that pnpm 11 does NOT read `shamefully-hoist` from `.npmrc`; that setting moved to `pnpm-workspace.yaml`. Putting it only in `.npmrc` silently does nothing and the build fails. Both files are created — `.npmrc` because it remains the conventional location and costs one line, `pnpm-workspace.yaml` because it is the one that actually takes effect.

Create `.npmrc`:

```
shamefully-hoist=true
```

Create `pnpm-workspace.yaml`:

```yaml
shamefullyHoist: true
allowBuilds:
  core-js: true
  nuxt: true
```

`allowBuilds` is required because pnpm blocks post-install build scripts by default; `core-js` and `nuxt` both need theirs to run.

- [ ] Step 3: Pin the package manager

Add to `package.json`, as a top-level field alongside `"private": true`:

```json
  "packageManager": "pnpm@11.12.0",
```

Confirm the version matches by running `pnpm -v` and using whatever it reports.

- [ ] Step 4: Install and verify the app still builds

```bash
rm -rf node_modules
pnpm install
pnpm build
```

Expected: `pnpm install` completes without unmet-peer errors that mention `nuxt`, `vue`, or `vuetify`. `pnpm build` completes and prints the Nuxt build summary with a `.nuxt/dist` output. If the build fails on a missing module, the hoist flag is not taking effect — confirm `.npmrc` is at the repository root and re-run `pnpm install`.

- [ ] Step 5: Verify the app still runs

```bash
pnpm dev
```

Expected: Nuxt starts and serves on `http://localhost:3000`. Open it. The Overview page renders with the nav drawer. Stop the server.

- [ ] Step 6: Delete the npm lockfile

```bash
rm package-lock.json
```

- [ ] Step 7: Update the Dockerfile to use pnpm

Replace the `RUN npm install` and `RUN npm run build` lines and the `CMD`. The full `Dockerfile` becomes:

```dockerfile
FROM node:20.1.0-alpine

ARG COMMIT=""
LABEL commit=${COMMIT}

RUN mkdir -p /app
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.12.0 --activate

COPY . /app

ENV NUXT_ENV_CURRENT_GIT_SHA=${COMMIT}

RUN pnpm install --frozen-lockfile
RUN pnpm build
EXPOSE 10009
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=10009
CMD [ "pnpm", "start" ]
```

`--frozen-lockfile` makes CI fail loudly if `pnpm-lock.yaml` is out of sync with `package.json`, rather than silently resolving something different from what was tested.

- [ ] Step 8: Verify the Docker build

```bash
docker build -t avior-pnpm-check .
```

Expected: build succeeds through the `pnpm build` layer. If Docker is unavailable in this environment, say so explicitly rather than assuming it passed, and flag it for the user to run.

- [ ] Step 9: Confirm the CI pipelines need no changes

Read `Jenkinsfile` and `.github/workflows/main.yml`. Both delegate entirely to `docker build`, and neither invokes npm directly. Confirm this by reading them. If that holds, they require no edit and this step is a no-op — record that finding in the commit message rather than making a cosmetic change.

- [ ] Step 10: Commit

```bash
git add -A
git commit -m "chore: migrate from npm to pnpm

Import package-lock.json via 'pnpm import' to preserve resolved versions.
shamefully-hoist is required for Nuxt 2's webpack build under pnpm's strict
node_modules layout; it is removed at cutover when Nuxt is dropped."
```

---

## Task 2: Extract the Express API from Nuxt

Stage 2 of the spec. The API becomes independently bootable while Nuxt continues to consume it, so the backend reaches its final shape before any frontend work begins.

Files:
- Create: `server/app.js`
- Create: `server/index.js`
- Create: `server/schema.js` (moved from `api/schema.js`)
- Modify: `api/api.js` (becomes a thin re-export for Nuxt)
- Delete: `api/config.json`
- Modify: `package.json` (add `dev:api` and `start` scripts)
- Modify: `Dockerfile` (pass `MONGO_URL`)

Interfaces:
- Produces: `server/app.js` default-exports a configured Express `app` with routes `GET /clients`, `POST /clients`, `POST /clients/delete` mounted at the app root (Nuxt mounts it under `/api`; the standalone server mounts it under `/api` too, so the browser-facing paths are identical either way).
- Produces: `server/index.js`, runnable via `node server/index.js`, listening on `process.env.PORT || 10009`.
- Produces: `MONGO_URL` environment variable, defaulting to `mongodb://10.11.194.75/Avior`.

- [ ] Step 1: Move the Mongoose schema

```bash
mkdir -p server
git mv api/schema.js server/schema.js
```

Content is unchanged.

- [ ] Step 2: Create `server/app.js`

This is the current `api/api.js` with three changes: the Mongo URL comes from the environment, the Mongoose callback-style calls are replaced with promises (Mongoose 6 still accepts callbacks but they are removed in Mongoose 7, and the current `Client.find((err, clients) => …)` style is already deprecated), and it exports the app rather than a Nuxt serverMiddleware descriptor.

```js
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const Client = require('./schema.js')

const MONGO_URL = process.env.MONGO_URL || 'mongodb://10.11.194.75/Avior'

mongoose.connect(MONGO_URL)

const db = mongoose.connection
db.on('error', console.error.bind(console, 'mongo error:'))
db.once('open', () => console.log(`mongo connected: ${MONGO_URL}`))

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({ optionsSuccessStatus: 200 }))

app.get('/clients', async (req, res) => {
  try {
    const clients = await Client.find()
    res.json(clients)
  } catch (err) {
    console.error('error retrieving clients:', err)
    res.status(500).json({ error: 'failed to retrieve clients' })
  }
})

app.post('/clients', async (req, res) => {
  const { Name, Addresses } = req.body
  if (!Name || !Addresses) {
    res.status(400).json({ error: 'Name and Addresses are required' })
    return
  }
  try {
    const client = new Client({
      _id: new mongoose.Types.ObjectId(),
      Name,
      Addresses,
    })
    await client.save()
    res.json(client)
  } catch (err) {
    console.error('error creating client:', err)
    res.status(500).json({ error: 'failed to create client' })
  }
})

app.post('/clients/delete', async (req, res) => {
  const { _id } = req.body
  if (!_id) {
    res.status(400).json({ error: '_id is required' })
    return
  }
  try {
    await Client.deleteOne({ _id })
    res.json({ message: 'deleted', client: req.body })
  } catch (err) {
    console.error('error deleting client:', err)
    res.status(404).json({ error: 'failed to delete client' })
  }
})

module.exports = app
```

Note the deliberate behaviour changes, all of which are corrections rather than redesigns: `body-parser` is dropped because Express 4.16+ ships `express.json()` and `express.urlencoded()` natively; missing-field responses become 400 rather than 500 (they are client errors, and the current code returns `{"error": "no bueno"}` with a 500, which is wrong); `cors()` is applied once as middleware rather than per-route, which also removes the need for the two explicit `app.options(...)` handlers.

- [ ] Step 3: Create `server/index.js`

```js
const path = require('path')
const express = require('express')
const app = require('./app.js')

const PORT = process.env.PORT || 10009

// The API lives under /api. In production the built SPA is served from dist/
// and any unmatched route falls through to index.html so that client-side
// routing works on a hard refresh.
const server = express()
server.use('/api', app)

const distDir = path.join(__dirname, '..', 'dist')
server.use(express.static(distDir))
server.get('*', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'))
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`avior listening on http://0.0.0.0:${PORT}`)
})
```

The `dist/` directory does not exist yet. That is fine — until Task 13 this server is only used for its `/api` routes, and the static handlers simply 404. Do not add a guard for it.

- [ ] Step 4: Reduce `api/api.js` to a re-export

Nuxt still needs its serverMiddleware descriptor. Replace the entire contents of `api/api.js` with:

```js
const app = require('../server/app.js')

export default {
  handler: app,
  path: '/api',
}
```

- [ ] Step 5: Delete the committed Mongo config

```bash
git rm api/config.json
```

The URL now lives in `MONGO_URL`, defaulting to the same value, so nothing breaks for existing deployments.

- [ ] Step 6: Add the scripts

In `package.json`, add to `scripts`:

```json
    "dev:api": "node server/index.js",
```

- [ ] Step 7: Pass MONGO_URL through Docker

In `Dockerfile`, add below the `NUXT_ENV_CURRENT_GIT_SHA` line:

```dockerfile
ENV MONGO_URL=mongodb://10.11.194.75/Avior
```

- [ ] Step 8: Verify the Nuxt-hosted path still works

```bash
pnpm dev
```

Then in another shell:

```bash
curl -s http://localhost:3000/api/clients
```

Expected: a JSON array of registered clients (or `[]` if the database is empty). Not a 404, and not an HTML error page. Also open `http://localhost:3000/settings` in a browser and confirm the client list still renders. Stop the server.

- [ ] Step 9: Verify the standalone path works

```bash
pnpm dev:api
```

Then in another shell:

```bash
curl -s http://localhost:10009/api/clients
```

Expected: the same JSON array. This proves the server can boot without Nuxt, which is the entire point of this task. Stop the server.

- [ ] Step 10: Commit

```bash
git add -A
git commit -m "refactor: extract Express API from Nuxt serverMiddleware

server/app.js exports the Express app; server/index.js boots it standalone
and will serve the SPA from dist/ after cutover. Nuxt still consumes the same
app via api/api.js, so behaviour is unchanged.

Mongo URL moves to MONGO_URL (same default). Drops body-parser for Express's
built-in parsers, replaces deprecated Mongoose callbacks with promises, and
returns 400 rather than 500 for missing request fields."
```

---

## Task 3: Scaffold the Vue 3 app

Stage 3 of the spec. The Vue 3 app is created alongside the working Nuxt app. Nothing is deleted. At the end of this task both apps run.

Files:
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/App.vue` (temporary placeholder; Task 4 replaces its contents)
- Create: `src/plugins/vuetify.ts`
- Create: `src/router/index.ts`
- Create: `src/api/http.ts`
- Create: `src/pages/index.vue` (temporary placeholder)
- Create: `public/` (copied from `static/`)
- Create: `tsconfig.json`, `tsconfig.node.json`
- Modify: `package.json` (dependencies and scripts)

Interfaces:
- Produces: `src/api/http.ts` exporting `get(url)`, `post(url, body)`, `put(url, body)`, `del(url)`. Every one returns a parsed JSON body and throws on a non-2xx response. These are the drop-in replacements for `$http.$get` / `$post` / `$put` / `$delete` and are used by every subsequent task.
- Produces: `@` as a path alias for `src/`.
- Produces: a Vuetify instance with the stock dark theme, `primary: #9E9E9E`, `secondary: #FF8F00`, MDI icons, and `VTimePicker` registered from labs.
- Produces: file-based routes from `src/pages/`, so route paths are unchanged from Nuxt.

- [ ] Step 1: Install the Vue 3 toolchain

These are added alongside the Nuxt dependencies. The two dependency trees coexist until Task 13. pnpm handles this without conflict because Vue 2 (`vue@2`, pulled in by `nuxt`) and Vue 3 (`vue@3`) are separate packages in the tree — but note that `pnpm dev:nuxt` and `pnpm dev` must not be assumed to share anything.

```bash
pnpm add vue@^3.5 vue-router@^4.6 vuetify@^4.1 @mdi/font
pnpm add -D vite @vitejs/plugin-vue vite-plugin-vuetify@^2.1 unplugin-vue-router typescript vue-tsc @types/node
```

Two of these pins are deliberate and must not be "upgraded":

`vuetify@^4.1` — Vuetify 4 is the current release (4.1.4) and is still a Vue 3 library; its peer dependency is `vue: ^3.5.0`. Do not install Vuetify 3.

`vue-router@^4.6` — vue-router 5 exists, but `unplugin-vue-router@0.19.2` (the newest) declares `vue-router: ^4.6.0` as its peer. Since this project uses file-based routing, vue-router 4.6.x is required. Installing vue-router 5 will break routing. If a future unplugin-vue-router supports v5, that is a separate change, not this task.

Record the resolved versions from the pnpm output in the commit message.

- [ ] Step 2: Delete the dead files

Done now, before any porting begins, so that no later task wastes effort porting a component nothing uses. All four were confirmed unreferenced during the design review.

```bash
git rm pages/test.vue components/Logo.vue components/VuetifyLogo.vue assets/variables.scss
```

`pages/test.vue` is an unlinked scratch page. `Logo.vue` and `VuetifyLogo.vue` are Nuxt/Vuetify starter-template leftovers rendered by nothing. `assets/variables.scss` contains only comments, which means Nuxt's `customVariables: ['~/assets/variables.scss']` has always been a no-op — this is why the Vite config needs no SASS variable plumbing.

Removing `pages/test.vue` deletes the `/test` route. Nothing links to it.

- [ ] Step 3: Copy static assets to `public/`

Nuxt serves `static/` at the web root; Vite serves `public/`. Paths are preserved, so absolute references like `/dryicons_love_file_icon_6200.png` (used in the layout) and `/favicon.ico` keep resolving.

```bash
mkdir -p public
cp static/favicon.ico static/favicon_def.ico static/v.png static/vuetify-logo.svg static/dryicons_love_file_icon_6200.png static/dryicons_love_file_icon_6200.svg public/
```

Do not delete `static/` — the Nuxt app still needs it until Task 13.

- [ ] Step 4: Create `index.html` at the repository root

Vite's entry point. Nuxt generated this; now it is a real file.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <title>Avior - powered by Walzen Group</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

The title reproduces Nuxt's `titleTemplate: '%s - powered by Walzen Group'` with the `Avior` title. Per-page titles are not currently set by any page, so a static title is faithful.

- [ ] Step 5: Create `vite.config.ts`

```ts
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import VueRouter from 'unplugin-vue-router/vite'

export default defineConfig({
  plugins: [
    // VueRouter must come before vue()
    VueRouter({
      routesFolder: 'src/pages',
      dts: 'src/typed-router.d.ts',
    }),
    vue(),
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Forwards app-origin API calls to the standalone Express server in dev.
      // In production the same Express server serves the built SPA, so the
      // relative /api path resolves without any proxy. This is why no baseURL
      // is configured anywhere in the app.
      '/api': {
        target: 'http://localhost:10009',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] Step 6: Create `tsconfig.json`

Strict mode is off for now. Components are still JavaScript until Task 14; turning strict on before they are converted produces thousands of meaningless errors. Task 14 enables it.

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "strict": false,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "allowJs": true,
    "types": ["vite/client", "unplugin-vue-router/client"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue", "vite.config.ts"]
}
```

- [ ] Step 7: Create `src/plugins/vuetify.ts`

```ts
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import { VTimePicker } from 'vuetify/labs/VTimePicker'

export default createVuetify({
  // VTimePicker is still in Vuetify labs and is not auto-imported by
  // vite-plugin-vuetify. globalconfig.vue needs it for the client
  // availability window.
  components: { VTimePicker },
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          primary: '#9E9E9E',
          secondary: '#FF8F00',
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
  },
})
```

- [ ] Step 8: Create `src/router/index.ts`

```ts
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'

export default createRouter({
  history: createWebHistory(),
  routes,
})
```

`vue-router/auto-routes` is generated by unplugin-vue-router from `src/pages/`. Filenames map to route paths exactly as they did under Nuxt, so `/jobs`, `/config`, `/globalconfig`, and `/settings` are unchanged.

- [ ] Step 9: Create `src/api/http.ts`

The `$http` replacement. Signatures deliberately mirror `@nuxt/http`'s `$get`/`$post`/`$put`/`$delete` so the roughly 40 call sites port one-to-one.

```ts
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${url} failed: ${res.status} ${res.statusText}`)
  }

  // Some daemon endpoints reply 204 or with an empty body.
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

export function get<T = any>(url: string): Promise<T> {
  return request<T>(url)
}

export function post<T = any>(url: string, body?: unknown): Promise<T> {
  return request<T>(url, { method: 'POST', body: JSON.stringify(body) })
}

export function put<T = any>(url: string, body?: unknown): Promise<T> {
  return request<T>(url, { method: 'PUT', body: JSON.stringify(body) })
}

export function del<T = any>(url: string): Promise<T> {
  return request<T>(url, { method: 'DELETE' })
}
```

`delete` is a reserved word, hence `del`. `@nuxt/http` threw on non-2xx; this does too, so existing try/catch blocks in the pages keep working.

- [ ] Step 10: Create `src/main.ts`

```ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'

createApp(App).use(router).use(vuetify).mount('#app')
```

- [ ] Step 11: Create the placeholder `src/App.vue`

Task 4 replaces this entirely. It exists only so the scaffold boots.

```vue
<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
```

- [ ] Step 12: Create the placeholder `src/pages/index.vue`

```vue
<template>
  <div>Scaffold OK</div>
</template>
```

- [ ] Step 13: Add the Vite scripts

The Nuxt scripts are renamed rather than removed, so both apps stay runnable. In `package.json`, `scripts` becomes:

```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "dev:api": "node server/index.js",
    "start": "node server/index.js",
    "dev:nuxt": "nuxt",
    "build:nuxt": "nuxt build",
    "start:nuxt": "nuxt start",
    "typecheck": "vue-tsc --noEmit",
    "lint:js": "eslint --ext .js,.vue --ignore-path .gitignore .",
    "lint": "pnpm lint:js"
  },
```

Note that `build` and `start` now refer to the Vue 3 app and the standalone server. The Dockerfile still calls `pnpm build` and `pnpm start`, which means the Docker image is broken between here and Task 13. That is intentional and acceptable — the branch is not deployed mid-migration — but do not "fix" it by pointing the Dockerfile back at Nuxt.

- [ ] Step 14: Verify the scaffold boots

```bash
pnpm dev
```

Expected: Vite starts on `http://localhost:5173`. Opening it shows "Scaffold OK" on a dark background. The browser console is free of errors.

- [ ] Step 15: Verify the dev proxy reaches Express

With `pnpm dev:api` running in another shell, and Vite still running:

```bash
curl -s http://localhost:5173/api/clients
```

Expected: the same JSON array as `http://localhost:10009/api/clients`. This proves the relative-`/api` strategy works in dev, which is the mechanism replacing the old `browserBaseURL`.

- [ ] Step 16: Verify the Nuxt app still runs

```bash
pnpm dev:nuxt
```

Expected: Nuxt serves on port 3000, unchanged. Both apps now run simultaneously. This side-by-side capability is the verification strategy for every remaining port task, so do not proceed until it works.

- [ ] Step 17: Commit

```bash
git add -A
git commit -m "feat: scaffold Vue 3 + Vite + Vuetify 4 app alongside Nuxt

Adds vite.config.ts, the Vuetify 4 instance (stock dark theme, primary
#9E9E9E and secondary #FF8F00), file-based routing via unplugin-vue-router,
and the native-fetch http wrapper replacing @nuxt/http.

No baseURL is configured: relative /api paths resolve against the origin in
prod and are proxied to Express in dev. Nuxt is untouched and still runs on
port 3000."
```

---

## Task 4: Port the layout

Stage 4 of the spec. Everything else depends on this, so it goes first and alone.

Files:
- Modify: `src/App.vue` (replace placeholder with the port of `layouts/default.vue`)
- Create: `src/pages/[...path].vue` (catch-all, replacing `layouts/error.vue`)
- Reference (do not modify): `layouts/default.vue`, `layouts/error.vue`

Interfaces:
- Produces: the app shell — `v-app`, `v-navigation-drawer`, `v-app-bar`, `v-main` containing `<router-view />`, and `v-footer`. Every page from Task 5 onwards renders inside this.

This is the highest-density Vuetify conversion in the project relative to its size. `layouts/default.vue` uses `app`, `fixed`, `clipped`, `clipped-left`, `mini-variant`, `v-list-item-content`, `v-list-item-action`, and a `dark` prop on `v-app` — nearly every removed API at once. Do not attempt a find-and-replace; read the Vuetify 4 docs for `v-navigation-drawer` and `v-app-bar` and rebuild the shell.

- [ ] Step 1: Read the source

Read `layouts/default.vue` in full (146 lines). Note the five nav items and their routes, the drawer/mini-variant/clipped toggles in the app bar, the scrollbar CSS, and the footer's commit-hash link.

- [ ] Step 2: Port to `src/App.vue`

Apply the conversion table. The specific changes required:

- `<v-app dark>` becomes `<v-app>` — the theme is dark by configuration now.
- `v-navigation-drawer`: drop `fixed` and `app`; `:mini-variant="miniVariant"` becomes `:rail="miniVariant"`.
- `v-app-bar`: drop `fixed`, `app`, and `:clipped-left="clipped"`.
- `v-footer`: drop `app` and `:absolute="!fixed"`.
- The nav `v-list-item` loop: `v-list-item-action` wrapping a `v-icon` becomes `<template #prepend><v-icon>…</v-icon></template>`; `v-list-item-content` wrapping `v-list-item-title` is unwrapped so the title is a direct child.
- `<nuxt />` inside `v-main`'s `v-container` becomes `<router-view />`.
- `process.env.commitSha` becomes `import.meta.env.VITE_COMMIT_SHA`.

The `clipped` toggle deserves a decision rather than a mechanical port: Vuetify 4 computes layout automatically and has no `clipped` concept, so the button that toggles it has nothing to toggle. Keep the button and wire it to nothing, or remove it. Remove it — a button that does nothing is worse than an absent one. Note the removal in the commit message so the user can object.

Keep the `<style>` block (scrollbar styling, `.max-container-width`, `.code-font`) verbatim. It is plain CSS and carries over unchanged.

- [ ] Step 3: Port the error layout to a catch-all route

`layouts/error.vue` (44 lines) is Nuxt's error page. In vue-router the equivalent is a catch-all route. Read it, then create `src/pages/[...path].vue` reproducing its markup — a centered message with a link back to `/`. unplugin-vue-router maps the `[...path]` filename to a catch-all.

- [ ] Step 4: Restore the real index page placeholder

`src/pages/index.vue` currently says "Scaffold OK". Leave it — Task 7 replaces it. The point of this task is the shell.

- [ ] Step 5: Verify

Run `pnpm dev` and `pnpm dev:nuxt`. Open `http://localhost:5173` and `http://localhost:3000` side by side.

Expected: identical app bar, identical nav drawer with the same five items and icons, identical footer. The drawer toggle opens and closes it. The rail (mini-variant) toggle collapses it to icons. Clicking each nav item changes the URL to `/`, `/jobs`, `/config`, `/globalconfig`, `/settings` — the pages are empty (they do not exist yet) but the route must change and the catch-all must not fire. Navigating to `http://localhost:5173/nonexistent` shows the error page.

The browser console must be free of Vuetify warnings. Vuetify 4 warns loudly about removed props, so any surviving `app`/`fixed`/`clipped` shows up here.

- [ ] Step 6: Commit

```bash
git add -A
git commit -m "feat: port app layout to Vue 3 + Vuetify 4

App.vue replaces layouts/default.vue; a [...path] catch-all route replaces
layouts/error.vue.

Vuetify 4 computes layout geometry itself, so the app/fixed/clipped/
clipped-left props are gone. The app-bar button that toggled 'clipped' has
been removed rather than left wired to nothing."
```

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

Vuetify APIs in use that change: `v-list-item-content` (unwrap), `v-skeleton-loader`, `v-virtual-scroll`, `v-tooltip`, `v-btn-toggle`, and a `dark` prop. `v-skeleton-loader`, `v-virtual-scroll`, and `v-btn-toggle` all exist in Vuetify 4 but their props and slots differ — check each against the Vuetify 4 docs rather than assuming. `v-tooltip` in particular changed its activator API significantly: the Vuetify 2 `v-slot:activator="{ on, attrs }"` with `v-on="on" v-bind="attrs"` becomes `v-slot:activator="{ props }"` with `v-bind="props"`.

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
git commit -m "feat: port Client.vue to Vue 3 + Vuetify 4

Largest and most carefully tuned component in the project (879 lines).
Behaviour preserved exactly. v-tooltip's activator slot API changed
(on/attrs -> props); v-skeleton-loader, v-virtual-scroll and v-btn-toggle
props checked individually against Vuetify 4.

Daemon log calls remain absolute URLs straight from the browser, not proxied."
```

---

## Task 7: Port index.vue

Stage 6b. The Overview page. Depends on Task 6.

Files:
- Modify: `src/pages/index.vue` (replace the scaffold placeholder with the port of `pages/index.vue`, 254 lines)
- Reference (do not modify): the original

Interfaces:
- Consumes: `src/components/Client.vue` (Task 6), `get` from `@/api/http`.

- [ ] Step 1: Port the template

`v-skeleton-loader` is the only changed Vuetify API here. Add `import Client from '@/components/Client.vue'` and register it.

- [ ] Step 2: Port the script

- The `async fetch()` hook at line 35 becomes `refresh()` in `methods`, called from `mounted()`. If the template uses `$fetchState.pending`, replace it with a `loading` data property set by `refresh()`.
- `this.$http.$get` calls at lines 145, 148, 158, and 177 become `get(...)`.
- Line 158 (`get("api/clients")`) is an app-origin call. Note that the original passes `"api/clients"` without a leading slash, which resolves relative to the current path — it happens to work at `/` but would break on a nested route. Change it to `"/api/clients"`. This is a latent bug fix; call it out in the commit message.
- Lines 145, 148, and 177 are absolute daemon URLs and stay absolute.

The address-resolution logic (the `/alive` race, around line 177) stays duplicated for now. It is extracted into a composable in Task 14, deliberately, so that this task changes only what Vue 3 breaks.

- [ ] Step 3: Confirm `Promise.any` still resolves

The original relies on the `promise.any` polyfill, transpiled by Nuxt. Vite does not transpile it and does not need to — `Promise.any` is natively available. If the file imports `promise.any` explicitly, remove the import and use the native global. Do not remove the dependency from `package.json` yet; that happens in Task 14 once every consumer is ported.

- [ ] Step 4: Verify

Open `http://localhost:5173/` and `http://localhost:3000/` side by side.

Expected: the same client cards, in the same order, with the same live/offline status. The address race resolves and each online client shows its encoder line-out. Skeleton loaders appear while loading. Console clean.

- [ ] Step 5: Commit

```bash
git add -A
git commit -m "feat: port Overview page to Vue 3 + Vuetify 4

Nuxt's fetch() hook becomes refresh() from mounted(). Fixes a latent bug: the
client registry was fetched from the relative path 'api/clients' rather than
'/api/clients', which only worked because this page is mounted at the root.

Address-resolution logic remains duplicated here; it is extracted into a
composable in the TypeScript pass."
```

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

---

## Task 9: Port EncoderConfig, CacheConfig, Property, and Module

Stage 7b. The four remaining `config.vue` dependencies. `Module.vue` imports `AudioSettings`, so it depends on Task 8.

Files:
- Create: `src/components/EncoderConfig.vue` (241 lines)
- Create: `src/components/CacheConfig.vue` (139 lines)
- Create: `src/components/Property.vue` (92 lines)
- Create: `src/components/Modules/Module.vue` (69 lines)

Interfaces:
- Consumes: the ten Settings components (Task 8), imported by `Module.vue`.
- Produces: four components with unchanged props and events, consumed by `config.vue` in Task 10.

Known Vuetify APIs: `CacheConfig.vue` uses `v-subheader` (becomes `v-list-subheader`). The others are standard form components. `Module.vue` must add an explicit import for `AudioSettings` and any other Settings component it renders — auto-import is gone.

- [ ] Step 1: Port all four, applying the conversion table.

- [ ] Step 2: Verify

As with Task 8, these render inside `config.vue` and cannot be visually verified yet. `pnpm typecheck` and `pnpm build` must both pass. Do not claim more than that.

- [ ] Step 3: Commit

```bash
git add -A
git commit -m "feat: port EncoderConfig, CacheConfig, Property and Module to Vuetify 4

v-subheader becomes v-list-subheader in CacheConfig. Module.vue gains explicit
imports for the Settings components it renders, replacing Nuxt auto-import."
```

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

---

## Task 11: Port jobs.vue and JobDataTable.vue

Stage 8. First `v-data-table` conversion. Independent of Tasks 8-10 and can run in parallel with them once Task 4 has landed.

Files:
- Create: `src/pages/jobs.vue` (625 lines)
- Create: `src/components/JobDataTable.vue` (204 lines)

Interfaces:
- Consumes: `get`/`post`/`put`/`del` from `@/api/http`.

`JobDataTable.vue` defines its headers at lines 119-121 in the Vuetify 2 shape (`{ text: "Name", value: "Name" }`, `{ text: "Actions", value: "actions", sortable: false, align: "right" }`). Every one becomes `{ title: …, key: … }`. Item slots keyed on the old `value` must be re-keyed on the new `key`; since the values are unchanged (`Name`, `actions`), the slot names happen to stay the same — but confirm that rather than assuming it.

`jobs.vue` also uses `v-system-bar`, `v-list-item-content`, `v-list-item-icon`, and `v-list-item-group`.

- [ ] Step 1: Port `JobDataTable.vue`, converting the header schema and checking every item slot renders.

- [ ] Step 2: Port `jobs.vue`. The `async fetch()` at line 332 becomes `refresh()` from `mounted()`. The `$http` calls at lines 394, 422, 443, 461, 466, 477, 498, 574, 592, and 613 become the wrapper's helpers. Line 584 (`"api/clients"`) is app-origin and gains a leading slash. The rest are absolute daemon URLs.

- [ ] Step 3: Verify

Open `http://localhost:5173/jobs` and `http://localhost:3000/jobs` side by side.

Expected: the job table renders with the same columns, same sort behaviour, and same row actions. Sorting by a column works. The job de-duplication logic behaves identically — this is one of the two places the spec flags as able to regress silently, so exercise it deliberately: add a job that already exists and confirm the app handles it the same way the old one does. Deleting a job works. Console clean.

- [ ] Step 4: Commit

```bash
git add -A
git commit -m "feat: port jobs page and JobDataTable to Vue 3 + Vuetify 4

First v-data-table conversion: header schema moves from {text,value} to
{title,key}. Job de-duplication behaviour verified against the old app."
```

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
git commit -m "feat: port global config page and TextDataTable to Vue 3 + Vuetify 4

Heaviest Vuetify conversion: v-layout/v-flex (Vuetify 1-era grid) become
v-row/v-col; v-tabs-items becomes v-window; v-menu and v-overlay activator
slots move from {on,attrs} to {props}. VTimePicker comes from Vuetify labs.

TextDataTable's 'value' prop becomes 'modelValue' for Vue 3's v-model
contract."
```

---

## Task 13: Cutover — delete Nuxt

Stage 10. The first irreversible task. It runs only after every page from Tasks 4-12 has been observed working.

Files:
- Delete: `nuxt.config.js`, `layouts/`, `pages/` (root-level), `api/`, `static/`, `jsconfig.json`
- Move: `pages/clients.txt` to `docs/clients.txt`
- Delete: `components/` (root-level — all have been ported to `src/components/`)
- Delete: `assets/` (only contained the empty `variables.scss`)
- Modify: `package.json` (remove Nuxt dependencies and scripts)
- Modify: `.npmrc` (remove `shamefully-hoist`)
- Modify: `Dockerfile` (multi-stage build)

- [ ] Step 1: Confirm every page works before deleting anything

Re-run the verification for all five routes (`/`, `/jobs`, `/config`, `/globalconfig`, `/settings`) against the Vue 3 app. Do not proceed on the assumption that earlier tasks passed; run them. This is the last moment the old app exists to compare against.

- [ ] Step 2: Preserve `clients.txt`

```bash
mkdir -p docs
git mv pages/clients.txt docs/clients.txt
```

- [ ] Step 3: Delete the Nuxt application

```bash
git rm -r nuxt.config.js layouts pages api static components assets jsconfig.json
```

`src/pages/`, `src/components/` are untouched by this — only the root-level directories go.

- [ ] Step 4: Remove the Nuxt dependencies

```bash
pnpm remove nuxt @nuxt/http @nuxtjs/axios @nuxtjs/proxy @nuxtjs/vuetify @nuxtjs/eslint-config @nuxtjs/eslint-module eslint-plugin-nuxt babel-eslint body-parser request
```

`body-parser` goes because Task 2 replaced it with Express's built-in parsers. `request` is unused and has been deprecated for years. Keep `express`, `cors`, `mongoose`. Keep `promise.any` and `es-abstract` for now — Task 14 removes them, once the composable extraction confirms nothing depends on them.

- [ ] Step 5: Remove the Nuxt scripts

From `package.json`, delete `dev:nuxt`, `build:nuxt`, and `start:nuxt`.

- [ ] Step 6: Remove the hoisting workaround

Delete `.npmrc` entirely, and remove `shamefullyHoist: true` plus the `allowBuilds` entries for `core-js` and `nuxt` from `pnpm-workspace.yaml` (delete the file if nothing else remains in it). Hoisting existed only for Nuxt 2's webpack build; `core-js` and `nuxt` are both gone by this point. Then:

```bash
rm -rf node_modules
pnpm install
pnpm build
```

Expected: the install produces a strict, symlinked `node_modules`, and the Vite build still succeeds. If it fails, something in the Vue 3 app was relying on a hoisted transitive dependency — fix it by adding the dependency explicitly rather than restoring the flag.

- [ ] Step 7: Rewrite the Dockerfile as a multi-stage build

```dockerfile
FROM node:20-alpine AS build

ARG COMMIT=""
ENV VITE_COMMIT_SHA=${COMMIT}

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.12.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:20-alpine AS runtime

ARG COMMIT=""
LABEL commit=${COMMIT}

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.12.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY server ./server
COPY --from=build /app/dist ./dist

ENV PORT=10009
ENV MONGO_URL=mongodb://10.11.194.75/Avior
EXPOSE 10009

CMD ["node", "server/index.js"]
```

`VITE_COMMIT_SHA` is set in the build stage because Vite inlines `import.meta.env` values at build time — setting it at runtime would have no effect. The existing `COMMIT` build argument, and both CI pipelines that pass it, are unchanged.

- [ ] Step 8: Verify the container end to end

```bash
docker build -t avior-cutover --build-arg COMMIT=$(git rev-parse HEAD) .
docker run --rm -p 10009:10009 avior-cutover
```

Expected: the container starts, logs `avior listening on http://0.0.0.0:10009`, and `http://localhost:10009` serves the app. Navigate to `/jobs` and hard-refresh — it must still load, proving the SPA fallback route works. The footer must show the seven-character commit hash rather than "dev", proving `VITE_COMMIT_SHA` reached the build.

If Docker is not available here, say so and flag it for the user rather than marking this step done.

- [ ] Step 9: Commit

```bash
git add -A
git commit -m "feat!: remove Nuxt, cut over to the Vue 3 SPA

Deletes nuxt.config.js, layouts/, pages/, api/, static/, and the root-level
components/ and assets/ — all superseded by src/. Removes the Nuxt, axios,
@nuxt/http, body-parser and request dependencies.

Express now serves the built SPA from dist/ alongside /api, preserving the
single-container deployment. Dockerfile becomes a multi-stage build; NUXT_HOST
and NUXT_PORT become PORT; VITE_COMMIT_SHA is inlined at build time from the
existing COMMIT build arg.

.npmrc and its shamefully-hoist workaround are gone: they existed only for
Nuxt 2's webpack."
```

---

## Task 14: TypeScript and Composition API pass

Stage 11 of the spec. The second half of the two-pass strategy. Every file now has a known-good, running reference, so a regression here is unambiguously caused by this pass.

This task parallelises broadly once its first two steps are done, and per-file conversion of the simple components is chore-shaped work suitable for a cheaper model. `Client.vue` is not — it keeps the stronger model, as in Task 6.

Files:
- Create: `src/types/index.ts`
- Create: `src/composables/useClientResolution.ts`
- Modify: every `.vue` file under `src/` (scripts only — templates are already correct)
- Modify: `tsconfig.json` (enable `strict`)
- Modify: `package.json` (remove `promise.any`, `es-abstract`)

- [ ] Step 1: Define the shared types

Read the actual API responses before writing these. The daemon and Mongo shapes are not documented anywhere, so infer them from the code that consumes them and, where possible, from a live response. Do not guess: a wrong type here propagates into every file.

`src/types/index.ts` must define at minimum `Client` (the Mongo registry shape: `_id`, `Name`, `Addresses`), `ResolvedClient` (a `Client` plus the resolved live `Address`), `Job`, `Config`, and the field types used by `globalconfig.vue` (`name_exclude`, `sub_exclude`, `log_exclude`, `log_include`).

- [ ] Step 2: Extract `useClientResolution()`

The same logic is duplicated across `index.vue`, `config.vue`, `jobs.vue`, and `globalconfig.vue`: fetch `/api/clients`, then for each client race its candidate `Addresses` against `GET <address>/alive` and keep the first that answers.

Read all four copies first and diff them. They may have drifted — if they have, the differences are either bugs or intentional, and you must determine which before collapsing them into one implementation. Do not assume they are identical just because the spec says the logic is duplicated.

The composable returns the resolved clients and the loading state. Replace `Promise.any` polyfill usage with the native global.

- [ ] Step 3: Convert scripts file by file

Each `.vue` file's `<script>` becomes `<script setup lang="ts">`. Templates are already Vuetify 4 correct and must not be touched. Options API constructs map as follows: `data()` becomes `ref()` / `reactive()`, `computed` becomes `computed()`, `methods` become plain functions, `props` become `defineProps<T>()`, `$emit` becomes `defineEmits<T>()`, `mounted()` becomes `onMounted()`.

The four pages that duplicate address resolution drop their local copies and call `useClientResolution()` instead.

- [ ] Step 4: Enable strict mode

In `tsconfig.json`, set `"strict": true` and remove `"allowJs": true`. Run `pnpm typecheck` and fix what it surfaces. Expect real bugs to fall out here — the daemon responses are unvalidated `any` today.

- [ ] Step 5: Drop the dead polyfills

```bash
pnpm remove promise.any es-abstract
```

`Promise.any` is native in every target runtime. These were only ever needed for Nuxt's webpack transpile step, which no longer exists.

- [ ] Step 6: Verify

Every route, again, end to end. `pnpm typecheck` passes with strict mode on. `pnpm build` succeeds. Console clean on all five pages. Exercise the address race and the job de-duplication specifically — they are the two behaviours the spec flags as able to regress silently, and this is the task most likely to do it.

- [ ] Step 7: Commit

```bash
git add -A
git commit -m "refactor: convert components to <script setup lang=\"ts\">

Adds shared types and extracts the duplicated client address-resolution logic
from four pages into useClientResolution(). Enables TypeScript strict mode.
Drops the promise.any and es-abstract polyfills, which existed only for Nuxt's
webpack transpile step."
```

---

## Task 15: Cleanup

Stage 12. Tooling and documentation.

Files:
- Delete: `.eslintrc.js`
- Create: `eslint.config.js` (flat config)
- Modify: `package.json`
- Modify: `README.md`

- [ ] Step 1: Replace ESLint

The current `.eslintrc.js` extends `@nuxtjs/eslint-config`, which was removed in Task 13, so linting is currently broken. Replace ESLint 7 and the Nuxt configs with a flat config using `eslint`, `eslint-plugin-vue`, and `typescript-eslint`.

```bash
pnpm remove eslint
pnpm add -D eslint eslint-plugin-vue typescript-eslint @vue/eslint-config-typescript
```

- [ ] Step 2: Verify the lint passes

```bash
pnpm lint
```

Expected: zero errors. Fix what it finds.

- [ ] Step 3: Rewrite the README

It currently documents a Nuxt app — the build commands, the directory structure, and the deployment description are all wrong now. Rewrite it to describe: the Vue 3 / Vite / Vuetify 4 / Express stack, the `pnpm dev` plus `pnpm dev:api` development flow (and the ports), the `MONGO_URL` environment variable, and the single-container Docker deployment.

- [ ] Step 4: Commit

```bash
git add -A
git commit -m "chore: replace Nuxt ESLint config, update README

The old .eslintrc.js extended @nuxtjs/eslint-config, removed at cutover.
Flat config with eslint-plugin-vue and typescript-eslint replaces it.
README documented a Nuxt app that no longer exists."
```

---

## Execution and parallelism

Dependency order:

```
Task 1 (pnpm)
  └─ Task 2 (extract API)
       └─ Task 3 (scaffold)
            └─ Task 4 (layout)  ← everything below depends on this
                 ├─ Task 5 (settings + SimpleList)
                 │    └─ Task 10 (config.vue) ← also needs Tasks 8, 9
                 ├─ Task 6 (Client.vue)
                 │    └─ Task 7 (index.vue)
                 ├─ Task 8 (ten Modules/*Settings)   ← 10-way fan-out
                 │    └─ Task 9 (EncoderConfig, CacheConfig, Property, Module)
                 │         └─ Task 10 (config.vue)
                 ├─ Task 11 (jobs + JobDataTable)
                 └─ Task 12 (globalconfig + TextDataTable)
                      └─ Task 13 (cutover) ← needs ALL of 5-12
                           └─ Task 14 (TypeScript)
                                └─ Task 15 (cleanup)
```

Tasks 1 through 4 are strictly sequential. Each establishes something every later task depends on, and Task 4 in particular fixes the Vuetify conventions the rest of the port follows.

After Task 4, four branches run in parallel: the settings branch (5), the overview branch (6 then 7), the config branch (8 then 9 then 10), and the two independent pages (11, 12). Within Task 8, all ten Settings components fan out concurrently.

Task 13 is a hard barrier. It deletes the old app and must not start until every page in Tasks 5 through 12 has actually been seen working — not merely reported as done.

Model selection: Tasks 1, 8, 9, and 15 are chore-shaped and go to Sonnet. Tasks 2, 3, 4, 10, 11, 12, and 13 involve judgement and stay on the stronger model. Task 6 (`Client.vue`) is explicitly excluded from any cost-driven downgrade. Task 14 is mixed — the per-file conversion of simple components can go to Sonnet, but the type definitions (step 1), the composable extraction (step 2), and `Client.vue` stay on the stronger model.
