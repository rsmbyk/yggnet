import { expect, test } from '@playwright/test';
import { applyGeneratedGraph, openTool } from './open-tool';

async function addTagOnSelectedNode(page: import('@playwright/test').Page, tag: string) {
	const sheet = page.getByTestId('world-node-sheet');
	await sheet.getByLabel('Add tags').click();
	await sheet.getByPlaceholder('Search or create…').fill(tag);
	await page.keyboard.press('Enter');
	await expect(sheet).toContainText(tag);
	await page.keyboard.press('Escape');
	await expect(sheet.getByTestId('node-tags-search')).toHaveCount(0);
}

test('SPEC-053 illustrated empty states for Nodes, Edges, Tags, Groups', async ({ page }) => {
	await page.goto('/');

	// Truly-empty states on a fresh document.
	await openTool(page, 'nodes');
	await expect(page.getByTestId('nodes-empty')).toBeVisible();
	await expect(page.getByTestId('nodes-empty').locator('svg')).toBeVisible();
	await expect(page.getByTestId('nodes-empty')).toContainText(/no nodes yet/i);

	await openTool(page, 'edges');
	await expect(page.getByTestId('edges-empty')).toBeVisible();
	await expect(page.getByTestId('edges-empty').locator('svg')).toBeVisible();
	await expect(page.getByTestId('edges-empty')).toContainText(/no edges yet/i);

	await openTool(page, 'tags');
	await expect(page.getByTestId('tags-empty')).toBeVisible();
	await expect(page.getByTestId('tags-empty').locator('svg')).toBeVisible();
	await expect(page.getByTestId('tags-empty')).toContainText(/no tags yet/i);

	await openTool(page, 'groups');
	await expect(page.getByTestId('groups-empty')).toBeVisible();
	await expect(page.getByTestId('groups-empty').locator('svg')).toBeVisible();
	await expect(page.getByTestId('groups-empty')).toContainText(/no groups yet/i);
});

test('SPEC-053 empty views distinguish filter-no-match states', async ({ page }) => {
	await page.goto('/');

	// Nodes no-match: a keyword pill that matches no labels.
	await openTool(page, 'nodes');
	await page.getByTestId('add-node').click();
	await page.getByTestId('add-node').click();
	const nodeItems = page.getByTestId('node-list').locator('button.list-item');

	// Tags no-match: a tag exists, but the query matches nothing.
	await nodeItems.first().click();
	await addTagOnSelectedNode(page, 'solo');
	await openTool(page, 'tags');
	await page.getByTestId('tags-search').fill('zzz-no-match');
	await expect(page.getByTestId('tags-no-match')).toBeVisible();
	await expect(page.getByTestId('tags-no-match')).toContainText(/no tags match/i);

	await openTool(page, 'nodes');
	await page.getByTestId('nodes-search-open').click();
	await page.getByTestId('nodes-search').fill('zzz-no-match');
	await page.getByTestId('nodes-search-keyword').click();
	await page.keyboard.press('Escape');
	await expect(page.getByTestId('nodes-no-match')).toBeVisible();
	await expect(page.getByTestId('nodes-no-match')).toContainText(/no matching nodes/i);

	// Edges no-match: chip an endpoint, then delete it so the chip goes stale.
	await page.goto('/');
	await applyGeneratedGraph(page, 'cycle', { nodes: 3 });
	await openTool(page, 'edges');
	await page.getByTestId('edges-search-open').click();
	const firstOptionTestId =
		(await page
			.locator('.list-search-results .list-search-option')
			.first()
			.getAttribute('data-testid')) ?? '';
	const endpointId = firstOptionTestId.replace('edges-search-node-', '');
	await page.getByTestId(`edges-search-node-${endpointId}`).click();
	await page.keyboard.press('Escape');
	await openTool(page, 'nodes');
	await page.getByTestId(`delete-node-row-${endpointId}`).click();
	await openTool(page, 'edges');
	await expect(page.getByTestId('edges-no-match')).toBeVisible();
	await expect(page.getByTestId('edges-no-match')).toContainText(/no matching edges/i);
});
