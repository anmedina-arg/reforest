'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { logoutUser } from '@/app/actions/auth'

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleLogout() {
    setIsLoading(true)

    try {
      const result = await logoutUser()

      if (!result.success && result.error) {
        toast.error(result.error)
        setIsLoading(false)
        return
      }

      // Si el logout fue exitoso, redirigir al login
      if (result.success) {
        toast.success('Sesión cerrada correctamente')
        router.push('/login')
        router.refresh() // Refrescar los datos del servidor
      }
    } catch (error) {
      toast.error('Error al cerrar sesión')
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={isLoading}
      className="text-primary-foreground hover:bg-primary/90"
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Cerrando...</span>
        </div>
      ) : (
        <>
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Cerrar sesión
        </>
      )}
    </Button>
  )
}
