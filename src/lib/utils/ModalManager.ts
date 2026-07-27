import { writable, derived } from 'svelte/store'

export type ModalType = 'PAUSE' | 'SETTINGS' | 'HIGH_SCORE' | 'HELP' | 'EXIT' | null

type ModalState = {
  current: ModalType
  previous: ModalType
  stack: ModalType[]
  canClose: boolean
}

const initialState: ModalState = {
  current: null,
  previous: null,
  stack: [],
  canClose: true
}

function createModalManager() {
  const { subscribe, set, update } = writable<ModalState>(initialState)

  return {
    subscribe,

    open: (modal: ModalType, canClose: boolean = true) => {
      update((state) => ({
        ...state,
        previous: state.current,
        current: modal,
        stack: state.current ? [...state.stack, state.current] : state.stack,
        canClose
      }))
    },

    close: () => {
      update((state) => {
        if (!state.canClose) return state

        const previous = state.stack.length > 0 ? state.stack[state.stack.length - 1] : null

        return {
          ...state,
          current: previous,
          previous: state.current,
          stack: state.stack.slice(0, -1),
          canClose: true
        }
      })
    },

    closeAll: () => {
      set(initialState)
    },

    toggle: (modal: ModalType) => {
      update((state) => {
        if (state.current === modal) {
          const previous = state.stack.length > 0 ? state.stack[state.stack.length - 1] : null

          return {
            ...state,
            current: previous,
            previous: state.current,
            stack: state.stack.slice(0, -1),
            canClose: true
          }
        }

        return {
          ...state,
          previous: state.current,
          current: modal,
          stack: state.current ? [...state.stack, state.current] : state.stack,
          canClose: true
        }
      })
    },

    isOpen: (modal: ModalType): boolean => {
      let isOpen = false
      subscribe((state) => {
        isOpen = state.current === modal
      })()
      return isOpen
    }
  }
}

export const modalManager = createModalManager()

export const currentModal = derived(modalManager, ($state) => $state.current)
export const hasModal = derived(modalManager, ($state) => $state.current !== null)
export const canCloseModal = derived(modalManager, ($state) => $state.canClose)
