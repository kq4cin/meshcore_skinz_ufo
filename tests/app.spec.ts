import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test('onboarding accepts free-text location and weather channel, and persists them', async ({ page }) => {
  await page.goto('./');

  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Enter a ZIP code or location.')).toBeVisible();
  await page.getByLabel('ZIP code or location').fill('Atlanta, GA');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('Weather hashtag channel').fill('WX Atlanta');
  await page.getByRole('button', { name: 'Finish' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();

  await page.getByRole('button', { name: 'Weather', exact: true }).click();
  await expect(page.getByText('#wxatlanta')).toBeVisible();
  await expect(page.getByText('Atlanta, GA')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Get weather' })).toBeDisabled();

  await page.reload();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Weather', exact: true }).click();
  await expect(page.getByText('Atlanta, GA')).toBeVisible();
});

test('settings has no node rename field', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Skip' }).click();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByLabel('Node name')).toHaveCount(0);
});

test('no horizontal overflow on small phones', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('./');
  await page.getByRole('button', { name: 'Skip' }).click();
  for (const tab of ['Messages', 'Weather', 'Contacts', 'Settings']) {
    await page.getByRole('button', { name: tab, exact: true }).click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, tab).toBeLessThanOrEqual(0);
  }
});
