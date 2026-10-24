import type { Membership } from './types';

// Durante el piloto todos son Élite. Los nombres que ve el atleta se cambian aquí.
export const DEFAULT_MEMBERSHIP: Membership = 'elite';

// En el piloto el nivel del atleta cuesta US$0 y los demás aún no tienen precio (ver 13-paquete-mejoras-octubre.md).
export const PILOT = true;
export const priceLabel = (isCurrent: boolean) => (PILOT ? (isCurrent ? 'Piloto · US$0' : 'Precio por definir') : '');

export const MEMBERSHIPS: { key: Membership; label: string }[] = [
  { key: 'base', label: 'Base' },
  { key: 'ritmo', label: 'Ritmo' },
  { key: 'elite', label: 'Élite' },
];

/** Nivel guardado del atleta; un valor desconocido cae en el nivel por defecto. */
export const membershipOf = (m: string | undefined): Membership =>
  MEMBERSHIPS.some((x) => x.key === m) ? (m as Membership) : DEFAULT_MEMBERSHIP;

export const membershipLabel = (m: string | undefined) =>
  MEMBERSHIPS.find((x) => x.key === membershipOf(m))!.label;
