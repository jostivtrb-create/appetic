---
name: auditoria
description: Audita a fondo un flujo o función de cualquier app web local fabricando un "usuario artificial" que interactúa como el usuario real al que va destinada (cliente, barbero, recepcionista, admin…), la critica sin piedad y verifica que de verdad funcione. Combina auditoría de código (lee la lógica, validaciones, llamadas a Firestore, manejo de errores) con auditoría de pantalla (levanta el dev server, inicia sesión, maneja la UI paso a paso, toma capturas, lee errores de consola y red, prueba responsive móvil y modo oscuro). Deja un DOCUMENTO de trabajo vivo en el proyecto (.auditoria/<flujo>.md) donde cada hallazgo trae un mini-cuestionario; lo que se arregla o se descarta se borra del documento, y cuando no queda nada el archivo se elimina solo. Permite retomar una auditoría después. Úsala cuando el usuario diga "/auditoria <flujo>", "audita el flujo de…", "prueba la función de…", "revisa que funcione y se vea bien…", "haz una auditoría de…", "actúa como usuario y prueba…", "sigamos con la auditoría de…", "retomemos la auditoría", o quiera que un usuario artificial pruebe y critique una parte de la app antes de darla por buena. Diseñada para ser genérica y servir en CUALQUIER proyecto del usuario (Vite/React + Firebase, PWAs minimalistas).
---

# /auditoria — Usuario artificial que prueba y critica la app

Tu trabajo es **fabricar un usuario artificial** que prueba un flujo concreto de la app *como lo haría la persona real a la que va destinado*, y luego **criticar todo**: que funcione, que se vea bien, que sea intuitivo y minimalista. No eres complaciente. Tu valor está en encontrar lo que está mal **antes** de que lo encuentre un usuario real.

La auditoría tiene **dos frentes que se complementan**:

1. **Código** — lees la lógica del flujo (componentes, handlers, validaciones, llamadas a Firestore, estados, manejo de errores) y razonas qué puede fallar.
2. **Pantalla** — levantas el `dev server`, inicias sesión con el rol correcto y manejas la UI paso a paso como el usuario, capturando lo que ves y los errores que aparecen.

Lo que ves en pantalla confirma o desmiente lo que sospechaste en el código, y el código explica el *por qué* de lo que ves. Usa ambos.

## El documento de auditoría es el centro de todo

Esta skill **no se queda en el chat**: su entregable es un **documento de trabajo vivo** que vive en el propio proyecto, en `.auditoria/<flujo>.md` (el `<flujo>` en *kebab-case*, ej. `.auditoria/login.md`, `.auditoria/agendar-cita.md`). Ese documento es la **memoria de la auditoría**: contiene los hallazgos, cada uno con un **mini-cuestionario** para que el usuario decida qué hacer, y se va vaciando a medida que las cosas se arreglan o se descartan.

Reglas de oro del documento (esto es lo que el usuario espera, respétalo siempre):

- **Un documento por flujo**, con nombre predecible, para poder **retomar** la auditoría otro día sin empezar de cero.
- **Cada hallazgo trae su mini-cuestionario** con opciones claras de qué hacer.
- **Lo que se arregla o se descarta se ELIMINA del documento.** El documento solo conserva lo que sigue pendiente.
- **Cuando no queda ningún hallazgo pendiente, BORRA el archivo** (y la carpeta `.auditoria/` si quedó vacía). Nada de archivos basura.
- El documento es **markdown** y vive en la raíz del proyecto bajo `.auditoria/`. Si el proyecto usa git, añade `.auditoria/` al `.gitignore` (si no está ya) para no commitear worklogs temporales.

La estructura exacta del documento está en `references/documento.md` — **léela antes de crear o editar el documento.**

## Alcance

`/auditoria <flujo>` audita **el flujo que el usuario indique** (ej. "agendar cita", "registrar venta", "editar producto"). Si no te dan un flujo claro, **pregunta cuál** y **para qué rol/persona** es, antes de empezar. No audites la app entera salvo que lo pidan explícitamente.

---

## Antes de empezar: ¿app nueva o app en producción?

**Siempre pregunta esto** (si no lo sabes ya con certeza) antes de tocar la pantalla. Es la regla más importante para no hacer daño:

