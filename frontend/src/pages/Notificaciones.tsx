import { useNotifications } from '../lib/notifications'
import Button from '../components/ui/Button'

export default function Notificaciones() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications()

  const typeStyles = {
    warning: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30',
    error: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30',
    info: 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30',
    success: 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notificaciones</h1>
          <p className="mt-1 text-sm text-slate-500">Alertas de stock, vencimientos y operaciones</p>
        </div>
        <Button variant="outline" onClick={markAllAsRead}>
          Marcar todas como leídas
        </Button>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`rounded-xl border p-4 ${typeStyles[n.type]} ${n.read ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">{n.title}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{n.message}</p>
                <p className="mt-2 text-xs text-slate-500">{n.createdAt.toLocaleString('es-PE')}</p>
              </div>
              {!n.read && (
                <button type="button" className="text-sm text-primary-500" onClick={() => markAsRead(n.id)}>
                  Marcar leída
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
