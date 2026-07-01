import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon.png', 'icons/apple-touch-icon.png'],
      // El service worker NO se activa en desarrollo (evita problemas de caché y de login).
      devOptions: { enabled: false },
      workbox: {
        // Activa la versión nueva de inmediato y borra las cachés viejas, para
        // que la app instalada se actualice sola sin reinstalarla.
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        // El PDF de la propuesta es un archivo real: que el SW no lo desvíe al index.html.
        navigateFallbackDenylist: [/^\/propuesta-appetic\.pdf/],
      },
      manifest: {
        name: 'Appetic — el menú de tu barrio',
        short_name: 'Appetic',
        description: 'Mira el menú de tu negocio favorito del barrio y pide en segundos.',
        theme_color: '#ED7D2B',
        background_color: '#FFFBF4',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          // Maskable aparte: logo dentro de la safe-zone sobre naranja (para Android).
          { src: '/icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
})
