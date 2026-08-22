/**
 * Sanitizes input text by removing any non-alphanumeric characters and truncating to max 9 characters.
 * Keeps only standard English uppercase letters, lowercase letters, and digits (a-z, A-Z, 0-9).
 *
 * @param text The input string to sanitize
 * @param maxLength Optional max length (default: 9)
 * @returns The sanitized string containing only alphanumeric characters up to maxLength
 */
export function sanitizeAlphanumeric(text: string, maxLength = 9): string {
  return text.replace(/[^a-zA-Z0-9]/g, '').slice(0, maxLength);
}
