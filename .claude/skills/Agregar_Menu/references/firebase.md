# 🔥 Firebase — dejar el local funcionando DE VERDAD (el cierre del flujo)

Hasta aquí el local **solo existe en el código**: se ve con `?preview=1`, pero **no está en la
base de datos**. Por eso NO aparece en `/superadmin`, ni en el buscador, ni recibe pedidos: esas
pantallas leen de **Firestore**. Para que exista de verdad hay que **sembrarlo una vez**.

> Síntoma clásico: *"ya desplegué pero no lo veo en mi panel"* → **falta el seed**. Es esto.

---

## 0) ⚠️ ¿Estás en la NUBE o en el PC?  (léelo ANTES de prometer nada)

La llave de Firebase (`scripts/serviceAccount.json`) está en **`.gitignore`** — da acceso total al
proyecto, así que **NO viaja en el repo**. Consecuencia directa:

- **En el PC del usuario** (Claude Code local) → la llave está ahí → **puedes sembrar tú**.
- **Desde la nube / un worktree limpio / CI** → la llave **NO existe** → **NO puedes sembrar**.
  No la pidas por chat (es un secreto: pegarla en una conversación la quema y habría que rotarla).
  Deja **todo lo demás listo** (código + imágenes + deploy + el `scripts/seed-<slug>.mjs`) y cierra
  diciéndole al usuario exactamente esto:

  > *"Falta un paso que solo se puede hacer desde tu PC: abre la carpeta del proyecto y corre
  > `node scripts/seed-<slug>.mjs`. Eso crea el local en Firebase y ahí sí aparece en tu panel."*

**Comprueba siempre antes de intentarlo:**
```bash
[ -f scripts/serviceAccount.json ] && echo "hay llave: puedo sembrar" || echo "SIN llave: que lo corra el usuario"
node -e "require.resolve('firebase-admin')" 2>/dev/null && echo "firebase-admin ok" || echo "falta: npm i firebase-admin"
```

---

## 1) La llave: `scripts/serviceAccount.json`
Archivo **secreto** con acceso de administrador al Firebase del proyecto (**`appetic-17477`**).
Nunca se sube a git ni se pega en un chat.

- **Si ya existe** → adelante (los locales anteriores se sembraron con ella).
- **Si NO existe**, el dueño de la cuenta la genera **una sola vez**:
  1. Consola de Firebase → proyecto **appetic-17477**.
  2. ⚙️ Configuración del proyecto → **Cuentas de servicio**.
  3. **Generar nueva clave privada** → descarga un `.json`.
  4. Renómbralo a **`serviceAccount.json`** y déjalo en la carpeta **`scripts/`**.

Verifica que apunta al proyecto correcto (no a otra app del usuario):
```bash
node -e "console.log(require('./scripts/serviceAccount.json').project_id)"   # → appetic-17477
```

---

## 2) Orden correcto: DESPLIEGA primero, SIEMBRA después
Las fotos se sirven desde Vercel (carpeta `public/`), no desde Firebase. Así que:

