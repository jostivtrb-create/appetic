# Plantilla del documento de Mejora_Visual (worklog vivo)

El documento vive en `.mejora-visual/<pantalla>.md` (kebab-case de la pantalla). Es la memoria de la mejora: contiene hallazgos de las **dos lentes** —🧭 Organización (estructura/UX) y 🎨 Piel (estética/animación)— mezclados en una sola lista. Se va vaciando a medida que las cosas se aplican o se descartan, y se borra cuando no queda nada.

## Cómo usar esta plantilla

- Crea el archivo con esta estructura exacta al terminar de analizar (Paso 5).
- Cada hallazgo es un bloque con id (`M1`, `M2`, …), **dimensión (🧭/🎨)**, severidad y **decisión a la medida**.
- Cuando un hallazgo se **aplica** o se **descarta**, **elimina su bloque completo**.
- Actualiza siempre la línea de estado (fecha + conteo) tras cada cambio.
- Cuando la lista quede vacía → **borra el archivo** (y la carpeta `.mejora-visual/` si quedó vacía).

## Las dos dimensiones (etiqueta cada hallazgo)

- 🧭 **Organización** — disposición, jerarquía, agrupación, orden, flujo, fricción, densidad, responsive. *(¿dónde va cada cosa, cuesta encontrar/usar algo?)*
- 🎨 **Piel** — color (dentro de la paleta), animación (viva pero leve), micro-feedback. *(¿se ve plano/muerto/saturado, falta vida o limpieza?)*

Un hallazgo puede ser claramente de una lente; si toca las dos (ej. "el espaciado no separa los grupos"), trátalo como **estructura** (🧭) si el problema es de agrupación/jerarquía, o como **piel** (🎨) si es de ritmo/estética pura. No lo dupliques.

## La decisión a la medida de cada hallazgo

Cada hallazgo es un **punto de una lista de tareas** que termina con una **decisión**. La clave: **no son siempre las mismas opciones**. Para cada hallazgo, *piensa* las formas reales de resolverlo y ofrece **caminos concretos** — los que tienen sentido para *ese* problema. El usuario elige uno y tú actúas.

Cómo construir la decisión:
- Pregúntate: *¿cuáles son las maneras razonables de mejorar esto?* Normalmente 2–4: enfoques distintos (sutil vs. más marcado; recolocar vs. reagrupar vs. revelar progresivamente; distintas técnicas CSS), reestructuración leve vs. grande, o aislar vs. aplicar global si toca código compartido.
- **Siempre** deja dos salidas universales: **🗑️ Descartar** (es gusto / no es mejora real → se borra el punto) y **⏭️ Dejar pendiente** (no se hace ahora → se queda).
- Si una opción es la más sensata, márcala *(recomendada)* y di por qué en una línea.
- **Si toca código compartido o es una reestructuración grande**, dilo en el bloque y haz que una opción contemple **aislar** vs **global**, o **leve** vs **grande**.
- **Siempre** nombra **qué función NO debe romperse** al tocar ese elemento (su handler, condicional, key) — el seguro contra romper al mover/animar.

Resultado sobre el documento:
- Elige un camino → aplicas (solo presentación), verificas función + mejora, y **eliminas el punto**.
- **🗑️ Descartar** → **eliminas el punto** (no se aplica nada).
- **⏭️ Dejar pendiente** → **el punto SE QUEDA** (esto hace la mejora retomable).

Formato del bloque de decisión (las opciones A/B/… las redactas tú según el hallazgo):

```
- **Decisión:** <pregunta corta a la medida de este hallazgo>
  - A) <camino concreto> *(recomendada — por qué)*
  - B) <otro camino, o "reestructuración más grande", o "aislar solo para esta pantalla">
  - …las que tengan sentido…
  - 🗑️ Descartar (es gusto) · ⏭️ Dejar pendiente
  - 📝 Nota:
```

## Estructura completa del archivo

Usa exactamente esta forma:

