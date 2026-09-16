// Single source of truth for the pages the accessibility scan sweeps over.
export interface SitePage {
  path: string;
  titleContains: string;
  heading: RegExp;
}

export const ALL_PAGES: SitePage[] = [
  { path: '/index.html', titleContains: 'Bob', heading: /bob: a 2020 royal enfield interceptor 650/i },
];

// Not in the primary nav or footer, and marked noindex — a build changelog
// for whoever knows the URL, not user-facing content. Same "unlisted,
// noindex, but still accessibility-tested" pattern as kington-parishes'
// /updates.html.
export const UPDATES_PAGE: SitePage = {
  path: '/updates.html',
  titleContains: 'Site Updates',
  heading: /site updates/i,
};
