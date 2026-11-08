# Guía para las Mejoras frente a Loggro

> Documento vivo. Aquí queda **todo lo decidido**, para no depender de la memoria del chat.
> Si se cierra la sesión, se retoma leyendo este archivo.

- **Tarea:** decidir qué funciones agregar a Appetic tras compararlo con Loggro Restobar, y construirlas.
- **Inicio:** 7 de noviembre de 2026
- **Estado:** 🔵 Construyendo — pasos 1 y 2 publicados el 7-nov; paso 3 (impresora) hecho y probado en local, sin publicar
- **Proyecto:** `~/Apps Zeven/Swiftfly Solutions/Appetic`

---

## 0. Contexto: la comparación (7-nov-2026)

**Loggro Restobar** (antes PirPos, de Loggro S.A.S., Itagüí). Planes al mes, IVA 0%:
- **Básico $120.990:** 1 caja, 3 usuarios, 15 mesas, 30 facturas DIAN, sin pantalla de cocina.
- **Estándar $175.990:** 2 cajas, 6 usuarios, 30 mesas, pantalla de cocina.
- **Premium $219.990:** 5 cajas, usuarios ilimitados, 200 mesas, Rappi y pago con QR incluidos.

Los tres planes traen inventario con recetas, menú QR, app del mesero, reportes y DIAN (solo 30 facturas al mes).

Lo que cobran aparte:
- facturas ilimitadas desde $45.990 al mes;
- cargar la carta, $488.990;
- Rappi, $681.990 de configuración más $20.990 al mes;
- otra sede, $96.990 al mes;
- capacitación, $115.000 la hora.

No devuelven dinero.

Puntos débiles:
- tienen 3,4 estrellas en App Store, con quejas de desconexiones y de comandas que se borran;
- sin internet no hay comandas ni pantalla de cocina;
- para imprimir hay que instalar un programa;
- no hay calculadora de vueltas en la factura electrónica ni conteo por billetes al cerrar caja.

**Ellos tienen y Appetic no:**
- facturación DIAN;
- inventario con recetas;
- impresora térmica, cajón y báscula;
- datáfonos (Bold, SumUp y Credibanco);
- Rappi;
- contabilidad y nómina electrónica;
- varias sedes;
- cobro con QR en la mesa;
- impuesto al consumo;
- varias cajas;
- apps en las tiendas.

**Appetic tiene y ellos no:**
- cuesta entre la mitad y un tercio;
- el montaje y las fotos van incluidos;
- el TV en vivo;
- los pedidos llegan al WhatsApp;
- el envío se cobra por distancia;
- usuarios y mesas sin límite en el Empresario;
- no hay nada que instalar;
- la nómina y la ganancia vienen incluidas;
- herramientas para difundir el negocio;
- se paga al final.

Fuentes: los textos de su web y de sus contratos quedaron en el scratchpad de esa sesión, que se pierde al cerrarla.

---

## 1. Objetivo

Subir Appetic para que también le sirva a **restaurantes formales**, sin perder a los pequeños. Para eso agregamos lo que hoy nos hace perder frente a Loggro: inventario con recetas, cobro en línea, datáfono, impresora térmica y cierre de caja contando billetes. La DIAN **no** la hacemos nosotros.

---

## 2. Decisiones CERRADAS

### De la ronda 1

| # | Decisión | Por qué |
|---|----------|---------|
| D1 | **Cliente:** también los restaurantes formales, además de los pequeños. | Respuesta a P1. **Los planes los define el usuario** ("ahorita te digo cómo cuadraremos los planes"), así que no se pregunta en qué plan va cada función. |
| D2 | **DIAN:** no la hacemos. Recomendamos un aliado y **exportamos las ventas** para que el negocio facture en su propio sistema. | P2. |
| D3 | **Entran:** inventario con recetas y costo por plato, cierre de caja contando billetes y monedas, cobro en línea desde el QR o el link, datáfono conectado a la Caja y funcionar mejor sin internet. | P3. |
| D4 | **Rappi y DiDi: se intenta la integración**, aunque yo recomendé no hacerla. | S1. |
| D5 | **La comparación sirve para vender:** cuadro «Appetic vs un sistema POS tradicional» en la propuesta, **sin nombrar a nadie**. | S4. |

### De la ronda 2

