/**
 * NullDeps - EventBus
 * Global pub/sub pattern via native CustomEvents
 */
export const EventBus = {
  emit(event, detail = {}) {
    window.dispatchEvent(new CustomEvent(event, { detail }));
  },

  on(event, handler) {
    window.addEventListener(event, handler);
    // Return unsubscribe function
    return () => window.removeEventListener(event, handler);
  },

  once(event, handler) {
    const wrapper = (e) => {
      handler(e);
      window.removeEventListener(event, wrapper);
    };
    window.addEventListener(event, wrapper);
  }
};
