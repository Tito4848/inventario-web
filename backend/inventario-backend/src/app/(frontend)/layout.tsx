import React from 'react'
import './styles.css'

export const metadata = {
  description: 'Sistema web de gestión de inventario.',
  title: 'Inventario Web',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="es">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
