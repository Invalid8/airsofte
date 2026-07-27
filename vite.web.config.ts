// vite.web.config.ts
import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    sveltekit(),
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
        globPatterns: ['**/*.{js,css,html,wasm,svg}'],
        maximumFileSizeToCacheInBytes: 1024 * 1024
      }
    })
  ],
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production')
  }
})
