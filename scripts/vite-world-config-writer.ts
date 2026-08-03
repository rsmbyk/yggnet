/**
 * Dev-only Vite middleware: POST body → src/lib/world/world-config.ts
 * Used by the World Tune panel “Save to config”.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Connect, Plugin } from 'vite';

const ROUTE = '/__yggnet/world-config';
const RELATIVE_TARGET = path.join('src', 'lib', 'world', 'world-config.ts');

function readBody(req: Connect.IncomingMessage): Promise<string> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		req.on('data', (c: Buffer) => chunks.push(c));
		req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
		req.on('error', reject);
	});
}

export function yggnetWorldConfigWriter(): Plugin {
	return {
		name: 'yggnet-world-config-writer',
		configureServer(server) {
			server.middlewares.use(async (req, res, next) => {
				const url = req.url?.split('?')[0];
				if (url !== ROUTE) {
					next();
					return;
				}
				if (req.method === 'OPTIONS') {
					res.statusCode = 204;
					res.end();
					return;
				}
				if (req.method !== 'POST') {
					res.statusCode = 405;
					res.setHeader('Content-Type', 'text/plain; charset=utf-8');
					res.end('POST only');
					return;
				}
				try {
					const body = await readBody(req);
					if (!body.includes('export const WORLD')) {
						res.statusCode = 400;
						res.setHeader('Content-Type', 'text/plain; charset=utf-8');
						res.end('Body must be a world-config.ts source file');
						return;
					}
					const target = path.resolve(server.config.root, RELATIVE_TARGET);
					fs.writeFileSync(target, body, 'utf8');
					res.statusCode = 204;
					res.end();
				} catch (err) {
					res.statusCode = 500;
					res.setHeader('Content-Type', 'text/plain; charset=utf-8');
					res.end(err instanceof Error ? err.message : 'Write failed');
				}
			});
		}
	};
}
