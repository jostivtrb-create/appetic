import { useState } from 'react'
import { rolPermitido } from '../../utils/plan'
import { Candado } from './PlanAvisos'
import { EquipoEnLinea, TEXTOS_EQUIPO } from './AdminEquipo'
import { PanelHero, PanelCuerpo, PanelLado, PanelTarjeta, useEntrar } from './PanelPagina'
import './Equipo.css'

// 👥 CONFIGURACIÓN → EQUIPO con el diseño nuevo (guía «Diseño de pantallas del panel», 8-nov):
// a la izquierda los roles (Cajeros, Meseros, Cocina, Domiciliarios); a la derecha la gente de ese rol.
// Cada rol sale solo si su paquete lo trae; si no, con candado. La lógica es la de siempre (EquipoEnLinea).
const ROLES = ['cajero', 'mesero', 'cocina', 'domiciliario']
const CANDADO = { cajero: 'Los cajeros', mesero: 'Los meseros', cocina: 'La pantalla de cocina', domiciliario: 'Los domiciliarios' }
const QUE_HACE = { cajero: 'Venden, cobran y anotan gastos', mesero: 'Toman pedidos en las mesas', cocina: 'Ven las comandas', domiciliario: 'Ven y entregan los domicilios' }

export default function ConfigEquipo({ local, demo }) {
  const entrar = useEntrar()
  const primero = ROLES.find(r => rolPermitido(local, r)) || 'cajero'
  const [rol, setRol] = useState(primero)
  const elegir = r => { setRol(r); entrar.abrir() }
  const habilitados = ROLES.filter(r => rolPermitido(local, r)).length
  const t = TEXTOS_EQUIPO[rol]

  return (
    <div className={`ceq${entrar.abierto ? ' pp-dentro' : ''}`}>
      <PanelHero icono="👥" titulo="Equipo" sub="Quién trabaja contigo y qué pantalla ve cada uno" chips={[
        { t: `${habilitados} de ${ROLES.length} roles en tu plan` },
        { t: '🔐 Entran con su correo de Google' },
      ]} />
      <PanelCuerpo entrar={entrar} titulo={t.titulo} lado={
        <PanelLado icono="👥" titulo="Roles" sel={rol} onSel={elegir} grupos={[{ items: ROLES.map(r => {
          const ok = rolPermitido(local, r)
          return { id: r, icono: TEXTOS_EQUIPO[r].icono, nombre: TEXTOS_EQUIPO[r].titulo, nota: ok ? QUE_HACE[r] : '🔒 No viene en tu plan', tono: ok ? null : 'off' }
        }) }]} />
      }>
        <PanelTarjeta className="ceq-tarjeta">
          {rolPermitido(local, rol)
            ? <EquipoEnLinea key={rol} local={local} rol={rol} demo={demo} />
            : <>
              <header className="eq-cab"><div><h2>{t.icono} {t.titulo}</h2><p>{t.ayuda}</p></div></header>
              <Candado local={local} funcion={rol} compacto titulo={CANDADO[rol]} />
            </>}
        </PanelTarjeta>
      </PanelCuerpo>
    </div>
  )
}
