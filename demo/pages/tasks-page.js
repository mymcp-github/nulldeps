import { Component } from '/src/nulldeps.js';
import { TaskService } from '../services/tasks.service.js';
import { createStore, logger } from '/src/core/store.js';

// Create isolated store for this page - not shared globally
const { store, setState, getSnapshot } = createStore({
  tasks: [],
  input: '',
  loading: true,
  error: null
});

class TasksPage extends Component {

  async onMount() {
    // Subscribe to store changes - re-render on every update
    this._unsubscribe = this._bindStore();

    try {
      const tasks = await TaskService.getAll();
      setState({ tasks, loading: false });
    } catch (err) {
      setState({ error: err.message, loading: false });
    }
  }

  onUnmount() {
    // Cleanup store subscription to prevent memory leak
    this._unsubscribe?.();
  }

  /**
   * Bind store:change event to component re-render
   * Returns unsubscribe function
   */
  _bindStore() {
    const handler = () => this.render();
    window.addEventListener('store:change', handler);
    return () => window.removeEventListener('store:change', handler);
  }

  toggle(e) {
    const id = Number(e.currentTarget.dataset.id);
    const { tasks } = getSnapshot();

    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // Optimistic update
    setState({
      tasks: tasks.map(t => t.id === id ? { ...t, done: !t.done } : t)
    });

    // Persist to API - fire and forget with rollback on error
    TaskService.update(id, { done: !task.done })
      .catch(err => {
        console.error('[TasksPage] toggle failed', err);
        // Rollback to pre-toggle state
        setState({ tasks, error: err.message });
      });
  }

  async add() {
    const input = this.shadowRoot.querySelector('#task-input');
    const text = input?.value.trim();
    if (!text) return;

    const { tasks } = getSnapshot();
    const optimistic = { id: `tmp_${Date.now()}`, text, done: false };

    // Optimistic update
    setState({ tasks: [...tasks, optimistic], error: null });

    // Clear input immediately for better UX
    if (input) input.value = '';

    try {
      const created = await TaskService.create({ text, done: false });

      // Replace optimistic entry with real server response
      const current = getSnapshot();
      setState({
        tasks: current.tasks.map(t => t.id === optimistic.id ? created : t)
      });
    } catch (err) {
      console.error('[TasksPage] add failed', err);
      // Rollback optimistic entry
      const current = getSnapshot();
      setState({
        tasks: current.tasks.filter(t => t.id !== optimistic.id),
        error: err.message
      });
    }
  }

  async remove(e) {
    const id = Number(e.currentTarget.dataset.id);
    const { tasks } = getSnapshot();

    // Optimistic remove
    setState({ tasks: tasks.filter(t => t.id !== id), error: null });

    try {
      await TaskService.remove(id);
    } catch (err) {
      console.error('[TasksPage] remove failed', err);
      // Rollback to previous list
      setState({ tasks, error: err.message });
    }
  }

  edit(e) {
    const id = Number(e.currentTarget.dataset.id);
    window.dispatchEvent(new CustomEvent('navigate', {
      detail: { path: `/tasks/${id}` }
    }));
  }

  template() {
    // Read from proxy - always current values
    const { tasks, loading, error } = store;

    if (loading) return `<div class="tasks"><p class="status">Loading...</p></div>`;

    // Escape error message to prevent XSS in template
    if (error) return `
      <div class="tasks">
        <p class="status error">${this._escapeHtml(error)}</p>
      </div>
    `;

    const taskItems = tasks.map(t => `
      <li class="task ${t.done ? 'done' : ''}">
        <span data-action="click:toggle" data-id="${t.id}" class="text">
          ${t.done ? '✅' : '⬜'} ${this._escapeHtml(t.text)}
        </span>
        <div class="task-actions">
          <button data-action="click:edit" data-id="${t.id}" class="edit" title="Edit task">
            ✏️
          </button>
          <button data-action="click:remove" data-id="${t.id}" class="remove" title="Remove task">
            ✕
          </button>
        </div>
      </li>
    `).join('');

    return `
      <div class="tasks">
        <h2>Tasks</h2>
        <div class="add-form">
          <input id="task-input" type="text" placeholder="New task..." />
          <button data-action="click:add">Add</button>
        </div>
        <ul>${taskItems}</ul>
      </div>
    `;
  }

  /**
   * Escape HTML special characters to prevent XSS in templates
   * @param {string} str
   * @returns {string}
   */
  _escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  styles() {
    return `
      .tasks { padding: 2rem 0; }
      h2 { font-size: 1.5rem; margin-bottom: 1.5rem; color: #fff; }
      .status { color: #666; text-align: center; padding: 2rem; }
      .status.error { color: #ef4444; }
      .add-form { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
      input {
        flex: 1; padding: 0.6rem 1rem;
        background: #1a1a1a; border: 1px solid #2a2a2a;
        border-radius: 8px; color: #fff; font-size: 1rem;
      }
      button {
        padding: 0.6rem 1.2rem; background: #6ee7b7;
        color: #000; border: none; border-radius: 8px;
        cursor: pointer; font-weight: bold;
      }
      ul { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
      .task {
        display: flex; align-items: center;
        justify-content: space-between; padding: 0.75rem 1rem;
        background: #111; border: 1px solid #2a2a2a; border-radius: 8px;
      }
      .task.done .text { opacity: 0.4; text-decoration: line-through; }
      .text { cursor: pointer; flex: 1; }
      .task-actions { display: flex; align-items: center; gap: 0.25rem; }
      .edit, .remove {
        background: transparent; border: none;
        font-size: 1rem; cursor: pointer;
        padding: 0 0.5rem; transition: color 0.15s; color: #666;
      }
      .edit:hover  { color: #6ee7b7; }
      .remove:hover { color: #ef4444; }
    `;
  }
}

customElements.define('tasks-page', TasksPage);
