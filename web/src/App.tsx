import { RouterProvider } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { useAuth } from '@/lib/auth'
import { router } from './router'

export function App() {
  const auth = useAuth()
  return (
    <>
      <RouterProvider router={router} context={{ auth }} />
      <Toaster />
    </>
  )
}
