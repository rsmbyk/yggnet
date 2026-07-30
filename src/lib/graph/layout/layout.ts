import type { GraphDocument } from '../model/types';
import { updateNode } from '../ops/ops';

export interface LayoutOptions {
	/** Circle radius base for unpinned nodes. */
	radius?: number;
}

/**
 * One-shot layout: reposition unpinned nodes on a circle around the centroid of pinned nodes
 * (or the graph centroid when nothing is pinned). Pinned nodes keep their positions.
 */
export function layoutUnpinned(doc: GraphDocument, options: LayoutOptions = {}): GraphDocument {
	const nodes = Object.values(doc.nodes);
	if (nodes.length === 0) return doc;

	const pinned = nodes.filter((n) => n.pinned);
	const unpinned = nodes.filter((n) => !n.pinned);
	if (unpinned.length === 0) return doc;

	let cx = 0;
	let cz = 0;
	if (pinned.length > 0) {
		for (const p of pinned) {
			cx += p.position.x;
			cz += p.position.z;
		}
		cx /= pinned.length;
		cz /= pinned.length;
	} else {
		for (const n of nodes) {
			cx += n.position.x;
			cz += n.position.z;
		}
		cx /= nodes.length;
		cz /= nodes.length;
	}

	const baseRadius = options.radius ?? 4 + unpinned.length * 0.35;

	let next = doc;
	const count = unpinned.length;
	for (let i = 0; i < count; i++) {
		const node = unpinned[i];
		const angle = (i / count) * Math.PI * 2 + 0.25;
		const r = baseRadius + (i % 2) * 0.6;
		const position = {
			x: cx + Math.cos(angle) * r,
			y: node.position.y,
			z: cz + Math.sin(angle) * r
		};
		next = updateNode(next, node.id, { position });
	}
	return next;
}
