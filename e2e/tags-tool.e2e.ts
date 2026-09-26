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

test('Tags tool lists usage, focuses, renames, and deletes', async ({ page }) => {
	await page.goto('/');
	await applyGeneratedGraph(page, 'cycle', { nodes: 3 });

	await openTool(page, 'nodes');
	await page.getByTestId('node-list').locator('button.list-item').first().click();
	await addTagOnSelectedNode(page, 'alpha');
	await page.getByTestId('node-list').locator('button.list-item').nth(1).click();
	await addTagOnSelectedNode(page, 'beta');

	await openTool(page, 'tags');
	await expect(page.getByTestId('tags-section')).toBeVisible();
	await expect(page.getByTestId('tags-list')).toBeVisible();
	await expect(page.getByTestId('tags-row-alpha')).toBeVisible();
	await expect(page.getByTestId('tags-row-beta')).toBeVisible();
	await expect(page.getByTestId('tags-focus-reset')).toBeDisabled();

	const tagsSearch = page.getByTestId('tags-search');
	await expect(tagsSearch.locator('xpath=ancestor::header')).toHaveClass(/manager__header/);
	const tagsSearchField = page.getByTestId('tags-search-field');
	await expect(tagsSearchField).toHaveCSS('border-top-width', '1px');
	await expect(tagsSearchField).toHaveCSS('padding-top', '4px');
	const idleSearchBorder = await tagsSearchField.evaluate(
		(element) => getComputedStyle(element).borderTopColor
	);
	await tagsSearch.fill('beta');
	await expect(page.getByTestId('tags-row-beta')).toBeVisible();
	await expect(page.getByTestId('tags-row-alpha')).toHaveCount(0);
	await tagsSearch.clear();
	await tagsSearch.focus();
	await expect(tagsSearchField).toHaveCSS('border-top-width', '1px');
	await expect
		.poll(() => tagsSearchField.evaluate((element) => getComputedStyle(element).borderTopColor))
		.not.toBe(idleSearchBorder);

	await page.getByTestId('tags-toggle-focus-alpha').click();
	await expect(page.getByTestId('tags-row-alpha')).toHaveClass(/focused/);
	await expect(page.getByTestId('tags-row-beta')).toHaveClass(/dimmed/);
	await expect(page.getByTestId('tags-focus-reset')).toBeEnabled();
	await expect(page.getByTestId('tag-edit-panel')).toHaveCount(0);

	await page.getByTestId('tags-show-only-beta').click();
	await expect(page.getByTestId('tags-row-beta')).toHaveClass(/focused/);
	await expect(page.getByTestId('tags-row-alpha')).toHaveClass(/dimmed/);
	await expect(page.getByTestId('tag-edit-panel')).toHaveCount(0);

	await page.getByTestId('tags-row-open-beta').focus();
	await expect(page.getByTestId('tags-row-open-beta')).toBeFocused();
	await expect(page.getByTestId('tags-row-beta')).toHaveCSS('outline-style', 'solid');
	await page.keyboard.press('Enter');
	await expect(page.getByTestId('tag-edit-panel').locator('.brand')).toHaveText('beta');
	await openTool(page, 'tags');

	await page.getByTestId('tags-row-alpha').click({ position: { x: 2, y: 2 } });
	await expect(page.getByTestId('tag-edit-panel')).toBeVisible();
	await expect(page.getByTestId('tag-edit-panel').locator('.brand')).toHaveText('alpha');
	await expect(page.getByTestId('tag-edit-helper')).toContainText(/letters, digits, and hyphens/i);
	await expect(page.getByTestId('tag-edit-helper')).not.toContainText(/same as original/i);
	await expect(page.getByTestId('tag-edit-helper')).toHaveCSS('margin-top', '2px');
	await expect(page.getByTestId('tag-edit-helper')).toHaveCSS('margin-bottom', '2px');
	await page.getByTestId('tag-edit-input').fill('beta');
	await expect(page.getByTestId('tag-edit-panel').locator('.brand')).toHaveText('alpha');
	await expect(page.getByTestId('tag-edit-helper')).toContainText(/already exists/i);
	await expect(page.getByTestId('tag-edit-save')).toBeDisabled();

	await page.getByTestId('tag-edit-input').fill('gamma');
	await expect(page.getByTestId('tag-edit-helper')).toContainText(/available/i);
	await page.getByTestId('tag-edit-save').click();
	await expect(page.getByTestId('tags-row-gamma')).toBeVisible();
	await expect(page.getByTestId('tags-row-alpha')).toHaveCount(0);
	await page.getByTestId('tags-row-gamma').locator('.tags-tool-label').click();
	await expect(page.getByTestId('tag-edit-panel').locator('.brand')).toHaveText('gamma');
	await page.keyboard.press('Escape');
	await openTool(page, 'tags');
	await page.getByTestId('tags-delete-beta').click();
	await expect(page.getByTestId('tag-edit-panel')).toHaveCount(0);
	await expect(page.getByTestId('tags-row-beta')).toHaveCount(0);
	await expect(page.getByTestId('tags-focus-reset')).toBeDisabled();
});

