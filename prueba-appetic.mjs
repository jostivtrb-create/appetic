// Vite resuelve los imports sin extensión ("./price"); Node no. En vez de
// ensuciar el código de la app con extensiones que solo harían falta aquí, se
// le enseña a Node la misma regla: si no encuentra el módulo, prueba con .js.
import { register } from 'node:module'
register('data:text/javascript,' + encodeURIComponent(`
  export async function resolve(specifier, context, next) {
    try { return await next(specifier, context) }
    catch (e) {
      if (specifier.startsWith('.') && !specifier.endsWith('.js')) {
        return next(specifier + '.js', context)
      }
      throw e
    }
  }
`), import.meta.url)

const { precioUnitario, estaCompleto } = await import('./src/utils/price.js')
const { resumenSeleccion } = await import('./src/utils/selectionSummary.js')
const { seleccionDelArmable } = await import('./src/services/armableSeleccion.js')

// El mismo desayuno del local, tal como Appetic lo arma desde la carta pública:
// precio base = recargo de llevar (por aquí nadie come en el local).
const desayuno = {
  precio: 1500,
  descuentoCompleto: 6000,
  gruposOpciones: [
    { id:'caldo', min:1, max:1, opciones:[{id:'o_cost', precioExtra:8000}] },
    { id:'huevos', min:1, max:1, opciones:[{id:'o_frit', precioExtra:4000},
                                           {id:'o_ranch',precioExtra:6000}] },
    { id:'acompanante', min:1, max:1, opciones:[{id:'o_arroz', precioExtra:3000}] },
    { id:'bebida', min:1, max:1, opciones:[{id:'o_choc', precioExtra:3000},
                                           {id:'o_jugo', precioExtra:5000}] },
  ],
}
const sel = (g, noLleva) => ({ grupos:g, ...(noLleva ? { noLleva } : {}) })
let f = 0
const eq = (t, real, esp) => {
  const ok = JSON.stringify(real) === JSON.stringify(esp); if(!ok) f++
  console.log(`  ${ok?'✅':'❌'} ${t}: ${JSON.stringify(real)}${ok?'':`  ← esperaba ${JSON.stringify(esp)}`}`)
}

const completo = sel({caldo:['o_cost'],huevos:['o_frit'],acompanante:['o_arroz'],bebida:['o_choc']})
const ranchero = sel({caldo:['o_cost'],huevos:['o_ranch'],acompanante:['o_arroz'],bebida:['o_choc']})

console.log('\n── Appetic: los mismos números, más el recargo de llevar ──')
eq('completo 18.000 − 6.000 + 1.500 de llevar', precioUnitario(desayuno, completo), 13500)
eq('rancheros 20.000 − 6.000 + 1.500',          precioUnitario(desayuno, ranchero), 15500)
eq('a medias: sin descuento (8.000 + 1.500)',   precioUnitario(desayuno, sel({caldo:['o_cost']})), 9500)
eq('está completo',                              estaCompleto(desayuno, completo), true)
eq('a medias no está completo',                  estaCompleto(desayuno, sel({caldo:['o_cost']})), false)

console.log('\n── El descuento no se come el recargo de llevar ──')
const barato = {...desayuno, descuentoCompleto: 99000}
eq('descuento gigante: las opciones quedan en 0, el envío se cobra',
   precioUnitario(barato, completo), 1500)

console.log('\n── Un producto sin pasos obligatorios no se lleva el descuento ──')
const suelto = { precio:0, descuentoCompleto:6000,
  gruposOpciones:[{id:'x', min:0, max:1, opciones:[{id:'a', precioExtra:8000}]}] }
eq('grupos opcionales → no hay "completo" que valga', precioUnitario(suelto, sel({x:['a']})), 8000)


// ── ⊘ "No lo lleva" ──────────────────────────────────────────────────────────
//
// El que no quiere chocolate paga lo mismo, pero igual dice CUÁL era y lo
// marca. No es "seguir sin escoger": los pasos son obligatorios, así que sin
// elegir nada el paso no se completa y el descuento no aplica.
console.log('\n── ⊘ No lo lleva: se marca, se cobra igual ──')

