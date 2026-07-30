<script lang="ts">
	import { T } from '@threlte/core';
	import { OrbitControls, Text, interactivity } from '@threlte/extras';
	import { app } from '$lib/session/app.svelte';
	import { onDestroy } from 'svelte';
	import type { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

	interactivity();

	const LABEL_DISTANCE = 18;

	let travelRaf = 0;
	let controls: ThreeOrbitControls | undefined = $state();

	const nodes = $derived(Object.values(app.document.nodes));
	const edges = $derived(Object.values(app.document.edges));
	const overlayNodeSet = $derived(new Set(app.overlay.nodeIds));
	const overlayEdgeSet = $derived(new Set(app.overlay.edgeIds));
	const selectedIds = $derived(new Set(app.selection.nodeIds));
	const showLabels = $derived(app.camera.distance < LABEL_DISTANCE);
	const dimOthers = $derived(app.overlay.dimOthers && app.overlay.kind !== 'none');
	const collapsedGroups = $derived(app.groupsCollapsed);

	const visibleNodes = $derived(
		nodes.filter((n) => {
			if (n.groupId && collapsedGroups.has(n.groupId)) return false;
			if (app.filters.hideFiltered && app.filters.tags.length > 0 && !app.nodePassesFilter(n.id)) {
				return false;
			}
			return true;
		})
	);

	const groupProxies = $derived.by(() => {
		const map = new Map<string, { id: string; x: number; y: number; z: number; count: number }>();
		for (const n of nodes) {
			if (!n.groupId || !collapsedGroups.has(n.groupId)) continue;
			const cur = map.get(n.groupId) ?? { id: n.groupId, x: 0, y: 0, z: 0, count: 0 };
			cur.x += n.position.x;
			cur.y += n.position.y;
			cur.z += n.position.z;
			cur.count += 1;
			map.set(n.groupId, cur);
		}
		return [...map.values()].map((g) => ({
			id: g.id,
			x: g.x / g.count,
			y: g.y / g.count,
			z: g.z / g.count,
			count: g.count
		}));
	});

	function nodeOpacity(id: string): number {
		if (!dimOthers) return 1;
		return overlayNodeSet.has(id) ? 1 : 0.22;
	}

	function edgeOpacity(id: string): number {
		if (!dimOthers) return 0.85;
		return overlayEdgeSet.has(id) ? 1 : 0.12;
	}

	function nodeColor(id: string): string {
		if (selectedIds.has(id)) return '#c4a35a';
		if (overlayNodeSet.has(id)) return '#2f9e8a';
		return '#7a8a9a';
	}

	function edgeColor(id: string): string {
		if (overlayEdgeSet.has(id)) return '#3cb89a';
		return '#4a5562';
	}

	function edgeObject(from: { x: number; y: number; z: number }, to: { x: number; y: number; z: number }) {
		const dx = to.x - from.x;
		const dy = to.y - from.y;
		const dz = to.z - from.z;
		const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.001;
		const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2, z: (from.z + to.z) / 2 };
		const axis = { x: dx / len, y: dy / len, z: dz / len };
		const yAxis = { x: 0, y: 1, z: 0 };
		const dot = yAxis.x * axis.x + yAxis.y * axis.y + yAxis.z * axis.z;
		let qx = 0;
		let qy = 0;
		let qz = 0;
		let qw = 1;
		if (dot < -0.999) {
			qx = 1;
			qw = 0;
		} else {
			const cx = yAxis.y * axis.z - yAxis.z * axis.y;
			const cy = yAxis.z * axis.x - yAxis.x * axis.z;
			const cz = yAxis.x * axis.y - yAxis.y * axis.x;
			qx = cx;
			qy = cy;
			qz = cz;
			qw = 1 + dot;
			const n = Math.sqrt(qx * qx + qy * qy + qz * qz + qw * qw) || 1;
			qx /= n;
			qy /= n;
			qz /= n;
			qw /= n;
		}
		return { mid, len, quaternion: [qx, qy, qz, qw] as [number, number, number, number] };
	}

	function syncCameraFromControls() {
		if (!controls) return;
		app.setCamera({
			distance: controls.getDistance(),
			target: { x: controls.target.x, y: controls.target.y, z: controls.target.z }
		});
	}

	$effect(() => {
		const t = app.camera.target;
		const d = app.camera.distance;
		if (!controls || app.directions.traveling) return;
		const sameTarget =
			Math.abs(controls.target.x - t.x) < 0.001 &&
			Math.abs(controls.target.y - t.y) < 0.001 &&
			Math.abs(controls.target.z - t.z) < 0.001;
		const sameDist = Math.abs(controls.getDistance() - d) < 0.05;
		if (sameTarget && sameDist) return;
		controls.target.set(t.x, t.y, t.z);
		if (!sameDist) {
			const offset = controls.object.position
				.clone()
				.sub(controls.target)
				.normalize()
				.multiplyScalar(d);
			controls.object.position.copy(controls.target).add(offset);
		}
		controls.update();
	});

	$effect(() => {
		if (!app.directions.traveling) {
			if (travelRaf) cancelAnimationFrame(travelRaf);
			travelRaf = 0;
			return;
		}
		let last = performance.now();
		const tick = (now: number) => {
			const dt = (now - last) / 1000;
			last = now;
			const next = app.directions.travelProgress + dt * 0.15;
			if (next >= 1) {
				app.setTravelProgress(1);
				app.stopTravel();
				return;
			}
			app.setTravelProgress(next);
			const pos = app.travelPosition();
			if (pos && controls) {
				controls.target.set(pos.x, 0, pos.z);
				controls.object.position.set(pos.x + 6, 8, pos.z + 6);
				controls.update();
				app.setCamera({ target: { x: pos.x, y: 0, z: pos.z }, distance: 12 });
			}
			travelRaf = requestAnimationFrame(tick);
		};
		travelRaf = requestAnimationFrame(tick);
		return () => {
			if (travelRaf) cancelAnimationFrame(travelRaf);
		};
	});

	onDestroy(() => {
		if (travelRaf) cancelAnimationFrame(travelRaf);
	});
