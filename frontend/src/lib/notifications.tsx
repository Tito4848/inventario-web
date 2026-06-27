import React, { createContext, useContext, useMemo, useState } from 'react'

export type NotificationItem = {
  id: string
  type: 'warning' | 'info' | 'success' | 'error'
  title: string
  message: string
  read: boolean
  createdAt: Date
}

type NotificationContextValue = {
  notifications: NotificationItem[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  addNotification: (item: Omit<NotificationItem, 'id' | 'read' | 'createdAt'>) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

const seedNotifications: NotificationItem[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Stock bajo',
    message: '8 productos están por debajo del stock mínimo.',
    read: false,
    createdAt: new Date(),
  },
  {
    id: '2',
    type: 'error',
    title: 'Sin stock',
    message: '3 productos agotados requieren reposición urgente.',
    read: false,
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: '3',
    type: 'info',
    title: 'Nueva venta',
    message: 'Se registró una venta por S/ 1,250.00.',
    read: true,
    createdAt: new Date(Date.now() - 7200000),
  },
]

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(seedNotifications)

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  function markAsRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  function addNotification(item: Omit<NotificationItem, 'id' | 'read' | 'createdAt'>) {
    setNotifications((prev) => [
      {
        ...item,
        id: crypto.randomUUID(),
        read: false,
        createdAt: new Date(),
      },
      ...prev,
    ])
  }

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead, addNotification }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
