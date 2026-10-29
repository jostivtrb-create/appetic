# 🎨 Prompts de imágenes — Burger Demo (demo para clientes)

Guía: `.mega-cuestionario/Guía para la Demo de clientes.md`. Genéralas en **Gemini (Nano Banana)**, descárgalas y avísame:
yo las recorto, las optimizo y las dejo en `public/locales/demo/` (no se suben por el panel: así el **Reiniciar demo** siempre las recupera).

**Paleta:** rojo parrilla `#D9381E` · amarillo mostaza `#F2A900` · carbón `#1E1B1A`.  
**Estilo común (ya va en cada prompt):** tabla de pizarra oscura sobre mesa de madera quemada, fondo carbón con brillo de brasas, luz dorada lateral.

Estado: ⏳ pendiente = falta generar · ✅ lista

---

## 🏷️ Logo (wordmark ancho) — `logo.webp` · ⏳ pendiente

Fondo magenta para recortarlo transparente (lleva lechuga verde, por eso no va croma verde).

```
A flat vector fast-food restaurant wordmark logo, wide horizontal layout. On the left, a bold cartoon cheeseburger icon seen from the side: golden sesame bun #F2A900, dark brown patty, yellow melted cheese drip, green lettuce, red tomato #D9381E, thick dark outline #1E1B1A. To its right, the name "Burger Demo" in a very heavy, chunky, slightly condensed rounded sans-serif: the word "Burger" in red #D9381E and the word "Demo" in charcoal #1E1B1A, both on one line, with a thin cream #FFF4E0 inner highlight. Directly under the name, small letters "hamburguesas a la parrilla" in charcoal. Clean solid flat colors, crisp edges, no gradients, no 3D. Fully visible and centered with about 12% empty margin on every side, nothing cropped, keep the bottom-right corner empty. On a perfectly flat, solid pure magenta (#FF00FF) background, uniform edge to edge, with no gradient, no texture, no vignette. No drop shadow, no glow, no reflection, no white sticker border. Wide 16:9. Render only the quoted text, exactly as written, with correct Spanish spelling. Do not draw any of these instructions as text. No watermark.
```

El **ícono cuadrado** (`icono.webp`) lo armo yo con la hamburguesa del mismo logo.

---

## 🖼️ Banner (portada) — `banner.webp` · ⏳ pendiente

```
Photorealistic wide horizontal banner food photography for a burger joint: an abundant spread on a long charred dark wooden table — two tall juicy cheeseburgers with melted cheddar, a basket of golden french fries, onion rings, a loaded hot dog and two frosty sodas, dark charcoal background with grill flames and floating embers glowing warmly in the distance, warm golden side lighting, subtle red #D9381E and mustard yellow #F2A900 accents, keep the center-left slightly calmer for overlaid text, horizontal cinematic 16:9 composition, high detail, sharp focus, no text, no watermark, no logo, no hands, no people.
```

---

## 🍔 Platos — `platos/<archivo>.webp` (cuadradas)

**La Clásica** — `platos/clasica.webp` · ⏳ pendiente

```
Photorealistic professional food photography of a tall classic cheeseburger: grilled beef patty, melted cheddar, crisp lettuce, tomato slice, red onion and house sauce in a glossy golden brioche bun, freshly made, juicy and mouth-watering, served on a dark matte slate board on a charred dark wooden table, dark charcoal background with a soft warm glow of grill flames and floating embers far behind, warm golden side lighting, subtle red #D9381E and mustard yellow #F2A900 accents, shallow depth of field, high detail, sharp focus on the food, centered with some space around it, square 1:1 composition, no text, no watermark, no logo, no hands, no people.
```

**Doble Queso** — `platos/doble-queso.webp` · ⏳ pendiente

```
Photorealistic professional food photography of a tall double cheeseburger with two grilled beef patties, two layers of dripping melted cheddar, caramelized onions and pickles in a glossy brioche bun, freshly made, juicy and mouth-watering, served on a dark matte slate board on a charred dark wooden table, dark charcoal background with a soft warm glow of grill flames and floating embers far behind, warm golden side lighting, subtle red #D9381E and mustard yellow #F2A900 accents, shallow depth of field, high detail, sharp focus on the food, centered with some space around it, square 1:1 composition, no text, no watermark, no logo, no hands, no people.
```

**BBQ Tocineta** — `platos/bbq-tocineta.webp` · ⏳ pendiente

```
Photorealistic professional food photography of a burger with a grilled beef patty, crispy bacon strips, golden onion rings, melted cheddar and dark smoky BBQ sauce dripping, in a brioche bun, freshly made, juicy and mouth-watering, served on a dark matte slate board on a charred dark wooden table, dark charcoal background with a soft warm glow of grill flames and floating embers far behind, warm golden side lighting, subtle red #D9381E and mustard yellow #F2A900 accents, shallow depth of field, high detail, sharp focus on the food, centered with some space around it, square 1:1 composition, no text, no watermark, no logo, no hands, no people.
```

