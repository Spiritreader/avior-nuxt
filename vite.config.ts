import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import VueRouter from 'unplugin-vue-router/vite'
import { forceMotion } from './build/force-motion'

export default defineConfig({
  css: {
    // Strips Vuetify 4's prefers-reduced-motion gating so the app animates like
    // Vuetify 2 did. See build/force-motion.ts — the JS half is in src/main.ts.
    postcss: {
      plugins: [forceMotion()],
    },
  },
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
    // Bind all interfaces so the dev server is reachable from other machines,
    // not just localhost.
    host: true,
    // Vite rejects requests whose Host header it does not recognise. This app is
    // reached over the LAN/VPN by hostname (e.g. mmdg.wan.walzen.org), so accept
    // any host. Dev server only — it is never used in production, where Express
    // serves the built SPA.
    allowedHosts: true,
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
