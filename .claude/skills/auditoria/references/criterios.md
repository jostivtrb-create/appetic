# Criterios de auditoría

Lista de qué revisar al auditar un flujo. No es un checklist para marcar a ciegas: úsala para no dejar huecos, y prioriza lo relevante para *este* flujo y *este* usuario. Cada hallazgo que encuentres aquí se clasifica por severidad (ver `reporte.md`).

## 1. Funcionalidad (¿hace lo que promete?)

- El camino feliz se completa de principio a fin.
- El resultado **queda persistido** y se refleja donde el usuario esperaría verlo (lista, detalle, contador, etc.). Verifícalo recargando o navegando, no por ausencia de error.
- Acciones repetidas no rompen ni duplican (doble click en "Guardar", reenviar formulario, volver atrás y reintentar).
- Sin errores en consola (`preview_console_logs` level error) ni peticiones fallidas (`preview_network` filter failed) durante el flujo. Un `permission-denied` o un 500 invisible cuenta como fallo aunque la UI no se queje.
- Los datos mostrados son los correctos para el contexto: filtran por sede / usuario / rol adecuados, sin filtrarse datos de otros.

## 2. Robustez y casos límite

- Campos vacíos, valores inválidos, negativos, textos larguísimos, caracteres raros, duplicados.
- Estados de datos: lista vacía, primer uso (sin nada creado aún), un solo elemento, muchísimos elementos.
- Fallos externos: sin conexión, operación lenta, permiso denegado. ¿La app avisa con claridad o se cuelga/queda en blanco?
- Cancelar a mitad del flujo, cerrar un modal, navegar fuera y volver: ¿queda el estado consistente?

## 3. Diseño minimalista y consistencia

- Limpio y sin ruido: nada de elementos sobrantes, textos redundantes o controles que distraen.
- Consistente con el resto de la app: mismos colores, tipografías, tamaños, espaciados, estilo de botones. Para verificar valores reales usa `preview_inspect` (no confíes en la captura para colores/tamaños).
- Alineación y espaciado correctos; nada desbordado, cortado o encimado.
- Jerarquía visual clara: lo importante resalta, lo secundario no compite.
- Modo oscuro coherente si la app lo soporta (`preview_resize` colorScheme dark).

## 4. Intuitividad / UX

- Un usuario nuevo de ese rol entiende qué hacer sin que se lo expliquen.
- Textos de botones, etiquetas y mensajes claros y en el idioma de la app; sin jerga técnica para el usuario final.
- **Feedback en cada acción**: estado de cargando, confirmación de éxito, y mensajes de error útiles (qué pasó y qué hacer), no genéricos ni en silencio.
- El flujo no tiene pasos innecesarios; el número de toques para lograr el objetivo es razonable.
- Foco y orden de tabulación lógicos; el teclado del móvil aparece con el tipo correcto (numérico para números, etc.).

## 5. Responsive / PWA (estas apps se usan en el celular)

- Recorrer lo crítico en `preview_resize` preset `mobile` (375x812).
- Nada se desborda horizontalmente; sin scroll lateral indeseado.
- Botones y áreas táctiles alcanzables y suficientemente grandes para el pulgar.
- Bottom-nav / barras fijas no tapan contenido ni se rompen con 5–6+ items.
- Modales y formularios usables en pantalla pequeña (no se salen, se pueden cerrar y enviar).

## 6. Código muerto y limpieza (NUNCA debe quedar código muerto)

Regla dura del usuario: **nunca debe quedar código muerto.** En la auditoría de código, busca y reporta:

- **Funciones / variables / constantes nunca usadas** (definidas pero jamás llamadas o leídas; globales expuestos en `window.*` que nadie invoca).
- **Archivos no referenciados** (un `.js`/partial que no está en `index.html` ni se importa en ningún lado).
- **Features a medias / código sin UI**: lógica implementada cuya entrada o botón no existe (p. ej. un `signInWithApple` sin botón), o ramas que nunca se alcanzan.
- **Bloques comentados** dejados "por si acaso", `TODO`/`FIXME` ya resueltos, y `console.log`/debug olvidados que ensucian la consola en runtime.
- **Flags/parámetros legacy** que ya no hacen nada (campos que se escriben pero nunca se leen, o se leen pero nunca se escriben).
- **Helpers duplicados** copiados en varios archivos que deberían vivir en un módulo compartido (al menos señalarlo).

Para confirmar que algo está muerto, **verifica con Grep** que de verdad no se referencia en ningún lado antes de marcarlo (no asumas por el nombre). Severidad típica: 🔵 Bajo o 🟡 Medio; sube a 🟠 si el código muerto confunde el mantenimiento o esconde un bug (p. ej. dos rutas que parecen activas y solo una lo está). Para cada hallazgo de código muerto, la decisión suele ser **eliminarlo** vs **completarlo** (si era una feature a medias) vs dejarlo.

## 7. Eficiencia de Firebase (fugas de llamados)

Foco dedicado: detectar usos que **queman cuota/costo de Firestore** sin necesidad (lecturas, escrituras, listeners en tiempo real). Es uno de los focos principales de esta auditoría y se hace **sobre todo leyendo el código** (gratis), no ejercitando la app (que sí consume cuota).

Lo esencial a buscar: listeners (`onSnapshot`) sin `unsubscribe()` que se acumulan, lecturas de colecciones enteras sin `where`/`limit`, patrones N+1 (un `getDoc` por item en un bucle), tiempo real donde bastaba una lectura única, re-fetch en cada render o cada tecla (sin debounce), y escrituras una por una en vez de `writeBatch`.

**Carga `firebase-fugas.md`** para el detalle de patrones, cómo confirmarlos barato con `preview_network` (una sola pasada, sin recargar en bucle) y la severidad orientativa. Regla de oro: optimizar **no debe cambiar lo que la app hace ni la experiencia del usuario** — misma información, mismo comportamiento, solo menos llamados.
