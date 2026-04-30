/**
 * ui-checkbox.js
 * Secure checkbox web component with full XSS protection and design tokens.
 * Supports: label, checked, disabled, error, required, indeterminate
 * Emits: ui-checkbox:change with { checked, value }
 */
import { Component } from '/src/nulldeps.js';
import { escHtml, escAttr, cls } from '/src/utility.js';
import { cssVars, shadow, color } from '/src/theme.js';

class UiCheckbox extends Component {

  static get watchedAttributes() {
    return ['label', 'checked', 'disabled', 'error', 'required', 'indeterminate', 'value'];
  }

  onMount() {
    this.initState({
      checked:       this.hasAttribute('checked'),
      indeterminate: this.hasAttribute('indeterminate'),
      disabled:      this.hasAttribute('disabled'),
      required:      this.hasAttribute('required'),
      label:         this.getAttribute('label') ?? '',
      error:         this.getAttribute('error') ?? '',
      value:         this.getAttribute('value') ?? '',
    });
  }

  onAttributeChange(name, _old, newVal) {
    if (['label', 'error', 'value'].includes(name)) {
      this.setState({ [name]: newVal ?? '' });
    }
    if (['checked', 'disabled', 'required', 'indeterminate'].includes(name)) {
      this.setState({ [name]: this.hasAttribute(name) });
    }
  }

  // ---- Actions ----

  toggle() {
    if (this.state.disabled) return;

    const newChecked = !this.state.checked;

    this.setState({
      checked:       newChecked,
      indeterminate: false, // toggle always clears indeterminate (native behavior)
    });

    // Reflect to attribute for form/CSS interop
    if (newChecked) this.setAttribute('checked', '');
    else            this.removeAttribute('checked');

    this.emit('ui-checkbox:change', {
      checked: newChecked,
      value:   this.state.value,
    });
  }

  handleKeydown(e) {
    // Space/Enter toggle - matches native checkbox + button semantics
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this.toggle();
    }
  }

  // ---- Public API ----

  get checked()   { return this.state?.checked ?? false; }
  set checked(v)  { v ? this.setAttribute('checked', '') : this.removeAttribute('checked'); }

  get disabled()  { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }

  get value()     { return this.state?.value ?? ''; }
  set value(v)    { this.setAttribute('value', String(v ?? '')); }

  // ---- Template ----

  template() {
    const { checked, indeterminate, disabled, required, label, error, value } = this.state;

    const hasError = error.length > 0;

    const wrapperClass = cls('wrapper', disabled && 'is-disabled');
    const boxClass     = cls(
      'box',
      checked       && 'is-checked',
      indeterminate && 'is-indeterminate',
      disabled      && 'is-disabled',
      hasError      && 'is-error',
    );
    const labelClass = cls('label', required && 'is-required');

    // Sanitize all user-controlled values
    const safeLabel = escHtml(label);
    const safeError = escHtml(error);
    const safeValue = escAttr(value);

    const ariaChecked = indeterminate ? 'mixed' : String(checked);

    return `
      <div
        class="${wrapperClass}"
        role="checkbox"
        aria-checked="${ariaChecked}"
        aria-disabled="${disabled}"
        aria-required="${required}"
        tabindex="${disabled ? -1 : 0}"
        data-value="${safeValue}"
        data-action="click:toggle keydown:handleKeydown"
      >
        <div class="${boxClass}">
          ${indeterminate
            ? `<svg class="icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                 <line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
               </svg>`
            : checked
              ? `<svg class="icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                   <polyline points="2.5,8 6.5,12 13.5,4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                 </svg>`
              : ''
          }
        </div>

        ${label
          ? `<span class="${labelClass}">${safeLabel}</span>`
          : '<slot></slot>'
        }
      </div>

      ${hasError
        ? `<span class="error-msg" role="alert">${safeError}</span>`
        : ''
      }
    `;
  }

  // ---- Styles ----

  styles() {
    return `
      :host {
        ${cssVars()}
        display: inline-flex;
        flex-direction: column;
        gap: var(--spacing-xs);
        font-family: inherit;
      }

      :host([hidden]) { display: none; }

      *, *::before, *::after { box-sizing: border-box; }

      /* ---- Wrapper ---- */
      .wrapper {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-md);
        cursor: pointer;
        user-select: none;
        outline: none;
        border-radius: var(--radius-sm);
        padding: 2px;
        transition: opacity var(--transition-slow);
      }

      .wrapper:focus-visible .box {
        box-shadow: ${shadow.focus('var(--color-brand-glow)')};
      }

      .wrapper.is-disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      /* ---- Box ---- */
      .box {
        width: 1.2rem;
        height: 1.2rem;
        flex-shrink: 0;
        border-radius: var(--radius-sm);
        border: 2px solid var(--color-border-hover);
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        transition:
          border-color var(--transition-base),
          background   var(--transition-base);
      }

      .box.is-checked,
      .box.is-indeterminate {
        border-color: var(--color-brand);
        background:   var(--color-brand);
        color: #000;
      }

      .box.is-error {
        border-color: var(--color-error-light);
      }

      .wrapper:hover:not(.is-disabled) .box:not(.is-checked):not(.is-indeterminate) {
        border-color: var(--color-brand);
      }

      /* ---- Icon ---- */
      .icon {
        width: 0.75rem;
        height: 0.75rem;
        display: block;
      }

      /* ---- Label ---- */
      .label {
        font-size: var(--font-size-md);
        color: var(--color-text-secondary);
        line-height: var(--font-line-height);
      }

      .label.is-required::after {
        content: ' *';
        color: var(--color-error-light);
      }

      /* ---- Error ---- */
      .error-msg {
        font-size: var(--font-size-sm);
        color: var(--color-error-light);
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        line-height: var(--font-line-height);
        padding-left: 1.85rem; /* align with label - box width + gap, no token needed */
      }

      .error-msg::before {
        content: '⚠';
        font-size: var(--font-size-xs);
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .wrapper, .box { transition: none; }
      }
    `;
  }
}

customElements.define('ui-checkbox', UiCheckbox);
