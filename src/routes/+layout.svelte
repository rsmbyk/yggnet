<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Yggnet</title>
	<meta
		name="description"
		content="Yggnet (IG-net) — 3D open-world abstract graph explorer and pathfinder"
	/>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
