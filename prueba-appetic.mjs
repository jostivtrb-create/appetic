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


// ── 📺 Pantalla de TV (Guía para la Pantalla de TV.md) ──
const tv = await import('./src/utils/pantallaTV.js')
console.log('\n── Pantalla de TV ──')
const localTV = {
  categorias: [{id:'a',nombre:'A'},{id:'b',nombre:'B'},{id:'c',nombre:'C'}],
  pantalla: { categoriasOcultas: ['c'] },
}
const prods = [
  {id:'1',categoria:'a',foto:'x.webp',destacado:true},
  {id:'2',categoria:'a',foto:''},
  {id:'3',categoria:'a',foto:'y.webp',disponible:false},
  {id:'4',categoria:'b',foto:'z.webp',ocultoTV:true},
  {id:'5',categoria:'c',foto:'w.webp'},
  {id:'6',categoria:'borrada',foto:'v.webp'},
]
const vis = tv.platosDelTV(localTV, prods)
eq('sin agotados, ocultos ni categorías escondidas', vis.map(p=>p.id), ['1','2','6'])
const cats = tv.categoriasDelTV(localTV, vis)
eq('categorías vacías fuera; la borrada va a Otros', cats.map(c=>c.id), ['a','_otros'])
const once = {id:'x', platos: Array.from({length:11},(_,i)=>i)}
eq('11 platos en páginas de 9 → 6 + 5', tv.paginarTablero([once], 9).map(p=>p.platos.length), [6,5])
eq('y sabe cuántas páginas son', tv.paginarTablero([once], 9).map(p=>`${p.pagina}/${p.de}`), ['1/2','2/2'])
eq('un solo fuerte se completa con la categoría', tv.colaGrande(vis, cats[0]).map(p=>p.id), ['1'])
eq('la foto que no cargó sale de la cola', tv.colaGrande(vis, cats[1], new Set(['1'])).map(p=>p.id), ['6'])
eq('anuncio sin días ni horas: siempre', tv.anuncioVigente({titulo:'2x1'}, 'mar', 600), true)
eq('anuncio de martes, un lunes: no', tv.anuncioVigente({titulo:'2x1',dias:['mar']}, 'lun', 600), false)
eq('franja 11:00–15:00 a las 10:59: no', tv.anuncioVigente({titulo:'x',desde:'11:00',hasta:'15:00'}, 'lun', 659), false)
eq('franja que cruza medianoche, a la 1 a. m.: sí', tv.anuncioVigente({titulo:'x',desde:'20:00',hasta:'02:00'}, 'lun', 60), true)
eq('anuncio apagado: no', tv.anuncioVigente({titulo:'x',activo:false}, 'lun', 60), false)
eq('dos tamaños se dicen los dos',
   tv.preciosDelPlato({variantes:[{nombre:'P',precio:19000},{nombre:'F',precio:65000}]}).tipo, 'tamanos')
eq('precio fijo', tv.preciosDelPlato({precio:12000}), {tipo:'fijo',precio:12000})
eq('transición desconocida cae al zoom', tv.transicionDe({pantalla:{transicion:'rara'}}), 'zoom')


// ── 🍲 Menú del día (Etapa B) ──
const md = await import('./src/utils/menuDelDia.js')
console.log('\n── Menú del día ──')
const base = md.menuDelDiaNuevo()
const M = {
  ...base, activo: true, precioMesa: 15000, precioLlevar: 16000,
  franja: { desde: '11:30', hasta: '15:00' },
  semana: { ...base.semana, lun: {
    sopa: [{id:'s1',nombre:'Ajiaco'}],
    principio: [{id:'pr1',nombre:'Fríjoles'},{id:'pr2',nombre:'Lentejas'}],
    proteina: [{id:'p1',nombre:'Pollo'},{id:'p2',nombre:'Mojarra',recargo:4000}],
    jugo: [{id:'j1',nombre:'Limonada'}],
  } },
}
const LUN = { dia:'lun', fecha:'2026-11-02', minutos: 12*60 }
const alm = md.almuerzoDeHoy(M, LUN)
eq('a las 12 del lunes hay almuerzo', !!alm, true)
eq('por la app vale lo de llevar', alm.precio, 16000)
eq('en la mesa vale lo de mesa', md.almuerzoDeHoy(M, {...LUN, contexto:'mesa'}).precio, 15000)
eq('mesero y caja: los dos precios como tamaños',
   md.almuerzoDeHoy(M, {...LUN, contexto:'personal'}).variantes.map(v=>v.precio), [15000,16000])
eq('a las 4 p. m. ya no hay', md.almuerzoDeHoy(M, {...LUN, minutos: 16*60}), null)
eq('el martes sin semana: falta la sopa', md.motivoSinAlmuerzo(M, {...LUN, dia:'mar'}), 'falta:sopa')
eq('los grupos van en orden y la sopa trae su «en vez de»',
   alm.gruposOpciones.map(g=>g.id), ['md-sopa','md-sopa-cambio','md-principio','md-proteina','md-jugo'])
