import type { Membership } from './types';

// Durante el piloto todos son Premium. Los nombres que ve el atleta se cambian aquí.
export const DEFAULT_MEMBERSHIP: Membership = 'premium';

export const MEMBERSHIPS: { key: Membership; label: string }[] = [
  { key: 'basica', label: 'Básica' },
  { key: 'media', label: 'Medium' },
  { key: 'premium', label: 'Premium' },
];

export const membershipLabel = (m: Membership | undefined) =>
  MEMBERSHIPS.find((x) => x.key === (m ?? DEFAULT_MEMBERSHIP))?.label ?? 'Premium';
