import { describe, expect, it } from "vitest";
import corpus from "../data/corpus.json";
import { buildSymptomSearchIndex, lookupSymptomGuides, summarizeCorpus } from "./corpus";

const expectedEntryCount = 864;
const expectedSourceCount = 1224;
const expectedSymptomCount = 1052;

const scoutBatch = [
  ["coleman-mach-rv-owners-router", "https://coleman-mach.com/rv-owners/", "coleman-mach-rv-owners-support-routing-prep", ["coleman+mach+rv+owners+documentation", "coleman+mach+documentation+library"], "coleman mach rv owners documentation video library"],
  ["coleman-mach-video-library-router", "https://coleman-mach.com/service-support/videos/", "coleman-mach-video-library-service-prep", ["coleman+mach+video+library+service+prep", "coleman+mach+service+support+videos+prep"], "coleman mach video library service prep"],
  ["coleman-mach-contact-technical-support", "https://coleman-mach.com/contact/?from=0", "coleman-mach-contact-technical-support-prep", ["coleman+mach+rvpsupport", "rvpsupport+airxcel"], "coleman mach rvpsupport airxcel technical support"],
  ["airxcel-contact-brand-routing", "https://www.airxcel.com/Contact/", "airxcel-contact-brand-routing-prep", ["airxcel+contact+brand+routing+prep", "airxcel+contact+technical+experts+prep"], "airxcel contact brand routing prep"],
  ["suburban-video-library-router", "https://suburbanrv.com/service-support/videos/", "suburban-video-library-prep", ["suburban+video+library+water+heating", "suburban+video+library+climate+control"], "suburban video library water heating climate control"],
  ["suburban-water-heating-router", "https://suburbanrv.com/water-heating/", "suburban-water-heating-family-router-prep", ["suburban+water+heating+tankless+router"], "suburban water heating tank tankless router"],
  ["suburban-tankless-water-heaters-router", "https://suburbanrv.com/water-heating/tankless-water-heaters/", "suburban-tankless-water-heaters-control-freeze-prep", ["suburban+tankless+freeze+protection", "suburban+tankless+control+center", "suburban+tankless+water+heaters+freeze", "suburban+tankless+water+heaters+control"], "suburban tankless water heaters freeze protection control center"],
  ["suburban-st-tankless-water-heaters-router", "https://suburbanrv.com/water-heating/tankless-water-heaters/st-water-heaters/", "suburban-st-tankless-digital-control-prep", ["suburban+st+tankless", "suburban+st+42", "suburban+st+60"], "suburban st tankless st42 st60 digital control center"],
  ["suburban-tank-water-heater-accessories-router", "https://suburbanrv.com/water-heating/tank-water-heaters/tank-water-heater-accessories/", "suburban-tank-water-heater-accessories-prep", ["suburban+tank+water+heater+accessories+prep", "suburban+anode+rod+prep"], "suburban tank water heater accessories prep"],
  ["maxxair-maxxfan-maxxfan-plus-family-router", "https://www.maxxair.com/products/fans/maxxfan/", "maxxair-maxxfan-plus-family-model-prep", ["maxxair+maxxfan+plus+00a04301k"], "maxxair maxxfan plus 00a04301k 00-04500k"],
  ["maxxair-maxxfan-plus-international-library-router", "https://library.maxxair.com/manual/465/", "maxxair-maxxfan-plus-international-library-prep", ["maxxfan+plus+international+manual+465", "maxxair+manual+465"], "maxxfan plus international manual 465"],
  ["maxxair-maxxfan-plus-international-brochure", "https://library.maxxair.com/wp-content/uploads/2023/03/axl-mxr_maxxfan-plus-international-08-2019.pdf", "maxxair-maxxfan-plus-international-4000ki-prep", ["maxxfan+plus+international+4000ki", "maxxair+4000ki", "maxxair+4000ki44"], "maxxfan plus international 4000ki 4000ki44"],
  ["maxxair-maxxfan-plus-international-parts-serial-list", "https://library.maxxair.com/wp-content/uploads/2023/03/r-677a_maxxfan-plus-international-repair-parts-list-01-2020.pdf", "maxxair-maxxfan-plus-international-serial-prep", ["maxxfan+plus+international+r+677a", "r+677a", "maxxfan+serial+number"], "maxxfan plus international r-677a serial number"],
  ["maxxair-international-maxxfan-plus-installation-guide", "https://library.maxxair.com/wp-content/uploads/2023/03/02_international-maxxfan-maxxfan-plus-installation-instructions.pdf", "maxxair-international-maxxfan-plus-opening-power-prep", ["maxxfan+4000ki", "maxxfan+4500ki", "maxxfan+355mm", "maxxfan+plus+12+volt+dc"], "maxxfan plus 4000ki 4500ki 355mm 12 volt dc"],
  ["aquahot-125-g02-use-care-guide", "https://library.aquahot.com/wp-content/uploads/2023/01/AHM-125-G02-Use-and-Care-Guide-12.2.22.pdf", "aquahot-125-g02-lcd-winterization-prep", ["aqua+hot+125+g02", "aqua+hot+use+care", "aqua+hot+low+voltage+shutdown"], "aqua hot 125 g02 lcd winterizing low voltage shutdown"],
  ["aquahot-125d-125g-contact-page", "https://www.aquahot.com/products/rv/125d-contact.aspx", "aquahot-125d-125g-contact-routing-prep", ["aqua+hot+125d+contact", "aqua+hot+125g+contact"], "aqua hot 125d 125g contact us"],
  ["aquahot-rv-products-router", "https://www.aquahot.com/Products/RV.aspx", "aquahot-rv-products-model-family-router-prep", ["aqua+hot+products+250p", "aqua+hot+products+400d", "aqua+hot+products+600d"], "aqua hot products 125g 250p 400d 600d"],
  ["aquahot-faq-125g-antifreeze-service-boundary", "https://www.aquahot.com/FAQs.aspx", "aquahot-125g-antifreeze-service-boundary-prep", ["aqua+hot+faq+125g", "aqua+hot+125d+antifreeze", "aqua+hot+125g+antifreeze", "aqua+hot+antifreeze+factory"], "aqua hot faq 125g antifreeze factory authorized"],
  ["furrion-fcr20dcafa-warm-middle-beam-defrost-video", "https://support.lci1.com/videos/automatic-defrost-and-warm-middle-beam-on-fcr20dcafa-furrion-refrigerator", "furrion-fcr20dcafa-warm-middle-beam-defrost-prep", ["fcr20dcafa+warm+middle+beam", "fcr20dcafa+automatic+defrost"], "fcr20dcafa warm middle beam automatic defrost"],
  ["furrion-fcr10dcgfa-lockout-look-video", "https://support.lci1.com/videos/what-does-lock-out-look-like-on-fcr10dcgfa-furrion-refrigerator", "furrion-fcr10dcgfa-lockout-look-prep", ["fcr10dcgfa+lock+out", "furrion+refrigerator"], "fcr10dcgfa lock out furrion refrigerator"],
  ["furrion-adb-filter-cleaning-video", "https://support.lci1.com/videos/furrion-air-conditioner-air-distribution-box-filter-cleaning", "furrion-adb-filter-cleaning-prep", ["furrion+air+distribution+box+filter+cleaning+adb", "furrion+adb+filter+cleaning+prep"], "furrion air distribution box filter cleaning adb"],
  ["furrion-adb-replacement-service-prep-video", "https://support.lci1.com/videos/furrion-air-conditioner-air-distribution-box-replacement", "furrion-adb-replacement-service-prep", ["furrion+air+distribution+box+replacement", "furrion+replacement+adb"], "furrion air distribution box replacement adb"],
  ["furrion-tankless-introduction-video", "https://support.lci1.com/videos/introducing-the-furrion-tankless-water-heater", "furrion-tankless-introduction-model-control-prep", ["furrion+tankless+introduction", "furrion+tankless+water+heater+introduction"], "furrion tankless water heater introduction"],
  ["onan-shop-brand-category-gsn-router", "https://shop.cummins.com/SC/category/brands/onan/0ZG4N0000004G2HWAU", "onan-shop-brand-category-gsn-prep", ["onan+shop+brand+category+gsn", "onan+gsn+maintenance+kits+prep"], "onan gsn rv generators maintenance kits prep"],
  ["onan-finding-right-generator-knowledge-hub", "https://shop.cummins.com/SC/knowledge-hub/d-us/how-to-get-the-best-life-out-of-your-generator-MCOPBVCX6MIJEAVBCV6YXLIMPYIQ", "onan-generator-type-load-planning-prep", ["onan+installed+portable+generator", "onan+rv+generator"], "onan installed portable generator rv load planning"],
  ["onan-rv-generator-maintenance-tips-road", "https://shop.cummins.com/SC/knowledge-hub/d-us/rv-generator-maintenance-tips-for-the-road-MCM6A4MLI4I5FMBLGPG3GXJIJBPU", "onan-rv-generator-road-maintenance-prep", ["onan+rv+generator+maintenance", "onan+green+label+parts"], "onan rv generator maintenance tips road green label parts"],
  ["onan-best-portable-generator-camping", "https://shop.cummins.com/SC/knowledge-hub/d-us/best-portable-generator-for-camping-MCNZ4CXO3OOBCWXLGGJWCSK3C65Y", "onan-portable-generator-camping-load-prep", ["onan+portable+generator+camping", "onan+p4500i", "onan+qg+4000"], "onan portable generator camping p4500i qg 4000"],
  ["dometic-cfx2-switch-off-storage-support", "https://support.dometic.com/en/cfx2-coolers/How-to-switch-the-cooler-off-b9ad", "dometic-cfx2-switch-off-storage-prep", ["cfx2+switch+cooler+off", "dometic+cfx2+switch+off", "dometic+cfx2+storage"], "cfx2 switch cooler off storage dometic"],
  ["dometic-cfx2-connect-power-router", "https://support.dometic.com/en/cfx2-coolers/How-to-connect-the-cooler-3f4", "dometic-cfx2-connect-power-router-prep", ["cfx2+connect+cooler", "cfx2+ac+power+supply", "cfx2+battery"], "cfx2 connect cooler ac power supply battery"],
  ["dometic-cfx2-temperature-unit-control", "https://support.dometic.com/en/cfx2-coolers/How-to-select-the-temperature-unit-eb2f", "dometic-cfx2-temperature-unit-control-prep", ["cfx2+temperature+unit", "dometic+cfx2+temperature+unit"], "cfx2 temperature unit dometic cooler"],
  ["dometic-harrier-constant-switch-off-support", "https://support.dometic.com/en/harrier-ac/My-roof-air-conditioner-constantly-switches-itself-off-a6bc", "dometic-harrier-constant-switch-off-service-prep", ["harrier+constantly+switches", "dometic+harrier+constantly+switches"], "dometic harrier constantly switches itself off"],
  ["dometic-cfx2-passive-to-electric-cooler-support", "https://support.dometic.com/en/cfx2-coolers/I-am-changing-from-passive-coolers-to-electric-ones-what-is-good-to-know-cc28", "dometic-cfx2-passive-electric-expectations-prep", ["cfx2+passive+coolers", "cfx2+electric+coolers"], "cfx2 passive coolers electric ones good to know"],
  ["thetford-porta-potti-565-user-manual-200458-1118", "https://www.thetford.com/app/uploads/2025/01/UM_Porta-Potti-565_200458-1118-V02.pdf", "thetford-porta-potti-565-user-manual-prep", ["porta+potti+565", "200458", "thetford+porta+potti+565"], "thetford porta potti 565 200458 user manual"],
] as const;

