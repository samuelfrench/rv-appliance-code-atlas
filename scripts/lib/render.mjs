// HTML renderers for the prerendered static pages. Each page function returns
// { route, title, description, robots, body, breadcrumbs } for the page writer.
import { brandSlug, guideNamesModel, isShortCode, shortMeaning } from "./site-model.mjs";

const SITE_NAME = "RV Appliance Code Atlas";

const CATEGORY_BY_TYPE = {
  Refrigerator: "Refrigerators",
  Generator: "Generators",
  "Water heater": "Water heaters",
  Furnace: "Furnaces",
  "Rooftop air conditioner": "Air conditioners and thermostats",
  Thermostat: "Air conditioners and thermostats",
  "Leveling system": "Leveling and slide-outs",
  "Slide-out": "Leveling and slide-outs",
  "Induction cooktop": "Cooking and fireplaces",
  "Electric fireplace": "Cooking and fireplaces",
};
const CATEGORY_ORDER = [
  "Refrigerators",
  "Generators",
  "Water heaters",
  "Furnaces",
  "Air conditioners and thermostats",
  "Leveling and slide-outs",
  "Cooking and fireplaces",
];

const GAUGE_SVG =
  '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>';
const ALERT_SVG =
  '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>';

export function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function lower(value) {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function plural(count, one, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

const STOPWORDS = new Set(
  "a an and are as at be before by do does for from if in is it its not of on or the then this to when with your you only any".split(" "),
);

function wordSet(value) {
  return new Set(value.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word && !STOPWORDS.has(word)));
}

// Drops repeated guidance merged from several manuals: an item is a duplicate when
// nearly all of its words already appear in another item (the longer wording is kept).
export function dedupeText(values) {
  const items = [];
  for (const value of values) {
    if (!value?.trim()) continue;
    const words = wordSet(value);
    const index = items.findIndex((item) => {
      const [small, large] = item.words.size <= words.size ? [item.words, words] : [words, item.words];
      if (!small.size) return true;
      let shared = 0;
      for (const word of small) if (large.has(word)) shared += 1;
      return shared / small.size >= 0.85;
    });
    if (index === -1) items.push({ value, words });
    else if (value.length > items[index].value.length) items[index] = { value, words };
  }
  return items.map((item) => item.value);
}

const ATTRIBUTION =
  /^(?:for [^,]{1,120}, )?the (?:official )?[^.]{0,140}?\b(?:page|pages|manual|manuals|guide|guides|instructions|tables?|documentation|catalog)\b(?: for [^.]{1,80}?)? (says|say|lists|list|states|state|maps|map|identifies|identify|uses|use|explains|explain|describes|describe|shows|show|warns|warn|asks|ask|notes|note|treats|treat) (?:that )?/i;

// Compact meaning for tables: the manufacturer's label, or the sentence without its attribution prefix.
export function compactMeaning(entry) {
  const label = shortMeaning(entry);
  if (label) return label;
  const match = entry.plainMeaning.match(ATTRIBUTION);
  if (!match) return entry.plainMeaning;
  let rest = entry.plainMeaning.slice(match[0].length);
  if (/^maps?$/i.test(match[1])) {
    const target = rest.match(/^.{0,80}? to (.+)$/s);
    if (target) rest = target[1];
  }
  rest = rest.replace(/^to /, "");
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

function captureHintsFor(entries, cap) {
  return dedupeText(entries.flatMap((entry) => entry.partCaptureHints).filter((hint) => !/photo of (?:the )?(?:display )?(?:fault|code|error|w\d|e\d)\s*\S*\d/i.test(hint))).slice(0, cap);
}

function list(items) {
  return `<ul>${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
}

function linkList(links, className = "link-list") {
  return `<ul class="${className}">${links
    .map((link) => `<li><a href="${esc(link.href)}">${esc(link.label)}</a>${link.note ? ` <small>${esc(link.note)}</small>` : ""}</li>`)
    .join("")}</ul>`;
}

export function categoryForType(type) {
  return CATEGORY_BY_TYPE[type] ?? "Other appliances";
}

export function siteHeaderHtml() {
  return `<header class="site-header"><a href="/" class="mark" aria-label="${SITE_NAME} home">${GAUGE_SVG}<span>RV Atlas</span></a><nav aria-label="Primary navigation"><a href="/#appliances">Appliances</a><a href="/guides/">Guides</a><a href="/#search">Search</a></nav></header>`;
}

export function siteFooterHtml() {
  return `<footer><p>Free lookup built only from manufacturer manuals and support pages. Not affiliated with any manufacturer. No DIY gas, electrical, or refrigerant repair instructions; call the appliance maker, your RV dealer, or a qualified RV technician for repairs.</p></footer>`;
}

function breadcrumbsHtml(crumbs) {
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${crumbs
    .map((crumb, index) =>
      index === crumbs.length - 1 ? `<li aria-current="page">${esc(crumb.label)}</li>` : `<li><a href="${esc(crumb.href)}">${esc(crumb.label)}</a></li>`,
    )
    .join("")}</ol></nav>`;
}

function searchFormHtml() {
  return `<form class="inline-search" action="/" method="get" role="search"><label for="page-search">Search another code or model</label><div><input id="page-search" name="q" type="search" placeholder="e.g. Onan 36, Norcold no FL, RM10 08" /><button type="submit">Search</button></div></form>`;
}

function safetyCalloutHtml(texts) {
  return `<div class="safety-callout">${ALERT_SVG}<div>${texts.map((text) => `<p>${esc(text)}</p>`).join("")}</div></div>`;
}

function sourcesHtml(model, sourceIds, heading = "Official sources", cap = 24) {
  const sources = sourceIds.map((id) => model.sourcesById.get(id)).filter(Boolean);
  if (!sources.length) return "";
  const shown = sources.slice(0, cap);
  const more = sources.length - shown.length;
  return `<section><h2>${esc(heading)}</h2><div class="source-list compact">${shown
    .map(
      (source) =>
        `<a href="${esc(source.url)}" class="source-row" target="_blank" rel="noopener"><span>${esc(source.brand)}</span><strong>${esc(source.title)}</strong></a>`,
    )
    .join("")}</div>${more > 0 ? `<p class="muted">Plus ${plural(more, "more official source")}.</p>` : ""}</section>`;
}

function guidesHtml(guides, heading = "Troubleshooting guides") {
  if (!guides.length) return "";
  return `<section><h2>${esc(heading)}</h2>${linkList(guides.map((guide) => ({ href: guide.path, label: guide.title })))}</section>`;
}

function page(model, { route, title, description, robots = "index,follow", crumbs, inner }) {
  const body = `${siteHeaderHtml()}<main class="detail-main">${crumbs ? breadcrumbsHtml(crumbs) : ""}<article class="detail-article">${inner}</article>${searchFormHtml()}</main>${siteFooterHtml()}`;
  return { route, title, description, robots, body, crumbs };
}

// ---------- code pages ----------

export function codeHeading(group) {
  const equipment = lower(group.equipmentType);
  if (isShortCode(group.code)) {
    const base = `${group.brandLabel} ${equipment} code ${group.code}`;
    return group.meanings.consensus ? `${base}: ${group.meanings.consensus}` : base;
  }
  return `${group.brandLabel} ${equipment}: ${group.code}`;
}

function orderedEntries(model, entries) {
  const familyOrder = new Map(model.families.map((family, index) => [family.slug, index]));
  return [...entries].sort((a, b) => {
    const fa = familyOrder.get(model.familyByEntryId.get(a.id).slug);
    const fb = familyOrder.get(model.familyByEntryId.get(b.id).slug);
    if (fa !== fb) return fa - fb;
    const la = model.familyByEntryId.get(a.id).lines.indexOf(model.lineByEntryId.get(a.id));
    const lb = model.familyByEntryId.get(b.id).lines.indexOf(model.lineByEntryId.get(b.id));
    return la - lb;
  });
}

export function codeLead(model, group) {
  const lines = new Set(group.entries.map((entry) => model.lineByEntryId.get(entry.id)));
  const { consensus, majority, exceptions, labelled } = group.meanings;
  const docs = `${group.brandLabel} documentation`;
  const quoted = isShortCode(group.code) ? group.code : `“${group.code}”`;
  if (consensus) {
    return lines.size > 1
      ? `${docs} for ${plural(lines.size, "model line")} lists ${quoted} as “${consensus}”.`
      : `${docs} lists ${quoted} as “${consensus}”.`;
  }
  if (majority) {
    const differing = exceptions
      .map((item) => `${model.lineByEntryId.get(item.entry.id).name} (“${item.label}”)`)
      .filter((value, index, all) => all.indexOf(value) === index);
    return `Most ${docs} lists ${quoted} as “${majority}”. Some model lines word it differently or give it a different meaning: ${differing.join("; ")}.`;
  }
  if (labelled.length > 1) {
    const byLine = labelled
      .map((item) => `${model.lineByEntryId.get(item.entry.id).name} (“${item.label}”)`)
      .filter((value, index, all) => all.indexOf(value) === index);
    return `${docs} describes ${quoted} separately for each model line: ${byLine.join("; ")}. Compare the wording for your model below.`;
  }
  const first = group.entries.find((entry) => !/\b(fault|warning|error) message\b/i.test(entry.plainMeaning)) ?? group.entries[0];
  return lines.size > 1 ? `${quoted} appears for ${plural(lines.size, "model line")}. ${first.plainMeaning}` : first.plainMeaning;
}

export function codePage(model, group) {
  const entries = orderedEntries(model, group.entries);
  const lines = [...new Set(entries.map((entry) => model.lineByEntryId.get(entry.id)))];
  const heading = codeHeading(group);
  const lead = codeLead(model, group);

  const rows = entries
    .map((entry) => {
      const family = model.familyByEntryId.get(entry.id);
      const line = model.lineByEntryId.get(entry.id);
      const sources = entry.sourceIds.map((id) => model.sourcesById.get(id)).filter(Boolean);
      const lineCell = family.hasPage ? `<a href="${family.path}">${esc(line.name)}</a>` : esc(line.name);
      const shownAs = entry.code.toLowerCase() === group.code.toLowerCase() ? "" : `<small>Shown as: ${esc(entry.code)}</small>`;
      return `<tr id="${esc(entry.id)}"><td>${lineCell}${shownAs}</td><td>${esc(entry.plainMeaning)}</td><td>${sources
        .map((source) => `<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)}</a>`)
        .join("<br />")}</td></tr>`;
    })
    .join("");

  const ownerActions = dedupeText(entries.flatMap((entry) => entry.ownerSafeActions));
  const serviceActions = dedupeText(entries.flatMap((entry) => entry.serviceOnlyActions));
  const boundaries = dedupeText(entries.map((entry) => entry.safetyBoundary));
  const captureHints = captureHintsFor(entries, 10);

  let siblings = "";
  if (group.families.length <= 2) {
    siblings = group.families
      .map((family) => {
        const others = orderedFamilyGroups(family).filter((other) => other !== group);
        if (!others.length) return "";
        const title = family.hasPage ? `<a href="${family.path}">${esc(family.name)}</a>` : esc(family.name);
        return `<section><h2>Other codes on ${esc(family.name)}</h2><p>Full table: ${title}</p>${linkList(
          others.slice(0, 60).map((other) => ({
            href: other.path,
            label: other.code,
            note: familyRowLabel(model, family, other, 90),
          })),
          "code-chips",
        )}</section>`;
      })
      .join("");
  } else {
    siblings = `<section><h2>Full code tables for these models</h2>${linkList(
      group.families.filter((family) => family.hasPage).map((family) => ({ href: family.path, label: family.name, note: plural(family.codeGroups.length, "code") })),
    )}</section>`;
  }

  const inner = [
    `<p class="eyebrow">${esc(group.brandLabel)} ${esc(lower(group.equipmentType))} · ${esc(plural(lines.length, "model line"))}</p>`,
    `<h1>${esc(heading)}</h1>`,
    `<p class="detail-meaning">${esc(lead)}</p>`,
    lines.length > 1
      ? `<p class="model-warning"><strong>Check your model first.</strong> The same code can mean different things on different models. Find the model number on the appliance's data label, then use the matching row below.</p>`
      : "",
    `<section><h2>What ${esc(isShortCode(group.code) ? `code ${group.code}` : "this message")} means by model</h2><div class="table-scroll"><table class="code-table"><thead><tr><th scope="col">Model line</th><th scope="col">What the manufacturer says</th><th scope="col">Source</th></tr></thead><tbody>${rows}</tbody></table></div></section>`,
    `<div class="detail-columns"><section><h2>What you can safely check</h2>${list(ownerActions)}</section><section><h2>Stop and call a technician for</h2>${list(serviceActions)}</section></div>`,
    safetyCalloutHtml(boundaries),
    captureHints.length ? `<section><h2>Write this down before you call</h2>${list(captureHints)}</section>` : "",
    siblings,
    guidesHtml(group.guides, "Related troubleshooting guides"),
    sourcesHtml(model, group.sourceIds),
  ].join("");

  const family = group.families[0];
  const crumbs = [
    { href: "/", label: "Home" },
    { href: `/brands/${brandSlug(group.brand)}/`, label: group.brandLabel },
    family.hasPage && group.families.length === 1 ? { href: family.path, label: family.name } : null,
    { href: group.path, label: isShortCode(group.code) ? `Code ${group.code}` : group.code },
  ].filter(Boolean);

  return page(model, {
    route: group.path,
    title:
      lines.length > 1 && !group.meanings.consensus
        ? `${heading}${group.meanings.majority && isShortCode(group.code) ? ` (${group.meanings.majority})` : ""} – meaning by model`
        : heading,
    description: truncate(
      `${isShortCode(group.code) ? `${group.brandLabel} ${lower(group.equipmentType)} code ${group.code}` : `${group.brandLabel} ${lower(group.equipmentType)} “${group.code}”`} on ${
        lines.length > 3 ? `${lines.length} model lines` : lines.map((line) => line.name).join("; ")
      }. ${lead}`,
      300,
    ),
    crumbs,
    inner,
  });
}

