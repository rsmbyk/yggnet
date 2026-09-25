import { expect, test } from '@playwright/test';
import { openTool } from './open-tool';

test('Edges tool exposes TagPicker-style search and edge list', async ({ page }) => {
	await page.goto('/');
	await openTool(page, 'edges');
	await expect(page.getByTestId('yggnet-manager')).toBeVisible();
	await expect(page.getByTestId('edges-section')).toBeVisible();
	await expect(page.getByTestId('edge-list')).toBeAttached();
	await expect(page.getByTestId('edges-search-open')).toBeVisible();
	await page.getByTestId('edges-search-open').click();
	await expect(page.getByTestId('edges-search')).toBeVisible();
});
