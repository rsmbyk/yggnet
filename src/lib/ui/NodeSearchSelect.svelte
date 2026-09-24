<script lang="ts">
	let {
		nodes,
		value,
		testid,
		ariaLabel,
		onChange
	}: {
		nodes: { id: string; label: string }[];
		value: string;
		testid: string;
		ariaLabel: string;
		onChange: (id: string) => void;
	} = $props();

	let open = $state(false);
	let query = $state('');
	let rootEl = $state<HTMLDivElement | undefined>(undefined);
	let fieldEl = $state<HTMLButtonElement | undefined>(undefined);
	let searchEl = $state<HTMLInputElement | undefined>(undefined);
	let dropdownStyle = $state('');

	const selected = $derived(nodes.find((n) => n.id === value) ?? null);
	const q = $derived(query.trim().toLowerCase());
	const filtered = $derived(
		nodes
			.filter((n) => {
				if (!q) return true;
				return n.label.toLowerCase().includes(q) || n.id.toLowerCase().startsWith(q);
			})
			.slice(0, 80)
	);

	function syncDropdownPosition() {
		const field = fieldEl;
		if (!field) return;
		const rect = field.getBoundingClientRect();
		dropdownStyle = `top:${rect.bottom + 4}px;left:${rect.left}px;width:${rect.width}px;`;
	}

	function openDropdown() {
		open = true;
		query = '';
		queueMicrotask(() => {
			syncDropdownPosition();
			searchEl?.focus();
		});
	}

	function closeDropdown() {
		open = false;
		query = '';
		dropdownStyle = '';
		queueMicrotask(() => fieldEl?.focus());
	}

	function toggleDropdown() {
		if (open) closeDropdown();
		else openDropdown();
	}

	function pick(id: string) {
		onChange(id);
		closeDropdown();
	}

	function onSearchKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			closeDropdown();
			return;
		}
		if (e.key === 'Enter') {
			e.preventDefault();
			if (filtered.length > 0) pick(filtered[0].id);
		}
	}

	function onDocPointerDown(e: PointerEvent) {
		if (!open || !rootEl) return;
		if (e.target instanceof Node && rootEl.contains(e.target)) return;
		closeDropdown();
	}

	$effect(() => {
		if (!open) return;
		syncDropdownPosition();
		document.addEventListener('pointerdown', onDocPointerDown, true);
		window.addEventListener('resize', syncDropdownPosition);
		window.addEventListener('scroll', syncDropdownPosition, true);
		return () => {
			document.removeEventListener('pointerdown', onDocPointerDown, true);
			window.removeEventListener('resize', syncDropdownPosition);
			window.removeEventListener('scroll', syncDropdownPosition, true);
		};
	});
</script>

<div class="node-search-select" data-testid={testid} data-value={value} bind:this={rootEl}>
	<button
		type="button"
		class="nss-field"
		class:open
		bind:this={fieldEl}
		aria-label={ariaLabel}
		aria-expanded={open}
		aria-haspopup="listbox"
		data-testid={`${testid}-open`}
		onclick={toggleDropdown}
	>
		<span class="nss-value">{selected?.label ?? '?'}</span>
		<svg class="nss-chevron" viewBox="0 0 12 8" aria-hidden="true">
			<path fill="currentColor" d="M1.2 1.4 6 6.2 10.8 1.4" />
		</svg>
	</button>

	{#if open}
		<div class="nss-dropdown" role="listbox" aria-label={ariaLabel} style={dropdownStyle}>
			<input
				bind:this={searchEl}
				class="nss-search"
				type="text"
				data-testid={`${testid}-search`}
				placeholder="Search nodes…"
				bind:value={query}
				onkeydown={onSearchKeydown}
			/>
			<ul class="nss-results">
				{#each filtered as n (n.id)}
					<li>
						<button
							type="button"
							class="nss-option"
							class:selected={n.id === value}
							role="option"
							aria-selected={n.id === value}
							data-testid={`${testid}-option-${n.id}`}
							onclick={() => pick(n.id)}>{n.label}</button
						>
					</li>
				{/each}
				{#if filtered.length === 0}
					<li class="nss-none muted">No matching nodes</li>
				{/if}
			</ul>
		</div>
	{/if}
</div>

<style>
	.node-search-select {
		position: relative;
		width: 100%;
	}

	.nss-field {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		width: 100%;
		min-height: 2rem;
		padding: 0.3rem 0.45rem 0.3rem 0.55rem;
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-control);
		background: var(--yg-chip);
		color: var(--yg-fg);
		font: inherit;
		font-size: 0.85rem;
		font-weight: 400;
		text-align: left;
		cursor: pointer;
		box-sizing: border-box;
	}

	.nss-field:hover {
		background: rgba(255, 255, 255, 0.72);
		border-color: color-mix(in srgb, var(--yg-accent) 35%, var(--yg-border));
	}

	.nss-field.open {
		border-color: color-mix(in srgb, var(--yg-accent) 45%, var(--yg-border));
		background: rgba(255, 255, 255, 0.72);
	}

	.nss-field:focus-visible {
		outline: 2px solid color-mix(in srgb, var(--yg-accent) 55%, transparent);
		outline-offset: 1px;
	}

	.nss-value {
		flex: 1 1 auto;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.nss-chevron {
		flex: 0 0 auto;
		width: 0.7rem;
		height: 0.45rem;
		color: var(--yg-muted);
		transition: transform var(--yg-motion-fast, 120ms) var(--yg-ease, ease);
	}

	.nss-field.open .nss-chevron {
		transform: rotate(180deg);
		color: var(--yg-accent);
	}

	.nss-dropdown {
		position: fixed;
		z-index: 80;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		max-height: min(16rem, 50vh);
		padding: 0.4rem;
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-panel);
		background: var(--yg-panel, #eef1f5);
		box-shadow: 0 8px 24px rgba(15, 22, 32, 0.18);
		box-sizing: border-box;
	}

	.nss-search {
		width: 100%;
		box-sizing: border-box;
		padding: 0.35rem 0.5rem;
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-control);
		background: var(--yg-chip);
		color: var(--yg-fg);
		font: inherit;
		font-size: 0.8rem;
	}

	.nss-search:focus {
		outline: 2px solid color-mix(in srgb, var(--yg-accent) 55%, transparent);
		outline-offset: 0;
	}

	.nss-results {
		list-style: none;
		margin: 0;
		padding: 0;
		overflow-y: auto;
		min-height: 0;
		flex: 1 1 auto;
	}

	.nss-option {
		display: block;
		width: 100%;
		padding: 0.35rem 0.5rem;
		border: none;
		border-radius: var(--yg-radius-control);
		background: transparent;
		color: var(--yg-fg);
		font: inherit;
		font-size: 0.8rem;
		text-align: left;
		cursor: pointer;
	}

	.nss-option:hover {
		background: color-mix(in srgb, var(--yg-accent) 14%, transparent);
	}

	.nss-option.selected {
		background: color-mix(in srgb, var(--yg-accent) 22%, transparent);
		font-weight: 600;
	}

	.nss-none {
		padding: 0.4rem 0.5rem;
		font-size: 0.8rem;
	}

	.muted {
		color: var(--yg-muted);
	}
</style>
