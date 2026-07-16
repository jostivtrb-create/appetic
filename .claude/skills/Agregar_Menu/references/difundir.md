# Difundir — QR, afiche de domicilios, link y mensaje de bienvenida

**Es parte del MOTOR, automático.** Todo local nuevo que creas con esta skill ya trae, en su
panel de admin, la pestaña **📣 Difundir**. No hay que programar nada por local ni tocar código:
sale del código compartido. Tu única tarea es **hacer bien la identidad** (que ya haces), porque
el afiche se arma **solo** con esos datos.

- Motor (NO editar por local): `src/pages/Admin/AdminDifundir.jsx` + `src/utils/compartir.js`.
- Dependencia `qrcode` ya está en el `package.json` del proyecto (se carga **diferida**, solo cuando
  el dueño abre la pestaña, para no pesar en el menú del cliente). `npm install` la trae. Nada que hacer.

## Qué le da al dueño (en /<slug>/admin → 📣 Difundir)
1. **Link del menú** para copiar de un toque (`origin + '/' + slug`).
2. **Código QR descargable (PNG)**, en el color de marca del local (`tema.primaryStrong`).
3. **Afiche de DOMICILIOS** listo para imprimir o "Guardar como PDF".
4. **Mensaje de bienvenida** para WhatsApp con emojis (a prueba de rombos) que explica que desde el
   link pueden pedir; se adapta según si el local tiene domicilio y/o recoger.

## El afiche HEREDA la identidad del local (por eso importa hacerla bien)
El afiche se genera **solo** desde `tema` + `logo` + `descripcion` + `whatsapp`. No se diseña por
local; se ADAPTA. Consecuencias directas para tu trabajo de identidad:

- **Claro u oscuro automático:** detecta por la luminancia de `tema.bg`. Fondo oscuro → afiche
  oscuro con texto claro y título en `accent`; fondo claro → afiche claro con título en
  `primaryStrong`. Un buen `bg` de marca = un buen afiche.
- **Usa `local.logo` ANCHO sin recortar** (object-fit contain), el mismo que flota en el hero. El
  trabajo de logo **transparente** (`/Quitar_Fondo_Mejorar_Calidad`) sirve IGUAL aquí: un logo
  transparente ancho se ve perfecto sobre el fondo del local. Un logo con recuadro sólido se verá
  como recuadro también en el afiche → deja el logo transparente.
- **El número de domicilios = `whatsapp` del local.** Si el dueño lo cambia en Configuración, el
  afiche sale con el número nuevo **automáticamente** (no hay que regenerar nada).
- Colores, dorado/acento, píldora del teléfono: todo sale de `tema`. Si la paleta está bien elegida,
  el afiche se ve de ESE negocio sin más.

> Regla práctica: si el menú del local se ve bien (buena paleta + logo transparente), su afiche de
> domicilios se verá bien **sin tocar nada**. Si el logo quedó como recuadro o la paleta desentona,
> se notará también en el afiche → arréglalo en la identidad.

## En la ENTREGA (cierre con el dueño)
Menciónale explícitamente que en su panel, pestaña **📣 Difundir**, tiene TODO para promocionar:
- su **QR** para imprimir/pegar,
- el **afiche de domicilios** listo para PDF (con su número, que se actualiza solo si lo cambia),
- el **link** de su menú para copiar,
- y un **mensaje de bienvenida** para reenviar por WhatsApp a sus clientes.

Tip para el dueño: para imprimir el afiche, abrirlo y usar Ctrl/Cmd+P → "Guardar como PDF", y
desactivar "Encabezados y pies de página" para que no salga la fecha/URL.
