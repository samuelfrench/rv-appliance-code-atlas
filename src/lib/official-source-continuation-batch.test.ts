import { describe, expect, it } from "vitest";
import corpus from "../data/corpus.json";
import { buildSymptomSearchIndex, lookupSymptomGuides, summarizeCorpus } from "./corpus";

const expectedEntryCount = 864;
const expectedSourceCount = 1138;
const expectedSymptomCount = 971;

const continuationBatch = [
  ["dometic-cfx3-warning-xx-display-router", "https://support.dometic.com/en/cfx3-coolers/What-does-the-WARNING-XX-mean-on-my-cooler-display-cff4", "dometic-cfx3-warning-xx-service-prep", ["dometic+cfx3+warning+xx", "cfx3+cooler+display"], "dometic cfx3 warning xx display"],
  ["dometic-cfx3-display-use-control-prep", "https://support.dometic.com/en/cfx3-coolers/How-to-use-the-display-c2c3", "dometic-cfx3-display-buttons-state-prep", ["dometic+cfx3+display", "cfx3+buttons"], "dometic cfx3 display buttons state"],
  ["dometic-cfx3-defrost-storage-prep", "https://support.dometic.com/en/cfx3-coolers/How-to-defrost-the-cooler-77f3", "dometic-cfx3-defrost-storage-prep", ["dometic+cfx3+defrost", "cfx3+storage"], "dometic cfx3 defrost storage"],
  ["dometic-cfx3-shutdown-e31-service-prep", "https://support.dometic.com/en/cfx3-coolers/My-cooler-shuts-down-unexpectedly-80fe", "dometic-cfx3-shuts-down-e31-low-voltage-prep", ["dometic+cfx3+shuts+down", "cfx3+e31"], "dometic cfx3 shuts down e31 low voltage"],
  ["dometic-cfx3-power-draw-runtime-prep", "https://support.dometic.com/en/cfx3-coolers/How-do-I-calculate-how-much-power-a-CFX3-will-draw-4b40", "dometic-cfx3-power-runtime-prep", ["dometic+cfx3+power+draw", "cfx3+runtime"], "dometic cfx3 power draw runtime"],
  ["dometic-cfx3-display-keystrokes-service-prep", "https://support.dometic.com/en/cfx3-coolers/My-display-does-not-respond-to-keystrokes-852c", "dometic-cfx3-display-not-responding-prep", ["dometic+cfx3+display+keystrokes", "dometic+cfx3+display+not+responding"], "dometic cfx3 display not responding keystrokes"],
  ["dometic-cfx3-ice-maker-clean-dry-storage-prep", "https://support.dometic.com/en/cfx3-coolers/How-to-clean-and-dry-the-ice-maker-ea42", "dometic-cfx3-ice-maker-storage-prep", ["dometic+cfx3+ice+maker", "clean+dry+ice+maker"], "dometic cfx3 ice maker clean dry"],
  ["dometic-cfx3-temperature-units-control-prep", "https://support.dometic.com/en/cfx3-coolers/How-to-set-the-temperature-units-501d", "dometic-cfx3-temperature-units-prep", ["dometic+cfx3+temperature+units", "cfx3+celsius+fahrenheit"], "dometic cfx3 temperature units celsius fahrenheit"],
  ["dometic-brisk-thermostat-control-panel-prep", "https://support.dometic.com/en/brisk-ac/How-to-use-the-control-panel-on-thermostat-d66d", "dometic-brisk-thermostat-control-identification-prep", ["dometic+brisk+thermostat", "brisk+control+panel"], "dometic brisk thermostat control panel"],
  ["dometic-brisk-temperature-format-control-prep", "https://support.dometic.com/en/brisk-ac/How-to-change-Temperature-Format-74ae", "dometic-brisk-temperature-format-prep", ["dometic+brisk+temperature+format", "brisk+fahrenheit+celsius"], "dometic brisk temperature format fahrenheit celsius"],
  ["dometic-brisk-service-provider-routing-prep", "https://support.dometic.com/en/brisk-ac/Where-can-I-find-the-nearest-service-provider-bb4c", "dometic-brisk-service-provider-routing-prep", ["dometic+brisk+service+provider", "dometic+brisk+nearest+service+provider"], "dometic brisk nearest service provider"],
  ["dometic-freshjet-remote-elements-control-prep", "https://support.dometic.com/en/freshjet-ac/What-are-the-functionalities-of-the-elements-on-the-remote-control-28f4", "dometic-freshjet-remote-symbols-prep", ["dometic+freshjet+remote+control", "freshjet+remote+symbols"], "dometic freshjet remote control symbols"],
  ["dometic-harrier-return-air-filter-prep", "https://support.dometic.com/en/harrier-ac/What-should-I-do-to-make-sure-the-filter-on-my-rooftop-unit-is-clean-for-maximum-efficiency-2dad", "dometic-harrier-return-air-filter-prep", ["dometic+harrier+filter", "harrier+maximum+efficiency"], "dometic harrier filter maximum efficiency"],
  ["dometic-harrier-remote-battery-prep", "https://support.dometic.com/en/harrier-ac/How-to-Replace-the-remote-control-batteries-fe1e", "dometic-harrier-remote-battery-prep", ["dometic+harrier+remote", "remote+control+batteries"], "dometic harrier remote control batteries"],
  ["dometic-cfx3-warning-32-fan-overcurrent-support", "https://support.dometic.com/en/cfx3-coolers/WARNING-32-Fan-overcurrent-5720", "dometic-cfx3-warning-32-fan-service-prep", ["dometic+cfx3+warning+32", "fan+overcurrent+cfx3"], "dometic cfx3 warning 32 fan overcurrent"],
  ["dometic-cfx3-warning-35-controller-overtemperature-support", "https://support.dometic.com/en/cfx3-coolers/WARNING-35-Controller-overtemperature-8728", "dometic-cfx3-warning-35-controller-temperature-prep", ["dometic+cfx3+warning+35", "controller+overtemperature+cfx3"], "dometic cfx3 warning 35 controller overtemperature"],
  ["dometic-cfx3-warning-0343-communication-error-support", "https://support.dometic.com/en/cfx3-coolers/WARNING-0343-Communication-error-523c", "dometic-cfx3-warning-0343-communication-prep", ["dometic+cfx3+warning+0343", "communication+error+cfx3"], "dometic cfx3 warning 0343 communication error"],
  ["dometic-cff-battery-monitor-mode-support", "https://support.dometic.com/en/cff-coolers/How-to-set-the-battery-monitor-mode-3d3f", "dometic-cff-battery-monitor-mode-prep", ["dometic+cff+battery+monitor", "cff+battery+mode"], "dometic cff battery monitor mode"],
  ["coleman-7330-wall-thermostat-1976-190", "https://library.coleman-mach.com/wp-content/uploads/2023/04/1976-190.pdf", "coleman-7330-wall-thermostat-model-state-prep", ["coleman+7330+thermostat", "7330+wall+thermostat"], "coleman 7330 wall thermostat heat cool fan"],
  ["coleman-7330d-wall-thermostat-1976-192", "https://library.coleman-mach.com/wp-content/uploads/2023/04/1976-192.pdf", "coleman-7330d-digital-thermostat-face-prep", ["coleman+7330d+thermostat", "7330d3371+7330d3381"], "coleman 7330d3371 7330d3381 thermostat"],
  ["coleman-9330-9530-ir-thermostat-router", "https://library.coleman-mach.com/manual/model-9330-9530-ir-wall-thermostat-9330-ir-wall-thermostat-w-remote-transmitter/", "coleman-ir-thermostat-remote-control-prep", ["coleman+9330+9530+remote", "ir+wall+thermostat"], "coleman 9330 9530 IR thermostat remote"],
  ["coleman-extended-parts-warranty-1976-338", "https://library.coleman-mach.com/wp-content/uploads/2023/04/1976-338.pdf", "coleman-mach-extended-parts-warranty-prep", ["coleman+extended+parts+warranty", "three+year+limited"], "coleman mach extended parts warranty three years"],
  ["maxxair-mini-maxxfan-mini-iom-10d03708z", "https://library.maxxair.com/wp-content/uploads/2023/03/10d03708z_maxxair-mini-maxxfan-mini-mini-plus_iom-05-2019-1.pdf", "maxxair-mini-model-control-service-prep", ["maxxair+mini+maxfan", "maxxair+mini+maxxfan", "3801+3851"], "maxxair mini maxfan mini plus"],
  ["maxxair-mini-repair-parts-r700", "https://library.maxxair.com/wp-content/uploads/2023/03/r-700_mxr-mini-mxfan-mini-mini-plus-mini-deluxe-repair-parts-list-01-27-2020.pdf", "maxxair-mini-parts-label-service-prep", ["maxxair+r700+mini", "mini+repair+parts"], "maxxair mini deluxe R-700 repair parts list"],
  ["maxxair-vent-covers-unimaxx-maxxshade-10d50905z", "https://library.maxxair.com/wp-content/uploads/2023/03/axl-mxr_10d50905z_vent-covers-unimaxx-maxxshade-maxxfan-08-2018.pdf", "maxxair-unimaxx-maxxshade-compatibility-prep", ["maxxair+unimaxx+maxxshade", "10d50905z"], "maxxair unimaxx maxxshade 10d50905z compatibility"],
  ["suburban-slide-in-cooktops-product-family", "https://suburbanrv.com/kitchen-galley/cooktops/slide-in-cooktops/", "suburban-slide-in-cooktops-model-prep", ["suburban+slide-in+cooktops", "suburban+cooktop+slide-in"], "suburban slide in cooktops"],
  ["suburban-drop-in-cooktops-product-family", "https://suburbanrv.com/kitchen-galley/cooktops/drop-in-cooktops/", "suburban-drop-in-cooktops-model-prep", ["suburban+drop-in+cooktops", "suburban+cooktop+drop-in"], "suburban drop in cooktops"],
  ["aquahot-250p-owner-manual", "https://www.aquahot.com/files/owners_manual/200_250P_Owners_Manual_LTE-300-000.pdf", "aquahot-250p-owner-manual-service-prep", ["aqua+hot+250p", "200+250p+owners+manual"], "aqua hot 250p owner manual"],
  ["norcold-n2175-parts-list-641001", "https://www.thetford.com/app/uploads/2024/09/641001_PL_N2175_082025.pdf", "norcold-n2175-parts-list-model-prep", ["norcold+n2175+641001", "n2175+parts+list"], "norcold n2175 parts list 641001"],
  ["furrion-fcr20dcafa-not-working-video", "https://support.lci1.com/videos/troubleshoot-refrigerator-is-on-but-not-working-on-fcr20dcafa-furrion-refrigerator", "furrion-fcr20dcafa-not-working-service-prep", ["furrion+fcr20dcafa", "refrigerator+on+not+working"], "furrion fcr20dcafa refrigerator on not working"],
] as const;

