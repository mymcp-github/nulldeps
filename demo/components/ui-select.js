/**
 * ui-select.js
 * A fully-featured select web component matching the NullDeps framework pattern
 * Supports: label, placeholder, options (attr + slot), disabled, error, required
 * Options format via attribute: '[{"value":"a","label":"Option A"}]'
 */
import { Component } from '/src/nulldeps.js';

class UiSelect extends Component {

    static get watchedAttributes() {
        return ['label', 'value', 'options', 'disabled', 'error', 'required', 'placeholder'];
    }

    onMount() {
        this.initState({
            value:       this.getAttribute('value')       ?? '',
            label:       this.getAttribute('label')       ?? '',
            placeholder: this.getAttribute('placeholder') ?? 'Bitte wählen…',
            disabled:    this.hasAttribute('disabled'),
            required:    this.hasAttribute('required'),
            error:       this.getAttribute('error')       ?? '',
            options:     this.#parseOptions(),
            open:        false,
            focused:     false,
        });

        console.log('init UiSelect');
        

        // Close dropdown on outside click
        this._outsideClick = (e) => {
            // Check if click is inside shadow DOM
            const path = e.composedPath();
            if (path.includes(this)) return; // ← composedPath statt contains
            this.setState({ open: false, focused: false });
        };
        document.addEventListener('pointerdown', this._outsideClick);
    }

    onDestroy() {
        document.removeEventListener('pointerdown', this._outsideClick);
    }

    onAttributeChange(name, _old, newVal) {
        if (['label', 'placeholder', 'error'].includes(name)) {
            this.setState({ [name]: newVal ?? '' });
        }
        if (name === 'value') {
            this.setState({ value: newVal ?? '' });
        }
        if (name === 'options') {
            this.setState({ options: this.#parseOptions() });
        }
        if (['disabled', 'required'].includes(name)) {
            this.setState({ [name]: this.hasAttribute(name) });
        }

        this.shadowRoot.addEventListener('click', (e) => {
            console.log('shadowRoot click:', e.target, e.composedPath());
        });

    }

    // ---- Actions ----

    toggleDropdown(e) {
        console.log('toggleDropdown target:', e.target.className);
        console.log('closest dropdown:', this.shadowRoot.querySelector('.dropdown')?.contains(e.target));
        console.log('current open state:', this.state.open);

        if (this.shadowRoot.querySelector('.dropdown')?.contains(e.target)) return;
        if (this.state.disabled) return;
        this.setState({ open: !this.state.open, focused: true });
    }

    selectOption(e) {
        console.log('selectOption fired, target:', e.target.className);
        e.stopPropagation();

        const option = e.target.closest('.option');
        console.log('found option:', option?.dataset.value);

        if (!option) return;
        if (option.classList.contains('is-disabled')) return;

        const val = option.dataset.value;
        this.setState({ value: val, open: false, focused: false });

        this.dispatchEvent(new CustomEvent('change', {
            detail: { value: val },
            bubbles: true,
            composed: true
        }));
    }


    handleKeydown(e) {
        const { open, options, value, disabled } = this.state;
        if (disabled) return;

            const currentIndex = options.findIndex(o => o.value === value);

            switch (e.key) {
                case 'Enter':
                case ' ':
                e.preventDefault();
                this.setState({ open: !open });
                break;

                case 'Escape':
                this.setState({ open: false });
                break;

                case 'ArrowDown': {
                e.preventDefault();
                if (!open) { this.setState({ open: true }); return; }
                const next = options[currentIndex + 1];
                if (next) {
                    this.setState({ value: next.value });
                    this.emit('ui-select:change', { value: next.value });
                }
                break;
                }

                case 'ArrowUp': {
                e.preventDefault();
                const prev = options[currentIndex - 1];
                if (prev) {
                    this.setState({ value: prev.value });
                    this.emit('ui-select:change', { value: prev.value });
                }
                break;
                }
            }
    }

    // ---- Public API ----

    getValue() {
    return this.state.value;
    }

    setValue(val) {
    this.setState({ value: val, error: '' });
    this.emit('ui-select:change', { value: val });
    }

    setError(msg) {
    this.setState({ error: msg });
    }

    clearError() {
    this.setState({ error: '' });
    }

    setOptions(options) {
    this.setState({ options });
    }

    // ---- Template ----

    template() {
    const { label, placeholder, disabled, required, error, options, open, focused, value } = this.state;

    const selectedOption = options.find(o => o.value === value);
    const displayLabel   = selectedOption?.label ?? '';
    const hasError       = !!error;
    const selectId       = `select-${this._uid}`;

    return `
        <div
        class="field ${hasError ? 'has-error' : ''} ${focused ? 'focused' : ''} ${disabled ? 'is-disabled' : ''}"
        >

        ${label ? `
            <label class="label" id="${selectId}-label">
            ${label}
            ${required ? '<span class="required-star" aria-hidden="true">*</span>' : ''}
            </label>
        ` : ''}

        <!-- Trigger -->
        <div
            class="trigger ${open ? 'is-open' : ''}"
            role="combobox"
            tabindex="${disabled ? '-1' : '0'}"
            aria-haspopup="listbox"
            aria-expanded="${open}"
            aria-labelledby="${selectId}-label"
            aria-invalid="${hasError}"
            aria-describedby="${hasError ? `${selectId}-error` : ''}"
            data-action="click:toggleDropdown keydown:handleKeydown"
        >
            <span class="trigger-label ${!displayLabel ? 'is-placeholder' : ''}">
            ${displayLabel || placeholder}
            </span>
            <span class="chevron ${open ? 'is-open' : ''}" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            </span>
        </div>

        <!-- Dropdown -->
        ${open ? `
            <div
            class="dropdown"
            role="listbox"
            aria-labelledby="${selectId}-label"
             data-action="click:selectOption"
            >
            ${options.length === 0 ? `
                <div class="empty">Keine Optionen verfügbar</div>
            ` : options.map(opt => `
                <div
                    class="option ${String(opt.value) === String(value) ? 'is-selected' : ''} ${opt.disabled ? 'is-disabled' : ''}"
                    role="option"
                    aria-selected="${String(opt.value) === String(value)}"
                    data-value="${this.#escAttr(opt.value)}"
                   
                    
                    ${opt.disabled ? 'aria-disabled="true"' : ''}
                >
                    ${opt.icon ? `<span class="option-icon" aria-hidden="true">${opt.icon}</span>` : ''}
                    <span class="option-label">${opt.label}</span>
                    ${String(opt.value) === String(value) ? `
                    <span class="option-check" aria-hidden="true">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </span>
                    ` : ''}
                </div>
            `).join('')}
            </div>
        ` : ''}

        ${hasError ? `
            <span id="${selectId}-error" class="error-msg" role="alert">
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
        position: relative;
      }

      /* ---- Field ---- */
      .field {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        position: relative;
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

      /* ---- Trigger ---- */
      .trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0.6rem 1rem;
        background: #111;
        border: 1px solid #2a2a2a;
        border-radius: 8px;
        color: #fff;
        font-size: 0.95rem;
        font-family: inherit;
        cursor: pointer;
        outline: none;
        transition: border-color 0.15s, box-shadow 0.15s;
        user-select: none;
        box-sizing: border-box;
      }

      .trigger:focus,
      .field.focused .trigger {
        border-color: #6ee7b7;
        box-shadow: 0 0 0 3px rgba(110, 231, 183, 0.08);
      }

      .trigger.is-open {
        border-color: #6ee7b7;
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
      }

      .field.has-error .trigger {
        border-color: #ef4444;
        box-shadow: none;
      }

      .field.has-error.focused .trigger {
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
      }

      .field.is-disabled .trigger {
        opacity: 0.4;
        cursor: not-allowed;
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
        color: #444;
      }

      /* ---- Chevron ---- */
      .chevron {
        color: #555;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        transition: transform 0.15s;
      }

      .chevron.is-open {
        transform: rotate(180deg);
        color: #6ee7b7;
      }

      /* ---- Dropdown ---- */
      .dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: #111;
        border: 1px solid #6ee7b7;
        border-top: none;
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;
        z-index: 100;
        max-height: 240px;
        overflow-y: auto;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);

        /* Scrollbar */
        scrollbar-width: thin;
        scrollbar-color: #2a2a2a transparent;
      }

