# Criterios de organización / UX

Lista de qué mirar al reorganizar una pantalla. No es un checklist para marcar a ciegas: úsala para no dejar huecos, y prioriza lo que de verdad le cuesta usar a *esta* pantalla. Cada hallazgo se clasifica por severidad de usabilidad (🟠 Alto · 🟡 Medio · 🔵 Bajo — sin "crítico", eso es de `/auditoria`).

Recuerda el marco: **reorganizas el DÓNDE/el ORDEN/la AGRUPACIÓN, nunca el QUÉ**; todo se juzga contra **la tarea principal del usuario** en esta pantalla; **coherencia con los patrones de la app**; **móvil Y escritorio**; **avisar antes de tocar código compartido**; **la función no se rompe nunca**.

Antes de todo, responde dos preguntas y déjalas escritas en el documento:
- **¿Qué viene a hacer el usuario aquí?** (tarea principal + 1-2 secundarias)
- **¿Para quién es?** (cliente final, gestor, admin…)

Una pantalla está bien organizada cuando **su tarea principal es lo más fácil de hacer**. Eso es la vara de medir.

## 1. Jerarquía (que el ojo vaya solo a lo importante)

- **Lo principal domina:** la acción o la información más importante de la pantalla resalta por posición (arriba / primero), tamaño, peso o aire alrededor. Si la acción principal se ve igual que diez cosas más, no hay jerarquía.
- **Jerarquía no invertida:** lo secundario o accesorio (ajustes, enlaces menores, metadatos) no debe dominar visualmente sobre lo principal. Pregunta: *si un usuario nuevo mira 2 segundos, ¿sabe qué hacer primero?*
- **Un solo foco por zona:** evita que dos elementos compitan por ser "el principal" en el mismo espacio. Si todo grita, nada se oye.

## 2. Agrupación / proximidad (lo que va junto, junto)

- **Proximidad = relación:** los elementos relacionados deben estar cerca y dentro de un mismo grupo/contenedor; los no relacionados, separados. El usuario lee la relación por la posición antes que por las etiquetas.
- **Elementos dispersos:** ¿hay cosas que pertenecen a la misma tarea o tema regadas por la pantalla (ej. un dato arriba y su acción abajo)? Júntalas.
- **Grupos claros:** cada grupo debe leerse como una unidad (separado de los demás por aire o un contenedor), no fundirse con el de al lado ni partirse por la mitad.
- **Etiquetas que no repiten:** una etiqueta por grupo basta; no repitas lo obvio en cada ítem.

## 3. Orden y flujo (el orden de la pantalla = el orden de la tarea)

- **Orden de lectura natural:** arriba→abajo, izquierda→derecha. Lo primero que el usuario necesita debe estar primero.
- **Flujo de la tarea:** los pasos de una tarea van en el orden en que se hacen, sin obligar a saltar de un extremo a otro de la pantalla ni a devolverse.
- **Orden del DOM = orden visual:** revisa con `preview_snapshot` que el orden real del DOM (que manda en móvil y en tabulación) coincida con el orden lógico. Un layout que se ve bien con CSS pero tiene el DOM desordenado se rompe en móvil y para teclado.

## 4. Fricción (menos pasos, menos esfuerzo para lo frecuente)

- **Lo frecuente, a mano:** la acción más común no debería exigir scroll, abrir un menú o varios toques. Lo raro sí puede estar un nivel más adentro.
- **Alcance del pulgar (móvil):** la acción principal cae en la zona cómoda del pulgar (mitad inferior / centro), no en una esquina superior lejana. Ver `patrones-reorganizacion.md`.
- **Lo destructivo, fuera del camino:** borrar/cancelar/acciones peligrosas no deben estar pegadas a las comunes ni donde se toquen por error.
- **Scroll con sentido:** si lo importante queda siempre bajo el pliegue (hay que hacer scroll para verlo), reorganiza para subirlo.

