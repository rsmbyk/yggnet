<script lang="ts">
	import { app } from '$lib/session/app.svelte';
	import { TOOLS, type ToolId } from './tool-ids';

	const dimmed = $derived(app.ui.openTool !== null);

	function iconPath(id: ToolId): string {
		switch (id) {
			case 'mode':
				return 'M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z';
			case 'file':
				return 'M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm8 1.5V8h4.5';
			case 'templates':
				return 'M3 3h8v8H3V3zm10 0h8v5h-8V3zM3 13h5v8H3v-8zm7 0h11v8H10v-8z';
			case 'nodes':
				return 'M12 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM5 14a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm14 0a3 3 0 1 1 0 6 3 3 0 0 1 0-6z';
			case 'edges':
				return 'M7 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm10 8a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM8.2 9h7.6v2H8.2z';
			case 'filters':
				return 'M3 5h18l-7 8v5l-4 2v-7L3 5z';
			case 'groups':
				return 'M7 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm10 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM12 20a3 3 0 1 1 0-6 3 3 0 0 1 0 6z';
			case 'pathfinder':
				return 'M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z';
			case 'analyze':
				return 'M4 20V10h3v10H4zm6.5 0V4h3v16h-3zM17 20v-7h3v7h-3z';
			case 'diff':
				return 'M5 4h6v2H5v12h6v2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 0h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6v-2h6V6h-6V4zm-1 6h2v4h-2v-4z';
		}
	}
</script>

<nav class="toolbar" class:dimmed data-testid="yggnet-toolbar" aria-label="Toolbar">
	{#each TOOLS as tool (tool.id)}
		<button
			type="button"
			class="icon-btn"
			class:active={app.ui.openTool === tool.id}
			data-testid={`tool-${tool.id}`}
			aria-label={tool.label}
			aria-pressed={app.ui.openTool === tool.id}
			title={tool.label}
			onclick={() => app.toggleTool(tool.id)}
		>
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path fill="currentColor" d={iconPath(tool.id)} />
			</svg>
		</button>
	{/each}
</nav>

<style>
	.toolbar {
		box-sizing: border-box;
		width: fit-content;
		max-height: 100%;
		display: flex;
		flex-direction: column;
		flex-wrap: nowrap;
		align-items: center;
		gap: 0.3rem;
		padding: 0.4rem 0;
		overflow: auto;
		border-radius: var(--yg-radius-pill);
		background: var(--yg-panel-glass-dim);
		border: 1px solid rgba(28, 36, 46, 0.1);
		box-shadow: 0 4px 16px rgba(28, 36, 46, 0.04);
		pointer-events: auto;
		transition:
			background var(--yg-motion) var(--yg-ease),
			border-color var(--yg-motion) var(--yg-ease),
			box-shadow var(--yg-motion) var(--yg-ease);
	}

	.toolbar:hover,
	.toolbar:focus-within {
		background: var(--yg-panel-glass);
		border-color: var(--yg-border);
		box-shadow: 0 6px 20px rgba(28, 36, 46, 0.12);
	}

	.toolbar.dimmed:hover,
	.toolbar.dimmed:focus-within {
		background: var(--yg-panel-glass-dim);
		border-color: rgba(28, 36, 46, 0.1);
		box-shadow: 0 4px 16px rgba(28, 36, 46, 0.04);
	}

	.icon-btn {
		display: inline-grid;
		place-items: center;
		width: 2.05rem;
		height: 2.05rem;
		padding: 0;
		flex-shrink: 0;
		border: 1px solid rgba(28, 36, 46, 0.1);
		background: var(--yg-chip-dim);
		color: var(--yg-fg);
		border-radius: var(--yg-radius-pill);
		cursor: pointer;
		opacity: var(--yg-hud-idle-opacity);
		transition:
			background var(--yg-motion) var(--yg-ease),
			border-color var(--yg-motion) var(--yg-ease),
			color var(--yg-motion) var(--yg-ease),
			opacity var(--yg-motion) var(--yg-ease);
	}

	.toolbar:hover .icon-btn,
	.toolbar:focus-within .icon-btn {
		opacity: var(--yg-hud-active-opacity);
		background: var(--yg-chip);
		border-color: var(--yg-border);
	}

	.toolbar.dimmed:hover .icon-btn,
	.toolbar.dimmed:focus-within .icon-btn,
	.toolbar.dimmed:hover .icon-btn:hover,
	.toolbar.dimmed:focus-within .icon-btn:hover {
		opacity: var(--yg-hud-idle-opacity);
		background: var(--yg-chip-dim);
		border-color: rgba(28, 36, 46, 0.1);
		color: var(--yg-fg);
	}

	.icon-btn svg {
		width: 1.05rem;
		height: 1.05rem;
		display: block;
	}

	.icon-btn.active,
	.toolbar.dimmed .icon-btn.active,
	.toolbar.dimmed:hover .icon-btn.active,
	.toolbar.dimmed:focus-within .icon-btn.active {
		opacity: var(--yg-hud-idle-opacity);
		background: var(--yg-accent-soft);
		color: var(--yg-accent);
		border-color: color-mix(in srgb, var(--yg-accent) 40%, var(--yg-border));
	}
</style>
