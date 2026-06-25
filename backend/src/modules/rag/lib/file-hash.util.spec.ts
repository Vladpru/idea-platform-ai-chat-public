import { computeFileHash } from './file-hash.util';

describe('computeFileHash', () => {
  it('returns the same hash for identical content', () => {
    expect(computeFileHash('hello')).toBe(computeFileHash('hello'));
  });

  it('returns different hashes for different content', () => {
    expect(computeFileHash('hello')).not.toBe(computeFileHash('world'));
  });

  it('returns a 64-character lowercase hex string', () => {
    expect(computeFileHash('test')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns known SHA-256 for "hello"', () => {
    expect(computeFileHash('hello')).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
  });
});
