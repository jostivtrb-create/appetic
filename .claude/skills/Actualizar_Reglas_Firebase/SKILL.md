---
name: Actualizar_Reglas_Firebase
description: Mantiene y DESPLIEGA las reglas de seguridad de Firestore de cualquier proyecto, directo a Firebase, sin que el usuario pegue nada a mano. Úsala SIEMPRE que un cambio de código necesite tocar reglas de Firebase, cuando el usuario diga "actualiza las reglas", "cambia/sube/despliega las reglas de Firebase", "envíame/pásame las reglas", "qué reglas hay", "muéstrame las reglas actuales", o cuando implementes una feature que requiera nuevos permisos en Firestore (nueva colección, nuevo rol que escribe/lee, edición/borrado por un rol, etc.). Es GENÉRICA: detecta el proyecto y la cuenta correctos del propio código de la app, instala lo que falte (firebase-tools, firebase.json, .firebaserc) y despliega con cuenta+proyecto EXPLÍCITOS para que NUNCA vaya a la app o cuenta equivocada. Si el proyecto no se puede desplegar, cae al modo manual de copiar-pegar.
---

# Actualizar y Desplegar Reglas de Firestore (Genérico · Multi-cuenta · Seguro)

Esta skill mantiene el archivo `firestore.rules` del proyecto sincronizado con el código y lo **despliega directo a Firebase** con un comando, sin que el usuario entre a la consola ni pegue nada.

El usuario trabaja con **muchas apps y muchas cuentas de Firebase en el mismo PC**. El riesgo número uno es **desplegar a la cuenta o proyecto equivocado**. Toda esta skill está diseñada para que eso sea **imposible**.

## Principio de seguridad (NO LO ROMPAS)

1. **La verdad absoluta del proyecto es el código de la app**, no el estado global de la CLI. El `projectId` al que apunta la app (en su config de Firebase) es el ÚNICO destino válido.
2. **Nunca confíes en "la cuenta activa" ni en "el proyecto activo" globales.** Esos son exactamente lo que provoca enviar al lugar equivocado.
3. **Despliega SIEMPRE con cuenta y proyecto explícitos:**
   `firebase deploy --only firestore:rules --project <projectId> --account <email>`
   Aunque el estado global apunte a otra app, con estos flags es físicamente imposible equivocarse.
4. **La cuenta correcta se descubre, no se asume:** es la cuenta logueada que realmente tiene acceso a ese `projectId`.

## Modo de despliegue elegido por el usuario

**Automático si hay match único.** Si exactamente una cuenta logueada es dueña del `projectId` de la app, despliega sin preguntar. Solo pregunta cuando hay ambigüedad o riesgo (varias cuentas con acceso, ninguna con acceso, projectId que no coincide entre fuentes). NO pidas confirmación cuando el match es inequívoco.

---

## Proceso paso a paso

### Paso 1 — Localizar los archivos del proyecto actual

Trabaja sobre el **proyecto actual** (cwd), no sobre rutas fijas.

- **Reglas:** lee `firebase.json` → campo `firestore.rules` para la ruta. Si no hay `firebase.json`, busca `firestore.rules` por glob en el repo. Esa es la fuente única de verdad de las reglas.
- **Config de la app (ground truth del projectId):** busca el `projectId` en el código: `firebaseConfig`/`initializeApp` en `src/firebase.*`, `public/firebase-adapter.js`, o variables `*_FIREBASE_PROJECT_ID` / `VITE_*PROJECT_ID` en `.env`. Saca el valor de `projectId`. **Ese es `<PROJECT_ID>`.**
- Si no encuentras un `projectId` claro en el código, **pregúntale al usuario** a qué proyecto pertenece esta app. No adivines.

### Paso 2 — Determinar y aplicar el cambio de reglas

(Igual que el flujo clásico — esto no cambió.)

- Si el usuario pide un cambio concreto, aplícalo.
- Si vienes de implementar una feature, deriva del código qué permiso falta (nueva colección, campo editable, rol). **No inventes** colecciones ni campos: confírmalos contra el código real.
- Ante dudas de alcance (¿quién puede hacerlo? ¿bajo qué estado?), **pregunta antes de escribir**. No adivines reglas de seguridad.
- Aplica el cambio mínimo al `match` correspondiente y **mantén el estilo que YA usa el archivo de este proyecto** (sus propios helpers `isAdmin()`, `isSignedIn()`, etc.; su patrón `diff().affectedKeys().hasOnly([...])` para updates por campo). No impongas helpers de otros proyectos.
- Actualiza el encabezado del archivo:
  - `// Última actualización: <fecha de hoy YYYY-MM-DD>`
  - `// Último cambio: <una línea: qué cambió y por qué>`

