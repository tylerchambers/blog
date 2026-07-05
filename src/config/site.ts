export type SiteConfig = {
  readonly name: string;
  readonly description: string;
  readonly tagline: string;
};

export const SITE = {
  name: 'Tyler Chambers',
  description: 'Software notes.',
  tagline: 'Occasional essays and other technical notes.',
} satisfies SiteConfig;
