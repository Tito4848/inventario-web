import React from 'react'

import { StockView } from './ui'

export default function StockPage() {
  return (
    <div className="card">
      <div className="cardHeader">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Stock</div>
          <span className="pill">Tiempo real</span>
        </div>
        <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
          Consulta por producto y ubicación. Puedes filtrar por stock bajo mínimo.
        </p>
      </div>
      <div className="cardBody">
        <StockView />
      </div>
    </div>
  )
}

