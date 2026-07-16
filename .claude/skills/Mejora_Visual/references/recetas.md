# Recetario de mejoras visuales sutiles

Patrones de CSS/animación listos para **adaptar**, no para pegar a ciegas. Todos están pensados para tres cosas que esta skill nunca rompe:

1. **Usan los tokens de la app** (`var(--color-...)`, spacing, sombras). Cambia los nombres de variable por los reales del proyecto. Si la app no tiene tokens, usa los valores existentes de su CSS, no inventes una paleta. **Antes de reemplazar un hex por `var(--token)`, verifica con `preview_inspect` que el token resuelve al mismo valor** — puede haber varios `:root` en conflicto (ej. `index.css` vs `App.css`) y el token NO coincidir con el hex; si el color cambia al migrar, es un cambio real (pide OK), no un "no-op".
2. **Son sutiles.** Duraciones cortas (150–300ms), curvas suaves, desplazamientos pequeños (4–12px). Si algo se nota *como animación*, bájalo.
3. **Respetan `prefers-reduced-motion`.** Siempre incluye el bloque que desactiva animación para quien la pidió apagada. Es accesibilidad básica y evita marear.

> Recuerda: esto es **solo CSS/estética**. Ninguna de estas recetas cambia lógica. No metas animación que dependa de, ni altere, el comportamiento funcional.

## Regla base: respetar prefers-reduced-motion

Pon esto una vez (global o en el CSS de la pantalla). Cubre a todos los usuarios sensibles al movimiento:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## 1. Transición base en interactivos

Que botones, enlaces y tarjetas tengan una transición suave en sus cambios de estado, en vez de saltar:

```css
.boton, .tarjeta, .enlace {
  transition: background-color 0.2s ease, box-shadow 0.2s ease,
              transform 0.15s ease, border-color 0.2s ease;
}
```

Transiciona propiedades concretas, no `all` (más predecible y mejor rendimiento). Evita transicionar `width`/`height`/`top`/`left` (causan reflow); prefiere `transform` y `opacity`.

## 2. Hover discreto (escritorio)

Elevación leve de sombra y/o un punto de desplazamiento. Nada brusco:

```css
.tarjeta:hover {
  box-shadow: var(--shadow-md);     /* sube un escalón en la escala de sombras de la app */
  transform: translateY(-2px);
}
.boton:hover {
  background-color: var(--color-primary-dark);  /* un tono de la MISMA paleta */
}
```

Si la app no tiene escala de sombras, usa una sombra discreta coherente con las suyas, no una nueva más fuerte.

## 3. Feedback al presionar (`:active`) — esencial en móvil

En móvil no hay hover; el `:active` es lo que hace que la app se sienta viva al tacto. El elemento se "hunde" un poco al tocarlo:

```css
.boton:active {
  transform: scale(0.97);
  transition-duration: 0.05s;   /* el hundido es casi inmediato */
}
```

Y quita el flash azul/gris por defecto en táctil (se ve tosco):

```css
.boton, .tarjeta, button, a {
  -webkit-tap-highlight-color: transparent;
}
```

## 4. Entrada de tarjetas/listas (fade + slide suave)

Para que el contenido aparezca con vida en vez de "plop". Desplazamiento pequeño, una sola vez:

```css
@keyframes aparecer {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.tarjeta-entra {
  animation: aparecer 0.22s ease-out both;
}
```

**Escalonado (stagger) leve** cuando son varias, para un efecto cascada discreto. Con pocos elementos fijos, con `:nth-child`:

```css
.lista > .tarjeta-entra:nth-child(1) { animation-delay: 0.00s; }
.lista > .tarjeta-entra:nth-child(2) { animation-delay: 0.05s; }
.lista > .tarjeta-entra:nth-child(3) { animation-delay: 0.10s; }
/* … mantén el paso en 40–60ms; más allá de ~6 elementos el delay se siente lento */
```

Si la lista es dinámica y larga, mejor un fade simple sin stagger (o un delay por índice vía variable CSS inline `style={{'--i': i}}` y `animation-delay: calc(var(--i) * 50ms)`), pero **eso es solo presentación, no toca la lógica de render**.

## 5. Aparición de un panel/mensaje/toast

Para algo que entra (un aviso, un acordeón que se abre):

```css
@keyframes desplegar {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.aviso-entra { animation: desplegar 0.18s ease-out both; }
```

Para alto variable (acordeón) sin tocar JS, `grid-template-rows: 0fr → 1fr` transiciona suave:

```css
.acordeon { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.25s ease; }
.acordeon.abierto { grid-template-rows: 1fr; }
.acordeon > * { overflow: hidden; }
```

## 6. Estado de carga elegante (skeleton)

En vez de un salto en blanco o un spinner solo, un esqueleto con shimmer suave. Es **solo el aspecto** del estado de carga que ya existe; no cambia cuándo ni qué carga:

