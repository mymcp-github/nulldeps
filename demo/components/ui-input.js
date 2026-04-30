/**
 * ui-input.js
 * Secure input web component with full XSS protection and design tokens.
 */
import { Component } from '/src/nulldeps.js';
import { escHtml, escAttr, whitelist, uid, cls } from '/src/utility.js';
import { cssVars, shadow, color } from '/src/theme.js';

// Whitelist of allowed input types - prevents type-confusion attacks
const ALLOWED_TYPES = new Set([
  'text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date'
]);

class UiInput extends Component {

  // Internal value tracker - declared at top
  #lastValue = '';

  // Per-instance unique ID for label/aria linking
  #uid = uid('input');

  static get watchedAttributes() {
    return ['label', 'placeholder', 'value', 'type', 'disabled', 'error', 'required', 'readonly'];
  }

  onMount() {
    this.initState({
      value:       this.getAttribute('value')       ?? '',
      label:       this.getAttribute('label')       ?? '',
      placeholder: this.getAttribute('placeholder') ?? '',
      type:        whitelist(this.getAttribute('type'), ALLOWED_TYPES, 'text'),
      disabled:    this.hasAttribute('disabled'),
      required:    this.hasAttribute('required'),
      readonly:    this.hasAttribute('readonly'),
      error:       this.getAttribute('error')       ?? '',
      focused:     false,
    });
  }

  onAttributeChange(name, _old, newVal) {
    if (['label', 'placeholder', 'error'].includes(name)) {
      this.setState({ [name]: newVal ?? '' });
    }
    if (name === 'type') {
      this.setState({ type: whitelist(newVal, ALLOWED_TYPES, 'text') });
    }
    if (name === 'value') {
      this.setState({ value: newVal ?? '' });
    }
    if (['disabled', 'required', 'readonly'].includes(name)) {
      this.setState({ [name]: this.hasAttribute(name) });
    }
  }

  // ---- Actions ----

  handleInput(e) {
    const input = e.target.closest('input');
    if (!input) return;
    // Track value without re-render to keep cursor position
    this.#lastValue = input.value;
    this.emit('ui-input:change', { value: input.value });
  }

  handleFocus() {
    this.setState({ focused: true });
  }

  handleBlur(e) {
    const input = e.target.closest('input');
    const value = input?.value ?? this.state.value;
    this.setState({ focused: false, value });
    this.emit('ui-input:blur', { value });
  }

  // ---- Public API ----

  getValue() {
    return this.shadowRoot?.querySelector('input')?.value ?? this.state.value;
  }

  setValue(val) {
    this.setState({ value: String(val ?? '') });
    this.emit('ui-input:change', { value: this.state.value });
  }

  setError(msg) {
    this.setState({ error: String(msg ?? '') });
  }

  clearError() {
    this.setState({ error: '' });
  }

  afterRender() {
    // shadowRoot.activeElement - document.activeElement would point to host
    const input = this.shadowRoot?.querySelector('input');
    if (input && this.shadowRoot.activeElement !== input) {
      input.value = this.state.value;
    }
    this.#lastValue = this.state.value;
  }

  // ---- Template ----

  template() {
    const { label, placeholder, type, disabled, required, readonly, error, focused, value } = this.state;

    const inputId  = this.#uid;
    const errorId  = `${inputId}-error`;
    const hasError = !!error;

    // Sanitize ALL interpolated values
    const safeLabel       = escHtml(label);
    const safePlaceholder = escAttr(placeholder);
    const safeType        = whitelist(type, ALLOWED_TYPES, 'text');
    const safeValue       = escAttr(value);
    const safeError       = escHtml(error);

    const fieldClass = cls(
      'field',
      hasError && 'has-error',
      focused  && 'focused',
      disabled && 'is-disabled'
    );

    return `
      <div class="${fieldClass}">

        ${label ? `
          <label for="${inputId}" class="label">
            ${safeLabel}
            ${required ? '<span class="required-star" aria-hidden="true">*</span>' : ''}
          </label>
        ` : ''}

        <div class="input-wrap">
          <input
            id="${inputId}"
            class="input"
            type="${safeType}"
            placeholder="${safePlaceholder}"
            value="${safeValue}"
            ${disabled ? 'disabled' : ''}
            ${readonly ? 'readonly' : ''}
            ${required ? 'required' : ''}
            aria-invalid="${hasError}"
            ${hasError ? `aria-describedby="${errorId}"` : ''}
            data-action="input:handleInput focus:handleFocus blur:handleBlur"
          />
        </div>

        ${hasError ? `
          <span id="${errorId}" class="error-msg" role="alert">
            ${safeError}
          </span>
        ` : ''}

      </div>
    `;
  }

  // ---- Styles ----

  styles() {
    return `
      :host {
        ${cssVars()}
        display: block;
        width: 100%;
        font-family: inherit;
        color: var(--color-text-primary);
      }

      *, *::before, *::after { box-sizing: border-box; }

      /* ---- Field wrapper ---- */
      .field {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        width: 100%;
      }

      /* ---- Label ---- */
      .label {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-secondary);
        line-height: 1.3;
        user-select: none;
      }

      .required-star {
        color: var(--color-error);
        margin-left: var(--spacing-xs);
      }

      /* ---- Input wrap ---- */
      .input-wrap {
        position: relative;
        display: flex;
        width: 100%;
      }

      /* ---- Input ---- */
      .input {
        width: 100%;
        padding: var(--spacing-sm) var(--spacing-lg);
        background: var(--color-bg);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        color: var(--color-text-primary);
        font-size: var(--font-size-base);
        font-family: inherit;
        line-height: 1.5;
        outline: none;
        transition:
          border-color var(--transition-base),
          box-shadow   var(--transition-base);
        -webkit-appearance: none;
      }

      .input::placeholder {
        color: var(--color-text-disabled);
      }

      /* Focus */
      .field.focused .input,
      .input:focus {
        border-color: var(--color-brand);
        box-shadow: ${shadow.focus('var(--color-brand-focus)')};
      }

      /* Error */
      .field.has-error .input {
        border-color: var(--color-error);
        box-shadow: none;
      }

      .field.has-error.focused .input,
      .field.has-error .input:focus {
        border-color: var(--color-error);
        box-shadow: ${shadow.focus('var(--color-error-focus)')};
      }

      /* Disabled */
      .field.is-disabled .input {
        opacity: 0.4;
        cursor: not-allowed;
        user-select: none;
      }

      .field.is-disabled .label {
        opacity: 0.4;
      }

      /* Readonly */
      .input:read-only:not(:disabled) {
        background: #0d0d0d;
        color: var(--color-text-muted);
        cursor: default;
      }

      /* ---- Error message ---- */
      .error-msg {
        font-size: var(--font-size-sm);
        color: var(--color-error-light);
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        line-height: var(--font-line-height);
      }

      .error-msg::before {
        content: '⚠';
        font-size: var(--font-size-xs);
      }

      /* ---- Type: number - hide spin buttons ---- */
      .input[type='number']::-webkit-inner-spin-button,
      .input[type='number']::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      .input[type='number'] {
        -moz-appearance: textfield;
      }

      /* ---- Type: password - wider letter spacing for dots ---- */
      .input[type='password'] {
        letter-spacing: var(--font-letter-spacing);
      }
    `;
  }
}

customElements.define('ui-input', UiInput);
