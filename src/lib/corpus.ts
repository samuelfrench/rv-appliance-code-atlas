export type Source = {
  id: string;
  brand: string;
  title: string;
  url: string;
  type: string;
  official: boolean;
};

export type CorpusEntry = {
  id: string;
  brand: string;
  equipmentType: string;
  modelFamilies: string[];
  code: string;
  slug: string;
  plainMeaning: string;
  ownerSafeActions: string[];
  serviceOnlyActions: string[];
  safetyBoundary: string;
  sourceIds: string[];
  symptomIds: string[];
  partCaptureHints: string[];
};

export type SymptomGuide = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  safeChecklist: string[];
  sourceIds: string[];
  searchAliases?: string[];
};

export type Corpus = {
  site: {
    name: string;
    baseUrl: string;
    generatedAt: string;
    safetyBoundary: string;
    searchConsole?: {
      propertyType: "URL_PREFIX";
      siteUrl: string;
      sitemapUrl: string;
      verifiedAt: string;
      sitemapSubmittedAt: string;
    };
  };
  sources: Source[];
  entries: CorpusEntry[];
  symptoms: SymptomGuide[];
  monetization: {
    status: string;
    disabledAdSlots: Array<{ id: string; minimumImpressions: number }>;
    affiliatePlaceholders: Array<{ vendorCategory: string; status: string }>;
  };
};

export type ValidationReport = {
  verifiedEntries: number;
  sourceBackedEntries: number;
  officialSources: number;
  failures: string[];
  dangerousOwnerActions: string[];
};

export type CorpusSummary = {
  verifiedEntries: number;
  totalSources: number;
  totalSymptoms: number;
  indexablePages: number;
  brands: number;
  disabledAdSlots: number;
  affiliatePlaceholders: number;
};

const unsafeOwnerTerms = [
  /\bbypass\b/i,
  /\bjump(er)?\b/i,
  /\bgas valve\b/i,
  /\bburner\b/i,
  /\bcontrol board\b/i,
  /\b120\s*vac\b/i,
  /\brefrigerant\b/i,
  /\bprobe\b/i,
  /\bopen (the )?(fuel|gas|electrical|rooftop)/i,
];

