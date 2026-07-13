# Task 1: Migrate to pnpm

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

---

## Task 1: Migrate to pnpm

Stage 1 of the spec. Nothing about Vue changes. The app must still build and run on Nuxt 2 at the end of this task.

Files:
- Create: `.npmrc`
- Create: `pnpm-workspace.yaml`
- Create: `pnpm-lock.yaml` (generated)
- Delete: `package-lock.json`
- Modify: `package.json` (add `packageManager` field)
- Modify: `Dockerfile`
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

- [ ] Step 9: Confirm CI needs no changes

Read `.github/workflows/main.yml`. It delegates entirely to `docker/build-push-action` and never invokes npm, so it requires no edit. Confirm by reading it, then record that finding in the commit message rather than making a cosmetic change.

`Jenkinsfile` is legacy and out of scope for this migration. Do not modify it and do not spend time on it.

- [ ] Step 10: Commit

```bash
git add -A
git commit -m "chore: migrate from npm to pnpm

Import package-lock.json via 'pnpm import' to preserve resolved versions.
shamefully-hoist is required for Nuxt 2's webpack build under pnpm's strict
node_modules layout; it is removed at cutover when Nuxt is dropped."
```
