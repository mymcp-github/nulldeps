import { Component } from '/src/nulldeps.js';

/**
 * ComponentsOverviewPage
 * Visual reference for all available UI components in the NullDeps framework
 */
class ComponentsOverviewPage extends Component {

  onMount() {
    this.initState({ activeSection: 'buttons' });
  }

  selectSection(e) {
    const section = e.target.closest('[data-section]')?.dataset.section;
    if (section) this.setState({ activeSection: section });
  }

  template() {
    const { activeSection } = this.state;

    const sections = [
      { id: 'buttons',   label: '🔘 Buttons' },
      { id: 'forms',     label: '📝 Forms' },
      { id: 'cards',     label: '🃏 Cards' },
      { id: 'feedback',  label: '💬 Feedback' },
      { id: 'layout',    label: '📐 Layout' },
    ];

    return `
      <div class="page">

        <header class="page-header">
          <h1 class="page-title">Component Library</h1>
          <p class="page-subtitle">NullDeps · Zero Dependencies · Pure Web Standards</p>
        </header>

        <!-- Section Navigation -->
        <nav class="section-nav">
          ${sections.map(s => `
            <button
              class="nav-btn ${activeSection === s.id ? 'active' : ''}"
              data-section="${s.id}"
              data-action="click:selectSection"
            >
              ${s.label}
            </button>
          `).join('')}
        </nav>

        <!-- Content -->
        <main class="content">
          ${activeSection === 'buttons'  ? this.#renderButtons()  : ''}
          ${activeSection === 'forms'    ? this.#renderForms()    : ''}
          ${activeSection === 'cards'    ? this.#renderCards()    : ''}
          ${activeSection === 'feedback' ? this.#renderFeedback() : ''}
          ${activeSection === 'layout'   ? this.#renderLayout()   : ''}
        </main>

      </div>
    `;
  }

  // ---- Sections ----

  #renderButtons() {
    return `
      <section class="section">
        <h2 class="section-title">Buttons <span class="tag">ui-button</span></h2>

        <!-- Variants -->
        <div class="group">
          <h3 class="group-title">Variants</h3>
          <div class="row">
            <ui-button variant="primary">Primary</ui-button>
            <ui-button variant="secondary">Secondary</ui-button>
            <ui-button variant="ghost">Ghost</ui-button>
            <ui-button variant="danger">Danger</ui-button>
          </div>
          <div class="code-block"><pre>${this.#esc(`<ui-button variant="primary">Primary</ui-button>
<ui-button variant="secondary">Secondary</ui-button>
<ui-button variant="ghost">Ghost</ui-button>
<ui-button variant="danger">Danger</ui-button>`)}</pre></div>
        </div>

        <!-- Sizes -->
        <div class="group">
          <h3 class="group-title">Sizes</h3>
          <div class="row align-center">
            <ui-button variant="primary" size="sm">Small</ui-button>
            <ui-button variant="primary" size="md">Medium</ui-button>
            <ui-button variant="primary" size="lg">Large</ui-button>
          </div>
          <div class="code-block"><pre>${this.#esc(`<ui-button variant="primary" size="sm">Small</ui-button>
<ui-button variant="primary" size="md">Medium</ui-button>
<ui-button variant="primary" size="lg">Large</ui-button>`)}</pre></div>
        </div>

        <!-- States -->
        <div class="group">
          <h3 class="group-title">States</h3>
          <div class="row">
            <ui-button variant="primary">Normal</ui-button>
            <ui-button variant="primary" disabled>Disabled</ui-button>
            <ui-button variant="primary" loading>Loading…</ui-button>
          </div>
          <div class="code-block"><pre>${this.#esc(`<ui-button variant="primary">Normal</ui-button>
<ui-button variant="primary" disabled>Disabled</ui-button>
<ui-button variant="primary" loading>Loading…</ui-button>`)}</pre></div>
        </div>

        <!-- data-action binding -->
        <div class="group">
          <h3 class="group-title">data-action Binding</h3>
          <div class="code-block"><pre>${this.#esc(`<!-- In your component template() -->
<ui-button variant="primary" data-action="click:save">Save</ui-button>
<ui-button variant="danger"  data-action="click:delete">Delete</ui-button>

// In your component class:
save()   { /* ... */ }
delete() { /* ... */ }`)}</pre></div>
        </div>

        <!-- API Table -->
        ${this.#renderApiTable('ui-button', [
          ['variant',  'Attribute', '"primary" | "secondary" | "ghost" | "danger"', '"primary"'],
          ['size',     'Attribute', '"sm" | "md" | "lg"',                           '"md"'],
          ['disabled', 'Attribute', 'boolean',                                      'false'],
          ['loading',  'Attribute', 'boolean',                                      'false'],
        ])}
      </section>
    `;
  }

  #renderForms() {
    return `
      <section class="section">
        <h2 class="section-title">Forms <span class="tag">ui-input · ui-select · ui-checkbox</span></h2>

        <!-- Text Input -->
        <div class="group">
          <h3 class="group-title">Text Input</h3>
          <div class="row col">
            <ui-input placeholder="Enter text…" label="Username"></ui-input>
            <ui-input placeholder="Disabled" label="Disabled" disabled></ui-input>
            <ui-input placeholder="With error" label="Email" error="Invalid email address"></ui-input>
          </div>
          <div class="code-block"><pre>${this.#esc(`<ui-input placeholder="Enter text…" label="Username"></ui-input>
