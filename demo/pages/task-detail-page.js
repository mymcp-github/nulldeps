import { Component } from '/src/nulldeps.js';
import { TaskService } from '../services/task.service.js';

class TaskDetailPage extends Component {

  async onMount() {
    const { id } = this.routeParams ?? {};

    // Initial state - task undefined = loading
    this.initState({ task: undefined, editText: '', loading: true, error: null });

    try {
      const task = await TaskService.getById(id);
      this.setState({ task, editText: task?.text ?? '', loading: false });
    } catch (err) {
      // 404 or network error
      this.setState({ task: null, loading: false, error: err.message });
    }
  }

  async save() {
    const { task, editText } = this.state;
    if (!task) return;

    const input = this.shadowRoot.querySelector('#edit-input');
    const text = input?.value?.trim();
    if (!text) return;

    try {
      const updated = await TaskService.update(task.id, { text });
      this.setState({ task: updated, editText: updated.text });
    } catch (err) {
      console.error('Save failed:', err);
    }
  }

  async toggle() {
    const { task } = this.state;
    if (!task) return;

    try {
      const updated = await TaskService.toggle(task.id, task.done);
      this.setState({ task: updated });
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  }

  back() {
    this.emit('navigate', { path: '/tasks' });
  }

  template() {
    const { task, loading, error } = this.state;

    if (loading) return `
      <div class="detail">
        <p class="loading">Loading…</p>
      </div>
    `;

    if (error || !task) return `
      <div class="detail">
        <button class="back" data-action="click:back">← Back</button>
        <p class="not-found">${error ?? 'Task not found.'}</p>
      </div>
    `;

    return `
      <div class="detail">
        <button class="back" data-action="click:back">← Back</button>
        <div class="card">
          <div class="status ${task.done ? 'done' : 'pending'}">
            ${task.done ? '✅ Completed' : '⬜ Pending'}
          </div>

          <div class="field">
            <label>Task</label>
            <input
              id="edit-input"
              type="text"
              value="${task.text}"
              placeholder="Task name..."
            />
          </div>

          <div class="actions">
            <ui-button variant="secondary" data-action="click:toggle">
              ${task.done ? 'Mark as Pending' : 'Mark as Done'}
            </ui-button>
            <ui-button variant="primary" data-action="click:save">
              Save
            </ui-button>
          </div>
        </div>
      </div>
    `;
  }

  styles() {
    return `
      .detail { padding: 2rem 0; }

      .loading { color: #666; font-size: 0.95rem; }

      .back {
        background: transparent;
        color: #6ee7b7;
        border: none;
        cursor: pointer;
        font-size: 0.95rem;
        padding: 0;
        margin-bottom: 1.5rem;
        display: inline-block;
      }
      .back:hover { text-decoration: underline; }

      .card {
        background: #111;
        border: 1px solid #2a2a2a;
        border-radius: 12px;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .status {
        font-size: 0.9rem;
        font-weight: bold;
        padding: 0.4rem 0.8rem;
        border-radius: 6px;
        display: inline-block;
      }
      .status.done    { background: #064e3b; color: #6ee7b7; }
      .status.pending { background: #1c1c1c; color: #aaa; }

      .field { display: flex; flex-direction: column; gap: 0.4rem; }
      label  { font-size: 0.8rem; color: #666; text-transform: uppercase; letter-spacing: 0.05em; }

      input {
        padding: 0.6rem 1rem;
        background: #1a1a1a;
        border: 1px solid #2a2a2a;
        border-radius: 8px;
        color: #fff;
        font-size: 1rem;
      }
      input:focus { outline: none; border-color: #6ee7b7; }

      .actions { display: flex; gap: 0.75rem; margin-top: 0.5rem; }

      .btn-toggle {
        padding: 0.6rem 1.2rem;
        background: #1a1a1a;
        color: #6ee7b7;
        border: 1px solid #6ee7b7;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
      }
      .btn-toggle:hover { background: #064e3b; }

      .btn-save {
        padding: 0.6rem 1.2rem;
        background: #6ee7b7;
        color: #000;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
      }
      .btn-save:hover { background: #34d399; }

      .not-found { color: #ef4444; }
    `;
  }
}

customElements.define('task-detail-page', TaskDetailPage);
