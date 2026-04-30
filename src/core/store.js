/**
 * NullDeps - Store
 * Proxy-based reactive state management
 *
 * Features:
 * - Batched updates via queueMicrotask
 * - Deep change detection
 * - Namespaced events (store:<key>)
 * - Middleware support (logger, persist, etc.)
 * - Computed values with dependency tracking
 * - Undo/Redo history
 * - setState for atomic multi-key updates
 * - Factory pattern - supports multiple isolated instances
 */

// Max undo/redo history entries per instance
const MAX_HISTORY = 50;

// Blocked keys - prevent prototype pollution
const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Validates a store key
 * @param {string} key
 */
function assertValidKey(key) {
  if (typeof key !== 'string' || !key.trim()) {
    throw new TypeError(`[NullDeps Store] Key must be a non-empty string, got: ${typeof key}`);
  }
  if (BLOCKED_KEYS.has(key)) {
    throw new TypeError(`[NullDeps Store] Blocked key: "${key}"`);
  }
}

/**
 * Deep equality check
 * Handles: primitives, null, Arrays, plain Objects, Date, RegExp
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
function _deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  // Date comparison
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // RegExp comparison
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.toString() === b.toString();
  }

  // Array comparison - must check before object (Array is typeof object)
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => _deepEqual(item, b[i]));
  }

  // One is array, other is not
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(k => _deepEqual(a[k], b[k]));
  }

  return false;
}

/**
 * Creates an isolated Store instance
 * Use this instead of a module-level singleton to support:
 * - Multiple stores in one app
 * - Clean test isolation
 * - SSR without shared state
 *
 * @param {object} initialState
 * @returns {{ store, use, computed, setState, getSnapshot, getComputedSnapshot, reset, undo, redo }}
 */
