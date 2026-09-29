<script lang="ts">
	import { app } from '$lib/session/app.svelte';
	import { frameAt } from '$lib/graph';
	import { revealDuration } from '$lib/world/analysis-decoration';

	const current = $derived(app.analysis.current);
	const definition = $derived(
		current
			? app.analysisDefinitions.find((candidate) => candidate.id === current.algorithmId)
			: null
	);
	const frame = $derived(current ? frameAt(current.trace, current.cursor) : null);

	$effect(() => {
		if (!current || current.panel !== 'result' || current.reveal !== 'playing') return;
		const count = current.result.artifacts.reduce(
			(total, artifact) =>
				total +
				('nodeIds' in artifact ? artifact.nodeIds.length : 0) +
				('edgeIds' in artifact ? artifact.edgeIds.length : 0),
			0
		);
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const timer = window.setTimeout(
			() => app.skipAnalysisReveal(),
			reduced ? 0 : 250 + revealDuration(count)
		);
		return () => window.clearTimeout(timer);
	});

	$effect(() => {
		if (!current?.playing || current.panel !== 'trace') return;
		const last = current.trace.events.length - 1;
		if (current.cursor >= last) {
			app.setAnalysisPlaying(false);
			return;
		}
		const timer = window.setInterval(() => {
			const active = app.analysis.current;
			if (!active || active.cursor >= active.trace.events.length - 1) {
				app.setAnalysisPlaying(false);
				return;
			}
			app.seekAnalysis(active.cursor + 1);
		}, 600 / current.speed);
		return () => window.clearInterval(timer);
	});

	function display(value: unknown): string {
		if (Array.isArray(value)) return value.join(' → ') || 'Empty';
		if (value && typeof value === 'object') {
			return Object.entries(value as Record<string, unknown>)
				.map(([key, item]) => `${key}: ${String(item)}`)
				.join(', ');
		}
		return String(value ?? 'Empty');
	}
</script>

