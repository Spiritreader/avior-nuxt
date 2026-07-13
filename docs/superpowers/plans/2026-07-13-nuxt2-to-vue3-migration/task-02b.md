# Task 2b: Modernize the server dependencies

Part of the Nuxt 2 to Vue 3 SPA migration.
Master plan: `docs/superpowers/plans/2026-07-13-nuxt2-to-vue3-migration.md`

You are being given only this task. Do not do work belonging to other tasks.

## Why this task exists

The upstream MongoDB server has been upgraded to a current version. The project pins `mongoose@6.12.3`, which is three majors behind and ships an old MongoDB driver. Task 2 extracted the Express API from Nuxt but deliberately did not touch dependency versions. This task brings the server stack current and fixes two defects the Task 2 implementer correctly identified but left alone as out of scope.

The user has explicitly authorized upgrading any and all dependencies required.

## Global constraints

- Package manager is pnpm. Never run `npm` or `yarn`.
- Do not touch any frontend code: nothing under `pages/`, `components/`, `layouts/`, or `nuxt.config.js`. This task is server-only.
- The Nuxt app must still boot and serve `/api/clients` through its `serverMiddleware` at the end of this task, exactly as it does now.
- The standalone server (`node server/index.js`) must still boot and serve `/api/clients` on port 10009.
- MongoDB at `10.11.194.75` is NOT reachable from this development machine. You cannot verify a successful query. Do not pretend you can. What you can and must verify is described in the verification steps.
- `git add` only the files this task touches. Never `git add -A`. Do not amend or rebase existing commits.

## Target versions

