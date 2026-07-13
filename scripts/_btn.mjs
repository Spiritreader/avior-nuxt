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

  out[tag] = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('.v-btn')].filter((b) => b.offsetParent !== null)
    const find = (t) => btns.find((b) => b.textContent.trim().toLowerCase() === t)
    const imp = find('import'), exp = find('export')
    const cs = (el) => (el ? getComputedStyle(el) : null)
    const box = (el) => {
      const r = el.getBoundingClientRect()
      return { x: Math.round(r.x), r: Math.round(r.right) }
    }
    const s = cs(imp)
    return {
      importMargin: s?.margin,
      importDisplay: s?.display,
      gapImportToExport: imp && exp ? box(exp).x - box(imp).r : null,
      // does a whitespace text node survive between them?
      siblingNodes: imp?.parentElement
        ? [...imp.parentElement.childNodes].map((n) =>
            n.nodeType === 3 ? `TEXT(${JSON.stringify(n.textContent)})` : n.nodeName
          )
        : null,
    }
  })
  await page.close()
}
console.log(JSON.stringify(out, null, 2))
await browser.close()
