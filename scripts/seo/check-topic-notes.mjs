// Validates src/data/topic-notes/<topic>.json files (schema + source ids).
// Usage: node scripts/seo/check-topic-notes.mjs [file ...]   (default: every file in the folder)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(new URL("../../package.json", import.meta.url)));
const corpus = JSON.parse(fs.readFileSync(path.join(root, "src/data/corpus.json"), "utf8"));
const SECTION_KEYS = ["models", "display", "reset", "checks", "parts", "callTech"];
const dir = path.join(root, "src/data/topic-notes");
const files = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => path.join(dir, f));

export function checkTopicNotes(notes, corpusSources) {
  const errors = [];
  const ids = new Set(corpusSources.map((s) => s.id));
  for (const extra of notes.extraSources ?? []) {
    for (const key of ["id", "brand", "title", "url"]) if (!extra[key]) errors.push(`extraSources entry missing ${key}`);
    if (extra.url && !/^https:\/\//.test(extra.url)) errors.push(`extra source ${extra.id} url must be https`);
    if (ids.has(extra.id)) errors.push(`extra source id ${extra.id} duplicates a corpus source`);
    ids.add(extra.id);
  }
  if (!notes.topic) errors.push("missing topic");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(notes.researchedAt ?? "")) errors.push("researchedAt must be YYYY-MM-DD");
  const items = [];
  if (notes.summary) items.push(["summary", notes.summary]);
  for (const key of Object.keys(notes.sections ?? {})) {
    if (!SECTION_KEYS.includes(key)) errors.push(`unknown section ${key}`);
    if (!Array.isArray(notes.sections[key])) errors.push(`section ${key} must be an array`);
    else for (const item of notes.sections[key]) items.push([key, item]);
  }
  for (const [key, item] of items) {
    if (!item?.text || typeof item.text !== "string") errors.push(`${key}: item without text`);
    else if (item.text.split(/\s+/).length > 60) errors.push(`${key}: item over 60 words: ${item.text.slice(0, 60)}`);
    if (!ids.has(item?.source)) errors.push(`${key}: unknown source id ${item?.source}`);
    if (!item?.locator) errors.push(`${key}: item without locator (page or section)`);
  }
  return { errors, itemCount: items.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let failed = 0;
  for (const file of files) {
    const notes = JSON.parse(fs.readFileSync(file, "utf8"));
    const { errors, itemCount } = checkTopicNotes(notes, corpus.sources);
    console.log(`${path.basename(file)}: ${itemCount} items, ${errors.length} errors`);
    for (const error of errors) console.log(`  - ${error}`);
    if (errors.length) failed += 1;
  }
  process.exit(failed ? 1 : 0);
}
