import { chromium } from 'playwright'

// Vue 3 condenses away the whitespace text nodes between elements that Vue 2 kept.
// Any pair of adjacent inline-flex buttons that got its spacing from that space now
// touches. Diff every adjacent .v-btn pair, old vs new.
const scan = () => {
  const out = []
  for (const parent of document.querySelectorAll('*')) {
    const btns = [...parent.children].filter(
      (c) => c.classList?.contains('v-btn') && c.offsetParent !== null
    )
    for (let i = 0; i < btns.length - 1; i++) {
      const a = btns[i].getBoundingClientRect()
      const b = btns[i + 1].getBoundingClientRect()
      if (Math.abs(a.y - b.y) > 6) continue // not side by side
      out.push({
        pair: `${btns[i].textContent.trim().slice(0, 14) || 'icon'} | ${btns[i + 1].textContent.trim().slice(0, 14) || 'icon'}`,
        gap: Math.round(b.x - a.right),
      })
    }
  }
  return out
}

const visit = async (page, url, tag, sink) => {
  await page.goto(url, { waitUntil: 'load', timeout: 45000 })
  await page.waitForTimeout(2500)
  if (url.includes('/config') && !url.includes('global')) {
    await page.locator('.v-select').first().click()
    await page.waitForTimeout(800)
    await page.locator('.v-list-item').filter({ hasText: /^VDR-U$/ }).first().click()
    await page.waitForTimeout(4500)
  }
  const tabs = await page.locator('.v-tab').count()
  const grab = async (where) => {
    for (const g of await page.evaluate(scan)) sink.set(`${where} :: ${g.pair}`, g.gap)
  }
  await grab(tag)
  for (let i = 0; i < tabs; i++) {
    await page.locator('.v-tab').nth(i).click()
    await page.waitForTimeout(800)
    await grab(`${tag}#${i}`)
  }
  // expand the first client group on globalconfig
  if (url.includes('globalconfig')) {
    const g = page.locator('.v-list-group__header, .v-list-item').filter({ hasText: /^VDR-U$/ }).first()
    if (await g.count()) {
      await g.click()
      await page.waitForTimeout(900)
      await grab(`${tag} expanded`)
    }
  }
}

const browser = await chromium.launch()
const res = {}
for (const [tag, base] of [['old', 'http://localhost:3300'], ['new', 'http://localhost:10009']]) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } })
  const sink = new Map()
  for (const p of ['/', '/jobs', '/config', '/globalconfig', '/settings']) {
    try { await visit(page, base + p, p, sink) } catch (e) { console.log(`${tag} ${p}: ${e.message.split('\n')[0]}`) }
  }
  res[tag] = sink
  await page.close()
}

const keys = [...new Set([...res.old.keys(), ...res.new.keys()])].sort()
console.log('\nadjacent button pairs whose gap CHANGED:\n')
let n = 0
for (const k of keys) {
  const o = res.old.get(k), nw = res.new.get(k)
  if (o === undefined || nw === undefined) continue
  if (o !== nw) { console.log(`  ${k}\n      old gap=${o}px   new gap=${nw}px`); n++ }
}
if (!n) console.log('  (none)')
await browser.close()
