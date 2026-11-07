// canonical: explorer-pipeline seo 4f501cb5dd1e seo/render/latest-html.mjs. Do not edit this copy: change explorer-pipeline/seo, then re-vendor with seo/vendor.mjs.
// Plain-HTML renderer for latest-links, for static generators that build pages as strings (rv, seed-garden, dev-tools,
// home-upgrade). Output is wrapped in data-seo-ignore so the block never changes the page's content hash.
const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/**
 * items: [{href, title, firstSeen?}] from forSite()/forSection()/forPage(). Returns '' for an empty list.
 * options: heading ('Latest'), headingTag ('h2'), className ('seo-latest'), showDates (false), id, ariaLabel.
 */
export function renderLatestHtml(items, { heading = 'Latest', headingTag = 'h2', className = 'seo-latest', showDates = false, id, ariaLabel } = {}) {
  if (!items || items.length === 0) return '';
  const tag = /^h[1-6]$/.test(headingTag) ? headingTag : 'h2';
  const attrs = [`class="${escapeHtml(className)}"`, 'data-seo-ignore=""'];
  if (id) attrs.push(`id="${escapeHtml(id)}"`);
  if (ariaLabel || heading) attrs.push(`aria-label="${escapeHtml(ariaLabel || heading)}"`);
  const lis = items.map((item) => {
    const date = showDates && item.firstSeen ? ` <time datetime="${escapeHtml(item.firstSeen)}">${escapeHtml(item.firstSeen)}</time>` : '';
    return `<li><a href="${escapeHtml(item.href)}">${escapeHtml(item.title)}</a>${date}</li>`;
  }).join('');
  return `<section ${attrs.join(' ')}>${heading ? `<${tag}>${escapeHtml(heading)}</${tag}>` : ''}<ul>${lis}</ul></section>`;
}
