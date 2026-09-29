import { expect, test, type Locator } from '@playwright/test';
import { applyGeneratedGraph, openTool } from './open-tool';

async function chooseFirst(select: Locator) {
	const value = await select.locator('option').nth(1).getAttribute('value');
	if (!value) throw new Error('Expected a graph node option');
	await select.selectOption(value);
	return value;
}

test('one Analyze tool runs BFS and exposes reversible trace playback', async ({ page }) => {
	await page.goto('/');
	await applyGeneratedGraph(page, 'grid', { rows: 3, columns: 3 });
	await expect(page.getByTestId('tool-pathfinder')).toHaveCount(0);
	await openTool(page, 'analyze');
	await expect(page.getByTestId('analysis-picker')).toContainText('BFS Traversal');
	await expect(page.getByTestId('analysis-picker')).toContainText('Dijkstra Shortest Path');
	await chooseFirst(page.getByTestId('analysis-field-start'));
	await page.getByTestId('run-analysis').click();

	await expect(page.getByTestId('analysis-result-panel')).toBeVisible();
	await expect(page.getByTestId('analysis-result')).toContainText('Visited');
	await expect(page.getByTestId('tool-nodes')).toBeDisabled();
	await page.getByTestId('open-trace').click();
	await expect(page.getByTestId('analysis-inspectors')).toContainText('queue');
	await page.getByTestId('trace-next').click();
	await expect(page.getByTestId('trace-scrubber')).toHaveValue('1');
	await page.getByTestId('trace-previous').click();
	await expect(page.getByTestId('trace-scrubber')).toHaveValue('0');
	await page.getByTestId('trace-speed').selectOption('2');
	await page.getByTestId('trace-play').click();
	await expect(page.getByTestId('trace-play')).toHaveText('Pause');

	await page.getByTestId('close-analysis').click();
	await expect(page.getByTestId('analysis-result-panel')).toHaveCount(0);
	await expect(page.getByTestId('analyze-panel')).toBeVisible();
	await expect(page.getByTestId('view-last-analysis')).toBeVisible();
});

test('Dijkstra reports edge length and total cost', async ({ page }) => {
	await page.goto('/');
	await applyGeneratedGraph(page, 'grid', { rows: 2, columns: 2 });
	await openTool(page, 'analyze');
	await page.getByTestId('analysis-picker').selectOption('dijkstra');
	const start = page.getByTestId('analysis-field-start');
	const end = page.getByTestId('analysis-field-end');
	await chooseFirst(start);
	const endValue = await end.locator('option').nth(2).getAttribute('value');
	if (!endValue) throw new Error('Expected an end node');
	await end.selectOption(endValue);
	await page.getByTestId('run-analysis').click();
	await expect(page.getByTestId('analysis-result')).toContainText('Length');
	await expect(page.getByTestId('analysis-result')).toContainText('Cost');
});
