export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: 'include' })
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
    headers: { 'Content-Type': 'application/json' },
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

