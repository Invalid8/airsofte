<script lang="ts">
  import UnifiedGamePad from '../components/game/UnifiedGamePad.svelte'
  import { gameState } from '../stores/gameStore'
</script>

<UnifiedGamePad mode="QUICK_PLAY" difficulty={$gameState.difficulty} />
