---
name: Solucion_Ingreso
description: Diagnostica y arregla problemas de inicio/cierre espontáneo de sesión en apps web con Firebase Auth, especialmente PWAs instaladas en Android e iOS. Úsala cuando los usuarios reporten que "se les cierra la sesión sola", "no pueden volver a entrar por bastante tiempo", "se quedan en pantalla de cargando", "el botón de Google no hace nada en la app instalada", o cualquier síntoma de bucle de login en PWA. Aplica los 5 fixes que estabilizaron TodyPan: persistencia de Auth en localStorage, sin tab manager de Firestore, SW sin skipWaiting/clientsClaim, login popup-first con fallback a redirect, y safety-net en el AuthContext.
---

# Solucion_Ingreso — Estabilización de Auth en PWA con Firebase

## Contexto

Esta skill aplica los 5 fixes que resolvieron el bug de "sesión se cierra sola y no puedo volver a entrar" en TodyPan. El bug es la combinación tóxica de:

1. **Persistencia de Auth en IndexedDB** — iOS Safari PWA borra IndexedDB tras 7 días sin uso; Android Chrome la purga primero bajo storage pressure.
2. **`signInWithRedirect` en PWA standalone** — storage partitioning de Chrome Android hace que el redirect aterrice en el navegador, no en la PWA → bucle de login.
3. **Service Worker con `skipWaiting` + `clientsClaim`** — cada deploy rompe el refresh de token de Firebase Auth de los usuarios activos.
4. **Sin safety-net en el AuthContext** — si Firebase se cuelga, el splash queda eterno.
5. **`persistentMultipleTabManager` en Firestore** — locks colgados al cerrar la PWA abruptamente traban el siguiente arranque.

