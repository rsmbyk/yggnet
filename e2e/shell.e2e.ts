import { expect, test } from '@playwright/test';

test('shell loads manager and world', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-shell')).toBeVisible();
	await expect(page.getByTestId('yggnet-manager')).toBeVisible();
	await expect(page.getByText('Yggnet')).toBeVisible();
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });
});
