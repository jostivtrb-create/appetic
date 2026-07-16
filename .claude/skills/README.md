# 🧰 Skills de este repo

Copia de las skills de `~/.claude/skills` del PC, versionadas aquí para que **también estén
disponibles al trabajar este repo desde la nube** (Claude Code web), donde el `~/.claude` del PC no
existe.

> ⚠️ **Claude solo carga las skills del repo en el que estás trabajando.** Si trabajas otro proyecto
> desde la nube, estas no aparecen: hay que copiarlas al `.claude/skills/` de ESE repo.

## 🔴 Cuáles NO funcionan desde la nube

Varias skills **lanzan programas instalados en el PC** (Real-ESRGAN, PowerShell, Python/Pillow,
ffmpeg) mediante rutas tipo `C:\Users\...`. Desde la nube **se leen pero no se ejecutan**: el
entorno es Linux y no tiene esas herramientas ni esos archivos.

| Skill | ¿En la nube? | Por qué |
|---|---|---|
| `Generar_Imagen` | ❌ No | Corre `generar.ps1` (PowerShell) en el PC |
| `Mejorar_Calidad_Imagen` | ❌ No | Necesita el `.exe` de Real-ESRGAN del PC |
| `Quitar_Fondo_Mejorar_Calidad` | ❌ No | Real-ESRGAN + Pillow del PC |
| `Mejorar_Calidad_Video` | ❌ No | Real-ESRGAN + ffmpeg del PC |
| `Capacitacion_Infografias` | ❌ No | Scripts y assets locales |
| `Agregar_Menu` | ⚠️ A medias | El diseño y el código sí; las **imágenes** (usa `/Generar_Imagen`) y el **seed** (necesita `scripts/serviceAccount.json`, que está en `.gitignore`) **NO** → hay que rematarlos en el PC |
| `Actualizar_Reglas_Firebase` | ⚠️ A medias | La CLI de Firebase no está logueada en la nube → cae al modo manual (pegar reglas en la consola) |
| `despliegue_en_vercel` | ✅ Sí | Solo git/gh |
| `auditoria`, `Mejora_Visual` | ✅ Sí | Levantan el dev server del propio repo |
| `Mensajes_Whatsapp`, `instalar-app-mobil`, `Solucion_Ingreso`, `finalizar-sesion`, `Demos_Apps` | ✅ Sí | Solo tocan código del repo |

**Regla práctica:** desde la nube, diseña y programa; deja para el PC lo que genere imágenes o toque
Firebase con llave.

## 🔄 Mantenerlas sincronizadas

Son una **copia**. Si editas una en el PC (`~/.claude/skills/...`), esta copia **no** se entera —
y al revés. Cuando cambies una, copia en ambos sentidos y súbela, o quedarán versiones distintas
entre el PC y la nube.

## 🔒 Privacidad — este repo es PÚBLICO

Todo lo que se ponga aquí queda visible para cualquiera. Al versionarlas se **anonimizaron los
correos de terceros** que había en la bitácora de `Actualizar_Reglas_Firebase` (cuentas de clientes
de otras apps): se sustituyeron por descripciones ("la cuenta dueña", "la cuenta de la persona
final") sin perder ninguna lección técnica.

**Antes de añadir o editar una skill aquí, comprueba que no metes:**
- Correos, teléfonos o nombres de **clientes** (los propios sí, si así lo quieres).
- Llaves, tokens o `serviceAccount.json` (ninguna skill los contiene hoy — que siga así).
- Capturas o datos de negocio de otras personas.
