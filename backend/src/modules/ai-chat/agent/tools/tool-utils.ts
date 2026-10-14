import type { Logger } from '@nestjs/common';

export const DESCRIPTION_LIMIT = 300;

export function truncate(
  text: string | null | undefined,
  limit = DESCRIPTION_LIMIT,
): string {
  if (!text) return '';
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

export function toolOk(data: unknown): string {
  return JSON.stringify(data);
}

export function toolError(message: string): string {
  return JSON.stringify({ error: message });
}

export async function safeTool(
  name: string,
  logger: Logger,
  run: () => Promise<string>,
): Promise<string> {
  try {
    return await run();
  } catch (error) {
    logger.warn(
      `Tool ${name} failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return toolError(`${name} failed`);
  }
}

export function normalizeTags(tags: string[], limit: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    const tag = raw.trim().replace(/^#/, '').trim();
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    result.push(tag);
    if (result.length === limit) break;
  }
  return result;
}
