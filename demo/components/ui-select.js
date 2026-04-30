/**
 * ui-select.js
 * Accessible custom select with keyboard navigation and XSS protection.
 * Options via attribute: '[{"value":"a","label":"Option A","icon":"★","disabled":true}]'
 */
import { Component } from '/src/nulldeps.js';
import { escHtml, escAttr, cls } from '/src/utility.js';
import { cssVars, shadow, color } from '/src/theme.js';

// Validate each option object - drop malformed entries
function _sanitizeOptions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter(o => o && typeof o.value !== 'undefined' && typeof o.label === 'string');
}

// Parse options attribute - returns empty array on failure
function _parseOptions(attr) {
  if (!attr) return [];
  try {
    return _sanitizeOptions(JSON.parse(attr));
  } catch {
    console.warn('[ui-select] Invalid JSON in options attribute');
    return [];
  }
}

// Skip disabled options when navigating with keyboard
function _nextEnabled(options, currentIndex, direction) {
  let i = currentIndex + direction;
  while (i >= 0 && i < options.length) {
    if (!options[i].disabled) return options[i];
    i += direction;
  }
  return null;
}

class UiSelect extends Component {

  static get watchedAttributes() {
    return ['label', 'value', 'options', 'disabled', 'error', 'required', 'placeholder'];
  }

  // ---- Lifecycle ----

  onMount() {
    this.initState({
      value:       this.getAttribute('value')       ?? '',
      label:       this.getAttribute('label')       ?? '',
      placeholder: this.getAttribute('placeholder') ?? 'Bitte wählen…',
      disabled:    this.hasAttribute('disabled'),
      required:    this.hasAttribute('required'),
      error:       this.getAttribute('error')       ?? '',
      options:     _parseOptions(this.getAttribute('options')),
      open:        false,
    });

    // Close on outside interaction - composedPath covers shadow DOM
    this._onOutsidePointer = (e) => {
      if (e.composedPath().includes(this)) return;
      if (this.state.open) this.setState({ open: false });
    };
    document.addEventListener('pointerdown', this._onOutsidePointer, { capture: true });
  }

  onDestroy() {
    document.removeEventListener('pointerdown', this._onOutsidePointer, { capture: true });
  }

  onAttributeChange(name, _old, newVal) {
    if (['label', 'placeholder', 'error'].includes(name)) {
      this.setState({ [name]: newVal ?? '' });
      return;
    }
    if (name === 'value') {
      this.setState({ value: newVal ?? '' });
      return;
    }
    if (name === 'options') {
      this.setState({ options: _parseOptions(newVal) });
      return;
    }
    if (['disabled', 'required'].includes(name)) {
      this.setState({ [name]: this.hasAttribute(name) });
    }
  }

  // ---- Actions ----

  toggleDropdown() {
    if (this.state.disabled) return;
    this.setState({ open: !this.state.open });
  }

  selectOption(e) {
    const option = e.target.closest('[role="option"]');
    if (!option) return;
    if (option.dataset.disabled === 'true') return;

    const val = option.dataset.value;
    this._commit(val);
  }

  handleKeydown(e) {
    const { open, options, value, disabled } = this.state;
    if (disabled) return;

    switch (e.key) {

      case 'Enter':
      case ' ':
        e.preventDefault();
        this.setState({ open: !open });
        break;

      case 'Escape':
        e.preventDefault();
        this.setState({ open: false });
        // Return focus to trigger after close
        this.shadowRoot.querySelector('[role="combobox"]')?.focus();
        break;

      case 'ArrowDown': {
        e.preventDefault();
        if (!open) { this.setState({ open: true }); return; }
        const currentIdx = options.findIndex(o => String(o.value) === String(value));
        const next = _nextEnabled(options, currentIdx, +1);
        if (next) this._commit(next.value);
        break;
      }

      case 'ArrowUp': {
        e.preventDefault();
        const currentIdx = options.findIndex(o => String(o.value) === String(value));
        const prev = _nextEnabled(options, currentIdx, -1);
        if (prev) this._commit(prev.value);
        break;
      }

      case 'Home': {
        e.preventDefault();
        const first = _nextEnabled(options, -1, +1);
        if (first) this._commit(first.value);
        break;
      }

      case 'End': {
        e.preventDefault();
        const last = _nextEnabled(options, options.length, -1);
        if (last) this._commit(last.value);
        break;
      }
    }
  }

