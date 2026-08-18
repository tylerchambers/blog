import { readFile } from 'node:fs/promises';
import type { APIContext } from 'astro';
import { getPostHref, getPublishedPosts } from '../../lib/posts';

type Props = {
  canonicalHref: string;
  markdown: string;
};

export async function getStaticPaths() {
  const posts = await getPublishedPosts();

  return Promise.all(
    posts.map(async (post) => {
      if (post.filePath === undefined) {
        throw new Error(`The source file for blog post "${post.id}" is unavailable`);
      }

      return {
        params: { slug: post.id },
        props: {
          canonicalHref: getPostHref(post),
          markdown: await readFile(post.filePath, 'utf8'),
        } satisfies Props,
      };
    }),
  );
}

export function GET({ props }: APIContext<Props>): Response {
  return new Response(props.markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      Link: `<${props.canonicalHref}>; rel="canonical"`,
    },
  });
}