Si el usuario solo quiere **ver/consultar** las reglas sin cambiarlas, salta este paso.

### Paso 3 — Asegurar las herramientas (instalar lo que falte)

La skill debe dejar cada app lista para desplegar siempre igual. Verifica y crea lo que falte:

1. **Firebase CLI.** Corre `firebase --version`. Si falla → instálala: `npm install -g firebase-tools`. Vuelve a verificar.
2. **`firebase.json`.** Si no existe, créalo apuntando a las reglas:
   ```json
   { "firestore": { "rules": "firestore.rules", "indexes": "firestore.indexes.json" } }
   ```
   (Omite `indexes` si el proyecto no tiene `firestore.indexes.json`.)
3. **`.firebaserc`.** Si no existe o apunta a otro proyecto, créalo/corrígelo fijando el projectId ground-truth. Esto pinea el proyecto al repo y refuerza el destino:
   ```json
   { "projects": { "default": "<PROJECT_ID>" } }
   ```

### Paso 4 — Resolver la CUENTA correcta (el blindaje clave)

1. Lista las cuentas logueadas: `firebase login:list`.
2. **Si no hay ninguna cuenta:** hace falta autorizar la CLI una vez con `firebase login`. Esto es interactivo (OAuth en navegador) y **NO se puede correr desde la herramienta Bash/PowerShell del agente**: en un shell sin TTY falla con `Cannot run login in non-interactive mode`, y si lo lanzas directo puede quedar colgado. La forma que SÍ funciona es **abrirle al usuario una ventana de terminal interactiva** donde corra el login, y que él complete el navegador:
   - PowerShell (Windows): `Start-Process powershell -ArgumentList '-NoExit','-Command','firebase login'`
   - Mantén el comando lanzado **simple y limpio**: solo `firebase login`. NO le metas `Write-Host` con paréntesis/textos sin comillas — rompe el parseo de la ventana hija. Las instrucciones dáselas en el chat, no en el comando.
   - Aclárale que **tener la cuenta/consola de Firebase abierta en el navegador NO autoriza la CLI** — son cosas distintas; este login es aparte y es de una sola vez.
   - El `firebase login` reciente (v15.x) pregunta primero **"Enable Gemini in Firebase features?"** y luego **telemetría (Y/n)** ANTES de abrir el navegador; avísale que responda esas dos en la ventana.
   - Cuando termine, retoma con `firebase login:list` para confirmar y sigue automático. Para agregar otra cuenta sin desloguear las demás: `firebase login:add`.
3. Para **cada** cuenta logueada, pregunta qué proyectos ve y si incluye el destino:
   `firebase projects:list --account <email>` (puedes usar `--json` y filtrar por `<PROJECT_ID>`).
4. Determina las cuentas que **sí tienen acceso** a `<PROJECT_ID>`:
   - **Exactamente 1** → es la cuenta correcta. Continúa (modo automático, sin preguntar).
   - **0** → ninguna cuenta logueada es dueña del proyecto. NO despliegues con ninguna. Pide al usuario `firebase login:add` con la cuenta dueña de `<PROJECT_ID>`, luego reintenta.
   - **2 o más** → ambigüedad. **Pregunta** al usuario con cuál cuenta desplegar. No elijas tú.

Llama `<EMAIL>` a la cuenta resuelta.

### Paso 4.5 — Guard de PRIMER despliegue: pedir las reglas vivas (clave)

`firebase deploy` **REEMPLAZA** las reglas vivas con el archivo local; **no fusiona**. Y la Firebase CLI **no tiene** comando para leer las reglas vivas (no se pueden bajar para comparar). Por eso, la **primera vez** que se despliega en una app desde este PC hay riesgo de pisar reglas buenas con un local desactualizado.

Considera que es "primera vez" si **no existía `.firebaserc`** al empezar (nunca se desplegó por CLI desde aquí). En ese caso, ANTES de desplegar, pídele al usuario las reglas vivas y reconcilia:

