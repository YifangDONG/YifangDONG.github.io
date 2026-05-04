# yifangdong.github.io

Personal site and blog, built with [Astro](https://astro.build/), [React](https://react.dev/) (small islands), [Tailwind CSS](https://tailwindcss.com/) v4 (PostCSS), and TypeScript. Content lives in Markdown under `src/content/blog/`.

## Commands

```bash
npm install
npm run dev      # local dev
npm run build    # static output → dist/
npm run preview  # preview dist locally
```

## Google Analytics 4

Set `PUBLIC_GA_MEASUREMENT_ID` to your `G-xxxxxxxxxx` ID. For GitHub Actions builds, add a repository secret with the same name. If unset, no analytics script is injected.

EU visitors: consider adding consent mode or a banner before loading GA; this is not implemented here.

## GitHub Pages

The workflow in `.github/workflows/deploy.yml` uploads `dist/` to GitHub Pages. Enable **Pages** in the repo settings with the **GitHub Actions** source. The site URL is configured as `https://yifangdong.github.io` in `astro.config.mjs`.

## Migrating from Hexo

Legacy posts were migrated with `npm run migrate:hexo` (requires a `source/_posts` tree). That folder has been removed after migration; the script remains for reference.

## Blog authoring (`src/content/blog/*.md`)

Required frontmatter: `title`, `description`, `pubDate` (`YYYY-MM-DD`), `lang` (`en` | `zh-cn`), `tags` (array), `slug` (URL segment, unique per language).

Optional: `updatedDate`, `draft: true`, `translationKey` (same on two posts for EN/ZH `hreflang` links).

Use fenced code blocks for Shiki highlighting. For Mermaid, use a fenced block with language `mermaid` (see the sample diagram in `code-review-best-practices.md`).
