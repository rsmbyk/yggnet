import { expect, test } from '@playwright/test';

test('multi-select group collapse and expand', async ({ page }) => {
	await page.goto('/');
	await page.getByTestId('add-node').click();
	await page.getByTestId('add-node').click();

	const items = page.getByTestId('node-list').locator('li button');
	const first = items.nth(0);
	const second = items.nth(1);

	await first.click();
	await second.click({ modifiers: ['ControlOrMeta'] });
	await expect(page.getByTestId('selection-count')).toHaveText(/2 selected/);

	await page.getByTestId('group-multi').click();
	await expect(page.getByTestId('status-message')).toHaveText(/Grouped 2 nodes/);
	await expect(page.getByTestId('groups-section')).toBeVisible();

	const collapseBtn = page.locator('[data-testid^="collapse-group-"]');
	await expect(collapseBtn).toBeVisible();
	const collapseTestId = await collapseBtn.getAttribute('data-testid');
	expect(collapseTestId).toBeTruthy();
	const groupId = collapseTestId!.replace('collapse-group-', '');

	await collapseBtn.click();
	await expect(page.getByTestId(`expand-group-${groupId}`)).toBeVisible();

	await page.getByTestId(`expand-group-${groupId}`).click();
	await expect(page.getByTestId(`collapse-group-${groupId}`)).toBeVisible();

	await page.getByTestId('ungroup-' + groupId).click();
	await expect(page.getByTestId('groups-section')).not.toBeVisible();
});

test('group requires at least two selected nodes', async ({ page }) => {
	await page.goto('/');
	await page.getByTestId('add-node').click();

	const first = page.getByTestId('node-list').locator('li button').first();
	await first.click();
	await expect(page.getByTestId('group-multi')).not.toBeVisible();
});
