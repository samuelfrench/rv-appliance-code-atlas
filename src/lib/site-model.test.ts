import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  buildSiteModel,
  isThinSymptom,
  normalizeCode,
  shortMeaning,
  validateFamilies,
} from "../../scripts/lib/site-model.mjs";
import {
  codePage,
  dedupeText,
  familyHeading,
  familyPage,
  orderedFamilyGroups,
  symptomPage,
} from "../../scripts/lib/render.mjs";
import { lookupFamilies, type FamilySummary } from "./siteIndex";
import { familySearchIndex } from "../../scripts/lib/site-model.mjs";

const corpus = JSON.parse(readFileSync("src/data/corpus.json", "utf8"));
const familiesData = JSON.parse(readFileSync("src/data/families.json", "utf8"));
const model = buildSiteModel(corpus, familiesData);

function group(path: string) {
  const found = model.codeGroups.find((item: { path: string }) => item.path === path);
  if (!found) throw new Error(`No code group at ${path}`);
  return found;
}

function family(slug: string) {
  const found = model.families.find((item: { slug: string }) => item.slug === slug);
  if (!found) throw new Error(`No family ${slug}`);
  return found;
}

describe("appliance families", () => {
  it("assigns every verified entry to exactly one model line", () => {
    expect(validateFamilies(corpus, familiesData)).toEqual([]);
    const assigned = model.families.reduce((total: number, item: { entries: unknown[] }) => total + item.entries.length, 0);
    expect(assigned).toBe(corpus.entries.length);
  });

  it("reports entries that are missing from the family list", () => {
    const orphan = { ...corpus.entries[0], id: "orphan", modelFamilies: ["Unlisted model"] };
    expect(validateFamilies({ ...corpus, entries: [...corpus.entries, orphan] }, familiesData)).toEqual([
      "Entry orphan (Unlisted model) is not assigned to an appliance family in src/data/families.json.",
    ]);
  });

  it("only builds model pages for tables with at least three codes", () => {
    for (const item of model.families) expect(item.hasPage).toBe(item.codeGroups.length >= 3);
    expect(family("dometic-wh-water-heaters").hasPage).toBe(false);
    expect(family("onan-quiet-diesel-generators").hasPage).toBe(true);
  });

  it("names model pages as singular appliance fault-code tables", () => {
    expect(familyHeading(family("dometic-rua-refrigerators"))).toBe("Dometic RUA refrigerator fault codes");
    expect(familyHeading(family("onan-qg-hgj-generators"))).toBe(
      "Cummins Onan QG gasoline generator fault codes (HGJAA, HGJAB, HGJBB)",
    );
  });

  it("orders numbered code tables numerically", () => {
    const codes = orderedFamilyGroups(family("onan-quiet-diesel-generators")).map((item: { code: string }) => item.code);
    expect(codes.slice(0, 4)).toEqual(["1", "2", "3", "4"]);
    expect(codes.indexOf("12")).toBeLessThan(codes.indexOf("36"));
  });
});

