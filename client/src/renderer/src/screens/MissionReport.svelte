<script lang="ts">
  import { onMount } from 'svelte'
  import { fly, fade } from 'svelte/transition'
  import { geminiApiClient } from '../utils/geminiApiClient'
  import type { MissionReportParams } from '../utils/geminiApiClient'

  let {
    missionName,
    outcome,
    score,
    enemiesDefeated,
    damageTaken,
    previousReports = [],
    onClose
  }: {
    missionName: string
    outcome: 'victory' | 'defeat'
    score: number
    enemiesDefeated: number
    damageTaken: number
    previousReports?: string[]
    onClose?: () => void
  } = $props()

  let report = $state<string>('')
  let loading = $state(true)
  let isOnline = $state(true)

  async function generateReport() {
    const params: MissionReportParams = {
      missionName,
      outcome,
      score,
      enemiesDefeated,
      damageTaken,
      previousReports: previousReports.slice(-2)
    }

    try {
      const generatedReport = await geminiApiClient.generateMissionReport(params)
      report = generatedReport
      loading = false
    } catch (error) {
      isOnline = false
      loading = false
      report = generateFallbackReport()
    }
  }

  function generateFallbackReport(): string {
    const outcomeText =
      outcome === 'victory'
        ? 'Mission completed successfully.'
        : 'Mission failed. Regroup and try again.'

    return `MISSION REPORT: ${missionName}

STATUS: ${outcome.toUpperCase()}

PERFORMANCE SUMMARY:
- Final Score: ${score.toLocaleString()} points
- Enemies Neutralized: ${enemiesDefeated}
- Damage Sustained: ${damageTaken} units

${outcomeText}

COMMAND OUT.`
  }

  function handleClose() {
    if (onClose) onClose()
  }

  onMount(() => {
    generateReport()
  })
</script>

<div
  class="mission-report-overlay fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
  in:fade={{ duration: 300 }}
>
  <div
    class="report-container max-w-3xl w-full bg-black/95 border-2 border-cyan-500 rounded-lg p-8 shadow-2xl"
    in:fly={{ y: 50, duration: 500, delay: 200 }}
  >
    <div class="report-header text-center mb-6">
      <div class="header-label text-xs opacity-70 uppercase tracking-wider mb-2">
        Classified Report
      </div>
      <h2 class="report-title text-3xl font-bold text-cyan-400 title">Mission Debriefing</h2>
    </div>

    <div class="report-body mb-8 scroll max-h-96 overflow-y-auto">
      {#if loading}
        <div class="loading-state text-center py-12">
          <div class="loading-spinner mb-4"></div>
          <div class="loading-text text-sm opacity-70">Generating report...</div>
        </div>
      {:else}
        <div class="report-text whitespace-pre-wrap leading-relaxed">
          {report}
        </div>
      {/if}
    </div>

    <div class="report-footer text-center">
      <button
        class="close-button px-8 py-3 bg-cyan-600 hover:bg-cyan-700 border-2 border-cyan-400 rounded text-sm font-bold uppercase tracking-wider transition-all"
        onclick={handleClose}
      >
        Continue
      </button>
    </div>

    {#if !isOnline && !loading}
      <div class="offline-notice text-xs text-center mt-4 opacity-50">
        Offline mode - Standard report generated
      </div>
    {/if}
  </div>
</div>

<style>
  .report-container {
    backdrop-filter: blur(12px);
    animation: pulse-border 3s ease-in-out infinite;
  }

  @keyframes pulse-border {
    0%,
    100% {
      border-color: rgba(0, 170, 255, 0.8);
      box-shadow: 0 0 30px rgba(0, 170, 255, 0.4);
    }
    50% {
      border-color: rgba(0, 170, 255, 1);
      box-shadow: 0 0 40px rgba(0, 170, 255, 0.6);
    }
  }

  .title {
    word-spacing: -10px;
    line-height: 120%;
    text-shadow: 0 0 20px rgba(0, 170, 255, 0.6);
  }

  .header-label {
    font-family: 'Orbitron', sans-serif;
    color: #00aaff;
  }

  .report-text {
    font-family: 'Courier New', monospace;
    font-size: 0.9375rem;
    color: #e0e0e0;
    line-height: 1.8;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(0, 170, 255, 0.3);
    border-top-color: #00aaff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .close-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 170, 255, 0.5);
  }

  .close-button:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    .report-container {
      padding: 1.5rem;
    }

    .report-title {
      font-size: 1.75rem;
    }

    .report-text {
      font-size: 0.875rem;
    }
  }
</style>
