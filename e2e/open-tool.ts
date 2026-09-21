import { expect, type Page } from '@playwright/test';

/** Open a toolbar section if it is not already the active panel. */
export async function openTool(page: Page, id: string) {
	const btn = page.getByTestId(`tool-${id}`);
	await expect(btn).toBeVisible();
	if ((await btn.getAttribute('aria-pressed')) !== 'true') {
		await btn.click();
	}
}

/** Apply a starter template from the Templates form. */
export async function applyTemplate(
	page: Page,
	kind: 'blank' | 'org' | 'roadmap' | 'learning'
) {
	await openTool(page, 'templates');
	await page.getByTestId('template-kind').selectOption(kind);
	await page.getByTestId('apply-template').click();
}
