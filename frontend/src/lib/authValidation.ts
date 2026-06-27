export type PasswordValidationResult = { ok: true } | { ok: false; message: string }

export function validatePassword(password: string): PasswordValidationResult {
  if (!password) {
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
  confirmPassword: string,
): PasswordValidationResult {
  if (password !== confirmPassword) {
    return { ok: false, message: 'Las contraseñas no coinciden.' }
  }
  return { ok: true }
}
