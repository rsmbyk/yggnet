import { expect, type Page } from '@playwright/test';

/** Open a toolbar section if it is not already the active panel. */
export async function openTool(page: Page, id: string) {
	const btn = page.getByTestId(`tool-${id}`);
	await expect(btn).toBeVisible();
	if ((await btn.getAttribute('aria-pressed')) !== 'true') {
		await btn.click();
	}
}

/** Generate a graph from the Generate form. */
export async function applyGeneratedGraph(
	page: Page,
	kind: string,
	fields: Record<string, string | number> = {}
) {
	await openTool(page, 'generate');
	await page.getByTestId('generate-kind').selectOption(kind);
	if (kind === 'named' && fields.named) {
		await page.getByTestId('generate-named').selectOption(String(fields.named));
	}
	if (fields.rows !== undefined) {
		await page.getByTestId('generate-rows').fill(String(fields.rows));
	}
	if (fields.columns !== undefined) {
		await page.getByTestId('generate-columns').fill(String(fields.columns));
	}
	if (fields.nodes !== undefined) {
		await page.getByTestId('generate-nodes').fill(String(fields.nodes));
	}
	await page.getByTestId('generate-submit').click();
}
