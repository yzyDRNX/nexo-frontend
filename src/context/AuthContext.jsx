import { useCallback, useMemo, useState } from 'react'
import axiosClient from '../api/axiosClient.js'
import { AuthContext } from './authContext.js'

function readStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem('user'))
  } catch {
    sessionStorage.removeItem('user')
    return null
  }
}

function getLoginError(error) {
  if (!error.response) {
    return 'No pudimos conectar con el servicio. Revisa tu conexión e inténtalo de nuevo.'
  }

  if ([400, 401].includes(error.response.status)) {
    return 'El usuario o la contraseña no son correctos.'
  }

  if (error.response.status >= 500) {
    return 'El servicio no está disponible en este momento. Inténtalo más tarde.'
  }

  return 'No fue posible iniciar sesión. Verifica tus datos e inténtalo de nuevo.'
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('token'))
  const [user, setUser] = useState(readStoredUser)

  const login = useCallback(async (credentials) => {
    try {
      const { data } = await axiosClient.post('/api/auth/login', credentials)
      const accessToken = data?.token || data?.accessToken

      if (!accessToken) {
        throw new Error('La respuesta de autenticación no contiene un token.')
      }

      const authenticatedUser = data.user || { username: credentials.username }
      sessionStorage.setItem('token', accessToken)
      sessionStorage.setItem('user', JSON.stringify(authenticatedUser))
      setToken(accessToken)
      setUser(authenticatedUser)
      return authenticatedUser
    } catch (error) {
      if (error.response || !error.isAxiosError) {
        throw new Error(
          error.response ? getLoginError(error) : 'No pudimos completar el inicio de sesión.',
          { cause: error },
        )
      }

      throw new Error(getLoginError(error), { cause: error })
    }
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(() => ({ token, user, login, logout }), [token, user, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}