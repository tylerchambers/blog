import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

const CODE_BLOCK_TITLE_PATTERN = /(?:^|\s)title=(?:"([^"]+)"|'([^']+)'|([^\s]+))/u;
const CODE_BLOCK_LINE_NUMBERS_PATTERN = /(?:^|\s)lineNumbers(?:=(?:"true"|'true'|true))?(?=\s|$)/u;
const CODE_BLOCK_LINE_NUMBERS_DISABLED_PATTERN =
  /(?:^|\s)(?:noLineNumbers|lineNumbers=(?:"false"|'false'|false))(?=\s|$)/u;

export default defineConfig({
  site: 'https://tylerchambers.net',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      transformers: [
        {
          name: 'code-block-metadata',
          root(node) {
            const rawMeta = this.options.meta?.__raw;

            if (rawMeta === undefined) {
              return;
            }

            const match = rawMeta.match(CODE_BLOCK_TITLE_PATTERN);
            const title = match?.[1] ?? match?.[2] ?? match?.[3];
            const lineNumbers =
              CODE_BLOCK_LINE_NUMBERS_PATTERN.test(rawMeta) &&
              !CODE_BLOCK_LINE_NUMBERS_DISABLED_PATTERN.test(rawMeta);
            const pre = node.children[0];

            if (title === undefined && !lineNumbers) {
              return;
            }

            if (pre === undefined) {
              return;
            }

            const className = ['code-block'];
            const children = [];

            if (lineNumbers) {
              className.push('code-block--line-numbers');
            }

            if (title !== undefined) {
              children.push({
                type: 'element',
                tagName: 'figcaption',
                properties: { className: ['code-block__title'] },
                children: [{ type: 'text', value: title }],
              });
            }

            children.push(pre);

            node.children = [
              {
                type: 'element',
                tagName: 'figure',
                properties: { className },
                children,
              },
            ];
          },
        },
      ],
    },
  },
});