describe("merged code pages", () => {
  it("normalizes display-fault prefixes so the same code merges", () => {
    expect(normalizeCode("Display fault 08")).toBe("08");
    expect(normalizeCode("Lo dC")).toBe(normalizeCode("Lo dc"));
    expect(normalizeCode("E1")).not.toBe(normalizeCode("E11"));
  });

  it("extracts the manufacturer's short label", () => {
    const entry = corpus.entries.find((item: { id: string }) => item.id === "onan-qg-2800i-code-36");
    expect(shortMeaning(entry)).toBe("Mechanical Fault");
  });

  it("compares one code across every Onan generator manual", () => {
    const code36 = group("/codes/onan-code-36-engine-stopped/");
    expect(code36.entries).toHaveLength(8);
    expect(code36.meanings.majority).toBe("Engine Stopped");
    expect(code36.meanings.exceptions.map((item: { label: string }) => item.label).sort()).toEqual(["Mechanical Fault", "Other Faults"]);
  });

  it("folds every code into a section of its home model page and redirects the old URLs there", () => {
    const noFl = group("/codes/norcold-1200-no-fl/");
    expect(noFl.shared).toBe(true);
    expect(noFl.home.path).toBe("/models/norcold-1200-refrigerators/");
    expect(model.entryPaths["norcold-polar-no-fl"]).toBe("/models/norcold-1200-refrigerators/#code-no-fl");
    expect(model.redirects).toContainEqual({ from: "/codes/norcold-polar-no-fl/", to: "/models/norcold-1200-refrigerators/#code-no-fl" });
    expect(model.redirects).toContainEqual({ from: "/codes/norcold-1200-no-fl/", to: "/models/norcold-1200-refrigerators/#code-no-fl" });

    // A number that means different things on different refrigerators gets a section on each model page.
    const rua08 = group("/codes/dometic-rua-08-refrigerator/");
    expect(rua08.shared).toBe(false);
    expect(model.entryPaths["dometic-rua-08-refrigerator"]).toBe("/models/dometic-rua-refrigerators/#code-08");
    expect(model.entryPaths["dometic-rm10-display-fault-08-level-refrigerator-reset"]).toBe("/models/dometic-rm10-refrigerators/#code-08");

    const codeRedirects = model.redirects.filter((item: { from: string }) => item.from.startsWith("/codes/"));
    const standalone = model.codeGroups.filter((item: { standalone: boolean }) => item.standalone).length;
    expect(codeRedirects.length + standalone).toBe(corpus.entries.length);
  });

  it("renders each model's statement, sources, and anchors on the merged page", () => {
    const page = codePage(model, group("/codes/norcold-1200-no-fl/"));
    expect(page.robots).toBe("index,follow");
    expect(page.body).toContain('<tr id="norcold-polar-no-fl">');
    expect(page.body).toContain("Check your model first.");
    expect(page.body).toContain("Do not hand-light");
    expect(page.body).toContain('href="https://');
    expect(page.title).toContain("meaning by model");
  });
});

describe("guides and model pages", () => {
  it("keeps record-and-call prep pages out of the index", () => {
    const prep = corpus.symptoms.find((item: { slug: string }) => item.slug === "furrion-chill-r32-rooftop-model-label-prep");
    const guide = corpus.symptoms.find((item: { slug: string }) => item.slug === "dometic-rm10-gas-smell");
    expect(isThinSymptom(prep)).toBe(true);
    expect(isThinSymptom(guide)).toBe(false);

    const prepPage = symptomPage(model, model.symptoms.find((item: { slug: string }) => item.slug === prep.slug));
    expect(prepPage.robots).toBe("noindex,follow");
    expect(prepPage.body).toContain("Record the Furrion Chill R32 model");
  });

  it("links model pages to related tables that name the same models", () => {
    const rmd10 = family("dometic-rmd10-rml10-refrigerators");
    expect(rmd10.alsoListed.map((item: { family: { slug: string } }) => item.family.slug)).toEqual(["dometic-rm10-refrigerators"]);
    expect(family("dometic-rm10-refrigerators").alsoListed).toEqual([]);

    const page = familyPage(model, rmd10);
    expect(page.body).toContain("Also listed for these models");
    expect(page.body).toContain('href="/models/dometic-rm10-refrigerators/"');
  });

  it("merges near-duplicate guidance from several manuals", () => {
    expect(
      dedupeText([
        "Move perishables if temperature is unsafe.",
        "Move perishables if refrigerator temperature is unsafe.",
        "Switch the refrigerator off.",
      ]),
    ).toEqual(["Move perishables if refrigerator temperature is unsafe.", "Switch the refrigerator off."]);
  });
});

describe("model table search", () => {
  const families = familySearchIndex(model) as FamilySummary[];

  it("finds model tables from model numbers but not from bare codes or brands", () => {
    expect(lookupFamilies(families, "rm10")[0]?.slug).toBe("dometic-rm10-refrigerators");
    expect(lookupFamilies(families, "onan qg 4000")[0]?.slug).toBe("onan-qg-4000-generators");
    expect(lookupFamilies(families, "onan 36")).toEqual([]);
    expect(lookupFamilies(families, "dometic")).toEqual([]);
    expect(lookupFamilies(families, "rm10 gas smell")).toEqual([]);
  });
});