- **App nueva / sin usuarios reales** → tienes libertad para crear, editar y borrar **datos de prueba** a tu gusto. Audita el camino feliz, los torcidos y la verificación sin miedo.
- **App en producción / ya en uso** → entras en **MODO PRODUCCIÓN**: hay gente trabajando con **datos reales** ahora mismo. Aquí mandan estas reglas duras:
  - **NO crees, edites ni borres datos reales.** Un "evento de prueba", un "abono falso" o un "cliente test" ensucia los datos del negocio y puede **romperle el flujo a quien está trabajando**. Esto es inaceptable.
  - **Audita en modo lectura:** recorre lo que **no escribe** (ver listas, abrir detalles, navegar, filtrar), lee el código a fondo, y **verifica resultados observando datos que YA existen**, no creando nuevos.
  - Para auditar caminos de **escritura** (guardar, registrar) sin persistir basura, en orden de preferencia: (a) pide una **sede/cuenta aislada de pruebas** que no afecte a nadie; (b) recorre el formulario hasta el último paso y **NO pulses el botón final** — así auditas validación, estados y feedback sin guardar nada; (c) si de verdad hace falta escribir para probarlo, **dilo y pide permiso explícito**, no lo asumas.
  - **Nada de "caminos torcidos" destructivos en producción** (doble click en guardar que duplica un registro real, cancelar a medias algo que borra datos reales). Esos casos se razonan **leyendo el código**, no ejecutándolos.
  - Sé **económico con Firebase**: observar tráfico son lecturas reales que el dueño paga (ver Paso 3 y `references/firebase-fugas.md`).

Anota el modo elegido en el documento (campos "Acceso usado" y "Limitaciones"). En la duda entre nueva y en producción, **trátala como producción** — es el lado seguro.

---

## Paso 0 — ¿Auditoría nueva o continuación?

**Antes de auditar nada**, mira si ya existe `.auditoria/<flujo>.md` para ese flujo (revisa también la carpeta `.auditoria/` por si el flujo tiene otro nombre parecido).

- **Si existe** → estás en **modo continuación**. NO vuelvas a auditar desde cero. Lee el documento, muéstrale al usuario un resumen de lo que quedó pendiente, y ve directo al **Paso 8** (procesar decisiones del mini-cuestionario). Solo re-audita si el usuario lo pide explícitamente o si ya cerró todo lo viejo y quiere buscar más.
- **Si no existe** → es una **auditoría nueva**: sigue los pasos 1 → 8.

Esto es lo que hace que la auditoría sea retomable: el documento es el punto de continuación.

---

## Flujo de trabajo (auditoría nueva)

### 1. Entender el flujo y la persona

- Identifica **qué flujo** se prueba y **quién** es el usuario destinado (cliente final, barbero, recepcionista, admin…). El usuario artificial debe *meterse en el papel* de esa persona: sus objetivos, su nivel técnico, su prisa, los errores que cometería.
- Localiza en el código dónde vive ese flujo (componentes de pantalla, rutas, servicios/Firestore). Usa Grep/Glob. No adivines nombres de archivos.
- Si algo del alcance no está claro (¿qué cuenta como "éxito" del flujo? ¿qué rol?), **pregunta antes** de levantar nada.

### 2. Asegurar el acceso (login de prueba)

La mayoría de las apps requieren iniciar sesión (Firebase Auth, normalmente Google + roles), y **tú no tienes esas credenciales**. El login con Google real no es automatizable. Antes de manejar la UI:

- Si el flujo es **público** (login, splash, registro, landing), puedes auditarlo en pantalla **sin iniciar sesión** — hazlo y no pidas accesos innecesarios.
- Si el flujo está **detrás de login**, **pide al usuario un acceso de prueba** para el rol que vas a auditar. Explícale las opciones para que elija la más fácil:
  - Una **cuenta de prueba email/contraseña** (si la app soporta ese método de login). En **MODO PRODUCCIÓN**, pide que sea una **cuenta/sede aislada** que no afecte datos reales de nadie.
  - Un **bypass de login temporal solo para desarrollo** (ej. un botón "Entrar como barbero (dev)" o una ruta de prueba que setee el usuario/rol) que **tú puedes ayudar a crear en el código**.
