import { expect, test, type Locator, type Page } from '@playwright/test';
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

function contrastRatio(foreground: string, background: string) {
	const luminance = (color: string) => {
		const channels = color
			.match(/[\d.]+/g)
			?.slice(0, 3)
			.map(Number);
		if (!channels || channels.length !== 3) throw new Error(`Unexpected RGB color: ${color}`);
		const linear = channels.map((channel) => {
			const value = channel / 255;
			return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
		});
		return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
	};
	const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
	return (light + 0.05) / (dark + 0.05);
}

async function tabTo(page: Page, target: Locator) {
	await page.evaluate(() => {
		if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
	});
	for (let index = 0; index < 80; index += 1) {
		await page.keyboard.press('Tab');
		if (await target.evaluate((element) => element === document.activeElement)) return;
	}
	throw new Error('Keyboard tab order did not reach the target control');
}

async function expandArtifact(page: Page, id: string) {
	const artifact = page.getByTestId(`analysis-artifact-${id}`);
	if ((await artifact.getAttribute('open')) === null) await artifact.locator('summary').click();
	await expect(artifact).toHaveAttribute('open', '');
	return artifact;
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
	await expect(page.getByTestId('analysis-result-panel')).toHaveAttribute(
		'data-reveal-step-ms',
		'50'
	);
	await expect(page.getByTestId('analysis-result-panel')).toHaveAttribute(
		'data-reveal-duration-ms',
		'850'
	);
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

test('Analyze groups algorithms and remembers compatible shared inputs', async ({ page }) => {
	await page.goto('/');
	await applyGeneratedGraph(page, 'grid', { rows: 2, columns: 3 });
	await openTool(page, 'analyze');
	const picker = page.getByTestId('analysis-picker');
	await expect(picker.locator('optgroup[label="Traversal"] option[value="bfs"]')).toHaveCount(1);
	await expect(
		picker.locator('optgroup[label="Shortest path"] option[value="dijkstra"]')
	).toHaveCount(1);

	await picker.selectOption('iddfs');
	await page.getByTestId('analysis-field-mode').selectOption('search');
	const start = await chooseNode(page, 'analysis-field-start');
	const target = await chooseNode(page, 'analysis-field-target', 1);
	await picker.selectOption('bfs');
	await expect(page.getByTestId('analysis-field-mode')).toHaveValue('search');
	await expect(page.getByTestId('analysis-field-start')).toHaveAttribute('data-value', start);
	await expect(page.getByTestId('analysis-field-target')).toHaveAttribute('data-value', target);
	await picker.selectOption('topological-sort');
	await picker.selectOption('iddfs');
	await expect(page.getByTestId('analysis-field-mode')).toHaveValue('search');
	await expect(page.getByTestId('analysis-field-start')).toHaveAttribute('data-value', start);
	await expect(page.getByTestId('analysis-field-target')).toHaveAttribute('data-value', target);
});

test('Last result has a decorative icon and keeps its accessible name', async ({ page }) => {
	await page.goto('/');
	await applyGeneratedGraph(page, 'grid', { rows: 2, columns: 2 });
	await openTool(page, 'analyze');
	await page.getByTestId('analysis-field-start-open').click();
	await page.getByTestId('analysis-field-start-search').fill('N1');
	await page.getByTestId('analysis-field-start-search').press('Enter');
	await page.getByTestId('run-analysis').click();
	await page.getByTestId('close-analysis').click();
	const lastResult = page.getByRole('button', { name: 'Last result' });
	await expect(lastResult).toBeVisible();
	await expect(lastResult.locator('svg[aria-hidden="true"]')).toHaveCount(1);
});

test('primary Generate and Analyze buttons keep contrast on hover and keyboard focus', async ({
	page
}) => {
	await page.goto('/');
	await openTool(page, 'generate');
	const generate = page.getByTestId('generate-submit');
	await generate.hover();
	const generateHover = await generate.evaluate((element) => {
		const style = getComputedStyle(element);
		return { background: style.backgroundColor, color: style.color };
	});
	expect(contrastRatio(generateHover.color, generateHover.background)).toBeGreaterThanOrEqual(4.5);
	await tabTo(page, generate);
	await expect(generate).toBeFocused();
	await expect
		.poll(() => generate.evaluate((element) => element.matches(':focus-visible')))
		.toBe(true);

	await openTool(page, 'analyze');
	const picker = page.getByTestId('analysis-picker');
	await picker.selectOption('topological-sort');
	await picker.focus();
	await page.keyboard.press('Tab');
	const run = page.getByTestId('run-analysis');
	await expect(run).toBeFocused();
	await expect(run).toHaveCSS('outline-style', 'solid');
	const runFocus = await run.evaluate((element) => {
		const style = getComputedStyle(element);
		return { background: style.backgroundColor, color: style.color };
	});
	expect(contrastRatio(runFocus.color, runFocus.background)).toBeGreaterThanOrEqual(4.5);
});

test('SPEC-103 result artifacts collapse by default and retain disclosure state for one run', async ({
	page
}) => {
	await page.goto('/');
	await applyGeneratedGraph(page, 'cycle', { nodes: 4 });
	await openTool(page, 'analyze');
	const picker = page.getByTestId('analysis-picker');
	await picker.selectOption('degree-centrality');
	await page.getByTestId('run-analysis').click();

	const ranking = page.getByTestId('analysis-artifact-ranking');
	await expect(ranking).toBeVisible();
	await expect(ranking).not.toHaveAttribute('open');
	await ranking.locator('summary').click();
	await expect(ranking).toHaveAttribute('open');
	await page.getByTestId('open-trace').click();
	await page.getByRole('button', { name: 'Result', exact: true }).click();
	await expect(ranking).toHaveAttribute('open');

	await page.getByTestId('close-analysis').click();
	await page.getByTestId('run-analysis').click();
	const rerunRanking = page.getByTestId('analysis-artifact-ranking');
	await expect(rerunRanking).not.toHaveAttribute('open');
});

test('SPEC-103 grouped, ranking, and map-like results use scannable semantic structures', async ({
	page
}) => {
	await page.goto('/');
	await applyGeneratedGraph(page, 'cycle', { nodes: 4 });
	await openTool(page, 'analyze');
	const picker = page.getByTestId('analysis-picker');

	await picker.selectOption('connected-components');
	await page.getByTestId('run-analysis').click();
	const components = page.getByTestId('analysis-artifact-components');
	await components.locator('summary').click();
	await expect(components.getByRole('heading', { name: 'Component 1' })).toBeVisible();
	await expect(components.locator('.result-group').first().getByRole('list')).toContainText('N1');

	await page.reload();
	await applyGeneratedGraph(page, 'cycle', { nodes: 4 });
	await openTool(page, 'analyze');
	const coloringPicker = page.getByTestId('analysis-picker');
	await coloringPicker.selectOption('welsh-powell-coloring');
	await page.getByTestId('run-analysis').click();
	const colors = page.getByTestId('analysis-artifact-colors');
	await colors.locator('summary').click();
	await expect(colors.getByRole('heading', { name: 'Color 1' })).toBeVisible();
	await expect(colors.getByLabel('Color 1 palette swatch')).toBeVisible();
	await expect(colors.locator('.result-group').first().getByRole('list')).toBeVisible();

	await page.reload();
	await applyGeneratedGraph(page, 'cycle', { nodes: 4 });
	await openTool(page, 'analyze');
	const rankingPicker = page.getByTestId('analysis-picker');
	await rankingPicker.selectOption('degree-centrality');
	await page.getByTestId('run-analysis').click();
	const ranking = page.getByTestId('analysis-artifact-ranking');
	await ranking.locator('summary').click();
	await expect(ranking.getByRole('table')).toHaveAccessibleName('Degree centrality ranking');
	await expect(ranking.getByRole('columnheader', { name: 'Rank' })).toBeVisible();

	await page.reload();
	await applyGeneratedGraph(page, 'cycle', { nodes: 4 });
	await openTool(page, 'analyze');
	await page.getByTestId('analysis-picker').selectOption('degree-distribution');
	await page.getByTestId('run-analysis').click();
	await expect(page.getByTestId('analysis-result')).toBeVisible();
	const distribution = page.getByTestId('analysis-artifact-degree-distribution');
	await distribution.locator('summary').click();
	await expect(distribution.getByRole('table')).toHaveAccessibleName('Degree distribution');
});

test('SPEC-103 panel grows to its content and status surfaces keep readable contrast', async ({
	page
}) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.setViewportSize({ width: 1000, height: 600 });
	await page.goto('/');
	await applyGeneratedGraph(page, 'tree');
	await openTool(page, 'analyze');
	await page.getByTestId('analysis-picker').selectOption('graph-girth');
	await page.getByTestId('run-analysis').click();
	const noResult = page.getByTestId('analysis-no-result');
	await expect(noResult).toBeVisible();
	const noResultColors = await noResult.evaluate((element) => {
		const style = getComputedStyle(element);
		return { color: style.color, background: style.backgroundColor };
	});
	expect(contrastRatio(noResultColors.color, noResultColors.background)).toBeGreaterThanOrEqual(
		4.5
	);
	const panel = page.getByTestId('analysis-result-panel');
	const panelBox = await panel.boundingBox();
	expect(panelBox).toBeTruthy();
	expect(panelBox!.height).toBeLessThanOrEqual(584);
	await expect(page.getByRole('button', { name: 'Result', exact: true })).toBeVisible();
	await expect(page.getByLabel('Analysis legend')).toBeVisible();
	await page.getByTestId('close-analysis').click();

	await applyGeneratedGraph(page, 'grid', { rows: 12, columns: 12 });
	await openTool(page, 'analyze');
	await page.getByTestId('analysis-picker').selectOption('connected-components');
	await page.getByTestId('run-analysis').click();
	const componentList = page.getByTestId('analysis-artifact-components');
	await componentList.locator('summary').click();
	await expect(componentList).toHaveAttribute('open', '');
	const resultScroll = page.getByTestId('analysis-result-scroll');
	await expect(componentList.locator('.result-group li')).toHaveCount(144);
	await expect
		.poll(() => resultScroll.evaluate((element) => element.scrollHeight > element.clientHeight))
		.toBe(true);
	const tabsTop = await page
		.getByRole('button', { name: 'Result', exact: true })
		.evaluate((element) => element.getBoundingClientRect().top);
	const legendTop = await page
		.getByLabel('Analysis legend')
		.evaluate((element) => element.getBoundingClientRect().top);
	await resultScroll.evaluate((element) => (element.scrollTop = element.scrollHeight));
	await expect
		.poll(() =>
			page
				.getByRole('button', { name: 'Result', exact: true })
				.evaluate((element) => element.getBoundingClientRect().top)
		)
		.toBe(tabsTop);
	await expect
		.poll(() =>
			page.getByLabel('Analysis legend').evaluate((element) => element.getBoundingClientRect().top)
		)
		.toBe(legendTop);
	await expect(page.getByTestId('analysis-result-panel').locator('.tabs')).toHaveCSS(
		'border-bottom-style',
		'solid'
	);
});

