import type { StatisticsPeriod } from '../model/statistics.types';

const MONTH_ABBREVIATIONS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function formatHourHeader(label: string): string {
  const match = /^(\d{1,2})\s*(AM|PM)$/i.exec(label.trim());
  if (!match) {
    return label;
  }

  return `${match[1]}:00 ${match[2].toUpperCase()}`;
}

function formatMonthYearHeader(label: string): string {
  const monthIndex = MONTH_ABBREVIATIONS.indexOf(label.trim());
  if (monthIndex === -1) {
    return label;
  }

  const now = new Date();
  const year =
    monthIndex <= now.getMonth() ? now.getFullYear() : now.getFullYear() - 1;

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, monthIndex, 1));
}

export function formatStatisticsTooltipLabel(
  label: string,
  period?: StatisticsPeriod,
): string {
  if (!label) {
    return label;
  }

  if (period === 'day') {
    return formatHourHeader(label);
  }

  if (period === 'year') {
    return formatMonthYearHeader(label);
  }

  return label;
}
