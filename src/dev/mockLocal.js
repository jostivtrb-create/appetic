// 🧪 DATOS DE DESARROLLO — solo para construir/probar el motor de menú.
// Se usan únicamente en modo DEV con el slug "demo". NUNCA en producción.

export const MOCK_LOCAL = {
  id: 'demo',
  slug: 'demo',
  nombre: 'Burger Demo',
  descripcion: 'Hamburguesas artesanales · Abierto ahora',
  whatsapp: '573000000000',
  logo: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=200&q=70',
  banner: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&q=70',
  tema: {
    primary: '#E8732B',
    primaryStrong: '#C9531A',
    primarySoft: '#F6A45C',
    onPrimary: '#FFFFFF',
  },
  categorias: [
    { id: 'hamburguesas', nombre: 'Hamburguesas', emoji: '🍔' },
    { id: 'salchipapas', nombre: 'Salchipapas', emoji: '🍟' },
    { id: 'combos', nombre: 'Combos', emoji: '🥤' },
    { id: 'bebidas', nombre: 'Bebidas', emoji: '🧃' },
  ],
}

export const MOCK_PRODUCTOS = [
  {
    id: 'p1',
    categoria: 'hamburguesas',
    nombre: 'Hamburguesa Clásica',
    descripcion: 'Carne 100% res, lechuga, tomate, cebolla y salsa de la casa.',
    foto: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500&q=70',
    disponible: true,
    orden: 1,
    variantes: [
      { id: 'v-sencilla', nombre: 'Sencilla', precio: 14000 },
      { id: 'v-doble', nombre: 'Doble carne', precio: 19000 },
    ],
    gruposOpciones: [
      {
        id: 'g-punto', nombre: 'Punto de la carne', tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'o-termino', nombre: 'Término medio', precioExtra: 0 },
          { id: 'o-bien', nombre: 'Bien cocida', precioExtra: 0 },
        ],
      },
      {
        id: 'g-add', nombre: 'Adicionales', tipo: 'multiple', min: 0, max: 5,
        opciones: [
          { id: 'a-queso', nombre: 'Queso extra', precioExtra: 3000 },
          { id: 'a-tocineta', nombre: 'Tocineta', precioExtra: 4000 },
          { id: 'a-huevo', nombre: 'Huevo', precioExtra: 2500 },
        ],
      },
    ],
  },
  {
    id: 'p2',
    categoria: 'hamburguesas',
    nombre: 'Hamburguesa de Pollo',
    descripcion: 'Pechuga apanada crujiente, lechuga, tomate y salsa ranch.',
    foto: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=500&q=70',
    disponible: true,
    orden: 2,
    precio: 16000,
    gruposOpciones: [
      {
        id: 'g-add2', nombre: 'Adicionales', tipo: 'multiple', min: 0, max: 4,
        opciones: [
          { id: 'a-queso2', nombre: 'Queso extra', precioExtra: 3000 },
          { id: 'a-aguacate', nombre: 'Aguacate', precioExtra: 3500 },
        ],
      },
    ],
  },
  {
    id: 'p3',
    categoria: 'salchipapas',
    nombre: 'Salchipapa',
    descripcion: 'Papa a la francesa, salchicha y nuestras salsas.',
    foto: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=500&q=70',
    disponible: true,
    orden: 3,
    variantes: [
      { id: 'v-personal', nombre: 'Personal', precio: 12000 },
      { id: 'v-familiar', nombre: 'Familiar', precio: 22000 },
    ],
    gruposOpciones: [
      {
        id: 'g-salsas', nombre: 'Salsas (hasta 3)', tipo: 'multiple', min: 0, max: 3,
        opciones: [
          { id: 's-rosada', nombre: 'Rosada', precioExtra: 0 },
          { id: 's-bbq', nombre: 'BBQ', precioExtra: 0 },
          { id: 's-ajo', nombre: 'Ajo', precioExtra: 0 },
          { id: 's-picante', nombre: 'Picante', precioExtra: 0 },
        ],
      },
    ],
  },
  {
    id: 'p4',
    categoria: 'combos',
    nombre: 'Combo Clásico',
    descripcion: 'Hamburguesa clásica + papas + bebida a elección.',
    foto: 'https://images.unsplash.com/photo-1610440042657-612c34d95e9f?w=500&q=70',
    disponible: true,
    orden: 4,
    precio: 23000,
    gruposOpciones: [
      {
        id: 'g-bebida', nombre: 'Elige tu bebida', tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'b-gaseosa', nombre: 'Gaseosa', precioExtra: 0 },
          { id: 'b-limonada', nombre: 'Limonada', precioExtra: 1000 },
          { id: 'b-agua', nombre: 'Agua', precioExtra: 0 },
        ],
      },
    ],
  },
  {
    id: 'p5',
    categoria: 'bebidas',
    nombre: 'Gaseosa',
    descripcion: 'Bien fría.',
    foto: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=500&q=70',
    disponible: true,
    orden: 5,
    variantes: [
      { id: 'g-350', nombre: '350 ml', precio: 4000 },
      { id: 'g-15', nombre: '1.5 L', precio: 7000 },
    ],
  },
  {
    id: 'p6',
    categoria: 'bebidas',
    nombre: 'Limonada Natural',
    descripcion: 'Hecha al momento.',
    foto: 'https://images.unsplash.com/photo-1497534446932-c925b458314a?w=500&q=70',
    disponible: false,
    orden: 6,
    precio: 6000,
  },
]
