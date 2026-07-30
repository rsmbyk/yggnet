import { expect, test } from '@playwright/test';

test('ctrl-click multi-selects nodes in manager', async ({ page }) => {
	await page.goto('/');
	await page.getByTestId('add-node').click();
	await page.getByTestId('add-node').click();
	await page.getByTestId('add-node').click();

	const items = page.getByTestId('node-list').locator('li button');
	const first = items.nth(0);
	const second = items.nth(1);
	const firstId = await first.getAttribute('data-testid');
	const secondId = await second.getAttribute('data-testid');
	expect(firstId).toBeTruthy();
	expect(secondId).toBeTruthy();

	await first.click();
	await expect(page.getByTestId('selection-count')).toHaveText(/1 selected/);

	await second.click({ modifiers: ['ControlOrMeta'] });
	await expect(page.getByTestId('selection-count')).toHaveText(/2 selected/);
	await expect(page.getByTestId('group-multi')).toBeVisible();
});