// ---------- family (model) pages ----------

const PLURAL_TYPES =
  /\b(refrigerators|generators|furnaces|thermostats|water heaters|cooktops|air conditioners|systems|fireplaces)\b/g;

// "Dometic RUA refrigerators" -> "Dometic RUA refrigerator fault codes";
// a trailing "(model list)" stays at the end.
export function familyHeading(family) {
  const singular = family.name.replace(PLURAL_TYPES, (word) => word.replace(/s$/, ""));
  const match = singular.match(/^(.*?)\s*(\([^)]*\))$/);
  return match ? `${match[1]} fault codes ${match[2]}` : `${singular} fault codes`;
}

// Numbered code sets (E1, W05, 36, P3) read best in numeric order; message and lamp-state
// tables keep the manual's order.
export function orderedFamilyGroups(family) {
  const numbered = family.codeGroups.every((group) => /^[A-Za-z]{0,3}\s?\d+$/.test(group.code));
  if (!numbered) return family.codeGroups;
  return [...family.codeGroups].sort((a, b) => a.code.localeCompare(b.code, "en", { numeric: true, sensitivity: "base" }));
}

// Meaning for one code row on a family table, using only that family's entries.
export function familyRowLabel(model, family, group, maxLength = 0) {
  const entries = group.entries.filter((entry) => model.familyByEntryId.get(entry.id) === family);
  const specific = entries.filter((entry) => shortMeaning(entry) || !/\b(fault|warning|error) message\b/i.test(entry.plainMeaning));
  const pool = specific.length ? specific : entries;
  const labels = dedupeText(pool.map((entry) => compactMeaning(entry)));
  const text = labels.length === 1 ? labels[0] : labels.join(" / ");
  return maxLength && text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function familyRowLines(model, family, group) {
  const lines = new Set(
    group.entries.filter((entry) => model.familyByEntryId.get(entry.id) === family).map((entry) => model.lineByEntryId.get(entry.id)),
  );
  if (lines.size === family.lines.length) return "All listed models";
  return family.lines.filter((line) => lines.has(line)).map((line) => line.name).join("; ");
}

export function familyPage(model, family) {
  const multiLine = family.lines.length > 1;
  const rows = orderedFamilyGroups(family)
    .map((group) => {
      return `<tr><th scope="row"><a href="${group.path}">${esc(group.code)}</a></th><td>${esc(familyRowLabel(model, family, group))}</td>${
        multiLine ? `<td>${esc(familyRowLines(model, family, group))}</td>` : ""
      }</tr>`;
    })
    .join("");

  const sourceTypes = [...new Set(family.sourceIds.map((id) => model.sourcesById.get(id)?.type ?? ""))];
  const hasManual = sourceTypes.some((type) => /manual|guide|quick|handbook|pdf/.test(type));
  const hasSupport = sourceTypes.some((type) => /support|faq|video|product/.test(type));
  const docKind = hasManual && hasSupport ? "manuals and support pages" : hasManual ? "manuals" : "support pages";
  const lead = `Every fault code, display message, and status light listed in ${family.brandLabel}'s ${docKind} for ${family.lines
    .map((line) => line.name)
    .join("; ")}. Select a code for what it means, what you can safely check, and when to call a technician.`;

  const also = family.alsoListed
    .map(
      (item) =>
        `<section><h2>Also listed for these models</h2><p>${esc(item.family.name)} support pages name some of the models on this page. Those codes are in the <a href="${item.family.path}">${esc(
          item.family.name,
        )} table</a>:</p>${linkList(
          [...new Set(item.entries.map((entry) => model.groupByEntryId.get(entry.id)))].map((group) => ({
            href: group.path,
            label: group.code,
            note: familyRowLabel(model, item.family, group, 90),
          })),
          "code-chips",
        )}</section>`,
    )
    .join("");

  const boundaries = dedupeText(family.entries.map((entry) => entry.safetyBoundary));
  const inner = [
    `<p class="eyebrow">${esc(family.brandLabel)} · ${esc(plural(family.codeGroups.length, "code"))}</p>`,
    `<h1>${esc(familyHeading(family))}</h1>`,
    `<p class="detail-meaning">${esc(lead)}</p>`,
    `<section class="find-model"><h2>Confirm your model</h2><p>Codes are model-specific. Match the model number on the appliance data label to one of these before using the table:</p><p class="model-list">${esc(
      family.models.join(", "),
    )}</p>${captureHintsFor(family.entries, 8).length ? `<h3>Where to look and what to record</h3>${list(captureHintsFor(family.entries, 8))}` : ""}</section>`,
    `<section><h2>Code table</h2><div class="table-scroll"><table class="code-table"><thead><tr><th scope="col">Code</th><th scope="col">What the manufacturer says</th>${
      multiLine ? '<th scope="col">Listed for</th>' : ""
    }</tr></thead><tbody>${rows}</tbody></table></div></section>`,
    safetyCalloutHtml(boundaries.slice(0, 3)),
    also,
    guidesHtml(family.guides),
    sourcesHtml(model, family.sourceIds, "Official manuals and support pages"),
  ].join("");

  return page(model, {
    route: family.path,
    title: `${familyHeading(family)} and display messages`,
    description: `${family.codeGroups.length} ${family.brandLabel} fault codes for ${family.lines
      .map((line) => line.name)
      .join("; ")}, with owner-safe checks and links to the official manuals.`.slice(0, 300),
    crumbs: [
      { href: "/", label: "Home" },
      { href: `/brands/${brandSlug(family.brand)}/`, label: family.brandLabel },
      { href: family.path, label: family.name },
    ],
    inner,
  });
}

// ---------- brand hubs ----------

function brandTokens(brand) {
  return brand.split("/").map((token) => token.trim().toLowerCase());
}

export function guidesForBrand(model, brand) {
  const tokens = brandTokens(brand);
  return model.symptoms.filter(
    (symptom) =>
      symptom.indexable &&
      symptom.sourceIds.length <= 20 &&
      symptom.brands.some((sourceBrand) => brandTokens(sourceBrand).some((token) => tokens.includes(token))),
  );
}

export function brandPage(model, brand) {
  const label = model.families.find((family) => family.brand === brand)?.brandLabel ?? brand;
  const families = model.families.filter((family) => family.brand === brand);
  const withPage = families.filter((family) => family.hasPage);
  const singles = families.filter((family) => !family.hasPage).flatMap((family) => family.codeGroups);
  const codeCount = families.reduce((total, family) => total + family.codeGroups.length, 0);
  const guides = guidesForBrand(model, brand);

  const byCategory = new Map();
  for (const family of withPage) {
    const category = categoryForType(family.equipmentType);
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category).push(family);
  }

  const inner = [
    `<p class="eyebrow">${esc(label)}</p>`,
    `<h1>${esc(label)} RV appliance fault codes</h1>`,
    `<p class="detail-meaning">${esc(
      `${codeCount} ${label} fault codes and display messages across ${plural(families.reduce((n, f) => n + f.lines.length, 0), "model line")}, each taken from ${label}'s own manuals and support pages. Pick your appliance and model to see its full code table.`,
    )}</p>`,
    ...CATEGORY_ORDER.filter((category) => byCategory.has(category)).map(
      (category) =>
        `<section><h2>${esc(category)}</h2>${linkList(
          byCategory.get(category).map((family) => ({ href: family.path, label: `${family.name}`, note: plural(family.codeGroups.length, "code") })),
        )}</section>`,
    ),
    singles.length
      ? `<section><h2>Other ${esc(label)} codes</h2>${linkList(singles.map((group) => ({ href: group.path, label: codeHeading(group) })))}</section>`
      : "",
    guidesHtml(guides, `${label} troubleshooting guides`),
  ].join("");

  return page(model, {
    route: `/brands/${brandSlug(brand)}/`,
    title: `${label} RV appliance fault codes by model`,
    description: `${codeCount} ${label} RV appliance fault codes organized by model, with owner-safe checks and links to official ${label} manuals.`,
    crumbs: [
      { href: "/", label: "Home" },
      { href: `/brands/${brandSlug(brand)}/`, label },
    ],
    inner,
  });
}

// ---------- symptom guides ----------

export function symptomPage(model, symptom) {
  const entries = model.codeGroups.filter((group) => group.symptomIds.includes(symptom.id));
  const sourceSet = new Set(symptom.sourceIds);
  const families = model.families.filter(
    (family) =>
      family.hasPage &&
      ((symptom.sourceIds.length <= 20 && family.sourceIds.some((id) => sourceSet.has(id))) || guideNamesModel(symptom, family)),
  );

  const inner = [
    `<p class="eyebrow">Troubleshooting guide</p>`,
    `<h1>${esc(symptom.title)}</h1>`,
    `<p class="detail-meaning">${esc(symptom.summary)}</p>`,
    safetyCalloutHtml([model.site.safetyBoundary]),
    `<section><h2>Owner-safe checklist</h2>${list(symptom.safeChecklist)}<button type="button" class="print-button" onclick="window.print()">Print checklist</button></section>`,
    families.length
      ? `<section><h2>Code tables for these appliances</h2>${linkList(
          families.map((family) => ({ href: family.path, label: family.name, note: plural(family.codeGroups.length, "code") })),
        )}</section>`
      : "",
    entries.length
      ? `<section><h2>Related fault codes</h2>${linkList(
          entries.slice(0, 24).map((group) => ({ href: group.path, label: codeHeading(group) })),
        )}${entries.length > 24 ? `<p class="muted">Plus ${plural(entries.length - 24, "more code")}; browse by model from the <a href="/#appliances">appliance list</a>.</p>` : ""}</section>`
      : "",
    sourcesHtml(model, symptom.sourceIds, "Official sources", 12),
  ].join("");

  return page(model, {
    route: symptom.path,
    title: symptom.title,
    description: symptom.summary,
    robots: symptom.indexable ? "index,follow" : "noindex,follow",
    crumbs: [
      { href: "/", label: "Home" },
      { href: "/guides/", label: "Guides" },
      { href: symptom.path, label: symptom.title },
    ],
    inner,
  });
}

export function guidesIndexPage(model) {
  const guides = model.symptoms.filter((symptom) => symptom.indexable);
  const byBrand = new Map();
  for (const guide of guides) {
    const brand = guide.sourceIds.length > 20 || guide.brands.length > 2 ? "All brands" : guide.brands[0] ?? "All brands";
    const key = brand.split("/")[0];
    if (!byBrand.has(key)) byBrand.set(key, []);
    byBrand.get(key).push(guide);
  }
  const keys = [...byBrand.keys()].sort((a, b) => (a === "All brands" ? -1 : b === "All brands" ? 1 : a.localeCompare(b)));
  const inner = [
    `<p class="eyebrow">${plural(guides.length, "guide")}</p>`,
    `<h1>RV appliance troubleshooting guides</h1>`,
    `<p class="detail-meaning">Symptom-first guides for when there is no code on the display: not cooling, no hot water, lockouts, odors, leaks, and power problems. Each guide is limited to owner-safe checks from the manufacturer's own documentation.</p>`,
    ...keys.map(
      (key) =>
        `<section><h2>${esc(key)}</h2>${linkList(byBrand.get(key).sort((a, b) => a.title.localeCompare(b.title)).map((guide) => ({ href: guide.path, label: guide.title })))}</section>`,
    ),
  ].join("");
  return page(model, {
    route: "/guides/",
    title: "RV appliance troubleshooting guides by brand",
    description: "Owner-safe RV appliance troubleshooting guides for refrigerators, water heaters, furnaces, air conditioners, generators, toilets, and more, sourced from manufacturer documentation.",
    crumbs: [
      { href: "/", label: "Home" },
      { href: "/guides/", label: "Guides" },
    ],
    inner,
  });
}

