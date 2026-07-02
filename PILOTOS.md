# ✈️ Pilotos Burger House — guía del local

Local nuevo dentro de **Appetic**, con el mismo motor que los demás (menú, carrito,
checkout que manda el pedido al WhatsApp, historial y panel de administrador propio).

## 🔗 Enlaces
- **Menú (clientes):** `/pilotos`
- **Vista previa (sin base de datos):** `/pilotos?preview=1`
- **Panel del dueño:** `/pilotos/admin`

## 🎨 Identidad
- Tema aviación / "Top Gun": **rojo aeronáutico + cromo/acero + brasa de fuego**, sobre un
  "mundo" acero-cielo frío (distinto del crema de los otros locales).
- **Logo:** el que enviaste (mejorado a HD), en `public/locales/pilotos/logo.png`.
- **Banner + fotos de platos:** generadas con IA, estilo oscuro/brasa coherente, en
  `public/locales/pilotos/`.

## 📋 El menú
Carta completa tal cual la enviaste, organizada en **21 secciones** (Zona de Despegue,
Porciones, Hamburguesas, Perros, Papas Turbulentas, Mazorcadas, Salchipapas, Patacones,
Burritos & Dorilocos, Alitas, Costillas, Picadas, Sándwich, Especiales, Lasañas, Panzerottis,
Pizzas, Menú Infantil, Malteadas, Bebidas y Cervezas).

Modelado para que **las opciones funcionen**:
- **Hamburguesas** → precio base + "Hangar de adiciones" (elige varias) + combo opcional
  (papas + gaseosa / papas + jugo).
- **Pizzas** → un producto con **tamaño** (Junior/Personal/Mediana/Familiar) + **sabor** (16
  sabores). El precio lo fija el tamaño.
- **Alitas** → 6 / 12 / 24 unidades, cada una pide elegir 1 / 2 / 3 salsas.
- **Costillas, Pechugas, Limonadas, Malteadas, Gaseosas, Cervezas, Jugos** → variantes de
  tamaño/tipo con su precio.
- **Burritos y Sándwich** → elige proteína (carne/pollo).

## 🔧 Para dejarlo funcionando de verdad (Firebase)
El local ya está **desplegado** (código + imágenes). Falta **sembrarlo en Firestore** una vez:

```bash
node scripts/seed-pilotos.mjs
```
Necesita la llave `scripts/serviceAccount.json` (la misma con la que se sembraron los otros
locales). Volver a correrlo **no duplica** (hace merge) y **no pisa** lo que el dueño configure.

Después: abre `/pilotos` (sin `?preview=1`) → debe cargar el menú real.

## 📲 WhatsApp de pedidos
Pre-cargado con la línea de **domicilios** del menú (**321 422 6828**). El dueño lo puede
confirmar o cambiar desde `/pilotos/admin` → ⚙️ Configuración → Datos del negocio → WhatsApp.

## 🔐 Administrador
- **Ahora mismo el admin es `sinfiniity@gmail.com`** (para que puedas probar el panel).
- ⚠️ **Antes de entregar al dueño**, cámbialo por **su** correo de Google real en
  `src/dev/pilotos.js` (`ADMIN_EMAIL`) y vuelve a correr el seed. Con ese correo el dueño entra a
  su panel a editar menú, precios, agotados y horario.

## 🗂️ Archivos de este local
- `src/dev/pilotos.js` — datos del menú (fuente única).
- `src/preview.js` — registro de la vista previa.
- `scripts/seed-pilotos.mjs` — alta en Firestore.
- `public/locales/pilotos/` — logo, banner y fotos.
