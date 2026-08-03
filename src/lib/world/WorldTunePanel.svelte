<script lang="ts">
	import { fade } from 'svelte/transition';
	import { worldTune, type WorldTuneValues } from './world-tune.svelte';

	type NumField = {
		kind: 'number';
		key: keyof WorldTuneValues;
		label: string;
		step: number;
		min?: number;
		max?: number;
	};
	type ColorField = {
		kind: 'color';
		key: keyof WorldTuneValues;
		label: string;
	};
	type Field = NumField | ColorField;
	type Section = { title: string; fields: Field[] };

	const sections: Section[] = [
		{
			title: 'Ground',
			fields: [
				{ kind: 'number', key: 'groundSize', label: 'Ground size', step: 10, min: 10 },
				{ kind: 'number', key: 'gridMinor', label: 'Grid minor', step: 0.5, min: 0.1 },
				{ kind: 'number', key: 'gridMajor', label: 'Grid major', step: 1, min: 1 },
				{ kind: 'number', key: 'gridMega', label: 'Grid mega', step: 10, min: 1 }
			]
		},
		{
			title: 'Grid look',
			fields: [
				{ kind: 'number', key: 'gridTextureSize', label: 'Texture size (px)', step: 50, min: 64 },
				{ kind: 'color', key: 'gridFill', label: 'Fill' },
				{ kind: 'color', key: 'gridMinorColor', label: 'Minor color' },
				{ kind: 'number', key: 'gridMinorLineWidth', label: 'Minor width', step: 0.5, min: 0.5 },
				{ kind: 'color', key: 'gridMajorColor', label: 'Major color' },
				{ kind: 'number', key: 'gridMajorLineWidth', label: 'Major width', step: 0.5, min: 0.5 },
				{ kind: 'color', key: 'gridMegaColor', label: 'Mega color' },
				{ kind: 'number', key: 'gridMegaLineWidth', label: 'Mega width', step: 0.5, min: 0.5 },
				{ kind: 'color', key: 'background', label: 'Scene bg' }
			]
		},
		{
			title: 'Nodes',
			fields: [
				{ kind: 'number', key: 'nodeRadius', label: 'Radius', step: 0.05, min: 0.05 },
				{ kind: 'number', key: 'defaultNodeY', label: 'Default Y', step: 0.05, min: 0 },
				{ kind: 'color', key: 'nodeColor', label: 'Idle color' },
				{ kind: 'color', key: 'nodeSelectedColor', label: 'Selected color' },
				{ kind: 'color', key: 'nodeHoverColor', label: 'Hover color' }
			]
		},
		{
			title: 'Edges',
			fields: [
				{ kind: 'number', key: 'shaftRadius', label: 'Shaft', step: 0.01, min: 0.01 },
				{ kind: 'number', key: 'previewShaftRadius', label: 'Preview shaft', step: 0.01, min: 0.01 },
				{ kind: 'number', key: 'arrowRadius', label: 'Arrow base', step: 0.01, min: 0.01 },
				{ kind: 'number', key: 'arrowHeight', label: 'Arrow height', step: 0.05, min: 0.05 },
				{
					kind: 'number',
					key: 'arrowGapFraction',
					label: 'Arrow gap (0–1)',
					step: 0.01,
					min: 0,
					max: 1
				}
			]
		},
		{
			title: 'Collision',
			fields: [
				{ kind: 'number', key: 'collisionFloorY', label: 'Floor Y', step: 0.1 },
				{
					kind: 'number',
					key: 'collisionPadding',
					label: 'Padding',
					step: 0.05,
					min: 0
				},
				{
					kind: 'number',
					key: 'collisionSnapStep',
					label: 'Alt snap step',
					step: 0.5,
					min: 0.1
				}
			]
		},
		{
			title: 'Camera',
			fields: [
				{ kind: 'number', key: 'defaultDistance', label: 'Default zoom', step: 1, min: 2 },
				{ kind: 'number', key: 'viewElevationDeg', label: 'View elev °', step: 1, min: 1, max: 89 },
				{
					kind: 'number',
					key: 'labelDistance',
					label: 'Label show range (eye→node)',
					step: 1,
					min: 1
				},
				{ kind: 'number', key: 'minDistance', label: 'Min distance', step: 0.1, min: 0.1 },
				{ kind: 'number', key: 'maxDistance', label: 'Max distance', step: 1, min: 1 },
				{ kind: 'number', key: 'near', label: 'Near clip', step: 0.1, min: 0.01 },
				{ kind: 'number', key: 'far', label: 'Far clip', step: 10, min: 1 },
				{ kind: 'number', key: 'fov', label: 'FOV °', step: 1, min: 10, max: 120 },
				{ kind: 'number', key: 'minPolarAngle', label: 'Min polar (rad)', step: 0.01, min: 0 },
				{ kind: 'number', key: 'maxPolarAngle', label: 'Max polar (rad)', step: 0.01, min: 0.1 },
				{ kind: 'number', key: 'minHeight', label: 'Min height (doc)', step: 0.05, min: 0 },
				{ kind: 'number', key: 'minEyeY', label: 'Min eye Y', step: 0.05, min: 0.1 },
				{ kind: 'number', key: 'defaultTargetX', label: 'Target X', step: 0.5 },
				{ kind: 'number', key: 'defaultTargetY', label: 'Target Y', step: 0.5 },
				{ kind: 'number', key: 'defaultTargetZ', label: 'Target Z', step: 0.5 },
				{ kind: 'number', key: 'panSensitivity', label: 'Pan sensitivity', step: 0.05, min: 0.05 },
				{
					kind: 'number',
					key: 'rotateSensitivity',
					label: 'Rotate speed',
					step: 0.05,
					min: 0.05
				},
				{ kind: 'number', key: 'dampingFactor', label: 'Damping', step: 0.01, min: 0, max: 1 },
				{
					kind: 'number',
					key: 'viewModeTransitionMs',
					label: '2D/3D transition (ms)',
					step: 10,
					min: 0,
					max: 2000
				}
			]
		}
	];

	let saveState = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let saveError = $state('');

	function onNumber(key: keyof WorldTuneValues, raw: string) {
		const n = Number(raw);
		if (!Number.isFinite(n)) return;
		worldTune.set({ [key]: n });
	}

	function onColor(key: keyof WorldTuneValues, raw: string) {
		worldTune.set({ [key]: raw });
	}

	async function saveToConfig() {
		saveState = 'saving';
		saveError = '';
		try {
			await worldTune.saveToConfigFile();
			saveState = 'saved';
			setTimeout(() => {
				if (saveState === 'saved') saveState = 'idle';
			}, 1800);
		} catch (err) {
			saveState = 'error';
			saveError = err instanceof Error ? err.message : 'Save failed';
		}
	}
