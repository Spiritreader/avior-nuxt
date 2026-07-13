/**
 * The JavaScript half of forcing animations on. The CSS half is build/force-motion.ts;
 * the rationale for both is documented there.
 *
 * Vuetify 4 does not only gate motion in CSS. Every transition component's `disabled`
 * prop defaults to `PREFERS_REDUCED_MOTION()`, which switches Vue's <Transition> off
 * outright — it never emits the enter/leave classes, so no amount of CSS brings the
 * animation back. VDialog's transition, VField's floating label and VProgressCircular
 * check the same function at runtime.
 *
 * This module has to be imported BEFORE Vuetify. `createJavascriptTransition` calls
 * PREFERS_REDUCED_MOTION() while building its props object, which happens once, at
 * module-evaluation time — so patching from inside main.ts's body would already be too
 * late, since ES imports are evaluated before any statement in the importing module.
 *
 * The patch has to be a Proxy. MediaQueryList exposes `matches` as a prototype getter
 * and carries addEventListener/removeEventListener, which Vuetify's display composable
 * relies on; spreading it into an object literal would give you neither.
 */
const native = window.matchMedia.bind(window)

window.matchMedia = (query: string): MediaQueryList => {
  const mql = native(query)
  if (!/prefers-reduced-motion/i.test(query)) return mql

  return new Proxy(mql, {
    get(target, prop) {
      // Report the opposite of whatever the OS says: `reduce` never matches,
      // `no-preference` always does.
      if (prop === 'matches') return /no-preference/i.test(target.media)

      const value = Reflect.get(target, prop, target)
      return typeof value === 'function' ? value.bind(target) : value
    },
  })
}
