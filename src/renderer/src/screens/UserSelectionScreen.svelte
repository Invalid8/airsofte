<script lang="ts">
  import { onMount } from 'svelte'
  import { fly } from 'svelte/transition'
  import { navigateTo } from '../stores/gameStore'
  import { userManager } from '../utils/userManager'
  import { audioManager } from '../utils/AudioManager'
  import Button from '../components/Button.svelte'
  import type { UserProfile } from '../types/userTypes'

  let users = $state<UserProfile[]>([])
  let showCreateUser = $state(false)
  let showPasswordPrompt = $state(false)
  let selectedUser = $state<UserProfile | null>(null)

  let newUsername = $state('')
  let newPassword = $state('')
  let usePassword = $state(false)
  let passwordInput = $state('')
  let errorMessage = $state('')
  let isProcessing = $state(false)

  onMount(() => {
    userManager.users.subscribe((value) => {
      users = value
    })
  })

  async function handleUserSelect(user: UserProfile): Promise<void> {
    if (user.passwordHash) {
      selectedUser = user
      showPasswordPrompt = true
      errorMessage = ''
      passwordInput = ''
    } else {
      isProcessing = true
      const success = await userManager.switchUser(user.id)
      isProcessing = false

      if (success) {
        audioManager.playSound('menuClick')
        navigateTo('MAIN_MENU')
      }
    }
  }

  async function handlePasswordSubmit(): Promise<void> {
    if (!selectedUser || isProcessing) return

    isProcessing = true
    const success = await userManager.switchUser(selectedUser.id, passwordInput)
    isProcessing = false

    if (success) {
      audioManager.playSound('menuClick')
      navigateTo('MAIN_MENU')
    } else {
      errorMessage = 'Incorrect password'
      passwordInput = ''
      audioManager.playSound('playerHit')
    }
  }

  async function handleCreateUser(): Promise<void> {
    if (isProcessing) return

    if (!/^[a-zA-Z0-9 ]{3,20}$/.test(newUsername)) {
      errorMessage = 'Username must be 3-20 characters (letters, numbers, spaces)'
      audioManager.playSound('playerHit')
      return
    }

    if (usePassword && newPassword.length < 4) {
      errorMessage = 'Password must be at least 4 characters'
      audioManager.playSound('playerHit')
      return
    }

    isProcessing = true
    const user = await userManager.createUser(newUsername, usePassword ? newPassword : undefined)
    isProcessing = false

    if (user) {
      await userManager.switchUser(user.id)
      audioManager.playSound('powerup')
      navigateTo('MAIN_MENU')
    } else {
      errorMessage = 'Username already exists'
      audioManager.playSound('playerHit')
    }
  }

  function cancelPasswordPrompt(): void {
    showPasswordPrompt = false
    selectedUser = null
    passwordInput = ''
    errorMessage = ''
  }

  function cancelCreateUser(): void {
    showCreateUser = false
    newUsername = ''
    newPassword = ''
    usePassword = false
    errorMessage = ''
  }

  function formatLastPlayed(timestamp: number): string {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }
</script>

<div
  class="user-selection-screen h-screen flex items-center justify-center p-6"
  in:fly={{ y: 200, duration: 500 }}
