import React from 'react'

import { KardexView } from './ui'

export default function KardexPage() {
  return (
    <div className="card">
      <div className="cardHeader">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Kardex valorizado (FIFO)</div>
          <span className="pill">FIFO</span>
        </div>
        <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
          Selecciona un producto y consulta sus entradas/salidas con valorización FIFO.
        </p>
      </div>
      <div className="cardBody">
        <KardexView />
      </div>
    </div>
  )
}