test('SPEC-103 rejected and no-result surfaces have distinct readable contrast', async ({
	page
}) => {
	await page.goto('/');
	await openTool(page, 'generate');
	await page.getByTestId('generate-kind').selectOption('grid');
	await page.getByTestId('generate-rows').fill('1');
	await page.getByTestId('generate-columns').fill('3');
	await page.getByLabel('Directed', { exact: true }).check();
	await page.getByTestId('generate-submit').click();
	await openTool(page, 'analyze');
	await page.getByTestId('analysis-picker').selectOption('kruskal-mst');
	await page.getByTestId('run-analysis').click();
	const rejected = page.getByTestId('analysis-rejected');
	await expect(rejected).toBeVisible();
	const rejectedColors = await rejected.evaluate((element) => {
		const style = getComputedStyle(element);
		return { color: style.color, background: style.backgroundColor };
	});
	expect(contrastRatio(rejectedColors.color, rejectedColors.background)).toBeGreaterThanOrEqual(
		4.5
	);
	await expect(rejected).toHaveCSS('background-color', 'rgb(254, 243, 199)');
});

test('Result lists expand accessibly and its legend stays pinned while scrolling', async ({
	page
}) => {
	await page.goto('/');
	await applyGeneratedGraph(page, 'grid', { rows: 10, columns: 10 });
	await openTool(page, 'analyze');
	await page.getByTestId('analysis-picker').selectOption('degree-centrality');
	await page.getByTestId('run-analysis').click();
	const result = page.getByTestId('analysis-result');
	const list = page.getByTestId('analysis-artifact-ranking');
	await expect(list).toBeVisible();
	const summary = list.locator('summary');
	await expect(summary).toContainText('100');
	await expect(list).not.toHaveAttribute('open');
	await summary.click();
	await expect(list).toHaveAttribute('open', '');
	const scrollBody = page.getByTestId('analysis-result-scroll');
	const legend = result.getByLabel('Analysis legend');
	const tab = page.getByRole('button', { name: 'Result', exact: true });
	const initial = await Promise.all([tab.boundingBox(), legend.boundingBox()]);
	await scrollBody.evaluate((element) => (element.scrollTop = 250));
	const after = await Promise.all([tab.boundingBox(), legend.boundingBox()]);
	expect(initial[0]).toBeTruthy();
	expect(initial[1]).toBeTruthy();
	expect(after[0]).toBeTruthy();
	expect(after[1]).toBeTruthy();
	expect(Math.abs(initial[0]!.y - after[0]!.y)).toBeLessThan(2);
	expect(Math.abs(initial[1]!.y - after[1]!.y)).toBeLessThan(2);

	await page.getByTestId('open-trace').click();
	const trace = page.getByTestId('analysis-trace');
	const traceScroll = page.getByTestId('analysis-trace-scroll');
	const traceLegend = trace.getByLabel('Analysis legend');
	const traceTab = page.getByTestId('open-trace');
	const traceInitial = await Promise.all([traceTab.boundingBox(), traceLegend.boundingBox()]);
	await traceScroll.evaluate((element) => (element.scrollTop = 1000));
	const traceAfter = await Promise.all([traceTab.boundingBox(), traceLegend.boundingBox()]);
	expect(traceInitial[0]).toBeTruthy();
	expect(traceInitial[1]).toBeTruthy();
	expect(traceAfter[0]).toBeTruthy();
	expect(traceAfter[1]).toBeTruthy();
	expect(Math.abs(traceInitial[0]!.y - traceAfter[0]!.y)).toBeLessThan(2);
	expect(Math.abs(traceInitial[1]!.y - traceAfter[1]!.y)).toBeLessThan(2);
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
		'Dijkstra Shortest Path',
		'0–1 BFS',
		'Bellman–Ford Shortest Path',
		'DAG Shortest Path',
		'A* Shortest Path',
		'Bidirectional Dijkstra'
	]) {
		await expect(picker).toContainText(name);
	}

	await picker.selectOption('iddfs');
	await expect(page.getByTestId('analysis-field-mode')).toHaveValue('traverse');
	await expect(page.getByTestId('analysis-field-target')).toHaveCount(0);
	await page.getByTestId('analysis-field-mode').selectOption('search');
	await expect(page.getByTestId('analysis-field-target')).toBeVisible();
	await chooseNode(page, 'analysis-field-start');
	await chooseNode(page, 'analysis-field-target', 5);
	await page.getByTestId('run-analysis').click();
	await expect(page.getByTestId('analysis-result')).toContainText('Found depth');
	const iddfsPanel = page.getByTestId('analysis-result-panel');
	expect(Number(await iddfsPanel.getAttribute('data-reveal-phase-count'))).toBeGreaterThan(1);
	expect(Number(await iddfsPanel.getAttribute('data-reveal-duration-ms'))).toBeGreaterThan(1300);
	await expect(iddfsPanel).toHaveAttribute('data-reveal-step-ms', '50');
	await expect(iddfsPanel).toHaveAttribute('data-reveal-phase-hold-ms', '200');
});

