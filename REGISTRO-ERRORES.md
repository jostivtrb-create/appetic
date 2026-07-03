# 🛠️ Registro de errores e incidentes

Bitácora de problemas encontrados en Appetic, su causa raíz y cómo se
resolvieron. Sirve para revisar con calma (en el PC) qué pasó y no repetirlo.

---

## 2026-07-03 · Perros Criollos: fotos en blanco y categorías que no aparecen

### Síntomas
- En el **menú del cliente** de Perros Criollos solo se veía **una categoría**
  ("Arma Tu Perro"); Empanadas y Bebidas no aparecían.
- En el **panel de admin** sí se veían las 3 categorías y sus productos, pero
  **todas las fotos** salían con el placeholder gris "Cargando imagen…".
- El **logo del local sí cargaba** (esto fue la pista clave: Storage funcionaba).
- Pilotos estaba bien.

### Causa raíz (eran DOS problemas distintos)

**1. Categorías inalcanzables (lo que rompió al cambiar la vista de categorías).**
Perros Criollos tiene `ocultarNav: true` en su configuración. Antes, el menú
mostraba todas las categorías apiladas (con scroll), así que ocultar la barra
de navegación no importaba. Al cambiar a "menú por pestañas" (una categoría a
la vez, commit `c893437`), con la barra oculta las demás categorías quedaban
**sin forma de navegarse**. Solo se veía la primera. Pilotos no usa
`ocultarNav`, por eso no se afectó.

**2. Fotos borradas al re-sembrar.**
Los scripts `scripts/seed-*.mjs` escribían los productos con `foto: ''` (vacío)
y `merge: true`. Como el campo `foto` iba incluido con valor vacío, al re-correr
el seed **sobrescribía la foto que el dueño había subido desde el panel**,
dejándola en blanco. Cuando en otra sesión se re-sembró Perros Criollos (para
agregar Empanadas/Bebidas y las categorías), borró las fotos ya subidas. El logo
sobrevivió porque es un archivo estático de `public/`, no un campo de Firestore.

### Solución aplicada (commit `3211d77`)
- **`src/pages/Local/LocalMenu.jsx`**: la barra de categorías ahora SIEMPRE se
  muestra cuando hay más de una categoría; `ocultarNav` ya no puede esconderla
  cuando eso dejaría categorías inalcanzables. Esto corrige el dato en vivo sin
  re-sembrar. (Empanadas/Bebidas vuelven al menú de Perros Criollos.)
- **`scripts/seed-perros-criollos.mjs`, `seed-pilotos.mjs`, `seed-local.mjs`,
  `seed-sabor-del-dia.mjs`**: si el ejemplo trae `foto` vacía, se quita del
  payload antes del `merge`, para que NO pise la foto real que el dueño subió.

### Pendiente / acción manual
- Las fotos que ya se borraron **no vuelven solas** (el campo `foto` quedó vacío
  en Firestore). Opciones:
  1. **Re-subirlas desde el panel** (Menú → Editar producto → foto). Recomendado.
  2. **Recuperarlas**: si los archivos siguen en Firebase Storage
     (`locales/perros-criollos/productos/`), hacer un script que regenere las
     URLs de descarga y las vuelva a guardar en Firestore. Requiere
     `serviceAccount.json` (no está en el repo).

### Prevención / lección
- **No correr `scripts/seed-*.mjs` sobre un local que ya está en uso** salvo que
  sea imprescindible: aunque ya no borran las fotos, sí pueden revertir
  nombres/precios editados por el dueño a los valores del ejemplo.
- Al introducir un cambio de UI que afecta la navegación (como el menú por
  pestañas), revisar los locales con configuraciones especiales (`ocultarNav`,
  1 sola categoría, etc.) para no dejar contenido inalcanzable.
