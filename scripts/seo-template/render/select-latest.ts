// canonical: explorer-pipeline seo 4f501cb5dd1e seo/render/select-latest.ts. Do not edit this copy: change explorer-pipeline/seo, then re-vendor with seo/vendor.mjs.
// Selection logic for LatestPages.tsx in a plain .ts module, so Node can run it in tests (built-in type stripping)
// and a parity test can compare it with lib/latest.mjs forSite/forSection/forPage.

export interface LatestItem {
  href: string;
  title: string;
  firstSeen: string;
  section?: string | null;
}

export interface LatestData {
  version: number;
  buildDate?: string | null;
  site: LatestItem[];
  sections: Record<string, LatestItem[]>;
}

export interface LatestPagesProps {
  latest: LatestData;
  scope: 'site' | 'section' | 'page';
  /** Section name for scope "section"/"page". For "page" it defaults to the first path segment. */
  section?: string;
  /** Current page path for scope "page" (and to exclude the current page from "site"). */
  path?: string;
  /** Items to show: default 8 for site/section, 5 for page. */
  limit?: number;
  heading?: string;
  headingLevel?: 2 | 3 | 4;
  className?: string;
  showDates?: boolean;
}

export type LatestSelection = Pick<LatestPagesProps, 'latest' | 'scope' | 'section' | 'path' | 'limit'>;

export function normalizePath(path: string): string {
  let value = path.split('#')[0].split('?')[0];
  if (/^https?:\/\//i.test(value)) {
    try { value = new URL(value).pathname; } catch { /* keep */ }
  }
  value = value.replace(/\/index\.html?$/i, '/');
  if (!value.startsWith('/')) value = `/${value}`;
  return value.length > 1 ? value.replace(/\/+$/, '') || '/' : value;
}

export function selectLatest({ latest, scope, section, path, limit }: LatestSelection): LatestItem[] {
  const self = path ? normalizePath(path) : null;
  const notSelf = (item: LatestItem) => normalizePath(item.href) !== self;
  if (scope === 'site') return (latest.site || []).filter(notSelf).slice(0, limit ?? 8);
  const name = section ?? (path ? normalizePath(path).split('/')[1] : undefined);
  const list = (name && latest.sections?.[name]) || [];
  return list.filter(notSelf).slice(0, limit ?? (scope === 'page' ? 5 : 8));
}
