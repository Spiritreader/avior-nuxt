import { chromium } from 'playwright'
const browser = await chromium.launch()
for (const [tag, url] of [['old', 'http://localhost:3300/config'], ['new', 'http://localhost:10009/config']]) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } })
  await page.goto(url, { waitUntil: 'load', timeout: 45000 })
  await page.waitForTimeout(1500)
  await page.locator('.v-select').first().click()
  await page.waitForTimeout(800)
  await page.locator('.v-list-item').filter({ hasText: /^VDR-U$/ }).first().click()
  await page.waitForTimeout(4500)
  await page.locator('.v-tab').filter({ hasText: 'Modules' }).first().click()
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `C:/Users/MM/.claude/jobs/98b24136/tmp/mod-${tag}.png`, clip: { x: 320, y: 150, width: 700, height: 640 } })
  await page.close()
}
await browser.close()
console.log('ok')
