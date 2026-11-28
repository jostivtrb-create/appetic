# 🐔 Chicken Zone — guía del local

- **Link:** `/chicken-zone` · vista previa sin base de datos: `/chicken-zone?preview=1`
- **Panel del dueño:** `/chicken-zone/admin` → entra con Google **gabrielandrescv25@gmail.com**
- **Plan:** Empresario (nace en montaje 7 días; registrar el primer pago en `/superadmin`).
- **Datos del menú:** `src/dev/chickenZone.js` · **Piel:** `src/pages/Local/LocalSkinChicken.css` (negro + amarillo mostaza de su carta)
- **Alta en Firebase:** `node scripts/seed-chicken-zone.mjs` (desde el PC, con `scripts/serviceAccount.json`)

- **Logo:** insignia redonda transparente (`public/locales/chicken-zone/logo.webp` + `icono.webp`); entra cayendo en 3 bloques. La animación se cambia en el panel → Configuración → Apariencia.

## ⚠️ Pendientes
1. **WhatsApp** — está el número por defecto (320 843 5143): los pedidos llegan ahí, NO al local. El dueño
   pone el suyo en ⚙️ Configuración → Datos del negocio (también sale en el afiche de domicilios).
2. **Sabores Postobón** — la carta no los lista; quedaron Manzana, Colombiana, Uva, Naranja y Pepsi. Ajustar en el panel.

## Menú (17 productos, precios de la carta)
- **Burger y Sandwich:** Asada Burger, Crispy Burger, Crispy BBQ, Sándwich Crispy o BBQ (elige pollo), Sándwich XL (elige pollo).
- **Tenders y Wraps:** Tenders Clásicos, Tenders BBQ, Tenders Familiar (crispy / BBQ / mixtos), Wrap Crispy, Wrap a la Plancha.
- **Crispy Combos:** Full Crispy, Combo BBQ, Dúo, Familiar.
- **Adicionales y Bebidas:** Papa Adicional, Limonada, Gaseosa Postobón.
- Todo lo que no es combo trae la opción **"Acompáñalo: papa a la francesa +$5.000"**.

## 📷 Fotos (las pone el dueño)
Panel → editar producto → **✨ Crear con IA** (abre Gemini con el prompt listo) o pegando los prompts de
`public/locales/chicken-zone/PROMPTS.md`; descarga y sube con **📱 Del dispositivo**. El banner va en el panel → Banner.

## 📣 Difundir
En su panel → **📣 Difundir**: QR para imprimir, afiche de domicilios (PDF, con su WhatsApp), link y mensaje de bienvenida.
