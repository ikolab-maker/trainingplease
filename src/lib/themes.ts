import type { Theme } from './types';

// Azul es el tema por defecto; el rosa queda para quien lo elija (o se lo asigne su coach).
export const DEFAULT_THEME: Theme = 'azul';

export const THEMES: { key: Theme; label: string; color: string }[] = [
  { key: 'azul', label: 'Azul', color: '#2F9CC4' },
  { key: 'rosa', label: 'Rosa', color: '#E0479F' },
  { key: 'oscuro', label: 'Oscuro', color: '#221a25' },
];
