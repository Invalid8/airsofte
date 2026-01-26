import tailwindcss from '@tailwindcss/vite'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      sourcemap: false,
      minify: 'esbuild'
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      sourcemap: false,
      minify: 'esbuild'
    }
  },
  renderer: {
    plugins: [svelte(), tailwindcss()],
    optimizeDeps: {
      exclude: ['@vercel/analytics']
    },
    build: {
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        external: ['$app/stores', '$app/environment'],
        treeshake: true,
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor'
            }

            return undefined
          }
        }
      }
    }
  }
})
