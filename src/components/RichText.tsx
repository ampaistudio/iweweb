import { createElement, useMemo, type ReactNode } from 'react';

// Matches the editor's presentation vocabulary. Attributes are never copied.
const allowedTags = new Set(['p', 'h2', 'h3', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'br']);
const blockedTags = new Set(['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'template']);

function renderNode(node: Node, key: number): ReactNode {
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1) return null;
  const tag = node.nodeName.toLowerCase();
  if (blockedTags.has(tag)) return null;
  const children = Array.from(node.childNodes).map(renderNode);
  if (tag === 'br') return createElement('br', { key });
  return createElement(allowedTags.has(tag) ? tag : 'span', { key }, ...children);
}

export function RichText({ value, className = '' }: { value: string; className?: string }) {
  const children = useMemo(() => {
    if (!/<\/?[a-z][^>]*>/i.test(value) || typeof DOMParser === 'undefined') {
      return value.split(/\n\s*\n/).filter((part) => part.trim()).map((part, index) => (
        <p key={index} style={{ whiteSpace: 'pre-line' }}>{part}</p>
      ));
    }
    const doc = new DOMParser().parseFromString(value, 'text/html');
    return Array.from(doc.body.childNodes).map(renderNode);
  }, [value]);
  return <div className={`rich-text-content ${className}`.trim()}>{children}</div>;
}
