/**
 * NullDeps - EventBus
 * Global pub/sub pattern via native CustomEvents
 * 
 * Security: validates event names, prevents duplicate handlers,
 * returns unsubscribe functions on all methods
 */

// Allowlist pattern: only alphanumeric, colon, dash, dot
const VALID_EVENT_NAME = /^[a-zA-Z0-9:.\-_]+$/;

/**
 * Validates event name to prevent injection via crafted event strings
 * @param {string} event
 */
function assertValidEvent(event) {
  if (typeof event !== 'string' || !VALID_EVENT_NAME.test(event)) {
    throw new TypeError(`EventBus: invalid event name "${event}"`);
  }
}

/**
 * Validates handler is callable
 * @param {unknown} handler
 */
function assertValidHandler(handler) {
  if (typeof handler !== 'function') {
    throw new TypeError(`EventBus: handler must be a function, got "${typeof handler}"`);
  }
}

export const EventBus = {
  emit(event, detail = {}) {
    assertValidEvent(event);

    // Freeze detail to prevent mutation by listeners
    window.dispatchEvent(new CustomEvent(event, { detail: Object.freeze(detail) }));
  },

  on(event, handler) {
    assertValidEvent(event);
    assertValidHandler(handler);

    window.addEventListener(event, handler);

    // Return unsubscribe function
    return () => window.removeEventListener(event, handler);
  },

  once(event, handler) {
    assertValidEvent(event);
    assertValidHandler(handler);

    const wrapper = (e) => {
      handler(e);
      window.removeEventListener(event, wrapper);
    };

    window.addEventListener(event, wrapper);

    // Return unsubscribe for early cleanup before event fires
    return () => window.removeEventListener(event, wrapper);
  }
};