<ui-input placeholder="Disabled"   label="Disabled" disabled></ui-input>
<ui-input placeholder="With error" label="Email" error="Invalid email"></ui-input>`)}</pre></div>
        </div>

        <!-- Select -->
        <div class="group">
          <h3 class="group-title">Select</h3>
          <div class="row col">
            <ui-select label="Category" options='[{"value":"a","label":"Option A"},{"value":"b","label":"Option B"}]'></ui-select>
          </div>
          <div class="code-block"><pre>${this.#esc(`<ui-select
  label="Category"
  options='[{"value":"a","label":"Option A"}]'>
</ui-select>`)}</pre></div>
        </div>

        <!-- Checkbox -->
        <div class="group">
          <h3 class="group-title">Checkbox</h3>
          <div class="row">
            <ui-checkbox label="Accept Terms"></ui-checkbox>
            <ui-checkbox label="Pre-checked" checked></ui-checkbox>
            <ui-checkbox label="Disabled" disabled></ui-checkbox>
          </div>
          <div class="code-block"><pre>${this.#esc(`<ui-checkbox label="Accept Terms"></ui-checkbox>
<ui-checkbox label="Pre-checked" checked></ui-checkbox>`)}</pre></div>
        </div>

        <!-- API: ui-input -->
        ${this.#renderApiTable('ui-input', [
          ['label',       'Attribute', 'string',                                   '""'],
          ['placeholder', 'Attribute', 'string',                                   '""'],
          ['value',       'Attribute', 'string',                                   '""'],
          ['type',        'Attribute', '"text" | "password" | "email" | "number"', '"text"'],
          ['disabled',    'Attribute', 'boolean',                                  'false'],
          ['error',       'Attribute', 'string',                                   '""'],
          ['change',      'Event',     'CustomEvent<{ value: string }>',            '—'],
        ])}

        <!-- API: ui-select -->
        ${this.#renderApiTable('ui-select', [
          ['label',       'Attribute', 'string',                                        '""'],
          ['options',     'Attribute', 'JSON string: Array<{ value: string, label: string }>', '"[]"'],
          ['value',       'Attribute', 'string',                                        '""'],
          ['placeholder', 'Attribute', 'string',                                        '"Select…"'],
          ['disabled',    'Attribute', 'boolean',                                       'false'],
          ['error',       'Attribute', 'string',                                        '""'],
          ['change',      'Event',     'CustomEvent<{ value: string, label: string }>',  '—'],
        ])}

        <!-- API: ui-checkbox -->
        ${this.#renderApiTable('ui-checkbox', [
          ['label',         'Attribute', 'string',  '""'],
          ['checked',       'Attribute', 'boolean', 'false'],
          ['indeterminate', 'Attribute', 'boolean', 'false'],
          ['disabled',      'Attribute', 'boolean', 'false'],
          ['required',      'Attribute', 'boolean', 'false'],
          ['value',         'Attribute', 'string',  '""'],
          ['error',         'Attribute', 'string',  '""'],
          ['change',        'Event',     'CustomEvent<{ checked: boolean, value: string }>', '—'],
        ])}

      </section>
    `;
  }


  #renderCards() {
    return `
      <section class="section">
        <h2 class="section-title">Cards <span class="tag">ui-card</span></h2>

        <div class="group">
          <h3 class="group-title">Variants</h3>
          <div class="row wrap">

            <div class="demo-card">
              <div class="demo-card-header">Default Card</div>
              <div class="demo-card-body">Standard card with border and subtle background.</div>
              <div class="demo-card-footer">
                <ui-button variant="ghost" size="sm">Cancel</ui-button>
                <ui-button variant="primary" size="sm">Confirm</ui-button>
              </div>
            </div>

            <div class="demo-card highlighted">
              <div class="demo-card-header">Highlighted Card</div>
              <div class="demo-card-body">Used for featured or active items in a list.</div>
              <div class="demo-card-footer">
                <ui-button variant="primary" size="sm">Open</ui-button>
              </div>
            </div>

            <div class="demo-card danger">
              <div class="demo-card-header">Danger Card</div>
              <div class="demo-card-body">Destructive action confirmation pattern.</div>
              <div class="demo-card-footer">
                <ui-button variant="ghost" size="sm">Cancel</ui-button>
                <ui-button variant="danger" size="sm">Delete</ui-button>
              </div>
            </div>

          </div>

          <div class="code-block"><pre>${this.#esc(`<ui-card>
  <span slot="header">Card Title</span>
  <span slot="body">Card content goes here.</span>
  <span slot="footer">
    <ui-button variant="primary" size="sm">Action</ui-button>
  </span>
