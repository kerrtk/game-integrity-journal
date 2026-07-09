# Game Integrity Journal

Next.js 15 website for GameIntegrityJournal.com — a premium investigative journalism
platform covering sports integrity: doping, officiating, governance, youth safety,
gambling, and fair play.

```bash
npm install && npm run dev
```

## Content

Articles live as MDX files in `content/articles/*.mdx` with Zod-validated frontmatter
(see `lib/content/schema.ts`). All reads go through `lib/content/articles.ts` — that's
the seam to swap in a headless CMS (Sanity, Payload, etc.) later without touching any
page or component code.

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui-pattern components
(Radix primitives + `class-variance-authority` + `cn()`) · `next-mdx-remote/rsc` for
content rendering.
