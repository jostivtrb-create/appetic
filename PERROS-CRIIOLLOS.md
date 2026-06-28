# 🌭 Perros Criiollos — guía del local

Todo lo que necesitas saber para probarlo ahora y dejarlo funcionando de verdad.

---

## ✅ Qué ya está hecho

- El **código del local** está en `main` y desplegado (Vercel lo publica solo).
- **Menú listo:**
  - **Arma Tu Perro · $7.000** — el cliente elige **todos los toppings y salsas que quiera, gratis** (el precio siempre es $7.000).
  - **Empanada · $4.000** — Carne o Pollo.
  - **Bebidas · $3.000** — Coca-Cola personal, Coca-Cola Zero, Jugo del Valle, Agua Manantial.
- Sin pestañas de categorías (el menú es un solo scroll) y **abierto 24 h** para que puedas
  probarlo a cualquier hora. El horario real lo pones luego desde el panel.
- **Estética propia** basada en el logo (rojo tomate + dorado maíz + verde campo sobre crema).
- **Correo administrador:** `sinfiniity@gmail.com` (con ese correo se entra al panel a editar).

---

## 👀 Probarlo YA en el celular (vista previa)

No necesitas hacer nada. Abre en tu celular:

```
https://TU-DOMINIO/perros-criollos?preview=1
```

> Reemplaza `TU-DOMINIO` por el mismo dominio donde ves *Burger Demo*.
> Lo importante es el `?preview=1` al final.

Esto carga el menú **desde el código** (sin base de datos), solo para mirar el diseño.
En este modo **no se reciben pedidos reales** y no aparece en el buscador del barrio.

---

## 🚀 Dejarlo funcionando DE VERDAD (un solo paso, en un computador)

El menú real vive en **Firebase** (la base de datos). Hay que "sembrarlo" **una sola vez**.
Esto **no se puede hacer desde el chat** porque requiere la llave secreta de Firebase
(`scripts/serviceAccount.json`), que por seguridad no se guarda en el proyecto.

Es el mismo proceso que usaste para *Burger Demo*:

```bash
# 1. Traer lo último
git pull origin main

# 2. Tener la llave de Firebase en:  scripts/serviceAccount.json
#    (la misma que usaste para Burger Demo)

# 3. Instalar dependencias (si hace falta)
npm install

# 4. Crear el local en Firebase
node scripts/seed-perros-criollos.mjs
```

Si sale esto, quedó listo:

```
✓ Local creado: locales/perros-criollos (Perros Criiollos)
✓ 6 productos cargados
🔗 Link del local: /perros-criollos
```

A partir de ahí, el link **sin** `?preview` ya muestra el local real:
`https://TU-DOMINIO/perros-criollos`

---

## 📲 Configurar el WhatsApp (después de sembrarlo)

Los pedidos llegan al WhatsApp del local, y **ese número lo pones tú desde el panel**:

1. Entra a `https://TU-DOMINIO/perros-criollos/admin`
2. Inicia sesión con Google usando **`sinfiniity@gmail.com`**
3. Ve a **⚙️ Configuración → Datos del negocio**
4. Escribe el **WhatsApp para pedidos** y dale **Guardar**.

⚠️ Hasta que pongas el WhatsApp, los clientes ven el menú pero el botón de pedido
no tiene a dónde enviar.

En esa misma pantalla puedes ajustar **horario, domicilio y zonas de entrega**.
Para cambiar **precios, productos o fotos**, usa la pestaña **🍔 Menú** del panel.

---

## 🔁 ¿Cómo cambiar el menú más adelante?

- **Cambios pequeños** (precios, agotados, fotos, horario, WhatsApp): desde el **panel**
  (`/perros-criollos/admin`), sin tocar código.
- **Cambios de fondo** (nuevos toppings/salsas en el código base, estética): se editan en
  `src/dev/perrosCriollos.js` y se vuelve a publicar. Avísame y lo hago.

---

## 🗂️ Dónde está cada cosa (referencia técnica)

| Cosa | Archivo |
|---|---|
| Datos del menú (fuente única) | `src/dev/perrosCriollos.js` |
| Script para crear el local | `scripts/seed-perros-criollos.mjs` |
| Logo | `public/locales/perros-criollos/logo.png` |
| Modo vista previa | `src/preview.js` |

---

*Cualquier duda, me dices y seguimos. 🌭*
