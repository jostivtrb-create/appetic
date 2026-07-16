# Patrones de reorganización

Recetario de movimientos de organización listos para adaptar. No es un catálogo para aplicar a ciegas: son las herramientas con las que resuelves los hallazgos de `criterios-ux.md`. Todos respetan el marco: **se mueve el DÓNDE, nunca el QUÉ**; **mover elementos enteros** (props, handlers, `key`, condicionales intactos); **coherencia con los patrones de la app**; **verificar la función después**.

Antes de aplicar cualquiera, asegúrate de **mover el elemento completo**, no reescribirlo:

```jsx
// MAL — reescribir al mover (se pierde el onClick, el key, el disabled…)
<button>Agendar</button>

// BIEN — cortar y pegar el elemento entero, tal cual estaba, en su nuevo lugar
<button onClick={handleAgendar} disabled={cargando} className="btn-primary">
  Agendar
</button>
```

---

## 1. Subir la acción principal (jerarquía por posición)

**Cuándo:** la acción o el dato más importante está enterrado bajo cosas secundarias; el usuario tiene que buscar o hacer scroll para lo principal.

**Cómo:** mueve el bloque principal arriba, justo bajo el título/contexto mínimo que necesita; baja lo secundario (ajustes, info de apoyo, enlaces menores). El orden del DOM debe quedar: contexto mínimo → acción/dato principal → lo demás. No cambies a qué llama el botón; solo su posición en el markup.

**Verifica:** el botón sigue disparando su handler; nada que dependía del orden previo se rompió.

---

## 2. Agrupar lo relacionado (proximidad)

**Cuándo:** elementos que pertenecen a la misma tarea/tema están dispersos (un dato arriba, su acción abajo; tres filtros sueltos en distintos rincones).

**Cómo:** envuélvelos en un mismo contenedor (`<div>`/`<section>` con el patrón de la app) y sepáralos del resto con aire. Si la app ya tiene un componente de grupo (`Card`, `Section`, `Field`), úsalo. Mantén cada elemento íntegro al moverlo dentro del grupo.

**Aislar vs global:** si el contenedor que tocarías es compartido, prefiere **envolver localmente** en esta pantalla en vez de cambiar el componente compartido (ver SKILL.md → Código compartido).

---

## 3. Reordenar al flujo de la tarea

**Cuándo:** el orden de los bloques no sigue el orden en que el usuario hace las cosas; obliga a saltar de arriba a abajo y devolverse.

**Cómo:** reordena los bloques para que sigan los pasos reales (1 → 2 → 3). Revisa con `preview_snapshot` que el **orden del DOM** (no solo el visual con CSS) quede en ese orden — es el que manda en móvil y en tabulación con teclado.

**Cuidado:** si el orden visual se lograba con CSS (`order`, `flex-direction`, `grid` posicionado) y el DOM está en otro orden, alinéalos; un DOM desordenado rompe móvil y accesibilidad aunque "se vea bien" en escritorio.

---

## 4. Revelar progresivamente (bajar la carga cognitiva)

**Cuándo:** la pantalla abruma porque muestra todo a la vez, pero solo una parte es esencial siempre.

**Cómo:** deja lo esencial visible y mete lo secundario en un mecanismo de revelado que la app ya use (acordeón, "ver más", sección colapsable, pestaña, paso siguiente). Lo importante: esto es **reorganizar la presentación**, no cambiar la lógica — el contenido y sus handlers siguen ahí, solo se muestran cuando el usuario lo pide. Si la app no tiene un patrón de colapsado, usa uno mínimo y coherente; si añadir el toggle implica estado nuevo, eso roza la lógica → **avisa al usuario antes**.

---

## 5. Aprovechar el ancho en escritorio

**Cuándo:** en escritorio todo queda en una columna estrecha y apretada, con grandes huecos muertos a los lados.

**Cómo:** reparte en dos columnas o una rejilla con el grid de la app (ej. "hacer" a un lado, "consultar" al otro; formulario izquierda, resumen derecha). En móvil debe colapsar a una sola columna en el orden correcto — verifica los dos tamaños. Usa los breakpoints/utilidades que la app ya tenga, no media queries sueltas inventadas.

---

## 6. Alcance del pulgar (móvil)

**Cuándo:** en móvil la acción principal cae en una esquina superior lejana, incómoda para el pulgar, o queda tapada por header/bottom-nav fijos.

