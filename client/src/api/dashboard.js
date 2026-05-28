import { http } from './http'

export const dashboardApi = {
  overview: () => http.get('/api/dashboard/overview').then((r) => r.data),
  productivity: () => http.get('/api/dashboard/productivity').then((r) => r.data),
  workload: () => http.get('/api/dashboard/workload').then((r) => r.data),
  projects: () => http.get('/api/dashboard/projects').then((r) => r.data),
  sprints: (sprintId) =>
    http
      .get('/api/dashboard/sprints', { params: sprintId ? { sprint_id: sprintId } : {} })
      .then((r) => r.data),
}