const scoutAttachmentBatch = [
  ["furrion-fcr10dcgfa-storage-reset-video", "https://support.lci1.com/videos/proper-storage-and-reset-of-a-fcr10dcgfa-furrion-refrigerator", "furrion-fcr10dcgfa-storage-reset-prep", ["fcr10dcgfa+proper+storage", "fcr10dcgfa+reset"], "fcr10dcgfa proper storage reset furrion"],
  ["furrion-fcr20dcafa-storage-reset-video", "https://support.lci1.com/videos/proper-storage-and-reset-of-a-furrion-model-fcr20dcafa-refrigerator", "furrion-fcr20dcafa-storage-reset-prep", ["fcr20dcafa+storage", "fcr20dcafa+reset"], "fcr20dcafa storage reset furrion refrigerator"],
  ["norcold-n7-n8-polar-parts-list-639735-06102025", "https://www.thetford.com/app/uploads/2024/09/PL_N7N8_639735_06102025-NW.pdf", "norcold-polar-n7x-n8x-support-manual-parts-prep", ["norcold+n7+n8", "norcold+639735", "norcold+n7+n8+parts"], "norcold n7 n8 639735 parts list"],
  ["norcold-n15dc-n20dc-parts-list-641044-082025", "https://www.thetford.com/app/uploads/2024/12/641044_PL_N15DCN20DC_082025.pdf", "norcold-n15dc-support-manual-parts-prep", ["n15dc+641044", "n15dc+parts+list"], "norcold n15dc 641044 parts list"],
  ["norcold-n15dc-n20dc-parts-list-641044-082025", "https://www.thetford.com/app/uploads/2024/12/641044_PL_N15DCN20DC_082025.pdf", "norcold-n20dc-manual-parts-service-prep", ["n20dc+641044", "n20dc+parts+list"], "norcold n20dc 641044 parts list"],
  ["norcold-n8dc-n10dc-parts-list-640138", "https://www.thetford.com/app/uploads/2024/12/PL_N8DXC_N10DXC_640138_20230314.pdf", "norcold-n8dc-manual-parts-service-prep", ["n8dc+640138", "n8dc+parts+list"], "norcold n8dc 640138 parts list"],
  ["norcold-n8dc-n10dc-parts-list-640138", "https://www.thetford.com/app/uploads/2024/12/PL_N8DXC_N10DXC_640138_20230314.pdf", "norcold-n10dc-model-control-service-routing-prep", ["n10dc+640138", "n10dc+parts+list"], "norcold n10dc 640138 parts list"],
] as const;

