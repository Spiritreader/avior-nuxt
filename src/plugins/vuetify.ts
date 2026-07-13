import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
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
