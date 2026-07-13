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