test('shortest-path catalog runs binary and informed searches', async ({ page }) => {
	await page.goto('/');
	await applyGeneratedGraph(page, 'grid', { rows: 2, columns: 2 });
	await openTool(page, 'analyze');
	await page.getByTestId('analysis-picker').selectOption('zero-one-bfs');
	await chooseNode(page, 'analysis-field-start');
	await chooseNode(page, 'analysis-field-end', 1);
	await page.getByTestId('run-analysis').click();
	await expect(page.getByTestId('analysis-result')).toContainText('Cost');
	await page.getByTestId('close-analysis').click();
	await page.getByTestId('analysis-picker').selectOption('a-star');
	await expect(page.getByText('Uses a safely scaled straight-line estimate.')).toBeVisible();
	await chooseNode(page, 'analysis-field-start');
	await chooseNode(page, 'analysis-field-end', 1);
	await page.getByTestId('run-analysis').click();
	await expect(page.getByTestId('analysis-result')).toContainText('Cost');
});

test('flow catalog runs a directed network and exposes exact edge flows', async ({ page }) => {
	await page.goto('/');
	await openTool(page, 'generate');
	await page.getByTestId('generate-kind').selectOption('grid');
	await page.getByTestId('generate-rows').fill('2');
	await page.getByTestId('generate-columns').fill('2');
	await page.getByLabel('Directed', { exact: true }).check();
	await page.getByTestId('generate-submit').click();
	await openTool(page, 'analyze');

	const picker = page.getByTestId('analysis-picker');
	for (const name of [
		'Ford-Fulkerson Maximum Flow',
		'Edmonds-Karp Maximum Flow',
		'Dinic Maximum Flow',
		'Minimum Cut'
	]) {
		await expect(picker).toContainText(name);
	}
	await picker.selectOption('edmonds-karp');
	await chooseNode(page, 'analysis-field-source');
	await chooseNode(page, 'analysis-field-sink', 3);
	await page.getByTestId('run-analysis').click();
	await expect(page.getByTestId('analysis-result')).toContainText('Maximum flow');
	const edgeFlow = await expandArtifact(page, 'edge-flow');
	await expect(edgeFlow.getByRole('table')).toBeVisible();
	await expect(edgeFlow.getByRole('row')).not.toHaveCount(1);

	await page.getByTestId('close-analysis').click();
	await picker.selectOption('minimum-cut');
	await chooseNode(page, 'analysis-field-source');
	await chooseNode(page, 'analysis-field-sink', 3);
	await page.getByTestId('run-analysis').click();
	await expect(page.getByTestId('analysis-result')).toContainText('Cut capacity');
	const cutPartition = await expandArtifact(page, 'cut-partition');
	await expect(cutPartition).toContainText('Source side');
	await expect(cutPartition).toContainText('Sink side');

	await page.reload();
	await applyGeneratedGraph(page, 'grid', { rows: 2, columns: 2 });
	await openTool(page, 'analyze');
	await page.getByTestId('analysis-picker').selectOption('edmonds-karp');
	await chooseNode(page, 'analysis-field-source');
	await chooseNode(page, 'analysis-field-sink', 3);
	await page.getByTestId('run-analysis').click();
	const rejected = page.getByTestId('analysis-rejected');
	await expect(rejected.getByRole('heading', { name: 'Rejected' })).toBeVisible();
	await expect(rejected).toContainText('requires every edge to be directed');
	await expect(rejected).toHaveCSS('background-color', 'rgb(254, 243, 199)');
});

