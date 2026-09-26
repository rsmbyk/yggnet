import { defineConfig } from '@playwright/test';

const isCi = !!process.env.CI;

export default defineConfig({
	webServer: {
		command: 'npm run dev -- --port 4173 --strictPort',
		port: 4173,
		reuseExistingServer: !isCi
	},
	testDir: 'e2e',
	testMatch: '**/*.e2e.ts',
	fullyParallel: true,
	forbidOnly: isCi,
	retries: isCi ? 1 : 0,
	// One worker in CI: the suite drives a software-rendered WebGL scene, and
	// two parallel browsers on a small runner starve the renderer until actions
	// time out (reproduced locally by pinning the run to 2 CPUs).
	workers: isCi ? 1 : undefined,
	use: {
		viewport: { width: 1280, height: 800 },
		trace: isCi ? 'on-first-retry' : 'off'
	}
});
