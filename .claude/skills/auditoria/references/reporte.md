# Severidad y evidencia de los hallazgos

Referencia para **clasificar** cada hallazgo y **mostrar su evidencia**. El entregable de la auditoría es el documento de trabajo vivo (`.auditoria/<flujo>.md`, plantilla en `documento.md`); aquí solo viven los niveles de severidad y cómo presentar la evidencia. No hay un "reporte" aparte: todo se vuelca al worklog.

## Niveles de severidad

- **🔴 Crítico** — Rompe el flujo o pierde/corrompe datos. El usuario no puede lograr su objetivo, o logra algo incorrecto sin enterarse. (Ej.: no guarda, guarda mal, `permission-denied` silencioso, crash, datos de otra sede, **fuga de Firebase que crece sin tope**, acceso/bypass de prueba que quedaría en producción.)
- **🟠 Alto** — El flujo funciona pero con un fallo serio de UX o robustez que afectará a usuarios reales seguido. (Ej.: sin feedback de error, se rompe en móvil, doble click duplica, validación ausente, N+1 o lecturas desproporcionadas.)
- **🟡 Medio** — Problema real pero menor o de borde. (Ej.: mensaje confuso, estado vacío feo, inconsistencia de estilo visible, re-fetch evitable.)
- **🔵 Bajo** — Pulido / nice-to-have. (Ej.: espaciado ligeramente off, microcopy mejorable, microoptimización sin impacto aún.)

Ordena siempre de mayor a menor severidad. Si no encontraste nada de una categoría, no la inventes.

## Evidencia y capturas

- Respalda cada hallazgo con evidencia concreta: error de consola (`preview_console_logs`), petición fallida o desproporcionada (`preview_network`), valor CSS real (`preview_inspect`) o captura (`preview_screenshot`).
- Las capturas se muestran **en la conversación**, junto al hallazgo visual, para que el usuario *vea* el problema. Los archivos de imagen no se guardan: en el documento se refieren como "ver captura del paso N en el chat".
- Toma capturas tanto del estado correcto como de cada problema, para que el contraste sea claro.
