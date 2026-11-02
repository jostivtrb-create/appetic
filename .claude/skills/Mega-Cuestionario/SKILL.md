---
name: Mega-Cuestionario
description: Extrae del usuario la idea COMPLETA antes de construir nada, mediante una cadena de cuestionarios HTML que van de lo más grande a lo más fino, dejando cada decisión por escrito en una guía .md que sobrevive al chat. Sirve igual para una app nueva desde una idea suelta, para una actualización, o para un arreglo. Cada ronda se entrega como un archivo HTML oscuro (opciones marcables, campo de observaciones en cada pregunta, opción "No sé / decide tú", sección "cosas que quizá no pensaste" y botón que copia todo para pegarlo en el chat); las respuestas alimentan una "Guía para XXX.md" en la carpeta oculta .mega-cuestionario/ del proyecto, con decisiones cerradas, descartes, suposiciones y checklist. Cuando ya no queda nada que adivinar, construye directo. Úsala cuando el usuario diga "/Mega-Cuestionario", "hazme el cuestionario", "quiero crear una app/función y no tengo todo claro", "ayúdame a desarrollar esta idea", "antes de empezar pregúntame lo que necesites", "sigamos con el cuestionario", "retomemos la guía", o cuando vaya a empezar un proyecto, una función grande o un cambio importante con la idea a medias. GENÉRICA: funciona en cualquier proyecto del usuario.
---

# /Mega-Cuestionario — Sacarle la idea completa al usuario antes de construir

El usuario llega con una idea **a medias**. Si te pones a construir, adivinas; y lo que adivinas hay
que rehacerlo. Tu trabajo aquí **no es construir todavía**: es **exprimir la idea** con cuestionarios
HTML encadenados, de lo más grande a lo más fino, y dejarlo **todo por escrito** en una guía que no
depende de la memoria del chat.

Cuando ya no te quede nada que adivinar, **construyes directo**.

---

## ⚠️ LAS DOS LEYES

Todo lo demás de esta skill es negociable. Esto no.

### Ley 1 — LA PIRÁMIDE

> *"Si el primer cuestionario me pregunta si el valor va arriba en el panel de contabilidad, y luego
> resulta que ese panel no era necesario, se perdió el tiempo."* — el usuario

**Nunca preguntes el detalle de algo cuya existencia no esté confirmada.** Primero se decide **si
eso existe**; solo si sobrevive, una ronda posterior pregunta **cómo es por dentro**. Lo que se cae
en una ronda no gasta ni una pregunta más.

No son escalones fijos ni es cosa de "paneles" — **es un orden**: de lo grande a lo fino, sin
saltarse pasos. La skill es **adaptativa**: lo mismo sirve para retocar algo de una app existente
que para levantar una app entera desde una idea suelta. Lo que cambia es cuánto tardas en llegar
abajo, no el orden.

### Ley 2 — ANTI-RELLENO

> *"He notado que a veces pregunta cosas redundantes solo como por completar la tarea de hacer
> preguntas, y no preguntas que sí aporten."* — el usuario

**Jamás infles una ronda para llegar a un número.** Vale más una ronda de 4 preguntas buenas que una
de 15 con 6 de relleno. Si tienes 3 preguntas de verdad, entregas 3.

**La prueba de las 4 llaves.** Una pregunta entra solo si pasa las cuatro; si dudas, se borra:

1. **¿Su respuesta cambia lo que voy a construir?** Si da igual lo que conteste → fuera.
2. **¿Puedo responderla yo leyendo el código, la guía o el contexto?** Si sí → fuera, va como
   suposición anotada, no como pregunta.
3. **¿Es la misma pregunta que otra de esta ronda con otras palabras?** → fuera, se fusiona.
   *(El error clásico: "¿quieres que no sea redundante?" / "¿quieres que yo detecte lo redundante?" /
   "¿quieres una sección de redundantes?" — eso es UNA pregunta, no tres.)*
4. **¿Depende de algo aún no confirmado?** → fuera, se guarda para la ronda siguiente (Ley 1).

