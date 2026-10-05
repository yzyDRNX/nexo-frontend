import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

function Login() {
  const { login, token } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(() => location.state?.message || '')
  const [loading, setLoading] = useState(false)

  if (token) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('Completa tu usuario y contraseña.')
      return
    }

    setLoading(true)
    try {
      await login({ username: username.trim(), password })
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-aside" aria-label="Plataforma de seguridad">
        <a className="brand brand-light" href="/login" aria-label="Nexo, inicio">
          <span className="brand-mark" aria-hidden="true">N</span>
          <span>NEXO<span className="brand-period">.</span></span>
        </a>
        <div className="aside-content">
          <p className="eyebrow">CONTROL PLANE / AWS</p>
          <h1>Acceso seguro.<br />Visibilidad total.</h1>
          <p className="aside-copy">Un punto de control para tus identidades e infraestructura.</p>
          <div className="security-status">
            <span className="status-pulse" />
            <span>Protección activa</span>
            <span className="status-divider" />
            <span>Zero Trust</span>
          </div>
        </div>
        <p className="aside-footer">NEXO SECURITY <span>·</span> CONSOLA DE ADMINISTRACIÓN</p>
      </section>

      <section className="login-main">
        <div className="login-form-wrap">
          <div className="mobile-brand brand">
            <span className="brand-mark" aria-hidden="true">N</span>
            <span>NEXO<span className="brand-period">.</span></span>
          </div>
          <div className="form-heading">
            <p className="eyebrow">BIENVENIDO DE NUEVO</p>
            <h2>Inicia sesión</h2>
            <p>Usa tus credenciales corporativas para continuar.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {error && <div className="alert alert-error" role="alert">{error}</div>}
            <label htmlFor="username">Usuario</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Ingresa tu usuario"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              disabled={loading}
            />

            <div className="password-label-row">
              <label htmlFor="password">Contraseña</label>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={loading}
            />

            <button className="button button-primary login-submit" type="submit" disabled={loading}>
              {loading ? <><span className="button-spinner" /> Verificando acceso...</> : 'Continuar'}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className="login-footnote"><span className="lock-icon" aria-hidden="true">●</span> Conexión cifrada y protegida</p>
        </div>
        <footer className="login-copyright">© 2025 Nexo Security <span>·</span> Acceso restringido</footer>
      </section>
    </main>
  )
}

export default Login