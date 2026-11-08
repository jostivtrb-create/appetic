import { useEffect, useMemo, useRef, useState } from 'react'
import { LOGO_ANIMS, resolverLogoAnim } from '../../utils/logoAnim'
import MuestraLogo from './MuestraLogo'
import { Candado, SalirEnBuscador } from './PlanAvisos'
import { tiene } from '../../utils/plan'
import { construirPromptImagenIA } from '../../utils/promptIA'
import { estaAbierto } from '../../utils/horario'
import { PanelHero, PanelCuerpo, PanelLado, PanelTarjeta, PanelSwitch, PanelGuardar, useEntrar } from './PanelPagina'
import './AdminConfig.css'

// 🛵 Cuánto sube el domicilio por cada medio kilómetro cuando el dueño usa el
// botón ↓ para rellenar los tramos de abajo. Es solo un punto de partida
// razonable: después puede editar cualquier tramo a mano.
const ESCALON_DOMICILIO = 500

// Genera los intervalos de 0.5 km hasta el máximo: ['0.5','1.0',...,'maxKm']
function intervalosHasta(maxKm) {
  const out = []
  const max = Number(maxKm) || 0
  for (let k = 0.5; k <= max + 1e-9; k += 0.5) out.push(k.toFixed(1))
  return out
}

// Días de la semana (empezando en lunes). La clave se guarda en Firestore.
const DIAS_SEMANA = [
  { k: 'lun', l: 'L', full: 'Lunes' },
  { k: 'mar', l: 'M', full: 'Martes' },
  { k: 'mie', l: 'M', full: 'Miércoles' },
  { k: 'jue', l: 'J', full: 'Jueves' },
  { k: 'vie', l: 'V', full: 'Viernes' },
  { k: 'sab', l: 'S', full: 'Sábado' },
  { k: 'dom', l: 'D', full: 'Domingo' },
]

// Normaliza los días guardados (objeto, arreglo o nada) a { lun:true, ... }.
// Sin datos previos => abre todos los días (comportamiento anterior).
function diasIniciales(guardados) {
  const base = {}
  for (const { k } of DIAS_SEMANA) {
    if (!guardados) base[k] = true
    else if (Array.isArray(guardados)) base[k] = guardados.includes(k)
    else base[k] = !!guardados[k]
  }
  return base
}

const fmtPesos = (n) => `$${Number(n || 0).toLocaleString('es-CO')}`
const hora12 = hhmm => { const [h, m] = String(hhmm || '0:0').split(':').map(Number); return `${((h + 11) % 12) + 1}${m ? ':' + String(m).padStart(2, '0') : ''} ${h >= 12 ? 'p. m.' : 'a. m.'}` }
// «Todos los días», «Lun a Sáb», «Lun, Mié, Vie»…
function textoDias(dias) {
  const on = DIAS_SEMANA.filter(d => dias[d.k])
  if (on.length === 7) return 'Todos los días'
  if (!on.length) return 'Ningún día'
  const idx = on.map(d => DIAS_SEMANA.indexOf(d))
  const seguidos = idx.every((v, i) => !i || v === idx[i - 1] + 1)
  const c = d => d.full.slice(0, 3)
  return seguidos && on.length > 2 ? `${c(on[0])} a ${c(on[on.length - 1])}` : on.map(c).join(', ')
}

// Diseño (guía «Diseño de pantallas del panel», 8-nov): encabezado grande con resumen, lista a la
// izquierda (en el celular: lista que entra al detalle) y una parte a la vez en tarjetas. Los precios
// del domicilio ya no van en una ventana aparte: caben en su tarjeta. «Guardar cambios» aparece abajo
// solo cuando hay algo sin guardar. La lógica de guardado no cambió.
// `vista`: qué parte de los ajustes se muestra dentro de Configuración (ver AdminAjustes):
//   'negocio'    → WhatsApp, horario, entrega y domicilio por distancia
//   'apariencia' → portada (banner) y animación del logo
// El estado y «Guardar cambios» son los mismos: guarda todo lo del local, se vea o no.
// ¿El tramo tiene precio? Vacío = no; «0» escrito = sí (gratis).
const conPrecio = v => v != null && String(v).trim() !== ''

