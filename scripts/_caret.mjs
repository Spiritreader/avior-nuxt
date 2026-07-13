import { chromium } from 'playwright'

const browser = await chromium.launch()
const out = {}
for (const [tag, url] of [['old', 'http://localhost:3300/config'], ['new', 'http://localhost:10009/config']]) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } })
  await page.goto(url, { waitUntil: 'load', timeout: 45000 })
  await page.waitForTimeout(1500)
  await page.locator('.v-select').first().click()
  await page.waitForTimeout(800)
  await page.locator('.v-list-item').filter({ hasText: /^VDR-U$/ }).first().click()
  await page.waitForTimeout(4000)

  out[tag] = await page.evaluate(() => {
    const r = (el) => {
      if (!el) return null
      const b = el.getBoundingClientRect()
      return { y: Math.round(b.y), h: Math.round(b.height), cy: Math.round(b.y + b.height / 2) }
    }
    // the "Add Media Path" field on the General tab
    const inputs = [...document.querySelectorAll('input')].filter((i) => {
      const l = (i.closest('.v-input')?.textContent || '') + ' ' + (i.placeholder || '')
      return l.includes('Add ')
    })
    const input = inputs[0]
    if (!input) return { error: 'not found' }
    const cs = getComputedStyle(input)
    const item = input.closest('.v-list-item')
    const label = input.closest('.v-input').querySelector('label')
    const icon = item?.querySelector('.v-icon')
    return {
      inputRect: r(input),
      inputPadding: cs.padding,
      inputHeight: cs.height,
      inputLineHeight: cs.lineHeight,
      inputFontSize: cs.fontSize,
      labelRect: r(label),
      labelText: label?.textContent?.trim(),
      iconRect: r(icon),
      listItemRect: r(item),
    }
  })
  await page.close()
}
const o = out.old, n = out.new
if (o.error || n.error) { console.log(JSON.stringify(out, null, 2)); process.exit(0) }
const row = (l, a, b) => console.log(l.padEnd(22) + String(a).padEnd(20) + String(b) + (String(a) !== String(b) ? '  <-- differs' : ''))
row('', 'OLD', 'NEW')
console.log('-'.repeat(66))
row('input height', o.inputHeight, n.inputHeight)
row('input padding', o.inputPadding, n.inputPadding)
row('input line-height', o.inputLineHeight, n.inputLineHeight)
row('input font-size', o.inputFontSize, n.inputFontSize)
row('input centre-y', o.inputRect.cy, n.inputRect.cy)
row('label centre-y', o.labelRect?.cy, n.labelRect?.cy)
row('label - input dy', (o.labelRect?.cy ?? 0) - o.inputRect.cy, (n.labelRect?.cy ?? 0) - n.inputRect.cy)
row('icon centre-y', o.iconRect?.cy, n.iconRect?.cy)
row('icon - input dy', (o.iconRect?.cy ?? 0) - o.inputRect.cy, (n.iconRect?.cy ?? 0) - n.inputRect.cy)
row('list item height', o.listItemRect?.h, n.listItemRect?.h)
await browser.close()
