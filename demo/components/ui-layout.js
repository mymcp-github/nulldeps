// ui-layout.js - App shell wrapper with sidebar navigation and slot-based content
import { Component } from '/src/nulldeps.js';

class UiLayout extends Component {

  onMount() {
    this.initState({
      // Derive active route from current path
      activeRoute: window.location.pathname,
    });

    // Listen for client-side navigation changes
    this._onPopState = () => {
      this.setState({ activeRoute: window.location.pathname });
    };
    window.addEventListener('popstate', this._onPopState);
  }

  onDestroy() {
    window.removeEventListener('popstate', this._onPopState);
  }

  // Handle nav link clicks without full page reload
  navigate(e) {
    const link = e.target.closest('[data-href]');
    if (!link) return;

    const href = link.dataset.href; // e.g. '#/counter'

    // Strip '#' for router and internal state
    const path = href.startsWith('#') ? href.slice(1) : href;

    window.location.hash = href;
    this.setState({ activeRoute: path });

    // Dispatch so the router can react
    window.dispatchEvent(new CustomEvent('navigate', { detail: { path } }));
  }

  template() {
    const { activeRoute } = this.state;

    const navItems = [
      { href: '#/',           icon: '⊞', label: 'Home'       },
      { href: '#/counter',    icon: '◎', label: 'Counter'    },
      { href: '#/tasks',      icon: '✓', label: 'Tasks'      },
      { href: '#/components', icon: '▤', label: 'Components' },
    ];

    const navLinks = navItems.map(({ href, icon, label }) => `
      <li>
        <div
          class="nav-link ${'#' + activeRoute === href ? 'is-active' : ''}"
          data-href="${href}"
          data-action="click:navigate"
          role="link"
          tabindex="0"
        >
          <span class="nav-icon">${icon}</span>
          <span class="nav-label">${label}</span>
        </div>
      </li>
    `).join('');

    return `
      <div class="layout">

        <!-- Sidebar -->
        <aside class="sidebar">
          <div class="brand">
            <span class="brand-logo">◈</span>
            <span class="brand-name">NullDeps</span>
          </div>
          <nav>
            <ul class="nav-list" data-action="click:navigate">
              ${navLinks}
            </ul>
          </nav>
          <div class="sidebar-footer">
            <span>v1.0.0</span>
          </div>
        </aside>

        <!-- Main content area -->
        <main class="content">
          <slot></slot>
        </main>

      </div>
    `;
  }

  styles() {
    return `
      :host {
        display: block;
        min-height: 100vh;
      }

      .layout {
        display: grid;
        grid-template-columns: 220px 1fr;
        min-height: 100vh;
        background: #0d0d0d;
      }

      /* ── Sidebar ── */
      .sidebar {
        display: flex;
        flex-direction: column;
        background: #111;
        border-right: 1px solid #1e1e1e;
        padding: 1.5rem 0;
        position: sticky;
        top: 0;
        height: 100vh;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        padding: 0 1.25rem 1.5rem;
        border-bottom: 1px solid #1e1e1e;
        margin-bottom: 1rem;
      }

      .brand-logo {
        font-size: 1.4rem;
        color: #6ee7b7;
      }

      .brand-name {
        font-size: 1rem;
        font-weight: 600;
        color: #fff;
        letter-spacing: 0.03em;
      }

      /* ── Nav ── */
      nav { flex: 1; }

      .nav-list {
        list-style: none;
        margin: 0;
        padding: 0 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .nav-link {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.6rem 0.875rem;
        border-radius: 8px;
        color: #888;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background 0.15s, color 0.15s;
        user-select: none;
      }

      .nav-link:hover {
        background: #1a1a1a;
        color: #ddd;
      }

      .nav-link.is-active {
        background: #1a2e24;
        color: #6ee7b7;
      }

      .nav-icon {
        font-size: 1rem;
        width: 1.25rem;
        text-align: center;
        flex-shrink: 0;
      }

      /* ── Content ── */
      .content {
        padding: 2.5rem 3rem;
        overflow-y: auto;
        color: #ccc;
      }

      /* ── Footer ── */
      .sidebar-footer {
        padding: 1rem 1.5rem 0;
        border-top: 1px solid #1e1e1e;
        font-size: 0.75rem;
        color: #444;
        text-align: center;
      }

      /* ── Responsive ── */
      @media (max-width: 640px) {
        .layout {
          grid-template-columns: 1fr;
          grid-template-rows: auto 1fr;
        }

        .sidebar {
          flex-direction: row;
          align-items: center;
          height: auto;
          position: static;
          padding: 0.75rem 1rem;
          border-right: none;
          border-bottom: 1px solid #1e1e1e;
        }

        .brand { 
          border-bottom: none; 
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .sidebar-footer { display: none; }

        nav { flex: 1; }

        .nav-list {
          flex-direction: row;
          justify-content: flex-end;
          gap: 0.25rem;
        }

        .nav-label { display: none; }

        .content { padding: 1.5rem 1rem; }
      }
    `;
  }
}

customElements.define('ui-layout', UiLayout);