</script>

<T.PerspectiveCamera makeDefault position={[16, 14, 16]} fov={50}>
	<OrbitControls
		bind:ref={controls}
		enableDamping
		oncreate={(ref) => {
			ref.addEventListener('change', syncCameraFromControls);
		}}
	/>
</T.PerspectiveCamera>

<T.AmbientLight intensity={0.75} />
<T.DirectionalLight position={[10, 18, 6]} intensity={0.95} />
<T.GridHelper args={[48, 48, '#3a4550', '#2a323c']} />

{#each visibleNodes as node (node.id)}
	{@const opacity = nodeOpacity(node.id)}
	{@const color = nodeColor(node.id)}
	<T.Mesh
		position={[node.position.x, node.position.y, node.position.z]}
		onclick={(ev: { stopPropagation: () => void; nativeEvent?: MouseEvent; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean }) => {
			ev.stopPropagation();
			const native = ev.nativeEvent;
			const additive = Boolean(
				native?.ctrlKey || native?.metaKey || native?.shiftKey || ev.ctrlKey || ev.metaKey || ev.shiftKey
			);
			app.selectNodeWithModifiers(node.id, additive);
		}}
	>
		<T.SphereGeometry args={[0.55, 24, 24]} />
		<T.MeshStandardMaterial {color} transparent {opacity} roughness={0.45} metalness={0.15} />
	</T.Mesh>
	{#if showLabels}
		<Text
			position={[node.position.x, node.position.y + 1.05, node.position.z]}
			text={node.label}
			fontSize={0.45}
			anchorX="center"
			anchorY="middle"
			color="#d7dde5"
			outlineWidth={0.02}
			outlineColor="#1c242e"
		/>
	{/if}
{/each}

{#each groupProxies as g (g.id)}
	<T.Mesh position={[g.x, g.y, g.z]} onclick={() => app.toggleCollapseGroup(g.id)}>
		<T.SphereGeometry args={[0.9, 20, 20]} />
		<T.MeshStandardMaterial color="#8a7a5a" roughness={0.5} />
	</T.Mesh>
	{#if showLabels}
		<Text
			position={[g.x, g.y + 1.3, g.z]}
			text={`Group (${g.count})`}
			fontSize={0.4}
			anchorX="center"
			anchorY="middle"
			color="#e6dcc8"
		/>
	{/if}
{/each}

{#each edges as edge (edge.id)}
	{@const from = app.document.nodes[edge.from]}
	{@const to = app.document.nodes[edge.to]}
	{#if from && to}
		{@const geo = edgeObject(from.position, to.position)}
		{@const hidden =
			app.filters.hideFiltered &&
			app.filters.tags.length > 0 &&
			(!app.nodePassesFilter(edge.from) || !app.nodePassesFilter(edge.to))}
		{#if !hidden}
			<T.Mesh position={[geo.mid.x, geo.mid.y, geo.mid.z]} quaternion={geo.quaternion}>
				<T.CylinderGeometry args={[0.045, 0.045, geo.len, 8]} />
				<T.MeshStandardMaterial
					color={edgeColor(edge.id)}
					transparent
					opacity={edgeOpacity(edge.id)}
				/>
			</T.Mesh>
		{/if}
	{/if}
{/each}

{#if app.directions.traveling}
	{@const pos = app.travelPosition()}
	{#if pos}
		<T.Mesh position={[pos.x, pos.y, pos.z]}>
			<T.SphereGeometry args={[0.28, 16, 16]} />
			<T.MeshStandardMaterial color="#e8c56a" emissive="#6a5420" emissiveIntensity={0.25} />
		</T.Mesh>
	{/if}
{/if}
