export interface Statistic { id: string; value: number; decimals: number; suffix: string; display: string; label: string }
export const stats = [
  { id: 'infrastructure', value: 12400, decimals: 0, suffix: ' km', display: '12,400 km', label: 'orbital infrastructure' },
  { id: 'autonomy', value: 99.7, decimals: 1, suffix: '%', display: '99.7%', label: 'autonomous operations' },
  { id: 'lifespan', value: 18, decimals: 0, suffix: ' years', display: '18 years', label: 'mission lifespan' },
  { id: 'trajectory', value: 4.2, decimals: 1, suffix: 'B km', display: '4.2B km', label: 'simulated trajectory' },
] as const satisfies readonly Statistic[];
export function formatStatistic(stat: Statistic, value: number = stat.value): string {
  const numeric = Number.isFinite(value) ? Math.max(0, Math.min(stat.value, value)) : 0;
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: stat.decimals, maximumFractionDigits: stat.decimals }).format(numeric) + stat.suffix;
}
