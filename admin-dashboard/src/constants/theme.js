// Central color palette — change values here to retheme the whole dashboard.
// Usage in inline styles: import { T } from '../constants/theme'
//   style={{ background: T.bgCard, color: T.textSecondary }}
// CSS classes in index.css use the matching CSS variables (--bg-card, etc.)

export const T = {
  // Backgrounds
  bgDeep:      '#080d1a',   // page / main-content background
  bgSidebar:   '#0a0f1e',   // sidebar
  bgCard:      '#0d1426',   // cards, modals, dropdowns
  bgInput:     '#131c30',   // text inputs, selects

  // Borders
  border:      '#1a2540',   // default border
  borderHover: '#2a3550',   // hover / active border

  // Accent (primary blue)
  accent:      '#3b82f6',
  accentLight: '#60a5fa',

  // Text
  textPrimary:   '#ffffff',
  textSecondary: '#94a3b8',
  textMuted:     '#4a5568',
  textLight:     '#e2e8f0',

  // Semantic
  success: '#22c55e',
  danger:  '#ef4444',
  warning: '#f59e0b',
}