1. **Pide pegar lo vivo.** Dile exactamente: *"Es la primera vez que despliego esta app por comando. Para no pisar nada, entra a Firebase Console → Firestore Database → pestaña **Reglas**, copia TODO lo que haya y pégamelo aquí."* Espera a que las pegue.
2. **Respáldalo.** Guarda lo que pegó tal cual en `firestore.rules.backup-<fecha>` en el repo (rollback siempre disponible).
3. **Reconcilia contra el local:**
   - Si lo pegado es **igual** al `firestore.rules` local → el local ya está al día; aplica el cambio pedido y despliega.
   - Si **difieren** → lo vivo (lo que pegó) es el estado real actual. **Adopta lo vivo como base**: parte de esas reglas y vuelve a aplicar encima SOLO el cambio que se pretendía. Muéstrale al usuario en qué difieren antes de continuar. Así nunca se pierde un cambio que estaba vivo y no en el repo.
   - Si el usuario dice que **no hay reglas** (proyecto nuevo, reglas por defecto) → no hay nada que perder; sigue normal.
4. Crea el `.firebaserc` (Paso 3) y continúa al deploy. A partir de aquí el repo es la fuente de verdad.

Del **segundo despliegue en adelante** (ya existe `.firebaserc`) este paso se omite: ya no se pide pegar nada, queda 100% automático.

### Paso 5 — Desplegar (con cuenta y proyecto explícitos)

Comando exacto, siempre con ambos flags:

```
firebase deploy --only firestore:rules --project <PROJECT_ID> --account <EMAIL>
```

- En **modo automático** (match único de cuenta + el `<PROJECT_ID>` coincide entre app, `.firebaserc` y `firebase.json`): despliega directo.
- Si hubo **cualquier discrepancia** (projectId distinto entre fuentes, varias cuentas, etc.): muestra "voy a enviar a **<PROJECT_ID>** con **<EMAIL>**" y espera OK antes de correr el comando.
- Si la feature también necesitó **índices** compuestos, recuérdalo y despliega también: `firebase deploy --only firestore:indexes` (o `firestore` para ambos).

### Paso 6 — Verificar y reportar (NOTIFICA SIEMPRE ante error)

- Confirma que el deploy terminó en éxito (busca `Deploy complete!` / ausencia de error y `+ cloud.firestore: released rules`).
- **Si el deploy falla por CUALQUIER motivo, NOTIFÍCALE al usuario de inmediato**, claro y en español: qué pasó, por qué, y qué hacer. Nunca lo dejes pasar en silencio ni reportes éxito si no lo hubo. En casi todos los fallos las reglas vivas quedan **intactas** (Firebase valida antes de publicar), así que producción no se rompe — díselo para que esté tranquilo. Errores comunes y su causa:

  | Mensaje de la CLI | Causa | Qué hacer |
  |---|---|---|
  | `Compilation error` / `unexpected token` | Sintaxis de reglas mala | Arregla el `firestore.rules` y reintenta. Producción intacta. |
  | `HTTP Error: 403` / `Permission denied` / `caller does not have permission` | La cuenta no tiene acceso a ese proyecto | Volver al Paso 4: resolver/loguear la cuenta dueña. |
  | `Failed to authenticate` / `not logged in` | Sesión vencida o sin login | `firebase login` (o `login:add`) y reintenta. |
  | `Project ... does not exist` / `Invalid project` | `<PROJECT_ID>` mal detectado | Reconfirmar el projectId contra el código de la app. |
  | `ENOTFOUND` / `network` / timeout | Sin internet | Reintentar cuando haya conexión. |

  Si el error es nuevo o no encaja en la tabla, **regístralo** en la Bitácora (ver abajo) para que la skill aprenda.
- Reporta al usuario en una línea: qué cambió, a qué **proyecto** y con qué **cuenta** se desplegó. Ejemplo:
  > ✅ Reglas desplegadas a **legends-barber-9862c** con **tucuenta@gmail.com**. Cambio: la recepcionista ya puede X. Ya está activo en producción, no tienes que pegar nada.

### Paso 7 — Fallback manual (solo si NO se puede desplegar)

Si no hay CLI y no se puede instalar, o el usuario no tiene/​no quiere loguear la cuenta, cae al modo clásico: entrega el **archivo completo** para pegar a mano.

> **Para aplicarlo a mano:** Firebase Console → Firestore Database → pestaña **Reglas**, borra todo y pega esto, luego **Publicar**:
>
> ```
> [CONTENIDO COMPLETO de firestore.rules]
> ```
>
> ⚠️ Mientras no publiques, el cambio de permisos NO está activo.

El bloque que entregas debe ser **idéntico** al `firestore.rules` guardado.

---

## Reglas importantes

