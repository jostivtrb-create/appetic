// 📣 Herramientas para que el dueño de cada local difunda su menú:
//   • URL pública del menú (para el QR y para copiar/compartir).
//   • Teléfono de domicilios bien formateado.
//   • Mensaje de bienvenida para WhatsApp (emojis a prueba de rombos: se escriben
//     como escapes \u para que el archivo quede ASCII y el emoji nunca se corrompa).
//   • HTML del afiche imprimible ("DOMICILIOS" + QR), con la estética del local.

// URL del menú del local. Usamos el origen actual (en producción es el dominio
// real del negocio; en local, localhost) para que el link SIEMPRE apunte a donde
// está corriendo la app. Ej: https://appetic.app/perros-criollos
export function menuUrl(slug) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/${slug}`
}

// Teléfono colombiano legible: 3208435143 -> "320 843 5143".
// Si viene con indicativo 57 lo quita para mostrarlo local.
export function formatTel(num) {
  const d = String(num || '').replace(/\D/g, '')
  const local10 = d.length > 10 && d.startsWith('57') ? d.slice(2) : d
  if (local10.length === 10) return `${local10.slice(0, 3)} ${local10.slice(3, 6)} ${local10.slice(6)}`
  return local10
}

// Emoji "alusivo" al local: el de su primera categoría, o un plato genérico.
function emojiLocal(local) {
  const cat = (local?.categorias || []).find(c => c.emoji)
  return cat?.emoji || '\u{1F37D}\u{FE0F}' // 🍽️
}

// Mensaje de bienvenida listo para enviar por WhatsApp a los clientes.
// Con emojis alusivos SIN saturar y explicando que desde el link piden lo que quieran.
export function mensajeBienvenida(local, url) {
  const comida = emojiLocal(local)
  const dom = local?.domicilio?.activo !== false
  const rec = local?.recoger !== false
  const L = []
  L.push(`\u{00A1}Hola! \u{1F44B} Bienvenido a *${local?.nombre || ''}* ${comida}`)
  L.push('')
  L.push('Ya puedes ver todo nuestro menú y hacer tu pedido en segundos desde aquí \u{1F447}')
  L.push(url)
  L.push('')
  if (dom && rec) L.push('Elige lo que quieras, arma tu pedido y te lo llevamos a domicilio \u{1F6F5} o lo recoges en el local \u{1F3EA}')
  else if (dom) L.push('Elige lo que quieras, arma tu pedido y te lo llevamos a domicilio \u{1F6F5}')
  else L.push('Elige lo que quieras, arma tu pedido y lo recoges en el local \u{1F3EA}')
  L.push('')
  L.push('\u{00A1}Te esperamos! \u{2728}')
  return L.join('\n')
}

// Luminancia relativa de un color #rrggbb (0 = negro, 1 = blanco).
function luminancia(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''))
  if (!m) return 1
  const n = parseInt(m[1], 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// Color oscuro para el QR: usa el color de marca del local si es lo bastante
// oscuro (contraste alto = escanea bien); si no, cae a un casi-negro elegante.
export function qrDark(tema) {
  const c = tema?.primaryStrong || tema?.primary
  return c && luminancia(c) < 0.4 ? c : '#171412'
}

// Escapa texto para incrustarlo con seguridad dentro del HTML del afiche.
function esc(s) {
  return String(s || '').replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ))
}

// #rrggbb -> "rgba(r,g,b,a)" (para halos y velos translúcidos en el afiche).
function rgba(hex, a) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''))
  if (!m) return `rgba(0,0,0,${a})`
  const n = parseInt(m[1], 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

// Documento HTML del afiche de domicilios. HEREDA el "mundo" del local: usa su
// color de fondo (claro u oscuro), su logo ANCHO sin recortar y sus colores de
// marca, para que se sienta parte del menú. Pensado para imprimir / "Guardar PDF".
export function aficheHTML(local, url, qrDataUrl) {
  const t = local?.tema || {}
  const primary = t.primary || '#ED7D2B'
  const primaryStrong = t.primaryStrong || primary
  const accent = t.accent || primaryStrong
  const onPrimary = t.onPrimary || '#FFFFFF'
  const bg = t.bg || '#FBF3E2'
  const logo = local?.logo || local?.icono || ''
  const logoAbs = logo ? new URL(logo, window.location.origin).href : ''
  const tel = formatTel(local?.whatsapp)
  const nombre = esc(local?.nombre)
  const desc = esc(local?.descripcion)
  const host = esc(url.replace(/^https?:\/\//, ''))

  // Claro u oscuro según el fondo del local -> así el texto siempre contrasta.
  const oscuro = luminancia(bg) < 0.45
  const texto = oscuro ? '#FFFFFF' : '#241A16'
  const textoSuave = oscuro ? 'rgba(255,255,255,.72)' : '#5A4A42'
  const tituloColor = oscuro ? accent : primaryStrong          // dorado sobre negro / vino sobre crema
  const sombraLogo = oscuro ? 'drop-shadow(0 6px 18px rgba(0,0,0,.55))' : 'drop-shadow(0 4px 12px rgba(0,0,0,.14))'
  const marco = oscuro ? rgba(accent, 0.28) : rgba(primaryStrong, 0.18)
  const marcaColor = oscuro ? 'rgba(255,255,255,.42)' : '#9A8F84'

  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Domicilios · ${nombre}</title>
<style>
  @page { margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact;
    background:
      radial-gradient(120% 70% at 50% -8%, ${rgba(primary, oscuro ? 0.55 : 0.22)}, transparent 60%),
      radial-gradient(90% 55% at 50% 108%, ${rgba(primaryStrong, oscuro ? 0.45 : 0.14)}, transparent 60%),
      ${bg};
    color: ${texto};
    font-family: -apple-system, "Segoe UI", Roboto, system-ui, sans-serif; }
  .wrap {
    min-height: 100vh; max-width: 150mm; margin: 0 auto;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 14mm 12mm; gap: 7mm;
    box-shadow: inset 0 0 0 2px ${marco};
  }
  .top { display: flex; flex-direction: column; align-items: center; flex: 0 0 auto; }
  .logo { max-width: 82mm; max-height: 34mm; width: auto; height: auto; object-fit: contain;
    filter: ${sombraLogo}; }
  .eyebrow { margin-top: 8mm; font-size: 10.5pt; font-weight: 800; letter-spacing: .26em;
    text-transform: uppercase; color: ${accent}; }
  .titulo { margin-top: 3mm; font-size: 46pt; font-weight: 900; line-height: .92;
    letter-spacing: -.01em; color: ${tituloColor}; text-shadow: ${oscuro ? '0 2px 18px ' + rgba(accent, 0.35) : 'none'}; }
  .bajada { margin-top: 4mm; font-size: 12.5pt; font-weight: 600; line-height: 1.35;
    color: ${textoSuave}; max-width: 110mm; }
  .qrwrap { flex: 0 0 auto; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .qrbox { background: #fff; padding: 6.5mm; border-radius: 18px;
    box-shadow: 0 12px 34px rgba(0,0,0,${oscuro ? '.5' : '.16'}); }
  .qrbox img { display: block; width: 58mm; height: 58mm; image-rendering: pixelated; }
  .escanea { margin-top: 5mm; font-size: 12.5pt; font-weight: 800; color: ${texto}; }
  .escanea b { color: ${accent}; }
  .bottom { display: flex; flex-direction: column; align-items: center; flex: 0 0 auto; }
  .tel { display: inline-flex; align-items: center; gap: 8px;
    background: ${primary}; color: ${onPrimary}; font-weight: 900; font-size: 17pt;
    padding: 8px 22px; border-radius: 999px; box-shadow: 0 6px 18px rgba(0,0,0,.28); }
  .nom { margin-top: 6mm; font-size: 15pt; font-weight: 900; color: ${texto}; }
  .link { margin-top: 1.5mm; font-size: 10.5pt; font-weight: 700; color: ${accent}; }
  .marca { margin-top: 3mm; font-size: 8.5pt; letter-spacing: .04em; color: ${marcaColor}; }
  .btnbar { position: fixed; top: 12px; left: 0; right: 0; text-align: center; z-index: 99; }
  .btnbar button { font: inherit; font-weight: 800; color: #fff; background: ${primary};
    border: 0; padding: 11px 22px; border-radius: 999px; cursor: pointer; box-shadow: 0 6px 20px rgba(0,0,0,.35); }
  @media print { .btnbar { display: none !important; } .wrap { box-shadow: none; } }
</style></head>
<body>
  <div class="btnbar"><button onclick="window.print()">\u{1F5A8}\u{FE0F} Imprimir / Guardar PDF</button></div>
  <div class="wrap">
    <div class="top">
      ${logoAbs ? `<img class="logo" src="${esc(logoAbs)}" alt="${nombre}">` : `<div class="titulo" style="font-size:30pt">${nombre}</div>`}
      <div class="eyebrow">Escanea y pide</div>
      <div class="titulo">DOMICILIOS</div>
      ${desc ? `<div class="bajada">${desc}</div>` : ''}
    </div>
    <div class="qrwrap">
      <div class="qrbox">${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR del menú">` : ''}</div>
      <div class="escanea">Apunta tu cámara al código y <b>pide lo que quieras</b></div>
    </div>
    <div class="bottom">
      ${tel ? `<div class="tel">\u{1F4F2} ${esc(tel)}</div>` : ''}
      <div class="nom">${nombre}</div>
      <div class="link">${host}</div>
      <div class="marca">Menú digital · Appetic</div>
    </div>
  </div>
  <script>window.addEventListener('load', function(){ setTimeout(function(){ try { window.print() } catch(e){} }, 500) })</script>
</body></html>`
}

// Abre el afiche en una ventana nueva y dispara la impresión (guardar como PDF).
export function abrirAfiche(local, url, qrDataUrl) {
  const w = window.open('', '_blank')
  if (!w) return false
  w.document.open()
  w.document.write(aficheHTML(local, url, qrDataUrl))
  w.document.close()
  return true
}
