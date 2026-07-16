---
name: Mensajes_Whatsapp
description: Implementa el envío de mensajes de WhatsApp con texto pre-cargado y EMOJIS que SIEMPRE se ven bien (nunca "rombos" �), en celular y en PC, desde cualquier web app. Úsala cuando el usuario diga "manda/envía un mensaje por WhatsApp desde la app", "botón de WhatsApp", "link de WhatsApp con mensaje", "wa.me", "api.whatsapp.com", "mensaje precargado", "encuesta/recordatorio/confirmación por WhatsApp", o cuando reporte que "los emojis salen como rombos/diamantes/cuadros/signos de pregunta", "se ven raros los emojis en WhatsApp", "me tocó quitar los emojis", "no me funcionan los emojis en el mensaje". También aplica si pide generar un link de prueba de WhatsApp o diagnosticar por qué un mensaje sale corrupto. Es GENÉRICA: sirve en cualquier proyecto (Vite/React, HTML puro, etc.).
---

# Mensajes de WhatsApp con emojis (sin rombos)

## Propósito
Que cualquier app pueda abrir WhatsApp con un mensaje pre-cargado y **los emojis se vean perfectos siempre** — en celular y en PC (WhatsApp Web). El error típico es que los emojis salen como **rombos** (`�`, el "replacement character" de Unicode). Esta skill ataca **las dos causas reales** a la vez.

## El diagnóstico clave (entender antes de arreglar)
El rombo `�` aparece por **DOS causas distintas** que hay que cubrir las dos:

1. **Encoding del archivo fuente.** En Windows, si un editor/herramienta guarda el `.js`/`.jsx` como ANSI o UTF-16 en vez de **UTF-8**, los bytes del emoji literal (ej. `🙏` escrito directo en el código) se corrompen → rombos.
2. **El endpoint `wa.me`.** `wa.me/NUMERO?text=...` es un **link de redirección**; al rebotar a **WhatsApp Web en el PC, corrompe los emojis** y los vuelve rombos. (En celular `wa.me` suele funcionar, pero en WhatsApp Web NO.) El endpoint **directo `api.whatsapp.com/send` los conserva intactos.**

Pista para diagnosticar: si en el mensaje **los acentos (á, é, ñ) se ven bien pero solo los emojis salen como `�`**, es exactamente este problema (no es que falte "poner emojis", es encoding/endpoint).

## Las 3 reglas de oro (aplicarlas SIEMPRE)

### Regla 1 — Emojis en el código como secuencias Unicode `\u` (no el carácter literal)
NO pegues el emoji directo en el string. Escríbelo como escape Unicode para que el archivo quede en **ASCII puro** y el emoji se reconstruya en runtime, sin importar cómo se guarde el archivo.

```js
// ❌ Riesgoso (depende de que el archivo sea UTF-8):
const msg = '✨ Hola 🙏';

// ✅ A prueba de balas (ASCII puro en el archivo):
const msg = '✨ Hola \u{1F64F}';
```

Tabla de los emojis más usados:
| Emoji | Escape | | Emoji | Escape |
|---|---|---|---|---|
| ✨ | `✨` | | 🙏 | `\u{1F64F}` |
| 👉 | `\u{1F449}` | | 🎉 | `\u{1F389}` |
| 🎶 | `\u{1F3B6}` | | ✅ | `✅` |
| ❤️ | `❤️` | | 📅 | `\u{1F4C5}` |

> Para obtener el escape de cualquier emoji: en Node → `console.log([...'🙏'].map(c=>c.codePointAt(0).toString(16)))` → usa `\u{XXXX}`.
> Los BMP (≤ FFFF, ej. `2728`) van como `\uXXXX`; los demás como `\u{XXXXX}`.

### Regla 2 — Siempre `encodeURIComponent` en el texto
Nunca pongas el texto crudo en la URL, y nunca uses `escape()`. Solo `encodeURIComponent(message)`. Eso convierte cada emoji en su UTF-8 percent-encoded válido (ej. 🙏 → `%F0%9F%99%8F`).

