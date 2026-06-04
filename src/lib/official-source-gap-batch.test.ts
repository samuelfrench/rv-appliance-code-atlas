import { describe, expect, it } from "vitest";
import corpus from "../data/corpus.json";
import { buildSymptomSearchIndex, lookupSymptomGuides, summarizeCorpus } from "./corpus";

const expectedEntryCount = 864;
const expectedSourceCount = 1078;
const expectedSymptomCount = 911;

const officialGapBatch = [
  ["dometic-cfx2-americas-operating-manual-112266", "https://media.dometic.com/externalassets/07-0703-070327-070327003_97000040397_112266.pdf", "dometic-cfx2-model-control-battery-prep", ["dometic+cfx2+97000040397", "cfx2+112266"], "dometic cfx2 97000040397 model display battery prep"],
  ["dometic-cfx2-operating-display-elements-support", "https://support.dometic.com/en/cfx2-coolers/Operating-and-display-elements-acf9", "dometic-cfx2-display-led-control-prep", ["dometic+cfx2+display", "cfx2+bluetooth+led"], "dometic cfx2 display bluetooth led control prep"],
  ["dometic-cfx2-error-e02-e07-service-routing-support", "https://support.dometic.com/en/cfx2-coolers/I-see-Error-code-E-02-d76", "dometic-cfx2-error-e02-e07-service-prep", ["dometic+cfx2+e02", "dometic+cfx2+e03", "dometic+cfx2+e04", "dometic+cfx2+e05", "dometic+cfx2+e06", "dometic+cfx2+e07"], "dometic cfx2 e02 e07 service prep"],
  ["dometic-cfx2-battery-monitor-support", "https://support.dometic.com/en/cfx2-coolers/How-to-use-the-battery-monitor-2cc1", "dometic-cfx2-battery-monitor-setting-prep", ["dometic+cfx2+battery+monitor", "cfx2+low+med+high"], "dometic cfx2 battery monitor low med high prep"],
  ["dometic-cfx2-power-led-orange-support", "https://support.dometic.com/en/cfx2-coolers/The-power-LED-lights-up-orange-9632", "dometic-cfx2-orange-power-led-prep", ["dometic+cfx2+orange", "cfx2+power+led"], "dometic cfx2 orange power led prep"],
  ["dometic-cfx2-defrost-owner-maintenance-support", "https://support.dometic.com/en/cfx2-coolers/How-to-defrost-the-cooler-c45a", "dometic-cfx2-defrost-storage-prep", ["dometic+cfx2+defrost", "cfx2+cooler+defrost"], "dometic cfx2 defrost storage prep"],
  ["dometic-cfx-alert-warning-code-router-support", "https://support.dometic.com/en/cfx-coolers/I-see-an-alert-message-or-warning-code-c674", "dometic-cfx-alert-warning-code-router-prep", ["dometic+cfx+warning+code", "cfx+alert+message"], "dometic cfx alert warning code router prep"],
  ["dometic-cfx3-warning-34-compressor-speed-low-support", "https://support.dometic.com/en/cfx3-coolers/WARNING-34-Compressor-speed-low-92f", "dometic-cfx3-warning-34-service-prep", ["dometic+cfx3+warning+34", "cfx3+compressor+speed+low"], "dometic cfx3 warning 34 compressor speed low prep"],
  ["dometic-masterflush-8540-product-control-label-prep", "https://www.dometic.com/en-us/product/dometic-masterflush-8540-12v-macerator-toilet-with-dftp-flush-panel-9600006448", "dometic-masterflush-8540-flush-panel-model-prep", ["dometic+masterflush+8540", "9600006448"], "dometic masterflush 8540 flush panel model prep"],
  ["dometic-masterflush-8700-series-operating-manual-64820", "https://media.dometic.com/externalassets/dometic-masterflush-8740_9600012038_64820.pdf", "dometic-masterflush-8700-flush-control-prep", ["dometic+masterflush+8700", "8740+9600012038"], "dometic masterflush 8700 8740 flush control prep"],
  ["thetford-n4000-series-support-router", "https://www.thetford.com/en/thetford-service-and-support/n4000-series/", "thetford-n4000-model-error-support-router-prep", ["thetford+n4000", "n4080+n4175"], "thetford n4000 n4080 n4175 service router prep"],
  ["thetford-t2000-user-manual-693098-0425", "https://www.thetford.com/app/uploads/2025/05/UM_T2000_EN_693098_0425-V02.pdf", "thetford-t2000-control-maintenance-service-prep", ["thetford+t2000", "693098+0425"], "thetford t2000 user manual controls maintenance prep"],
  ["thetford-t1000e-series-support-router", "https://www.thetford.com/en/thetford-service-and-support/t1000e-series/", "thetford-t1000e-led-model-service-router-prep", ["thetford+t1000e", "thetford+t1090e", "thetford+t1156e"], "thetford t1000e led model service router prep"],
  ["thetford-t1000e-user-manual-693095-0426", "https://www.thetford.com/app/uploads/2026/04/UM_T1000E_693095_0426-v04-EN.pdf", "thetford-t1000e-user-manual-control-prep", ["thetford+t1000e+693095", "t1000e+0426"], "thetford t1000e 693095 user manual prep"],
  ["thetford-c260-series-support-router", "https://www.thetford.com/en/thetford-service-and-support/c260-series/", "thetford-c260-cassette-model-leak-prep", ["thetford+c260", "thetford+c262swe", "thetford+c263cs"], "thetford c260 c262swe c263cs cassette prep"],
  ["thetford-c400-series-support-router", "https://www.thetford.com/en/thetford-service-and-support/c400-series/", "thetford-c400-cassette-level-storage-prep", ["thetford+c400", "thetford+c402c"], "thetford c400 c402c c403l cassette storage prep"],
  ["coleman-chillgrille-straight-through-1976-657", "https://library.coleman-mach.com/wp-content/uploads/2023/04/1976-657.pdf", "coleman-chillgrille-8430-straight-through-control-prep", ["coleman+mach+8430", "chillgrille+1976+657"], "coleman mach 8430 chillgrille 1976 657 control prep"],
  ["coleman-chillgrille-flush-mount-1976-656", "https://library.coleman-mach.com/wp-content/uploads/2023/04/1976-656.pdf", "coleman-chillgrille-8430-flush-mount-model-prep", ["coleman+mach+8430+633", "chillgrille+1976+656"], "coleman mach 8430 633 chillgrille flush mount prep"],
  ["maxxair-dome-plus-03810w-product", "https://www.maxxair.com/products/fans/maxxfan-dome-plus-00-03810W/", "maxxair-dome-plus-03810w-led-control-prep", ["maxxair+03810w", "maxxfan+dome+plus+led"], "maxxair 00 03810w dome plus led control prep"],
  ["maxxair-dome-03812w-product", "https://www.maxxair.com/products/fans/maxxfan-dome-00-03812W/", "maxxair-dome-03812w-fan-model-prep", ["maxxair+03812w", "maxxfan+dome+03812w"], "maxxair 00 03812w dome fan model prep"],
  ["maxxair-fanmate-955001-cover-product", "https://www.maxxair.com/products/covers/fanmate-00-955001/", "maxxair-fanmate-955001-cover-fit-prep", ["maxxair+955001", "fanmate+955001"], "maxxair fanmate 00 955001 cover fit prep"],
  ["maxxair-fanmate-955003-cover-product", "https://www.maxxair.com/products/covers/fanmate-00-955003/", "maxxair-fanmate-955003-cover-fit-prep", ["maxxair+955003", "fanmate+955003+smoke"], "maxxair fanmate 00 955003 smoke cover prep"],
  ["suburban-sw12d-12-gallon-water-heater-product", "https://suburbanrv.com/water-heating/tank-water-heaters/advantage-water-heaters/12-gallon-tank/", "suburban-sw12d-12-gallon-model-prep", ["suburban+sw12d", "sw12d+5246a"], "suburban sw12d 5246a 12 gallon water heater prep"],
  ["suburban-sw16d-16-gallon-water-heater-product", "https://suburbanrv.com/water-heating/tank-water-heaters/advantage-water-heaters/16-gallon-tank/", "suburban-sw16d-16-gallon-model-prep", ["suburban+sw16d", "suburban+16+gallon"], "suburban sw16d 16 gallon water heater prep"],
  ["suburban-e-series-120v-door-water-heater-product", "https://suburbanrv.com/water-heating/tank-water-heaters/e-series-120v-tank-water-heaters/door-version/", "suburban-e-series-120v-door-version-prep", ["suburban+e+series+120v", "suburban+door+version"], "suburban e series 120v door version water heater prep"],
  ["suburban-del-water-heater-control-product", "https://suburbanrv.com/water-heating/tank-water-heaters/tank-water-heater-controls/tank-water-heater-control-del/", "suburban-del-water-heater-switch-prep", ["suburban+del+water+heater", "suburban+control+del"], "suburban del water heater control switch prep"],
  ["suburban-tankless-control-center-product", "https://suburbanrv.com/water-heating/tankless-water-heaters/advantage-tankless-water-heater-control/", "suburban-advantage-tankless-control-center-prep", ["suburban+advantage+tankless"], "suburban advantage tankless control center prep"],
  ["suburban-3909a-air-fryer-stainless-product", "https://suburbanrv.com/kitchen-galley/air-fryers/17-air-fryer-stainless/", "suburban-3909a-air-fryer-stainless-control-prep", ["suburban+3909a", "suburban+17+air+fryer"], "suburban 3909a dark stainless 17 air fryer prep"],
  ["aquahot-edge-tankless-ah1041-sell-sheet", "https://www.aquahot.com/files/product_sheet/AH-1041.02__AQUA-HOT%20Edge%20Tankless%20Water%20Heater%20Sell%20Sheet.pdf", "aquahot-edge-tankless-controller-prep", ["aqua+hot+edge+tankless", "ah+1041+02"], "aqua hot edge tankless ah 1041 02 controller prep"],
  ["aquahot-wave40-ah10130-sell-sheet", "https://www.aquahot.com/files/product_sheet/AH-10130.03_WAVE-40_Sell_Sheet.pdf", "aquahot-wave40-control-mode-prep", ["aqua+hot+wave+40", "ah+10130+03"], "aqua hot wave 40 ah 10130 03 control mode prep"],
  ["aquahot-400-series-owners-manual", "https://www.aquahot.com/files/owners_manual/400%20Series%20Owners.pdf", "aquahot-400-series-owner-manual-prep", ["aqua+hot+400+series", "400+series+owners"], "aqua hot 400 series owners manual service prep"],
  ["furrion-furnace-e7-error-video", "https://support.lci1.com/videos/e7-error-code-on-furrion-furnace", "furrion-furnace-e7-error-service-prep", ["furrion+furnace+e7"], "furrion furnace e7 error service prep"],
  ["girard-tankless-e4-error-video", "https://support.lci1.com/videos/e4-error-code-on-girard-tankless-water-heater", "girard-tankless-e4-service-prep", ["girard+tankless+e4"], "girard tankless e4 service prep"],
  ["girard-tankless-e5-error-video", "https://support.lci1.com/videos/e5-error-code-on-girard-tankless-water-heater", "girard-tankless-e5-service-prep", ["girard+tankless+e5"], "girard tankless e5 service prep"],
  ["girard-tankless-e6-error-video", "https://support.lci1.com/videos/e6-error-code-on-girard-tankless-water-heater", "girard-tankless-e6-service-prep", ["girard+tankless+e6"], "girard tankless e6 service prep"],
  ["girard-tankless-e7-error-video", "https://support.lci1.com/videos/e7-error-code-on-girard-tankless-water-heater", "girard-tankless-e7-service-prep", ["girard+tankless+e7"], "girard tankless e7 service prep"],
  ["girard-tankless-e8-error-video", "https://support.lci1.com/videos/e8-error-code-on-girard-tankless-water-heater", "girard-tankless-e8-service-prep", ["girard+tankless+e8"], "girard tankless e8 service prep"],
  ["furrion-chill-r32-rooftop-aftermarket-manual-ccd0009378", "https://support.lci1.com/documents/ccd-0009378", "furrion-chill-r32-rooftop-model-label-prep", ["furrion+chill+r32", "ccd+0009378"], "furrion chill r32 rooftop model label prep"],
  ["furrion-low-profile-r32-ac-manual-ccd0009380", "https://support.lci1.com/documents/ccd-0009380", "furrion-low-profile-r32-ac-control-prep", ["furrion+low+profile+r32", "ccd+0009380"], "furrion low profile r32 ac control prep"],
  ["furrion-chill-quiet-manual-control-user-manual-ccd0010397", "https://support.lci1.com/documents/ccd-0010397", "furrion-chill-quiet-manual-control-prep", ["furrion+quiet+manual+control", "ccd+0010397"], "furrion chill quiet manual control prep"],
  ["furrion-variable-speed-quiet-adb-manual-ccd0010932", "https://support.lci1.com/documents/ccd-0010932", "furrion-variable-speed-quiet-adb-control-prep", ["ccd+0010932", "quiet+adb+0010932"], "furrion variable speed quiet adb 0010932 control prep"],
  ["furrion-adb-quick-start-ccd0009363", "https://support.lci1.com/documents/ccd-0009363", "furrion-adb-control-state-prep", ["ccd+0009363", "furrion+adb+9363"], "furrion adb 9363 control state prep"],
  ["furrion-thermostat-adapter-kit-ccd0010976", "https://support.lci1.com/documents/ccd-0010976", "furrion-thermostat-adapter-kit-service-prep", ["furrion+thermostat+adapter", "facc13vsd2"], "furrion thermostat adapter facc13vsd2 service prep"],
  ["furrion-2-in-1-range-oven-imfha00083", "https://support.lci1.com/documents/furrion-2-in-1-range-oven-instruction-manual-im-fha00083-v3.0", "furrion-2-in-1-range-oven-imfha00083-prep", ["furrion+im+fha00083", "furrion+2+in+1+range+oven"], "furrion im fha00083 2 in 1 range oven prep"],
  ["furrion-21-chef-electric-oven-ccd0005681", "https://support.lci1.com/documents/ccd-0005681", "furrion-21-chef-electric-oven-control-prep", ["furrion+chef+electric+oven", "ccd+0005681"], "furrion 21 chef electric oven control prep"],
  ["furrion-13-mini-rangehood-troubleshooting-ccd0008524", "https://support.lci1.com/documents/ccd-0008524", "furrion-13-mini-rangehood-filter-control-prep", ["furrion+13+mini+rangehood", "fh013sdsf"], "furrion 13 mini rangehood filter control prep"],
  ["onan-p5000idf-efi-owner-manual-2025", "https://www.cummins.com/sites/default/files/2025-04/p5000idf-efi-owners-manual.pdf", "onan-p5000idf-efi-vft-co-service-prep", ["onan+p5000idf+efi", "p5000idf+vft"], "onan p5000idf efi vft co service prep"],
  ["onan-p9500df-efi-owner-manual-2025", "https://www.cummins.com/sites/default/files/2025-04/p9500df-efi-owners-manual.pdf", "onan-p9500df-efi-vft-co-fuel-prep", ["onan+p9500df+efi", "p9500df+vft"], "onan p9500df efi vft co fuel prep"],
] as const;

