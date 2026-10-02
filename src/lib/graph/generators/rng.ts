/** Seeded mulberry32 — same seed yields the same stream. */

export interface Rng {
	/** Uniform in [0, 1). */
	next(): number;
	int(min: number, max: number): number;
	chance(p: number): boolean;
	shuffle<T>(items: T[]): T[];
	pick<T>(items: readonly T[]): T;
}

export function createRng(seed: number): Rng {
	let a = seed >>> 0;
	const next = () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
	return {
		next,
		int(min, max) {
			if (max < min) return min;
			return min + Math.floor(next() * (max - min + 1));
		},
		chance(p) {
			return next() < p;
		},
		shuffle(items) {
			const out = items.slice();
			for (let i = out.length - 1; i > 0; i -= 1) {
				const j = Math.floor(next() * (i + 1));
				[out[i], out[j]] = [out[j], out[i]];
			}
			return out;
		},
		pick(items) {
			return items[Math.floor(next() * items.length)] ?? items[0];
		}
	};
}

/** Fresh seed for UI Generate clicks. */
export function randomSeed(): number {
	const buf = new Uint32Array(1);
	crypto.getRandomValues(buf);
	return buf[0] >>> 0;
}
