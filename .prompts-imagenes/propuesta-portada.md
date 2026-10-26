# Prompts de imagen · Propuesta nueva de Appetic (octubre 2026)

Para la propuesta de restaurantes con salón ($49.000/mes). Generadas a mano en Gemini
(Nano Banana) por el usuario. Ver `.mega-cuestionario/Guía para la propuesta nueva de Appetic.md`.

## Bloque de estilo (repetir idéntico en el set)

> Real documentary photography · warm golden light · shallow depth of field ·
> Palette: warm orange `#ED7D2B`, cream `#FFFBF4`, deep brown ink `#2A211C`, wood and terracotta ·
> lower-left area calm and empty (va un sello encima) · wide 16:9 · photorealistic ·
> no text, no letters, no signage, no logos, no watermark, no border.

## 1 · portada-salon.jpg — PRINCIPAL · tipo B · 16:9 · `propuesta/img/portada-salon.jpg`

Estado: **lista y PUESTA** · guardada como `img/portada-salon-v1-libreta.jpg`.
Buena composición (mesero centrado, luz dorada, mesa servida delante). Defecto: escribe en una
**libreta de papel**, justo lo que ataca la página 2.

```
A warm, lively neighborhood restaurant dining room in Bogotá, seen in a wide horizontal view: four or five simple wooden tables with families and friends eating together, plates of grilled meat, arepas and fresh fruit juices on the tables, and a waiter in a dark apron standing at the nearest table, holding a phone in one hand as he takes the order, the phone screen turned away from the camera. Real documentary photography, shot on a 35mm lens at eye level, shallow depth of field with the waiter and the nearest table sharp and the rest of the room softly blurred. Warm golden late-afternoon light coming through a window on the right, plus warm tungsten lamps overhead. Palette: warm orange #ED7D2B, cream #FFFBF4, deep brown ink #2A211C, with wood and terracotta tones. Keep the lower-left area of the frame calm and simple, a plain stretch of floor or empty table edge, with no faces and no important detail there, because a label will be placed on top of it. Wide 16:9 horizontal framing. Photorealistic, like a real photograph, not an illustration. No text, no letters, no signage, no written menus, no logos, no watermark, no border.
```

## 2 · plan B (encuadre cerrado) — **descartado**, no se llegó a usar

Se prefirió corregir la toma principal antes que cambiar de encuadre.

```
A warm neighborhood restaurant table in Bogotá photographed from a low 45-degree angle: a wooden table in the foreground with plates of grilled food, arepas and a glass of fresh juice, and behind it the softly blurred dining room with people seated at other tables and warm hanging lamps. Real documentary food photography, 50mm lens, shallow depth of field, the food sharp and the room melting into warm bokeh. Warm golden light from a window on the right. Palette: warm orange #ED7D2B, cream #FFFBF4, deep brown ink #2A211C, with wood and terracotta tones. Keep the lower-left area of the frame calm and simple, with no important detail there, because a label will be placed on top of it. Wide 16:9 horizontal framing. Photorealistic, like a real photograph, not an illustration. No text, no letters, no signage, no written menus, no logos, no watermark, no border.
```

## Lo que NO se pide a Gemini

- **Las pantallas de cocina y de mesero** se dibujan en HTML/CSS dentro del documento, con la
  identidad de Appetic (decidido en la ronda 2, S4). No se generan con IA ni se presentan como
  capturas: son la pantalla, dibujada.
- Las capturas del menú, el producto, el carrito, el checkout y el panel **ya existen** en
  `cartilla/capturas/` (Pilotos y Jasbury).


## 2bis · segunda toma — generada y DESCARTADA

Guardada como `img/portada-salon-v2-celular.jpg`. Arregló el papel (ya es celular) pero el mesero
quedó **pegado al borde derecho**: el recorte a 210×130 mm le corta el brazo y choca con el logo de
Swiftfly, y la escena quedó más plana. Se volvió a la v1.

## 3 · tercera toma — generada y descartada

Guardada como `img/portada-salon-v3-mesa-vacia.jpg`. Arregló todo lo que se le pidió: mesero
centrado, celular de verdad, manos limpias (verificadas con zoom), salón lleno detrás y la esquina
del sello despejada. **Fallo nuevo que él detectó:** la mesa del primer plano está servida pero
**no hay nadie sentado** — el mesero le toma el pedido a una mesa vacía.

