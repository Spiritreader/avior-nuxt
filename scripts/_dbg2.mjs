import { chromium } from 'playwright'
const browser = await chromium.launch()
for (const [tag, url] of [['old', 'http://localhost:3300/config'], ['new', 'http://localhost:10009/config']]) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  await page.goto(url, { waitUntil: 'load', timeout: 45000 })
  await page.waitForTimeout(2000)
  console.log(`\n===== ${tag} =====`)
  console.log('selects:', await page.locator('.v-select').count())
  await page.locator('.v-select').first().click()
  await page.waitForTimeout(1200)
  console.log('menu items after opening select:', await page.locator('.v-list-item').count())
  const texts = await page.locator('.v-list-item').allInnerTexts()
  console.log('items:', JSON.stringify(texts.slice(0, 8)))
  if (texts.length) {
    await page.locator('.v-list-item').first().click()
    await page.waitForTimeout(4000)
  }
  console.log('tabs:', await page.locator('.v-tab').count(), JSON.stringify(await page.locator('.v-tab').allInnerTexts()))
  if (errs.length) console.log('pageerrors:', errs.slice(0, 3))
  await page.screenshot({ path: `C:/Users/MM/.claude/jobs/98b24136/tmp/cfg-${tag}.png` })
  await page.close()
}
await browser.close()
