# Task 3: Scaffold the Vue 3 app

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

## Task 3: Scaffold the Vue 3 app

Stage 3 of the spec. The Vue 3 app is created alongside the working Nuxt app. Nothing is deleted. At the end of this task both apps run.

Files:
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/App.vue` (temporary placeholder; Task 4 replaces its contents)
- Create: `src/plugins/vuetify.ts`
- Create: `src/router/index.ts`
- Create: `src/api/http.ts`
- Create: `src/pages/index.vue` (temporary placeholder)
- Create: `public/` (copied from `static/`)
- Create: `tsconfig.json`, `tsconfig.node.json`
- Modify: `package.json` (dependencies and scripts)

Interfaces:
- Produces: `src/api/http.ts` exporting `get(url)`, `post(url, body)`, `put(url, body)`, `del(url)`. Every one returns a parsed JSON body and throws on a non-2xx response. These are the drop-in replacements for `$http.$get` / `$post` / `$put` / `$delete` and are used by every subsequent task.
- Produces: `@` as a path alias for `src/`.
- Produces: a Vuetify instance with the stock dark theme, `primary: #9E9E9E`, `secondary: #FF8F00`, MDI icons, and `VTimePicker` registered from labs.
- Produces: file-based routes from `src/pages/`, so route paths are unchanged from Nuxt.

- [ ] Step 1: Install the Vue 3 toolchain

These are added alongside the Nuxt dependencies. The two dependency trees coexist until Task 13. pnpm handles this without conflict because Vue 2 (`vue@2`, pulled in by `nuxt`) and Vue 3 (`vue@3`) are separate packages in the tree — but note that `pnpm dev:nuxt` and `pnpm dev` must not be assumed to share anything.

```bash
pnpm add vue@^3.5 vue-router@^4.6 vuetify@^4.1 @mdi/font
pnpm add -D vite @vitejs/plugin-vue vite-plugin-vuetify@^2.1 unplugin-vue-router typescript@^5 vue-tsc @types/node
```

Two of these pins are deliberate and must not be "upgraded":

`vuetify@^4.1` — Vuetify 4 is the current release (4.1.4) and is still a Vue 3 library; its peer dependency is `vue: ^3.5.0`. Do not install Vuetify 3.

`vue-router@^4.6` — vue-router 5 exists, but `unplugin-vue-router@0.19.2` (the newest) declares `vue-router: ^4.6.0` as its peer. Since this project uses file-based routing, vue-router 4.6.x is required. Installing vue-router 5 will break routing. If a future unplugin-vue-router supports v5, that is a separate change, not this task.

`typescript@^5` — TypeScript 7 exists, and `vue-tsc` declares its peer as `typescript: >=5.0.0`, which TS 7 satisfies semantically. It does not work: `vue-tsc` 3.x cannot consume TS 7 and `pnpm typecheck` dies with `ERR_PACKAGE_PATH_NOT_EXPORTED`. The peer range is a lie; pin to 5.x.

Record the resolved versions from the pnpm output in the commit message.

- [ ] Step 2: Delete the dead files

Done now, before any porting begins, so that no later task wastes effort porting a component nothing uses. All four were confirmed unreferenced during the design review.

```bash
git rm pages/test.vue components/Logo.vue components/VuetifyLogo.vue assets/variables.scss
```

`pages/test.vue` is an unlinked scratch page. `Logo.vue` and `VuetifyLogo.vue` are Nuxt/Vuetify starter-template leftovers rendered by nothing. `assets/variables.scss` contains only comments, which means Nuxt's `customVariables: ['~/assets/variables.scss']` has always been a no-op — this is why the Vite config needs no SASS variable plumbing.

Removing `pages/test.vue` deletes the `/test` route. Nothing links to it.

- [ ] Step 3: Copy static assets to `public/`

Nuxt serves `static/` at the web root; Vite serves `public/`. Paths are preserved, so absolute references like `/dryicons_love_file_icon_6200.png` (used in the layout) and `/favicon.ico` keep resolving.

```bash
mkdir -p public
cp static/favicon.ico static/favicon_def.ico static/v.png static/vuetify-logo.svg static/dryicons_love_file_icon_6200.png static/dryicons_love_file_icon_6200.svg public/
```

Do not delete `static/` — the Nuxt app still needs it until Task 13.

- [ ] Step 4: Create `index.html` at the repository root

Vite's entry point. Nuxt generated this; now it is a real file.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <title>Avior - powered by Walzen Group</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

The title reproduces Nuxt's `titleTemplate: '%s - powered by Walzen Group'` with the `Avior` title. Per-page titles are not currently set by any page, so a static title is faithful.

- [ ] Step 5: Create `vite.config.ts`

