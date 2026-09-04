# Fotos de La Gran Esquina

Este local es distinto: su menú **no se edita desde el panel de Appetic**, lo
publica la cocinera desde la app del negocio. Eso quiere decir que el botón
"✨ Crear con IA" de cada producto **no aplica aquí** — no hay productos
guardados que editar.

Por eso las fotos son **fijas** y se guardan en esta carpeta. Son dos, y no
cambian aunque el menú cambie a diario: un corrientazo se ve como un
corrientazo todos los días.

## 1. Banner del local

Va en el inicio de Appetic, en la tarjeta de La Gran Esquina.

> Fotografía cenital de un almuerzo casero colombiano servido en plato blanco
> sobre mesa de madera oscura: arroz blanco, fríjol rojo, una pechuga a la
> plancha dorada, ensalada fresca y un vaso de jugo natural al lado. Al fondo,
> desenfocado, pan artesanal y una taza de café. Luz natural cálida de mediodía
> entrando de lado, sombras suaves. Colores terracota, madera y dorado trigo.
> Estilo fotografía gastronómica real, apetitosa, sin texto ni logos.
> Formato horizontal 16:9.

Guardar como `banner.webp` y subirlo desde el panel → ⚙️ Configuración → Banner.

## 2. Almuerzo del día

> Fotografía en ángulo de 45° de un almuerzo corriente colombiano en plato
> hondo blanco: arroz blanco esponjoso, fríjol rojo, carne en bistec a la
> criolla con cebolla y tomate, ensalada de lechuga y tomate, y un vaso de jugo
> natural de mora al lado. Mesa de madera cálida, servilleta de tela.
> Luz natural suave. Se ve casero y abundante, no de restaurante fino.
> Colores terracota y dorado trigo. Sin texto ni logos. Formato cuadrado 1:1.

Guardar como `almuerzo-del-dia.webp` en esta misma carpeta.

## 3. Almuerzo especial

> Fotografía en ángulo de 45° de un plato fuerte colombiano de almuerzo
> especial: una porción generosa de costillas de cerdo glaseadas sobre arroz,
> con ensalada fresca y patacón. Plato blanco, mesa de madera cálida, luz
> natural suave. Se ve como el plato del día que vale la pena. Colores
> terracota y dorado trigo. Sin texto ni logos. Formato cuadrado 1:1.

Guardar como `almuerzo-especial.webp` en esta misma carpeta.

---

**Al subir las fotos hay que activarlas** en `src/services/menuLaGranEsquina.js`
(constante `FOTOS`, arriba del archivo). Es una línea. Mientras no existan, cada
plato muestra su emoji y el menú se ve bien igual.
