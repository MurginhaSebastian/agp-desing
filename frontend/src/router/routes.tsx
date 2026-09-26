// oxlint-disable react/only-export-components -- este archivo es configuración de rutas:
// exporta `router` (que no es un componente) junto a los lazy() de cada página. El aviso
// va de Fast Refresh y aquí no aplica; los componentes de verdad viven en layouts.tsx.
import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AdminSuspense, PublicLayout, Root } from '@/router/layouts'
import { CatalogPage } from '@/pages/public/CatalogPage'
import { HomePage } from '@/pages/public/HomePage'
import { NotFoundPage } from '@/pages/public/NotFoundPage'
import { ProductDetailPage } from '@/pages/public/ProductDetailPage'
import { ProtectedRoute } from '@/security/ProtectedRoute'

/*
 * El panel y las páginas legales se cargan aparte. Un visitante nunca entra al
 * panel, así que no tiene por qué descargar sus formularios.
 */
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })))
const LoginPage = lazy(() => import('@/pages/admin/LoginPage').then((m) => ({ default: m.LoginPage })))
const ProductEditPage = lazy(() => import('@/pages/admin/ProductEditPage').then((m) => ({ default: m.ProductEditPage })))
const ProductListPage = lazy(() => import('@/pages/admin/ProductListPage').then((m) => ({ default: m.ProductListPage })))
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const PrivacyPage = lazy(() => import('@/pages/public/PrivacyPage').then((m) => ({ default: m.PrivacyPage })))
const TermsPage = lazy(() => import('@/pages/public/TermsPage').then((m) => ({ default: m.TermsPage })))

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
          { path: '/privacidad', element: <PrivacyPage /> },
          { path: '/terminos', element: <TermsPage /> },
          // Cualquier otra dirección: sin esto React Router enseña su error en inglés.
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        element: <AdminSuspense />,
        children: [
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
    ],
  },
])
