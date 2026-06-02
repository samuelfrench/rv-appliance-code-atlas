import { describe, expect, it } from "vitest";
import corpus from "../data/corpus.json";
import {
  buildSearchIndex,
  getBrandCoverage,
  lookupEntries,
  summarizeCorpus,
  validateCorpus,
} from "./corpus";

const requiredBrands = [
  "Dometic",
  "Norcold",
  "Suburban/Atwood",
  "Coleman-Mach",
  "Furrion",
  "Lippert",
  "Onan",
];

describe("verified corpus", () => {
  it("rejects unsourced or unsafe appliance-code records", () => {
    const report = validateCorpus(corpus);

    expect(report.failures).toEqual([]);
    expect(report.verifiedEntries).toBeGreaterThanOrEqual(18);
    expect(report.sourceBackedEntries).toBe(report.verifiedEntries);
    expect(report.dangerousOwnerActions).toEqual([]);
  });

  it("covers every target brand with at least one verified code or symptom", () => {
    const coverage = getBrandCoverage(corpus);

    for (const brand of requiredBrands) {
      expect(coverage[brand]?.verifiedEntries ?? 0, brand).toBeGreaterThan(0);
    }
  });

  it("finds common owner searches across brand, model, code, and symptom text", () => {
    const index = buildSearchIndex(corpus);

    expect(lookupEntries(index, "norcold no fl").map((entry) => entry.code)).toContain("no FL");
    expect(lookupEntries(index, "onan 36 stopped").map((entry) => entry.code)).toContain("36");
    expect(lookupEntries(index, "furrion e3 thermostat").map((entry) => entry.code)).toContain("E3");
    expect(lookupEntries(index, "suburban reset light").map((entry) => entry.brand)).toContain("Suburban/Atwood");
  });

  it("ranks exact multi-word display codes ahead of generic partial matches", () => {
    const index = buildSearchIndex(corpus);

    expect(lookupEntries(index, "lippert onecontrol low voltage")[0]?.slug).toBe(
      "lippert-ground-control-onecontrol-5th-low-voltage",
    );
    expect(lookupEntries(index, "furrion french door e1 ov alm")[0]?.slug).toBe(
      "furrion-french-door-refrigerator-e1-ov-alm",
    );
  });

  it("normalizes hyphenless model searches for Girard GSWH-2 lookups", () => {
    const index = buildSearchIndex(corpus);

    expect(lookupEntries(index, "gswh2 e0")[0]?.slug).toBe("girard-gswh2-e0-water-outlet-temperature-probe-failure");
    expect(lookupEntries(index, "girard gswh2 low flow").slice(0, 4).map((entry) => entry.slug)).toEqual([
      "girard-gswh2-e0-water-outlet-temperature-probe-failure",
      "girard-gswh2-e3-eco-open-or-over-temperature-before-ignition",
      "girard-gswh2-e4-water-inlet-temperature-probe-failure",
      "girard-gswh2-e6-over-temperature",
    ]);
  });

  it("ranks exact Norcold N2000 LED diagnostic searches ahead of unrelated blinking-red entries", () => {
    const index = buildSearchIndex(corpus);

    expect(lookupEntries(index, "norcold n2000 red led blinking input voltage")[0]?.slug).toBe(
      "norcold-n2000-red-led-blinking-input-voltage",
    );
  });

  it("ranks legacy Norcold N-series stopped-cooling lockout searches to the matching owner-manual entry", () => {
    const index = buildSearchIndex(corpus);

    expect(lookupEntries(index, "norcold n41 n cooling unit stopped cooling")[0]?.slug).toBe(
      "norcold-n41-n51-n-cooling-unit-stopped-cooling",
    );
    expect(lookupEntries(index, "norcold n61 on gas lights flash no energy source")[0]?.slug).toBe(
      "norcold-n61-n81-on-gas-lights-flash-no-energy-source",
    );
  });

  it("ranks legacy Dometic refrigerator display-code searches to the matching owner-manual entries", () => {
    const index = buildSearchIndex(corpus);

    expect(lookupEntries(index, "dometic rmd10 e50 gas lock 3 ignition attempts")[0]?.slug).toBe(
      "dometic-rmd10-e50-gas-lock-after-three-ignition-attempts",
    );
    expect(lookupEntries(index, "dometic rm3762 e3 cooling unit malfunction")[0]?.slug).toBe(
      "dometic-rm3762-rm3962-e3-cooling-unit-malfunction",
    );
    expect(lookupEntries(index, "dometic americana check lamp failed ignite gas")[0]?.slug).toBe(
      "dometic-americana-check-lamp-lp-ignition-failure",
    );
    expect(lookupEntries(index, "dometic dm2682 check indicator flashing buzzer")[0]?.slug).toBe(
      "dometic-americana-ii-check-flashing-buzzer-lp-ignition-failure",
    );
    expect(lookupEntries(index, "dometic dma4087 display module limp mode middle position")[0]?.slug).toBe(
      "dometic-americana-ii-display-module-limp-mode",
    );
    expect(lookupEntries(index, "dometic rm8 3 8 flashing flame not ignited")[0]?.slug).toBe(
      "dometic-rm8-3-8-flashing-gas-flame-not-ignited",
    );
    expect(lookupEntries(index, "dometic rmd8555 3 8 flashing gas automatic flame not ignited")[0]?.slug).toBe(
      "dometic-rmd8-3-8-flashing-gas-automatic-flame-not-ignited",
    );
    expect(lookupEntries(index, "dometic rmd8555 2 7 flashing 230v heating element defective")[0]?.slug).toBe(
      "dometic-rmd8-2-7-flashing-230v-heating-element-defective",
    );
    expect(lookupEntries(index, "dometic rm8 ground contact gas valve internal batteries")[0]?.slug).toBe(
      "dometic-rm8-ground-contact-gas-valve-internal-batteries",
    );
    expect(lookupEntries(index, "dometic rm8 tank stop mode gas operation blocked 15 minutes")[0]?.slug).toBe(
      "dometic-rm8-tank-stop-mode-gas-operation-blocked-15-minutes",
    );
    expect(lookupEntries(index, "dometic rm10 petrol pump symbol tank stop mode")[0]?.slug).toBe(
      "dometic-rm10-petrol-pump-symbol-tank-stop-mode",
    );
  });

  it("summarizes code, source, symptom, and monetization readiness counts", () => {
    const summary = summarizeCorpus(corpus);

    expect(summary.totalSources).toBeGreaterThanOrEqual(8);
    expect(summary.totalSymptoms).toBeGreaterThanOrEqual(8);
    expect(summary.indexablePages).toBeGreaterThanOrEqual(summary.verifiedEntries + summary.totalSymptoms);
    expect(summary.disabledAdSlots).toBeGreaterThan(0);
    expect(summary.affiliatePlaceholders).toBeGreaterThan(0);
  });

  it("includes the full official Dometic RUC and RUA refrigerator fault-message sets", () => {
    const entries = corpus.entries.filter((entry) => entry.brand === "Dometic" && entry.equipmentType === "Refrigerator");
    const codesForSource = (sourceId: string) =>
      new Set(entries.filter((entry) => entry.sourceIds.includes(sourceId)).map((entry) => entry.code));

    expect(codesForSource("dometic-ruc-support")).toEqual(
      new Set(["W01", "W02", "E03", "W04", "W10", "W11", "W14", "W17", "E18", "W19", "W26", "E32", "E33", "E34", "E35"]),
    );
    expect(codesForSource("dometic-rua-support")).toEqual(
      new Set(["01", "03", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "22", "24", "50", "51", "52", "53"]),
    );
    expect(codesForSource("dometic-rm1350-operating")).toEqual(new Set(["E0", "E1", "E2", "E3", "E4"]));
  });

  it("includes the full official Dometic CCC2 thermostat LCD error-code set", () => {
    const ccc2Codes = new Set(
      corpus.entries
        .filter((entry) => entry.brand === "Dometic" && entry.sourceIds.includes("dometic-ccc2-operating"))
        .map((entry) => entry.code),
    );

    expect(ccc2Codes).toEqual(new Set(["E1", "E2", "E3", "E4", "E5", "E7", "E8", "E9"]));
  });

  it("includes official legacy Dometic RM3762/RM3962 refrigerator error-code table entries", () => {
    const codes = new Set(
      corpus.entries
        .filter((entry) => entry.brand === "Dometic" && entry.sourceIds.includes("dometic-rm3762-rm3962-operating"))
        .filter((entry) => /^E\d+$/.test(entry.code))
        .map((entry) => entry.code),
    );

    expect(codes).toEqual(new Set(["E0", "E1", "E2", "E3", "E4"]));
  });

  it("includes official legacy Dometic RM3762/RM3962 flashing LP troubleshooting display state", () => {
    const lpDisplay = corpus.entries.find(
      (entry) =>
        entry.brand === "Dometic" &&
        entry.sourceIds.includes("dometic-rm3762-rm3962-operating") &&
        entry.code === "LP",
    );

    expect(lpDisplay?.slug).toBe("dometic-rm3762-rm3962-lp-flashing-lp-ignition-failed");
    expect(lpDisplay?.plainMeaning).toContain("flashing LP message");
  });

  it("includes official Dometic RMD10T/RMD10XT warning and error fault messages", () => {
    const codes = new Set(
      corpus.entries
        .filter((entry) => entry.brand === "Dometic" && entry.sourceIds.includes("dometic-rmd10t-rmd10xt-operating"))
        .map((entry) => entry.code),
    );

    expect(codes).toEqual(
      new Set(["W01", "W05", "W06", "W10 + beep", "W11", "Beep", "E03", "E07", "E08", "E09", "E12", "E13", "E14", "E50", "E51", "E52", "E53"]),
    );
  });

  it("includes official Dometic 10-series refrigerator warning and error fault-message sets", () => {
    const codesForSource = (sourceId: string) =>
      new Set(
        corpus.entries
          .filter((entry) => entry.brand === "Dometic" && entry.sourceIds.includes(sourceId))
          .map((entry) => entry.code),
      );
    const expected = new Set(["W01", "W05", "W06", "W10 + beep", "W11", "Beep", "E03", "E07", "E08", "E09", "E12", "E13", "E14", "E50", "E51", "E52", "E53"]);

    expect(codesForSource("dometic-rm10-rms10-operating")).toEqual(expected);
    expect(codesForSource("dometic-rmd10-5-operating")).toEqual(expected);
    expect(codesForSource("dometic-rml10-4-operating")).toEqual(expected);
  });

  it("includes the official Dometic Americana display states without overclaiming a full alphanumeric code table", () => {
    const codes = new Set(
      corpus.entries
        .filter((entry) => entry.brand === "Dometic" && entry.sourceIds.includes("dometic-americana-operating"))
        .map((entry) => entry.code),
    );

    expect(codes).toEqual(
      new Set([
        "CHECK",
        "temperature sensor limp mode",
        "display module limp mode",
        "temperature-sensing circuit limp mode",
      ]),
    );
  });

  it("includes official Dometic Americana II DM/DMA display and limp-mode states", () => {
    const source = corpus.sources.find((candidate) => candidate.id === "dometic-americana-ii-operating");
    const codes = new Set(
      corpus.entries
        .filter((entry) => entry.brand === "Dometic" && entry.sourceIds.includes("dometic-americana-ii-operating"))
        .map((entry) => entry.code),
    );
    const symptom = corpus.symptoms.find((candidate) => candidate.id === "dometic-legacy-absorption-display-faults");

    expect(source?.url).toBe("https://media.dometic.com/externalassets/dometic-americana-ii-dm2682_9600007201_81829.pdf");
    expect(codes).toEqual(
      new Set([
        "CHECK flashing + buzzer",
        "temperature sensor limp mode",
        "display module limp mode",
        "temperature sensor failure limp mode",
      ]),
    );
    expect(symptom?.sourceIds).toContain("dometic-americana-ii-operating");
  });

  it("includes official Dometic RM8/RMS8/RML8/RMSL8 status-indicator fault displays", () => {
    const codes = new Set(
      corpus.entries
        .filter((entry) => entry.brand === "Dometic" && entry.sourceIds.includes("dometic-rm8-rms8-rml8-operating"))
        .map((entry) => entry.code),
    );

    expect(codes).toEqual(
      new Set([
        "2 + 8 flashing + 20 s beep",
        "4 + 8 flashing + 20 s beep",
        "3 + 8 flashing + 20 s beep",
        "15 s beep every two minutes",
        "2 + 7 flashing + 20 s beep",
        "4 + 7 flashing + 20 s beep",
        "7 flashing",
        "3 + 7 flashing + 20 s beep",
        "3 + 8 flashing brightly",
        "3 + 7 flashing brightly",
        "internal battery 15 s beep",
        "external-to-internal power switching failure",
      ]),
    );
  });

  it("includes official Dometic RMD8 status-indicator fault displays", () => {
    const codes = new Set(
      corpus.entries
        .filter((entry) => entry.brand === "Dometic" && entry.sourceIds.includes("dometic-rmd8-operating"))
        .map((entry) => entry.code),
    );

    expect(codes).toEqual(
      new Set([
        "AC plug + temperature bars flashing + 20 s beep",
        "DC battery + temperature bars flashing + 20 s beep",
        "gas flame + temperature bars flashing + 20 s beep",
        "temperature bars flashing",
        "AC plug + warning triangle flashing + 20 s beep",
        "DC battery + warning triangle flashing + 20 s beep",
        "gas flame + warning triangle flashing + 20 s beep",
        "15 s beep every two minutes",
        "battery mode low-voltage 15 s beep",
        "external-to-internal power switching failure",
      ]),
    );
  });

  it("includes official Dometic RMD8 numbered-button status indicator fault displays", () => {
    const source = corpus.sources.find((candidate) => candidate.id === "dometic-rmd8-numbered-operating");
    const codes = new Set(
      corpus.entries
        .filter((entry) => entry.brand === "Dometic" && entry.sourceIds.includes("dometic-rmd8-numbered-operating"))
        .map((entry) => entry.code),
    );

    expect(source?.url).toBe("https://www.dometic.com/externalassets/dometic-rmd-8555_9105705005_54246.pdf");
    expect(codes).toEqual(
      new Set([
        "2 + 8 flashing + 20 s beep",
        "4 + 8 flashing + 20 s beep",
        "3 + 8 flashing + 20 s beep",
        "15 s beep every two minutes",
        "2 + 7 flashing + 20 s beep",
        "4 + 7 flashing + 20 s beep",
        "7 flashing",
        "3 + 7 flashing + 20 s beep",
        "3 + 8 flashing brightly",
        "3 + 7 flashing brightly",
        "battery mode low-voltage 15 s beep",
        "external-to-internal power switching failure",
      ]),
    );
  });

  it("scopes RMD8 internal-battery operation to RMD8xx1 variants", () => {
    const internalBatteryEntryIds = [
      "dometic-rmd8-battery-mode-low-voltage-beep",
      "dometic-rmd8-external-internal-power-switching-failure",
      "dometic-rmd8-3-8-flashing-brightly-flame-not-ignited",
      "dometic-rmd8-3-7-flashing-brightly-burner-or-cooling-unit-defective",
      "dometic-rmd8-battery-mode-low-voltage-15-second-beep",
      "dometic-rmd8-numbered-external-internal-power-switching-failure",
    ];

    for (const entryId of internalBatteryEntryIds) {
      const entry = corpus.entries.find((candidate) => candidate.id === entryId);
      expect(entry?.modelFamilies).toEqual(["RMD8501", "RMD8551", "RMD8xx1"]);
    }
  });

  it("includes official Dometic RM8 and RM10 support display conditions not listed as manual table rows", () => {
    const codesForSource = (sourceId: string) =>
      new Set(
        corpus.entries
          .filter((entry) => entry.brand === "Dometic" && entry.sourceIds.includes(sourceId))
          .map((entry) => entry.code),
      );

    expect(corpus.sources.find((source) => source.id === "dometic-rm8-ground-contact-support")?.url).toBe(
      "https://support.dometic.com/en/rm8-refrigerators/Fault-Ground-contact-gas-valve-cd8f",
    );
    expect(corpus.sources.find((source) => source.id === "dometic-rm8-tank-stop-support")?.url).toBe(
      "https://support.dometic.com/en/rm8-refrigerators/Tank-stop-mode-Gas-operation-is-blocked-for-15-minutes-ad8d",
    );
    expect(corpus.sources.find((source) => source.id === "dometic-rm10-petrol-pump-tank-stop-support")?.url).toBe(
      "https://support.dometic.com/en/rm10-refrigerators/Display-showing-fault-Petrol-pump-symbol-for-tank-stop-mode-83dc",
    );

    expect(codesForSource("dometic-rm8-ground-contact-support")).toEqual(new Set(["Ground contact, gas valve"]));
    expect(codesForSource("dometic-rm8-tank-stop-support")).toEqual(new Set(["Tank stop mode: gas operation blocked 15 minutes"]));
    expect(codesForSource("dometic-rm10-petrol-pump-tank-stop-support")).toEqual(new Set(["Petrol pump symbol"]));
  });

  it("includes the full official Norcold Polar N7/N8 owner-manual fault displays", () => {
    const polarCodes = new Set(
      corpus.entries
        .filter((entry) => entry.brand === "Norcold" && entry.sourceIds.includes("norcold-polar-owner"))
        .map((entry) => entry.code),
    );

    for (const code of [
      "solid red",
      "red flash 1",
      "red flash 2",
      "red flash 3",
      "red flash 4",
      "red flash 5",
      "red flash 6",
      "red flash 7",
      "red flash 8",
      "red flash 9",
      "red flash 10",
      "snowflake flashes",
      "temperature setting flashes",
      "blank display",
      "no FL",
      "no AC",
      "AC HE",
      "AC rE",
      "Lo dc",
      "Lo dC",
      "HI dc",
      "no dt",
      "Sr",
      "oP LI",
      "FL --",
    ]) {
      expect(polarCodes, code).toContain(code);
    }
  });

  it("includes the full official Norcold 1200 owner-manual fault display set", () => {
    const codes = new Set(
      corpus.entries
        .filter((entry) => entry.brand === "Norcold" && entry.sourceIds.includes("norcold-1200-owner"))
        .map((entry) => entry.code),
    );

    expect(codes).toEqual(
      new Set(["no display", "dr", "no FL", "no AC", "AC LO", "dc LO", "no co", "temperature number flashes", "AC rE", "AC HE", "Sr"]),
    );
  });

  it("includes the full official Norcold N15DCX/N20DCX service-manual diagnostic code sets", () => {
    const codes = new Set(
      corpus.entries
        .filter((entry) => entry.brand === "Norcold" && entry.sourceIds.includes("norcold-n15-n20-service"))
        .map((entry) => entry.code),
    );

    expect(codes).toEqual(
      new Set([
        "E1",
        "E2",
        "E3",
        "E4",
        "E5",
        "E6",
        "E7",
        "E8",
        "E9",
        "power module flash 1",
        "power module flash 2",
        "power module flash 3",
        "power module flash 4",
        "power module flash 5",
        "power module flash 6",
      ]),
    );
  });

  it("cites the official Norcold N15DCX/N20DCX owner-manual error-code list for user-facing display codes", () => {
    const ownerCodes = new Set(
      corpus.entries
        .filter((entry) => entry.brand === "Norcold" && entry.sourceIds.includes("norcold-n15-n20-owner"))
        .map((entry) => entry.code),
    );

    expect(ownerCodes).toEqual(new Set(["E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8", "E9"]));
  });

  it("includes official Norcold N3000 service-mode error codes from the manufacturer troubleshooting sheet", () => {
    const codes = new Set(
      corpus.entries
        .filter((entry) => entry.brand === "Norcold" && entry.sourceIds.includes("norcold-n3000-troubleshooting"))
        .map((entry) => entry.code),
    );

    expect(codes).toEqual(new Set(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"]));
  });

  it("includes the official Norcold N3000 North America owner-manual startup display code", () => {
    const codes = new Set(
      corpus.entries
        .filter((entry) => entry.brand === "Norcold" && entry.sourceIds.includes("norcold-n3000-na-owner"))
        .map((entry) => entry.code),
    );

    expect(codes).toEqual(new Set(["18"]));
  });

  it("includes official Norcold N2000 owner-manual LED/display diagnostics", () => {
    const codes = new Set(
      corpus.entries
        .filter((entry) => entry.brand === "Norcold" && entry.sourceIds.includes("norcold-n2000-owner"))
        .map((entry) => entry.code),
    );

    expect(codes).toEqual(
      new Set([
        "Red LED on",
        "Orange LED on",
        "Red LED blinking - 2-way valve error",
        "Red LED blinking - cabinet thermistor error",
        "Red LED blinking - freezer thermistor error",
        "Red LED blinking - ambient thermistor error",
        "Red LED blinking - input voltage out of range",
        "Red LED blinking - thermal cut-out compressor",
      ]),
    );
  });

  it("includes official Norcold N8DCX/N10DCX service-manual diagnostic code sets", () => {
    const codes = new Set(
      corpus.entries
        .filter((entry) => entry.brand === "Norcold" && entry.sourceIds.includes("norcold-n8dcx-n10dcx-service"))
        .map((entry) => entry.code),
    );

    expect(codes).toEqual(
      new Set([
        "E1",
        "E2",
        "E3",
        "E4",
        "power module flash 1",
        "power module flash 2",
        "power module flash 3",
        "power module flash 4",
        "power module flash 5",
        "power module flash 6",
      ]),
    );
  });

  it("includes the official Norcold N10LX/NA10LX owner-manual fault display set", () => {
    const codes = new Set(
      corpus.entries
        .filter((entry) => entry.brand === "Norcold" && entry.sourceIds.includes("norcold-n10lx-owner"))
        .map((entry) => entry.code),
    );

    expect(codes).toEqual(
      new Set([
        "no FL",
        "no AC",
        "AC HE",
        "AC rE",
        "Lo dc",
        "Lo dC",
        "HI dc",
        "no dt",
        "Sr",
        "oP LI",
        "FL --",
        "temperature setting flashes",
        "blank display",
      ]),
    );
  });

  it("includes the official Norcold 2118 owner-manual fault display set", () => {
    const codes = new Set(
      corpus.entries
        .filter((entry) => entry.brand === "Norcold" && entry.sourceIds.includes("norcold-2118-owner"))
        .map((entry) => entry.code),
    );

    expect(codes).toEqual(
      new Set(["dr", "no FL", "no AC", "Lo dc", "Sr", "temperature setting flashes", "AC rE", "AC HE", "oP LI", "FL --"]),
    );
  });

  it("includes official legacy Norcold N41/N51 owner-manual fault display codes", () => {
    const codes = new Set(
      corpus.entries
        .filter((entry) => entry.brand === "Norcold" && entry.sourceIds.includes("norcold-n41-n51-owner"))
        .map((entry) => entry.code),
    );

    expect(codes).toEqual(
      new Set(["no display", "F", "A", "C", "n", "temperature setting flashes", "H", "r", "S"]),
    );
  });

  it("includes official legacy Norcold N510 owner-manual fault display codes from the N400/N510 manual", () => {
    const codes = new Set(
      corpus.entries
        .filter((entry) => entry.brand === "Norcold" && entry.sourceIds.includes("norcold-n400-n510-owner"))
        .map((entry) => entry.code),
    );

    expect(codes).toEqual(
      new Set(["no display", "F", "A", "C", "n", "temperature setting flashes", "H", "r", "S"]),
    );
  });

  it("includes official legacy Norcold N61/N81 owner-manual light-status fault codes", () => {
    const codes = new Set(
      corpus.entries
        .filter((entry) => entry.brand === "Norcold" && entry.sourceIds.includes("norcold-n61-n81-owner"))
        .map((entry) => entry.code),
    );

    expect(codes).toEqual(
      new Set([
        "ON light off",
        "ON and GAS lights flash",
        "ON on GAS flashes",
        "ON flashes off 1 time",
        "ON flashes off 3 times with GAS on",
        "ON flashes off 4 times",
      ]),
    );
  });

  it("includes official legacy Norcold N62/N64/N82/N84 owner-manual fault display codes by control family", () => {
    const codes = new Set(
      corpus.entries
        .filter((entry) => entry.brand === "Norcold" && entry.sourceIds.includes("norcold-n62-n64-n82-n84-owner"))
        .map((entry) => entry.code),
    );

    expect(codes).toEqual(
      new Set([
        "no display",
        "d",
        "F",
        "A",
        "C",
        "temperature number flashes",
        "H",
        "r",
        "S",
        "dr",
        "no FL",
        "no AC",
        "dc LO",
        "AC rE",
        "dc rE",
        "AC HE",
        "dc HE",
        "Sr",
      ]),
    );
  });

  it("includes official legacy Norcold N1095 owner-manual fault display codes", () => {
    const codes = new Set(
      corpus.entries
        .filter((entry) => entry.brand === "Norcold" && entry.sourceIds.includes("norcold-n1095-owner"))
        .map((entry) => entry.code),
    );

    expect(codes).toEqual(
      new Set([
        "no display",
        "dr",
        "no FL",
        "no AC",
        "dc LO",
        "temperature number flashes",
        "AC rE",
        "dc rE",
        "AC HE",
        "dc HE",
        "Sr",
      ]),
    );
  });

  it("includes the full official Cummins Onan QG operator-manual fault-code sets", () => {
    const codesForSource = (sourceId: string) =>
      new Set(
        corpus.entries
          .filter((entry) => entry.brand === "Onan" && entry.sourceIds.includes(sourceId))
          .map((entry) => entry.code),
      );

    expect(codesForSource("onan-hgjbb-a031c171")).toEqual(
      new Set(["2", "3", "4", "12", "13", "14", "15", "27", "29", "31", "32", "35", "36", "37", "38", "41", "42", "43", "45", "47", "48"]),
    );
    expect(codesForSource("onan-hgjaa-a035d009")).toEqual(
      new Set([
        "2",
        "3",
        "4",
        "12",
        "13",
        "14",
        "15",
        "19",
        "22",
        "27",
        "29",
        "31",
        "32",
        "35",
        "36",
        "37",
        "38",
        "41",
        "42",
        "43",
        "45",
        "47",
        "48",
        "51",
        "52",
        "54",
        "56",
        "57",
        "58",
        "81",
        "82",
      ]),
    );
    expect(codesForSource("onan-hgjbb-a031c171")).not.toContain("33");
    expect(codesForSource("onan-hgjaa-a035d009")).not.toContain("34");
  });

  it("includes official Cummins Onan Quiet Diesel display-message and fault-code sets", () => {
    const codesForSource = (sourceId: string) =>
      new Set(
        corpus.entries
          .filter((entry) => entry.brand === "Onan" && entry.sourceIds.includes(sourceId))
          .map((entry) => entry.code),
      );
    const qd3200Messages = new Set([
      "GEN OFF",
      "GEN ON",
      "GEN START",
      "GEN CAL",
      "RESTART GEN?",
      "GEN WAIT",
      "LOW BATTERY",
      "OIL CHANGE/CHECK OIL LEVEL",
      "SHORT CIRCUIT",
      "OIL TEMP-PRESS",
      "GENERATOR ALERT",
      "OVER TEMPERATURE (INVERTER)",
      "OVERLOAD",
      "LOW ENGINE POWER",
    ]);
    const qdLargeCodes = new Set(["1", "2", "3", "4", "12", "13", "14", "15", "19", "22", "27", "29", "32", "35", "36", "38", "41", "42", "43", "45", "48", "57"]);

    expect(codesForSource("onan-qd-3200-0983-0103")).toEqual(qd3200Messages);
    expect(codesForSource("onan-qd-3200-a066t111")).toEqual(qd3200Messages);
    expect(codesForSource("onan-qd-5000-0981-0166")).toEqual(new Set(["1", "2", "3", "4", "12", "13", "14", "15", "19", "22", "24", "27", "29", "32", "35", "36", "38", "41", "42", "43", "45", "57"]));
    expect(codesForSource("onan-qd-6000-a046l053")).toEqual(qdLargeCodes);
    expect(codesForSource("onan-qd-10000-a043d713")).toEqual(qdLargeCodes);
  });

  it("includes the official Cummins Onan QG 4000, QG inverter, and QG 7000i DF fault-code sets", () => {
    const codesForSource = (sourceId: string) =>
      new Set(
        corpus.entries
          .filter((entry) => entry.brand === "Onan" && entry.sourceIds.includes(sourceId))
          .map((entry) => entry.code),
      );
    const qg4000Codes = new Set(["3", "4", "12", "13", "14", "15", "27", "29", "32", "35", "36", "37", "38", "41", "42", "43", "45", "47", "48"]);
    const qgInverterCodes = new Set([
      "1",
      "4",
      "6",
      "12",
      "13",
      "14",
      "15",
      "19",
      "25",
      "26",
      "27",
      "29",
      "31",
      "32",
      "34",
      "35",
      "36",
      "38",
      "43",
      "45",
      "49",
      "52",
      "53",
      "54",
      "56",
      "67",
      "74",
      "81",
      "82",
    ]);
    const qg7000iCodes = new Set([
      "1",
      "4",
      "6",
      "12",
      "13",
      "14",
      "15",
      "19",
      "25",
      "26",
      "27",
      "29",
      "31",
      "34",
      "36",
      "38",
      "43",
      "45",
      "52",
      "53",
      "54",
      "57",
      "73",
      "81",
      "85",
    ]);

    expect(codesForSource("onan-qg-4000-0981-0159")).toEqual(qg4000Codes);
    expect(codesForSource("onan-qg-4000-a041d131")).toEqual(qg4000Codes);
    expect(codesForSource("onan-qg-2800i-a062y985")).toEqual(qgInverterCodes);
    expect(codesForSource("onan-qg-2800i-a075s349")).toEqual(qgInverterCodes);
    expect(codesForSource("onan-qg-7000i-a079e225")).toEqual(qg7000iCodes);
    expect(codesForSource("onan-qg-7000i-a079e225")).not.toContain("32");
    expect(codesForSource("onan-qg-7000i-a079e225")).not.toContain("82");
  });

  it("includes official Cummins Onan legacy QG KYD and KV blink-code sets", () => {
    const codesForSource = (sourceId: string) =>
      new Set(
        corpus.entries
          .filter((entry) => entry.brand === "Onan" && entry.sourceIds.includes(sourceId))
          .map((entry) => entry.code),
      );
    const qgKydCodes = new Set(["3", "4", "12", "13", "14", "15", "27", "29", "32", "35", "36", "37", "38", "41", "42", "43", "45", "47", "48"]);

    expect(codesForSource("onan-qg-4000-kyd-0981-0169")).toEqual(qgKydCodes);
    expect(codesForSource("onan-qg-4000-kyd-0981-0169")).not.toContain("33");
    expect(codesForSource("onan-qg-4000-kyd-0981-0169")).not.toContain("44");
    expect(codesForSource("onan-qg-2800-kv-0981-0153")).toEqual(new Set(["1", "2", "3", "4"]));
  });

  it("includes the official Cummins Onan legacy HGJAA/HGJAB/HGJAC fault-code set", () => {
    const codesForSource = (sourceId: string) =>
      new Set(
        corpus.entries
          .filter((entry) => entry.brand === "Onan" && entry.sourceIds.includes(sourceId))
          .map((entry) => entry.code),
      );

    expect(codesForSource("onan-hgjaa-hgjab-0983-0101")).toEqual(
      new Set([
        "2",
        "3",
        "4",
        "12",
        "13",
        "14",
        "15",
        "19",
        "22",
        "23",
        "27",
        "29",
        "31",
        "32",
        "35",
        "36",
        "37",
        "38",
        "41",
        "42",
        "43",
        "45",
        "47",
        "48",
        "51",
        "52",
        "54",
        "56",
        "57",
        "58",
        "81",
        "82",
      ]),
    );
  });

  it("includes the full official Lippert Ground Control LCD and In-Wall Slide-out LED error sets", () => {
    const lippertCodesForSource = (sourceId: string) =>
      new Set(
        corpus.entries
          .filter((entry) => entry.brand === "Lippert" && entry.sourceIds.includes(sourceId))
          .map((entry) => entry.code),
      );

    expect(lippertCodesForSource("lippert-ground-control")).toEqual(
      new Set([
        "Excess Angle",
        "Excessive Angle",
        "Feature Disabled",
        "Low Voltage",
        "Out Of Stroke",
        "External Sensor",
        "Jack Time Out",
        "Auto Level Fail",
        "Comm Error",
        "Bad Calibration",
        "Internal Sensor",
        "Function Aborted",
        "Hall Effect Short",
        "LF Jack",
        "RF Jack",
        "LM Jack",
        "RM Jack",
        "LR Jack",
        "RR Jack",
      ]),
    );
    expect(lippertCodesForSource("lippert-in-wall-slide")).toEqual(new Set(["Red LED 2", "Red LED 3", "Red LED 4", "Red LED 5", "Red LED 6", "Red LED 8", "Red LED 9"]));
  });

  it("includes the official Lippert Ground Control OneControl owner-manual error sets", () => {
    const lippertCodesForSource = (sourceId: string) =>
      new Set(
        corpus.entries
          .filter((entry) => entry.brand === "Lippert" && entry.sourceIds.includes(sourceId))
          .map((entry) => entry.code),
      );

    expect(lippertCodesForSource("lippert-ground-control-onecontrol-5th")).toEqual(
      new Set([
        "Solid Red",
        "Blinking Red",
        "Slowly Blinking Faded Red",
        "EXCESS ANGLE",
        "EXCESSIVE ANGLE",
        "BAD CALIBRATION",
        "FEATURE DISABLED",
        "LOW VOLTAGE",
        "OUT OF STROKE",
        "EXTERNAL SENSOR",
        "JACK TIME OUT",
        "AUTO LEVEL FAIL",
        "FUNCTION ABORTED",
        "HALL POWER SHORT",
        "***ERROR***",
        "Left-Front Jack Fault",
        "Right-Front Jack Fault",
        "Left-Mid Jack Fault",
        "Right-Mid Jack Fault",
        "Left-Rear Jack Fault",
        "Right-Rear Jack Fault",
      ]),
    );
    expect(lippertCodesForSource("lippert-ground-control-tt-onecontrol")).toEqual(
      new Set([
        "Solid Red",
        "Blinking Red",
        "EXCESS ANGLE",
        "EXCESSIVE ANGLE",
        "BAD CALIBRATION",
        "FEATURE DISABLED",
        "LOW VOLTAGE",
        "OUT OF STROKE",
        "EXTERNAL SENSOR",
        "JACK TIME OUT",
        "AUTO LEVEL FAILURE",
        "FUNCTION ABORTED",
        "HALL POWER SHORT",
        "CAN'T COMPLETE LEVEL IN THIS LOCATION. PLEASE RELOCATE RV TO FLATTER TERRAIN",
        "***ERROR***",
        "Left-Front Jack Fault",
        "Right-Front Jack Fault",
        "Left-Rear Jack Fault",
        "Right-Rear Jack Fault",
        "Tongue Jack Fault",
      ]),
    );
  });

  it("includes the full official Furrion thermostat, rooftop AC, water-heater, and refrigerator diagnostic sets", () => {
    const furrionCodesForSource = (sourceId: string) =>
      new Set(
        corpus.entries
          .filter((entry) => entry.brand === "Furrion" && entry.sourceIds.includes(sourceId))
          .map((entry) => entry.code),
      );

    expect(furrionCodesForSource("furrion-thermostat")).toEqual(new Set(["E1", "E2", "E3", "E4", "E5", "E6", "lo"]));
    expect(furrionCodesForSource("furrion-rooftop-ac")).toEqual(new Set(["E1", "E2", "E3", "E4", "E5", "lo"]));
    expect(furrionCodesForSource("furrion-water-heater")).toEqual(new Set(["E0", "E1", "E2", "E3", "E4", "E5", "E6", "E7"]));
    expect(furrionCodesForSource("furrion-arctic-refrigerator")).toEqual(
      new Set(["diagnostic LED flash 1", "diagnostic LED flash 2", "diagnostic LED flash 3", "diagnostic LED flash 4", "diagnostic LED flash 5", "diagnostic LED flash 6"]),
    );
  });

  it("includes additional official Furrion refrigerator and Chill Cube thermostat display-code sets", () => {
    const furrionCodesForSource = (sourceId: string) =>
      new Set(
        corpus.entries
          .filter((entry) => entry.brand === "Furrion" && entry.sourceIds.includes(sourceId))
          .map((entry) => entry.code),
      );

    expect(furrionCodesForSource("furrion-chill-cube-thermostat")).toEqual(new Set(["E3", "E6", "lo"]));
    expect(furrionCodesForSource("furrion-french-door-refrigerator")).toEqual(new Set(["E0", "E1 OV ALM", "E1 UV ALM", "E2", "E3", "E4", "E5", "E6", "EC", "EF"]));
    expect(furrionCodesForSource("furrion-10-6-refrigerator")).toEqual(new Set(["E1", "E2", "E3", "E4", "E5", "E12", "E13", "E14", "EL", "EH"]));
    expect(furrionCodesForSource("furrion-15-refrigerator")).toEqual(new Set(["UC", "RS", "CS", "FS", "Fd", "FF", "ES"]));
  });

  it("keeps Coleman-Mach display conditions tied to the exact official manual wording", () => {
    const colemanCodesForSource = (sourceId: string) =>
      corpus.entries.filter((entry) => entry.brand === "Coleman-Mach" && entry.sourceIds.includes(sourceId));

    const c9330 = colemanCodesForSource("coleman-9330-thermostat");
    const c9420 = colemanCodesForSource("coleman-9420-thermostat");

    expect(new Set(c9330.map((entry) => entry.code))).toEqual(new Set(["Er"]));
    expect(c9330[0]?.plainMeaning).toMatch(/outside display range|remote temperature sensor/i);
    expect(new Set(c9420.map((entry) => entry.code))).toEqual(new Set(["LO", "HI"]));
  });

  it("adds official-source symptom pages for Furrion HVAC, Furrion furnace, and Coleman/Airxcel thermostat conditions", () => {
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));

    expect(symptomById.get("air-conditioner-not-cooling")?.sourceIds).toEqual(
      expect.arrayContaining(["furrion-rooftop-hvac-troubleshooting", "furrion-rooftop-ac-manual-control"]),
    );
    expect(symptomById.get("air-conditioner-water-leak")?.sourceIds).toContain("furrion-rooftop-hvac-troubleshooting");
    expect(symptomById.get("furnace-stops-before-setpoint")?.sourceIds).toContain("furrion-furnace-troubleshooting");
    expect(symptomById.get("furnace-lockout")?.sourceIds).toContain("furrion-furnace-troubleshooting");
    expect(symptomById.get("thermostat-delay-or-no-response")?.sourceIds).toEqual(
      expect.arrayContaining([
        "coleman-9330-thermostat",
        "coleman-9420-thermostat",
        "coleman-9430-thermostat",
        "coleman-comfortguard-service",
        "coleman-6633-service",
      ]),
    );
    expect(symptomById.get("thermostat-gas-assist")?.sourceIds).toEqual(
      expect.arrayContaining(["coleman-9330-thermostat", "coleman-9420-thermostat"]),
    );
  });

  it("includes official Dometic DF and Hydro Flame furnace LED diagnostic tables", () => {
    const furnaceCodesForSource = (sourceId: string) =>
      new Set(
        corpus.entries
          .filter((entry) => entry.brand === "Dometic" && entry.equipmentType === "Furnace" && entry.sourceIds.includes(sourceId))
          .map((entry) => entry.code),
      );

    expect(furnaceCodesForSource("dometic-df-furnace")).toEqual(new Set(["steady on", "1 flash", "2 flashes", "3 flashes", "4 flashes", "5 flashes"]));
    expect(furnaceCodesForSource("dometic-hydro-flame-afm-66618")).toEqual(new Set(["steady on", "1 flash", "2 flashes", "3 flashes"]));
  });

  it("adds official Dometic/Atwood water-heater and OD-5001 symptom pages without inventing code entries", () => {
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const symptomOnlySourceIds = [
      "dometic-water-heater-combo-function-support",
      "dometic-water-heater-gas-function-support",
      "dometic-water-heater-overheat-reset-support",
      "dometic-od5001-operating-support",
      "dometic-od5001-no-power-vent-support",
      "dometic-od5001-no-ignition-support",
      "dometic-od5001-rapid-cycle-support",
      "dometic-od5001-temperature-fluctuation-support",
    ];

    expect(symptomById.get("water-heater-lockout-light")?.sourceIds).toEqual(
      expect.arrayContaining(["dometic-water-heater-combo-function-support", "dometic-water-heater-gas-function-support", "dometic-water-heater-wh"]),
    );
    expect(symptomById.get("water-heater-overheat-lockout")?.sourceIds).toEqual(
      expect.arrayContaining(["dometic-water-heater-overheat-reset-support", "dometic-water-heater-wh"]),
    );
    expect(symptomById.get("od5001-startup-and-lockout")?.sourceIds).toEqual(
      expect.arrayContaining(["dometic-od5001-operating-support", "dometic-od5001-no-ignition-support"]),
    );
    expect(symptomById.get("od5001-power-vent-not-running")?.sourceIds).toContain("dometic-od5001-no-power-vent-support");
    expect(symptomById.get("od5001-rapid-cycling")?.sourceIds).toContain("dometic-od5001-rapid-cycle-support");
    expect(symptomById.get("od5001-temperature-fluctuation")?.sourceIds).toContain("dometic-od5001-temperature-fluctuation-support");
    expect(corpus.sources.filter((source) => symptomOnlySourceIds.includes(source.id))).toHaveLength(symptomOnlySourceIds.length);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => symptomOnlySourceIds.includes(sourceId)))).toHaveLength(0);

    const existingDometicAtwoodWaterHeaterEntryIds = new Set([
      "dometic-water-heater-lockout",
      "suburban-water-heater-reset-light",
    ]);
    const dometicAtwoodWaterHeaterEntries = corpus.entries.filter(
      (entry) => ["Dometic", "Suburban/Atwood"].includes(entry.brand) && /water heater/i.test(entry.equipmentType),
    );

    expect(new Set(dometicAtwoodWaterHeaterEntries.map((entry) => entry.id))).toEqual(existingDometicAtwoodWaterHeaterEntryIds);
  });

  it("adds the next official water-heater symptom sources and only verified Furrion F2GWH display entries", () => {
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const symptomOnlySourceIds = [
      "dometic-xt-water-heater-manual",
      "dometic-water-heater-gas-overheat-support",
      "dometic-water-heater-odor-support",
      "dometic-water-heater-gas-smell-support",
      "dometic-water-heater-maintenance-support",
      "suburban-tankless-water-heater",
      "suburban-st42-st60-water-heater",
      "furrion-water-heater-user-manual",
      "furrion-water-heater-freeze-damage",
    ];

    expect(corpus.sources.filter((source) => symptomOnlySourceIds.includes(source.id))).toHaveLength(symptomOnlySourceIds.length);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => symptomOnlySourceIds.includes(sourceId)))).toHaveLength(0);

    expect(symptomById.get("dometic-xt-low-flow-cold-flow")?.sourceIds).toEqual(
      expect.arrayContaining(["dometic-xt-water-heater-manual", "dometic-water-heater-wh"]),
    );
    expect(symptomById.get("dometic-water-heater-gas-smell")?.sourceIds).toContain("dometic-water-heater-gas-smell-support");
    expect(symptomById.get("dometic-water-heater-rotten-egg-odor")?.sourceIds).toEqual(
      expect.arrayContaining(["dometic-water-heater-odor-support", "dometic-xt-water-heater-manual"]),
    );
    expect(symptomById.get("dometic-water-heater-soot-delayed-ignition")?.sourceIds).toContain(
      "dometic-water-heater-maintenance-support",
    );
    expect(symptomById.get("suburban-tankless-lockout")?.sourceIds).toEqual(
      expect.arrayContaining(["suburban-tankless-water-heater", "suburban-st42-st60-water-heater"]),
    );
    expect(symptomById.get("suburban-tankless-low-flow-temperature")?.sourceIds).toEqual(
      expect.arrayContaining(["suburban-tankless-water-heater", "suburban-st42-st60-water-heater"]),
    );
    expect(symptomById.get("suburban-tankless-recirculation-delay")?.sourceIds).toContain("suburban-tankless-water-heater");
    expect(symptomById.get("furrion-tankless-low-flow-temperature")?.sourceIds).toEqual(
      expect.arrayContaining(["furrion-water-heater", "furrion-water-heater-user-manual"]),
    );
    expect(symptomById.get("furrion-water-heater-pressure-relief-discharge")?.sourceIds).toEqual(
      expect.arrayContaining(["furrion-water-heater", "furrion-water-heater-user-manual"]),
    );
    expect(symptomById.get("furrion-water-heater-freeze-state")?.sourceIds).toEqual(
      expect.arrayContaining(["furrion-f2gwh-water-heater", "furrion-water-heater-freeze-damage"]),
    );

    const furrionF2gwhCodes = new Set(
      corpus.entries
        .filter((entry) => entry.brand === "Furrion" && entry.sourceIds.includes("furrion-f2gwh-water-heater"))
        .map((entry) => entry.code),
    );

    expect(furrionF2gwhCodes).toEqual(new Set(["E0", "E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8", "E9", "En", "Fd"]));

    const furrionEn = corpus.entries.find((entry) => entry.id === "furrion-f2gwh-en");
    const furrionFd = corpus.entries.find((entry) => entry.id === "furrion-f2gwh-fd");

    expect(furrionEn?.symptomIds).not.toContain("furrion-water-heater-freeze-state");
    expect(furrionFd?.symptomIds).toContain("furrion-water-heater-freeze-state");
  });

  it("adds OD-5001 low-flow temperature pages and Furrion tankless video sources without new code entries", () => {
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const newSymptomOnlySourceIds = [
      "dometic-od5001-low-heat-rise-excessive-flow-support",
      "dometic-od5001-burner-ignites-temperature-too-low-support",
      "dometic-od5001-no-temperature-control-support",
      "dometic-od5001-water-temperature-too-hot-support",
      "dometic-od5001-water-temperature-too-low-low-flow-support",
      "dometic-od5001-navy-showers-support",
      "dometic-od5001-winterize-support",
      "dometic-od5001-gas-smell-support",
      "furrion-tankless-operate-care-video",
      "furrion-tankless-basic-troubleshooting-video",
      "furrion-tankless-water-filter-video",
      "furrion-tankless-descale-video",
      "furrion-tankless-winterization-video",
      "lippert-qr216-low-flow-water-pressure",
    ];

    expect(corpus.sources.filter((source) => newSymptomOnlySourceIds.includes(source.id))).toHaveLength(
      newSymptomOnlySourceIds.length,
    );
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSymptomOnlySourceIds.includes(sourceId)))).toHaveLength(0);

    expect(symptomById.get("od5001-cold-water-bleed-excessive-trigger-flow")?.sourceIds).toEqual(
      expect.arrayContaining([
        "dometic-od5001-low-heat-rise-excessive-flow-support",
        "dometic-od5001-navy-showers-support",
      ]),
    );
    expect(symptomById.get("od5001-summer-winter-temperature-control")?.sourceIds).toEqual(
      expect.arrayContaining([
        "dometic-od5001-no-temperature-control-support",
        "dometic-od5001-water-temperature-too-hot-support",
        "dometic-od5001-water-temperature-too-low-low-flow-support",
      ]),
    );
    expect(symptomById.get("od5001-burner-ignites-temperature-too-low")?.sourceIds).toContain(
      "dometic-od5001-burner-ignites-temperature-too-low-support",
    );
    expect(symptomById.get("od5001-showerhead-pause-cold-water-purge")?.sourceIds).toContain(
      "dometic-od5001-navy-showers-support",
    );
    expect(symptomById.get("od5001-winterizing-freeze-risk")?.sourceIds).toContain("dometic-od5001-winterize-support");
    expect(symptomById.get("od5001-gas-smell")?.sourceIds).toContain("dometic-od5001-gas-smell-support");

    expect(symptomById.get("furrion-tankless-low-flow-temperature")?.sourceIds).toEqual(
      expect.arrayContaining([
        "furrion-tankless-operate-care-video",
        "furrion-tankless-basic-troubleshooting-video",
        "furrion-tankless-water-filter-video",
        "furrion-tankless-descale-video",
        "lippert-qr216-low-flow-water-pressure",
      ]),
    );
    expect(
      corpus.symptoms
        .filter((symptom) => symptom.sourceIds.includes("lippert-qr216-low-flow-water-pressure"))
        .map((symptom) => symptom.id),
    ).toEqual(["furrion-tankless-low-flow-temperature"]);
    expect(symptomById.get("furrion-water-heater-freeze-state")?.sourceIds).toContain(
      "furrion-tankless-winterization-video",
    );
    expect(symptomById.get("furrion-tankless-filter-descale-maintenance")?.sourceIds).toEqual(
      expect.arrayContaining([
        "furrion-tankless-operate-care-video",
        "furrion-tankless-water-filter-video",
        "furrion-tankless-descale-video",
        "furrion-f2gwh-water-heater",
      ]),
    );
  });

  it("adds official Dometic tank/OD-5001 support and Furrion tankless source triage without unsafe DIY steps", () => {
    const sourceById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const newDometicSymptomOnlySourceIds = [
      "dometic-water-heater-combo-winterize-flush-support",
      "dometic-water-heater-gas-winterize-flush-support",
      "dometic-water-heater-combo-air-gap-support",
      "dometic-water-heater-gas-air-gap-support",
      "dometic-water-heater-combo-anode-rod-warning-support",
      "dometic-water-heater-gas-anode-rod-warning-support",
      "dometic-water-heater-gas-odor-support",
      "dometic-water-heater-gas-i-smell-gas-support",
      "dometic-od5001-no-water-flow-support",
    ];
    const newFurrionModelOnlySourceIds = ["furrion-fwh09a-spec-sheet", "furrion-fwh09afa-ab-flangeless-spec"];
    const newSourceIds = [
      "dometic-water-heater-wh-2022-manual",
      ...newDometicSymptomOnlySourceIds,
      "furrion-tankless-e5-ti514",
      ...newFurrionModelOnlySourceIds,
    ];

    for (const sourceId of newSourceIds) {
      expect(sourceById.get(sourceId)?.official, sourceId).toBe(true);
    }

    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newDometicSymptomOnlySourceIds.includes(sourceId)))).toHaveLength(0);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newFurrionModelOnlySourceIds.includes(sourceId)))).toHaveLength(0);

    expect(symptomById.get("dometic-water-heater-winterizing-flush")?.sourceIds).toEqual(
      expect.arrayContaining([
        "dometic-water-heater-wh-2022-manual",
        "dometic-water-heater-combo-winterize-flush-support",
        "dometic-water-heater-gas-winterize-flush-support",
      ]),
    );
    expect(symptomById.get("dometic-water-heater-winterizing-flush")?.safeChecklist.join(" ")).toMatch(/cool/i);

    expect(symptomById.get("dometic-water-heater-pt-relief-drip-air-gap")?.sourceIds).toEqual(
      expect.arrayContaining([
        "dometic-water-heater-wh-2022-manual",
        "dometic-water-heater-combo-air-gap-support",
        "dometic-water-heater-gas-air-gap-support",
      ]),
    );
    expect(symptomById.get("dometic-water-heater-pt-relief-drip-air-gap")?.safeChecklist.join(" ")).not.toMatch(
      /expansion tank|replace.*P\/T|install.*pressure/i,
    );

    expect(symptomById.get("od5001-no-water-flow-at-tap")?.sourceIds).toEqual(["dometic-od5001-no-water-flow-support"]);
    expect(symptomById.get("od5001-no-water-flow-at-tap")?.safeChecklist.join(" ")).toMatch(/qualified service/i);

    expect(symptomById.get("dometic-water-heater-rotten-egg-odor")?.sourceIds).toEqual(
      expect.arrayContaining([
        "dometic-water-heater-combo-anode-rod-warning-support",
        "dometic-water-heater-gas-anode-rod-warning-support",
        "dometic-water-heater-gas-odor-support",
      ]),
    );
    expect(symptomById.get("dometic-water-heater-gas-smell")?.sourceIds).toContain(
      "dometic-water-heater-gas-i-smell-gas-support",
    );

    const dometicTankLockout = corpus.entries.find((entry) => entry.id === "dometic-water-heater-lockout");
    expect(dometicTankLockout?.sourceIds).toContain("dometic-water-heater-wh-2022-manual");
    expect(dometicTankLockout?.modelFamilies).toEqual(expect.arrayContaining(["WH-10GEA", "WH-16GEA"]));

    const furrionE5 = corpus.entries.find((entry) => entry.id === "furrion-water-heater-e5");
    expect(furrionE5?.sourceIds).toEqual(expect.arrayContaining(["furrion-water-heater", "furrion-tankless-e5-ti514"]));
    expect(furrionE5?.plainMeaning).toMatch(/blower motor|air pressure switch/i);
    expect(furrionE5?.ownerSafeActions.join(" ")).toMatch(/exterior.*vent|model.*serial.*date code/i);
    expect(furrionE5?.ownerSafeActions.join(" ")).not.toMatch(/connector|pressure switch|flex tube|compressed air|venturi/i);
    expect(furrionE5?.serviceOnlyActions.join(" ")).toMatch(/connector|pressure switch|flex tube|Venturi/i);

    expect(corpus.entries.find((entry) => entry.id === "furrion-f2gwh-e5")?.sourceIds).not.toContain(
      "furrion-tankless-e5-ti514",
    );
    expect(symptomById.get("airflow-or-venting")?.sourceIds).toContain("furrion-tankless-e5-ti514");
    expect(symptomById.get("furrion-tankless-low-flow-temperature")?.sourceIds).toEqual(
      expect.arrayContaining(["furrion-fwh09a-spec-sheet", "furrion-fwh09afa-ab-flangeless-spec"]),
    );
    expect(symptomById.get("furrion-water-heater-freeze-state")?.sourceIds).toContain("furrion-fwh09afa-ab-flangeless-spec");
  });

  it("adds the official Suburban induction cooktop E0-E7 display-code table with owner-safe boundaries", () => {
    const source = corpus.sources.find((item) => item.id === "suburban-induction-cooktop-guide");
    expect(source?.official).toBe(true);
    expect(source?.url).toBe(
      "https://library.suburbanrv.com/wp-content/uploads/2023/04/206250_Suburban_Induction_Cooktop_RevNew_03-01-2023.pdf",
    );

    const entries = corpus.entries.filter((entry) => entry.sourceIds.includes("suburban-induction-cooktop-guide"));
    expect(new Set(entries.map((entry) => entry.code))).toEqual(new Set(["E0", "E1", "E2", "E3", "E4", "E5", "E6", "E7"]));
    expect(entries).toHaveLength(8);

    const byCode = new Map(entries.map((entry) => [entry.code, entry]));
    expect(byCode.get("E0")?.plainMeaning).toMatch(/cookware/i);
    expect(byCode.get("E1")?.plainMeaning).toMatch(/voltage.*low/i);
    expect(byCode.get("E2")?.plainMeaning).toMatch(/voltage.*high/i);
    expect(byCode.get("E3")?.plainMeaning).toMatch(/surface.*hot/i);
    expect(byCode.get("E4")?.plainMeaning).toMatch(/surface temperature sensor/i);
    expect(byCode.get("E5")?.plainMeaning).toMatch(/internal circuit.*hot/i);
    expect(byCode.get("E6")?.plainMeaning).toMatch(/surface temperature sensor/i);
    expect(byCode.get("E7")?.plainMeaning).toMatch(/internal circuit error/i);

    for (const entry of entries) {
      expect(entry.brand).toBe("Suburban/Atwood");
      expect(entry.equipmentType).toBe("Induction cooktop");
      expect(entry.modelFamilies).toEqual(
        expect.arrayContaining(["Suburban single element induction cooktop", "Suburban double element induction cooktop"]),
      );
      expect(entry.ownerSafeActions.join(" ")).not.toMatch(/open|modify|disassemble|repair|voltage meter|breaker|wiring/i);
      expect(entry.serviceOnlyActions.join(" ")).toMatch(/open|modify|disassemble|repair|electrical/i);
      expect(entry.safetyBoundary).toMatch(/do not open/i);
      expect(entry.partCaptureHints).toEqual(expect.arrayContaining(["model number", "serial number", "stock number"]));
    }

    expect(byCode.get("E0")?.symptomIds).toContain("suburban-induction-cookware-or-no-pan");
    expect(byCode.get("E1")?.symptomIds).toContain("suburban-induction-voltage-error");
    expect(byCode.get("E2")?.symptomIds).toContain("suburban-induction-voltage-error");
    expect(byCode.get("E3")?.symptomIds).toContain("suburban-induction-overheat");
    expect(byCode.get("E5")?.symptomIds).toContain("suburban-induction-overheat");
    expect(byCode.get("E4")?.symptomIds).toContain("suburban-induction-internal-error");
    expect(byCode.get("E6")?.symptomIds).toContain("suburban-induction-internal-error");
    expect(byCode.get("E7")?.symptomIds).toContain("suburban-induction-internal-error");

    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    for (const symptomId of [
      "suburban-induction-cookware-or-no-pan",
      "suburban-induction-voltage-error",
      "suburban-induction-overheat",
      "suburban-induction-internal-error",
    ]) {
      const symptom = symptomById.get(symptomId);
      expect(symptom?.sourceIds).toEqual(["suburban-induction-cooktop-guide"]);
      expect(symptom?.safeChecklist.join(" ")).not.toMatch(/open|modify|disassemble|repair|voltage meter|breaker|wiring/i);
    }
  });

  it("adds official Coleman-Mach heat-pump lockout and 9420-330 status LED displays with owner-safe boundaries", () => {
    const expectedSources = new Map([
      [
        "coleman-9420-330-multizone-controller",
        "https://library.coleman-mach.com/wp-content/uploads/2024/06/Coleman-9420-330.pdf",
      ],
      ["coleman-bluetooth-9630-352-heat-pump", "https://coleman-mach.com/files/bluetooth/liaf253.pdf"],
      ["coleman-bluetooth-9630-351-353-heat-pump", "https://coleman-mach.com/files/bluetooth/liaf254.pdf"],
      [
        "coleman-6535-335-heat-pump-thermostat",
        "https://library.coleman-mach.com/wp-content/uploads/2023/04/1976A331.pdf",
      ],
      [
        "coleman-6536-335-heat-pump-thermostat",
        "https://library.coleman-mach.com/wp-content/uploads/2023/04/1976-340.pdf",
      ],
      ["coleman-heat-pump-thermostat-lockout-function", "https://coleman-mach.com/files/t_stat_electric_heat_function.pdf"],
    ]);

    for (const [sourceId, url] of expectedSources) {
      const source = corpus.sources.find((item) => item.id === sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    const heatPumpEntryIds = [
      "coleman-9630-bluetooth-elec-flashing",
      "coleman-6535-335-diff-flashing",
      "coleman-6536-335-diff",
      "coleman-heat-pump-thermostat-diff",
      "coleman-heat-pump-thermostat-flashing-gas-heat",
    ];
    const heatPumpEntries = heatPumpEntryIds.map((id) => corpus.entries.find((entry) => entry.id === id));
    const heatPumpById = new Map(heatPumpEntries.map((entry) => [entry?.id, entry]));

    expect(heatPumpById.get("coleman-9630-bluetooth-elec-flashing")?.code).toBe("ELEC flashing");
    expect(heatPumpById.get("coleman-9630-bluetooth-elec-flashing")?.sourceIds).toEqual(
      expect.arrayContaining(["coleman-bluetooth-9630-352-heat-pump", "coleman-bluetooth-9630-351-353-heat-pump"]),
    );
    expect(heatPumpById.get("coleman-9630-bluetooth-elec-flashing")?.plainMeaning).toMatch(/heat pump.*lockout/i);
    expect(heatPumpById.get("coleman-6535-335-diff-flashing")?.code).toBe("DIFF flashing");
    expect(heatPumpById.get("coleman-6535-335-diff-flashing")?.plainMeaning).toMatch(/2nd stage heat/i);
    expect(heatPumpById.get("coleman-6536-335-diff")?.code).toBe("DIFF");
    expect(heatPumpById.get("coleman-6536-335-diff")?.plainMeaning).toMatch(/backup heat.*locked out/i);
    expect(heatPumpById.get("coleman-heat-pump-thermostat-diff")?.plainMeaning).toMatch(/two hour lockout/i);
    expect(heatPumpById.get("coleman-heat-pump-thermostat-flashing-gas-heat")?.code).toBe("FLASHING GAS HEAT");

    for (const entry of heatPumpEntries) {
      expect(entry?.brand).toBe("Coleman-Mach");
      expect(entry?.equipmentType).toBe("Thermostat");
      expect(entry?.ownerSafeActions.join(" ")).not.toMatch(/wiring|fuse|breaker|jumper|control board|main service panel|probe|open/i);
      expect(entry?.serviceOnlyActions.join(" ")).toMatch(/wiring|electrical|installation|fuse|jumper|control/i);
      expect(entry?.symptomIds).toContain("coleman-heat-pump-lockout");
    }

    const ledEntries = corpus.entries.filter((entry) => entry.sourceIds.includes("coleman-9420-330-multizone-controller"));
    expect(new Set(ledEntries.map((entry) => entry.code))).toEqual(
      new Set([
        "Solid Green",
        "Off",
        "Solid Red",
        "Fast Flashing Green (4 Times/Sec)",
        "Slow Flashing Green (1 Time/Sec)",
        "Alternating Red & Orange",
        "Alternating Green & Orange",
      ]),
    );
    expect(ledEntries).toHaveLength(7);

    const ledByCode = new Map(ledEntries.map((entry) => [entry.code, entry]));
    expect(ledByCode.get("Solid Green")?.plainMeaning).toMatch(/connected.*network.*communicating/i);
    expect(ledByCode.get("Off")?.plainMeaning).toMatch(/no power|failed/i);
    expect(ledByCode.get("Solid Red")?.plainMeaning).toMatch(/offline.*not connected/i);
    expect(ledByCode.get("Fast Flashing Green (4 Times/Sec)")?.plainMeaning).toMatch(/initial.*network connection/i);
    expect(ledByCode.get("Slow Flashing Green (1 Time/Sec)")?.plainMeaning).toMatch(/no valid network message/i);
    expect(ledByCode.get("Alternating Red & Orange")?.plainMeaning).toMatch(/offline.*reconnect/i);
    expect(ledByCode.get("Alternating Green & Orange")?.plainMeaning).toMatch(/gone offline.*2 or more/i);

    for (const entry of ledEntries) {
      expect(entry.brand).toBe("Coleman-Mach");
      expect(entry.modelFamilies).toContain("Coleman-Mach 9420-330 multi-zone wall thermostat");
      expect(entry.ownerSafeActions.join(" ")).not.toMatch(
        /wiring|connect.*wire|install|main service panel|fuse|breaker|control box|hardware configuration|alter/i,
      );
      expect(entry.serviceOnlyActions.join(" ")).toMatch(/wiring|network|control box|hardware|installation|power/i);
      expect(entry.symptomIds).toContain("coleman-9420-330-network-status-led");
    }

    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const heatPumpSymptom = symptomById.get("coleman-heat-pump-lockout");
    expect(heatPumpSymptom?.sourceIds).toEqual(
      expect.arrayContaining([
        "coleman-bluetooth-9630-352-heat-pump",
        "coleman-bluetooth-9630-351-353-heat-pump",
        "coleman-6535-335-heat-pump-thermostat",
        "coleman-6536-335-heat-pump-thermostat",
        "coleman-heat-pump-thermostat-lockout-function",
      ]),
    );
    expect(heatPumpSymptom?.safeChecklist.join(" ")).not.toMatch(
      /wiring|fuse|breaker|jumper|control board|main service panel|probe|open/i,
    );

    const ledSymptom = symptomById.get("coleman-9420-330-network-status-led");
    expect(ledSymptom?.sourceIds).toEqual(["coleman-9420-330-multizone-controller"]);
    expect(ledSymptom?.safeChecklist.join(" ")).not.toMatch(
      /wiring|connect.*wire|install|main service panel|fuse|breaker|control box|hardware configuration|alter/i,
    );
  });

  it("adds official Girard GSWH-2 owner-manual display codes and keeps Girard tankless symptoms separate", () => {
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const girardOwnerSourceId = "girard-gswh2-owner-manual";
    const girardSupportSourceIds = [
      "girard-tankless-quick-operating-tips",
      "girard-qr181-freeze-damage",
      "girard-tankless-intro-operation-video",
      "girard-tankless-flow-temperature-video",
      "girard-tankless-decalcify-video",
      "girard-tankless-winterize-video",
      "girard-tankless-filter-screen-video",
      "girard-tankless-freeze-leaks-video",
      "girard-tankless-maintenance-visual-video",
      "girard-tankless-no-hot-water-video",
      "girard-tankless-water-not-hot-enough-video",
      "girard-tankless-water-too-hot-cold-video",
    ];

    const girardCodes = corpus.entries.filter(
      (entry) => entry.brand === "Lippert" && entry.modelFamilies.includes("Girard GSWH-2"),
    );

    expect(corpus.sources.find((source) => source.id === girardOwnerSourceId)?.official).toBe(true);
    expect(corpus.sources.find((source) => source.id === "girard-gswh2-service-manual")).toBeUndefined();
    expect(new Set(girardCodes.map((entry) => entry.code))).toEqual(
      new Set(["E0", "E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8", "E9", "En", "Fd"]),
    );
    expect(girardCodes.every((entry) => entry.sourceIds.includes(girardOwnerSourceId))).toBe(true);
    expect(girardCodes.some((entry) => entry.sourceIds.includes("girard-gswh2-service-manual"))).toBe(false);

    expect(symptomById.get("girard-tankless-low-flow-temperature")?.sourceIds).toEqual(
      expect.arrayContaining([
        girardOwnerSourceId,
        "girard-tankless-quick-operating-tips",
        "girard-tankless-flow-temperature-video",
        "girard-tankless-water-not-hot-enough-video",
        "girard-tankless-water-too-hot-cold-video",
      ]),
    );
    expect(symptomById.get("girard-tankless-maintenance-filter-decalcify")?.sourceIds).toEqual(
      expect.arrayContaining([
        girardOwnerSourceId,
        "girard-tankless-decalcify-video",
        "girard-tankless-filter-screen-video",
        "girard-tankless-maintenance-visual-video",
      ]),
    );
    expect(symptomById.get("girard-tankless-winterization-freeze")?.sourceIds).toEqual(
      expect.arrayContaining([
        girardOwnerSourceId,
        "girard-qr181-freeze-damage",
        "girard-tankless-winterize-video",
        "girard-tankless-freeze-leaks-video",
      ]),
    );
    expect(symptomById.get("girard-tankless-gas-smell")?.sourceIds).toContain(girardOwnerSourceId);
    expect(symptomById.get("girard-tankless-no-hot-water-lockout")?.sourceIds).toEqual(
      expect.arrayContaining([
        girardOwnerSourceId,
        "girard-tankless-quick-operating-tips",
        "girard-tankless-intro-operation-video",
        "girard-tankless-no-hot-water-video",
      ]),
    );

    for (const sourceId of girardSupportSourceIds) {
      expect(corpus.sources.find((source) => source.id === sourceId)?.official, sourceId).toBe(true);
      expect(
        corpus.symptoms
          .filter((symptom) => symptom.sourceIds.includes(sourceId))
          .map((symptom) => symptom.id)
          .every((id) => id.startsWith("girard-")),
        sourceId,
      ).toBe(true);
    }
  });

  it("adds official legacy Girard GSWH-1 and GSWH-1M owner-manual LED diagnostics separately", () => {
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const expectedLedCodes = new Set(["steady on", "1 flash", "2 flashes", "3 flashes", "4 flashes", "5 flashes"]);
    const legacySources = [
      "girard-gswh1-owner-manual",
      "girard-gswh1m-owner-manual",
      "girard-gswh1-wud-owner-manual",
    ];
    const codesForFamily = (modelFamily: string) =>
      corpus.entries.filter((entry) => entry.brand === "Lippert" && entry.modelFamilies.includes(modelFamily));

    for (const sourceId of legacySources) {
      expect(corpus.sources.find((source) => source.id === sourceId)?.official, sourceId).toBe(true);
    }

    expect(new Set(codesForFamily("Girard GSWH-1").map((entry) => entry.code))).toEqual(expectedLedCodes);
    expect(new Set(codesForFamily("Girard GSWH-1M").map((entry) => entry.code))).toEqual(expectedLedCodes);

    expect(codesForFamily("Girard GSWH-1").map((entry) => entry.sourceIds)).toEqual(
      Array.from({ length: expectedLedCodes.size }, () => ["girard-gswh1-owner-manual"]),
    );
    expect(codesForFamily("Girard GSWH-1M").map((entry) => entry.sourceIds)).toEqual(
      Array.from({ length: expectedLedCodes.size }, () => ["girard-gswh1m-owner-manual"]),
    );

    expect(symptomById.get("girard-gswh1-gswh1m-led-diagnostics-lockout")?.sourceIds).toEqual(
      expect.arrayContaining(["girard-gswh1-owner-manual", "girard-gswh1m-owner-manual"]),
    );
    expect(symptomById.get("girard-gswh1-gswh1m-low-flow-temperature")?.sourceIds).toEqual(
      expect.arrayContaining(["girard-gswh1-owner-manual", "girard-gswh1m-owner-manual"]),
    );
    expect(symptomById.get("girard-gswh1-gswh1m-winterization-freeze")?.sourceIds).toEqual(
      expect.arrayContaining(["girard-gswh1m-owner-manual", "girard-gswh1-wud-owner-manual"]),
    );
  });
});
