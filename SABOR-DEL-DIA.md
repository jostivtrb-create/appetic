# 🍛 Sabor del Día — local de almuerzos (menú del día)

Local demo de **almuerzos caseros** integrado en Appetic igual que *Perros Criiollos*.
Lo especial: el **menú del día cambia a diario** y el dueño lo edita él mismo desde el panel.

---

## ✅ Qué ya está hecho

- **Código del local** en `src/dev/saborDelDia.js` (fuente única) + registrado en la
  vista previa (`src/preview.js`) y con su script de alta (`scripts/seed-sabor-del-dia.mjs`).
- **Carta lista:**
  - **⭐ Almuerzo del día · $15.000** — incluye sopa + seco + jugo. El cliente **elige
    proteína, principio y jugo** (grupos de "elige 1") y puede sumar adiciones.
  - **Ejecutivos y especiales:** Ejecutivo de la casa $19.000, Bandeja paisa $24.000, Mojarra $28.000.
  - **Sopas y caldos, Bebidas naturales, Postres, Adicionales.**
- **Estética propia** (tomate + mostaza + verde sobre crema), abierto 24 h para probar.
- **Correo administrador:** `sinfiniity@gmail.com`.

---

## 👀 Probarlo YA (vista previa, sin base de datos)

Abre en el celular o el navegador:

```
https://TU-DOMINIO/sabor-del-dia?preview=1
```

> Es el mismo `?preview=1` que usaste para *Perros Criiollos*. Carga el menú **desde el
> código**: sirve para revisar el diseño. En este modo no se reciben pedidos reales.

En local (DEV): `http://localhost:5173/sabor-del-dia?preview=1`

---

## 🍽️ Lo importante: cambiar el MENÚ DEL DÍA (lo hace el dueño, sin código)

Después de sembrarlo (abajo), el dueño entra a `/sabor-del-dia/admin` con su Google y va a
la pestaña **🍽️ Menú → Almuerzo del día → Editar**. Ahí, en segundos:

- **Sopa de hoy:** se escribe en la **Descripción** (ej. *"Hoy: crema de auyama…"*).
- **Proteínas / Principios / Jugos:** cada uno es un grupo de opciones — **agrega o quita**
  las de hoy (ej. quitar "Pescado apanado", agregar "Costilla BBQ").
- **Precio:** el campo Precio del producto.
- **¿Hoy no hay almuerzo?** Ponlo en **Agotado** con el botón de la lista.

Al **Guardar**, los clientes ven el menú actualizado. Es el mismo editor de siempre; no
hay que tocar código ni volver a sembrar para el cambio diario.

---

## 🚀 Dejarlo funcionando DE VERDAD (un comando, en un computador)

El menú real vive en **Firebase**. Se "siembra" **una sola vez** (igual que los otros locales):

```bash
git pull origin main
npm install                 # si hace falta
node scripts/seed-sabor-del-dia.mjs   # requiere scripts/serviceAccount.json
```

Si sale esto, quedó listo:

```
✓ Local creado: locales/sabor-del-dia (Sabor del Día)
✓ 18 productos cargados
🔗 Link del local: /sabor-del-dia
```

Luego, en `/sabor-del-dia/admin` → **⚙️ Configuración → Datos del negocio**: pon el
**WhatsApp** para pedidos (y horario/domicilio si aplica).

---

## 🗂️ Dónde está cada cosa

| Cosa | Archivo |
|---|---|
| Datos del menú (fuente única) | `src/dev/saborDelDia.js` |
| Registro de la vista previa | `src/preview.js` |
| Script para crear el local | `scripts/seed-sabor-del-dia.mjs` |
| Fotos de los platos (IA) | `public/locales/sabor-del-dia/*.webp` |

> 📸 Las fotos de los platos se generaron con IA (Higgsfield · z_image) y ya están
> conectadas en `saborDelDia.js`. El dueño puede reemplazar cualquiera desde el panel
> (Menú → Editar producto → 📷 foto).

*Es una demo: nombres, precios y platos los definí yo; cámbialos a gusto en `saborDelDia.js`.*
