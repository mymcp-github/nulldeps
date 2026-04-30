/**
 * theme.js
 * Single source of truth for all design tokens.
 * Import in every component - no magic numbers in styles.
 */

export const color = {
  // Brand
  brand:          '#6ee7b7',
  brandBg:        '#0a1f17',
  brandFocus:     'rgba(110, 231, 183, 0.08)',
  brandGlow:      'rgba(110, 231, 183, 0.35)',

  // Neutrals
  bg:             '#111',
  bgHover:        '#1a1a1a',
  bgActive:       '#1e1e1e',
  surface:        '#2a2a2a',

  // Text
  textPrimary:    '#fff',
  textSecondary:  '#ccc',
  textMuted:      '#888',
  textDisabled:   '#444',
  textLabel:      '#666',

  // Borders
  border:         '#2a2a2a',
  borderHover:    '#444',

  // Semantic
  error:          '#ef4444',
  errorLight:     '#f87171',
  errorFocus:     'rgba(239, 68, 68, 0.08)',
  errorGlow:      'rgba(239, 68, 68, 0.35)',
  success:        '#34d399',
  warning:        '#fbbf24',
};

export const radius = {
  sm:   '4px',
  md:   '8px',
  lg:   '12px',
  full: '9999px',
};

export const spacing = {
  xs:   '0.25rem',
  sm:   '0.4rem',
  md:   '0.65rem',
  lg:   '1rem',
  xl:   '1.5rem',
  xxl:  '2.5rem',
};

export const font = {
  sizeXs:   '0.72rem',
  sizeSm:   '0.78rem',
  sizeMd:   '0.92rem',
  sizeBase: '0.95rem',
  sizeLg:   '1rem',
  sizeXl:   '1.4rem',

  weightNormal:  '400',
  weightMedium:  '500',
  weightSemiBold:'600',

  lineHeight:    '1.4',
  letterSpacing: '0.05em',
};

export const transition = {
  fast:   '0.1s',
  base:   '0.15s',
  slow:   '0.2s',
  easing: 'ease',
};

export const shadow = {
  focus:    (color) => `0 0 0 3px ${color}`,
  dropdown: '0 8px 24px rgba(0,0,0,0.4)',
};

export const zIndex = {
  dropdown: '100',
  modal:    '200',
  toast:    '300',
};

// Sidebar / layout specific
export const layout = {
  sidebarWidth: '220px',
  sidebarBg:    '#0a0a0a',
};

/**
 * Generate complete CSS custom properties string.
 * Inject into :host or :root as needed.
 */
export function cssVars() {
  return `
    --color-brand:          ${color.brand};
    --color-brand-bg:       ${color.brandBg};
    --color-brand-focus:    ${color.brandFocus};
    --color-brand-glow:     ${color.brandGlow};

    --color-bg:             ${color.bg};
    --color-bg-hover:       ${color.bgHover};
    --color-bg-active:      ${color.bgActive};
    --color-surface:        ${color.surface};

    --color-text-primary:   ${color.textPrimary};
    --color-text-secondary: ${color.textSecondary};
    --color-text-muted:     ${color.textMuted};
    --color-text-disabled:  ${color.textDisabled};
    --color-text-label:     ${color.textLabel};

    --color-border:         ${color.border};
    --color-border-hover:   ${color.borderHover};

    --color-error:          ${color.error};
    --color-error-light:    ${color.errorLight};
    --color-error-focus:    ${color.errorFocus};

    --color-success:        ${color.success};
    --color-warning:        ${color.warning};

    --radius-sm:            ${radius.sm};
    --radius-md:            ${radius.md};
    --radius-lg:            ${radius.lg};

    --spacing-xs:           ${spacing.xs};
    --spacing-sm:           ${spacing.sm};
    --spacing-md:           ${spacing.md};
    --spacing-lg:           ${spacing.lg};
    --spacing-xl:           ${spacing.xl};

    --font-size-xs:         ${font.sizeXs};
    --font-size-sm:         ${font.sizeSm};
    --font-size-md:         ${font.sizeMd};
    --font-size-base:       ${font.sizeBase};
    --font-size-lg:         ${font.sizeLg};

    --font-weight-medium:   ${font.weightMedium};
    --font-weight-semibold: ${font.weightSemiBold};

    --transition-fast:      ${transition.fast};
    --transition-base:      ${transition.base};
    --transition-slow:      ${transition.slow};

    --shadow-dropdown:      ${shadow.dropdown};

    --z-dropdown:           ${zIndex.dropdown};
    --z-modal:              ${zIndex.modal};

    --layout-sidebar-width: ${layout.sidebarWidth};
  `;
}
