import base from './playwright.config';

export default {
	...base,
	webServer: {
		...base.webServer,
		command: 'npm run dev -- --port 4174 --strictPort',
		port: 4174
	}
};
