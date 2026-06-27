import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthProvider'

export default function Navbar() {
  const { user, logout } = useAuth()
  const nav = useNavigate()

  async function handleLogout() {
    await logout()
    nav('/login')
  }

  return (
    <header className="w-full py-3 px-4 flex items-center justify-between border-b border-gray-200 bg-white/5">
      <div className="flex items-center gap-3">
        <div className="text-xl font-bold">Inventario</div>
        <nav className="hidden md:flex gap-2 text-sm text-gray-500">
          <Link to="/">Dashboard</Link>
          <Link to="/productos">Productos</Link>
          <Link to="/movimientos">Movimientos</Link>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <div className="text-sm">{user.email ?? 'Usuario'}</div>
            <button className="px-3 py-1 rounded-md bg-white/5" onClick={handleLogout}>Salir</button>
          </>
        ) : (
          <Link to="/login" className="px-3 py-1 rounded-md bg-primary-500 text-white">Entrar</Link>
        )}
      </div>
    </header>
  )
}