test('exact route and set catalog exposes results and eligibility limits', async ({ page }) => {
	test.setTimeout(90_000);
	await page.goto('/');
	await applyGeneratedGraph(page, 'grid', { rows: 2, columns: 2 });
	await openTool(page, 'analyze');
	const picker = page.getByTestId('analysis-picker');

	await picker.selectOption('eulerian-route');
	await page.getByTestId('analysis-field-mode').selectOption('circuit');
	await page.getByTestId('run-analysis').click();
	await expect(await expandArtifact(page, 'route')).toContainText('→');

	await page.getByTestId('close-analysis').click();
	await picker.selectOption('hamiltonian-route');
	await page.getByTestId('analysis-field-mode').selectOption('circuit');
	await chooseNode(page, 'analysis-field-start');
	await page.getByTestId('run-analysis').click();
	await expect(await expandArtifact(page, 'route')).toContainText('→');

	for (const id of ['maximum-clique', 'maximum-independent-set', 'minimum-vertex-cover']) {
		await page.getByTestId('close-analysis').click();
		await picker.selectOption(id);
		await page.getByTestId('run-analysis').click();
		const resultSet = await expandArtifact(page, 'result-set');
		await expect(resultSet).not.toContainText('None');
	}

	await page.reload();
	await applyGeneratedGraph(page, 'grid', { rows: 1, columns: 3 });
	await openTool(page, 'analyze');
	await page.getByTestId('analysis-picker').selectOption('eulerian-route');
	await page.getByTestId('analysis-field-mode').selectOption('path');
	await chooseNode(page, 'analysis-field-start', 1);
	await page.getByTestId('run-analysis').click();
	await expect(page.getByTestId('analysis-no-result')).toContainText('selected Start');

	await page.reload();
	await applyGeneratedGraph(page, 'grid', { rows: 1, columns: 1 });
	await openTool(page, 'analyze');
	await page.getByTestId('analysis-picker').selectOption('minimum-vertex-cover');
	await page.getByTestId('run-analysis').click();
	const emptyCover = await expandArtifact(page, 'result-set');
	await expect(emptyCover).toContainText('0 found');
	await expect(emptyCover).toContainText('None');

	await page.reload();
	await openTool(page, 'generate');
	await page.getByTestId('generate-kind').selectOption('grid');
	await page.getByTestId('generate-rows').fill('2');
	await page.getByTestId('generate-columns').fill('2');
	await page.getByLabel('Directed', { exact: true }).check();
	await page.getByTestId('generate-submit').click();
	await openTool(page, 'analyze');
	for (const id of [
		'eulerian-route',
		'hamiltonian-route',
		'maximum-clique',
		'maximum-independent-set',
		'minimum-vertex-cover'
	]) {
		await page.getByTestId('analysis-picker').selectOption(id);
		if (id === 'eulerian-route' || id === 'hamiltonian-route')
			await page.getByTestId('analysis-field-mode').selectOption('circuit');
		await page.getByTestId('run-analysis').click();
		if (
			id === 'maximum-clique' ||
			id === 'maximum-independent-set' ||
			id === 'minimum-vertex-cover'
		)
			await expect(page.getByTestId('analysis-rejected')).toContainText('undirected');
		else {
			const noResult = page.getByRole('status', { name: 'No result' });
			const route = page.getByTestId('analysis-artifact-route');
			await expect.poll(async () => (await noResult.count()) + (await route.count())).toBe(1);
			if (await noResult.count()) await expect(noResult).not.toContainText('direction');
		}
		await page.getByTestId('close-analysis').click();
	}

	await page.reload();
	await applyGeneratedGraph(page, 'grid', { rows: 3, columns: 7 });
	await openTool(page, 'analyze');
	for (const id of [
		'hamiltonian-route',
		'maximum-clique',
		'maximum-independent-set',
		'minimum-vertex-cover'
	]) {
		await page.getByTestId('analysis-picker').selectOption(id);
		await page.getByTestId('run-analysis').click();
		await expect(page.getByTestId('analysis-no-result')).toContainText('20 nodes');
		await page.getByTestId('close-analysis').click();
	}
});

