import { expect, test } from '@playwright/test';

test('set node position via manager inputs', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-manager')).toBeVisible();

	await page.getByTestId('add-node').click();
	await expect(page.getByTestId('node-editor')).toBeVisible();

	const posX = page.getByTestId('node-pos-x');
	await posX.fill('5');
	await expect(posX).toHaveValue('5');

	const posY = page.getByTestId('node-pos-y');
	await posY.fill('2.5');
	await expect(posY).toHaveValue('2.5');

	const posZ = page.getByTestId('node-pos-z');
	await posZ.fill('-3');
	await expect(posZ).toHaveValue('-3');
});
