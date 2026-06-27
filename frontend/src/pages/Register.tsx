import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { register as apiRegister } from '../lib/auth'
import { validatePassword } from '../lib/authValidation'
import AuthLayout from '../layouts/AuthLayout'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const passwordCheck = validatePassword(password)
    if (!passwordCheck.ok) {
      setError(passwordCheck.message)
      return
    }

    setLoading(true)
    try {
      await apiRegister({ email, password, fullName })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="glass-card p-8">
        <h1 className="text-2xl font-bold">Crear cuenta</h1>
        <p className="mt-2 text-sm text-slate-500">Regístrate para acceder al sistema</p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Cuenta creada. Redirigiendo al login…
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre completo</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Correo</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Contraseña</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creando…' : 'Registrarse'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-primary-500 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
