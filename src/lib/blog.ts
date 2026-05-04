import { getCollection, type CollectionEntry } from 'astro:content';

export function postSlug(entry: CollectionEntry<'blog'>): string {
  return entry.data.slug ?? entry.id;
}

export async function publishedPosts(lang: 'en' | 'zh-cn') {
  const posts = await getCollection('blog', ({ data }) => !data.draft && data.lang === lang);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export async function allTags(lang: 'en' | 'zh-cn'): Promise<Map<string, number>> {
  const posts = await publishedPosts(lang);
  const map = new Map<string, number>();
  for (const p of posts) {
    for (const t of p.data.tags) {
      const k = t.trim();
      if (!k) continue;
      map.set(k, (map.get(k) ?? 0) + 1);
    }
  }
  return new Map(Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])));
}

export async function findTranslation(entry: CollectionEntry<'blog'>) {
  const key = entry.data.translationKey;
  if (!key) return undefined;
  const all = await getCollection('blog', ({ data }) => !data.draft);
  return all.find(
    (e) =>
      e.id !== entry.id &&
      e.data.translationKey === key &&
      e.data.lang !== entry.data.lang,
  );
}

export function postsByYear(posts: CollectionEntry<'blog'>[]) {
  const map = new Map<number, CollectionEntry<'blog'>[]>();
  for (const p of posts) {
    const y = p.data.pubDate.getFullYear();
    const list = map.get(y) ?? [];
    list.push(p);
    map.set(y, list);
  }
  return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
}
