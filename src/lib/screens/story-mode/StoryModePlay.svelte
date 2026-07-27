<script lang="ts">
  import UnifiedGamePad from '$lib/components/game/UnifiedGamePad.svelte'
  import { gameState } from '$lib/stores/gameStore'
</script>

<UnifiedGamePad mode="STORY_MODE" difficulty={$gameState.difficulty} />
