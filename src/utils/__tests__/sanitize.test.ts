import { sanitizeAlphanumeric } from '../sanitize';

describe('sanitizeAlphanumeric', () => {
  it('should preserve purely alphanumeric strings', () => {
    expect(sanitizeAlphanumeric('123a')).toBe('123a');
    expect(sanitizeAlphanumeric('ABC99')).toBe('ABC99');
    expect(sanitizeAlphanumeric('ScanRef2026')).toBe('ScanRef2026');
  });

  it('should strip out hyphens and symbols', () => {
    expect(sanitizeAlphanumeric('abc-90')).toBe('abc90');
    expect(sanitizeAlphanumeric('abc-123!')).toBe('abc123');
    expect(sanitizeAlphanumeric('90-12')).toBe('9012');
    expect(sanitizeAlphanumeric('REF#123@xyz')).toBe('REF123xyz');
  });

  it('should strip out spaces and whitespace', () => {
    expect(sanitizeAlphanumeric('hello world')).toBe('helloworld');
    expect(sanitizeAlphanumeric('  1 2 3  ')).toBe('123');
    expect(sanitizeAlphanumeric('A\tB\nC')).toBe('ABC');
  });

  it('should handle empty string and non-alphanumeric only strings', () => {
    expect(sanitizeAlphanumeric('')).toBe('');
    expect(sanitizeAlphanumeric('---!!!   ')).toBe('');
  });
});