describe("official source continuation batch", () => {
  it("adds owner-safe source-only guides without code entries or generic hijacks", () => {
    const sourceIds = continuationBatch.map(([sourceId]) => sourceId);
    const sourceIdSet = new Set<string>(sourceIds);
    const symptomSlugs = new Set<string>(continuationBatch.map(([, , symptomId]) => symptomId));
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|burner\s+(repair|work|service|port|assembly)|\borifice\b|\bcontrol[- ]board\b|\b120\s*vac\b|\b120\s*v\b|\b110\s*v\b|\bline[- ]voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|remove.*toilet|replace.*valve|measure resistance|fuel nozzle|combustion|coolant pump|manual override|hydraulic work|hydraulic repair|macerator|internal plumbing|seal removal|compressor repair|pump service|magnetron|capacitor|door switch|roof climbing/i;

    expect(corpus.site.indexNow?.submittedAt).toBe("2026-06-04T07:48:31.054Z");
    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => sourceIdSet.has(sourceId)))).toHaveLength(0);

    for (const [sourceId, url, symptomId, requiredTerms, query] of continuationBatch) {
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
      ["dometic cfx3 warning xx display", "dometic-cfx3-warning-xx-service-prep"],
      ["dometic cfx3 defrost storage", "dometic-cfx3-defrost-storage-prep"],
      ["dometic brisk thermostat control panel", "dometic-brisk-thermostat-control-identification-prep"],
      ["dometic harrier remote batteries", "dometic-harrier-remote-battery-prep"],
      ["coleman 7330 wall thermostat", "coleman-7330-wall-thermostat-model-state-prep"],
      ["coleman 7330d3371 7330d3381 thermostat", "coleman-7330d-digital-thermostat-face-prep"],
      ["maxxair mini maxfan mini plus", "maxxair-mini-model-control-service-prep"],
      ["aqua hot 250p owner manual", "aquahot-250p-owner-manual-service-prep"],
      ["norcold n2175 parts list 641001", "norcold-n2175-parts-list-model-prep"],
      ["furrion fcr20dcafa refrigerator on not working", "furrion-fcr20dcafa-not-working-service-prep"],
    ]) {
      expect(lookupSymptomGuides(index, query)[0]?.slug, query).toBe(slug);
    }

    for (const query of [
      "warning xx",
      "display",
      "display not responding",
      "defrost",
      "thermostat",
      "nearest service provider",
      "remote batteries",
      "mini maxxfan",
      "maxfan mini plus",
      "cooktops",
      "owner manual",
      "parts list",
      "e4",
      "not working",
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
