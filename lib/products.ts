export const TIPS = [
  { id: 'tip-3', cents: 300 },
  { id: 'tip-5', cents: 500 },
  { id: 'tip-10', cents: 1000 },
] as const;

export type TipId = (typeof TIPS)[number]['id'];

export const ALERT_PASS = {
  id: 'alert-pass',
  name: 'findmyduo Email Alerts',
  description: 'Emails 24/7 when your iPhone Duo is in stock near you. One-time payment, 90 days.',
  cents: 500,
  days: 90,
} as const;

export const ALERT_RADII = [10, 25, 50, 100] as const;

export function dollars(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}
