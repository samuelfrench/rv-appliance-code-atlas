import { describe, expect, it } from "vitest";
import corpus from "../data/corpus.json";
import { buildSymptomSearchIndex, lookupSymptomGuides, summarizeCorpus } from "./corpus";

const expectedEntryCount = 864;
const expectedSourceCount = 1176;
const expectedSymptomCount = 1004;

const controlRouterBatch = [
  ["dometic-harrier-set-temperature-control-support", "https://support.dometic.com/en/harrier-ac/How-to-Set-the-temperature-895b", "dometic-harrier-set-temperature-control-prep", ["dometic+harrier+temperature", "set+temperature+895b"], "dometic harrier set temperature 895b"],
  ["dometic-harrier-timer-control-support", "https://support.dometic.com/en/harrier-ac/How-to-Set-the-timer-25a0", "dometic-harrier-timer-control-prep", ["dometic+harrier+timer", "set+timer+25a0"], "dometic harrier set timer 25a0"],
  ["dometic-harrier-fan-setting-control-support", "https://support.dometic.com/en/harrier-ac/How-to-select-the-fan-setting-manually-6ebb", "dometic-harrier-fan-setting-control-prep", ["dometic+harrier+fan+setting", "fan+setting+manually"], "dometic harrier fan setting manually"],
  ["dometic-harrier-operating-modes-support", "https://support.dometic.com/en/harrier-ac/What-operating-modes-are-available-for-my-product-27b4", "dometic-harrier-operating-modes-prep", ["dometic+harrier+operating+modes", "modes+27b4"], "dometic harrier operating modes 27b4"],
  ["dometic-harrier-remote-control-use-support", "https://support.dometic.com/en/harrier-ac/How-to-Use-the-remote-control-682c", "dometic-harrier-remote-control-use-prep", ["dometic+harrier+remote+control", "use+remote+682c"], "dometic harrier remote control 682c"],
  ["dometic-harrier-air-conditioning-mode-support", "https://support.dometic.com/en/harrier-ac/How-to-Select-the-air-conditioning-mode-66a6", "dometic-harrier-air-conditioning-mode-prep", ["dometic+harrier+air+conditioning+mode", "select+mode+66a6"], "dometic harrier air conditioning mode 66a6"],
  ["dometic-harrier-optimize-performance-support", "https://support.dometic.com/en/harrier-ac/How-to-Optimize-performance-of-the-air-conditioner-ffdf", "dometic-harrier-performance-prep", ["dometic+harrier+optimize+performance", "air+conditioner+ffdf"], "dometic harrier optimize performance ffdf"],
  ["dometic-ibis-set-temperature-control-support", "https://support.dometic.com/en/ibis-ac/How-to-Set-the-temperature-73ca", "dometic-ibis-set-temperature-control-prep", ["dometic+ibis+temperature", "set+temperature+73ca"], "dometic ibis set temperature 73ca"],
  ["dometic-ibis-timer-control-support", "https://support.dometic.com/en/ibis-ac/How-to-Set-the-timer-fcdf", "dometic-ibis-timer-control-prep", ["dometic+ibis+timer", "set+timer+fcdf"], "dometic ibis set timer fcdf"],
  ["dometic-ibis-fan-setting-control-support", "https://support.dometic.com/en/ibis-ac/How-to-select-the-fan-setting-manually-87f0", "dometic-ibis-fan-setting-control-prep", ["dometic+ibis+fan+setting", "fan+setting+87f0"], "dometic ibis fan setting manually 87f0"],
  ["dometic-ibis-remote-control-use-support", "https://support.dometic.com/en/ibis-ac/How-to-Use-the-remote-control-ee0", "dometic-ibis-remote-control-use-prep", ["dometic+ibis+remote+control", "use+remote+ee0"], "dometic ibis remote control ee0"],
  ["dometic-ibis-roof-ac-does-not-switch-on-support", "https://support.dometic.com/en/ibis-ac/My-roof-air-conditioner-does-not-switch-on-dc8e", "dometic-ibis-roof-ac-does-not-switch-on-service-prep", ["dometic+ibis+does+not+switch+on", "roof+air+conditioner+dc8e"], "dometic ibis roof air conditioner does not switch on dc8e"],
  ["dometic-brisk-fan-speed-control-support", "https://support.dometic.com/en/brisk-ac/How-to-control-Fan-Speed-4828", "dometic-brisk-fan-speed-control-prep", ["dometic+brisk+fan+speed", "control+fan+speed+4828"], "dometic brisk fan speed 4828"],
  ["dometic-brisk-zone-control-support", "https://support.dometic.com/en/brisk-ac/How-to-control-Zone-Control-517a", "dometic-brisk-zone-control-prep", ["dometic+brisk+zone+control", "zone+control+517a"], "dometic brisk zone control 517a"],
  ["dometic-brisk-quick-cool-return-support", "https://support.dometic.com/en/brisk-ac/How-to-control-Quick-Cool-Return-on-thermostat-23ea", "dometic-brisk-quick-cool-return-control-prep", ["dometic+brisk+quick+cool", "quick+cool+return+23ea"], "dometic brisk quick cool return 23ea"],
  ["dometic-cfx2-lid-latch-support", "https://support.dometic.com/en/cfx2-coolers/How-to-latch-the-cooler-lid-d3b", "dometic-cfx2-lid-latch-travel-prep", ["dometic+cfx2+lid+latch", "cooler+lid+d3b"], "dometic cfx2 latch cooler lid d3b"],
  ["dometic-cfx2-battery-connection-support", "https://support.dometic.com/en/cfx2-coolers/How-to-connect-the-cooler-to-a-battery-c9e0", "dometic-cfx2-battery-connection-prep", ["dometic+cfx2+battery+connection", "cooler+battery+c9e0"], "dometic cfx2 connect cooler to battery c9e0"],
  ["dometic-cfx2-display-brightness-support", "https://support.dometic.com/en/cfx2-coolers/How-to-set-the-display-brightness-3715", "dometic-cfx2-display-brightness-control-prep", ["dometic+cfx2+display+brightness", "brightness+3715"], "dometic cfx2 display brightness 3715"],
  ["norcold-thetford-refrigeration-router", "https://www.thetford.com/us/refrigeration", "norcold-thetford-refrigeration-model-router-prep", ["norcold+thetford+refrigeration", "refrigeration+model+router"], "norcold thetford refrigeration model router"],
  ["thetford-us-product-range-router", "https://www.thetford.com/us/all-products/", "thetford-us-product-range-router-prep", ["thetford+all+products", "thetford+product+range"], "thetford all products product range"],
  ["thetford-int-support-router", "https://www.thetford.com/int/thetford-service-and-support/", "thetford-int-support-router-prep", ["thetford+service+support", "label+positions"], "thetford service and support label positions"],
  ["thetford-int-product-overview-router", "https://www.thetford.com/int/overview-all-products/", "thetford-int-product-overview-router-prep", ["thetford+product+overview", "overview+all+products"], "thetford product overview all products"],
  ["coleman-8330-multiple-zone-thermostat-router", "https://library.coleman-mach.com/manual/8330-331-335-multiple-zone-thermostat-controller-system/", "coleman-8330-multiple-zone-thermostat-prep", ["coleman+8330+multiple+zone", "8330+331+335"], "coleman 8330 331 335 multiple zone thermostat"],
  ["coleman-9420-digital-thermostats-router", "https://library.coleman-mach.com/manual/digital-thermostats-9420-381-9420-382/", "coleman-9420-digital-thermostat-prep", ["coleman+9420+digital+thermostat", "9420+381+9420+382"], "coleman 9420 381 9420 382 digital thermostat"],
  ["coleman-9430-wall-thermostat-router", "https://library.coleman-mach.com/manual/installation-operation-instructions-airxcel-9430-series-wall-thermostat/", "coleman-9430-wall-thermostat-prep", ["coleman+9430+wall+thermostat", "airxcel+9430"], "coleman airxcel 9430 wall thermostat"],
  ["coleman-6535-335-heat-pump-wall-thermostat-router", "https://library.coleman-mach.com/manual/6535-335-2-stage-heat-pump-wall-thermostat-3/", "coleman-6535-335-heat-pump-wall-thermostat-prep", ["coleman+6535+335+thermostat", "heat+pump+wall+thermostat"], "coleman 6535 335 heat pump wall thermostat"],
  ["maxxair-maxxshade-library-router", "https://library.maxxair.com/manual/482/", "maxxair-maxxshade-library-prep", ["maxxair+maxxshade+482", "maxxshade+library"], "maxxair maxxshade 482 library"],
  ["maxxair-skymaxx-97550-97510-router", "https://library.maxxair.com/manual/494/", "maxxair-skymaxx-97550-97510-prep", ["maxxair+skymaxx+97550", "skymaxx+97510"], "maxxair skymaxx 97550 97510"],
  ["greystone-26-40-fireplace-manual-ccd0007548", "https://support.lci1.com/documents/ccd-0007548", "greystone-26-40-fireplace-control-prep", ["greystone+26+40+fireplace", "ccd+0007548"], "greystone 26 40 fireplace ccd 0007548"],
  ["greystone-60-electric-fireplace-manual-ccd0009757", "https://support.lci1.com/documents/ccd-0009757", "greystone-60-fireplace-control-prep", ["greystone+60+fireplace", "ccd+0009757"], "greystone 60 built in electric fireplace ccd 0009757"],
] as const;