// ---------- home ----------

export function homeBody(model) {
  const byCategory = new Map();
  for (const family of model.families) {
    const category = categoryForType(family.equipmentType);
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category).push(family);
  }
  const familyCount = model.families.filter((family) => family.hasPage).length;
  const guideCount = model.symptoms.filter((symptom) => symptom.indexable).length;

  const categories = CATEGORY_ORDER.filter((category) => byCategory.has(category))
    .map((category) => {
      const links = byCategory.get(category).flatMap((family) =>
        family.hasPage
          ? [{ href: family.path, label: family.name, note: plural(family.codeGroups.length, "code") }]
          : family.codeGroups.map((group) => ({ href: group.path, label: codeHeading(group) })),
      );
      return `<section class="category"><h3>${esc(category)}</h3>${linkList(links)}</section>`;
    })
    .join("");

  return `${siteHeaderHtml()}<main>
<section class="hero"><div class="hero-copy"><p class="eyebrow">Free · manufacturer sources only</p><h1>${SITE_NAME}</h1><p class="hero-text">Find out what an RV appliance fault code means on your exact model, what you can safely check yourself, and when to stop and call a technician. Every answer links to the manufacturer's own manual or support page.</p><div class="hero-stats" aria-label="Coverage"><div><strong>${model.codeGroups.length}</strong><span>codes explained</span></div><div><strong>${familyCount}</strong><span>model code tables</span></div><div><strong>${guideCount}</strong><span>troubleshooting guides</span></div></div></div>
<div class="hero-stack"><figure class="hero-image"><img src="/images/rv-appliance-code-atlas-hero.jpg" alt="RV service workbench with diagnostic tools" width="1344" height="768" /></figure></div></section>
<div id="search"><div id="search-app"><form class="hero-panel" action="/" method="get" role="search"><label class="search-label" for="lookup">Search by brand, model, code, or symptom</label><div class="searchbox"><input id="lookup" name="q" type="search" placeholder="Try: Norcold no FL, Onan 36, Furrion E3" /></div></form></div></div>
<section id="appliances" class="browse-band" aria-label="Browse by appliance"><div class="section-header"><div><p class="eyebrow">Browse</p><h2>Code tables by appliance and model</h2></div></div><div class="category-grid">${categories}</div></section>
<section class="howto-band" aria-label="How to use a fault code safely"><div class="section-header"><div><p class="eyebrow">Before you touch anything</p><h2>How to use a fault code safely</h2></div></div><ol class="howto-list"><li><strong>Confirm the model.</strong> Codes are model-specific. The same code can mean different things on two refrigerators from the same brand. Read the model number off the appliance data label.</li><li><strong>Write down exactly what you see.</strong> Record the code, any flashing lights or beeps, the power source (shore, battery, LP, generator), and what the appliance was doing.</li><li><strong>Do only the owner-safe checks.</strong> Leveling, closing doors, checking that LP tanks are open and breakers are on, clearing vents: these are listed on each code page.</li><li><strong>Stop at the boundary.</strong> Gas smell, flame or exhaust problems, 120 VAC wiring, control boards, refrigerant, generator internals, and jacks or slides under load are technician work.</li></ol></section>
<div id="tools-app"></div>
<section class="brand-band" aria-label="Browse by brand"><div class="section-header"><div><p class="eyebrow">Brands</p><h2>Browse by brand</h2></div></div>${linkList(
    model.brands.map((brand) => ({ href: `/brands/${brandSlug(brand)}/`, label: `${model.families.find((family) => family.brand === brand)?.brandLabel ?? brand} fault codes` })),
    "brand-links",
  )}<p><a href="/guides/">Browse all ${guideCount} troubleshooting guides</a> for problems that do not show a code.</p></section>
</main>${siteFooterHtml()}`;
}

export function redirectHtml(to, title, baseUrl) {
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><title>${esc(title)}</title><meta name="robots" content="noindex,follow" /><link rel="canonical" href="${esc(
    `${baseUrl}${to.split("#")[0]}`,
  )}" /><meta http-equiv="refresh" content="0; url=${esc(to)}" /><script>location.replace(${JSON.stringify(to)});</script></head><body><p>This code now lives on a combined page: <a href="${esc(to)}">${esc(title)}</a>.</p></body></html>\n`;
}
