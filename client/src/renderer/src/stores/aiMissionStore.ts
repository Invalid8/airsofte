import { writable } from 'svelte/store'
import type { StoryMission } from '../types/gameTypes'

interface AIMissionState {
  currentMission: StoryMission | null
  isActive: boolean
}

function createAIMissionStore() {
  const { subscribe, set } = writable<AIMissionState>({
    currentMission: null,
    isActive: false
  })

  return {
    subscribe,

    setMission: (mission: StoryMission) => {
      set({
        currentMission: mission,
        isActive: true
      })
    },

    clear: () => {
      set({
        currentMission: null,
        isActive: false
      })
    },

    getMission: (): StoryMission | null => {
      let mission: StoryMission | null = null
      const unsubscribe = subscribe((state) => {
        mission = state.currentMission
      })
      unsubscribe()
      return mission
    },

    isActive: (): boolean => {
      let active = false
      const unsubscribe = subscribe((state) => {
        active = state.isActive
      })
      unsubscribe()
      return active
    }
  }
}

export const aiMissionStore = createAIMissionStore()
