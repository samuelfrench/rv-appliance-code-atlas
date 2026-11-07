// Builds the page model for the static site from the verified corpus and the
// curated appliance families. Pure functions only: no file or network access.

const BRAND_LABELS = { "Suburban/Atwood": "Suburban" };

// Code prefixes that name the same display code ("Display fault 08" === "08").
const CODE_PREFIX = /^(?:display fault|fault code|fault|error code|error|code)\s+/i;

// Thin "prep" guides only tell owners to record model details and contact support.
// They stay reachable but are kept out of the search index.
const PREP_SUMMARY =
  /^(Use|Prepare|Record|Collect|Save|Confirm|Check) (this|the|official|an?|Dometic|Furrion|Thetford|Norcold|Suburban|Coleman|MaxxAir|Aqua|Cummins|Onan|Lippert|Girard|Greystone|Airxcel)\b.*\b(before|to (record|prepare|collect|confirm|save|gather|organize|route|document|capture|identify))\b/i;
const PREP_SLUG = /(^|-)prep(-|$)|router|model-label|-routing|-lookup$|registration|locator|finder/;
const PREP_NOTES = /needs? (official )?(model|manual|parts|support|warranty|product)[^.]*notes/i;

// Guides citing this many sources are cross-brand hubs; source overlap says nothing about relevance.
const MAX_SOURCES_FOR_OVERLAP = 20;
const MIN_CODES_FOR_FAMILY_PAGE = 3;

export function brandLabel(brand) {
  return BRAND_LABELS[brand] ?? brand;
}

export function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function brandSlug(brand) {
  return slugify(brand);
}