## 5. Carga cognitiva / densidad (no saturar)

- **Demasiado a la vez:** si la pantalla abruma, la salida no siempre es quitar — suele ser **agrupar**, **jerarquizar** o **revelar progresivamente** (mostrar lo esencial, colapsar lo secundario en acordeones/secciones/"ver más"). Ver `patrones-reorganizacion.md`.
- **Aire entre grupos:** el espacio en blanco separa unidades y deja respirar. Una pantalla apretada cuesta más de leer (y se ve más barata).
- **Una decisión a la vez:** no pongas al usuario a elegir entre muchas cosas simultáneas si la tarea es secuencial.
- **Espacio muerto / zona desbalanceada (el extremo opuesto a saturar):** una zona grande casi VACÍA para muy poco contenido (un header enorme con solo un avatar y dos botones, una franja de aire que no separa nada) es desperdicio y se ve "sin terminar" — no la confundas con "aire que deja respirar". Es de **alto impacto**: dale función a esa zona (convertirla en un *hero* de identidad, subir contenido) o recórtala. **Mide la causa con `preview_inspect`**, no a ojo: muchas veces el hueco viene de un `padding-top`/altura grande puesto para un header **fixed** que en realidad es **sticky** (ya ocupa su lugar en el flujo) → ese padding sobra. Comprueba `position` del header antes de asumir. Ver `patrones-reorganizacion.md` (hero de identidad).

## 6. Consistencia de patrones (que se sienta la misma app)

- **Mismos patrones que el resto:** dónde viven las acciones, cómo se ven tarjetas/listas/secciones, dónde está el "volver"/header/bottom-nav. Mira otras pantallas antes de inventar.
- **No reinventes:** si la app ya resuelve "lista con acción" o "formulario por pasos" de cierta forma, reúsala. Un patrón nuevo solo para esta pantalla añade carga de aprendizaje.

## 7. Descubribilidad / claridad

- **Se entiende qué es tocable:** los elementos interactivos parecen interactivos; los de solo lectura no fingen serlo.
- **Nada importante escondido tras un gesto oscuro:** si una acción clave solo se alcanza con un swipe/long-press que nadie va a descubrir, súbela a la superficie.
- **Sin redundancia que ensucie:** títulos, íconos o textos que repiten lo obvio y compiten con el contenido — quítalos o fúndelos.

## 8. Optimización móvil (estas apps se usan en el celular)

- Recorrer en `preview_resize` preset `mobile` (375×812) **toda** reorganización.
- **Orden vertical manda:** en una sola columna, lo importante arriba o al alcance; revisa el orden real del DOM.
- **Lo fijo no tapa:** headers, bottom-nav y FABs no esconden contenido ni la acción principal.
- **Nada desbordado:** cero scroll horizontal indeseado; nombres/números largos que no rompen la fila.
- **Áreas táctiles cómodas:** acciones con tamaño y separación suficientes para el dedo (no pegadas).
- **Escritorio:** ¿aprovecha el ancho para airear y agrupar (p. ej. dos columnas, una rejilla) o deja todo en una columna apretada con huecos muertos al lado?

## 9. Verificación (antes de dar un punto por hecho)

- **La función sigue intacta** (innegociable): tras mover/reagrupar, los botones siguen llamando a lo suyo, los formularios envían, lo condicional sigue apareciendo solo cuando debe, los datos se muestran, sin errores de consola/red, el orden de tabulación tiene sentido. Reorganizar markup puede romper en silencio — verifícalo siempre.
- **¿De verdad mejoró?** Compara antes/después de jerarquía, agrupación y orden (capturas + `preview_snapshot`). Si no se encuentra/hace más fácil la tarea principal, no era mejora — revierte.
- **Móvil y escritorio**, los dos.
- **Código compartido:** si lo tocaste, revisa que otras pantallas que lo usan no se reordenaron sin querer (o que lo aislaste).
