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

	await page.getByTestId('tags-toggle-focus-alpha').click();
	await expect(page.getByTestId('tags-row-alpha')).toHaveClass(/focused/);
	await expect(page.getByTestId('tags-row-beta')).toHaveClass(/dimmed/);
	await expect(page.getByTestId('tags-focus-reset')).toBeEnabled();

	await page.getByTestId('tags-show-only-beta').click();
	await expect(page.getByTestId('tags-row-beta')).toHaveClass(/focused/);
	await expect(page.getByTestId('tags-row-alpha')).toHaveClass(/dimmed/);

	await page.getByTestId('tags-row-open-alpha').click();
	await expect(page.getByTestId('tag-edit-panel')).toBeVisible();
	await page.getByTestId('tag-edit-input').fill('beta');
	await expect(page.getByTestId('tag-edit-helper')).toContainText(/already exists/i);
	await expect(page.getByTestId('tag-edit-save')).toBeDisabled();

	await page.getByTestId('tag-edit-input').fill('gamma');
	await expect(page.getByTestId('tag-edit-helper')).toContainText(/available/i);
	await page.getByTestId('tag-edit-save').click();
	await expect(page.getByTestId('tags-row-gamma')).toBeVisible();
	await expect(page.getByTestId('tags-row-alpha')).toHaveCount(0);

	await page.getByTestId('tags-delete-beta').click();
	await expect(page.getByTestId('tags-row-beta')).toHaveCount(0);
	await expect(page.getByTestId('tags-focus-reset')).toBeDisabled();
});

test('Nodes list search shows Nodes and Tags optgroups', async ({ page }) => {
	await page.goto('/');
	await applyGeneratedGraph(page, 'cycle', { nodes: 3 });
	await openTool(page, 'nodes');
	await page.getByTestId('node-list').locator('button.list-item').first().click();
	await addTagOnSelectedNode(page, 'shared');

	await page.getByTestId('nodes-search-open').click();
	await expect(page.getByTestId('nodes-search')).toBeVisible();
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
