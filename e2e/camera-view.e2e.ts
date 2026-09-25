import { expect, test } from '@playwright/test';

test('camera chrome exposes 2D/3D toggle and reset controls', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });
	await expect(page.getByTestId('camera-controls')).toBeVisible();
	const viewMode = page.getByTestId('camera-view-mode');
	await expect(viewMode).toBeVisible();
	await expect(viewMode).toHaveAttribute('aria-pressed', 'false');
	await viewMode.click();
	await expect(viewMode).toHaveAttribute('aria-pressed', 'true');
	await viewMode.click();
	await expect(viewMode).toHaveAttribute('aria-pressed', 'false');
	await expect(page.getByTestId('camera-reset-target')).toBeVisible();
	await expect(page.getByTestId('camera-reset-orbit')).toBeVisible();
	await expect(page.getByTestId('camera-reset-zoom')).toBeVisible();
	await expect(page.getByTestId('camera-readout')).toBeVisible();
	await expect(page.getByTestId('yggnet-minimap')).toBeVisible();
});
