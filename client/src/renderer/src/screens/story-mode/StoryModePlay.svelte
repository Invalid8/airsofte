<script lang="ts">
  import UnifiedGamePad from '../../components/game/UnifiedGamePad.svelte'
  import MessageDisplay from '../../components/MessageDisplay.svelte'
  import ObjectiveNotification from '../../components/ObjectiveNotification.svelte'
  import { gameState } from '../../stores/gameStore'
</script>

<UnifiedGamePad mode="STORY_MODE" difficulty={$gameState.difficulty} />
<ObjectiveNotification />
<MessageDisplay />