</script>

{#if worldTune.open}
	<aside class="tune" data-testid="world-tune-panel" transition:fade={{ duration: 140 }}>
		<header class="tune-head">
			<h2>World tune</h2>
			<p class="hint">Live preview. Save writes <code>world-config.ts</code> (dev only).</p>
		</header>
		<div class="fields">
			{#each sections as section (section.title)}
				<section class="section">
					<h3>{section.title}</h3>
					{#each section.fields as f (f.key)}
						<label>
							<span>{f.label}</span>
							{#if f.kind === 'color'}
								<input
									type="color"
									value={String(worldTune.values[f.key])}
									oninput={(e) => onColor(f.key, e.currentTarget.value)}
								/>
							{:else}
								<input
									type="number"
									step={f.step}
									min={f.min}
									max={f.max}
									value={worldTune.values[f.key]}
									oninput={(e) => onNumber(f.key, e.currentTarget.value)}
								/>
							{/if}
						</label>
					{/each}
				</section>
			{/each}
		</div>
		{#if saveState === 'error' && saveError}
			<p class="err" role="alert">{saveError}</p>
		{/if}
		<div class="actions">
			<button type="button" data-testid="world-tune-reset" onclick={() => worldTune.reset()}
				>Reset</button
			>
			<button
				type="button"
				data-testid="world-tune-save"
				disabled={saveState === 'saving'}
				onclick={saveToConfig}
			>
				{saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : 'Save to config'}
			</button>
			<button type="button" class="ghost" onclick={() => (worldTune.open = false)}>Close</button>
		</div>
	</aside>
{/if}

<style>
	.tune {
		pointer-events: auto;
		position: absolute;
		top: calc(0.75rem + 2.75rem + 0.5rem);
		right: 0.75rem;
		z-index: 7;
		width: min(18rem, calc(100vw - 1.5rem));
		padding: 0.75rem 0.85rem;
		border-radius: var(--yg-radius-panel);
		background: var(--yg-panel-glass);
		border: 1px solid var(--yg-border);
		box-shadow: 0 6px 20px rgba(28, 36, 46, 0.12);
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		text-shadow: var(--yg-text-glow);
	}

	.tune-head h2 {
		margin: 0;
		font-size: 0.85rem;
		font-weight: 650;
		color: var(--yg-fg);
	}

	.hint {
		margin: 0.2rem 0 0;
		font-size: 0.68rem;
		color: var(--yg-muted);
	}

	.hint code {
		font-size: 0.65rem;
		color: var(--yg-fg);
	}

	.err {
		margin: 0;
		font-size: 0.68rem;
		color: #c45c5c;
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-height: min(70vh, 32rem);
		overflow: auto;
		padding-right: 0.15rem;
	}

	.section h3 {
		margin: 0 0 0.35rem;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--yg-fg);
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	label {
		display: grid;
		grid-template-columns: 1fr 5.4rem;
		align-items: center;
		gap: 0.45rem;
		font-size: 0.72rem;
		color: var(--yg-muted);
	}

	input[type='number'] {
		font: inherit;
		font-size: 0.8rem;
		font-variant-numeric: tabular-nums;
		padding: 0.28rem 0.4rem;
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-control);
		background: var(--yg-chip);
		color: var(--yg-fg);
		width: 100%;
	}

	input[type='color'] {
		width: 100%;
		height: 1.7rem;
		padding: 0;
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-control);
		background: var(--yg-chip);
		cursor: pointer;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.actions button {
		font: inherit;
		font-size: 0.72rem;
		font-weight: 600;
		padding: 0.32rem 0.6rem;
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-control);
		background: var(--yg-chip);
		color: var(--yg-fg);
		cursor: pointer;
	}

	.actions button:hover {
		background: rgba(255, 255, 255, 0.72);
	}

	.actions button.ghost {
		background: transparent;
	}

	.actions button:disabled {
		opacity: 0.55;
		cursor: wait;
	}
</style>
