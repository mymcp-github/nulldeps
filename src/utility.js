/**
 * nulldeps - utility.js
 * Shared security and DOM helpers for all UI components
 * Zero dependencies - Pure Web Standards
 */

// ============================================================================
// HTML / Attribute Escaping (XSS protection)
// ============================================================================

/**
 * Escape a value for safe insertion into HTML text content.
 * Uses DOM API - handles all edge cases including unicode and surrogate pairs.
 *
 * Use for:  `<div>${escHtml(userInput)}</div>`
 *
 * @param {*} value - Any value (will be coerced to string)
 * @returns {string} HTML-safe string
 */
export function escHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

/**
 * Escape a value for safe insertion into a double-quoted HTML attribute.
 * Must be used with double quotes: attr="${escAttr(val)}"
 *
 * Use for:  `<input value="${escAttr(userInput)}">`
 *
 * @param {*} value
 * @returns {string} Attribute-safe string
 */
export function escAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Validate against a whitelist - returns fallback if value not allowed.
 * Useful for enum-like attributes (type, variant, size, etc.)
 *
 * @param {*} value
 * @param {Set<string>|string[]} allowed
 * @param {string} fallback
 * @returns {string}
 */
export function whitelist(value, allowed, fallback) {
  const set = allowed instanceof Set ? allowed : new Set(allowed);
  return set.has(value) ? value : fallback;
}

// ============================================================================
// URL Safety (open-redirect / javascript: protection)
// ============================================================================

// Protocols allowed in user-provided URLs - blocks javascript:, data:, etc.
const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * Validate a URL for safe use in href/src attributes.
 * Blocks javascript:, data:, vbscript: and other dangerous protocols.
 * Relative URLs and hash fragments are always allowed.
 *
 * @param {string} url
 * @returns {string} The URL if safe, '#' otherwise
 */
export function safeUrl(url) {
  const str = String(url ?? '').trim();
  if (!str) return '#';

  // Relative paths and hash fragments - safe
  if (str.startsWith('/') || str.startsWith('#') || str.startsWith('?')) {
    return str;
  }

  try {
    const parsed = new URL(str, window.location.origin);
    return SAFE_URL_PROTOCOLS.has(parsed.protocol) ? str : '#';
  } catch {
    return '#';
  }
}

// ============================================================================
// IDs / Identifiers
// ============================================================================

let _uidCounter = 0;

/**
 * Generate a unique ID for the current page session.
 * Combines counter + random for collision resistance and readability.
 *
 * @param {string} [prefix='id']
 * @returns {string}
 */
export function uid(prefix = 'id') {
  _uidCounter += 1;
  const rand = Math.random().toString(36).slice(2, 6);
  return `${prefix}-${_uidCounter}-${rand}`;
}

// ============================================================================
// DOM Helpers
// ============================================================================

/**
 * Get the currently focused element within a shadow root.
 * Necessary because document.activeElement returns the host, not the inner node.
 *
 * @param {ShadowRoot|null} shadowRoot
 * @returns {Element|null}
 */
export function activeElement(shadowRoot) {
  return shadowRoot?.activeElement ?? null;
}

/**
 * Build a className string from conditional parts.
 * Filters out falsy values - cleaner than template-string conditionals.
 *
 * Example: cls('btn', isActive && 'btn--active', size && `btn--${size}`)
 *
 * @param  {...(string|false|null|undefined)} parts
 * @returns {string}
 */
export function cls(...parts) {
  return parts.filter(Boolean).join(' ');
}

// ============================================================================
// Function helpers
// ============================================================================

/**
 * Debounce - delays invocation until `wait` ms have passed without new calls.
 * Use for: search inputs, resize handlers, autosave.
 *
 * @template {(...args: any[]) => any} F
 * @param {F} fn
 * @param {number} wait
 * @returns {F & { cancel: () => void }}
 */
export function debounce(fn, wait = 200) {
  let timer = null;
  const debounced = (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, wait);
  };
  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  return debounced;
}

/**
 * Throttle - guarantees at most one invocation per `wait` ms.
 * Use for: scroll handlers, mousemove, high-frequency events.
 *
 * @template {(...args: any[]) => any} F
 * @param {F} fn
 * @param {number} wait
 * @returns {F}
 */
export function throttle(fn, wait = 100) {
  let last = 0;
  let timer = null;
  let lastArgs = null;

  return (...args) => {
    const now = Date.now();
    const remaining = wait - (now - last);
    lastArgs = args;

    if (remaining <= 0) {
      if (timer) { clearTimeout(timer); timer = null; }
      last = now;
      fn(...args);
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        fn(...lastArgs);
      }, remaining);
    }
  };
}

// ============================================================================
// Object / Type helpers
// ============================================================================

/**
 * Type-safe check for plain objects (not arrays, not null, not class instances).
 *
 * @param {*} value
 * @returns {boolean}
 */
export function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

/**
 * Shallow-clone safe deep merge for plain objects.
 * Arrays and class instances are replaced, not merged.
 *
 * @template T
 * @param {T} target
 * @param  {...Partial<T>} sources
 * @returns {T}
 */
export function deepMerge(target, ...sources) {
  const out = { ...target };
  for (const src of sources) {
    if (!isPlainObject(src)) continue;
    for (const key of Object.keys(src)) {
      const a = out[key];
      const b = src[key];
      out[key] = isPlainObject(a) && isPlainObject(b) ? deepMerge(a, b) : b;
    }
  }
  return out;
}

// ============================================================================
// Coercion helpers (attribute -> typed value)
// ============================================================================

/**
 * Coerce HTML attribute value to boolean.
 * Empty string and presence both count as true (HTML standard).
 *
 * @param {string|null} value
 * @returns {boolean}
 */
export function toBool(value) {
  return value !== null && value !== 'false' && value !== undefined;
}

/**
 * Coerce attribute value to number with fallback.
 *
 * @param {*} value
 * @param {number} fallback
 * @returns {number}
 */
export function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
