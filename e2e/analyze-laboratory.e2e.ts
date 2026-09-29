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
	await expect(
		page.getByTestId('analysis-result-panel').getByRole('heading', { level: 2 })
	).toHaveText('BFS Traversal');
	await expect(page.getByTestId('analysis-result')).toContainText('Visited');
	await expect(page.getByRole('button', { name: 'Replay' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Analyze steps' })).toHaveCount(0);
	await expect(page.getByTestId('skip-reveal')).toHaveCount(0);
	await expect(page.getByTestId('tool-nodes')).toBeDisabled();
	await expect(page.getByTestId('undo')).toBeDisabled();
	await expect(page.getByTestId('redo')).toBeDisabled();
	await expect(page.getByTestId('world-add-node')).toBeDisabled();
	await expect(page.getByTestId('palette-trigger')).toBeDisabled();

	const panelWidth = (await page.getByTestId('analysis-result-panel').boundingBox())?.width ?? 0;
	const resultWidth =
		(await page.getByRole('button', { name: 'Result', exact: true }).boundingBox())?.width ?? 0;
	const traceWidth = (await page.getByTestId('open-trace').boundingBox())?.width ?? 0;
	expect(resultWidth).toBeGreaterThan(panelWidth * 0.4);
	expect(traceWidth).toBeGreaterThan(panelWidth * 0.4);

	await page.getByTestId('open-trace').click();
	await expect(page.getByTestId('analysis-inspectors')).toContainText('Queue');
	const firstInspector = page.getByTestId('analysis-inspectors').locator('.inspector').first();
	const inspectorButton = firstInspector.getByRole('button');
	await expect(inspectorButton).toHaveAttribute('aria-expanded', 'false');
	await expect(firstInspector).toContainText('Nodes waiting to be explored');
	const restingInspectorColor = await inspectorButton.evaluate(
		(element) => getComputedStyle(element).backgroundColor
	);
	await inspectorButton.hover();
	await expect
		.poll(() => inspectorButton.evaluate((element) => getComputedStyle(element).backgroundColor))
		.not.toBe(restingInspectorColor);
	await inspectorButton.click();
	await expect(inspectorButton).toHaveAttribute('aria-expanded', 'true');
	const secondInspector = page.getByTestId('analysis-inspectors').locator('.inspector').nth(1);
	await secondInspector.getByRole('button').click();
	const traceOverflow = await page.getByTestId('analysis-trace').evaluate((element) => ({
		clientWidth: element.clientWidth,
		scrollWidth: element.scrollWidth
	}));
	expect(traceOverflow.scrollWidth).toBeLessThanOrEqual(traceOverflow.clientWidth);
	await expect(page.getByTestId('trace-speed')).toHaveCount(0);
	await page.getByTestId('trace-next').click();
	await expect(page.getByTestId('trace-scrubber')).toHaveValue('1');
	await page.getByTestId('trace-play').click();
	await expect(page.getByTestId('trace-play')).toHaveAttribute('aria-label', 'Pause playback');
	await page.getByTestId('trace-previous').click();
	await expect(page.getByTestId('trace-play')).toHaveAttribute('aria-label', 'Start playback');
	await page.getByTestId('trace-play').click();
	await page.getByTestId('trace-reset').click();
	await expect(page.getByTestId('trace-scrubber')).toHaveValue('0');
	await expect(page.getByTestId('trace-play')).toHaveAttribute('aria-label', 'Start playback');

	await page.getByRole('button', { name: 'Result', exact: true }).click();
	await expect(page.getByTestId('analysis-result')).toBeVisible();

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
	const metricRows = page.getByTestId('analysis-result').locator('.metrics > div');
	await expect(metricRows).toHaveCount(2);
	await expect(metricRows.nth(0).locator('dt')).toHaveCount(1);
	await expect(metricRows.nth(0).locator('dd')).toHaveCount(1);
});