      .dropdown::-webkit-scrollbar       { width: 4px; }
      .dropdown::-webkit-scrollbar-track { background: transparent; }
      .dropdown::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }

      /* ---- Option ---- */
      .option {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.65rem 1rem;
        font-size: 0.92rem;
        color: #ccc;
        cursor: pointer;
        transition: background 0.1s, color 0.1s;
        border-bottom: 1px solid #1a1a1a;
      }

      .option:last-child { border-bottom: none; }

      .option:hover:not(.is-disabled) {
        background: #1a1a1a;
        color: #fff;
      }

      .option.is-selected {
        color: #6ee7b7;
        background: #0a1f17;
      }

      .option.is-disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }

      .option-icon {
        font-size: 1rem;
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
        color: #6ee7b7;
        flex-shrink: 0;
        display: flex;
        align-items: center;
      }

      /* ---- Empty state ---- */
      .empty {
        padding: 1rem;
        text-align: center;
        color: #444;
        font-size: 0.85rem;
      }

      /* ---- Error message ---- */
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
    `;
  }

  // ---- Private helpers ----

  #parseOptions() {
    try {
      const raw = this.getAttribute('options');
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      console.warn('[ui-select] Invalid options JSON');
      return [];
    }
  }

  #escAttr(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  get _uid() {
    if (!this.__uid) this.__uid = Math.random().toString(36).slice(2, 8);
    return this.__uid;
  }
}

customElements.define('ui-select', UiSelect);
