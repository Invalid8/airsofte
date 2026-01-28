import tailwindcss from '@tailwindcss/vite'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: undefined
        }
      }
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
    build: {
      sourcemap: false,
      minify: 'esbuild',
      cssMinify: true,
      rollupOptions: {
        treeshake: true,
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('howler')) return 'audio'
              if (id.includes('gsap')) return 'animation'
              return 'vendor'
            }
            if (id.includes('/lib/')) return 'game-logic'
            if (id.includes('/utils/')) return 'utils'
            return undefined
          },
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name || ''
            if (/\.(png|jpe?g|svg|gif|webp)$/i.test(name)) return 'images/[name]-[hash][extname]'
            if (/\.(woff2?|ttf|otf|eot)$/i.test(name)) return 'fonts/[name]-[hash][extname]'
            if (/\.(mp3|ogg|wav)$/i.test(name)) return 'audio/[name]-[hash][extname]'
            return 'assets/[name]-[hash][extname]'
          }
        }
      }
    },
    optimizeDeps: {
      include: ['svelte', 'howler', 'gsap'],
      exclude: []
    }
  }
})