El usuario tiene varias apps en `C:\Users\Sinfi\OneDrive\Infiniity Eventos\APP ZEVEN\`. No todas son PWA ni todas usan los 5 patrones — diagnostica primero, aplica solo los fixes que correspondan.

## INSTRUCCIONES PARA EL AGENTE

### Paso 1 — Confirmar alcance con el usuario

Antes de tocar nada, confirma con el usuario:
- "¿En qué app aplicamos los fixes?" (puede ser la del directorio actual o una específica de APP ZEVEN)
- "¿Esta app es PWA instalable o solo web?" (si solo es web, varios fixes no aplican)
- "¿Los usuarios reportan el bug, o lo aplicamos preventivamente?"

Si el usuario ya nombró la app en el mensaje, salta esta confirmación.

### Paso 2 — Mapear la estructura del proyecto

Identifica los 4 archivos clave (los nombres y rutas varían entre apps):

- **Firebase config** — el archivo que llama a `initializeApp(...)` y exporta `auth`/`db`. Búscalo con: `Grep "initializeApp" --glob "**/*.{js,ts,jsx,tsx}"`. Suele llamarse `firebase.js`, `firebase.ts`, `config/firebase.js`, `data/firebase.ts`.
- **Auth helper / context** — el archivo donde se llama a `signInWithPopup`, `signInWithRedirect` y/o `onAuthStateChanged`. Busca: `Grep "signInWith|onAuthStateChanged" --glob "**/*.{js,ts,jsx,tsx}"`. Puede ser `auth.js`, `AuthContext.jsx`, `contexts/AuthContext.tsx`, `data/auth.ts`.
- **Vite config** — `vite.config.js` o `vite.config.ts` en la raíz del proyecto.
- **Login screen** — el componente que renderiza el botón "Continuar con Google". Busca: `Grep "signInWithGoogle\\|Continuar con Google" --glob "**/*.{jsx,tsx}"`.

Si la app NO usa Vite (p.ej. Krusty Burger antes de migrar, o sitios con HTML puro), avisa al usuario y aplica solo los fixes que apliquen.

### Paso 3 — Diagnosticar qué fixes aplican

Para cada uno de los 5 fixes, verifica si el patrón problemático está presente:

| Fix | Patrón a buscar | Aplica si... |
|---|---|---|
| 1. Persistencia Auth | `indexedDBLocalPersistence` en el firebase config | Está presente |
| 2. Tab manager | `persistentMultipleTabManager` en el firebase config | Está presente |
| 3. SW agresivo | `skipWaiting: true` Y/O `clientsClaim: true` en `vite.config.*` workbox | Cualquiera presente |
| 4. Redirect ciego | `signInWithRedirect` sin intentar popup primero, o usado siempre que es PWA | Solo redirect, sin popup-first |
| 5. Sin safety-net | El AuthContext no tiene un `setTimeout` que libere `loading` | No hay timeout |

Reporta al usuario en una tabla qué fixes aplican y cuáles no, antes de empezar a editar. Si **ningún** fix aplica (la app ya estaba bien o no es PWA con Firebase Auth), dilo y termina.

### Paso 4 — Aplicar los fixes

Cuando edites, **respeta el estilo del archivo** (tabs vs spaces, comillas simples vs dobles, comentarios en el idioma del repo). Adapta los cambios al lenguaje del archivo (JS o TS).

#### Fix 1 — Persistencia Auth en localStorage

En el firebase config:
- **Quitar** import y uso de `indexedDBLocalPersistence`.
- **Mantener o agregar** `browserLocalPersistence` y llamar `setPersistence(auth, browserLocalPersistence)`.
- Si el código tenía un fallback `indexedDB → localStorage`, simplificar a solo `browserLocalPersistence`.

#### Fix 2 — Quitar tab manager de Firestore

En el firebase config:
- **Quitar** import de `persistentMultipleTabManager`.
- En `initializeFirestore({ localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })`, simplificar a `persistentLocalCache()` sin argumentos.
- Mantener el `try/catch` con fallback a `getFirestore()` si existe.

#### Fix 3 — SW sin skipWaiting/clientsClaim

En `vite.config.*`, dentro del bloque `VitePWA({ workbox: { ... } })`:
- **Quitar** `skipWaiting: true`.
- **Quitar** `clientsClaim: true`.
- **Mantener** `cleanupOutdatedCaches: true` si está (no es problemático).
- **Mantener** `navigateFallbackDenylist: [/^\\/__\\/auth\\//]` si está (necesario para Firebase Auth).
- Si la app NO tiene `VitePWA` configurado, este fix no aplica — saltar.

#### Fix 4 — Login popup-first con fallback a redirect

En el archivo de auth, reescribir la función `signInWithGoogle` (o equivalente) para:

1. Detectar si es **iOS PWA standalone** (no solo PWA — iOS específicamente). En iOS PWA, WebKit bloquea popup → redirect directo.
2. En cualquier otro caso (desktop, mobile web, Android PWA), **intentar popup primero**.
3. Si el popup falla con `auth/popup-blocked`, `auth/operation-not-supported-in-this-environment`, o `auth/internal-error`, **caer a redirect**.
4. Si el popup falla con `auth/popup-closed-by-user` o `auth/cancelled-popup-request`, propagar el error sin redirect (el usuario canceló adrede).
5. Mantener `consumeRedirectResult` intacto.

Si el archivo de Login muestra un aviso "¿ya iniciaste pero te devuelve aquí?" basado en `isStandalonePWA()`, ajustarlo a `isIOSPWA()` para que solo aparezca donde realmente aplica.

#### Fix 5 — Safety-net en AuthContext

En el AuthContext o store de auth, dentro del `useEffect`/init donde se suscribe a `onAuthStateChanged`:
- Agregar un `setTimeout` que después de **5 segundos** ponga `loading = false` aunque Firebase no haya respondido.
- Asegurarse de que el `clearTimeout` se llame en el cleanup.
- Si la app usa Zustand u otra store global (no `useState`), adaptar (ver Horión: `setTimeout(() => { if (store.loading) store.setState({ loading: false }) }, 4000)`).

### Paso 5 — Verificar build

Correr `npm run build` (o el comando equivalente del `package.json`). Si falla, leer el error y arreglarlo antes de continuar. No reportar como completado si el build falla.

### Paso 6 — Resumen al usuario

Al terminar, dar al usuario:
- Tabla con qué fixes se aplicaron y cuáles se saltaron (con razón).
- Recordatorio de que las usuarias con la PWA ya cacheada necesitan **dos arranques** después del deploy para recibir los fixes (la primera apertura instala el SW nuevo en background; la segunda lo activa).
- Preguntar si quiere desplegar ahora con la skill `despliegue_en_vercel`, o probar en local primero.

## Anti-patrones que NO debes hacer

- **No apliques los 5 fixes a ciegas.** Si una app no es PWA o no tiene VitePWA, los fixes 3 y parte del 4 no aplican.
- **No agregues `browserLocalPersistence` si la app ya usa el default de Firebase** (que es localStorage en web). Solo lo necesitas si hay un `setPersistence` explícito a IndexedDB que estás reemplazando.
- **No quites `persistentLocalCache` completo.** Solo quitas el `tabManager` interno. La cache offline debe seguir funcionando.
- **No toques las reglas de Firestore.** Esta skill es solo de cliente.
- **No cambies el flujo de signOut, registro de usuario, ni reglas de roles.** Solo el flujo de signIn y persistencia.
- **No edites archivos `*-Milean.*`, `*-backup.*` o similares.** Son copias antiguas, no el código activo.

## Referencia: app de origen

El fix se desarrolló y validó en TodyPan (`APP TODYPAN/todypan-app`). Si el usuario quiere ver el código de referencia o comparar antes de aplicar a otra app, los archivos modificados fueron:
- `src/firebase.js` (fixes 1 y 2)
- `vite.config.js` (fix 3)
- `src/auth.js` (fix 4)
- `src/context/AuthCtx.jsx` (fix 5)
- `src/screens/Login.jsx` (ajuste del aviso de iOS PWA)
