import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { ThemeProvider } from './lib/theme'
import { AuthProvider } from './lib/AuthProvider'
import { NotificationProvider } from './lib/notifications'
import RequireAuth, { RequireGuest } from './lib/RequireAuth'
import AppLayout from './layouts/AppLayout'
import PageSkeleton from './components/ui/PageSkeleton'

const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Productos = lazy(() => import('./pages/Productos'))
const Categorias = lazy(() => import('./pages/Categoria'))
const Subcategorias = lazy(() => import('./pages/Subcategorias'))
const Marcas = lazy(() => import('./pages/Marcas'))
const Unidad_medida = lazy(() => import('./pages/Unidad_medida'))
const Equivalencia = lazy(() => import('./pages/Equivalencia'))
const Racks = lazy(() => import('./pages/Racks'))
const Stock = lazy(() => import('./pages/Stock'))
const Movimientos = lazy(() => import('./pages/Movimientos'))
const Proveedores = lazy(() => import('./pages/Proveedores'))
const Clientes = lazy(() => import('./pages/Clientes'))
const Compras = lazy(() => import('./pages/Compras'))
const CompraNueva = lazy(() => import('./pages/CompraNueva'))
const CompraDetalle = lazy(() => import('./pages/CompraDetalle'))
const CompraRecepcion = lazy(() => import('./pages/CompraRecepcion'))
const Ventas = lazy(() => import('./pages/Ventas'))
const VentaNueva = lazy(() => import('./pages/VentaNueva'))
const VentaDetalle = lazy(() => import('./pages/VentaDetalle'))
const VentaConfirmar = lazy(() => import('./pages/VentaConfirmar'))
const VentaEntregar = lazy(() => import('./pages/VentaEntregar'))
const VentaDevolver = lazy(() => import('./pages/VentaDevolver'))
const Kardex = lazy(() => import('./pages/Kardex'))
const Reportes = lazy(() => import('./pages/Reportes'))
const Auditoria = lazy(() => import('./pages/Auditoria'))
const Notificaciones = lazy(() => import('./pages/Notificaciones'))
const Configuracion = lazy(() => import('./pages/Configuracion'))
const CatalogoPublico = lazy(() => import('./pages/CatalogoPublico'))
const Promociones = lazy(() => import('./pages/Promociones'))
const Usuarios = lazy(() => import('./pages/Usuarios'))
const PortalCliente = lazy(() => import('./pages/PortalCliente'))
const LegalPage = lazy(() => import('./pages/LegalPage'))

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NotificationProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LazyPage><Landing /></LazyPage>} />
                <Route path="/login" element={<RequireGuest><LazyPage><Login /></LazyPage></RequireGuest>} />
                <Route path="/register" element={<RequireGuest><LazyPage><Register /></LazyPage></RequireGuest>} />
                <Route path="/forgot-password" element={<RequireGuest><LazyPage><ForgotPassword /></LazyPage></RequireGuest>} />
                <Route path="/reset-password" element={<RequireGuest><LazyPage><ResetPassword /></LazyPage></RequireGuest>} />
                <Route path="/catalogo" element={<LazyPage><CatalogoPublico /></LazyPage>} />
                <Route path="/promociones" element={<LazyPage><Promociones /></LazyPage>} />
                <Route path="/legal/:type" element={<LazyPage><LegalPage /></LazyPage>} />

                <Route
                  path="/app"
                  element={
                    <RequireAuth>
                      <AppLayout />
                    </RequireAuth>
                  }
                >
                  <Route index element={<LazyPage><Dashboard /></LazyPage>} />
                  <Route path="analytics" element={<LazyPage><Analytics /></LazyPage>} />
                  <Route path="productos" element={<LazyPage><Productos /></LazyPage>} />
                  <Route path="categorias" element={<LazyPage><Categorias /></LazyPage>} />
                  <Route path="subcategorias" element={<LazyPage><Subcategorias /></LazyPage>} />
                  <Route path="marcas" element={<LazyPage><Marcas /></LazyPage>} />
                  <Route path="unidades" element={<LazyPage><Unidad_medida /></LazyPage>} />
                  <Route path="equivalencias" element={<LazyPage><Equivalencia /></LazyPage>} />
                  <Route path="racks" element={<LazyPage><Racks /></LazyPage>} />
                  <Route path="stock" element={<LazyPage><Stock /></LazyPage>} />
                  <Route path="movimientos" element={<LazyPage><Movimientos /></LazyPage>} />
                  <Route path="proveedores" element={<LazyPage><Proveedores /></LazyPage>} />
                  <Route path="clientes" element={<LazyPage><Clientes /></LazyPage>} />
                  <Route path="compras" element={<LazyPage><Compras /></LazyPage>} />
                  <Route path="compras/nueva" element={<LazyPage><CompraNueva /></LazyPage>} />
                  <Route path="compras/:id/recepcion" element={<LazyPage><CompraRecepcion /></LazyPage>} />
                  <Route path="compras/:id" element={<LazyPage><CompraDetalle /></LazyPage>} />
                  <Route path="ventas" element={<LazyPage><Ventas /></LazyPage>} />
                  <Route path="ventas/nueva" element={<LazyPage><VentaNueva /></LazyPage>} />
                  <Route path="ventas/:id/confirmar" element={<LazyPage><VentaConfirmar /></LazyPage>} />
                  <Route path="ventas/:id/entregar" element={<LazyPage><VentaEntregar /></LazyPage>} />
                  <Route path="ventas/:id/devolver" element={<LazyPage><VentaDevolver /></LazyPage>} />
                  <Route path="ventas/:id" element={<LazyPage><VentaDetalle /></LazyPage>} />
                  <Route path="kardex" element={<LazyPage><Kardex /></LazyPage>} />
                  <Route path="reportes" element={<LazyPage><Reportes /></LazyPage>} />
                  <Route path="auditoria" element={<LazyPage><Auditoria /></LazyPage>} />
                  <Route path="notificaciones" element={<LazyPage><Notificaciones /></LazyPage>} />
                  <Route path="portal" element={<LazyPage><PortalCliente /></LazyPage>} />
                  <Route path="usuarios" element={<LazyPage><Usuarios /></LazyPage>} />
                  <Route path="configuracion" element={<LazyPage><Configuracion /></LazyPage>} />
                </Route>

                <Route path="/dashboard" element={<Navigate to="/app" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </NotificationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
