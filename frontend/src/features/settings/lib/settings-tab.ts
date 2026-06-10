import { z } from 'zod';

export const SETTINGS_TAB_VALUES = [
  'account',
  'appearance',
  'notifications',
] as const;

export type SettingsTab = (typeof SETTINGS_TAB_VALUES)[number];

export const settingsSearchSchema = z.object({
  tab: z.enum(SETTINGS_TAB_VALUES).catch('appearance'),
});
