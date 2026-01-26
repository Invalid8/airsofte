import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

export default defineConfig({
  root: path.resolve(__dirname, 'src/renderer'),
  base: '/',

  plugins: [
    svelte(),
    tailwindcss(),

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
        globPatterns: ['**/*.{js,css,html,wasm,png,svg,mp3,ogg,woff,woff2,ttf,eot}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
      }
    })
  ],

  build: {
    outDir: path.resolve(__dirname, 'dist/web'),
    emptyOutDir: true
  },

  define: {
    __ELECTRON__: false
  }
})
