import { expect, test } from '@playwright/test';

test('font specimens accept a pointer click and native text editing', async ({ page }) => {
  await page.goto('/1-root/fonts/');
  for (const name of ['Olivetti Dot', 'GT America Standard', 'GT America Standard Medium', 'GT America Compressed', 'GT Canon', 'Iosevka Extended']) {
    const specimen = page.getByRole('textbox', { name: `Try ${name}`, exact: true });
    await specimen.click({ timeout: 5000 });
    await expect(specimen).toBeFocused();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type('My own words.');
    await expect(specimen).toHaveText('My own words.');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Another line.');
    await expect(specimen).toContainText('Another line.');
  }
  await page.getByRole('link', { name: 'Section titled “Using the system fonts”' }).click();
  await expect(page).toHaveURL(/#using-the-system-fonts$/);
});

test('Olivetti size cycling preserves edited text and fixed viewport', async ({ page }) => {
  await page.goto('/1-root/fonts/');
  const specimen = page.getByRole('textbox', { name: 'Try Olivetti Dot', exact: true });
  await specimen.click({ timeout: 5000 });
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('Every word counts.');
  const before = await specimen.boundingBox();
  await page.getByRole('button', { name: 'Specimen size 40 px' }).click();
  await expect(page.getByRole('button', { name: 'Specimen size 60 px' })).toBeVisible();
  await expect(specimen).toHaveText('Every word counts.');
  expect((await specimen.boundingBox())?.height).toBe(before?.height);
});