| # | Decisión | Por qué |
|---|----------|---------|
| D6 | **Impresora térmica: sí entra**, para comandas en cocina y ticket en caja, **sin instalar nada**. Es **opcional**: cada local la prende si quiere. | P1, que resolvió el choque de la ronda 1. |
| D7 | **Los insumos entran desde el mismo gasto** de Cuentas: anotar la compra sube el inventario y actualiza el costo. | P2. |
| D8 | **Cuando un insumo se acaba, solo se avisa** al dueño y a la caja. Los platos **no** se agotan solos. | P3. |
| D9 | **Pasarela y datáfono: el negocio elige entre varias empresas.** | P4. |
| D10 | **La plata del cobro en línea llega directo al negocio**, a su propia cuenta de la pasarela. Swiftfly nunca toca el dinero. | P5. |
| D11 | **Se paga en línea en domicilios y para recoger**, no en la mesa. **Siempre opcional** para el cliente. | P6 y P7. |
| D12 | **DIAN:** se exporta un **Excel general** de ventas, sin aliado concreto. | P9. |
| D13 | **Inventario con conteo físico y merma.** | S1. |
| D14 | **La comisión de la pasarela no va en la propuesta**; la explica el vendedor. | S2. |
| D16 | **«Sin internet» sale: la app funciona siempre con internet.** Esto revierte esa parte de D3. | El usuario lo eligió en el chat al resolver el choque. |
| D17 | **El conteo de billetes es un arqueo, cuando quieran.** Se mantiene D7 de la guía «Cuentas del negocio» (sin abrir ni cerrar caja). Botón «Contar la caja»: se cuentan los billetes y las monedas, la app compara contra el efectivo que debería haber y la diferencia queda registrada. | Choque con D7 de Cuentas, resuelto en el chat. |
| D18 | **El cajero cuenta a ciegas.** No ve cuánto debería haber, igual que hoy no ve saldos. El dueño ve si sobra o falta y decide si ajusta. | Chat. Así nadie maquilla el conteo. |
| D15 | **Rappi y DiDi salen.** Esto revierte D4: el usuario no sabía que hacía falta aprobación de ellos. | S3: «Entonces no». |

---

## 3. Suposiciones del agente

- **S1** — **Ya existe y no se pregunta:**
  - la Caja calcula las vueltas con billetes rápidos (`Cobro.jsx`);
  - maneja propina, descuentos y cortesías, y varias cuentas de pago (efectivo, Nequi, tarjeta);
  - reporta las ventas por hora, por plato y por tipo (`resumen/d_*` y `m_*`);
  - exporta el mes a Excel y PDF (`exportarMes.js`);
  - el dueño puede tener varios locales y cambiar de uno a otro (`PanelRail`), pero cada local tiene su propia carta.

  *(deducida del código)*
- **S2** — El inventario solo existe en la integración externa de La Gran Esquina (`services/menuLaGranEsquina.js`), que tiene su propia app. No es una función de Appetic. *(deducida del código)*
- **S4** — La propuesta web y el PDF **no mencionan** una función hasta que esté publicada y probada. *(S3 «decide tú» → mi recomendación)*
- **S5** — **Planes:** cada función nueva se construye con su «candado» en `utils/plan.js` (`MINIMO`). Mientras el usuario no traiga los planes, todas quedan en **Empresario**; moverlas después es una línea.
- **S6** — **Recetas por producto y por opción** (una adición de queso descuenta su queso). Unidades: g, ml y unidad. El costo es el **promedio ponderado** de las compras. Los costos y la ganancia por plato **solo los ve el dueño** (como Cuentas).
- **S7** — **Arqueo** (D17, D18): denominaciones colombianas desde $100.000 hasta $50. Como el cajero no puede leer los saldos, el esperado lo toma el servidor (`/api/arqueo`) en el momento del conteo. Ajustar es crear un «Meter» o «Sacar» con el concepto «Diferencia del arqueo».
- **S8** — **Impresión sin instalar nada:**
  - lo automático (la comanda sale sola en cuanto llega) usa una impresora USB o Bluetooth desde Chrome, en Android o en el PC, con comandos ESC/POS;
  - de respaldo queda el «Imprimir» del navegador en 58 u 80 mm;
  - para imprimir solas, las comandas necesitan la cocina con Appetic abierto.
- **S9** — **Orden de las pasarelas:**
  1. **Wompi** primero, porque tiene API pública y modo de pruebas;
  2. luego **Bold** (link de pago y, si su API lo permite, el datáfono);
  3. al final **Mercado Pago**.

  El negocio pega sus propias llaves en el panel. **El datáfono depende de que el proveedor tenga una API abierta**; si no la tiene, ese proveedor se cae del datáfono y se anota aquí.
- **S3** — Sin internet hoy solo hay `utils/conTope.js`, que avisa de que no hay red. No hay caché de Firestore sin conexión. *(deducida de `config/firebase.js`)*

---

## 4. Descartado (no volver a proponer)