```css
.skeleton {
  background: linear-gradient(90deg,
    var(--color-bg-secondary) 25%,
    var(--color-border) 37%,
    var(--color-bg-secondary) 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  border-radius: 8px;
}
@keyframes shimmer {
  from { background-position: 100% 0; }
  to   { background-position: 0 0; }
}
```

Spinner discreto cuando un skeleton no encaja:

```css
.spinner {
  width: 20px; height: 20px;
  border: 2px solid var(--color-primary-light);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: girar 0.7s linear infinite;
}
@keyframes girar { to { transform: rotate(360deg); } }
```

## 7. Resaltar con la paleta existente (jerarquía, no colores nuevos)

Para que el ojo vaya a la acción principal sin inventar color: usa el acento de la app con más presencia en lo importante y cálmalo en lo secundario.

```css
.accion-principal {
  background: var(--color-primary);
  color: #fff;
  box-shadow: var(--shadow-sm);
}
.accion-secundaria {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-border);   /* discreta, no compite */
}
```

Acento sutil sobre fondo (cabeceras, chips activos) reutilizando el tinte claro de la app:

```css
.activo { background: var(--color-primary-light); color: var(--color-primary-dark); }
```

## 8. Buen tacto en móvil (tamaño y áreas)

```css
.boton, .item-pulsable {
  min-height: 44px;          /* área táctil cómoda para el pulgar */
  display: inline-flex; align-items: center; justify-content: center;
}
```

Y para que el texto nunca desborde ni rompa la fila en móvil:

```css
.texto-largo {
  min-width: 0;              /* clave dentro de flex para permitir el truncado */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;       /* o usa line-clamp si quieres 2 líneas */
}
```

## 9. Scroll y detalles que se sienten "premium"

```css
html { scroll-behavior: smooth; }            /* navegación interna suave */
.scrollable { scrollbar-width: thin; }       /* barra discreta en Firefox */
.lista { scroll-snap-type: x mandatory; }    /* carruseles que encajan */
.lista > * { scroll-snap-align: start; }
```

## 10. Modal / popup que ENTRA (no aparece de golpe)

Que un popup aparezca seco es la señal #1 de app "quieta". Dale al fondo un fade y al diálogo un "pop" que sube. Es de lo que más vida da por menos esfuerzo.

```css
@keyframes mvOverlayIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes mvDialogIn  { from { opacity: 0; transform: translateY(18px) scale(.96); } to { opacity: 1; transform: none; } }
.mv-overlay { animation: mvOverlayIn .18s ease-out; }
.mv-dialog  { animation: mvDialogIn .28s cubic-bezier(.16, 1, .3, 1); }  /* ease-out expo: pop sin rebote */
```

**Si los modales usan estilos inline** (no puedes ponerles fácil un `className`), aprovecha que el overlay suele ser `position: fixed` y el diálogo su hijo directo, y apunta con un selector de atributo **scoped a la pantalla**:

```css
/* React serializa el style con espacio: "position: fixed". Verifícalo con eval. */
.mi-pantalla > div[style*="position: fixed"]       { animation: mvOverlayIn .18s ease-out; }
.mi-pantalla > div[style*="position: fixed"] > div { animation: mvDialogIn .28s cubic-bezier(.16,1,.3,1); }
```

Así animas TODOS los modales de esa pantalla sin editar uno por uno. (En móvil, una variante muy "viva" es que el diálogo entre deslizando desde abajo, tipo *bottom-sheet*.)

## 11. Número que RUEDA al cambiar (count-up) — el clásico "se siente vivo"

Cuando un total/saldo/contador cambia, en vez de saltar de un número a otro, **animа los dígitos** desde el valor anterior al nuevo con `requestAnimationFrame` y desaceleración. Confirma la acción sin un popup y lleva el ojo a la cifra. Es animación **puramente presentacional** (no cambia el dato): perfecta para la regla "no toques la lógica".

```jsx
import { useState, useEffect, useRef } from 'react';

// Hook genérico: devuelve el valor "rodando" hacia `value`.
const useCountUp = (value, duration = 420) => {
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef(null);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const from = fromRef.current;
    if (reduce || from === target) { setDisplay(target); fromRef.current = target; return; } // accesibilidad / sin cambio
    let start = null;
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);   // física: frena con inercia, no lineal
    const step = (ts) => {
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      setDisplay(from + (target - from) * easeOut(p));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
      else fromRef.current = target;                // garantiza el valor final exacto
    };
    rafRef.current = requestAnimationFrame(step);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return display;
};

// Úsalo formateando cada frame (moneda, miles, etc.):
const AnimatedMoney = ({ value, format }) => format(useCountUp(value));
// <AnimatedMoney value={total} format={formatMoney} />
```

