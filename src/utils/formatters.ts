/**
 * Utilitaires de formatage monétaire et temporel pour SUREBET AFRICA AI
 */

export function formatFcfa(amount: number): string {
  if (isNaN(amount)) return '0 FCFA';
  const rounded = Math.round(amount);
  return `${new Intl.NumberFormat('fr-FR').format(rounded)} FCFA`;
}

export function formatPercent(value: number): string {
  if (isNaN(value)) return '0.00%';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

export function formatFreshness(seconds: number): string {
  if (seconds < 60) return `Il y a ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `Il y a ${minutes} min`;
}

export function formatMatchTime(dateString: string, timezone: string = 'Africa/Abidjan'): string {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      timeZone: timezone,
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}
