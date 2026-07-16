---
name: finalizar-sesion
description: Cierra la sesión de trabajo de forma segura guardando todos los cambios localmente sin desplegar a Vercel ni hacer push a GitHub. Úsala cuando el usuario diga "finalizamos", "cerramos", "hasta aquí", "terminamos", "guardemos", "cerramos sesión", "listo por hoy", "dejemos hasta acá" o cualquier frase que indique que quiere terminar el trabajo del día. También úsala si el usuario pregunta "¿cómo guardamos?" o "¿quedaron los cambios?". El objetivo es que la próxima conversación arranque desde el estado correcto sin sorpresas. NUNCA hace push ni despliega — eso se pide explícitamente por separado.
---

# Finalizar Sesión

Tu objetivo es dejar todos los cambios de esta sesión guardados en `main` local, sin tocar GitHub ni Vercel.

## Qué hacer paso a paso

### 1. Identificar worktrees con cambios pendientes

```bash
git worktree list
```

Para cada worktree que NO sea el principal, compara contra main:

```bash
git log main...<rama-del-worktree> --oneline
```

Si tiene commits que main no tiene → hay cambios para mergear.

### 2. Mergear cada rama pendiente a main

Desde el repositorio principal (no desde el worktree):

```bash
cd <ruta-raiz-del-proyecto>
git merge <rama-del-worktree> --no-ff -m "chore: merge sesion — <descripcion-breve>"
```

Si el merge falla con conflictos, repórtalo al usuario y NO continúes. Describe qué archivos tienen conflicto.

### 3. Verificar que main quedó bien

```bash
git log --oneline -5
git status
```

Confirma que no hay conflictos sin resolver y que los commits aparecen en el historial.

### 4. Guardar nota en memoria

Escribe un archivo de memoria resumiendo lo que se hizo en esta sesión. Usa el formato estándar de memoria del proyecto:

Ruta: `C:\Users\Sinfi\.claude\projects\C--Users-Sinfi-OneDrive-Infiniity-Eventos-APP-REGISTRO\memory\session_last.md`

```markdown
---
name: Última sesión de trabajo
description: Resumen de la última sesión — qué se hizo, qué quedó pendiente
type: project
---

**Fecha:** <fecha de hoy>

**Qué se hizo:**
<lista breve de los cambios mergeados>

**Estado:** Mergeado a main local. Sin push a GitHub. Sin deploy a Vercel.

**Pendiente para próxima sesión:**
<cualquier cosa que quedó a medias o que el usuario mencionó querer hacer>
```

### 5. Confirmar al usuario

Responde con este resumen:

---

✅ **Sesión guardada** — los cambios están en `main` local.

**Mergeado:**
- [lista de ramas/commits que se mergearon]

**NO se hizo:**
- ❌ Push a GitHub
- ❌ Deploy a Vercel

**Próxima sesión:** arrancará desde este estado y verá todos los cambios.

Cuando quieras subir a producción, dime y lo hacemos juntos.

---

## Reglas importantes

- **NUNCA hacer `git push`** en esta skill. Ni siquiera lo menciones como sugerencia automática.
- **NUNCA ejecutar el deploy de Vercel** — eso es una decisión separada que el usuario toma conscientemente.
- Si no hay worktrees con cambios pendientes, simplemente confirma: "Todo ya está en main local, no había nada pendiente."
- Si el usuario tiene cambios sin commitear en un worktree (archivos modificados sin commit), avísale antes de mergear.
