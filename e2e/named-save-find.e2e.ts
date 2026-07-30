import { expect, test } from '@playwright/test';

test('named save and load with overwrite confirm', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-manager')).toBeVisible();

	await page.getByTestId('add-node').click();
	await expect(page.getByTestId('node-editor')).toBeVisible();
	await page.getByTestId('node-label').fill('Falcon');

	const slot = 'e2e-named-slot';
	await page.getByTestId('save-slot-name').fill(slot);
	await page.getByTestId('save-named').click();

	await page.getByTestId('add-node').click();
	await expect(page.getByTestId('node-list').locator('li')).toHaveCount(2);

	page.once('dialog', (dialog) => {
		expect(dialog.type()).toBe('confirm');
		void dialog.accept();
	});
	await page.getByTestId('load-named').click();

	await expect(page.getByTestId('node-list').locator('li')).toHaveCount(1);
	await expect(page.getByTestId('node-list')).toContainText('Falcon');
	await page.getByTestId('node-list').locator('button').first().click();
	await expect(page.getByTestId('node-label')).toHaveValue('Falcon');
});

test('palette find jumps to matching node', async ({ page }) => {
	await page.goto('/');
	await page.getByTestId('add-node').click();
	await page.getByTestId('node-label').fill('ZebraNode');

	await page.getByTestId('palette-trigger').click();
	await expect(page.getByTestId('command-palette')).toBeVisible();
	await page.getByTestId('palette-input').fill('zebra');

	const results = page.getByTestId('palette-find-results');
	await expect(results).toBeVisible();
	await expect(results).toContainText('ZebraNode');

	await results.locator('button').first().click();
	await expect(page.getByTestId('command-palette')).not.toBeVisible();
	await expect(page.getByTestId('node-editor')).toBeVisible();
	await expect(page.getByTestId('node-label')).toHaveValue('ZebraNode');
});
