const TAG_SEGMENT_PATTERN = /[a-z0-9]+/g;

export class BlogTag {
  private constructor(
    readonly name: string,
    readonly slug: string,
  ) {}

  get href(): string {
    return `/tags/${this.slug}/`;
  }

  equals(other: BlogTag): boolean {
    return this.slug === other.slug;
  }

  static fromName(name: string): BlogTag {
    const normalizedName = name.trim();

    if (normalizedName.length === 0) {
      throw new Error('Blog tags must not be blank.');
    }

    const slug = normalizedName
      .normalize('NFKD')
      .toLowerCase()
      .match(TAG_SEGMENT_PATTERN)
      ?.join('-');

    if (!slug) {
      throw new Error(
        `Blog tag "${normalizedName}" must contain at least one ASCII letter or number.`,
      );
    }

    return new BlogTag(normalizedName, slug);
  }

  static fromNames(names: readonly string[]): BlogTag[] {
    const tagsBySlug = new Map<string, BlogTag>();

    for (const name of names) {
      const tag = BlogTag.fromName(name);
      tagsBySlug.set(tag.slug, tagsBySlug.get(tag.slug) ?? tag);
    }

    return [...tagsBySlug.values()].sort(compareTagsByName);
  }
}

export function compareTagsByName(a: BlogTag, b: BlogTag): number {
  return a.name.localeCompare(b.name, 'en');
}
