export function formatContributorPoints(points: number): string {
  return `${new Intl.NumberFormat('en-US').format(points)} points`;
}

export function formatStatisticsCostBenefit(total: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(total);
}
