import { expect, test } from '@playwright/test';

test('world selection sheet hides while Tools is open', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });

	await page.getByTestId('world-add-node').click();
	await expect(page.getByTestId('world-node-sheet')).toBeVisible();

	await page.getByTestId('open-manager').click();
	await expect(page.getByTestId('yggnet-manager')).toBeVisible();
	await expect(page.getByTestId('yggnet-manager').getByText('Tools', { exact: true })).toBeVisible();
	await expect(page.getByTestId('world-node-sheet')).toHaveCount(0);
	await expect(page.getByTestId('node-editor')).toBeVisible();
	await expect(page.getByTestId('node-connect')).toBeVisible();

	await page.getByTestId('close-manager').click();
	await expect(page.getByTestId('yggnet-manager')).toHaveCount(0);
	await expect(page.getByTestId('world-node-sheet')).toBeVisible();
});

test('Tools drawer starts below the toolbar with HUD padding', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });
	await page.getByTestId('open-manager').click();
	const toolbar = page.getByTestId('open-manager');
	const drawer = page.getByTestId('yggnet-manager');
	await expect(drawer).toBeVisible();
	const bar = await toolbar.boundingBox();
	const panel = await drawer.boundingBox();
	expect(bar).toBeTruthy();
	expect(panel).toBeTruthy();
	const gap = panel!.y - (bar!.y + bar!.height);
	expect(gap).toBeGreaterThanOrEqual(8);
	expect(gap).toBeLessThanOrEqual(20);
});
