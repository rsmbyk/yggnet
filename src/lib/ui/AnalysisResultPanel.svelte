<script lang="ts">
	import { app } from '$lib/session/app.svelte';
	import { ANALYSIS_PLAYBACK_INTERVAL_MS } from '$lib/session/current-analysis';
	import { frameAt, type AnalysisArtifact } from '$lib/graph';
	import { SvelteSet } from 'svelte/reactivity';
	import {
		RESULT_REVEAL_PHASE_HOLD_MS,
		RESULT_REVEAL_STEP_MS,
		analysisLandmarkScale,
		analysisRevealDuration,
		analysisRevealStepCount,
		analysisResultLandmarks,
		analysisResultSequence,
		analysisRoleColor,
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
	let inspectorAnalysisResult: object | null = null;
	const artifactResult = $derived(current?.result ?? null);
	const resultLandmarks = $derived(
		current ? analysisResultLandmarks(current.result.artifacts) : {}
	);
	const resultLandmarkRoles = $derived(new Set(Object.values(resultLandmarks).flat()));
	const resultHasCritical = $derived(
		Boolean(
			current?.result.reveal?.phases.some((phase) =>
				phase.steps.some((step) =>
					step.actions.some(
						(action) =>
							(action.kind === 'reveal-node' || action.kind === 'reveal-edge') &&
							action.role === 'critical'
					)
				)
			)
		)
	);
	const resultStatus = $derived(
		current ? analysisResultStatus(current.result.outcome, current.result.summary) : null
	);
	const resultRevealDuration = $derived(
		current?.result.reveal
			? analysisRevealDuration(current.result.reveal)
			: current
				? revealDuration(analysisResultSequence(current.result.artifacts).length)
				: 0
	);
	const pathReplayOrder = $derived.by(() => {
		if (!current?.result.reveal) return '';
		return current.result.reveal.phases
			.flatMap((phase) => phase.steps)
			.flatMap((step) => step.actions)
			.flatMap((action) => {
				if (action.kind === 'emphasize-node') return [`node:${action.nodeId}`];
				if (action.kind === 'emphasize-edge') return [`edge:${action.edgeId}`];
				return [];
			})
			.join(',');
	});
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
		settled: { name: 'Settled nodes', description: 'Nodes whose shortest distance is final.' },
		'maximum-flow': {
			name: 'Maximum flow',
			description: 'Total Source-to-Sink flow after completed augmentations.'
		},
		'augmenting-path': {
			name: 'Augmenting path',
			description: 'Stored edges used by the current residual augmentation.'
		},
		'current-node': { name: 'Current node', description: 'Node at the top of the route walk.' },
		'remaining-edges': {
			name: 'Remaining edges',
			description: 'Stored edges that have not yet been consumed by the route.'
		},
		'traversal-stack': {
			name: 'Traversal stack',
			description: 'The active Hierholzer walk before nodes are emitted.'
		},
		'emitted-route': {
			name: 'Emitted route',
			description: 'Nodes emitted during route construction, in emission order.'
		},
		'dp-states': { name: 'DP states', description: 'Distinct route states evaluated so far.' },
		'route-candidate': {
			name: 'Route candidate',
			description: 'The node sequence in the current exact-search state.'
		},
		'parent-decisions': {
			name: 'Parent decisions',
			description: 'Successful transitions retained for deterministic reconstruction.'
		},
		'reconstructed-route': {
			name: 'Reconstructed route',
			description: 'The final node sequence reconstructed from the successful states.'
		},
		'current-set': { name: 'Current set', description: 'Nodes selected in this search branch.' },
		'candidate-set': {
			name: 'Candidate set',
			description: 'Nodes still compatible with the current branch.'
		},
		'upper-bound': {
			name: 'Upper bound',
			description: 'Largest possible set size remaining in this branch.'
		},
		'best-set': { name: 'Best set', description: 'Best deterministic node set found so far.' },
		'forced-nodes': {
			name: 'Forced nodes',
			description: 'Self-looped nodes that must belong to the vertex cover.'
		},
		'current-cover': {
			name: 'Current cover',
			description: 'Nodes selected in the current cover branch.'
		},
		'uncovered-edge': {
			name: 'Uncovered edge',
			description: 'The next real edge constraint that the branch must cover.'
		},
		'cover-bound': {
			name: 'Cover bound',
			description: 'Current cover size used to prune non-improving branches.'
		},
		'best-cover': {
			name: 'Best cover',
			description: 'Smallest deterministic vertex cover found so far.'
		}
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
		const result = artifactResult;
		if (result !== inspectorAnalysisResult) {
			expandedInspectors.clear();
			inspectorAnalysisResult = result;
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

	function artifactItemCount(artifact: AnalysisArtifact): number {
		if (artifact.kind === 'partition')
			return artifact.parts.reduce((total, part) => total + part.nodeIds.length, 0);
		if (artifact.kind === 'path' || artifact.kind === 'tree') return artifact.nodeIds.length;
		if (artifact.kind === 'node-set' || artifact.kind === 'ordered-nodes')
			return artifact.nodeIds.length;
		if (artifact.kind === 'edge-set') return artifact.edgeIds.length;
		if (artifact.kind === 'ranking') return artifact.entries.length;
		if (artifact.kind === 'per-edge-values') return Object.keys(artifact.values).length;
		if (artifact.kind === 'table') return artifact.rows.length;
		return artifact.entries.length;
	}

	function toggleInspector(id: string) {
		if (expandedInspectors.has(id)) expandedInspectors.delete(id);
		else expandedInspectors.add(id);
	}

	function partitionColor(label: string): string | null {
		const color = /^Color (\d+)$/.exec(label);
		if (color) return analysisRoleColor(`color-${Number(color[1]) - 1}`);
		const component = /^Component (\d+)$/.exec(label);
		if (component) return analysisRoleColor(`component-${Number(component[1]) - 1}`);
		return null;
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
		data-reveal-phase-count={current.result.reveal?.phases.length ?? 1}
		data-reveal-duration-ms={resultRevealDuration}
		data-reveal-step-ms={RESULT_REVEAL_STEP_MS}
		data-reveal-phase-hold-ms={RESULT_REVEAL_PHASE_HOLD_MS}
		data-path-replay-order={pathReplayOrder}
		data-landmark-start-scale={analysisLandmarkScale('start')}
		data-landmark-end-scale={analysisLandmarkScale('end')}
		data-landmark-style="solid-high-contrast"
		data-exploration-edge-roles="active settled"
		data-traversal-palette="orange"
		data-path-palette="green"
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
			<section class="analysis-view" data-testid="analysis-result">
				<div class="panel-content result-scroll" data-testid="analysis-result-scroll">
					{#if resultStatus}
						<section
							class={`result-status result-status--${resultStatus.kind}`}
							role="status"
							aria-label={resultStatus.heading}
							data-testid={`analysis-${resultStatus.kind}`}
						>
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
					{#each current.result.artifacts.filter((artifact) => artifact.kind === 'partition' || artifact.kind === 'path' || artifact.kind === 'node-set' || artifact.kind === 'edge-set' || artifact.kind === 'ordered-nodes' || artifact.kind === 'tree' || artifact.kind === 'ranking' || artifact.kind === 'per-edge-values' || artifact.kind === 'table') as artifact (artifact.id)}
						<details
							class="inspector result-artifact"
							data-testid={`analysis-artifact-${artifact.id}`}
							open={expandedInspectors.has(artifact.id)}
						>
							<summary
								class="inspector-summary"
								onclick={(event) => {
									event.preventDefault();
									toggleInspector(artifact.id);
								}}
							>
								<span>
									<strong>{artifact.label}</strong>
									<small>{artifactItemCount(artifact)} items — expand to inspect</small>
								</span>
								<span class="count">{artifactItemCount(artifact)}</span>
							</summary>
							<div class="result-artifact-content">
								{#if artifact.kind === 'partition'}
									{#each artifact.parts as part (part.label)}
										<section class="result-group">
											<div class="result-group-heading">
												{#if partitionColor(part.label)}
													<span
														class="result-group-swatch"
														style={`background-color: ${partitionColor(part.label)}`}
														aria-label={`${part.label} palette swatch`}
														role="img"
													></span>
												{/if}
												<h4>{part.label}</h4>
												<span class="result-group-count">
													{part.nodeIds.length} node{part.nodeIds.length === 1 ? '' : 's'}
												</span>
											</div>
											<ul>
												{#each part.nodeIds as nodeId (nodeId)}<li>{entityLabel(nodeId)}</li>{/each}
											</ul>
										</section>
									{/each}
								{:else if artifact.kind === 'path' || artifact.kind === 'tree'}
									<p>{artifact.nodeIds.map(entityLabel).join(' → ')}</p>
									<p>{artifact.edgeIds.length} edge{artifact.edgeIds.length === 1 ? '' : 's'}</p>
								{:else if artifact.kind === 'node-set' || artifact.kind === 'ordered-nodes'}
									<p>{artifact.nodeIds.length} found</p>
									<p>
										{artifact.nodeIds.length
											? artifact.nodeIds.map(entityLabel).join(', ')
											: 'None'}
									</p>
								{:else if artifact.kind === 'ranking'}
									<div class="result-table-scroll">
										<table
											aria-label={artifact.label}
											data-testid={`analysis-ranking-${artifact.id}`}
										>
											<caption>{artifact.label}</caption>
											<thead>
												<tr>
													<th scope="col">Rank</th>
													<th scope="col">Node</th>
													<th scope="col">Score</th>
												</tr>
											</thead>
											<tbody>
												{#each artifact.entries as entry, index (entry.id)}
													<tr>
														<td>{index + 1}</td>
														<td>{entityLabel(entry.id)}</td>
														<td>{entry.value}</td>
													</tr>
												{/each}
											</tbody>
										</table>
									</div>
								{:else if artifact.kind === 'per-edge-values'}
									<div class="result-table-scroll">
										<table aria-label={artifact.label}>
											<caption>{artifact.label}</caption>
											<thead>
												<tr><th scope="col">Edge</th><th scope="col">Value</th></tr>
											</thead>
											<tbody>
												{#each Object.entries(artifact.values) as [edgeId, value] (edgeId)}
													<tr><td>{entityLabel(edgeId)}</td><td>{value}</td></tr>
												{/each}
											</tbody>
										</table>
									</div>
								{:else if artifact.kind === 'table'}
									<div class="result-table-scroll">
										<table aria-label={artifact.label}>
											<caption>{artifact.label}</caption>
											<thead>
												<tr>
													{#each artifact.columns as column, columnIndex (columnIndex)}
														<th scope="col">{column}</th>
													{/each}
												</tr>
											</thead>
											<tbody>
												{#each artifact.rows as row, rowIndex (rowIndex)}
													<tr>
														{#each row as value, valueIndex (valueIndex)}
															<td>{entityLabel(value)}</td>
														{/each}
													</tr>
												{/each}
											</tbody>
										</table>
									</div>
								{:else}
									<p>{artifact.edgeIds.length} found</p>
								{/if}
							</div>
						</details>
					{/each}
				</div>
				<section class="trace-section result-legend">
					<h3>Legend</h3>
					<div class="legend legend--result" aria-label="Analysis legend">
						<span><i class="legend-mark legend-mark--result"></i>Result</span>
						{#if resultHasCritical}
							<span><i class="legend-mark legend-mark--critical"></i>Critical</span>
						{/if}
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
			<section class="analysis-view trace-view" data-testid="analysis-trace">
				<div class="panel-content trace-content" data-testid="analysis-trace-scroll">
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
							<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5v14M18 6l-8 6 8 6V6z" /></svg
							>
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

					{#if current.trace.truncated}<p class="notice">
							Playback is partial: the trace reached 50,000 actions.
						</p>{/if}
				</div>
				<section class="trace-section view-legend">
					<h3>Legend</h3>
					<div class="legend" aria-label="Analysis legend">
						{#each legendRoles as role (role.id)}
							<span><i class={`legend-mark legend-mark--${role.id}`}></i>{role.label}</span>
						{/each}
					</div>
				</section>
			</section>
		{/if}
	</div>
{/if}

<style>
	.analysis-panel {
		box-sizing: border-box;
		position: fixed;
		z-index: 40;
		top: var(--yg-hud-edge);
		right: var(--yg-hud-edge);
		display: flex;
		flex-direction: column;
		width: min(22rem, calc(100vw - 2 * var(--yg-hud-edge)));
		height: auto;
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
	.analysis-view {
		box-sizing: border-box;
		width: 100%;
		min-height: 0;
		min-width: 0;
		overflow: hidden;
		flex: 1 1 auto;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
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
		border-radius: var(--yg-radius-control) var(--yg-radius-control) 0 0;
		border-bottom-width: 2px;
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
		flex: 1 1 auto;
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
		margin-top: 0;
		flex: 0 0 auto;
		padding-top: 0.4rem;
		border-top: 1px solid var(--yg-border);
	}
	.view-legend {
		flex: 0 0 auto;
		padding-top: 0.4rem;
		border-top: 1px solid var(--yg-border);
	}
	.result-scroll {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		padding-right: 0.15rem;
	}
	.result-scroll > * {
		flex: 0 0 auto;
	}
	.trace-content {
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		width: 100%;
		min-width: 0;
		padding: 0;
		gap: 0.85rem;
		padding-right: 0.15rem;
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
	.result-artifact > summary {
		list-style: none;
		cursor: pointer;
	}
	.result-artifact > summary::-webkit-details-marker {
		display: none;
	}
	.result-artifact > summary:focus-visible {
		outline: 2px solid var(--yg-accent);
		outline-offset: -2px;
	}
	.result-artifact-content {
		padding: 0 0.65rem 0.55rem;
		font-size: 0.78rem;
		overflow-wrap: anywhere;
	}
	.result-group + .result-group {
		margin-top: 0.8rem;
		padding-top: 0.65rem;
		border-top: 1px solid var(--yg-border);
	}
	.result-group-heading {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.result-group-heading h4 {
		margin: 0;
		font-size: 0.82rem;
		font-weight: 650;
	}
	.result-group-count {
		margin-left: auto;
		color: var(--yg-muted);
		font-size: 0.72rem;
	}
	.result-group-swatch {
		flex: 0 0 auto;
		width: 0.85rem;
		height: 0.85rem;
		border: 1px solid color-mix(in srgb, var(--yg-fg) 28%, transparent);
		border-radius: 0.2rem;
	}
	.result-group ul {
		margin-top: 0.35rem;
	}
	.result-table-scroll {
		max-width: 100%;
		overflow-x: auto;
	}
	.result-artifact-content ul {
		margin: 0.2rem 0 0;
		padding-left: 1.25rem;
	}
	.result-artifact-content p {
		margin: 0.25rem 0 0;
	}
	.result-artifact-content table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.74rem;
	}
	.result-artifact-content caption {
		padding: 0.25rem 0;
		color: var(--yg-muted);
		text-align: left;
		font-weight: 600;
	}
	.result-artifact-content th,
	.result-artifact-content td {
		padding: 0.25rem;
		border-bottom: 1px solid var(--yg-border);
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

	.legend-mark--critical {
		border: 2px solid #f43f5e;
		box-shadow: 0 0 0 2px color-mix(in srgb, #f43f5e 35%, transparent);
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
		border: 1.5px solid #b83280;
		border-radius: 50%;
	}
	.legend-mark--end::after {
		content: '';
		width: 0.38rem;
		height: 0.38rem;
		place-self: center;
		border: 1px solid #b83280;
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
		margin: 0;
		padding: 0.8rem 0.9rem;
		border: 1px solid transparent;
		border-left-width: 4px;
		border-radius: 0.45rem;
		color: #4c1018;
	}
	.result-status--no-result {
		border-color: #dc5262;
		background: #fee2e2;
	}
	.result-status--rejected {
		border-color: #d69a24;
		background: #fef3c7;
		color: #4a2c00;
	}
	.result-status h3,
	.result-status p {
		margin: 0;
		color: inherit;
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
