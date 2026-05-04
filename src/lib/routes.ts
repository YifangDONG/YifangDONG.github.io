/** Manual locale prefixes (no astro:i18n — avoids route conflicts with `src/pages/zh-cn/`). */
export const routes = {
  en: {
    home: '/',
    blog: '/blog/',
    tags: '/tags/',
    archives: '/archives/',
    about: '/about/',
  },
  'zh-cn': {
    home: '/zh-cn/',
    blog: '/zh-cn/blog/',
    tags: '/zh-cn/tags/',
    archives: '/zh-cn/archives/',
    about: '/zh-cn/about/',
  },
} as const;
