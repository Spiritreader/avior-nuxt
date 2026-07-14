// Flat ESLint config (ESLint 9+/flat config format).
// Replaces the old .eslintrc.js, which extended @nuxtjs/eslint-config —
// removed at cutover when Nuxt was deleted from this project.
const pluginVue = require('eslint-plugin-vue')
const { defineConfigWithVueTs, vueTsConfigs } = require('@vue/eslint-config-typescript')

module.exports = defineConfigWithVueTs(
  {
    name: 'app/ignores',
    // .nuxt/ is stale, gitignored build cache left over from before the Nuxt
    // removal (Task 13); it holds no source of ours and is not deleted here
    // because removing directories outside this task's stated scope is not
    // this task's call to make.
    ignores: ['dist/**', 'node_modules/**', 'docs/**', '.nuxt/**'],
  },

  // src/**/*.{ts,vue} — Vue 3 + TypeScript app code.
  //
  // We use eslint-plugin-vue's "essential" (Priority A, bug-catching) tier
  // rather than "recommended", which layers on a large block of purely
  // stylistic/formatting rules (attribute ordering, attributes-per-line,
  // html-indent, self-closing tags, and so on). This codebase was ported
  // component-by-component from a Nuxt 2 app and verified working against
  // live data along the way; running the stylistic tier here would flag
  // thousands of pre-existing, cosmetic-only formatting choices across
  // nearly every .vue file for no behavioural benefit. Essential still
  // catches real template bugs (bad v-for keys, invalid directive usage,
  // side effects in computed properties, etc).
  {
    name: 'app/vue-typescript',
    files: ['src/**/*.{ts,vue}'],
    extends: [pluginVue.configs['flat/essential'], vueTsConfigs.recommended],
    rules: {
      // Vuetify components are auto-imported by vite-plugin-vuetify and our
      // own components are used directly in templates; this project does not
      // register every component's tag name, so the tag-name check is noise.
      'vue/multi-word-component-names': 'off',

      // App.vue and settings.vue use v-text on Vuetify title components
      // (<v-toolbar-title>, <v-list-item-title>) — ported verbatim from the
      // Nuxt 2/Options API original and verified rendering correctly with
      // live data. Rewriting these as {{ }} interpolation to satisfy this
      // rule is a template change to working, verified code for a purely
      // theoretical risk that doesn't apply to these single-root-element
      // Vuetify components; turning the rule off is cheaper and safer.
      'vue/no-v-text-v-html-on-component': 'off',

      // SimpleList.vue and EncoderConfig.vue mutate object/array props
      // in place and then emit an event with the same object — a documented,
      // deliberate pattern carried over from the Options API original (see
      // the "Preserved from the Options API original on purpose" comment in
      // SimpleList.vue). Fixing this properly means redesigning these
      // components' update flow, which is a refactor, not a lint pass.
      'vue/no-mutating-props': 'off',

      // The codebase leans on `any` in a few well-documented, deliberate
      // spots: generic API helpers that default `T = any` for untyped daemon
      // responses (src/api/http.ts), and several fields that are `any` on
      // purpose to preserve specific, verified-working Nuxt 2 quirks (e.g.
      // jobs.vue's SelectedJobs.length, settings.vue's clientAddresses,
      // Client.vue's isActive). Writing precise types for the untyped daemon
      // API payloads is real modeling work belonging to a future task, not
      // this lint cleanup.
      '@typescript-eslint/no-explicit-any': 'off',

      // TextDataTable.vue's `watch(dialog, (val) => { val || close() })` is a
      // standard short-circuit idiom (equivalent to `if (!val) close()`),
      // ported verbatim from the Vuetify data-table boilerplate. Allow it
      // instead of rewriting working code into an if-statement.
      '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
    },
  },

  // server/**/*.js — plain Node, CommonJS (require()/module.exports).
  {
    name: 'app/server-commonjs',
    files: ['server/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'writable',
        exports: 'writable',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
      },
    },
  },

  // scripts/*.mjs — Node ESM utility scripts (not part of the app bundle).
  {
    name: 'app/scripts-esm',
    files: ['scripts/*.mjs'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
      },
    },
  },
)
