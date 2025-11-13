import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'

export default async function Home() {
  // Si el usuario está autenticado, redirigir a dashboard
  const authenticated = await isAuthenticated()

  if (authenticated) {
    redirect('/dashboard')
  }

  // Si no está autenticado, redirigir a login
  redirect('/login')
}
