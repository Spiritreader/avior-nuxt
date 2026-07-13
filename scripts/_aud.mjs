import { chromium } from 'playwright'

const browser = await chromium.launch()
const results = {}

for (const [tag, url] of [['old', 'http://localhost:3300/config'], ['new', 'http://localhost:10009/config']]) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } })
  await page.goto(url, { waitUntil: 'load', timeout: 45000 })
  await page.waitForTimeout(1500)
  await page.locator('.v-select').first().click()
  await page.waitForTimeout(900)
  await page.locator('.v-list-item').filter({ hasText: /^VDR-U$/ }).first().click()
  await page.waitForTimeout(4000)
  await page.locator('.v-tab', { hasText: 'Audio Formats' }).first().click()
  await page.waitForTimeout(1500)

  results[tag] = await page.evaluate(() => {
    const px = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: Math.round(r.x), w: Math.round(r.width), r: Math.round(r.right) }
    }
    // a list row that has a delete button
    const items = [...document.querySelectorAll('.v-list-item')].filter((li) =>
      li.querySelector('.v-btn') && li.querySelector('.v-list-item-title, .v-list-item__title')
    )
    if (!items.length) return { error: 'no rows' }
    const li = items[0]
    const title = li.querySelector('.v-list-item-title, .v-list-item__title')
    const btn = li.querySelector('.v-btn')
    const content = li.querySelector('.v-list-item__content')
    return {
      text: title?.textContent?.trim(),
      item: px(li),
      content: content ? { ...px(content), flex: getComputedStyle(content).flex } : null,
      title: { ...px(title), flex: getComputedStyle(title).flex },
      button: px(btn),
      gapTitleToBtn: px(btn).x - px(title).r,
      btnToItemRight: px(li).r - px(btn).r,
    }
  })
  await page.screenshot({ path: `C:/Users/MM/.claude/jobs/98b24136/tmp/aud-${tag}.png`, clip: { x: 300, y: 150, width: 1250, height: 340 } })
  await page.close()
}

const o = results.old, n = results.new
if (o.error || n.error) { console.log(JSON.stringify(results, null, 2)); process.exit(0) }
const row = (l, a, b) => console.log(l.padEnd(24) + String(a).padEnd(22) + String(b) + (String(a) !== String(b) ? '   <-- differs' : ''))
row('', 'OLD (Vuetify 2)', 'NEW (Vuetify 4)')
console.log('-'.repeat(72))
row('row text', o.text, n.text)
row('list item width', o.item.w, n.item.w)
row('title width', o.title.w, n.title.w)
row('title flex', o.title.flex, n.title.flex)
row('content flex', o.content?.flex ?? '(no wrapper)', n.content?.flex ?? '(no wrapper)')
row('gap: title -> button', o.gapTitleToBtn, n.gapTitleToBtn)
row('button -> item right', o.btnToItemRight, n.btnToItemRight)
await browser.close()
