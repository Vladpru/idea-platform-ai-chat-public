export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite';

export const GEMINI_MODEL_FALLBACKS = [
  DEFAULT_GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemma-4-26b-a4b-it',
  'gemma-4-31b-it',
  'gemini-2.0-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.0-flash',
] as const;

export function buildModelsToTry(configuredModel: string): string[] {
  return [
    configuredModel,
    ...GEMINI_MODEL_FALLBACKS.filter(model => model !== configuredModel),
  ];
}
