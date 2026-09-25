import { expect, test } from '@playwright/test';
import { openTool } from './open-tool';

test('world selection panel sits in the tools dock and hides while a non-Nodes tool is open', async ({
	page
}) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });

	await page.getByTestId('world-add-node').click();
	await expect(page.getByTestId('world-node-sheet')).toBeVisible();

	await openTool(page, 'file');
	await expect(page.getByTestId('yggnet-manager')).toBeVisible();
	await expect(page.getByTestId('world-node-sheet')).toHaveCount(0);

	await page.getByTestId('tool-file').click();
	await expect(page.getByTestId('yggnet-manager')).toHaveCount(0);
	// Closing a tool clears selection, so the freestanding sheet stays gone.
	await expect(page.getByTestId('world-node-sheet')).toHaveCount(0);
});

test('Nodes tool shows node panel beside it for a single selection', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });

	await openTool(page, 'nodes');
	await page.getByTestId('add-node').click();
	await expect(page.getByTestId('yggnet-manager')).toBeVisible();
	await expect(page.getByTestId('world-node-sheet')).toBeVisible();
	await expect(page.getByTestId('world-connect')).toBeVisible();
	await expect(page.getByTestId('node-label')).toBeVisible();
	await expect(page.getByTestId('node-editor')).toHaveCount(0);

	const tool = await page.getByTestId('yggnet-manager').boundingBox();
	const sheet = await page.getByTestId('world-node-sheet').boundingBox();
	expect(tool).toBeTruthy();
	expect(sheet).toBeTruthy();
	expect(sheet!.x).toBeGreaterThanOrEqual(tool!.x + tool!.width - 2);

	await openTool(page, 'edges');
	await expect(page.getByTestId('world-node-sheet')).toHaveCount(0);
});

test('tool panel sits right of the toolbar under the menubar', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });
	await openTool(page, 'nodes');
	const menubar = page.getByTestId('world-add-node');
	const toolbar = page.getByTestId('yggnet-toolbar');
	const panel = page.getByTestId('yggnet-manager');
	await expect(panel).toBeVisible();
	const bar = await menubar.boundingBox();
	const rail = await toolbar.boundingBox();
	const card = await panel.boundingBox();
	expect(bar).toBeTruthy();
	expect(rail).toBeTruthy();
	expect(card).toBeTruthy();
	const gapUnderMenubar = card!.y - (bar!.y + bar!.height);
	expect(gapUnderMenubar).toBeGreaterThanOrEqual(8);
	expect(gapUnderMenubar).toBeLessThanOrEqual(20);
	expect(rail!.x).toBeLessThan(bar!.x + 8);
	expect(rail!.x + rail!.width).toBeLessThanOrEqual(card!.x + 2);
	const camera = page.getByTestId('camera-panel');
	const camBox = await camera.boundingBox();
	expect(camBox).toBeTruthy();
	expect(card!.y + card!.height).toBeLessThanOrEqual(camBox!.y - 8);
	const icon = await page.getByTestId('tool-nodes').boundingBox();
	expect(icon).toBeTruthy();
	const innerPadX = (rail!.width - icon!.width) / 2;
	expect(innerPadX).toBeGreaterThanOrEqual(6);
	await expect(toolbar).toHaveClass(/engaged/);
	await page.getByTestId('tool-edges').click();
	await expect(
		page.getByTestId('yggnet-manager').getByText('Edges', { exact: true })
	).toBeVisible();
});

