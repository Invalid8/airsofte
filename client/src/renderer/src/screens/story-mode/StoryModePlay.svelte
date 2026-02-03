<script lang="ts">
  import UnifiedGamePad from '../../components/game/UnifiedGamePad.svelte'
  import { gameState } from '../../stores/gameStore'
</script>

<UnifiedGamePad mode="STORY_MODE" difficulty={$gameState.difficulty} />
