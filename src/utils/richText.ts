/**
 * Encodes an HTML string to base64 for safe storage in the data model.
 * This prevents issues with special characters when exporting/importing via JSON.
 */
export function encodeRichText(html: string): string {
  if (!html) return "";
  return btoa(unescape(encodeURIComponent(html)));
}

/**
 * Decodes a base64 string back to HTML for display in the rich text editor.
 * If the content is not valid base64 (e.g., plain text from legacy data),
 * it returns the content wrapped in a paragraph tag.
 */
export function decodeRichText(content: string): string {
  if (!content) return "";
  
  try {
    // Try to decode as base64
    const decoded = decodeURIComponent(escape(atob(content)));
    return decoded;
  } catch {
    // If decoding fails, it's likely plain text from legacy data
    // Wrap it in a paragraph tag for the editor
    return `<p>${content}</p>`;
  }
}