export function normalizeCode(code) {
  return code.trim().replace(CODE_PREFIX, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Short manufacturer label for an entry, e.g. "Engine Stopped" from
// "The Cummins Onan ... manual lists Code 36 as Engine Stopped."
export function shortMeaning(entry) {
  const match = entry.plainMeaning.match(/^The (?:official )?.{0,160}? lists? .{0,80}? as:? (.+?)\.(?:\s|$)/s);
  if (!match) return null;
  const label = match[1].trim();
  if (/\b(fault|warning|error) message\b/i.test(label) || label.length > 140) return null;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function isGenericMeaning(entry) {
  return shortMeaning(entry) === null && /\b(fault|warning|error) message\b/i.test(entry.plainMeaning);
}

// A guide names a model line when its slug contains every word of one of the family's
// curated guideKeywords sets (e.g. ["qg", "4000"] or ["rm10"]).
export function guideNamesModel(symptom, family) {
  const slugTokens = new Set(symptom.slug.split("-"));
  return (family?.guideKeywords ?? []).some((words) => words.length && words.every((word) => slugTokens.has(word)));
}

export function isThinSymptom(symptom) {
  const [first = "", second = ""] = symptom.safeChecklist;
  return (
    PREP_SLUG.test(symptom.slug) ||
    / prep$/i.test(symptom.title) ||
    PREP_SUMMARY.test(symptom.summary) ||
    PREP_NOTES.test(symptom.summary) ||
    (/^Record/.test(first) && /^Save photos/.test(second))
  );
}

// A code reads as a code ("E1", "no FL", "36") rather than a display message or lamp state.
export function isShortCode(code) {
  return code.length <= 8;
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function mostCommon(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length || a[0].localeCompare(b[0]))[0][0];
}

function lineKey(brand, modelFamilies) {
  return `${brand}|${modelFamilies.join("|")}`;
}

export function codeGroupKey(entry) {
  return `${entry.brand}|${entry.equipmentType}|${normalizeCode(entry.code)}`;
}

// Consensus across every entry in a code group: one label, or the majority label plus exceptions.
export function summarizeMeanings(entries) {
  const labelled = entries.map((entry) => ({ entry, label: shortMeaning(entry) })).filter((item) => item.label);
  if (!labelled.length) return { consensus: null, majority: null, exceptions: [], labelled: [] };
  const keyOf = (label) => label.toLowerCase().replace(/[^a-z0-9]/g, "");
  const majorityKey = mostCommon(labelled.map((item) => keyOf(item.label)));
  const majority = labelled.find((item) => keyOf(item.label) === majorityKey).label;
  const exceptions = labelled.filter((item) => keyOf(item.label) !== majorityKey);
  // "Most manuals say X" needs a real majority; a 1-1 split is reported model by model.
  const isMajority = labelled.length - exceptions.length > labelled.length / 2;
  return { consensus: exceptions.length ? null : majority, majority: isMajority ? majority : null, exceptions, labelled };
}

export function validateFamilies(corpus, familiesData) {
  const failures = [];
  const lines = new Map();
  const slugs = new Set();
  for (const family of familiesData.families) {
    if (slugs.has(family.slug)) failures.push(`Duplicate family slug ${family.slug}.`);
    slugs.add(family.slug);
    if (!family.name || !family.lines?.length) failures.push(`Family ${family.slug} needs a name and at least one line.`);
    for (const line of family.lines ?? []) {
      const key = lineKey(family.brand, line.modelFamilies);
      if (lines.has(key)) failures.push(`Model line ${key} is assigned to ${lines.get(key)} and ${family.slug}.`);
      lines.set(key, family.slug);
    }
  }
  for (const entry of corpus.entries) {
    if (!lines.has(lineKey(entry.brand, entry.modelFamilies))) {
      failures.push(`Entry ${entry.id} (${entry.modelFamilies.join(", ")}) is not assigned to an appliance family in src/data/families.json.`);
    }
  }
  return failures;
}

// Options:
//   hubs:  src/data/guide-hubs.json — troubleshooting hubs for guides (and small code sets) that
//          have no model code table of their own.
//   notes: { [topicSlug]: topic notes } from src/data/topic-notes/*.json — sourced family-level depth.
export function buildSiteModel(corpus, familiesData, options = {}) {
  const failures = validateFamilies(corpus, familiesData);
  if (failures.length) throw new Error(failures.join("\n"));

  const notesByTopic = options.notes ?? {};
  const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
  for (const notes of Object.values(notesByTopic)) {
    for (const source of notes.extraSources ?? []) if (!sourcesById.has(source.id)) sourcesById.set(source.id, source);
  }
  const symptomsById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));

  const families = familiesData.families.map((family) => ({
    ...family,
    brandLabel: brandLabel(family.brand),
    path: `/models/${family.slug}/`,
    lines: family.lines.map((line) => ({ ...line, entries: [] })),
    entries: [],
  }));

  const lineByKey = new Map();
  for (const family of families) {
    for (const line of family.lines) lineByKey.set(lineKey(family.brand, line.modelFamilies), { family, line });
  }

  const familyByEntryId = new Map();
  const lineByEntryId = new Map();
  for (const entry of corpus.entries) {
    const { family, line } = lineByKey.get(lineKey(entry.brand, entry.modelFamilies));
    line.entries.push(entry);
    family.entries.push(entry);
    familyByEntryId.set(entry.id, family);
    lineByEntryId.set(entry.id, line);
  }

  // Code groups: one page per brand + appliance type + code, across every model line.
  const groupsByKey = new Map();
  for (const entry of corpus.entries) {
    const key = codeGroupKey(entry);
    if (!groupsByKey.has(key)) groupsByKey.set(key, { key, brand: entry.brand, equipmentType: entry.equipmentType, entries: [] });
    groupsByKey.get(key).entries.push(entry);
  }

  const codeGroups = [...groupsByKey.values()].map((group) => {
    // Keep the shortest existing URL so already-crawled pages stay canonical.
    const canonical = [...group.entries].sort((a, b) => a.slug.length - b.slug.length || a.slug.localeCompare(b.slug))[0];
    const code = mostCommon(group.entries.map((entry) => entry.code.trim().replace(CODE_PREFIX, "")));
    const groupFamilies = uniq(group.entries.map((entry) => familyByEntryId.get(entry.id)));
    return {
      ...group,
      code,
      slug: canonical.slug,
      path: `/codes/${canonical.slug}/`,
      brandLabel: brandLabel(group.brand),
      families: groupFamilies,
      meanings: summarizeMeanings(group.entries),
      sourceIds: uniq(group.entries.flatMap((entry) => entry.sourceIds)),
      symptomIds: uniq(group.entries.flatMap((entry) => entry.symptomIds)),
    };
  });

  const groupByEntryId = new Map();
  for (const group of codeGroups) for (const entry of group.entries) groupByEntryId.set(entry.id, group);

  const symptoms = corpus.symptoms.map((symptom) => ({
    ...symptom,
    path: `/symptoms/${symptom.slug}/`,
    indexable: !isThinSymptom(symptom),
    brands: uniq(symptom.sourceIds.map((id) => sourcesById.get(id)?.brand)),
  }));
  const symptomModelById = new Map(symptoms.map((symptom) => [symptom.id, symptom]));

  // Guides that share a manufacturer source, are linked by an entry, or name the same model
  // line in their slug (e.g. "dometic-rm10-gas-smell" for the RM10 table).
  function relatedGuides(entries, limit, family = null) {
    const sourceIds = new Set(entries.flatMap((entry) => entry.sourceIds));
    const linked = new Set(entries.flatMap((entry) => entry.symptomIds));
    return symptoms
      .filter((symptom) => symptom.indexable)
      .map((symptom) => {
        const overlap =
          symptom.sourceIds.length <= MAX_SOURCES_FOR_OVERLAP ? symptom.sourceIds.filter((id) => sourceIds.has(id)).length : 0;
        const named = family && guideNamesModel(symptom, family) ? 3 : 0;
        const score = overlap * 2 + named + (linked.has(symptom.id) ? 1 : 0);
        return { symptom, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.symptom.title.localeCompare(b.symptom.title))
      .slice(0, limit)
      .map((item) => item.symptom);
  }

  for (const family of families) {
    family.codeGroups = uniq(family.entries.map((entry) => groupByEntryId.get(entry.id)));
    family.hasPage = family.codeGroups.length >= MIN_CODES_FOR_FAMILY_PAGE;
    family.sourceIds = uniq(family.entries.flatMap((entry) => entry.sourceIds));
    family.models = uniq(family.lines.flatMap((line) => line.modelFamilies));
    family.captureHints = uniq(family.entries.flatMap((entry) => entry.partCaptureHints));
    family.guides = relatedGuides(family.entries, 12, family);
  }

  for (const family of families) {
    // Entries from other families' tables whose model list covers one of this family's model lines,
    // e.g. Dometic RM10 support-page faults that also name RMD10 and RML10.4 refrigerators.
    const coversLine = (entry) => family.lines.some((line) => line.modelFamilies.every((model) => entry.modelFamilies.includes(model)));
    family.alsoListed = families
      .filter((other) => other !== family && other.brand === family.brand)
      .map((other) => ({ family: other, entries: other.entries.filter(coversLine) }))
      .filter((item) => item.entries.length);
  }

  // ---------- consolidation (2026-11-07) ----------
  // One strong page per model family (or troubleshooting hub). A code keeps its own page only when it
  // is one real-world fault shared by several model families (a consensus or majority meaning);
  // single-family codes and number collisions become sections of the model page.
  const hubs = (options.hubs?.hubs ?? []).map((hub) => ({
    ...hub,
    kind: "hub",
    brandLabel: brandLabel(hub.brand),
    path: `/guides/${hub.slug}/`,
    memberFamilies: [],
    codeGroups: [],
    guides: [],
    notes: notesByTopic[hub.slug] ?? null,
  }));
  const hubByFamily = new Map();
  for (const hub of hubs) {
    for (const slug of hub.families ?? []) {
      const family = families.find((item) => item.slug === slug);
      if (!family) throw new Error(`Hub ${hub.slug} lists unknown family ${slug}.`);
      if (family.hasPage) throw new Error(`Hub ${hub.slug} lists family ${slug}, which has its own model page.`);
      hub.memberFamilies.push(family);
      hubByFamily.set(slug, hub);
    }
    hub.codeGroups = uniq(hub.memberFamilies.flatMap((family) => family.codeGroups));
    hub.sourceIds = uniq(hub.memberFamilies.flatMap((family) => family.sourceIds));
  }
  for (const family of families) {
    family.kind = "family";
    family.topic = family.hasPage ? family : hubByFamily.get(family.slug) ?? null;
    family.notes = notesByTopic[family.slug] ?? null;
    family.ownGuides = [];
  }
  for (const slug of Object.keys(notesByTopic)) {
    if (!families.some((family) => family.slug === slug && family.hasPage) && !hubs.some((hub) => hub.slug === slug)) {
      throw new Error(`Topic notes ${slug} match no model page or hub.`);
    }
  }

  // A code shared by several model families (consensus or majority meaning) is one real-world fault:
  // it gets one section on its home page (a sharedCodes hub for the brand + appliance, else the model
  // page of its canonical entry) and the other model tables link there. A number that means different
  // things on different models (no majority) gets a section on each model page instead.
  for (const group of codeGroups) {
    group.shared = group.families.length > 1 && Boolean(group.meanings.consensus || group.meanings.majority);
    group.standalone = group.families.some((family) => !family.topic);
    group.home = null;
    if (!group.standalone && group.shared) {
      const sharedHub = hubs.find((hub) => hub.sharedCodes && hub.brand === group.brand && hub.equipmentType === group.equipmentType);
      const canonicalEntry = group.entries.find((entry) => entry.slug === group.slug);
      group.home = sharedHub ?? familyByEntryId.get(canonicalEntry.id).topic;
      if (sharedHub) sharedHub.codeGroups.push(group);
    }
    group.topics = uniq([group.home, ...group.families.map((family) => family.topic)]);
  }

  // Section anchors on topic pages: code-<normalized code>, made unique per page.
  const anchors = new Map();
  for (const topic of [...families.filter((family) => family.hasPage), ...hubs]) {
    const used = new Set();
    for (const group of topic.codeGroups) {
      let anchor = `code-${slugify(group.code) || normalizeCode(group.code)}`;
      if (used.has(anchor)) anchor = `${anchor}-${slugify(group.equipmentType)}`;
      let n = 2;
      while (used.has(anchor)) anchor = `${anchor}-${n++}`;
      used.add(anchor);
      anchors.set(`${topic.path}|${group.key}`, anchor);
    }
  }
  const anchorFor = (topic, group) => anchors.get(`${topic.path}|${group.key}`);

  function entryTarget(entry) {
    const group = groupByEntryId.get(entry.id);
    if (group.standalone) return entry.slug === group.slug ? group.path : `${group.path}#${entry.id}`;
    const topic = group.home ?? familyByEntryId.get(entry.id).topic;
    return `${topic.path}#${anchorFor(topic, group)}`;
  }
  const entryPaths = Object.fromEntries(corpus.entries.map((entry) => [entry.slug, entryTarget(entry)]));

  // Guides: a guide that names exactly one model family becomes a section of that model page; otherwise
  // the first matching hub; otherwise the first named family. The rest stay standalone guides.
  const pagedFamilies = families.filter((family) => family.hasPage);
  for (const symptom of symptoms) {
    const named = pagedFamilies.filter((family) => guideNamesModel(symptom, family));
    const hub = hubs.find((item) => new RegExp(item.pattern).test(symptom.slug));
    // Last resort: every source the guide cites belongs to exactly one model table.
    const covering = symptom.sourceIds.length
      ? pagedFamilies.filter((family) => symptom.sourceIds.every((id) => family.sourceIds.includes(id)))
      : [];
    const topic = named.length === 1 ? named[0] : hub ?? named[0] ?? (covering.length === 1 ? covering[0] : null);
    symptom.topic = topic;
    if (symptom.indexable) {
      if (topic) {
        symptom.anchor = `guide-${symptom.slug}`;
        symptom.target = `${topic.path}#${symptom.anchor}`;
        (topic.kind === "hub" ? topic.guides : topic.ownGuides).push(symptom);
      } else {
        symptom.target = symptom.path;
      }
    } else {
      // Record-and-call prep pages stay as noindex pages: homepage search still lists them, and a
      // redirect would send that search card to a page without its checklist.
      symptom.target = symptom.path;
    }
  }
  for (const topic of [...pagedFamilies, ...hubs]) {
    topic.notes = notesByTopic[topic.slug] ?? null;
  }

  const redirects = [];
  for (const entry of corpus.entries) {
    const from = `/codes/${entry.slug}/`;
    const to = entryPaths[entry.slug];
    if (to !== from) redirects.push({ from, to });
  }
  for (const symptom of symptoms) {
    if (symptom.target !== symptom.path) redirects.push({ from: symptom.path, to: symptom.target });
  }
  const symptomPaths = Object.fromEntries(symptoms.map((symptom) => [symptom.slug, symptom.target]));

  for (const group of codeGroups) {
    group.guides = relatedGuides(group.entries, 8).filter((guide) => guide.target === guide.path || guide.topic);
  }

  const brands = uniq(corpus.entries.map((entry) => entry.brand)).sort();

  return {
    site: corpus.site,
    sourcesById,
    symptomsById,
    families,
    familyByEntryId,
    lineByEntryId,
    codeGroups,
    groupByEntryId,
    redirects,
    entryPaths,
    symptomPaths,
    symptoms,
    symptomModelById,
    brands,
    hubs,
    anchorFor,
  };
}

export function familySearchIndex(model) {
  return model.families
    .filter((family) => family.hasPage)
    .map((family) => ({
      slug: family.slug,
      path: family.path,
      name: family.name,
      brand: family.brand,
      equipmentType: family.equipmentType,
      models: family.models,
      lines: family.lines.map((line) => line.name),
      codeCount: family.codeGroups.length,
    }));
}
