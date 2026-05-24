// Central color palette — matches the web-app and mobile_app brand.
// web-app: src/constants/theme.js  |  mobile: lib/theme/app_colors.dart
// Change values here to retheme. CSS counterparts live in index.css :root.

export const T = {
  // Backgrounds
  bgDeep:      '#07001A',   // page / main-content  (web-app: dark)
  bgSidebar:   '#0A0A1A',   // sidebar              (mobile: navBarDark)
  bgCard:      '#0D0D1F',   // cards, modals        (mobile: surfaceDark)
  bgInput:     '#0D0D1F',   // text inputs, selects (mobile: inputDark)

  // Borders
  border:      '#1E1E3A',   // default border       (mobile: borderDark)
  borderHover: '#2D2D5A',   // hover / active border

  // Accent (primary purple)
  accent:      '#7D39EB',   // web-app & mobile: purple
  accentLight: '#9B5FF5',   // mobile: purpleLight

  // Text
  textPrimary:   '#F0EAFA', // web-app: text
  textSecondary: '#9B8EC4', // web-app: sub
  textMuted:     '#555577', // mobile: textHintDark
  textLight:     '#F0EAFA',

  // Semantic
  success: '#22C55E',
  danger:  '#EF4444',
  warning: '#F59E0B',
}
