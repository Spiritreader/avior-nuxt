# Migration progress ledger

Base: c97abfd
Reference worktree: ../avior-nuxt-reference @ baff6fe. `cd there && pnpm dev`, note the port it prints.
Baselines: docs/superpowers/baselines/*.txt — semantic dumps of the REAL Nuxt app, WITH live data.
Inspector: node scripts/inspect-page.mjs <url> <outdir>  -> console.txt, structure.txt, screenshot.png

ENVIRONMENT (verified, do not re-derive):
  - MongoDB: mongodb://192.168.178.75:27017/Avior  REACHABLE. 5 clients. (10.11.194.75 was stale.)
  - Daemons: reachable ONLY via the WAN hostname, e.g. http://vdr-u.wan.walzen.org:10000.
    The LAN IPs (192.168.178.61:10000-2, 10.11.194.x) refuse connections. The app races all
    three addresses per client, so it works — but a direct curl to a LAN IP will fail.
  - Docker: NOT installed. No image has ever been built. node:24-alpine untested.

Task 1:  complete (03b7026, 2da0ae4) — pnpm. Reviewed clean.
Task 2:  complete (8f5407f) — Express API extracted from Nuxt.
Task 2b: complete (3e19a49, baff6fe, 2396919) — Mongoose 9.7.4, Express 5.2.1, Node 24.
         Reviewed: SPEC PASS. Mongoose 9 <-> upgraded MongoDB now CONFIRMED working.
Task 3:  complete (872fe5c, 89d4701) — Vue 3.5.39 / Vuetify 4.1.4 / vue-router 4.6.4 / Vite 8.1.4.
Task 4:  complete (cef9226, 4baa68c) — layout. Nav identical to baseline, console clean, verified
         by screenshot against the real app.
Task 5:  NEXT — settings.vue + SimpleList.vue. Fully verifiable: settings is Mongo-only.

KEY FINDINGS (do not re-learn):
  - Nuxt 2 and Vue 3 CANNOT coexist in one node_modules. Hence the reference worktree.
  - VFooter KEEPS `app` in Vuetify 4 (unlike v-app-bar / v-navigation-drawer). Without it the
    footer stretches to 320px. Emits NO warning — only a screenshot catches it.
  - v-navigation-drawer: Vuetify 2 `app` auto-opened on desktop regardless of v-model. Vuetify 4
    honours v-model literally. Faithful code != faithful behaviour. Drawer must default OPEN.
  - v-list-item needs `exact`, else to="/" prefix-matches every route.
  - color="grey lighten-1" -> "grey-lighten-1" (space form silently breaks in v4).
  - VTimePicker is STABLE in Vuetify 4, not labs.
  - vue-tsc cannot use TypeScript 7 despite peering ">=5.0.0". Pinned to 5.9.3.
  - Express 5 leaves req.body undefined, not {}.
  - LESSON: the semantic structure dump is necessary but NOT sufficient. It missed the closed
    drawer (translated off-screen, kept its dimensions). ALWAYS look at the screenshot.

PROCESS: never `git commit` while a subagent is live — it takes the whole index and swallows
  their staged files. Happened twice (Tasks 1, 3).

DEFERRED to Task 13: NODE_ENV=production; engines field; README's config.json volume-mount
  instruction is now actively harmful (silently reverts MONGO_URL to the default).
DEFERRED to Task 15: pnpm lint fails repo-wide (2136 problems).
