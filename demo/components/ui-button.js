/**
 * ui-button.js
 * Form-associated button web component with XSS protection and design tokens.
 */
import { Component } from '/src/nulldeps.js';
import { escAttr, whitelist, cls } from '/src/utility.js';
import { color, radius, font, transition, spacing, shadow, cssVars } from '/src/theme.js';

// Whitelists - prevent attribute injection
const ALLOWED_VARIANTS = new Set(['primary', 'secondary', 'ghost', 'danger', 'icon']);
const ALLOWED_SIZES    = new Set(['sm', 'md', 'lg']);
const ALLOWED_TYPES    = new Set(['button', 'submit', 'reset']);

class UiButton extends Component {

  // Form-associated custom element - native form participation
  static formAssociated = true;

  #internals;

  static get watchedAttributes() {
    return [
      'variant', 'size', 'loading', 'disabled',
      'type', 'name', 'value', 'form', 'autofocus'
    ];
  }

  constructor() {
    super();
    this.#internals = this.attachInternals();
  }

  onMount() {
    this.initState({
      variant:   whitelist(this.getAttribute('variant'), ALLOWED_VARIANTS, 'primary'),
      size:      whitelist(this.getAttribute('size'),    ALLOWED_SIZES,    'md'),
      type:      whitelist(this.getAttribute('type'),    ALLOWED_TYPES,    'button'),
      name:      this.getAttribute('name')  ?? '',
      value:     this.getAttribute('value') ?? '',
      loading:   this.hasAttribute('loading'),
      disabled:  this.hasAttribute('disabled'),
      autofocus: this.hasAttribute('autofocus'),
    });
  }

  onAttributeChange(name, _old, newVal) {
    switch (name) {
      case 'variant':
        this.setState({ variant: whitelist(newVal, ALLOWED_VARIANTS, 'primary') });
        break;
      case 'size':
        this.setState({ size: whitelist(newVal, ALLOWED_SIZES, 'md') });
        break;
      case 'type':
        this.setState({ type: whitelist(newVal, ALLOWED_TYPES, 'button') });
        break;
      case 'name':
      case 'value':
        this.setState({ [name]: newVal ?? '' });
        break;
      case 'loading':
      case 'disabled':
      case 'autofocus':
        this.setState({ [name]: this.hasAttribute(name) });
        break;
    }
  }

  // ---- Actions ----

  handleClick(e) {
    if (this.state.loading || this.state.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const { type } = this.state;
    const form = this.#internals.form;

    if (type === 'submit') form?.requestSubmit();
    if (type === 'reset')  form?.reset();

    this.emit('ui-button:click', { type });
  }

  // ---- Public API ----

  click()     { this.#btn?.click(); }
  focus(opts) { this.#btn?.focus(opts); }
  blur()      { this.#btn?.blur(); }

  get disabled()  { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }

  get loading()   { return this.hasAttribute('loading'); }
  set loading(v)  { v ? this.setAttribute('loading', '') : this.removeAttribute('loading'); }

  get #btn() {
    return this.shadowRoot?.querySelector('button');
  }

  // ---- Template ----

  template() {
    const { variant, size, type, name, value, loading, disabled, autofocus } = this.state;

    const isInactive = loading || disabled;

    const btnClass = cls(
      'btn',
      `variant-${variant}`,
      `size-${size}`,
      loading && 'loading'
    );

    return `
      <button
        class="${btnClass}"
        type="${type}"
        ${name  ? `name="${escAttr(name)}"`   : ''}
        ${value ? `value="${escAttr(value)}"` : ''}
        ${isInactive ? 'disabled' : ''}
        ${autofocus  ? 'autofocus' : ''}
        aria-busy="${loading}"
        aria-disabled="${isInactive}"
        data-action="click:handleClick"
      >
        ${loading ? '<span class="spinner" aria-hidden="true"></span>' : ''}
        <span class="label"><slot></slot></span>
      </button>
    `;
  }

  // ---- Styles ----

  styles() {
    return `
      :host {
        ${cssVars()}
        display: inline-block;
        font-family: inherit;
      }

      :host([hidden]) { display: none; }

      *, *::before, *::after { box-sizing: border-box; }

      /* ── Base ── */
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
        border: none;
        border-radius: var(--radius-md);
        font-family: inherit;
        font-weight: var(--font-weight-semibold);
        cursor: pointer;
        transition:
          background     var(--transition-base),
          opacity        var(--transition-base),
          transform      var(--transition-fast),
          border-color   var(--transition-base),
          color          var(--transition-base);
        white-space: nowrap;
        position: relative;
        outline-offset: 3px;
      }

      .btn:focus-visible {
        outline: 2px solid var(--color-brand);
        box-shadow: ${shadow.focus('var(--color-brand-focus)')};
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
      .size-sm { padding: 0.35rem 0.75rem; font-size: var(--font-size-sm);   }
      .size-md { padding: var(--spacing-md) var(--spacing-xl); font-size: var(--font-size-base); }
      .size-lg { padding: 0.8rem  1.6rem;  font-size: var(--font-size-lg);   }

      /* ── Variants ── */
      .variant-primary {
        background: var(--color-brand);
        color: #000;
      }
      .variant-primary:hover:not(:disabled) {
        background: var(--color-success);
      }

      .variant-secondary {
        background: var(--color-bg-hover);
        color: var(--color-brand);
        border: 1px solid var(--color-brand);
      }
      .variant-secondary:hover:not(:disabled) {
        background: var(--color-brand-bg);
      }

      .variant-ghost {
        background: transparent;
        color: var(--color-brand);
        border: 1px solid transparent;
      }
      .variant-ghost:hover:not(:disabled) {
        border-color: var(--color-brand);
        background: var(--color-brand-focus);
      }

      .variant-danger {
        background: #7f1d1d;
        color: #fca5a5;
        border: 1px solid var(--color-error);
      }
      .variant-danger:hover:not(:disabled) {
        background: #991b1b;
      }

      .variant-icon {
        background: transparent;
        color: var(--color-text-muted);
        border: 1px solid var(--color-border);
        padding: var(--spacing-md);
        border-radius: var(--radius-sm);
      }
      .variant-icon:hover:not(:disabled) {
        color: var(--color-text-primary);
        border-color: var(--color-border-hover);
      }

      /* ── Loading ── */
      .loading .label { opacity: 0.4; }

      .spinner {
        width: 0.9em;
        height: 0.9em;
        border: 2px solid currentColor;
        border-top-color: transparent;
        border-radius: var(--radius-full);
        animation: spin 0.6s linear infinite;
        flex-shrink: 0;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .btn { transition: none; }
        .btn:active:not(:disabled) { transform: none; }
        .spinner { animation-duration: 1.5s; }
      }
    `;
  }
}

customElements.define('ui-button', UiButton);
