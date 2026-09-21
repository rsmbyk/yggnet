import { expect, test } from '@playwright/test';
import { openTool } from './open-tool';

test('Generate remembers type and options after closing the panel', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });
	await openTool(page, 'generate');
	await page.getByTestId('generate-kind').selectOption('grid');
	await page.getByTestId('generate-rows').fill('3');
	await page.getByTestId('generate-columns').fill('5');
	await openTool(page, 'file');
	await expect(page.getByTestId('yggnet-manager').getByText('File', { exact: true })).toBeVisible();
	await openTool(page, 'generate');
	await expect(page.getByTestId('generate-kind')).toHaveValue('grid');
	await expect(page.getByTestId('generate-rows')).toHaveValue('3');
	await expect(page.getByTestId('generate-columns')).toHaveValue('5');
});
