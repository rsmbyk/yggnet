import { expect, test } from '@playwright/test';

test('shell loads manager and world', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-shell')).toBeVisible();
	await expect(page.getByTestId('yggnet-manager')).toBeVisible();
	await expect(page.getByText('Yggnet')).toBeVisible();
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });
});

test('mode tabs and command palette open', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('mode-explore')).toBeVisible();
	await page.getByTestId('mode-directions').click();
	await expect(page.getByTestId('directions-panel')).toBeVisible();
	await page.keyboard.press('Control+K');
	await expect(page.getByTestId('command-palette')).toBeVisible();
});
