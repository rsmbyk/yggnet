import { expect, test, type Page } from '@playwright/test';
import { applyGeneratedGraph, openTool } from './open-tool';

async function chooseNode(page: Page, testid: string, index = 0) {
	const picker = page.getByTestId(testid);
	await page.getByTestId(`${testid}-open`).click();
	const option = picker.getByRole('option').nth(index);
	await option.click();
	const value = await picker.getAttribute('data-value');
	if (!value) throw new Error('Expected a selected graph node');
	return value;
}

test('one Analyze tool runs BFS and exposes reversible trace playback', async ({ page }) => {
	await page.goto('/');
	await applyGeneratedGraph(page, 'grid', { rows: 3, columns: 3 });
	await page.mouse.move(500, 500);
	const generateSelectHeight = (await page.getByTestId('generate-kind').boundingBox())?.height;
	const generateButtonStyle = await page.getByTestId('generate-submit').evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			backgroundColor: style.backgroundColor,
			fontWeight: style.fontWeight,
			height: style.height
		};
	});
	await expect(page.getByTestId('tool-pathfinder')).toHaveCount(0);
	await openTool(page, 'analyze');
	await expect(page.getByTestId('analyze-panel').locator('h2')).toHaveCount(0);
	await expect(page.getByTestId('yggnet-manager').locator('.brand')).toHaveText('Analyze');
	await expect(page.getByTestId('view-last-analysis')).toHaveCount(0);
	expect((await page.getByTestId('analysis-picker').boundingBox())?.height).toBe(
		generateSelectHeight
	);
	await expect
		.poll(() =>
			page.getByTestId('run-analysis').evaluate((element) => {
				const style = getComputedStyle(element);
				return {
					backgroundColor: style.backgroundColor,
					fontWeight: style.fontWeight,
					height: style.height
				};
			})
		)
		.toEqual(generateButtonStyle);
	await expect(page.getByTestId('analysis-picker')).toContainText('Breadth-First Search');
	await expect(page.getByTestId('analysis-picker')).toContainText('Dijkstra Shortest Path');
	await expect(page.getByTestId('analysis-field-start-open')).toContainText('Choose…');
	await page.getByTestId('analysis-field-start-open').click();
	await page.getByTestId('analysis-field-start-search').fill('N9');
	await expect(page.getByTestId('analysis-field-start').getByRole('option')).toHaveCount(1);
	await page.getByTestId('analysis-field-start-search').press('Enter');
	await expect(page.getByTestId('analysis-field-start')).not.toHaveAttribute('data-value', '');
	await page.getByTestId('run-analysis').click();

	await expect(page.getByTestId('analysis-result-panel')).toBeVisible();
	await expect(
		page.getByTestId('analysis-result-panel').getByRole('heading', { level: 2 })
	).toHaveText('Breadth-First Search');
	await expect(page.getByTestId('analysis-result')).toContainText('Visited');
	await expect(page.getByTestId('analysis-result').getByLabel('Analysis legend')).toContainText(
		'Start'
	);
	await expect(page.getByTestId('analysis-result').locator('.legend-mark--start')).toHaveText('');
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
	await expect(page.getByTestId('trace-reset')).toBeDisabled();
	await page.getByTestId('trace-next').click();
	await expect(page.getByTestId('trace-scrubber')).toHaveValue('1');
	await expect(page.getByTestId('trace-reset')).toBeEnabled();
	await page.getByTestId('trace-play').click();
	await expect(page.getByTestId('trace-play')).toHaveAttribute('aria-label', 'Pause playback');
	await expect(page.getByTestId('trace-play')).toHaveAttribute('data-icon', 'pause');
	await expect.poll(() => page.getByTestId('trace-scrubber').inputValue()).not.toBe('1');
	await expect(inspectorButton).toHaveAttribute('aria-expanded', 'true');
	await page.getByTestId('trace-previous').click();
	await expect(page.getByTestId('trace-play')).toHaveAttribute('aria-label', 'Start playback');
	await page.getByTestId('trace-play').click();
	await page.getByTestId('trace-reset').click();
	await expect(page.getByTestId('trace-scrubber')).toHaveValue('0');
	await expect(page.getByTestId('trace-play')).toHaveAttribute('aria-label', 'Start playback');
	await expect(page.getByTestId('trace-reset')).toBeDisabled();

	const lastAction = await page.getByTestId('trace-scrubber').getAttribute('max');
	if (!lastAction) throw new Error('Expected a final trace action');
	await page.getByTestId('trace-scrubber').evaluate((element, value) => {
		const input = element as HTMLInputElement;
		input.value = value;
		input.dispatchEvent(new Event('input', { bubbles: true }));
	}, lastAction);
	await expect(page.getByTestId('trace-play')).toHaveAttribute('aria-label', 'Restart playback');
	await expect(page.getByTestId('trace-play')).toHaveAttribute('data-icon', 'restart');
	await expect(page.getByTestId('trace-reset')).toBeEnabled();
	await page.getByTestId('trace-play').click();
	await expect(page.getByTestId('trace-scrubber')).toHaveValue('0');
	await expect(page.getByTestId('trace-play')).toHaveAttribute('aria-label', 'Pause playback');

	await page.getByRole('button', { name: 'Result', exact: true }).click();
	await expect(page.getByTestId('analysis-result')).toBeVisible();

	await page.getByTestId('close-analysis').click();
	await expect(page.getByTestId('analysis-result-panel')).toHaveCount(0);
	await expect(page.getByTestId('analyze-panel')).toBeVisible();
	await expect(page.getByTestId('yggnet-manager').locator('.manager__header')).toContainText(
		'Last result'
	);
	await page.getByTestId('manager-scrim').click();
	await page.getByTestId('world-add-node').click();
	await openTool(page, 'analyze');
	await expect(page.getByTestId('view-last-analysis')).toHaveCount(0);
});