export function validateCorpus(corpus: Corpus): ValidationReport {
  const failures: string[] = [];
  const dangerousOwnerActions: string[] = [];
  const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
  const entryIds = new Set<string>();
  const slugs = new Set<string>();

  for (const source of corpus.sources) {
    if (!source.official) failures.push(`Source ${source.id} is not marked official.`);
    if (!/^https:\/\//.test(source.url)) failures.push(`Source ${source.id} must use https.`);
  }

  for (const entry of corpus.entries) {
    if (entryIds.has(entry.id)) failures.push(`Duplicate entry id ${entry.id}.`);
    entryIds.add(entry.id);

    if (slugs.has(entry.slug)) failures.push(`Duplicate entry slug ${entry.slug}.`);
    slugs.add(entry.slug);

    if (!entry.brand || !entry.code || !entry.plainMeaning) {
      failures.push(`Entry ${entry.id} is missing brand, code, or meaning.`);
    }
    if (!entry.modelFamilies.length) failures.push(`Entry ${entry.id} has no model family.`);
    if (!entry.sourceIds.length) failures.push(`Entry ${entry.id} has no source citation.`);
    if (!entry.safetyBoundary || entry.safetyBoundary.length < 24) {
      failures.push(`Entry ${entry.id} has no concrete safety boundary.`);
    }
    if (!entry.ownerSafeActions.length) failures.push(`Entry ${entry.id} has no owner-safe action.`);
    if (!entry.serviceOnlyActions.length) failures.push(`Entry ${entry.id} has no service-only boundary.`);
    if (!entry.partCaptureHints.length) failures.push(`Entry ${entry.id} has no part-number/model capture hints.`);

    for (const sourceId of entry.sourceIds) {
      const source = sourcesById.get(sourceId);
      if (!source) failures.push(`Entry ${entry.id} cites missing source ${sourceId}.`);
      if (source && !source.official) failures.push(`Entry ${entry.id} cites non-official source ${sourceId}.`);
    }

    for (const action of entry.ownerSafeActions) {
      if (unsafeOwnerTerms.some((term) => term.test(action))) {
        dangerousOwnerActions.push(`${entry.id}: ${action}`);
      }
    }
  }

  const symptomIds = new Set<string>();
  for (const symptom of corpus.symptoms) {
    if (symptomIds.has(symptom.id)) failures.push(`Duplicate symptom id ${symptom.id}.`);
    symptomIds.add(symptom.id);
    if (symptom.searchAliases !== undefined) {
      if (!Array.isArray(symptom.searchAliases)) {
        failures.push(`Symptom ${symptom.id} searchAliases must be an array of non-empty strings.`);
      } else {
        symptom.searchAliases.forEach((alias, index) => {
          if (typeof alias !== "string" || !alias.trim()) {
            failures.push(`Symptom ${symptom.id} searchAliases[${index}] must be a non-empty string.`);
          }
        });
      }
    }
    if (!symptom.sourceIds.length) failures.push(`Symptom ${symptom.id} has no source citation.`);
    for (const sourceId of symptom.sourceIds) {
      const source = sourcesById.get(sourceId);
      if (!source) failures.push(`Symptom ${symptom.id} cites missing source ${sourceId}.`);
      if (source && !source.official) failures.push(`Symptom ${symptom.id} cites non-official source ${sourceId}.`);
    }
  }

  for (const entry of corpus.entries) {
    for (const symptomId of entry.symptomIds) {
      if (!symptomIds.has(symptomId)) failures.push(`Entry ${entry.id} cites missing symptom ${symptomId}.`);
    }
  }

  return {
    verifiedEntries: corpus.entries.length,
    sourceBackedEntries: corpus.entries.filter((entry) =>
      entry.sourceIds.every((sourceId) => sourcesById.get(sourceId)?.official),
    ).length,
    officialSources: corpus.sources.filter((source) => source.official).length,
    failures,
    dangerousOwnerActions,
  };
}

export function getBrandCoverage(corpus: Corpus) {
  return corpus.entries.reduce<Record<string, { verifiedEntries: number; equipmentTypes: string[] }>>((coverage, entry) => {
    const current = coverage[entry.brand] ?? { verifiedEntries: 0, equipmentTypes: [] };
    current.verifiedEntries += 1;
    current.equipmentTypes = Array.from(new Set([...current.equipmentTypes, entry.equipmentType])).sort();
    coverage[entry.brand] = current;
    return coverage;
  }, {});
}

export function summarizeCorpus(corpus: Corpus): CorpusSummary {
  return {
    verifiedEntries: corpus.entries.length,
    totalSources: corpus.sources.length,
    totalSymptoms: corpus.symptoms.length,
    indexablePages: 1 + corpus.entries.length + corpus.symptoms.length,
    brands: Object.keys(getBrandCoverage(corpus)).length,
    disabledAdSlots: corpus.monetization.disabledAdSlots.length,
    affiliatePlaceholders: corpus.monetization.affiliatePlaceholders.length,
  };
}

export type SearchIndexEntry = CorpusEntry & { searchText: string; searchTokens: Set<string> };
export type SymptomSearchIndexEntry = SymptomGuide & { searchText: string; searchTokens: Set<string> };

function searchableParts(parts: string[]) {
  const joined = parts.join(" ").toLowerCase();
  const compact = parts
    .flatMap((part) => part.toLowerCase().match(/[a-z0-9]+(?:[^a-z0-9]+[a-z0-9]+)+/g) ?? [])
    .map((part) => part.replace(/[^a-z0-9]+/g, ""));
  const searchText = [joined, ...compact].join(" ");

  return {
    searchText,
    searchTokens: new Set(searchText.split(/[^a-z0-9]+/).filter(Boolean)),
  };
}

export function buildSearchIndex(corpus: Corpus): SearchIndexEntry[] {
  const symptomsById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
  return corpus.entries.map((entry) => ({
    ...entry,
    ...searchableParts([
      entry.id,
      entry.slug,
      entry.brand,
      entry.equipmentType,
      entry.modelFamilies.join(" "),
      entry.code,
      entry.plainMeaning,
      entry.ownerSafeActions.join(" "),
      entry.symptomIds.map((id) => symptomsById.get(id)?.title ?? "").join(" "),
    ]),
  }));
}

export function buildSymptomSearchIndex(corpus: Corpus): SymptomSearchIndexEntry[] {
  return corpus.symptoms.map((symptom) => ({
    ...symptom,
    ...searchableParts([
      symptom.id,
      symptom.slug,
      symptom.title,
      symptom.summary,
      symptom.safeChecklist.join(" "),
      symptom.searchAliases?.join(" ") ?? "",
    ]),
  }));
}

export function lookupEntries(index: SearchIndexEntry[], query: string): CorpusEntry[] {
  const terms = Array.from(
    new Set(
      query
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean),
    ),
  );

  if (!terms.length) return index.slice(0, 8);

  return index
    .map((entry) => {
      const codeTerms = entry.code
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean);
      const codePhraseMatch = codeTerms.length > 1 && codeTerms.every((term) => terms.includes(term));
      const matchedTerms = terms.filter((term) => codeTerms.includes(term) || entry.searchTokens.has(term));
      const allTermsMatch = matchedTerms.length === terms.length;
      const missingTerms = terms.length - matchedTerms.length;
      const score = terms.reduce((total, term) => {
        if (codeTerms.length === 1 && codeTerms[0] === term) return total + 8;
        if (codeTerms.includes(term)) return total + 4;
        if (entry.searchTokens.has(term)) return total + 1;
        if (entry.searchText.includes(term)) return total + 0.25;
        return total;
      }, (codePhraseMatch ? 24 + codeTerms.length * 4 : 0) + (allTermsMatch ? 40 : 0) + matchedTerms.length * 3 - missingTerms * 8);
      return { entry, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.brand.localeCompare(b.entry.brand))
    .map((item) => item.entry);
}

export function lookupSymptomGuides(index: SymptomSearchIndexEntry[], query: string): SymptomGuide[] {
  const terms = Array.from(
    new Set(
      query
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean),
    ),
  );

  if (!terms.length) return index.slice(0, 8);

  const phrase = terms.join(" ");

  return index
    .map((symptom) => {
      const matchedTerms = terms.filter((term) => symptom.searchTokens.has(term) || symptom.searchText.includes(term));
      const allTermsMatch = matchedTerms.length === terms.length;
      const missingTerms = terms.length - matchedTerms.length;
      const titleText = symptom.title.toLowerCase();
      const slugText = symptom.slug.replace(/[^a-z0-9]+/g, " ");
      const score = terms.reduce((total, term) => {
        if (symptom.searchTokens.has(term)) return total + 1;
        if (symptom.searchText.includes(term)) return total + 0.25;
        return total;
      }, (allTermsMatch ? 35 : 0) + (titleText.includes(phrase) ? 30 : 0) + (slugText.includes(phrase) ? 20 : 0) + matchedTerms.length * 3 - missingTerms * 8);

      return { symptom, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.symptom.title.localeCompare(b.symptom.title))
    .map((item) => item.symptom);
}

export function getEntryBySlug(corpus: Corpus, slug: string) {
  return corpus.entries.find((entry) => entry.slug === slug);
}

export function getSymptomBySlug(corpus: Corpus, slug: string) {
  return corpus.symptoms.find((symptom) => symptom.slug === slug);
}

export function getSourcesForIds(corpus: Corpus, sourceIds: string[]) {
  const sourceMap = new Map(corpus.sources.map((source) => [source.id, source]));
  return sourceIds.map((sourceId) => sourceMap.get(sourceId)).filter((source): source is Source => Boolean(source));
}

export function slugPathForEntry(entry: CorpusEntry) {
  return `/codes/${entry.slug}/`;
}

export function slugPathForSymptom(symptom: SymptomGuide) {
  return `/symptoms/${symptom.slug}/`;
}