```markdown
# Mejora de pantalla: <pantalla> — <proyecto>

> Documento de trabajo de la skill /Mejora_Visual. Cada hallazgo trae su dimensión (🧭 organización / 🎨 piel)
> y una decisión: marca una opción (o dímelo en el chat). Lo que se aplica o se descarta se elimina de aquí.
> Cuando no quede ningún hallazgo, este archivo se borra solo.
> Solo se toca la presentación (disposición + piel) — nunca la lógica.

- **Estado:** EN PROGRESO
- **Pantalla / para quién:** <pantalla — cliente final / gestor / admin>
- **Tarea principal del usuario aquí:** <qué viene a hacer; las secundarias>
- **Iniciada:** <YYYY-MM-DD>
- **Última actualización:** <YYYY-MM-DD>
- **Pendientes:** 🟠 N · 🟡 N · 🔵 N · ✨ N (oportunidades)

## Sensación general
<2-4 líneas: ¿cómo se ve y se usa hoy? ¿La acción principal se encuentra sola? ¿Plana/muerta, saturada, desordenada, dispersa, o correcta-pero-mejorable? Honesto.>

## Qué se revisó
- Entornos: escritorio · móvil (375×812) · <modo oscuro si aplica>
- Tokens/paleta detectados: <colores/spacing/sombras que se respetan>
- Patrones de layout de la app: <cómo organiza otras pantallas parecidas>
- Acceso usado: <sin login (pública) / cuenta de prueba / bypass dev / localStorage>
- Limitaciones: <lo que NO se pudo ver y por qué — honestidad>

## Lo que ya está bien
- <reconoce lo limpio/ordenado/vivo que ya funciona; honesto, no relleno. Evita cambiar por cambiar.>

## Mejoras pendientes

### M1 · 🧭 Organización · 🟠 Alto · <título corto>
- **Qué está mal:** <descripción de lo que cuesta usar / lo que chirría>
- **Por qué:** <el principio que se rompe — jerarquía invertida, elementos dispersos, fricción, sobrecarga, desbordado, plano/muerto, saturado…>
- **Dónde:** <archivo:línea / pantalla / componente>
- **Compartido:** <No / Sí — también lo usan: pantallas X, Y>
- **Función a NO romper:** <handler/condicional/key que el elemento lleva y debe sobrevivir>
- **Evidencia:** <orden del DOM (snapshot) / medición CSS / "ver captura del paso N en el chat">
- **Decisión:** <pregunta a la medida>
  - A) <camino concreto> *(recomendada — por qué)*
  - B) <otro camino, o aislar vs global si es compartido>
  - 🗑️ Descartar (es gusto) · ⏭️ Dejar pendiente
  - 📝 Nota:

### M2 · 🎨 Piel · 🟡 Medio · <título corto>
- **Qué está mal:** ...
- **Por qué:** ...
- **Dónde:** ...
- **Compartido:** ...
- **Función a NO romper:** ...
- **Decisión:** ...
  - <opciones a la medida...>
  - 🗑️ Descartar · ⏭️ Dejar pendiente
  - 📝 Nota:

<...más hallazgos, ordenados de mayor a menor severidad...>

## Oportunidades que detecté (ideas propias)

> No son defectos; son toques a la medida de ESTA pantalla que propongo por iniciativa.
> 🧭 De organización: saca las que sean reales, prioriza las de más impacto.
> 🎨 De piel: **máximo 1–2 — tope duro** (más animación no es más vida; satura). Si tienes más, quédate con las más protagonistas.

### O1 · 🎨 Piel · ✨ Oportunidad · <título corto>
- **Idea:** <qué propones — ej. "que el total del footer ruede al cambiar (count-up)">
- **Por qué mejora:** <qué comunica / qué encuentra antes / qué vida da>
- **Dónde:** <archivo:línea / elemento>
- **Compartido:** <No / Sí — …>
- **Función a NO romper:** <…>
- **Decisión:** ¿La aplico?
  - A) <forma concreta> *(recomendada — por qué)*
  - B) <variante más sobria, o aislar vs global>
  - 🗑️ Descartar · ⏭️ Dejar pendiente
  - 📝 Nota:
```

### Ejemplos de decisión a la medida

**🎨 Piel** — "las tarjetas aparecen de golpe y la pantalla se siente muerta":
```
- **Decisión:** ¿Cómo le damos vida a la entrada de las tarjetas?
  - A) Fade + slide-up escalonado (60ms entre tarjetas), 220ms ease-out *(recomendada — vivo pero sutil, respeta prefers-reduced-motion)*
  - B) Solo fade simple (más discreto)
  - C) Dejarlas estáticas pero añadir hover/active a cada una
  - 🗑️ Descartar · ⏭️ Dejar pendiente
  - 📝 Nota:
```

**🧭 Organización** — "la acción principal (Agendar) está abajo del todo, debajo de info secundaria":
```
- **Decisión:** ¿Cómo subimos la acción principal a donde el ojo la encuentre?
  - A) Mover "Agendar" arriba, bajo el título, y bajar la info secundaria *(recomendada — la tarea principal primero, sin tocar qué hace el botón)*
  - B) Fijarlo como botón flotante al alcance del pulgar en móvil
  - C) Reestructurar en dos bloques: "hacer" arriba, "consultar" abajo (cambio más grande)
  - 🗑️ Descartar · ⏭️ Dejar pendiente
  - 📝 Nota:
```

**Compartido** — "el botón usa `.btn-primary`, que también está en otras 4 pantallas":
```
- **Decisión:** Esto vive en `.btn-primary` (otras 4 pantallas). ¿Qué hacemos?
  - A) Aislar: una clase/variante local solo para esta pantalla *(recomendada — no arriesga las otras)*
  - B) Unificar global (mejora todas, hay que revisar las 4)
  - 🗑️ Descartar · ⏭️ Dejar pendiente
  - 📝 Nota:
```

## Notas de mantenimiento
- **Orden:** siempre de mayor a menor severidad (🟠 → 🟡 → 🔵). No hay 🔴 (eso es de `/auditoria`).
- **No infles:** si no hay hallazgos de una severidad, no inventes. Para reconocer lo bueno está "Lo que ya está bien".
- **Tope de oportunidades 🎨:** máximo **2** de piel por pantalla. Las 🧭 pueden ser varias si son reales, pero prioriza.
- **Función a NO romper en cada bloque:** es el seguro de la skill. Reorganizar markup o animar puede perder un handler/condicional; tenerlo escrito evita el accidente.
- **Al cerrar todo:** el archivo se borra. Si el usuario quiere historial, ofréceselo aparte; por defecto, borra.
```
