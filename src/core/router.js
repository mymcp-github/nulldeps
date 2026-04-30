/**
 * NullDeps - Router
 * History API based client-side routing
 * Maps URL patterns to custom element names
 *
 * Features:
 * - Race condition prevention via navigation ID
 * - Lazy loading of component modules
 * - Scroll restoration (capped to prevent memory leak)
 * - Navigation guards (beforeEach)
 * - Route lifecycle hooks (onEnter, onLeave)
 * - Named routes for programmatic navigation
 * - Dynamic route params: :param and [param] syntax
 */

// Valid custom element names per spec: lowercase, must contain hyphen
const VALID_ELEMENT_TAG = /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/;

// Valid route patterns: letters, digits, slash, colon, brackets, dash, underscore, dot
const VALID_PATTERN = /^[a-zA-Z0-9/:.\-_[\]]*$/;

// Valid base paths: optional leading slash, no trailing slash, no special chars
const VALID_BASE = /^(\/[a-zA-Z0-9\-_/]*)?$/;

// Max scroll position cache entries to prevent memory leak in long sessions
const MAX_SCROLL_CACHE = 100;

/**
 * Escapes a string for safe use inside a RegExp
 * Prevents RegExp-injection when base path contains special chars
 * @param {string} str
 * @returns {string}
 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
 * Validates a route pattern
 * @param {string} pattern
 */
function assertValidPattern(pattern) {
  if (typeof pattern !== 'string' || !VALID_PATTERN.test(pattern)) {
    throw new TypeError(`[NullDeps Router] Invalid route pattern: "${pattern}"`);
  }
}

/**
 * Sanitizes params object against prototype pollution
 * Only allows own enumerable string keys with string/number values
 * @param {object} params
 * @returns {object}
 */
