import type { Plugin } from 'postcss'

/**
 * Makes the app animate regardless of the OS "reduce motion" setting, the way
 * Vuetify 2 did.
 *
 * Vuetify 4 honours `prefers-reduced-motion`, Vuetify 2 ignored it entirely. On a
 * machine with Windows' Accessibility > Visual effects > "Animation effects" off,
 * the browser asks for reduced motion and every transition in the app collapses to
 * nothing — tab slides, dialogs, expands, the lot. The old app animated anyway, so
 * this is a migration regression from the user's point of view, and they asked for
 * the Vuetify 2 behaviour back.
 *
 * Vuetify gates motion two ways, and BOTH have to be defeated:
 *
 *   1. CSS, which is what this plugin handles. Note it is not only
 *      `reduce { transition-duration: 0s }` — several transitions are only ever
 *      DECLARED inside `@media (prefers-reduced-motion: no-preference)` (the
 *      floating field label, the outlined field's notch, the expansion-panel title).
 *      Under `reduce` those rules simply do not exist, so there is nothing to
 *      override and no amount of extra CSS brings them back. The query itself has
 *      to go.
 *
 *   2. JavaScript, handled in src/main.ts — every transition component's `disabled`
 *      prop defaults to `PREFERS_REDUCED_MOTION()`, so Vue's <Transition> is switched
 *      off outright and never even emits the classes this CSS would style.
 *
 * Rewriting the queries at build time rather than listing the affected selectors by
 * hand means this keeps working across Vuetify upgrades: any new rule they add behind
 * either query is handled automatically, with nothing to keep in sync.
 *
 * Every such query Vuetify ships is a bare single-feature one, so the transform is
 * unambiguous: drop the `reduce` blocks, unwrap the `no-preference` ones. A compound
 * query would not be safe to treat this way, so it is left alone and reported.
 */
const REDUCE = /^\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)$/
const NO_PREFERENCE = /^\(\s*prefers-reduced-motion\s*:\s*no-preference\s*\)$/

export function forceMotion(): Plugin {
  return {
    postcssPlugin: 'avior-force-motion',
    AtRule: {
      media(rule) {
        const params = rule.params.trim()
        if (!params.includes('prefers-reduced-motion')) return

        if (REDUCE.test(params)) {
          // The block exists only to kill motion. Nothing in it is wanted.
          rule.remove()
        } else if (NO_PREFERENCE.test(params)) {
          // The block holds the real transitions. Hoist them out so they always apply.
          rule.replaceWith(rule.nodes)
        } else {
          console.warn(
            `[force-motion] compound reduced-motion query left untouched: @media ${params}`
          )
        }
      },
    },
  }
}

forceMotion.postcss = true
