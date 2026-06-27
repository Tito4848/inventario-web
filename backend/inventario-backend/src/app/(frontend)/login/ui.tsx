'use client'

import React, { useMemo, useState } from 'react'

import { apiPost, clearClientAuth } from '../_lib/api'

type LoginResponse = {
  token?: string
  user?: unknown
  message?: string
}

type MeResponse = {
  permissions?: {
    defaultRoute?: string
  }
}

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => email.trim().length > 3 && password.length > 3, [email, password])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const login = await apiPost<LoginResponse>('/api/auth/login', {
        email: email.trim().toLowerCase(),
        password,
        remember,
      })

      if (login.token) {
        clearClientAuth()
        if (remember) {
          localStorage.setItem('inventario_token', login.token)
          localStorage.setItem('inventario_remember_session', '1')
        } else {
          sessionStorage.setItem('inventario_token', login.token)
        }
      }

      const meRes = await fetch('/api/users/me', { credentials: 'include' })
      const me = (await meRes.json()) as MeResponse
      window.location.href = me.permissions?.defaultRoute || '/app'
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
        type="email"
        required
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
        required
        minLength={8}
      />

      <label className="pill" style={{ display: 'inline-flex', marginTop: 12, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          style={{ marginRight: 8 }}
        />
        Recordarme
      </label>

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