---

## El flujo

### Paso 0 · ¿Tarea nueva o retomar una?

Mira si existe `<proyecto>/.mega-cuestionario/`. Si hay guías con estado distinto de terminado,
**muéstrale la lista y pregúntale** si retoma una o abre otra tarea. Puede haber **varias tareas
abiertas a la vez**.

Si retoma: **lee la guía entera** y sigue exactamente donde quedó. La guía manda sobre tu memoria
del chat.

> Si el usuario invocó la skill, **es porque quiere el proceso**. Nunca le digas "esto es tan
> pequeño que no necesita cuestionario" — él ya sabe cuándo no invocarla. Lo que sí ajustas es el
> **tamaño**: una tarea chica puede ser una sola ronda de 4 preguntas.

### Paso 1 · Investiga ANTES de preguntar

Antes de escribir una sola pregunta, **estudia el proyecto a fondo**: estructura, stack, cómo están
hechas las pantallas parecidas, convenciones, modelo de datos, qué existe ya. Lee de verdad, no por
encima.

Todo lo que puedas averiguar tú **no se pregunta** (llave 2). Va a la guía como **suposición**, y
el usuario la desmiente si quiere. Preguntar lo que estaba en el código es la forma más rápida de
quemarle la paciencia.

Si el proyecto no existe todavía (idea desde cero), investiga igual lo que haya: referencias que
mencionó, proyectos suyos parecidos, el stack que suele usar.

### Paso 2 · Arma la ronda

- **Ronda 1: solo lo grande.** Qué es, para qué, para quién, qué partes tiene, qué queda fuera.
  Nada de colores, posiciones, textos ni campos.
- **Rondas siguientes:** cada una baja un escalón **sobre lo que la anterior dejó vivo**.
- **Sin preguntas fijas ni plantillas de preguntas.** Se inventan cada vez según la tarea: una
  batería fija es relleno disfrazado.
- **Sin número fijo de preguntas.** Ajusta al tamaño de la tarea, y pasa cada pregunta por las 4 llaves.
- Si una respuesta anterior **tumbó** una parte, dilo en el chat: *"como no hay X, me salto las
  preguntas que tenía sobre X"*. Que se note que no estás gastando su tiempo.

**Formato de cada pregunta** (`references/plantilla-cuestionario.html`):
opciones marcables con su explicación · **"🤷 No sé / decide tú"** · **"✏️ Otro"** ·
**campo de observaciones** · y una línea gris diciendo **por qué** la preguntas.

**Sección "💡 Cosas que quizá no pensaste"**: arriba, separada de las preguntas, con Sí / No /
Quizá **y campo de observaciones** por ítem — un "sí, pero solo si…" vale más que el Sí pelado, y
sin dónde escribirlo se pierde. Ahí van riesgos, cosas que se van a romper y funciones que faltan y
él no mencionó. Si no tienes nada **real** que aportar, va vacía — no la rellenes por tenerla.

### Paso 3 · Entrega el HTML

Copia la plantilla a `<proyecto>/.mega-cuestionario/Cuestionario-N-<Nombre>.html`, cambia **solo**
la zona de edición del `<script>` (`META`, `CERRADO`, `SUGERENCIAS`, `PREGUNTAS`) y **entrégaselo**.

Cómo se lo entregas depende de dónde estés corriendo. Averígualo antes, porque equivocarse aquí
deja al usuario esperando un archivo que nunca le llega:

- **En su computador** (Claude Code local, hay escritorio): ábrelo tú.
  ```bash
  xdg-open "<proyecto>/.mega-cuestionario/Cuestionario-N-<Nombre>.html"   # macOS: open
  ```
- **En la nube** (Claude Code web/móvil, GitHub Action, contenedor sin pantalla): **`xdg-open` no
  existe y no hay navegador**. Mándale el archivo con la herramienta de entrega de archivos que
  tengas (`SendUserFile` con `display:"render"`, o la que ofrezca el entorno) para que se abra en
  su pantalla. Si no tienes ninguna, **publícalo** con la herramienta de artefactos y pásale el
  enlace. Nunca te quedes solo con la ruta del archivo: en la nube esa ruta no la puede abrir.

