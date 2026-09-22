import { expect, test } from '@playwright/test';
import { openTool } from './open-tool';

test('Communities Groups follows node count and explains p inside / p between', async ({
	page
}) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });
	await openTool(page, 'generate');
	await page.getByTestId('generate-kind').selectOption('communities');
	const groups = page.getByTestId('generate-groups');
	await expect(groups).toBeVisible();
	await expect(groups).not.toHaveAttribute('max', '8');
	await expect(groups).toHaveAttribute('max', '12');
	await page.getByTestId('generate-nodes').fill('20');
	await expect(groups).toHaveAttribute('max', '20');
	await expect(page.getByTestId('generate-p-inside-help')).toContainText(/same group/i);
	await expect(page.getByTestId('generate-p-between-help')).toContainText(/different groups/i);
});

test('Generate explains the selected type under the dropdown', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });
	await openTool(page, 'generate');
	const help = page.getByTestId('generate-kind-help');
	await expect(page.getByTestId('generate-kind')).toHaveValue('simple');
	await expect(help).toBeVisible();
	await expect(help).toContainText(/density/i);
	await page.getByTestId('generate-kind').selectOption('cycle');
	await expect(help).toContainText(/loop/i);
	await page.getByTestId('generate-kind').selectOption('petersen');
	await expect(help).toContainText(/10-vertex/i);
});

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

test('Generate lists named graphs on the type dropdown', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });
	await openTool(page, 'generate');
	await expect(page.getByTestId('generate-kind')).toContainText('Petersen');
	await expect(page.getByTestId('generate-named')).toHaveCount(0);
	await page.getByTestId('generate-kind').selectOption('petersen');
	await expect(page.getByTestId('generate-kind')).toHaveValue('petersen');
	await expect(page.getByTestId('generate-kind').locator('optgroup').last()).toHaveAttribute(
		'label',
		'Named'
	);
});

test('Generate offers 2D only for prism, hypercube, and Goldner–Harary', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });
	await openTool(page, 'generate');
	await expect(page.getByTestId('generate-planar')).toHaveCount(0);
	await page.getByTestId('generate-kind').selectOption('prism');
	await expect(page.getByTestId('generate-planar')).toBeVisible();
	await page.getByTestId('generate-kind').selectOption('hypercube');
	await expect(page.getByTestId('generate-planar')).toBeVisible();
	await page.getByTestId('generate-kind').selectOption('goldnerHarary');
	await expect(page.getByTestId('generate-planar')).toBeVisible();
	await page.getByTestId('generate-kind').selectOption('simple');
	await expect(page.getByTestId('generate-planar')).toHaveCount(0);
});

test('Generate toasts Generated and replaces the graph', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });
	await openTool(page, 'generate');
	await page.getByTestId('generate-kind').selectOption('cycle');
	await page.getByTestId('generate-submit').click();
	await expect(page.getByTestId('status-message')).toHaveText('Generated');
	await expect(page).toHaveTitle(/Cycle/);
});

test('Generate stretches a lone field across the row', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });
	await openTool(page, 'generate');
	const fields = page.getByTestId('generate-fields');
	await page.getByTestId('generate-kind').selectOption('prism');
	const typeBox = await page.getByTestId('generate-kind').boundingBox();
	const sidesBox = await page.getByLabel('Sides').boundingBox();
	expect(typeBox).toBeTruthy();
	expect(sidesBox).toBeTruthy();
	expect(Math.abs(sidesBox!.width - typeBox!.width)).toBeLessThan(12);
	await expect
		.poll(async () => fields.evaluate((el) => el.scrollWidth <= el.clientWidth + 1))
		.toBe(true);
	await page.getByTestId('generate-kind').selectOption('grid');
	const rowsBox = await page.getByTestId('generate-rows').boundingBox();
	const colsBox = await page.getByTestId('generate-columns').boundingBox();
	expect(rowsBox).toBeTruthy();
	expect(colsBox).toBeTruthy();
	expect(rowsBox!.width).toBeLessThan(typeBox!.width * 0.7);
	expect(Math.abs(rowsBox!.width - colsBox!.width)).toBeLessThan(12);
	await expect
		.poll(async () => fields.evaluate((el) => el.scrollWidth <= el.clientWidth + 1))
		.toBe(true);
});
