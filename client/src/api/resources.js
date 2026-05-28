import { http } from './http'

export const teamsApi = {
  list: () => http.get('/api/teams').then((r) => r.data),
  getById: (id) => http.get(`/api/teams/${id}`).then((r) => r.data),
  members: (id) => http.get(`/api/teams/${id}/members`).then((r) => r.data),
  addMember: (id, user_id) => http.post(`/api/teams/${id}/users`, { user_id }).then((r) => r.data),
  removeMember: (id, userId) => http.delete(`/api/teams/${id}/users/${userId}`).then((r) => r.data),
  create: (payload) => http.post('/api/teams', payload).then((r) => r.data),
  update: (id, payload) => http.put(`/api/teams/${id}`, payload).then((r) => r.data),
  remove: (id) => http.delete(`/api/teams/${id}`).then((r) => r.data),
}

export const projectsApi = {
  list: () => http.get('/api/projects').then((r) => r.data),
  create: (payload) => http.post('/api/projects', payload).then((r) => r.data),
  update: (id, payload) => http.put(`/api/projects/${id}`, payload).then((r) => r.data),
  remove: (id) => http.delete(`/api/projects/${id}`).then((r) => r.data),
}

export const tasksApi = {
  list: () => http.get('/api/tasks').then((r) => r.data),
  create: (payload) => http.post('/api/tasks', payload).then((r) => r.data),
  update: (id, payload) => http.put(`/api/tasks/${id}`, payload).then((r) => r.data),
  remove: (id) => http.delete(`/api/tasks/${id}`).then((r) => r.data),
}

export const bugsApi = {
  list: () => http.get('/api/bugs').then((r) => r.data),
  create: (payload) => http.post('/api/bugs', payload).then((r) => r.data),
  update: (id, payload) => http.put(`/api/bugs/${id}`, payload).then((r) => r.data),
  remove: (id) => http.delete(`/api/bugs/${id}`).then((r) => r.data),
}

export const incidentsApi = {
  list: () => http.get('/api/incidents').then((r) => r.data),
  create: (payload) => http.post('/api/incidents', payload).then((r) => r.data),
  update: (id, payload) => http.put(`/api/incidents/${id}`, payload).then((r) => r.data),
  remove: (id) => http.delete(`/api/incidents/${id}`).then((r) => r.data),
}

export const usersApi = {
  list: (params = {}) => http.get('/api/users', { params }).then((r) => r.data),
  getById: (id) => http.get(`/api/users/${id}`).then((r) => r.data),
}

export const notificationsApi = {
  myList: () => http.get('/api/notifications/me').then((r) => r.data),
  unreadCount: () => http.get('/api/notifications/me/unread-count').then((r) => r.data),
  markRead: (id) => http.post(`/api/notifications/${id}/read`).then((r) => r.data),
}

