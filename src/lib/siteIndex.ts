// Search helpers emitted by scripts/generate-static.mjs as /site-index.json:
// model code-table pages and the canonical URL for every corpus entry.

export type FamilySummary = {
  slug: string;
  path: string;
  name: string;
  brand: string;
  equipmentType: string;
  models: string[];
  lines: string[];
  codeCount: number;
};

export type SiteIndex = {
  families: FamilySummary[];
  entryPaths: Record<string, string>;
  symptomPaths: Record<string, string>;
};

type Fetcher = (input: string) => Promise<Response>;

export const emptySiteIndex: SiteIndex = { families: [], entryPaths: {}, symptomPaths: {} };

// The index only improves links and ranking, so a missing file (e.g. `vite dev`) falls back to empty.
export async function loadSiteIndex(url: string, fetcher: Fetcher = fetch): Promise<SiteIndex> {
  try {
    const response = await fetcher(url);
    if (!response.ok) return emptySiteIndex;
    const data = (await response.json()) as Partial<SiteIndex>;
    return { families: data.families ?? [], entryPaths: data.entryPaths ?? {}, symptomPaths: data.symptomPaths ?? {} };
  } catch {
    return emptySiteIndex;
  }
}

function tokens(text: string) {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

// A model table matches when every query term appears in it and at least one term is a
// model token (so "dometic" or "refrigerator" alone does not pull in every table).
export function lookupFamilies(families: FamilySummary[], query: string): FamilySummary[] {
  const terms = Array.from(new Set(tokens(query)));
  if (!terms.length) return [];

  return families
    .map((family) => {
      const generic = new Set([...tokens(family.brand), ...tokens(family.equipmentType), "cummins", "rv", "series", "refrigerators", "generators", "codes"]);
      const all = new Set([...tokens(family.name), ...family.models.flatMap(tokens), ...family.lines.flatMap(tokens), ...generic]);
      const modelTerms = terms.filter((term) => all.has(term) && !generic.has(term));
      const matches = terms.every((term) => all.has(term)) && modelTerms.length > 0;
      return { family, score: matches ? modelTerms.length * 10 + family.codeCount / 100 : 0 };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.family.name.localeCompare(b.family.name))
    .map((item) => item.family);
}