export function createStore(initialState = {}) {
  // Validate initial state keys
  for (const key of Object.keys(initialState)) {
    assertValidKey(key);
  }

  // All state is encapsulated in closure - not accessible from outside
  const _state = structuredClone(initialState);
  const _pending = new Set();
  const _middlewares = [];
  const _computed = new Map();   // key → { deps, fn, cachedValue }
  const _history = [];
  const _future = [];

  let _scheduled = false;

  // ---- Private Helpers ----

  function _runMiddlewares(key, oldValue, newValue) {
    return _middlewares.reduce((val, fn) => {
      try {
        const result = fn(key, oldValue, val);
        // Guard: middleware must return a value - warn and pass through if not
        if (result === undefined) {
          console.warn(`[NullDeps Store] Middleware returned undefined for key "${key}" - using previous value`);
          return val;
        }
        return result;
      } catch (err) {
        console.error(`[NullDeps Store] Middleware threw for key "${key}":`, err);
        return val;
      }
    }, newValue);
  }

  function _recomputeAffected(changedKeys) {
    for (const [computedKey, entry] of _computed) {
      if (!entry.deps.some(dep => changedKeys.has(dep))) continue;

      let newValue;
      try {
        newValue = entry.fn(_state);
      } catch (err) {
        console.error(`[NullDeps Store] Computed "${computedKey}" threw during recompute:`, err);
        continue;
      }

      if (_deepEqual(entry.cachedValue, newValue)) continue;

      entry.cachedValue = newValue;
      _state[computedKey] = newValue;
      _pending.add(computedKey);
    }
  }

  function _scheduleFlush(extraKeys = []) {
    for (const k of extraKeys) _pending.add(k);
    if (_scheduled) return;
    _scheduled = true;

    queueMicrotask(() => {
      _scheduled = false;

      // Snapshot pending before clearing - flush is async
      const flushedKeys = new Set(_pending);
      _pending.clear();

      for (const k of flushedKeys) {
        window.dispatchEvent(new CustomEvent(`store:${k}`, {
          detail: Object.freeze({ key: k, value: _state[k] })
        }));
      }

      window.dispatchEvent(new CustomEvent('store:change', {
        detail: Object.freeze({ keys: [...flushedKeys] })
      }));
    });
  }

  function _pushHistory() {
    if (_history.length >= MAX_HISTORY) _history.shift();
    // Only snapshot non-computed keys - computed values recompute from deps
    const snapshot = {};
    for (const key of Object.keys(_state)) {
      if (!_computed.has(key)) snapshot[key] = _state[key];
    }
    _history.push(structuredClone(snapshot));
  }

  function _applySnapshot(snapshot) {
    const changedKeys = [];

    for (const key of Object.keys(snapshot)) {
      if (_computed.has(key)) continue;
      if (_deepEqual(_state[key], snapshot[key])) continue;

      _state[key] = snapshot[key];
      changedKeys.push(key);
    }

    if (changedKeys.length === 0) return;

    _recomputeAffected(new Set(changedKeys));
    _scheduleFlush(changedKeys);
  }

  // ---- Proxy ----

  const store = new Proxy(_state, {
    set(target, key, newValue) {
      // Symbol keys pass through - needed for framework internals
      if (typeof key === 'symbol') {
        target[key] = newValue;
        return true;
      }

      try {
        assertValidKey(key);
      } catch (err) {
        console.error(err);
        return false;
      }

      if (_computed.has(key)) {
        console.warn(`[NullDeps Store] "${key}" is computed and cannot be set directly`);
        return true;
      }

      const oldValue = target[key];
      if (_deepEqual(oldValue, newValue)) return true;

      const finalValue = _runMiddlewares(key, oldValue, newValue);

      _pushHistory();
      _future.length = 0;

      target[key] = finalValue;
      _pending.add(key);

      // Snapshot current pending batch for recompute - isolated from old pending keys
      _recomputeAffected(new Set([key]));
      _scheduleFlush();
      return true;
    },

    get(target, key) {
      return target[key];
    },

    // Prevent deletion of state keys via delete store.key
    deleteProperty(target, key) {
      console.warn(`[NullDeps Store] Direct deletion blocked. Use reset() to clear state.`);
      return false;
    }
  });

  // ---- Public API ----

  /**
   * Register a middleware
   * Receives (key, oldValue, newValue) - must return final value
   * @param {function} fn
   * @returns {function} unsubscribe
   */
  function use(fn) {
    if (typeof fn !== 'function') {
      throw new TypeError('[NullDeps Store] Middleware must be a function');
    }
    _middlewares.push(fn);
    return () => {
      const i = _middlewares.indexOf(fn);
      if (i > -1) _middlewares.splice(i, 1);
    };
  }

  /**
   * Register a computed value
   * Recomputes when any dependency key changes
   * @param {string} key
   * @param {string[]} deps
   * @param {function} fn - receives current state, must return computed value
   */
  function addComputed(key, deps, fn) {
    assertValidKey(key);

    if (!Array.isArray(deps) || deps.length === 0) {
      throw new TypeError(`[NullDeps Store] computed "${key}" requires a non-empty deps array`);
    }
    if (typeof fn !== 'function') {
      throw new TypeError(`[NullDeps Store] computed "${key}" fn must be a function`);
    }

    const cachedValue = fn(_state);
    _computed.set(key, { deps, fn, cachedValue });
    // Write directly to _state - bypass proxy (computed cannot go through middleware/history)
    _state[key] = cachedValue;
  }

  /**
   * Atomic multi-key update - single history entry, single flush
   * @param {object} partial
   */
  function setState(partial) {
    if (typeof partial !== 'object' || partial === null || Array.isArray(partial)) {
      throw new TypeError('[NullDeps Store] setState expects a plain object');
    }

    // One history snapshot for the whole batch
    _pushHistory();
    _future.length = 0;

    // Track only keys changed in THIS batch - isolated from existing _pending
    const batchChanged = new Set();

    for (const [key, newValue] of Object.entries(partial)) {
      try {
        assertValidKey(key);
      } catch (err) {
        console.error(err);
        continue;
      }

      if (_computed.has(key)) {
        console.warn(`[NullDeps Store] "${key}" is computed and cannot be set directly`);
        continue;
      }

      const oldValue = _state[key];
      if (_deepEqual(oldValue, newValue)) continue;

      const finalValue = _runMiddlewares(key, oldValue, newValue);
      _state[key] = finalValue;
      _pending.add(key);
      batchChanged.add(key);
    }

    if (batchChanged.size === 0) return;

    // Recompute with only THIS batch's changed keys - not stale pending
    _recomputeAffected(batchChanged);
    _scheduleFlush();
  }

  /** Undo last change */
  function undo() {
    if (_history.length === 0) return;
    _future.push(structuredClone(
      Object.fromEntries(Object.entries(_state).filter(([k]) => !_computed.has(k)))
    ));
    _applySnapshot(_history.pop());
  }

  /** Redo last undone change */
  function redo() {
    if (_future.length === 0) return;
    _pushHistory();
    _applySnapshot(_future.pop());
  }

  /**
   * Deep clone of current non-computed state
   * Safe to mutate - does not affect store
   */
  function getSnapshot() {
    const snap = {};
    for (const [k, v] of Object.entries(_state)) {
      if (!_computed.has(k)) snap[k] = v;
    }
    return structuredClone(snap);
  }

  /**
   * Deep clone including computed values
   */
  function getFullSnapshot() {
    return structuredClone(_state);
  }

  /**
   * Reset store - clears state, history, computed registrations
   * @param {object} newInitialState
   */
  function reset(newInitialState = {}) {
    for (const key of Object.keys(newInitialState)) {
      assertValidKey(key);
    }

    for (const key of Object.keys(_state)) delete _state[key];

    Object.assign(_state, structuredClone(newInitialState));

    // Re-run computed with fresh state
    for (const [key, entry] of _computed) {
      try {
        const val = entry.fn(_state);
        entry.cachedValue = val;
        _state[key] = val;
      } catch (err) {
        console.error(`[NullDeps Store] computed "${key}" threw during reset:`, err);
      }
    }

    _pending.clear();
    _history.length = 0;
    _future.length = 0;
  }

  return {
    store,
    use,
    computed: addComputed,
    setState,
    getSnapshot,
    getFullSnapshot,
    reset,
    undo,
    redo,
  };
}

