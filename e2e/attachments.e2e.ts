import { expect, test } from '@playwright/test';

test('add and remove node attachment via manager', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-manager')).toBeVisible();

	await page.getByTestId('add-node').click();
	await expect(page.getByTestId('node-editor')).toBeVisible();

	const list = page.getByTestId('attachment-list');
	await expect(list.locator('li')).toHaveCount(0);

	await page.getByTestId('attachment-name').fill('readme');
	await page.getByTestId('attachment-payload').fill('hello world');
	await page.getByTestId('add-attachment').click();

	await expect(list.locator('li')).toHaveCount(1);
	await expect(list).toContainText('readme');
	await expect(list).toContainText('hello world');

	await page.getByTestId('remove-attachment-0').click();
	await expect(list.locator('li')).toHaveCount(0);
});

test('attachment changes are undoable', async ({ page }) => {
	await page.goto('/');
	await page.getByTestId('add-node').click();

	await page.getByTestId('attachment-name').fill('note');
	await page.getByTestId('attachment-payload').fill('payload');
	await page.getByTestId('add-attachment').click();

	const list = page.getByTestId('attachment-list');
	await expect(list.locator('li')).toHaveCount(1);

	await page.getByTestId('undo').click();
	await expect(list.locator('li')).toHaveCount(0);

	await page.getByTestId('redo').click();
	await expect(list.locator('li')).toHaveCount(1);
});
