import { normalizeTags, toolError, toolOk, truncate } from './tool-utils';

describe('tool-utils', () => {
  it('truncates long text with an ellipsis', () => {
    expect(truncate('abcdef', 4)).toBe('abc…');
    expect(truncate('abc', 4)).toBe('abc');
    expect(truncate(null)).toBe('');
  });

  it('normalizes tags: trims, strips #, dedupes case-insensitively, caps', () => {
    expect(
      normalizeTags([' IoT ', '#iot', 'Mobility', '', 'x', 'y'], 3),
    ).toEqual(['IoT', 'Mobility', 'x']);
  });

  it('serializes results and errors as JSON', () => {
    expect(JSON.parse(toolOk({ a: 1 }))).toEqual({ a: 1 });
    expect(JSON.parse(toolError('nope'))).toEqual({ error: 'nope' });
  });
});
