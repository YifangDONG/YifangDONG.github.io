/**
 * Adds a copy control to each Shiki `<pre>` (runs after Astro’s built-in pre hook).
 * Clipboard behavior is handled in `BaseLayout.astro` via `data-shiki-copy`.
 */

function svgIcon(className, pathD) {
  return {
    type: 'element',
    tagName: 'svg',
    properties: {
      class: className,
      xmlns: 'http://www.w3.org/2000/svg',
      width: '18',
      height: '18',
      fill: 'none',
      viewBox: '0 0 24 24',
      'stroke-width': '2',
      stroke: 'currentColor',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true',
    },
    children: [
      {
        type: 'element',
        tagName: 'path',
        properties: { d: pathD },
        children: [],
      },
    ],
  };
}

export function transformerCopyButton() {
  return {
    name: 'astro-copy-button',
    pre(node) {
      if (node.tagName !== 'pre') return;
      node.children.unshift({
        type: 'element',
        tagName: 'button',
        properties: {
          type: 'button',
          class: 'shiki-copy-btn',
          'aria-label': 'Copy code',
          title: 'Copy',
          'data-shiki-copy': '',
        },
        children: [
          svgIcon(
            'shiki-copy-icon',
            'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
          ),
          svgIcon('shiki-copy-check', 'M20 6L9 17l-5-5'),
        ],
      });
    },
  };
}
