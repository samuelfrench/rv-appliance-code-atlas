import { describe, expect, it } from "vitest";
import corpus from "../data/corpus.json";
import { buildSymptomSearchIndex, lookupSymptomGuides, summarizeCorpus } from "./corpus";

const expectedEntryCount = 864;
const expectedSourceCount = 1108;
const expectedSymptomCount = 941;

const nextBatch = [
  ["dometic-cfx5-warranty-statements-support", "https://support.dometic.com/en/cfx5-coolers/Where-do-I-find-warranty-statements-for-my-product-ca5", "dometic-cfx5-warranty-statement-prep", ["cfx5+warranty"], "dometic cfx5 warranty statement prep"],
  ["dometic-cfx5-standing-weight-support", "https://support.dometic.com/en/cfx5-coolers/Can-I-stand-on-any-of-the-CFX5-models-23a0", "dometic-cfx5-standing-load-prep", ["cfx5+stand", "cfx5+standing"], "dometic cfx5 stand on cooler weight prep"],
  ["dometic-cfx5-battery-protection-support", "https://support.dometic.com/en/cfx5-coolers/What-is-the-battery-protection-system-4263", "dometic-cfx5-battery-protection-system-prep", ["cfx5+battery+protection"], "dometic cfx5 battery protection system prep"],
  ["dometic-cfx5-power-type-support", "https://support.dometic.com/en/cfx5-coolers/What-type-of-power-does-the-CFX5-need-9a38", "dometic-cfx5-power-type-prep", ["cfx5+power+type"], "dometic cfx5 power type dc ac prep"],
  ["dometic-cfx5-power-cord-parts-support", "https://support.dometic.com/en/cfx5-coolers/How-can-I-get-a-new-power-cord-or-another-part-bbbb", "dometic-cfx5-power-cord-parts-prep", ["cfx5+power+cord"], "dometic cfx5 power cord parts prep"],
  ["dometic-cfx5-product-registration-support", "https://support.dometic.com/en/cfx5-coolers/How-can-I-register-my-product-34b0", "dometic-cfx5-product-registration-prep", ["cfx5+register", "cfx5+registration"], "dometic cfx5 product registration prep"],
  ["dometic-cfx5-solar-power-support", "https://support.dometic.com/en/cfx5-coolers/How-do-I-power-the-CFX5-with-solar-6bf6", "dometic-cfx5-solar-power-prep", ["cfx5+solar"], "dometic cfx5 solar power prep"],
  ["dometic-cfx3-solar-power-support", "https://support.dometic.com/en/cfx3-coolers/How-do-I-power-the-CFX3-with-solar-1765", "dometic-cfx3-solar-power-prep", ["cfx3+solar"], "dometic cfx3 solar power prep"],
  ["dometic-cfx3-warranty-statements-support", "https://support.dometic.com/en/cfx3-coolers/Where-do-I-find-warranty-statements-for-my-product-ca5", "dometic-cfx3-warranty-statement-prep", ["cfx3+warranty"], "dometic cfx3 warranty statement prep"],
  ["dometic-cfx3-product-registration-support", "https://support.dometic.com/en/cfx3-coolers/How-can-I-register-my-product-34b0", "dometic-cfx3-product-registration-prep", ["cfx3+register", "cfx3+registration"], "dometic cfx3 product registration prep"],
  ["dometic-cfx3-power-cord-parts-support", "https://support.dometic.com/en/cfx3-coolers/How-can-I-get-a-new-power-cord-or-another-part-2e17", "dometic-cfx3-power-cord-parts-prep", ["cfx3+power+cord"], "dometic cfx3 power cord parts prep"],
  ["dometic-cff-cooling-range-support", "https://support.dometic.com/en/cff-coolers/How-cold-can-the-CFF-coolers-get-3c9e", "dometic-cff-cooling-range-prep", ["cff+cooling", "cff+cold"], "dometic cff cooling range prep"],
  ["dometic-cff20-technical-data-support", "https://support.dometic.com/en/cff-coolers/What-is-the-technical-data-of-the-CFF-20-f934", "dometic-cff20-technical-data-prep", ["cff20+technical", "cff+20+technical"], "dometic cff20 technical data prep"],
  ["dometic-cff-too-cold-freezing-support", "https://support.dometic.com/en/cff-coolers/The-food-and-beverages-are-getting-too-cold-or-freezing-7019", "dometic-cff-too-cold-freezing-prep", ["cff+freezing", "cff+too+cold"], "dometic cff food freezing too cold prep"],
  ["dometic-cfx2-use-cooler-support", "https://support.dometic.com/en/cfx2-coolers/How-to-use-the-cooler-ab7a", "dometic-cfx2-use-cooler-prep", ["cfx2+cooler"], "dometic cfx2 use cooler prep"],
  ["dometic-cfx2-temperature-setting-support", "https://support.dometic.com/en/cfx2-coolers/How-to-set-the-temperature-a2c9", "dometic-cfx2-temperature-setting-prep", ["cfx2+temperature"], "dometic cfx2 set temperature prep"],
  ["dometic-cfx2-not-cooling-support", "https://support.dometic.com/en/cfx2-coolers/The-cooler-is-not-cooling-461", "dometic-cfx2-not-cooling-prep", ["cfx2+cooling"], "dometic cfx2 not cooling prep"],
  ["furrion-11-air-fry-microwave-manual-ccd0008956", "https://support.lci1.com/documents/ccd-0008956", "furrion-fmam11aa-air-fry-microwave-control-prep", ["fmam11aa", "furrion+air+fry+microwave"], "furrion fmam11aa air fry microwave control prep"],
  ["furrion-furnace-e2-error-video", "https://support.lci1.com/videos/e2-error-code-on-furrion-furnace", "furrion-furnace-e2-error-service-prep", ["furrion+furnace+e2"], "furrion furnace e2 error service prep"],
  ["furrion-furnace-e3-e6-error-video", "https://support.lci1.com/videos/e3-and-e6-error-code-on-furrion-furnace", "furrion-furnace-e3-e6-error-service-prep", ["furrion+furnace+e3", "furrion+furnace+e6"], "furrion furnace e3 e6 error service prep"],
  ["girard-tankless-e3-error-video", "https://support.lci1.com/videos/e3-error-code-on-girard-tankless-water-heater", "girard-tankless-e3-video-service-prep", ["girard+tankless+e3"], "girard tankless e3 support video service prep"],
  ["greystone-cfrvhob12-cooktop-manual-ccd0009642", "https://support.lci1.com/documents/ccd-0009642", "greystone-cf-rvhob12-cooktop-flame-prep", ["cfrvhob12", "cf+rvhob12"], "greystone cf rvhob12 cooktop flame prep"],
  ["greystone-single-induction-hob-ccd0009628", "https://support.lci1.com/documents/ccd-0009628", "greystone-single-induction-hob-power-cookware-prep", ["greystone+single+induction", "greystone+induction+hob"], "greystone single induction hob cookware power prep"],
  ["onan-p4500i-owner-manual-2021", "https://www.cummins.com/sites/default/files/files/manuals/onan-p4500i-inverter-portable-generator-manual-03-2021.pdf", "onan-p4500i-overload-led-service-prep", ["p4500i+overload"], "onan p4500i overload led service prep"],
  ["onan-p4500idf-owner-manual-2025", "https://www.cummins.com/sites/default/files/2025-04/p4500idf-owners-manual.pdf", "onan-p4500idf-fuel-display-service-prep", ["p4500idf", "p4500idf+fuel", "p4500idf+display"], "onan p4500idf fuel display service prep"],
  ["dometic-cfx5-lid-open-alert-support", "https://support.dometic.com/en/cfx5-coolers/ALERT-Lid-open-greater-3-min-4118", "dometic-cfx5-lid-open-alert-prep", ["cfx5+lid+open"], "dometic cfx5 alert lid open greater 3 min prep"],
  ["dometic-freshjet-low-air-output-support", "https://support.dometic.com/en/freshjet-ac/My-air-conditioner-is-giving-me-low-air-output-1abf", "dometic-freshjet-low-air-output-prep", ["freshjet+low+air"], "dometic freshjet low air output prep"],
  ["dometic-freshjet-does-not-switch-off-support", "https://support.dometic.com/en/freshjet-ac/My-roof-air-conditioner-does-not-switch-off-c0f3", "dometic-freshjet-does-not-switch-off-prep", ["freshjet+switch+off"], "dometic freshjet roof air conditioner does not switch off prep"],
  ["dometic-brisk-air-filter-maintenance-support", "https://support.dometic.com/en/brisk-ac/How-to-maintain-the-air-filter-15e1", "dometic-brisk-air-filter-maintenance-prep", ["dometic+brisk+filter", "brisk+filter"], "dometic brisk ac maintain air filter prep"],
  ["dometic-brisk-campsite-operation-support", "https://support.dometic.com/en/brisk-ac/How-to-run-my-RV-air-conditioner-on-the-campsite-cc4b", "dometic-brisk-campsite-power-operation-prep", ["dometic+brisk+campsite", "brisk+campsite"], "dometic brisk rv air conditioner campsite operation prep"],
  ["dometic-harrier-remote-not-registering-support", "https://support.dometic.com/en/harrier-ac/My-remote-control-does-not-register-b09c", "dometic-harrier-remote-not-registering-prep", ["harrier+remote"], "dometic harrier remote control does not register prep"],
  ["norcold-1200-series-support", "https://www.thetford.com/us/thetford-support/1200-series/", "norcold-1200-series-support-prep", ["norcold+1200"], "norcold 1200 series thetford support prep"],
  ["norcold-1210-ultraline-support", "https://www.thetford.com/us/thetford-support/1210-ultraline/", "norcold-1210-ultraline-support-prep", ["norcold+1210", "1210+ultraline"], "norcold 1210 ultraline thetford support prep"],
  ["norcold-n3000-series-us-support", "https://www.thetford.com/us/thetford-support/n300-series/", "norcold-n3000-series-us-support-prep", ["norcold+n3000", "n3000+series"], "norcold n3000 series thetford support prep"],
  ["norcold-ac-lp-refrigerator-level-faq", "https://www.thetford.com/us/faq/how-level-must-my-ac-lp-refrigerator-be/", "norcold-ac-lp-refrigerator-level-prep", ["norcold+level", "norcold+ac+lp+refrigerator+level"], "norcold ac lp refrigerator how level prep"],
  ["norcold-refrigerator-not-cooling-faq", "https://www.thetford.com/us/faq/what-if-my-refrigerator-is-not-cooling-property/", "norcold-refrigerator-not-cooling-faq-prep", ["norcold+not+cooling"], "norcold refrigerator not cooling thetford faq prep"],
  ["thetford-toilet-flush-not-working-faq", "https://www.thetford.com/us/faq/what-can-i-do-when-the-flush-of-my-toilet-doesnt-work/", "thetford-toilet-flush-not-working-faq-prep", ["thetford+flush"], "thetford toilet flush does not work faq prep"],
  ["coleman-mach-merv6-replacement-filters", "https://coleman-mach.com/products/climate-control-accessories/replacement-air-filters/", "coleman-mach-merv6-filter-access-prep", ["coleman+mach+merv6", "coleman+merv6+filter"], "coleman mach merv6 replacement air filters prep"],
  ["coleman-mach-chillgrille-ceiling-assembly", "https://coleman-mach.com/products/ceiling-assemblies/chillgrille/", "coleman-mach-chillgrille-filter-control-prep", ["coleman+mach+chillgrille", "chillgrille+ezreach"], "coleman mach chillgrille ezreach filter prep"],
  ["coleman-mach-carrier-conversion-kits", "https://coleman-mach.com/products/conversion-kits/carrier-conversions/", "coleman-mach-carrier-conversion-service-prep", ["coleman+mach+carrier", "carrier+conversion"], "coleman mach carrier conversion rooftop adapter kit prep"],
  ["maxxair-service-video-library", "https://www.maxxair.com/service-support/videos/", "maxxair-official-video-support-prep", ["maxxair+video", "maxxair+technical+videos"], "maxxair technical service videos library prep"],
  ["maxxair-mini-deluxe-iom-10a03893z", "https://library.maxxair.com/wp-content/uploads/2023/03/10a03893z_mxfan-mini-deluxe-iom-05-24-2019.pdf", "maxxair-mini-deluxe-control-prep", ["maxxfan+mini+deluxe", "maxxair+mini+deluxe", "10a03893z"], "maxxfan mini deluxe 10a03893z control prep"],
  ["maxxair-skymaxx-iom-11b90014", "https://library.maxxair.com/wp-content/uploads/2023/03/11b90014_skymaxx-skymaxx-plus-iom-07-2019.pdf", "maxxair-skymaxx-model-control-prep", ["skymaxx", "11b90014"], "skymaxx skymaxx plus iom 11b90014 maxxair prep"],
  ["suburban-6-gallon-advantage-sw6d", "https://suburbanrv.com/water-heating/tank-water-heaters/advantage-water-heaters/6-gallon-tank/", "suburban-sw6d-water-heater-model-prep", ["suburban+sw6d", "sw6d+5238a"], "suburban sw6d 5238a 6 gallon tank water heater prep"],
  ["suburban-10-gallon-advantage-sw10d", "https://suburbanrv.com/water-heating/tank-water-heaters/advantage-water-heaters/10-gallon-tank/", "suburban-sw10d-water-heater-model-prep", ["suburban+sw10d", "sw10d+5242a"], "suburban sw10d 5242a 10 gallon tank water heater prep"],
  ["suburban-st60-tankless-water-heater", "https://suburbanrv.com/water-heating/tankless-water-heaters/st-water-heaters/st60-water-heater/", "suburban-st60-tankless-control-prep", ["suburban+st60", "st60+5382a"], "suburban st60 5382a tankless water heater control prep"],
  ["aquahot-ahe-375-p02-owner-manual", "https://library.aquahot.com/wp-content/uploads/2022/07/AHE-375-P02-OwnersManual-02-2011.pdf", "aquahot-375-p02-owner-manual-prep", ["375+p02", "ahe+375"], "aqua hot ahe 375 p02 owner manual prep"],
  ["aquahot-525-d-owner-manual", "https://library.aquahot.com/wp-content/uploads/2022/04/Aqua-Hot525-DRevAOwnerManual12-20-07.pdf", "aquahot-525-d-owner-manual-prep", ["525+d", "aqua+hot+525"], "aqua hot 525 d rev a owner manual prep"],
  ["aquahot-gen1-diesel-gasoline-user-manual-2023", "https://library.aquahot.com/wp-content/uploads/2023/05/GEN1-NA-DIESEL-GASOLINE-User-Manual-7.17.23.pdf", "aquahot-gen1-diesel-gasoline-user-prep", ["gen1+diesel", "gen1+gasoline"], "aqua hot gen1 na diesel gasoline user manual prep"],
] as const;

