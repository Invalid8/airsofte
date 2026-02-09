import tailwindcss from '@tailwindcss/vite'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'

const isElectron = process.env.ELECTRON === 'true'

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
    plugins: [
      svelte(),
      tailwindcss(),
      !isElectron &&
        VitePWA({
          registerType: 'autoUpdate',
          strategies: 'generateSW',
          manifest: {
            name: 'Airsofte',
            short_name: 'Airsofte',
            description: 'A retro shooter game',
            theme_color: '#0b1220',
            background_color: '#0b1220',
            display: 'fullscreen',
            orientation: 'landscape',
            icons: [
              { src: '/icons/icon-48x48.png', sizes: '48x48', type: 'image/png' },
              { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
              { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
              { src: '/icons/icon-120x120.png', sizes: '120x120', type: 'image/png' },
              { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
              { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
              { src: '/icons/icon-180x180.png', sizes: '180x180', type: 'image/png' },
              { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }
            ]
          },
          workbox: {
            skipWaiting: true,
            clientsClaim: true,
            globPatterns: ['**/*.{js,css,html,wasm,png,svg,mp3,ogg,woff,woff2,ttf,eot}'],
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
          }
        })
    ].filter(Boolean),
    define: {
      'import.meta.env.__ELECTRON__': JSON.stringify(isElectron)
    },
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
      include: ['svelte', 'howler', 'gsap']
    }
  }
})
