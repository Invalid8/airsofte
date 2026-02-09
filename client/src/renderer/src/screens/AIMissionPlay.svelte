<script lang="ts">
  import UnifiedGamePad from '../components/game/UnifiedGamePad.svelte'
  import { gameState } from '../stores/gameStore'
  import { aiMissionStore } from '../stores/aiMissionStore'
  import { onMount } from 'svelte'
  import { navigateTo } from '../stores/gameStore'

  onMount(() => {
    const mission = aiMissionStore.getMission()

    if (!mission) {
      navigateTo('AI_MISSION')
      return null
    }

    gameState.update((state) => ({
      ...state,
      currentMissionId: mission.id,
      currentMission: mission
    }))

    return () => {
      aiMissionStore.clear()
    }
  })
</script>

<UnifiedGamePad mode="AI_MISSION" difficulty={$gameState.difficulty} />
