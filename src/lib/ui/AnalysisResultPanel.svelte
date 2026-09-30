<script lang="ts">
	import { app } from '$lib/session/app.svelte';
	import { ANALYSIS_PLAYBACK_INTERVAL_MS } from '$lib/session/current-analysis';
	import { frameAt } from '$lib/graph';
	import { SvelteSet } from 'svelte/reactivity';
	import {
		analysisRevealDuration,
		analysisRevealStepCount,
		analysisResultLandmarks,
		analysisResultSequence,
		revealDuration
	} from '$lib/world/analysis-decoration';
	import {
		analysisResultStatus,
		analysisTransportState,
		formatInspectorValue,
		inspectorValueSummary,
		watchResultIdle
	} from './analysis-panel-policy';

	const current = $derived(app.analysis.current);
	const definition = $derived(
		current
			? app.analysisDefinitions.find((candidate) => candidate.id === current.algorithmId)
			: null
	);
	const frame = $derived(current ? frameAt(current.trace, current.cursor) : null);
	let panelElement = $state<HTMLElement>();
	let expandedInspectors = new SvelteSet<string>();
	let inspectorAnalysisKey: string | null = null;
	const resultLandmarks = $derived(
		current ? analysisResultLandmarks(current.result.artifacts) : {}
	);
	const resultLandmarkRoles = $derived(new Set(Object.values(resultLandmarks).flat()));
	const resultStatus = $derived(
		current ? analysisResultStatus(current.result.outcome, current.result.summary) : null
	);
	const transport = $derived(
		current
			? analysisTransportState(current.cursor, current.trace.events.length, current.playing)
			: { primary: 'play' as const, resetDisabled: true }
	);

	const inspectorCopy: Record<string, { name: string; description: string }> = {
		queue: { name: 'Queue', description: 'Nodes waiting to be explored, in processing order.' },
		visited: { name: 'Visited nodes', description: 'Nodes already visited by the traversal.' },
		distances: {
			name: 'Tentative distances',
			description: 'The best known cost from Start to each node.'
		},
		predecessors: {
			name: 'Predecessors',
			description: 'The previous node on each best known route.'
		},
		unsettled: {
			name: 'Unsettled nodes',
			description: 'Discovered nodes whose shortest distance is not final.'
		},
		settled: { name: 'Settled nodes', description: 'Nodes whose shortest distance is final.' }
	};

	const legendRoles = [
		{ id: 'current', label: 'Current' },
		{ id: 'inspecting', label: 'Inspecting' },
		{ id: 'frontier', label: 'Frontier' },
		{ id: 'settled', label: 'Settled' },
		{ id: 'result', label: 'Result' },
		{ id: 'rejected', label: 'Rejected' }
	] as const;

	$effect(() => {
		const element = panelElement;
		if (!element) return;
		const update = () => app.setAnalysisPanelWidth(element.getBoundingClientRect().width);
		update();
		const observer = new ResizeObserver(update);
		observer.observe(element);
		return () => {
			observer.disconnect();
			app.setAnalysisPanelWidth(0);
		};
	});

	$effect(() => {
		if (!current || current.panel !== 'result' || current.reveal !== 'playing') return;
		const count = current.result.reveal
			? analysisRevealStepCount(current.result.reveal)
			: analysisResultSequence(current.result.artifacts).length;
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const duration = current.result.reveal
			? analysisRevealDuration(current.result.reveal)
			: revealDuration(count);
		const timer = window.setTimeout(() => app.skipAnalysisReveal(), reduced ? 0 : 300 + duration);
		return () => window.clearTimeout(timer);
	});

	$effect(() => {
		if (!current || current.panel !== 'result' || current.reveal !== 'complete') return;
		return watchResultIdle(window, () => app.replayAnalysisResult());
	});

	$effect(() => {
		const key = current ? `${current.sourceRevision}:${current.algorithmId}` : null;
		if (key !== inspectorAnalysisKey || current?.panel === 'closed') {
			expandedInspectors.clear();
			inspectorAnalysisKey = current?.panel === 'closed' ? null : key;
		}
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
			app.seekAnalysis(active.cursor + 1, false);
		}, ANALYSIS_PLAYBACK_INTERVAL_MS);
		return () => window.clearInterval(timer);
	});

	function display(value: unknown): string {
		return formatInspectorValue(value, entityLabel);
	}

	function entityLabel(value: unknown): string {
		if (typeof value !== 'string') return String(value);
		return app.document.nodes[value]?.label ?? app.document.edges[value]?.label ?? value;
	}

	function count(value: unknown): number {
		return inspectorValueSummary(value).count;
	}

	function toggleInspector(id: string) {
		if (expandedInspectors.has(id)) expandedInspectors.delete(id);
		else expandedInspectors.add(id);
	}

	function activatePrimaryTransport() {
		if (!current) return;
		if (transport.primary === 'restart') {
			app.seekAnalysis(0);
			app.setAnalysisPlaying(true);
			return;
		}
		app.setAnalysisPlaying(!current.playing);
	}

	function inspectorMeta(id: string) {
		return (
			inspectorCopy[id] ?? {
				name: id.replaceAll('-', ' ').replace(/^./, (letter) => letter.toUpperCase()),
				description: 'Current values maintained by the algorithm.'
			}
		);
	}

	function narration(): string {
		const item = frame?.narration;
		if (!item) return 'Ready to inspect the algorithm.';
		const action = item.key.replaceAll('-', ' ');
		const node = 'nodeId' in item.refs ? entityLabel(item.refs.nodeId) : '';
		const edge = 'edgeId' in item.refs ? entityLabel(item.refs.edgeId) : '';
		return [action, node, edge].filter(Boolean).join(' · ');
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
		data-reveal-state={current.reveal}
		bind:this={panelElement}
	>
		<header class="panel-header">
			<h2>{definition?.name ?? 'Analysis'}</h2>
			<button
				class="icon-button"
				type="button"
				aria-label="Close analysis"
				data-testid="close-analysis"
				onclick={() => app.closeAnalysisPanel()}
			>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
			</button>
		</header>

		<nav class="tabs" aria-label="Analysis view">
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
			<section class="panel-content" data-testid="analysis-result">
				{#if resultStatus}
					<section class="result-status" role="status" data-testid="analysis-no-result">
						<h3>{resultStatus.heading}</h3>
						<p>{resultStatus.summary}</p>
					</section>
				{/if}
				{#if current.result.metrics.length > 0}
					<dl class="metrics">
						{#each current.result.metrics as metric (metric.label)}
							<div>
								<dt>{metric.label}</dt>
								<dd>{metric.value}</dd>
							</div>
						{/each}
					</dl>
				{/if}
				<section class="trace-section result-legend">
					<h3>Legend</h3>
					<div class="legend legend--result" aria-label="Analysis legend">
						<span><i class="legend-mark legend-mark--result"></i>Result</span>
						{#if resultLandmarkRoles.has('start')}
							<span><i class="legend-mark legend-mark--start"></i>Start</span>
						{/if}
						{#if resultLandmarkRoles.has('end')}
							<span><i class="legend-mark legend-mark--end"></i>End</span>
						{/if}
					</div>
				</section>
			</section>
		{:else}
			<section class="panel-content trace-content" data-testid="analysis-trace">
				<div class="transport" aria-label="Trace playback controls">
					<button
						class="transport-button"
						type="button"
						aria-label="Previous action"
						title="Previous"
						data-testid="trace-previous"
						disabled={current.cursor <= 0}
						onclick={() => app.stepAnalysis(-1)}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5v14M18 6l-8 6 8 6V6z" /></svg>
					</button>
					<button
						class="transport-button transport-button--primary"
						type="button"
						aria-label={transport.primary === 'pause'
							? 'Pause playback'
							: transport.primary === 'restart'
								? 'Restart playback'
								: 'Start playback'}
						title={transport.primary === 'pause'
							? 'Pause'
							: transport.primary === 'restart'
								? 'Restart'
								: 'Play'}
						data-icon={transport.primary}
						data-testid="trace-play"
						onclick={activatePrimaryTransport}
					>
						{#if transport.primary === 'pause'}<svg viewBox="0 0 24 24" aria-hidden="true"
								><path d="M7 5h3v14H7zM14 5h3v14h-3z" /></svg
							>{:else}<svg viewBox="0 0 24 24" aria-hidden="true"
								><path
									d={transport.primary === 'restart'
										? 'M18.4 7.2A8 8 0 1 0 20 12h-2a6 6 0 1 1-1.2-3.6L14 11h7V4l-2.6 3.2z'
										: 'M8 5l11 7-11 7V5z'}
								/></svg
							>{/if}
					</button>
					<button
						class="transport-button"
						type="button"
						aria-label="Stop and reset playback"
						title="Stop and reset"
						data-testid="trace-reset"
						disabled={transport.resetDisabled}
						onclick={() => app.resetAnalysisPlayback()}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10H7z" /></svg>
					</button>
					<button
						class="transport-button"
						type="button"
						aria-label="Next action"
						title="Next"
						data-testid="trace-next"
						disabled={current.cursor >= current.trace.events.length - 1}
						onclick={() => app.stepAnalysis(1)}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 5v14M6 6l8 6-8 6V6z" /></svg>
					</button>
				</div>

				<label class="scrubber">
					<span>Action {current.cursor + 1} of {current.trace.events.length}</span>
					<input
						type="range"
						min="0"
						max={Math.max(0, current.trace.events.length - 1)}
						value={current.cursor}
						data-testid="trace-scrubber"
						oninput={(event) => app.seekAnalysis(Number(event.currentTarget.value))}
					/>
				</label>

				<section class="trace-section current-action">
					<h3>Current action</h3>
					<p data-testid="trace-narration">{narration()}</p>
				</section>

				<section class="trace-section">
					<h3>Data structures</h3>
					<div class="inspectors" data-testid="analysis-inspectors">
						{#each Object.entries(frame?.inspectors ?? {}) as [id, inspector] (id)}
							{@const meta = inspectorMeta(id)}
							{@const expanded = expandedInspectors.has(id)}
							<article class="inspector" class:expanded>
								<button
									class="inspector-summary"
									type="button"
									aria-expanded={expanded}
									aria-controls={`analysis-inspector-${id}`}
									onclick={() => toggleInspector(id)}
								>
									<span><strong>{meta.name}</strong><small>{meta.description}</small></span>
									<span class="count">{count(inspector.value)}</span>
								</button>
								<div class="inspector-collapse" class:expanded id={`analysis-inspector-${id}`}>
									<div><p>{display(inspector.value)}</p></div>
								</div>
							</article>
						{/each}
					</div>
				</section>

				<section class="trace-section">
					<h3>Legend</h3>
					<div class="legend" aria-label="Analysis legend">
						{#each legendRoles as role (role.id)}
							<span><i class={`legend-mark legend-mark--${role.id}`}></i>{role.label}</span>
						{/each}
					</div>
				</section>
				{#if current.trace.truncated}<p class="notice">
						Playback is partial: the trace reached 50,000 actions.
					</p>{/if}
			</section>
		{/if}
	</div>
{/if}

<style>
	.analysis-panel {
		position: fixed;
		z-index: 40;
		top: var(--yg-hud-edge);
		right: var(--yg-hud-edge);
		display: flex;
		flex-direction: column;
		width: min(22rem, calc(100vw - 2 * var(--yg-hud-edge)));
		max-height: calc(100dvh - 2 * var(--yg-hud-edge));
		overflow: hidden;
		padding: var(--yg-hud-panel-inset);
		gap: 0.65rem;
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-modal);
		background: var(--yg-panel-glass-strong);
		box-shadow: 0 10px 32px rgba(28, 36, 46, 0.16);
		color: var(--yg-fg);
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	h2 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: 0.01em;
	}
	h3 {
		margin: 0 0 0.4rem;
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--yg-muted);
	}
	button {
		font: inherit;
		font-size: 0.8rem;
		border: 1px solid var(--yg-border);
		background: var(--yg-chip);
		color: var(--yg-fg);
		border-radius: var(--yg-radius-control);
		cursor: pointer;
		transition:
			background var(--yg-motion-fast) var(--yg-ease),
			border-color var(--yg-motion-fast) var(--yg-ease),
			color var(--yg-motion-fast) var(--yg-ease);
	}
	button:hover:not(:disabled):not(.active) {
		background: rgba(255, 255, 255, 0.72);
	}
	button:disabled {
		cursor: not-allowed;
		opacity: 0.42;
	}
	.icon-button,
	.transport-button {
		display: inline-grid;
		place-items: center;
		width: var(--yg-hud-btn);
		height: var(--yg-hud-btn);
		padding: 0;
	}
	.icon-button svg,
	.transport-button svg {
		width: 1rem;
		height: 1rem;
		fill: currentColor;
		stroke: currentColor;
		stroke-width: 1.8;
	}
	.icon-button svg {
		fill: none;
	}
	.tabs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		width: 100%;
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-control);
		overflow: hidden;
	}
	.tabs button {
		min-height: 2rem;
		padding: 0.4rem 0.55rem;
		border: 0;
		border-radius: 0;
		background: transparent;
	}
	.tabs button + button {
		border-left: 1px solid var(--yg-border);
	}
	.tabs button.active {
		background: var(--yg-accent-soft);
		color: var(--yg-accent);
		font-weight: 600;
	}
	.panel-content {
		box-sizing: border-box;
		width: 100%;
		min-height: 0;
		overflow-y: auto;
		overflow-x: hidden;
		scrollbar-width: thin;
	}
	.metrics {
		display: grid;
		gap: 0.35rem;
		margin: 0;
	}
	.metrics div {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.55rem 0.65rem;
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-control);
		background: var(--yg-chip);
	}
	.metrics dt {
		color: var(--yg-muted);
		font-size: 0.78rem;
	}
	.metrics dd {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
	}
	.result-legend {
		margin-top: 0.85rem;
	}
	.trace-content {
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		width: 100%;
		min-width: 0;
		padding: 0;
		gap: 0.85rem;
	}
	.trace-content > * {
		box-sizing: border-box;
		width: 100%;
		min-width: 0;
	}
	.transport {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.35rem;
	}
	.transport-button--primary {
		width: 2.45rem;
		height: 2.45rem;
		border-radius: var(--yg-radius-pill);
		background: var(--yg-accent);
		color: #f4f8f9;
		border-color: color-mix(in srgb, var(--yg-accent) 70%, #062e34);
	}
	.scrubber {
		display: grid;
		gap: 0.35rem;
		color: var(--yg-muted);
		font-size: 0.72rem;
	}
	.scrubber input {
		box-sizing: border-box;
		width: 100%;
		margin: 0;
		accent-color: var(--yg-accent);
	}
	.trace-section {
		min-width: 0;
	}
	.current-action p {
		margin: 0;
		padding: 0.6rem 0.65rem;
		border-left: 3px solid var(--yg-accent);
		border-radius: 0 var(--yg-radius-control) var(--yg-radius-control) 0;
		background: var(--yg-chip);
		font-size: 0.85rem;
		text-transform: capitalize;
	}
	.inspectors {
		display: grid;
		gap: 0.35rem;
	}
	.inspector {
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-control);
		background: var(--yg-chip);
		overflow: hidden;
		transition:
			background var(--yg-motion-fast) var(--yg-ease),
			border-color var(--yg-motion-fast) var(--yg-ease);
	}
	.inspector:hover,
	.inspector:focus-within {
		background: rgba(255, 255, 255, 0.72);
		border-color: color-mix(in srgb, var(--yg-accent) 28%, var(--yg-border));
	}
	.inspector-summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-sizing: border-box;
		width: 100%;
		gap: 0.65rem;
		padding: 0.55rem 0.65rem;
		border: 0;
		border-radius: 0;
		background: transparent;
		text-align: left;
	}
	.inspector-summary:hover,
	.inspector-summary:focus-visible {
		background: var(--yg-accent-soft);
	}
	.inspector-summary > span:first-child {
		display: grid;
		gap: 0.12rem;
		min-width: 0;
	}
	.inspector strong {
		font-size: 0.8rem;
		font-weight: 600;
	}
	.inspector small {
		color: var(--yg-muted);
		font-size: 0.7rem;
		line-height: 1.3;
	}
	.inspector .count {
		flex: 0 0 auto;
		min-width: 1.45rem;
		padding: 0.12rem 0.4rem;
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-pill);
		text-align: center;
		color: var(--yg-muted);
		font-size: 0.7rem;
	}
	.inspector-collapse {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows var(--yg-motion-fast) var(--yg-ease);
	}
	.inspector-collapse.expanded {
		grid-template-rows: 1fr;
	}
	.inspector-collapse > div {
		min-height: 0;
		overflow: hidden;
	}
	.inspector p {
		margin: 0;
		padding: 0.55rem 0.65rem;
		border-top: 1px solid var(--yg-border);
		font-size: 0.78rem;
		overflow-wrap: anywhere;
	}
	.legend {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.45rem 0.65rem;
	}
	.legend > span {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		color: var(--yg-muted);
		font-size: 0.72rem;
	}
	.legend-mark {
		position: relative;
		display: inline-grid;
		flex: 0 0 auto;
		width: 0.9rem;
		height: 0.9rem;
		color: var(--yg-accent);
	}
	.legend-mark--current {
		border: 1.5px solid #4a9baa;
		transform: rotate(45deg) scale(0.72);
	}
	.legend-mark--inspecting {
		border: 1.5px dashed #c57b35;
		border-radius: 50%;
	}
	.legend-mark--frontier {
		border: 1.5px solid #765bb8;
		border-radius: 50%;
		clip-path: inset(45% 0 0);
	}
	.legend-mark--settled {
		border: 1.5px solid #31864e;
		border-radius: 50%;
	}
	.legend-mark--settled::after {
		content: '';
		width: 0.35rem;
		height: 0.18rem;
		border-left: 1.5px solid #31864e;
		border-bottom: 1.5px solid #31864e;
		transform: rotate(-45deg);
		place-self: center;
	}
	.legend-mark--result::before {
		content: '';
		width: 100%;
		height: 2px;
		background: #b28b26;
		place-self: center;
	}
	.legend-mark--result::after {
		content: '';
		position: absolute;
		right: 0;
		top: 0.26rem;
		border: 0.2rem solid transparent;
		border-left-color: #b28b26;
	}
	.legend-mark--start {
		width: 0.62rem;
		height: 0.62rem;
		margin-inline: 0.14rem;
		border: 1.5px solid #3b8998;
		background: rgba(103, 232, 249, 0.12);
		transform: rotate(45deg);
	}
	.legend-mark--end {
		border: 1.5px solid #31864e;
		border-radius: 50%;
	}
	.legend-mark--end::after {
		content: '';
		width: 0.38rem;
		height: 0.38rem;
		place-self: center;
		border: 1px solid #31864e;
		border-radius: 50%;
	}
	.legend-mark--rejected::before,
	.legend-mark--rejected::after {
		content: '';
		position: absolute;
		left: 0.4rem;
		width: 1.5px;
		height: 100%;
		background: #a84a4f;
		transform: rotate(45deg);
	}
	.legend-mark--rejected::after {
		transform: rotate(-45deg);
	}
	.notice {
		margin: 0;
		color: #7b5721;
		font-size: 0.78rem;
	}
	.result-status {
		display: grid;
		gap: 0.3rem;
		margin: 0 0 0.85rem;
		padding: 0.8rem 0.9rem;
		border: 1px solid rgba(239, 107, 115, 0.55);
		border-left-width: 4px;
		border-radius: 0.45rem;
		background: rgba(239, 107, 115, 0.12);
		color: #f7d2d5;
	}
	.result-status h3,
	.result-status p {
		margin: 0;
	}
	.result-status h3 {
		font-size: 0.95rem;
		letter-spacing: 0.02em;
	}
	.result-status p {
		font-size: 0.8rem;
		line-height: 1.4;
	}

	@media (prefers-reduced-motion: reduce) {
		.inspector-collapse {
			transition: none;
		}
	}
</style>