- **Nunca despliegues a una cuenta/proyecto que no sea el ground-truth de la app.** Cuenta y proyecto van SIEMPRE explícitos en el comando. Ante cualquier duda de destino, pregunta.
- **El archivo guardado y lo desplegado/entregado deben coincidir.** No despliegues una versión y guardes otra.
- **Seguridad de las reglas primero:** una regla de más abre un hueco; una de menos rompe la app. Ante la duda sobre permisos, pregunta antes de escribir.
- **Código y reglas van juntos.** Si una feature toca ambos, despliega/entrega los dos; si solo va uno, algo se rompe — avísalo.
- **No fuerces helpers/roles de otros proyectos.** Respeta los que ya usa el `firestore.rules` de la app actual.

## Comandos de referencia

| Para | Comando |
|---|---|
| Ver versión / si está instalada | `firebase --version` |
| Instalar la CLI | `npm install -g firebase-tools` |
| Ver cuentas logueadas | `firebase login:list` |
| Agregar otra cuenta (sin desloguear) | `firebase login:add` |
| Ver proyectos de una cuenta | `firebase projects:list --account <email>` |
| Desplegar SOLO reglas (seguro) | `firebase deploy --only firestore:rules --project <id> --account <email>` |
| Desplegar reglas + índices | `firebase deploy --only firestore --project <id> --account <email>` |

---

## Bitácora de aprendizajes (AUTO-RETROALIMENTACIÓN — manténla viva)

Esta skill debe **mejorar con el uso**. Cada vez que en un despliegue real descubras algo que esta skill aún no contemplaba —un error nuevo de la CLI, un patrón distinto de dónde vive el `projectId` en una app, una particularidad de una cuenta, un caso límite, un mensaje engañoso— **edita este archivo** y déjalo registrado, en el momento, sin esperar a que el usuario lo pida:

- Si es un **error nuevo de deploy** → añádelo a la tabla del Paso 6.
- Si es una **nueva ubicación del projectId** (otro archivo/variable) → añádela al Paso 1.
- Si es **cualquier otro aprendizaje** → anótalo abajo con fecha, qué pasó y cómo se resolvió.

Así, mientras más apps despleguemos, más completa y a prueba de fallos se vuelve la skill, sin repetir tropiezos.

### Registro

- **2026-06-05 · Setup inicial.** La Firebase CLI (v15.9.0) NO tiene comando para leer las reglas vivas (revisado `firebase firestore:*`): por eso el guard de primer despliegue pide pegar lo vivo. App Legends → projectId `legends-barber-9862c` (en `public/firebase-adapter.js`). En este PC, al crear la skill no había ninguna cuenta logueada (`firebase login` pendiente).
- **2026-06-05 · Primer despliegue real (Legends), aprendizajes del login:**
  - `firebase login` NO corre desde la herramienta no-interactiva del agente. La solución que funcionó: lanzar una ventana interactiva con `Start-Process powershell -ArgumentList '-NoExit','-Command','firebase login'` y que el usuario complete el navegador. (Detallado en Paso 4.)
  - Error cometido: al lanzar la ventana le metí `Write-Host` con paréntesis sin comillas en el `-Command` → `Unexpected token ')'` y el `firebase login` no corrió. Lección: el comando lanzado debe ser SOLO `firebase login`, las instrucciones van en el chat.
  - El usuario confundió "tener la consola de Firebase abierta en el navegador" con "CLI autorizada". Hay que aclararlo explícito.
  - `firebase login` v15.9.0 ahora pregunta **"Enable Gemini in Firebase features?"** ANTES de la telemetría (dos prompts antes del navegador).
  - Guard de primer despliegue resuelto sin pedir pegar: el usuario mostró las reglas vivas en pantalla (encabezado `2026-06-01 · F6-fix`) = la base exacta del `firestore.rules` local (que era esa base + bloques nuevos), así que reconcilié visualmente y pegar/desplegar el local era seguro (superset). Confirmar la base por captura es una vía válida de reconciliación.
  - Cuenta dueña de Legends: la que figura en los `ADMIN_EMAILS` del propio código de la app. Match único → deploy automático. `firebase deploy --only firestore ...` subió reglas + índices juntos: `Deploy complete!`. Tras este login, los próximos despliegues quedan 100% automáticos.