describe("official source gap expansion batch", () => {
  it("adds source-only owner-safe guides with tight branded search gates", () => {
    const sourceIds = officialGapBatch.map(([sourceId]) => sourceId);
    const sourceIdSet = new Set<string>(sourceIds);
    const symptomSlugs = new Set<string>(officialGapBatch.map(([, , symptomId]) => symptomId));
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|burner\s+(repair|work|service|port|assembly)|\borifice\b|\bcontrol[- ]board\b|\b120\s*vac\b|\b120\s*v\b|\b110\s*v\b|\bline[- ]voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|remove.*toilet|replace.*valve|measure resistance|fuel nozzle|combustion|coolant pump|manual override|hydraulic work|hydraulic repair|macerator|internal plumbing|seal removal|compressor repair|pump service|magnetron|capacitor|door switch|roof climbing/i;

    expect(corpus.site.indexNow?.submittedAt).toBe("2026-06-04T06:49:35.586Z");
    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => sourceIdSet.has(sourceId)))).toHaveLength(0);

    for (const [sourceId, url, symptomId, requiredTerms, query] of officialGapBatch) {
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
      ["dometic cfx2 orange power led", "dometic-cfx2-orange-power-led-prep"],
      ["dometic cfx3 warning 34", "dometic-cfx3-warning-34-service-prep"],
      ["thetford t1000e 693095", "thetford-t1000e-user-manual-control-prep"],
      ["coleman mach 8430 1976 657", "coleman-chillgrille-8430-straight-through-control-prep"],
      ["maxxair 00 03810w dome plus", "maxxair-dome-plus-03810w-led-control-prep"],
      ["suburban sw12d 5246a", "suburban-sw12d-12-gallon-model-prep"],
      ["aqua hot edge ah 1041 02", "aquahot-edge-tankless-controller-prep"],
      ["furrion furnace e7", "furrion-furnace-e7-error-service-prep"],
      ["girard tankless e8", "girard-tankless-e8-service-prep"],
      ["onan p9500df efi", "onan-p9500df-efi-vft-co-fuel-prep"],
    ]) {
      expect(lookupSymptomGuides(index, query)[0]?.slug, query).toBe(slug);
    }

    for (const query of [
      "display",
      "bluetooth led",
      "battery monitor",
      "orange power led",
      "defrost cooler",
      "warning code",
      "flush panel",
      "cassette",
      "chillgrille",
      "dome plus",
      "fanmate",
      "water heater",
      "door version",
      "control center",
      "air fryer",
      "tankless controller",
      "furnace e7",
      "tankless e4",
      "quiet adb",
      "thermostat adapter",
      "range oven",
      "electric oven",
      "mini rangehood",
      "efi generator",
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
