import { describe, expect, it } from "vitest";
import corpus from "../data/corpus.json";
import { buildSymptomSearchIndex, lookupSymptomGuides, summarizeCorpus } from "./corpus";

const expectedEntryCount = 864;
const expectedSourceCount = 1224;
const expectedSymptomCount = 1052;

const dometicAppHvacBatch = [
  ["dometic-cfx5-app-graph-support", "https://support.dometic.com/en/cfx5-coolers/How-do-I-read-the-graph-in-the-CFX5-app-5423", "dometic-cfx5-app-graph-prep", ["cfx5+app+graph", "dometic+cfx5+app+graph"], "cfx5 app graph 5423 cooler"],
  ["dometic-cfx5-app-crash-password-support", "https://support.dometic.com/en/cfx5-coolers/The-app-crashes-after-entering-password-94e7", "dometic-cfx5-app-crash-password-prep", ["cfx5+app+crashes+password", "dometic+cfx5+password+94e7"], "cfx5 app crashes after entering password 94e7"],
  ["dometic-cfx5-app-keeps-crashing-support", "https://support.dometic.com/en/cfx5-coolers/The-app-keeps-crashing-8964", "dometic-cfx5-app-keeps-crashing-prep", ["cfx5+app+keeps+crashing", "dometic+cfx5+app+8964"], "cfx5 app keeps crashing 8964"],
  ["dometic-cfx5-app-loading-screen-support", "https://support.dometic.com/en/cfx5-coolers/The-app-gets-stuck-on-the-loading-screen-de69", "dometic-cfx5-app-loading-screen-prep", ["cfx5+app+loading+screen", "dometic+cfx5+loading+screen"], "cfx5 app stuck loading screen de69"],
  ["dometic-cfx5-smartphone-wifi-app-support", "https://support.dometic.com/en/cfx5-coolers/The-WiFi-on-my-smartphone-doesnt-work-while-using-the-app-68aa", "dometic-cfx5-smartphone-wifi-app-prep", ["cfx5+smartphone+wifi+app", "dometic+cfx5+wifi+68aa"], "cfx5 smartphone wifi app 68aa"],
  ["dometic-cfx5-smartphone-connected-app-support", "https://support.dometic.com/en/cfx5-coolers/My-smartphone-is-connected-to-the-cooler-but-the-app-is-not-working-84ac", "dometic-cfx5-smartphone-connected-app-prep", ["cfx5+smartphone+connected+app", "dometic+cfx5+app+84ac"], "cfx5 smartphone connected cooler app not working 84ac"],
  ["dometic-cfx5-app-cannot-control-cooler-support", "https://support.dometic.com/en/cfx5-coolers/The-app-cannot-control-the-cooler-3caa", "dometic-cfx5-app-cannot-control-cooler-prep", ["cfx5+app+cannot+control+cooler", "dometic+cfx5+control+3caa"], "cfx5 app cannot control cooler 3caa"],
  ["dometic-cfx5-password-connect-support", "https://support.dometic.com/en/cfx5-coolers/What-is-the-password-to-connect-the-CFX5-919d", "dometic-cfx5-password-connect-prep", ["cfx5+password+connect", "dometic+cfx5+919d"], "cfx5 password connect 919d"],
  ["dometic-cfx5-wifi-network-name-support", "https://support.dometic.com/en/cfx5-coolers/What-is-the-WiFi-network-name-for-my-CFX-df30", "dometic-cfx5-wifi-network-name-prep", ["cfx5+wifi+network+name", "dometic+cfx+df30"], "cfx5 wifi network name df30"],
  ["dometic-cfx5-display-key-strokes-support", "https://support.dometic.com/en/cfx5-coolers/The-display-does-not-respond-to-key-strokes-3b7e", "dometic-cfx5-display-key-strokes-prep", ["cfx5+display+key+strokes", "dometic+cfx5+3b7e"], "cfx5 display key strokes 3b7e"],
  ["dometic-cfx5-ac-mode-doesnt-work-support", "https://support.dometic.com/en/cfx5-coolers/My-cooler-doesnt-work-when-in-AC-mode-f3d8", "dometic-cfx5-ac-mode-doesnt-work-prep", ["cfx5+ac+mode+doesnt+work", "dometic+cfx5+f3d8"], "cfx5 ac mode doesnt work f3d8"],
  ["dometic-ibis-control-panel-elements-support", "https://support.dometic.com/en/ibis-ac/What-are-the-functionalities-of-the-elements-on-the-control-panels-19ba", "dometic-ibis-control-panel-elements-prep", ["ibis+control+panel+elements", "dometic+ibis+19ba"], "ibis control panel elements 19ba"],
  ["dometic-ibis-remote-elements-support", "https://support.dometic.com/en/ibis-ac/What-are-the-functionalities-of-the-elements-on-the-remote-control-7484", "dometic-ibis-remote-elements-prep", ["ibis+remote+control+elements", "dometic+ibis+7484"], "ibis remote control elements 7484"],
  ["dometic-ibis-not-heating-support", "https://support.dometic.com/en/ibis-ac/My-air-conditioner-is-not-heating-well-55b", "dometic-ibis-not-heating-service-prep", ["ibis+not+heating", "dometic+ibis+55b"], "ibis air conditioner not heating well 55b"],
  ["dometic-ibis-water-enters-vehicle-support", "https://support.dometic.com/en/ibis-ac/Water-enters-the-vehicle-d19a", "dometic-ibis-water-enters-vehicle-service-prep", ["ibis+water+enters+vehicle", "dometic+ibis+d19a"], "ibis water enters the vehicle d19a"],
  ["dometic-harrier-does-not-switch-off-support", "https://support.dometic.com/en/harrier-ac/My-roof-air-conditioner-does-not-switch-off-6373", "dometic-harrier-does-not-switch-off-prep", ["harrier+does+not+switch+off", "dometic+harrier+6373"], "harrier roof air conditioner does not switch off 6373"],
  ["dometic-harrier-ac-modes-support", "https://support.dometic.com/en/harrier-ac/What-air-conditioner-modes-are-available-for-my-product-18b1", "dometic-harrier-ac-modes-prep", ["harrier+air+conditioner+modes", "dometic+harrier+18b1"], "harrier air conditioner modes 18b1"],
  ["dometic-harrier-switch-on-standby-support", "https://support.dometic.com/en/harrier-ac/How-to-Switch-the-roof-air-conditioner-on-and-to-stand-by-db", "dometic-harrier-switch-on-standby-prep", ["harrier+switch+roof+air+conditioner+stand+by", "dometic+harrier+db"], "harrier switch roof air conditioner on stand by db"],
  ["dometic-harrier-not-heating-support", "https://support.dometic.com/en/harrier-ac/My-air-conditioner-is-not-heating-well-811e", "dometic-harrier-not-heating-service-prep", ["harrier+not+heating", "dometic+harrier+811e"], "harrier air conditioner not heating well 811e"],
  ["dometic-harrier-low-air-output-support", "https://support.dometic.com/en/harrier-ac/My-air-conditioner-is-giving-me-low-air-output-d861", "dometic-harrier-low-air-output-service-prep", ["harrier+low+air+output", "dometic+harrier+d861"], "harrier low air output d861"],
  ["dometic-brisk-furnace-thermostat-support", "https://support.dometic.com/en/brisk-ac/How-to-control-Furnace-on-thermostat-a495", "dometic-brisk-furnace-thermostat-prep", ["brisk+furnace+thermostat+a495", "dometic+brisk+furnace+thermostat"], "brisk furnace thermostat a495"],
  ["dometic-brisk-button-functions-support", "https://support.dometic.com/en/brisk-ac/How-to-use-the-button-functions-403a", "dometic-brisk-button-functions-prep", ["brisk+button+functions+403a", "dometic+brisk+button+functions"], "brisk button functions 403a"],
  ["dometic-brisk-operates-improperly-support", "https://support.dometic.com/en/brisk-ac/Air-Conditioner-fails-to-operate-or-operates-improperly-d0fe", "dometic-brisk-operates-improperly-service-prep", ["brisk+air+conditioner+fails+operate+d0fe", "dometic+brisk+operates+improperly"], "brisk air conditioner fails operate improperly d0fe"],
  ["dometic-brisk-fan-compressor-runs-support", "https://support.dometic.com/en/brisk-ac/Fan-doesnt-operate-but-compressor-runs-when-Air-ConditionerHeat-Pump-is-turned-on-a18f", "dometic-brisk-fan-compressor-runs-service-prep", ["brisk+fan+doesnt+operate+compressor+runs", "dometic+brisk+a18f"], "brisk fan doesnt operate compressor runs a18f"],
  ["dometic-brisk-error-code-router-support", "https://support.dometic.com/en/brisk-ac/I-see-an-error-code-26fc", "dometic-brisk-error-code-router-prep", ["brisk+error+code+26fc", "dometic+brisk+error+code+26fc"], "brisk error code 26fc"],
] as const;

