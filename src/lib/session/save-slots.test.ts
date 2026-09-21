import { describe, expect, it } from 'vitest';
import { listSaveSlotNames, SAVE_SLOT_PREFIX, saveSlotStorageKey } from './save-slots';

function fakeStorage(keys: string[]): Pick<Storage, 'length' | 'key'> {
	return {
		length: keys.length,
		key: (i) => keys[i] ?? null
	};
}

describe('saveSlotStorageKey', () => {
	it('prefixes a trimmed name', () => {
		expect(saveSlotStorageKey('  demo  ')).toBe(`${SAVE_SLOT_PREFIX}demo`);
	});

	it('rejects a blank name', () => {
		expect(saveSlotStorageKey('')).toBeNull();
		expect(saveSlotStorageKey('   ')).toBeNull();
	});
});

describe('listSaveSlotNames', () => {
	it('returns only named save slots, sorted', () => {
		expect(
			listSaveSlotNames(
				fakeStorage(['yggnet.autosave', 'yggnet.save.zebra', 'other', 'yggnet.save.alpha'])
			)
		).toEqual(['alpha', 'zebra']);
	});

	it('skips an empty name after the prefix', () => {
		expect(listSaveSlotNames(fakeStorage([SAVE_SLOT_PREFIX]))).toEqual([]);
	});
});
