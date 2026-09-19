import { expect, test } from '@playwright/test';
import { openTool } from './open-tool';

test('world selection sheet hides while a tool panel is open', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });

	await page.getByTestId('world-add-node').click();
	await expect(page.getByTestId('world-node-sheet')).toBeVisible();

	await openTool(page, 'nodes');
	await expect(page.getByTestId('yggnet-manager')).toBeVisible();
	await expect(
		page.getByTestId('yggnet-manager').getByText('Nodes', { exact: true })
	).toBeVisible();
	await expect(page.getByTestId('world-node-sheet')).toHaveCount(0);
	await expect(page.getByTestId('node-editor')).toBeVisible();
	await expect(page.getByTestId('node-connect')).toBeVisible();

	await page.getByTestId('close-manager').click();
	await expect(page.getByTestId('yggnet-manager')).toHaveCount(0);
	await expect(page.getByTestId('world-node-sheet')).toBeVisible();
});

test('tool panel sits right of the toolbar under the menubar', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });
	await openTool(page, 'nodes');
	const menubar = page.getByTestId('world-add-node');
	const toolbar = page.getByTestId('yggnet-toolbar');
	const panel = page.getByTestId('yggnet-manager');
	await expect(panel).toBeVisible();
	const bar = await menubar.boundingBox();
	const rail = await toolbar.boundingBox();
	const card = await panel.boundingBox();
	expect(bar).toBeTruthy();
	expect(rail).toBeTruthy();
	expect(card).toBeTruthy();
	const gapUnderMenubar = card!.y - (bar!.y + bar!.height);
	expect(gapUnderMenubar).toBeGreaterThanOrEqual(8);
	expect(gapUnderMenubar).toBeLessThanOrEqual(20);
	expect(rail!.x).toBeLessThan(bar!.x + 8);
	expect(rail!.x + rail!.width).toBeLessThanOrEqual(card!.x + 2);
	expect(card!.height).toBeLessThan(page.viewportSize()!.height * 0.85);
	const icon = await page.getByTestId('tool-nodes').boundingBox();
	expect(icon).toBeTruthy();
	const innerPadX = (rail!.width - icon!.width) / 2;
	expect(innerPadX).toBeGreaterThanOrEqual(6);
	await expect(toolbar).toHaveClass(/engaged/);
	await page.getByTestId('tool-edges').click();
	await expect(
		page.getByTestId('yggnet-manager').getByText('Edges', { exact: true })
	).toBeVisible();
});