  // ---- Public API ----

  get value()     { return this.state?.value ?? ''; }
  set value(v)    { this.setAttribute('value', String(v ?? '')); }

  get disabled()  { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }

  setError(msg)   { this.setState({ error: String(msg ?? '') }); }
  clearError()    { this.setState({ error: '' }); }
  setOptions(arr) { this.setState({ options: _sanitizeOptions(arr) }); }

  // ---- Template ----

  template() {
    const { label, placeholder, disabled, required, error, options, open, value } = this.state;

    const selected  = options.find(o => String(o.value) === String(value));
    const display   = selected?.label ?? '';
    const hasError  = error.length > 0;
    const uid       = this._uid;
    const labelId   = `sel-label-${uid}`;
    const errorId   = `sel-error-${uid}`;

    const fieldClass = cls(
      'field',
      hasError  && 'has-error',
      disabled  && 'is-disabled',
      open      && 'is-open',
    );

    return `
      <div class="${fieldClass}">

        ${label ? `
          <label class="label" id="${labelId}">
            ${escHtml(label)}
            ${required
              ? '<span class="required-star" aria-hidden="true">*</span>'
              : ''}
          </label>
        ` : ''}

        <!-- Trigger button -->
        <div
          class="${cls('trigger', open && 'is-open')}"
          role="combobox"
          tabindex="${disabled ? '-1' : '0'}"
          aria-haspopup="listbox"
          aria-expanded="${open}"
          aria-labelledby="${label ? labelId : ''}"
          aria-invalid="${hasError}"
          aria-describedby="${hasError ? errorId : ''}"
          aria-disabled="${disabled}"
          data-action="click:toggleDropdown keydown:handleKeydown"
        >
          <span class="${cls('trigger-label', !display && 'is-placeholder')}">
            ${escHtml(display || placeholder)}
          </span>
          <span class="${cls('chevron', open && 'is-open')}" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4L6 8L10 4" stroke="currentColor"
                stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </div>

        <!-- Option list (conditionally rendered) -->
        ${open ? `
          <div
            class="dropdown"
            role="listbox"
            aria-labelledby="${label ? labelId : ''}"
            data-action="click:selectOption"
          >
            ${options.length === 0
              ? `<div class="empty">Keine Optionen verfügbar</div>`
              : options.map(opt => {
                  const isSelected = String(opt.value) === String(value);
                  const optClass   = cls(
                    'option',
                    isSelected   && 'is-selected',
                    opt.disabled && 'is-disabled',
                  );

                  return `
                    <div
                      class="${optClass}"
                      role="option"
                      aria-selected="${isSelected}"
                      aria-disabled="${!!opt.disabled}"
                      data-value="${escAttr(opt.value)}"
                      data-disabled="${!!opt.disabled}"
                    >
                      ${opt.icon
                        ? `<span class="option-icon" aria-hidden="true">${escHtml(opt.icon)}</span>`
                        : ''}
                      <span class="option-label">${escHtml(opt.label)}</span>
                      ${isSelected ? `
                        <span class="option-check" aria-hidden="true">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="currentColor"
                              stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </span>
                      ` : ''}
                    </div>
                  `;
                }).join('')
            }
          </div>
        ` : ''}

        ${hasError ? `
          <span id="${errorId}" class="error-msg" role="alert">
            ${escHtml(error)}
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
      }

      :host([hidden]) { display: none; }

      *, *::before, *::after { box-sizing: border-box; }

      /* ---- Field ---- */
      .field {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        position: relative;
      }

      /* ---- Label ---- */
      .label {
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        display: flex;
        gap: var(--spacing-xs);
        align-items: center;
        cursor: default;
      }