describe("next official source-only expansion batch", () => {
  it("adds official owner-safe guides without new code entries or generic hijacks", () => {
    const sourceIds = nextBatch.map(([sourceId]) => sourceId);
    const sourceIdSet = new Set<string>(sourceIds);
    const symptomSlugs = new Set<string>(nextBatch.map(([, , symptomId]) => symptomId));
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|burner\s+(repair|work|service|port|assembly)|\borifice\b|\bcontrol[- ]board\b|\b120\s*vac\b|\b110\s*v\b|\bline[- ]voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|remove.*toilet|replace.*valve|measure resistance|fuel nozzle|combustion|coolant pump|manual override|hydraulic work|hydraulic repair|macerator|internal plumbing|seal removal|compressor repair|pump service|magnetron|capacitor|door switch|roof climbing/i;

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => sourceIdSet.has(sourceId)))).toHaveLength(0);

    for (const [sourceId, url, symptomId, requiredTerms, query] of nextBatch) {
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

    for (const [query, slug] of [
      ["dometic cfx5 battery protection", "dometic-cfx5-battery-protection-system-prep"],
      ["dometic cfx2 not cooling", "dometic-cfx2-not-cooling-prep"],
      ["furrion furnace e2", "furrion-furnace-e2-error-service-prep"],
      ["girard tankless e3 support video", "girard-tankless-e3-video-service-prep"],
      ["greystone induction hob cookware", "greystone-single-induction-hob-power-cookware-prep"],
      ["suburban sw10d", "suburban-sw10d-water-heater-model-prep"],
      ["aqua hot 525 d", "aquahot-525-d-owner-manual-prep"],
      ["onan p4500idf", "onan-p4500idf-fuel-display-service-prep"],
    ]) {
      expect(lookupSymptomGuides(index, query)[0]?.slug, query).toBe(slug);
    }

    for (const query of [
      "warranty",
      "registration",
      "power",
      "solar",
      "battery protection",
      "standing",
      "temperature",
      "not cooling",
      "microwave",
      "furnace",
      "tankless",
      "cooktop",
      "induction",
      "induction hob",
      "generator",
      "overload",
      "fuel display",
      "filter",
      "merv6 filter",
      "carrier",
      "conversion",
      "owner manual",
      "service video",
      "water heater",
      "hydronic",
      "mini deluxe",
      "ac lp refrigerator level",
    ]) {
      expect(
        lookupSymptomGuides(index, query)
          .slice(0, 5)
          .map((symptom) => symptom.slug)
          .filter((slug) => symptomSlugs.has(slug)),
        query,
      ).toEqual([]);
    }

    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(sourceIds));
  });
});
