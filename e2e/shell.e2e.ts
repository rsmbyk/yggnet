import { expect, test } from '@playwright/test';
import { openTool } from './open-tool';

test('shell loads manager and world', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-shell')).toBeVisible();
	await expect(page.getByTestId('yggnet-toolbar')).toBeVisible();
	await expect(page.getByText('Yggnet')).toBeVisible();
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });
});

test('too-small overlay covers the app and clears when the window grows', async ({ page }) => {
	await page.setViewportSize({ width: 220, height: 600 });
	await page.goto('/');
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });
	await expect(page.getByTestId('viewport-too-small')).toBeVisible();
	await expect(page.getByTestId('viewport-too-small-copy')).toHaveText(
		"The app can't be used optimally on a small screen. Open it on a larger screen."
	);
	await page.setViewportSize({ width: 1280, height: 800 });
	await expect(page.getByTestId('viewport-too-small')).toBeHidden();
	await expect(page.getByTestId('world-add-node')).toBeVisible();
});

test('command palette opens from the keyboard', async ({ page }) => {
	await page.goto('/');
	await openTool(page, 'pathfinder');
	await expect(page.getByTestId('directions-panel')).toBeVisible();
	await page.keyboard.press('Control+K');
	await expect(page.getByTestId('command-palette')).toBeVisible();
});
