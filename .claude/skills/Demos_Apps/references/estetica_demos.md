# Recetario estético — el ADN visual de las demos

Esto está **ingenierizado en reverso** de las apps reales que gustaron — sobre todo **Loli Merengones**
(estructura) y **NOPALITOS** (riqueza visual) — más Shawarma FJC, Little Colombia y Le Zzapan. La
plantilla maestra (`assets/plantilla_app_maestra.html`) **ya implementa todo esto**. Tu trabajo es
**elegir bien la pareja de fuentes, la paleta y la partícula** por negocio, y que se sienta una app
nativa, viva y única. Lo que separa una demo "bonita" de una que el dueño compra son los **detalles**.

> Norte fijado por el usuario: **muchas partículas, en varias zonas, sin saturar** + cada app **única**
> (sale de SU marca) + switch claro/oscuro **solo en el perfil**.

---

## 1. Fundamentos "de app" (ya en la plantilla)
- **Frame móvil centrado** (`--maxw:468px`), mobile-first.
- **Design tokens en `:root`** (no colores sueltos): fuentes, radios, sombras, easings y paleta completa.
- **Tema claro Y oscuro** con tokens que cambian + `<meta theme-color>` distinto para cada uno.
- **Movimiento sutil por todos lados**: cada aparición, tap y cambio tiene su micro-animación.

## 2. Tipografía — elige la pareja por marca (display + body)
Una **display** expresiva para títulos/precios + una **body** limpia. Referencias reales:
| App | Display | Body |
|---|---|---|
| Loli Merengones | Baloo 2 | Plus Jakarta Sans |
| NOPALITOS | Fredoka / Baloo 2 | DM Sans |
| Shawarma FJC | Bricolage Grotesque | DM Sans |
Criterio: cálida/artesanal → Bricolage/Fraunces · dulce/infantil → Baloo 2/Fredoka · premium → Clash/Sora.
Cárgalas de Google Fonts en `[[FONT_LINK]]` y pon las familias en `--font-display` / `--font-body`.

## 3. Color y profundidad (tokens claro + oscuro)
> ⚠️ **La paleta sale del LOGO de cada negocio, no de una plantilla.** El error a evitar: que todas las
> apps terminen color crema/beige. Toma los 2–3 colores dominantes del logo, hazlos `--primary/--accent/
> --accent-2`, arma el `--grad` con ellos y **tinta el fondo y las superficies hacia esos colores**. Una
> marca roja/dorada → base cálida; una azul → base fría; una verde → base natural. Cada app, su propio mundo.
> (Detalle en `construccion_app.md`, paso 2.) Las de abajo son solo EJEMPLOS de cómo se ve bien hecho:

Paletas reales de referencia:
- **Loli** (dulce): `--primary:#7B3FE4` violeta · `#FF6FB0` rosa · `#1FC7C7` cyan · `#FFC53D` amarillo ·
  bg `#FAF8FF` · ink `#241544`.
- **NOPALITOS** (vibrante, trae claro+oscuro): `--primary:#FF6A1A` · `#E5197B` magenta · `#7A2FD6` morado ·
  `#7CC51E` lima · `#16C4C4` turquesa. Claro: page `#ffe6bf`, surface `#fffaf2`, ink `#2a1a10`.
  Oscuro: page `#120a1e`, surface `#241634`, ink `#fff3e8`. ← **patrón a imitar para el modo oscuro.**
- **Sombras tintadas a la marca** (no negras puras) en 3 niveles. Fondo con **degradado muy suave**.
- Gradiente de marca `--grad` (primary→accent) en héroe, botones y éxito — que se vea vivo (NOPALITOS usa 135°).

## 4. Radios y easings (fijos en la plantilla)
- Radios `10/14/20/28/34px`. Easings: `--ease` (salida suave) y `--ease-back` overshoot para los "pop".
- Duraciones cortas (140–420ms). Nada lento.

## 5. ⭐ Partículas — el detalle estrella (MUCHAS, varias zonas, sin saturar)
La plantilla tiene un sistema `spawnParticles()` que ya las pone en **gate, login, héroe y éxito**.
Tú solo eliges `DATA.particle` (el glyph temático) y la app las reparte:
- **Tipos**: `heart` ❤ (postres/amor) · `ember` 🔥 (asador/parrilla) · `confetti` ▮ (heladería/fiesta —
  caen) · `leaf` 🍃 (saludable) · `bubble` • (bebidas) · `steam` ≈ (café) · `sparkle` ✦ / `star` ★ (premium/belleza).
- **Receta**: 7–12 partículas por zona, posición/`--drift`/delay aleatorios para que no vayan
  sincronizadas; flotan sobre un **glow radial** (`--stage-glow`). Pocas por zona pero presentes en varias
  → "viva" sin saturar. El confeti del éxito cae (26 piezas). Respeta `prefers-reduced-motion`.
- Adapta el glow y los acentos al rubro. Cada app, con su partícula+paleta propias, se siente distinta.

## 6. Animaciones de entrada (ya implementadas)
- `screenIn`/`riseUp`/`fadeIn`: pantallas y secciones entran con translateY + leve scale.
- `popIn`/`pop`/`bump`: badges, contador del carrito y el ícono de éxito con overshoot.
- **Stagger**: las tarjetas del menú entran en cascada (delay por índice).

## 7. Componentes con sello (ya en la plantilla)
- **Header sticky glass** (`backdrop-filter:blur`) con logo + acceso al carrito.
- **Barra de secciones sticky** que filtra; chip activo en `--primary`. **Switch de cartas** si hay varias.
- **Bottom tab nav** (Menú · Carrito · Pedidos · Cuenta) con ícono activo y badge de cantidad.
- **Detalle en BOTTOM SHEET** que sube con scrim — ahí van tamaños/sabores/adiciones y cantidad.
- **Tarjetas de producto**: surface, sombra `--shadow-sm`, thumb (foto o emoji grande), precio en display, "+".

## 8. Micro-interacciones (lo que enamora)
- Agregar al carrito: el "+" hace `pop` y el badge `bump`; toast "Agregado ✓".
- **Total que pulsa** al cambiar. Confirmar → check que se **dibuja** + lluvia de partículas + barra de progreso.
- **Switch de tema** animado (solo en Cuenta). **Skeletons shimmer** disponibles para estados de carga.

## 9. Accesibilidad
- `prefers-reduced-motion` apaga partículas/animaciones fuertes. Áreas táctiles ≥44px. Contraste cuidado
  en claro y oscuro, `color-scheme` correcto.

---

### Resumen del nivel a imitar
| | Loli (estructura) | NOPALITOS (visual) |
|---|---|---|
| Display / Body | Baloo 2 / Plus Jakarta Sans | Fredoka / DM Sans |
| Primary | violeta `#7B3FE4` | naranja `#FF6A1A` |
| Tema | claro | claro **+ oscuro** |
| Partícula | corazones/pétalos | confeti |
| Fuerte | estructura limpia, flujo claro | color vibrante, gradientes, energía |
**La plantilla maestra fusiona ambas: la estructura ordenada de Loli con la energía visual de NOPALITOS.**
