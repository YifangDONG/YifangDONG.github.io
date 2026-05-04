// @ts-check
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import {
  transformerMetaHighlight,
  transformerMetaWordHighlight,
  transformerRemoveLineBreak,
  transformerRemoveNotationEscape,
} from '@shikijs/transformers';
import { defineConfig } from 'astro/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rehypeMermaidDivs } from './src/plugins/rehype-mermaid-divs.js';
import { transformerCopyButton } from './src/shiki/transformer-copy-button.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  site: 'https://yifangdong.github.io',
  trailingSlash: 'always',
  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en',
          'zh-cn': 'zh-CN',
        },
      },
    }),
  ],
  vite: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  },
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
      transformers: [
        transformerRemoveNotationEscape(),
        transformerMetaHighlight(),
        transformerMetaWordHighlight(),
        transformerRemoveLineBreak(),
        transformerCopyButton(),
      ],
    },
    rehypePlugins: [rehypeMermaidDivs],
  },
});
