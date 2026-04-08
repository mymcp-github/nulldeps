/**
 * NullDeps - Router
 * History API based client-side routing
 * Maps URL patterns to custom element names
 *
 * Features:
 * - Race condition prevention via navigation ID
 * - Lazy loading of component modules
 * - Scroll restoration
 * - Navigation guards (beforeEach)
 * - Route lifecycle hooks (onEnter, onLeave)
 * - Named routes for programmatic navigation
 * - Dynamic route params: :param and [param] syntax
 */
export class Router {
  #routes = [];
  #outlet = null;
  #notFound = 'not-found-page';
  #currentNavId = 0;
  #currentRoute = null;
  #currentElement = null;
  #guards = [];
  #scrollPositions = new Map();
  #base = '';

  /**
   * @param {string} outletSelector - DOM selector for the render outlet
   * @param {string} base - Optional base path e.g. '/app' for sub-directory deployments
   */
  constructor(outletSelector, base = '') {
    this.#outlet = document.querySelector(outletSelector);
    // Normalize base: no trailing slash
    this.#base = base.replace(/\/$/, '');

    if (!this.#outlet) {
      console.warn(`[NullDeps Router] Outlet "${outletSelector}" not found`);
    }
  }

  // ---- Public API ----

  /**
   * Register a route
   * Supports :param and [param] syntax for dynamic segments
   * @param {string} pattern - URL pattern e.g. '/tasks/:id' or '/tasks/[id]'
   * @param {string} elementTag - Custom element tag name
   * @param {object} options - { name, lazy, onEnter, onLeave }
   */
  add(pattern, elementTag, options = {}) {
    this.#routes.push({
      pattern,
      elementTag,
      regex: this.#toRegex(pattern),
      name: options.name ?? null,
      lazy: options.lazy ?? null,
      onEnter: options.onEnter ?? null,
      onLeave: options.onLeave ?? null
    });
    return this;
  }

  /** Custom element tag for unmatched routes */
  notFound(elementTag) {
    this.#notFound = elementTag;
    return this;
  }

  /**
   * Register a global navigation guard
   * Guard fn receives (from, to) and must return:
   * - true          → allow navigation
   * - false         → block navigation
   * - '/other/path' → redirect
   */
  beforeEach(guardFn) {
    this.#guards.push(guardFn);
    return this;
  }

  start() {
    window.addEventListener('popstate', () => this.#resolve());

    // Resolve immediately - DOMContentLoaded already fired if script is module
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.#resolve());
    } else {
      queueMicrotask(() => this.#resolve());
    }

    // Intercept all internal <a> clicks for client-side navigation
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a) return;

      const href = a.getAttribute('href');

      // Only handle absolute internal paths, ignore external and mailto etc.
      if (!href || !href.startsWith('/')) return;

      e.preventDefault();
      this.navigate(href.replace(new RegExp(`^${this.#base}`), '') || '/');
    });

    return this;
  }

  /**
   * Navigate programmatically by path
   * @param {string} path - e.g. '/tasks' or '/tasks/123'
   */
  navigate(path) {
    const fullPath = this.#base + path;

    // No-op if already on this path
    if (window.location.pathname === fullPath) return;

    history.pushState(null, '', fullPath);
    this.#resolve();
  }

  /** Navigate programmatically by route name */
  navigateTo(name, params = {}) {
    const route = this.#routes.find(r => r.name === name);

    if (!route) {
      console.warn(`[NullDeps Router] No route found with name "${name}"`);
      return;
    }

    // Replace both :param and [param] placeholders with actual values
    const path = route.pattern.replace(/(?::|\[)([^\s/\]]+)\]?/g, (_, key) => {
      if (!(key in params)) {
        console.warn(`[NullDeps Router] Missing param "${key}" for route "${name}"`);
        return `:${key}`;
      }
      return encodeURIComponent(params[key]);
    });

    this.navigate(path);
  }

  /** Replace current history entry without adding a new one */
  replace(path) {
    history.replaceState(null, '', this.#base + path);
    this.#resolve();
  }

  /** Returns the currently active route info */
  get current() {
    return this.#currentRoute ? { ...this.#currentRoute } : null;
  }

  // ---- Private ----

  async #resolve() {
    const navId = ++this.#currentNavId;

    // Strip base prefix to get the clean app path
    const rawPath = window.location.pathname;
    const path = this.#base
      ? rawPath.replace(new RegExp(`^${this.#base}`), '') || '/'
      : rawPath || '/';

    // Routes are matched in registration order - register static before dynamic
    const matched = this.#routes.find(r => r.regex.test(path));
    const params = matched ? this.#extractParams(matched.pattern, path) : {};

    // Expose query string as searchParams object
    const searchParams = Object.fromEntries(new URLSearchParams(window.location.search));

    const to = matched
      ? { path, pattern: matched.pattern, params, searchParams, elementTag: matched.elementTag, name: matched.name }
      : { path, pattern: null, params: {}, searchParams, elementTag: this.#notFound, name: null };

    const from = this.#currentRoute;

    // ---- Run navigation guards ----
    const guardResult = await this.#runGuards(from, to);

    if (navId !== this.#currentNavId) return;

    if (guardResult === false) {
      // Restore previous URL without triggering another popstate
      if (from) history.replaceState(null, '', this.#base + from.path);
      return;
    }

    if (typeof guardResult === 'string') {
      this.navigate(guardResult);
      return;
    }

    // ---- Lazy load module if needed ----
    if (matched?.lazy) {
      try {
        await matched.lazy();
      } catch (err) {
        console.error(`[NullDeps Router] Failed to lazy load "${matched.elementTag}"`, err);
        if (navId !== this.#currentNavId) return;
        this.#renderNotFound();
        return;
      }

      if (navId !== this.#currentNavId) return;
    }

    if (!this.#outlet) return;

    // ---- Save scroll position of outgoing page ----
    if (from) {
      this.#scrollPositions.set(from.path, window.scrollY);
    }

    // ---- Call onLeave hook on current element ----
    if (this.#currentElement?.onLeave) {
      this.#currentElement.onLeave(to);
    }

    // ---- Render new route ----
    this.#currentRoute = to;

    if (matched) {
      const el = document.createElement(matched.elementTag);

      // Attach route data BEFORE DOM insertion so connectedCallback can read it
      el.routeParams = params;
      el.searchParams = searchParams;

      this.#outlet.innerHTML = '';
      this.#outlet.appendChild(el);
      this.#currentElement = el;

      matched.onEnter?.(to, from);

      // Microtask ensures connectedCallback has run before onRouteEnter fires
      queueMicrotask(() => {
        if (navId !== this.#currentNavId) return;
        el.onRouteEnter?.(to, from);
      });
    } else {
      this.#renderNotFound();
    }

    // ---- Restore or reset scroll position ----
    const savedScroll = this.#scrollPositions.get(path);
    window.scrollTo(0, savedScroll ?? 0);
  }

  async #runGuards(from, to) {
    for (const guard of this.#guards) {
      try {
        const result = await guard(from, to);
        if (result !== true && result !== undefined) return result;
      } catch (err) {
        console.error('[NullDeps Router] Guard threw an error', err);
        return false;
      }
    }
    return true;
  }

  #renderNotFound() {
    this.#outlet.innerHTML = `<${this.#notFound}></${this.#notFound}>`;
    this.#currentElement = this.#outlet.firstElementChild;
  }

  /**
   * Convert route pattern to regex
   * Supports both :param and [param] syntax
   * Static segments match exactly - register them before dynamic routes
   */
  #toRegex(pattern) {
    const escaped = pattern
      .replace(/\//g, '\\/')                        // Escape slashes
      .replace(/\[(\w+)\]/g, '(?<$1>[^/]+)')        // [param] → named capture group
      .replace(/:([^\s/]+)/g, '(?<$1>[^/]+)');      // :param  → named capture group
    return new RegExp(`^${escaped}$`);
  }

  /**
   * Extract named params from matched URL
   * Works with both :param and [param] patterns
   */
  #extractParams(pattern, path) {
    // Collect all param names from both syntaxes
    const keys = [
      ...[...pattern.matchAll(/\[(\w+)\]/g)].map(m => m[1]),
      ...[...pattern.matchAll(/:([^\s/]+)/g)].map(m => m[1])
    ];

    // Named groups from regex give us the values in order
    const groups = this.#toRegex(pattern).exec(path)?.groups ?? {};

    return Object.fromEntries(
      keys.map(k => [k, groups[k] ? decodeURIComponent(groups[k]) : undefined])
    );
  }
}