1. **Primero** deploy (`/despliegue_en_vercel`) → sube código e imágenes.
2. **Comprueba que las imágenes ya están vivas** antes de sembrar:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" https://appetic.vercel.app/locales/<slug>/logo.webp   # → 200
   ```
3. **Después** el seed.

Si siembras antes, el local aparece con **todas las fotos rotas (404)** hasta que Vercel publique.

---

## 3) 🚩 ANTES de sembrar: `suscripcion.activa` y el WhatsApp

`suscripcion.activa: true` hace que el local **salga en el buscador del inicio para cualquier
cliente**. Y el local se siembra con `whatsapp: ''`.

**Sembrar `activa:true` sin WhatsApp = publicar un local donde el cliente arma el pedido y el
pedido no llega a ninguna parte.** No lo hagas.

- **Sin WhatsApp todavía** → siembra con `suscripcion: { activa: false, plan: 'piloto' }`. El local
  se ve en `/superadmin` y en su link directo, pero **no** en el buscador público. El usuario lo
  enciende con el toggle cuando esté listo.
- **Con WhatsApp y visto bueno del dueño** → `activa: true`.

---

## 4) Sembrar
```bash
node scripts/seed-<slug>.mjs
```
Salida esperada:
```
✓ Local creado: locales/<slug> (<Nombre>)
✓ N productos cargados
🔗 Link del local: /<slug>
```

### Qué pasa al RE-correrlo (importante)
No duplica: hace `merge`. Pero **solo protege tres campos** del dueño —
`CAMPOS_DEL_DUENO = ['ubicacion', 'whatsapp', 'horario']`. Todo lo demás **se pisa con lo que diga
`src/dev/<file>.js`**. En particular:

- ⚠️ **`suscripcion.activa` SE PISA.** Si el dueño encendió el local en el panel y luego re-corres
  el seed con `activa:false` en el archivo, **lo apagas sin querer**. Antes de re-sembrar un local
  que ya está vivo, pon en el archivo el valor que debe quedar.
- ⚠️ **`admins` SE PISA.** Es justo lo que quieres cuando cambias el correo del dueño (ver §6).
- Los **productos** se actualizan por id. Un producto que borres del archivo **NO se borra** de
  Firestore (queda huérfano): hay que quitarlo desde el panel o a mano.

---

## 5) Reglas de Firestore — NO hay que tocarlas ✅
`firestore.rules` es **genérico para todos los locales** (`locales/{localId}`):
- Menú (local + productos): **lectura pública** (clientes sin login).
- Escritura del menú/config: **solo el admin** del local (su correo en `local.admins`).
- Pedidos: **cualquiera crea** (sin login); **solo el admin lee**.
- Crear/borrar locales: solo por seed/consola.

El local nuevo entra por el mismo patrón (con `admins: [ADMIN_EMAIL]`), así que **queda cubierto
sin cambios**. No corras `firebase deploy` de reglas por esto.

---

## 6) El correo del ADMIN (el dueño)
`ADMIN_EMAIL` en `src/dev/<file>.js` es **quien entra a `/<slug>/admin` con su Google**.

- Debe ser el **Gmail real del dueño**. `sinfiniity@gmail.com` es solo para demos/pruebas — con ese
  correo entra el usuario, **no el cliente**.
- **Para cambiarlo después:** edita `ADMIN_EMAIL` en el archivo de datos y **re-corre el seed**
  (`admins` se pisa, así que basta con eso). No hace falta tocar reglas ni la consola.

El **superadmin** de toda la app (control de suscripciones, `/superadmin`) es **`jostivtrb@gmail.com`**
(fijo en `src/config/roles.js`).

---

## 7) Verificar que quedó vivo — contra Firestore, no contra el mensaje del script
El `✓` del seed solo dice que la escritura no lanzó error. **Léelo de vuelta**:

```bash
node -e "
const { readFileSync } = require('fs')
const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
initializeApp({ credential: cert(JSON.parse(readFileSync('scripts/serviceAccount.json','utf8'))) })
const db = getFirestore()
;(async () => {
  const d = (await db.collection('locales').doc('<slug>').get()).data()
  console.log('nombre  :', d.nombre)
  console.log('admins  :', d.admins)
  console.log('whatsapp:', JSON.stringify(d.whatsapp))
  console.log('activa  :', d.suscripcion?.activa)
  const ps = await db.collection('locales').doc('<slug>').collection('productos').get()
  console.log('productos:', ps.size)
  process.exit(0)
})()"
```

Y en el navegador:
- **`/<slug>`** (sin `?preview=1`) → carga el menú real desde Firestore.
- **`/<slug>/admin`** → el dueño entra con el Google de `ADMIN_EMAIL`.
- **`/superadmin`** → el local aparece en la lista con su toggle.

---

## 8) WhatsApp (para que los pedidos tengan a dónde llegar) 📲
Se siembra con `whatsapp: ''`. Hasta ponerlo, el cliente arma el pedido pero **el botón no tiene
destino**. Dos formas:

- **Panel (lo normal):** `/<slug>/admin` → ⚙️ Configuración → Datos del negocio → WhatsApp → Guardar.
- **Directo** (si tienes la llave), con el número **con indicativo** (`57` + celular, sin `+` ni espacios):
  ```bash
  node -e "
  const { readFileSync } = require('fs')
  const { initializeApp, cert } = require('firebase-admin/app')
  const { getFirestore } = require('firebase-admin/firestore')
  initializeApp({ credential: cert(JSON.parse(readFileSync('scripts/serviceAccount.json','utf8'))) })
  getFirestore().collection('locales').doc('<slug>')
    .set({ whatsapp: '57XXXXXXXXXX' }, { merge: true })
    .then(() => { console.log('✓ WhatsApp guardado'); process.exit(0) })"
  ```
  Pide el número al usuario antes de grabarlo; **no lo inventes**.

> Recuérdale que ese número es también el de **domicilios** del afiche (pestaña 📣 Difundir): el
> afiche lo toma solo, no hay que escribirlo aparte.
