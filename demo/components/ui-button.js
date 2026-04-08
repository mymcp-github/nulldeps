// demo/components/ui-button.js

class UiButton extends HTMLElement {

  // Reflect all native button attributes
  static observedAttributes = [
    'variant', 'size', 'loading', 'disabled',
    'type', 'name', 'value', 'form', 'autofocus'
  ];

  #internals;

  constructor() {
    super();
    // Form-associated custom element - native form participation
    this.#internals = this.attachInternals();
    this.attachShadow({ mode: 'open' });
  }

  // Tell the browser this is a form element
  static formAssociated = true;

  connectedCallback() {
    this.render();
    this.#bindEvents();
  }

  attributeChangedCallback() {
    if (this.shadowRoot.innerHTML) this.render();
  }

  // ── Private ────────────────────────────────────────────────

  #bindEvents() {
    const btn = this.#btn;
    if (!btn) return;

    // Forward click to form if type="submit"
    btn.addEventListener('click', (e) => {
      if (this.loading) { e.preventDefault(); return; }

      const type = this.getAttribute('type') ?? 'button';

      if (type === 'submit') {
        this.#internals.form?.requestSubmit();
      }

      if (type === 'reset') {
        this.#internals.form?.reset();
      }
    });
  }

  get #btn() {
    return this.shadowRoot.querySelector('button');
  }

  // ── Public API ─────────────────────────────────────────────

  /** Programmatic click - same as native */
  click() { this.#btn?.click(); }

  /** Focus - same as native */
  focus(opts) { this.#btn?.focus(opts); }

  /** Blur - same as native */
  blur() { this.#btn?.blur(); }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }

  get loading() { return this.hasAttribute('loading'); }
  set loading(v) { v ? this.setAttribute('loading', '') : this.removeAttribute('loading'); }

  // ── Render ─────────────────────────────────────────────────

  render() {
    const variant  = this.getAttribute('variant') ?? 'primary';
    const size     = this.getAttribute('size')    ?? 'md';
    const loading  = this.hasAttribute('loading');
    const disabled = this.hasAttribute('disabled');
    const slot     = '<slot></slot>';

    this.shadowRoot.innerHTML = `
      <style>${this.#styles(variant, size)}</style>
      <button
        class="btn variant-${variant} size-${size} ${loading ? 'loading' : ''}"
        ${disabled || loading ? 'disabled' : ''}
        type="${this.getAttribute('type') ?? 'button'}"
        ${this.getAttribute('name')  ? `name="${this.getAttribute('name')}"` : ''}
        ${this.getAttribute('value') ? `value="${this.getAttribute('value')}"` : ''}
        ${this.hasAttribute('autofocus') ? 'autofocus' : ''}
        aria-busy="${loading}"
        aria-disabled="${disabled || loading}"
      >
        ${loading ? '<span class="spinner" aria-hidden="true"></span>' : ''}
        <span class="label">${slot}</span>
      </button>
    `;

    // Re-bind after innerHTML reset
    this.#bindEvents();
  }

  // ── Styles ─────────────────────────────────────────────────

  #styles(variant, size) {
    return `
      :host {
        display: inline-block;
        /* Inherit from parent so it fits anywhere */
        font-family: inherit;
      }

      :host([hidden]) { display: none; }

      /* ── Base ── */
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        border: none;
        border-radius: 8px;
        font-family: inherit;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s, opacity 0.15s, transform 0.1s;
        white-space: nowrap;
        position: relative;
        outline-offset: 3px;
      }

      .btn:focus-visible {
        outline: 2px solid #6ee7b7;
      }

      .btn:active:not(:disabled) {
        transform: scale(0.97);
      }

      .btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
        transform: none;
      }

      /* ── Sizes ── */
      .size-sm { padding: 0.35rem 0.75rem; font-size: 0.8rem;  }
      .size-md { padding: 0.6rem  1.2rem;  font-size: 0.95rem; }
      .size-lg { padding: 0.8rem  1.6rem;  font-size: 1.05rem; }

      /* ── Variants ── */
      .variant-primary {
        background: #6ee7b7;
        color: #000;
      }
      .variant-primary:hover:not(:disabled) { background: #34d399; }

      .variant-secondary {
        background: #1a1a1a;
        color: #6ee7b7;
        border: 1px solid #6ee7b7;
      }
      .variant-secondary:hover:not(:disabled) { background: #064e3b; }

      .variant-ghost {
        background: transparent;
        color: #6ee7b7;
        border: 1px solid transparent;
      }
      .variant-ghost:hover:not(:disabled) { border-color: #6ee7b7; }

      .variant-danger {
        background: #7f1d1d;
        color: #fca5a5;
        border: 1px solid #ef4444;
      }
      .variant-danger:hover:not(:disabled) { background: #991b1b; }

      .variant-icon {
        background: transparent;
        color: #888;
        border: 1px solid #2a2a2a;
        padding: 0.5rem;
        border-radius: 6px;
      }
      .variant-icon:hover:not(:disabled) { color: #fff; border-color: #555; }

      /* ── Loading spinner ── */
      .loading .label { opacity: 0.4; }

      .spinner {
        width: 0.9em;
        height: 0.9em;
        border: 2px solid currentColor;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
        flex-shrink: 0;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
  }
}

customElements.define('ui-button', UiButton);
