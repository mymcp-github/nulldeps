// demo/services/task.service.js

const STORAGE_KEY = 'nulldeps_tasks';

// --- localStorage helpers (shared logic with tasks.service.js) ---

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function fakeAsync(data, ms = 80) {
  return new Promise(resolve => setTimeout(() => resolve(data), ms));
}

// --- Service — same interface as before ---

export const TaskService = {

  getById: (id) => {
    const task = load().find(t => t.id === Number(id));
    return task
      ? fakeAsync(task)
      : Promise.reject(new Error(`Task ${id} not found`));
  },

  update: (id, patch) => {
    const tasks = load();
    let updated = null;

    const next = tasks.map(t => {
      if (t.id !== Number(id)) return t;
      updated = { ...t, ...patch };
      return updated;
    });

    if (!updated) return Promise.reject(new Error(`Task ${id} not found`));
    save(next);
    return fakeAsync(updated);
  },

  // Convenience wrapper — keeps original interface intact
  toggle: (id, currentDone) => {
    const tasks = load();
    let updated = null;

    const next = tasks.map(t => {
      if (t.id !== Number(id)) return t;
      updated = { ...t, done: !currentDone };
      return updated;
    });

    if (!updated) return Promise.reject(new Error(`Task ${id} not found`));
    save(next);
    return fakeAsync(updated);
  },

  remove: (id) => {
    save(load().filter(t => t.id !== Number(id)));
    return fakeAsync({ ok: true });
  }
};