Claves: **~400ms**, **ease-out** (lineal se siente robótico), **respeta reduced-motion y "no cambió → no animes"**, y el valor final es siempre exacto (`fromRef = target`). Nota: en un preview headless oculto, `requestAnimationFrame` se congela y la cifra se queda en su valor inicial — es artefacto del entorno; en el navegador del usuario rueda bien. Que lo pruebe él.

## 12. Hero de identidad (banner + avatar superpuesto)

Para rescatar una zona superior muerta (avatar suelto + botones en un vacío) y darle vida con color de marca, manteniendo limpio el resto. Ver `patrones-reorganizacion.md` §9.

```css
.hero {                      /* tarjeta contenedora */
  border-radius: 1.75rem; overflow: hidden;
  background: rgba(255,255,255,0.6); backdrop-filter: blur(10px);
  box-shadow: 0 10px 30px rgba(124,58,237,0.12);   /* sombra teñida con el primario */
}
.hero-banner {               /* franja de color de marca = la "vida" */
  position: relative; height: 120px;
  background: linear-gradient(135deg, var(--color-primary) 0%, #a855f7 45%, var(--color-secondary) 100%);
}
.hero-body {                 /* CLAVE: relative + z-index para que el avatar NO lo tape el banner */
  position: relative; z-index: 1;
  display: flex; flex-direction: column; align-items: center;
  margin-top: -56px;         /* sube el avatar para superponerlo al banner */
  padding: 0 1.5rem 1.75rem;
}
.hero-avatar {
  width: 112px; height: 112px; border-radius: 50%; object-fit: cover;
  border: 5px solid #fff; box-shadow: 0 10px 28px rgba(124,58,237,0.28);
}
.hero-name { margin: .9rem 0 .15rem; font-size: 1.5rem; font-weight: 800; }
```

Los botones de navegación van `position: absolute` sobre `.hero-banner`. Verifica los valores reales de los tokens con `inspect` (no asumas que el hex que copias equivale al token). El avatar debe verse **entero** sobre el banner — si sale recortado, falta el `z-index` en `.hero-body`.

## 13. Entrada con más presencia (overshoot + pop) — cuando "está muy suave"

Si la entrada base (receta 4) se siente *demasiado* tímida, súbele presencia con una curva de **overshoot** y un **pop** en el elemento protagonista (avatar/ícono del hero). Sigue siendo una sola animación protagonista, solo más perceptible.

```css
@media (prefers-reduced-motion: no-preference) {
  .entra {                 /* cards: subida más marcada + leve escala, con overshoot */
    opacity: 0;
    animation: pfRise .55s cubic-bezier(0.22, 1, 0.36, 1) forwards;  /* ease-out fuerte */
  }
  .entra:nth-child(1){ animation-delay:.05s } .entra:nth-child(2){ animation-delay:.15s }
  .entra:nth-child(3){ animation-delay:.25s } .entra:nth-child(4){ animation-delay:.35s }
  .hero-avatar {           /* el protagonista entra con un pop rebotón */
    animation: pfPop .6s cubic-bezier(0.34, 1.56, 0.64, 1) .28s both;
  }
}
@keyframes pfRise { from { opacity:0; transform: translateY(26px) scale(.96) } to { opacity:1; transform:none } }
@keyframes pfPop  { 0% { opacity:0; transform: scale(.5) } 60% { opacity:1; transform: scale(1.08) } 100% { transform: scale(1) } }
```

`cubic-bezier(0.34, 1.56, 0.64, 1)` es el rebote suave (el `1.56 > 1` da el overshoot). Úsalo solo en UN elemento protagonista, no en todo. El stagger un poco más amplio (~.10s) hace la cascada más visible. Recuerda: tú no ves la animación en el preview → tras subirla, **pide al usuario que la pruebe** y calibra.

## Cómo elegir y calibrar

- **Empieza por lo que más vida da:** feedback al tocar (`:active`), **popups que entran**, y **números que ruedan**. Eso solo ya transforma la sensación.
- **Perceptible, no invisible.** Si tras aplicar algo el usuario no nota diferencia, fue demasiado tímido — súbelo hasta que se *sienta*. El error común no es pasarse, es quedarse corto.
- **Una capa a la vez, y calibra con el usuario** (él ve el navegador, tú no puedes ver las animaciones en el preview). Aplica, pídele que lo pruebe, ajusta.
- **Duraciones:** micro-feedback 50–200ms · transiciones de estado 200–300ms · entradas/count-up 300–450ms. Más lento se siente pesado; más rápido no se percibe.
- **Curvas:** `ease-out` (o `cubic-bezier(.16,1,.3,1)`) para casi todo — da física. Evita `ease-in` solo (se siente trabado) y rebotes cartoon salvo que la app ya tenga ese lenguaje.
- **Lo que se evita es lo decorativo y distractor** (parpadeos eternos, cosas que se mueven sin comunicar nada), no lo que se *siente*. Una animación con función —confirmar, dirigir la atención, dar continuidad— casi nunca satura.
