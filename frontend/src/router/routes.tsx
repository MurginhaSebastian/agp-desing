import { Outlet, createBrowserRouter } from 'react-router-dom'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { ScrollManager } from '@/components/layout/ScrollManager'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { LoginPage } from '@/pages/admin/LoginPage'
import { ProductEditPage } from '@/pages/admin/ProductEditPage'
import { ProductListPage } from '@/pages/admin/ProductListPage'
import { SettingsPage } from '@/pages/admin/SettingsPage'
import { CatalogPage } from '@/pages/public/CatalogPage'
import { HomePage } from '@/pages/public/HomePage'
import { ProductDetailPage } from '@/pages/public/ProductDetailPage'
import { ProtectedRoute } from '@/security/ProtectedRoute'

function PublicLayout() {
  return (
    <>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 btn-primary">
        Saltar al contenido
      </a>
      <Navbar />
      <main id="contenido">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

function Root() {
  return (
    <>
      <ScrollManager />
      <Outlet />
    </>
  )
}

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/catalogo', element: <CatalogPage /> },
          { path: '/catalogo/:slug', element: <ProductDetailPage /> },
        ],
      },
      { path: '/admin/login', element: <LoginPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <ProductListPage /> },
              { path: 'cuadros/nuevo', element: <ProductEditPage /> },
              { path: 'cuadros/:id', element: <ProductEditPage /> },
              { path: 'portada', element: <SettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
])
