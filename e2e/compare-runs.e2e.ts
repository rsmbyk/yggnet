import { expect, test } from '@playwright/test';

test('compare two stored runs shows dual summary and dismisses', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-manager')).toBeVisible();

	await page.getByTestId('tpl-learning').click();
	await page.getByTestId('mode-directions').click();

	const fromSelect = page.getByTestId('path-from');
	const toSelect = page.getByTestId('path-to');
	const fromValue = await fromSelect.locator('option').nth(1).getAttribute('value');
	const toValue = await toSelect.locator('option').nth(2).getAttribute('value');
	if (!fromValue || !toValue) throw new Error('Learning template missing nodes');
	await fromSelect.selectOption(fromValue);
	await toSelect.selectOption(toValue);

	await page.getByTestId('mode-analyze').click();
	await expect(page.getByTestId('analyze-panel')).toBeVisible();

	await page.getByTestId('algo-picker').selectOption('bfs');
	await page.getByTestId('run-algo').click();
	await page.getByTestId('algo-picker').selectOption('dijkstra');
	await page.getByTestId('run-algo').click();

	await expect(page.getByTestId('compare-runs-section')).toBeVisible();

	const runA = page.getByTestId('compare-run-a');
	const runB = page.getByTestId('compare-run-b');
	const optionA = await runA.locator('option').nth(0).getAttribute('value');
	const optionB = await runB.locator('option').nth(1).getAttribute('value');
	if (!optionA || !optionB) throw new Error('Expected two stored runs');
	await runA.selectOption(optionA);
	await runB.selectOption(optionB);

	await page.getByTestId('compare-runs').click();

	await expect(page.getByTestId('compare-panel')).toBeVisible();
	await expect(page.getByTestId('compare-series-a')).toContainText('bfs');
	await expect(page.getByTestId('compare-series-b')).toContainText('dijkstra');

	await page.getByTestId('clear-compare').click();
	await expect(page.getByTestId('compare-panel')).not.toBeVisible();
});
