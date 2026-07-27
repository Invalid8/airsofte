<script lang="ts">
  import '../app.css'
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'

  let analyticsInjected = false

  onMount(async () => {
    if (browser && !analyticsInjected) {
      try {
        const { injectAnalytics } = await import('@vercel/analytics/sveltekit')
        injectAnalytics({
          mode: import.meta.env.MODE === 'production' ? 'production' : 'development'
        })
        analyticsInjected = true
      } catch (error) {
        console.warn('Analytics failed to load:', error)
      }
    }
  })
</script>

<slot />