// ---- Built-in Middlewares ----

/**
 * Logger middleware
 * Logs every state change with old and new value
 */
export const logger = (key, oldValue, newValue) => {
  console.group(`[NullDeps Store] "${key}" changed`);
  console.log('  old:', oldValue);
  console.log('  new:', newValue);
  console.groupEnd();
  return newValue;
};

/**
 * Persist middleware factory
 * Syncs specified keys to localStorage
 * Call before creating the store if you want rehydration at startup
 *
 * @param {string[]} keys - Keys to persist
 * @param {object} stateRef - Reference to the raw _state object (pass from createStore context)
 */
export function persist(keys) {
  // Rehydration must happen before store proxy intercepts - caller applies to _state directly
  const rehydrated = {};
  for (const key of keys) {
    const stored = localStorage.getItem(`store:${key}`);
    if (stored === null) continue;
    try {
      rehydrated[key] = JSON.parse(stored);
    } catch {
      console.warn(`[NullDeps Store] Could not rehydrate key "${key}"`);
    }
  }

  // Middleware function returned to pass to use()
  const middleware = (key, oldValue, newValue) => {
    if (keys.includes(key)) {
      try {
        localStorage.setItem(`store:${key}`, JSON.stringify(newValue));
      } catch {
        console.warn(`[NullDeps Store] Could not persist key "${key}"`);
      }
    }
    return newValue;
  };

  return { middleware, rehydrated };
}