test('HUD chrome shares button size, inset, and edge padding', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });
	await page.getByTestId('world-add-node').click();
	await expect(page.getByTestId('world-node-sheet')).toBeVisible();

	const metrics = await page.evaluate(() => {
		const rect = (el: Element) => el.getBoundingClientRect();
		const pad = (el: Element) => {
			const cs = getComputedStyle(el);
			return {
				t: parseFloat(cs.paddingTop),
				r: parseFloat(cs.paddingRight),
				b: parseFloat(cs.paddingBottom),
				l: parseFloat(cs.paddingLeft)
			};
		};
		const size = (el: Element) => {
			const r = rect(el);
			return { w: r.width, h: r.height };
		};
		const chrome = document.querySelector('[aria-label="Menubar"]')!;
		const rail = document.querySelector('[data-testid="yggnet-toolbar"]')!;
		const cam = document.querySelector('[data-testid="camera-panel"]')!;
		const mini = document.querySelector('[data-testid="yggnet-minimap"]')!;
		const sheet = document.querySelector('[data-testid="world-node-sheet"]')!;
		const hud = document.querySelector('[data-testid="world-hud"]')!;
		const menubarBtn = document.querySelector('[data-testid="world-add-node"]')!;
		const toolbarBtn = document.querySelector('[data-testid="tool-nodes"]')!;
		const camBtn = document.querySelector('[data-testid="camera-view-mode"]')!;
		const hudPad = pad(hud);
		const camCs = getComputedStyle(cam);
		const camContentW =
			rect(cam).width -
			parseFloat(camCs.paddingLeft) -
			parseFloat(camCs.paddingRight) -
			parseFloat(camCs.borderLeftWidth) -
			parseFloat(camCs.borderRightWidth);
		const sheetBox = rect(sheet);
		const railBox = rect(rail);
		return {
			menubarBtn: size(menubarBtn),
			toolbarBtn: size(toolbarBtn),
			camBtn: size(camBtn),
			chromePad: pad(chrome),
			railPad: pad(rail),
			camPad: pad(cam),
			sheetPad: pad(sheet),
			hudPad,
			chromeTop: rect(chrome).top,
			railLeft: railBox.x,
			railTop: railBox.y,
			railRight: railBox.right,
			camLeft: rect(cam).x,
			camBottom: innerHeight - rect(cam).bottom,
			sheetTop: sheetBox.y,
			sheetLeft: sheetBox.x,
			gapMenubarToolbar: railBox.top - rect(chrome).bottom,
			miniW: rect(mini).width,
			camContentW,
			toolbarClass: rail.className
		};
	});

	const near = (a: number, b: number, slack = 1.5) => Math.abs(a - b) <= slack;

	expect(near(metrics.menubarBtn.w, metrics.toolbarBtn.w)).toBe(true);
	expect(near(metrics.menubarBtn.h, metrics.toolbarBtn.h)).toBe(true);
	expect(near(metrics.toolbarBtn.w, metrics.camBtn.w)).toBe(true);
	expect(near(metrics.toolbarBtn.h, metrics.camBtn.h)).toBe(true);

	const inset = metrics.railPad.l;
	expect(inset).toBeGreaterThanOrEqual(6);
	for (const p of [metrics.chromePad, metrics.railPad, metrics.camPad]) {
		expect(near(p.t, inset)).toBe(true);
		expect(near(p.r, inset)).toBe(true);
		expect(near(p.b, inset)).toBe(true);
		expect(near(p.l, inset)).toBe(true);
	}
	expect(near(metrics.sheetPad.t, inset * 2)).toBe(true);

	const edge = metrics.hudPad.t;
	expect(near(metrics.hudPad.r, edge)).toBe(true);
	expect(near(metrics.hudPad.b, edge)).toBe(true);
	expect(near(metrics.hudPad.l, edge)).toBe(true);
	expect(near(metrics.chromeTop, edge)).toBe(true);
	expect(near(metrics.railLeft, edge)).toBe(true);
	expect(near(metrics.camLeft, edge)).toBe(true);
	expect(near(metrics.camBottom, edge)).toBe(true);
	expect(near(metrics.gapMenubarToolbar, edge)).toBe(true);
	expect(near(metrics.sheetTop, metrics.railTop)).toBe(true);
	expect(metrics.sheetLeft + 1).toBeGreaterThanOrEqual(metrics.railRight);
	expect(metrics.toolbarClass.includes('engaged')).toBe(false);
	expect(near(metrics.miniW, metrics.camContentW)).toBe(true);

	await page.getByTestId('tool-nodes').click();
	const open = await page.evaluate(() => {
		const pad = (el: Element) => {
			const cs = getComputedStyle(el);
			return parseFloat(cs.paddingTop);
		};
		const rail = document.querySelector('[data-testid="yggnet-toolbar"]')!;
		const panel = document.querySelector('[data-testid="yggnet-manager"]')!;
		const rr = rail.getBoundingClientRect();
		const pr = panel.getBoundingClientRect();
		return {
			panelPad: pad(panel),
			railPad: pad(rail),
			gap: pr.x - rr.right
		};
	});
	expect(Math.abs(open.panelPad - open.railPad * 2)).toBeLessThanOrEqual(2);
	expect(Number.isFinite(open.gap)).toBe(true);
});
