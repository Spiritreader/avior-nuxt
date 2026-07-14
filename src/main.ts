// Must be imported before Vuetify: it patches matchMedia, and Vuetify reads
// prefers-reduced-motion while evaluating its transition props at module load.
import './force-motion'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'

createApp(App).use(router).use(vuetify).mount('#app')