// El mismo desayuno, con nombres, para poder leer el resumen que viaja.
const conNombres = {
  ...desayuno,
  gruposOpciones: desayuno.gruposOpciones.map(g => ({
    ...g,
    nombre: { caldo:'Caldos', huevos:'Huevos', acompanante:'Acompañante', bebida:'Bebida' }[g.id],
    opciones: g.opciones.map(o => ({
      ...o,
      nombre: { o_cost:'Caldo de costilla', o_frit:'Huevos fritos', o_ranch:'Huevos rancheros',
                o_arroz:'Arroz con pan', o_choc:'Chocolate', o_jugo:'Jugo' }[o.id],
      lgeProductId: `p_${o.id}`, lgeProductName: o.id, lgeQty: 1,
    })),
  })),
}

const sinBebida = sel(
  {caldo:['o_cost'],huevos:['o_frit'],acompanante:['o_arroz'],bebida:['o_choc']},
  {bebida:true},
)
eq('la bebida marcada no cambia el precio', precioUnitario(desayuno, sinBebida), 13500)
eq('marcado sigue estando completo (el descuento aplica)', estaCompleto(desayuno, sinBebida), true)

// Razón #1 del local: la bebida puede ser un chocolate de $3.000 o un jugo de
// $5.000, y no es lo mismo. Por eso se pregunta cuál era aunque no vaya.
const jugoNoLoLleva = sel(
  {caldo:['o_cost'],huevos:['o_frit'],acompanante:['o_arroz'],bebida:['o_jugo']},
  {bebida:true},
)
eq('el precio sigue a la opción escogida, aunque no la lleve',
   precioUnitario(desayuno, jugoNoLoLleva), 15500)

console.log('\n── ⊘ Lo que viaja de vuelta a la caja ──')
const marcado = seleccionDelArmable(conNombres, sinBebida)
eq('comboNoLleva viaja con el grupo marcado', marcado.comboNoLleva, {bebida:true})
eq('la bebida SÍ va en la selección (la cocina lee cuál era)',
   marcado.comboSeleccion.bebida, 'o_choc')
eq('y también en comboItems, para que no falte el renglón',
   marcado.comboItems.length, 4)

eq('sin nada marcado, comboNoLleva es null (el caso normal)',
   seleccionDelArmable(conNombres, completo).comboNoLleva, null)

// Una marca huérfana —sobre un grupo donde no escogió nada— no significa nada
// y la caja no sabría a qué referirla.
eq('una marca sobre un grupo vacío no viaja',
   seleccionDelArmable(conNombres, sel({caldo:['o_cost']}, {bebida:true})).comboNoLleva, null)

console.log('\n── ⊘ Lo que lee la cocinera en el WhatsApp ──')
eq('el resumen nombra el PASO, no la opción que se cobró',
   resumenSeleccion(conNombres, sinBebida),
   'Completo · Caldo de costilla · Huevos fritos · Arroz con pan · SIN bebida')


// ── El almuerzo no se tocó ───────────────────────────────────────────────────
//
// Comparte el mismo motor y los mismos `min: 1`, pero NO trae
// `descuentoCompleto`: tiene que seguir cobrando la pura suma. Si esto se pone
// rojo, el cambio del desayuno se le metió al almuerzo.
console.log('\n── El almuerzo sigue cobrando igual ──')
const almuerzo = {
  precio: 14000,
  gruposOpciones: [
    { id:'g-soup', min:1, max:1, opciones:[{id:'s1', precioExtra:0}] },
    { id:'g-protein', min:1, max:1, opciones:[{id:'p1', precioExtra:0}, {id:'p2', precioExtra:3000}] },
    { id:'g-adiciones', min:0, max:3, opciones:[{id:'a1', precioExtra:2000}] },
  ],
}
const almuerzoCompleto = sel({'g-soup':['s1'],'g-protein':['p1']})
eq('sin descuentoCompleto no hay rebaja que aplicar',
   precioUnitario(almuerzo, almuerzoCompleto), 14000)
eq('la proteína que cuesta más sigue sumando',
   precioUnitario(almuerzo, sel({'g-soup':['s1'],'g-protein':['p2']})), 17000)
eq('y las adiciones también',
   precioUnitario(almuerzo, sel({'g-soup':['s1'],'g-protein':['p1'],'g-adiciones':['a1']})), 16000)

console.log(f===0 ? '\n✅ TODO PASA — los dos lados cuadran\n' : `\n❌ ${f} FALLO(S)\n`)
process.exit(f===0?0:1)
