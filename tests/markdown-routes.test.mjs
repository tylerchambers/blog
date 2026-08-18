import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const contentRoot = fileURLToPath(new URL('../src/content/blog/', import.meta.url));
const outputRoot = fileURLToPath(new URL('../dist/blog/', import.meta.url));

async function findMarkdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? findMarkdownFiles(path) : [path];
    }),
  );

  return files.flat().filter((path) => path.endsWith('.md'));
}

function isDraft(markdown) {
  const frontmatter = markdown.match(/^---\n(?<data>[\s\S]*?)\n---(?:\n|$)/u)?.groups?.data;
  return frontmatter !== undefined && /^draft:\s*true\s*$/mu.test(frontmatter);
}

test('each published post is emitted unchanged at its .md URL', async () => {
  const sourceFiles = await findMarkdownFiles(contentRoot);

  for (const sourcePath of sourceFiles) {
    const source = await readFile(sourcePath, 'utf8');
    if (isDraft(source)) {
      continue;
    }

    const sourceRelativePath = relative(contentRoot, sourcePath);
    const outputPath = join(outputRoot, sourceRelativePath);
    const output = await readFile(outputPath, 'utf8');

    assert.equal(output, source, `${relative(projectRoot, outputPath)} must match its source post`);
  }
});

test('each published post links to its Markdown representation', async () => {
  const sourceFiles = await findMarkdownFiles(contentRoot);

  for (const sourcePath of sourceFiles) {
    const source = await readFile(sourcePath, 'utf8');
    if (isDraft(source)) {
      continue;
    }

    const sourceRelativePath = relative(contentRoot, sourcePath);
    const slug = sourceRelativePath.slice(0, -'.md'.length);
    const htmlPath = join(outputRoot, slug, 'index.html');
    const html = await readFile(htmlPath, 'utf8');

    assert.match(html, new RegExp(`href="/blog/${slug}\\.md"`, 'u'));
  }
});
