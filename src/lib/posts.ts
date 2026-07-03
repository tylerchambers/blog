import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

function isPublished(post: BlogPost): boolean {
  return post.data.draft !== true;
}

function compareByPubDateDesc(a: BlogPost, b: BlogPost): number {
  return b.data.pubDate.getTime() - a.data.pubDate.getTime();
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog', isPublished);
  posts.sort(compareByPubDateDesc);
  return posts;
}

export function formatPostDate(post: BlogPost): string {
  return post.data.pubDate.toISOString().slice(0, 10);
}

export function getPostHref(post: BlogPost): string {
  return `/blog/${post.id}/`;
}
