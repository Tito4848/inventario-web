import { Link } from 'react-router-dom'
import { useState } from 'react'
import { forgotPassword } from '../lib/auth'
import AuthLayout from '../layouts/AuthLayout'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar correo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="glass-card p-8">
        <h1 className="text-2xl font-bold">Recuperar contraseña</h1>
        <p className="mt-2 text-sm text-slate-500">
          Te enviaremos un enlace para restablecer tu contraseña
        </p>

        {error && <div className="mt-4 text-sm text-red-500">{error}</div>}
        {sent ? (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            Si el correo existe, recibirás instrucciones para restablecer tu contraseña.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Correo electrónico</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Enviando…' : 'Enviar enlace'}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="text-primary-500 hover:underline">
            Volver al login
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
