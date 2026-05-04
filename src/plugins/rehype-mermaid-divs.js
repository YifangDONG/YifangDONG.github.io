/**
 * Turn Shiki output `pre.language-mermaid` into `<div class="mermaid">` so Mermaid can run client-side.
 */
import { visit } from 'unist-util-visit';

function getTextFromCode(node) {
  if (!node?.children?.length) return '';
  return node.children
    .map((c) => {
      if (c.type === 'text') return c.value;
      if (c.type === 'element' && c.children) return getTextFromCode(c);
      return '';
    })
    .join('');
}

export function rehypeMermaidDivs() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre' || !parent || typeof index !== 'number') return;
      const code = node.children?.find(
        (c) => c.type === 'element' && c.tagName === 'code',
      );
      if (!code?.properties?.className) return;
      const cls = code.properties.className;
      const list = Array.isArray(cls) ? cls : [cls];
      if (!list.some((c) => String(c).includes('language-mermaid'))) return;
      const source = getTextFromCode(code).replace(/\n$/, '');
      const div = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['mermaid'] },
        children: source ? [{ type: 'text', value: source }] : [],
      };
      parent.children[index] = div;
    });
  };
}
