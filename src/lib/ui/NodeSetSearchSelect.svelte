<script lang="ts">
	import NodeSearchSelect from './NodeSearchSelect.svelte';

	let {
		nodes,
		value,
		testid,
		ariaLabel,
		onChange
	}: {
		nodes: { id: string; label: string }[];
		value: string[];
		testid: string;
		ariaLabel: string;
		onChange: (ids: string[]) => void;
	} = $props();

	const available = $derived(nodes.filter((node) => !value.includes(node.id)));

	function add(id: string) {
		if (id && !value.includes(id)) onChange([...value, id]);
	}

	function remove(id: string) {
		onChange(value.filter((candidate) => candidate !== id));
	}
</script>

<div class="node-set" data-testid={testid} data-value={value.join(',')}>
	{#if value.length > 0}
		<ol aria-label={`${ariaLabel} selection order`}>
			{#each value as id, index (id)}
				{@const selected = nodes.find((node) => node.id === id)}
				<li>
					<span><b>{index + 1}</b>{selected?.label ?? id}</span>
					<button
						type="button"
						aria-label={`Remove ${selected?.label ?? id}`}
						onclick={() => remove(id)}>×</button
					>
				</li>
			{/each}
		</ol>
	{/if}
	<NodeSearchSelect
		nodes={available}
		value=""
		testid={`${testid}-add`}
		ariaLabel={`Add ${ariaLabel}`}
		placeholder="Add node…"
		onChange={add}
	/>
</div>

<style>
	.node-set {
		display: grid;
		gap: 0.35rem;
	}
	ol {
		display: grid;
		gap: 0.25rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.4rem;
		min-height: 1.8rem;
		padding: 0.2rem 0.25rem 0.2rem 0.45rem;
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-control);
		background: var(--yg-chip);
		font-size: 0.8rem;
	}
	li span {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		min-width: 0;
	}
	li b {
		display: inline-grid;
		place-items: center;
		width: 1.15rem;
		height: 1.15rem;
		border-radius: 999px;
		background: var(--yg-accent-soft);
		color: var(--yg-accent);
		font-size: 0.68rem;
	}
	li button {
		display: inline-grid;
		place-items: center;
		width: 1.35rem;
		height: 1.35rem;
		padding: 0;
		border: 0;
		border-radius: 999px;
		background: transparent;
		color: var(--yg-muted);
		font: inherit;
		cursor: pointer;
	}
	li button:hover {
		background: rgba(0, 0, 0, 0.06);
		color: var(--yg-fg);
	}
</style>
