import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { existsSync, readFileSync } from 'node:fs'

// 🧪 En desarrollo, /api/* lo atienden las mismas funciones de Vercel (api/*.js), para probar el
// pedido, la demo y los avisos sin publicar. Usan la llave local (scripts/serviceAccount.base64.txt,
// fuera de git): OJO, escriben en el Firebase de verdad — prueba con la demo.
function apiLocal() {
  return {
    name: 'api-local',
    apply: 'serve',
    configureServer(server) {
      const llave = 'scripts/serviceAccount.base64.txt'
      if (!process.env.FIREBASE_SERVICE_ACCOUNT && existsSync(llave)) process.env.FIREBASE_SERVICE_ACCOUNT = readFileSync(llave, 'utf8')
      server.middlewares.use(async (req, res, next) => {
        const m = /^\/api\/([\w-]+)(?:\?|$)/.exec(req.url || '')
        if (!m || !existsSync(`api/${m[1]}.js`)) return next()
        let cuerpo = ''
        for await (const trozo of req) cuerpo += trozo
        req.body = cuerpo
        res.status = c => { res.statusCode = c; return res }
        res.json = d => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(d)) }
        try {
          const { default: handler } = await server.ssrLoadModule(`/api/${m[1]}.js`)
          await handler(req, res)
        } catch (e) {
          console.error('[api-local]', e)
          res.status(500).json({ error: String(e?.message || e) })
        }
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    apiLocal(),
    VitePWA({
      // 'prompt': la versión nueva espera y entra cuando src/registerSW.js lo decide (nunca en
      // mitad de una comanda o de un pedido).
      registerType: 'prompt',
      includeAssets: ['icons/favicon.png', 'icons/apple-touch-icon.png'],
      // El service worker NO se activa en desarrollo (evita problemas de caché y de login).
      devOptions: { enabled: false },
      workbox: {
        // SIN skipWaiting ni clientsClaim, a propósito: la versión nueva no le quita la app a
        // quien la está usando ni corta la sesión de Firebase Auth (ver src/registerSW.js).
        // Las cachés viejas se borran cuando la nueva entra.
        cleanupOutdatedCaches: true,
        // La cartilla es un archivo real: que el SW no la desvíe al index.html.
        // La ruta vieja sigue en la lista porque hay enlaces sueltos que aún la
        // usan; el redirect de vercel.json los manda a la cartilla.
        // (No entra al precache, y está bien: son 4,7 MB que nadie que viene a
        //  mirar un menú tiene por qué bajarse. Solo se pide al pulsar el botón.)
        navigateFallbackDenylist: [/^\/cartilla-appetic\.pdf/, /^\/propuesta-appetic\.pdf/],
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
