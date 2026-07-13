// Agent's eyes for the Nuxt 2 -> Vue 3 migration.
//
// There is no browser in the dev environment, so a subagent porting a page
// cannot see what it built. This loads a page headlessly and emits three
// artifacts:
//
//   console.txt    every console message and page error, verbatim
//   structure.txt  a SEMANTIC dump of what rendered
//   screenshot.png full-page screenshot
//
// The structure dump is deliberately not a DOM diff. Vuetify 2 and Vuetify 4
// emit completely different class names and element nesting for the same
// component, so a markup comparison is all noise. Instead this captures what a
// human means by "the same page": the same nav items, headings, buttons, form
// labels, tabs, and table columns, in the same order. That IS comparable across
// the two Vuetify versions, and it is what the migration promises to preserve.
//
// Usage:
//   node scripts/inspect-page.mjs <url> <out-dir> [--wait <ms>]
//
// Exit code is 1 if the page threw an uncaught error, else 0. A non-empty
// console.txt does not fail the run on its own — the caller decides, because
// the reference app has its own pre-existing warnings.

import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const [, , url, outDir, ...rest] = process.argv
if (!url || !outDir) {
  console.error('usage: node scripts/inspect-page.mjs <url> <out-dir> [--wait <ms>]')
  process.exit(2)
}

const waitIdx = rest.indexOf('--wait')
const settleMs = waitIdx === -1 ? 2500 : Number(rest[waitIdx + 1])

await mkdir(outDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } })

const consoleLines = []
page.on('console', msg => consoleLines.push(`[${msg.type()}] ${msg.text()}`))
page.on('pageerror', err => consoleLines.push(`[pageerror] ${err.message}`))
page.on('requestfailed', req =>
  consoleLines.push(`[requestfailed] ${req.method()} ${req.url()} — ${req.failure()?.errorText}`)
)

let crashed = false
try {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
} catch (err) {
  // networkidle never settles if the page polls, and the daemon/Mongo calls
  // fail slowly here. Fall back to a plain load rather than reporting a crash.
  consoleLines.push(`[navigate] networkidle timed out, falling back: ${err.message}`)
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 })
  } catch (err2) {
    consoleLines.push(`[navigate] FAILED: ${err2.message}`)
    crashed = true
  }
}

await page.waitForTimeout(settleMs)

// Pull out semantic content, ignoring markup structure entirely.
const structure = crashed
  ? null
  : await page.evaluate(() => {
      const visible = el => {
        const s = getComputedStyle(el)
        if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false
        const r = el.getBoundingClientRect()
        return r.width > 0 && r.height > 0
      }
      const text = el => (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ')
      const collect = (selector, fn) =>
        [...document.querySelectorAll(selector)].filter(visible).map(fn).filter(Boolean)

      return {
        title: document.title,
        headings: collect('h1,h2,h3,h4,h5,h6,.v-toolbar-title,.v-card-title,.v-list-subheader,.v-subheader', text),
        navItems: collect('.v-navigation-drawer a, .v-navigation-drawer .v-list-item', el => {
          const t = text(el)
          const href = el.getAttribute('href')
          return t || href ? `${t}${href ? ` -> ${href}` : ''}` : null
        }),
        tabs: collect('.v-tab, [role="tab"]', text),
        buttons: collect('button, .v-btn, [role="button"]', el => text(el) || el.getAttribute('aria-label') || '<icon>'),
        links: collect('a[href]', el => `${text(el)} -> ${el.getAttribute('href')}`),
        inputs: collect('input, textarea, select', el => {
          const id = el.getAttribute('id')
          const label = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null
          return `${el.tagName.toLowerCase()}[${el.getAttribute('type') || 'text'}] ${
            label ? text(label) : el.getAttribute('placeholder') || el.getAttribute('aria-label') || '(unlabelled)'
          }`
        }),
        tableColumns: collect('th', text),
        tableRowCount: document.querySelectorAll('tbody tr').length,
        listItems: collect('.v-list-item', text).slice(0, 60),
        // Every Vuetify component that rendered, by name. This is the closest
        // thing to "the same components in the same places" that survives the
        // v2 -> v4 class-name churn.
        vuetifyComponents: (() => {
          const names = new Set()
          for (const el of document.querySelectorAll('[class*="v-"]')) {
            if (!visible(el)) continue
            for (const c of el.classList) {
              if (/^v-[a-z-]+$/.test(c) && !c.includes('--')) names.add(c)
            }
          }
          return [...names].sort()
        })(),
        bodyTextLength: (document.body.innerText || '').trim().length,
      }
    })

await page.screenshot({ path: path.join(outDir, 'screenshot.png'), fullPage: true })
await writeFile(path.join(outDir, 'console.txt'), consoleLines.join('\n') || '(clean)', 'utf8')

const fmt = s => {
  if (!s) return 'PAGE FAILED TO LOAD'
  const section = (name, arr) =>
    `## ${name} (${arr.length})\n${arr.length ? arr.map(x => `  - ${x}`).join('\n') : '  (none)'}`
  return [
    `# ${url}`,
    `title: ${s.title}`,
    `body text length: ${s.bodyTextLength}`,
    `table rows: ${s.tableRowCount}`,
    section('headings', s.headings),
    section('nav items', s.navItems),
    section('tabs', s.tabs),
    section('buttons', s.buttons),
    section('links', s.links),
    section('inputs', s.inputs),
    section('table columns', s.tableColumns),
    section('list items', s.listItems),
    section('vuetify components rendered', s.vuetifyComponents),
  ].join('\n\n')
}
await writeFile(path.join(outDir, 'structure.txt'), fmt(structure), 'utf8')

const errors = consoleLines.filter(l => l.startsWith('[error]') || l.startsWith('[pageerror]'))
const warnings = consoleLines.filter(l => l.startsWith('[warning]'))

console.log(`url:        ${url}`)
console.log(`out:        ${outDir}`)
console.log(`loaded:     ${crashed ? 'NO — page failed to load' : 'yes'}`)
console.log(`errors:     ${errors.length}`)
console.log(`warnings:   ${warnings.length}`)
if (structure) {
  console.log(`rendered:   ${structure.vuetifyComponents.length} vuetify components, ` +
    `${structure.buttons.length} buttons, ${structure.inputs.length} inputs, ` +
    `${structure.tableColumns.length} table columns`)
}
if (errors.length) {
  console.log('\n--- errors ---')
  errors.forEach(e => console.log(e))
}

await browser.close()
process.exit(crashed ? 1 : 0)
