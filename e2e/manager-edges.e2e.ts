import { expect, test } from '@playwright/test';
import { applyGeneratedGraph, openTool } from './open-tool';

/** Read the visible edge rows as "from <sep> to" strings. */
function rowLabels(page: import('@playwright/test').Page) {
	const rows = page.getByTestId('edge-list').locator('button[data-testid^="edge-item-"]');
	return () =>
		rows.evaluateAll((els) => els.map((el) => el.textContent?.replace(/\s+/g, ' ').trim() ?? ''));
}

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
	await applyGeneratedGraph(page, 'complete', { nodes: 5 });
	await openTool(page, 'nodes');

	const nodeItems = page.getByTestId('node-list').locator('button.list-item');
	// Mixed case on purpose, plus an `Alpha`/`alpha` pair that differs only by
	// case. Under `sensitivity: 'base'` they tie and fall through to the stable
	// id tie-break, so the `Alpha` group leads. A case-sensitive collation
	// would instead put the lowercase `alpha` group first, because the
	// lowercased label sits on the later id.
	const labels = ['Zulu', 'Alpha', 'Bravo', 'alpha', 'charlie'];
	let alphaNodeTestId = '';
	for (let index = 0; index < labels.length; index += 1) {
		const nodeItem = nodeItems.nth(index);
		if (labels[index] === 'alpha')
			alphaNodeTestId = (await nodeItem.getAttribute('data-testid')) ?? '';
		await nodeItem.click();
		await page.getByTestId('node-label').fill(labels[index]);
	}

	await openTool(page, 'edges');
	const labelsOfRows = rowLabels(page);
	await expect
		.poll(labelsOfRows)
		.toEqual([
			'Alpha — alpha',
			'Alpha — Bravo',
			'Alpha — charlie',
			'alpha — charlie',
			'Bravo — alpha',
			'Bravo — charlie',
			'Zulu — Alpha',
			'Zulu — alpha',
			'Zulu — Bravo',
			'Zulu — charlie'
		]);

	await page.getByTestId('edges-search-open').click();
	await page.getByTestId('edges-search').fill('alpha');
	await page.getByTestId(`edges-search-node-${alphaNodeTestId.replace('node-item-', '')}`).click();
	await expect
		.poll(labelsOfRows)
		.toEqual(['Alpha — alpha', 'alpha — charlie', 'Bravo — alpha', 'Zulu — alpha']);
});

test('Edges list sorts directed rows for display and keeps stored from/to roles', async ({
	page
}) => {
	await page.goto('/');
	await applyGeneratedGraph(page, 'complete', { nodes: 3 });
	await openTool(page, 'nodes');

	const nodeItems = page.getByTestId('node-list').locator('button.list-item');
	// Distinct labels with mixed case, so the display order is only correct
	// when the comparison is case-insensitive.
	const labels = ['gamma', 'Alpha', 'beta'];
	let betaNodeTestId = '';
	for (let index = 0; index < labels.length; index += 1) {
		const nodeItem = nodeItems.nth(index);
		if (labels[index] === 'beta')
			betaNodeTestId = (await nodeItem.getAttribute('data-testid')) ?? '';
		await nodeItem.click();
		await page.getByTestId('node-label').fill(labels[index]);
	}

	// Make every edge directed through the edge editor's direction control.
	await openTool(page, 'edges');
	const edgeRows = page.getByTestId('edge-list').locator('button[data-testid^="edge-item-"]');
	const edgeCount = await edgeRows.count();
	expect(edgeCount).toBe(3);
	for (let index = 0; index < edgeCount; index += 1) {
		await edgeRows.nth(index).click();
		await page.getByTestId('edge-direction').selectOption('forward');
	}

	const labelsOfRows = rowLabels(page);
	// Sorted by source then target, with the stored from/to roles untouched:
	// gamma stays the source of both of its edges even though Alpha sorts first.
	await expect.poll(labelsOfRows).toEqual(['Alpha → beta', 'gamma → Alpha', 'gamma → beta']);

	// Filtering returns the same matching rows in the same display order.
	// The typed text only drives suggestions; the chip is the actual filter.
	await page.getByTestId('edges-search-open').click();
	await page.getByTestId('edges-search').fill('beta');
	await page.getByTestId(`edges-search-node-${betaNodeTestId.replace('node-item-', '')}`).click();
	await expect.poll(labelsOfRows).toEqual(['Alpha → beta', 'gamma → beta']);
});
