import { describe, expect, it } from "vitest";
import corpus from "../data/corpus.json";
import { buildSymptomSearchIndex, lookupSymptomGuides, summarizeCorpus } from "./corpus";

const expectedEntryCount = 864;
const expectedSourceCount = 1224;
const expectedSymptomCount = 1052;

const officialCareAndScoutBatch = [
  ["thetford-waste-treatments-product-group", "https://www.thetford.com/us/rv-tank-treatments/waste-treatments/", "thetford-waste-treatments-holding-tank-prep", ["thetford+waste+treatments", "aqua+kem"], "thetford waste treatments aqua kem aquabio campa fresh"],
  ["thetford-tank-treatment-maintenance-product-group", "https://www.thetford.com/us/rv-tank-treatments/maintenance/", "thetford-tank-treatment-maintenance-prep", ["thetford+maintenance", "tank+treatment+maintenance"], "thetford maintenance drain valve lubricant holding tank cleaner"],
  ["thetford-rv-toilet-paper-product-group", "https://www.thetford.com/us/rv-tank-treatments/toilet-paper/", "thetford-rv-toilet-paper-tank-safe-prep", ["thetford+toilet+paper"], "thetford toilet paper rv sanitation paper"],
  ["thetford-all-surface-care-product-group", "https://www.thetford.com/us/all-surface-care/", "thetford-all-surface-care-routing-prep", ["thetford+all+surface+care"], "thetford all surface care rv cleaning"],
  ["thetford-interior-cleaning-product-group", "https://www.thetford.com/us/all-surface-care/interior-cleaning/", "thetford-interior-cleaning-surface-prep", ["thetford+interior+cleaning"], "thetford interior cleaning toilet bowl seal safe"],
  ["thetford-exterior-cleaning-product-group", "https://www.thetford.com/us/all-surface-care/exterior-cleaning/", "thetford-exterior-cleaning-surface-prep", ["thetford+exterior+cleaning"], "thetford exterior cleaning rv wash awning"],
  ["thetford-exterior-maintenance-product-group", "https://www.thetford.com/us/all-surface-care/exterior-maintenance/", "thetford-exterior-maintenance-surface-prep", ["thetford+exterior+maintenance"], "thetford exterior maintenance rubber roof seal lubricant"],
  ["thetford-rv-sanitation-product-group", "https://www.thetford.com/us/rv-sanitation/", "thetford-rv-sanitation-routing-prep", ["thetford+rv+sanitation"], "thetford rv sanitation portable totes sewer hoses sani con"],
  ["thetford-portable-totes-product-group", "https://www.thetford.com/us/rv-sanitation/portable-totes/", "thetford-portable-totes-waste-transfer-prep", ["thetford+portable+totes"], "thetford portable totes waste tote sanitation"],
  ["thetford-rv-sewer-hoses-product-group", "https://www.thetford.com/us/rv-sanitation/rv-sewer-hoses/", "thetford-rv-sewer-hoses-service-prep", ["thetford+sewer+hoses"], "thetford rv sewer hoses titan sewer kit"],
  ["thetford-sani-con-turbo-product-group", "https://www.thetford.com/us/rv-sanitation/sani-con-turbo/", "thetford-sani-con-turbo-service-prep", ["thetford+sani+con", "sani+con+turbo"], "thetford sani con turbo system prep"],
  ["thetford-drain-valve-lubricant-support", "https://www.thetford.com/us/thetford-support/drain-valve-lubricant/", "thetford-drain-valve-lubricant-prep", ["thetford+drain+valve+lubricant"], "thetford drain valve lubricant sticky drain valve seal wear"],
  ["thetford-aqua-kem-toss-ins-support", "https://www.thetford.com/us/thetford-support/aqua-kem-toss-ins/", "thetford-aqua-kem-toss-ins-prep", ["aqua+kem+toss+ins", "thetford+toss+ins"], "thetford aqua kem toss ins holding tank odor"],
  ["dometic-freshjet-switch-on-off-support", "https://support.dometic.com/en/freshjet-ac/How-to-Switch-the-roof-air-conditioner-on-and-off-22", "dometic-freshjet-switch-on-off-control-prep", ["dometic+freshjet+switch+on+off", "freshjet+roof+air+conditioner+22"], "Dometic FreshJet How to switch roof air conditioner on and off 22"],
  ["dometic-freshjet-set-time-support", "https://support.dometic.com/en/freshjet-ac/How-to-Set-the-time-8e4", "dometic-freshjet-remote-time-control-prep", ["dometic+freshjet+set+time", "freshjet+remote+time+8e4"], "Dometic FreshJet How to set the time 8e4"],
  ["dometic-brisk-ags-control-support", "https://support.dometic.com/en/brisk-ac/How-to-control-automatic-generator-start-AGS-b557", "dometic-brisk-ags-control-prep", ["dometic+brisk+automatic+generator+start", "dometic+brisk+ags+b557"], "Dometic Brisk How to control automatic generator start AGS b557"],
  ["thetford-toilet-serial-number-faq", "https://www.thetford.com/us/faq/where-can-i-locate-the-serial-number-for-my-toilet/", "thetford-toilet-serial-number-prep", ["thetford+where+can+i+locate+serial+number", "thetford+toilet+serial+number+faq"], "Thetford where can I locate the serial number for my toilet"],
  ["thetford-cassette-toilet-serial-number-faq", "https://www.thetford.com/us/faq/where-is-the-serial-number-located-on-my-cassette-toilet/", "thetford-cassette-toilet-serial-number-prep", ["thetford+cassette+toilet+serial+number+faq", "where+is+serial+number+located+cassette"], "Thetford where is the serial number located on my cassette toilet"],
  ["furrion-ac-controller-generation-3-spec-ccd0010641", "https://support.lci1.com/documents/ccd-0010641", "furrion-ac-controller-gen3-identification-prep", ["furrion+air+conditioner+controller+generation+3", "ccd0010641"], "Furrion Air Conditioner Controller Generation 3 Spec Sheet CCD-0010641"],
  ["furrion-chill-cube-ac-system-user-manual-ccd0007294", "https://support.lci1.com/documents/ccd-0007294", "furrion-chill-cube-ac-control-model-prep", ["furrion+chill+cube", "ccd0007294"], "Furrion Chill Cube A/C System User Manual CCD-0007294"],
  ["furrion-refrigerator-door-seal-check-video", "https://support.lci1.com/videos/how-to-check-for-proper-seal-of-refrigerator-door", "furrion-refrigerator-door-seal-check-prep", ["furrion+refrigerator+door+seal", "proper+seal+refrigerator+door"], "Lippert Furrion how to check proper seal of refrigerator door video"],
  ["aquahot-400-p02-use-care-guide", "https://library.aquahot.com/wp-content/uploads/2022/04/AHE-400-P02-Use-and-Care-Guide.pdf", "aquahot-400-p02-control-winterize-prep", ["aqua+hot+400+p02", "ahe+400+p02"], "Aqua-Hot AHE-400-P02 Use and Care Guide"],
  ["cummins-shop-warranty-information", "https://shop.cummins.com/SC/c/warranty-information-MCJG7MQZ6FRRA6LHZR3KISINXBXA", "onan-cummins-warranty-routing-prep", ["cummins+onan+warranty", "shop+cummins+warranty"], "Shop Cummins warranty information Onan portable generator warranty"],
] as const;

describe("official Thetford care and scout follow-up batch", () => {
  it("adds owner-safe official source-only guides without generic hijacks", () => {
    const sourceIds = officialCareAndScoutBatch.map(([sourceId]) => sourceId);
    const sourceIdSet = new Set(sourceIds);
    const protectedSlugs = new Set(officialCareAndScoutBatch.map(([, , symptomId]) => symptomId));
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

    for (const [sourceId, url, symptomId, requiredTerms, query] of officialCareAndScoutBatch) {
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
      "waste treatments",
      "tank treatment",
      "maintenance",
      "toilet paper",
      "cleaning",
      "interior cleaning",
      "exterior cleaning",
      "exterior maintenance",
      "sanitation",
      "portable totes",
      "sewer hoses",
      "sani con",
      "drain valve",
      "toss ins",
      "freshjet switch",
      "freshjet time",
      "brisk ags",
      "automatic generator start",
      "serial number",
      "controller",
      "door seal",
      "warranty",
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
