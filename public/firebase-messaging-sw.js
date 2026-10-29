/* 🔔 Service worker de NOTIFICACIONES (Firebase Cloud Messaging).
 *
 * Va APARTE del service worker de la app (el de vite-plugin-pwa, en "/"): se registra con el
 * alcance '/firebase-cloud-messaging-push-scope', que es lo que Firebase recomienda para que los
 * dos convivan sin pisarse.
 *
 * La configuración (pública) llega en la URL del registro (?apiKey=…&projectId=…), así este
 * archivo no lleva nada fijo. Ver src/services/notificaciones.js.
 *
 * Los mensajes que manda /api/notificar-listo traen `webpush.notification` + `fcmOptions.link`:
 * el SDK los muestra solo cuando la app está cerrada o en segundo plano, y al tocarlos abre el link.
 */
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js')

const params = new URLSearchParams(self.location.search)
firebase.initializeApp({
  apiKey: params.get('apiKey'),
  projectId: params.get('projectId'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
})
firebase.messaging()
