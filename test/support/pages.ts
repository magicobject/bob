// Single source of truth for the pages the accessibility scan sweeps over.
export interface SitePage {
  path: string;
  titleContains: string;
  heading: RegExp;
}

export const ALL_PAGES: SitePage[] = [
  { path: '/index.html', titleContains: 'Bob', heading: /bob: a 2020 royal enfield interceptor 650/i },
];
