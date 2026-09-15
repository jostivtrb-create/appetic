# 🥖 La Gran Esquina — el local que trae su menú de otra app

Panadería y sazón, en Pereira. **Este local no se parece a ningún otro de Appetic**, y
conviene saber por qué antes de tocarle nada.

---

## Lo que lo hace distinto

La Gran Esquina tiene **su propia app**: caja, cocina, inventario, cierre de turno. La
cocinera publica el almuerzo de cada día desde allá, cada mañana.

Appetic **no copia** ese menú: lo **lee en vivo**. Si ella cambia la proteína a las 11, el
cliente lo ve a las 11.

> **Por eso el panel de Appetic no tiene productos para este local, y está bien.**
> No es que falte sembrarlos: es que su menú vive en otra parte. La pestaña 🍽️ Menú
> aparecerá vacía y no hay que "arreglarla".

Las piezas:

| Archivo | Qué hace |
|---|---|
| `src/dev/laGranEsquina.js` | La identidad: nombre, colores, horario, domicilios. `LGE_PRODUCTOS` está **vacío a propósito**. |
| `src/config/firebaseLaGranEsquina.js` | La segunda conexión de Firebase, **de solo lectura**, a la base del negocio. |
| `src/services/menuLaGranEsquina.js` | El traductor: convierte el menú del día en platos de Appetic. |
| `src/services/menuExterno.js` | El desvío: los locales con `menuExterno` no leen sus productos de aquí. |
| `src/services/pedidoLaGranEsquina.js` | El viaje de vuelta: deja el pedido en la app del negocio. |
| `scripts/seed-la-gran-esquina.mjs` | El alta en Firestore. **No siembra productos**, solo la identidad. |
| `scripts/update-la-gran-esquina-categorias.mjs` | El `update()` puntual que pone "Desayuno" de primera categoría sin pisar nada más. |

---

## Cómo funciona un pedido, de punta a punta

1. El cliente abre `appetic.vercel.app/la-gran-esquina` y ve **el almuerzo de hoy** con las
   proteínas que hay hoy.
2. Arma su plato y paga… **no.** Appetic *nunca* cobra: el método de pago es solo un aviso.
3. Al enviar, pasan dos cosas a la vez:
   - Se abre su **WhatsApp** con el pedido escrito, como en cualquier otro local.
   - El pedido queda **escrito en la app del negocio**, listo para la cocina.
4. En el WhatsApp que le llega al local hay un link: **"🍳 Mandar a la cocina"**. Un toque y
   el almuerzo entra a la cocina enganchado al turno de caja abierto. **Nadie teclea nada.**
5. La caja cobra como con cualquier cliente, y el cierre del turno cuadra igual que siempre.

---

## Cosas que ya están resueltas (y que conviene no "arreglar")

- **El almuerzo tiene hora; los combos y el desayuno no.** El almuerzo se pide de 11:00 a
  15:30 y fuera de esa franja dice *"no es hora de pedir"* (se cambia en `FRANJAS`, en
  `src/services/menuLaGranEsquina.js`). Los combos están todo el día a propósito: un combo
  puede ser gaseosa y chocorramo, y Andrés lo prende o lo apaga con el interruptor de cada
  combo en su inventario. El desayuno lo controla él con *"hoy no hay desayuno"* desde su
  panel. Si algún día quiere que por internet solo se pida hasta cierta hora, es una
  franja más en `FRANJAS` — pendiente de que lo diga.
- **Lo que se acabó no se ofrece.** Si la cocinera dice "solo 5 pechugas" y se venden,
  desaparecen del menú solas. Si se acaba toda la proteína, el almuerzo entero deja de
  venderse.
- **El desayuno se arma por piezas, y los combos caen solos.** El "Desayuno" de allá es un
  combo *armable*: caldo, huevos, arroz, bebida, todos opcionales. Quien quiere un caldito
  pide el caldito. Sus precios NO están en `/combos` (viven en `/products`, que pide sesión):
  la app del local publica una **carta pública** en `negocio/publico.carta.armables[comboId]`
  con cada opción, su precio y los *precios de combo*. Aquí se traduce a un plato
  `modo: 'pasos'` con `ofertas` (ver `utils/price.js`): si lo que armó coincide con un
  combo —"caldo, huevos, arroz y bebida"— el precio del combo cae solo. Lo que hay HOY sale
  de `dailyMenu/{hoy}.armables[comboId]`, igual que lo ve la mesera. **Si no hay carta
  publicada, el desayuno no se ofrece**: la caja del local la escribe sola en cuanto
  alguien abre su app. El precio base del plato es el recargo de llevar.
