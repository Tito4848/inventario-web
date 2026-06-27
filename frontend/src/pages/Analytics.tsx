import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  Filler,
} from 'chart.js'
import { Line as ChartLine } from 'react-chartjs-2'
import { fetchAnalytics } from '../lib/api'
import PageSkeleton from '../components/ui/PageSkeleton'
import { useAuth } from '../lib/AuthProvider'
import { getDefaultRoute } from '../lib/permissions'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, ChartLegend, Filler)

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e']

const defaultCategoryData = [
  { name: 'Electrónica', value: 420 },
  { name: 'Alimentos', value: 380 },
  { name: 'Limpieza', value: 290 },
  { name: 'Herramientas', value: 210 },
]

const defaultMovementData = [
  { month: 'Ene', entradas: 420, salidas: 380 },
  { month: 'Feb', entradas: 510, salidas: 440 },
  { month: 'Mar', entradas: 480, salidas: 520 },
  { month: 'Abr', entradas: 620, salidas: 490 },
  { month: 'May', entradas: 580, salidas: 610 },
  { month: 'Jun', entradas: 710, salidas: 650 },
]

const defaultWarehouseData = [
  { name: 'Principal', stock: 4200 },
  { name: 'Secundario', stock: 2800 },
  { name: 'Tienda', stock: 1500 },
]

const defaultTopProducts = [
  { name: 'Producto A', ventas: 120 },
  { name: 'Producto B', ventas: 98 },
  { name: 'Producto C', ventas: 86 },
  { name: 'Producto D', ventas: 72 },
  { name: 'Producto E', ventas: 65 },
]

export default function Analytics() {
  const { permissions, user } = useAuth()

  if (permissions && !permissions.canAccessAnalytics) {
    return <Navigate to={getDefaultRoute(permissions, user?.roles)} replace />
  }

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: fetchAnalytics,
  })

  if (isLoading) return <PageSkeleton />

  const categoryData = (data?.inventoryByCategory as typeof defaultCategoryData) || defaultCategoryData
  const movementData = (data?.monthlyMovements as typeof defaultMovementData) || defaultMovementData
  const warehouseData = (data?.stockByWarehouse as typeof defaultWarehouseData) || defaultWarehouseData
  const topProducts = (data?.topProducts as typeof defaultTopProducts) || defaultTopProducts
  const projection = (data?.projection as number[]) || [4200, 4100, 3950, 3800, 3650, 3500]

  const projectionChartData = {
    labels: ['Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    datasets: [
      {
        label: 'Proyección de inventario',
        data: projection,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard analítico</h1>
        <p className="mt-1 text-sm text-slate-500">Gráficos e insights de tu operación</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-card p-6">
          <h3 className="mb-4 font-semibold">Inventario por categoría</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="mb-4 font-semibold">Entradas vs salidas</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={movementData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="entradas" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="salidas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="mb-4 font-semibold">Movimientos mensuales</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={movementData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="entradas" stroke="#6366f1" strokeWidth={2} />
              <Line type="monotone" dataKey="salidas" stroke="#f43f5e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="mb-4 font-semibold">Stock por almacén</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={warehouseData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="stock" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="mb-4 font-semibold">Productos más vendidos</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="ventas" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="mb-4 font-semibold">Productos menos vendidos</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={[...topProducts].reverse()}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="ventas" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="mb-4 font-semibold">Proyección de inventario (Chart.js)</h3>
        <div className="h-[300px]">
          <ChartLine
            data={projectionChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'top' } },
            }}
          />
        </div>
      </div>
    </div>
  )
}