test('SPEC-051 manager layout polish', async ({ page }) => {
	await page.goto('/');
	await applyGeneratedGraph(page, 'cycle', { nodes: 3 });

	await openTool(page, 'nodes');
	await page.getByTestId('node-list').locator('button.list-item').first().click();
	await addTagOnSelectedNode(page, 'alpha');
	await page.getByTestId('node-list').locator('button.list-item').nth(1).click();
	await addTagOnSelectedNode(page, 'beta');

	await openTool(page, 'tags');

	// ITEM-054: search sits in its own full-width row below the title row.
	const headerRow = page.locator('header.manager__header .manager__header-row');
	const searchField = page.getByTestId('tags-search-field');
	const headerRowBox = await headerRow.boundingBox();
	const searchBox = await searchField.boundingBox();
	expect(searchBox!.y).toBeGreaterThanOrEqual(headerRowBox!.y + headerRowBox!.height - 2);

	// ITEM-055: label/meta do not overlap the row action buttons.
	const label = page.getByTestId('tags-row-alpha').locator('.tags-tool-label');
	const actions = page.getByTestId('tags-row-alpha').locator('.tags-tool-actions');
	const labelBox = await label.boundingBox();
	const actionsBox = await actions.boundingBox();
	expect(labelBox!.y + labelBox!.height).toBeLessThanOrEqual(actionsBox!.y + 1);

	// ITEM-057: Nodes/Edges header rows share one height so filters align.
	await openTool(page, 'nodes');
	const nodesHeaderBox = await page
		.locator('header.manager__header .manager__header-row')
		.boundingBox();
	await openTool(page, 'edges');
	const edgesHeaderBox = await page
		.locator('header.manager__header .manager__header-row')
		.boundingBox();
	expect(Math.abs(nodesHeaderBox!.height - edgesHeaderBox!.height)).toBeLessThanOrEqual(1);

	// ITEM-059 + ITEM-060: helper spacing and success color.
	await openTool(page, 'tags');
	await page.getByTestId('tags-row-open-alpha').click();
	const helper = page.getByTestId('tag-edit-helper');
	const input = page.getByTestId('tag-edit-input');
	const save = page.getByTestId('tag-edit-save');
	const inputBox = await input.boundingBox();
	const helperBox = await helper.boundingBox();
	const saveBox = await save.boundingBox();
	expect(helperBox!.y - (inputBox!.y + inputBox!.height)).toBeLessThanOrEqual(8);
	expect(saveBox!.y - (helperBox!.y + helperBox!.height)).toBeLessThanOrEqual(10);
	await input.fill('gamma-new');
	await expect(helper).toContainText(/available/i);
	await expect(helper).toHaveCSS('color', 'rgb(30, 122, 100)');
});

