import path from 'path';

/** Repo-relative path with forward slashes (safe for markdown links on Windows). */
export function posixRel(p) {
	return p.split(path.sep).join('/');
}

/**
 * Read bump from YAML frontmatter (`bump:`) or vexbook markdown header (`- **Bump:**`).
 * Template placeholders like `major | minor | patch | none` are treated as unset.
 * @param {string} text
 */
export function readBump(text) {
	const yaml = text.match(/^bump:\s*(.+)$/m)?.[1]?.trim();
	if (yaml && !yaml.includes('|')) return yaml;

	const md = text.match(/^- \*\*Bump:\*\*\s*(.+)$/m)?.[1]?.trim();
	if (md && !md.includes('|')) return md;

	return 'minor';
}

/**
 * Update meta fields for board moves.
 * YAML packs keep workflow `status:` (done / in_review / in_progress).
 * Markdown packs use SDD status (`Draft | Accepted | Deprecated`). Board Done is
 * not SDD Deprecated — any execute/review/done move means the Draft was Accepted,
 * so we always write `Accepted` and never board vocabulary into `**Status:**`.
 * @param {string} text
 * @param {string} boardStatus
 * @param {string} date
 */
export function patchSpecMeta(text, boardStatus, date) {
	let out = text;
	// Board moves never write board vocabulary (done / in_progress) into the
	// spec: after Accept the spec status stays Accepted (see docs/PROCESS.md).
	// `boardStatus` is intentionally unused here.
	void boardStatus;
	if (/^status:/m.test(out)) {
		out = out.replace(/^status:.*$/m, `status: Accepted`);
	} else if (/^- \*\*Status:\*\*/m.test(out)) {
		out = out.replace(/^- \*\*Status:\*\*.*$/m, `- **Status:** Accepted`);
	}
	if (/^updated:/m.test(out)) {
		out = out.replace(/^updated:.*$/m, `updated: ${date}`);
	} else if (/^- \*\*Updated:\*\*/m.test(out)) {
		out = out.replace(/^- \*\*Updated:\*\*.*$/m, `- **Updated:** ${date}`);
	}
	return out;
}

/**
 * Set a YAML frontmatter field; append before closing `---` if missing.
 * @param {string} text
 * @param {string} key
 * @param {string} value
 */
export function setYamlField(text, key, value) {
	const re = new RegExp(`^${key}:.*$`, 'm');
	if (re.test(text)) return text.replace(re, `${key}: ${value}`);
	return text.replace(/^---\r?\n([\s\S]*?)\r?\n---/, (_all, body) => {
		return `---\n${String(body).trimEnd()}\n${key}: ${value}\n---`;
	});
}

/**
 * Drop only the board table row for this ITEM id (first cell), not summary mentions.
 * @param {string} text
 * @param {string} id
 */
export function stripItemRows(text, id) {
	const padded = String(id).padStart(3, '0');
	const rowRe = new RegExp(`^\\|\\s*(\\[ITEM-${padded}\\]\\([^)]*\\)|ITEM-${padded})\\s*\\|`);
	return text
		.split('\n')
		.filter((line) => !rowRe.test(line))
		.join('\n');
}
