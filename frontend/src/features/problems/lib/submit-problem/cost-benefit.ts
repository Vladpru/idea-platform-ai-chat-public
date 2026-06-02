import { z } from 'zod';

export const MONETARY_AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

export function normalizeCostBenefitInput(value: string): string {
  return value.trim().replace(/[$,\s]/g, '');
}

export function sanitizeCostBenefitInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, '');
  const dotIndex = cleaned.indexOf('.');
  if (dotIndex === -1) {
    return cleaned;
  }

  const intPart = cleaned.slice(0, dotIndex);
  const fraction = cleaned
    .slice(dotIndex + 1)
    .replace(/\./g, '')
    .slice(0, 2);
  const endsWithDot = cleaned.endsWith('.') && fraction.length === 0;

  if (endsWithDot) {
    return intPart.length > 0 ? `${intPart}.` : '';
  }

  return fraction.length > 0 ? `${intPart}.${fraction}` : intPart;
}

export function isValidCostBenefit(value: string): boolean {
  const sanitized = sanitizeCostBenefitInput(value);
  if (!sanitized || sanitized === '.') return true;
  if (sanitized.endsWith('.')) return false;
  return MONETARY_AMOUNT_PATTERN.test(sanitized);
}

export const submitProblemCostBenefitSchema = z
  .string()
  .max(13, 'Cost benefit cannot exceed 13 characters')
  .optional()
  .superRefine((value, ctx) => {
    if (!value) return;

    if (!isValidCostBenefit(value)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Enter a valid amount (e.g. 1000.00)',
      });
      return;
    }

    const numericValue = parseFloat(normalizeCostBenefitInput(value));
    if (!isNaN(numericValue) && numericValue > 9999999999.99) {
      ctx.addIssue({
        code: 'custom',
        message: 'Amount is too large',
      });
    }
  });

export function normalizeCostBenefitForApi(
  value: string | undefined,
): string | undefined {
  if (!value) return undefined;
  const normalized = normalizeCostBenefitInput(value);
  return normalized || undefined;
}
