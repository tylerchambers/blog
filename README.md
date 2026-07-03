# Blog

A minimal Astro blog. Posts are Markdown files in `src/content/blog/`; Astro builds the static site into `dist/`.

## Prerequisites

Use pnpm for this project. The repository pins pnpm in `package.json`:

```sh
corepack enable
corepack prepare pnpm@11.9.0 --activate
pnpm install
```

Check the active pnpm version if anything looks off:

```sh
pnpm --version
```

Expected: `11.9.0`.

## Add a post

Create a Markdown file under `src/content/blog/`:

```sh
src/content/blog/my-post.md
```

Use this frontmatter shape:

```md
---
title: My post
pubDate: 2026-07-03
---

Write the post body here.
```

Required fields:

- `title`: post title shown on the index and post page.
- `pubDate`: publication date. `YYYY-MM-DD` is the preferred format.

Optional fields:

- `draft: true`: hides the post from the index and prevents a static route from being generated.

Example draft:

```md
---
title: Unfinished note
pubDate: 2026-07-03
draft: true
---

This will not be published.
```

The post URL comes from the file path relative to `src/content/blog/`:

- `src/content/blog/first-note.md` -> `/blog/first-note/`
- `src/content/blog/systems/cache-notes.md` -> `/blog/systems/cache-notes/`

Posts are sorted newest first by `pubDate`.

Markdown fenced code blocks are syntax highlighted with a light theme. Add `title="..."` for
a header and `lineNumbers` to show line numbers. Line numbers are opt-in; omit the flag,
or use `lineNumbers=false`, to leave them off:

````md
```ts title="example.ts" lineNumbers
const message = 'hello';
console.log(message);
```
````

## Run locally

Start the development server:

```sh
pnpm dev
```

Astro prints the local URL, usually `http://localhost:4321/`.

## Check the site

Run Astro's type/content checks:

```sh
pnpm check
```

Run Biome formatting/lint checks:

```sh
pnpm lint
```

Format files with Biome:

```sh
pnpm format
```

## Build

Build the static site:

```sh
pnpm build
```

The build script runs `astro check` first, then emits the static site into `dist/`.

## Preview the production build

After building, run:

```sh
pnpm preview
```

Astro serves the generated `dist/` output locally.
