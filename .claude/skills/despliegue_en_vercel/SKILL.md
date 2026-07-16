---
name: despliegue_en_vercel
description: Permite al agente desplegar a Vercel a través de GitHub controlando el manejo de múltiples credenciales en Windows y detectando automáticamente la rama de producción correcta.
---

# Despliegue Seguro en Vercel (Multi-Cuenta y Genérico)

## Propósito
Esta skill proporciona instrucciones al asistente para desplegar de manera segura cualquier proyecto a Vercel a través de GitHub. Especialmente útil cuando el usuario tiene múltiples cuentas de GitHub en el mismo equipo, ya que previene los errores "403 Forbidden" causados por la mezcla de credenciales en el Git Credential Manager de Windows.

## INSTRUCCIONES PARA EL AGENTE (CRÍTICO)

Cuando el usuario pida desplegar el proyecto, subir a Vercel/GitHub, o escriba un comando relacionado con el despliegue general, DEBES seguir estos pasos estrictamente:

### 0. Detectar la rama de producción (NUEVO — CRÍTICO)
**Antes de pushear, identifica a qué rama despliega Vercel como producción.** Errores comunes: el repo tiene tanto `main` como `master` y Vercel sirve una pero el usuario pushea a otra. Verifica:
- Ejecuta `git branch -r` para ver qué ramas existen en el remoto.
- Si existen ambas (`origin/main` y `origin/master`), pregunta al usuario cuál es la rama de producción de Vercel (o pide una screenshot de los deploys). **No asumas.** Los deploys marcados como "Production Current" en Vercel indican la rama real de producción.
- Si solo existe una, úsala.

### 1. Prueba de Compilación (solo si aplica)
Ejecuta `npm run build` (o el comando equivalente) **solo si el proyecto tiene `package.json` con scripts de build**. Para sitios estáticos (HTML/CSS/JS puro sin package.json), omite este paso. Si falla, resuelve los errores antes de continuar.

### 2. Aislar credenciales
Ejecuta `git config --local credential.useHttpPath true`. Esto obliga a Windows a guardar las credenciales en caché separadas por repositorio.

### 3. Revisar y añadir cambios
- `git status` para ver qué archivos han cambiado.
- `git add <archivos específicos>` — evita `git add .` para no incluir accidentalmente `.claude/` u otros archivos de herramientas.

### 4. Cache-busting en sitios estáticos (NUEVO)
Si editaste archivos JS/CSS en un sitio estático, verifica si `index.html` usa query params de versión (`?v=N`). Si es así, **bump la versión en el mismo commit** o los navegadores seguirán sirviendo el archivo cacheado. Ejemplo: `?v=5` → `?v=6`.

### 5. Commit
`git commit -m "mensaje descriptivo"`. Si el usuario no especifica mensaje, usa algo como `"chore: Actualización y despliegue automático"` pero idealmente describe el cambio real.

### 6. Push a la rama de producción correcta
Según lo detectado en el paso 0:
- Si la rama actual coincide con la rama de producción remota: `git push origin <rama-produccion>`.
- Si estás en un worktree u otra rama: `git push origin HEAD:<rama-produccion>` para empujar el commit directamente a la rama de producción.

### 7. Fallback por 403
Si el push falla con 403:
`git remote set-url origin https://[USUARIO]@github.com/[Organizacion_o_Usuario]/[Repositorio].git`
y reintenta el push.

### 8. Confirmar despliegue
Informa al usuario:
- Que Vercel detectará el push y hará el build automáticamente (1-2 min).
- Que verifique en el dashboard de Vercel que el nuevo deploy sale marcado como **"Production"**, no "Preview".
- Si sale como "Preview", significa que se pusheó a la rama equivocada: volver al paso 0.

## Anti-patrón conocido
Cuando el repo tiene `main` y `master` ambas activas, lo más probable es que Vercel use una y el usuario pushee a la otra, resultando en despliegues "Preview" que nunca llegan a producción. **Siempre verifica la rama de producción antes de pushear.**
