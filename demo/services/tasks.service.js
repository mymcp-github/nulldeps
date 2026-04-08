// demo/services/tasks.service.js

const STORAGE_KEY = 'nulldeps_tasks';

// Seed data for first visit
const SEED_TASKS = [
  { id: 1, text: 'Read the nulldeps docs',     done: true  },
  { id: 2, text: 'Build a component',           done: false },
  { id: 3, text: 'Remove the data server 🎉',   done: true  },
  { id: 4, text: 'Deploy to GitHub Pages',      done: false },
];

// --- localStorage helpers ---

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : SEED_TASKS;
  } catch {
    return SEED_TASKS;
  }
}

function save(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Simulate async network delay
function fakeAsync(data, ms = 80) {
  return new Promise(resolve => setTimeout(() => resolve(data), ms));
}

// --- Service — same interface as before ---

export const TaskService = {

  getAll: () => {
    return fakeAsync(load());
  },

  getById: (id) => {
    const task = load().find(t => t.id === Number(id));
    return task
      ? fakeAsync(task)
      : Promise.reject(new Error(`Task ${id} not found`));
  },

  create: (data) => {
    const tasks = load();
    const newTask = {
      id:   Date.now(),
      text: data.text ?? '',
      done: data.done ?? false
    };
    save([...tasks, newTask]);
    return fakeAsync(newTask);
  },

  update: (id, data) => {
    const tasks = load();
    let updated = null;

    const next = tasks.map(t => {
      if (t.id !== Number(id)) return t;
      updated = { ...t, ...data };
      return updated;
    });

    if (!updated) return Promise.reject(new Error(`Task ${id} not found`));
    save(next);
    return fakeAsync(updated);
  },

  remove: (id) => {
    const tasks = load();
    save(tasks.filter(t => t.id !== Number(id)));
    return fakeAsync({ ok: true });
  }
};
