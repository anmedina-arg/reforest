import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { isAuthenticated, getUser, getUserRole, getUserDisplayName } from '@/lib/auth'
import { AppLayout } from '@/components/layout/AppLayout'

export default async function AuthLayout({ children }: { children: ReactNode }) {
  // Verificar si el usuario está autenticado
  const authenticated = await isAuthenticated()

  if (!authenticated) {
    redirect('/login')
  }

  // Obtener información del usuario
  const [user, userName] = await Promise.all([
    getUser(),
    getUserDisplayName(),
  ])

  // Obtener rol del usuario
  const role = await getUserRole()
  const userRole = (role === 'admin' ? 'admin' : 'user') as 'admin' | 'user'

  return (
    <AppLayout
      userRole={userRole}
      userName={userName}
      userEmail={user?.email}
    >
      {children}
    </AppLayout>
  )
}
