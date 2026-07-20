export type SiteConfig = {
  readonly name: string;
  readonly description: string;
  readonly tagline: string;
  readonly url: string;
};

export const SITE = {
  name: 'Tyler Chambers',
  description: 'Essays and technical notes on software design and engineering.',
  tagline: 'Occasional essays and other technical notes.',
  url: 'https://tylerchambers.net',
} satisfies SiteConfig;
