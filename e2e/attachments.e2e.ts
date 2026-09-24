import { expect, test } from '@playwright/test';
import { applyGeneratedGraph, openTool } from './open-tool';

test('add and remove edge attachment via manager', async ({ page }) => {
	await page.goto('/');
	await applyGeneratedGraph(page, 'cycle', { nodes: 4 });

	await openTool(page, 'edges');
	await page.getByTestId('edge-list').locator('button.list-item').first().click();
	await expect(page.getByTestId('edge-attachments-section')).toBeVisible();

	const list = page.getByTestId('edge-attachment-list');
	await expect(list.locator('li')).toHaveCount(0);

	await page.getByTestId('edge-attachment-name').fill('readme');
	await page.getByTestId('edge-attachment-payload').fill('hello world');
	await page.getByTestId('add-edge-attachment').click();

	await expect(list.locator('li')).toHaveCount(1);
	await expect(list).toContainText('readme');
	await expect(list).toContainText('hello world');

	await page.getByTestId('remove-edge-attachment-0').click();
	await expect(list.locator('li')).toHaveCount(0);
});

test('edge attachment changes are undoable', async ({ page }) => {
	await page.goto('/');
	await applyGeneratedGraph(page, 'cycle', { nodes: 4 });

	await openTool(page, 'edges');
	await page.getByTestId('edge-list').locator('button.list-item').first().click();

	await page.getByTestId('edge-attachment-name').fill('note');
	await page.getByTestId('edge-attachment-payload').fill('payload');
	await page.getByTestId('add-edge-attachment').click();

	const list = page.getByTestId('edge-attachment-list');
	await expect(list.locator('li')).toHaveCount(1);

	await page.getByTestId('undo').evaluate((el: HTMLButtonElement) => el.click());
	await expect(list.locator('li')).toHaveCount(0);

	await page.getByTestId('redo').evaluate((el: HTMLButtonElement) => el.click());
	await expect(list.locator('li')).toHaveCount(1);
});
