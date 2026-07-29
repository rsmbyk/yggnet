<script lang="ts">
	import { Canvas } from '@threlte/core';
	import { T } from '@threlte/core';
</script>

<!-- Bird's-eye Explore shell — content grows via SPECs. -->
<div class="world" data-testid="yggnet-world">
	<Canvas>
		<T.PerspectiveCamera
			makeDefault
			position={[12, 18, 12]}
			oncreate={(ref) => {
				ref.lookAt(0, 0, 0);
			}}
		/>
		<T.AmbientLight intensity={0.85} />
		<T.DirectionalLight position={[8, 16, 4]} intensity={0.9} />
		<!-- Ground grid hint for overlook feel -->
		<T.GridHelper args={[40, 40, '#3a4550', '#2a323c']} />
	</Canvas>
</div>

<style>
	.world {
		width: 100%;
		height: 100%;
		min-height: 0;
		background: var(--yg-world-bg);
	}

	.world :global(canvas) {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