Cómo saber dónde estás, sin preguntarle: si el proyecto se clonó en un contenedor efímero, o
`xdg-open`/`open` no existen (`command -v xdg-open`), estás en la nube.

En los dos casos, dile en dos líneas de qué va la ronda.

**En la nube, además, la carpeta `.mega-cuestionario/` se borra cuando muere el contenedor.** La
guía es el soporte escrito de todo — si se pierde, se pierde el trabajo. Así que **súbela al repo
con un commit** en cuanto la crees y en cada actualización. Los HTML de cada ronda no hace falta
subirlos: son desechables y se borran al terminar (Paso 7).

**Nunca borres el respaldo `execCommand`** del botón copiar: con `file://` Chrome bloquea
`navigator.clipboard` y sin el respaldo el botón no hace nada.

### Paso 4 · Recibe las respuestas y actualiza la guía

El usuario pega el texto copiado. Entonces, **antes de cualquier otra cosa**, actualiza la guía:
decisiones nuevas **con su porqué**, lo que se descartó y por qué, suposiciones, incógnitas que
quedan. Un "no sé / decide tú" se convierte en **suposición marcada**, nunca en pregunta repetida.

- **Si una respuesta contradice algo ya cerrado** → **párate**, avísale del choque y que elija cuál
  manda. No decidas tú por él ni lo dejes pasar.
- **Si contesta "decide tú" en casi todo** → si es **crítico**, insiste **una sola vez** con tu
  recomendación marcada; si es **menor**, decide y anótalo.

### Paso 5 · ¿Otra ronda?

Hazte **una sola pregunta**:

> **¿Puedo escribir esto sin inventarme nada?**

- **No** → otra ronda, con lo que falte. Sin topes ni cuotas.
- **Sí** → **se acabaron las preguntas.** Una ronda de más por si acaso es exactamente el relleno de
  la Ley 2. Dilo claro: *"con esto no me queda nada que adivinar, no hago otra ronda"*.

### Paso 6 · Construye

Escribe en la guía el **plan paso a paso con checklist**, suelta un **resumen corto** de lo que vas
a hacer y **arranca sin esperar respuesta** (él frena si quiere).

Mientras construyes, **la guía es un documento vivo**:

- vas marcando el checklist según avanzas,
- anotas los problemas que te encontraste y **cómo los resolviste**,
- anotas lo que tuviste que decidir **sobre la marcha** sin preguntarle.

### Paso 7 · Cierre

Cuando la tarea termina: **la guía se queda** (es la historia de por qué las cosas son como son) y
**los HTML se borran** — ya no sirven de nada respondidos. Marca la guía como terminada.

---

## Cómo preguntar

- **Español, directo, sin jerga.** Si tienes que usar un término técnico, explícalo en la línea gris.
- **Opciones antes que campos en blanco**: se responde mucho más rápido marcando que escribiendo.
- **Que cada opción diga qué implica elegirla.** Una lista de opciones sin consecuencias no ayuda a
  decidir.
- **Recomienda cuando tengas criterio.** No le sueltes un menú neutro y que se las arregle.
- **Nada de preguntas de trámite.** Si la respuesta no te cambia nada, no la hagas.

## Archivos

```
<proyecto>/.mega-cuestionario/
├── Guía para <tarea>.md              ← una por tarea, sobrevive; es el soporte escrito
└── Cuestionario-N-<Nombre>.html      ← una por ronda, se borra al terminar
```

- `references/plantilla-cuestionario.html` — el HTML probado. Solo se toca la zona de edición.
- `references/plantilla-guia.md` — la estructura de la guía.

Para revisar el HTML antes de entregarlo puedes añadir al `.claude/launch.json` del proyecto un
servidor estático apuntando a `.mega-cuestionario` y verlo con las herramientas de preview.
