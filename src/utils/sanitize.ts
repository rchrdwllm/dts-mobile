/**
 * Sanitizes input text by removing any non-alphanumeric characters.
 * Keeps only standard English uppercase letters, lowercase letters, and digits (a-z, A-Z, 0-9).
 *
 * @param text The input string to sanitize
 * @returns The sanitized string containing only alphanumeric characters
 */
export function sanitizeAlphanumeric(text: string): string {
  return text.replace(/[^a-zA-Z0-9]/g, '');
}
