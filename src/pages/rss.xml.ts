import rss from '@astrojs/rss';
import { SITE } from '../config/site';
import { getPostHref, getPublishedPosts } from '../lib/posts';

export async function GET(context: { site?: URL }) {
  const posts = await getPublishedPosts();

  return rss({
    title: SITE.name,
    description: SITE.tagline,
    site: context.site ?? SITE.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description ?? SITE.description,
      pubDate: post.data.pubDate,
      link: getPostHref(post),
    })),
    customData: `<language>en-us</language><link>${SITE.url}</link>`,
  });
}
