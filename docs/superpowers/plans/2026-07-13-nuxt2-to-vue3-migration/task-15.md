# Task 15: Cleanup

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

It currently documents a Nuxt app — the build commands, the directory structure, and the deployment description are all wrong now. Rewrite it to describe: the Vue 3 / Vite / Vuetify 3 / Express stack, the `pnpm dev` plus `pnpm dev:api` development flow (and the ports), the `MONGO_URL` environment variable, and the single-container Docker deployment.

- [ ] Step 4: Commit

```bash
git add -A
git commit -m "chore: replace Nuxt ESLint config, update README

The old .eslintrc.js extended @nuxtjs/eslint-config, removed at cutover.
Flat config with eslint-plugin-vue and typescript-eslint replaces it.
README documented a Nuxt app that no longer exists."
```