export default function AdminConfig({ local, onUpdate, onSubirBanner, vista = 'negocio' }) {
  const ver = v => vista === v
  const [whatsapp, setWhatsapp] = useState(local.whatsapp || '')
  const [abre, setAbre] = useState(local.horario?.abre || '11:00')
  const [cierra, setCierra] = useState(local.horario?.cierra || '22:00')
  const [dias, setDias] = useState(() => diasIniciales(local.horario?.dias))
  // Apagado si nunca se configuró: antes nacía prendido y, al guardar cualquier cosa, el local
  // quedaba con domicilio activo y tramos en $0 (envío gratis).
  const [domicilio, setDomicilio] = useState(local.domicilio?.activo === true)
  const [recoger, setRecoger] = useState(local.recoger !== false)
  const [maxKm, setMaxKm] = useState(String(local.domicilio?.maxKm || 5))
  const [tarifas, setTarifas] = useState(() => {
    const base = local.domicilio?.tarifas || {}
    const limpio = {}
    for (const k of Object.keys(base)) limpio[k] = String(base[k] ?? '')
    return limpio
  })
  const [logoAnim, setLogoAnim] = useState(resolverLogoAnim(local))
  const [ubicacion, setUbicacion] = useState(local.ubicacion || null)
  const [ubicEstado, setUbicEstado] = useState('idle') // idle | cargando | ok | error
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  // 🖼️ Banner del local
  const [bannerPreview, setBannerPreview] = useState(local.banner || '')
  const [subiendoBanner, setSubiendoBanner] = useState(false)
  const [avisoBannerIA, setAvisoBannerIA] = useState(null) // null | { prompt }
  // Diseño nuevo (guía «Diseño de pantallas del panel»): lista a la izquierda, una parte a la vez.
  const entrar = useEntrar()
  const [parte, setParte] = useState(vista === 'apariencia' ? 'portada' : 'whatsapp')
  useEffect(() => { setParte(vista === 'apariencia' ? 'portada' : 'whatsapp') }, [vista])
  const elegir = id => { setParte(id); entrar.abrir() }
  // ¿Hay cambios sin guardar? (lo que guarda «Guardar cambios»; banner y buscador se guardan solos)
  const foto = JSON.stringify({ whatsapp, abre, cierra, dias, domicilio, recoger, maxKm, tarifas, logoAnim, ubicacion })
  const inicial = useRef(foto)
  const sinGuardar = foto !== inicial.current

  const keys = useMemo(() => intervalosHasta(maxKm), [maxKm])
  // ¿Algún tramo mostrará el botón ↓? (tiene precio y hay vacíos debajo)
  const hayFill = keys.some((k, i) => conPrecio(tarifas[k]) && i + 1 < keys.length && !conPrecio(tarifas[keys[i + 1]]))

  const ningunDia = !DIAS_SEMANA.some(({ k }) => dias[k])

  // Resumen de tarifas para la tarjeta que abre el modal.
  const resumenPrecios = useMemo(() => {
    if (keys.length === 0) return 'Toca para definir la distancia y los precios'
    const precios = keys.filter(k => conPrecio(tarifas[k])).map(k => Number(tarifas[k]) || 0)
    if (precios.length === 0) return `Hasta ${maxKm} km · aún sin precios`
    const min = Math.min(...precios), max = Math.max(...precios)
    const rango = min === max ? fmtPesos(min) : `${fmtPesos(min)} – ${fmtPesos(max)}`
    // Un tramo sin precio deja al cliente a esa distancia sin poder pedir domicilio.
    const faltan = keys.length - precios.length
    return `Hasta ${maxKm} km · ${rango}${faltan ? ` · ⚠️ ${faltan} ${faltan === 1 ? 'tramo' : 'tramos'} sin precio` : ''}`
  }, [keys, tarifas, maxKm])

  function toggleDia(k) {
    setDias(d => ({ ...d, [k]: !d[k] }))
  }

  // ＋ en la distancia: el tramo nuevo nace con el precio del anterior + ESCALON_DOMICILIO ($500).
  // Si el local quiere otro, lo cambia a mano (pedido del usuario, 8-nov). Si ya tenía precio, se respeta.
  function subirDistancia() {
    const antes = Number(maxKm) || 0
    const nuevo = Math.min(30, antes + 0.5)
    if (nuevo === antes) return
    const kAntes = antes.toFixed(1), kNuevo = nuevo.toFixed(1)
    setMaxKm(String(nuevo))
    setTarifas(t => {
      if (conPrecio(t[kNuevo]) || !conPrecio(t[kAntes])) return t
      return { ...t, [kNuevo]: String((Number(t[kAntes]) || 0) + ESCALON_DOMICILIO) }
    })
  }

  function setTarifa(key, valor) {
    setTarifas(t => ({ ...t, [key]: valor.replace(/\D/g, '') }))
  }

  // 🛵 Rellena los tramos vacíos de abajo en ESCALERA: cada medio kilómetro de
  // más cuesta ESCALON_DOMICILIO pesos por encima del anterior. Antes copiaba
  // el mismo precio a todos, y el dueño tenía que corregir a mano tramo por
  // tramo, porque llevar el pedido más lejos siempre cuesta más.
  //
  // Si por el camino se topa con un tramo que el dueño ya escribió, lo respeta
  // y sigue subiendo la escalera DESDE ese precio: manda lo que él puso, no lo
  // que veníamos calculando.
  function rellenarDesde(key) {
    if (!tarifas[key]) return
    setTarifas(t => {
      const next = { ...t }
      let ultimo = Number(t[key]) || 0
      let empezar = false
      for (const k of keys) {
        if (k === key) { empezar = true; continue }
        if (!empezar) continue
        if (next[k]) { ultimo = Number(next[k]) || ultimo; continue }
        ultimo += ESCALON_DOMICILIO
        next[k] = String(ultimo)
      }
      return next
    })
  }

  function capturarUbicacion() {
    if (!navigator.geolocation) { setUbicEstado('error'); return }
    setUbicEstado('cargando')
    navigator.geolocation.getCurrentPosition(
      pos => { setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setUbicEstado('ok') },
      () => setUbicEstado('error'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function guardar() {
    setGuardando(true)
    const tarifasLimpias = {}
    // Un tramo VACÍO no se guarda (antes quedaba en $0 = envío gratis sin querer): queda sin tarifa.
    // Un $0 escrito a propósito sí se guarda (domicilio gratis cerca, como Pilotos y Sabor del Día).
    for (const k of keys) if (conPrecio(tarifas[k])) tarifasLimpias[k] = Number(String(tarifas[k]).replace(/\D/g, '')) || 0
    const cambios = {
      // 🍔 En la demo para clientes, WhatsApp y horario están bloqueados (no se envían).
      ...(local.esDemo ? {} : {
        whatsapp: whatsapp.replace(/\D/g, ''),
        horario: { ...(local.horario || {}), abre, cierra, dias },
      }),
      domicilio: {
        ...(local.domicilio || {}),
        activo: domicilio,
        maxKm: Number(maxKm) || 0,
        tarifas: tarifasLimpias,
      },
      recoger,
      logoAnim,
    }
    if (ubicacion) cambios.ubicacion = ubicacion
    await onUpdate(cambios)
    inicial.current = foto
    setGuardando(false)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 1800)
  }

  // 🖼️ Banner: subir del dispositivo (se guarda al instante en local.banner).
  async function elegirBanner(e) {
    const f = e.target.files?.[0]
    if (!f || !onSubirBanner) return
    setBannerPreview(URL.createObjectURL(f))
    setSubiendoBanner(true)
    try {
      const url = await onSubirBanner(f)
      if (url) setBannerPreview(url)
    } catch (err) {
      console.error('No se pudo subir el banner:', err)
      alert('No se pudo subir el banner. Intenta de nuevo.')
      setBannerPreview(local.banner || '')
    }
    setSubiendoBanner(false)
  }
  // ✨ Crear el banner con IA: arma el prompt (fiel al local + su estética), lo copia y abre Gemini.
  function crearBannerConIA() {
    const prompt = construirPromptImagenIA({ nombre: local.nombre, descripcion: local.descripcion, tipo: 'banner', local })
    try { navigator.clipboard?.writeText(prompt) } catch { /* botón "copiar" del aviso */ }
    window.open('https://gemini.google.com/app', '_blank', 'noopener')
    setAvisoBannerIA({ prompt })
  }

  const conDomicilio = tiene(local, 'domicilios')
  const wa = whatsapp.replace(/\D/g, '')
  const abiertoAhora = !ningunDia && estaAbierto({ abre, cierra, dias })
  const horarioTxt = `${textoDias(dias)} · ${hora12(abre)} – ${hora12(cierra)}`
  const entregaTxt = [domicilio && conDomicilio && 'Domicilio', recoger && 'Recoger'].filter(Boolean).join(' y ') || 'Ninguna'
  const faltaDomicilio = domicilio && conDomicilio && (!ubicacion || keys.some(k => !conPrecio(tarifas[k])))
  const conAnim = local.tema?.hero === 'logo'
  const animTxt = LOGO_ANIMS.find(o => o.id === logoAnim)?.label || 'Elegir…'

  const negocio = vista !== 'apariencia'
  const items = negocio ? [
    { id: 'whatsapp', icono: '📲', nombre: 'WhatsApp para pedidos', nota: wa || 'Falta el número', tono: wa ? null : 'aviso' },
    { id: 'horario', icono: '🕒', nombre: 'Horario de atención', nota: ningunDia ? 'Marca al menos un día' : horarioTxt, tono: ningunDia ? 'aviso' : null },
    { id: 'entrega', icono: '🛍️', nombre: 'Cómo entregas', nota: entregaTxt },
    ...(domicilio && conDomicilio ? [{ id: 'domicilio', icono: '🛵', nombre: 'Precios del domicilio', nota: !ubicacion ? 'Falta la ubicación' : resumenPrecios, tono: faltaDomicilio ? 'aviso' : null }] : []),
    { id: 'buscador', icono: '🔎', nombre: 'Buscador de Appetic', nota: local.enBuscador === false ? 'No sales' : 'Sales en el buscador' },
  ] : [
    { id: 'portada', icono: '🖼️', nombre: 'Portada del local', nota: bannerPreview ? 'Con foto' : 'Sin foto', tono: bannerPreview ? null : 'aviso' },
    ...(conAnim ? [{ id: 'logo', icono: '✨', nombre: 'Animación del logo', nota: animTxt }] : []),
  ]
  const actual = items.find(i => i.id === parte) || items[0]

  const chips = negocio ? [
    { t: ningunDia ? 'Sin días de atención' : abiertoAhora ? '● Abierto ahora' : '● Cerrado ahora', tono: ningunDia ? 'aviso' : abiertoAhora ? 'ok' : 'off' },
    { t: wa ? `📲 ${wa}` : '⚠️ Sin WhatsApp', tono: wa ? null : 'aviso' },
    { t: `🛍️ ${entregaTxt}` },
  ] : [
    { t: bannerPreview ? '🖼️ Con portada' : '🖼️ Sin portada', tono: bannerPreview ? 'ok' : 'aviso' },
    conAnim ? { t: `✨ ${animTxt}` } : null,
  ]

  return (
    <div className={`ac ac2${entrar.abierto ? ' pp-dentro' : ''}`}>
      {negocio
        ? <PanelHero icono="🏪" titulo="Negocio y horario" sub="Dónde te llegan los pedidos, cuándo abres y cómo entregas" chips={chips} />
        : <PanelHero icono="🎨" titulo="Apariencia" sub="Cómo se ve tu local: la portada y la animación del logo" chips={chips}
            derecha={bannerPreview ? <div className="ac2-hero-portada"><img src={bannerPreview} alt="" /></div> : null} />}

      <PanelCuerpo entrar={entrar} titulo={actual.nombre} lado={
        <PanelLado icono={negocio ? '🏪' : '🎨'} titulo={negocio ? 'Tu negocio' : 'Apariencia'} sel={actual.id} onSel={elegir} grupos={[{ items }]} />
      }>
        {actual.id === 'whatsapp' && (
          <PanelTarjeta icono="📲" titulo="WhatsApp para pedidos" sub="El número donde te llegan los pedidos de tus clientes. Va anclado a tu local.">
            <label className="pp-campo"><span>Número de WhatsApp</span>
              <input type="tel" inputMode="numeric" placeholder="Ej: 3208435143" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} disabled={local.esDemo} />
            </label>
            {local.esDemo && <p className="pp-ayuda">🔒 En la demo, los pedidos llegan a Appetic. En tu local, aquí va tu WhatsApp.</p>}
            {!wa && <p className="ac2-aviso">⚠️ Sin WhatsApp, los pedidos no pueden enviarse.</p>}
          </PanelTarjeta>
        )}

        {actual.id === 'horario' && (
          <PanelTarjeta icono="🕒" titulo="Horario de atención" sub="Fuera del horario, los clientes ven el menú pero no pueden pedir.">
            {local.esDemo && <p className="pp-ayuda">🔒 En la demo está abierta las 24 horas para que la puedas probar cuando quieras.</p>}
            <fieldset className="ac-bloqueo ac2-horario" disabled={local.esDemo}>
              <div className="pp-sub">
                <h4 className="ac2-h4">Días que abres</h4>
                <div className="ac2-dias">
                  {DIAS_SEMANA.map(d => (
                    <button key={d.k} type="button" className={dias[d.k] ? 'on' : ''} onClick={() => toggleDia(d.k)} aria-pressed={dias[d.k]} title={d.full}>
                      <b>{d.full.slice(0, 3)}</b>
                    </button>
                  ))}
                </div>
                {ningunDia && <p className="ac2-aviso">⚠️ Marca al menos un día de atención.</p>}
              </div>
              <div className="pp-sub">
                <h4 className="ac2-h4">Horas</h4>
                <div className="pp-fila">
                  <label className="pp-campo"><span>Abre</span><input type="time" value={abre} onChange={e => setAbre(e.target.value)} /></label>
                  <label className="pp-campo"><span>Cierra</span><input type="time" value={cierra} onChange={e => setCierra(e.target.value)} /></label>
                </div>
                <p className="pp-ayuda">Si cierras después de medianoche (ej.: 6 p. m. a 2 a. m.) también funciona.</p>
              </div>
            </fieldset>
          </PanelTarjeta>
        )}

        {actual.id === 'entrega' && (
          <PanelTarjeta icono="🛍️" titulo="Cómo entregas" sub="Lo que el cliente puede escoger al pedir.">
            <div className="pp-sub ac2-switches">
              {conDomicilio
                ? <PanelSwitch titulo="🛵 Domicilio" texto="Llevas el pedido a la casa del cliente. El precio se calcula por distancia." checked={domicilio} onChange={setDomicilio} />
                : <Candado local={local} funcion="domicilios" compacto />}
              <PanelSwitch titulo="🏪 Recoger en el local" texto="El cliente pide y pasa a recogerlo." checked={recoger} onChange={setRecoger} />
            </div>
            {domicilio && conDomicilio && (
              <button type="button" className="ac2-ir" onClick={() => setParte('domicilio')}>
                <span>🛵</span><b>Precios del domicilio</b><small>{!ubicacion ? '⚠️ Falta la ubicación' : resumenPrecios}</small><i>›</i>
              </button>
            )}
          </PanelTarjeta>
        )}

        {actual.id === 'domicilio' && (
          <PanelTarjeta icono="🛵" titulo="Precios del domicilio" sub="Se cobra por tramos de 0,5 km según qué tan lejos esté el cliente.">
            <div className="pp-grid ac2-domi">
              <div className="pp-sub ac2-ubic">
                <h4 className="ac2-h4">📍 Ubicación del local</h4>
                {ubicacion ? (
                  <>
                    <div className="ac2-mapa">
                      <iframe title="Ubicación del local" loading="lazy" tabIndex={-1}
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${ubicacion.lng - 0.004}%2C${ubicacion.lat - 0.0025}%2C${ubicacion.lng + 0.004}%2C${ubicacion.lat + 0.0025}&layer=mapnik&marker=${ubicacion.lat}%2C${ubicacion.lng}`} />
                      <button type="button" className="ac2-mapa-editar" onClick={capturarUbicacion} disabled={ubicEstado === 'cargando'}>
                        {ubicEstado === 'cargando' ? 'Ubicando…' : '✏️ Editar'}
                      </button>
                      <a className="ac2-mapa-credito" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>
                    </div>
                    <p className="pp-ayuda">Desde aquí se mide la distancia a cada cliente. Para cambiarla, toca <b>Editar</b> estando EN el local.</p>
                  </>
                ) : (
                  <>
                    <p className="pp-ayuda">Desde aquí se mide la distancia a cada cliente. Ponla estando EN el local.</p>
                    <button type="button" className="btn btn-primary ac2-poner" onClick={capturarUbicacion} disabled={ubicEstado === 'cargando'}>
                      📍 {ubicEstado === 'cargando' ? 'Obteniendo…' : 'Poner la ubicación del local'}
                    </button>
                    {ubicEstado !== 'error' && <p className="ac2-aviso">⚠️ Sin ubicación no se puede calcular el domicilio.</p>}
                  </>
                )}
                {ubicEstado === 'error' && <p className="ac2-aviso">No se pudo obtener. Activa el permiso de ubicación.</p>}
              </div>
              <div className="pp-sub ac2-tramos">
                <div className="ac2-tramos-cab">
                  <h4 className="ac2-h4">💲 Precio por distancia</h4>
                  <div className="ac2-paso" role="group" aria-label="Distancia máxima de entrega">
                    <small>Hasta</small>
                    <button type="button" onClick={() => setMaxKm(v => String(Math.max(0.5, (Number(v) || 0.5) - 0.5)))} disabled={Number(maxKm) <= 0.5} aria-label="Menos distancia">−</button>
                    <b>{(Number(maxKm) || 0).toFixed(1).replace('.', ',')} km</b>
                    <button type="button" onClick={subirDistancia} disabled={Number(maxKm) >= 30} aria-label="Más distancia">+</button>
                  </div>
                </div>
                <p className="pp-ayuda">Escribe 0 si ese tramo es gratis. Con <b>+</b> el tramo nuevo sale $500 más caro que el anterior; cámbialo si quieres.{hayFill ? ` El ↓ rellena los de abajo sumando ${fmtPesos(ESCALON_DOMICILIO)} cada medio kilómetro.` : ''}</p>
                <div className={`ac2-tramos-lista${hayFill ? ' con-fill' : ''}`}>
                  {keys.map((k, i) => {
                    // La ↓ solo en la fila justo encima de un tramo vacío (antes salía en todas, 8-nov).
                    const mostrarFill = conPrecio(tarifas[k]) && i + 1 < keys.length && !conPrecio(tarifas[keys[i + 1]])
                    return (
                      <div key={k} className={`ac2-tramo${conPrecio(tarifas[k]) ? '' : ' vacio'}`}>
                        <span className="ac2-tramo-km"><small>hasta</small>{k.replace('.', ',')} km</span>
                        <div className="pp-plata ac2-tramo-plata">
                          <i>$</i>
                          <input inputMode="numeric" placeholder="Sin precio" value={tarifas[k] ?? ''} onChange={e => setTarifa(k, e.target.value)} aria-label={`Precio hasta ${k} km`} />
                          {conPrecio(tarifas[k]) && Number(tarifas[k]) === 0 && <em className="ac2-gratis">Gratis</em>}
                        </div>
                        {mostrarFill
                          ? <button className="ac2-fill" onClick={() => rellenarDesde(k)} title={`Rellenar los de abajo sumando ${fmtPesos(ESCALON_DOMICILIO)}`} aria-label="Rellenar los de abajo">↓</button>
                          : hayFill ? <span aria-hidden="true" /> : null}
                      </div>
                    )
                  })}
                </div>
                {keys.length === 0 && <p className="pp-ayuda">Sube la distancia máxima para definir tramos.</p>}
                {keys.some(k => !conPrecio(tarifas[k])) && <p className="ac2-aviso">⚠️ A un cliente en un tramo sin precio no le sale el domicilio: ponle precio a todos o baja la distancia máxima.</p>}
              </div>
            </div>
          </PanelTarjeta>
        )}

        {actual.id === 'buscador' && (
          <PanelTarjeta icono="🔎" titulo="Buscador de Appetic" sub="Se guarda al instante.">
            <div className="pp-sub"><SalirEnBuscador local={local} onUpdate={onUpdate} sinMarco /></div>
          </PanelTarjeta>
        )}

        {actual.id === 'portada' && (
          <PanelTarjeta icono="🖼️" titulo="Portada del local" sub="La foto grande que representa tu local en el inicio. Se guarda al subirla.">
            <div className="ac2-portada">
              <div className="ac2-portada-ver">
                {bannerPreview ? <img src={bannerPreview} alt="" /> : <span>🖼️<small>Sin portada</small></span>}
                {subiendoBanner && <em>Subiendo…</em>}
              </div>
              <div className="ac2-portada-acc">
                <label className="pp-btn">📱 Subir del dispositivo<input type="file" accept="image/*" onChange={elegirBanner} hidden /></label>
                <button type="button" className="pp-btn ac2-ia" onClick={crearBannerConIA}>✨ Crear con IA</button>
                <p className="pp-ayuda">Horizontal y bien iluminada. Con IA queda a tono con tu marca.</p>
              </div>
            </div>
            {avisoBannerIA && (
              <div className="ap-ia-aviso">
                <button className="ap-ia-aviso-x" onClick={() => setAvisoBannerIA(null)} aria-label="Cerrar">✕</button>
                <p className="ap-ia-aviso-tit">✨ Abrimos <strong>Gemini</strong> en otra pestaña</p>
                <ol className="ap-ia-aviso-pasos">
                  <li>Pega el prompt (ya copiado) con <strong>Ctrl/Cmd + V</strong> y envía.</li>
                  <li>Cuando Gemini genere la imagen (horizontal), <strong>descárgala</strong>.</li>
                  <li>Vuelve aquí y súbela con <strong>📱 Subir del dispositivo</strong>.</li>
                </ol>
                <button type="button" className="ap-ia-aviso-copiar" onClick={() => { try { navigator.clipboard?.writeText(avisoBannerIA.prompt) } catch { /* nada */ } }}>📋 Copiar el prompt de nuevo</button>
              </div>
            )}
          </PanelTarjeta>
        )}

        {actual.id === 'logo' && (
          <PanelTarjeta icono="✨" titulo="Animación del logo" sub="Cómo aparece tu logo al abrir el menú. Elige una y mírala aquí al lado antes de guardar.">
            <div className="ac2-logo">
              <div className="ac2-anims" role="radiogroup" aria-label="Animación del logo">
                {LOGO_ANIMS.map(op => (
                  <button key={op.id} type="button" role="radio" aria-checked={logoAnim === op.id} className={logoAnim === op.id ? 'on' : ''} onClick={() => setLogoAnim(op.id)}>
                    <span className="ac2-radio" aria-hidden="true" />{op.label}
                  </button>
                ))}
              </div>
              <div className="ac2-muestra"><MuestraLogo local={local} anim={logoAnim} /></div>
            </div>
          </PanelTarjeta>
        )}

        <PanelGuardar sinGuardar={sinGuardar} estado={guardando ? 'guardando' : guardado ? 'ok' : ''} onGuardar={guardar} />
      </PanelCuerpo>
    </div>
  )
}
