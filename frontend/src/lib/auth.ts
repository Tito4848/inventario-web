const API_URL = import.meta.env.VITE_API_URL || ''
const REMEMBER_KEY = 'inventario_remember_email'
const REMEMBER_SESSION_KEY = 'inventario_remember_session'
const TOKEN_KEY = 'inventario_token'

export type AuthUser = {
  id: string
  email: string
  fullName?: string
  roles?: string[]
}

export type MeResponse = {
  user: AuthUser | null
  permissions: import('./permissions').UserPermissions | null
}

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY)
}

export function clearStoredToken() {
  sessionStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_KEY)
}

export function storeToken(token: string, remember = false) {
  clearStoredToken()
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(REMEMBER_SESSION_KEY, '1')
  } else {
    sessionStorage.setItem(TOKEN_KEY, token)
    localStorage.removeItem(REMEMBER_SESSION_KEY)
  }
}

export function isRememberSession(): boolean {
  return localStorage.getItem(REMEMBER_SESSION_KEY) === '1'
}

export function getAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extra }
  const token = getStoredToken()
  if (token) headers.Authorization = `JWT ${token}`
  return headers
}

async function parseJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function parseAuthError(res: Response, fallback: string): Promise<string> {
  const text = await res.text()
  if (!text) return fallback

  try {
    const json = JSON.parse(text) as { error?: string; message?: string; errors?: Array<{ message?: string }> }
    if (typeof json.error === 'string') return json.error
    if (typeof json.message === 'string') return json.message
    if (Array.isArray(json.errors) && json.errors[0]?.message) return json.errors[0].message
  } catch {
    return text.slice(0, 300)
  }

  return fallback
}

type LoginResponse = {
  user?: AuthUser
  token?: string
  exp?: number
  message?: string
}

export async function login(
  email: string,
  password: string,
  remember = false,
): Promise<AuthUser | null> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password, remember }),
  })

  if (!res.ok) {
    throw new Error(await parseAuthError(res, 'Credenciales inválidas'))
  }

  const json = await parseJson<LoginResponse>(res)

  if (json?.token) storeToken(json.token, remember)
  if (remember) localStorage.setItem(REMEMBER_KEY, email.trim().toLowerCase())
  else localStorage.removeItem(REMEMBER_KEY)

  return json?.user ?? null
}

export async function register(data: { email: string; password: string; fullName?: string }) {
  const res = await fetch(`${API_URL}/api/users`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      fullName: data.fullName?.trim(),
      roles: ['client'],
    }),
  })

  if (!res.ok) {
    throw new Error(await parseAuthError(res, 'No se pudo registrar el usuario'))
  }

  return parseJson(res)
}

export async function forgotPassword(email: string) {
  const res = await fetch(`${API_URL}/api/users/forgot-password`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  })

  if (!res.ok) {
    throw new Error(await parseAuthError(res, 'No se pudo enviar el correo de recuperación'))
  }
}

export async function resetPassword(token: string, password: string) {
  const res = await fetch(`${API_URL}/api/users/reset-password`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  })

  if (!res.ok) {
    throw new Error(await parseAuthError(res, 'No se pudo restablecer la contraseña'))
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
) {
  const res = await fetch(`${API_URL}/api/auth/change-password`, {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
  })

  if (!res.ok) {
    throw new Error(await parseAuthError(res, 'No se pudo cambiar la contraseña'))
  }
}

export async function refreshSession(): Promise<AuthUser | null> {
  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders(),
  })

  if (!res.ok) return null

  const json = await parseJson<{ user?: AuthUser; token?: string }>(res)
  if (json?.token) storeToken(json.token, isRememberSession())

  if (json?.user) return json.user

  const session = await getMe()
  return session.user
}

export async function logout() {
  clearStoredToken()
  localStorage.removeItem(REMEMBER_SESSION_KEY)

  await fetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders(),
  }).catch(() => undefined)

  await fetch(`${API_URL}/api/users/logout`, {
    method: 'POST',
    credentials: 'include',
  }).catch(() => undefined)
}

export async function getMe(): Promise<MeResponse> {
  const res = await fetch(`${API_URL}/api/users/me`, {
    credentials: 'include',
    headers: getAuthHeaders(),
  })

  if (res.status === 401) return { user: null, permissions: null }

  if (!res.ok) return { user: null, permissions: null }

  const json = await parseJson<{ user?: AuthUser; permissions?: MeResponse['permissions'] } & AuthUser>(res)
  if (!json) return { user: null, permissions: null }

  return {
    user: json.user ?? (json.id ? (json as AuthUser) : null),
    permissions: json.permissions ?? null,
  }
}

export function getRememberedEmail(): string {
  return localStorage.getItem(REMEMBER_KEY) || ''
}

export { API_URL }
