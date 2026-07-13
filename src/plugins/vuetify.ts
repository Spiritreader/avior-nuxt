import 'vuetify/styles'
// Restores the global margin/padding reset Vuetify 2 shipped and Vuetify 4 dropped.
// Must come after vuetify/styles so its @layer reset block is ordered correctly.
import '@/styles/reset.css'
// Restores the Vuetify 2 component defaults that Material Design 3 re-specced
// (button/tab typography, striped progress-bar pattern size).
import '@/styles/vuetify2-compat.css'
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
  // Vuetify 4 defaults inputs to variant="filled" — the grey box. This app is an
  // underlined-input design (that was Vuetify 2's default, and every field here was
  // written against it). Setting it once here is the idiomatic Vuetify 4 way; an
  // explicit variant="outlined" or "solo" on an individual field still wins.
  //
  // hideDetails: 'auto' — Vuetify 4 permanently reserves ~26px under every input for
  // a validation message, whether or not one can appear, which left a dead gap under
  // fields and sliders. 'auto' collapses it and expands only when a rule actually
  // fails, so the fields that do have :rules (client name, priority) still report.
  //
  // The slider was re-specced by MD3 and came out much heavier than Vuetify 2's:
  //
  //               Vuetify 2   Vuetify 4
  //   track           2px        4px
  //   thumb          12px       20px
  //   overall        32px       58px
  //
  // trackSize/thumbSize/density are v4's own props for this, so no CSS override.
  defaults: {
    VTextField: { variant: 'underlined', hideDetails: 'auto' },
    VTextarea: { variant: 'underlined', hideDetails: 'auto' },
    VSelect: { variant: 'underlined', hideDetails: 'auto' },
    VCombobox: { variant: 'underlined', hideDetails: 'auto' },
    VAutocomplete: { variant: 'underlined', hideDetails: 'auto' },
    VFileInput: { variant: 'underlined', hideDetails: 'auto' },
    VSlider: { trackSize: 2, thumbSize: 12, density: 'compact', hideDetails: 'auto' },
    VSwitch: { hideDetails: 'auto' },
    // Vuetify 2 tinted a ticked checkbox with the theme colour; Vuetify 4 leaves it at
    // currentColor, which in the dark theme is a hard white square.
    VCheckbox: { color: 'primary', hideDetails: 'auto' },
    // Vuetify 4 halved a card title's vertical padding (16px -> 8px), so every card
    // header sat cramped against its own top edge. py-4 puts the 16px back.
    //
    // A default `class` rather than a CSS rule, so the components that deliberately
    // zero it (Module.vue's header, Client.vue's "Main Log") keep winning: their own
    // pb-0/pt-0 is a utility like this one, and utilities beat py-* on source order.
    // An unlayered CSS override would outrank them and break those.
    VCardTitle: { class: 'py-4' },
  },
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          primary: '#9E9E9E',
          secondary: '#FF8F00',
          // Vuetify 4's v-toolbar paints `surface-light`, which the dark theme
          // sets to #424242 — a washed-out grey stripe across the card. Vuetify 2
          // used #272727 on a #1E1E1E card: surface, one step up. Vuetify 4's card
          // surface is #212121, so the same step lands here.
          //
          // It gets its own token because retuning `surface-light` would also hit
          // VSelect, VSlider, VAlert and VTimePicker, which share it — the time
          // picker's clock face (globalconfig) would go nearly black.
          toolbar: '#2A2A2A',
          // The pane behind the module cards. It has to read as a distinct layer
          // between the page background (#121212) and the cards themselves (#242424) —
          // sitting on either one makes the cards vanish into their backdrop.
          'module-pane': '#1A1A1A',
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
  },
})