describe("official source control-router batch", () => {
  it("adds owner-safe official source-only guides with tight search gates", () => {
    const sourceIds = controlRouterBatch.map(([sourceId]) => sourceId);
    const sourceIdSet = new Set<string>(sourceIds);
    const symptomSlugs = new Set<string>(controlRouterBatch.map(([, , symptomId]) => symptomId));
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|burner\s+(repair|work|service|port|assembly)|\borifice\b|\bcontrol[- ]board\b|\b120\s*vac\b|\b120\s*v\b|\b110\s*v\b|\bline[- ]voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|remove.*toilet|replace.*valve|measure resistance|fuel nozzle|combustion|coolant pump|manual override|hydraulic work|hydraulic repair|macerator|internal plumbing|seal removal|compressor repair|pump service|magnetron|capacitor|door switch|roof climbing/i;

    expect(corpus.site.indexNow?.submittedAt).toBe("2026-06-04T08:31:23.141Z");
    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => sourceIdSet.has(sourceId)))).toHaveLength(0);

    for (const [sourceId, url, symptomId, requiredTerms, query] of controlRouterBatch) {
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
      "set temperature",
      "timer",
      "fan setting",
      "operating modes",
      "remote control",
      "air conditioning mode",
      "optimize performance",
      "does not switch on",
      "product range",
      "thermostat",
      "wall thermostat",
      "maxxshade",
      "skymaxx",
      "fireplace",
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
