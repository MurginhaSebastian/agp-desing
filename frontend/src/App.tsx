import { RouterProvider } from 'react-router-dom'
import { router } from '@/router/routes'
import { AuthProvider } from '@/security/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
