# Fugas y desperdicio de llamados a Firebase

Foco dedicado de la auditoría: encontrar **usos que queman cuota/costo de Firestore** (lecturas, escrituras, listeners en tiempo real) sin necesidad. El objetivo es dejarlo **óptimo y útil**, **sin quemar tú la cuota mientras auditas** y **sin romper la app ni la experiencia del usuario**.

## Principio: audita barato (no te desbordes en cuota)

- **Prioriza el análisis ESTÁTICO de código** (Grep/Read). Leer el código **no consume nada** de Firebase y revela casi todas las fugas.
- Verifica en vivo con `preview_network` **solo lo justo**: UN recorrido del flujo. **No recargues en bucle "para medir mejor"** — cada recarga son lecturas reales (y en producción, lecturas que el dueño paga).
- **Nunca dispares queries o listeners de prueba** contra colecciones grandes solo para observar. Observa el tráfico del recorrido normal.

## Patrones de fuga (búscalos en el código con Grep)

### 1. Listeners que nunca se cierran (la fuga clásica)
- `onSnapshot` / `addSnapshotListener` sin su `unsubscribe()`. En React: `useEffect` que abre un listener y **no retorna la función de limpieza** → cada montaje abre uno nuevo, se acumulan y siguen leyendo en segundo plano para siempre.
- Listener montado en un componente que se monta/desmonta seguido (modal, item de lista, fila) sin cleanup.
- **Cómo confirmar:** `grep onSnapshot` y revisa que **cada uno** tenga su unsubscribe en el cleanup del efecto. Si no lo tiene, es fuga.

### 2. Tiempo real donde bastaba una lectura
- `onSnapshot` para datos que casi no cambian (catálogo, configuración, perfil del negocio, lista de sedes) → debería ser `getDoc`/`getDocs` **una sola vez**. El tiempo real mantiene conexión y cobra una lectura por cada cambio.

### 3. Leer de más
- `getDocs(collection(...))` **sin `where`/`limit`** → baja la colección entera (1 lectura por documento). Mortal cuando la colección crece con el uso.
- **Falta de paginación**: listas largas sin `limit()` + cursor (`startAfter`).
- Bajar todos los documentos solo para **contarlos** → usar `getCountFromServer()` (1 lectura agregada) en lugar de traerlos todos.

### 4. N+1 (consulta dentro de un bucle)
- Traer una lista y luego un `getDoc` **por cada item** en un `.map`/`for`/`forEach`/`Promise.all(docs.map(...))` → N+1 lecturas.
- Se resuelve con `where(documentId(), 'in', [...])` (en lotes de 10/30) o **desnormalizando** el campo que se necesita en el documento padre.

### 5. Re-fetch innecesario
- Query en el cuerpo del render, o `useEffect` con dependencias mal puestas → se vuelve a leer en cada render.
- Fetch en **cada tecla** (búsqueda sin `debounce`) → una lectura por pulsación.
- No cachear lo que ya se tiene; volver a pedir lo mismo al navegar atrás/adelante entre pantallas.

### 6. Escrituras desperdiciadas
- `setDoc`/`updateDoc` **uno por uno en un bucle** en vez de `writeBatch`.
- Escribir en **cada cambio de input** en vez de al guardar.
- Listener que reacciona a su propia escritura y vuelve a escribir (bucle de escritura).

### 7. Doble suscripción / datos duplicados
- El mismo dato escuchado en dos componentes a la vez sin compartirlo (cada uno paga sus lecturas). Señala si debería centralizarse en un contexto/hook único.

## Cómo confirmar en vivo (económico)

- `preview_network` filtrando por Firestore (`firestore.googleapis.com`, peticiones `Listen`/`channel`/`documents`). Haz **una sola pasada** del flujo y mira:
  - ¿El número de lecturas es **desproporcionado** para lo que se ve? (abrir una pantalla = decenas de lecturas → sospecha de colección entera o N+1).
  - ¿Hay **peticiones idénticas repetidas** (re-fetch)?
  - ¿El canal de `Listen` **sigue activo tras salir** de la pantalla? → listener no cerrado.
- Una pasada basta para ver el patrón; **el resto se confirma leyendo el código**, no recargando.

## En apps en producción (modo producción)

- Observar tráfico **es lectura real que el dueño paga**: limita las pasadas al mínimo.
- **No dispares queries de prueba** contra colecciones grandes ni escribas datos de prueba (ver la regla de modo producción en `SKILL.md`).

## Severidad orientativa

- 🔴 **Listener sin cleanup que se acumula** (fuga que crece con cada uso), o **lectura de colección entera** sin límite que escala sin tope.
- 🟠 **N+1**, tiempo real donde sobra, falta de paginación en una lista que **ya** es larga.
- 🟡 Re-fetch evitable, falta de `debounce`, batch no usado en escrituras frecuentes.
- 🔵 Microoptimización sin impacto real todavía (colección pequeña que no va a crecer).

## Decisión a la medida (ejemplos)

- **Listener sin cleanup** → A) añadir `unsubscribe()` en el cleanup *(recomendada)* · B) cambiar a lectura única si no necesita tiempo real.
- **Colección entera** → A) `where` + `limit` + paginación *(recomendada)* · B) `getCountFromServer()` si solo es un conteo.
- **N+1** → A) `where(documentId(),'in', lotes)` *(recomendada)* · B) desnormalizar el campo que se necesita en el padre.
- **Búsqueda sin debounce** → A) añadir debounce de ~300ms *(recomendada)* · B) buscar solo al pulsar Enter/botón.

> Cada arreglo de fuga **no debe cambiar lo que la app hace ni su experiencia**: misma información en pantalla, mismo comportamiento; solo menos llamados. Si optimizar quitara tiempo real donde el usuario sí lo nota (un dato que debe verse al instante), no lo quites — déjalo como hallazgo informativo o baja la severidad.
