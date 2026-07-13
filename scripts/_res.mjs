import { chromium } from 'playwright'

const TARGETS = [
  { tag: 'old', url: 'http://localhost:3300/config' },
  { tag: 'new', url: 'http://localhost:10009/config' },
]

const browser = await chromium.launch()
const results = {}

for (const t of TARGETS) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } })
  await page.goto(t.url, { waitUntil: 'load', timeout: 45000 })
  await page.waitForTimeout(1500)

  // Pick a client. Scope to the open menu — a bare .v-list-item also matches the
  // nav drawer. VDR-U is one of the daemons that is actually up.
  await page.locator('.v-select').first().click()
  await page.waitForTimeout(900)
  // Anchored regex: Vuetify 2 teleports the menu outside .v-menu, so scope by text.
  // No nav-drawer item is named VDR-U, and ^$ keeps VDR-U-1 / VDR-U-2 out.
  await page.locator('.v-list-item').filter({ hasText: /^VDR-U$/ }).first().click()
  await page.waitForTimeout(4000)

  await page.locator('.v-tab', { hasText: 'Resolutions' }).first().click()
  await page.waitForTimeout(1500)

  results[t.tag] = await page.evaluate(() => {
    const px = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { y: Math.round(r.y), h: Math.round(r.height) }
    }
    const cs = (el, ...props) => {
      if (!el) return null
      const s = getComputedStyle(el)
      return Object.fromEntries(props.map((p) => [p, s[p]]))
    }
    // A Property row = a d-flex holding a .container with two text fields
    const rows = [...document.querySelectorAll('div.d-flex')].filter(
      (d) => d.querySelector(':scope > .container, :scope > .v-container') && d.querySelectorAll('.v-text-field').length === 2
    )
    if (!rows.length) return { error: 'no property rows found' }

    const r0 = rows[0]
    const container = r0.querySelector('.container, .v-container')
    const row = r0.querySelector('.row, .v-row')
    const col = r0.querySelector('.col, [class*="col-"]')
    const field = r0.querySelector('.v-text-field')
    const inputBox = r0.querySelector('.v-input__slot, .v-field')

    return {
      rowCount: rows.length,
      rowHeight: px(r0).h,
      rowPitch: rows.length > 1 ? px(rows[1]).y - px(rows[0]).y : null,
      container: { ...px(container), ...cs(container, 'padding') },
      row: { ...px(row), ...cs(row, 'margin') },
      col: { ...px(col), ...cs(col, 'padding') },
      field: { ...px(field) },
      inputBox: { ...px(inputBox), ...cs(inputBox, 'height', 'minHeight') },
    }
  })
  await page.screenshot({ path: `C:/Users/MM/.claude/jobs/98b24136/tmp/res-${t.tag}.png`, clip: { x: 300, y: 150, width: 1250, height: 330 } })
  await page.close()
}

const o = results.old, n = results.new
if (o.error || n.error) { console.log(JSON.stringify(results, null, 2)); process.exit(0) }
const row = (l, a, b) => console.log(l.padEnd(24) + String(a).padEnd(22) + String(b) + (String(a) !== String(b) ? '   <-- differs' : ''))
row('', 'OLD (Vuetify 2)', 'NEW (Vuetify 4)')
console.log('-'.repeat(72))
row('row pitch (y to y)', o.rowPitch, n.rowPitch)
row('row height', o.rowHeight, n.rowHeight)
row('container padding', o.container.padding, n.container.padding)
row('container height', o.container.h, n.container.h)
row('row margin', o.row.margin, n.row.margin)
row('col padding', o.col.padding, n.col.padding)
row('col height', o.col.h, n.col.h)
row('text field height', o.field.h, n.field.h)
row('input box height', o.inputBox.height, n.inputBox.height)
await browser.close()
