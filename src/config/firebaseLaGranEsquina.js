// 🔗 Segunda conexión: la base de datos de La Gran Esquina.
//
// La Gran Esquina no es un local más. Es un negocio con su PROPIA app —caja,
// cocina, inventario, cierre de turno— y su propio proyecto de Firebase. Su
// almuerzo del día lo publica la cocinera desde allá cada mañana.
//
// Appetic no copia ese menú: lo LEE. Por eso hace falta una conexión aparte,
// porque son dos proyectos distintos y `db` solo habla con el de Appetic.
//
// ── Por qué leer y no copiar ──
//
// La alternativa era espejar el menú en los productos de Appetic cada vez que
// la cocinera publica. Dos copias de la misma verdad se separan siempre, y se
// separan justo en el peor momento: cuando se acaba una proteína a la mitad
// del servicio. Aquí solo hay una verdad, y vive donde la escriben.
//
// ── Es de SOLO LECTURA ──
//
// Appetic nunca escribe el menú de La Gran Esquina. Lo único que le manda de
// vuelta es el pedido del cliente, y eso va por su propio camino
// (`customerOrders`, que allá acepta creación pública a propósito).
//
// Las reglas del otro lado ya permiten leer `menuItems` y `dailyMenu` sin
// cuenta — están abiertas para su propia página de clientes. No hubo que
// tocarlas: son nombres de platos y precios, lo mismo que se ve en la carta
// pegada en la pared.

import { initializeApp, getApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const LA_GRAN_ESQUINA_CONFIG = {
  apiKey: 'AIzaSyA30ovxeNcVKw1-Ydx0yUMwbG_N-sssm1M',
  authDomain: 'la-gran-esquina.firebaseapp.com',
  projectId: 'la-gran-esquina',
  storageBucket: 'la-gran-esquina.firebasestorage.app',
  messagingSenderId: '84266168747',
  appId: '1:84266168747:web:8aee441ce8d32d812da2ee',
}

// El nombre del app importa: sin él, Firebase devolvería la instancia por
// defecto (la de Appetic) y estaríamos leyendo la base equivocada sin ningún
// aviso — el menú saldría vacío y nadie sabría por qué.
const NOMBRE = 'la-gran-esquina'

let dbCache = null

/**
 * La base de datos de La Gran Esquina, creada la primera vez que se pide.
 *
 * Es perezosa a propósito: la mayoría de los clientes de Appetic nunca abren
 * este local, y no tiene sentido que carguen una segunda conexión para nada.
 */
export function dbLaGranEsquina() {
  if (dbCache) return dbCache
  const app = getApps().some(a => a.name === NOMBRE)
    ? getApp(NOMBRE)
    : initializeApp(LA_GRAN_ESQUINA_CONFIG, NOMBRE)
  dbCache = getFirestore(app)
  return dbCache
}

/**
 * La fecha de hoy como la ve el negocio: Bogotá, en formato YYYY-MM-DD.
 *
 * Tiene que ser la MISMA cuenta que hace La Gran Esquina al publicar
 * (`todayStr()` allá). Si Appetic usara la hora del dispositivo, un cliente con
 * el celular en otra zona —o simplemente mal puesto— pediría el menú de ayer o
 * el de mañana, que está vacío.
 */
export function fechaDeHoyBogota() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
}