**Pollo Crispy** — `platos/pollo-crispy.webp` · ⏳ pendiente

```
Photorealistic professional food photography of a crispy fried chicken breast sandwich with lettuce, tomato and honey mustard sauce in a sesame brioche bun, the golden breading very crunchy, freshly made, juicy and mouth-watering, served on a dark matte slate board on a charred dark wooden table, dark charcoal background with a soft warm glow of grill flames and floating embers far behind, warm golden side lighting, subtle red #D9381E and mustard yellow #F2A900 accents, shallow depth of field, high detail, sharp focus on the food, centered with some space around it, square 1:1 composition, no text, no watermark, no logo, no hands, no people.
```

**La Mexicana** — `platos/mexicana.webp` · ⏳ pendiente

```
Photorealistic professional food photography of a burger with a grilled beef patty, guacamole, sliced green jalapeños, crushed tortilla chips and melted cheese sauce in a brioche bun, freshly made, juicy and mouth-watering, served on a dark matte slate board on a charred dark wooden table, dark charcoal background with a soft warm glow of grill flames and floating embers far behind, warm golden side lighting, subtle red #D9381E and mustard yellow #F2A900 accents, shallow depth of field, high detail, sharp focus on the food, centered with some space around it, square 1:1 composition, no text, no watermark, no logo, no hands, no people.
```

**Veggie de Garbanzo** — `platos/veggie.webp` · ⏳ pendiente

```
Photorealistic professional food photography of a vegetarian burger with a golden chickpea and vegetable patty, avocado slices, lettuce, tomato and white yogurt sauce in a whole wheat bun, freshly made, juicy and mouth-watering, served on a dark matte slate board on a charred dark wooden table, dark charcoal background with a soft warm glow of grill flames and floating embers far behind, warm golden side lighting, subtle red #D9381E and mustard yellow #F2A900 accents, shallow depth of field, high detail, sharp focus on the food, centered with some space around it, square 1:1 composition, no text, no watermark, no logo, no hands, no people.
```

**Perro Sencillo** — `platos/perro-sencillo.webp` · ⏳ pendiente

```
Photorealistic professional food photography of a Colombian hot dog: american sausage in a long soft bun topped with crunchy shoestring potato sticks, grated white cheese and pink and yellow sauces, freshly made, juicy and mouth-watering, served on a dark matte slate board on a charred dark wooden table, dark charcoal background with a soft warm glow of grill flames and floating embers far behind, warm golden side lighting, subtle red #D9381E and mustard yellow #F2A900 accents, shallow depth of field, high detail, sharp focus on the food, centered with some space around it, square 1:1 composition, no text, no watermark, no logo, no hands, no people.
```

**Perro Especial** — `platos/perro-especial.webp` · ⏳ pendiente

```
Photorealistic professional food photography of a loaded Colombian hot dog: sausage in a long bun with crispy bacon, gratinated melted cheese, two quail eggs and shoestring potato sticks, freshly made, juicy and mouth-watering, served on a dark matte slate board on a charred dark wooden table, dark charcoal background with a soft warm glow of grill flames and floating embers far behind, warm golden side lighting, subtle red #D9381E and mustard yellow #F2A900 accents, shallow depth of field, high detail, sharp focus on the food, centered with some space around it, square 1:1 composition, no text, no watermark, no logo, no hands, no people.
```

**Choriperro** — `platos/choriperro.webp` · ⏳ pendiente

```
Photorealistic professional food photography of a grilled Colombian chorizo in a long crusty bun with green chimichurri, diced onion and melted cheese, freshly made, juicy and mouth-watering, served on a dark matte slate board on a charred dark wooden table, dark charcoal background with a soft warm glow of grill flames and floating embers far behind, warm golden side lighting, subtle red #D9381E and mustard yellow #F2A900 accents, shallow depth of field, high detail, sharp focus on the food, centered with some space around it, square 1:1 composition, no text, no watermark, no logo, no hands, no people.
```

**Salchipapa Clásica** — `platos/salchipapa.webp` · ⏳ pendiente

```
Photorealistic professional food photography of a Colombian salchipapa: a generous pile of golden french fries with sliced sausage and grated white cheese, served in a small paper-lined tray, freshly made, juicy and mouth-watering, served on a dark matte slate board on a charred dark wooden table, dark charcoal background with a soft warm glow of grill flames and floating embers far behind, warm golden side lighting, subtle red #D9381E and mustard yellow #F2A900 accents, shallow depth of field, high detail, sharp focus on the food, centered with some space around it, square 1:1 composition, no text, no watermark, no logo, no hands, no people.
```