test('graph metrics and structure catalog exposes exact results and witnesses', async ({
	page
}) => {
	test.setTimeout(60_000);
	await page.goto('/');
	await applyGeneratedGraph(page, 'grid', { rows: 1, columns: 4 });
	await openTool(page, 'analyze');
	const picker = page.getByTestId('analysis-picker');

	await picker.selectOption('node-eccentricity');
	await page.getByTestId('run-analysis').click();
	await expect(page.getByTestId('analysis-artifact-eccentricities')).toBeVisible();

	await page.getByTestId('close-analysis').click();
	await picker.selectOption('graph-diameter');
	await page.getByTestId('run-analysis').click();
	await expect(page.getByTestId('analysis-result')).toContainText('Diameter');
	await expect(await expandArtifact(page, 'route')).toContainText('→');

	await page.getByTestId('close-analysis').click();
	await picker.selectOption('graph-radius');
	await page.getByTestId('run-analysis').click();
	await expect(page.getByTestId('analysis-result')).toContainText('Radius');

	await page.getByTestId('close-analysis').click();
	await picker.selectOption('graph-center');
	await page.getByTestId('run-analysis').click();
	await expect(await expandArtifact(page, 'result-set')).toContainText('2 found');

	await page.reload();
	await applyGeneratedGraph(page, 'grid', { rows: 2, columns: 2 });
	await openTool(page, 'analyze');
	for (const id of [
		'graph-girth',
		'graph-density',
		'degree-distribution',
		'tree-forest-detection'
	]) {
		await page.getByTestId('analysis-picker').selectOption(id);
		await page.getByTestId('run-analysis').click();
		await expect(page.getByTestId('analysis-result')).toBeVisible();
		if (id === 'graph-girth') await expect(await expandArtifact(page, 'route')).toContainText('→');
		if (id === 'degree-distribution')
			await expect(await expandArtifact(page, 'degree-distribution')).toBeVisible();
		if (id === 'tree-forest-detection')
			await expect(page.getByTestId('analysis-result')).toContainText('Neither');
		if (id === 'tree-forest-detection')
			await expect(page.getByLabel('Analysis legend')).toContainText('Critical');
		await page.getByTestId('close-analysis').click();
	}
});

