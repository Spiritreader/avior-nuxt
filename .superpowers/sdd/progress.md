# Migration progress ledger

Base: c97abfd
Reference worktree: ../avior-nuxt-reference @ baff6fe (last commit where Nuxt runs).
  This is the visual reference for Tasks 4-12. `cd ../avior-nuxt-reference && pnpm dev`.

Task 1:  complete (03b7026, +2da0ae4) — pnpm. Reviewed clean.
Task 2:  complete (8f5407f) — Express API extracted from Nuxt serverMiddleware.
Task 2b: complete (3e19a49, +baff6fe, +2396919) — Mongoose 9.7.4, Express 5.2.1, Node 24.
         Reviewed: SPEC PASS. All Important issues fixed.
Task 3:  complete (872fe5c, + follow-up) — Vue 3.5.39 / Vuetify 4.1.4 / vue-router 4.6.4 /
         Vite 8.1.4 scaffold. Vite proxy -> Express verified (500 JSON, not 404/HTML).
Task 4:  NEXT — port the layout. Opus. Everything downstream depends on it.

KEY FINDINGS (do not re-learn these):
  - Nuxt 2 and Vue 3 CANNOT coexist in one node_modules. Same package name, two versions,
    and shamefullyHoist (which Nuxt 2 needs) forces the collision. Vuetify 2/4 same.
    Hence the reference worktree. The plan's original "run both apps in one tree" was WRONG.
  - VTimePicker is STABLE in Vuetify 4 (was labs in v3). No labs import. The biggest
    flagged risk for Task 12 has evaporated.
  - vue-tsc CANNOT use TypeScript 7 despite peering on ">=5.0.0". Pinned to 5.9.3.
  - Express 5 leaves req.body undefined, not {}. Guarded.
  - assets/variables.scss was NOT imported by any component; the @import was injected by
    @nuxtjs/vuetify's customVariables option. Deleting it is correct for the Vite app.
  - pnpm 11 ignores shamefully-hoist in .npmrc; it lives in pnpm-workspace.yaml.

PROCESS: do NOT run `git commit` while a subagent is live — it takes the whole index and
  swallows their staged files. This happened twice (Task 1, Task 3).

DEFERRED to Task 13: NODE_ENV=production in Dockerfile; engines field; README's config.json
  volume-mount instruction is now actively harmful (silently reverts MONGO_URL to default).
DEFERRED to Task 15: pnpm lint fails repo-wide (2136 problems); server/*.js style.

NEVER VERIFIED — needs the real LAN / a Docker host:
  - Any successful MongoDB query (10.11.194.75 unreachable from this machine).
  - Any Docker build (Docker not installed here). node:24-alpine untested.
  - Any actual rendered page in a browser (no browser in this environment). All frontend
    verification so far is HTTP/compile-level only. THIS IS A REAL GAP for Tasks 4-12.
