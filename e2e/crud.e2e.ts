import { expect, test } from '@playwright/test';
import { openTool } from './open-tool';

test('add node via manager is visible in list', async ({ page }) => {
	await page.goto('/');
	await openTool(page, 'nodes');

	const list = page.getByTestId('node-list');
	const before = await list.locator('li').count();

	await page.getByTestId('add-node').click();

	await expect(list.locator('li')).toHaveCount(before + 1);
	await expect(page.getByTestId('node-editor')).toBeVisible();
	await expect(page.getByTestId('node-label')).toBeVisible();
});