test('graph metrics and structure catalog explains eligibility and boundary results', async ({
	page
}) => {
	test.setTimeout(90_000);
	await page.goto('/');
	await openTool(page, 'generate');
	await page.getByTestId('generate-kind').selectOption('grid');
	await page.getByTestId('generate-rows').fill('1');
	await page.getByTestId('generate-columns').fill('3');
	await page.getByLabel('Directed', { exact: true }).check();
	await page.getByTestId('generate-submit').click();
	await openTool(page, 'analyze');
	const picker = page.getByTestId('analysis-picker');
	for (const id of [
		'node-eccentricity',
		'graph-diameter',
		'graph-radius',
		'graph-center',
		'graph-girth',
		'tree-forest-detection'
	]) {
		await picker.selectOption(id);
		await page.getByTestId('run-analysis').click();
		await expect(page.getByTestId('analysis-rejected')).toContainText('undirected');
		await page.getByTestId('close-analysis').click();
	}
	await picker.selectOption('graph-density');
	await page.getByTestId('run-analysis').click();
	await expect(page.getByTestId('analysis-result')).toContainText('m / (n(n - 1))');
	await page.getByTestId('close-analysis').click();
	await picker.selectOption('degree-distribution');
	await page.getByTestId('run-analysis').click();
	const degreeDistribution = await expandArtifact(page, 'in-degree-distribution');
	await expect(degreeDistribution.getByRole('table')).toHaveAccessibleName(
		'In-degree distribution'
	);

	await page.getByTestId('close-analysis').click();
	await openTool(page, 'edges');
	await page.getByTestId('edge-list').locator('[data-testid^="edge-item-"]').first().click();
	await page.getByTestId('edge-direction').selectOption('undirected');
	await openTool(page, 'analyze');
	for (const id of ['graph-density', 'degree-distribution']) {
		await picker.selectOption(id);
		await page.getByTestId('run-analysis').click();
		await expect(page.getByTestId('analysis-rejected')).toContainText('direction');
		await page.getByTestId('close-analysis').click();
	}

	await page.reload();
	await applyGeneratedGraph(page, 'grid', { rows: 1, columns: 3 });
	await openTool(page, 'edges');
	await page.getByTestId('edge-list').locator('[data-testid^="delete-edge-"]').first().click();
	await openTool(page, 'analyze');
	for (const id of ['node-eccentricity', 'graph-diameter', 'graph-radius', 'graph-center']) {
		await picker.selectOption(id);
		await page.getByTestId('run-analysis').click();
		await expect(page.getByTestId('analysis-rejected')).toContainText('connected');
		await page.getByTestId('close-analysis').click();
	}
	await picker.selectOption('graph-girth');
	await page.getByTestId('run-analysis').click();
	await expect(page.getByTestId('analysis-no-result')).toContainText('no cycle');
	await page.getByTestId('close-analysis').click();
	await picker.selectOption('tree-forest-detection');
	await page.getByTestId('run-analysis').click();
	await expect(page.getByTestId('analysis-result')).toContainText('Forest');
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
	await page.getByTestId('analysis-field-maxSteps').fill('50');
	await page.getByTestId('analysis-field-seed').fill('7');
	await page.getByTestId('run-analysis').click();
	await expect(page.getByTestId('analysis-result')).toContainText('Seed');
	await expect(page.getByTestId('analysis-result')).toContainText('7');
	const stepsRow = page
		.getByTestId('analysis-result')
		.locator('.metrics > div')
		.filter({
			has: page.locator('dt', { hasText: 'Steps taken' })
		});
	await expect(stepsRow).toHaveCount(1);
	expect(Number(await stepsRow.locator('dd').textContent())).toBeLessThan(50);
	await expect(page.getByTestId('analysis-result-panel')).toHaveAttribute(
		'data-reveal-state',
		/.+/
	);
});