</ui-card>`)}</pre></div>
        </div>
      </section>
    `;
  }

  #renderFeedback() {
    return `
      <section class="section">
        <h2 class="section-title">Feedback <span class="tag">ui-badge · ui-alert · ui-spinner</span></h2>

        <!-- Badges -->
        <div class="group">
          <h3 class="group-title">Badges</h3>
          <div class="row">
            <span class="badge success">Success</span>
            <span class="badge warning">Warning</span>
            <span class="badge danger">Error</span>
            <span class="badge info">Info</span>
            <span class="badge neutral">Neutral</span>
          </div>
          <div class="code-block"><pre>${this.#esc(`<ui-badge variant="success">Success</ui-badge>
<ui-badge variant="warning">Warning</ui-badge>
<ui-badge variant="danger">Error</ui-badge>`)}</pre></div>
        </div>

        <!-- Alerts -->
        <div class="group">
          <h3 class="group-title">Alerts</h3>
          <div class="alerts-stack">
            <div class="alert success">✅ <strong>Success</strong> — Task was saved successfully.</div>
            <div class="alert warning">⚠️ <strong>Warning</strong> — This action cannot be undone.</div>
            <div class="alert danger">🚨 <strong>Error</strong> — Something went wrong. Please retry.</div>
            <div class="alert info">ℹ️ <strong>Info</strong> — Your session expires in 15 minutes.</div>
          </div>
          <div class="code-block"><pre>${this.#esc(`<ui-alert variant="success">Task saved successfully.</ui-alert>
