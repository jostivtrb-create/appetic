#!/usr/bin/env node
// Vuelca a cartilla/fuentes.css las @font-face ya incrustadas en la propuesta.
// Así la cartilla y la propuesta usan EXACTAMENTE la misma tipografía, y el PDF
// no depende de internet ni de las fuentes que tenga instaladas la máquina.
//
//   node cartilla/extraer-fuentes.mjs

import { readFileSync, writeFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const ORIGEN = resolve(AQUI, '../propuesta/propuesta-appetic.html')
const DESTINO = resolve(AQUI, 'fuentes.css')

const bloques = readFileSync(ORIGEN, 'utf8').match(/@font-face\{[^}]*\}/g)
if (!bloques?.length) {
  console.error('No encontré @font-face en', ORIGEN)
  process.exit(1)
}

writeFileSync(DESTINO, [
  '/* Fuentes de marca incrustadas (Playfair Display + Plus Jakarta Sans).',
  '   Copiadas tal cual de propuesta/propuesta-appetic.html para que el PDF no',
  '   dependa de internet ni de lo que haya instalado la máquina que lo genere.',
  '   Regenerar: node cartilla/extraer-fuentes.mjs */',
  ...bloques,
  '',
].join('\n'))

console.log(`✅ fuentes.css — ${bloques.length} tipografías, ${Math.round(statSync(DESTINO).size / 1024)} KB`)