- `mongoose` 6.12.3 → ^9 (latest is 9.7.4; it bundles MongoDB driver ~7.2 and requires Node >= 20.19.0)
- `express` 4 → ^5 (latest is 5.2.1)
- `cors` → latest
- `body-parser` → REMOVED. Express 5 has `express.json()` and `express.urlencoded()` built in, and `server/app.js` already uses them. The package is now dead weight.
- Docker base image → `node:24-alpine` (the current pin, `node:20.1.0-alpine`, is BELOW Mongoose 9's floor of 20.19.0, so the container would fail).

## Files

- Modify: `package.json` (dependency versions)
- Modify: `server/app.js` (Mongoose connection handling, /api 404)
- Modify: `server/index.js` (Express 5 route syntax)
- Modify: `Dockerfile` (base image)
- Modify: `pnpm-lock.yaml` (generated)

---

- [ ] Step 1: Upgrade the dependencies

```bash
pnpm add mongoose@latest express@latest cors@latest
pnpm remove body-parser
```

Record the resolved versions. Confirm `mongoose` is 9.x and `express` is 5.x.

- [ ] Step 2: Fix the Express 5 route breakage in `server/index.js`

Express 5 uses path-to-regexp v8, in which a bare `'*'` is no longer a valid path and **throws at startup**. The SPA fallback route written in Task 2 is therefore broken under Express 5. This is not optional cleanup — the server will not boot without it.

Replace the wildcard route. The current code is:

```js
server.get('*', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'))
})
```

It becomes a named splat:

```js
server.get('/*splat', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'))
})
```

Verify by starting the server: if it boots without a `path-to-regexp` error, the syntax is accepted.

- [ ] Step 3: Make an unreachable database non-fatal (`server/app.js`)

The Task 2 implementer found that `mongoose.connect()` has no rejection handler. Under Node 24 an unhandled promise rejection terminates the process, so when Mongo is unreachable the API dies roughly 30 seconds after boot. This was inherited from the original `api/api.js`, so it is not a regression — but `server/index.js` becomes the production process at Task 13, and an API that exits when the database hiccups is strictly worse than one that stays up and returns errors.

Attach a catch, and set a server-selection timeout so queries fail fast instead of hanging. Currently `GET /clients` hangs indefinitely against a down database rather than reaching its `catch` block and returning 500.

```js
mongoose
  .connect(MONGO_URL, { serverSelectionTimeoutMS: 5000 })
  .catch(err => console.error('mongo initial connection failed:', err.message))
```

Mongoose retries in the background on its own, so a failed initial connection is recoverable without a restart: once the database comes back, queries succeed again. The `.catch()` only stops the unhandled rejection from killing the process.

Do not add a reconnect loop, a health-check endpoint, or a circuit breaker. Those are not asked for.

- [ ] Step 4: Return JSON 404s for unknown API routes (`server/app.js`)

At the very end of `server/app.js`, after the three route definitions and before `module.exports`, add a terminal 404 handler:

```js
app.use((req, res) => {
  res.status(404).json({ error: 'not found' })
})
```

Without this, an unknown path under `/api` falls through the Express router, past the static handler, into the SPA fallback, and returns `index.html` with a 200 — so a typo'd API call would look to the browser like a successful HTML response instead of a 404. This handler is scoped to the `/api` app only and does not affect SPA routing.

- [ ] Step 5: Update the Dockerfile base image

`node:20.1.0-alpine` is below Mongoose 9's required floor of Node 20.19.0, so `pnpm install` would fail in the container. Change the first line to:

```dockerfile
FROM node:24-alpine
```

Leave the rest of the Dockerfile as it is. Task 13 rewrites it as a multi-stage build.

- [ ] Step 6: Verify the standalone server boots

```bash
pnpm dev:api
```

Expected: it logs `avior listening on http://0.0.0.0:10009` and STAYS UP. Leave it running for at least 45 seconds and confirm the process does not exit — that is the specific regression fixed in step 3, and it will only show itself after the Mongo connection times out. If the process dies, step 3 is wrong.

Expected also: a `mongo initial connection failed: ...` line appears, because the database is unreachable from here. That is correct behaviour, not a failure.

- [ ] Step 7: Verify the routes still work

With the server running:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Content-Type: application/json" -d '{}' http://localhost:10009/api/clients
curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" http://localhost:10009/api/nonexistent
curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" http://localhost:10009/api/clients
```

Expected:
- The POST with an empty body returns `400`. This proves Express 5 is routing correctly and the validation still runs.
- `/api/nonexistent` returns `404` with a JSON body, proving step 4.
- `/api/clients` returns `500` within roughly 5 seconds rather than hanging, proving the `serverSelectionTimeoutMS` from step 3. Report the actual time. If it hangs for 25+ seconds, step 3 did not take effect.

You cannot get a successful client list here; the database is unreachable. Do not report one.

- [ ] Step 8: Verify Nuxt still boots with the upgraded stack

```bash
pnpm dev
```

Expected: Nuxt compiles and serves on port 3000. `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/settings` returns 200. This confirms the Express 5 and Mongoose 9 upgrade did not break the `serverMiddleware` wiring in `api/api.js`.

If Nuxt's serverMiddleware cannot consume an Express 5 app, report BLOCKED with the exact error rather than working around it — that would be a genuine finding that changes the plan.

- [ ] Step 9: Commit

```bash
git add package.json pnpm-lock.yaml server/app.js server/index.js Dockerfile
git commit -m "feat: upgrade server to Mongoose 9, Express 5, Node 24

The upstream MongoDB server was upgraded, and mongoose 6 is three majors
behind with an outdated driver. Mongoose 9 requires Node >= 20.19, so the
Docker base image moves from node:20.1.0-alpine to node:24-alpine.

Express 5 rejects the bare '*' path (path-to-regexp v8), so the SPA fallback
becomes '/*splat'. Drops body-parser, which Express has built in.

Also fixes two defects found during Task 2:
- mongoose.connect() had no .catch(), so an unreachable database killed the
  process under Node 24. server/index.js becomes the production process at
  cutover, where that is unacceptable.
- Queries hung indefinitely against a down database instead of failing;
  serverSelectionTimeoutMS makes them return 500 in ~5s.

Unknown /api paths now return a JSON 404 instead of falling through to the
SPA fallback and returning index.html with a 200."
```
