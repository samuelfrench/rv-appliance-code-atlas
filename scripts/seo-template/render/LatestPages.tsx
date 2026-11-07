// canonical: explorer-pipeline seo 4f501cb5dd1e seo/render/LatestPages.tsx. Do not edit this copy: change explorer-pipeline/seo, then re-vendor with seo/vendor.mjs.
// Reference server-rendered latest-links block for Vite + vite-react-ssg sites. It renders from latest.json imported
// at build time (no client fetch), so the links are in the prerendered HTML and the same data hydrates on the client.
// Plain <a href> (crawlable, no router dependency), wrapped in data-seo-ignore so it never changes a page's hash.
//
// Site wrapper, frontend/src/components/LatestPages.tsx (import paths without extensions):
//   import latest from '../data/latest.json';
//   import { LatestPages as Base, type LatestPagesProps } from '../../scripts/seo-template/render/LatestPages';
//   export function LatestPages(props: Omit<LatestPagesProps, 'latest'>) { return <Base latest={latest} {...props} />; }
// Usage: homepage <LatestPages scope="site" />; hub <LatestPages scope="section" section="blog" />;
//        any page <LatestPages scope="page" path={pathname} section="blog" /> (section defaults to the first path segment).
import { selectLatest } from './select-latest';
import type { LatestPagesProps } from './select-latest';

export type { LatestData, LatestItem, LatestPagesProps } from './select-latest';
export { selectLatest } from './select-latest';

export function LatestPages(props: LatestPagesProps) {
  const items = selectLatest(props);
  if (items.length === 0) return null;
  const heading = props.heading ?? (props.scope === 'page' ? 'New in this section' : 'Latest');
  const level = props.headingLevel ?? 2;
  const Heading = level === 3 ? 'h3' : level === 4 ? 'h4' : 'h2';
  return (
    <section className={props.className ?? 'seo-latest'} data-seo-ignore="" aria-label={heading}>
      <Heading>{heading}</Heading>
      <ul>
        {items.map((item) => (
          <li key={item.href}>
            <a href={item.href}>{item.title}</a>
            {props.showDates ? <> <time dateTime={item.firstSeen}>{item.firstSeen}</time></> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default LatestPages;
