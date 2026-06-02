export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite';

export const GEMINI_MODEL_FALLBACKS = [
  DEFAULT_GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
] as const;

export const GEMINI_API_BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta';

export function buildModelsToTry(configuredModel: string): string[] {
  return [
    configuredModel,
    ...GEMINI_MODEL_FALLBACKS.filter(model => model !== configuredModel),
  ];
}