function sanitizeParams(params) {
  const safe = Object.create(null);
  for (const key of Object.keys(params)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    const val = params[key];
    if (typeof val === 'string' || typeof val === 'number') {
      safe[key] = val;
    }
  }
  return safe;
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
  #base = '';
  #baseRegex = null;

  /**
   * @param {string} outletSelector - DOM selector for the render outlet
   * @param {string} base - Optional base path e.g. '/app' for sub-directory deployments
   */
  constructor(outletSelector, base = '') {
    if (typeof outletSelector !== 'string' || !outletSelector.trim()) {
      throw new TypeError('[NullDeps Router] outletSelector must be a non-empty string');
    }

    if (!VALID_BASE.test(base)) {
      throw new TypeError(`[NullDeps Router] Invalid base path: "${base}"`);
    }

    this.#outlet = document.querySelector(outletSelector);
    // Normalize base: no trailing slash
    this.#base = base.replace(/\/$/, '');
    // Pre-compile escaped base regex once - avoids RegExp-injection in #resolve
    this.#baseRegex = this.#base
      ? new RegExp(`^${escapeRegExp(this.#base)}`)
      : null;

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
    assertValidPattern(pattern);
    assertValidTag(elementTag);

    if (options.onEnter !== null && options.onEnter !== undefined && typeof options.onEnter !== 'function') {
      throw new TypeError('[NullDeps Router] onEnter must be a function');
    }
    if (options.onLeave !== null && options.onLeave !== undefined && typeof options.onLeave !== 'function') {
      throw new TypeError('[NullDeps Router] onLeave must be a function');
    }

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

  /**
   * Custom element tag for unmatched routes
   * @param {string} elementTag
   */
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
   * @param {function} guardFn
   */
  beforeEach(guardFn) {
    if (typeof guardFn !== 'function') {
      throw new TypeError('[NullDeps Router] Guard must be a function');
    }
    this.#guards.push(guardFn);
    return this;
  }

  start() {
    window.addEventListener('popstate', () => this.#resolve());

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.#resolve());
    } else {
      queueMicrotask(() => this.#resolve());
    }

    // Intercept internal <a> clicks for client-side navigation
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a) return;

      const href = a.getAttribute('href');

      // Only handle absolute internal paths - ignore external, mailto, hash-only etc.
      if (!href || !href.startsWith('/')) return;

      e.preventDefault();

      // Strip base prefix before navigating
      const path = this.#baseRegex
        ? href.replace(this.#baseRegex, '') || '/'
        : href;

      this.navigate(path);
    });

    return this;
  }

  /**
   * Navigate programmatically by path
   * @param {string} path - e.g. '/tasks' or '/tasks/123'
   */
  navigate(path) {
    if (typeof path !== 'string' || !path.startsWith('/')) {
      console.warn(`[NullDeps Router] navigate() expects a path starting with "/", got: "${path}"`);
      return;
    }

    const fullPath = this.#base + path;
    if (window.location.pathname === fullPath) return;

    history.pushState(null, '', fullPath);
    this.#resolve();
  }

  /**
   * Navigate programmatically by route name
   * @param {string} name
   * @param {object} params
   */
  navigateTo(name, params = {}) {
    const route = this.#routes.find(r => r.name === name);

    if (!route) {
      console.warn(`[NullDeps Router] No route found with name "${name}"`);
      return;
    }

    // Sanitize params before using as URL segments
    const safeParams = sanitizeParams(params);

    const path = route.pattern.replace(/(?::|\[)([^\s/\]]+)\]?/g, (_, key) => {
      if (!(key in safeParams)) {
        console.warn(`[NullDeps Router] Missing param "${key}" for route "${name}"`);
        return `:${key}`;
      }
      return encodeURIComponent(safeParams[key]);
    });

    this.navigate(path);
  }

  /**
   * Replace current history entry without adding a new one
   * @param {string} path
   */
  replace(path) {
    if (typeof path !== 'string' || !path.startsWith('/')) {
      console.warn(`[NullDeps Router] replace() expects a path starting with "/", got: "${path}"`);
      return;
    }
    history.replaceState(null, '', this.#base + path);
    this.#resolve();
  }

  /**
   * Returns the currently active route info (frozen - immutable)
   */
  get current() {
    return this.#currentRoute ? Object.freeze({ ...this.#currentRoute }) : null;
  }

  // ---- Private ----

  async #resolve() {
    const navId = ++this.#currentNavId;

    // Strip base prefix using pre-compiled regex - no runtime RegExp-injection risk
    const rawPath = window.location.pathname;
    const path = this.#baseRegex
      ? rawPath.replace(this.#baseRegex, '') || '/'
      : rawPath || '/';

    const matched = this.#routes.find(r => r.regex.test(path));
    const params = matched ? this.#extractParams(matched.pattern, path) : {};
    const searchParams = Object.fromEntries(new URLSearchParams(window.location.search));

    const to = Object.freeze(
      matched
        ? { path, pattern: matched.pattern, params, searchParams, elementTag: matched.elementTag, name: matched.name }
        : { path, pattern: null, params: {}, searchParams, elementTag: this.#notFound, name: null }
    );

    const from = this.#currentRoute;

    // ---- Run navigation guards ----
    const guardResult = await this.#runGuards(from, to);

    if (navId !== this.#currentNavId) return;

    if (guardResult === false) {
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

    // ---- Save scroll position - cap cache to prevent memory leak ----
    if (from) {
      if (this.#scrollPositions.size >= MAX_SCROLL_CACHE) {
        // Remove oldest entry (Map preserves insertion order)
        const firstKey = this.#scrollPositions.keys().next().value;
        this.#scrollPositions.delete(firstKey);
      }
      this.#scrollPositions.set(from.path, window.scrollY);
    }

    // ---- Call onLeave hook on current element ----
    if (this.#currentElement?.onLeave) {
      try {
        this.#currentElement.onLeave(to);
      } catch (err) {
        console.error('[NullDeps Router] onLeave hook threw:', err);
      }
    }

    // ---- Render new route ----
    this.#currentRoute = to;

    if (matched) {
      const el = document.createElement(matched.elementTag);

      // Attach route data as frozen objects BEFORE DOM insertion
      // connectedCallback can read but not accidentally mutate route data
      Object.defineProperties(el, {
        routeParams: {
          value: Object.freeze({ ...params }),
          writable: false,
          configurable: false,
          enumerable: true
        },
        searchParams: {
          value: Object.freeze({ ...searchParams }),
          writable: false,
          configurable: false,
          enumerable: true
        }
      });

      // replaceChildren is safer and faster than innerHTML = ''
      this.#outlet.replaceChildren(el);
      this.#currentElement = el;

      try {
        matched.onEnter?.(to, from);
      } catch (err) {
        console.error('[NullDeps Router] onEnter hook threw:', err);
      }

      queueMicrotask(() => {
        if (navId !== this.#currentNavId) return;
        try {
          el.onRouteEnter?.(to, from);
        } catch (err) {
          console.error('[NullDeps Router] onRouteEnter threw:', err);
        }
      });
    } else {
      this.#renderNotFound();
    }

    // ---- Restore or reset scroll ----
    const savedScroll = this.#scrollPositions.get(path);
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
   * Safe DOM creation - avoids innerHTML with dynamic tag names (XSS)
   */
  #renderNotFound() {
    const el = document.createElement(this.#notFound);
    this.#outlet.replaceChildren(el);
    this.#currentElement = el;
  }

  /**
   * Convert route pattern to regex
   * Uses pre-escaped segments - no runtime injection possible
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
   * Values are decoded and returned as frozen object
   */
  #extractParams(pattern, path) {
    const keys = [
      ...[...pattern.matchAll(/\[(\w+)\]/g)].map(m => m[1]),
      ...[...pattern.matchAll(/:([^\s/]+)/g)].map(m => m[1])
    ];

    const groups = this.#toRegex(pattern).exec(path)?.groups ?? {};

    return Object.freeze(
      Object.fromEntries(
        keys.map(k => [k, groups[k] ? decodeURIComponent(groups[k]) : undefined])
      )
    );
  }
}
