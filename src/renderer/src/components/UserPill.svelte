<script lang="ts">
  import { audioManager } from '../utils/AudioManager'
  import { currentUser, userManager } from '../utils/userManager'

  function handleSwitchUser(): void {
    audioManager.playSound('menuClick')
    userManager.logout()
  }
</script>

{#if $currentUser}
  <div class="user-badge absolute top-5 right-5 z-999">
    <div class="user-avatar">
      {$currentUser.username.charAt(0).toUpperCase()}
    </div>
    <div class="user-details">
      <div class="user-name">{$currentUser.username}</div>
      <button class="switch-user-btn" onclick={handleSwitchUser}> Switch User </button>
    </div>
  </div>
{/if}

<style>
  .user-badge {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background: rgba(0, 0, 0, 0.4);
    border: 2px solid rgba(0, 170, 255, 0.3);
    border-radius: 9999px;
    transition: all 0.3s ease;
  }

  .user-badge:hover {
    border-color: rgba(0, 170, 255, 0.6);
    box-shadow: 0 0 20px rgba(0, 170, 255, 0.2);
  }

  .user-avatar {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(0, 170, 255, 0.4), rgba(0, 255, 170, 0.4));
    border: 2px solid rgba(0, 170, 255, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    font-weight: bold;
  }

  .user-details {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .user-name {
    font-size: 1.125rem;
    font-weight: bold;
    line-height: 1;
  }

  .switch-user-btn {
    background: none;
    border: none;
    color: rgba(0, 170, 255, 0.8);
    font-size: 0.75rem;
    cursor: pointer;
    padding: 0;
    transition: color 0.2s;
    font-family: 'Orbitron', sans-serif;
  }

  .switch-user-btn:hover {
    color: rgba(0, 170, 255, 1);
    text-decoration: underline;
  }
</style>
