import { test, expect } from '@playwright/test'

test.describe('Appointments', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Login' }).first().click()
    await expect(page).toHaveURL('/')
    await page.getByRole('link', { name: 'Appointments' }).click()
    await expect(page).toHaveURL('/appointments')
  })

  test('should display appointment calendar', async ({ page }) => {
    await expect(page.locator('.fc')).toBeVisible() // FullCalendar container
  })

  test('should switch between calendar and list view', async ({ page }) => {
    // Find and click list view toggle
    const listButton = page.getByRole('button', { name: /list/i })
    if (await listButton.isVisible()) {
      await listButton.click()
      await expect(page.getByRole('table')).toBeVisible()
    }
  })

  test('should open new appointment dialog', async ({ page }) => {
    await page.getByRole('button', { name: /new appointment/i }).click()
    await expect(page.getByText('Schedule Appointment')).toBeVisible()
  })

  test('should filter appointments by practitioner', async ({ page }) => {
    const practitionerSelect = page.locator('select').first()
    if (await practitionerSelect.isVisible()) {
      await practitionerSelect.selectOption({ index: 1 })
    }
  })
})
