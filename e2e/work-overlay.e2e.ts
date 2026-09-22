import { expect, test } from '@playwright/test';
import { openTool } from './open-tool';

test('startup load overlay clears once the world is ready', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });
	await expect(page.getByTestId('work-overlay')).toHaveCount(0);
});

test('generate overlay has no cancel and clears when the graph is ready', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });
	await openTool(page, 'generate');
	await page.getByTestId('generate-kind').selectOption('cycle');
	const titleBefore = await page.title();
	await page.getByTestId('generate-submit').click();
	const overlay = page.getByTestId('work-overlay');
	await expect(overlay).toBeVisible();
	await expect(overlay).toContainText(/generating/i);
	await expect(page.getByTestId('work-overlay-cancel')).toHaveCount(0);
	await expect(overlay).toHaveCount(0, { timeout: 15_000 });
	await expect(page).toHaveTitle(/cycle/i);
	expect(await page.title()).not.toBe(titleBefore);
});

test('unload is blocked while the overlay is up', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });
	await openTool(page, 'generate');
	await page.getByTestId('generate-kind').selectOption('cycle');
	await page.evaluate(() => {
		window.__YGGNET_BUSY_HOLD_MS = 20_000;
	});
	await page.getByTestId('generate-submit').click();
	await expect(page.getByTestId('work-overlay')).toBeVisible();
	const blocked = await page.evaluate(() => {
		const event = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
		window.dispatchEvent(event);
		return event.defaultPrevented;
	});
	expect(blocked).toBe(true);
});
