import { isFlagEnabled } from './env-flag';

describe('isFlagEnabled', () => {
  it('defaults to enabled when unset or blank', () => {
    expect(isFlagEnabled(undefined)).toBe(true);
    expect(isFlagEnabled('')).toBe(true);
    expect(isFlagEnabled('   ')).toBe(true);
  });

  it('is disabled by false, 0, off and no in any case', () => {
    for (const value of ['false', 'FALSE', ' False ', '0', 'off', 'No']) {
      expect(isFlagEnabled(value)).toBe(false);
    }
  });

  it('is enabled by any other value', () => {
    for (const value of ['true', '1', 'on', 'yes']) {
      expect(isFlagEnabled(value)).toBe(true);
    }
  });

  it('honours an explicit default', () => {
    expect(isFlagEnabled(undefined, false)).toBe(false);
    expect(isFlagEnabled('true', false)).toBe(true);
  });
});
