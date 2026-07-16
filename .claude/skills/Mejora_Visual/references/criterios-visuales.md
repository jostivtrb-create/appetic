# Criterios de mejora visual

Lista de qué mirar al embellecer una pantalla. No es un checklist para marcar a ciegas: úsala para no dejar huecos, y prioriza lo que de verdad le resta a *esta* pantalla. Cada hallazgo se clasifica por severidad visual (🟠 Alto · 🟡 Medio · 🔵 Bajo — sin "crítico", eso es de `/auditoria`).

Recuerda el marco: **solo estética y animación, nunca lógica**; **respetar y resaltar la paleta existente**; **móvil Y escritorio**; **avisar antes de tocar código compartido**.

## 1. Limpieza (que todo encaje)

- **Alineación:** elementos en una misma fila/columna alineados a su eje; nada corrido un par de píxeles, nada encimado. Verifica con `preview_inspect` los `margin`/`padding`, no a ojo.
- **Espaciado coherente:** los huecos entre elementos siguen la escala de la app (los tokens de spacing), no valores sueltos al azar. Ritmo parejo: que no haya una tarjeta pegada y la siguiente con el doble de aire.
- **Sin saltos de texto:** títulos que no se parten raro, líneas que no quedan viudas/huérfanas feas, texto que no salta de tamaño entre elementos hermanos, nada cortado con "…" donde cabía completo.
- **Sin desbordes:** nada se sale de su contenedor ni genera scroll horizontal. Especialmente en móvil (textos largos, números grandes, nombres largos).
- **Consistencia con el resto de la app:** mismos radios de borde, mismas sombras, mismos estilos de botón/tarjeta. Si esta pantalla usa una sombra distinta a todas las demás sin razón, es ruido.
- **Verifica el token ANTES de migrar un color (crítico):** si vas a cambiar un hex hardcodeado por `var(--token)` "por consistencia", primero confirma con `preview_inspect` que el token **resuelve al mismo valor**. Una app puede tener **varios `:root` en conflicto** (ej. `index.css` y `App.css` definiendo `--color-primary` distinto; gana el último cargado), así que el hex y el token **no siempre coinciden**. Si al migrar el color **cambia** visiblemente, eso ya **no es un "no-op"**: es un cambio de look real → avísalo y pide OK (o, mejor, propón resolver primero el conflicto de `:root`). Nunca asumas que `#7c3aed === var(--color-primary)` sin medirlo.

## 2. Animaciones leves (darle vida sin saturar)

- **Entrada:** tarjetas/listas que aparecen con un fade+slide suave al cargar (escalonado leve si son varias) en vez de aparecer de golpe. Ver `recetas.md`.
- **Hover (escritorio):** botones y tarjetas con una reacción discreta al pasar el cursor (elevación de sombra, leve cambio de fondo dentro de la paleta). Nada brusco.
- **Transiciones de estado:** cuando algo cambia (se abre un panel, cambia un color, aparece un mensaje), que transicione en 150–300ms en lugar de saltar.
- **Popups / modales que ENTRAN:** que un popup aparezca de golpe es la señal #1 de app "quieta". Fondo con fade + diálogo que sube con un pop suave. Revísalo SIEMPRE: es de lo que más vida da. Ver receta 10.
- **Números que cambian RUEDAN:** saldos, totales, contadores → count-up con ease-out en vez de saltar. Ver receta 11.
- **Coherencia:** si la pantalla ya tiene animaciones, las nuevas deben sentirse del mismo set (misma duración/curva). No mezcles estilos.
- **Presupuesto de movimiento (regla, no sugerencia):** cada pantalla tiene UNA animación protagonista + micro-feedback al tacto (`:active`/hover, que no cuenta) + a lo sumo un acento ambiental sutil. Si hay más de **2–3 cosas llamativas moviéndose a la vez**, sobra alguna → recórtala. Cuando todo se mueve, se pierde la jerarquía y ninguna animación significa nada.
- **Dos errores simétricos, igual de graves — ni tímido ni recargado.** (1) *Quedarse corto:* animación tan sutil que no se siente → "no mejoró nada". (2) *Pasarse:* pantalla "árbol de Navidad" / movimiento de relleno, cosas que parpadean, laten o brillan sin comunicar nada. No corrijas uno cayendo en el otro: el objetivo es el **punto medio** (viva Y leve). Sutil = elegante y breve, no imperceptible; leve = con presupuesto, no quieto. `prefers-reduced-motion` siempre se respeta.
- **Filtro por animación — "¿se gana su lugar?":** a CADA animación, una por una, pregúntale si da *feedback*, *dirige la atención* o da *continuidad*. Si es decoración/relleno, o si dudas, **córtala**. La carga de la prueba la tiene la animación.

