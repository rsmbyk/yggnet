import { expect, test } from '@playwright/test';
import { openTool } from './open-tool';

async function seedNamedSaves(page: import('@playwright/test').Page, count: number) {
	await page.evaluate((n) => {
		const raw = localStorage.getItem('yggnet.autosave');
		const payload =
			raw ??
			JSON.stringify({
				schemaVersion: 1,
				id: 'e2e',
				title: 'Untitled graph',
				nodes: {},
				edges: {},
				createdAt: '2026-01-01T00:00:00.000Z',
				updatedAt: '2026-01-01T00:00:00.000Z'
			});
		for (let i = 0; i < n; i += 1) {
			localStorage.setItem(`yggnet.save.bulk-${String(i).padStart(2, '0')}`, payload);
		}
	}, count);
}

test('short tools panel hugs content and stays above the minimap', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });
	await openTool(page, 'generate');
	const panel = page.getByTestId('yggnet-manager');
	const camera = page.getByTestId('camera-panel');
	await expect(panel).toBeVisible();
	const card = await panel.boundingBox();
	const cam = await camera.boundingBox();
	expect(card).toBeTruthy();
	expect(cam).toBeTruthy();
	expect(card!.y + card!.height).toBeLessThan(cam!.y - 8);
	await expect(page.getByTestId('tools-panel-expand')).toHaveCount(0);
});

test('Generate stays above the minimap when a type has more fields', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });
	await openTool(page, 'generate');
	await page.getByTestId('generate-kind').selectOption('communities');
	const panel = page.getByTestId('yggnet-manager');
	const camera = page.getByTestId('camera-panel');
	await expect(panel.getByText('p inside', { exact: true })).toBeVisible();
	const card = await panel.boundingBox();
	const cam = await camera.boundingBox();
	expect(card).toBeTruthy();
	expect(cam).toBeTruthy();
	expect(card!.y + card!.height).toBeLessThanOrEqual(cam!.y - 8);
	await expect(panel.getByTestId('generate-submit')).toBeVisible();
});

test('overflowing tools panel stops above the minimap and can expand', async ({ page }) => {
	await page.goto('/');
	await seedNamedSaves(page, 24);
	await openTool(page, 'file');
	const panel = page.getByTestId('yggnet-manager');
	const camera = page.getByTestId('camera-panel');
	await expect(panel.getByTestId('save-slot-list')).toBeVisible();
	await expect(panel.locator('[data-testid="save-slot-row"]')).toHaveCount(24);

	const collapsed = await panel.boundingBox();
	const cam = await camera.boundingBox();
	expect(collapsed).toBeTruthy();
	expect(cam).toBeTruthy();
	expect(collapsed!.y + collapsed!.height).toBeLessThanOrEqual(cam!.y - 8);

	await page.getByTestId('tools-panel-expand').click();
	await expect(page.getByTestId('tools-panel-collapse')).toBeVisible();
	const expanded = await panel.boundingBox();
	expect(expanded).toBeTruthy();
	expect(expanded!.height).toBeGreaterThan(collapsed!.height);
	const bottomGap = page.viewportSize()!.height - (expanded!.y + expanded!.height);
	expect(bottomGap).toBeGreaterThanOrEqual(8);
	expect(bottomGap).toBeLessThanOrEqual(24);
});

test('switching tools hides the expand control when the new panel fits', async ({ page }) => {
	await page.goto('/');
	await seedNamedSaves(page, 24);
	await openTool(page, 'file');
	await page.getByTestId('tools-panel-expand').click();
	await expect(page.getByTestId('tools-panel-collapse')).toBeVisible();
	await openTool(page, 'generate');
	await expect(
		page.getByTestId('yggnet-manager').getByText('Generate', { exact: true })
	).toBeVisible();
	await expect(page.getByTestId('tools-panel-expand')).toHaveCount(0);
	await expect(page.getByTestId('tools-panel-collapse')).toHaveCount(0);
});
