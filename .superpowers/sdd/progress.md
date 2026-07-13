# Migration progress ledger

Base: c97abfd

Task 1: complete (03b7026, +2da0ae4 fixup) — pnpm. Reviewed clean.
  Finding: pnpm 11 ignores shamefully-hoist in .npmrc; it lives in pnpm-workspace.yaml.
Task 2: complete (8f5407f) — Express API extracted from Nuxt serverMiddleware.
Task 2b: complete (3e19a49, +baff6fe, +2396919 fixups) — Mongoose 9.7.4, Express 5.2.1, Node 24.
  Reviewed: SPEC PASS, quality approved with issues; Important issues all fixed.
  Key finding (fixed): Express 5 leaves req.body undefined, not {} — bodyless POSTs
    returned 500 HTML with a stack trace. Now 400 JSON. Added a JSON error handler.
  Key finding (fixed): mongoose.connect() had no .catch() — unreachable DB killed the
    process under Node 24. Now survives; queries 500 in ~5s via bufferTimeoutMS.
  Confirmed: Nuxt 2 serverMiddleware DOES consume an Express 5 app (was the big unknown).
  Confirmed: '/*splat' fallback does not swallow /api 404s (reviewer verified empirically).

DEFERRED to Task 13 (recorded in the plan, do not lose):
  - NODE_ENV=production in the Dockerfile, else Express leaks stack traces in prod.
  - engines field in package.json (Mongoose 9 needs node >= 20.19; nothing enforces it).
  - README documents mounting config.json to override the Mongo URL. That file is GONE.
    An operator following it gets the DEFAULT database silently. Actively harmful.
DEFERRED to Task 15:
  - pnpm lint fails repo-wide (2136 problems). server/*.js violates the repo eslint style.
MINOR, accepted:
  - Missing static assets fall through to the SPA fallback and return index.html with 200.

NEVER VERIFIED — needs a run on the real LAN before Task 13 is trusted:
  - Any successful MongoDB query. 10.11.194.75:27017 is unreachable from this machine.
  - Any Docker build. Docker is not installed here. node:24-alpine is untested.

Task 3: IN PROGRESS — scaffold Vue 3 + Vite + Vuetify 4.
