import { expect, test } from '@playwright/test';

test('in-world selection sheet appears after HUD create', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });
	await page.getByTestId('world-add-node').click();
	await expect(page.getByTestId('world-node-sheet')).toBeVisible();
	await expect(page.getByTestId('node-label')).toBeVisible();
	await expect(page.getByTestId('world-delete-node')).toBeVisible();
});