**Cómo:** lleva la acción principal a la zona cómoda (mitad inferior / centro). Opciones: moverla en el flujo, o —si la app ya usa ese patrón— fijarla como botón inferior / FAB al alcance. Asegúrate de que lo fijo **no tape** contenido (añade el padding inferior que haga falta). No cambies qué hace la acción.

---

## 7. Separar lo destructivo de lo común

**Cuándo:** una acción peligrosa (borrar, cancelar, finalizar) está pegada a las comunes y se puede tocar por error.

**Cómo:** sepárala con aire, móvela a un nivel más adentro (menú de "…", segunda fila), o dale otro lugar visual de menor protagonismo. Es reorganización de posición/peso, no de comportamiento — el handler y su confirmación (si la tiene) no se tocan.

---

## 8. Quitar redundancia que ensucia

**Cuándo:** títulos, etiquetas o íconos repiten lo obvio en cada ítem y compiten con el contenido, inflando la densidad.

**Cómo:** sube la etiqueta repetida a una sola cabecera de grupo y quítala de cada ítem; fusiona rótulos que dicen lo mismo. Cuidado: solo quitas **presentación redundante**, nunca datos ni controles que hagan algo. Si dudas si un elemento "hace algo", trátalo como función y déjalo (o pregunta).

---

## 9. Convertir una zona muerta en un hero de identidad

**Cuándo:** una zona superior (o un header) está casi vacía para muy poco contenido — el caso típico: un avatar pequeño flotando con uno o dos botones en un gran espacio en blanco. Se ve "sin terminar" y desperdicia la mejor parte de la pantalla.

**Cómo:** dale **propósito** a esa zona convirtiéndola en un *hero*: una **franja/banner con degradado de marca** + el **avatar (o ícono) superpuesto** sobre el borde inferior del banner + **nombre/título y subtítulo** ahí mismo. Los botones de navegación (volver, editar) flotan sobre el banner. Esto elimina el vacío Y da vida con color (cubre la lente 🎨), manteniendo las tarjetas de abajo limpias. Quita del cuerpo lo que ahora vive en el hero (no dupliques el nombre/correo en una tarjeta).

**Antes de tocar el padding:** mide con `preview_inspect` la altura real y el `position` del header de la app. Si es **sticky** (en flujo), un `padding-top` grande pensado para un header *fixed* solo añade hueco muerto → recórtalo.

**Gotcha de superposición (z-index):** para que el avatar se superponga al banner se usa un margen negativo que lo sube dentro del banner. Pero si el banner tiene `position: relative` (porque lleva botones absolutos), **se pinta por encima** del avatar (que es estático) y lo recorta. Solución: dale al **cuerpo del hero** (el que contiene avatar+nombre) `position: relative; z-index: 1` para que quede por encima del banner. Verifícalo: el avatar debe verse entero, con su anillo, sobre el color.

**Verifica:** los botones movidos (volver/editar) siguen llamando a su handler; el avatar se ve completo; en móvil el hero no desborda; nada del cuerpo quedó duplicado.

---

## Antipatrones (lo que NO debes hacer)

- **Reescribir un elemento al moverlo** → pierdes handlers/keys/condicionales. Corta y pega entero.
- **Mover algo fuera de su condicional** (`{cond && <X/>}`) sin querer → aparece cuando no debe. Mueve el condicional con el elemento.
- **Reordenar el DOM rompiendo la tabulación** → el orden de foco con teclado deja de tener sentido. Verifica con `preview_snapshot`.
- **Inventar un patrón de layout nuevo** cuando la app ya resuelve eso de otra forma → añade carga de aprendizaje. Reúsa el patrón de la app.
- **Tocar un componente/contenedor compartido en silencio** → reordena otras pantallas. Avisa y prefiere aislar.
- **Reorganizar por cambiar** → si ya estaba bien, lo dejas. La vara es "¿más fácil de usar?", no "¿se ve distinto?".
- **Colapsar/mover algo que añade estado o cambia el flujo** sin avisar → eso ya es lógica. Párate y consulta.
- **Superponer un elemento sobre un hermano `position: relative` sin z-index** → el hermano posicionado se pinta encima y lo recorta (ej. avatar tapado por el banner). El que se superpone necesita `position: relative; z-index`. Verifica que se vea entero.
- **Confundir espacio muerto con "aire"** → una zona grande casi vacía no es minimalismo, es desperdicio. Dale función (hero) o recórtala.
- **Asumir el `padding` de un header sin medir** → si el header es *sticky* (no *fixed*), el `padding-top` grande sobra. Mide `position` y altura con `preview_inspect`.
