import { expect, type Page } from '@playwright/test';

/** Open a toolbar section if it is not already the active panel. */
export async function openTool(page: Page, id: string) {
	const btn = page.getByTestId(`tool-${id}`);
	await expect(btn).toBeVisible();
	if ((await btn.getAttribute('aria-pressed')) !== 'true') {
		await btn.click();
	}
}