```ts
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import VueRouter from 'unplugin-vue-router/vite'

export default defineConfig({
  plugins: [
    // VueRouter must come before vue()
    VueRouter({
      routesFolder: 'src/pages',
      dts: 'src/typed-router.d.ts',
    }),
    vue(),
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Forwards app-origin API calls to the standalone Express server in dev.
      // In production the same Express server serves the built SPA, so the
      // relative /api path resolves without any proxy. This is why no baseURL
      // is configured anywhere in the app.
      '/api': {
        target: 'http://localhost:10009',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] Step 6: Create `tsconfig.json`

Strict mode is off for now. Components are still JavaScript until Task 14; turning strict on before they are converted produces thousands of meaningless errors. Task 14 enables it.

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "strict": false,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "allowJs": true,
    "types": ["vite/client", "unplugin-vue-router/client"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue", "vite.config.ts"]
}
```

- [ ] Step 7: Create `src/plugins/vuetify.ts`

```ts
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'

// VTimePicker graduated out of labs in Vuetify 4 and lives in the stable
// entry point, so vite-plugin-vuetify auto-imports it. Importing it from
// vuetify/labs/VTimePicker (its Vuetify 3 location) breaks the dev server.
export default createVuetify({
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          primary: '#9E9E9E',
          secondary: '#FF8F00',
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
  },
})
```

- [ ] Step 8: Create `src/router/index.ts`

```ts
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'

export default createRouter({
  history: createWebHistory(),
  routes,
})
```

`vue-router/auto-routes` is generated by unplugin-vue-router from `src/pages/`. Filenames map to route paths exactly as they did under Nuxt, so `/jobs`, `/config`, `/globalconfig`, and `/settings` are unchanged.

- [ ] Step 9: Create `src/api/http.ts`

The `$http` replacement. Signatures deliberately mirror `@nuxt/http`'s `$get`/`$post`/`$put`/`$delete` so the roughly 40 call sites port one-to-one.

```ts
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${url} failed: ${res.status} ${res.statusText}`)
  }

  // Some daemon endpoints reply 204 or with an empty body.
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

export function get<T = any>(url: string): Promise<T> {
  return request<T>(url)
}

export function post<T = any>(url: string, body?: unknown): Promise<T> {
  return request<T>(url, { method: 'POST', body: JSON.stringify(body) })
}

export function put<T = any>(url: string, body?: unknown): Promise<T> {
  return request<T>(url, { method: 'PUT', body: JSON.stringify(body) })
}

export function del<T = any>(url: string): Promise<T> {
  return request<T>(url, { method: 'DELETE' })
}
```

`delete` is a reserved word, hence `del`. `@nuxt/http` threw on non-2xx; this does too, so existing try/catch blocks in the pages keep working.

- [ ] Step 10: Create `src/main.ts`

```ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'

createApp(App).use(router).use(vuetify).mount('#app')
```

- [ ] Step 11: Create the placeholder `src/App.vue`

Task 4 replaces this entirely. It exists only so the scaffold boots.

```vue
<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
```

- [ ] Step 12: Create the placeholder `src/pages/index.vue`

```vue
<template>
  <div>Scaffold OK</div>
</template>
```

- [ ] Step 13: Add the Vite scripts

The Nuxt scripts are renamed rather than removed, so both apps stay runnable. In `package.json`, `scripts` becomes:

```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "dev:api": "node server/index.js",
    "start": "node server/index.js",
    "dev:nuxt": "nuxt",
    "build:nuxt": "nuxt build",
    "start:nuxt": "nuxt start",
    "typecheck": "vue-tsc --noEmit",
    "lint:js": "eslint --ext .js,.vue --ignore-path .gitignore .",
    "lint": "pnpm lint:js"
  },
```

Note that `build` and `start` now refer to the Vue 3 app and the standalone server. The Dockerfile still calls `pnpm build` and `pnpm start`, which means the Docker image is broken between here and Task 13. That is intentional and acceptable — the branch is not deployed mid-migration — but do not "fix" it by pointing the Dockerfile back at Nuxt.

- [ ] Step 14: Verify the scaffold boots

```bash
pnpm dev
```

Expected: Vite starts on `http://localhost:5173`. Opening it shows "Scaffold OK" on a dark background. The browser console is free of errors.

- [ ] Step 15: Verify the dev proxy reaches Express

With `pnpm dev:api` running in another shell, and Vite still running:

```bash
curl -s http://localhost:5173/api/clients
```

Expected: the same JSON array as `http://localhost:10009/api/clients`. This proves the relative-`/api` strategy works in dev, which is the mechanism replacing the old `browserBaseURL`.

- [ ] Step 16: Verify the Nuxt app still runs

```bash
pnpm dev:nuxt
```

Expected: Nuxt serves on port 3000, unchanged. Both apps now run simultaneously. This side-by-side capability is the verification strategy for every remaining port task, so do not proceed until it works.

- [ ] Step 17: Commit

```bash
git add -A
git commit -m "feat: scaffold Vue 3 + Vite + Vuetify 4 app alongside Nuxt

Adds vite.config.ts, the Vuetify 4 instance (stock dark theme, primary
#9E9E9E and secondary #FF8F00), file-based routing via unplugin-vue-router,
and the native-fetch http wrapper replacing @nuxt/http.

No baseURL is configured: relative /api paths resolve against the origin in
prod and are proxied to Express in dev. Nuxt is untouched and still runs on
port 3000."
```
