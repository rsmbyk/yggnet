import { expect, test } from '@playwright/test';
import { openTool } from './open-tool';

test('named save and load with overwrite confirm', async ({ page }) => {
	await page.goto('/');
	await openTool(page, 'nodes');

	await page.getByTestId('add-node').click();
	await expect(page.getByTestId('world-node-sheet')).toBeVisible();
	await page.getByTestId('node-label').fill('Falcon');

	const slot = 'e2e-named-slot';
	await openTool(page, 'file');
	await page.getByTestId('save-slot-name').fill(slot);
	await page.getByTestId('save-named').click();
	const savedRow = page.locator('[data-testid="save-slot-row"]', { hasText: slot });
	await expect(savedRow).toBeVisible();

	await openTool(page, 'nodes');
	await page.getByTestId('add-node').click();
	await expect(page.getByTestId('node-list').locator('li')).toHaveCount(2);

	page.once('dialog', (dialog) => {
		expect(dialog.type()).toBe('confirm');
		void dialog.accept();
	});
	await openTool(page, 'file');
	await savedRow.getByTestId('slot-load').click();

	await openTool(page, 'nodes');
	await expect(page.getByTestId('node-list').locator('li')).toHaveCount(1);
	await expect(page.getByTestId('node-list')).toContainText('Falcon');
	await page.getByTestId('node-list').locator('button.list-item').first().click();
	await expect(page.getByTestId('node-label')).toHaveValue('Falcon');
});

test('named save can be deleted from the file list', async ({ page }) => {
	await page.goto('/');
	await openTool(page, 'file');
	const slot = 'e2e-delete-slot';
	await page.getByTestId('save-slot-name').fill(slot);
	await page.getByTestId('save-named').click();
	const row = page.locator('[data-testid="save-slot-row"]', { hasText: slot });
	await expect(row).toBeVisible();
	page.once('dialog', (dialog) => {
		expect(dialog.type()).toBe('confirm');
		expect(dialog.message()).toContain(slot);
		void dialog.accept();
	});
	await row.getByTestId('slot-delete').click();
	await expect(row).toHaveCount(0);
});

test('deleting a saved graph can be cancelled', async ({ page }) => {
	await page.goto('/');
	await openTool(page, 'file');
	const slot = 'e2e-keep-slot';
	await page.getByTestId('save-slot-name').fill(slot);
	await page.getByTestId('save-named').click();
	const row = page.locator('[data-testid="save-slot-row"]', { hasText: slot });
	await expect(row).toBeVisible();
	page.once('dialog', (dialog) => {
		expect(dialog.type()).toBe('confirm');
		expect(dialog.message()).toContain(slot);
		void dialog.dismiss();
	});
	await row.getByTestId('slot-delete').click();
	await expect(row).toBeVisible();
});

test('enter in the slot name field saves', async ({ page }) => {
	await page.goto('/');
	await openTool(page, 'file');
	const slot = 'e2e-enter-slot';
	const field = page.getByTestId('save-slot-name');
	await field.fill(slot);
	await field.press('Enter');
	await expect(page.locator('[data-testid="save-slot-row"]', { hasText: slot })).toBeVisible();
});

test('saving an existing slot name asks to replace it', async ({ page }) => {
	await page.goto('/');
	await openTool(page, 'file');
	const slot = 'e2e-overwrite-slot';
	const field = page.getByTestId('save-slot-name');
	await field.fill(slot);
	await page.getByTestId('save-named').click();
	await expect(page.locator('[data-testid="save-slot-row"]', { hasText: slot })).toBeVisible();

	page.once('dialog', (dialog) => {
		expect(dialog.type()).toBe('confirm');
		expect(dialog.message()).toContain(slot);
		void dialog.dismiss();
	});
	await page.getByTestId('save-named').click();
	await expect(page.locator('[data-testid="save-slot-row"]', { hasText: slot })).toBeVisible();
});

test('saved graph list fills the remaining file column', async ({ page }) => {
	await page.goto('/');
	await openTool(page, 'file');
	const slot = 'e2e-fill-slot';
	await page.getByTestId('save-slot-name').fill(slot);
	await page.getByTestId('save-named').click();
	const panel = page.getByTestId('yggnet-manager');
	const list = page.getByTestId('save-slot-list');
	await expect(list).toBeVisible();
	const panelBox = await panel.boundingBox();
	const listBox = await list.boundingBox();
	expect(panelBox).toBeTruthy();
	expect(listBox).toBeTruthy();
	const bottomGap = panelBox!.y + panelBox!.height - (listBox!.y + listBox!.height);
	expect(bottomGap).toBeGreaterThanOrEqual(8);
	expect(bottomGap).toBeLessThanOrEqual(24);
	expect(listBox!.height).toBeGreaterThan(160);
	await expect(list).toHaveCSS('max-height', 'none');
});

test('saved graph rows highlight on hover', async ({ page }) => {
	await page.goto('/');
	await openTool(page, 'file');
	const slot = 'e2e-hover-slot';
	await page.getByTestId('save-slot-name').fill(slot);
	await page.getByTestId('save-named').click();
	const row = page.locator('[data-testid="save-slot-row"]', { hasText: slot });
	await expect(row).toBeVisible();
	await row.hover();
	await expect(row).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.28)');
});

test('palette find jumps to matching node', async ({ page }) => {
	await page.goto('/');
	await openTool(page, 'nodes');
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
	await expect(page.getByTestId('world-node-sheet')).toBeVisible();
	await expect(page.getByTestId('node-label')).toHaveValue('ZebraNode');
});
