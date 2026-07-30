import { expect, test } from '@playwright/test';

test('relayout moves unpinned nodes but keeps pinned fixed', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-manager')).toBeVisible();

	await page.getByTestId('add-node').click();
	await page.getByTestId('node-pos-x').fill('10');
	await page.getByTestId('node-pos-y').fill('1');
	await page.getByTestId('node-pos-z').fill('20');
	await page.getByTestId('node-pin').check();

	await page.getByTestId('add-node').click();
	const unpinnedX = page.getByTestId('node-pos-x');
	const beforeX = await unpinnedX.inputValue();

	await page.getByTestId('relayout').click();
	await expect(page.getByTestId('status-message')).toContainText('Re-layout applied');

	await page.getByRole('button', { name: /Node 1/ }).click();
	await expect(page.getByTestId('node-pos-x')).toHaveValue('10');
	await expect(page.getByTestId('node-pos-y')).toHaveValue('1');
	await expect(page.getByTestId('node-pos-z')).toHaveValue('20');

	await page.getByRole('button', { name: /Node 2/ }).click();
	await expect(page.getByTestId('node-pos-x')).not.toHaveValue(beforeX);
});
