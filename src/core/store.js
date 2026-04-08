/**
 * NullDeps - Store
 * Proxy-based reactive state management
 *
 * Features:
 * - Batched updates via queueMicrotask
 * - Deep change detection via structuredClone
 * - Namespaced events (store:<key>)
 * - Middleware support (logger, persist, etc.)
 * - Computed values with dependency tracking
 * - Undo/Redo history
 * - setState for atomic multi-key updates
 */

const _state = {};
const _pending = new Set();
const _middlewares = [];
const _computed = new Map(); // key -> { deps, fn, cachedValue }
const _history = [];
const _future = [];

let _scheduled = false;
const MAX_HISTORY = 50;

// ---- Middleware ----

/**
 * Register a middleware function
 * Middleware receives (key, oldValue, newValue) and must return the final value.
 * Can be used for logging, validation, persistence, etc.
 */
export function use(middlewareFn) {
  _middlewares.push(middlewareFn);
}

// ---- Computed Values ----

/**
 * Register a computed value derived from store keys
 * Automatically recomputes when any dependency changes
 * @param {string} key - The key to store the computed value under
 * @param {string[]} deps - Store keys this computed value depends on
 * @param {function} fn - Compute function receives current state snapshot
 */
export function computed(key, deps, fn) {
  // Initial computation
  const cachedValue = fn(_state);

  _computed.set(key, { deps, fn, cachedValue });

  // Store initial value without triggering middleware/history
  _state[key] = cachedValue;
}

// ---- Undo/Redo ----

/** Undo last state change */
export function undo() {
  if (_history.length === 0) return;

  // Save current state to future stack
  _future.push(structuredClone(_state));

  // Restore previous snapshot
  const snapshot = _history.pop();
  _applySnapshot(snapshot);
}

/** Redo last undone change */
export function redo() {
  if (_future.length === 0) return;

  _history.push(structuredClone(_state));

  const snapshot = _future.pop();
  _applySnapshot(snapshot);
}

/**
 * Apply a full state snapshot without pushing to history
 * Used internally by undo/redo
 */
function _applySnapshot(snapshot) {
  const changedKeys = [];

  for (const key of Object.keys(snapshot)) {
    // Skip computed keys - they will recompute automatically
    if (_computed.has(key)) continue;

    if (!_deepEqual(_state[key], snapshot[key])) {
      _state[key] = snapshot[key];
      changedKeys.push(key);
    }
  }

  // Recompute affected computed values
  _recomputeAffected(new Set(changedKeys));

  // Flush events for all changed keys
  _scheduleFlush(changedKeys);
}

// ---- Core Proxy ----

export const Store = new Proxy(_state, {
  set(target, key, newValue) {
    // Block direct writes to computed keys
    if (_computed.has(key)) {
      console.warn(`[NullDeps Store] "${key}" is a computed value and cannot be set directly`);
      return true;
    }

    const oldValue = target[key];

    // Skip update if value has not changed (deep equality check)
    if (_deepEqual(oldValue, newValue)) return true;

    // Run value through middleware chain
    const finalValue = _runMiddlewares(key, oldValue, newValue);

    // Save history snapshot before applying change (capped at MAX_HISTORY)
    if (_history.length >= MAX_HISTORY) _history.shift();
    _history.push(structuredClone(target));

    // Clear redo stack on new change
    _future.length = 0;

    // Apply value
    target[key] = finalValue;
    _pending.add(key);

    // Recompute any computed values that depend on this key
    _recomputeAffected(new Set([key]));

    _scheduleFlush();
    return true;
  },

  get(target, key) {
    return target[key];
  }
});

/**
 * Atomic multi-key update - fires only one combined store:change event
 * @param {object} partial - Object with keys/values to update
 */
export function setState(partial) {
  // Save one history entry for the entire batch
  if (_history.length >= MAX_HISTORY) _history.shift();
  _history.push(structuredClone(_state));
  _future.length = 0;

  for (const [key, newValue] of Object.entries(partial)) {
    if (_computed.has(key)) {
      console.warn(`[NullDeps Store] "${key}" is a computed value and cannot be set directly`);
      continue;
    }

    const oldValue = _state[key];
    if (_deepEqual(oldValue, newValue)) continue;

    const finalValue = _runMiddlewares(key, oldValue, newValue);
    _state[key] = finalValue;
    _pending.add(key);
  }

  // Recompute affected computed values once for the whole batch
  _recomputeAffected(_pending);
  _scheduleFlush();
}

/**
 * Get a snapshot of the current state (deep clone - safe to mutate)
 */
export function getSnapshot() {
  return structuredClone(_state);
}

/**
 * Reset store to empty state - useful for testing
 */
export function reset(initialState = {}) {
  for (const key of Object.keys(_state)) {
    delete _state[key];
  }
  Object.assign(_state, structuredClone(initialState));
  _pending.clear();
  _history.length = 0;
  _future.length = 0;
}

// ---- Built-in Middlewares ----

/**
 * Logger middleware - logs every state change to console
 */
export const logger = (key, oldValue, newValue) => {
  console.group(`[NullDeps Store] "${key}" changed`);
  console.log('old:', oldValue);
  console.log('new:', newValue);
  console.groupEnd();
  return newValue;
};

/**
 * Persist middleware factory - syncs specific keys to localStorage
 * @param {string[]} keys - Keys to persist
 */
export function persist(keys) {
  // Rehydrate persisted keys on startup
  for (const key of keys) {
    const stored = localStorage.getItem(`store:${key}`);
    if (stored !== null) {
      try {
        _state[key] = JSON.parse(stored);
      } catch {
        console.warn(`[NullDeps Store] Could not rehydrate key "${key}"`);
      }
    }
  }

  // Return middleware function
  return (key, oldValue, newValue) => {
    if (keys.includes(key)) {
      try {
        localStorage.setItem(`store:${key}`, JSON.stringify(newValue));
      } catch {
        console.warn(`[NullDeps Store] Could not persist key "${key}"`);
      }
    }
    return newValue;
  };
}

// ---- Private Helpers ----

function _scheduleFlush(extraKeys = []) {
  for (const k of extraKeys) _pending.add(k);

  if (_scheduled) return;
  _scheduled = true;

  queueMicrotask(() => {
    _scheduled = false;

    // Fire individual key events
    for (const k of _pending) {
      window.dispatchEvent(new CustomEvent(`store:${k}`, {
        detail: { key: k, value: _state[k] }
      }));
    }

    // Fire one combined change event
    window.dispatchEvent(new CustomEvent('store:change', {
      detail: { keys: [..._pending] }
    }));

    _pending.clear();
  });
}

function _runMiddlewares(key, oldValue, newValue) {
  return _middlewares.reduce((val, fn) => fn(key, oldValue, val), newValue);
}

function _recomputeAffected(changedKeys) {
  for (const [computedKey, entry] of _computed) {
    const affected = entry.deps.some(dep => changedKeys.has(dep));
    if (!affected) continue;

    const newValue = entry.fn(_state);

    if (_deepEqual(entry.cachedValue, newValue)) continue;

    entry.cachedValue = newValue;
    _state[computedKey] = newValue;
    _pending.add(computedKey);
  }
}

function _deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (a === null || b === null) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return keysA.every(k => _deepEqual(a[k], b[k]));
}
