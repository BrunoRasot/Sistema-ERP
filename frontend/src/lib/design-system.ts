/**
 * Vivelite Design System Constants and Standard Actions
 * Centralizes UI tokens, consistent action icons, and common styling invariants.
 */

export const UI_ICONS = {
  add: 'Plus',
  edit: 'Pencil',
  delete: 'Trash2',
  search: 'Search',
  close: 'X',
  confirm: 'Check',
  view: 'Eye',
  settings: 'Settings',
  phone: 'Phone',
  whatsapp: 'MessageCircle',
  calendar: 'Calendar',
  money: 'DollarSign',
} as const;

export const UI_SIZES = {
  radius: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  },
  spacing: {
    page: 'p-4 sm:p-6 lg:p-8 space-y-6',
    card: 'p-5 sm:p-6',
    modal: 'p-6',
  },
  transitions: {
    default: 'transition-all duration-150',
    smooth: 'transition-all duration-200 ease-in-out',
  },
} as const;