{#if current && current.panel !== 'closed'}
	<div
		class="analysis-panel"
		data-testid="analysis-result-panel"
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-label={`${definition?.name ?? 'Analysis'} ${current.panel}`}
	>
		<header>
			<div>
				<p class="eyebrow">{definition?.name}</p>
				<h2>{current.panel === 'result' ? 'Result' : 'Trace'}</h2>
			</div>
			<button
				type="button"
				aria-label="Close analysis"
				data-testid="close-analysis"
				onclick={() => app.closeAnalysisPanel()}>×</button
			>
		</header>

		<nav aria-label="Analysis view">
			<button
				type="button"
				class:active={current.panel === 'result'}
				onclick={() => app.showAnalysisResult()}>Result</button
			>
			<button
				type="button"
				class:active={current.panel === 'trace'}
				data-testid="open-trace"
				onclick={() => app.showAnalysisTrace()}>Trace</button
			>
		</nav>

		{#if current.panel === 'result'}
			<section data-testid="analysis-result">
				<p>{current.result.summary}</p>
				<div class="metrics">
					{#each current.result.metrics as metric (metric.label)}
						<div><strong>{metric.value}</strong><span>{metric.label}</span></div>
					{/each}
				</div>
				{#if current.result.outcome === 'no-result'}<p class="notice">No result</p>{/if}
				{#if current.reveal === 'playing'}
					<button type="button" data-testid="skip-reveal" onclick={() => app.skipAnalysisReveal()}
						>Skip animation</button
					>
				{:else}
					<button type="button" data-testid="replay-result" onclick={() => app.viewLastAnalysis()}
						>Replay</button
					>
				{/if}
				<button type="button" onclick={() => app.showAnalysisTrace()}>Analyze steps</button>
			</section>
		{:else}
			<section data-testid="analysis-trace">
				<p class="narration" data-testid="trace-narration">{frame?.narration?.key ?? 'Ready'}</p>
				{#if current.trace.truncated}<p class="notice">
						Playback is partial: the trace reached 50,000 actions.
					</p>{/if}
				<div class="inspectors" data-testid="analysis-inspectors">
					{#each Object.entries(frame?.inspectors ?? {}) as [name, inspector] (name)}
						<div><strong>{name}</strong><span>{display(inspector.value)}</span></div>
					{/each}
				</div>
				<div class="controls">
					<button
						type="button"
						data-testid="trace-previous"
						disabled={current.cursor <= 0}
						onclick={() => app.seekAnalysis(current.cursor - 1)}>Previous</button
					>
					<button
						type="button"
						data-testid="trace-play"
						onclick={() => app.setAnalysisPlaying(!current.playing)}
						>{current.playing ? 'Pause' : 'Play'}</button
					>
					<button
						type="button"
						data-testid="trace-next"
						disabled={current.cursor >= current.trace.events.length - 1}
						onclick={() => app.seekAnalysis(current.cursor + 1)}>Next</button
					>
				</div>
				<label
					>Step {current.cursor + 1} of {current.trace.events.length}
					<input
						type="range"
						min="0"
						max={Math.max(0, current.trace.events.length - 1)}
						value={current.cursor}
						data-testid="trace-scrubber"
						oninput={(event) => app.seekAnalysis(Number(event.currentTarget.value))}
					/>
				</label>
				<label
					>Speed
					<select
						value={current.speed}
						data-testid="trace-speed"
						onchange={(event) => app.setAnalysisPlaybackSpeed(Number(event.currentTarget.value))}
					>
						<option value="0.5">0.5×</option><option value="1">1×</option><option value="2"
							>2×</option
						>
					</select>
				</label>
			</section>
		{/if}

		<footer class="legend" aria-label="Analysis legend">
			{#each ['current', 'inspecting', 'frontier', 'settled', 'result', 'rejected'] as role (role)}
				<span data-role={role}><i></i>{role}</span>
			{/each}
		</footer>
	</div>
{/if}

<style>
	.analysis-panel {
		position: fixed;
		z-index: 40;
		right: 1rem;
		top: 1rem;
		bottom: 1rem;
		width: min(25rem, calc(100vw - 2rem));
		padding: 1rem;
		overflow: auto;
		border: 1px solid var(--yg-border);
		border-radius: 1rem;
		background: color-mix(in srgb, var(--yg-panel) 94%, transparent);
		backdrop-filter: blur(18px);
		box-shadow: 0 1rem 3rem #0005;
	}
	header,
	nav,
	.controls,
	.legend {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	header {
		justify-content: space-between;
	}
	h2,
	.eyebrow {
		margin: 0;
	}
	.eyebrow {
		color: var(--yg-muted);
		font-size: 0.75rem;
	}
	nav {
		margin: 1rem 0;
	}
	button.active {
		background: var(--yg-accent-soft);
	}
	.metrics {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
		margin: 1rem 0;
	}
	.metrics div,
	.inspectors div {
		display: flex;
		flex-direction: column;
		padding: 0.65rem;
		border-radius: 0.65rem;
		background: #ffffff0b;
	}
	.metrics span,
	.inspectors span {
		color: var(--yg-muted);
		font-size: 0.8rem;
	}
	.inspectors {
		display: grid;
		gap: 0.5rem;
		margin: 1rem 0;
	}
	.narration {
		min-height: 3rem;
		font-size: 1.05rem;
	}
	.notice {
		color: #f0bd68;
	}
	label {
		display: grid;
		gap: 0.35rem;
		margin-top: 0.8rem;
	}
	.legend {
		flex-wrap: wrap;
		margin-top: 1.2rem;
		font-size: 0.72rem;
		color: var(--yg-muted);
	}
	.legend span {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		text-transform: capitalize;
	}
	.legend i {
		width: 0.55rem;
		height: 0.55rem;
		border: 1px solid currentColor;
		border-radius: 50%;
	}
</style>