test('SPEC-054 panel header row polish', async ({ page }) => {
	await page.goto('/');
	await applyGeneratedGraph(page, 'cycle', { nodes: 3 });

	await openTool(page, 'nodes');
	await page.getByTestId('node-list').locator('button.list-item').first().click();
	await addTagOnSelectedNode(page, 'alpha');

	await openTool(page, 'tags');

	// ITEM-061: tight header→content gaps.
	const headerRow = page.locator('header.manager__header .manager__header-row');
	const headerRowBox = await headerRow.boundingBox();
	const searchBox = await page.getByTestId('tags-search-field').boundingBox();
	expect(searchBox!.y - (headerRowBox!.y + headerRowBox!.height)).toBeLessThanOrEqual(5);
	await openTool(page, 'nodes');
	const nodesHeaderBox = await page
		.locator('header.manager__header .manager__header-row')
		.boundingBox();
	const nodesFilterBox = await page.getByTestId('nodes-search-open').boundingBox();
	expect(nodesFilterBox!.y - (nodesHeaderBox!.y + nodesHeaderBox!.height)).toBeLessThanOrEqual(5);
	// ITEM-057 alignment still holds.
	await openTool(page, 'edges');
	const edgesHeaderBox = await page
		.locator('header.manager__header .manager__header-row')
		.boundingBox();
	expect(Math.abs(nodesHeaderBox!.height - edgesHeaderBox!.height)).toBeLessThanOrEqual(1);

	// ITEM-062: the editor target covers the whole card.
	await openTool(page, 'tags');
	const row = page.getByTestId('tags-row-alpha');
	const main = page.getByTestId('tags-row-open-alpha');
	await main.focus();
	await expect(main).toBeFocused();
	await expect(row).toHaveCSS('outline-style', 'solid');
	const rowBox = await row.boundingBox();
	// Clicking the gap between two action buttons still opens the editor.
	const showOnlyBox = await page.getByTestId('tags-show-only-alpha').boundingBox();
	const toggleBox = await page.getByTestId('tags-toggle-focus-alpha').boundingBox();
	const gapX = Math.round((showOnlyBox!.x + showOnlyBox!.width + toggleBox!.x) / 2 - rowBox!.x);
	const gapY = Math.round(showOnlyBox!.y + showOnlyBox!.height / 2 - rowBox!.y);
	await row.click({ position: { x: gapX, y: gapY } });
	await expect(page.getByTestId('tag-edit-panel')).toBeVisible();
	await page.keyboard.press('Escape');
	await openTool(page, 'tags');
	// No overlap: label stays above the actions.
	const labelBox = await row.locator('.tags-tool-label').boundingBox();
	const actionsBox = await row.locator('.tags-tool-actions').boundingBox();
	expect(labelBox!.y + labelBox!.height).toBeLessThanOrEqual(actionsBox!.y + 1);
	// Row actions stay independent.
	await page.getByTestId('tags-toggle-focus-alpha').click();
	await expect(page.getByTestId('tag-edit-panel')).toHaveCount(0);
});

test('Nodes list search shows Nodes and Tags optgroups', async ({ page }) => {
	await page.goto('/');
	await applyGeneratedGraph(page, 'cycle', { nodes: 3 });
	await openTool(page, 'nodes');
	await page.getByTestId('node-list').locator('button.list-item').first().click();
	await addTagOnSelectedNode(page, 'shared');

	await page.getByTestId('nodes-search-open').click();
	await expect(page.getByTestId('nodes-search')).toBeVisible();
	// Spec: with suggestions shown, both the Nodes and Tags sections appear.
	await expect(page.getByTestId('nodes-search-group-nodes')).toBeVisible();
	await expect(page.getByTestId('nodes-search-group-tags')).toBeVisible();
	await expect(
		page.locator('.list-search-results .list-search-option:not(.list-search-option--tag)').first()
	).toBeVisible();
	await expect(page.getByTestId('list-search-tag-shared')).toContainText('Tag');

	// Typing narrows to matching suggestions; the shared tag stays reachable.
	await page.getByTestId('nodes-search').fill('shared');
	await expect(page.getByTestId('list-search-tag-shared')).toBeVisible();
	await expect(page.getByTestId('list-search-tag-shared')).toContainText('Tag');
});

test('TagPicker shares suggestions across nodes and edges', async ({ page }) => {
	await page.goto('/');
	await applyGeneratedGraph(page, 'cycle', { nodes: 3 });
	await openTool(page, 'nodes');
	await page.getByTestId('node-list').locator('button.list-item').first().click();
	await addTagOnSelectedNode(page, 'pool-tag');

	await openTool(page, 'edges');
	await page.getByTestId('edge-list').locator('button.list-item').first().click();
	const edgeSheet = page.getByTestId('world-edge-sheet');
	await expect(edgeSheet.getByTestId('edge-editor')).toBeVisible();
	await edgeSheet.getByTestId('node-tags-open').click();
	await expect(edgeSheet.getByTestId('node-tag-option-pool-tag')).toBeVisible();
});
