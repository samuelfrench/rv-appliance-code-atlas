// canonical: explorer-pipeline seo 4f501cb5dd1e seo/lib/provenance.mjs. Do not edit this copy: change explorer-pipeline/seo, then re-vendor with seo/vendor.mjs.
// Vendoring provenance shared by vendor.mjs, sync-check.mjs and `cli.mjs self-check`.
// Every vendored file carries one header line naming the canonical commit; SEO-TEMPLATE.json records the sha256 of
// each file's canonical content (header excluded), so local edits and upstream changes are both detectable.
// automation/sync_core.py implements the same rules in Python (keep HEADER_RE and stripHeader in step).
import { createHash } from 'node:crypto';

export const PROVENANCE_FILE = 'SEO-TEMPLATE.json';
export const HEADER_RE = /canonical: explorer-pipeline seo ([0-9a-f]{7,40})/;
/** Paths under seo/ that are not vendored into sites. */
export const NOT_VENDORED = [/^tests\//, /^vendor\.mjs$/, /^sync-check\.mjs$/];

export function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

function commentFor(rel, line) {
  if (rel.endsWith('.md')) return `<!-- ${line} -->`;
  return `// ${line}`;
}

export function headerLine(rel, sha) {
  return commentFor(rel, `canonical: explorer-pipeline seo ${sha.slice(0, 12)} seo/${rel}. Do not edit this copy: change explorer-pipeline/seo, then re-vendor with seo/vendor.mjs.`);
}

/** Insert the header after a shebang if there is one. */
export function addHeader(rel, text, sha) {
  if (rel.endsWith('.json')) return text; // JSON has no comments: provenance alone tracks it
  const header = `${headerLine(rel, sha)}\n`;
  if (text.startsWith('#!')) {
    const nl = text.indexOf('\n');
    return `${text.slice(0, nl + 1)}${header}${text.slice(nl + 1)}`;
  }
  return header + text;
}

/** Remove the header line (first line, or second after a shebang). Returns {text, sha|null}. */
export function stripHeader(text) {
  const lines = text.split('\n');
  const index = lines[0]?.startsWith('#!') ? 1 : 0;
  const match = lines[index] !== undefined ? HEADER_RE.exec(lines[index]) : null;
  if (!match) return { text, sha: null };
  lines.splice(index, 1);
  return { text: lines.join('\n'), sha: match[1] };
}

export function isVendored(rel) {
  return !NOT_VENDORED.some((re) => re.test(rel));
}
