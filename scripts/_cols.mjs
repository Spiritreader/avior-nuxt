import { chromium } from 'playwright'

// Any .v-col whose parent is not a .v-row is broken in Vuetify 4: the column-width
// custom properties are declared on .v-row, so without one the flex-basis calc is
// invalid and the column shrink-wraps instead of taking its share.
// v-window-item mounts lazily, so every tab has to be visited.
const scan = () =>
  [...document.querySelectorAll('.v-col, [class*="v-col-"]')]
    .filter((c) => !c.parentElement?.classList.contains('v-row'))
    .filter((c) => c.offsetParent !== null)
    .map((c) => ({
      cls: c.className.toString().trim().slice(0, 40),
      parent: c.parentElement?.className.toString().trim().slice(0, 38),
      basis: getComputedStyle(c).flexBasis,
      width: Math.round(c.getBoundingClientRect().width),
    }))

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } })
const found = new Map()

const collect = async (where) => {
  for (const b of await page.evaluate(scan)) {
    found.set(`${b.cls}|${b.parent}`, { ...b, where })
  }
}

for (const p of ['/', '/jobs', '/globalconfig', '/settings']) {
  await page.goto('http://localhost:10009' + p, { waitUntil: 'load', timeout: 45000 })
  await page.waitForTimeout(2500)
  const tabs = await page.locator('.v-tab').count()
  await collect(p)
  for (let i = 0; i < tabs; i++) {
    await page.locator('.v-tab').nth(i).click()
    await page.waitForTimeout(700)
    await collect(`${p} tab#${i}`)
  }
}

await page.goto('http://localhost:10009/config', { waitUntil: 'load', timeout: 45000 })
await page.waitForTimeout(2000)
await page.locator('.v-select').first().click()
await page.waitForTimeout(800)
await page.locator('.v-list-item').filter({ hasText: /^VDR-U$/ }).first().click()
await page.waitForTimeout(4500)
const names = await page.locator('.v-tab').allInnerTexts()
for (let i = 0; i < names.length; i++) {
  await page.locator('.v-tab').nth(i).click()
  await page.waitForTimeout(900)
  await collect(`/config ${names[i]}`)
}

console.log(`\n${found.size} v-col(s) with no v-row parent:\n`)
for (const b of found.values()) {
  console.log(`${b.where}`)
  console.log(`   col      "${b.cls}"`)
  console.log(`   parent   "${b.parent}"`)
  console.log(`   basis=${b.basis}  rendered width=${b.width}px\n`)
}
await browser.close()
