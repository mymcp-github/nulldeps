/**
 * ui-layout.js
 * App shell wrapper with sidebar navigation and slot-based content.
 * Uses hash-based routing (#/path) - no server roundtrip needed.
 */
import { Component } from '/src/nulldeps.js';
import { escHtml, escAttr, cls } from '/src/utility.js';
import { cssVars, color, shadow } from '/src/theme.js';

// Allowed routes - whitelist against open redirect / route injection
const NAV_ITEMS = [
  { href: '#/',           icon: '⊞', label: 'Home'       },
  { href: '#/counter',    icon: '◎', label: 'Counter'    },
  { href: '#/tasks',      icon: '✓', label: 'Tasks'      },
  { href: '#/components', icon: '▤', label: 'Components' },
];

// Derived Set for O(1) whitelist lookups
const ALLOWED_ROUTES = new Set(NAV_ITEMS.map(n => n.href));

// Extract path segment from hash - e.g. '#/tasks' → '/tasks'
function _hashToPath(hash) {
  return hash.startsWith('#') ? hash.slice(1) : hash;
}

// Derive active route from current location hash
function _currentRoute() {
  return window.location.hash || '#/';
}

class UiLayout extends Component {

  // ---- Lifecycle ----

  onMount() {
    this.initState({
      activeRoute: _currentRoute(),
    });

    // Track browser back/forward navigation
    this._onHashChange = () => {
      this.setState({ activeRoute: _currentRoute() });
    };

    window.addEventListener('hashchange', this._onHashChange);
  }

  onDestroy() {
    window.removeEventListener('hashchange', this._onHashChange);
  }

  // ---- Actions ----

  navigate(e) {
    const link = e.target.closest('[data-href]');
    if (!link) return;

    const href = link.dataset.href;

    // Hard whitelist - reject anything not in NAV_ITEMS
    if (!ALLOWED_ROUTES.has(href)) {
      console.warn(`[UiLayout] Blocked navigation to unknown route: "${href}"`);
      return;
    }

    window.location.hash = href;

    // hashchange listener above handles setState -
    // explicit call here for instant feedback (no async gap)
    this.setState({ activeRoute: href });

    this.emit('ui-layout:navigate', { path: _hashToPath(href) });
  }

  // Keyboard: Enter/Space on nav-link
  handleNavKeydown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.navigate(e);
    }
  }

  // ---- Template ----

  template() {
    const { activeRoute } = this.state;

    const navLinks = NAV_ITEMS.map(({ href, icon, label }) => {
      const isActive = activeRoute === href;

      // Static strings from NAV_ITEMS - escHtml as defense in depth
      const safeIcon  = escHtml(icon);
      const safeLabel = escHtml(label);
      const safeHref  = escAttr(href);

      const linkClass = cls('nav-link', isActive && 'is-active');

      return `
        <li>
          <div
            class="${linkClass}"
            data-href="${safeHref}"
            data-action="click:navigate keydown:handleNavKeydown"
            role="link"
            tabindex="0"
            aria-current="${isActive ? 'page' : 'false'}"
          >
            <span class="nav-icon" aria-hidden="true">${safeIcon}</span>
            <span class="nav-label">${safeLabel}</span>
          </div>
        </li>
      `;
    }).join('');

    return `
      <div class="layout">

        <aside class="sidebar" aria-label="Main navigation">
          <div class="brand" aria-label="NullDeps">
            <span class="brand-logo" aria-hidden="true">◈</span>
            <span class="brand-name">NullDeps</span>
          </div>

          <nav aria-label="Site sections">
            <ul class="nav-list" role="list">
              ${navLinks}
            </ul>
          </nav>

          <div class="sidebar-footer" aria-hidden="true">
            <span>v1.0.0</span>
          </div>
        </aside>

        <main class="content" id="main-content" tabindex="-1">
          <slot></slot>
        </main>

      </div>
    `;
  }

  // ---- Styles ----

  styles() {
    return `
      :host {
        ${cssVars()}
        display: block;
        min-height: 100vh;
        font-family: inherit;
      }

      :host([hidden]) { display: none; }

      *, *::before, *::after { box-sizing: border-box; }

      /* ---- Layout grid ---- */
      .layout {
        display: grid;
        grid-template-columns: 220px 1fr;
        min-height: 100vh;
        background: var(--color-bg-deep);
      }

      /* ---- Sidebar ---- */
      .sidebar {
        display: flex;
        flex-direction: column;
        background: var(--color-bg);
        border-right: 1px solid var(--color-border);
        padding: var(--spacing-2xl) 0;
        position: sticky;
        top: 0;
        height: 100vh;
        overflow-y: auto;
      }

      /* ---- Brand ---- */
      .brand {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: 0 var(--spacing-xl) var(--spacing-2xl);
        border-bottom: 1px solid var(--color-border);
        margin-bottom: var(--spacing-lg);
        flex-shrink: 0;
      }

      .brand-logo {
        font-size: 1.4rem;
        color: var(--color-brand);
      }

      .brand-name {
        font-size: var(--font-size-base);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        letter-spacing: 0.03em;
      }

      /* ---- Nav ---- */
      nav { flex: 1; }

      .nav-list {
        list-style: none;
        margin: 0;
        padding: 0 var(--spacing-md);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .nav-link {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-sm) var(--spacing-lg);
        border-radius: var(--radius-md);
        color: var(--color-text-muted);
        cursor: pointer;
        font-size: var(--font-size-md);
        transition:
          background var(--transition-base),
          color      var(--transition-base);
        user-select: none;
      }

      .nav-link:hover {
        background: var(--color-bg-hover);
        color: var(--color-text-secondary);
      }

      .nav-link:focus-visible {
        outline: 2px solid var(--color-brand);
        outline-offset: 2px;
      }

      .nav-link.is-active {
        background: var(--color-brand-subtle);
        color: var(--color-brand);
      }

      .nav-icon {
        font-size: var(--font-size-base);
        width: 1.25rem;
        text-align: center;
        flex-shrink: 0;
      }

      /* ---- Content ---- */
      .content {
        padding: var(--spacing-3xl) var(--spacing-4xl);
        overflow-y: auto;
        color: var(--color-text-secondary);
        /* Focus target for skip-to-main / post-navigate focus management */
        outline: none;
      }

      /* ---- Footer ---- */
      .sidebar-footer {
        padding: var(--spacing-lg) var(--spacing-2xl) 0;
        border-top: 1px solid var(--color-border);
        font-size: var(--font-size-xs);
        color: var(--color-text-disabled);
        text-align: center;
        flex-shrink: 0;
      }

      /* ---- Mobile ---- */
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
          padding: var(--spacing-md) var(--spacing-lg);
          border-right: none;
          border-bottom: 1px solid var(--color-border);
          overflow-y: visible;
        }

        .brand {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
          flex-shrink: 0;
        }

        .sidebar-footer { display: none; }

        nav { flex: 1; }

        .nav-list {
          flex-direction: row;
          justify-content: flex-end;
          gap: var(--spacing-xs);
          padding: 0 var(--spacing-xs);
        }

        .nav-label { display: none; }

        .content { padding: var(--spacing-2xl) var(--spacing-lg); }
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .nav-link { transition: none; }
      }
    `;
  }
}

customElements.define('ui-layout', UiLayout);
