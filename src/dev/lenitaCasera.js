// 🔥🪵 LEÑITA CASERA — Restaurante · Parrilla · datos del local (fuente única de verdad).
//
// Este mismo archivo lo usan:
//   • La vista previa en producción/DEV  (?preview=1 · src/preview.js)
//   • El alta real en producción          (scripts/seed-lenita-casera.mjs)
//
// Es JS plano (sin React ni imports de imágenes): funciona igual en navegador y en Node.
//
// 📋 MATERIAL (20-nov-2026): tres cartas del día (afiches hechos con IA) — misma estructura, días
//    distintos: Almuerzo casero ($15.000 · $16.000 para llevar) con Entrada / Principio / Proteína /
//    Bebida a elegir, un "Recomendado" que cambia (Mondongo $20.000 · $21.000 llevar; otros días
//    Bagre en salsa o Bistec a caballo) y los Especiales a la leña.
//
// 🎨 ADN de la marca (de SU logo: tronco de leña con llama): MADERA café oscuro, LLAMA naranja y
//    BRASA amarilla, letras gruesas café. Vibra: casero, rústico, fogón de leña. → Piel propia
//    `skin: 'lena'` (src/pages/Local/LocalSkinLena.css): cabecera de tablones de madera oscura con
//    resplandor de brasa abajo y el logo en su letrero, fondo papel kraft (no crema), títulos en
//    letra de letrero (Alfa Slab One) café, precios en naranja llama, botones naranja.
//
// 🖼️ LOGO: recortado de la primera carta (el más limpio de los tres), mejorado con Real-ESRGAN y
//    puesto en su placa crema con canto de brasa (logo.webp). icono.webp = solo el tronco con la llama.
//
// 📷 IMÁGENES: NO se generan aquí. `foto: ''` en todo; los prompts están en
//    public/locales/lenita-casera/PROMPTS.md y el dueño sube cada foto desde su panel.
//
// 🧩 MODELO DEL MENÚ (fiel a sus cartas):
//    • Almuerzo casero: un producto con 4 grupos "elige 1" (Entrada, Principio, Proteína, Bebida) que
//      el dueño cambia a diario desde el panel, + "¿Dónde lo comes?" (para llevar +$1.000, como su carta).
//    • Recomendado del día: un producto que el dueño renombra cada día (hoy Mondongo), mismo
//      "¿Dónde lo comes?" (+$1.000 para llevar).
//    • Especiales a la leña: "acompañado de sopa, fruta o huevo · papa a la francesa · jugo natural o
//      limonada". Leñita 150 g / Leña 200 g / Leñazo 250 g = tamaños del corte (churrasco, pechuga o
//      cerdo, a elegir). Bondiola y Punta de anca = cortes de cerdo de 200 g.
//      ⚠️ SUS CARTAS NO TRAEN PRECIO DE LOS ESPECIALES: los de aquí son PROVISIONALES (marcados
//      «por confirmar»). Confírmalos con el dueño antes de encender el local.

export const SLUG = 'lenita-casera'

// Correo del DUEÑO que administra el local (entra a /lenita-casera/admin con ese Google).
// ⚠️ POR DEFECTO: 'sinfiniity@gmail.com' (NUESTRA cuenta, no la del cliente) hasta que dé su Gmail.
//    Se cambia sin tocar código desde /superadmin (campo 👤) o re-corriendo el seed.
export const ADMIN_EMAIL = 'sinfiniity@gmail.com'

