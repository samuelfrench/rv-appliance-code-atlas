import { describe, expect, it } from "vitest";
import corpus from "../data/corpus.json";
import { buildSymptomSearchIndex, lookupSymptomGuides, summarizeCorpus } from "./corpus";

const expectedEntryCount = 864;
const expectedSourceCount = 1245;
const expectedSymptomCount = 1073;

const remainingScoutBatch = [
  ["dometic-freshjet-clean-roof-ac-support", "https://support.dometic.com/en/freshjet-ac/How-to-Clean-the-roof-air-conditioner-cd8f", "dometic-freshjet-clean-roof-ac-prep", ["dometic+freshjet+clean+roof", "freshjet+clean+cd8f"], "Dometic FreshJet clean roof air conditioner cd8f"],
  ["dometic-freshjet-ideal-temperature-support", "https://support.dometic.com/en/freshjet-ac/What-is-the-ideal-air-conditioning-temperature-4b6", "dometic-freshjet-ideal-temperature-prep", ["dometic+freshjet+ideal+temperature", "freshjet+temperature+4b6"], "Dometic FreshJet ideal air conditioning temperature 4b6"],
  ["dometic-brisk-auxiliary-heat-control-support", "https://support.dometic.com/en/brisk-ac/How-to-control-Auxiliary-Heat-bcdc", "dometic-brisk-auxiliary-heat-control-prep", ["dometic+brisk+auxiliary+heat", "auxiliary+heat+bcdc"], "Dometic Brisk how to control Auxiliary Heat bcdc"],
  ["dometic-brisk-stage-control-support", "https://support.dometic.com/en/brisk-ac/How-to-control-Stage-Control-565e", "dometic-brisk-stage-control-prep", ["dometic+brisk+stage+control", "stage+control+565e"], "Dometic Brisk how to control Stage Control 565e"],
  ["thetford-aqua-soft-single-roll-support", "https://www.thetford.com/us/thetford-support/aqua-soft-single-roll/", "thetford-aqua-soft-single-roll-tank-safe-prep", ["thetford+aqua+soft", "aqua+soft+single+roll"], "Thetford Aqua Soft single roll tank safe toilet paper"],
  ["furrion-9k-12k-rooftop-ac-user-manual-im-fav00124", "https://support.lci1.com/documents/furrion-9k-and-12k-btu-rooftop-air-conditioner-user-manual-im-fav00124-v1.0", "furrion-9k-12k-rooftop-ac-control-model-prep", ["furrion+9k+12k+rooftop", "im+fav00124"], "Furrion 9K 12K BTU rooftop air conditioner user manual IM-FAV00124"],
  ["furrion-enhanced-single-zone-controller-document", "https://support.lci1.com/documents/furrion-enhanced-standard-single-zone-controller-for-chill-air-conditioner-system-with-2-fan-speed", "furrion-enhanced-single-zone-controller-prep", ["furrion+enhanced+single+zone", "furrion+enhanced+2+fan+speed"], "Furrion enhanced standard single-zone controller 2 fan speed"],
  ["furrion-chill-he-15k-roof-ac-document", "https://support.lci1.com/documents/furrion-chill-he-15k-rv-roof-air-conditioner", "furrion-chill-he-15k-roof-ac-model-prep", ["furrion+chill+he+15k", "furrion+chill+he+roof+air+conditioner"], "Furrion Chill HE 15K RV roof air conditioner"],
  ["furrion-15-6-arctic-side-by-side-refrigerator-manual", "https://support.lci1.com/documents/furrion-ccd-0005509", "furrion-15-6-arctic-side-by-side-refrigerator-prep", ["furrion+15+6+arctic", "ccd+0005509"], "Furrion 15.6 cu ft Arctic 12V side-by-side refrigerator CCD-0005509"],
  ["furrion-arctic-french-door-refrigerator-manual-ccd0007862", "https://support.lci1.com/documents/ccd-0007862", "furrion-arctic-french-door-refrigerator-prep", ["furrion+arctic+french+door", "ccd+0007862"], "Furrion Arctic 12V French Door refrigerator CCD-0007862"],
  ["furrion-15-built-in-frost-free-refrigerator-manual", "https://support.lci1.com/documents/ccd-0009151", "furrion-15-built-in-frost-free-refrigerator-prep", ["furrion+15+built+in+frost+free", "ccd+0009151"], "Furrion 15 cu ft built-in frost-free refrigerator-freezer CCD-0009151"],
  ["furrion-50q-electric-cooler-manual", "https://support.lci1.com/documents/ccd-0005610", "furrion-50q-electric-cooler-model-prep", ["furrion+50q+electric+cooler", "ccd+0005610"], "Furrion 50Q electric cooler user manual CCD-0005610"],
  ["furrion-3-3-mini-refrigerator-manual", "https://support.lci1.com/documents/ccd-0008637", "furrion-3-3-mini-refrigerator-prep", ["furrion+3+3+mini+refrigerator", "ccd+0008637"], "Furrion 3.3 cu ft single-door mini refrigerator CCD-0008637"],
  ["furrion-arctic-8-dual-swing-refrigerator-manual", "https://support.lci1.com/documents/ccd-0007849", "furrion-arctic-8-dual-swing-refrigerator-prep", ["furrion+arctic+8+dual+swing", "ccd+0007849"], "Furrion Arctic 8 cu ft dual-swing refrigerator CCD-0007849"],
  ["furrion-arctic-10-7-drawer-freezer-refrigerator-manual", "https://support.lci1.com/documents/ccd-0007851", "furrion-arctic-10-7-drawer-freezer-refrigerator-prep", ["furrion+arctic+10+7+drawer", "ccd+0007851"], "Furrion Arctic 10.7 cu ft drawer-freezer refrigerator CCD-0007851"],
  ["furrion-arctic-12-bottom-freezer-french-door-manual", "https://support.lci1.com/documents/ccd-0008955", "furrion-arctic-12-bottom-freezer-french-door-prep", ["furrion+arctic+12+bottom+freezer", "ccd+0008955"], "Furrion Arctic 12 cu ft bottom-freezer French Door refrigerator CCD-0008955"],
  ["furrion-fcr16acgfa-operation-mode-settings-video", "https://support.lci1.com/videos/how-to-change-operation-mode-settings-on-fcr16acgfa-furrion-refrigerator", "furrion-fcr16acgfa-operation-mode-settings-prep", ["furrion+fcr16acgfa+operation+mode", "fcr16acgfa+operation+settings"], "Furrion FCR16ACGFA operation mode settings video"],
  ["furrion-fcr20dcafa-storage-video", "https://support.lci1.com/videos/proper-storage-of-a-furrion-model-fcr20dcafa-refrigerator", "furrion-fcr20dcafa-storage-prep", ["furrion+fcr20dcafa+storage", "furrion+fcr20dcafa+proper+storage"], "Furrion FCR20DCAFA proper storage video"],
  ["aquahot-600-d04-use-care-guide", "https://library.aquahot.com/wp-content/uploads/2022/04/AHE-600-D04-Use-and-Care-Guide.pdf", "aquahot-600-d04-use-care-service-prep", ["aqua+hot+600+d04", "ahe+600+d04"], "Aqua-Hot AHE-600-D04 Use and Care Guide"],
  ["cummins-shop-contact-support", "https://shop.cummins.com/SC/contact-us", "onan-cummins-shop-contact-support-prep", ["shop+cummins+contact", "cummins+contact+support"], "Shop Cummins contact support Onan generator"],
  ["cummins-genuine-parts-faq", "https://shop.cummins.com/SC/knowledge-hub/d-us/genuine-cummins-parts-information-and-faqs-MC7LKLCN7FQFCX7PGOANFZBWN5UA", "onan-cummins-genuine-parts-faq-prep", ["genuine+cummins+parts", "cummins+parts+faq"], "Genuine Cummins parts information FAQs Onan generator"],
] as const;

