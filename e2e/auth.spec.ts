import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should show login page for unauthenticated users', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/.*login/)
    await expect(page.getByText('EMR AI')).toBeVisible()
    await expect(page.getByText('Sign in to access the dashboard')).toBeVisible()
  })

  test('should display demo login options', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Dr. Sarah Johnson')).toBeVisible()
    await expect(page.getByText('Nancy Williams, RN')).toBeVisible()
    await expect(page.getByText('Carol Smith, LCSW')).toBeVisible()
  })

  test('should login with demo physician account', async ({ page }) => {
    await page.goto('/login')
    
    // Click demo login for physician
    await page.getByRole('button', { name: 'Login' }).first().click()
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/')
    await expect(page.getByText('Dr. Sarah Johnson')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.getByPlaceholder('physician@demo.com').fill('invalid@test.com')
    await page.getByPlaceholder('••••••••').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign in' }).click()
    
    await expect(page.getByText('Invalid email or password')).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.getByRole('button', { name: 'Login' }).first().click()
    await expect(page).toHaveURL('/')
    
    // Click sign out
    await page.getByText('Sign out').click()
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/)
  })
})
