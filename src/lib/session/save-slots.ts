export const SAVE_SLOT_PREFIX = 'yggnet.save.';

/** localStorage key for a named graph snapshot, or null if the name is blank. */
export function saveSlotStorageKey(name: string): string | null {
	const trimmed = name.trim();
	if (!trimmed) return null;
	return `${SAVE_SLOT_PREFIX}${trimmed}`;
}

/** Named save slots in storage, excluding autosave. Sorted by name. */
export function listSaveSlotNames(storage: Pick<Storage, 'length' | 'key'>): string[] {
	const names: string[] = [];
	for (let i = 0; i < storage.length; i++) {
		const key = storage.key(i);
		if (!key?.startsWith(SAVE_SLOT_PREFIX)) continue;
		const name = key.slice(SAVE_SLOT_PREFIX.length);
		if (name) names.push(name);
	}
	return names.sort((a, b) => a.localeCompare(b));
}
