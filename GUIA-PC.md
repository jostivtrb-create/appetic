# 🖥️ Guía del PC — lo pendiente para dejar TODO funcionando

> Trabajo hecho desde la nube (sesión Claude). El código ya está **desplegado en Vercel**
> (rama `main`), pero hay pasos que **solo se pueden hacer en este PC** porque aquí viven
> las llaves (`scripts/serviceAccount.json`, Firebase CLI, gcloud). Síguelos en orden.

---

## 0) Traer lo último

```bash
git checkout main
git pull origin main
```

## 1) 🔥 Desplegar las REGLAS de Firestore (CRÍTICO — sin esto nada nuevo lee/escribe)

Cambios en `firestore.rules`: rol **domiciliario global** (`config/domiciliarios`), lectura de
pedidos por `collectionGroup`, y la colección `config`.

- Con la skill: **`/Actualizar_Reglas_Firebase`**
- O a mano: `firebase deploy --only firestore:rules`

## 2) 🌱 Re-sembrar los locales (etiquetas + prioridad + destacadosHome)

El nuevo INICIO necesita campos que los locales sembrados aún no tienen. Re-correr **no
duplica** ni pisa lo que el dueño configuró (ubicación/whatsapp/horario):

```bash
node scripts/seed-perros-criollos.mjs
node scripts/seed-sabor-del-dia.mjs
node scripts/seed-pilotos.mjs
node scripts/seed-juance.mjs
node scripts/seed-jasbury.mjs
node scripts/seed-fruti-tentacion.mjs   # ← primera vez: CREA el local Fruti Tentación
node scripts/seed-la-comarca.mjs        # ← si aún no se había sembrado, también lo crea
```

Qué escriben ahora los seeds (además de lo de siempre):
- `etiquetas` → chips de categorías del inicio
- `prioridad` → ⭐ Recomendado (solo Perros Criiollos = 10)
- `destacadosHome` → los platos de "Para antojarte" (fuertes CON foto)
- `creadoEn` → solo al crear (activa el badge 🆕 Nuevo por 14 días)

## 3) 🗄️ Índice de Firestore para el buscador del domiciliario (un clic)

La búsqueda por código usa una consulta **collectionGroup** sobre `pedidos`. La **primera
vez**, Firestore mostrará en la consola del navegador un error con un **link "create
index"** → ábrelo y dale crear (índice del campo `codigo` en alcance *collection group*).
Tarda 1-2 min en construirse.

> Cómo forzarlo: abre `/domiciliario`, entra con un correo de la lista y busca cualquier
> código. Si sale el error, el link está en la consola (F12) — o Firestore Console →
> Indexes.

## 4) ⏲️ Auto-borrado de pedidos a los 2 días (TTL — una sola vez)

Los pedidos ya se guardan con campo `ttl`. Activa la política para que Firestore los borre:

```bash
gcloud firestore fields ttls update ttl --collection-group=pedidos --enable-ttl
```
(o en la consola: Firestore → *TTL* → política sobre el grupo `pedidos`, campo `ttl`).

## 5) 👑 Configurar en /superadmin

- **🛵 Domiciliarios** (bloque de arriba): agrega el/los correos Google de los repartidores.
  Su panel es **`/domiciliario`** (global, solo buscador). El flujo: el local confirma el
  pedido y se lo REENVÍA por WhatsApp al domiciliario a cargo → él copia el código, lo
  escribe en la app y ve el pedido con el precio real. (Sin listas ni avisos: cada
  domiciliario solo ve lo que le reenviaron.)
- **🗂️ Etiquetas** de cada local: ya vienen del seed; revisa/ajusta con el editor (chips).
- **⭐ Prioridad**: Perros Criiollos ya queda en 10 (Recomendado). Cambiable ahí mismo.
- **Suscripciones**: enciende Fruti Tentación / La Comarca cuando tengan WhatsApp real.

## 6) 📸 Fotos que faltan (para que "Para antojarte" luzca)

- **Perros Criiollos** ⚠️: su único "Nuestro fuerte" NO tiene foto → hoy NO sale en la
  franja de antojos. Súbela desde su panel (editar producto → ✨ Crear con IA o 📱) y listo
  (el panel actualiza `destacadosHome` solo).
- **Fruti Tentación / La Comarca**: los dueños generan las fotos con los prompts de
  `public/locales/<slug>/PROMPTS.md` (Gemini) y las suben desde su panel.

## 7) ✅ Prueba end-to-end (5 min)

1. Abre `/` → debe verse: chips de categorías, "Para antojarte" con platos, fila de
   locales (scroll infinito) y el listado con ⭐ Recomendado arriba.
   *(Si algo se ve vacío, revisa el paso 2. Vista sin datos: `/?preview=1`.)*
2. Toca un plato de "Para antojarte" → debe abrir el menú del local con el **modal del
   producto listo para Agregar**.
3. Haz un **pedido de prueba a domicilio** → revisa que el WhatsApp llegue con **código**
   y con el **link "Responder al cliente"**.
4. Entra a `/domiciliario` con un correo de la lista → escribe el código → debe mostrar
   el pedido con el precio real, el mapa y los botones de WhatsApp/llamar.
5. En el panel de un dueño, marca/desmarca un "Nuestro fuerte" con foto → el inicio debe
   reflejarlo (recarga).

## Recordatorios

- **Checkout**: ahora exige WhatsApp válido (celular 3XXXXXXXXX) + check de confirmación.
- Defaults mientras entregan datos reales: admin `sinfiniity@gmail.com` · WhatsApp
  `573208435143` (los pedidos llegan ahí hasta poner el real).
- Los pedidos guardados **no se editan ni borran a mano**: expiran solos a los 2 días (TTL).
- Este archivo se puede borrar cuando todo esté hecho. ✂️