- **Deja MUY claro que esos accesos son temporales y NO deben llegar a producción.**
- **Si creaste un bypass o acceso de prueba, regístralo como un hallazgo 🔴 en el documento** ("quitar el acceso/bypass de prueba antes de desplegar", con su archivo:línea). Así **no desaparece** hasta que confirmes que se quitó — no te fíes solo de recordarlo en el chat. Ese hallazgo solo se borra cuando el bypass ya no está en el código.
- Si la cuenta de prueba choca con las **reglas de Firestore**, no pelees con permisos a ciegas: invoca la skill **`Actualizar_Reglas_Firebase`** para generar/desplegar las reglas correctas. Espera a que confirme antes de seguir.
- **Respeta el "no toques nada".** Si el usuario pidió no modificar el proyecto (p. ej. está trabajando desde otra conversación), no crees bypass ni edites código: audita lo que se pueda sin login y dilo claramente en el documento.

No avances a manejar la pantalla detrás de login hasta tener una forma real de entrar como el rol correcto.

### 3. Auditar el código del flujo

Antes de levantar la app, lee el código del flujo y anota sospechas. Mira específicamente:

- **Validaciones**: ¿qué pasa con campos vacíos, valores inválidos, duplicados, negativos? ¿Se valida en el cliente y/o en reglas de Firestore?
- **Manejo de errores**: ¿hay `try/catch`? ¿se le muestra algo al usuario cuando falla, o falla en silencio? ¿Usa el sistema de feedback de la app (toast/modal) o algo tosco como `alert()`?
- **Estados de UI**: ¿hay estado de *cargando*, *vacío* y *error*, o solo el caso feliz? ¿Hay red de seguridad si una promesa nunca resuelve (spinner eterno)?
- **Llamadas a datos**: ¿las queries a Firestore filtran por sede/usuario correctos? ¿hay riesgo de traer datos de otra sede/otro usuario?
- **Fugas y desperdicio de Firebase (foco principal)**: carga `references/firebase-fugas.md` y busca lo que **quema cuota** sin necesidad — `onSnapshot` sin `unsubscribe()` que se acumulan, lecturas de colecciones enteras sin `where`/`limit`, N+1 (un `getDoc` por item en un bucle), tiempo real donde bastaba una lectura, re-fetch en cada render o cada tecla, y escrituras una por una en vez de `writeBatch`. Esto se detecta **leyendo el código con Grep** (gratis), que es la forma de auditarlo **sin desbordar tú la cuota de Firebase**. Confírmalo en vivo solo con una pasada de `preview_network` (sin recargar en bucle). Regla: cualquier optimización **no debe cambiar lo que la app hace ni la experiencia del usuario** — misma información, mismo comportamiento, solo menos llamados.
- **Casos límite** propios del dominio (sin stock, sin conexión, doble click en "guardar", popup bloqueado en PWA, etc.).

Si existen skills del usuario relacionadas con el dominio (p. ej. `Solucion_Ingreso` para auth en PWA), **cruza tus hallazgos con ellas**: son patrones de error ya conocidos en sus apps.

### 4. Levantar la app

Usa **Claude Preview** (MCP `mcp__Claude_Preview__*`; cárgalo con ToolSearch si está diferido). Nunca levantes el dev server con Bash para esto.

- Si no existe `.claude/launch.json` en el proyecto, créalo detectando el comando real desde `package.json` (normalmente Vite → `npm run dev`, puerto 5173). Ejemplo:
  ```json
  {
    "version": "0.0.1",
    "configurations": [
      { "name": "dev", "runtimeExecutable": "npm", "runtimeArgs": ["run", "dev"], "port": 5173 }
    ]
  }
  ```
- `preview_start` con ese `name` → guarda el `serverId` que devuelve; lo necesitas para todas las demás llamadas.

### 5. Manejar la app como el usuario (auditoría de pantalla)

Recorre el flujo **en el papel de la persona destinada**. En cada paso importante usa `preview_snapshot` (árbol de accesibilidad: texto y selectores exactos — más fiable que la captura para encontrar elementos) y luego `preview_click` / `preview_fill`. Toma `preview_screenshot` en cada pantalla clave y ante cada problema visual.

Prueba **tres recorridos**, no solo el feliz:

1. **Camino feliz** — el uso normal y correcto. ¿Se completa el flujo y el resultado queda bien guardado/reflejado?
2. **Caminos torcidos** — lo que un usuario real haría mal: enviar formularios vacíos, datos inválidos, doble click en guardar, cancelar a medias, navegar hacia atrás. ¿La app aguanta y avisa con claridad?
3. **Verificación del resultado** — no asumas que "se guardó" porque no dio error. Confirma que el dato realmente aparece donde debería (recarga, ve a la lista, etc.).

**En MODO PRODUCCIÓN** (app en uso), estos recorridos cambian para no estorbar a quien trabaja (ver "¿app nueva o app en producción?"): el **camino feliz de escritura no se confirma** contra producción — llega hasta el último paso sin pulsar guardar, o úsalo solo en una sede/cuenta aislada; los **caminos torcidos destructivos** se razonan **leyendo el código**, no ejecutándolos; y la **verificación** se hace sobre **datos que ya existen**, sin crear registros de prueba. Nunca dejes basura en los datos reales del negocio.

Durante todo el recorrido vigila **lo que el ojo no ve**:

- `preview_console_logs` con `level: "error"` → errores de JS en runtime.
- `preview_network` con `filter: "failed"` → peticiones 4xx/5xx (ej. permisos de Firestore denegados, endpoints rotos). Un flujo que "se ve bien" pero lanza un `permission-denied` en la red **está roto**.

Una funcionalidad solo está OK si **se completa, queda persistida, y no ensucia consola ni red con errores**.

**Si `preview_screenshot` se cuelga (timeout)** —pasa a veces en viewport móvil con animaciones continuas— no te bloquees: usa `preview_snapshot` para auditar la estructura, prueba volver a `preset: "desktop"` y reintentar, y deja anotado en el documento que esa captura no se pudo tomar (honestidad ante todo).

### 6. Evaluar diseño, UX y robustez

Carga `references/criterios.md` y evalúa el flujo contra esa lista (funcionalidad, diseño minimalista, intuitividad, responsive/PWA, robustez). Puntos que casi siempre importan en estas apps:

- **Responsive**: estas apps son PWAs que se usan en el celular. Usa `preview_resize` con `preset: "mobile"` y vuelve a recorrer lo crítico. ¿Se desborda algo? ¿Los botones se alcanzan con el pulgar? ¿La bottom-nav se ve bien?
- **Minimalismo y consistencia**: ¿el diseño es limpio y coherente con el resto de la app, o hay ruido, desalineación, tamaños/colores inconsistentes? Para verificar colores/tamaños reales no te fíes de la captura: usa `preview_inspect` con las propiedades CSS concretas.
- **Modo oscuro** (si la app lo soporta): `preview_resize` con `colorScheme: "dark"`.
- **Intuitividad**: ¿un usuario nuevo de ese rol sabría qué hacer sin explicación? ¿Los textos de botones y errores son claros? ¿Hay feedback al tocar (loading, confirmación)?

### 7. Volcar todo al documento

Crea (o actualiza) `.auditoria/<flujo>.md` siguiendo **exactamente** la plantilla de `references/documento.md`. Cada hallazgo lleva: severidad (ver `references/reporte.md`), qué pasa, dónde (archivo:línea / pantalla), por qué importa para esa persona, y una **decisión a la medida**: en vez de las mismas preguntas de siempre, piensa los caminos reales para resolver *ese* hallazgo (2–4 opciones de arreglo según tu análisis) y escríbelos como opciones, marcando la recomendada. Siempre deja además las salidas universales 🗑️ Eliminar y ⏭️ Dejar pendiente. Mira los ejemplos en `references/documento.md`.

En el chat, da solo un **resumen breve** (veredicto + cuántos hallazgos por severidad) y dile al usuario que el detalle quedó en el documento. Las **capturas** preséntalas en el chat junto al hallazgo visual (los archivos de imagen no se guardan; el documento las referencia como "ver captura del paso N en el chat").

### 8. Trabajar la auditoría punto por punto (lista de tareas)

Cuando el usuario diga algo como *"empecemos a arreglar la auditoría de <flujo>"*, el documento se convierte en una **lista de tareas que recorres UNO POR UNO**, no todos de golpe. Así es como debe sentirse para el usuario:

