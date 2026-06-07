import React from 'react'

import { LoginForm } from './ui'

export default function LoginPage() {
  return (
    <div className="container" style={{ paddingTop: 60, paddingBottom: 60 }}>
      <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="cardHeader">
          <div className="brand" style={{ justifyContent: 'space-between' }}>
            <div>Inventario Web</div>
            <span className="pill">Payload + React</span>
          </div>
          <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
            Inicia sesión para registrar movimientos y consultar stock.
          </p>
        </div>
        <div className="cardBody">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