describe("official source scout batch", () => {
  it("does not unlock scout pages from standalone generic phrases", () => {
    const index = buildSymptomSearchIndex(corpus);
    const protectedSymptomSlugs = new Set<string>([
      ...scoutBatch.map(([, , symptomId]) => symptomId),
      ...scoutAttachmentBatch.map(([, , symptomId]) => symptomId),
    ]);

    for (const query of [
      "technical service videos",
      "coleman mach technical service videos",
      "coleman mach service support videos",
      "coleman mach technical support",
      "coleman mach video library",
      "coleman mach rv owners",
      "coleman mach contact",
      "airxcel contact",
      "airxcel brand directly",
      "airxcel technical experts",
      "brand directly",
      "technical experts",
      "suburban water heating",
      "suburban service support videos",
      "suburban tankless water heaters",
      "suburban freeze protection",
      "suburban control center",
      "suburban tank water heater accessories",
      "suburban replacement anode rod",
      "adb",
      "furrion air distribution box",
      "furrion filter cleaning",
      "maintenance kits",
      "freeze protection",
      "control center",
      "manual 465",
      "serial number",
      "low voltage shutdown",
      "antifreeze",
      "automatic defrost",
      "st 42",
      "st 60",
      "4000ki",
      "4000ki44",
      "4500ki",
      "355mm",
      "maxxair maxxfan plus",
      "maxxfan plus international",
      "125g",
      "125g contact",
      "250p",
      "400d",
      "rv generator",
      "onan rv generators",
      "onan maintenance kits",
      "green label parts",
      "water heater introduction",
      "furrion tankless",
      "furrion water heater introduction",
      "p4500i",
      "qg 4000",
      "dometic cfx2",
      "dometic cfx2 cooler",
      "dometic harrier",
      "battery",
      "electric coolers",
    ]) {
      expect(
        lookupSymptomGuides(index, query)
          .slice(0, 10)
          .map((symptom) => symptom.slug)
          .filter((slug) => protectedSymptomSlugs.has(slug)),
        query,
      ).toEqual([]);
    }
  });

  it("adds non-duplicate owner-safe official guides from the latest scout pass", () => {
    const sourceIds = [...scoutBatch, ...scoutAttachmentBatch].map(([sourceId]) => sourceId);
    const sourceIdSet = new Set<string>(sourceIds);
    const symptomSlugs = new Set<string>([
      ...scoutBatch.map(([, , symptomId]) => symptomId),
      ...scoutAttachmentBatch.map(([, , symptomId]) => symptomId),
    ]);
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|burner\s+(repair|work|service|port|assembly)|\borifice\b|\bcontrol[- ]board\b|\b120\s*vac\b|\b120\s*v\b|\b110\s*v\b|\bline[- ]voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|remove.*toilet|replace.*valve|measure resistance|fuel nozzle|combustion|coolant pump|manual override|hydraulic work|hydraulic repair|macerator|internal plumbing|seal removal|compressor repair|pump service|magnetron|capacitor|door switch|roof climbing/i;

    expect(corpus.site.indexNow?.submittedAt).toBe("2026-06-04T11:16:39.017Z");
    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => sourceIdSet.has(sourceId)))).toHaveLength(0);
    expect(symptomById.get("norcold-n7-n8-polar-parts-list-prep")).toBeUndefined();
    expect(symptomById.get("norcold-n15dc-n20dc-parts-list-prep")).toBeUndefined();
    expect(symptomById.get("norcold-n8dc-n10dc-parts-list-prep")).toBeUndefined();

    for (const [sourceId, url, symptomId, requiredTerms, query] of scoutBatch) {
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

    for (const [sourceId, url, symptomId, requiredTerms, query] of scoutAttachmentBatch) {
      const source = sourcesById.get(sourceId);
      const symptom = symptomById.get(symptomId);

      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toContain(sourceId);
      expect(symptom?.searchRequiredTerms, symptomId).toEqual(expect.arrayContaining(requiredTerms));
      expect(lookupSymptomGuides(index, query)[0]?.slug, query).toBe(symptomId);
    }

    for (const query of [
      "rv owners",
      "contact",
      "video library",
      "coleman mach video library",
      "coleman mach rv owners",
      "coleman mach contact",
      "airxcel contact",
      "technical service videos",
      "coleman mach technical service videos",
      "coleman mach service support videos",
      "coleman mach technical support",
      "brand directly",
      "airxcel brand directly",
      "airxcel technical experts",
      "technical experts",
      "water heating",
      "suburban water heating",
      "suburban service support videos",
      "suburban tankless water heaters",
      "suburban freeze protection",
      "suburban control center",
      "suburban tank water heater accessories",
      "suburban replacement anode rod",
      "tankless",
      "freeze protection",
      "control center",
      "maxxfan plus",
      "maxxair maxxfan plus",
      "maxxfan plus international",
      "manual 465",
      "serial number",
      "aqua hot",
      "aqua hot products",
      "aqua hot 125g",
      "low voltage shutdown",
      "antifreeze",
      "adb",
      "furrion adb",
      "furrion air distribution box",
      "furrion filter cleaning",
      "automatic defrost",
      "dometic cooler",
      "st 42",
      "st 60",
      "4000ki",
      "4000ki44",
      "4500ki",
      "355mm",
      "125g",
      "125g contact",
      "250p",
      "400d",
      "rv generator",
      "onan rv generators",
      "onan maintenance kits",
      "lock out",
      "storage reset",
      "reset furrion",
      "filter cleaning",
      "maintenance tips",
      "maintenance kits",
      "green label parts",
      "water heater introduction",
      "furrion tankless",
      "furrion water heater introduction",
      "p4500i",
      "qg 4000",
      "dometic cfx2",
      "dometic cfx2 cooler",
      "dometic harrier",
      "battery",
      "electric coolers",
      "parts list",
      "user manual",
      "thetford user manual",
      "temperature unit",
    ]) {
      expect(
        lookupSymptomGuides(index, query)
          .slice(0, 10)
          .map((symptom) => symptom.slug)
          .filter((slug) => symptomSlugs.has(slug)),
        query,
      ).toEqual([]);
    }

    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(sourceIds));
  });
});