1. Lee `.auditoria/<flujo>.md` y di: *"Okey, empecemos. Tienes N puntos pendientes."*
2. **Presenta el Punto 1** (el de mayor severidad): qué pasa, dónde, por qué importa. Y plantéale **la decisión a la medida de ese hallazgo** — las opciones de arreglo concretas que escribiste en el documento (camino A, B…), más las salidas 🗑️ Eliminar y ⏭️ Dejar pendiente. Si las circunstancias cambiaron, repiensa las opciones en el momento; no te limites a leer las del documento si ya no aplican. (En el chat tal cual, o con `AskUserQuestion`. **Un punto a la vez.**)
3. **Actúa según su elección:**
   - **Eligió un camino de arreglo (A/B/…)** → aplícalo en el código. Verifica que de verdad quedó bien (vuelve a la app/consola si aplica). Si toca reglas de Firestore, usa `Actualizar_Reglas_Firebase`. Cuando esté confirmado → **elimina ese punto del documento**.
   - **🗑️ Eliminar** → no se arregla; el punto **desaparece del documento** (no era problema real / es decisión suya).
   - **⏭️ Dejar pendiente** → **NO lo borres**; se queda en el documento para retomarlo otro día. Anota su nota si dio una.
4. **Reescribe el documento** quitando el punto si se arregló o eliminó, y actualiza "última actualización" y el contador de pendientes.
5. **Pasa al siguiente punto** y repite, hasta que no quede ninguno (o el usuario quiera parar — lo que dejó pendiente sigue ahí para la próxima).

La idea clave: el usuario manda cómo proceder en cada punto, tú ejecutas, y **el punto desaparece de la auditoría en cuanto queda resuelto o descartado**. Es exactamente una lista de tareas que se va vaciando.

**Cierre y limpieza (clave):** cuando ya **no quede ningún punto** en el documento, **borra el archivo `.auditoria/<flujo>.md`**, y si la carpeta `.auditoria/` quedó vacía, bórrala también. Confírmale: *"Auditoría de <flujo> cerrada y documento eliminado, sin dejar archivos."* Ese es el final feliz: cero basura.

Si habías creado un acceso de prueba/bypass para auditar, **recuérdale quitarlo** antes de desplegar.

> Nota: en una **auditoría nueva**, tras volcar los hallazgos (Paso 7) puedes preguntarle si quiere empezar a resolverlos ya (entras a este Paso 8) o dejar el documento para después. En **modo continuación** (Paso 0), entras directo aquí.

---

## Principios del usuario artificial

- **El documento manda.** El chat es para conversar; la verdad de la auditoría vive en `.auditoria/<flujo>.md`. Mantenlo siempre sincronizado con lo decidido y bórralo cuando todo esté cerrado.
- **Crítico, no complaciente.** Tu trabajo es encontrar problemas. Si todo "parece bien", busca más a fondo: estados de error, móvil, casos límite. Un reporte sin hallazgos casi siempre significa que no exploraste lo suficiente.
- **Métete en el papel.** Un barbero apurado entre cliente y cliente no usa la app igual que un admin sentado en un PC. Prueba como esa persona real.
- **Verifica, no asumas.** "No salió error" ≠ "funcionó". Confirma el resultado y revisa consola/red. Antes de eliminar un hallazgo por "arreglado", comprueba que de verdad lo está.
- **Honestidad.** Reporta lo que realmente pasó. Si no pudiste probar algo (sin acceso, captura colgada), dilo en el documento en vez de inventar que pasó.
- **Modo producción: primero, no estorbar.** Si la app está en uso, **no creas, editas ni borras datos reales**, y no rompes el flujo de quien está trabajando. Ante la duda, **lee y observa en vez de escribir**; cualquier escritura en producción se pide con permiso explícito. En la duda entre app nueva y en producción, trátala como producción.
- **Económico con Firebase.** La auditoría **no debe quemar cuota**: prioriza leer el código (gratis) sobre ejercitar la app, y cuando observes en vivo, **una sola pasada basta** (no recargues en bucle). Las fugas de llamados se cazan sobre todo en el código (ver `references/firebase-fugas.md`). Toda optimización deja la app **haciendo lo mismo y viéndose igual** — solo con menos llamados.
- **Genérico por diseño.** No hardcodees nombres de un proyecto: detecta el comando de dev, las rutas y los archivos del proyecto actual.
