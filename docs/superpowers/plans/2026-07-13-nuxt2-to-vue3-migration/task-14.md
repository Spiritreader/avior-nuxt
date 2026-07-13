# Task 14: TypeScript and Composition API pass

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