>
  <div class="max-w-4xl w-full">
    <h1 class="title text-5xl uppercase glow-text text-center mb-8">Select Player</h1>

    {#if !showCreateUser && !showPasswordPrompt}
      <div class="users-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {#each users as user (user.id)}
          <button
            class="user-card p-6 rounded-lg border-2 border-cyan-500/50 bg-black/70 hover:bg-cyan-500/20 hover:border-cyan-500 transition-all"
            onclick={() => handleUserSelect(user)}
            disabled={isProcessing}
          >
            <div class="flex items-center gap-3 mb-3">
              <div
                class="avatar size-12 rounded-full bg-cyan-500/30 border-2 border-cyan-500 flex items-center justify-center text-2xl"
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div class="flex-1 text-left">
                <div class="username text-xl font-bold">{user.username}</div>
                <div class="last-played text-sm opacity-70">
                  {formatLastPlayed(user.lastPlayedAt)}
                </div>
              </div>
              {#if user.passwordHash}
                <div class="lock-icon text-yellow-400">🔒</div>
              {/if}
            </div>
            <div class="stats grid grid-cols-2 gap-2 text-sm">
              <div>
                <div class="opacity-70">Games</div>
                <div class="font-bold hud">{user.stats.gamesPlayed}</div>
              </div>
              <div>
                <div class="opacity-70">Score</div>
                <div class="font-bold hud">{user.stats.totalScore.toLocaleString()}</div>
              </div>
            </div>
          </button>
        {/each}

        <button
          class="user-card p-6 rounded-lg border-2 border-dashed border-cyan-500/50 bg-black/50 hover:bg-cyan-500/10 hover:border-cyan-500 transition-all flex items-center justify-center"
          onclick={() => {
            showCreateUser = true
            errorMessage = ''
          }}
          disabled={isProcessing}
        >
          <div class="text-center">
            <div class="text-5xl mb-2">➕</div>
            <div class="text-lg">Create New User</div>
          </div>
        </button>
      </div>

      {#if users.length === 0}
        <div class="text-center opacity-70 mb-6">
          <p>No users found. Create your first player profile!</p>
        </div>
      {/if}
    {/if}

    {#if showCreateUser}
      <div
        class="create-user-form max-w-md mx-auto bg-black/80 border-2 border-cyan-500 rounded-xl p-8"
        in:fly={{ y: 50, duration: 300 }}
      >
        <h2 class="text-2xl font-bold mb-6 text-center">Create New User</h2>

        <div class="mb-4">
          <label class="block mb-2 text-sm">Username</label>
          <input
            type="text"
            bind:value={newUsername}
            maxlength="20"
            placeholder="Enter username (3-20 chars)"
            class="w-full px-4 py-3 bg-black/50 border-2 border-cyan-500 rounded text-white focus:outline-none focus:border-cyan-300"
            disabled={isProcessing}
          />
        </div>

        <div class="mb-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              bind:checked={usePassword}
              class="size-5"
              disabled={isProcessing}
            />
            <span class="text-sm">Protect with password (optional)</span>
          </label>
        </div>

        {#if usePassword}
          <div class="mb-6" in:fly={{ y: 20, duration: 200 }}>
            <label class="block mb-2 text-sm">Password</label>
            <input
              type="password"
              bind:value={newPassword}
              placeholder="Enter password (min 4 chars)"
              class="w-full px-4 py-3 bg-black/50 border-2 border-cyan-500 rounded text-white focus:outline-none focus:border-cyan-300"
              disabled={isProcessing}
            />
          </div>
        {/if}

        {#if errorMessage}
          <div
            class="error-message mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-400 text-sm"
          >
            {errorMessage}
          </div>
        {/if}

        <div class="flex gap-3">
          <Button
            label={isProcessing ? 'Creating...' : 'Create'}
            onClick={handleCreateUser}
            isFirst={true}
            disabled={isProcessing}
          />
          <Button label="Cancel" onClick={cancelCreateUser} disabled={isProcessing} />
        </div>
      </div>
    {/if}

    {#if showPasswordPrompt && selectedUser}
      <div
        class="password-prompt max-w-md mx-auto bg-black/80 border-2 border-yellow-500 rounded-xl p-8"
        in:fly={{ y: 50, duration: 300 }}
      >
        <h2 class="text-2xl font-bold mb-4 text-center">Enter Password</h2>
        <p class="text-center mb-6 opacity-80">User: <strong>{selectedUser.username}</strong></p>

        <div class="mb-6">
          <input
            type="password"
            bind:value={passwordInput}
            placeholder="Enter password"
            class="w-full px-4 py-3 bg-black/50 border-2 border-yellow-500 rounded text-white text-center focus:outline-none focus:border-yellow-300"
            onkeydown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            disabled={isProcessing}
            autofocus
          />
        </div>

        {#if errorMessage}
          <div
            class="error-message mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-400 text-sm text-center"
          >
            {errorMessage}
          </div>
        {/if}

        <div class="flex gap-3">
          <Button
            label={isProcessing ? 'Verifying...' : 'Unlock'}
            onClick={handlePasswordSubmit}
            isFirst={true}
            disabled={isProcessing}
          />
          <Button label="Cancel" onClick={cancelPasswordPrompt} disabled={isProcessing} />
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  h1 {
    word-spacing: -30px;
    line-height: 110%;
  }

  .user-card {
    transition: all 0.2s;
  }

  .user-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 0 20px rgba(0, 170, 255, 0.5);
  }

  .user-card:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  input[type='checkbox'] {
    accent-color: #00aaff;
  }
</style>
