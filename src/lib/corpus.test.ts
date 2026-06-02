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
});
