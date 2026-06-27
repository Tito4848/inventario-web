type ToastProps = {
  message: string
  type?: 'info' | 'success' | 'error'
}

export function Toast({ message, type = 'info' }: ToastProps) {
  const colors: Record<string, string> = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    error: 'bg-red-500',
  }
  return (
    <div className={`fixed right-4 bottom-6 z-50 rounded-md p-3 text-white ${colors[type]}`}>
      {message}
    </div>
  )
}
