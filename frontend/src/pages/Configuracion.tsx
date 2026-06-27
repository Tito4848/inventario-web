import { useState } from 'react'
import { changePassword } from '../lib/auth'
import { validatePassword, validatePasswordConfirmation } from '../lib/authValidation'
import { useAuth } from '../lib/AuthProvider'
import { useTheme } from '../lib/theme'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function Configuracion() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)

    const passwordCheck = validatePassword(newPassword)
    if (!passwordCheck.ok) {
      setError(passwordCheck.message)
      return
    }

    const confirmCheck = validatePasswordConfirmation(newPassword, confirmPassword)
    if (!confirmCheck.ok) {
      setError(confirmCheck.message)
      return
    }

    setLoading(true)
    try {
      await changePassword(currentPassword, newPassword, confirmPassword)
      setMessage('Contraseña actualizada correctamente')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cambiar contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="mt-1 text-sm text-slate-500">Preferencias de cuenta y apariencia</p>
      </div>

      <div className="glass-card p-6">
        <h2 className="font-semibold">Perfil</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Correo</dt>
            <dd>{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Nombre</dt>
            <dd>{user?.fullName || '-'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Roles</dt>
            <dd>{user?.roles?.join(', ') || '-'}</dd>
          </div>
        </dl>
      </div>

      <div className="glass-card p-6">
        <h2 className="font-semibold">Apariencia</h2>
        <div className="mt-4 flex gap-2">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={`rounded-xl px-4 py-2 text-sm capitalize ${
                theme === t ? 'bg-primary-500 text-white' : 'bg-surface-elevated'
              }`}
            >
              {t === 'system' ? 'Sistema' : t === 'light' ? 'Claro' : 'Oscuro'}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="font-semibold">Cambiar contraseña</h2>
        {message && <p className="mt-2 text-sm text-green-600">{message}</p>}
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        <form onSubmit={handlePasswordChange} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm">Contraseña actual</label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm">Nueva contraseña</label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Confirmar nueva contraseña</label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando…' : 'Actualizar contraseña'}
          </Button>
        </form>
      </div>
    </div>
  )
}