describe("official remaining scout source-only batch", () => {
  it("adds official owner-safe guide pages without code entries or generic hijacks", () => {
    const sourceIds = remainingScoutBatch.map(([sourceId]) => sourceId);
    const sourceIdSet = new Set(sourceIds);
    const protectedSlugs = new Set(remainingScoutBatch.map(([, , symptomId]) => symptomId));
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|burner\s+(repair|work|service|port|assembly)|\borifice\b|\bcontrol[- ]board\b|\b120\s*vac\b|\b120\s*v\b|\b110\s*v\b|\bline[- ]voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|remove.*toilet|replace.*valve|measure resistance|fuel nozzle|combustion|coolant pump|manual override|hydraulic work|hydraulic repair|macerator|internal plumbing|seal removal|compressor repair|pump service|magnetron|capacitor|door switch|roof climbing/i;

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => sourceIdSet.has(sourceId)))).toHaveLength(0);

    for (const [sourceId, url, symptomId, requiredTerms, query] of remainingScoutBatch) {
      const source = sourcesById.get(sourceId);
      const symptom = symptomById.get(symptomId);

      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual([sourceId]);
      expect(symptom?.searchRequiredTerms, symptomId).toEqual(requiredTerms);
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
      expect(lookupSymptomGuides(index, query)[0]?.slug, query).toBe(symptomId);
    }

    for (const query of [
      "clean roof air conditioner",
      "ideal air conditioning temperature",
      "auxiliary heat",
      "stage control",
      "single roll",
      "rooftop air conditioner user manual",
      "roof air conditioner",
      "single zone controller",
      "2 fan speed",
      "furrion 2 fan speed",
      "refrigerator manual",
      "operation mode settings",
      "proper storage",
      "furrion proper storage",
      "use and care guide",
      "contact support",
      "parts FAQ",
    ]) {
      expect(
        lookupSymptomGuides(index, query)
          .slice(0, 10)
          .map((symptom) => symptom.slug)
          .filter((slug) => protectedSlugs.has(slug)),
        query,
      ).toEqual([]);
    }
  });
});
