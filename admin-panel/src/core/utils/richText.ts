/** Preserve legacy plain-text paragraphs when opening a visual editor. */
export function toEditorHtml(value: string): string {
  if (/<\/?(?:p|h[1-6]|strong|b|em|i|u|s|ul|ol|li|br|div|blockquote)\b/i.test(value)) return value;
  const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return value.split(/\n\s*\n/).filter((block) => block.trim()).map((block) => `<p>${escape(block).replace(/\n/g, '<br>')}</p>`).join('');
}

/** Plain preview for list rows; formatting remains stored in the source value. */
export function editorialPlainText(value: string): string {
  const spaced = value.replace(/<\/(?:p|h[1-6]|li)>|<br\s*\/?>/gi, ' ');
  return new DOMParser().parseFromString(spaced, 'text/html').body.textContent?.replace(/\s+/g, ' ').trim() || '';
}
