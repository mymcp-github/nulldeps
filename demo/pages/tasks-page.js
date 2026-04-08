import { Component } from '/src/nulldeps.js';
import { TaskService } from '../services/tasks.service.js';

class TasksPage extends Component {

  async onMount() {
    // Init with loading state before async data arrives
    this.initState({
      tasks: [],
      input: '',
      loading: true,
      error: null
    });

    try {
      const tasks = await TaskService.getAll();
      this.setState({ tasks, loading: false });
    } catch (err) {
      this.setState({ error: err.message, loading: false });
    }
  }

  toggle(e) {
    const id = Number(e.currentTarget.dataset.id);
    const tasks = this.state.tasks.map(t =>
      t.id === id ? { ...t, done: !t.done } : t
    );
    this.setState({ tasks });
    // Persist toggle to API (fire and forget)
    TaskService.update(id, { done: !this.state.tasks.find(t => t.id === id)?.done })
      .catch(err => console.error('[TasksPage] toggle failed', err));
  }

  async add() {
    const input = this.shadowRoot.querySelector('#task-input');
    const text = input?.value.trim();
    if (!text) return;

    try {
      // Optimistic update - add locally first
      const optimistic = { id: `tmp_${Date.now()}`, text, done: false };
      this.setState({ tasks: [...this.state.tasks, optimistic] });

      const created = await TaskService.create({ text, done: false });

      // Replace optimistic entry with real server response
      const tasks = this.state.tasks.map(t =>
        t.id === optimistic.id ? created : t
      );
      this.setState({ tasks });
    } catch (err) {
      console.error('[TasksPage] add failed', err);
      // Rollback optimistic update on error
      const tasks = this.state.tasks.filter(t => !String(t.id).startsWith('tmp_'));
      this.setState({ tasks, error: err.message });
    }
  }

  async remove(e) {
    const id = Number(e.currentTarget.dataset.id);

    // Optimistic remove
    const previous = this.state.tasks;
    this.setState({ tasks: previous.filter(t => t.id !== id) });

    try {
      await TaskService.remove(id);
    } catch (err) {
      console.error('[TasksPage] remove failed', err);
      // Rollback on error
      this.setState({ tasks: previous, error: err.message });
    }
  }

  edit(e) {
    const id = Number(e.currentTarget.dataset.id);
    window.dispatchEvent(new CustomEvent('navigate', { detail: { path: `/tasks/${id}` } }));
  }

  template() {
    const { tasks, loading, error } = this.state;

    if (loading) return `<div class="tasks"><p class="status">Loading...</p></div>`;
    if (error)   return `<div class="tasks"><p class="status error">${error}</p></div>`;

    const taskItems = tasks.map(t => `
      <li class="task ${t.done ? 'done' : ''}">
        <span data-action="click:toggle" data-id="${t.id}" class="text">
          ${t.done ? '✅' : '⬜'} ${t.text}
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