const naturalSourceWordingQueries = [
  ["cfx5 ac mode does not work f3d8", "dometic-cfx5-ac-mode-doesnt-work-prep"],
  ["dometic harrier switch on standby", "dometic-harrier-switch-on-standby-prep"],
  ["brisk fan does not operate compressor runs a18f", "dometic-brisk-fan-compressor-runs-service-prep"],
] as const;

describe("official Dometic app and HVAC support batch", () => {
  it("adds owner-safe official pages without new code entries or generic hijacks", () => {
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const protectedSlugs = new Set(dometicAppHvacBatch.map(([, , symptomId]) => symptomId));
    const sourceIds = new Set(dometicAppHvacBatch.map(([sourceId]) => sourceId));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|burner\s+(repair|work|service|port|assembly)|\borifice\b|\bcontrol[- ]board\b|\b120\s*vac\b|\b120\s*v\b|\b110\s*v\b|\bline[- ]voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|replace.*valve|measure resistance|compressor repair|pump service|capacitor|roof climbing/i;

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => sourceIds.has(sourceId)))).toHaveLength(0);

    for (const [sourceId, url, symptomId, requiredTerms, query] of dometicAppHvacBatch) {
      const source = sourcesById.get(sourceId);
      const symptom = symptomById.get(symptomId);

      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual([sourceId]);
      expect(symptom?.searchRequiredTerms, symptomId).toEqual(expect.arrayContaining(requiredTerms));
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
      expect(lookupSymptomGuides(index, query)[0]?.slug, query).toBe(symptomId);
    }

    for (const [query, symptomId] of naturalSourceWordingQueries) {
      expect(lookupSymptomGuides(index, query)[0]?.slug, query).toBe(symptomId);
    }

    for (const query of [
      "dometic app",
      "cfx5 app",
      "app crashes",
      "password",
      "loading screen",
      "wifi",
      "network name",
      "display",
      "key strokes",
      "ac mode",
      "ibis remote",
      "ibis control panel",
      "not heating",
      "water enters",
      "harrier modes",
      "switch off",
      "low air output",
      "brisk furnace",
      "button functions",
      "error code",
      "fan compressor",
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
