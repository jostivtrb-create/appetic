# 🍔 Jasbury — guía del local

Local nuevo dentro de **Appetic**, con el mismo motor que los demás (menú, carrito,
checkout que manda el pedido al WhatsApp, historial y panel de administrador propio).

## 🔗 Enlaces
- **Menú (clientes):** `/jasbury`
- **Vista previa (sin base de datos):** `/jasbury?preview=1`
- **Panel del dueño:** `/jasbury/admin`

## 🎨 Identidad
- Tema sacado del logo del cliente: **rojo puro `#FF3131`** + **amarillo dorado** de acento,
  sobre un "mundo" crema cálido — vibrante y de comida rápida, distinto a los otros locales.
- **Logo:** el que enviaste (badge rojo con el nombre en letra script), en
  `public/locales/jasbury/logo.webp` (+ `icono.webp` para el cuadrito de la lista).
- **Banner + fotos de platos:** generadas con IA (`/Generar_Imagen`, gratis), estilo comida
  rápida sobre madera cálida y coherente en todas, en `public/locales/jasbury/`.

## 📋 El menú
Carta completa tal cual la enviaste, en **9 categorías** (Hamburguesas, Perros Calientes,
Salchipapas, Especiales, Burritos, Pollo Broaster, Entradas, Adiciones, Bebidas) — **55 productos**.
Como es un menú largo, el motor muestra automáticamente el **buscador**.

Modelado para que **las opciones funcionen** (verificado en navegador):
- **Hamburguesas (11)** → precio base + **"con arepa o con pan"** (obligatorio) + **combo opcional**
  (papa a la francesa + gaseosa 250 ml, +$6.000). Probado: el precio suma y exige el acompañante.
- **Pincho de Pollo Apanado** → variantes: solo ($6.500) / con papa a la francesa ($10.000).
- **Jugo Natural** → variantes: en agua ($7.000) / en leche ($8.500).
- **Gaseosa** → variantes de tamaño: 250 ml / 350 ml / 400 ml / 1.5 L.
- **Burrito Sencillo** → elige proteína (carne / pollo).
- Perros, salchipapas, especiales, broaster, entradas, adiciones y demás bebidas → precio fijo.

## 🔧 Para dejarlo funcionando de verdad (Firebase)
El código y las imágenes ya están listos. Faltan **dos pasos que solo se pueden hacer donde
tienes las llaves** (no viajan en el repo):

1. **Desplegar** (sube código + imágenes a producción):
   con la skill `/despliegue_en_vercel` (o tu flujo normal a la rama de producción).
   Comprueba que las fotos ya dan 200:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" https://appetic.vercel.app/locales/jasbury/logo.webp   # → 200
   ```
2. **Sembrar en Firestore** (crea el local; sin esto NO aparece en tu panel ni recibe pedidos):
   ```bash
   node scripts/seed-jasbury.mjs
   ```
   Necesita la llave `scripts/serviceAccount.json` (la misma con la que se sembraron los otros
   locales). Volver a correrlo **no duplica** (hace merge) y **no pisa** `ubicacion`, `whatsapp`
   ni `horario` que el dueño configure.

Después abre `/jasbury` (sin `?preview=1`) → debe cargar el menú real desde Firestore.

## 📲 WhatsApp de pedidos
Sembrado con el **número por defecto `320 843 5143`** (para que el checkout funcione desde ya).
⚠️ Los pedidos llegan a **ese** número, **no** al de Jasbury, hasta que el dueño ponga el suyo en
`/jasbury/admin` → ⚙️ Configuración → Datos del negocio → WhatsApp. Ese mismo número es el de
**domicilios** del afiche (pestaña 📣 Difundir): se actualiza solo.

> Por eso el local nace con `suscripcion.activa: false`: se ve por link directo y en `/superadmin`,
> pero **no** en el buscador público. Enciéndelo con el toggle cuando Jasbury ya tenga su WhatsApp real.

## 🔐 Administrador
- **Ahora mismo el admin es `sinfiniity@gmail.com`** (tu cuenta, para que pruebes el panel) —
  **no** la del cliente.
- **Antes de entregar al dueño**, cámbialo por **su** correo de Google real: desde
  `/superadmin` (campo 👤 del local) o editando `ADMIN_EMAIL` en `src/dev/jasbury.js` y
  re-corriendo el seed. Con ese correo el dueño entra a su panel a editar menú, precios,
  agotados y horario.

## 📣 Difundir (ya viene en su panel)
En `/jasbury/admin` → pestaña **📣 Difundir** el dueño tiene, automático y con su identidad
(colores + logo + WhatsApp): su **QR** para imprimir, el **afiche de domicilios** listo para PDF,
el **link** para copiar y un **mensaje de bienvenida** para reenviar por WhatsApp.

## 🗂️ Archivos de este local
- `src/dev/jasbury.js` — datos del menú (fuente única).
- `src/preview.js` — registro de la vista previa.
- `scripts/seed-jasbury.mjs` — alta en Firestore.
- `public/locales/jasbury/` — logo, icono, banner y fotos de platos.
