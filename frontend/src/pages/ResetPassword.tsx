import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { resetPassword } from '../lib/auth'
import { validatePassword, validatePasswordConfirmation } from '../lib/authValidation'
import AuthLayout from '../layouts/AuthLayout'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    const passwordCheck = validatePassword(password)
    if (!passwordCheck.ok) {
      setError(passwordCheck.message)
      return
    }

    const confirmCheck = validatePasswordConfirmation(password, confirm)
    if (!confirmCheck.ok) {
      setError(confirmCheck.message)
      return
    }

    if (!token) {
      setError('El enlace de recuperación no es válido.')
      return
    }

    setError(null)
    setLoading(true)
    try {
      await resetPassword(token, password)
      navigate('/login')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al restablecer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="glass-card p-8">
        <h1 className="text-2xl font-bold">Nueva contraseña</h1>
        <p className="mt-2 text-sm text-slate-500">Ingresa tu nueva contraseña</p>

        {error && <div className="mt-4 text-sm text-red-500">{error}</div>}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nueva contraseña</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Confirmar contraseña</label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !token}>
            {loading ? 'Guardando…' : 'Restablecer contraseña'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="text-primary-500 hover:underline">
            Volver al login
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