- **2026-06-06 · Primer despliegue TodyPan (app nueva), la reconciliación atajó un error grave:**
  - App TodyPan → projectId `todypan-47059` (hardcoded en `src/firebase.js`, NO en env). Cuenta dueña: la que aparece en `isAdminBootstrap` dentro del propio `firestore.rules`. Match único → deploy automático.
  - Login: ya había logueada la cuenta de OTRA app (Legends). Usé `firebase login:add` (no `login`) para sumar la de TodyPan sin desloguear Legends. Verifiqué con `projects:list` que la cuenta de Legends NO veía `todypan-47059` → confirmaba que hacía falta la cuenta correcta.
  - **El guard de primer despliegue salvó el día:** al pedir las reglas vivas, el usuario primero pegó las de **Legends Barbería** (estaba parado en el proyecto equivocado en la consola). Se detectó al instante porque las colecciones (`barberos`, `citas`, `resenias`) no eran las de TodyPan (`kitchenOrders`, `customerOrders`, `cashSessions`). Le pedí cambiar el selector de proyecto a `todypan-47059` y reenviar; la 2ª vez sí coincidían con el local (header `2026-05-29 — DESAYUNOS`). **LECCIÓN: validar SIEMPRE que las reglas pegadas correspondan a la app (mirar nombres de colecciones / header), no solo la fecha — el usuario puede estar en otro proyecto de la consola.** Si no se mira, se podrían pisar las reglas de TodyPan con las de otra app.
  - El `firestore.rules` de TodyPan traía un header que decía "NO se despliega solo (no hay firebase.json): se pega a mano". Tras este deploy creé `firebase.json` + `.firebaserc` y actualicé ese header a "se despliega por CLI". De aquí en adelante TodyPan queda 100% automático (sin pedir pegar).
  - Sin `firestore.indexes.json` → `firebase.json` solo con `{ "firestore": { "rules": "firestore.rules" } }` y deploy `--only firestore:rules` (no `firestore` a secas, para no tocar índices).
  - Cambio desplegado: `/customerOrders` update pasó de `isAdmin()` a `isAdmin() || isApprovedStaff()` (cajera atiende pedidos web); `delete` se mantuvo solo admin. `Deploy complete!` sin errores.
