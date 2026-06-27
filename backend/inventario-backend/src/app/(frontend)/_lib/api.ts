function getAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extra }
  if (typeof window === 'undefined') return headers

  const token =
    window.sessionStorage.getItem('inventario_token') ||
    window.localStorage.getItem('inventario_token')

  if (token) headers.Authorization = `JWT ${token}`
  return headers
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    let payload: unknown = null
    try {
      payload = await res.json()
    } catch {
      // ignore
    }
    throw new Error(extractPayloadError(payload) || `HTTP ${res.status}`)
  }
  return (await res.json()) as T
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let payload: unknown = null
    try {
      payload = await res.json()
    } catch {
      // ignore
    }
    throw new Error(extractPayloadError(payload) || `HTTP ${res.status}`)
  }
  return (await res.json()) as T
}

function extractPayloadError(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const p = payload as Record<string, unknown>

  if (typeof p.error === 'string') return p.error

  const errors = p.errors
  if (Array.isArray(errors) && errors.length) {
    const first = errors[0]
    if (first && typeof first === 'object') {
      const msg = (first as Record<string, unknown>).message
      if (typeof msg === 'string') return msg
    }
  }

  return null
}

export function clearClientAuth() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem('inventario_token')
  window.localStorage.removeItem('inventario_token')
  window.localStorage.removeItem('inventario_remember_session')
}
