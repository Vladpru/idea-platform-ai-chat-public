import { v7 as uuidv7 } from 'uuid';

export function newId(): string {
  return uuidv7();
}

// Minimal valid 1x1 PNG for file upload tests
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQ' +
  'AABjkB6QAAAABJRU5ErkJggg==',
  'base64',
);