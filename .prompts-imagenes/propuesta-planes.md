# Prompts de imagen · Propuesta de planes por tamaño (noviembre 2026)

Para la propuesta de 5 páginas con los planes Básico · Pro · Total · Desarrollador.
Se generan a mano en **Gemini** (decisión R18). Ver
`.mega-cuestionario/Guía para los planes por tamaño de Appetic.md`.

**Cómo usarlas:** genera cada una, descárgala y súbela al chat o a `propuesta/img/` con el
**nombre exacto** que dice cada título. Hoy en esas rutas hay versiones **provisionales** (hechas
con Pollinations, calidad media); al reemplazarlas se regenera el PDF y listo, sin tocar el diseño.

## Bloque de estilo (va igual en las cinco)

> Real documentary photography of working-class Bogotá, Colombia · warm golden light · shallow
> depth of field · palette: warm orange #ED7D2B, cream #FFFBF4, deep brown #2A211C, wood and
> terracotta · photorealistic · no text, no letters, no signage, no logos, no watermark, no border.

**Si Gemini mete letreros con letras**, pide de nuevo añadiendo: *"blank unreadable signs, absolutely
no writing anywhere"*.

---

## 1 · `portada-tres-negocios.jpg` — portada · horizontal 16:9

```
A lively working-class neighborhood street in Bogotá, Colombia, at dusk, seen in a wide horizontal view. Side by side along the sidewalk: on the left a small colorful food trailer selling burgers and hot dogs with a short line of customers, in the middle a tiny fast-food corner shop with two small tables and a delivery motorbike parked in front, and on the right a cozy family restaurant with a warm dining room visible through large windows. Neighbors walking, string lights, warm tungsten glow from each business against a deep blue evening sky. Real documentary photography, 35mm lens at eye level, everything readable at a glance. Palette: warm orange #ED7D2B, cream #FFFBF4, deep brown #2A211C, wood and terracotta. Keep the top third calm (sky and rooftops) because a headline will be placed there. Wide 16:9 horizontal framing. Photorealistic, not an illustration. No text, no letters, no signage, no logos, no watermark, no border.
```

## 2 · `tapa-tres-negocios.jpg` — tapa impresa del folder · vertical 3:4

```
The same lively working-class neighborhood street in Bogotá, Colombia, at dusk, in a tall vertical view looking down the sidewalk: a small colorful food trailer in the foreground with a short line of customers, a tiny fast-food corner shop with a delivery motorbike behind it, and further down a cozy family restaurant with glowing windows. String lights above the street, warm tungsten glow against a deep blue evening sky. Real documentary photography, 35mm lens. Palette: warm orange #ED7D2B, cream #FFFBF4, deep brown #2A211C, wood and terracotta. Keep the top third calm (sky, lights and rooftops) because a title will be placed there, and the bottom quarter simple (pavement) because a band will cover it. Vertical 3:4 framing. Photorealistic, not an illustration. No text, no letters, no signage, no logos, no watermark, no border.
```

## 3 · `negocio-trailer.jpg` — página «¿Cuál es tu plan?» → Básico · vertical 4:5

```
A colorful street-food trailer in a working-class neighborhood of Bogotá, Colombia, at night, selling burgers and hot dogs. A short line of three customers waits in front; a young woman in the line is scanning a small QR sticker on the counter with her smartphone while she waits, and the cook inside smiles while preparing food on the griddle. Warm light spilling from the trailer window, steam from the griddle. Real documentary photography, 35mm lens at eye level, shallow depth of field. Palette: warm orange #ED7D2B, cream #FFFBF4, deep brown #2A211C. Vertical 4:5 framing. Photorealistic, not an illustration. No text, no letters, no signage, no logos, no watermark, no border.
```

## 4 · `negocio-local.jpg` — página «¿Cuál es tu plan?» → Pro · vertical 4:5

```
A small fast-food corner shop in a working-class neighborhood of Bogotá, Colombia, in the evening: a counter with burgers, salchipapas and sodas, three small tables with customers eating, a waiter carrying a tray, and a delivery rider in a jacket picking up a bag at the counter with his motorbike parked just outside the open door. A tablet on the kitchen pass shows order cards (screen not readable). Warm light, lively but small. Real documentary photography, 35mm lens at eye level, shallow depth of field. Palette: warm orange #ED7D2B, cream #FFFBF4, deep brown #2A211C, wood and terracotta. Vertical 4:5 framing. Photorealistic, not an illustration. No text, no letters, no signage, no logos, no watermark, no border.
```

## 5 · `negocio-restaurante.jpg` — página «¿Cuál es tu plan?» → Total · vertical 4:5

```
A busy Colombian family restaurant dining room in Bogotá at lunchtime: full wooden tables with bandeja paisa, ajiaco and fresh juices, a waiter in a dark apron taking an order on his smartphone, and in the background the owner at the cash counter reviewing the day's numbers on a tablet (screen not readable). Warm golden light from large windows, plants and terracotta tones. Real documentary photography, 35mm lens at eye level, shallow depth of field. Palette: warm orange #ED7D2B, cream #FFFBF4, deep brown #2A211C, wood and terracotta. Vertical 4:5 framing. Photorealistic, not an illustration. No text, no letters, no signage, no logos, no watermark, no border.
```

---

## Lo que NO se pide a Gemini

- **La pantalla de TV con el menú**, la cocina, el mesero y la contabilidad se **dibujan en HTML**
  dentro del documento con la cara de Appetic (S4). Los platos de la TV son las fotos que ya están
  en `propuesta/img/plato-*.jpg`.