- **Los combos cerrados son platos cerrados**, no descuentos: salen sin `gruposOpciones`.
- **El combo viaja SIN costos, y es correcto.** Appetic pide sin cuenta, y las reglas de La
  Gran Esquina no le dejan leer `/products` —ahí están los costos y la marca de "va a
  cocina"—. Del cerrado sale solo el `comboId`; del armable, además `comboSeleccion` (qué
  escogió en cada grupo, con los ids de allá), `comboItems` con solo nombres y el
  `comboDeal` que vio el cliente. La caja, que sí tiene sesión y el inventario entero, lo
  congela y **cobra con sus precios de hoy** al confirmar. **No intentes "arreglarlo"
  abriendo `/products` a lectura pública: eso filtraría los costos del negocio.**
- **Un combo pedido por internet siempre genera comanda**, aunque no lleve nada de fogón.
  Esa cola es también donde el local marca "listo" y "entregado"; sin comanda, el pedido no
  sale en ninguna pantalla y el cliente llega a reclamar algo que nadie apartó.
- **Sin menú publicado no queda la pantalla en blanco**: dice *"todavía no publicamos"* o
  *"por hoy se acabó"*, que para el cliente son cosas distintas.

---

## ⚠️ Lo que falta

Ojo con a quién se le pide: **Andrés no entra al panel de Appetic**, lo maneja Zeven. Lo que
Andrés sí maneja es su propia app —inventario, combos, menú del día—, y de ahí sale casi
todo lo que el cliente ve aquí. El panel es
**`appetic.vercel.app/la-gran-esquina/admin`**.

0. **🍳 La categoría "Desayuno" en el doc del local** — el traductor la manda con
   `categoriaNombre`, así que sale igual aunque no esté en `categorias`; pero sale al final.
   Para que sea la primera pestaña en la mañana, correr desde el PC que tenga
   `scripts/serviceAccount.json`:
   `node scripts/update-la-gran-esquina-categorias.mjs` (muestra el plan) y luego con
   `--apply` (escribe). Solo toca `categorias` y conserva las que ya haya. **NO el seed**:
   pisaría `suscripcion.activa`.
1. **📍 La ubicación** — ⚙️ Configuración → "Usar mi ubicación actual", **parado en el
   local**. Sin esto el domicilio queda apagado (la app lo dice y solo deja recoger). Es la
   única de esta lista que hay que hacer *desde el local*.
2. **🕐 La hora del almuerzo** — 11:00 a 15:30 está puesto a ojo. Si en el local va hasta las
   4, hay que ajustarlo. Los combos no tienen hora, no hay nada que tocarles.
3. **📸 El banner** — ⚙️ Configuración → Banner. **Para este local importa más que para los
   demás**: como no tiene productos guardados en Appetic, el inicio no puede mostrar fotos
   de sus platos, así que la tarjeta del local se apoya en el banner. El prompt para
   generarlo está en `public/locales/la-gran-esquina/PROMPTS.md`.

> **Nota:** `suscripcion.activa` ya está en **`true`** en Firestore (el local sale en el
> buscador). En `src/dev/laGranEsquina.js` sigue en `false`, que era el valor del alta.
> **Por eso NO se debe volver a correr el seed sin más:** pisaría el doc vivo y apagaría el
> local. Para un cambio puntual se usa `update()` sobre el campo, como dice el propio
> `scripts/_seed-guard.mjs`.

---

## 📣 La pestaña Difundir

En su panel, Andrés tiene **📣 Difundir** sin que nadie la configure:

- Su **código QR** para imprimir y pegar en el mostrador.
- Un **afiche de domicilios** listo para PDF, con su número y sus colores. Si cambia el
  WhatsApp en Configuración, el afiche se actualiza solo.
- El **link** del menú para copiar y pegar.
- Un **mensaje de bienvenida** para reenviar por WhatsApp a sus clientes.

---

## Volver a sembrarlo

```bash
node scripts/seed-la-gran-esquina.mjs
```

Solo escribe la **identidad**. Respeta lo que Andrés haya puesto en el panel (ubicación,
WhatsApp y horario) y **pisa** `suscripcion.activa` y `admins` con lo que diga
`src/dev/laGranEsquina.js` — ojo con eso si ya lo habías encendido.
