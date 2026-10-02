import { expect, test } from '@playwright/test';
import { applyGeneratedGraph, openTool } from './open-tool';

test('ctrl-click multi-selects nodes in manager', async ({ page }) => {
	await page.goto('/');
	await openTool(page, 'nodes');
	await page.getByTestId('add-node').click();
	await page.getByTestId('add-node').click();
	await page.getByTestId('add-node').click();

	const items = page.getByTestId('node-list').locator('button.list-item');
	const first = items.nth(0);
	const second = items.nth(1);
	const firstId = await first.getAttribute('data-testid');
	const secondId = await second.getAttribute('data-testid');
	expect(firstId).toBeTruthy();
	expect(secondId).toBeTruthy();

	await first.click();
	await expect(page.getByTestId('world-node-sheet')).toBeVisible();

	await second.click({ modifiers: ['ControlOrMeta'] });
	await expect(page.getByTestId('selection-count')).toHaveText(/2 selected/);
	await expect(page.getByTestId('group-multi')).toBeVisible();
});

test('switching away from Nodes clears single and multiple node selections', async ({ page }) => {
	await page.goto('/');
	await openTool(page, 'nodes');
	await page.getByTestId('add-node').click();
	await page.getByTestId('add-node').click();

	const items = page.getByTestId('node-list').locator('button.list-item');
	await items.nth(0).click();
	await expect(page.getByTestId('world-node-sheet')).toBeVisible();
	await openTool(page, 'edges');
	await openTool(page, 'nodes');
	await expect(page.getByTestId('world-node-sheet')).toHaveCount(0);

	await items.nth(0).click();
	await items.nth(1).click({ modifiers: ['ControlOrMeta'] });
	await expect(page.getByTestId('selection-count')).toHaveText(/2 selected/);
	await openTool(page, 'edges');
	await openTool(page, 'nodes');
	await expect(page.getByTestId('world-node-sheet')).toHaveCount(0);

	await items.nth(0).click();
	await items.nth(1).click({ modifiers: ['ControlOrMeta'] });
	await expect(page.getByTestId('selection-count')).toHaveText(/2 selected/);
	await page.getByTestId('tool-nodes').click();
	await openTool(page, 'nodes');
	await expect(page.getByTestId('selection-count')).toHaveCount(0);
	await expect(page.getByTestId('world-node-sheet')).toHaveCount(0);
});

test('SPEC-052 switching away from Edges clears edge selection', async ({ page }) => {
	await page.goto('/');
	await applyGeneratedGraph(page, 'cycle', { nodes: 3 });
	await openTool(page, 'edges');

	const items = page.getByTestId('edge-list').locator('button[data-testid^="edge-item-"]');
	await items.first().click();
	await expect(page.getByTestId('world-edge-sheet')).toBeVisible();

	await openTool(page, 'nodes');
	await expect(page.getByTestId('world-edge-sheet')).toHaveCount(0);

	await openTool(page, 'edges');
	await items.first().click();
	await expect(page.getByTestId('world-edge-sheet')).toBeVisible();
	await page.getByTestId('tool-edges').click();
	await expect(page.getByTestId('world-edge-sheet')).toHaveCount(0);
});