test('Dijkstra reports edge length and total cost', async ({ page }) => {
	await page.goto('/');
	await applyGeneratedGraph(page, 'grid', { rows: 2, columns: 2 });
	await openTool(page, 'analyze');
	await page.getByTestId('analysis-picker').selectOption('dijkstra');
	await chooseNode(page, 'analysis-field-start');
	await chooseNode(page, 'analysis-field-end', 1);
	await page.getByTestId('run-analysis').click();
	await expect(page.getByTestId('analysis-result')).toContainText('Length');
	await expect(page.getByTestId('analysis-result')).toContainText('Cost');
	await expect(page.getByTestId('analysis-result').getByLabel('Analysis legend')).toContainText(
		'Start'
	);
	await expect(page.getByTestId('analysis-result').getByLabel('Analysis legend')).toContainText(
		'End'
	);
	await expect(page.getByTestId('analysis-result').locator('.legend-mark--end')).toHaveText('');
	const metricRows = page.getByTestId('analysis-result').locator('.metrics > div');
	await expect(metricRows).toHaveCount(2);
	await expect(metricRows.nth(0).locator('dt')).toHaveCount(1);
	await expect(metricRows.nth(0).locator('dd')).toHaveCount(1);
});

test('traversal catalog exposes conditional Search fields and final IDDFS depth', async ({
	page
}) => {
	await page.goto('/');
	await applyGeneratedGraph(page, 'grid', { rows: 2, columns: 3 });
	await openTool(page, 'analyze');
	const picker = page.getByTestId('analysis-picker');
	for (const name of [
		'Breadth-First Search',
		'Depth-First Search',
		'Multi-source BFS',
		'Depth-Limited DFS',
		'Iterative Deepening DFS',
		'Bidirectional BFS',
		'Random Walk',
		'Dijkstra Shortest Path'
	]) {
		await expect(picker).toContainText(name);
	}

	await picker.selectOption('iddfs');
	await expect(page.getByTestId('analysis-field-mode')).toHaveValue('traverse');
	await expect(page.getByTestId('analysis-field-target')).toHaveCount(0);
	await page.getByTestId('analysis-field-mode').selectOption('search');
	await expect(page.getByTestId('analysis-field-target')).toBeVisible();
	await chooseNode(page, 'analysis-field-start');
	await chooseNode(page, 'analysis-field-target', 1);
	await page.getByTestId('run-analysis').click();
	await expect(page.getByTestId('analysis-result')).toContainText('Found depth');
});

test('Multi-source preserves source order and Random Walk reports its optional seed', async ({
	page
}) => {
	await page.goto('/');
	await applyGeneratedGraph(page, 'grid', { rows: 2, columns: 3 });
	await openTool(page, 'analyze');
	await page.getByTestId('analysis-picker').selectOption('multi-source-bfs');
	for (let index = 0; index < 2; index += 1) {
		await page.getByTestId('analysis-field-starts-add-open').click();
		await page.getByTestId('analysis-field-starts-add').getByRole('option').first().click();
	}
	await expect(page.getByTestId('analysis-field-starts').locator('li')).toHaveCount(2);
	await expect(
		page.getByTestId('analysis-field-starts').locator('li').nth(0).locator('b')
	).toHaveText('1');
	await expect(
		page.getByTestId('analysis-field-starts').locator('li').nth(1).locator('b')
	).toHaveText('2');
	await page.getByTestId('run-analysis').click();
	await expect(page.getByTestId('analysis-result')).toContainText('Sources');
	await expect(page.getByTestId('analysis-result')).toContainText('2');

	await page.getByTestId('close-analysis').click();
	await page.getByTestId('analysis-picker').selectOption('random-walk');
	await chooseNode(page, 'analysis-field-start');
	await page.getByTestId('analysis-field-maxSteps').fill('3');
	await page.getByTestId('analysis-field-seed').fill('7');
	await page.getByTestId('run-analysis').click();
	await expect(page.getByTestId('analysis-result')).toContainText('Seed');
	await expect(page.getByTestId('analysis-result')).toContainText('7');
	await expect(page.getByTestId('analysis-result-panel')).toHaveAttribute(
		'data-reveal-state',
		/.+/
	);
});
