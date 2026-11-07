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
  Range: "Cooking and fireplaces",
  Toilet: "Toilets and holding tanks",
};
const CATEGORY_ORDER = [
  "Refrigerators",
  "Generators",
  "Water heaters",
  "Furnaces",
  "Air conditioners and thermostats",
  "Leveling and slide-outs",
  "Cooking and fireplaces",
  "Toilets and holding tanks",
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
  return `<section><h2>${esc(heading)}</h2>${linkList(guides.map((guide) => ({ href: guide.target ?? guide.path, label: guide.title })))}</section>`;
}

// Live URL for a code: its own page when it is a shared fault, otherwise its section on the model page.
export function groupHref(model, group, preferredTopic = null) {
  if (group.standalone) return group.path;
  const topic = group.home ?? (preferredTopic && group.topics.includes(preferredTopic) ? preferredTopic : group.topics[0]);
  return `${topic.path}#${model.anchorFor(topic, group)}`;
}

// Whether a topic page carries the full section for a code (the others link to it).
export function detailHere(topic, group) {
  return group.home ? group.home === topic : group.topics.includes(topic);
}

export function topicHeading(topic) {
  return topic.kind === "hub" ? topic.name : familyHeading(topic);
}

// Numbered citations: every sourced statement on a page points at one numbered source.
function makeCiter(model) {
  const ids = [];
  const index = new Map();
  return {
    ids,
    number(id) {
      if (!model.sourcesById.has(id)) return null;
      if (!index.has(id)) {
        ids.push(id);
        index.set(id, ids.length);
      }
      return index.get(id);
    },
  };
}

function citeHtml(citer, sourceIds, locator = "") {
  const numbers = [...new Set(sourceIds.map((id) => citer.number(id)).filter(Boolean))];
  if (!numbers.length) return "";
  const links = numbers.map((n) => `<a href="#source-${n}">${n}</a>`).join(", ");
  return ` <span class="cite">[${links}${locator ? `, ${esc(locator)}` : ""}]</span>`;
}

function sourcedList(citer, items, ordered = false) {
  const tag = ordered ? "ol" : "ul";
  return `<${tag} class="sourced-list">${items.map((item) => `<li>${esc(item.text)}${citeHtml(citer, [item.source], item.locator)}</li>`).join("")}</${tag}>`;
}

function numberedSourcesHtml(model, citer, heading = "Sources") {
  if (!citer.ids.length) return "";
  return `<section class="sources" id="sources"><h2>${esc(heading)}</h2><ol class="numbered-sources">${citer.ids
    .map((id, index) => {
      const source = model.sourcesById.get(id);
      const kind = source.type ? source.type.replace(/-/g, " ") : "";
      return `<li id="source-${index + 1}"><a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)}</a>${
        kind ? ` <small>${esc(kind)}</small>` : ""
      }</li>`;
    })
    .join("")}</ol></section>`;
}

