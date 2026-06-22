const { chromium } = require('playwright')
const fs = require('fs')

(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  page.on('console', msg => {
    console.log('[PAGE][console]', msg.type(), msg.text())
  })
  page.on('pageerror', err => {
    console.log('[PAGE][error]', err.toString())
  })

  try {
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle' })
    const screenshotPath = 'test-output/screenshot.png'
    await fs.promises.mkdir('test-output', { recursive: true })
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.log('screenshot saved to', screenshotPath)
  } catch (e) {
    console.error('navigation failed', e)
  } finally {
    await browser.close()
  }
})()