<ui-alert variant="warning">This cannot be undone.</ui-alert>
<ui-alert variant="danger">Something went wrong.</ui-alert>`)}</pre></div>
        </div>

        <!-- Spinner / Loading States -->
        <div class="group">
          <h3 class="group-title">Spinner & Loading States</h3>
          <div class="row align-center">
            <div class="spinner sm"></div>
            <div class="spinner md"></div>
            <div class="spinner lg"></div>
          </div>
          <div class="code-block"><pre>${this.#esc(`<ui-spinner size="sm"></ui-spinner>
<ui-spinner size="md"></ui-spinner>
<ui-spinner size="lg"></ui-spinner>`)}</pre></div>
        </div>
      </section>
    `;
  }

  #renderLayout() {
    return `
      <section class="section">
        <h2 class="section-title">Layout <span class="tag">Patterns & Base Class API</span></h2>

        <!-- Component Lifecycle -->
        <div class="group">
          <h3 class="group-title">Component Lifecycle</h3>
          <div class="lifecycle-diagram">
            <div class="lc-step">
              <div class="lc-dot connected"></div>
              <div class="lc-label"><code>connectedCallback</code></div>
              <div class="lc-desc">Element added to DOM</div>
            </div>
            <div class="lc-arrow">↓</div>
            <div class="lc-step">
              <div class="lc-dot mount"></div>
              <div class="lc-label"><code>onMount()</code></div>
              <div class="lc-desc">Call <code>initState()</code> here</div>
            </div>
            <div class="lc-arrow">↓</div>
            <div class="lc-step">
              <div class="lc-dot render"></div>
              <div class="lc-label"><code>render()</code></div>
              <div class="lc-desc">Calls <code>template()</code> + <code>styles()</code></div>
            </div>
            <div class="lc-arrow">↓</div>
            <div class="lc-step">
              <div class="lc-dot after"></div>
              <div class="lc-label"><code>afterRender()</code></div>
              <div class="lc-desc">DOM is ready, access shadowRoot</div>
            </div>
            <div class="lc-arrow">↓</div>
            <div class="lc-step">
              <div class="lc-dot destroy"></div>
              <div class="lc-label"><code>onDestroy()</code></div>
              <div class="lc-desc">Cleanup, element removed from DOM</div>
            </div>
          </div>
        </div>

        <!-- Base Class API -->
        ${this.#renderApiTable('Component (Base)', [
          ['initState(obj)',            'Method', 'Sets initial state. Call in onMount()',           '—'],
          ['setState(partial)',         'Method', 'Merges partial state, batches render',            '—'],
          ['state',                     'Getter', 'Returns frozen copy of current state',            '—'],
          ['emit(event, detail)',       'Method', 'Dispatches bubbling CustomEvent',                 '—'],
          ['on(target, event, fn)',     'Method', 'Managed listener, auto-cleanup on disconnect',    '—'],
          ['render()',                  'Method', 'Re-renders template() into shadowRoot',           '—'],
          ['template()',                'Override','Return HTML string',                             '"'],
          ['styles()',                  'Override','Return CSS string',                              '"'],
          ['afterRender()',             'Override','Called after every render',                      '—'],
          ['onMount()',                 'Override','Called once on connect',                         '—'],
          ['onDestroy()',               'Override','Called on disconnect',                           '—'],
          ['routeParams',               'Property','Injected by router: { id, … }',                 'undefined'],
          ['store-key="x"',            'Attribute','Re-renders on store:x window event',            '—'],
          ['data-action="click:save"', 'Attribute','Auto-binds event to method',                    '—'],
        ])}

        <!-- Page Pattern -->
        <div class="group">
          <h3 class="group-title">Page Pattern</h3>
          <div class="code-block"><pre>${this.#esc(`import { Component } from '/src/nulldeps.js';

class MyPage extends Component {

  async onMount() {
    this.initState({ loading: true, data: null });
    const data = await MyService.getAll();
    this.setState({ loading: false, data });
  }

  handleAction(e) {
    // called via data-action="click:handleAction"
  }

