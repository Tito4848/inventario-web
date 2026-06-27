import type { LucideIcon } from 'lucide-react'

type Props = {
  title: string
  value: React.ReactNode
  delta?: string
  icon?: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
}

export default function StatCard({ title, value, delta, icon: Icon, trend = 'neutral' }: Props) {
  const trendColor =
    trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-slate-500'

  return (
    <div className="glass-card p-5 shadow-soft transition hover:shadow-glow">
      <div className="flex items-start justify-between">
        <div className="text-sm text-slate-500">{title}</div>
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      {delta && <div className={`mt-1 text-xs font-medium ${trendColor}`}>{delta}</div>}
    </div>
  )
}