      .required-star {
        color: var(--color-error-light);
        font-size: var(--font-size-md);
        line-height: 1;
      }

      /* ---- Trigger ---- */
      .trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm) var(--spacing-lg);
        background: var(--color-bg);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        color: var(--color-text-primary);
        font-size: var(--font-size-base);
        font-family: inherit;
        cursor: pointer;
        outline: none;
        transition:
          border-color var(--transition-base),
          box-shadow   var(--transition-base);
        user-select: none;
      }

      .trigger:focus-visible,
      .trigger:focus {
        border-color: var(--color-brand);
        box-shadow: var(--shadow-focus-brand);
      }

      .trigger.is-open {
        border-color: var(--color-brand);
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
      }

      .field.has-error .trigger {
        border-color: var(--color-error);
        box-shadow: none;
      }

      .field.has-error .trigger:focus-visible {
        box-shadow: var(--shadow-focus-error);
      }

      .field.is-disabled .trigger {
        opacity: 0.4;
        cursor: not-allowed;
        pointer-events: none;
      }

      .field.is-disabled .label {
        opacity: 0.4;
      }

      /* ---- Trigger label ---- */
      .trigger-label {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .trigger-label.is-placeholder {
        color: var(--color-text-disabled);
      }

      /* ---- Chevron ---- */
      .chevron {
        color: var(--color-text-muted);
        flex-shrink: 0;
        display: flex;
        align-items: center;
        transition: transform var(--transition-base);
      }

      .chevron.is-open {
        transform: rotate(180deg);
        color: var(--color-brand);
      }

      /* ---- Dropdown ---- */
      .dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--color-bg);
        border: 1px solid var(--color-brand);
        border-top: none;
        border-bottom-left-radius: var(--radius-md);
        border-bottom-right-radius: var(--radius-md);
        z-index: 100;
        max-height: 240px;
        overflow-y: auto;
        box-shadow: var(--shadow-dropdown);
        scrollbar-width: thin;
        scrollbar-color: var(--color-border) transparent;
      }

      .dropdown::-webkit-scrollbar       { width: 4px; }
      .dropdown::-webkit-scrollbar-track { background: transparent; }
      .dropdown::-webkit-scrollbar-thumb {
        background: var(--color-border);
        border-radius: var(--radius-xs);
      }

      /* ---- Option ---- */
      .option {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-sm) var(--spacing-lg);
        font-size: var(--font-size-md);
        color: var(--color-text-secondary);
        cursor: pointer;
        transition:
          background var(--transition-fast),
          color      var(--transition-fast);
        border-bottom: 1px solid var(--color-bg-hover);
      }

      .option:last-child { border-bottom: none; }

      .option:hover:not(.is-disabled) {
        background: var(--color-bg-hover);
        color: var(--color-text-primary);
      }

      .option.is-selected {
        color: var(--color-brand);
        background: var(--color-brand-subtle);
      }

      .option.is-disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }

      .option-icon {
        font-size: var(--font-size-base);
        flex-shrink: 0;
        line-height: 1;
      }

      .option-label {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .option-check {
        color: var(--color-brand);
        flex-shrink: 0;
        display: flex;
        align-items: center;
      }

      /* ---- Empty state ---- */
      .empty {
        padding: var(--spacing-lg);
        text-align: center;
        color: var(--color-text-disabled);
        font-size: var(--font-size-sm);
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

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .trigger, .chevron, .option { transition: none; }
      }
    `;
  }

  // ---- Private ----

  /** Commit a value change - update state + emit event */
  _commit(val) {
    const strVal = String(val ?? '');
    this.setState({ value: strVal, open: false });
    // Reflect to attribute for form interop
    this.setAttribute('value', strVal);
    this.emit('ui-select:change', { value: strVal });
  }

  get _uid() {
    if (!this.__uid) this.__uid = Math.random().toString(36).slice(2, 8);
    return this.__uid;
  }
}

customElements.define('ui-select', UiSelect);
