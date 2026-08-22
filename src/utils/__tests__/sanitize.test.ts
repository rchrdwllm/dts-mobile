import { sanitizeAlphanumeric } from '../sanitize';

describe('sanitizeAlphanumeric', () => {
  it('should preserve purely alphanumeric strings up to 9 characters', () => {
    expect(sanitizeAlphanumeric('123a')).toBe('123a');
    expect(sanitizeAlphanumeric('ABC99')).toBe('ABC99');
    expect(sanitizeAlphanumeric('ScanRef2026')).toBe('ScanRef20');
  });

  it('should strip out hyphens and symbols and truncate to 9 characters', () => {
    expect(sanitizeAlphanumeric('abc-90')).toBe('abc90');
    expect(sanitizeAlphanumeric('abc-123!')).toBe('abc123');
    expect(sanitizeAlphanumeric('90-12')).toBe('9012');
    expect(sanitizeAlphanumeric('REF#123@xyz')).toBe('REF123xyz');
    expect(sanitizeAlphanumeric('1234567890EXTRA')).toBe('123456789');
  });

  it('should strip out spaces and whitespace and cap at 9 characters', () => {
    expect(sanitizeAlphanumeric('hello world')).toBe('helloworl');
    expect(sanitizeAlphanumeric('  1 2 3  ')).toBe('123');
    expect(sanitizeAlphanumeric('A\tB\nC')).toBe('ABC');
  });

  it('should handle empty string and non-alphanumeric only strings', () => {
    expect(sanitizeAlphanumeric('')).toBe('');
    expect(sanitizeAlphanumeric('---!!!   ')).toBe('');
  });
});