```
A warm, lively neighborhood restaurant dining room in Bogotá, seen in a wide horizontal view. In the centre of the frame, clearly inside it and never touching the edges, a waiter in a dark apron and striped shirt stands at a table taking an order on a smartphone: he holds the phone in one hand and taps the screen with his thumb, looking down at it with a small smile. His hands hold nothing else: no notepad, no paper pad, no notebook, no pen and no paper anywhere in the scene, and nobody else in the room is holding a phone. In the foreground, the table he is attending is laid with plates of grilled meat, arepas, rice and fresh fruit juices, seen from a low angle. Behind him, four or five more wooden tables with families and friends eating and talking, softly out of focus. Real documentary photography, shot on a 35mm lens at eye level, shallow depth of field with the waiter and the foreground table sharp and the rest of the room softly blurred. Warm golden late-afternoon light coming through a window on the right, plus warm tungsten lamps overhead. Palette: warm orange #ED7D2B, cream #FFFBF4, deep brown ink #2A211C, with wood and terracotta tones. Keep the lower-left area of the frame calm and simple, a plain stretch of wooden floor with no faces and no important detail, and keep the upper-right corner uncluttered as well: both will be covered by labels. Wide 16:9 horizontal framing. Photorealistic, like a real photograph, not an illustration. No text, no letters, no signage, no written menus, no logos, no watermark, no border.
```

## Aprendido en esta tanda

- Decirle **qué quitar** no basta: al quitarle la libreta movió al mesero al borde del cuadro. Hay
  que fijar **también la posición** («in the centre of the frame, never touching the edges»).
- Una portada que va recortada (aquí 16:9 → 210×130 mm) pierde los laterales: nada importante puede
  quedar cerca de los bordes.
- Si encima va un logo o un sello, hay que pedir **esa esquina despejada** igual que se pide la zona
  del sello, o el sujeto se le monta.
- Una foto suelta puede verse bien y fallar montada: comparar siempre **en su sitio**, recortada.
- Pedir «un mesero tomando el pedido en una mesa» **no implica que ponga a alguien sentado en ella**:
  sirvió la mesa y la dejó vacía. Si la escena necesita personas en un sitio concreto, hay que
  pedirlas con su número, su sitio y qué están haciendo («three customers seated on the right-hand
  side, looking up at the waiter»).


## 4 · cuarta toma — **LA BUENA, puesta** (`img/portada-salon-v4-final.jpg`)

Mismo prompt que la 3 con un solo cambio: **comensales sentados** a la derecha de la mesa del primer
plano, mirando al mesero. Van a la derecha a propósito, para no ensuciar la esquina inferior
izquierda donde cae el sello naranja.

Salió al primer intento y con todo resuelto: mesero centrado, celular (manos verificadas con zoom),
tres comensales sentados y sonriendo, comida servida, salón lleno detrás, el piso limpio bajo el
sello y el ladrillo despejado bajo el logo. **Además la foto ya cuenta lo que vende la propuesta.**

```
A warm, lively neighborhood restaurant dining room in Bogotá, seen in a wide horizontal view. In the centre of the frame, clearly inside it and never touching the edges, a waiter in a dark apron and striped shirt stands at a table taking an order on a smartphone: he holds the phone in one hand and taps the screen with his thumb, looking down at it with a small smile. His hands hold nothing else: no notepad, no paper pad, no notebook, no pen and no paper anywhere in the scene, and nobody else in the room is holding a phone. In the foreground, on the right-hand side of the table he is attending, three customers are seated and clearly visible, a man and two women, looking up at the waiter and talking to him as he takes their order; the table in front of them is laid with plates of grilled meat, arepas, rice and fresh fruit juices, seen from a low angle. Behind them, four or five more wooden tables with families and friends eating and talking, softly out of focus. Real documentary photography, shot on a 35mm lens at eye level, shallow depth of field with the waiter and the seated customers sharp and the rest of the room softly blurred. Warm golden late-afternoon light coming through a window on the right, plus warm tungsten lamps overhead. Palette: warm orange #ED7D2B, cream #FFFBF4, deep brown ink #2A211C, with wood and terracotta tones. Keep the lower-left area of the frame calm and simple, a plain stretch of wooden floor with no faces and no important detail, and keep the upper-right corner uncluttered as well: both will be covered by labels. Wide 16:9 horizontal framing. Photorealistic, like a real photograph, not an illustration. No text, no letters, no signage, no written menus, no logos, no watermark, no border.
```
