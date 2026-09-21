import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Wordmark } from '@/components/layout/Wordmark'
import { isDemoMode } from '@/config/env'
import { useAuth } from '@/hooks/useAuth'

export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (isAuthenticated) return <Navigate to="/admin" replace />

  const from = (location.state as { from?: string } | null)?.from ?? '/admin'

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login({ username: username.trim(), password })
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-dvh grid lg:grid-cols-12">
      <section className="lg:col-span-5 container-x py-12 flex flex-col">
        <Wordmark />
        <div className="my-auto max-w-sm py-12">
          <p className="label-brand">Panel privado</p>
          <h1 className="text-h2 mt-3">Entrar</h1>

          <form onSubmit={onSubmit} noValidate className="mt-10 space-y-5">
            <div>
              <label htmlFor="username" className="field-label">Usuario</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="field-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="field-label">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="field-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p role="alert" className="field-error">{error}</p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-50">
              {busy ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          {isDemoMode && (
            <p className="mt-6 text-sm text-ink-soft">
              Modo demo sin backend: usuario <code className="font-mono">admin</code>, contraseña <code className="font-mono">demo</code>.
            </p>
          )}
        </div>
      </section>
      <aside className="hidden lg:block lg:col-span-7 bg-bordeaux" aria-hidden="true">
        <div className="h-full flex items-end p-16">
          <p className="font-display italic text-4xl text-silk/70 max-w-md">
            Lo que cuelgas aquí, aparece en la pared.
          </p>
        </div>
      </aside>
    </main>
  )
}