export const LENITA_LOCAL = {
  id: SLUG,
  slug: SLUG,
  nombre: 'Leñita Casera',
  descripcion: 'Restaurante · Parrilla — sabor de hogar, hecho a la leña',
  // 📱 POR DEFECTO (sus cartas no traen número): los pedidos llegan a NUESTRO número hasta que el
  //    dueño ponga el suyo en el panel (⚙️ Configuración → Datos del negocio). Es también el número
  //    del afiche de domicilios de la pestaña 📣 Difundir.
  whatsapp: '573208435143',

  logo: '/locales/lenita-casera/logo.webp',    // wordmark en su placa crema con canto de brasa
  icono: '/locales/lenita-casera/icono.webp',  // tronco con llama, cuadrado (inicio, superadmin)
  logoAnim: 'lado',
  banner: '',    // el dueño sube el banner desde su panel (prompt en PROMPTS.md)
  tema: {
    primary: '#E2621B',        // naranja llama (botones, chips, acción)
    primaryStrong: '#B4440C',  // brasa honda
    primarySoft: '#F4A62A',    // amarillo brasa (degradados)
    onPrimary: '#FFFFFF',
    accent: '#5A2A12',         // café madera del tronco y las letras del logo
    bg: '#EFDFC5',             // papel kraft / madera clara (NO crema)
    hero: 'logo',              // el logo ya trae el nombre
    skin: 'lena',              // piel propia: src/pages/Local/LocalSkinLena.css
    navSolid: true,            // barra inferior naranja llama
  },

  // 24 horas (abre === cierra): útil para probar a cualquier hora. El dueño ajusta el real.
  horario: { abre: '00:00', cierra: '00:00' },

  recoger: true,
  domicilio: { activo: false, maxKm: 3, tarifas: {} },

  pagos: [
    { id: 'efectivo', nombre: 'Efectivo', tipo: 'efectivo' },
    { id: 'nequi', nombre: 'Nequi / Daviplata', tipo: 'transferencia', llave: '' },
  ],

  categorias: [
    { id: 'recomendado', nombre: 'Recomendado del día', emoji: '⭐' },
    { id: 'almuerzo', nombre: 'Almuerzo casero', emoji: '🍛' },
    { id: 'lena', nombre: 'Especiales a la leña', emoji: '🔥' },
  ],

  // 🗂️ Etiquetas del INICIO (src/config/categoriasLocales.js).
  etiquetas: ['almuerzos', 'asados'],

  admins: [ADMIN_EMAIL],
  // activa:false → NO sale aún en el buscador público: WhatsApp por defecto y precios de los
  // especiales por confirmar. Se enciende desde /superadmin cuando el dueño dé el visto bueno.
  suscripcion: { activa: false, plan: 'piloto' },
  menuVersion: 1,
}

// ─────────────────────────── Grupos reutilizables ───────────────────────────

// Su carta: "$15.000 | $16.000 Llevar" y "$20.000 (Local) | $21.000 (Llevar)".
const DONDE = {
  id: 'g-donde', nombre: '¿Dónde lo comes?', subtitulo: 'Elige 1', emoji: '🍽️',
  tipo: 'unica', min: 1, max: 1,
  opciones: [
    { id: 'local', nombre: 'Aquí en el local', emoji: '🪑', precioExtra: 0, foto: '' },
    { id: 'llevar', nombre: 'Para llevar (con empaque)', emoji: '🥡', precioExtra: 1000, foto: '' },
  ],
}

// Especiales: "Acompañado de Sopa, Fruta o Huevo | Papa a la francesa | Jugo natural o Limonada".
const ACOMP_LENA = {
  id: 'g-acomp', nombre: 'Acompañado de', subtitulo: 'Elige 1', emoji: '🥣',
  tipo: 'unica', min: 1, max: 1,
  opciones: [
    { id: 'sopa', nombre: 'Sopa del día', emoji: '🥣', precioExtra: 0, foto: '' },
    { id: 'fruta', nombre: 'Fruta', emoji: '🍉', precioExtra: 0, foto: '' },
    { id: 'huevo', nombre: 'Huevo', emoji: '🍳', precioExtra: 0, foto: '' },
  ],
}
const BEBIDA_LENA = {
  id: 'g-bebida', nombre: 'Bebida', subtitulo: 'Elige 1', emoji: '🧃',
  tipo: 'unica', min: 1, max: 1,
  opciones: [
    { id: 'jugo', nombre: 'Jugo natural', emoji: '🧃', precioExtra: 0, foto: '' },
    { id: 'limonada', nombre: 'Limonada', emoji: '🍋', precioExtra: 0, foto: '' },
  ],
}
const CORTE_LENA = {
  id: 'g-corte', nombre: '¿Qué va a la leña?', subtitulo: 'Elige 1', emoji: '🔥',
  tipo: 'unica', min: 1, max: 1,
  opciones: [
    { id: 'churrasco', nombre: 'Churrasco', emoji: '🥩', precioExtra: 0, foto: '' },
    { id: 'pechuga', nombre: 'Pechuga', emoji: '🍗', precioExtra: 0, foto: '' },
    { id: 'cerdo', nombre: 'Cerdo', emoji: '🐖', precioExtra: 0, foto: '' },
  ],
}

const INCLUYE_LENA = 'Asado a la leña, con papa a la francesa, sopa, fruta o huevo, y jugo natural o limonada.'

