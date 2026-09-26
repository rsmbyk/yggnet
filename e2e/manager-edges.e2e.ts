import { expect, test } from '@playwright/test';
import { applyGeneratedGraph, openTool } from './open-tool';

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

test('Edges list sorts by source then destination labels without changing endpoints', async ({
	page
}) => {
	await page.goto('/');
	await applyGeneratedGraph(page, 'complete', { nodes: 4, directed: 'false' });
	await openTool(page, 'nodes');

	const nodeItems = page.getByTestId('node-list').locator('button.list-item');
	const labels = ['Zulu', 'Alpha', 'Charlie', 'Bravo'];
	let alphaNodeTestId = '';
	for (let index = 0; index < labels.length; index += 1) {
		const nodeItem = nodeItems.nth(index);
		if (labels[index] === 'Alpha')
			alphaNodeTestId = (await nodeItem.getAttribute('data-testid')) ?? '';
		await nodeItem.click();
		await page.getByTestId('node-label').fill(labels[index]);
	}

	await openTool(page, 'edges');
	const edgeRows = page.getByTestId('edge-list').locator('button[data-testid^="edge-item-"]');
	const rowLabels = () =>
		edgeRows.evaluateAll((rows) =>
			rows.map((row) => row.textContent?.replace(/\s+/g, ' ').trim() ?? '')
		);
	await expect
		.poll(rowLabels)
		.toEqual([
			'Alpha — Bravo',
			'Alpha — Charlie',
			'Charlie — Bravo',
			'Zulu — Alpha',
			'Zulu — Bravo',
			'Zulu — Charlie'
		]);

	await page.getByTestId('edges-search-open').click();
	await page.getByTestId('edges-search').fill('Alpha');
	await page.getByTestId(`edges-search-node-${alphaNodeTestId.replace('node-item-', '')}`).click();
	await expect.poll(rowLabels).toEqual(['Alpha — Bravo', 'Alpha — Charlie', 'Zulu — Alpha']);
});
