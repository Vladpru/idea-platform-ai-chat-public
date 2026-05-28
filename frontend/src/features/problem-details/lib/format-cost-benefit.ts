export function formatCostBenefitDisplay(value: string | null): string | null {
  if (!value?.trim()) {
    return null;
  }

  const normalized = value.trim().replace(/[$,\s]/g, '');
  const amount = Number.parseFloat(normalized);
  if (Number.isNaN(amount)) {
    return value.trim();
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
