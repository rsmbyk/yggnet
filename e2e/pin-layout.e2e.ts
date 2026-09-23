import { expect, test } from '@playwright/test';
import { openTool } from './open-tool';

test('relayout moves unpinned nodes but keeps pinned fixed', async ({ page }) => {
	await page.goto('/');
	await openTool(page, 'nodes');

	await page.getByTestId('add-node').click();
	await page.getByTestId('node-pos-x').fill('10');
	await page.getByTestId('node-pos-y').fill('1');
	await page.getByTestId('node-pos-z').fill('20');

	const pinnedId = await page
		.getByTestId('node-list')
		.locator('button.list-item')
		.first()
		.getAttribute('data-testid');
	expect(pinnedId).toBeTruthy();
	const nodeId = pinnedId!.replace('node-item-', '');
	await page.evaluate((id) => window.__YGGNET_PIN_NODE?.(id, true), nodeId);

	await page.getByTestId('add-node').click();
	const unpinnedX = page.getByTestId('node-pos-x');
	const beforeX = await unpinnedX.inputValue();

	await page.evaluate(() => window.__YGGNET_RELAYOUT?.());
	await expect(page.getByTestId('status-message')).toContainText('Re-layout applied');

	await page.getByTestId('node-list').locator('button.list-item', { hasText: 'Node 1' }).click();
	await expect(page.getByTestId('node-pos-x')).toHaveValue('10');
	await expect(page.getByTestId('node-pos-y')).toHaveValue('1');
	await expect(page.getByTestId('node-pos-z')).toHaveValue('20');

	await page.getByTestId('node-list').locator('button.list-item', { hasText: 'Node 2' }).click();
	await expect(page.getByTestId('node-pos-x')).not.toHaveValue(beforeX);
});
