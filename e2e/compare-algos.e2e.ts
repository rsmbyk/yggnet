import { expect, test } from '@playwright/test';
import { openTool } from './open-tool';

test('compare two algorithms shows dual summary and dismisses', async ({ page }) => {
	await page.goto('/');
	await openTool(page, 'templates');
	await page.getByTestId('tpl-learning').click();
	await openTool(page, 'pathfinder');

	const fromSelect = page.getByTestId('path-from');
	const toSelect = page.getByTestId('path-to');
	const fromValue = await fromSelect.locator('option').nth(1).getAttribute('value');
	const toValue = await toSelect.locator('option').nth(2).getAttribute('value');
	if (!fromValue || !toValue) throw new Error('Learning template missing nodes');
	await fromSelect.selectOption(fromValue);
	await toSelect.selectOption(toValue);

	await openTool(page, 'analyze');
	await expect(page.getByTestId('analyze-panel')).toBeVisible();

	await page.getByTestId('algo-picker').selectOption('bfs');
	await page.getByTestId('compare-algo').selectOption('dijkstra');
	await page.getByTestId('compare-algos').click();

	await expect(page.getByTestId('compare-panel')).toBeVisible();
	await expect(page.getByTestId('compare-series-a')).toContainText('bfs');
	await expect(page.getByTestId('compare-series-b')).toContainText('dijkstra');

	await page.getByTestId('clear-compare').click();
	await expect(page.getByTestId('compare-panel')).not.toBeVisible();
});