test('DFS, depth limits, and bidirectional Search run through the generated Analyze form', async ({
	page
}) => {
	await page.goto('/');
	await applyGeneratedGraph(page, 'grid', { rows: 2, columns: 3 });
	await openTool(page, 'analyze');
	const picker = page.getByTestId('analysis-picker');

	await picker.selectOption('dfs');
	await chooseNode(page, 'analysis-field-start');
	await page.getByTestId('run-analysis').click();
	await expect(page.getByTestId('analysis-result')).toContainText('Visited');
	await page.getByTestId('close-analysis').click();
	await page.getByTestId('analysis-field-mode').selectOption('search');
	await chooseNode(page, 'analysis-field-target', 1);
	await page.getByTestId('run-analysis').click();
	await expect(page.getByTestId('analysis-result')).toContainText('Length');
	const searchPanel = page.getByTestId('analysis-result-panel');
	await expect(searchPanel).toHaveAttribute('data-path-replay-order', /^node:.+,edge:.+,node:.+/);
	await expect(searchPanel).toHaveAttribute('data-landmark-start-scale', '1.9');
	await expect(searchPanel).toHaveAttribute('data-landmark-end-scale', '1.9');
	await expect(searchPanel).toHaveAttribute('data-landmark-style', 'solid-high-contrast');
	await expect(searchPanel).toHaveAttribute('data-exploration-edge-roles', 'active settled');
	await expect(searchPanel).toHaveAttribute('data-traversal-palette', 'orange');
	await expect(searchPanel).toHaveAttribute('data-path-palette', 'green');

	await page.getByTestId('close-analysis').click();
	await picker.selectOption('depth-limited-dfs');
	await page.getByTestId('analysis-field-mode').selectOption('search');
	await chooseNode(page, 'analysis-field-start');
	await chooseNode(page, 'analysis-field-target', 1);
	await page.getByTestId('analysis-field-maxDepth').fill('0');
	await page.getByTestId('run-analysis').click();
	await expect(page.getByTestId('analysis-result')).toContainText('Visited');
	await expect(page.getByTestId('analysis-result')).not.toContainText('Length');
	const noResult = page.getByTestId('analysis-no-result');
	await expect(noResult.getByRole('heading', { name: 'No result' })).toBeVisible();
	await expect(noResult).toContainText('Target was not reached.');

	await page.getByTestId('close-analysis').click();
	await picker.selectOption('bidirectional-bfs');
	await chooseNode(page, 'analysis-field-start');
	await chooseNode(page, 'analysis-field-target', 1);
	await page.getByTestId('run-analysis').click();
	await expect(page.getByTestId('analysis-result')).toContainText('Length');
	await expect(page.getByTestId('analysis-result-panel')).toHaveAttribute(
		'data-reveal-state',
		/.+/
	);
	await expect(page.getByTestId('analysis-result-panel')).toHaveAttribute(
		'data-exploration-edge-roles',
		'active settled'
	);
});

