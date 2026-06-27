import { AlertCircle } from 'lucide-react'
import Button from './Button'

type Props = {
  title?: string
  message: string
  onRetry?: () => void
}

export default function ErrorState({ title = 'Algo salió mal', message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 py-12 text-center dark:border-red-900/50 dark:bg-red-950/20">
      <AlertCircle className="mb-4 h-10 w-10 text-red-500" />
      <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-red-600/80 dark:text-red-300/80">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-6" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  )
}