- **Inventario sencillo** → se prefirió el inventario con recetas.
- **Impuesto al consumo, varias cajas a la vez, varias sedes con la misma carta y app en Play Store** → no se marcaron en la ronda 1.
- **Hacer nosotros la facturación DIAN** (ni con un facturador conectado) → D2.
- **Rappi y DiDi** → D15.
- **Pagar en línea desde la mesa** → D11.
- **Funcionar sin internet** → D16.
- **Agotar los platos solos cuando se acaba un insumo** → D8.

---

## 5. Estado de las rondas

- **Ronda 1 — Qué entra y qué no** ✅ respondida
- **Ronda 2 — Cómo funciona cada cosa** ✅ respondida
- **Ronda 3** ❌ no se hace: solo queda el choque de «sin internet», que se resuelve en el chat.

---

## 6. Incógnitas abiertas

1. Los planes y los precios → **los trae el usuario** (S5 mientras tanto).

---

## 7. Plan de implementación

Va de lo más pequeño y seguro a lo que depende de terceros. Cada paso se audita y se publica por separado.

- [x] 1 · **Contar la caja (arqueo)** (D17, D18, S7). Hecho y publicado el 7-nov.
  - `utils/arqueo.js`: denominaciones, limpiar y sumar el conteo, y el ajuste.
  - `api/arqueo.js`: el esperado lo pone el servidor.
  - En `services/cuentas.js`: `contarCaja`, `escucharArqueos` y `revisarArqueo`, con el motor de Firestore y el de la demo.
  - `ContarCaja.jsx`: botón 🧮 en la cabecera de la Caja.
  - `ArqueosLista.jsx`: en Cuentas → Saldos, solo para el dueño.
  - Reglas de `arqueos/`; `api/demo.js` borra los arqueos al reiniciar.
- [x] 2 · **Excel de ventas para la DIAN** (D12). Hecho el 7-nov.
  - En Cuentas → Mes, la tarjeta «🧾 Ventas para facturar» baja `<local>-ventas-para-facturar-<mes>.csv` (`filasParaFacturar` en `exportarMes.js`).
  - Es una tabla plana con una fila por producto.
  - El cliente va como «Consumidor final 222222222222».
  - El descuento se reparte entre las líneas para que sumen exacto el total.
  - La propina y el total de la venta van solo en la primera línea de cada venta.
- [x] 3 · **Impresora térmica** (D6, S8). Hecho el 7-nov, sin publicar.
  - `utils/impresora/`:
    - `documento.js`: arma el ticket, la comanda (con «CAMBIO») y la prueba;
    - `escpos.js`: los pasa a ESC/POS con la página de códigos PC850 para las tildes;
    - `html.js`: el «Imprimir» del navegador en 58 u 80 mm;
    - `conexion.js`: WebUSB, Web Serial y Web Bluetooth, recordados por aparato.
  - **Configuración → 🖨️ Impresora** (`ConfigImpresora.jsx`): la prende el dueño; elige comandas y/o ticket, el ancho del papel y el texto de arriba y de abajo, con una muestra del ticket.
  - **Botón 🖨️** (`Impresora.jsx`) en la Caja y en la Cocina: cada aparato conecta su impresora y decide si imprime solo.
  - **Lo que sale solo:**
    - la comanda nueva, y otra vez si cambia, sin repetir (`appetic_impresas_<local>`);
    - el ticket al cobrar.
  - **Lo que se imprime a mano:** «Imprimir ticket» en el detalle de Ventas y «Reimprimir» en cada comanda.
  - **Plan:** `impresora` y `arqueo` quedan en Empresario (S5), con su candado; `/api/arqueo` también lo exige.
- [x] 4 · **Inventario con recetas** (D7, D8, D13, S6). Hecho el 7-nov, sin publicar.
  - `utils/inventario.js` (los cálculos), `services/inventario.js` (motor de Firestore y motor de la demo) y `AdminInventario.jsx`, con sus pestañas: Insumos, Recetas (costo y ganancia por plato), Contar y Proveedores (pedir por WhatsApp).
  - **Ventas:** descuentan con `increment` dentro de la transacción de la venta; la venta guarda `inventario[]` y, si se elimina, lo devuelve.
  - **Compras:** desde Caja → Gastos, con «Es compra de insumos», usando el costo promedio ponderado.
  - **Aviso de recarga** en la cabecera de la Caja (D8: solo avisa).
  - **Reglas:** el cajero solo toca `stock` y `costoUnit` y solo crea movimientos de compra. 14 de 14 pruebas OK en el emulador.
  - **Decidido sobre la marcha:**
    - la receta es por PRODUCTO, no por opción (la venta guarda las opciones como texto);
    - un insumo no se borra: se marca «ya no lo usamos»;
    - el cajero puede leer el costo de los insumos, pero ninguna pantalla suya lo muestra.