**Salchipapa Mixta** — `platos/salchipapa-mixta.webp` · ⏳ pendiente

```
Photorealistic professional food photography of a loaded salchipapa: golden french fries topped with sliced sausage, shredded chicken, beef strips and gratinated melted cheese, in a paper-lined tray, freshly made, juicy and mouth-watering, served on a dark matte slate board on a charred dark wooden table, dark charcoal background with a soft warm glow of grill flames and floating embers far behind, warm golden side lighting, subtle red #D9381E and mustard yellow #F2A900 accents, shallow depth of field, high detail, sharp focus on the food, centered with some space around it, square 1:1 composition, no text, no watermark, no logo, no hands, no people.
```

**Salchipapa de Tocineta** — `platos/salchipapa-tocineta.webp` · ⏳ pendiente

```
Photorealistic professional food photography of golden french fries topped with sliced sausage, crispy bacon bits, sweet corn kernels and melted gratinated cheese, in a paper-lined tray, freshly made, juicy and mouth-watering, served on a dark matte slate board on a charred dark wooden table, dark charcoal background with a soft warm glow of grill flames and floating embers far behind, warm golden side lighting, subtle red #D9381E and mustard yellow #F2A900 accents, shallow depth of field, high detail, sharp focus on the food, centered with some space around it, square 1:1 composition, no text, no watermark, no logo, no hands, no people.
```

**Combo Clásico** — `platos/combo-clasico.webp` · ⏳ pendiente

```
Photorealistic professional food photography of a combo meal: a classic cheeseburger, a portion of golden french fries and a cold soda in a glass with ice, arranged together, freshly made, juicy and mouth-watering, served on a dark matte slate board on a charred dark wooden table, dark charcoal background with a soft warm glow of grill flames and floating embers far behind, warm golden side lighting, subtle red #D9381E and mustard yellow #F2A900 accents, shallow depth of field, high detail, sharp focus on the food, centered with some space around it, square 1:1 composition, no text, no watermark, no logo, no hands, no people.
```

**Combo Pareja** — `platos/combo-pareja.webp` · ⏳ pendiente

```
Photorealistic professional food photography of a meal for two: two classic cheeseburgers, a large shared basket of golden french fries and two cold sodas in glasses with ice, freshly made, juicy and mouth-watering, served on a dark matte slate board on a charred dark wooden table, dark charcoal background with a soft warm glow of grill flames and floating embers far behind, warm golden side lighting, subtle red #D9381E and mustard yellow #F2A900 accents, shallow depth of field, high detail, sharp focus on the food, centered with some space around it, square 1:1 composition, no text, no watermark, no logo, no hands, no people.
```

**Combo Familiar** — `platos/combo-familiar.webp` · ⏳ pendiente

```
Photorealistic professional food photography of a family feast: four classic cheeseburgers, a big tray of salchipapa with fries and sausage, and a 1.5 liter soda bottle, arranged abundantly, freshly made, juicy and mouth-watering, served on a dark matte slate board on a charred dark wooden table, dark charcoal background with a soft warm glow of grill flames and floating embers far behind, warm golden side lighting, subtle red #D9381E and mustard yellow #F2A900 accents, shallow depth of field, high detail, sharp focus on the food, centered with some space around it, square 1:1 composition, no text, no watermark, no logo, no hands, no people.
```

**Papas a la francesa** — `platos/papas.webp` · ⏳ pendiente

```
Photorealistic professional food photography of a basket of golden crispy french fries with sea salt flakes, a small dish of ketchup on the side, freshly made, juicy and mouth-watering, served on a dark matte slate board on a charred dark wooden table, dark charcoal background with a soft warm glow of grill flames and floating embers far behind, warm golden side lighting, subtle red #D9381E and mustard yellow #F2A900 accents, shallow depth of field, high detail, sharp focus on the food, centered with some space around it, square 1:1 composition, no text, no watermark, no logo, no hands, no people.
```

**Aros de cebolla** — `platos/aros.webp` · ⏳ pendiente

```
Photorealistic professional food photography of a stack of eight golden battered onion rings with a small dish of creamy house sauce, freshly made, juicy and mouth-watering, served on a dark matte slate board on a charred dark wooden table, dark charcoal background with a soft warm glow of grill flames and floating embers far behind, warm golden side lighting, subtle red #D9381E and mustard yellow #F2A900 accents, shallow depth of field, high detail, sharp focus on the food, centered with some space around it, square 1:1 composition, no text, no watermark, no logo, no hands, no people.
```

**Nuggets de pollo** — `platos/nuggets.webp` · ⏳ pendiente

