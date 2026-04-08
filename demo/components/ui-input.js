/**
 * ui-input.js
 * A fully-featured input web component matching the NullDeps framework pattern
 * Supports: label, placeholder, value, type, disabled, error, required, readonly
 */
import { Component } from '/src/nulldeps.js';

class UiInput extends Component {

  static get watchedAttributes() {
    return ['label', 'placeholder', 'value', 'type', 'disabled', 'error', 'required', 'readonly'];
  }

  onMount() {
    this.initState({
      value:       this.getAttribute('value')       ?? '',
      label:       this.getAttribute('label')       ?? '',
      placeholder: this.getAttribute('placeholder') ?? '',
      type:        this.getAttribute('type')        ?? 'text',
      disabled:    this.hasAttribute('disabled'),
      required:    this.hasAttribute('required'),
      readonly:    this.hasAttribute('readonly'),
      error:       this.getAttribute('error')       ?? '',
      focused:     false,
    });
  }

  onAttributeChange(name, _old, newVal) {
    // Sync attribute changes into state
    if (['label', 'placeholder', 'type', 'error'].includes(name)) {
      this.setState({ [name]: newVal ?? '' });
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

    const value = input.value;
    // Update internal state without re-rendering (avoids cursor jump)
    this.#state_value = value;

    this.emit('ui-input:change', { value });
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

  /** Get current value - usable from parent components */
  getValue() {
    return this.shadowRoot?.querySelector('input')?.value ?? this.state.value;
  }

  /** Set value programmatically */
  setValue(val) {
    this.setState({ value: val });
    this.emit('ui-input:change', { value: val });
  }

  /** Set error from outside */
  setError(msg) {
    this.setState({ error: msg });
  }

  clearError() {
    this.setState({ error: '' });
  }

  // ---- Internal value tracking (no re-render on every keystroke) ----
  #state_value = '';

  afterRender() {
    // Restore value after render without losing cursor position
    const input = this.shadowRoot?.querySelector('input');
    if (input && document.activeElement !== input) {
      input.value = this.state.value;
    }
    // Sync internal tracker
    this.#state_value = this.state.value;
  }

  // ---- Template ----

  template() {
    const { label, placeholder, type, disabled, required, readonly, error, focused, value } = this.state;

    const inputId    = `input-${this._uid}`;
    const hasError   = !!error;
    const isDisabled = disabled ? 'disabled' : '';
    const isReadonly = readonly ? 'readonly' : '';
    const isRequired = required ? 'required' : '';

    return `
      <div class="field ${hasError ? 'has-error' : ''} ${focused ? 'focused' : ''} ${disabled ? 'is-disabled' : ''}">

        ${label ? `
          <label for="${inputId}" class="label">
            ${label}
            ${required ? '<span class="required-star" aria-hidden="true">*</span>' : ''}
          </label>
        ` : ''}

        <div class="input-wrap">
          <input
            id="${inputId}"
            class="input"
            type="${type}"
            placeholder="${placeholder}"
            value="${this.#escAttr(value)}"
            ${isDisabled}
            ${isReadonly}
            ${isRequired}
            aria-invalid="${hasError}"
            aria-describedby="${hasError ? `${inputId}-error` : ''}"
            data-action="input:handleInput focus:handleFocus blur:handleBlur"
          />
        </div>

        ${hasError ? `
          <span id="${inputId}-error" class="error-msg" role="alert">
            ${error}
          </span>
        ` : ''}

      </div>
    `;
  }

  styles() {
    return `
      :host {
        display: block;
        width: 100%;
      }

      /* ---- Field wrapper ---- */
      .field {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }

      /* ---- Label ---- */
      .label {
        font-size: 0.8rem;
        font-weight: 500;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        display: flex;
        gap: 0.2rem;
        align-items: center;
        cursor: default;
      }

      .required-star {
        color: #f87171;
        font-size: 0.9rem;
        line-height: 1;
      }

      /* ---- Input wrap (for future prefix/suffix icons) ---- */
      .input-wrap {
        position: relative;
        display: flex;
        align-items: center;
      }

      /* ---- Input ---- */
      .input {
        width: 100%;
        padding: 0.6rem 1rem;
        background: #111;
        border: 1px solid #2a2a2a;
        border-radius: 8px;
        color: #fff;
        font-size: 0.95rem;
        font-family: inherit;
        line-height: 1.5;
        outline: none;
        transition: border-color 0.15s, box-shadow 0.15s;
        box-sizing: border-box;
        -webkit-appearance: none;
      }

      .input::placeholder {
        color: #444;
      }

      /* Focus */
      .field.focused .input,
      .input:focus {
        border-color: #6ee7b7;
        box-shadow: 0 0 0 3px rgba(110, 231, 183, 0.08);
      }

      /* Error */
      .field.has-error .input {
        border-color: #ef4444;
        box-shadow: none;
      }

      .field.has-error.focused .input,
      .field.has-error .input:focus {
        border-color: #ef4444;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
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
        color: #888;
        cursor: default;
      }

      /* Error message */
      .error-msg {
        font-size: 0.78rem;
        color: #f87171;
        display: flex;
        align-items: center;
        gap: 0.3rem;
        line-height: 1.4;
      }

      .error-msg::before {
        content: '⚠';
        font-size: 0.72rem;
      }

      /* ---- Type: number - hide arrows ---- */
      .input[type='number']::-webkit-inner-spin-button,
      .input[type='number']::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      .input[type='number'] { -moz-appearance: textfield; }

      /* ---- Type: password placeholder dots ---- */
      .input[type='password'] {
        letter-spacing: 0.1em;
      }
    `;
  }

  // ---- Private helpers ----

  /** Unique ID per instance for label/aria linking */
  get _uid() {
    if (!this.__uid) this.__uid = Math.random().toString(36).slice(2, 8);
    return this.__uid;
  }

  /** Escape attribute value to prevent XSS in value="..." */
  #escAttr(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

customElements.define('ui-input', UiInput);
