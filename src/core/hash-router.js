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

// Valid custom element names: must contain a hyphen, only lowercase + digits + hyphen
const VALID_ELEMENT_TAG = /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/;

// Valid route paths: alphanumeric, slash, colon, brackets, dash, underscore, dot
const VALID_PATH = /^[a-zA-Z0-9/:.\-_[\]]*$/;

/**
 * Validates a custom element tag name
 * @param {string} tag
 */
function assertValidTag(tag) {
  if (typeof tag !== 'string' || !VALID_ELEMENT_TAG.test(tag)) {
    throw new TypeError(`[NullDeps Router] Invalid element tag: "${tag}"`);
  }
}

/**
 * Validates a route path to prevent injection
 * @param {string} path
 */
function assertValidPath(path) {
  if (typeof path !== 'string' || !VALID_PATH.test(path)) {
    throw new TypeError(`[NullDeps Router] Invalid path: "${path}"`);
  }
}

/**
 * Safe param encoding - prevents prototype pollution
 * @param {object} params
 * @returns {object}
 */
function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([key]) => key !== '__proto__' && key !== 'constructor' && key !== 'prototype')
      .map(([key, value]) => [key, String(value)])
  );
}

export class Router {
  #routes = [];
  #outlet = null;
  #notFound = 'not-found-page';
  #currentNavId = 0;
  #currentRoute = null;
  #currentElement = null;
  #guards = [];
  #scrollPositions = new Map();

  constructor(outletSelector) {
    if (typeof outletSelector !== 'string' || !outletSelector.trim()) {
      throw new TypeError('[NullDeps Router] outletSelector must be a non-empty string');
    }

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
    assertValidPath(pattern);
    assertValidTag(elementTag);

    if (options.name !== undefined && typeof options.name !== 'string') {
      throw new TypeError('[NullDeps Router] Route name must be a string');
    }

    if (options.lazy !== undefined && typeof options.lazy !== 'function') {
      throw new TypeError('[NullDeps Router] lazy must be a function returning a Promise');
    }

    this.#routes.push({
      pattern,
      elementTag,
      regex: this.#toRegex(pattern),
      name: options.name ?? null,
      lazy: options.lazy ?? null,
      onEnter: typeof options.onEnter === 'function' ? options.onEnter : null,
      onLeave: typeof options.onLeave === 'function' ? options.onLeave : null
    });

    return this;
  }

  /** Custom element tag for unmatched routes */
  notFound(elementTag) {
    assertValidTag(elementTag);
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
    if (typeof guardFn !== 'function') {
      throw new TypeError('[NullDeps Router] Guard must be a function');
    }
    this.#guards.push(guardFn);
    return this;
  }

  start() {
    window.addEventListener('hashchange', () => this.#resolve());

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
      if (!href) return;

      // Already a hash link - hashchange fires automatically
      if (href.startsWith('#/')) return;

      if (href.startsWith('/')) {
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
    assertValidPath(path);

    const hash = '#' + path;
    if (window.location.hash === hash) return;

    window.location.hash = path;
  }

  /** Navigate programmatically by route name */
  navigateTo(name, params = {}) {
    if (typeof name !== 'string') {
      throw new TypeError('[NullDeps Router] Route name must be a string');
    }

    const route = this.#routes.find(r => r.name === name);

    if (!route) {
      console.warn(`[NullDeps Router] No route found with name "${name}"`);
      return;
    }

    // Sanitize params before use - prevents prototype pollution
    const safeParams = sanitizeParams(params);

    // Replace both :param and [param] placeholders with actual values
    const path = route.pattern.replace(/(?::|\[)([^\s/\]]+)\]?/g, (_, key) => {
      if (!(key in safeParams)) {
        console.warn(`[NullDeps Router] Missing param "${key}" for route "${name}"`);
        return `:${key}`;
      }
      return encodeURIComponent(safeParams[key]);
    });

    this.navigate(path);
  }

  /** Replace current history entry without adding a new one */
  replace(path) {
    assertValidPath(path);
    history.replaceState(null, '', '#' + path);
    this.#resolve();
  }

  /** Returns the currently active route info - frozen to prevent external mutation */
  get current() {
    return this.#currentRoute ? Object.freeze({ ...this.#currentRoute }) : null;
  }

  // ---- Private ----

  async #resolve() {
    const navId = ++this.#currentNavId;

    const hash = window.location.hash;
    const path = hash.startsWith('#/') ? hash.slice(1) : '/';

    const [cleanPath, queryString] = path.split('?');

    const matched = this.#routes.find(r => r.regex.test(cleanPath));
    const params = matched ? this.#extractParams(matched.pattern, cleanPath) : {};
    const searchParams = Object.fromEntries(new URLSearchParams(queryString ?? ''));

    const to = matched
      ? {
          path: cleanPath,
          pattern: matched.pattern,
          params: Object.freeze(params),
          searchParams: Object.freeze(searchParams),
          elementTag: matched.elementTag,
          name: matched.name
        }
      : {
          path: cleanPath,
          pattern: null,
          params: Object.freeze({}),
          searchParams: Object.freeze(searchParams),
          elementTag: this.#notFound,
          name: null
        };

    const from = this.#currentRoute;

    // ---- Run navigation guards ----
    const guardResult = await this.#runGuards(from, to);

    if (navId !== this.#currentNavId) return;

    if (guardResult === false) {
      if (from) history.replaceState(null, '', '#' + from.path);
      return;
    }

    if (typeof guardResult === 'string') {
      // Validate redirect target from guard before navigating
      try {
        assertValidPath(guardResult);
        this.navigate(guardResult);
      } catch {
        console.error(`[NullDeps Router] Guard returned invalid redirect path: "${guardResult}"`);
      }
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

      // Attach frozen route data BEFORE DOM insertion so connectedCallback can read it
      Object.defineProperties(el, {
        routeParams: {
          value: Object.freeze(params),
          writable: false,
          configurable: false
        },
        searchParams: {
          value: Object.freeze(searchParams),
          writable: false,
          configurable: false
        }
      });

      this.#outlet.replaceChildren(el);
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
        console.error('[NullDeps Router] Guard threw:', err);
        return false;
      }
    }
    return true;
  }

  /**
   * Safe DOM creation - avoids innerHTML with dynamic tag names
   */
  #renderNotFound() {
    const el = document.createElement(this.#notFound);
    this.#outlet.replaceChildren(el);
    this.#currentElement = el;
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