```
Photorealistic professional food photography of six golden crispy chicken nuggets with a small dish of honey mustard sauce, freshly made, juicy and mouth-watering, served on a dark matte slate board on a charred dark wooden table, dark charcoal background with a soft warm glow of grill flames and floating embers far behind, warm golden side lighting, subtle red #D9381E and mustard yellow #F2A900 accents, shallow depth of field, high detail, sharp focus on the food, centered with some space around it, square 1:1 composition, no text, no watermark, no logo, no hands, no people.
```

**Papas con cheddar y tocineta** — `platos/papas-cheddar.webp` · ⏳ pendiente

```
Photorealistic professional food photography of golden french fries drenched in melted cheddar cheese sauce and topped with crispy bacon bits and chopped chives, freshly made, juicy and mouth-watering, served on a dark matte slate board on a charred dark wooden table, dark charcoal background with a soft warm glow of grill flames and floating embers far behind, warm golden side lighting, subtle red #D9381E and mustard yellow #F2A900 accents, shallow depth of field, high detail, sharp focus on the food, centered with some space around it, square 1:1 composition, no text, no watermark, no logo, no hands, no people.
```

**Gaseosa** — `platos/gaseosa.webp` · ⏳ pendiente

```
Photorealistic professional food photography of a tall glass of cold cola with ice cubes and condensation droplets, next to a chilled glass bottle, freshly made, juicy and mouth-watering, served on a dark matte slate board on a charred dark wooden table, dark charcoal background with a soft warm glow of grill flames and floating embers far behind, warm golden side lighting, subtle red #D9381E and mustard yellow #F2A900 accents, shallow depth of field, high detail, sharp focus on the food, centered with some space around it, square 1:1 composition, no text, no watermark, no logo, no hands, no people.
```

**Limonada** — `platos/limonada.webp` · ⏳ pendiente

```
Photorealistic professional food photography of a tall glass of fresh frosty lemonade with ice, lime slices and a mint sprig, condensation droplets, freshly made, juicy and mouth-watering, served on a dark matte slate board on a charred dark wooden table, dark charcoal background with a soft warm glow of grill flames and floating embers far behind, warm golden side lighting, subtle red #D9381E and mustard yellow #F2A900 accents, shallow depth of field, high detail, sharp focus on the food, centered with some space around it, square 1:1 composition, no text, no watermark, no logo, no hands, no people.
```

**Malteada** — `platos/malteada.webp` · ⏳ pendiente

```
Photorealistic professional food photography of a tall milkshake in a glass with whipped cream on top, chocolate drizzle and a striped straw, freshly made, juicy and mouth-watering, served on a dark matte slate board on a charred dark wooden table, dark charcoal background with a soft warm glow of grill flames and floating embers far behind, warm golden side lighting, subtle red #D9381E and mustard yellow #F2A900 accents, shallow depth of field, high detail, sharp focus on the food, centered with some space around it, square 1:1 composition, no text, no watermark, no logo, no hands, no people.
```

**Cerveza nacional** — `platos/cerveza.webp` · ⏳ pendiente

```
Photorealistic professional food photography of a cold golden lager beer in a glass with foam and condensation, next to a brown glass bottle with no label, freshly made, juicy and mouth-watering, served on a dark matte slate board on a charred dark wooden table, dark charcoal background with a soft warm glow of grill flames and floating embers far behind, warm golden side lighting, subtle red #D9381E and mustard yellow #F2A900 accents, shallow depth of field, high detail, sharp focus on the food, centered with some space around it, square 1:1 composition, no text, no watermark, no logo, no hands, no people.
```

**Brownie con helado** — `platos/brownie.webp` · ⏳ pendiente

```
Photorealistic professional food photography of a warm chocolate brownie with a scoop of vanilla ice cream melting on top and chocolate sauce drizzle, freshly made, juicy and mouth-watering, served on a dark matte slate board on a charred dark wooden table, dark charcoal background with a soft warm glow of grill flames and floating embers far behind, warm golden side lighting, subtle red #D9381E and mustard yellow #F2A900 accents, shallow depth of field, high detail, sharp focus on the food, centered with some space around it, square 1:1 composition, no text, no watermark, no logo, no hands, no people.
```

**Cheesecake de frutos rojos** — `platos/cheesecake.webp` · ⏳ pendiente

```
Photorealistic professional food photography of a slice of creamy cheesecake with red berry sauce and fresh berries on top, freshly made, juicy and mouth-watering, served on a dark matte slate board on a charred dark wooden table, dark charcoal background with a soft warm glow of grill flames and floating embers far behind, warm golden side lighting, subtle red #D9381E and mustard yellow #F2A900 accents, shallow depth of field, high detail, sharp focus on the food, centered with some space around it, square 1:1 composition, no text, no watermark, no logo, no hands, no people.
```