eq('el «en vez de» solo sale si dijo sin sopa', alm.gruposOpciones[1].soloSi, {grupo:'md-sopa',opciones:['sin-sopa']})
eq('el jugo se puede quitar con «no lleva»', alm.gruposOpciones[4].permiteNoLleva, true)
eq('la proteína no', alm.gruposOpciones[3].permiteNoLleva, undefined)
eq('mojarra con recargo', precioUnitario(alm, sel({'md-sopa':['s1'],'md-principio':['pr1'],'md-proteina':['p2'],'md-jugo':['j1']})), 20000)
eq('el cambio de hoy manda sobre la semana',
   md.opcionesDelDia({...M, hoy:{fecha:'2026-11-02', opciones:{sopa:[{id:'x',nombre:'Sancocho'}]}}}, 'lun', '2026-11-02').sopa[0].nombre, 'Sancocho')
eq('el cambio de ayer ya no cuenta',
   md.opcionesDelDia({...M, hoy:{fecha:'2026-11-01', opciones:{}}}, 'lun', '2026-11-02').sopa[0].nombre, 'Ajiaco')
eq('lo agotado hoy sale', md.opcionesVigentes({...M, agotadas:{fecha:'2026-11-02', ids:['p2']}}, 'lun', '2026-11-02').proteina.map(o=>o.id), ['p1'])
eq('lo agotado ayer vuelve', md.opcionesVigentes({...M, agotadas:{fecha:'2026-11-01', ids:['p2']}}, 'lun', '2026-11-02').proteina.length, 2)
eq('la tarjeta dice qué trae', alm.descripcion, 'Con ajiaco, fríjoles o lentejas, pollo o mojarra y limonada.')
const con = md.conMenuDelDia({categorias:[{id:'a'}], menuDelDia: M}, [{id:'x'}], LUN)
eq('dos principios para escoger', alm.gruposOpciones[2].max, 2)
eq('el almuerzo va de primero, en su categoría', [con.local.categorias[0].id, con.productos[0].id], ['_menu-del-dia','menu-del-dia'])


// ── 🔔 Turnos y pedidos listos (Etapa C) ──
const tu = await import('./src/utils/turnos.js')
console.log('\n── Turnos y pedidos listos ──')
const conListos = { pantalla: { pedidosListos: true } }
eq('para llevar con listos prendidos: lleva turno', tu.llevaTurno(conListos, {tipo:'llevar'}, 'caja'), true)
eq('del QR de la mesa: también', tu.llevaTurno(conListos, {tipo:'mesa', mesa:'4'}, 'qr'), true)
eq('mesa tomada por el mesero: no', tu.llevaTurno(conListos, {tipo:'mesa', mesa:'4'}, 'mesero'), false)
eq('sin cocina: no', tu.llevaTurno({ ...conListos, usaCocina: false }, {tipo:'llevar'}, 'caja'), false)
eq('con listos apagados: no', tu.llevaTurno({}, {tipo:'llevar'}, 'caja'), false)
eq('el primero del día es el 1', tu.siguienteTurno(null, '2026-11-02'), 1)
eq('sigue contando el mismo día', tu.siguienteTurno({fecha:'2026-11-02', n:14}, '2026-11-02'), 15)
eq('al otro día vuelve a 1', tu.siguienteTurno({fecha:'2026-11-01', n:90}, '2026-11-02'), 1)
eq('primer nombre', tu.nombreCorto('  Ana María Pérez '), 'Ana')
const l1 = tu.agregarListo(null, {id:'a', turno:1, en:1}, '2026-11-02')
const l2 = tu.agregarListo(l1, {id:'b', turno:2, en:2}, '2026-11-02')
eq('el más nuevo va arriba', l2.items.map(x=>x.turno), [2,1])
eq('no repite la misma comanda', tu.agregarListo(l2, {id:'a', turno:1, en:3}, '2026-11-02').items.map(x=>x.id), ['a','b'])
eq('lo de ayer se borra', tu.agregarListo({fecha:'2026-11-01', items:[{id:'z'}]}, {id:'a'}, '2026-11-02').items.map(x=>x.id), ['a'])
eq('deshacer lo saca', tu.quitarListo(l2, 'b').items.map(x=>x.id), ['a'])
eq('a los 12 minutos sale de la franja', tu.listosVigentes({items:[{en:0},{en:600000}]}, 12*60000).length, 1)

console.log(f===0 ? '\n✅ TODO PASA — los dos lados cuadran\n' : `\n❌ ${f} FALLO(S)\n`)
process.exit(f===0?0:1)
