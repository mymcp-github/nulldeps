import { http } from '/src/nulldeps.js';

// Centralized task API calls - single responsibility
export const TaskService = {
  getAll: ()         => http.get('/api/tasks'),
  getById: (id)      => http.get(`/api/tasks/${id}`),
  create: (data)     => http.post('/api/tasks', data),
  update: (id, data) => http.patch(`/api/tasks/${id}`, data),
  remove: (id)       => http.delete(`/api/tasks/${id}`)
};
