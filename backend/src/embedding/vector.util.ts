export function toPgVectorLiteral(values: number[]): string {
  return `[${values.join(',')}]`;
}
