import { expect, test } from '@playwright/test';

test('toggle directed on edge keeps world visible', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('yggnet-world')).toBeVisible({ timeout: 15_000 });

	const nodeList = page.getByTestId('node-list');
	const edgeList = page.getByTestId('edge-list');

	const nodeCount = await nodeList.locator('li').count();
	if (nodeCount < 2) {
		await page.getByTestId('add-node').click();
		await page.getByTestId('add-node').click();
	}

	const nodes = nodeList.locator('li');
	const fromLabel = (await nodes.nth(0).innerText()).trim();
	const toLabel = (await nodes.nth(1).innerText()).trim();

	await page.getByTestId('edge-from').selectOption({ label: fromLabel });
	await page.getByTestId('edge-to').selectOption({ label: toLabel });
	await page.getByTestId('add-edge').click();

	const edgeTestId = await edgeList.locator('[data-testid^="edge-item-"]').first().getAttribute('data-testid');
	expect(edgeTestId).toMatch(/^edge-item-/);
	const id = edgeTestId!.slice('edge-item-'.length);

	await page.getByTestId(`toggle-directed-${id}`).click();
	await expect(page.getByTestId('yggnet-world')).toBeVisible();
	await expect(page.getByTestId('yggnet-world').locator('canvas')).toBeVisible();

	await page.getByTestId(`toggle-directed-${id}`).click();
	await expect(page.getByTestId('yggnet-world')).toBeVisible();
	await expect(page.getByTestId('yggnet-world').locator('canvas')).toBeVisible();
});
