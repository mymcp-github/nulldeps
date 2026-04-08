/**
 * NullDeps - Router
 * Hash-based client-side routing (GitHub Pages compatible)
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

  // Note: base is no longer needed - hash routing is always root-relative
  constructor(outletSelector) {
    this.#outlet = document.querySelector(outletSelector);

    if (!this.#outlet) {
      console.warn(`[NullDeps Router] Outlet "${outletSelector}" not found`);
    }
  }

  // ---- Public API ----

  /**
   * Register a route
   * Supports :param and [param] syntax for dynamic segments
   * @param {string} pattern - URL pattern e.g. '/tasks/:id'
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
    // Hash changes trigger hashchange event - no server needed
    window.addEventListener('hashchange', () => this.#resolve());

    // Resolve immediately on load
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

      // Handle both hash links (#/path) and plain paths (/path)
      if (!href) return;

      if (href.startsWith('#/')) {
        // Already a hash link - let browser handle it naturally
        // hashchange event will fire automatically
        return;
      }

      if (href.startsWith('/')) {
        // Convert plain path links to hash navigation
        e.preventDefault();
        this.navigate(href);
      }
    });

    return this;
  }

  /**
   * Navigate programmatically by path
   * @param {string} path - e.g. '/tasks' or '/tasks/123'
   */
  navigate(path) {
    const hash = '#' + path;

    // No-op if already on this hash
    if (window.location.hash === hash) return;

    // Setting location.hash triggers hashchange automatically
    window.location.hash = path;
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
    // replaceState on the hash keeps back-button behavior clean
    history.replaceState(null, '', '#' + path);
    this.#resolve();
  }

  /** Returns the currently active route info */
  get current() {
    return this.#currentRoute ? { ...this.#currentRoute } : null;
  }

  // ---- Private ----

  async #resolve() {
    const navId = ++this.#currentNavId;

    // Extract path from hash - default to '/' if no hash present
    const hash = window.location.hash;
    const path = hash.startsWith('#/') ? hash.slice(1) : '/';

    // Split path and search string (hash doesn't have native searchParams)
    const [cleanPath, queryString] = path.split('?');

    const matched = this.#routes.find(r => r.regex.test(cleanPath));
    const params = matched ? this.#extractParams(matched.pattern, cleanPath) : {};

    // Parse query string manually since URLSearchParams works on strings
    const searchParams = Object.fromEntries(new URLSearchParams(queryString ?? ''));

    const to = matched
      ? { path: cleanPath, pattern: matched.pattern, params, searchParams, elementTag: matched.elementTag, name: matched.name }
      : { path: cleanPath, pattern: null, params: {}, searchParams, elementTag: this.#notFound, name: null };

    const from = this.#currentRoute;

    // ---- Run navigation guards ----
    const guardResult = await this.#runGuards(from, to);

    if (navId !== this.#currentNavId) return;

    if (guardResult === false) {
      // Restore previous hash without triggering another hashchange
      if (from) history.replaceState(null, '', '#' + from.path);
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
    const savedScroll = this.#scrollPositions.get(cleanPath);
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
   */
  #toRegex(pattern) {
    const escaped = pattern
      .replace(/\//g, '\\/')
      .replace(/\[(\w+)\]/g, '(?<$1>[^/]+)')
      .replace(/:([^\s/]+)/g, '(?<$1>[^/]+)');
    return new RegExp(`^${escaped}$`);
  }

  /**
   * Extract named params from matched URL
   */
  #extractParams(pattern, path) {
    const keys = [
      ...[...pattern.matchAll(/\[(\w+)\]/g)].map(m => m[1]),
      ...[...pattern.matchAll(/:([^\s/]+)/g)].map(m => m[1])
    ];

    const groups = this.#toRegex(pattern).exec(path)?.groups ?? {};

    return Object.fromEntries(
      keys.map(k => [k, groups[k] ? decodeURIComponent(groups[k]) : undefined])
    );
  }
}
