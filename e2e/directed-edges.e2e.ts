import { expect, test } from '@playwright/test';
import { applyGeneratedGraph, openTool } from './open-tool';

test('toggle directed on edge keeps world visible', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });
	await applyGeneratedGraph(page, 'cycle', { nodes: 4 });

	await openTool(page, 'edges');
	const edgeList = page.getByTestId('edge-list');
	await expect(edgeList.locator('[data-testid^="edge-item-"]')).not.toHaveCount(0);

	const edgeTestId = await edgeList
		.locator('[data-testid^="edge-item-"]')
		.first()
		.getAttribute('data-testid');
	expect(edgeTestId).toMatch(/^edge-item-/);
	const id = edgeTestId!.slice('edge-item-'.length);

	await page.getByTestId(`toggle-directed-${id}`).click();
	await expect(page.getByTestId('yggnet-world')).toBeVisible();
	await expect(page.getByTestId('yggnet-world').locator('canvas')).toBeVisible();

	await page.getByTestId(`toggle-directed-${id}`).click();
	await expect(page.getByTestId('yggnet-world')).toBeVisible();
	await expect(page.getByTestId('yggnet-world').locator('canvas')).toBeVisible();
});
