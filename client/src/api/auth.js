import { http } from './http'

export const authApi = {
  signup: (payload) => http.post('/api/auth/signup', payload).then((r) => r.data),
  login: (payload) => http.post('/api/auth/login', payload).then((r) => r.data),
  refreshToken: (payload) => http.post('/api/auth/refresh-token', payload).then((r) => r.data),
  logout: (payload) => http.post('/api/auth/logout', payload).then((r) => r.data),
}