function sourcesLineHtml(model, citer, notes) {
  const brands = [...new Set(citer.ids.map((id) => model.sourcesById.get(id)?.brand).filter(Boolean))];
  const reviewed = notes?.researchedAt ? ` Manual details reviewed ${esc(notes.researchedAt)}.` : "";
  return `<p class="sources-line"><strong>Sources:</strong> ${esc(plural(citer.ids.length, "manufacturer document"))} (${esc(
    brands.join(", ") || "manufacturer",
  )} manuals and support pages), numbered at the <a href="#sources">end of this page</a>.${reviewed}</p>`;
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

// Nearest other codes for the same brand and appliance type: shared-fault pages first, then the
// sections of the same model tables, in table order.
export function relatedCodes(model, group, limit = 3) {
  const peers = model.codeGroups.filter((other) => other.brand === group.brand && other.equipmentType === group.equipmentType);
  const ordered = [...peers].sort((a, b) => a.code.localeCompare(b.code, "en", { numeric: true, sensitivity: "base" }));
  const position = new Map(ordered.map((item, index) => [item, index]));
  const here = position.get(group);
  const sameTable = (other) => other.families.some((family) => group.families.includes(family));
  const rank = (other) => (other.standalone ? 0 : 1) + (sameTable(other) ? 0 : 2);
  return ordered
    .filter((other) => other !== group && (sameTable(other) || other.standalone))
    .sort((a, b) => rank(a) - rank(b) || Math.abs(position.get(a) - here) - Math.abs(position.get(b) - here))
    .slice(0, limit);
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
      const lineCell = family.topic ? `<a href="${family.topic.path}">${esc(line.name)}</a>` : esc(line.name);
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

  const topics = group.topics.filter(Boolean);
  const tables = topics.length
    ? `<section><h2>Full code tables for these models</h2>${linkList(
        topics.map((topic) => ({ href: topic.path, label: topicHeading(topic), note: plural(topic.codeGroups.length, "code") })),
      )}</section>`
    : "";
  const related = relatedCodes(model, group, 3);
  const relatedHtml = related.length
    ? `<section><h2>Related codes</h2>${linkList(related.map((other) => ({ href: groupHref(model, other), label: codeHeading(other) })))}</section>`
    : "";
  const sourceCount = group.sourceIds.filter((id) => model.sourcesById.has(id)).length;

  const inner = [
    `<p class="eyebrow">${esc(group.brandLabel)} ${esc(lower(group.equipmentType))} · ${esc(plural(lines.length, "model line"))}</p>`,
    `<h1>${esc(heading)}</h1>`,
    `<p class="detail-meaning">${esc(lead)}</p>`,
    `<p class="sources-line"><strong>Sources:</strong> ${esc(plural(sourceCount, "manufacturer document"))}, linked in the table and listed at the end of this page.</p>`,
    lines.length > 1
      ? `<p class="model-warning"><strong>Check your model first.</strong> The same code can mean different things on different models. Find the model number on the appliance's data label, then use the matching row below.</p>`
      : "",
    `<section><h2>What ${esc(isShortCode(group.code) ? `code ${group.code}` : "this message")} means by model</h2><div class="table-scroll"><table class="code-table"><thead><tr><th scope="col">Model line</th><th scope="col">What the manufacturer says</th><th scope="col">Source</th></tr></thead><tbody>${rows}</tbody></table></div></section>`,
    `<div class="detail-columns"><section><h2>What you can safely check</h2>${list(ownerActions)}</section><section><h2>Stop and call a technician for</h2>${list(serviceActions)}</section></div>`,
    safetyCalloutHtml(boundaries),
    captureHints.length ? `<section><h2>Write this down before you call</h2>${list(captureHints)}</section>` : "",
    tables,
    relatedHtml,
    guidesHtml(group.guides, "Related troubleshooting guides"),
    sourcesHtml(model, group.sourceIds),
  ].join("");

  const family = group.families[0];
  const crumbs = [
    { href: "/", label: "Home" },
    { href: `/brands/${brandSlug(group.brand)}/`, label: group.brandLabel },
    family.topic && group.families.length === 1 ? { href: family.topic.path, label: family.topic.name } : null,
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

function topicFamilies(topic) {
  return topic.kind === "hub" ? topic.memberFamilies : [topic];
}

// Entries a topic page shows for a code: every model line on the code's home page, otherwise only
// this page's own model lines.
function topicEntries(model, topic, group) {
  if (group.home === topic) return group.entries;
  const families = topicFamilies(topic);
  return group.entries.filter((entry) => families.includes(model.familyByEntryId.get(entry.id)));
}

function topicRowLabel(model, topic, group, maxLength = 0) {
  const family = topicFamilies(topic).find((item) => group.families.includes(item));
  if (!family) {
    const label = group.meanings.consensus ?? group.meanings.majority ?? familyRowLabel(model, group.families[0], group);
    return maxLength && label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
  }
  return familyRowLabel(model, family, group, maxLength);
}

function topicRowLines(model, topic, group) {
  const lines = new Set(topicEntries(model, topic, group).map((entry) => model.lineByEntryId.get(entry.id)));
  const allLines = topicFamilies(topic).flatMap((family) => family.lines);
  if (allLines.length && [...lines].every((line) => allLines.includes(line)) && lines.size === allLines.length) return "All listed models";
  if (lines.size > 3) return plural(lines.size, "model line");
  return [...lines].map((line) => line.name).join("; ");
}

export function topicCodeGroups(topic) {
  const groups = topic.kind === "hub" ? topic.codeGroups : orderedFamilyGroups(topic);
  const numbered = groups.every((group) => /^[A-Za-z]{0,3}\s?\d+$/.test(group.code));
  if (topic.kind !== "hub" || !numbered) return groups;
  return [...groups].sort((a, b) => a.code.localeCompare(b.code, "en", { numeric: true, sensitivity: "base" }));
}

// Owner and technician actions repeated on most codes of one table are shown once for the table.
function commonActions(model, topic, groups) {
  const count = (key) => {
    const counts = new Map();
    for (const group of groups) {
      for (const action of new Set(topicEntries(model, topic, group).flatMap((entry) => entry[key]))) counts.set(action, (counts.get(action) ?? 0) + 1);
    }
    const threshold = Math.max(3, Math.ceil(groups.length * 0.4));
    return new Set([...counts].filter(([, n]) => n >= threshold).map(([action]) => action));
  };
  const safetyCounts = new Map();
  for (const group of groups) {
    for (const text of new Set(topicEntries(model, topic, group).map((entry) => entry.safetyBoundary))) safetyCounts.set(text, (safetyCounts.get(text) ?? 0) + 1);
  }
  const safetyThreshold = Math.max(2, Math.ceil(groups.length * 0.4));
  const safety = new Set([...safetyCounts].filter(([, n]) => n >= safetyThreshold).map(([text]) => text));
  return { owner: count("ownerSafeActions"), service: count("serviceOnlyActions"), safety };
}

function codeDetailHtml(model, topic, group, citer, common) {
  const entries = orderedEntries(model, topicEntries(model, topic, group));
  const short = group.meanings.consensus ?? group.meanings.majority ?? entries.map((entry) => shortMeaning(entry)).find(Boolean) ?? null;
  const label = short && short.length <= 70 && short.toLowerCase() !== group.code.toLowerCase() ? short : null;
  const base = isShortCode(group.code) ? `Code ${group.code}` : group.code;
  const heading = label ? `${base}: ${label}` : base;
  const byMeaning = new Map();
  for (const entry of entries) {
    const key = entry.plainMeaning;
    if (!byMeaning.has(key)) byMeaning.set(key, { lines: [], sourceIds: [] });
    byMeaning.get(key).lines.push(model.lineByEntryId.get(entry.id).name);
    byMeaning.get(key).sourceIds.push(...entry.sourceIds);
  }
  const meanings = [...byMeaning]
    .map(([meaning, item]) =>
      byMeaning.size > 1
        ? `<p><strong>${esc([...new Set(item.lines)].join("; "))}:</strong> ${esc(meaning)}${citeHtml(citer, item.sourceIds)}</p>`
        : `<p>${esc(meaning)}${citeHtml(citer, item.sourceIds)}</p>`,
    )
    .join("");
  const owner = dedupeText(entries.flatMap((entry) => entry.ownerSafeActions).filter((action) => !common.owner.has(action)));
  const service = dedupeText(entries.flatMap((entry) => entry.serviceOnlyActions).filter((action) => !common.service.has(action)));
  const safety = dedupeText(entries.map((entry) => entry.safetyBoundary).filter((text) => !common.safety.has(text)));
  const shownAs = [...new Set(entries.map((entry) => entry.code).filter((code) => code.toLowerCase() !== group.code.toLowerCase()))];
  return `<section class="code-detail" id="${esc(model.anchorFor(topic, group))}"><h3>${esc(heading)}</h3>${
    shownAs.length ? `<p class="muted">Shown on the display as: ${esc(shownAs.join(", "))}</p>` : ""
  }${meanings}${owner.length ? `<p class="detail-label">What you can check</p>${list(owner)}` : ""}${
    service.length ? `<p class="detail-label">Technician only</p>${list(service)}` : ""
  }${safety.length ? `<p class="detail-label">Safety</p>${safety.map((text) => `<p class="detail-safety">${esc(text)}</p>`).join("")}` : ""}</section>`;
}

function guideDetailHtml(guide, citer) {
  return `<section class="guide-detail" id="${esc(guide.anchor)}"><h3>${esc(guide.title)}</h3><p>${esc(guide.summary)}${citeHtml(
    citer,
    guide.sourceIds.slice(0, 6),
  )}</p>${list(guide.safeChecklist)}</section>`;
}

function topicLead(model, topic) {
  if (topic.kind === "hub") {
    const codes = topic.codeGroups.length;
    const titles = topic.guides.slice(0, 4).map((guide) => lower(guide.title)).join("; ");
    return `Owner-safe checks for ${plural(topic.guides.length, `${topic.brandLabel} problem`)}${
      codes ? ` and ${plural(codes, "fault code")}` : ""
    }, taken only from ${topic.brandLabel}'s own manuals and support pages${titles ? `: ${titles}` : ""}.`;
  }
  const sourceTypes = [...new Set(topic.sourceIds.map((id) => model.sourcesById.get(id)?.type ?? ""))];
  const hasManual = sourceTypes.some((type) => /manual|guide|quick|handbook|pdf/.test(type));
  const hasSupport = sourceTypes.some((type) => /support|faq|video|product/.test(type));
  const docKind = hasManual && hasSupport ? "manuals and support pages" : hasManual ? "manuals" : "support pages";
  return `Every fault code, display message, and status light listed in ${topic.brandLabel}'s ${docKind} for ${topic.lines
    .map((line) => line.name)
    .join("; ")}, with what each one means, what you can safely check, and when to call a technician.`;
}

function relatedTopics(model, topic, limit = 4) {
  const all = [...model.families.filter((family) => family.hasPage), ...model.hubs];
  const sameType = (other) => other.equipmentType === topic.equipmentType || categoryForType(other.equipmentType) === categoryForType(topic.equipmentType);
  return all
    .filter((other) => other !== topic && other.brand === topic.brand)
    .sort((a, b) => Number(sameType(b)) - Number(sameType(a)) || topicHeading(a).localeCompare(topicHeading(b)))
    .slice(0, limit);
}

const NOTE_SECTIONS = [
  ["display", "How a fault shows up", false],
  ["reset", "Clearing a fault", false],
  ["checks", "Owner checks, in order", true],
];
const NOTE_SECTIONS_LATE = [
  ["parts", "Parts the manuals name", false],
  ["callTech", "When the manual says to call a technician", false],
];

export function topicPage(model, topic) {
  const citer = makeCiter(model);
  const notes = topic.notes;
  const groups = topicCodeGroups(topic);
  const folded = groups.filter((group) => !group.standalone && detailHere(topic, group));
  const multiLine = topicFamilies(topic).reduce((n, family) => n + family.lines.length, 0) > 1 || groups.some((group) => group.home === topic);
  const guides = topic.kind === "hub" ? topic.guides : topic.ownGuides;
  const common = commonActions(model, topic, folded);

  const rows = groups
    .map((group) => {
      const here = !group.standalone && detailHere(topic, group);
      const href = here ? `#${model.anchorFor(topic, group)}` : groupHref(model, group, topic);
      const elsewhere = !here && group.home ? ` <small>(shared with other models: <a href="${esc(href)}">${esc(topicHeading(group.home))}</a>)</small>` : "";
      return `<tr><th scope="row"><a href="${esc(href)}">${esc(group.code)}</a></th><td>${esc(topicRowLabel(model, topic, group))}${elsewhere}</td>${multiLine ? `<td>${esc(topicRowLines(model, topic, group))}</td>` : ""}</tr>`;
    })
    .join("");
  const table = groups.length
    ? `<section><h2>Code table</h2><div class="table-scroll"><table class="code-table"><thead><tr><th scope="col">Code</th><th scope="col">What the manufacturer says</th>${
        multiLine ? '<th scope="col">Listed for</th>' : ""
      }</tr></thead><tbody>${rows}</tbody></table></div></section>`
    : "";

  const noteSection = ([key, heading, ordered]) =>
    notes?.sections?.[key]?.length ? `<section><h2>${esc(heading)}</h2>${sourcedList(citer, notes.sections[key], ordered)}</section>` : "";

  const commonHtml =
    common.owner.size || common.service.size
      ? `<section><h2>Checks that apply to most of these codes</h2>${common.owner.size ? `<p class="detail-label">What you can check</p>${list([...common.owner])}` : ""}${
          common.service.size ? `<p class="detail-label">Technician only</p>${list([...common.service])}` : ""
        }</section>`
      : "";
  const details = folded.length
    ? `<section class="code-details"><h2>What each code means</h2>${folded.map((group) => codeDetailHtml(model, topic, group, citer, common)).join("")}</section>`
    : "";
  const guideSections = guides.length
    ? `<section class="guide-details"><h2>${groups.length ? "Problems without a code" : "Problems and owner checks"}</h2>${guides
        .map((guide) => guideDetailHtml(guide, citer))
        .join("")}</section>`
    : "";

  const families = topicFamilies(topic);
  const models = [...new Set(families.flatMap((family) => family.models))];
  const captureHints = captureHintsFor(families.flatMap((family) => family.entries), 8);
  const confirm =
    models.length || notes?.sections?.models?.length
      ? `<section class="find-model"><h2>Confirm your model</h2>${
          models.length
            ? `<p>Codes are model-specific. Match the model number on the appliance data label to one of these before using the table:</p><p class="model-list">${esc(models.join(", "))}</p>`
            : ""
        }${notes?.sections?.models?.length ? sourcedList(citer, notes.sections.models) : ""}${
          captureHints.length ? `<h3>Where to look and what to record</h3>${list(captureHints)}` : ""
        }</section>`
      : "";

  // Safety text shared by most codes is shown once; the rest appears in each code's section.
  const boundaries = dedupeText([...common.safety, model.site.safetyBoundary]);
  const also = (topic.alsoListed ?? [])
    .map(
      (item) =>
        `<section><h2>Also listed for these models</h2><p>${esc(item.family.name)} support pages name some of the models on this page. Those codes are in the <a href="${item.family.path}">${esc(
          item.family.name,
        )} table</a>:</p>${linkList(
          [...new Set(item.entries.map((entry) => model.groupByEntryId.get(entry.id)))].map((group) => ({
            href: groupHref(model, group, item.family),
            label: group.code,
            note: familyRowLabel(model, item.family, group, 90),
          })),
          "code-chips",
        )}</section>`,
    )
    .join("");
  const otherGuides = (topic.guides && topic.kind !== "hub" ? topic.guides : []).filter((guide) => !guides.includes(guide));
  const related = relatedTopics(model, topic);

  // Body sections are rendered first so citations are numbered in reading order.
  const summary = notes?.summary ? `<p>${esc(notes.summary.text)}${citeHtml(citer, [notes.summary.source], notes.summary.locator)}</p>` : "";
  const middle = [
    table,
    ...NOTE_SECTIONS.map(noteSection),
    commonHtml,
    details,
    guideSections,
    ...NOTE_SECTIONS_LATE.map(noteSection),
    confirm,
  ].join("");
  for (const id of [...families.flatMap((family) => family.sourceIds), ...guides.flatMap((guide) => guide.sourceIds)]) citer.number(id);
  const tail = [
    safetyCalloutHtml(boundaries),
    also,
    guidesHtml(otherGuides.slice(0, 8), "Related troubleshooting guides"),
    related.length
      ? `<section><h2>Related ${esc(topic.brandLabel)} pages</h2>${linkList(related.map((other) => ({ href: other.path, label: topicHeading(other) })))}</section>`
      : "",
    numberedSourcesHtml(model, citer, "Sources"),
  ].join("");

  const heading = topicHeading(topic);
  const eyebrow = topic.kind === "hub"
    ? `${topic.brandLabel} · ${plural(guides.length, "problem")}${groups.length ? ` · ${plural(groups.length, "code")}` : ""}`
    : `${topic.brandLabel} · ${plural(groups.length, "code")}`;
  const inner = [
    `<p class="eyebrow">${esc(eyebrow)}</p>`,
    `<h1>${esc(heading)}</h1>`,
    `<p class="detail-meaning">${esc(topicLead(model, topic))}</p>`,
    summary,
    sourcesLineHtml(model, citer, notes),
    middle,
    tail,
  ].join("");

  const description =
    topic.kind === "hub"
      ? `${topic.name}: ${guides.slice(0, 3).map((guide) => lower(guide.title)).join("; ")}. Owner-safe checks from ${topic.brandLabel} manuals.`
      : `${groups.length} ${topic.brandLabel} fault codes for ${topic.lines.map((line) => line.name).join("; ")}, what each means, owner-safe checks, and links to the official manuals.`;
  return page(model, {
    route: topic.path,
    title: topic.kind === "hub" ? `${topic.name} – owner checks from the manuals` : `${heading} and display messages`,
    description: truncate(description, 300),
    crumbs: [
      { href: "/", label: "Home" },
      model.brands.includes(topic.brand) ? { href: `/brands/${brandSlug(topic.brand)}/`, label: topic.brandLabel } : { href: "/guides/", label: "Guides" },
      { href: topic.path, label: topic.name },
    ],
    inner,
  });
}

// Kept for callers that render one model family.
export function familyPage(model, family) {
  return topicPage(model, family);
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

function topicsForBrand(model, brand) {
  return [...model.families.filter((family) => family.brand === brand && family.hasPage), ...model.hubs.filter((hub) => hub.brand === brand)];
}

export function brandPage(model, brand) {
  const label = model.families.find((family) => family.brand === brand)?.brandLabel ?? brand;
  const families = model.families.filter((family) => family.brand === brand);
  const topics = topicsForBrand(model, brand);
  const shared = model.codeGroups.filter((group) => group.brand === brand && group.standalone);
  const codeCount = families.reduce((total, family) => total + family.codeGroups.length, 0);
  const guides = guidesForBrand(model, brand).filter((guide) => guide.target === guide.path);

  const byCategory = new Map();
  for (const topic of topics) {
    const category = categoryForType(topic.equipmentType);
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category).push(topic);
  }

  const inner = [
    `<p class="eyebrow">${esc(label)}</p>`,
    `<h1>${esc(label)} RV appliance fault codes</h1>`,
    `<p class="detail-meaning">${esc(
      `${codeCount} ${label} fault codes and display messages across ${plural(families.reduce((n, f) => n + f.lines.length, 0), "model line")}, each taken from ${label}'s own manuals and support pages. Pick your appliance and model to see its full code table, what each code means, and the owner checks the manual allows.`,
    )}</p>`,
    ...CATEGORY_ORDER.filter((category) => byCategory.has(category)).map(
      (category) =>
        `<section><h2>${esc(category)}</h2><ul class="topic-list">${byCategory
          .get(category)
          .map((topic) => {
            const count = topic.codeGroups.length ? plural(topic.codeGroups.length, "code") : plural(topic.guides.length, "problem");
            const models = topicFamilies(topic).flatMap((family) => family.models);
            const detail = topic.notes?.summary?.text ?? (models.length ? `Covers ${truncate(models.join(", "), 180)}.` : "");
            return `<li><a href="${esc(topic.path)}">${esc(topic.name)}</a> <small>${esc(count)}</small>${detail ? `<p>${esc(detail)}</p>` : ""}</li>`;
          })
          .join("")}</ul></section>`,
    ),
    shared.length
      ? `<section><h2>${esc(label)} codes shared across models</h2><p>These codes mean the same fault on several ${esc(label)} model lines, so each has its own comparison page.</p>${linkList(
          shared.map((group) => ({ href: group.path, label: codeHeading(group) })),
        )}</section>`
      : "",
    guidesHtml(guides, `More ${label} troubleshooting guides`),
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
  const families = [
    ...model.families.filter(
      (family) =>
        family.hasPage &&
        ((symptom.sourceIds.length <= 20 && family.sourceIds.some((id) => sourceSet.has(id))) || guideNamesModel(symptom, family)),
    ),
    ...model.hubs.filter((hub) => symptom.sourceIds.length <= 20 && hub.guides.some((guide) => guide.sourceIds.some((id) => sourceSet.has(id)))),
  ];

  const inner = [
    `<p class="eyebrow">Troubleshooting guide</p>`,
    `<h1>${esc(symptom.title)}</h1>`,
    `<p class="detail-meaning">${esc(symptom.summary)}</p>`,
    safetyCalloutHtml([model.site.safetyBoundary]),
    `<section><h2>Owner-safe checklist</h2>${list(symptom.safeChecklist)}<button type="button" class="print-button" onclick="window.print()">Print checklist</button></section>`,
    families.length
      ? `<section><h2>Code tables for these appliances</h2>${linkList(
          families.map((family) => ({
            href: family.path,
            label: family.name,
            note: family.codeGroups.length ? plural(family.codeGroups.length, "code") : plural(family.guides.length, "problem"),
          })),
        )}</section>`
      : "",
    entries.length
      ? `<section><h2>Related fault codes</h2>${linkList(
          entries.slice(0, 24).map((group) => ({ href: groupHref(model, group), label: codeHeading(group) })),
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
  const standalone = model.symptoms.filter((symptom) => symptom.indexable && symptom.target === symptom.path);
  const withGuides = model.families.filter((family) => family.hasPage && family.ownGuides.length);
  const guideCount = model.symptoms.filter((symptom) => symptom.indexable).length;
  const inner = [
    `<p class="eyebrow">${plural(guideCount, "problem")} covered</p>`,
    `<h1>RV appliance troubleshooting guides</h1>`,
    `<p class="detail-meaning">Symptom-first help for when there is no code on the display: not cooling, no hot water, lockouts, odors, leaks, and power problems. Each page collects the owner-safe checks from the manufacturer's own documentation for one brand and appliance.</p>`,
    `<section><h2>Troubleshooting by brand and appliance</h2>${linkList(
      model.hubs.map((hub) => ({ href: hub.path, label: hub.name, note: plural(hub.guides.length, "problem") })),
    )}</section>`,
    withGuides.length
      ? `<section><h2>Problems without a code, on the model pages</h2>${linkList(
          withGuides.map((family) => ({ href: `${family.path}#guide-${family.ownGuides[0].slug}`, label: family.name, note: plural(family.ownGuides.length, "problem") })),
        )}</section>`
      : "",
    standalone.length ? `<section><h2>Problems across brands</h2>${linkList(standalone.map((guide) => ({ href: guide.path, label: guide.title })))}</section>` : "",
  ].join("");
  return page(model, {
    route: "/guides/",
    title: "RV appliance troubleshooting guides by brand",
    description: "Owner-safe RV appliance troubleshooting for refrigerators, water heaters, furnaces, air conditioners, generators, toilets, and more, sourced from manufacturer documentation.",
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
  for (const topic of [...model.families.filter((family) => family.hasPage || !family.topic), ...model.hubs]) {
    const category = categoryForType(topic.equipmentType);
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category).push(topic);
  }
  const familyCount = model.families.filter((family) => family.hasPage).length;
  const guideCount = model.symptoms.filter((symptom) => symptom.indexable).length;

  const categories = CATEGORY_ORDER.filter((category) => byCategory.has(category))
    .map((category) => {
      const links = byCategory.get(category).flatMap((topic) =>
        topic.kind === "hub"
          ? [{ href: topic.path, label: topic.name, note: topic.codeGroups.length ? plural(topic.codeGroups.length, "code") : plural(topic.guides.length, "problem") }]
          : topic.hasPage
            ? [{ href: topic.path, label: topic.name, note: plural(topic.codeGroups.length, "code") }]
            : topic.codeGroups.map((group) => ({ href: groupHref(model, group), label: codeHeading(group) })),
      );
      return `<section class="category"><h3>${esc(category)}</h3>${linkList(links)}</section>`;
    })
    .join("");

  return `${siteHeaderHtml()}<main>
<section class="hero"><div class="hero-copy"><p class="eyebrow">Free · manufacturer sources only</p><h1>${SITE_NAME}</h1><p class="hero-text">Find out what an RV appliance fault code means on your exact model, what you can safely check yourself, and when to stop and call a technician. Every answer links to the manufacturer's own manual or support page.</p><div class="hero-stats" aria-label="Coverage"><div><strong>${model.codeGroups.length}</strong><span>codes explained</span></div><div><strong>${familyCount}</strong><span>model code tables</span></div><div><strong>${guideCount}</strong><span>problems without a code</span></div></div></div>
<div class="hero-stack"><figure class="hero-image"><img src="/images/rv-appliance-code-atlas-hero.jpg" alt="RV service workbench with diagnostic tools" width="1344" height="768" /></figure></div></section>
<div id="search"><div id="search-app"><form class="hero-panel" action="/" method="get" role="search"><label class="search-label" for="lookup">Search by brand, model, code, or symptom</label><div class="searchbox"><input id="lookup" name="q" type="search" placeholder="Try: Norcold no FL, Onan 36, Furrion E3" /></div></form></div></div>
<section id="appliances" class="browse-band" aria-label="Browse by appliance"><div class="section-header"><div><p class="eyebrow">Browse</p><h2>Code tables by appliance and model</h2></div></div><div class="category-grid">${categories}</div></section>
<section class="howto-band" aria-label="How to use a fault code safely"><div class="section-header"><div><p class="eyebrow">Before you touch anything</p><h2>How to use a fault code safely</h2></div></div><ol class="howto-list"><li><strong>Confirm the model.</strong> Codes are model-specific. The same code can mean different things on two refrigerators from the same brand. Read the model number off the appliance data label.</li><li><strong>Write down exactly what you see.</strong> Record the code, any flashing lights or beeps, the power source (shore, battery, LP, generator), and what the appliance was doing.</li><li><strong>Do only the owner-safe checks.</strong> Leveling, closing doors, checking that LP tanks are open and breakers are on, clearing vents: these are listed on each code page.</li><li><strong>Stop at the boundary.</strong> Gas smell, flame or exhaust problems, 120 VAC wiring, control boards, refrigerant, generator internals, and jacks or slides under load are technician work.</li></ol></section>
<div id="tools-app"></div>
<section class="brand-band" aria-label="Browse by brand"><div class="section-header"><div><p class="eyebrow">Brands</p><h2>Browse by brand</h2></div></div>${linkList(
    model.brands.map((brand) => ({ href: `/brands/${brandSlug(brand)}/`, label: `${model.families.find((family) => family.brand === brand)?.brandLabel ?? brand} fault codes` })),
    "brand-links",
  )}<p><a href="/guides/">Browse troubleshooting by brand and appliance</a> for ${guideCount} problems that do not show a code.</p></section>
</main>${siteFooterHtml()}`;
}

export function redirectHtml(to, title, baseUrl) {
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><title>${esc(title)}</title><meta name="robots" content="noindex,follow" /><link rel="canonical" href="${esc(
    `${baseUrl}${to.split("#")[0]}`,
  )}" /><meta http-equiv="refresh" content="0; url=${esc(to)}" /><script>location.replace(${JSON.stringify(to)});</script></head><body><p>This code now lives on a combined page: <a href="${esc(to)}">${esc(title)}</a>.</p></body></html>\n`;
}
