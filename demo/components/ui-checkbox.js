/**
 * ui-checkbox.js
 * A fully-featured checkbox web component matching the NullDeps framework pattern
 * Supports: label, checked, disabled, error, required, indeterminate
 * Emits: change event with { checked, value }
 */
import { Component } from '/src/nulldeps.js';

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
            label:         this.getAttribute('label')  ?? '',
            error:         this.getAttribute('error')  ?? '',
            value:         this.getAttribute('value')  ?? '',
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
            indeterminate: false  // toggle clears indeterminate state
        });

        // Dispatch native-like change event
        this.dispatchEvent(new CustomEvent('change', {
            bubbles:   true,
            composed:  true,  // crosses shadow DOM boundary
            detail: {
                checked: newChecked,
                value:   this.state.value
            }
        }));
    }

    // Keyboard: space/enter toggle
    handleKeydown(e) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this.toggle();
        }
    }

    // ---- Template ----

    template() {
        const { checked, indeterminate, disabled, required, label, error, value } = this.state;

        const hasError     = error.length > 0;
        const boxClass     = [
            'box',
            checked       ? 'is-checked'       : '',
            indeterminate ? 'is-indeterminate'  : '',
            disabled      ? 'is-disabled'       : '',
            hasError      ? 'is-error'          : '',
        ].filter(Boolean).join(' ');

        return `
            <div 
                class="wrapper ${disabled ? 'is-disabled' : ''}"
                role="checkbox"
                aria-checked="${indeterminate ? 'mixed' : checked}"
                aria-disabled="${disabled}"
                aria-required="${required}"
                tabindex="${disabled ? -1 : 0}"
                data-action="click:toggle keydown:handleKeydown"
            >
                <div class="${boxClass}">
                    ${indeterminate 
                        ? `<svg class="icon" viewBox="0 0 16 16" fill="none">
                                <line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                           </svg>`
                        : checked 
                            ? `<svg class="icon" viewBox="0 0 16 16" fill="none">
                                    <polyline points="2.5,8 6.5,12 13.5,4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                               </svg>`
                            : ''
                    }
                </div>

                ${label 
                    ? `<span class="label ${required ? 'is-required' : ''}">${label}</span>` 
                    : '<slot></slot>'
                }
            </div>

            ${hasError 
                ? `<span class="error-msg">${error}</span>` 
                : ''
            }
        `;
    }

    // ---- Styles ----

    styles() {
        return `
            :host {
                display: inline-flex;
                flex-direction: column;
                gap: 0.35rem;
            }

            /* ---- Wrapper ---- */
            .wrapper {
                display: inline-flex;
                align-items: center;
                gap: 0.65rem;
                cursor: pointer;
                user-select: none;
                outline: none;
                border-radius: 4px;
                padding: 2px;
                transition: opacity 0.2s;
            }

            .wrapper:focus-visible .box {
                box-shadow: 0 0 0 3px rgba(110, 231, 183, 0.35);
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
                border-radius: 4px;
                border: 2px solid #444;
                background: transparent;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: border-color 0.15s, background 0.15s;
            }

            .box.is-checked,
            .box.is-indeterminate {
                border-color: #6ee7b7;
                background: #6ee7b7;
                color: #000;
            }

            .box.is-error {
                border-color: #f87171;
            }

            .wrapper:hover:not(.is-disabled) .box:not(.is-checked):not(.is-indeterminate) {
                border-color: #6ee7b7;
            }

            /* ---- Icon ---- */
            .icon {
                width: 0.75rem;
                height: 0.75rem;
                display: block;
            }

            /* ---- Label ---- */
            .label {
                font-size: 0.92rem;
                color: #ccc;
                line-height: 1.4;
            }

            .label.is-required::after {
                content: ' *';
                color: #f87171;
            }

            /* ---- Error ---- */
            .error-msg {
                font-size: 0.78rem;
                color: #f87171;
                display: flex;
                align-items: center;
                gap: 0.3rem;
                line-height: 1.4;
                padding-left: 1.85rem; /* align with label */
            }

            .error-msg::before {
                content: '⚠';
                font-size: 0.72rem;
            }
        `;
    }
}

customElements.define('ui-checkbox', UiCheckbox);