## 3. Interactividad (que cada toque responda)

- **Feedback al presionar (`:active`):** botones y elementos táctiles que se "hunden" levemente o cambian al tocarlos — esencial en móvil, donde no hay hover. Sin esto la app se siente muerta.
- **Estados de carga elegantes:** mientras algo carga, un skeleton o un spinner discreto en vez de un salto en blanco o un congelamiento. (Solo lo visual del estado de carga; la lógica de cuándo cargar no se toca.)
- **Estados claros:** seleccionado/activo/deshabilitado se distinguen a simple vista, con la paleta de la app.
- **Respuesta inmediata:** ninguna acción debería sentirse "sin pasar nada". Aunque el resultado tarde, el toque sí responde al instante.

## 4. Minimalismo (quitar ruido)

- **Minimalista ≠ plano / aburrido (no te quedes corto):** quitar ruido NO es quitar vida ni color. Una pantalla "limpia" puede —y casi siempre debe— tener un **foco de color de marca con intención**: un *hero*/banner con degradado, un acento, títulos de sección con el color primario. Cards limpias **+** un punto de color vivo = limpio **Y** con vida. "Todo gris, sin vida" es un defecto tan real como "recargado". Si reorganizaste pero la pantalla quedó *aburrida*, **no terminaste la lente 🎨** — falta darle vida (sin saturar).
- **Si no aporta, sobra:** bordes redundantes, sombras sobre sombras, separadores que no separan nada, etiquetas que repiten lo obvio, iconos decorativos que compiten con el contenido.
- **Jerarquía visual:** lo importante resalta (tamaño, peso, color de la paleta), lo secundario se calma. Si todo grita, nada se oye. Para el cliente final, que el ojo vaya solo a la acción principal.
- **Aire:** el espacio en blanco no es desperdicio; deja respirar. Una pantalla apretada se ve más barata que una aireada.
- **Menos colores, mejor usados:** resaltar con el color de acento de la app donde importa, no pintar todo de colores.

## 5. Optimización móvil (estas apps se usan en el celular)

- Recorrer en `preview_resize` preset `mobile` (375×812) **toda** mejora.
- **Áreas táctiles:** botones e ítems pulsables de ~44px mínimo; nada tan pequeño o tan pegado que se falle el toque.
- **Textos:** legibles sin zoom, sin cortes, sin desbordes; números/nombres largos que no rompen la fila.
- **Scroll fluido:** sin saltos, sin barras dobles, sin contenido tapado por barras fijas/bottom-nav.
- **Nada desbordado horizontalmente:** cero scroll lateral indeseado.
- **Lo fijo no tapa:** headers/bottom-nav/FABs no esconden contenido ni botones.

## 6. Verificación (antes de dar un punto por hecho)

- Captura/mide de nuevo tras aplicar: ¿de verdad se ve mejor que antes?
- En **móvil y escritorio** los dos.
- **Presupuesto de movimiento (lo verificas tú, no necesitas ver la animación):** haz inventario de lo que se mueve de forma llamativa en la pantalla y pasa cada animación por el filtro "¿se gana su lugar?". Si hay más de 2–3 a la vez, o alguna es decoración, **recórtala** antes de cerrar. Tan obligatorio como que nada se rompa.
- **La función sigue intacta:** el botón sigue haciendo lo suyo, el formulario envía, nada quedó tapado por una animación o un margen nuevo. Esto es innegociable: embellecer nunca puede romper.
- Modo oscuro coherente si la app lo soporta.
- Si tocaste código compartido, revisa que **otras pantallas** que lo usan no se vieron afectadas (o que lo aislaste para que no las toque).
