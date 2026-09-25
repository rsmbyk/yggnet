// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		/** E2E-only: keep the work overlay up this many ms after the document is swapped. */
		__YGGNET_BUSY_HOLD_MS?: number;
		/** E2E-only: run pin-aware re-layout (no UI button). */
		__YGGNET_RELAYOUT?: () => void;
		/** E2E-only: pin/unpin a node by id (pin UI removed). */
		__YGGNET_PIN_NODE?: (id: string, pinned?: boolean) => void;
	}
}

export {};
