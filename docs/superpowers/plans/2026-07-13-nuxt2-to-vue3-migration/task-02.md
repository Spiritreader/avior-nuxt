# Task 2: Extract the Express API from Nuxt

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
- Produces: `MONGO_URL` environment variable, defaulting to `mongodb://192.168.178.75:27017/Avior`.

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

const MONGO_URL = process.env.MONGO_URL || 'mongodb://192.168.178.75:27017/Avior'

// serverSelectionTimeoutMS bounds the initial connect. bufferTimeoutMS bounds
// queries issued while disconnected: Mongoose buffers those, so they never
// reach server selection and would otherwise hang for its 10s default.
// The .catch is what keeps an unreachable database from killing the process.
mongoose
  .connect(MONGO_URL, { serverSelectionTimeoutMS: 5000, bufferTimeoutMS: 5000 })
  .catch(err => console.error('mongo initial connection failed:', err.message))

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
// Express 5 (path-to-regexp v8) rejects a bare '*'; it must be a named splat.
server.get('/*splat', (req, res) => {
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
ENV MONGO_URL=mongodb://192.168.178.75:27017/Avior
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