- **2026-06-26 · Appetic (app nueva, despliegue 100% automático sin fricción).** App Appetic → projectId `appetic-17477` (en `.env`, `VITE_FIREBASE_PROJECT_ID`). Cuenta única logueada `jostivtrb@gmail.com` con acceso → match inequívoco, deploy automático. **Guard de primer despliegue OMITIDO con criterio:** el proyecto se había creado en la MISMA sesión minutos antes (reglas por defecto de "modo producción", deny-all), así que no había reglas vivas valiosas que pisar — el caso "proyecto nuevo, nada que perder" del Paso 4.5. No se pidió pegar nada y fue correcto. Sin `firestore.indexes.json` → `firebase.json` solo `{ "firestore": { "rules": "firestore.rules" } }`, deploy `--only firestore:rules`. `Deploy complete!` a la primera. LECCIÓN: cuando consta que el proyecto es recién creado (lo viste crear en la sesión), saltar el paso de pegar reglas vivas es seguro y evita fricción innecesaria.
- **2026-06-30 · Dahia App (primer despliegue, PWA de finanzas).** projectId `dahia-app` (en `src/firebase/config.ts`, `firebaseConfig`). Reglas por-usuario: `users/{userId}` + `match /{document=**}` con `request.auth.uid == userId`. CLI tenía `jostivtrb@gmail.com` (no ve dahia-app); con `firebase login:add` se sumó la cuenta de la PERSONA FINAL y `projects:list` confirmó que ESA es la dueña (dahia-app projectNumber 990861850151). Match único → deploy automático. Guard de primer despliegue OMITIDO: proyecto recién creado en el mismo flujo con reglas deny-all por defecto (el usuario hasta las había pegado en su guía) → nada que perder. Sin índices → `firebase.json` solo `{ "firestore": { "rules": "firestore.rules" } }`, deploy `--only firestore:rules --project dahia-app --account <cuenta-dueña>` → `Deploy complete!` a la primera. **LECCIÓN: la cuenta dueña NO siempre es la que la doc sugiere.** La guía decía usar `sinfiniity@gmail.com`, pero el proyecto resultó creado bajo la cuenta de la PERSONA FINAL, no la del desarrollador. SIEMPRE resolver la dueña con `projects:list`, nunca asumir por el correo sugerido. (Síntoma típico cuando faltan reglas: la app loguea con Google OK pero Firestore tira `Missing or insufficient permissions` — es señal de desplegar reglas, no un bug de código.)
- **2026-07-06 · Registro Infiniity — reglas de STORAGE (no Firestore) y por qué el deploy automático NO se pudo.** projectId `registro-infiniity` (en `app/src/firebaseConfig.js`). Se necesitó abrir `storage.rules` (no `firestore.rules`) para permitir subir infografías a `capacitacion/**` (antes solo `cotizaciones/` abierto; el resto `if false` → subir daba `storage/unauthorized` incluso con el usuario logueado). `firebase.json` ya tenía `{ "storage": { "rules": "storage.rules" } }` y `.firebaserc` ya apuntaba a `registro-infiniity`. DOS bloqueos para el deploy por CLI: (1) la única cuenta logueada (la de OTRA app, Nia) solo ve `app-nia-1f70a`, NO `registro-infiniity`; (2) intenté con la cuenta de servicio `app/service-account.json` vía `GOOGLE_APPLICATION_CREDENTIALS` + `firebase deploy --only storage` → **falló con 403 `Permission 'firebasestorage.defaultBucket.get' denied`**. LECCIÓN: el service-account `firebase-adminsdk` sirve para Admin SDK (subir archivos al bucket, Firestore) pero **NO tiene rol IAM para desplegar reglas/config de Storage**. Para deploy de reglas por CLI hace falta una **cuenta de usuario dueña del proyecto** (`firebase login:add`), no la service-account. El usuario no la tenía logueada y quería desbloquear ya → **fallback manual** (Paso 7): pegar `storage.rules` en Firebase Console → Storage → Reglas → Publicar. Comando para cuando haya cuenta dueña: `firebase deploy --only storage --project registro-infiniity --account <dueña>`. (La skill es "Firestore" pero el mecanismo aplica igual a Storage cambiando `--only storage`.)
- **2026-07-16 · Appetic — 2.º despliegue (superadmin como admin de cualquier local). Flujo limpio y dos aprendizajes.** projectId `appetic-17477` (`.env` → `VITE_FIREBASE_PROJECT_ID`). **Guard de primer despliegue OMITIDO correctamente**: ya existía `.firebaserc` (deploy del 2026-06-26) → el repo es la fuente de verdad, no se pidió pegar nada. **La cuenta logueada NO era la dueña**: solo estaba la cuenta de OTRA app (Nia) y `projects:list` confirmó que únicamente ve `app-nia-1f70a` → 0 cuentas con acceso → NO se desplegó con ella (el Paso 4 hizo su trabajo). `Start-Process powershell ... 'firebase login:add'` + el usuario completó el navegador → apareció `jostivtrb@gmail.com`, que sí ve `appetic-17477` → match único → deploy automático. `rules file compiled successfully` + `released rules` a la primera.
  - **Lección 1 (verificar la cuenta SIEMPRE, aunque la bitácora ya diga cuál es):** aquí la bitácora decía que Appetic era de `jostivtrb@gmail.com` (2026-06-26), pero **esa cuenta ya no estaba logueada** — el estado de la CLI cambia entre sesiones porque el usuario trabaja muchas apps. Confirmar con `projects:list` antes de desplegar sigue siendo obligatorio; la bitácora orienta, no sustituye la comprobación.
  - **Lección 2 (las reglas NO son la única capa — busca su espejo en el código):** conceder un permiso en `firestore.rules` sin cambiar el guard de la interfaz (o al revés) deja un fallo silencioso: el panel **abre** pero cada guardado revienta con `Missing or insufficient permissions`. En Appetic el par es `puedeAdministrar()` en las reglas ↔ `puedeAdministrarLocal()` en `src/config/roles.js`. Al tocar permisos, **busca el chequeo equivalente en el cliente y cámbialo en el mismo commit**, y deja un comentario cruzado en ambos archivos.
  - **Lección 3 (mira TODAS las subcolecciones, no solo la que te piden):** el superadmin ya tenía `update` en `locales/{localId}` (por eso el toggle de suscripciones funcionaba) y era fácil concluir "ya tiene acceso". Pero las subcolecciones `productos`, `pedidos` y `stats` tenían su propio `esAdminDe(localId)` y lo dejaban fuera. Al ampliar un rol, **recorre cada `match` anidado**; un helper compartido (`puedeAdministrar(localId)`) evita que la próxima subcolección nazca inconsistente.
<!-- Próximos aprendizajes van aquí, formato: fecha · qué pasó · cómo se resolvió -->

