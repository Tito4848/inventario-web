'use client'

import React, { useState } from 'react'

import { clearClientAuth } from '../_lib/api'

export function LogoutButton() {
  const [loading, setLoading] = useState(false)

  async function logout() {
    setLoading(true)
    try {
      clearClientAuth()
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      await fetch('/api/users/logout', { method: 'POST', credentials: 'include' })
    } finally {
      window.location.href = '/login'
    }
  }

  return (
    <button className="btn" onClick={logout} disabled={loading} type="button">
      {loading ? 'Saliendo…' : 'Salir'}
    </button>
  )
}
