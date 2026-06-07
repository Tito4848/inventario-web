'use client'

import React, { useMemo, useState } from 'react'

import { apiPost } from '../_lib/api'

type LoginResponse = {
  token?: string
  user?: unknown
  message?: string
}

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => email.trim().length > 3 && password.length > 3, [email, password])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await apiPost<LoginResponse>('/api/users/login', { email, password })
      window.location.href = '/app'
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo iniciar sesión.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <label className="label" htmlFor="email">
        Correo
      </label>
      <input
        id="email"
        className="input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="correo@empresa.com"
        autoComplete="email"
      />

      <label className="label" htmlFor="password">
        Contraseña
      </label>
      <input
        id="password"
        type="password"
        className="input"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        autoComplete="current-password"
      />

      {error && (
        <div style={{ marginTop: 12 }} className="muted">
          <span style={{ color: 'var(--danger)' }}>{error}</span>
        </div>
      )}

      <div className="row" style={{ justifyContent: 'space-between', marginTop: 14 }}>
        <a className="pill" href="/admin" target="_blank" rel="noreferrer">
          Abrir panel admin
        </a>
        <button className="btn btnPrimary" disabled={!canSubmit || loading} type="submit">
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </div>
    </form>
  )
}