test('planarity analysis and its rotation-system result run in Analyze', async ({ page }) => {
	await page.goto('/');
	await applyGeneratedGraph(page, 'grid', { rows: 2, columns: 3 });
	await openTool(page, 'analyze');
	const picker = page.getByTestId('analysis-picker');
	await picker.selectOption('planarity-test');
	await page.getByTestId('run-analysis').click();
	await expect(page.getByTestId('analysis-result')).toContainText('Planar');
	await expect(page.getByTestId('analysis-result')).toContainText('Stored edges');

	await page.getByTestId('close-analysis').click();
	await picker.selectOption('planar-embedding');
	await page.getByTestId('run-analysis').click();
	await expect(page.getByTestId('analysis-result')).toContainText('Clockwise rotation system');
	await expect(page.getByTestId('analysis-result')).toContainText('Clockwise incident edge IDs');
	await expect(page.getByTestId('analysis-result')).toContainText('N1');
});

test('community and exact route analyses expose their generic results', async ({ page }) => {
	await page.goto('/');
	await applyGeneratedGraph(page, 'grid', { rows: 2, columns: 3 });
	await openTool(page, 'analyze');
	const picker = page.getByTestId('analysis-picker');
	for (const [algorithm, expected] of [
		['louvain-community-detection', 'Modularity'],
		['label-propagation', 'Update passes'],
		['traveling-salesman', 'Total cost'],
		['chinese-postman', 'Repeated traversals']
	]) {
		await picker.selectOption(algorithm);
		await page.getByTestId('run-analysis').click();
		await expect(page.getByTestId('analysis-result')).toContainText(expected);
		await page.getByTestId('close-analysis').click();
	}
});
