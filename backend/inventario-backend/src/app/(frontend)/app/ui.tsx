'use client'

import React, { useState } from 'react'

export function LogoutButton() {
  const [loading, setLoading] = useState(false)

  async function logout() {
    setLoading(true)
    try {
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

