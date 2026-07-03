import { getCollection, type CollectionEntry } from 'astro:content';
import { BlogTag } from './tags';

export type BlogPost = CollectionEntry<'blog'>;

export type TaggedPosts = {
  readonly tag: BlogTag;
  readonly posts: readonly BlogPost[];
};

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

export function getPostTags(post: BlogPost): BlogTag[] {
  return BlogTag.fromNames(post.data.tags);
}

export function getAllPostTags(posts: readonly BlogPost[]): BlogTag[] {
  return BlogTag.fromNames(posts.flatMap((post) => post.data.tags));
}

export function getTaggedPosts(posts: readonly BlogPost[], tag: BlogTag): TaggedPosts {
  return {
    tag,
    posts: posts.filter((post) => getPostTags(post).some((postTag) => postTag.equals(tag))),
  };
}
