export const RESULT_IDLE_REPLAY_MS = 10_000;

const RESULT_ACTIVITY_EVENTS = [
	'mousemove',
	'mousedown',
	'mouseup',
	'pointermove',
	'pointerdown',
	'pointerup',
	'click',
	'wheel',
	'touchstart',
	'touchmove',
	'keydown'
] as const;

export function inspectorValueSummary(value: unknown): { count: number; empty: boolean } {
	let count = 0;
	if (Array.isArray(value)) count = value.length;
	else if (value && typeof value === 'object') count = Object.keys(value).length;
	else if (value !== undefined && value !== null && value !== '') count = 1;
	return { count, empty: count === 0 };
}

export function formatInspectorValue(
	value: unknown,
	label: (value: unknown) => string = (item) => String(item)
): string {
	if (inspectorValueSummary(value).empty) return 'Empty';
	if (Array.isArray(value)) return value.map(label).join(' → ');
	if (value && typeof value === 'object') {
		return Object.entries(value as Record<string, unknown>)
			.map(([key, item]) => `${label(key)}: ${label(item)}`)
			.join(', ');
	}
	return label(value);
}

export function watchResultIdle(
	target: EventTarget,
	onIdle: () => void,
	delay = RESULT_IDLE_REPLAY_MS
): () => void {
	let timer: ReturnType<typeof setTimeout>;
	const restart = () => {
		clearTimeout(timer);
		timer = setTimeout(onIdle, delay);
	};
	for (const type of RESULT_ACTIVITY_EVENTS) target.addEventListener(type, restart);
	restart();
	return () => {
		clearTimeout(timer);
		for (const type of RESULT_ACTIVITY_EVENTS) target.removeEventListener(type, restart);
	};
}
