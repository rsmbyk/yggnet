import { describe, expect, it } from 'vitest';
import { applyBump, applyBumpsInOrder, parseSemVer } from './semver';

describe('applyBumpsInOrder', () => {
	it('applies minor, patch, minor, patch from 0.3.1 → 0.5.1', () => {
		expect(applyBumpsInOrder('0.3.1', ['minor', 'patch', 'minor', 'patch'])).toBe('0.5.1');
	});

	it('skips none', () => {
		expect(applyBump('1.2.3', 'none')).toBe('1.2.3');
		expect(applyBumpsInOrder('1.0.0', ['none', 'patch'])).toBe('1.0.1');
	});

	it('applies major and rejects invalid versions', () => {
		expect(applyBump('1.2.3', 'major')).toBe('2.0.0');
		expect(applyBump('1.2.3', 'minor')).toBe('1.3.0');
		expect(() => parseSemVer('nope')).toThrow(/Invalid semver/);
	});
});
