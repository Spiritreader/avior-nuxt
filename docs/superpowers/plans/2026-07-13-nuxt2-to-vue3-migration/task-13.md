# Task 13: Cutover — delete Nuxt

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

Delete `.npmrc` entirely. `shamefully-hoist` existed only for Nuxt 2's webpack build. Then:

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
