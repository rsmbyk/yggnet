import { expect, test } from '@playwright/test';

test('HUD add-node works and Escape clears connect banner path', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });
	await page.getByTestId('world-add-node').click();
	await expect(page.getByTestId('world-node-sheet')).toBeVisible();
	// Connect from the selection sheet when available
	const connect = page.getByTestId('world-connect');
	if (await connect.isVisible()) {
		await connect.click();
		await expect(page.getByTestId('connect-banner')).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.getByTestId('connect-banner')).toHaveCount(0);
	}
});
