# Plantilla del documento de auditoría (worklog vivo)

El documento vive en `.auditoria/<flujo>.md` (kebab-case del flujo). Es la memoria de la auditoría: se va vaciando a medida que las cosas se resuelven, y se borra cuando no queda nada.

## Cómo usar esta plantilla

- Crea el archivo con esta estructura exacta al terminar de auditar (Paso 7).
- Cada hallazgo es un bloque con id (`H1`, `H2`, …), severidad y **mini-cuestionario**.
- Cuando un hallazgo se **arregla** o se **descarta**, **elimina su bloque completo** y renumera si quieres (o deja los ids; lo importante es que el resuelto desaparezca).
- Actualiza siempre la línea de estado (fecha + conteo) tras cada cambio.
- Cuando la lista de hallazgos quede vacía → **borra el archivo** (y la carpeta `.auditoria/` si quedó vacía).

## El mini-cuestionario (decisión a la medida de cada hallazgo)

Cada hallazgo es un **punto de una lista de tareas**, y termina con una **decisión a tomar**. La clave: **no son siempre las mismas preguntas**. Para cada hallazgo, *piensa* en las formas reales de resolverlo según tu análisis y ofrece **opciones a la medida** — los caminos concretos que tienen sentido para *ese* problema. El usuario elige una y tú actúas.

Cómo construir la decisión de cada hallazgo:

- Mira el hallazgo y pregúntate: *¿cuáles son las maneras razonables de resolver esto?* Normalmente hay 2–4: distintos enfoques de arreglo (rápido vs. completo, distintas soluciones técnicas), o arreglar vs. quitar la feature a medias, etc. Esas son tus opciones.
- **Siempre** deja, además, estas dos salidas universales (aunque no las escribas largas): **🗑️ Eliminar** (no es problema real / decisión de diseño → se borra el punto sin tocar código) y **⏭️ Dejar pendiente** (no se hace ahora → el punto se queda para después).
- Si una opción es claramente la más sensata, márcala como *(recomendada)* y di por qué en una línea.
- Las opciones salen del **análisis**, no de una plantilla fija. Para un `alert()` feo las opciones son sobre toast/silenciar; para una feature a medias son completar/quitar; para un riesgo de robustez son qué salvaguarda poner. No fuerces opciones que no aplican.

Resultado de la decisión sobre el documento:
- El usuario elige **arreglar de la forma X** → aplicas ese fix, verificas, y **eliminas el punto**.
- Elige **🗑️ Eliminar** → **eliminas el punto** (no se arregla nada).
- Elige **⏭️ Dejar pendiente** → **el punto SE QUEDA** (esto hace la auditoría retomable).

Formato del bloque de decisión en el documento (las opciones A/B/… las redactas tú según el hallazgo):

```
- **Decisión:** <pregunta corta a la medida de este hallazgo>
  - A) <camino de arreglo concreto> *(recomendada — por qué)*
  - B) <otro camino de arreglo, o "quitar la feature">
  - …las que tengan sentido…
  - 🗑️ Eliminar (no es problema) · ⏭️ Dejar pendiente
  - 📝 Nota:
```

## Estructura completa del archivo

Usa exactamente esta forma:

```markdown
# Auditoría: <flujo> — <proyecto>

> Documento de trabajo de la skill /auditoria. Cada hallazgo trae un mini-cuestionario:
> marca una opción (o dímelo en el chat). Lo que se arregla o se descarta se elimina de aquí.
> Cuando no quede ningún hallazgo, este archivo se borra solo.

- **Estado:** EN PROGRESO
- **Modo:** app nueva | producción (en uso — no se crean datos reales)
- **Rol / persona auditada:** <quién>
- **Iniciada:** <YYYY-MM-DD>
- **Última actualización:** <YYYY-MM-DD>
- **Pendientes:** 🔴 N · 🟠 N · 🟡 N · 🔵 N

## Resumen
<2-4 líneas: ¿el flujo sirve? ¿funciona el camino feliz? ¿lo más grave? Veredicto honesto.>

## Qué se probó
- Persona simulada: <quién y con qué objetivo>
- Recorridos: <camino feliz / casos torcidos / verificación> (o lo que se pudo)
- Entornos: <escritorio / móvil 375x812 / modo oscuro>
- Acceso usado: <cuenta de prueba / bypass dev / sin login (flujo público)>
- Limitaciones: <lo que NO se pudo probar y por qué — honestidad>

## Lo que está bien
- <reconoce lo que funciona y se ve bien; honesto, no relleno>

## Hallazgos pendientes

### H1 · 🔴 Crítico · <título corto>
- **Qué pasa:** <descripción>
- **Dónde:** <archivo:línea / pantalla>
- **Por qué importa para <persona>:** <impacto real>
- **Evidencia:** <error de consola / petición fallida / "ver captura del paso N en el chat">
- **Decisión:** <pregunta a la medida de ESTE hallazgo, con opciones sacadas del análisis>
  - A) <camino de arreglo concreto> *(recomendada — por qué)*
  - B) <otro camino de arreglo distinto>
  - 🗑️ Eliminar (no es problema) · ⏭️ Dejar pendiente
  - 📝 Nota:

### H2 · 🟠 Alto · <título corto>
- **Qué pasa:** ...
- **Dónde:** ...
- **Por qué importa para <persona>:** ...
- **Decisión:** ...
  - <opciones a la medida...>
  - 🗑️ Eliminar · ⏭️ Dejar pendiente
  - 📝 Nota:

<...más hallazgos, ordenados de mayor a menor severidad...>
```

### Ejemplo real de decisión a la medida

Para un hallazgo "errores de login con `alert()` y el popup-closed-by-user muestra un error feo", la decisión NO es "arreglar/eliminar/pendiente" a secas, sino algo como:

```
- **Decisión:** ¿Cómo manejamos los errores de login?
  - A) Reemplazar alert() por el toast de la app **y** silenciar popup-closed-by-user *(recomendada — resuelve estética y el falso error)*
  - B) Solo silenciar popup-closed-by-user, dejar el resto con alert()
  - C) Solo cambiar a toast, mantener el aviso al cerrar el popup
  - 🗑️ Eliminar · ⏭️ Dejar pendiente
  - 📝 Nota:
```

Para "login con Apple a medias", las opciones serían **completar el botón de Apple** vs **quitar el código de Apple** — caminos propios de ESE hallazgo. Cada punto se piensa así.

## Notas de mantenimiento

- **Orden:** siempre de mayor a menor severidad (🔴 → 🟠 → 🟡 → 🔵).
- **No infles:** si no hay hallazgos de una severidad, no inventes.
- **Al cerrar todo:** el archivo se borra. No dejes un documento vacío "por si acaso" — el objetivo explícito del usuario es no dejar archivos basura. Si quiere historial, ofréceselo aparte; por defecto, borra.
