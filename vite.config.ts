import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'

  return {
    plugins: [sveltekit(), tailwindcss()],
    define: {
      __DEV__: JSON.stringify(isDev)
    }
  }
})
