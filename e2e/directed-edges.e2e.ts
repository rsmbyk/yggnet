import { expect, test } from '@playwright/test';
import { applyGeneratedGraph, openTool } from './open-tool';

test('toggle directed on edge keeps world visible', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });
	await applyGeneratedGraph(page, 'cycle', { nodes: 4 });

	await openTool(page, 'edges');
	const edgeList = page.getByTestId('edge-list');
	await expect(edgeList.locator('[data-testid^="edge-item-"]')).not.toHaveCount(0);

	await edgeList.locator('[data-testid^="edge-item-"]').first().click();
	await expect(page.getByTestId('edge-editor')).toBeVisible();

	const direction = page.getByTestId('edge-direction');
	const source = page.getByTestId('edge-source');
	const destination = page.getByTestId('edge-destination');
	await direction.selectOption('forward');
	const fromId = await source.getAttribute('data-value');
	const toId = await destination.getAttribute('data-value');
	expect(fromId).toBeTruthy();
	expect(toId).toBeTruthy();
	await direction.selectOption('reverse');
	await expect(source).toHaveAttribute('data-value', toId!);
	await expect(destination).toHaveAttribute('data-value', fromId!);
	await expect(direction).toHaveValue('forward');
	await expect(page.getByTestId('yggnet-world')).toBeVisible();
	await expect(page.getByTestId('yggnet-world').locator('canvas')).toBeVisible();
});
