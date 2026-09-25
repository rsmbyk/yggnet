/** Fields copied from a covering overlay wheel so the world camera can zoom. */
export type WheelForwardInit = {
	deltaX: number;
	deltaY: number;
	deltaZ: number;
	deltaMode: number;
	clientX: number;
	clientY: number;
	ctrlKey: boolean;
	shiftKey: boolean;
	altKey: boolean;
	metaKey: boolean;
};

export function wheelInitFrom(from: WheelForwardInit): WheelEventInit {
	return {
		bubbles: true,
		cancelable: true,
		deltaX: from.deltaX,
		deltaY: from.deltaY,
		deltaZ: from.deltaZ,
		deltaMode: from.deltaMode,
		clientX: from.clientX,
		clientY: from.clientY,
		ctrlKey: from.ctrlKey,
		shiftKey: from.shiftKey,
		altKey: from.altKey,
		metaKey: from.metaKey
	};
}

/** Copy a wheel event onto `target` so OrbitControls can zoom from a covering overlay. */
export function forwardWheelEvent(from: WheelEvent, target: EventTarget): void {
	target.dispatchEvent(new WheelEvent('wheel', wheelInitFrom(from)));
}

/** World WebGL canvas, if the scene has mounted. */
export function worldCanvas(root: ParentNode): HTMLCanvasElement | null {
	return root.querySelector('[data-testid="yggnet-world"] canvas');
}
