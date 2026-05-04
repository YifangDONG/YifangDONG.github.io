export const SITE = {
  name: "Yifang's blog",
  titleDefault: "Yifang's blog",
  /** Shown in the site header next to the title (English UI). */
  taglineEn: 'May you stay curious',
  /** Shown in the site header next to the title (Chinese UI). */
  taglineZh: '愿你始终拥有好奇之心',
  description:
    'Software engineering notes and reflections — in English and Chinese.',
  author: 'Yifang DONG',
  url: 'https://yifangdong.github.io',
  twitter: undefined as string | undefined,
} as const;

export function absoluteUrl(pathname: string): string {
  const base = SITE.url.replace(/\/$/, '');
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${base}${path}`;
}

/** hreflang alternates for equivalent EN / 中文 pages (x-default → English). */
export function pairAlternates(enPath: string, zhPath: string) {
  return [
    { hreflang: 'en', href: absoluteUrl(enPath) },
    { hreflang: 'zh-CN', href: absoluteUrl(zhPath) },
    { hreflang: 'x-default', href: absoluteUrl(enPath) },
  ];
}