### Regla 3 — Endpoint correcto según dispositivo
- **Desktop / PC:** `https://api.whatsapp.com/send?phone=NUMERO&text=TEXTO`  ← **NO uses `wa.me`** (corrompe emojis en WhatsApp Web).
- **Móvil:** `whatsapp://send?phone=NUMERO&text=TEXTO`  ← deep link a la app nativa (también funciona `api.whatsapp.com`, pero el deep link abre directo la app).

## Helper listo para pegar (`utils/whatsappLink.js`)
Implementa o ajusta el helper del proyecto para que cumpla las 3 reglas. Si ya existe `whatsappLink.js`, revisa que el desktop use `api.whatsapp.com/send` y NO `wa.me`.

```js
export const isMobileBrowser = () =>
    typeof navigator !== 'undefined' &&
    /android|iphone|ipad|ipod/i.test(navigator.userAgent || '');

// Número COMPLETO con prefijo país, sin '+'. message SIN encodear (lo hace el helper).
export const buildWhatsAppLink = (phone, message) => {
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    const text = encodeURIComponent(message || '');           // Regla 2
    return isMobileBrowser()
        ? `whatsapp://send?phone=${cleanPhone}&text=${text}`    // Regla 3 (móvil)
        : `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`; // Regla 3 (PC, NO wa.me)
};

export const openWhatsApp = (phone, message) => {
    const link = buildWhatsAppLink(phone, message);
    if (isMobileBrowser()) window.location.href = link;  // deep link
    else window.open(link, '_blank');                    // nueva pestaña
};

// Anti popup-blocker en desktop cuando hay awaits antes de abrir:
//   const w = preopenWhatsAppWindow(); await algo(); openWhatsAppInWindow(w, phone, msg);
export const preopenWhatsAppWindow = () =>
    isMobileBrowser() ? null : window.open('about:blank', '_blank');

export const openWhatsAppInWindow = (win, phone, message) => {
    const link = buildWhatsAppLink(phone, message);
    if (isMobileBrowser()) { if (win && !win.closed) win.close(); window.location.href = link; }
    else if (win && !win.closed) win.location.href = link;
    else window.open(link, '_blank');
};
```

## Normalización del número (Colombia)
```js
const normalizeCoPhone = (raw) => {
    let c = String(raw || '').replace(/\D/g, '');
    if (!c) return '';
    if (c.startsWith('57') && c.length >= 12) return c; // ya trae prefijo país
    if (c.length === 10) return '57' + c;               // celular local CO
    return c;                                           // fallback
};
```

## Cómo PROBAR / diagnosticar (matriz decisiva)
Si el usuario reporta rombos, genera un link de prueba con Node (usando `\u` + `encodeURIComponent`) y pídele probarlo en **dos sitios**:

```bash
node -e "const m='✨ Prueba \u{1F64F}\u{1F389}'; console.log('https://api.whatsapp.com/send?phone=573001112233&text='+encodeURIComponent(m));"
```

| Dónde se abre | `wa.me` | `api.whatsapp.com/send` |
|---|---|---|
| **Celular** | ✅ emojis bien | ✅ emojis bien |
| **PC (WhatsApp Web)** | ❌ rombos | ✅ emojis bien |

- Si en **celular** se ven bien → los clientes (que usan celular) **siempre** los ven bien.
- Si en **PC** salen rombos con `wa.me` pero bien con `api.whatsapp.com` → confirma la causa: cambia el endpoint a `api.whatsapp.com/send`.
- Si en **celular TAMBIÉN** salen rombos → revisa la Regla 1 (encoding del archivo) o que no se esté double-encodeando el texto.

## Checklist final (antes de dar por bueno)
- [ ] Los emojis en el código están como `\u...` (no el carácter literal).
- [ ] El texto se pasa por `encodeURIComponent` (una sola vez, no doble).
- [ ] El link de desktop usa `api.whatsapp.com/send`, **no** `wa.me`.
- [ ] El número va con prefijo país (57…) y sin `+` ni espacios.
- [ ] Probado en PC y en celular → emojis sin rombos.

## Resumen de una línea
**Emojis como `\u` en el código + `encodeURIComponent` + endpoint `api.whatsapp.com/send` (no `wa.me`) = emojis perfectos en celular y PC, para siempre.**
