import { test, expect } from '@playwright/test'

test('login demo and open schedule generator', async ({ page }) => {
  await page.goto('/login')
  // click demo head nurse button (EMP006)
  const demoBtn = page.locator('button:has-text("EMP006")')
  if (await demoBtn.count() > 0) await demoBtn.first().click()
  else {
    // fallback: fill inputs and submit
    await page.fill('input[placeholder="예: EMP001"]', 'EMP006').catch(() => {})
    await page.fill('input[placeholder="비밀번호 입력"]', '1234').catch(() => {})
    await page.click('button:has-text("시스템 접속")').catch(() => {})
  }

  // wait for app to stabilize and navigate to head nurse area
  await page.waitForLoadState('networkidle')
  await page.goto('/head-nurse/schedule/generate')

  const gen = page.locator('button:has-text("자동 생성")')
  if (await gen.count() > 0) {
    await gen.first().click()
    await page.waitForTimeout(1000)
    await expect(page.locator('button:has-text("병동 근무표 Excel")')).toHaveCount(1)
  }
})
