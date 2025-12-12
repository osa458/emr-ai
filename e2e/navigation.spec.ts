import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.getByRole('button', { name: 'Login' }).first().click()
    await expect(page).toHaveURL('/')
  })

  test('should navigate to Patients page', async ({ page }) => {
    await page.getByRole('link', { name: 'Patients' }).click()
    await expect(page).toHaveURL('/patients')
    await expect(page.getByText('Patient List')).toBeVisible()
  })

  test('should navigate to Appointments page', async ({ page }) => {
    await page.getByRole('link', { name: 'Appointments' }).click()
    await expect(page).toHaveURL('/appointments')
    await expect(page.getByText('Appointments')).toBeVisible()
  })

  test('should navigate to Telemedicine page', async ({ page }) => {
    await page.getByRole('link', { name: 'Telemedicine' }).click()
    await expect(page).toHaveURL('/telemedicine')
    await expect(page.getByText('Telemedicine')).toBeVisible()
  })

  test('should navigate to Clinical Forms page', async ({ page }) => {
    await page.getByRole('link', { name: 'Clinical Forms' }).click()
    await expect(page).toHaveURL('/forms')
    await expect(page.getByText('Clinical Forms')).toBeVisible()
  })

  test('should navigate to Morning Triage page', async ({ page }) => {
    await page.getByRole('link', { name: 'Morning Triage' }).click()
    await expect(page).toHaveURL('/triage')
    await expect(page.getByText('Morning Triage')).toBeVisible()
  })

  test('should navigate to Discharge Planning page', async ({ page }) => {
    await page.getByRole('link', { name: 'Discharge Planning' }).click()
    await expect(page).toHaveURL('/discharge-planning')
    await expect(page.getByText('Discharge Planning')).toBeVisible()
  })
})
