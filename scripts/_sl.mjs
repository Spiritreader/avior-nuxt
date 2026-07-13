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
  await page.waitForTimeout(4500)
  await page.locator('.v-tab').filter({ hasText: 'Modules' }).first().click()
  await page.waitForTimeout(1500)
  out[tag] = await page.evaluate(() => {
    const h = (sel) => {
      const e = document.querySelector(sel)
      if (!e) return null
      const r = e.getBoundingClientRect()
      return { w: Math.round(r.width), h: Math.round(r.height) }
    }
    const card = document.querySelector('.v-card[style*="242424"], .v-card')
    const behind = card?.parentElement
    return {
      track: h('.v-slider-track__background, .v-slider__track-background'),
      thumb: h('.v-slider-thumb__surface, .v-slider__thumb'),
      slider: h('.v-slider'),
      cardBg: card ? getComputedStyle(card).backgroundColor : null,
      behindBg: behind ? getComputedStyle(behind).backgroundColor : null,
    }
  })
  await page.close()
}
console.log(JSON.stringify(out, null, 2))
await browser.close()
