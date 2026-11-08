// Copia la parte pública de los paquetes (sin precios) a la propuesta web:
//   node scripts/exportar-paquetes.mjs  →  ../web/appetic/paquetes.json
// Correr cada vez que cambie src/utils/paquetes.js, y subir ese archivo por FTP.
import { writeFileSync } from 'node:fs'
import { paquetesPublicos } from '../src/utils/paquetes.js'
const destino = new URL('../../web/appetic/paquetes.json', import.meta.url)
writeFileSync(destino, JSON.stringify(paquetesPublicos(), null, 1) + '\n')
console.log('✓', destino.pathname)