export const LENITA_PRODUCTOS = [
  // ⭐ RECOMENDADO DEL DÍA — el dueño le cambia nombre, descripción y precio cuando cambia el plato.
  {
    id: 'recomendado-del-dia', categoria: 'recomendado', nombre: 'Mondongo',
    descripcion: 'El recomendado de hoy: mondongo casero bien sazonado con papa y zanahoria, acompañado de arroz blanco, aguacate y arepa.',
    foto: '', emoji: '🍲', destacado: true, disponible: true, orden: 1, precio: 20000,
    gruposOpciones: [DONDE],
  },

  // 🍛 ALMUERZO CASERO — las opciones de cada grupo cambian a diario desde el panel.
  {
    id: 'almuerzo-casero', categoria: 'almuerzo', nombre: 'Almuerzo casero',
    descripcion: 'Comida de hogar, hecha hoy. Arma el tuyo: elige entrada, principio, proteína y bebida.',
    foto: '', emoji: '🍛', destacado: true, disponible: true, orden: 2, precio: 15000,
    gruposOpciones: [
      {
        id: 'g-entrada', nombre: 'Entrada', subtitulo: 'Elige 1', emoji: '🥣',
        tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'en1', nombre: 'Sopa de mazamorra de maíz', emoji: '🥣', precioExtra: 0, foto: '' },
          { id: 'en2', nombre: 'Fruta', emoji: '🍉', precioExtra: 0, foto: '' },
        ],
      },
      {
        id: 'g-principio', nombre: 'Principio', subtitulo: 'Elige 1', emoji: '🫘',
        tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'pc1', nombre: 'Fríjol', emoji: '🫘', precioExtra: 0, foto: '' },
          { id: 'pc2', nombre: 'Ahuyama', emoji: '🎃', precioExtra: 0, foto: '' },
        ],
      },
      {
        id: 'g-proteina', nombre: 'Proteína', subtitulo: 'Elige 1', emoji: '🍗',
        tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'pr1', nombre: 'Pechuga en salsa ranchera', emoji: '🍗', precioExtra: 0, foto: '' },
          { id: 'pr2', nombre: 'Lomo de cerdo', emoji: '🐖', precioExtra: 0, foto: '' },
          { id: 'pr3', nombre: 'Res a la plancha', emoji: '🥩', precioExtra: 0, foto: '' },
        ],
      },
      {
        id: 'g-bebida', nombre: 'Bebida', subtitulo: 'Elige 1', emoji: '🧃',
        tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'be1', nombre: 'Limonada', emoji: '🍋', precioExtra: 0, foto: '' },
          { id: 'be2', nombre: 'Jugo de maracuyá', emoji: '🟡', precioExtra: 0, foto: '' },
        ],
      },
      DONDE,
    ],
  },

  // 🔥 ESPECIALES A LA LEÑA — ⚠️ precios PROVISIONALES (sus cartas no los traen).
  {
    id: 'lenita-150', categoria: 'lena', nombre: 'Leñita · 150 g',
    descripcion: `La porción justa. ${INCLUYE_LENA}`,
    foto: '', emoji: '🔥', destacado: true, disponible: true, orden: 3, precio: 22000,
    gruposOpciones: [CORTE_LENA, ACOMP_LENA, BEBIDA_LENA],
  },
  {
    id: 'lena-200', categoria: 'lena', nombre: 'Leña · 200 g',
    descripcion: `Para buen apetito. ${INCLUYE_LENA}`,
    foto: '', emoji: '🪵', disponible: true, orden: 4, precio: 26000,
    gruposOpciones: [CORTE_LENA, ACOMP_LENA, BEBIDA_LENA],
  },
  {
    id: 'lenazo-250', categoria: 'lena', nombre: 'Leñazo · 250 g',
    descripcion: `El más grande de la casa. ${INCLUYE_LENA}`,
    foto: '', emoji: '🥩', disponible: true, orden: 5, precio: 30000,
    gruposOpciones: [CORTE_LENA, ACOMP_LENA, BEBIDA_LENA],
  },
  {
    id: 'bondiola-cerdo', categoria: 'lena', nombre: 'Bondiola de cerdo · 200 g',
    descripcion: `Jugosa y dorada. ${INCLUYE_LENA}`,
    foto: '', emoji: '🐖', disponible: true, orden: 6, precio: 26000,
    gruposOpciones: [ACOMP_LENA, BEBIDA_LENA],
  },
  {
    id: 'punta-anca-cerdo', categoria: 'lena', nombre: 'Punta de anca de cerdo · 200 g',
    descripcion: `Con su gordito crocante. ${INCLUYE_LENA}`,
    foto: '', emoji: '🍖', disponible: true, orden: 7, precio: 26000,
    gruposOpciones: [ACOMP_LENA, BEBIDA_LENA],
  },
]
