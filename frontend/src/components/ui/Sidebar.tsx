import { Link } from 'react-router-dom'

export default function Sidebar() {
  return (
    <aside className="w-64 p-4 border-r border-gray-200 hidden md:block">
      <div className="mb-6 font-semibold">Menu</div>
      <ul className="space-y-2 text-sm">
        <li>
          <Link to="/" className="block py-2 px-3 rounded-md hover:bg-gray-100/10">Dashboard</Link>
        </li>
        <li>
          <Link to="/productos" className="block py-2 px-3 rounded-md hover:bg-gray-100/10">Productos</Link>
        </li>
        <li>
          <Link to="/categorias" className="block py-2 px-3 rounded-md hover:bg-gray-100/10">Categorías</Link>
        </li>
      </ul>
    </aside>
  )
}
