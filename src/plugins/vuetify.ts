import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

// Vuetify's CSS says `font-family: var(--v-font-body, "Roboto", sans-serif)` — it
// EXPECTS Roboto but does not ship it. Under Nuxt, @nuxtjs/vuetify injected it from
// Google Fonts automatically; dropping that module dropped the font with it, and the
// whole app silently fell back to a generic system sans-serif. Self-hosted here so
// there is no runtime dependency on a CDN.
import '@fontsource/roboto/100.css'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import '@fontsource/roboto/900.css'

import { createVuetify } from 'vuetify'

// NOTE: the plan called for registering VTimePicker from `vuetify/labs/VTimePicker`,
// which is where it lived in Vuetify 3. In Vuetify 4 it has graduated out of labs
// into the stable `vuetify/components` entry point, so that path no longer exists
// and importing it breaks the dev server. As a stable component it is picked up by
// vite-plugin-vuetify's autoImport, so globalconfig.vue can use <v-time-picker>
// with no explicit registration here.
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
