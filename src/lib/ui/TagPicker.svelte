<script lang="ts">
	let {
		tags,
		suggestions,
		onChange
	}: {
		tags: string[];
		suggestions: string[];
		onChange: (tags: string[]) => void;
	} = $props();

	let open = $state(false);
	let query = $state('');
	let rootEl = $state<HTMLDivElement | undefined>(undefined);
	let fieldEl = $state<HTMLDivElement | undefined>(undefined);
	let searchEl = $state<HTMLInputElement | undefined>(undefined);
	let dropdownStyle = $state('');

	const selected = $derived(new Set(tags));
	const q = $derived(query.trim());
	const qLower = $derived(q.toLowerCase());

	const filtered = $derived(
		suggestions
			.filter((t) => !selected.has(t))
			.filter((t) => (qLower ? t.toLowerCase().includes(qLower) : true))
			.slice(0, 40)
	);

	const canCreate = $derived(
		q.length > 0 &&
			!selected.has(q) &&
			!suggestions.some((t) => t.toLowerCase() === qLower)
	);

	function syncDropdownPosition() {
		const field = fieldEl;
		if (!field) return;
		const rect = field.getBoundingClientRect();
		dropdownStyle = `top:${rect.bottom + 4}px;left:${rect.left}px;width:${rect.width}px;`;
	}

	function openDropdown() {
		open = true;
		queueMicrotask(() => {
			syncDropdownPosition();
			searchEl?.focus();
		});
	}

	function closeDropdown() {
		open = false;
		query = '';
		dropdownStyle = '';
	}

	function addTag(tag: string) {
		const t = tag.trim();
		if (!t || selected.has(t)) return;
		onChange([...tags, t]);
		query = '';
		queueMicrotask(() => searchEl?.focus());
	}

	function removeTag(tag: string) {
		onChange(tags.filter((t) => t !== tag));
	}

	function onSearchKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			closeDropdown();
			return;
		}
		if (e.key === 'Enter') {
			e.preventDefault();
			if (filtered.length === 1) addTag(filtered[0]);
			else if (canCreate) addTag(q);
			else if (filtered.length > 0) addTag(filtered[0]);
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

<div class="tag-picker" data-testid="node-tags" bind:this={rootEl}>
	<div class="tag-field" class:open bind:this={fieldEl}>
		<button
			type="button"
			class="tag-add"
			data-testid="node-tags-open"
			aria-label="Add tag"
			aria-expanded={open}
			onclick={() => (open ? closeDropdown() : openDropdown())}
		>
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path
					fill="currentColor"
					d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
				/>
			</svg>
		</button>
		<div class="tag-pills">
			{#each tags as tag (tag)}
				<span class="tag-pill">
					{tag}
					<button
						type="button"
						class="tag-remove"
						aria-label={`Remove tag ${tag}`}
						data-testid={`node-tag-remove-${tag}`}
						onclick={() => removeTag(tag)}>×</button
					>
				</span>
			{/each}
			{#if tags.length === 0}
				<span class="tag-empty">No tags</span>
			{/if}
		</div>
	</div>

	{#if open}
		<div
			class="tag-dropdown"
			role="listbox"
			aria-label="Tag suggestions"
			style={dropdownStyle}
		>
			<input
				bind:this={searchEl}
				class="tag-search"
				type="text"
				data-testid="node-tags-search"
				placeholder="Search or create…"
				bind:value={query}
				onkeydown={onSearchKeydown}
			/>
			<ul class="tag-results">
				{#each filtered as tag (tag)}
					<li>
						<button
							type="button"
							class="tag-option"
							data-testid={`node-tag-option-${tag}`}
							onclick={() => addTag(tag)}>{tag}</button
						>
					</li>
				{/each}
				{#if canCreate}
					<li>
						<button
							type="button"
							class="tag-option create"
							data-testid="node-tags-create"
							onclick={() => addTag(q)}>Create “{q}”</button
						>
					</li>
				{/if}
				{#if filtered.length === 0 && !canCreate}
					<li class="tag-none muted">No matching tags</li>
				{/if}
			</ul>
		</div>
	{/if}
</div>

<style>
	.tag-picker {
		position: relative;
		width: 100%;
	}

	.tag-field {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		min-height: 2rem;
		padding: 0.3rem 0.4rem;
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-control);
		background: var(--yg-chip);
	}

	.tag-field.open {
		border-color: color-mix(in srgb, var(--yg-accent) 45%, var(--yg-border));
	}

	.tag-add {
		flex: 0 0 auto;
		display: inline-grid;
		place-items: center;
		width: 1.55rem;
		height: 1.55rem;
		padding: 0;
		margin: 0;
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-control);
		background: rgba(255, 255, 255, 0.55);
		color: var(--yg-muted);
		cursor: pointer;
	}

	.tag-add svg {
		width: 0.95rem;
		height: 0.95rem;
	}

	.tag-add:hover {
		color: var(--yg-fg);
		background: rgba(255, 255, 255, 0.8);
	}

	.tag-pills {
		flex: 1 1 auto;
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		min-width: 0;
		align-items: center;
	}

	.tag-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.15rem;
		max-width: 100%;
		padding: 0.12rem 0.2rem 0.12rem 0.45rem;
		border-radius: var(--yg-radius-pill);
		border: 1px solid var(--yg-border);
		background: rgba(255, 255, 255, 0.55);
		color: var(--yg-fg);
		font-size: 0.75rem;
		font-weight: 500;
		line-height: 1.2;
	}

	.tag-remove {
		display: inline-grid;
		place-items: center;
		width: 1.1rem;
		height: 1.1rem;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: transparent;
		color: var(--yg-muted);
		font-size: 0.85rem;
		line-height: 1;
		cursor: pointer;
	}

	.tag-remove:hover {
		color: #8b3a3a;
		background: color-mix(in srgb, #8b3a3a 12%, transparent);
	}

	.tag-empty {
		font-size: 0.8rem;
		font-weight: 400;
		color: var(--yg-muted);
	}

	.tag-dropdown {
		position: fixed;
		z-index: 40;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 0.4rem;
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-control);
		background: var(--yg-panel-glass-strong);
		box-shadow: 0 8px 20px rgba(15, 22, 32, 0.12);
		box-sizing: border-box;
	}

	.tag-search {
		width: 100%;
		box-sizing: border-box;
		font: inherit;
		font-size: 0.85rem;
		font-weight: 400;
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-control);
		padding: 0.35rem 0.5rem;
		background: var(--yg-chip);
		color: var(--yg-fg);
	}

	.tag-results {
		list-style: none;
		margin: 0;
		padding: 0;
		max-height: 10rem;
		overflow: auto;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.tag-option {
		width: 100%;
		text-align: left;
		font: inherit;
		font-size: 0.8rem;
		padding: 0.35rem 0.45rem;
		border: 1px solid transparent;
		border-radius: var(--yg-radius-control);
		background: transparent;
		color: var(--yg-fg);
		cursor: pointer;
	}

	.tag-option:hover {
		background: rgba(255, 255, 255, 0.55);
	}

	.tag-option.create {
		color: var(--yg-accent);
		font-weight: 600;
	}

	.tag-none {
		font-size: 0.8rem;
		padding: 0.35rem 0.45rem;
	}

	.muted {
		color: var(--yg-muted);
	}
</style>
