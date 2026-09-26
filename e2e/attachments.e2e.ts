import { expect, test } from '@playwright/test';
import { applyGeneratedGraph, openTool } from './open-tool';

test('edge companion edits notes; selected edge tags stay on the edge', async ({ page }) => {
	await page.goto('/');
	await applyGeneratedGraph(page, 'cycle', { nodes: 4 });

	await openTool(page, 'nodes');
	await page.getByTestId('node-list').locator('button.list-item').first().click();
	const nodeSheet = page.getByTestId('world-node-sheet');
	await expect(nodeSheet).toBeVisible();
	await nodeSheet.getByLabel('Add tags').click();
	await nodeSheet.getByPlaceholder('Search or create…').fill('node-only');
	await page.keyboard.press('Enter');
	await expect(nodeSheet).toContainText('node-only');
	await page.keyboard.press('Escape');

	await openTool(page, 'edges');
	await page.getByTestId('edge-list').locator('button.list-item').first().click();
	const edgeSheet = page.getByTestId('world-edge-sheet');
	await expect(edgeSheet.getByTestId('edge-editor')).toBeVisible();

	await page.getByTestId('edge-notes').fill('hello edge');
	await expect(page.getByTestId('edge-notes')).toHaveValue('hello edge');

	await edgeSheet.getByLabel('Add tags').click();
	await edgeSheet.getByPlaceholder('Search or create…').fill('edge-route');
	await page.keyboard.press('Enter');
	await expect(edgeSheet).toContainText('edge-route');
	// Selected chips are edge-owned; node-only is not on this edge.
	await expect(edgeSheet.getByTestId('node-tag-remove-node-only')).toHaveCount(0);
});
