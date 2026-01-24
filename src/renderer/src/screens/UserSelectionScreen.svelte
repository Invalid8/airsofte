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

  async function handleGuestMode(): Promise<void> {
    if (isProcessing) return

    isProcessing = true
    const guestName = `Guest_${Date.now().toString().slice(-6)}`
    const user = await userManager.createUser(guestName, undefined)
    isProcessing = false

    if (user) {
      await userManager.switchUser(user.id)
      audioManager.playSound('powerup')
      navigateTo('MAIN_MENU')
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

<div class="user-selection-screen">
  <div class="container flex flex-col justify-center max-w-5xl">
    <h1 class="title">Select Player</h1>

    {#if !showCreateUser && !showPasswordPrompt}
      <div class="users-container">
        {#if users.length > 0}
          <div class="users-grid">
            {#each users as user (user.id)}
              <button
                class="user-card group"
                onclick={() => handleUserSelect(user)}
                disabled={isProcessing}
              >
                <div class="avatar-section">
                  <div class="avatar">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div class="user-info">
                    <div class="username">{user.username}</div>
                    <div class="last-played">{formatLastPlayed(user.lastPlayedAt)}</div>
                  </div>
                </div>

                <div class="stats-section">
                  <div class="stat">
                    <span class="stat-value hud">{user.stats.gamesPlayed}</span>
                    <span class="stat-label">Games</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value hud">{user.stats.totalScore.toLocaleString()}</span>
                    <span class="stat-label">Score</span>
                  </div>
                </div>
              </button>
            {/each}
          </div>
        {/if}

        <div
          class="actions-grid"
          class:two-cols={users.length > 0}
          class:one-col={users.length === 0}
        >
          <button
            class="action-card new-user"
            onclick={() => {
              showCreateUser = true
              errorMessage = ''
            }}
            disabled={isProcessing}
          >
            <div class="action-icon flex items-center justify-center">
              <svg
                width="72"
                height="72"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                  id="SVGRepo_tracerCarrier"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></g><g id="SVGRepo_iconCarrier">
                  <path d="M10 1H6V6L1 6V10H6V15H10V10H15V6L10 6V1Z" fill="#00aaff"></path>
                </g></svg
              >
            </div>
            <div class="action-label">Create New User</div>
          </button>

          <button class="action-card guest-mode" onclick={handleGuestMode} disabled={isProcessing}>
            <div class="action-icon flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                width="75"
                height="75"
                xmlns="http://www.w3.org/2000/svg"
                stroke="#00aaff"
                ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                  id="SVGRepo_tracerCarrier"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></g><g id="SVGRepo_iconCarrier">
                  <path
                    d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
                    stroke="#00aaff"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                  <path
                    d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z"
                    stroke="#00aaff"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                </g></svg
              >
            </div>
            <div class="action-label">Play as Guest</div>
          </button>
        </div>
      </div>
    {/if}

    {#if showCreateUser}
      <div class="modal-form" in:fly={{ y: 50, duration: 300 }}>
        <div class="form-field">
          <label>Username</label>
          <input
            type="text"
            bind:value={newUsername}
            maxlength="20"
            placeholder="Enter username (3-20 chars)"
            class="form-input"
            disabled={isProcessing}
          />
        </div>

        <div class="form-field">
          <label class="checkbox-label">
            <input type="checkbox" bind:checked={usePassword} disabled={isProcessing} />
            <span class="">Protect with password (optional)</span>
          </label>
        </div>

        {#if usePassword}
          <div class="form-field" in:fly={{ y: 20, duration: 200 }}>
            <label>Password</label>
            <input
              type="password"
              bind:value={newPassword}
              placeholder="Enter password (min 4 chars)"
              class="form-input"
              disabled={isProcessing}
            />
          </div>
        {/if}

        {#if errorMessage}
          <div class="error-message">{errorMessage}</div>
        {/if}

        <div class="form-actions">
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
      <div class="modal-form password-prompt" in:fly={{ y: 50, duration: 300 }}>
        <h2 class="form-title">Enter Password</h2>
        <p class="form-subtitle">User: <strong>{selectedUser.username}</strong></p>

        <div class="form-field">
          <input
            type="password"
            bind:value={passwordInput}
            placeholder="Enter password"
            class="form-input centered"
            onkeydown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            disabled={isProcessing}
            autofocus
          />
        </div>

        {#if errorMessage}
          <div class="error-message">{errorMessage}</div>
        {/if}

        <div class="form-actions">
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
  .user-selection-screen {
    min-height: 100vh;
    width: 100svw;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .container {
    width: 100%;
    padding: 1rem;
  }

  .title {
    font-size: clamp(1.75rem, 5vw, 3rem);
    text-transform: uppercase;
    text-align: center;
    margin-bottom: clamp(1.5rem, 4vw, 3rem);
    word-spacing: -0.5rem;
    line-height: 1.1;
  }

  .users-container {
    width: 100%;
  }

  .users-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  @media (min-width: 640px) {
    .users-grid {
      gap: 1.5rem;
    }
  }

  .user-card {
    position: relative;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.6);
    border: 2px solid rgba(0, 170, 255, 0.3);
    border-radius: 0.75rem;
    transition: all 0.3s ease;
    cursor: pointer;
    width: 100%;
  }

  @media (min-width: 640px) {
    .user-card {
      padding: 1.5rem;
      border-radius: 1rem;
    }
  }

  .user-card:hover {
    transform: translateY(-4px);
    border-color: rgba(0, 170, 255, 0.8);
    box-shadow: 0 8px 24px rgba(0, 170, 255, 0.3);
    background: rgba(0, 170, 255, 0.1);
  }

  .user-card:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .avatar-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  @media (min-width: 640px) {
    .avatar-section {
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
  }

  .avatar {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(0, 170, 255, 0.3), rgba(0, 255, 170, 0.3));
    border: 2px solid rgba(0, 170, 255, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.125rem;
    font-weight: bold;
    flex-shrink: 0;
  }

  @media (min-width: 640px) {
    .avatar {
      width: 3.5rem;
      height: 3.5rem;
      border-width: 3px;
      font-size: 1.5rem;
    }
  }

  .user-info {
    flex: 1;
    text-align: left;
    min-width: 0;
  }

  .username {
    font-size: 1rem;
    font-weight: bold;
    margin-bottom: 0.25rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (min-width: 640px) {
    .username {
      font-size: 1.25rem;
    }
  }

  .last-played {
    font-size: 0.75rem;
    opacity: 0.7;
  }

  @media (min-width: 640px) {
    .last-played {
      font-size: 0.875rem;
    }
  }

  .stats-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(0, 170, 255, 0.2);
  }

  @media (min-width: 640px) {
    .stats-section {
      gap: 1rem;
      padding-top: 1rem;
    }
  }

  .stat {
    text-align: center;
  }

  .stat-value {
    display: block;
    font-size: 1.125rem;
    font-weight: bold;
    color: #00aaff;
    margin-bottom: 0.25rem;
  }

  @media (min-width: 640px) {
    .stat-value {
      font-size: 1.5rem;
    }
  }

  .stat-label {
    display: block;
    font-size: 0.625rem;
    opacity: 0.7;
    text-transform: uppercase;
  }

  @media (min-width: 640px) {
    .stat-label {
      font-size: 0.75rem;
    }
  }

  .actions-grid {
    display: grid;
    gap: 1rem;
  }

  .actions-grid.one-col {
    grid-template-columns: 1fr;
  }

  .actions-grid.two-cols {
    grid-template-columns: 1fr;
  }

  @media (min-width: 640px) {
    .actions-grid {
      gap: 1.5rem;
    }

    .actions-grid.two-cols {
      grid-template-columns: 1fr 1fr;
    }
  }

  .action-card {
    padding: 1.5rem;
    background: rgba(0, 0, 0, 0.5);
    border: 2px dashed rgba(0, 170, 255, 0.4);
    border-radius: 0.75rem;
    transition: all 0.3s ease;
    cursor: pointer;
    text-align: center;
  }

  @media (min-width: 640px) {
    .action-card {
      padding: 2rem;
      border-radius: 1rem;
    }
  }

  .action-card:hover {
    transform: translateY(-4px);
    border-color: rgba(0, 170, 255, 0.8);
    border-style: solid;
    box-shadow: 0 8px 24px rgba(0, 170, 255, 0.2);
    background: rgba(0, 170, 255, 0.05);
  }

  .action-card:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  @media (min-width: 640px) {
    .action-icon {
      font-size: 3rem;
    }
  }

  .action-label {
    font-size: 1rem;
    font-weight: bold;
    margin-bottom: 0.25rem;
  }

  @media (min-width: 640px) {
    .action-label {
      font-size: 1.125rem;
    }
  }

  .action-hint {
    font-size: 0.75rem;
    opacity: 0.7;
  }

  @media (min-width: 640px) {
    .action-hint {
      font-size: 0.875rem;
    }
  }

  .guest-mode {
    /* background: linear-gradient(135deg, rgba(100, 50, 200, 0.1), rgba(50, 100, 255, 0.1)); */
    border-color: rgba(100, 100, 255, 0.4);
  }

  .guest-mode:hover {
    border-color: rgba(100, 100, 255, 0.8);
  }

  .modal-form {
    width: 100%;
    max-width: 32rem;
    margin: 0 auto;
    padding: 1.5rem;
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid rgba(0, 170, 255, 0.6);
    border-radius: 0.75rem;
    box-shadow: 0 0 40px rgba(0, 170, 255, 0.3);
  }

  @media (min-width: 640px) {
    .modal-form {
      padding: 2.5rem;
      border-radius: 1rem;
    }
  }

  .password-prompt {
    border-color: rgba(255, 200, 0, 0.6);
    box-shadow: 0 0 40px rgba(255, 200, 0, 0.2);
  }

  .form-title {
    font-size: clamp(1.375rem, 4vw, 1.875rem);
    font-weight: bold;
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .form-subtitle {
    text-align: center;
    margin-bottom: 1.5rem;
    opacity: 0.9;
    font-size: 0.875rem;
  }

  @media (min-width: 640px) {
    .form-subtitle {
      font-size: 1rem;
    }
  }

  .form-field {
    margin-bottom: 1.5rem;
  }

  .form-field label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.8125rem;
    opacity: 0.9;
  }

  @media (min-width: 640px) {
    .form-field label {
      font-size: 0.875rem;
    }
  }

  .form-input {
    width: 100%;
    padding: 0.75rem 0.875rem;
    background: rgba(0, 0, 0, 0.5);
    border: 2px solid rgba(0, 170, 255, 0.5);
    border-radius: 0.5rem;
    color: white;
    font-size: 0.9375rem;
    transition: all 0.2s;
  }

  @media (min-width: 640px) {
    .form-input {
      padding: 0.875rem 1rem;
      font-size: 1rem;
    }
  }

  .form-input:focus {
    outline: none;
    border-color: rgba(0, 170, 255, 1);
    box-shadow: 0 0 12px rgba(0, 170, 255, 0.4);
  }

  .form-input.centered {
    text-align: center;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    cursor: pointer;
    font-size: 0.875rem;
  }

  @media (min-width: 640px) {
    .checkbox-label {
      font-size: 1rem;
    }
  }

  .checkbox-label input[type='checkbox'] {
    width: 1.125rem;
    height: 1.125rem;
    accent-color: #00aaff;
  }

  @media (min-width: 640px) {
    .checkbox-label input[type='checkbox'] {
      width: 1.25rem;
      height: 1.25rem;
    }
  }

  .error-message {
    padding: 0.75rem 1rem;
    background: rgba(255, 0, 0, 0.2);
    border: 1px solid rgba(255, 0, 0, 0.5);
    border-radius: 0.5rem;
    color: rgba(255, 100, 100, 1);
    text-align: center;
    margin-bottom: 1.5rem;
    font-size: 0.875rem;
  }

  @media (min-width: 640px) {
    .error-message {
      font-size: 1rem;
    }
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  @media (min-width: 640px) {
    .form-actions {
      gap: 1rem;
    }
  }
</style>
