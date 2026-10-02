import type { GraphDocument } from '../model/types';
import type { AnalysisEvent } from './contracts';

type Interval = { low: number | null; high: number | null };
type ConflictPair = { left: Interval; right: Interval };
const emptyInterval = (): Interval => ({ low: null, high: null });
const intervalEmpty = (interval: Interval) => interval.low === null && interval.high === null;

function planarityEvent(
	events: AnalysisEvent[],
	action: string,
	refs: Record<string, string | number | boolean>
) {
	if (events.length >= 50_000) return;
	events.push({
		sequence: events.length,
		action,
		narration: { key: action, refs },
		roles: [],
		inspectors: []
	});
}

/** Deterministic left-right planarity test and embedding for a simple undirected graph. */
export function leftRightPlanarity(snapshot: GraphDocument): {
	planar: boolean;
	rotations: string[][];
	events: AnalysisEvent[];
} {
	const ids = Object.keys(snapshot.nodes);
	const count = ids.length;
	const index = new Map(ids.map((id, position) => [id, position]));
	const simpleEdges: [number, number][] = [];
	const seen = new Set<string>();
	for (const edge of Object.values(snapshot.edges)) {
		const from = index.get(edge.from)!;
		const to = index.get(edge.to)!;
		if (from === to) continue;
		const low = Math.min(from, to);
		const high = Math.max(from, to);
		const pair = `${low},${high}`;
		if (!seen.has(pair)) {
			seen.add(pair);
			simpleEdges.push([low, high]);
		}
	}
	const events: AnalysisEvent[] = [];
	const rotations = ids.map(() => [] as string[]);
	if (count > 2 && simpleEdges.length > 3 * count - 6) {
		planarityEvent(events, 'planarity-euler-bound', {
			nodes: count,
			edges: simpleEdges.length,
			planar: false
		});
		return { planar: false, rotations, events };
	}
	const keyOf = (from: number, to: number) => from * count + to;
	const adjacency = ids.map(() => [] as number[]);
	for (const [from, to] of simpleEdges) {
		adjacency[from].push(to);
		adjacency[to].push(from);
	}
	const oriented = new Set<number>();
	const hasOriented = (from: number, to: number) =>
		oriented.has(keyOf(from, to)) || oriented.has(keyOf(to, from));
	const height = ids.map(() => -1);
	const parentEdge = ids.map(() => -1);
	const lowpt = new Map<number, number>();
	const lowpt2 = new Map<number, number>();
	const nesting = new Map<number, number>();
	const roots: number[] = [];
	const arcFrom = (key: number) => Math.floor(key / count);
	const arcTo = (key: number) => key % count;
	const setOrient = (key: number) => oriented.add(key);
	for (let root = 0; root < count; root++) {
		if (height[root] !== -1) continue;
		height[root] = 0;
		roots.push(root);
		const stack = [root];
		const cursor = ids.map(() => 0);
		const skipInit = new Set<number>();
		while (stack.length) {
			const vertex = stack.pop()!;
			const parent = parentEdge[vertex];
			let descended = false;
			while (cursor[vertex] < adjacency[vertex].length) {
				const neighbor = adjacency[vertex][cursor[vertex]];
				const arc = keyOf(vertex, neighbor);
				if (!skipInit.has(arc)) {
					if (hasOriented(vertex, neighbor)) {
						cursor[vertex]++;
						continue;
					}
					setOrient(arc);
					lowpt.set(arc, height[vertex]);
					lowpt2.set(arc, height[vertex]);
					if (height[neighbor] === -1) {
						parentEdge[neighbor] = arc;
						height[neighbor] = height[vertex] + 1;
						planarityEvent(events, 'planarity-orient-tree-edge', {
							from: ids[vertex],
							to: ids[neighbor],
							depth: height[neighbor]
						});
						stack.push(vertex, neighbor);
						skipInit.add(arc);
						descended = true;
						break;
					}
					lowpt.set(arc, height[neighbor]);
					planarityEvent(events, 'planarity-orient-back-edge', {
						from: ids[vertex],
						to: ids[neighbor],
						lowpoint: height[neighbor]
					});
				}
				const low = lowpt.get(arc)!;
				const secondLow = lowpt2.get(arc)!;
				nesting.set(arc, 2 * low + (secondLow < height[vertex] ? 1 : 0));
				if (parent !== -1) {
					if (low < lowpt.get(parent)!) {
						lowpt2.set(parent, Math.min(lowpt.get(parent)!, secondLow));
						lowpt.set(parent, low);
					} else if (low > lowpt.get(parent)!) {
						lowpt2.set(parent, Math.min(lowpt2.get(parent)!, low));
					} else {
						lowpt2.set(parent, Math.min(lowpt2.get(parent)!, secondLow));
					}
					planarityEvent(events, 'planarity-update-lowpoint', {
						from: ids[vertex],
						to: ids[neighbor],
						parentLowpoint: lowpt.get(parent)!,
						secondLowpoint: lowpt2.get(parent)!
					});
				}
				cursor[vertex]++;
			}
			if (!descended && cursor[vertex] < adjacency[vertex].length) stack.push(vertex);
		}
	}

	const outgoing = ids.map(() => [] as number[]);
	for (const arc of oriented) outgoing[arcFrom(arc)].push(arc);
	for (const arcs of outgoing) arcs.sort((left, right) => nesting.get(left)! - nesting.get(right)!);
	let orderedNeighbors = outgoing.map((arcs) => arcs.map(arcTo));
	const conflicts: ConflictPair[] = [];
	const ref = new Map<number, number | null>();
	const side = new Map<number, number>();
	const stackBottom = new Map<number, ConflictPair | null>();
	const lowptEdge = new Map<number, number>();
	const peek = () => conflicts.at(-1) ?? null;
	const low = (arc: number) => lowpt.get(arc)!;
	const intervalConflicts = (interval: Interval, arc: number) =>
		!intervalEmpty(interval) && low(interval.high!) > low(arc);
	const pairLowest = (pair: ConflictPair) => {
		if (intervalEmpty(pair.left)) return low(pair.right.low!);
		if (intervalEmpty(pair.right)) return low(pair.left.low!);
		return Math.min(low(pair.left.low!), low(pair.right.low!));
	};
	const addConstraints = (edge: number, parent: number): boolean => {
		const merged: ConflictPair = { left: emptyInterval(), right: emptyInterval() };
		while (true) {
			const current = conflicts.pop();
			if (!current) return false;
			if (!intervalEmpty(current.left))
				[current.left, current.right] = [current.right, current.left];
			if (!intervalEmpty(current.left)) return false;
			if (low(current.right.low!) > low(parent)) {
				if (intervalEmpty(merged.right)) merged.right = { ...current.right };
				else ref.set(merged.right.low!, current.right.high);
				merged.right.low = current.right.low;
			} else ref.set(current.right.low!, lowptEdge.get(parent)!);
			if (peek() === stackBottom.get(edge)) break;
		}
		while (
			peek() &&
			(intervalConflicts(peek()!.left, edge) || intervalConflicts(peek()!.right, edge))
		) {
			const current = conflicts.pop()!;
			if (intervalConflicts(current.right, edge))
				[current.left, current.right] = [current.right, current.left];
			if (intervalConflicts(current.right, edge)) return false;
			ref.set(merged.right.low!, current.right.high);
			if (current.right.low !== null) merged.right.low = current.right.low;
			if (intervalEmpty(merged.left)) merged.left = { ...current.left };
			else ref.set(merged.left.low!, current.left.high);
			merged.left.low = current.left.low;
		}
		if (!intervalEmpty(merged.left) || !intervalEmpty(merged.right)) conflicts.push(merged);
		planarityEvent(events, 'planarity-merge-conflict-intervals', {
			edgeFrom: ids[arcFrom(edge)],
			edgeTo: ids[arcTo(edge)]
		});
		return true;
	};
	const removeBackEdges = (parent: number) => {
		const parentVertex = arcFrom(parent);
		while (conflicts.length && pairLowest(peek()!) === height[parentVertex]) {
			const pair = conflicts.pop()!;
			if (pair.left.low !== null) side.set(pair.left.low, -1);
		}
		if (conflicts.length) {
			const pair = conflicts.pop()!;
			while (pair.left.high !== null && arcTo(pair.left.high) === parentVertex)
				pair.left.high = ref.get(pair.left.high) ?? null;
			if (pair.left.high === null && pair.left.low !== null) {
				ref.set(pair.left.low, pair.right.low);
				side.set(pair.left.low, -1);
				pair.left.low = null;
			}
			while (pair.right.high !== null && arcTo(pair.right.high) === parentVertex)
				pair.right.high = ref.get(pair.right.high) ?? null;
			if (pair.right.high === null && pair.right.low !== null) {
				ref.set(pair.right.low, pair.left.low);
				side.set(pair.right.low, -1);
				pair.right.low = null;
			}
			conflicts.push(pair);
		}
		if (low(parent) < height[parentVertex]) {
			const top = peek();
			if (!top) return;
			const leftHigh = top.left.high;
			const rightHigh = top.right.high;
			if (leftHigh !== null && (rightHigh === null || low(leftHigh) > low(rightHigh)))
				ref.set(parent, leftHigh);
			else ref.set(parent, rightHigh);
		}
	};
	let planar = true;
	for (const root of roots) {
		planarityEvent(events, 'start-planarity-test-root', { root: ids[root] });
		const stack = [root];
		const cursor = ids.map(() => 0);
		const skipInit = new Set<number>();
		while (stack.length && planar) {
			const vertex = stack.pop()!;
			const parent = parentEdge[vertex];
			let skipFinal = false;
			while (cursor[vertex] < orderedNeighbors[vertex].length) {
				const neighbor = orderedNeighbors[vertex][cursor[vertex]];
				const arc = keyOf(vertex, neighbor);
				planarityEvent(events, 'planarity-test-edge', {
					from: ids[vertex],
					to: ids[neighbor],
					conflictStackDepth: conflicts.length
				});
				if (!skipInit.has(arc)) {
					stackBottom.set(arc, peek());
					if (parentEdge[neighbor] === arc) {
						stack.push(vertex, neighbor);
						skipInit.add(arc);
						skipFinal = true;
						break;
					}
					lowptEdge.set(arc, arc);
					conflicts.push({ left: emptyInterval(), right: { low: arc, high: arc } });
				}
				if (low(arc) < height[vertex]) {
					if (neighbor === orderedNeighbors[vertex][0]) lowptEdge.set(parent, lowptEdge.get(arc)!);
					else if (!addConstraints(arc, parent)) planar = false;
				}
				cursor[vertex]++;
			}
			if (!skipFinal) {
				if (parent !== -1) {
					removeBackEdges(parent);
					planarityEvent(events, 'planarity-resolve-back-edges', {
						parent: ids[arcFrom(parent)],
						conflictStackDepth: conflicts.length
					});
				}
			}
		}
	}
	if (!planar) {
		planarityEvent(events, 'planarity-conflict', { planar: false });
		return { planar: false, rotations, events };
	}

	for (const arc of oriented) {
		let current: number | null = arc;
		const path: number[] = [];
		const seenRefs = new Set<number>();
		while (current !== null && !seenRefs.has(current)) {
			seenRefs.add(current);
			path.push(current);
			current = ref.get(current) ?? null;
		}
		let sign = 1;
		for (let position = path.length - 1; position >= 0; position--) {
			const edge = path[position];
			sign *= side.get(edge) ?? 1;
			side.set(edge, sign);
			ref.set(edge, null);
		}
		nesting.set(arc, (side.get(arc) ?? 1) * nesting.get(arc)!);
	}
	for (const arcs of outgoing) arcs.sort((left, right) => nesting.get(left)! - nesting.get(right)!);
	orderedNeighbors = outgoing.map((arcs) => arcs.map(arcTo));
	const rotationNeighbors = ids.map(() => [] as number[]);
	const addRotationHalfEdge = (
		from: number,
		to: number,
		reference: number | null,
		direction: 'cw' | 'ccw' | 'first'
	) => {
		const row = rotationNeighbors[from];
		if (!row.length) {
			row.push(to);
			return;
		}
		if (direction === 'first') {
			row.unshift(to);
			return;
		}
		const at = row.indexOf(reference!);
		if (at < 0) {
			row.push(to);
			return;
		}
		row.splice(direction === 'cw' ? at : at + 1, 0, to);
	};
	for (let vertex = 0; vertex < count; vertex++) {
		let previous: number | null = null;
		for (const neighbor of orderedNeighbors[vertex]) {
			addRotationHalfEdge(vertex, neighbor, previous, previous === null ? 'first' : 'ccw');
			previous = neighbor;
		}
	}
	const leftRef = ids.map(() => -1);
	const rightRef = ids.map(() => -1);
	for (const root of roots) {
		const stack = [root];
		const cursor = ids.map(() => 0);
		while (stack.length) {
			const vertex = stack.pop()!;
			while (cursor[vertex] < orderedNeighbors[vertex].length) {
				const neighbor = orderedNeighbors[vertex][cursor[vertex]++];
				const arc = keyOf(vertex, neighbor);
				if (parentEdge[neighbor] === arc) {
					addRotationHalfEdge(neighbor, vertex, null, 'first');
					leftRef[vertex] = neighbor;
					rightRef[vertex] = neighbor;
					stack.push(vertex, neighbor);
					break;
				} else if ((side.get(arc) ?? 1) === 1) {
					addRotationHalfEdge(neighbor, vertex, rightRef[neighbor], 'ccw');
				} else {
					addRotationHalfEdge(neighbor, vertex, leftRef[neighbor], 'cw');
					leftRef[neighbor] = vertex;
				}
			}
		}
	}

	// Expand each simple adjacency back into its stored parallel edges, then place each loop as
	// two consecutive incidences. Parallel bundles are reversed at the opposite endpoint.
	const edgeRows = ids.map(() => [] as string[]);
	const bundles = new Map<string, string[]>();
	for (const edge of Object.values(snapshot.edges)) {
		const from = index.get(edge.from)!;
		const to = index.get(edge.to)!;
		if (from === to) continue;
		const low = Math.min(from, to);
		const high = Math.max(from, to);
		const key = `${low},${high}`;
		const bundle = bundles.get(key) ?? [];
		bundle.push(edge.id);
		bundles.set(key, bundle);
	}
	for (let vertex = 0; vertex < count; vertex++) {
		for (const neighbor of rotationNeighbors[vertex]) {
			const low = Math.min(vertex, neighbor);
			const high = Math.max(vertex, neighbor);
			const bundle = bundles.get(`${low},${high}`) ?? [];
			edgeRows[vertex].push(...(vertex === low ? bundle : [...bundle].reverse()));
		}
		for (const edge of Object.values(snapshot.edges))
			if (edge.from === ids[vertex] && edge.to === ids[vertex])
				edgeRows[vertex].push(edge.id, edge.id);
	}
	for (let vertex = 0; vertex < count; vertex++) rotations[vertex] = edgeRows[vertex];
	planarityEvent(events, 'planarity-embedding-complete', {
		planar: true,
		nodes: count,
		simpleEdges: simpleEdges.length
	});
	return { planar: true, rotations, events };
}