  template() {
    const { loading, data } = this.state;
    if (loading) return '<p>Loading…</p>';
    return '<div>...</div>';
  }

  styles() {
    return ':host { display: block; }';
  }
}

customElements.define('my-page', MyPage);`)}</pre></div>
        </div>

      </section>
    `;
  }

  // ---- Helpers ----

  /**
   * Renders a standardized API reference table
   */
  #renderApiTable(name, rows) {
    return `
      <div class="group">
        <h3 class="group-title">API Reference <span class="tag">${name}</span></h3>
        <div class="table-wrap">
          <table class="api-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Description</th>
                <th>Default</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(([name, type, desc, def]) => `
                <tr>
                  <td><code>${name}</code></td>
                  <td><span class="type-badge">${type}</span></td>
                  <td>${desc}</td>
                  <td><code>${def}</code></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /**
   * Escapes HTML entities for display inside <pre> code blocks
   */
  #esc(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  styles() {
    return `
      :host { display: block; }

      /* ---- Page Shell ---- */
      .page {
        padding: 2rem 0;
        max-width: 900px;
        margin: 0 auto;
      }

      .page-header {
        margin-bottom: 2.5rem;
      }

      .page-title {
        font-size: 2rem;
        font-weight: 800;
        color: #fff;
        margin: 0 0 0.25rem;
      }

      .page-subtitle {
        color: #555;
        font-size: 0.9rem;
        margin: 0;
      }

      /* ---- Section Nav ---- */
      .section-nav {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-bottom: 2rem;
        border-bottom: 1px solid #1e1e1e;
        padding-bottom: 1rem;
      }

      .nav-btn {
        background: transparent;
        border: 1px solid #2a2a2a;
        color: #888;
        padding: 0.4rem 1rem;
        border-radius: 99px;
        cursor: pointer;
        font-size: 0.85rem;
        transition: all 0.15s;
      }

      .nav-btn:hover {
        border-color: #6ee7b7;
        color: #6ee7b7;
      }

      .nav-btn.active {
        background: #064e3b;
        border-color: #6ee7b7;
        color: #6ee7b7;
        font-weight: 600;
      }

      /* ---- Section ---- */
      .section {
        display: flex;
        flex-direction: column;
        gap: 2.5rem;
      }

      .section-title {
        font-size: 1.4rem;
        font-weight: 700;
        color: #fff;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid #1e1e1e;
      }

      /* ---- Groups ---- */
      .group {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .group-title {
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #555;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      /* ---- Row / Layout Helpers ---- */
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: flex-start;
      }

      .row.align-center { align-items: center; }

      .row.col {
        flex-direction: column;
        max-width: 420px;
      }

      .row.wrap { flex-wrap: wrap; }

      /* ---- Tag ---- */
      .tag {
        font-size: 0.72rem;
        font-weight: 500;
        background: #0f2820;
        color: #6ee7b7;
        padding: 0.15rem 0.5rem;
        border-radius: 4px;
        font-family: monospace;
        border: 1px solid #1a4035;
      }

      /* ---- Code Block ---- */
      .code-block {
        background: #0d0d0d;
        border: 1px solid #1e1e1e;
        border-radius: 10px;
        overflow: auto;
      }

      .code-block pre {
        margin: 0;
        padding: 1rem 1.25rem;
        font-family: 'Fira Code', 'Cascadia Code', monospace;
        font-size: 0.8rem;
        line-height: 1.7;
        color: #6ee7b7;
        white-space: pre;
      }

      /* ---- Demo Cards ---- */
      .demo-card {
        background: #111;
        border: 1px solid #2a2a2a;
        border-radius: 12px;
        padding: 1.25rem;
        flex: 1;
        min-width: 220px;
        max-width: 280px;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .demo-card.highlighted { border-color: #6ee7b7; background: #071f18; }
      .demo-card.danger      { border-color: #ef4444; background: #1f0707; }

      .demo-card-header {
        font-weight: 700;
        font-size: 0.95rem;
        color: #fff;
      }

      .demo-card-body {
        font-size: 0.85rem;
        color: #666;
        line-height: 1.5;
      }

      .demo-card-footer {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
        margin-top: auto;
        padding-top: 0.5rem;
        border-top: 1px solid #1e1e1e;
      }

      /* ---- Badges ---- */
      .badge {
        padding: 0.25rem 0.75rem;
        border-radius: 99px;
        font-size: 0.78rem;
        font-weight: 600;
      }

      .badge.success { background: #064e3b; color: #6ee7b7; }
      .badge.warning { background: #451a03; color: #fbbf24; }
      .badge.danger  { background: #450a0a; color: #f87171; }
      .badge.info    { background: #0c1a45; color: #60a5fa; }
      .badge.neutral { background: #1a1a1a; color: #888; }

      /* ---- Alerts ---- */
      .alerts-stack {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }

      .alert {
        padding: 0.75rem 1rem;
        border-radius: 8px;
        font-size: 0.88rem;
        line-height: 1.5;
      }

      .alert.success { background: #071f18; border: 1px solid #064e3b; color: #6ee7b7; }
      .alert.warning { background: #1c0f02; border: 1px solid #78350f; color: #fbbf24; }
      .alert.danger  { background: #1f0707; border: 1px solid #7f1d1d; color: #f87171; }
      .alert.info    { background: #030f2a; border: 1px solid #1e3a8a; color: #60a5fa; }

      /* ---- Spinners ---- */
      .spinner {
        border-radius: 50%;
        border: 2px solid #1e1e1e;
        border-top-color: #6ee7b7;
        animation: spin 0.7s linear infinite;
      }

      .spinner.sm { width: 16px; height: 16px; }
      .spinner.md { width: 28px; height: 28px; border-width: 3px; }
      .spinner.lg { width: 44px; height: 44px; border-width: 4px; }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      /* ---- API Table ---- */
      .table-wrap {
        overflow-x: auto;
        border-radius: 10px;
        border: 1px solid #1e1e1e;
      }

      .api-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.82rem;
      }

      .api-table thead {
        background: #0d0d0d;
      }

      .api-table th {
        padding: 0.6rem 1rem;
        text-align: left;
        color: #555;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 0.72rem;
        border-bottom: 1px solid #1e1e1e;
      }

      .api-table td {
        padding: 0.6rem 1rem;
        color: #ccc;
        border-bottom: 1px solid #141414;
        vertical-align: top;
      }

      .api-table tbody tr:last-child td { border-bottom: none; }
      .api-table tbody tr:hover td { background: #0f0f0f; }

      .api-table code {
        font-family: monospace;
        color: #6ee7b7;
        font-size: 0.82rem;
      }

      .type-badge {
        background: #0f2820;
        color: #6ee7b7;
        border: 1px solid #1a4035;
        padding: 0.1rem 0.4rem;
        border-radius: 4px;
        font-size: 0.72rem;
        white-space: nowrap;
      }

      /* ---- Lifecycle Diagram ---- */
      .lifecycle-diagram {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0;
        padding-left: 1rem;
      }

      .lc-step {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.6rem 0;
      }

      .lc-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .lc-dot.connected { background: #3b82f6; }
      .lc-dot.mount     { background: #6ee7b7; }
      .lc-dot.render    { background: #a78bfa; }
      .lc-dot.after     { background: #fbbf24; }
      .lc-dot.destroy   { background: #f87171; }

      .lc-label {
        font-size: 0.88rem;
        color: #fff;
        min-width: 160px;
      }

      .lc-label code {
        font-family: monospace;
        color: inherit;
      }

      .lc-desc {
        font-size: 0.8rem;
        color: #555;
      }

      .lc-arrow {
        color: #2a2a2a;
        font-size: 1.2rem;
        padding-left: 0.25rem;
      }
    `;
  }
}

customElements.define('components-page', ComponentsOverviewPage);