- [ ] 5 · **Cobro en línea** (D9, D10, D11, S9): Wompi primero, con las llaves del negocio. El pedido queda «pagado» cuando el aviso de la pasarela llega a `/api`. Siempre opcional, en domicilios y para recoger.
- [ ] 6 · **Datáfono** (D9, S9): antes de construir, confirmar qué proveedores tienen API.
- [ ] 7 · **Bold y Mercado Pago** en línea.
- [ ] 8 · **Cuadro comparativo en la propuesta** (D5, D14, S4), solo con lo ya publicado.

---

## 8. Bitácora

- **7-nov-2026** — Investigación de Loggro y comparación entregadas en el chat. Ronda 1 creada y respondida. Ronda 2 creada y respondida. Rappi y DiDi salen (D15). Plan escrito. El choque de «sin internet» se resolvió en el chat: sale (D16). Empieza la construcción.
- **7-nov-2026 · paso 1.** Apareció otro choque, ahora con D7 de «Cuentas del negocio» (sin abrir ni cerrar caja). Se resolvió en el chat: D17 y D18.
  - **Problema:** el cajero no puede leer los saldos, así que no podía guardar el esperado. **Solución:** `/api/arqueo` con firebase-admin toma el saldo dentro de una transacción.
  - **Reglas:** 9 de 9 pruebas OK en el emulador (`scratchpad/reglas/prueba-arqueos.mjs`, que se pierde al cerrar la sesión). Se probó que el cajero no lee ni crea arqueos, que el dueño solo toca `revisado` y que el visitante de la demo solo ve los de la demo.
  - **Navegador** (`?preview=1`, Sabor del Día):
    - se contaron $240.500 contra $1.550.800 → «Faltan $1.310.300»;
    - «Ajustar el saldo» creó «Retiro · Diferencia del arqueo» y el efectivo quedó en $240.500;
    - en el celular el botón no cabía en la cabecera: ahora solo va el 🧮.
  - **Sin probar:** `/api/arqueo` contra Firebase de verdad. Hay que probarlo con el local `demo` después de publicar.
- **7-nov-2026 · paso 2.** Excel para facturar.
  - **Prueba con datos a mano:** el descuento de $10.001 repartido en 3 líneas suma $54.999, exacto; la cortesía sale con total 0.
  - **Prueba en el navegador** (sin descargar nada, se capturó el archivo): 160 líneas en el mes de ejemplo de Sabor del Día.
  - El usuario pidió **publicar los pasos 1 y 2 juntos**.
- **7-nov-2026 · publicación.**
  - **Reglas primero** (cambio puramente aditivo): `--only firestore:rules` con `jostivtrb@gmail.com`; el cruce `163250707814` coincidió. `released rules` a la primera.
  - **Después el push** `ecbf9ff` → Vercel. `/api/arqueo` respondió 401 «Sesión inválida» = la llave ya estaba puesta.
  - **Prueba en producción con el local demo:** se contaron $4.100.000 contra $4.080.000 → «Sobran $20.000». «Dejar así» pasó por las reglas sin error y quedó en Cuentas → Saldos como «Dejado así por Visitante». La consola, sin errores.
- **7-nov-2026 · paso 3, impresora.**
  - **Problema:** la hoja 🖨️ dentro de la cabecera de la Caja heredaba los estilos `.pv-caja > div` y salía deformada. **Solución:** `createPortal` al body, pasándole los colores del local.
  - **Problema:** la casilla «imprimir solo» salía marcada pero no imprimía cuando la preferencia aún no existía. **Solución:** las dos usan ahora «sin decidir = sí».
  - **Prueba de formato** en node: tildes PC850, sangrías, vueltas y el corte del papel.
  - **Prueba en el navegador** (vista previa, con una impresora por puerto serie SIMULADA):
    - una comanda nueva salió sola en 259 bytes, con MESA 7, el ítem, las opciones y «>> bien asada»;
    - al cobrar la mesa con $100.000 salió solo el ticket con «Vueltas $48.000»;
    - «Imprimir ticket» desde Ventas armó la página de 58 mm con el NIT configurado.
  - **SIN PROBAR:** una impresora física. Falta ver qué modelos dejan WebUSB en Windows (el controlador suele no soltarla) y qué impresoras Bluetooth son BLE. Lo va a confirmar el usuario con su impresora.
  - **Decidido sobre la marcha:** el ticket dice «Comprobante de pago. No es factura electrónica.» (D2: Appetic no factura).
