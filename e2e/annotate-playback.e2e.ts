import { expect, test } from '@playwright/test';

test('annotate step readback and trace playback', async ({ page }) => {
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
	await page.getByTestId('run-algo').click();
	await expect(page.getByTestId('run-status')).toBeVisible();

	await page.getByTestId('show-steps').check();
	await expect(page.getByTestId('step-scrubber')).toBeVisible();

	const annotation = 'Start node visited';
	await page.getByTestId('step-note').fill(annotation);
	await page.getByTestId('annotate-step').click();
	await expect(page.getByTestId('step-annotation-display')).toContainText(annotation);

	const scrubber = page.getByTestId('step-scrubber');
	const maxStep = Number(await scrubber.getAttribute('max'));
	if (maxStep < 1) throw new Error('Expected trace with multiple steps');
	await scrubber.fill('1');
	await expect(page.getByTestId('step-annotation-display')).toContainText('No note for this step');
	await scrubber.fill('0');
	await expect(page.getByTestId('step-annotation-display')).toContainText(annotation);

	await page.getByTestId('trace-play').click();
	await expect(page.getByTestId('trace-play')).toHaveText('Pause');
	await expect
		.poll(async () => scrubber.inputValue(), { timeout: 3000 })
		.not.toBe('0');

	await page.getByTestId('trace-play').click();
	await expect(page.getByTestId('trace-play')).toHaveText('Play');
	const pausedAt = await scrubber.inputValue();
	await page.waitForTimeout(500);
	await expect(scrubber).toHaveValue(pausedAt);

	await scrubber.fill('0');
	await expect(page.getByTestId('step-annotation-display')).toContainText(annotation);
});
