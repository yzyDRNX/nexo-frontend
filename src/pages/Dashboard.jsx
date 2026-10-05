import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../api/axiosClient.js'
import { useAuth } from '../context/useAuth.js'

function getCollection(value) {
  return Array.isArray(value) ? value : []
}

function getStatusClass(status = '') {
  const normalized = String(status).toLowerCase()
  if (['activo', 'active', 'online', 'habilitado'].includes(normalized)) return 'status-good'
  if (['inactivo', 'inactive', 'offline', 'suspendido'].includes(normalized)) return 'status-muted'
  return 'status-warn'
}

function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState({ servers: [], users: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newHostname, setNewHostname] = useState('')
  const [newIp, setNewIp] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createNotice, setCreateNotice] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadDashboard() {
      try {
        const response = await axiosClient.get('/api/dashboard', { signal: controller.signal })
        const result = response.data?.data || response.data || {}
        setData({
          servers: getCollection(result.servers),
          users: getCollection(result.users),
        })
      } catch (requestError) {
        if (controller.signal.aborted) return

        if ([401, 403].includes(requestError.response?.status)) {
          logout()
          navigate('/login', { replace: true, state: { message: 'Tu sesión expiró. Inicia sesión nuevamente.' } })
          return
        }

        setError(requestError.response
          ? 'No pudimos cargar la información. Inténtalo de nuevo en unos momentos.'
          : 'No hay conexión con el servicio. Comprueba que la API esté disponible.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadDashboard()
    return () => controller.abort()
  }, [logout, navigate])

  const handleCreateServer = async (event) => {
    event.preventDefault()
    setCreateError('')
    setCreateNotice('')
    setCreateLoading(true)

    try {
      const response = await axiosClient.post('/api/servers', {
        hostname: newHostname.trim(),
        ip: newIp.trim(),
        status: 'online',
      })
      const createdServer = response.data?.server

      if (!createdServer) {
        throw new Error('Respuesta de servidor inválida')
      }

      setData((current) => ({
        ...current,
        servers: [...current.servers, createdServer],
      }))
      setCreateNotice(`${createdServer.hostname} se agregó correctamente.`)
      setNewHostname('')
      setNewIp('')
      setIsCreateOpen(false)
    } catch (requestError) {
      if ([401, 403].includes(requestError.response?.status)) {
        logout()
        navigate('/login', { replace: true, state: { message: 'Tu sesión expiró. Inicia sesión nuevamente.' } })
        return
      }

      setCreateError(requestError.response
        ? 'No pudimos guardar el servidor. Verifica los datos e inténtalo de nuevo.'
        : 'No hay conexión con el servicio. Comprueba que la API esté disponible.')
    } finally {
      setCreateLoading(false)
    }
  }

  const displayName = user?.name || user?.email || 'Administrador'

  const renderStatus = (status) => (
    <span className={`status-badge ${getStatusClass(status)}`}>
      <span className="status-dot" />{status || 'Sin estado'}
    </span>
  )

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <a className="brand sidebar-brand" href="/" aria-label="Nexo, panel principal">
          <span className="brand-mark" aria-hidden="true">N</span>
          <span>NEXO<span className="brand-period">.</span></span>
        </a>
        <p className="nav-caption">ESPACIO DE TRABAJO</p>
        <nav className="side-nav" aria-label="Navegación principal">
          <a className="nav-item nav-item-active" href="/" aria-current="page">
            <span className="nav-icon nav-grid" aria-hidden="true" />Resumen
          </a>
          <a className="nav-item" href="#servers"><span className="nav-icon nav-server" aria-hidden="true" />Servidores</a>
          <a className="nav-item" href="#users"><span className="nav-icon nav-users" aria-hidden="true" />Identidades</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace-card">
            <span className="workspace-icon">A</span>
            <span><strong>Entorno AWS</strong><small>Producción</small></span>
            <span className="workspace-chevron" aria-hidden="true">⌄</span>
          </div>
          <button className="nav-item logout-button" type="button" onClick={() => { logout(); navigate('/login', { replace: true }) }}>
            <span className="nav-icon nav-exit" aria-hidden="true" />Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div className="breadcrumbs"><span>Consola</span><span className="breadcrumb-divider">/</span><strong>Resumen</strong></div>
          <div className="topbar-user">
            <span className="topbar-indicator" />
            <span className="topbar-user-name">{displayName}</span>
            <span className="avatar">{displayName.charAt(0).toUpperCase()}</span>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">CENTRO DE OPERACIONES</p>
              <h1>Resumen</h1>
              <p className="page-subtitle">Estado actual de tu infraestructura e identidades.</p>
            </div>
            <div className="environment-chip"><span className="status-dot" /> AWS · Producción</div>
          </div>

          {error && <div className="alert alert-error dashboard-alert" role="alert">{error}</div>}

          <section className="metric-grid" aria-label="Indicadores">
            <article className="metric-card metric-card-servers">
              <div className="metric-topline"><span>Servidores registrados</span><span className="metric-icon">S</span></div>
              <strong>{loading ? '—' : data.servers.length}</strong>
              <span className="metric-caption">Instancias bajo gestión</span>
            </article>
            <article className="metric-card metric-card-users">
              <div className="metric-topline"><span>Identidades</span><span className="metric-icon">I</span></div>
              <strong>{loading ? '—' : data.users.length}</strong>
              <span className="metric-caption">Usuarios con acceso configurado</span>
            </article>
            <article className="metric-card metric-card-status">
              <div className="metric-topline"><span>Estado de la sesión</span><span className="metric-live"><span className="status-dot" />ACTIVA</span></div>
              <strong className="session-status-text">Protegida</strong>
              <span className="metric-caption">Verificación en cada solicitud</span>
            </article>
          </section>

          <section className="data-section" id="servers">
            <div className="section-heading">
              <div><h2>Servidores</h2><p>Infraestructura registrada en el entorno</p></div>
              <div className="section-actions">
                <span className="table-count">{loading ? 'Cargando' : `${data.servers.length} registros`}</span>
                <button
                  className="button button-primary button-compact"
                  type="button"
                  onClick={() => { setCreateError(''); setIsCreateOpen(true) }}
                >
                  <span aria-hidden="true">+</span> Nuevo Servidor
                </button>
              </div>
            </div>
            {createNotice && <div className="alert alert-success create-notice" role="status">{createNotice}</div>}
            <div className="table-wrap">
              <table>
                <thead><tr><th>Servidor</th><th>Estado</th><th>Región</th><th>Dirección IP</th></tr></thead>
                <tbody>
                  {loading ? <tr><td className="table-message" colSpan="4">Cargando servidores...</td></tr>
                    : data.servers.length === 0 ? <tr><td className="table-message" colSpan="4">No hay servidores para mostrar.</td></tr>
                      : data.servers.map((server, index) => (
                        <tr key={server.id || server.instanceId || server.name || index}>
                          <td><span className="resource-name"><span className="resource-symbol">EC2</span>{server.hostname || server.name || server.instanceId || server.id || 'Servidor sin nombre'}</span></td>
                          <td>{renderStatus(server.status || server.state)}</td>
                          <td>{server.region || server.availabilityZone || '—'}</td>
                          <td className="monospace-cell">{server.ip || server.publicIp || server.ipAddress || '—'}</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="data-section users-section" id="users">
            <div className="section-heading">
              <div><h2>Identidades</h2><p>Usuarios y permisos de acceso</p></div>
              <span className="table-count">{loading ? 'Cargando' : `${data.users.length} registros`}</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Usuario</th><th>Correo electrónico</th><th>Rol</th><th>Estado</th></tr></thead>
                <tbody>
                  {loading ? <tr><td className="table-message" colSpan="4">Cargando identidades...</td></tr>
                    : data.users.length === 0 ? <tr><td className="table-message" colSpan="4">No hay identidades para mostrar.</td></tr>
                      : data.users.map((identity, index) => (
                        <tr key={identity.id || identity.email || index}>
                          <td><span className="resource-name"><span className="user-avatar">{(identity.name || identity.email || 'U').charAt(0).toUpperCase()}</span>{identity.name || 'Usuario sin nombre'}</span></td>
                          <td>{identity.email || '—'}</td>
                          <td>{identity.role || identity.rol || '—'}</td>
                          <td>{renderStatus(identity.status || identity.state || (identity.active ? 'Activo' : 'Sin estado'))}</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </section>
          <footer className="dashboard-footer"><span>NEXO SECURITY</span><span>Consola protegida · AWS</span></footer>
        </div>
      </main>

      {isCreateOpen && (
        <div
          className="modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget && !createLoading) setIsCreateOpen(false)
          }}
        >
          <section className="server-modal" role="dialog" aria-modal="true" aria-labelledby="server-modal-title">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">INFRAESTRUCTURA</p>
                <h2 id="server-modal-title">Nuevo servidor</h2>
                <p>Registra una instancia en tu entorno.</p>
              </div>
              <button
                className="modal-close"
                type="button"
                aria-label="Cerrar formulario"
                disabled={createLoading}
                onClick={() => setIsCreateOpen(false)}
              >
                ×
              </button>
            </div>
            <form className="server-form" onSubmit={handleCreateServer}>
              {createError && <div className="alert alert-error" role="alert">{createError}</div>}
              <label htmlFor="server-hostname">Hostname</label>
              <input
                id="server-hostname"
                name="hostname"
                type="text"
                autoComplete="off"
                placeholder="ej. app-server-03"
                value={newHostname}
                onChange={(event) => setNewHostname(event.target.value)}
                maxLength={253}
                required
                autoFocus
                disabled={createLoading}
              />
              <label htmlFor="server-ip">Dirección IP</label>
              <input
                id="server-ip"
                name="ip"
                type="text"
                autoComplete="off"
                placeholder="ej. 10.0.1.12"
                value={newIp}
                onChange={(event) => setNewIp(event.target.value)}
                maxLength={45}
                required
                disabled={createLoading}
              />
              <p className="server-form-note"><span className="status-dot" /> El servidor se registrará con estado online.</p>
              <div className="modal-actions">
                <button className="button button-secondary" type="button" onClick={() => setIsCreateOpen(false)} disabled={createLoading}>Cancelar</button>
                <button className="button button-primary" type="submit" disabled={createLoading}>
                  {createLoading ? <><span className="button-spinner" /> Guardando...</> : 'Guardar servidor'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default Dashboard