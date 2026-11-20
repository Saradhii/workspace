/**
 * Get a lowercase file extension (including the leading dot) from a filename.
 * Returns an empty string when the filename has no extension.
 */
export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? `.${(parts[parts.length - 1] ?? '').toLowerCase()}` : '';
}
