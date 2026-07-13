# Migration progress ledger

Base: c97abfd

Task 1: complete (03b7026 + 2da0ae4 fixup) — pnpm. Review clean.
Task 2: complete (8f5407f) — Express API extracted from Nuxt serverMiddleware.
Task 2b: complete (3e19a49 + bufferTimeoutMS fixup) — Mongoose 9, Express 5, Node 24.
  Verified: server survives unreachable Mongo (70s+); GET /api/clients 500s in 5.2s;
  unknown /api path returns JSON 404; Nuxt serverMiddleware DOES consume Express 5.
  UNVERIFIED: Docker build (Docker not installed here). node:24-alpine untested.
  UNVERIFIED: any successful Mongo query (10.11.194.75 unreachable from this machine).
Known pre-existing: pnpm lint fails repo-wide (2136 problems) — Task 15 owns this.
Task 3: next — scaffold Vue 3 + Vite + Vuetify 4.
