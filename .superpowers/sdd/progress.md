# Migration progress ledger — COMPLETE

All 15 tasks done. Branch: migration/vue3 (38 commits off master @ 575ee82).

FINAL STATE, verified through the PRODUCTION path (pnpm build + node server/index.js):
  lint PASS | typecheck PASS (strict) | build PASS
  All 5 routes load with 0 app console errors and 0 warnings.
  SPA fallback survives a hard refresh of /jobs. /api/clients returns the 5 real clients.

Stack: Vue 3.5.39 / Vuetify 4.1.4 / Vite 8.1.4 / vue-router 4.6.4 (unplugin-vue-router),
<script setup lang="ts"> throughout, TS strict. Express 5.2.1 + Mongoose 9.7.4 on Node 24.
One container, one port: Express serves dist/ AND /api.

ENVIRONMENT:
  MongoDB  mongodb://192.168.178.75:27017/Avior  (the committed 10.11.194.75 was stale)
  Daemons  VDR-U/-1/-2 at 192.168.178.61:10000-10002 (live). Phoenix + VAVA genuinely offline.
  Reference worktree: ../avior-nuxt-reference @ baff6fe — the old Nuxt app, for comparison.

STILL UNVERIFIED — needs the user:
  - NO DOCKER BUILD HAS EVER RUN. Docker is not installed here; the user declared it out of
    scope. The Dockerfile is rewritten as a multi-stage build but is UNTESTED, including
    node:24-alpine and the VITE_COMMIT_SHA build arg (so the footer's commit hash is unproven).
  - Pause / Resume / Shutdown on a live client were never clicked (real PUTs; shutdown is
    irreversible). Someone should click Pause once on a real client.
  - Client.vue's FileWalker / Mover render paths were never exercised (no daemon was in
    those states).

PRE-EXISTING BUGS FOUND, DELIBERATELY NOT FIXED (report, don't smuggle in fixes):
  - jobs.vue: selectedJobs.length means the Delete button never shows a count.
  - jobs.vue: reassignJobs()'s `idx % 5` batching is INERT — idx is a client-ID string, so
    both branches are always false, the batch never flushes, errorCount is always 0.
  - Client.vue: a `:v-show=` binding that has never done anything; a duplicated
    showProcessedLog=false; the author's own `//todo: BUGGED!!!!` dead branch.
  - Client.vue emits offlineClient as an OBJECT from onclose but a bare STRING from onerror;
    index.vue's handler would throw on the string. Unreachable today.
  - Age/ErrorReplace/ErrorSkip/MaxSize Settings: a `watch` on `selectedFormat`, which does not
    exist in their data or props — so they have NEVER emitted `newdata`. SizeApproxSettings has
    the same problem via a missing `deep: true`. It does not matter in practice: settingsInternal
    is the SAME object reference as config.Modules.X.Settings, so v-model mutates the config in
    place. Proved by changing AgeModule MaxAge 5 -> 99 and confirming the export contained 99.
  - config.vue: color="gray darken-3" is an invalid palette key ("grey" is real) — it was already
    a no-op typo in Vuetify 2, so hyphenating it would ADD colour the page never had.
  - v-col xs="6": dead in BOTH versions. Vuetify 2's VCol breakpoints were ['sm','md','lg','xl'].

ACCEPTED DEVIATIONS (Material Design 3):
  Typography, elevation (25 levels -> 6), button casing, spacing, and the four dropped theme
  colours (accent/info/warning/error/success now use Vuetify 4 defaults).
