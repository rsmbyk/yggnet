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

	/** Selected tags that match the query — shown muted at the bottom while searching. */
	const alreadyAdded = $derived(
		qLower
			? tags.filter((t) => t.toLowerCase().includes(qLower)).slice(0, 20)
			: []
	);

	const canCreate = $derived(
		q.length > 0 &&
			!selected.has(q) &&
			!suggestions.some((t) => t.toLowerCase() === qLower)
	);

	const showEmpty = $derived(filtered.length === 0 && !canCreate && alreadyAdded.length === 0);

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
		queueMicrotask(() => fieldEl?.focus());
	}

	function toggleDropdown() {
		if (open) closeDropdown();
		else openDropdown();
	}

	function onFieldClick(e: MouseEvent) {
		const t = e.target;
		if (t instanceof Element && t.closest('.tag-remove')) return;
		toggleDropdown();
	}

	function onFieldKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			toggleDropdown();
		}
	}

	function addTag(tag: string) {
		const t = tag.trim();
		if (!t || selected.has(t)) return;
		onChange([...tags, t]);
		query = '';
		queueMicrotask(() => searchEl?.focus());
	}

	function removeTag(tag: string, e?: MouseEvent) {
		e?.stopPropagation();
		onChange(tags.filter((t) => t !== tag));
	}

	function onRemovePointerDown(e: PointerEvent) {
		e.stopPropagation();
	}

	function onSearchKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
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
	<div
		class="tag-field"
		class:open
		bind:this={fieldEl}
		role="button"
		tabindex="0"
		data-testid="node-tags-open"
		aria-label="Add tags"
		aria-expanded={open}
		aria-haspopup="listbox"
		onclick={onFieldClick}
		onkeydown={onFieldKeydown}
	>
		<div class="tag-pills">
			{#each tags as tag (tag)}
				<span class="tag-pill">
					{tag}
					<button
						type="button"
						class="tag-remove"
						tabindex="-1"
						aria-label={`Remove tag ${tag}`}
						data-testid={`node-tag-remove-${tag}`}
						onpointerdown={onRemovePointerDown}
						onclick={(e) => removeTag(tag, e)}>×</button
					>
				</span>
			{/each}
			{#if tags.length === 0}
				<span class="tag-empty">Add tags…</span>
			{/if}
		</div>
		<svg class="tag-chevron" viewBox="0 0 12 8" aria-hidden="true">
			<path fill="currentColor" d="M1.2 1.4 6 6.2 10.8 1.4" />
		</svg>
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
				{#each alreadyAdded as tag (tag)}
					<li>
						<span
							class="tag-option added"
							aria-disabled="true"
							data-testid={`node-tag-added-${tag}`}
						>
							<span class="tag-option-label">{tag}</span>
							<span class="tag-added-badge">Added</span>
						</span>
					</li>
				{/each}
				{#if showEmpty}
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
		padding: 0.3rem 0.45rem 0.3rem 0.4rem;
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-control);
		background: var(--yg-chip);
		cursor: pointer;
		transition:
			background var(--yg-motion-fast, 120ms) var(--yg-ease, ease),
			border-color var(--yg-motion-fast, 120ms) var(--yg-ease, ease);
	}

	.tag-field:hover {
		background: rgba(255, 255, 255, 0.72);
		border-color: color-mix(in srgb, var(--yg-accent) 35%, var(--yg-border));
	}

	.tag-field.open {
		border-color: color-mix(in srgb, var(--yg-accent) 45%, var(--yg-border));
		background: rgba(255, 255, 255, 0.72);
	}

	.tag-field:focus-visible {
		outline: 2px solid color-mix(in srgb, var(--yg-accent) 55%, transparent);
		outline-offset: 1px;
	}

	.tag-pills {
		flex: 1 1 auto;
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		min-width: 0;
		align-items: center;
	}

	.tag-chevron {
		flex: 0 0 auto;
		width: 0.7rem;
		height: 0.45rem;
		color: var(--yg-muted);
		transition: transform var(--yg-motion-fast, 120ms) var(--yg-ease, ease);
	}

	.tag-field.open .tag-chevron {
		transform: rotate(180deg);
		color: var(--yg-accent);
	}

	.tag-field:hover .tag-chevron {
		color: var(--yg-fg);
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
		line-height: 0;
		cursor: pointer;
	}

	.tag-remove:hover {
		color: #8b3a3a;
		background: color-mix(in srgb, #8b3a3a 12%, transparent);
	}

	.tag-remove:focus-visible {
		outline: 2px solid color-mix(in srgb, var(--yg-accent) 55%, transparent);
		outline-offset: 1px;
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
		background: rgba(244, 246, 248, 0.96);
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

	.tag-option:hover:not(.added) {
		background: rgba(255, 255, 255, 0.55);
	}

	.tag-option.create {
		color: var(--yg-accent);
		font-weight: 600;
	}

	.tag-option.added {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		box-sizing: border-box;
		color: var(--yg-muted);
		cursor: default;
		pointer-events: none;
		opacity: 0.72;
	}

	.tag-option-label {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tag-added-badge {
		flex: 0 0 auto;
		font-size: 0.65rem;
		font-weight: 600;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		color: var(--yg-muted);
		padding: 0.1rem 0.35rem;
		border-radius: var(--yg-radius-pill);
		border: 1px solid var(--yg-border);
		background: color-mix(in srgb, var(--yg-chip) 80%, transparent);
	}

	.tag-none {
		font-size: 0.8rem;
		padding: 0.35rem 0.45rem;
	}

	.muted {
		color: var(--yg-muted);
	}
</style>
