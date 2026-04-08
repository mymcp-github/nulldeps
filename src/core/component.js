/**
 * NullDeps - BaseComponent
 * Extends HTMLElement with state, lifecycle and action binding
 * Zero dependencies - Pure Web Standards
 */
export class Component extends HTMLElement {
  #state = {};
  #listeners = [];
  #initialized = false;
  #renderScheduled = false;

  static get observedAttributes() {
    return this.watchedAttributes ?? [];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  // ---- Lifecycle ----

  connectedCallback() {
    // Defer to next microtask - ensures subclass field initializers run first
    Promise.resolve().then(() => {
      if (this.#initialized) return;
      this.#initialized = true;
      this.#subscribeToStore();
      // Call onMount before first render so initState can be set
      this.onMount?.();
      this.render();
    });
  }

  disconnectedCallback() {
    this.#initialized = false;
    this.#cleanup();
    this.onDestroy?.();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    // Skip if not yet initialized - connectedCallback will handle first render
    if (!this.#initialized) return;
    if (oldVal === newVal) return;

    this.onAttributeChange?.(name, oldVal, newVal);

    // Batch attribute changes like setState
    if (!this.#renderScheduled) {
      this.#renderScheduled = true;
      queueMicrotask(() => {
        this.#renderScheduled = false;
        this.render();
      });
    }
  }

  // ---- State ----

  get state() {
    // Return frozen copy - prevents accidental direct mutation
    return Object.freeze({ ...this.#state });
  }

  /**
   * Initialize state - call this in onMount()
   * Using a method instead of class field assignment avoids
   * the JS class field / private field setter bypass bug
   */
  initState(initial) {
    if (this.#initialized && Object.keys(this.#state).length > 0) {
      console.warn('[Component] initState called after state already set - ignored');
      return;
    }
    this.#state = { ...initial };
    // Trigger render if already initialized (called from onMount after #initialized = true)
    if (this.#initialized) {
      this.render();
    }
  }

  setState(partial) {
    if (!this.#initialized) {
      console.warn('[Component] setState called before component was initialized');
      return;
    }

    // Shallow dirty check - skip if nothing actually changed
    const hasChanges = Object.keys(partial).some(
      key => partial[key] !== this.#state[key]
    );
    if (!hasChanges) return;

    this.#state = { ...this.#state, ...partial };

    // Batch multiple setState calls into one render frame
    if (!this.#renderScheduled) {
      this.#renderScheduled = true;
      queueMicrotask(() => {
        this.#renderScheduled = false;
        this.render();
      });
    }
  }

  // ---- Render ----

  render() {
    if (!this.shadowRoot) return;
    if (!this.#initialized) return;

    this.#cleanupActionListeners();

    // Error boundary - broken render must not crash the app
    try {
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; }
          ${this.styles?.() ?? ''}
        </style>
        ${this.template?.() ?? ''}
      `;
    } catch (err) {
      console.error(`[Component] Render error in <${this.tagName.toLowerCase()}>:`, err);
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; }
          .error { color: red; font-size: 12px; padding: 8px; border: 1px solid red; }
        </style>
        <div class="error">Render error: ${err.message}</div>
      `;
      // Notify outside world - allows global error tracking
      this.emit('component:error', { error: err, tag: this.tagName.toLowerCase() });
      return;
    }

    this.#bindActions();
    this.afterRender?.();
  }

  // ---- Events ----

  emit(eventName, detail = {}) {
    this.dispatchEvent(new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Managed event listener - automatically cleaned up on disconnect
   * @param {EventTarget} target
   * @param {string} event
   * @param {EventListener} handler
   */
  on(target, event, handler) {
    target.addEventListener(event, handler);
    this.#listeners.push({ target, event, handler });

    // Return unsubscribe for manual cleanup if needed
    return () => {
      target.removeEventListener(event, handler);
      this.#listeners = this.#listeners.filter(
        l => !(l.target === target && l.event === event && l.handler === handler)
      );
    };
  }

  // ---- Action Binding ----
  // Binds data-action="event:methodName" to component methods
  // Supports multiple actions: data-action="click:save mouseenter:highlight"

  #bindActions() {
    this.shadowRoot?.querySelectorAll('[data-action]').forEach(el => {
      const actions = el.dataset.action.trim().split(/\s+/);

      for (const action of actions) {
        const [event, method] = action.split(':');

        if (!event || !method) {
          console.warn(`[Component] Invalid data-action format: "${action}" - expected "event:method"`);
          continue;
        }

        if (typeof this[method] !== 'function') {
          console.warn(`[Component] Action method "${method}" not found on <${this.tagName.toLowerCase()}>`);
          continue;
        }

        const handler = (e) => this[method](e);
        el.addEventListener(event, handler);
        this.#listeners.push({ target: el, event, handler });
      }
    });
  }

  // ---- Store Subscription ----
  // Supports multiple keys: store-key="user theme"

  #subscribeToStore() {
    const keyAttr = this.getAttribute('store-key');
    if (!keyAttr) return;

    const keys = keyAttr.trim().split(/\s+/);

    for (const key of keys) {
      // Batch store updates same as setState
      const handler = () => {
        if (!this.#renderScheduled) {
          this.#renderScheduled = true;
          queueMicrotask(() => {
            this.#renderScheduled = false;
            this.render();
          });
        }
      };

      window.addEventListener(`store:${key}`, handler);
      this.#listeners.push({ target: window, event: `store:${key}`, handler });
    }
  }

  // ---- Cleanup ----
  // Removes only shadow DOM action listeners - keeps global/store listeners alive

  #cleanupActionListeners() {
    this.#listeners = this.#listeners.filter(({ target, event, handler }) => {
      if (target !== window) {
        target.removeEventListener(event, handler);
        return false;
      }
      return true;
    });
  }

  // Removes all listeners on disconnect

  #cleanup() {
    this.#listeners.forEach(({ target, event, handler }) => {
      target.removeEventListener(event, handler);
    });
    this.#listeners = [];
  }
}
