# 🎯 Menú fiel al cliente + más hermoso (no al revés)

Dos mandamientos al construir el menú de un local:

1. **Adapta el menú DIGITAL al menú REAL del cliente — nunca al revés.**
2. **Mejóralo en estética y claridad — nunca lo empeores.**

---

## 1) Fidelidad: representa lo que el cliente DE VERDAD vende

El cliente manda. La app tiene varios modelos de producto; **elige el que calza con cómo se
vende cada cosa**, para que las opciones **funcionen** y no confundan. Aprendizaje de Perros
Criiollos: forzar un producto en un modelo que no le va deja opciones que no sirven; hubo que
adaptarlo (armador por pasos) a cómo el cliente arma el perro. Regla: **si una opción no funciona
o se siente rara, cambia el MODELO, no el menú del cliente.**

### Cómo mapear cada ítem al modelo correcto
- **Precio fijo, sin elección** → `precio` (se agrega directo, sin modal). Ej. una gaseosa.
- **Se elige UN tamaño/presentación que fija el precio** → `variantes: [{id,nombre,precio}]`.
  Ej. jugo pequeño/grande. (No uses gruposOpciones para esto: las variantes cambian el precio base.)
- **Se elige 1 entre varias, mismo precio** → `gruposOpciones` `tipo:'unica'` `min:1,max:1`
  (obligatorio). Ej. proteína/principio/jugo del almuerzo, punto de la carne, acompañamiento.
- **Se agregan varias (adiciones/toppings)** → `tipo:'multiple'` (`min:0`), cada una con
  `precioExtra` (0 = gratis). Ej. adiciones, salsas.
- **"Arma tu X" con muchas opciones libres** → `modo:'pasos'` (armador por pasos). Ej. Perros Criiollos.
- **Combinaciones (tamaño + sabores + adiciones)** → combina `variantes` + varios `gruposOpciones`.

### Fidelidad también es
- **No inventes ni quites** productos, precios ni opciones del menú real (si es demo, sí los
  defines tú). Precios como número (sin símbolo), tal cual el cliente los cobra.
- **Obligatorio vs opcional** como en la vida real (`min:1` = obligatorio). Que el cliente no pueda
  pedir algo imposible ni se salte una elección necesaria.
- **Agotados**: lo que hoy no hay, `disponible:false` (o el dueño lo apaga en el panel).

---

## 2) Mejorar la estética — versión digital MÁS bonita que la original

La app es la vitrina: debe verse **mejor** que la carta en papel/PDF, nunca peor.

- **Estructura clara:** agrupa en **categorías con sentido** y buen orden (lo fuerte primero). Marca
  el producto estrella con `destacado:true`. Emoji temático por categoría.
- **Descripciones que antojan:** cortas, sabrosas, sin errores. Si el cliente las trae secas
  ("Bandeja"), enriquécelas con lo que lleva ("Fríjol, arroz, chicharrón, huevo, arepa…") — sin
  inventar ingredientes que no sean.
- **Fotos apetitosas y COHERENTES** con el rubro y la paleta (ver `imagenes.md`). Banner y logo
  cuidados. Si una foto no pega o desentona, regénérala; **no** dejes imágenes feas o genéricas.
- **Paleta ÚNICA y con gusto** sacada del logo (ver Paso 1 del SKILL). Buen contraste del texto.
  Que se sienta de ESE negocio, distinta a los otros locales.
- **Precios y nombres legibles**, sin desbordes; nada de `[[TOKENS]]` ni placeholders visibles.

### Criterio final (pregúntatelo antes de entregar)
- ¿Refleja **fielmente** lo que el cliente vende y **todas las opciones funcionan** (probadas)?
- ¿Se ve **mejor** que su carta original — más clara, más apetitosa, más profesional?
Si la respuesta a cualquiera es "no", ajústalo antes de desplegar. Mejorar, no empeorar.
