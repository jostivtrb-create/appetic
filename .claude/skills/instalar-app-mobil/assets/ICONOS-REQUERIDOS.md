# Íconos requeridos para PWA

Coloca estos dos PNG en `public/`:

| Archivo        | Tamaño    | Uso                                   |
|----------------|-----------|---------------------------------------|
| `icon-192.png` | 192×192px | Ícono en pantalla de inicio (Android) |
| `icon-512.png` | 512×512px | Splash screen (Android/iOS)           |

## Cómo generarlos

### Opción 1 — Favicon.io (recomendado)
Ve a https://favicon.io/favicon-converter/ → sube tu logo → descarga → renombra.

### Opción 2 — Con Sharp (Node.js)
```bash
npx sharp-cli --input public/LOGO.png --output public/icon-192.png resize 192 192
npx sharp-cli --input public/LOGO.png --output public/icon-512.png resize 512 512
```

### Opción 3 — ImageMagick
```bash
magick public/LOGO.png -resize 192x192 public/icon-192.png
magick public/LOGO.png -resize 512x512 public/icon-512.png
```

**Tip:** Usa fondo sólido (no transparente) para mejor compatibilidad Android.
Una vez colocados los íconos, puedes borrar este archivo.
