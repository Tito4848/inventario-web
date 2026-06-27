const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type PasswordValidationResult = { ok: true } | { ok: false; message: string }

export function normalizeEmail(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim().toLowerCase()
}

export function isValidEmail(email: string): boolean {
  return email.length >= 5 && email.length <= 254 && EMAIL_RE.test(email)
}

export function validatePassword(password: unknown): PasswordValidationResult {
  if (typeof password !== 'string') {
    return { ok: false, message: 'La contraseña es obligatoria.' }
  }

  if (password.length < 8) {
    return { ok: false, message: 'La contraseña debe tener al menos 8 caracteres.' }
  }

  if (password.length > 128) {
    return { ok: false, message: 'La contraseña no puede superar 128 caracteres.' }
  }

  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return {
      ok: false,
      message: 'La contraseña debe incluir al menos una letra y un número.',
    }
  }

  return { ok: true }
}

export function validatePasswordConfirmation(
  password: string,
  confirmPassword: unknown,
): PasswordValidationResult {
  if (typeof confirmPassword !== 'string' || password !== confirmPassword) {
    return { ok: false, message: 'Las contraseñas no coinciden.' }
  }
  return { ok: true }
}

export function sanitizeString(value: unknown, maxLength = 500): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLength)
}
