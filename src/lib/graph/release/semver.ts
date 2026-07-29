/**
 * Sequential SemVer bumps for a release (merge-to-develop order).
 * `none` skips a step.
 */

export type Bump = 'major' | 'minor' | 'patch' | 'none';

export function parseSemVer(version: string): { major: number; minor: number; patch: number } {
	const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(version.trim());
	if (!m) throw new Error(`Invalid semver: ${version}`);
	return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

export function formatSemVer(v: { major: number; minor: number; patch: number }): string {
	return `${v.major}.${v.minor}.${v.patch}`;
}

export function applyBump(version: string, bump: Bump): string {
	if (bump === 'none') return version;
	const v = parseSemVer(version);
	if (bump === 'major') return formatSemVer({ major: v.major + 1, minor: 0, patch: 0 });
	if (bump === 'minor') return formatSemVer({ major: v.major, minor: v.minor + 1, patch: 0 });
	return formatSemVer({ major: v.major, minor: v.minor, patch: v.patch + 1 });
}

/** Apply SPEC bumps in order (e.g. merge-to-develop order). */
export function applyBumpsInOrder(version: string, bumps: Bump[]): string {
	return bumps.reduce((v, b) => applyBump(v, b), version);
}
