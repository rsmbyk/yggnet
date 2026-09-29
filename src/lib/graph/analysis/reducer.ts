import type { AnalysisEvent, AnalysisRole } from './contracts';

export const TRACE_EVENT_LIMIT = 50_000;
export const CHECKPOINT_INTERVAL = 100;

export interface AnalysisInspectorState {
	kind: string;
	value: unknown;
}

export interface AnalysisFrame {
	eventIndex: number;
	narration?: AnalysisEvent['narration'];
	roles: { nodes: Record<string, AnalysisRole[]>; edges: Record<string, AnalysisRole[]> };
	inspectors: Record<string, AnalysisInspectorState>;
	progress?: number;
}

export interface AnalysisTrace {
	events: AnalysisEvent[];
	checkpoints: Array<{ eventIndex: number; frame: AnalysisFrame }>;
	truncated: boolean;
}

function cloneFrame(frame: AnalysisFrame): AnalysisFrame {
	return structuredClone(frame);
}

export function emptyAnalysisFrame(): AnalysisFrame {
	return { eventIndex: -1, roles: { nodes: {}, edges: {} }, inspectors: {} };
}

export function reduceAnalysisEvent(frame: AnalysisFrame, event: AnalysisEvent): AnalysisFrame {
	const next = cloneFrame(frame);
	next.eventIndex = event.sequence;
	next.narration = event.narration;
	next.progress = event.progress;
	for (const change of event.roles) {
		const collection = change.entity === 'node' ? next.roles.nodes : next.roles.edges;
		const roles = collection[change.id] ?? [];
		collection[change.id] =
			change.operation === 'add'
				? roles.includes(change.role)
					? roles
					: [...roles, change.role]
				: roles.filter((role) => role !== change.role);
	}
	for (const operation of event.inspectors) {
		const previous = next.inspectors[operation.inspector];
		if (operation.operation === 'reset') {
			next.inspectors[operation.inspector] = {
				kind: operation.kind,
				value: structuredClone(operation.value ?? (operation.kind === 'map' ? {} : []))
			};
			continue;
		}
		const state = previous ?? { kind: 'ordered-list', value: [] };
		if (operation.operation === 'set') {
			if (operation.key !== undefined) {
				state.value = {
					...(state.value as Record<string, unknown>),
					[operation.key]: operation.value
				};
			} else state.value = operation.value;
		} else {
			const values = Array.isArray(state.value) ? [...state.value] : [];
			if (
				operation.operation === 'enqueue' ||
				operation.operation === 'push' ||
				operation.operation === 'add' ||
				operation.operation === 'append'
			) {
				if (operation.operation !== 'add' || !values.includes(operation.value))
					values.push(operation.value);
			} else if (operation.operation === 'dequeue') values.shift();
			else if (operation.operation === 'pop') values.pop();
			else if (operation.operation === 'remove') {
				const index = values.indexOf(operation.value);
				if (index >= 0) values.splice(index, 1);
			}
			state.value = values;
		}
		next.inspectors[operation.inspector] = state;
	}
	return next;
}

export function buildAnalysisTrace(
	events: AnalysisEvent[],
	checkpointInterval = CHECKPOINT_INTERVAL
): AnalysisTrace {
	const retained = events.slice(0, TRACE_EVENT_LIMIT);
	const checkpoints: AnalysisTrace['checkpoints'] = [];
	let frame = emptyAnalysisFrame();
	for (let index = 0; index < retained.length; index += 1) {
		frame = reduceAnalysisEvent(frame, retained[index]);
		if (index % checkpointInterval === 0)
			checkpoints.push({ eventIndex: index, frame: cloneFrame(frame) });
	}
	return { events: retained, checkpoints, truncated: events.length > retained.length };
}

export function frameAt(trace: AnalysisTrace, eventIndex: number): AnalysisFrame {
	if (eventIndex < 0 || trace.events.length === 0) return emptyAnalysisFrame();
	const target = Math.min(eventIndex, trace.events.length - 1);
	let checkpoint = trace.checkpoints[0];
	for (const candidate of trace.checkpoints) {
		if (candidate.eventIndex <= target) checkpoint = candidate;
		else break;
	}
	let frame = checkpoint ? cloneFrame(checkpoint.frame) : emptyAnalysisFrame();
	for (let index = (checkpoint?.eventIndex ?? -1) + 1; index <= target; index += 1) {
		frame = reduceAnalysisEvent(frame, trace.events[index]);
	}
	return frame;
}
