import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getUserDisplayName, isAuthenticated } from '@/lib/auth'
import { LogoutButton } from '@/components/auth/LogoutButton'

export default async function AuthLayout({ children }: { children: ReactNode }) {
  // Verificar si el usuario está autenticado
  const authenticated = await isAuthenticated()

  if (!authenticated) {
    redirect('/login')
  }

  // Obtener el nombre del usuario para mostrar en el header
  const userName = await getUserDisplayName()

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-primary text-primary-foreground">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          {/* Logo y título */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/10">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold">Reforest</h1>
          </div>

          {/* Usuario y logout */}
          <div className="flex items-center gap-4">
            <div className="hidden text-sm sm:block">
              <span className="font-medium">Hola, {userName}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main>{children}</main>
    </div>
  )
}
