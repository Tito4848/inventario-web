import React from 'react'

import { MovementForm } from './ui'

export default function NewMovementPage() {
  return (
    <div className="card">
      <div className="cardHeader">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Registrar movimiento</div>
          <span className="pill">Entrada / Salida / Ajuste</span>
        </div>
        <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
          Al guardar se actualiza el stock en tiempo real y las salidas se valorizan con FIFO.
        </p>
      </div>
      <div className="cardBody">
        <MovementForm />
      </div>
    </div>
  )
}

