// demo/services/task.service.js
import { http } from '/src/nulldeps.js';

export const TaskService = {
  /** Fetch single task by id */
  getById: (id) => http.get(`/api/tasks/${id}`),

  /** Partial update - text and/or done */
  update: (id, patch) => http.patch(`/api/tasks/${id}`, patch),

  /** Toggle done state */
  toggle: (id, currentDone) => http.patch(`/api/tasks/${id}`, { done: !currentDone }),

  /** Delete task */
  remove: (id) => http.delete(`/api/tasks/${id}`)
};
