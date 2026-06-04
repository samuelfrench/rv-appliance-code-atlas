import { describe, expect, it } from "vitest";
import corpus from "../data/corpus.json";
import {
  buildSearchIndex,
  buildSymptomSearchIndex,
  getBrandCoverage,
  lookupEntries,
  lookupSymptomGuides,
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

const expectedEntryCount = 864;
const expectedSourceCount = 1245;
const expectedSymptomCount = 1073;

describe("verified corpus", () => {
  it("rejects unsourced or unsafe appliance-code records", () => {
    const report = validateCorpus(corpus);

    expect(report.failures).toEqual([]);
    expect(report.verifiedEntries).toBeGreaterThanOrEqual(18);
    expect(report.sourceBackedEntries).toBe(report.verifiedEntries);
    expect(report.dangerousOwnerActions).toEqual([]);
  });

  it("rejects malformed symptom search aliases", () => {
    const invalidCorpus = structuredClone(corpus) as Parameters<typeof validateCorpus>[0];
    const symptom = invalidCorpus.symptoms[0];
    (symptom as unknown as { searchAliases: unknown }).searchAliases = ["RMD10 owner search", 10];

    const report = validateCorpus(invalidCorpus);

    expect(report.failures).toContain(`Symptom ${symptom.id} searchAliases[1] must be a non-empty string.`);
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
    expect(lookupEntries(index, "dometic single zone e1 communication module board")[0]?.slug).toBe(
      "dometic-single-zone-lcd-e1",
    );
    expect(lookupEntries(index, "dometic 3313193 e5 freeze sensor")[0]?.slug).toBe("dometic-single-zone-lcd-e5");
    expect(lookupEntries(index, "dometic bluetooth ct 3316420 e1 communication")[0]?.slug).toBe(
      "dometic-bluetooth-ct-e1",
    );
    expect(lookupEntries(index, "dometic bluetooth thermostat e5 freeze sensor")[0]?.slug).toBe(
      "dometic-bluetooth-ct-e5",
    );
    expect(lookupEntries(index, "dometic freshjet fjx p1 under voltage campsite")[0]?.slug).toBe(
      "dometic-freshjet-fjx-p1-under-voltage-protection",
    );
    expect(lookupEntries(index, "freshjet fjx e9 compressor ipm module")[0]?.slug).toBe(
      "dometic-freshjet-fjx-e9-compressor-drive-ipm-module-fault",
    );
    expect(lookupEntries(index, "furrion fireplace ee thermostat sensor")[0]?.slug).toBe(
      "furrion-electric-fireplace-ee-thermostat-sensor",
    );
    expect(lookupEntries(index, "furrion fireplace 88 overheat protection")[0]?.slug).toBe(
      "furrion-electric-fireplace-88-overheat-protection",
    );
    expect(lookupEntries(index, "furrion e3 thermostat").map((entry) => entry.code)).toContain("E3");
    expect(lookupEntries(index, "suburban reset light").map((entry) => entry.brand)).toContain("Suburban/Atwood");
  });

  it("finds symptom-only pages from owner symptom searches", () => {
    const index = buildSymptomSearchIndex(corpus);

    expect(lookupSymptomGuides(index, "rm10 gas smell")[0]?.slug).toBe("dometic-rm10-gas-smell");
    expect(lookupSymptomGuides(index, "rm10 ammonia smell")[0]?.slug).toBe("dometic-rm10-ammonia-smell");
    expect(lookupSymptomGuides(index, "rm10 defrost ice")[0]?.slug).toBe("dometic-rm10-defrost-evaporator-ice-buildup");
    expect(lookupSymptomGuides(index, "rm10 internal batteries")[0]?.slug).toBe("dometic-rm10-internal-battery-packs");
    expect(lookupSymptomGuides(index, "thetford toilet bowl will not hold water lip seal")[0]?.slug).toBe(
      "thetford-rv-toilet-bowl-water-does-not-hold-seal",
    );
    expect(lookupSymptomGuides(index, "aqua magic weak flush no water pedal")[0]?.slug).toBe(
      "thetford-rv-toilet-no-flush-or-poor-flush-water-supply",
    );
    expect(lookupSymptomGuides(index, "thetford toilet leak behind base water valve")[0]?.slug).toBe(
      "thetford-rv-toilet-leak-behind-or-around-base",
    );
    expect(lookupSymptomGuides(index, "thetford rv toilet winterize freeze damage leak")[0]?.slug).toBe(
      "thetford-rv-toilet-winterizing-freeze-damage",
    );
  });

  it("finds Dometic 10-series symptom aliases from RMD/RML/RMS owner searches", () => {
    const index = buildSymptomSearchIndex(corpus);

    expect(lookupSymptomGuides(index, "rmd10 gas smell")[0]?.slug).toBe("dometic-rm10-gas-smell");
    expect(lookupSymptomGuides(index, "rml10 ammonia smell")[0]?.slug).toBe("dometic-rm10-ammonia-smell");
    expect(lookupSymptomGuides(index, "rms10 defrost ice")[0]?.slug).toBe("dometic-rm10-defrost-evaporator-ice-buildup");
    expect(lookupSymptomGuides(index, "rmd10 internal batteries")[0]?.slug).toBe("dometic-rm10-internal-battery-packs");
    expect(lookupSymptomGuides(index, "rml10 door ice compartment")[0]?.slug).toBe(
      "dometic-rm10-door-or-ice-compartment-door-problem",
    );
    expect(lookupSymptomGuides(index, "rms10 not cooling level")[0]?.slug).toBe(
      "dometic-rm10-not-cooling-or-not-working-level-ventilation",
    );
  });

  it("finds Dometic RUA/RUC symptom support pages from owner searches", () => {
    const index = buildSymptomSearchIndex(corpus);

    expect(lookupSymptomGuides(index, "rua does not work automatic mode")[0]?.slug).toBe(
      "dometic-rua-does-not-work-by-mode",
    );
    expect(lookupSymptomGuides(index, "rua not cooling lower temperature")[0]?.slug).toBe(
      "dometic-rua-ruc-not-cooling-temperature-and-ventilation",
    );
    expect(lookupSymptomGuides(index, "rua defrost ice")[0]?.slug).toBe("dometic-rua-ruc-defrost-ice");
    expect(lookupSymptomGuides(index, "rua 12v battery management")[0]?.slug).toBe(
      "dometic-rua-ruc-first-use-ventilation-battery-management",
    );
    expect(lookupSymptomGuides(index, "rua eco mode defrost")[0]?.slug).toBe("dometic-rua-ruc-user-modes");
    expect(lookupSymptomGuides(index, "ruc no display")[0]?.slug).toBe("dometic-ruc-display-or-power-not-on");
    expect(lookupSymptomGuides(index, "ruc compressor high ambient")[0]?.slug).toBe(
      "dometic-ruc-compressor-voltage-or-high-ambient",
    );
    expect(lookupSymptomGuides(index, "ruc water leaking floor")[0]?.slug).toBe("dometic-ruc-water-leak-or-drain");
    expect(lookupSymptomGuides(index, "ruc unusual noise fan")[0]?.slug).toBe("dometic-ruc-unusual-noise");
    expect(lookupSymptomGuides(index, "ruc too cold warmest setting")[0]?.slug).toBe(
      "dometic-ruc-too-cold-temperature-setting",
    );
  });

  it("finds Dometic CCC2 thermostat symptom support pages from owner searches", () => {
    const index = buildSymptomSearchIndex(corpus);

    expect(lookupSymptomGuides(index, "dometic ccc2 fan only no cooling cool mode zone setpoint")[0]?.slug).toBe(
      "dometic-ccc2-fan-only-no-cooling-mode-zone",
    );
    expect(lookupSymptomGuides(index, "ccc2 hourglass compressor delay 2 minutes no start")[0]?.slug).toBe(
      "dometic-ccc2-hourglass-compressor-delay",
    );
    expect(lookupSymptomGuides(index, "ccc2 hp defrost auxiliary heat below 30 degrees")[0]?.slug).toBe(
      "dometic-ccc2-heat-pump-defrost-auxiliary-heat",
    );
    expect(lookupSymptomGuides(index, "ccc2 filter icon inside temp f c reset fan runtime")[0]?.slug).toBe(
      "dometic-ccc2-filter-icon-clean-reset",
    );
    expect(lookupSymptomGuides(index, "dometic ccc2 hot weather high fan cooling shade windows")[0]?.slug).toBe(
      "dometic-ccc2-hot-weather-cooling-performance",
    );
  });

  it("finds Dometic Single Zone LCD thermostat code and symptom support pages from owner searches", () => {
    const symptomIndex = buildSymptomSearchIndex(corpus);

    expect(lookupSymptomGuides(symptomIndex, "dometic single zone auto fan speed high low 5 degrees")[0]?.slug).toBe(
      "dometic-single-zone-auto-fan-speed-cycling",
    );
    expect(lookupSymptomGuides(symptomIndex, "single zone lcd compressor time delay 2 minutes")[0]?.slug).toBe(
      "dometic-single-zone-compressor-time-delay",
    );
    expect(lookupSymptomGuides(symptomIndex, "dometic single zone heat pump defrost cold air registers 25 minutes")[0]?.slug).toBe(
      "dometic-single-zone-heat-pump-defrost-cold-air",
    );
    expect(lookupSymptomGuides(symptomIndex, "single zone heat pump lockout below 30 fan on no heat")[0]?.slug).toBe(
      "dometic-single-zone-low-ambient-heat-pump-lockout",
    );
    expect(lookupSymptomGuides(symptomIndex, "dometic single zone filter every 2 weeks hot weather cooling")[0]?.slug).toBe(
      "dometic-single-zone-hot-weather-filter-maintenance",
    );
  });

  it("finds Dometic Bluetooth CT thermostat code and symptom support pages from owner searches", () => {
    const symptomIndex = buildSymptomSearchIndex(corpus);

    expect(lookupSymptomGuides(symptomIndex, "dometic bluetooth ct app pairing 2 digit pin off mode")[0]?.slug).toBe(
      "dometic-bluetooth-ct-pairing-mobile-device",
    );
    expect(lookupSymptomGuides(symptomIndex, "bluetooth ct lost pairs factory reset four devices")[0]?.slug).toBe(
      "dometic-bluetooth-ct-lost-pairs-factory-reset",
    );
    expect(lookupSymptomGuides(symptomIndex, "capacitive touch thermostat inside temperature off mode wet fingers")[0]?.slug).toBe(
      "dometic-bluetooth-ct-touch-display-inside-temperature",
    );
    expect(lookupSymptomGuides(symptomIndex, "dometic bluetooth ct furnace fan auto low high")[0]?.slug).toBe(
      "dometic-bluetooth-ct-auto-fan-furnace-fan",
    );
    expect(lookupSymptomGuides(symptomIndex, "bluetooth ct compressor time delay 2 minutes")[0]?.slug).toBe(
      "dometic-bluetooth-ct-compressor-time-delay",
    );
    expect(lookupSymptomGuides(symptomIndex, "bluetooth ct heat pump defrost cold air 25 minutes")[0]?.slug).toBe(
      "dometic-bluetooth-ct-heat-pump-defrost-cold-air",
    );
    expect(lookupSymptomGuides(symptomIndex, "bluetooth ct heat pump lockout below 30 fan remains on")[0]?.slug).toBe(
      "dometic-bluetooth-ct-low-ambient-heat-pump-lockout",
    );
    expect(lookupSymptomGuides(symptomIndex, "bluetooth ct filter every 2 weeks hot weather heat gain")[0]?.slug).toBe(
      "dometic-bluetooth-ct-hot-weather-filter-maintenance",
    );
  });

  it("finds Dometic FreshJet FJX code and symptom support pages from owner searches", () => {
    const symptomIndex = buildSymptomSearchIndex(corpus);

    expect(lookupSymptomGuides(symptomIndex, "freshjet fjx not cooling above 52 below 16 cooling mode")[0]?.slug).toBe(
      "dometic-freshjet-fjx-not-cooling-temperature-limits",
    );
    expect(lookupSymptomGuides(symptomIndex, "freshjet fjx not heating below -2 set higher temperature")[0]?.slug).toBe(
      "dometic-freshjet-fjx-not-heating-temperature-limits",
    );
    expect(lookupSymptomGuides(symptomIndex, "freshjet low air output leaves ventilation grilles filter")[0]?.slug).toBe(
      "dometic-freshjet-fjx-low-air-output-filter-vents",
    );
    expect(lookupSymptomGuides(symptomIndex, "freshjet water enters vehicle drainage openings")[0]?.slug).toBe(
      "dometic-freshjet-fjx-water-enters-vehicle-drainage",
    );
    expect(
      lookupSymptomGuides(symptomIndex, "freshjet constantly switches itself off icing sensor air nozzles closed")[0]
        ?.slug,
    ).toBe("dometic-freshjet-fjx-icing-sensor-switches-off");
    expect(lookupSymptomGuides(symptomIndex, "freshjet under voltage campsite management sufficient power")[0]?.slug).toBe(
      "dometic-freshjet-fjx-voltage-protection-campsite-power",
    );
  });

  it("finds Dometic DF furnace operating-manual symptom pages from owner searches", () => {
    const index = buildSymptomSearchIndex(corpus);

    expect(lookupSymptomGuides(index, "dometic df furnace blower turns on will not light thermostat heat lp air")[0]?.slug).toBe(
      "dometic-df-furnace-blower-runs-will-not-light",
    );
    expect(lookupSymptomGuides(index, "dometic df furnace shuts off before desired temperature vents blocked")[0]?.slug).toBe(
      "dometic-df-furnace-shuts-off-before-temperature-vents",
    );
    expect(lookupSymptomGuides(index, "dometic df furnace soot exhaust vent carbon monoxide snow obstruction")[0]?.slug).toBe(
      "dometic-df-furnace-soot-exhaust-vent-carbon-monoxide",
    );
    expect(lookupSymptomGuides(index, "dometic df furnace initial smoke first firing 5 10 minutes gas odor")[0]?.slug).toBe(
      "dometic-df-furnace-initial-smoke-or-gas-odor",
    );
    expect(lookupSymptomGuides(index, "dometic df furnace monthly annual maintenance qualified rv service technician")[0]?.slug).toBe(
      "dometic-df-furnace-maintenance-service-boundary",
    );
  });

  it("finds Suburban cooking and wall-heater symptom pages from owner searches", () => {
    const index = buildSymptomSearchIndex(corpus);

    expect(lookupSymptomGuides(index, "suburban range cooktop gas odor propane bottle")[0]?.slug).toBe(
      "suburban-range-cooktop-gas-odor",
    );
    expect(lookupSymptomGuides(index, "suburban cooktop burner extinguishes wait five minutes relight")[0]?.slug).toBe(
      "suburban-range-cooktop-burner-lighting-blowout",
    );
    expect(
      lookupSymptomGuides(index, "suburban cooktop yellow flame burners not igniting properly gas valve difficult to turn")[0]?.slug,
    ).toBe("suburban-range-cooktop-abnormal-flame-service");
    expect(lookupSymptomGuides(index, "suburban range oven pilot cover oven vent carbon monoxide foil")[0]?.slug).toBe(
      "suburban-range-oven-pilot-vent-carbon-monoxide",
    );
    expect(
      lookupSymptomGuides(index, "suburban griddle ignition 5 seconds wait 5 minutes grease fire storage")[0]?.slug,
    ).toBe("suburban-griddle-ignition-grease-storage");
    expect(
      lookupSymptomGuides(index, "suburban griddle flame check venturi insects valve not smooth rv service")[0]?.slug,
    ).toBe("suburban-griddle-flame-venturi-service");
    expect(
      lookupSymptomGuides(index, "suburban electric wall heater thermostat switch light high limit blocked air inlet outlet")[0]
        ?.slug,
    ).toBe("suburban-electric-wall-heater-thermostat-high-limit-shutdown");
  });

  it("finds Norcold and Thetford symptom support pages from owner searches", () => {
    const index = buildSymptomSearchIndex(corpus);

    expect(lookupSymptomGuides(index, "norcold not cooling vents level")[0]?.slug).toBe(
      "norcold-absorption-refrigerator-not-cooling-level-ventilation",
    );
    expect(lookupSymptomGuides(index, "norcold 120v not cooling")[0]?.slug).toBe(
      "norcold-absorption-120v-ac-not-cooling",
    );
    expect(lookupSymptomGuides(index, "thetford n3000 automatic mode will not work")[0]?.slug).toBe(
      "norcold-absorption-power-source-or-startup",
    );
    expect(lookupSymptomGuides(index, "norcold door alarm seal sagging")[0]?.slug).toBe(
      "norcold-absorption-door-alarm-or-door-seal-frost",
    );
    expect(lookupSymptomGuides(index, "norcold freezer frost condensation hair dryer")[0]?.slug).toBe(
      "norcold-absorption-defrost-frost-condensation",
    );
    expect(lookupSymptomGuides(index, "norcold refrigerator smell clean vanilla baking soda")[0]?.slug).toBe(
      "norcold-absorption-refrigerator-odor-cleaning",
    );
    expect(lookupSymptomGuides(index, "norcold which setting is coldest setting 5")[0]?.slug).toBe(
      "norcold-absorption-temperature-setting-too-cold-or-too-warm",
    );
    expect(lookupSymptomGuides(index, "norcold hts solid red do not bypass")[0]?.slug).toBe(
      "norcold-high-temperature-sensor-stopped-operating-service-only",
    );
    expect(lookupSymptomGuides(index, "norcold dc compressor not cooling low battery voltage")[0]?.slug).toBe(
      "norcold-dc-compressor-refrigerator-cooling-voltage",
    );
    expect(lookupSymptomGuides(index, "norcold n2000 overcooling night mode noise")[0]?.slug).toBe(
      "norcold-dc-compressor-refrigerator-too-cold-or-night-mode-noise",
    );
    expect(lookupSymptomGuides(index, "norcold n2090 drip tray condensation water")[0]?.slug).toBe(
      "norcold-n2000-condensation-drip-tray",
    );
  });

  it("finds Furrion refrigerator symptom support pages from owner searches", () => {
    const index = buildSymptomSearchIndex(corpus);

    expect(lookupSymptomGuides(index, "furrion refrigerator not cooling hard reset")[0]?.slug).toBe(
      "furrion-12v-refrigerator-not-cooling-hard-reset",
    );
    expect(lookupSymptomGuides(index, "furrion freezer cold fridge warm vents blocked")[0]?.slug).toBe(
      "furrion-12v-refrigerator-not-cold-enough-seals-vents-temperature",
    );
    expect(lookupSymptomGuides(index, "furrion compressor turns on and off low battery heat")[0]?.slug).toBe(
      "furrion-12v-refrigerator-compressor-cycling-low-battery-heat",
    );
    expect(lookupSymptomGuides(index, "furrion refrigerator door won't close seal")[0]?.slug).toBe(
      "furrion-refrigerator-door-seal-not-closing",
    );
    expect(lookupSymptomGuides(index, "furrion moisture ice inside outside refrigerator")[0]?.slug).toBe(
      "furrion-refrigerator-moisture-ice-or-defrost",
    );
    expect(lookupSymptomGuides(index, "furrion no power service line battery solar shore power")[0]?.slug).toBe(
      "furrion-12v-refrigerator-power-service-line-or-reset",
    );
    expect(lookupSymptomGuides(index, "furrion lock mode temperature setting off grid")[0]?.slug).toBe(
      "furrion-refrigerator-temperature-mode-or-lock-mode",
    );
    expect(lookupSymptomGuides(index, "furrion bubbling gurgling popping cracking vibrating rattling")[0]?.slug).toBe(
      "furrion-refrigerator-normal-noises-vibration",
    );
    expect(lookupSymptomGuides(index, "furrion compressor board fan refrigerant service only")[0]?.slug).toBe(
      "furrion-refrigerator-service-only-compressor-sensor-wiring",
    );
  });

  it("finds Furrion furnace symptom support pages from owner searches", () => {
    const index = buildSymptomSearchIndex(corpus);

    expect(lookupSymptomGuides(index, "furrion furnace will not light blower does not turn on low 12v")[0]?.slug).toBe(
      "furrion-furnace-will-not-light-blower-no-start",
    );
    expect(lookupSymptomGuides(index, "furrion furnace shuts off before desired temperature vents covered")[0]?.slug).toBe(
      "furrion-furnace-short-cycles-before-set-temperature",
    );
    expect(lookupSymptomGuides(index, "furrion furnace soot yellow flame exhaust service")[0]?.slug).toBe(
      "furrion-furnace-soot-yellow-flame-exhaust-service",
    );
  });

  it("finds post-Coleman Dometic and Furrion support pages from owner searches", () => {
    const index = buildSymptomSearchIndex(corpus);

    expect(lookupSymptomGuides(index, "dometic americana refrigerator not cooling temperature test")[0]?.slug).toBe(
      "dometic-americana-not-cooling-temperature-test",
    );
    expect(lookupSymptomGuides(index, "dometic americana refrigerator not working level")[0]?.slug).toBe(
      "dometic-americana-not-working-leveling",
    );
    expect(lookupSymptomGuides(index, "dometic americana defrost ice sharp tool")[0]?.slug).toBe(
      "dometic-americana-defrost-ice-buildup",
    );
    expect(lookupSymptomGuides(index, "dometic americana clean refrigerator vents")[0]?.slug).toBe(
      "dometic-americana-cleaning-vents-airflow",
    );
    expect(lookupSymptomGuides(index, "brisk ac frost cooling coil filter fan only")[0]?.slug).toBe(
      "dometic-brisk-ac-frost-on-cooling-coil",
    );
    expect(lookupSymptomGuides(index, "freshjet not cooling cooling mode")[0]?.slug).toBe(
      "dometic-freshjet-ac-not-cooling-mode-selection",
    );
    expect(lookupSymptomGuides(index, "furrion chill cube filter led clean reset")[0]?.slug).toBe(
      "furrion-chill-cube-filter-led-remote-mode-max-cool",
    );
    expect(lookupSymptomGuides(index, "furrion chill 2 low profile water enters vehicle drain")[0]?.slug).toBe(
      "furrion-chill-2-filter-icing-water-leak",
    );
    expect(lookupSymptomGuides(index, "furrion enhanced multizone e3 mode function lost app pairing")[0]?.slug).toBe(
      "furrion-enhanced-multizone-thermostat-e3-mode-loss-app-pairing",
    );
    expect(lookupSymptomGuides(index, "furrion furnace lockout reset blower stops 60 seconds")[0]?.slug).toBe(
      "furrion-furnace-lockout-reset-after-air-in-propane-line",
    );
    expect(lookupSymptomGuides(index, "furrion comfort production label model serial ac thermostat furnace")[0]?.slug).toBe(
      "furrion-ac-model-serial-label-service-call-prep",
    );
  });

  it("finds post-Coleman Norcold and Furrion service-prep pages from owner searches", () => {
    const index = buildSymptomSearchIndex(corpus);

    expect(lookupSymptomGuides(index, "norcold dc740 not cooling low voltage defrost fuse")[0]?.slug).toBe(
      "norcold-dc740-dc751-not-cooling-low-voltage-defrost",
    );
    expect(lookupSymptomGuides(index, "norcold nv1090 night mode defrost storage vents")[0]?.slug).toBe(
      "norcold-nv1090-cooling-night-mode-defrost-storage",
    );
    expect(lookupSymptomGuides(index, "thetford t2095 door seal night mode storage defrost")[0]?.slug).toBe(
      "thetford-t2095-cooling-door-seal-night-mode-storage",
    );
    expect(lookupSymptomGuides(index, "norcold 1210 door seal defrost storage recall service prep")[0]?.slug).toBe(
      "norcold-1210-defrost-door-seal-storage-service-prep",
    );
    expect(lookupSymptomGuides(index, "norcold 1200 recall hts solid red serial service prep")[0]?.slug).toBe(
      "norcold-recall-hts-gas-valve-serial-service-prep",
    );
    expect(lookupSymptomGuides(index, "norcold de0041 ev0061 ac dc refrigerator low voltage defrost")[0]?.slug).toBe(
      "norcold-de-ev-acdc-refrigerator-not-cooling-defrost-battery",
    );
    expect(lookupSymptomGuides(index, "furrion thermostat controller compatibility hw v2 furnace missing")[0]?.slug).toBe(
      "furrion-thermostat-controller-compatibility-service-prep",
    );
    expect(lookupSymptomGuides(index, "furrion refrigerator production label serial behind lower drawer")[0]?.slug).toBe(
      "furrion-refrigerator-model-serial-label-service-call-prep",
    );
  });

  it("finds Furrion/Lippert service-prep gaps from owner searches", () => {
    const index = buildSymptomSearchIndex(corpus);

    expect(lookupSymptomGuides(index, "furrion dishwasher leak drain cycle countertop manual")[0]?.slug).toBe(
      "furrion-dishwasher-leak-drain-cycle-service-prep",
    );
    expect(lookupSymptomGuides(index, "furrion convection microwave no heat sparks turntable qualified service")[0]?.slug).toBe(
      "furrion-microwave-no-heat-sparks-turntable-service-boundary",
    );
    expect(lookupSymptomGuides(index, "furrion range hood fan light filter venting")[0]?.slug).toBe(
      "furrion-range-hood-fan-light-filter-venting",
    );
    expect(lookupSymptomGuides(index, "furrion induction cooktop cookware overheats double burner")[0]?.slug).toBe(
      "furrion-induction-cooktop-cookware-overheat-service-boundary",
    );
    expect(lookupSymptomGuides(index, "furrion cooking production label warranty model serial w014")[0]?.slug).toBe(
      "furrion-cooking-model-serial-warranty-service-prep",
    );
    expect(lookupSymptomGuides(index, "furrion water heater energy production label warranty service")[0]?.slug).toBe(
      "furrion-water-heater-energy-label-warranty-service-prep",
    );
    expect(lookupSymptomGuides(index, "furrion furnace blower runs no ignition")[0]?.slug).toBe(
      "furrion-furnace-blower-runs-no-ignition-service-prep",
    );
  });

  it("finds Furrion fireplace and range symptom support pages from owner searches", () => {
    const index = buildSymptomSearchIndex(corpus);

    expect(lookupSymptomGuides(index, "furrion fireplace red led blinking blower motor proximity 6 inches")[0]?.slug).toBe(
      "furrion-electric-fireplace-red-led-proximity-cutoff",
    );
    expect(lookupSymptomGuides(index, "furrion fireplace no warm air 30 second cooldown thermostat setting")[0]?.slug).toBe(
      "furrion-electric-fireplace-no-warm-air-cooldown-thermostat",
    );
    expect(lookupSymptomGuides(index, "furrion fireplace remote not working batteries less than 20 feet")[0]?.slug).toBe(
      "furrion-electric-fireplace-remote-control-not-working",
    );
    expect(lookupSymptomGuides(index, "furrion range surface burners do not light ffd hold knob 5 seconds")[0]?.slug).toBe(
      "furrion-range-cooktop-burners-do-not-light-ffd",
    );
    expect(lookupSymptomGuides(index, "furrion range surface flame orange half way around burner")[0]?.slug).toBe(
      "furrion-range-surface-flame-orange-halfway",
    );
    expect(lookupSymptomGuides(index, "furrion range smell gas carbon monoxide space heater")[0]?.slug).toBe(
      "furrion-range-gas-odor-carbon-monoxide-boundary",
    );
    expect(lookupSymptomGuides(index, "furrion oven pilot flame goes out wait five minutes ventilation foil")[0]?.slug).toBe(
      "furrion-range-oven-pilot-flame-blowout-ventilation",
    );
  });

  it("finds Cummins Energy Command AGS status and app symptom pages from owner searches", () => {
    const index = buildSymptomSearchIndex(corpus);

    expect(lookupSymptomGuides(index, "ec30 safety off and on auto gen disabled after moving rv")[0]?.slug).toBe(
      "onan-energy-command-safety-off-on-auto-disabled",
    );
    expect(lookupSymptomGuides(index, "energy command auto run low bat auto stop full bat")[0]?.slug).toBe(
      "onan-energy-command-auto-run-low-battery",
    );
    expect(lookupSymptomGuides(index, "ec-30 service due service in enter reset")[0]?.slug).toBe(
      "onan-energy-command-service-due-reminder",
    );
    expect(lookupSymptomGuides(index, "ec ags plus generator does not start in auto mode accelerometer fault")[0]?.slug).toBe(
      "onan-ec-ags-plus-auto-mode-does-not-start",
    );
    expect(lookupSymptomGuides(index, "ec-ags+ generator does not run ac temperature sensor bluetooth quiet time")[0]?.slug).toBe(
      "onan-ec-ags-plus-generator-does-not-run-ac",
    );
    expect(lookupSymptomGuides(index, "ecags generator starts unexpectedly quiet time house battery start voltage")[0]?.slug).toBe(
      "onan-ec-ags-plus-unexpected-start-stop",
    );
  });

  it("finds Cummins Onan spec-sheet and winterization service-prep pages from owner searches", () => {
    const index = buildSymptomSearchIndex(corpus);

    expect(lookupSymptomGuides(index, "onan winterization flyer no start after storage stale fuel")[0]?.slug).toBe(
      "onan-generator-storage-winterization-no-start-service-prep",
    );
    expect(lookupSymptomGuides(index, "onan remote panel display accessory catalog 6646901 part number")[0]?.slug).toBe(
      "onan-generator-remote-panel-accessory-part-service-prep",
    );
    expect(lookupSymptomGuides(index, "onan qg 5500 will run one or two air conditioners load rating")[0]?.slug).toBe(
      "onan-qg-load-rating-model-spec-service-prep",
    );
    expect(lookupSymptomGuides(index, "onan qg 7000idf dual fuel low oil shutdown derating prep")[0]?.slug).toBe(
      "onan-qg-load-rating-model-spec-service-prep",
    );
  });

  it("finds Suburban, MaxxAir, and Aqua-Hot service-prep pages from owner searches", () => {
    const index = buildSymptomSearchIndex(corpus);

    expect(lookupSymptomGuides(index, "suburban model number locator service center dealer")[0]?.slug).toBe(
      "suburban-model-number-service-locator-prep",
    );
    expect(lookupSymptomGuides(index, "maxxfan deluxe lid fan beeps remote wall control service prep")[0]?.slug).toBe(
      "maxxair-maxxfan-deluxe-lid-fan-control-service-prep",
    );
    expect(lookupSymptomGuides(index, "maxxfan remote not working")[0]?.slug).toBe(
      "maxxair-maxxfan-deluxe-lid-fan-control-service-prep",
    );
    expect(lookupSymptomGuides(index, "maxxfan lid not opening")[0]?.slug).toBe(
      "maxxair-maxxfan-deluxe-lid-fan-control-service-prep",
    );
    expect(lookupSymptomGuides(index, "maxxair 4 5 6 key wall control fan not responding")[0]?.slug).toBe(
      "maxxair-4-5-6-key-wall-control-service-prep",
    );
    expect(lookupSymptomGuides(index, "aqua hot 250-p01 use care winterization service prep")[0]?.slug).toBe(
      "aquahot-250-p01-use-care-winterization-service-prep",
    );
    expect(lookupSymptomGuides(index, "aqua hot leaking")[0]?.slug).toBe(
      "aquahot-250-p01-use-care-winterization-service-prep",
    );
    expect(lookupSymptomGuides(index, "aquahot no hot water cabin heat")[0]?.slug).toBe(
      "aquahot-250-p01-use-care-winterization-service-prep",
    );
  });

  it("does not let brand-specific service-prep aliases hijack unbranded generic searches", () => {
    const index = buildSymptomSearchIndex(corpus);
    const brandSpecificSlugs = new Set([
      "maxxair-maxxfan-deluxe-lid-fan-control-service-prep",
      "maxxair-4-5-6-key-wall-control-service-prep",
      "aquahot-250-p01-use-care-winterization-service-prep",
      "lippert-power-gear-through-frame-slideout-service-prep",
      "airxcel-family-brand-service-routing-prep",
      "coleman-mach-oem-alternate-model-lookup-prep",
      "coleman-mach-discontinued-ac-replacement-prep",
      "maxxair-rain-sensor-remote-airflow-cleaning-behavior",
      "maxxair-model-serial-sticker-claim-service-prep",
      "aquahot-125-dn2-use-care-winterization-service-prep",
      "aquahot-authorized-service-center-locator-prep",
      "suburban-warranty-receipt-service-paperwork-prep",
      "dometic-refrigerator-recall-model-serial-service-prep",
      "dometic-product-registration-paperwork-prep",
      "dometic-product-support-form-routing-prep",
      "dometic-authorized-maintenance-service-finder-prep",
      "dometic-warranty-claim-dealer-paperwork-prep",
      "dometic-300-310-320-toilet-cleaning-winterizing-prep",
      "thetford-norcold-warranty-registration-paperwork-prep",
      "thetford-norcold-support-product-finder-routing-prep",
      "dometic-rm8-cleaning-airflow-prep",
      "dometic-rm8-defrost-ice-buildup-prep",
      "dometic-rm8-low-outside-temperature-winter-cover-prep",
      "dometic-rm8-operating-controls-shutdown-prep",
      "dometic-freshjet-remote-mode-control-prep",
      "thetford-sanitation-warranty-paperwork-prep",
      "norcold-refrigeration-warranty-paperwork-prep",
      "coleman-mach-claims-paperwork-prep",
      "aquahot-warranty-registration-paperwork-prep",
    ]);

    for (const query of [
      "clean refrigerator",
      "defrost refrigerator",
      "turn off refrigerator",
      "remote control",
      "ac mode",
      "fan not working",
      "lid not opening",
      "leaking",
      "cabin heat not working",
      "power service prep",
      "gear service prep",
      "rain sensor",
      "model serial sticker",
      "warranty receipt",
      "service center",
      "no hot water cabin heat",
      "refrigerator recall",
      "product registration",
      "support form",
      "maintenance service provider",
      "warranty claim",
      "warranty registration",
      "service paperwork",
      "claims paperwork",
      "toilet winterizing",
      "dealer form",
      "product finder",
    ]) {
      expect(
        lookupSymptomGuides(index, query)
          .slice(0, 5)
          .map((symptom) => symptom.slug)
          .filter((slug) => brandSpecificSlugs.has(slug)),
        query,
      ).toEqual([]);
    }
  });

  it("finds the Thetford/Norcold, Lippert/Furrion, Coleman-Mach, and MaxxAir gap-scan prep pages", () => {
    const index = buildSymptomSearchIndex(corpus);

    expect(lookupSymptomGuides(index, "thetford norcold dealer locator authorized service center")[0]?.slug).toBe(
      "thetford-norcold-authorized-service-locator-prep",
    );
    expect(lookupSymptomGuides(index, "norcold refrigerator model tag location food compartment")[0]?.slug).toBe(
      "norcold-refrigerator-model-label-location",
    );
    expect(lookupSymptomGuides(index, "thetford toilet serial number location no data tag")[0]?.slug).toBe(
      "thetford-rv-toilet-serial-model-label-service-prep",
    );
    expect(lookupSymptomGuides(index, "thetford cassette toilet travel water in flush tank")[0]?.slug).toBe(
      "thetford-cassette-toilet-flush-tank-travel-storage",
    );
    expect(lookupSymptomGuides(index, "thetford rv toilet household cleaner seal safe")[0]?.slug).toBe(
      "thetford-rv-toilet-cleaning-seal-safe-maintenance",
    );
    expect(lookupSymptomGuides(index, "lippert slimrack slide stuck owner quick troubleshooting")[0]?.slug).toBe(
      "lippert-slimrack-slide-stuck-service-prep",
    );
    expect(lookupSymptomGuides(index, "lippert power gear through frame slideout stuck service prep")[0]?.slug).toBe(
      "lippert-power-gear-through-frame-slideout-service-prep",
    );
    expect(lookupSymptomGuides(index, "power gear through frame slideout stuck service prep")[0]?.slug).toBe(
      "lippert-power-gear-through-frame-slideout-service-prep",
    );
    expect(lookupSymptomGuides(index, "lippert qr059 electronic leveling identification touch pad")[0]?.slug).toBe(
      "lippert-leveling-system-identification-service-prep",
    );
    expect(lookupSymptomGuides(index, "furrion otr microwave fan light filter fmsm13 service prep")[0]?.slug).toBe(
      "furrion-otr-microwave-fan-light-filter-service-prep",
    );
    expect(lookupSymptomGuides(index, "fmsm13 microwave fan light filter")[0]?.slug).toBe(
      "furrion-otr-microwave-fan-light-filter-service-prep",
    );
    expect(lookupSymptomGuides(index, "lippert factory service locator model serial photos")[0]?.slug).toBe(
      "lippert-qualified-service-locator-prep",
    );
    expect(lookupSymptomGuides(index, "furrion furnace error code model support heating page")[0]?.slug).toBe(
      "furrion-furnace-error-code-model-service-prep",
    );
    expect(lookupSymptomGuides(index, "coleman mach model number service locator prep")[0]?.slug).toBe(
      "coleman-mach-model-number-service-locator-prep",
    );
    expect(lookupSymptomGuides(index, "maxxair 2025 amcat catalog model feature service prep")[0]?.slug).toBe(
      "maxxair-2025-amcat-model-feature-service-prep",
    );
    expect(lookupSymptomGuides(index, "maxxfan plus 04500 rain sensor remote service prep")[0]?.slug).toBe(
      "maxxair-maxxfan-plus-rain-sensor-remote-service-prep",
    );
  });

  it("finds Airxcel family, Coleman-Mach replacement, MaxxAir, Aqua-Hot, and Suburban paperwork prep pages", () => {
    const index = buildSymptomSearchIndex(corpus);

    expect(lookupSymptomGuides(index, "airxcel dealer service center locator coleman mach maxxair suburban aquahot")[0]?.slug).toBe(
      "airxcel-family-brand-service-routing-prep",
    );
    expect(lookupSymptomGuides(index, "coleman mach alternate model number replacement compatible")[0]?.slug).toBe(
      "coleman-mach-oem-alternate-model-lookup-prep",
    );
    expect(lookupSymptomGuides(index, "coleman mach discontinued ac replacement pre 2012")[0]?.slug).toBe(
      "coleman-mach-discontinued-ac-replacement-prep",
    );
    expect(lookupSymptomGuides(index, "maxxair rain sensor disable remote line of sight screen cleaning")[0]?.slug).toBe(
      "maxxair-rain-sensor-remote-airflow-cleaning-behavior",
    );
    expect(lookupSymptomGuides(index, "maxxfan model serial sticker round bug screen warranty claim")[0]?.slug).toBe(
      "maxxair-model-serial-sticker-claim-service-prep",
    );
    expect(lookupSymptomGuides(index, "aqua hot 125-dn2 no hot water cabin heat winterizing")[0]?.slug).toBe(
      "aquahot-125-dn2-use-care-winterization-service-prep",
    );
    expect(lookupSymptomGuides(index, "aqua hot service center authorized dealer locator")[0]?.slug).toBe(
      "aquahot-authorized-service-center-locator-prep",
    );
    expect(lookupSymptomGuides(index, "suburban warranty receipt bill of sale appliance purchase date")[0]?.slug).toBe(
      "suburban-warranty-receipt-service-paperwork-prep",
    );
  });

  it("finds Dometic and Thetford owner-support routing pages from owner searches", () => {
    const index = buildSymptomSearchIndex(corpus);

    expect(lookupSymptomGuides(index, "dometic refrigerator recall model serial service prep")[0]?.slug).toBe(
      "dometic-refrigerator-recall-model-serial-service-prep",
    );
    expect(lookupSymptomGuides(index, "dometic product registration pnc serial invoice")[0]?.slug).toBe(
      "dometic-product-registration-paperwork-prep",
    );
    expect(lookupSymptomGuides(index, "dometic product support form rv van refrigerator air conditioner")[0]?.slug).toBe(
      "dometic-product-support-form-routing-prep",
    );
    expect(lookupSymptomGuides(index, "dometic authorized maintenance service provider locator")[0]?.slug).toBe(
      "dometic-authorized-maintenance-service-finder-prep",
    );
    expect(lookupSymptomGuides(index, "dometic warranty dealer form traveling service")[0]?.slug).toBe(
      "dometic-warranty-claim-dealer-paperwork-prep",
    );
    expect(lookupSymptomGuides(index, "dometic 310 toilet winterizing cleaning flush behavior")[0]?.slug).toBe(
      "dometic-300-310-320-toilet-cleaning-winterizing-prep",
    );
    expect(lookupSymptomGuides(index, "thetford warranty registration norcold refrigerator serial purchase vin")[0]?.slug).toBe(
      "thetford-norcold-warranty-registration-paperwork-prep",
    );
    expect(lookupSymptomGuides(index, "thetford support product finder norcold cassette rv sanitation")[0]?.slug).toBe(
      "thetford-norcold-support-product-finder-routing-prep",
    );
    expect(lookupSymptomGuides(index, "thetford toilet serial")[0]?.slug).toBe(
      "thetford-rv-toilet-serial-model-label-service-prep",
    );
    expect(lookupSymptomGuides(index, "thetford toilet serial model")[0]?.slug).toBe(
      "thetford-rv-toilet-serial-model-label-service-prep",
    );
  });

  it("finds Coleman-Mach Wi-Fi thermostat and 48000 heat-pump symptom pages from owner searches", () => {
    const index = buildSymptomSearchIndex(corpus);

    expect(lookupSymptomGuides(index, "coleman mach wifi thermostat 2.4ghz smart life tuya app not connecting")[0]?.slug).toBe(
      "coleman-mach-wifi-thermostat-2-4ghz-app-connection",
    );
    expect(lookupSymptomGuides(index, "coleman mach wifi thermostat compatibility 12vdc analog bluetooth upgrade")[0]?.slug).toBe(
      "coleman-mach-wifi-thermostat-compatibility-upgrade-check",
    );
    expect(lookupSymptomGuides(index, "coleman mach wifi thermostat eco comfort scheduling modes fan speed")[0]?.slug).toBe(
      "coleman-mach-wifi-thermostat-eco-comfort-schedule-mode",
    );
    expect(lookupSymptomGuides(index, "coleman mach 48000 heat pump high pressure switch lockout dirty filters")[0]?.slug).toBe(
      "coleman-mach-48000-heat-pump-high-pressure-lockout",
    );
  });

  it("finds Coleman-Mach 48000 AC owner-manual and 2025 catalog support pages from owner searches", () => {
    const index = buildSymptomSearchIndex(corpus);

    expect(lookupSymptomGuides(index, "coleman mach 48000 ac cool night below 75 evaporator coil iced up high fan")[0]?.slug).toBe(
      "coleman-mach-48000-ac-cool-night-evaporator-ice-up",
    );
    expect(lookupSymptomGuides(index, "coleman mach 48000 air conditioner short cycle breaker trips wait 2 minutes")[0]?.slug).toBe(
      "coleman-mach-48000-ac-short-cycle-breaker-trip",
    );
    expect(lookupSymptomGuides(index, "coleman mach 48000 elect-a-heat not enough heat chill chaser not furnace")[0]?.slug).toBe(
      "coleman-mach-48000-elect-a-heat-not-furnace",
    );
    expect(lookupSymptomGuides(index, "coleman mach 2025 amcat catalog shroud filter soft start part lookup")[0]?.slug).toBe(
      "coleman-mach-2025-amcat-part-model-lookup",
    );
  });

  it("finds Lippert leveling and slide symptom support pages from owner searches", () => {
    const index = buildSymptomSearchIndex(corpus);

    expect(lookupSymptomGuides(index, "lippert ground control low voltage battery under load")[0]?.slug).toBe(
      "lippert-ground-control-low-voltage-battery-leveling",
    );
    expect(lookupSymptomGuides(index, "lippert ground control auto level fail out of stroke relocate trailer")[0]?.slug).toBe(
      "lippert-ground-control-auto-level-excess-angle-out-of-stroke",
    );
    expect(lookupSymptomGuides(index, "lippert in wall slide obstruction synchronize motors hold switch")[0]?.slug).toBe(
      "lippert-in-wall-slide-obstruction-or-motor-sync",
    );
    expect(lookupSymptomGuides(index, "lippert in wall slide red led green led low battery motor 1")[0]?.slug).toBe(
      "lippert-in-wall-slide-red-green-led-low-voltage-service",
    );
  });

  it("ranks exact multi-word display codes ahead of generic partial matches", () => {
    const index = buildSearchIndex(corpus);

    expect(lookupEntries(index, "lippert onecontrol low voltage")[0]?.slug).toBe(
      "lippert-ground-control-onecontrol-5th-low-voltage",
    );
    expect(lookupEntries(index, "furrion french door e1 ov alm")[0]?.slug).toBe(
      "furrion-french-door-refrigerator-e1-ov-alm",
    );
    expect(lookupEntries(index, "furrion 10.6 e3 compressor")[0]?.slug).toBe("furrion-10-6-refrigerator-e3");
    expect(lookupEntries(index, "furrion 15 fd")[0]?.slug).toBe("furrion-15-refrigerator-fd");
    expect(lookupEntries(index, "furrion 15 refrigerator rs")[0]?.slug).toBe("furrion-15-refrigerator-rs");
    expect(lookupEntries(index, "furrion arctic diagnostic led flash 5")[0]?.slug).toBe(
      "furrion-arctic-refrigerator-diagnostic-led-flash-5",
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
    expect(lookupEntries(index, "dometic rm10 display fault 07 level refrigerator reset")[0]?.slug).toBe(
      "dometic-rm10-display-fault-07-level-refrigerator-reset",
    );
    expect(lookupEntries(index, "dometic rmd10 fault 14 insert new batteries reset")[0]?.slug).toBe(
      "dometic-rm10-display-fault-14-battery-pack-low-reset",
    );
    expect(lookupEntries(index, "dometic rml10 fault 50 replace gas cylinder reset")[0]?.slug).toBe(
      "dometic-rm10-display-fault-50-gas-cylinder-reset",
    );
    expect(lookupEntries(index, "dometic rm10 fault ac power not connected voltage less 190")[0]?.slug).toBe(
      "dometic-rm10-fault-ac-power-not-connected-voltage-less-190",
    );
    expect(lookupEntries(index, "dometic rm10 fault beep door opened more than 2 minutes")[0]?.slug).toBe(
      "dometic-rm10-fault-beep-door-open-more-than-two-minutes",
    );
    expect(lookupEntries(index, "dometic rm10 fault ground contact ignition electrode")[0]?.slug).toBe(
      "dometic-rm10-fault-ground-contact-ignition-electrode",
    );
    expect(lookupEntries(index, "dometic rm8 recurring beep door parking mode")[0]?.slug).toBe(
      "dometic-rm8-recurring-beep-door-parking-mode-check",
    );
    expect(lookupEntries(index, "dometic rm8 undervoltage detection internal batteries replace")[0]?.slug).toBe(
      "dometic-rm8-undervoltage-detection-internal-batteries",
    );
    expect(lookupEntries(index, "dometic rm8 gas operation despite mains supply voltage")[0]?.slug).toBe(
      "dometic-rm8-gas-operation-despite-mains-supply-voltage",
    );
    expect(lookupEntries(index, "dometic rm8 ac power not connected voltage less 190")[0]?.slug).toBe(
      "dometic-rm8-ac-power-not-connected-voltage-less-190",
    );
    expect(lookupEntries(index, "dometic rm8 flame not ignited internal power mode reset")[0]?.slug).toBe(
      "dometic-rm8-flame-not-ignited-internal-power-mode-reset",
    );
    expect(lookupEntries(index, "dometic ruc display shows fault w10 door closed reset")[0]?.slug).toBe(
      "dometic-ruc-display-fault-w10-door-closed-reset",
    );
    expect(lookupEntries(index, "dometic ruc display shows fault w11 check battery voltage reset")[0]?.slug).toBe(
      "dometic-ruc-display-fault-w11-battery-voltage-reset",
    );
    expect(lookupEntries(index, "dometic ruc display shows fault e35 ventilation obstructed over temperature")[0]?.slug).toBe(
      "dometic-ruc-display-fault-e35-ventilation-over-temperature",
    );
    expect(lookupEntries(index, "dometic rua display shows fault 09 check battery voltage reset")[0]?.slug).toBe(
      "dometic-rua-display-fault-09-battery-voltage-reset",
    );
    expect(lookupEntries(index, "dometic rua display shows fault 10 door properly closed reset")[0]?.slug).toBe(
      "dometic-rua-display-fault-10-door-closed-reset",
    );
    expect(lookupEntries(index, "dometic rua display shows fault 50 gas bottle valves reset")[0]?.slug).toBe(
      "dometic-rua-display-fault-50-gas-bottle-valves-reset",
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

  it("includes official Dometic RUC exact fault support aliases for owner searches", () => {
    const entries = corpus.entries.filter((entry) => entry.brand === "Dometic" && entry.equipmentType === "Refrigerator");
    const codesForSource = (sourceId: string) =>
      new Set(entries.filter((entry) => entry.sourceIds.includes(sourceId)).map((entry) => entry.code));
    const supportUrls = new Map(corpus.sources.map((source) => [source.id, source.url]));

    const expected = [
      ["dometic-ruc-display-fault-w01-support", "W01", "https://support.dometic.com/en/ruc-refrigerators/Display-shows-fault-W01-9bfc"],
      ["dometic-ruc-display-fault-w02-support", "W02", "https://support.dometic.com/en/ruc-refrigerators/Display-shows-fault-W02-2b96"],
      ["dometic-ruc-display-fault-e03-support", "E03", "https://support.dometic.com/en/ruc-refrigerators/Display-shows-fault-E03-1b63"],
      ["dometic-ruc-display-fault-w04-support", "W04", "https://support.dometic.com/en/ruc-refrigerators/Display-shows-fault-W04-6478"],
      ["dometic-ruc-display-fault-w10-support", "W10", "https://support.dometic.com/en/ruc-refrigerators/Display-shows-fault-W10-8ad2"],
      ["dometic-ruc-display-fault-w11-support", "W11", "https://support.dometic.com/en/ruc-refrigerators/Display-shows-fault-W11-ce91"],
      ["dometic-ruc-display-fault-w14-support", "W14", "https://support.dometic.com/en/ruc-refrigerators/Display-shows-fault-W14-2fb1"],
      ["dometic-ruc-display-fault-w17-support", "W17", "https://support.dometic.com/en/ruc-refrigerators/Display-shows-fault-W17-f713"],
      ["dometic-ruc-display-fault-e18-support", "E18", "https://support.dometic.com/en/ruc-refrigerators/Display-shows-fault-E18-5d25"],
      ["dometic-ruc-display-fault-w19-support", "W19", "https://support.dometic.com/en/ruc-refrigerators/Display-shows-fault-W19-19db"],
      ["dometic-ruc-display-fault-w26-support", "W26", "https://support.dometic.com/en/ruc-refrigerators/Display-shows-fault-W26-5b38"],
      ["dometic-ruc-display-fault-e32-support", "E32", "https://support.dometic.com/en/ruc-refrigerators/Display-shows-fault-E32-d739"],
      ["dometic-ruc-display-fault-e33-support", "E33", "https://support.dometic.com/en/ruc-refrigerators/Display-shows-fault-E33-83b"],
      ["dometic-ruc-display-fault-e34-support", "E34", "https://support.dometic.com/en/ruc-refrigerators/Display-shows-fault-E34-f44"],
      ["dometic-ruc-display-fault-e35-support", "E35", "https://support.dometic.com/en/ruc-refrigerators/Display-shows-fault-E35-63a0"],
    ] as const;

    for (const [sourceId, code, url] of expected) {
      expect(supportUrls.get(sourceId)).toBe(url);
      expect(codesForSource(sourceId)).toEqual(new Set([`Display fault ${code}`]));
    }

    const batteryVoltage = entries.find((entry) => entry.id === "dometic-ruc-display-fault-w11-battery-voltage-reset");
    expect(batteryVoltage?.ownerSafeActions.join(" ")).toMatch(/battery voltage/i);
    expect(batteryVoltage?.ownerSafeActions.join(" ")).not.toMatch(/\bfuses?\b/i);

    const ventilation = entries.find((entry) => entry.id === "dometic-ruc-display-fault-e35-ventilation-over-temperature");
    expect(ventilation?.ownerSafeActions.join(" ")).toMatch(/ventilation/i);
    expect(ventilation?.serviceOnlyActions.join(" ")).toContain("authorized service provider");
  });

  it("includes official Dometic RUA exact fault support aliases for owner searches", () => {
    const entries = corpus.entries.filter((entry) => entry.brand === "Dometic" && entry.equipmentType === "Refrigerator");
    const codesForSource = (sourceId: string) =>
      new Set(entries.filter((entry) => entry.sourceIds.includes(sourceId)).map((entry) => entry.code));
    const supportUrls = new Map(corpus.sources.map((source) => [source.id, source.url]));

    const expected = [
      ["dometic-rua-display-fault-01-support", "01", "https://support.dometic.com/en/rua-refrigerator/Display-shows-fault-01-772a"],
      ["dometic-rua-display-fault-03-support", "03", "https://support.dometic.com/en/rua-refrigerator/Display-shows-fault-03-aee4"],
      ["dometic-rua-display-fault-05-support", "05", "https://support.dometic.com/en/rua-refrigerator/Display-shows-fault-05-1a7d"],
      ["dometic-rua-display-fault-06-support", "06", "https://support.dometic.com/en/rua-refrigerator/Display-shows-fault-06-5690"],
      ["dometic-rua-display-fault-07-support", "07", "https://support.dometic.com/en/rua-refrigerator/Display-shows-fault-07-7e50"],
      ["dometic-rua-display-fault-08-support", "08", "https://support.dometic.com/en/rua-refrigerator/Display-shows-fault-08-dfdf"],
      ["dometic-rua-display-fault-09-support", "09", "https://support.dometic.com/en/rua-refrigerator/Display-shows-fault-09-56e8"],
      ["dometic-rua-display-fault-10-support", "10", "https://support.dometic.com/en/rua-refrigerator/Display-shows-fault-10-95ac"],
      ["dometic-rua-display-fault-11-support", "11", "https://support.dometic.com/en/rua-refrigerator/Display-shows-fault-11-6ff6"],
      ["dometic-rua-display-fault-12-support", "12", "https://support.dometic.com/en/rua-refrigerator/Display-shows-fault-12-36a8"],
      ["dometic-rua-display-fault-13-support", "13", "https://support.dometic.com/en/rua-refrigerator/Display-shows-fault-13-c2c6"],
      ["dometic-rua-display-fault-14-support", "14", "https://support.dometic.com/en/rua-refrigerator/Display-shows-fault-14-dbbf"],
      ["dometic-rua-display-fault-15-support", "15", "https://support.dometic.com/en/rua-refrigerator/Display-shows-fault-15-dd71"],
      ["dometic-rua-display-fault-16-support", "16", "https://support.dometic.com/en/rua-refrigerator/Display-shows-fault-16-8b5d"],
      ["dometic-rua-display-fault-17-support", "17", "https://support.dometic.com/en/rua-refrigerator/Display-shows-fault-17-47c4"],
      ["dometic-rua-display-fault-18-support", "18", "https://support.dometic.com/en/rua-refrigerator/Display-shows-fault-18-a0fa"],
      ["dometic-rua-display-fault-22-support", "22", "https://support.dometic.com/en/rua-refrigerator/Display-shows-fault-22-af2a"],
      ["dometic-rua-display-fault-24-support", "24", "https://support.dometic.com/en/rua-refrigerator/Display-shows-fault-24-6a43"],
      ["dometic-rua-display-fault-50-support", "50", "https://support.dometic.com/en/rua-refrigerator/Display-shows-fault-50-75f7"],
      ["dometic-rua-display-fault-51-support", "51", "https://support.dometic.com/en/rua-refrigerator/Display-shows-fault-51-db53"],
      ["dometic-rua-display-fault-52-support", "52", "https://support.dometic.com/en/rua-refrigerator/Display-shows-fault-52-3c34"],
      ["dometic-rua-display-fault-53-support", "53", "https://support.dometic.com/en/rua-refrigerator/Display-shows-fault-53-c7a3"],
    ] as const;

    for (const [sourceId, code, url] of expected) {
      expect(supportUrls.get(sourceId)).toBe(url);
      expect(codesForSource(sourceId)).toEqual(new Set([`Display fault ${code}`]));
    }

    const batteryVoltage = entries.find((entry) => entry.id === "dometic-rua-display-fault-09-battery-voltage-reset");
    expect(batteryVoltage?.ownerSafeActions.join(" ")).toMatch(/battery voltage/i);
    expect(batteryVoltage?.ownerSafeActions.join(" ")).not.toMatch(/\b(fuses?|wiring)\b/i);

    const acSupply = entries.find((entry) => entry.id === "dometic-rua-display-fault-05-ac-supply-reset");
    expect(acSupply?.ownerSafeActions.join(" ")).toMatch(/AC supply/i);
    expect(acSupply?.ownerSafeActions.join(" ")).not.toMatch(/\b(breakers?|wiring|voltage testing)\b/i);

    const doorClosed = entries.find((entry) => entry.id === "dometic-rua-display-fault-10-door-closed-reset");
    expect(doorClosed?.ownerSafeActions.join(" ")).toMatch(/door/i);

    const gasSupply = entries.find((entry) => entry.id === "dometic-rua-display-fault-50-gas-bottle-valves-reset");
    expect(gasSupply?.ownerSafeActions.join(" ")).toMatch(/gas bottle/i);
    expect(gasSupply?.ownerSafeActions.join(" ")).toMatch(/gas valve/i);
    expect(gasSupply?.ownerSafeActions.join(" ")).not.toMatch(/\b(burner|regulator|flue|orifice|wiring)\b/i);
    expect(gasSupply?.serviceOnlyActions.join(" ")).toMatch(/LP hardware/i);
  });

  it("includes the full official Dometic CCC2 thermostat LCD error-code set", () => {
    const ccc2Codes = new Set(
      corpus.entries
        .filter((entry) => entry.brand === "Dometic" && entry.sourceIds.includes("dometic-ccc2-operating"))
        .map((entry) => entry.code),
    );

    expect(ccc2Codes).toEqual(new Set(["E1", "E2", "E3", "E4", "E5", "E7", "E8", "E9"]));
  });

  it("includes the official Dometic Single Zone LCD thermostat E1-E5 table with owner-safe boundaries", () => {
    const sourceId = "dometic-single-zone-lcd-thermostat-operating";
    const source = corpus.sources.find((item) => item.id === sourceId);
    const entries = corpus.entries.filter((entry) => entry.sourceIds.includes(sourceId));

    expect(source).toMatchObject({
      brand: "Dometic",
      official: true,
      type: "manufacturer-manual",
      url: "https://media.dometic.com/externalassets/ct-single-zone-thermostat_9108853315_55910.pdf",
    });
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(entries.map((entry) => entry.code).sort()).toEqual(["E1", "E2", "E3", "E4", "E5"]);

    for (const entry of entries) {
      expect(entry.modelFamilies).toEqual(["Single Zone LCD thermostat", "3313192", "3313193", "3313194"]);
      expect(entry.ownerSafeActions.join(" ")).not.toMatch(
        /\b(control board|module board|120\s*V|12\s*V|fuse|breaker|wiring|wire|probe|bypass|jump|open)\b/i,
      );
      expect(entry.serviceOnlyActions.join(" ")).toMatch(/qualified RV HVAC service/i);
      expect(entry.safetyBoundary).toMatch(/qualified RV HVAC service/i);
    }

    expect(entries.find((entry) => entry.code === "E1")?.plainMeaning).toMatch(/cycles between E1 and the previous mode/i);
    expect(entries.find((entry) => entry.code === "E2")?.plainMeaning).toMatch(/Open circuit|Indoor Temperature Sensor/i);
    expect(entries.find((entry) => entry.code === "E3")?.plainMeaning).toMatch(/Shorted Indoor Temperature Sensor/i);
    expect(entries.find((entry) => entry.code === "E4")?.plainMeaning).toMatch(/Outdoor Temperature Sensor|Heat Pump/i);
    expect(entries.find((entry) => entry.code === "E5")?.plainMeaning).toMatch(/Freeze Sensor|Air conditioner mode/i);
  });

  it("includes the official Dometic FreshJet FJX P/E display-code table with owner-safe boundaries", () => {
    const sourceId = "dometic-freshjet-fjx-operating";
    const source = corpus.sources.find((item) => item.id === sourceId);
    const entries = corpus.entries.filter((entry) => entry.sourceIds.includes(sourceId));
    const entryByCode = new Map(entries.map((entry) => [entry.code, entry]));

    expect(source).toMatchObject({
      brand: "Dometic",
      official: true,
      type: "manufacturer-manual",
      url: "https://media.dometic.com/externalassets/dometic-freshjet-fjx7-3000_9620001685_123479.pdf",
    });
    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(new Set(entries.map((entry) => entry.code))).toEqual(
      new Set(["P0", "P1", "P2", "P3", "P4", "P5", "P6", "P7", "P9", "E0", "E1", "E2", "E3", "E7", "E8", "E9", "EA", "EE", "EL"]),
    );

    for (const entry of entries) {
      expect(entry.modelFamilies).toEqual(["FreshJet Series 4", "FreshJet Series 7", "FJX4333EEH", "FJX7333IHP"]);
      expect(entry.ownerSafeActions.join(" "), entry.id).not.toMatch(
        /\b(120\s*V|refrigerant|probe|bypass|open|fuse|wiring|wire|control board|module board|remove cover|rooftop)\b/i,
      );
      expect(entry.serviceOnlyActions.join(" "), entry.id).toMatch(/authorized Dometic service|qualified RV HVAC/i);
      expect(entry.safetyBoundary, entry.id).toMatch(/authorized Dometic service|qualified RV HVAC/i);
    }

    expect(entryByCode.get("P0")?.plainMeaning).toMatch(/over temperature|over current|IPM module/i);
    expect(entryByCode.get("P1")?.plainMeaning).toMatch(/under voltage protection/i);
    expect(entryByCode.get("P1")?.ownerSafeActions.join(" ")).toMatch(/campsite management|sufficient/i);
    expect(entryByCode.get("P3")?.plainMeaning).toMatch(/overvoltage protection/i);
    expect(entryByCode.get("P3")?.ownerSafeActions.join(" ")).toMatch(/campsite management|sufficient/i);
    expect(entryByCode.get("P9")?.plainMeaning).toMatch(/compressor drive abnormal|compressor does not start/i);
    expect(entryByCode.get("E0")?.plainMeaning).toMatch(/communication failure/i);
    expect(entryByCode.get("E9")?.plainMeaning).toMatch(/compressor drive|IPM module/i);
    expect(entryByCode.get("E9")?.ownerSafeActions.join(" ")).toMatch(/campsite management|sufficient/i);
    expect(entryByCode.get("EL")?.plainMeaning).toMatch(/LIN-BUS|CI-BUS|communication/i);
  });

  it("adds official Dometic CCC2 thermostat symptom pages without inventing code entries or unsafe owner steps", () => {
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const sourceId = "dometic-ccc2-operating";
    const expectedSymptomIds = [
      "dometic-ccc2-fan-only-no-cooling-mode-zone",
      "dometic-ccc2-hourglass-compressor-delay",
      "dometic-ccc2-heat-pump-defrost-auxiliary-heat",
      "dometic-ccc2-filter-icon-clean-reset",
      "dometic-ccc2-hot-weather-cooling-performance",
    ];

    expect(corpus.sources.find((source) => source.id === sourceId)?.official).toBe(true);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(
      corpus.entries
        .filter((entry) => entry.sourceIds.includes(sourceId))
        .map((entry) => entry.code)
        .sort(),
    ).toEqual(["E1", "E2", "E3", "E4", "E5", "E7", "E8", "E9"]);

    for (const symptomId of expectedSymptomIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds).toEqual([sourceId]);
      expect(symptom?.safeChecklist.join(" "), symptomId).not.toMatch(
        /\bDIP\b|dip switch|control board|module board|120\s*Vac|120\s*VAC|12\s*Vdc|fuse|breaker|wiring|wire|rooftop|compressor relay|refrigerant|probe|bypass|generator start|load shed/i,
      );
    }

    expect(symptomById.get("dometic-ccc2-fan-only-no-cooling-mode-zone")?.summary).toMatch(/FAN mode|COOL mode|zone|setpoint/i);
    expect(symptomById.get("dometic-ccc2-hourglass-compressor-delay")?.summary).toMatch(/2 minutes|hour.?glass/i);
    expect(symptomById.get("dometic-ccc2-heat-pump-defrost-auxiliary-heat")?.summary).toMatch(/Defrost|30|35|42|auxiliary heat/i);
    expect(symptomById.get("dometic-ccc2-filter-icon-clean-reset")?.summary).toMatch(/1000|filter icon|INSIDE TEMP/i);
    expect(symptomById.get("dometic-ccc2-hot-weather-cooling-performance")?.summary).toMatch(/shade|windows|HIGH FAN|morning/i);

    expect(symptomById.get("thermostat-delay-or-no-response")?.sourceIds).toContain(sourceId);
    expect(symptomById.get("air-conditioner-not-cooling")?.sourceIds).toContain(sourceId);
    expect(symptomById.get("airflow-or-venting")?.sourceIds).toContain(sourceId);
  });

  it("adds official Dometic Single Zone LCD thermostat symptom pages without unsafe owner steps", () => {
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const sourceId = "dometic-single-zone-lcd-thermostat-operating";
    const expectedSymptomIds = [
      "dometic-single-zone-auto-fan-speed-cycling",
      "dometic-single-zone-compressor-time-delay",
      "dometic-single-zone-heat-pump-defrost-cold-air",
      "dometic-single-zone-low-ambient-heat-pump-lockout",
      "dometic-single-zone-hot-weather-filter-maintenance",
    ];

    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);

    for (const symptomId of expectedSymptomIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds).toEqual([sourceId]);
      expect(symptom?.safeChecklist.join(" "), symptomId).not.toMatch(
        /\b(control board|module board|120\s*V|12\s*V|fuse|breaker|wiring|wire|probe|bypass|jump|refrigerant|open)\b/i,
      );
    }

    expect(symptomById.get("dometic-single-zone-auto-fan-speed-cycling")?.summary).toMatch(/HIGH|LOW|5|4/i);
    expect(symptomById.get("dometic-single-zone-compressor-time-delay")?.summary).toMatch(/two minutes|cooling|heat pump/i);
    expect(symptomById.get("dometic-single-zone-heat-pump-defrost-cold-air")?.summary).toMatch(/25 minutes|42|30|cold air/i);
    expect(symptomById.get("dometic-single-zone-low-ambient-heat-pump-lockout")?.summary).toMatch(/below 30|lock out/i);
    expect(symptomById.get("dometic-single-zone-hot-weather-filter-maintenance")?.summary).toMatch(/2 weeks|High Fan|shade/i);

    expect(symptomById.get("thermostat-communication")?.sourceIds).toContain(sourceId);
    expect(symptomById.get("thermostat-display")?.sourceIds).toContain(sourceId);
    expect(symptomById.get("thermostat-delay-or-no-response")?.sourceIds).toContain(sourceId);
    expect(symptomById.get("air-conditioner-not-cooling")?.sourceIds).toContain(sourceId);
    expect(symptomById.get("airflow-or-venting")?.sourceIds).toContain(sourceId);
  });

  it("includes the official Dometic Bluetooth CT thermostat E1-E5 table with owner-safe boundaries", () => {
    const sourceId = "dometic-bluetooth-ct-thermostat-operating";
    const source = corpus.sources.find((item) => item.id === sourceId);
    const entries = corpus.entries.filter((entry) => entry.sourceIds.includes(sourceId));

    expect(source).toMatchObject({
      brand: "Dometic",
      official: true,
      type: "manufacturer-manual",
      url: "https://media.dometic.com/externalassets/bluetooth-thermostat_9108887112_64643.pdf",
    });
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(entries.map((entry) => entry.code).sort()).toEqual(["E1", "E2", "E3", "E4", "E5"]);

    for (const entry of entries) {
      expect(entry.modelFamilies).toEqual(["Bluetooth CT thermostat", "Capacitive Touch thermostat", "3316420.XXX"]);
      expect(entry.ownerSafeActions.join(" "), entry.id).not.toMatch(
        /\b(control board|module board|120\s*V|12\s*V|fuse|breaker|wiring|wire|probe|bypass|jump|open)\b/i,
      );
      expect(entry.serviceOnlyActions.join(" "), entry.id).toMatch(/qualified RV HVAC service|authorized Dometic service/i);
      expect(entry.safetyBoundary, entry.id).toMatch(/qualified RV HVAC service|authorized Dometic service/i);
    }

    expect(entries.find((entry) => entry.code === "E1")?.plainMeaning).toMatch(/cycles between E1 and the previous mode/i);
    expect(entries.find((entry) => entry.code === "E2")?.plainMeaning).toMatch(/open circuit|Indoor Temperature Sensor/i);
    expect(entries.find((entry) => entry.code === "E3")?.plainMeaning).toMatch(/Shorted Indoor Temperature Sensor/i);
    expect(entries.find((entry) => entry.code === "E4")?.plainMeaning).toMatch(/Outdoor Temperature Sensor|Heat Pump/i);
    expect(entries.find((entry) => entry.code === "E5")?.plainMeaning).toMatch(/Freeze Sensor|Air Conditioner mode/i);
  });

  it("adds official Dometic Bluetooth CT thermostat symptom pages without unsafe owner steps", () => {
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const pdfSourceId = "dometic-bluetooth-ct-thermostat-operating";
    const supportSourceIds = [
      "dometic-capacitive-touch-mode-selection",
      "dometic-capacitive-touch-inside-temperature",
      "dometic-brisk-ac-heat-gain",
      "dometic-brisk-ac-filter-efficiency",
      "dometic-brisk-ac-frost-heating",
    ];
    const expectedSymptomIds = [
      "dometic-bluetooth-ct-pairing-mobile-device",
      "dometic-bluetooth-ct-lost-pairs-factory-reset",
      "dometic-bluetooth-ct-touch-display-inside-temperature",
      "dometic-bluetooth-ct-auto-fan-furnace-fan",
      "dometic-bluetooth-ct-compressor-time-delay",
      "dometic-bluetooth-ct-heat-pump-defrost-cold-air",
      "dometic-bluetooth-ct-low-ambient-heat-pump-lockout",
      "dometic-bluetooth-ct-hot-weather-filter-maintenance",
    ];

    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    for (const sourceId of [pdfSourceId, ...supportSourceIds]) {
      expect(corpus.sources.find((source) => source.id === sourceId), sourceId).toMatchObject({
        brand: "Dometic",
        official: true,
      });
    }

    for (const symptomId of expectedSymptomIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds).toContain(pdfSourceId);
      expect(symptom?.safeChecklist.join(" "), symptomId).not.toMatch(
        /\b(control board|module board|120\s*V|12\s*V|fuse|breaker|wiring|wire|probe|bypass|jump|refrigerant|open)\b/i,
      );
    }

    expect(symptomById.get("dometic-bluetooth-ct-pairing-mobile-device")?.summary).toMatch(/3 feet|2-digit|15 seconds/i);
    expect(symptomById.get("dometic-bluetooth-ct-lost-pairs-factory-reset")?.summary).toMatch(/factory reset|four most recent/i);
    expect(symptomById.get("dometic-bluetooth-ct-touch-display-inside-temperature")?.summary).toMatch(/Off Mode|skin contact|wet fingers/i);
    expect(symptomById.get("dometic-bluetooth-ct-auto-fan-furnace-fan")?.summary).toMatch(/Auto|Low|High|Furnace/i);
    expect(symptomById.get("dometic-bluetooth-ct-compressor-time-delay")?.summary).toMatch(/2 minutes|cooling|heat pump/i);
    expect(symptomById.get("dometic-bluetooth-ct-heat-pump-defrost-cold-air")?.summary).toMatch(/25 minutes|42|30|normal/i);
    expect(symptomById.get("dometic-bluetooth-ct-low-ambient-heat-pump-lockout")?.summary).toMatch(/below 30|lock out/i);
    expect(symptomById.get("dometic-bluetooth-ct-hot-weather-filter-maintenance")?.summary).toMatch(/2 weeks|heat gain|shade/i);
    expect(symptomById.get("dometic-bluetooth-ct-heat-pump-defrost-cold-air")?.sourceIds).toContain(
      "dometic-brisk-ac-frost-heating",
    );
    expect(symptomById.get("dometic-bluetooth-ct-low-ambient-heat-pump-lockout")?.sourceIds).toEqual([
      pdfSourceId,
    ]);
    expect(symptomById.get("dometic-bluetooth-ct-hot-weather-filter-maintenance")?.sourceIds).toEqual([
      pdfSourceId,
      "dometic-brisk-ac-heat-gain",
    ]);
    expect(symptomById.get("dometic-bluetooth-ct-hot-weather-filter-maintenance")?.sourceIds).not.toContain(
      "dometic-brisk-ac-filter-efficiency",
    );

    expect(symptomById.get("thermostat-communication")?.sourceIds).toContain(pdfSourceId);
    expect(symptomById.get("thermostat-display")?.sourceIds).toContain(pdfSourceId);
    expect(symptomById.get("thermostat-delay-or-no-response")?.sourceIds).toContain(pdfSourceId);
    expect(symptomById.get("air-conditioner-not-cooling")?.sourceIds).toContain(pdfSourceId);
    expect(symptomById.get("airflow-or-venting")?.sourceIds).toContain(pdfSourceId);
  });

  it("adds official Dometic FreshJet FJX symptom pages without unsafe owner steps", () => {
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const sourceId = "dometic-freshjet-fjx-operating";
    const expectedSymptomIds = [
      "dometic-freshjet-fjx-not-cooling-temperature-limits",
      "dometic-freshjet-fjx-not-heating-temperature-limits",
      "dometic-freshjet-fjx-low-air-output-filter-vents",
      "dometic-freshjet-fjx-water-enters-vehicle-drainage",
      "dometic-freshjet-fjx-icing-sensor-switches-off",
      "dometic-freshjet-fjx-voltage-protection-campsite-power",
    ];

    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);

    for (const symptomId of expectedSymptomIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds).toEqual([sourceId]);
      expect(symptom?.safeChecklist.join(" "), symptomId).not.toMatch(
        /\b(120\s*V|refrigerant|probe|bypass|open|fuse|wiring|wire|control board|module board|remove cover|rooftop|compressor)\b/i,
      );
    }

    expect(symptomById.get("dometic-freshjet-fjx-not-cooling-temperature-limits")?.summary).toMatch(/52|16|cooling/i);
    expect(symptomById.get("dometic-freshjet-fjx-not-heating-temperature-limits")?.summary).toMatch(/-2|heating/i);
    expect(symptomById.get("dometic-freshjet-fjx-low-air-output-filter-vents")?.summary).toMatch(
      /intake|ventilation grilles|filter/i,
    );
    expect(symptomById.get("dometic-freshjet-fjx-water-enters-vehicle-drainage")?.summary).toMatch(
      /condensation|drainage/i,
    );
    expect(symptomById.get("dometic-freshjet-fjx-icing-sensor-switches-off")?.summary).toMatch(/icing sensor|nozzles/i);
    expect(symptomById.get("dometic-freshjet-fjx-voltage-protection-campsite-power")?.summary).toMatch(
      /under voltage|overvoltage|campsite/i,
    );

    expect(symptomById.get("air-conditioner-not-cooling")?.sourceIds).toContain(sourceId);
    expect(symptomById.get("airflow-or-venting")?.sourceIds).toContain(sourceId);
    expect(symptomById.get("low-voltage")?.sourceIds).toContain(sourceId);
  });

  it("includes official Furrion electric fireplace display faults with owner-safe boundaries", () => {
    const sourceIds = ["furrion-electric-fireplace-1465w", "furrion-flat-curved-electric-fireplace"];
    const entries = corpus.entries.filter((entry) => sourceIds.some((sourceId) => entry.sourceIds.includes(sourceId)));
    const entryByCode = new Map(entries.map((entry) => [entry.code, entry]));

    expect(corpus.sources.find((source) => source.id === "furrion-electric-fireplace-1465w")).toMatchObject({
      brand: "Furrion",
      official: true,
      type: "manufacturer-manual",
      url: "https://lci-support-doc.s3.amazonaws.com/Furrion/ccd-0005575.pdf",
    });
    expect(corpus.sources.find((source) => source.id === "furrion-flat-curved-electric-fireplace")).toMatchObject({
      brand: "Furrion",
      official: true,
      type: "manufacturer-manual",
      url: "https://lci-support-doc.s3.amazonaws.com/Furrion/ccd-0005582.pdf",
    });
    expect(entries.map((entry) => entry.code).sort()).toEqual(["88", "EE"]);

    for (const entry of entries) {
      expect(entry.modelFamilies).toEqual([
        "Furrion built-in electric fireplace",
        "Furrion flat glass electric fireplace",
        "Furrion curved glass electric fireplace",
      ]);
      expect(entry.ownerSafeActions.join(" "), entry.id).not.toMatch(
        /\b(back panel|main circuit board|120\s*V|wiring|wire|probe|bypass|jump|open|remove|replace thermostat sensor)\b/i,
      );
      expect(entry.serviceOnlyActions.join(" "), entry.id).toMatch(/Lippert|Furrion|qualified RV electrical/i);
      expect(entry.safetyBoundary, entry.id).toMatch(/disconnect power|qualified RV electrical/i);
    }

    expect(entryByCode.get("EE")?.plainMeaning).toMatch(/thermostat sensor|broken|disconnected/i);
    expect(entryByCode.get("88")?.plainMeaning).toMatch(/manual reset overheat protection/i);
  });

  it("adds official Furrion fireplace and range symptom pages without unsafe owner steps", () => {
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const expectedSymptoms: Record<string, string[]> = {
      "furrion-electric-fireplace-red-led-proximity-cutoff": [
        "furrion-electric-fireplace-1465w",
        "furrion-flat-curved-electric-fireplace",
      ],
      "furrion-electric-fireplace-no-warm-air-cooldown-thermostat": [
        "furrion-electric-fireplace-1465w",
        "furrion-flat-curved-electric-fireplace",
      ],
      "furrion-electric-fireplace-remote-control-not-working": [
        "furrion-electric-fireplace-1465w",
        "furrion-flat-curved-electric-fireplace",
      ],
      "furrion-range-cooktop-burners-do-not-light-ffd": [
        "furrion-range-17-21-user-manual",
        "furrion-range-17-21-troubleshooting-service",
      ],
      "furrion-range-surface-flame-orange-halfway": [
        "furrion-range-17-21-user-manual",
        "furrion-range-17-21-troubleshooting-service",
      ],
      "furrion-range-gas-odor-carbon-monoxide-boundary": [
        "furrion-range-17-21-user-manual",
        "furrion-range-17-21-troubleshooting-service",
      ],
      "furrion-range-oven-pilot-flame-blowout-ventilation": [
        "furrion-range-17-21-user-manual",
      ],
    };

    expect(corpus.sources.find((source) => source.id === "furrion-range-17-21-user-manual")).toMatchObject({
      brand: "Furrion",
      official: true,
      type: "manufacturer-manual",
      url: "https://lci-support-doc.s3.amazonaws.com/furrion_cooking/ranges/ccd-0008141-en-fr.pdf",
    });
    expect(corpus.sources.find((source) => source.id === "furrion-range-17-21-troubleshooting-service")).toMatchObject({
      brand: "Furrion",
      official: true,
      type: "manufacturer-service-manual",
      url: "https://lci-support-doc.s3.amazonaws.com/furrion%20documentation/ranges/ccd-0008217.pdf",
    });

    for (const [symptomId, sourceIds] of Object.entries(expectedSymptoms)) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds).toEqual(sourceIds);
      expect(symptom?.safeChecklist.join(" "), symptomId).not.toMatch(
        /\b(back panel|main circuit board|pressure check|leak test|wire|wiring|orifice|gas pressure|service manual|replace|repair)\b/i,
      );
    }

    expect(symptomById.get("furrion-electric-fireplace-red-led-proximity-cutoff")?.summary).toMatch(/red LED|6 inches|proximity/i);
    expect(symptomById.get("furrion-electric-fireplace-no-warm-air-cooldown-thermostat")?.summary).toMatch(
      /30 seconds|thermostat setting|warm air/i,
    );
    expect(symptomById.get("furrion-electric-fireplace-remote-control-not-working")?.summary).toMatch(/batteries|20 feet/i);
    expect(symptomById.get("furrion-range-cooktop-burners-do-not-light-ffd")?.summary).toMatch(/FFD|5 seconds|gas supply/i);
    expect(symptomById.get("furrion-range-surface-flame-orange-halfway")?.summary).toMatch(/half way|orange|dust|salt air/i);
    expect(symptomById.get("furrion-range-gas-odor-carbon-monoxide-boundary")?.summary).toMatch(
      /smell gas|carbon monoxide|space heater/i,
    );
    expect(symptomById.get("furrion-range-oven-pilot-flame-blowout-ventilation")?.summary).toMatch(
      /pilot|five minutes|foil|ventilation/i,
    );

    expect(symptomById.get("airflow-or-venting")?.sourceIds).toContain("furrion-range-17-21-user-manual");
    expect(symptomById.get("service-call-prep")?.sourceIds).toContain("furrion-electric-fireplace-1465w");
    expect(symptomById.get("service-call-prep")?.sourceIds).toContain("furrion-range-17-21-user-manual");
  });

  it("adds official Dometic DF furnace operating-manual symptom pages without inventing code entries or unsafe owner steps", () => {
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const sourceId = "dometic-df-furnace-operating-2025";
    const expectedSymptomIds = [
      "dometic-df-furnace-blower-runs-will-not-light",
      "dometic-df-furnace-shuts-off-before-temperature-vents",
      "dometic-df-furnace-soot-exhaust-vent-carbon-monoxide",
      "dometic-df-furnace-initial-smoke-or-gas-odor",
      "dometic-df-furnace-maintenance-service-boundary",
    ];

    expect(corpus.sources.find((source) => source.id === sourceId)).toMatchObject({
      brand: "Dometic",
      official: true,
      type: "manufacturer-manual",
    });
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.entries.filter((entry) => entry.sourceIds.includes(sourceId))).toHaveLength(0);

    for (const symptomId of expectedSymptomIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds).toEqual([sourceId]);
      expect(symptom?.safeChecklist.join(" "), symptomId).not.toMatch(
        /\b(control board|circuit board|120\s*V|240\s*V|12\s*V|fuse|breaker|wiring|wire|orifice|burner|gas pressure|drop test|gas piping|leak test|battery charger|replace)\b/i,
      );
    }

    expect(symptomById.get("dometic-df-furnace-blower-runs-will-not-light")?.summary).toMatch(/blower turns on|thermostat|LPG line/i);
    expect(symptomById.get("dometic-df-furnace-shuts-off-before-temperature-vents")?.summary).toMatch(/vents|blocked|desired temperature/i);
    expect(symptomById.get("dometic-df-furnace-soot-exhaust-vent-carbon-monoxide")?.summary).toMatch(/soot|carbon monoxide|exhaust/i);
    expect(symptomById.get("dometic-df-furnace-initial-smoke-or-gas-odor")?.summary).toMatch(/5.*10 minutes|gas odor/i);
    expect(symptomById.get("dometic-df-furnace-maintenance-service-boundary")?.summary).toMatch(/monthly|annual|qualified RV service technician/i);

    expect(symptomById.get("furnace-lockout")?.sourceIds).toContain(sourceId);
    expect(symptomById.get("airflow-or-venting")?.sourceIds).toContain(sourceId);
    expect(symptomById.get("furnace-stops-before-setpoint")?.sourceIds).toContain(sourceId);
    expect(symptomById.get("service-call-prep")?.sourceIds).toContain(sourceId);
  });

  it("adds official Suburban cooking and wall-heater symptom support without inventing code entries or unsafe owner steps", () => {
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const sourceIds = [
      "suburban-range-cooktops-guide",
      "suburban-dropin-cooktop-guide",
      "suburban-griddles-guide",
      "suburban-electric-wall-heater-guide",
    ];
    const expectedSymptomIds = [
      "suburban-range-cooktop-gas-odor",
      "suburban-range-cooktop-burner-lighting-blowout",
      "suburban-range-cooktop-abnormal-flame-service",
      "suburban-range-oven-pilot-vent-carbon-monoxide",
      "suburban-griddle-ignition-grease-storage",
      "suburban-griddle-flame-venturi-service",
      "suburban-wall-heater-thermostat-high-limit-service",
    ];

    expect(corpus.sources.filter((source) => sourceIds.includes(source.id)).map((source) => source.id).sort()).toEqual(
      sourceIds.sort(),
    );
    for (const sourceId of sourceIds) {
      expect(corpus.sources.find((source) => source.id === sourceId), sourceId).toMatchObject({
        brand: "Suburban/Atwood",
        official: true,
        type: "manufacturer-manual",
      });
    }

    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => sourceIds.includes(sourceId)))).toHaveLength(0);

    for (const symptomId of expectedSymptomIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds.some((sourceId) => sourceIds.includes(sourceId)), symptomId).toBe(true);
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        /\b(control board|circuit board|240\s*V|120\s*V|wiring|wire|orifice|gas pressure|pressure test|leak test|gas piping|replace hose|replace valve|regulator replacement|disassemble|bypass|jump|repair)\b/i,
      );
    }

    expect(symptomById.get("suburban-range-cooktop-gas-odor")?.summary).toMatch(/smell gas|propane|evacuate|qualified/i);
    expect(symptomById.get("suburban-range-cooktop-burner-lighting-blowout")?.summary).toMatch(
      /air in the gas line|five|blow.?out|relight/i,
    );
    expect(symptomById.get("suburban-range-cooktop-abnormal-flame-service")?.summary).toMatch(
      /yellow|not igniting|remain alight|difficult/i,
    );
    expect(symptomById.get("suburban-range-oven-pilot-vent-carbon-monoxide")?.summary).toMatch(
      /pilot|oven vent|carbon monoxide|foil/i,
    );
    expect(symptomById.get("suburban-griddle-ignition-grease-storage")?.summary).toMatch(
      /5 seconds|5 minutes|grease|storage/i,
    );
    expect(symptomById.get("suburban-griddle-flame-venturi-service")?.summary).toMatch(/flame check|venturi|insect|valve/i);
    expect(symptomById.get("suburban-wall-heater-thermostat-high-limit-service")?.summary).toMatch(
      /switch light|thermostat|high.?limit|air inlet/i,
    );
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

  it("includes official Dometic RM10 display-fault support aliases for exact owner searches", () => {
    const codesForSource = (sourceId: string) =>
      new Set(
        corpus.entries
          .filter((entry) => entry.brand === "Dometic" && entry.sourceIds.includes(sourceId))
          .map((entry) => entry.code),
      );

    const supportUrls = new Map(corpus.sources.map((source) => [source.id, source.url]));
    expect(supportUrls.get("dometic-rm10-display-fault-01-support")).toBe(
      "https://support.dometic.com/en/rm10-refrigerators/Display-showing-fault-01-849b",
    );
    expect(supportUrls.get("dometic-rm10-display-fault-14-support")).toBe(
      "https://support.dometic.com/en/rm10-refrigerators/Display-showing-fault-14-b9b1",
    );
    expect(supportUrls.get("dometic-rm10-display-fault-53-support")).toBe(
      "https://support.dometic.com/en/rm10-refrigerators/Display-showing-fault-53-af4e",
    );

    const expectedDisplayFaults = new Set([
      "Display fault 01",
      "Display fault 02",
      "Display fault 03",
      "Display fault 05",
      "Display fault 06",
      "Display fault 07",
      "Display fault 08",
      "Display fault 09",
      "Display fault 10",
      "Display fault 11",
      "Display fault 12",
      "Display fault 13",
      "Display fault 14",
      "Display fault 50",
      "Display fault 51",
      "Display fault 52",
      "Display fault 53",
    ]);

    expect(
      new Set(
        corpus.entries
          .filter((entry) => entry.brand === "Dometic" && entry.sourceIds.some((sourceId) => sourceId.startsWith("dometic-rm10-display-fault-")))
          .map((entry) => entry.code),
      ),
    ).toEqual(expectedDisplayFaults);

    expect(codesForSource("dometic-rm10-display-fault-50-support")).toEqual(new Set(["Display fault 50"]));
    expect(codesForSource("dometic-rm10-display-fault-01-support")).toEqual(new Set(["Display fault 01"]));

    const display14 = corpus.entries.find((entry) => entry.id === "dometic-rm10-display-fault-14-battery-pack-low-reset");
    expect(display14?.modelFamilies).toEqual(
      expect.arrayContaining(["RM10.5T", "RMD10.5", "RML10.4", "RMS10.5T"]),
    );
    expect(display14?.sourceIds).toEqual(
      expect.arrayContaining([
        "dometic-rm10-display-fault-14-support",
      ]),
    );
  });

  it("includes remaining official Dometic RM10 fault support-page aliases without changing manual rows", () => {
    const codesForSource = (sourceId: string) =>
      new Set(
        corpus.entries
          .filter((entry) => entry.brand === "Dometic" && entry.sourceIds.includes(sourceId))
          .map((entry) => entry.code),
      );
    const entryById = (id: string) => {
      const entry = corpus.entries.find((candidate) => candidate.id === id);
      expect(entry, id).toBeDefined();
      return entry!;
    };

    const supportUrls = new Map(corpus.sources.map((source) => [source.id, source.url]));
    const expectedFaultPages = new Map([
      ["dometic-rm10-fault-ac-power-not-connected-low-voltage-support", "https://support.dometic.com/en/rm10-refrigerators/Fault-AC-power-not-connected-or-AC-voltage-less-190-V-8212"],
      ["dometic-rm10-fault-beep-door-open-more-than-two-minutes-support", "https://support.dometic.com/en/rm10-refrigerators/Fault-Beep-The-door-is-opened-for-more-than-2-minutes-d6c"],
      ["dometic-rm10-fault-dc-overvoltage-support", "https://support.dometic.com/en/rm10-refrigerators/Fault-DC-overvoltage-greater-16-V-bddf"],
      ["dometic-rm10-fault-dc-power-not-connected-support", "https://support.dometic.com/en/rm10-refrigerators/Fault-DC-power-not-connected-7646"],
      ["dometic-rm10-fault-defective-temperature-sensor-support", "https://support.dometic.com/en/rm10-refrigerators/Fault-Defective-temperature-sensor-in-the-refrigerator-compartment-dee0"],
      ["dometic-rm10-fault-gas-lockout-three-ignition-attempts-support", "https://support.dometic.com/en/rm10-refrigerators/Fault-Gas-lock-out-after-3-ignition-attempts-f198"],
      ["dometic-rm10-fault-gas-lockout-power-module-internal-error-support", "https://support.dometic.com/en/rm10-refrigerators/Fault-Gas-lock-out-internal-error-in-the-power-module-19a3"],
      ["dometic-rm10-fault-gas-valve-check-error-support", "https://support.dometic.com/en/rm10-refrigerators/Fault-Gas-valve-check-error-33bd"],
      ["dometic-rm10-fault-ground-contact-gas-valve-support", "https://support.dometic.com/en/rm10-refrigerators/Fault-Ground-contact-gas-valve-ed8"],
      ["dometic-rm10-fault-ground-contact-ignition-electrode-support", "https://support.dometic.com/en/rm10-refrigerators/Fault-Ground-contact-ignition-electrode-5f6f"],
      ["dometic-rm10-fault-standalone-gas-battery-packs-low-support", "https://support.dometic.com/en/rm10-refrigerators/Fault-In-stand-alone-gas-mode-The-battery-charge-of-the-battery-packs-is-too-low-1cb8"],
      ["dometic-rm10-fault-internal-communication-error-support", "https://support.dometic.com/en/rm10-refrigerators/Fault-Internal-communication-error-a666"],
      ["dometic-rm10-fault-power-module-display-no-connection-support", "https://support.dometic.com/en/rm10-refrigerators/Fault-No-connection-between-power-module-and-display-4e70"],
      ["dometic-rm10-fault-no-cooling-capacity-gas-mode-support", "https://support.dometic.com/en/rm10-refrigerators/Fault-No-cooling-capacity-in-gas-mode-3ec3"],
      ["dometic-rm10-fault-no-cooling-power-ac-mode-support", "https://support.dometic.com/en/rm10-refrigerators/Fault-No-cooling-power-in-AC-mode-91f8"],
      ["dometic-rm10-fault-no-cooling-power-dc-mode-support", "https://support.dometic.com/en/rm10-refrigerators/Fault-No-cooling-power-in-DC-mode-b53b"],
      ["dometic-rm10-fault-tank-stop-mode-gas-blocked-support", "https://support.dometic.com/en/rm10-refrigerators/Fault-Tank-stop-mode-Gas-operation-is-blocked-for-15minutes-b0cc"],
    ]);

    for (const [sourceId, url] of expectedFaultPages) {
      expect(supportUrls.get(sourceId), sourceId).toBe(url);
      expect(codesForSource(sourceId).size, sourceId).toBe(1);
    }

    expect(codesForSource("dometic-rm10-fault-ac-power-not-connected-low-voltage-support")).toEqual(
      new Set(["AC power not connected or AC voltage < 190 V"]),
    );
    expect(codesForSource("dometic-rm10-fault-beep-door-open-more-than-two-minutes-support")).toEqual(
      new Set(["Beep: door opened more than 2 minutes"]),
    );
    expect(codesForSource("dometic-rm10-fault-ground-contact-ignition-electrode-support")).toEqual(
      new Set(["Ground contact, ignition electrode"]),
    );

    const manualRows = corpus.entries.filter((entry) => entry.sourceIds.includes("dometic-rm10-rms10-operating"));
    expect(manualRows.map((entry) => entry.code)).toEqual(
      expect.arrayContaining(["W05", "W06", "W10 + beep", "W11", "E03", "E07", "E08", "E09", "E12", "E13", "E14", "E50", "E51", "E52", "E53"]),
    );

    const dcPower = entryById("dometic-rm10-fault-dc-power-not-connected");
    expect(dcPower.ownerSafeActions.join(" ")).toMatch(/different energy type/i);
    expect(dcPower.ownerSafeActions.join(" ")).not.toMatch(/\bfuse|wiring|breaker\b/i);
    expect(dcPower.serviceOnlyActions.join(" ")).toMatch(/\bfuse|wiring\b/i);

    const door = entryById("dometic-rm10-fault-beep-door-open-more-than-two-minutes");
    expect(door.ownerSafeActions.join(" ")).toMatch(/door.*closed/i);
    expect(door.ownerSafeActions.join(" ")).toMatch(/winter/i);

    const sensor = entryById("dometic-rm10-fault-defective-temperature-sensor-service-only");
    expect(sensor.ownerSafeActions.join(" ")).toMatch(/authorized repair/i);
    expect(sensor.ownerSafeActions.join(" ")).not.toMatch(/sensor.*replace|wiring/i);

    const gasValve = entryById("dometic-rm10-fault-ground-contact-gas-valve");
    expect(gasValve.ownerSafeActions.join(" ")).not.toMatch(/gas valve|burner|regulator|flue|wiring/i);
    expect(gasValve.serviceOnlyActions.join(" ")).toMatch(/gas valve|LP hardware|wiring/i);

    expect([...supportUrls.values()]).not.toContain(
      "https://support.dometic.com/en/rm10-refrigerators/My-refrigerator-shows-a-fault-or-a-failure-bfb3",
    );
  });

  it("adds official Dometic RM10 symptom support pages without inventing code entries", () => {
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const supportUrls = new Map(corpus.sources.map((source) => [source.id, source.url]));
    const symptomOnlySourceIds = [
      "dometic-rm10-gas-operation-mains-supply-voltage-support",
      "dometic-rm10-internal-batteries-change-support",
      "dometic-rm10-defrost-refrigerator-support",
      "dometic-rm10-door-ice-compartment-will-not-close-support",
      "dometic-rm10-smell-ammonia-support",
      "dometic-rm10-smell-gas-support",
      "dometic-rm10-smell-melting-plastic-support",
      "dometic-rm10-not-cooling-sufficiently-support",
      "dometic-rm10-not-working-at-all-level-support",
      "dometic-rm10-clean-refrigerator-drain-vents-support",
      "dometic-rm10-low-outside-temperature-winter-cover-support",
      "dometic-rm10-evaporator-fast-ice-buildup-support",
      "dometic-rm10-evaporator-full-of-ice-support",
      "dometic-rm10-door-ice-compartment-detached-support",
      "dometic-rm10-first-gas-run-strange-smell-support",
      "dometic-rm10-when-to-defrost-support",
    ];

    const expectedSymptomPages = new Map([
      ["dometic-rm10-gas-operation-mains-supply-voltage-support", "https://support.dometic.com/en/rm10-refrigerators/Gas-operation-despite-connection-to-the-mains-supply-voltage-f9b4"],
      ["dometic-rm10-internal-batteries-change-support", "https://support.dometic.com/en/rm10-refrigerators/How-to-change-the-internal-batteries-batteries-that-power-the-electronics-f8d9"],
      ["dometic-rm10-defrost-refrigerator-support", "https://support.dometic.com/en/rm10-refrigerators/How-to-defrost-the-refrigerator-856"],
      ["dometic-rm10-door-ice-compartment-will-not-close-support", "https://support.dometic.com/en/rm10-refrigerators/I-can-not-close-the-refrigerator-doorice-compartment-door-d6d5"],
      ["dometic-rm10-smell-ammonia-support", "https://support.dometic.com/en/rm10-refrigerators/I-smell-ammonia-b0ef"],
      ["dometic-rm10-smell-gas-support", "https://support.dometic.com/en/rm10-refrigerators/I-smell-gas-6795"],
      ["dometic-rm10-smell-melting-plastic-support", "https://support.dometic.com/en/rm10-refrigerators/I-smell-melting-plastic-ce75"],
      ["dometic-rm10-not-cooling-sufficiently-support", "https://support.dometic.com/en/rm10-refrigerators/My-refrigerator-is-not-cooling-sufficiently-254e"],
      ["dometic-rm10-not-working-at-all-level-support", "https://support.dometic.com/en/rm10-refrigerators/My-refrigerator-is-not-working-at-all-feec"],
      ["dometic-rm10-clean-refrigerator-drain-vents-support", "https://support.dometic.com/en/rm10-refrigerators/How-to-clean-the-refrigerator-3658"],
      ["dometic-rm10-low-outside-temperature-winter-cover-support", "https://support.dometic.com/en/rm10-refrigerators/How-to-operate-the-refrigerator-during-low-outside-temperatures-1039"],
      ["dometic-rm10-evaporator-fast-ice-buildup-support", "https://support.dometic.com/en/rm10-refrigerators/The-evaporator-fills-up-with-ice-much-faster-than-before-e5e4"],
      ["dometic-rm10-evaporator-full-of-ice-support", "https://support.dometic.com/en/rm10-refrigerators/The-evaporator-is-full-of-ice-b795"],
      ["dometic-rm10-door-ice-compartment-detached-support", "https://support.dometic.com/en/rm10-refrigerators/The-refrigerator-doorice-compartment-door-has-completely-detached-from-the-device-1656"],
      ["dometic-rm10-first-gas-run-strange-smell-support", "https://support.dometic.com/en/rm10-refrigerators/There-is-a-strange-smell-the-first-time-I-run-the-refrigerator-on-gas-8d49"],
      ["dometic-rm10-when-to-defrost-support", "https://support.dometic.com/en/rm10-refrigerators/When-should-I-defrost-the-refrigerator-e4bb"],
    ]);

    for (const [sourceId, url] of expectedSymptomPages) {
      expect(supportUrls.get(sourceId), sourceId).toBe(url);
    }

    expect(corpus.sources.filter((source) => symptomOnlySourceIds.includes(source.id))).toHaveLength(
      symptomOnlySourceIds.length,
    );
    const rm10SupportUrls = corpus.sources
      .filter((source) => source.url.includes("support.dometic.com/en/rm10-refrigerators/"))
      .map((source) => source.url);
    expect(new Set(rm10SupportUrls).size).toBe(rm10SupportUrls.length);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => symptomOnlySourceIds.includes(sourceId)))).toHaveLength(0);

    expect(symptomById.get("dometic-rm10-gas-operation-mains-supply")?.sourceIds).toContain(
      "dometic-rm10-gas-operation-mains-supply-voltage-support",
    );
    expect(symptomById.get("dometic-rm10-cooling-or-level")?.sourceIds).toEqual(
      expect.arrayContaining(["dometic-rm10-not-cooling-sufficiently-support", "dometic-rm10-not-working-at-all-level-support"]),
    );
    expect(symptomById.get("dometic-rm10-gas-smell")?.sourceIds).toContain("dometic-rm10-smell-gas-support");
    expect(symptomById.get("dometic-rm10-ammonia-smell")?.sourceIds).toContain("dometic-rm10-smell-ammonia-support");
    expect(symptomById.get("dometic-rm10-new-gas-run-plastic-smell")?.sourceIds).toEqual(
      expect.arrayContaining(["dometic-rm10-smell-melting-plastic-support", "dometic-rm10-first-gas-run-strange-smell-support"]),
    );
    expect(symptomById.get("dometic-rm10-cleaning-drain-vent-maintenance")?.sourceIds).toContain(
      "dometic-rm10-clean-refrigerator-drain-vents-support",
    );
    expect(symptomById.get("dometic-rm10-low-outside-temperature-winter-covers")?.sourceIds).toContain(
      "dometic-rm10-low-outside-temperature-winter-cover-support",
    );
    expect(symptomById.get("dometic-rm10-door-ice-compartment")?.sourceIds).toEqual(
      expect.arrayContaining([
        "dometic-rm10-door-ice-compartment-will-not-close-support",
        "dometic-rm10-door-ice-compartment-detached-support",
      ]),
    );
    expect(symptomById.get("dometic-rm10-defrost-evaporator-ice")?.sourceIds).toEqual(
      expect.arrayContaining([
        "dometic-rm10-defrost-refrigerator-support",
        "dometic-rm10-when-to-defrost-support",
        "dometic-rm10-evaporator-full-of-ice-support",
        "dometic-rm10-evaporator-fast-ice-buildup-support",
      ]),
    );
    expect(symptomById.get("dometic-rm10-internal-battery-packs")?.sourceIds).toContain(
      "dometic-rm10-internal-batteries-change-support",
    );

    expect(symptomById.get("dometic-rm10-gas-smell")?.safeChecklist.join(" ")).toMatch(/do not operate electrical equipment/i);
    expect(symptomById.get("dometic-rm10-ammonia-smell")?.safeChecklist.join(" ")).toMatch(/switch off/i);
    expect(symptomById.get("dometic-rm10-defrost-evaporator-ice")?.safeChecklist.join(" ")).toMatch(/mechanical tools|hair dryer/i);

    const newSymptomIds = [
      "dometic-rm10-gas-operation-mains-supply",
      "dometic-rm10-cooling-or-level",
      "dometic-rm10-gas-smell",
      "dometic-rm10-ammonia-smell",
      "dometic-rm10-new-gas-run-plastic-smell",
      "dometic-rm10-cleaning-drain-vent-maintenance",
      "dometic-rm10-low-outside-temperature-winter-covers",
      "dometic-rm10-door-ice-compartment",
      "dometic-rm10-defrost-evaporator-ice",
      "dometic-rm10-internal-battery-packs",
    ];
    for (const symptomId of newSymptomIds) {
      expect(symptomById.get(symptomId)?.safeChecklist.join(" "), symptomId).not.toMatch(
        /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\brefrigerant\b|\bprobe\b|\bopen (the )?(fuel|gas|electrical|rooftop)/i,
      );
    }

    expect(symptomById.get("refrigerator-not-cooling")?.sourceIds).toEqual(
      expect.arrayContaining([
        "dometic-rm10-not-cooling-sufficiently-support",
        "dometic-rm10-not-working-at-all-level-support",
        "dometic-rm10-clean-refrigerator-drain-vents-support",
        "dometic-rm10-low-outside-temperature-winter-cover-support",
      ]),
    );
    expect(symptomById.get("low-voltage")?.sourceIds).toEqual(
      expect.arrayContaining(["dometic-rm10-gas-operation-mains-supply-voltage-support", "dometic-rm10-internal-batteries-change-support"]),
    );

    expect([...supportUrls.values()]).not.toContain("https://support.dometic.com/en/rm10-refrigerators/Strange-smell-from-the-refrigerator-1b4c");
    expect([...supportUrls.values()]).not.toContain("https://support.dometic.com/en/rm10-refrigerators/My-gas-cylinder-is-empty-c4e8");
    expect([...supportUrls.values()]).not.toContain("https://support.dometic.com/en/rm10-refrigerators/What-should-I-do-if-I-smell-ammonia-86e2");
    expect([...supportUrls.values()]).not.toContain("https://support.dometic.com/en/rm10-refrigerators/Where-can-I-find-the-nearest-service-provider-bb4c");
    expect([...supportUrls.values()]).not.toEqual(expect.arrayContaining([
      "https://support.dometic.com/en/rmd10-refrigerators",
      "https://support.dometic.com/en/rml10-refrigerators",
      "https://support.dometic.com/en/rms10-refrigerators",
      "https://support.dometic.com/en/rm10-refrigerators/How-to-best-store-food-in-the-refrigerator-e0c",
      "https://support.dometic.com/en/rm10-refrigerators/Which-food-should-go-in-which-compartment-d2fe",
      "https://support.dometic.com/en/rm10-refrigerators/How-to-save-energy-2581",
      "https://support.dometic.com/en/rm10-refrigerators/What-cooling-unit-is-used-in-the-refrigerator-6799",
      "https://support.dometic.com/en/rm10-refrigerators/Which-coolant-is-used-363c",
      "https://support.dometic.com/en/rm10-refrigerators/What-is-frame-heating-b3f7",
      "https://support.dometic.com/en/rm10-refrigerators/How-to-remove-the-freezer-compartment-cdb4",
      "https://support.dometic.com/en/rm10-refrigerators/How-to-use-the-oven-d784",
      "https://support.dometic.com/en/rm10-refrigerators/How-to-use-the-grill-a11",
      "https://support.dometic.com/en/rm10-refrigerators/My-refrigerator-shows-a-fault-or-a-failure-bfb3",
      "https://support.dometic.com/en/rm10-refrigerators/My-refrigerator-shows-a-warning-or-error-b028",
    ]));

    const manualRows = corpus.entries.filter((entry) => entry.sourceIds.includes("dometic-rm10-rms10-operating"));
    expect(manualRows.map((entry) => entry.code)).toEqual(
      expect.arrayContaining(["W05", "W06", "W10 + beep", "W11", "E03", "E07", "E08", "E09", "E12", "E13", "E14", "E50", "E51", "E52", "E53"]),
    );
  });

  it("adds official Dometic RUA and RUC symptom support pages without inventing code entries", () => {
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const supportUrls = new Map(corpus.sources.map((source) => [source.id, source.url]));
    const symptomOnlySourceIds = [
      "dometic-rua-does-not-work-support",
      "dometic-rua-not-cooling-sufficiently-support",
      "dometic-rua-first-use-support",
      "dometic-rua-optimal-use-cooling-ventilation-support",
      "dometic-rua-defrost-refrigerator-support",
      "dometic-rua-door-lock-travel-support",
      "dometic-rua-switch-on-off-support",
      "dometic-rua-recommended-temperatures-support",
      "dometic-rua-user-modes-support",
      "dometic-ruc-not-cooling-sufficiently-support",
      "dometic-ruc-not-cooling-error-indicator-support",
      "dometic-ruc-not-cooling-display-lit-service-support",
      "dometic-ruc-compressor-not-running-support",
      "dometic-ruc-compressor-voltage-applied-not-operating-support",
      "dometic-ruc-compressor-starts-cuts-out-support",
      "dometic-ruc-compressor-does-not-start-high-ambient-support",
      "dometic-ruc-no-display-support",
      "dometic-ruc-display-does-not-glow-support",
      "dometic-ruc-water-in-or-under-refrigerator-support",
      "dometic-ruc-water-leaking-inside-support",
      "dometic-ruc-water-leaking-floor-support",
      "dometic-ruc-unusual-noises-support",
      "dometic-ruc-interior-temperature-too-low-support",
      "dometic-ruc-recommended-temperatures-support",
      "dometic-ruc-defrost-refrigerator-support",
      "dometic-ruc-door-lock-freezer-compartment-support",
      "dometic-ruc-first-use-support",
      "dometic-ruc-optimal-use-cooling-ventilation-support",
      "dometic-ruc-user-modes-support",
    ];
    const expectedSymptomPages = new Map([
      ["dometic-rua-does-not-work-support", "https://support.dometic.com/en/rua-refrigerator/My-refrigerator-does-not-work-8f2c"],
      ["dometic-rua-not-cooling-sufficiently-support", "https://support.dometic.com/en/rua-refrigerator/My-refrigerator-is-not-cooling-sufficiently-3bb2"],
      ["dometic-rua-first-use-support", "https://support.dometic.com/en/rua-refrigerator/How-to-use-the-refrigerator-for-the-first-time-ee1c"],
      ["dometic-rua-optimal-use-cooling-ventilation-support", "https://support.dometic.com/en/rua-refrigerator/How-to-use-the-refrigerator-optimally-ccd9"],
      ["dometic-rua-defrost-refrigerator-support", "https://support.dometic.com/en/rua-refrigerator/How-to-defrost-the-refrigerator-1c11"],
      ["dometic-rua-door-lock-travel-support", "https://support.dometic.com/en/rua-refrigerator/How-to-lock-the-refrigerator-doorfreezer-compartment-door-d280"],
      ["dometic-rua-switch-on-off-support", "https://support.dometic.com/en/rua-refrigerator/How-to-switch-the-refrigerator-onoff-e4a"],
      ["dometic-rua-recommended-temperatures-support", "https://support.dometic.com/en/rua-refrigerator/What-are-the-recommended-temperatures-for-refrigerating-and-freezing-c0c4"],
      ["dometic-rua-user-modes-support", "https://support.dometic.com/en/rua-refrigerator/What-user-modes-are-available-on-my-refrigerator-8269"],
      ["dometic-ruc-not-cooling-sufficiently-support", "https://support.dometic.com/en/ruc-refrigerators/My-refrigerator-is-not-cooling-sufficiently-8371"],
      ["dometic-ruc-not-cooling-error-indicator-support", "https://support.dometic.com/en/ruc-refrigerators/The-device-does-not-cool-power-is-present-error-indicator-appears-e26c"],
      ["dometic-ruc-not-cooling-display-lit-service-support", "https://support.dometic.com/en/ruc-refrigerators/The-device-does-not-cool-power-is-present-display-is-lit-c723"],
      ["dometic-ruc-compressor-not-running-support", "https://support.dometic.com/en/ruc-refrigerators/The-compressor-is-not-running-1235"],
      ["dometic-ruc-compressor-voltage-applied-not-operating-support", "https://support.dometic.com/en/ruc-refrigerators/Voltage-is-being-applied-but-the-compressor-does-not-operate-1f71"],
      ["dometic-ruc-compressor-starts-cuts-out-support", "https://support.dometic.com/en/ruc-refrigerators/Compressor-starts-for-a-short-time-and-then-cuts-out-aa45"],
      ["dometic-ruc-compressor-does-not-start-high-ambient-support", "https://support.dometic.com/en/ruc-refrigerators/compressor-does-not-start-93cb"],
      ["dometic-ruc-no-display-support", "https://support.dometic.com/en/ruc-refrigerators/No-display-87ac"],
      ["dometic-ruc-display-does-not-glow-support", "https://support.dometic.com/en/ruc-refrigerators/Device-does-not-function-display-does-not-glow-dba8"],
      ["dometic-ruc-water-in-or-under-refrigerator-support", "https://support.dometic.com/en/ruc-refrigerators/There-is-water-in-or-under-my-refrigerator-e451"],
      ["dometic-ruc-water-leaking-inside-support", "https://support.dometic.com/en/ruc-refrigerators/Water-is-leaking-into-the-inside-of-the-refrigerator-b1bf"],
      ["dometic-ruc-water-leaking-floor-support", "https://support.dometic.com/en/ruc-refrigerators/Water-is-leaking-onto-the-floor-1be"],
      ["dometic-ruc-unusual-noises-support", "https://support.dometic.com/en/ruc-refrigerators/I-am-hearing-unusual-noises-from-my-refrigerator-e3d"],
      ["dometic-ruc-interior-temperature-too-low-support", "https://support.dometic.com/en/ruc-refrigerators/The-interior-temperature-is-too-low-on-warmest-control-setting-2156"],
      ["dometic-ruc-recommended-temperatures-support", "https://support.dometic.com/en/ruc-refrigerators/What-are-the-recommended-temperatures-for-refrigerating-and-freezing-c0c4"],
      ["dometic-ruc-defrost-refrigerator-support", "https://support.dometic.com/en/ruc-refrigerators/How-to-defrost-the-refrigerator-1c11"],
      ["dometic-ruc-door-lock-freezer-compartment-support", "https://support.dometic.com/en/ruc-refrigerators/How-to-lock-the-refrigerator-doorfreezer-compartment-door-d280"],
      ["dometic-ruc-first-use-support", "https://support.dometic.com/en/ruc-refrigerators/How-to-use-the-refrigerator-for-the-first-time-ee1c"],
      ["dometic-ruc-optimal-use-cooling-ventilation-support", "https://support.dometic.com/en/ruc-refrigerators/How-to-use-the-refrigerator-optimally-ccd9"],
      ["dometic-ruc-user-modes-support", "https://support.dometic.com/en/ruc-refrigerators/What-user-modes-are-available-on-my-refrigerator-8269"],
    ]);

    for (const [sourceId, url] of expectedSymptomPages) {
      expect(supportUrls.get(sourceId), sourceId).toBe(url);
    }

    expect(corpus.sources.filter((source) => symptomOnlySourceIds.includes(source.id))).toHaveLength(
      symptomOnlySourceIds.length,
    );
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => symptomOnlySourceIds.includes(sourceId)))).toHaveLength(0);

    expect(symptomById.get("dometic-rua-does-not-work-mode")?.sourceIds).toContain("dometic-rua-does-not-work-support");
    expect(symptomById.get("dometic-rua-ruc-not-cooling-temperature")?.sourceIds).toEqual(
      expect.arrayContaining([
        "dometic-rua-not-cooling-sufficiently-support",
        "dometic-rua-optimal-use-cooling-ventilation-support",
        "dometic-rua-recommended-temperatures-support",
        "dometic-ruc-not-cooling-sufficiently-support",
        "dometic-ruc-optimal-use-cooling-ventilation-support",
        "dometic-ruc-recommended-temperatures-support",
      ]),
    );
    expect(symptomById.get("dometic-rua-ruc-first-use-ventilation-battery")?.sourceIds).toEqual(
      expect.arrayContaining([
        "dometic-rua-first-use-support",
        "dometic-rua-optimal-use-cooling-ventilation-support",
        "dometic-ruc-first-use-support",
        "dometic-ruc-optimal-use-cooling-ventilation-support",
      ]),
    );
    expect(symptomById.get("dometic-rua-ruc-defrost")?.sourceIds).toEqual(
      expect.arrayContaining(["dometic-rua-defrost-refrigerator-support", "dometic-ruc-defrost-refrigerator-support"]),
    );
    expect(symptomById.get("dometic-rua-ruc-door-lock")?.sourceIds).toEqual(
      expect.arrayContaining(["dometic-rua-door-lock-travel-support", "dometic-ruc-door-lock-freezer-compartment-support"]),
    );
    expect(symptomById.get("dometic-rua-ruc-user-modes")?.sourceIds).toEqual(
      expect.arrayContaining(["dometic-rua-user-modes-support", "dometic-ruc-user-modes-support"]),
    );
    expect(symptomById.get("dometic-rua-power-source-selection")?.sourceIds).toContain("dometic-rua-switch-on-off-support");
    expect(symptomById.get("dometic-ruc-display-power")?.sourceIds).toEqual(
      expect.arrayContaining(["dometic-ruc-display-does-not-glow-support", "dometic-ruc-no-display-support"]),
    );
    expect(symptomById.get("dometic-ruc-compressor-voltage")?.sourceIds).toEqual(
      expect.arrayContaining([
        "dometic-ruc-compressor-not-running-support",
        "dometic-ruc-compressor-starts-cuts-out-support",
        "dometic-ruc-compressor-voltage-applied-not-operating-support",
        "dometic-ruc-compressor-does-not-start-high-ambient-support",
      ]),
    );
    expect(symptomById.get("dometic-ruc-no-cooling-service")?.sourceIds).toEqual(
      expect.arrayContaining([
        "dometic-ruc-not-cooling-error-indicator-support",
        "dometic-ruc-not-cooling-display-lit-service-support",
      ]),
    );
    expect(symptomById.get("dometic-ruc-water-leak-drain")?.sourceIds).toEqual(
      expect.arrayContaining([
        "dometic-ruc-water-in-or-under-refrigerator-support",
        "dometic-ruc-water-leaking-inside-support",
        "dometic-ruc-water-leaking-floor-support",
      ]),
    );
    expect(symptomById.get("dometic-ruc-unusual-noise")?.sourceIds).toContain("dometic-ruc-unusual-noises-support");
    expect(symptomById.get("dometic-ruc-too-cold-temperature-setting")?.sourceIds).toEqual(
      expect.arrayContaining(["dometic-ruc-interior-temperature-too-low-support", "dometic-ruc-recommended-temperatures-support"]),
    );

    const newSymptomIds = [
      "dometic-rua-does-not-work-mode",
      "dometic-rua-ruc-not-cooling-temperature",
      "dometic-rua-ruc-first-use-ventilation-battery",
      "dometic-rua-ruc-defrost",
      "dometic-rua-ruc-door-lock",
      "dometic-rua-ruc-user-modes",
      "dometic-rua-power-source-selection",
      "dometic-ruc-display-power",
      "dometic-ruc-compressor-voltage",
      "dometic-ruc-no-cooling-service",
      "dometic-ruc-water-leak-drain",
      "dometic-ruc-unusual-noise",
      "dometic-ruc-too-cold-temperature-setting",
    ];
    for (const symptomId of newSymptomIds) {
      expect(symptomById.get(symptomId)?.safeChecklist.join(" "), symptomId).not.toMatch(
        /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\brefrigerant\b|\bprobe\b|\bopen (the )?(fuel|gas|electrical|rooftop)/i,
      );
    }
    expect(symptomById.get("dometic-ruc-unusual-noise")?.safeChecklist.join(" ")).toMatch(/do not bend/i);
    expect(symptomById.get("dometic-ruc-compressor-voltage")?.safeChecklist.join(" ")).not.toMatch(
      /replace.*cable|wiring|compressor pins|probe/i,
    );
    expect(symptomById.get("dometic-ruc-no-cooling-service")?.safeChecklist.join(" ")).toMatch(/authorized service/i);

    expect(symptomById.get("refrigerator-not-cooling")?.sourceIds).toEqual(
      expect.arrayContaining([
        "dometic-rua-not-cooling-sufficiently-support",
        "dometic-rua-optimal-use-cooling-ventilation-support",
        "dometic-ruc-not-cooling-sufficiently-support",
        "dometic-ruc-optimal-use-cooling-ventilation-support",
        "dometic-ruc-not-cooling-display-lit-service-support",
        "dometic-ruc-compressor-voltage-applied-not-operating-support",
      ]),
    );
    expect(symptomById.get("airflow-or-venting")?.sourceIds).toEqual(
      expect.arrayContaining([
        "dometic-rua-first-use-support",
        "dometic-rua-optimal-use-cooling-ventilation-support",
        "dometic-ruc-first-use-support",
        "dometic-ruc-optimal-use-cooling-ventilation-support",
      ]),
    );
    expect(symptomById.get("low-voltage")?.sourceIds).toEqual(
      expect.arrayContaining([
        "dometic-ruc-compressor-starts-cuts-out-support",
        "dometic-ruc-compressor-voltage-applied-not-operating-support",
      ]),
    );
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(
      expect.arrayContaining([
        "dometic-ruc-not-cooling-display-lit-service-support",
        "dometic-ruc-display-does-not-glow-support",
      ]),
    );

    expect([...supportUrls.values()]).not.toEqual(expect.arrayContaining([
      "https://support.dometic.com/en/rua-refrigerator/How-to-connect-the-refrigerator-to-12-24-V-ddb2",
      "https://support.dometic.com/en/rua-refrigerator/How-to-connect-the-refrigerator-to-AC-mains-27ca",
      "https://support.dometic.com/en/rua-refrigerator/How-to-clean-and-maintain-the-refrigerator-47a9",
      "https://support.dometic.com/en/rua-refrigerator/How-to-replace-the-door-panel-of-my-refrigerator-4f2f",
      "https://support.dometic.com/en/ruc-refrigerators/The-device-does-not-cool-power-is-present-display-is-lit-1f43",
      "https://support.dometic.com/en/ruc-refrigerators/Electric-circuit-between-the-pins-in-the-compressor-interrupted-df5e",
      "https://support.dometic.com/en/ruc-refrigerators/How-to-connect-the-refrigerator-to-12-24-V-ddb2",
      "https://support.dometic.com/en/ruc-refrigerators/How-to-connect-the-refrigerator-to-AC-mains-27ca",
      "https://support.dometic.com/en/ruc-refrigerators/How-to-clean-and-maintain-the-refrigerator-47a9",
      "https://support.dometic.com/en/ruc-refrigerators/How-to-replace-the-door-panel-of-my-refrigerator-4f2f",
      "https://support.dometic.com/en/ruc-refrigerators/Where-can-I-find-the-nearest-service-provider-bb4c",
      "https://support.dometic.com/en/ruc-refrigerators/Where-can-I-get-spare-parts-a85a",
    ]));
  });

  it("adds official Norcold/Thetford symptom support pages without inventing code entries", () => {
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const supportUrls = new Map(corpus.sources.map((source) => [source.id, source.url]));
    const index = buildSearchIndex(corpus);
    const symptomOnlySourceIds = [
      "thetford-faq-120v-performance",
      "thetford-faq-refrigerator-on-off-button",
      "thetford-faq-defrost-safety",
      "thetford-faq-refrigerator-odor-cleaning",
      "thetford-faq-hts-removal",
      "thetford-faq-hts-solid-red",
      "thetford-faq-hts-flashing-red",
      "thetford-faq-hts-self-install",
      "thetford-faq-12v-engine-behavior",
      "thetford-faq-destination-performance",
      "thetford-faq-door-alarm",
      "thetford-faq-thermostat-coldest",
      "thetford-faq-frost-condensation-service",
      "thetford-n3000-support",
    ];
    const newOwnerManualSourceIds = ["norcold-n8dcx-n10dcx-owner"];
    const newSourceIds = [...symptomOnlySourceIds, ...newOwnerManualSourceIds];
    const expectedSources = new Map([
      ["thetford-faq-120v-performance", "https://www.thetford.com/us/faq/why-doesnt-my-refrigerator-perform-well-on-120v-ac/"],
      ["thetford-faq-refrigerator-on-off-button", "https://www.thetford.com/us/faq/why-doesnt-my-refrigerator-work-when-i-push-the-on-off-button/"],
      ["thetford-faq-defrost-safety", "https://www.thetford.com/us/faq/is-it-okay-to-defrost-my-refrigerator-freezer-using-a-hair-dryer-heat-gun-or-boiling-water/"],
      ["thetford-faq-refrigerator-odor-cleaning", "https://www.thetford.com/us/faq/my-refrigerator-smells-how-can-i-clean-it/"],
      ["thetford-faq-hts-removal", "https://www.thetford.com/us/faq/my-refrigerator-stopped-operating-will-a-removal-of-the-high-temperature-sensor-make-the-refrigerator-work/"],
      ["thetford-faq-hts-solid-red", "https://www.thetford.com/us/faq/what-does-it-mean-if-i-have-a-solid-red-light-on-the-high-temperature-sensor/"],
      ["thetford-faq-hts-flashing-red", "https://www.thetford.com/us/faq/what-does-it-mean-if-i-have-a-flashing-red-light-on-the-high-temperature-sensor/"],
      ["thetford-faq-hts-self-install", "https://www.thetford.com/us/faq/can-a-consumer-have-a-high-temperature-sensor-sent-directly-to-them-for-self-install/"],
      ["thetford-faq-12v-engine-behavior", "https://www.thetford.com/us/faq/why-doesnt-my-refrigerator-work-on-12v-when-the-car-engine-is-not-running/"],
      ["thetford-faq-destination-performance", "https://www.thetford.com/us/faq/at-my-travel-destination-my-refrigerator-does-not-operate-very-well-what-could-be-the-problem/"],
      ["thetford-faq-door-alarm", "https://www.thetford.com/us/faq/what-is-causing-the-door-alarm-to-continue-to-sound-off/"],
      ["thetford-faq-thermostat-coldest", "https://www.thetford.com/us/faq/which-thermostat-setting-is-the-coldest/"],
      ["thetford-faq-frost-condensation-service", "https://www.thetford.com/us/faq/what-if-my-freezer-is-producing-frost-condensation/"],
      ["thetford-n3000-support", "https://www.thetford.com/int/thetford-service-and-support/n3000-series/"],
      ["norcold-n8dcx-n10dcx-owner", "https://www.thetford.com/app/uploads/2024/09/OM_N8DCX_N10DCX_640137H_10152025.pdf"],
    ]);

    for (const [sourceId, url] of expectedSources) {
      expect(supportUrls.get(sourceId), sourceId).toBe(url);
    }
    expect(corpus.sources.filter((source) => newSourceIds.includes(source.id))).toHaveLength(newSourceIds.length);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => symptomOnlySourceIds.includes(sourceId)))).toHaveLength(0);

    expect(symptomById.get("norcold-absorption-cooling-performance")?.sourceIds).toEqual(
      expect.arrayContaining([
        "thetford-faq-destination-performance",
        "thetford-n3000-support",
        "norcold-1200-owner",
        "norcold-polar-owner",
        "norcold-n3000-na-owner",
      ]),
    );
    expect(symptomById.get("norcold-absorption-power-source-startup")?.sourceIds).toEqual(
      expect.arrayContaining(["thetford-faq-refrigerator-on-off-button", "thetford-faq-12v-engine-behavior", "thetford-n3000-support"]),
    );
    expect(symptomById.get("norcold-absorption-120v-performance")?.sourceIds).toEqual(["thetford-faq-120v-performance"]);
    expect(symptomById.get("norcold-absorption-door-alarm-seal")?.sourceIds).toEqual(
      expect.arrayContaining(["thetford-faq-door-alarm", "norcold-1200-owner", "norcold-polar-owner", "norcold-2118-owner"]),
    );
    expect(symptomById.get("norcold-absorption-defrost-frost-condensation")?.sourceIds).toEqual(
      expect.arrayContaining(["thetford-faq-defrost-safety", "thetford-faq-frost-condensation-service", "thetford-n3000-support"]),
    );
    expect(symptomById.get("norcold-absorption-odor-cleaning")?.sourceIds).toEqual(
      expect.arrayContaining(["thetford-faq-refrigerator-odor-cleaning", "thetford-n3000-support"]),
    );
    expect(symptomById.get("norcold-absorption-temperature-setting")?.sourceIds).toEqual(
      expect.arrayContaining(["thetford-faq-thermostat-coldest", "thetford-n3000-support", "norcold-1200-owner", "norcold-polar-owner"]),
    );
    expect(symptomById.get("norcold-hts-stopped-operating-service-only")?.sourceIds).toEqual(
      expect.arrayContaining([
        "thetford-faq-hts-removal",
        "thetford-faq-hts-solid-red",
        "thetford-faq-hts-flashing-red",
        "thetford-faq-hts-self-install",
      ]),
    );
    expect(symptomById.get("norcold-dc-compressor-cooling-voltage")?.sourceIds).toEqual(
      expect.arrayContaining(["norcold-n2000-owner", "norcold-n8dcx-n10dcx-owner", "norcold-n15-n20-owner"]),
    );
    expect(symptomById.get("norcold-dc-compressor-too-cold-noise")?.sourceIds).toEqual(
      expect.arrayContaining(["norcold-n2000-owner", "norcold-n8dcx-n10dcx-owner", "norcold-n15-n20-owner"]),
    );
    expect(symptomById.get("norcold-n2000-condensation-drip-tray")?.sourceIds).toEqual(["norcold-n2000-owner"]);

    for (const symptomId of [
      "norcold-absorption-cooling-performance",
      "norcold-absorption-power-source-startup",
      "norcold-absorption-120v-performance",
      "norcold-absorption-door-alarm-seal",
      "norcold-absorption-defrost-frost-condensation",
      "norcold-absorption-odor-cleaning",
      "norcold-absorption-temperature-setting",
      "norcold-dc-compressor-cooling-voltage",
      "norcold-dc-compressor-too-cold-noise",
      "norcold-n2000-condensation-drip-tray",
    ]) {
      expect(symptomById.get(symptomId)?.safeChecklist.join(" "), symptomId).not.toMatch(
        /bridge|compressor pin|C and T|DMM|measure resistance|repair wire|connector|replace fan|replace thermistor|power module|remove refrigerator|self-install|\bbypass\b|\bprobe\b|\bfuse\b|\bwiring\b|\bburner\b|\bgas valve\b|\bcontrol board\b|\brefrigerant\b/i,
      );
    }

    const htsChecklist = symptomById.get("norcold-hts-stopped-operating-service-only")?.safeChecklist.join(" ");
    expect(htsChecklist).toMatch(/do not bypass|do not remove|authorized/i);
    expect(htsChecklist).not.toMatch(/self-install|probe|repair|reset/i);

    expect(symptomById.get("refrigerator-not-cooling")?.sourceIds).toEqual(
      expect.arrayContaining(["thetford-faq-destination-performance", "thetford-n3000-support", "norcold-n8dcx-n10dcx-owner"]),
    );
    expect(symptomById.get("airflow-or-venting")?.sourceIds).toEqual(
      expect.arrayContaining(["thetford-n3000-support", "norcold-n8dcx-n10dcx-owner", "norcold-n15-n20-owner"]),
    );
    expect(symptomById.get("low-voltage")?.sourceIds).toEqual(
      expect.arrayContaining(["thetford-faq-hts-flashing-red", "norcold-n2000-owner", "norcold-n8dcx-n10dcx-owner"]),
    );
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(
      expect.arrayContaining(["thetford-faq-hts-removal", "thetford-faq-hts-solid-red", "norcold-n8dcx-n10dcx-owner"]),
    );

    expect([...supportUrls.values()]).not.toEqual(expect.arrayContaining([
      "https://www.thetford.com/us/norcold-gas-absorption-no-cooling-performance-checklist/",
      "https://www.thetford.com/us/n8dc-n10dc-n15dc-n20dc-no-cooling-performance-checklist/",
      "https://www.thetford.com/us/recall-information/",
      "https://www.thetford.com/us/faq/what-if-my-refrigerator-is-not-cooling-property/",
      "https://www.thetford.com/us/faq/how-level-must-my-ac-lp-refrigerator-be/",
      "https://www.thetford.com/us/faq/my-refrigerator-shows-a-fault-code-what-should-i-do/",
      "https://www.thetford.com/app/uploads/2024/09/640998B_SM_N2090-N2152-N2175_04022025.pdf",
    ]));

    expect(lookupEntries(index, "norcold no co")[0]?.slug).toBe("norcold-1200-no-co");
    expect(lookupEntries(index, "norcold n2000 red led blinking input voltage")[0]?.slug).toBe(
      "norcold-n2000-red-led-blinking-input-voltage",
    );
    expect(lookupEntries(index, "norcold n8dc e3")[0]?.slug).toBe("norcold-n8dcx-n10dcx-e3");
    expect(lookupEntries(index, "norcold n8dc power module flash 1")[0]?.slug).toBe(
      "norcold-n8dcx-n10dcx-power-module-flash-1",
    );
  });

  it("adds official Thetford RV toilet symptom support pages without inventing code entries", () => {
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const supportUrls = new Map(corpus.sources.map((source) => [source.id, source.url]));
    const toiletSourceIds = [
      "thetford-rv-toilet-support",
      "thetford-permanent-rv-toilet-owner",
      "thetford-faq-lip-seal-replacement",
      "thetford-faq-leak-behind-toilet",
      "thetford-faq-rv-sanitation-winterize",
    ];
    const toiletSymptomIds = [
      "thetford-rv-toilet-bowl-water-does-not-hold-seal",
      "thetford-rv-toilet-no-flush-or-poor-flush-water-supply",
      "thetford-rv-toilet-leak-behind-or-around-base",
      "thetford-rv-toilet-winterizing-freeze-damage",
    ];
    const expectedSources = new Map([
      ["thetford-rv-toilet-support", "https://www.thetford.com/us/rv-toilet-support/"],
      [
        "thetford-permanent-rv-toilet-owner",
        "https://www.thetford.com/app/uploads/2026/02/OM_Permanent_RV_Toilet_42088_0226_V1_EN-KOR-IT.pdf",
      ],
      ["thetford-faq-lip-seal-replacement", "https://www.thetford.com/us/faq/how-often-do-i-have-to-replace-the-lip-seal/"],
      ["thetford-faq-leak-behind-toilet", "https://www.thetford.com/us/faq/what-is-causing-the-leak-behind-my-toilet/"],
      [
        "thetford-faq-rv-sanitation-winterize",
        "https://www.thetford.com/us/faq/what-products-should-i-use-to-winterize-my-rv-sanitation-system/",
      ],
    ]);

    for (const [sourceId, url] of expectedSources) {
      expect(supportUrls.get(sourceId), sourceId).toBe(url);
    }
    expect(corpus.sources.filter((source) => toiletSourceIds.includes(source.id))).toHaveLength(toiletSourceIds.length);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => toiletSourceIds.includes(sourceId)))).toHaveLength(0);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);

    expect(symptomById.get("thetford-rv-toilet-bowl-water-does-not-hold-seal")?.sourceIds).toEqual(
      expect.arrayContaining(["thetford-permanent-rv-toilet-owner", "thetford-faq-lip-seal-replacement"]),
    );
    expect(symptomById.get("thetford-rv-toilet-no-flush-or-poor-flush-water-supply")?.sourceIds).toEqual(
      expect.arrayContaining(["thetford-rv-toilet-support", "thetford-permanent-rv-toilet-owner"]),
    );
    expect(symptomById.get("thetford-rv-toilet-leak-behind-or-around-base")?.sourceIds).toEqual(
      expect.arrayContaining(["thetford-permanent-rv-toilet-owner", "thetford-faq-leak-behind-toilet"]),
    );
    expect(symptomById.get("thetford-rv-toilet-winterizing-freeze-damage")?.sourceIds).toEqual(
      expect.arrayContaining(["thetford-permanent-rv-toilet-owner", "thetford-faq-rv-sanitation-winterize"]),
    );

    for (const symptomId of toiletSymptomIds) {
      expect(symptomById.get(symptomId), symptomId).toBeDefined();
      const checklist = symptomById.get(symptomId)?.safeChecklist.join(" ") ?? "";
      expect(checklist, symptomId).not.toMatch(
        /\b(wiring|wire|120\s*V|12\s*V|probe|bypass|control board|gas valve|burner|replace (?:the )?(?:water )?valve|water valve replacement|replace vacuum breaker|vacuum breaker replacement|disassemble|remove (?:the )?toilet|perform toilet removal|attempt toilet removal|electrical repair|gas work|open wall)\b/i,
      );
      expect(checklist, symptomId).toMatch(/Thetford|qualified RV service|authorized service|dealer/i);

      for (const sentence of checklist.split(/(?<=\.)\s+/)) {
        if (
          /\b(disconnecting the supply line|valve work|water valve failure|vacuum breaker|flange leaks?|toilet removal|freeze damage|water-line damage)\b/i.test(
            sentence,
          )
        ) {
          expect(sentence, `${symptomId}: ${sentence}`).toMatch(/Contact Thetford|qualified RV service|dealer|Stop owner checks/i);
        }
      }
    }

    expect(symptomById.get("thetford-rv-toilet-bowl-water-does-not-hold-seal")?.summary).toMatch(/bowl water|lip seal/i);
    expect(symptomById.get("thetford-rv-toilet-no-flush-or-poor-flush-water-supply")?.summary).toMatch(/flush|water supply|pedal/i);
    expect(symptomById.get("thetford-rv-toilet-leak-behind-or-around-base")?.summary).toMatch(/leak|water supply|behind/i);
    expect(symptomById.get("thetford-rv-toilet-winterizing-freeze-damage")?.summary).toMatch(/winteriz|freeze/i);

    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(
      expect.arrayContaining(["thetford-rv-toilet-support", "thetford-permanent-rv-toilet-owner"]),
    );
  });

  it("adds official Furrion refrigerator symptom support pages without inventing code entries", () => {
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const supportUrls = new Map(corpus.sources.map((source) => [source.id, source.url]));
    const symptomOnlySourceIds = [
      "furrion-refrigerators-support-index",
      "furrion-refrigerators-under-6-support",
      "furrion-refrigerators-6-14-support",
      "furrion-refrigerators-15-plus-support",
      "furrion-refrigerator-not-cooling-faq",
      "furrion-refrigerator-not-cold-enough-faq",
      "furrion-refrigerator-compressor-cycling-faq",
      "furrion-refrigerator-door-not-close-faq",
      "furrion-refrigerator-moisture-ice-faq",
      "furrion-refrigerator-hard-reset-faq",
      "furrion-12v-refrigerator-ventilation-faq",
      "furrion-12v-refrigerator-service-line-faq",
      "furrion-refrigerant-leak-boundary-faq",
      "furrion-12v-hard-reset-qr",
      "furrion-refrigerator-storage-qr",
    ];
    const newSymptomIds = [
      "furrion-12v-refrigerator-not-cooling-hard-reset",
      "furrion-12v-refrigerator-not-cold-enough-seals-vents-temperature",
      "furrion-12v-refrigerator-compressor-cycling-low-battery-heat",
      "furrion-refrigerator-door-seal-not-closing",
      "furrion-refrigerator-moisture-ice-or-defrost",
      "furrion-12v-refrigerator-power-service-line-or-reset",
      "furrion-refrigerator-temperature-mode-or-lock-mode",
      "furrion-refrigerator-normal-noises-vibration",
      "furrion-refrigerator-service-only-compressor-sensor-wiring",
    ];
    const expectedSources = new Map([
      ["furrion-refrigerators-support-index", "https://support.lci1.com/furrion-refrigerators/"],
      ["furrion-refrigerators-under-6-support", "https://support.lci1.com/6-cubic-foot-refrigerators"],
      ["furrion-refrigerators-6-14-support", "https://support.lci1.com/6-14-cubic-foot-refrigerators"],
      ["furrion-refrigerators-15-plus-support", "https://support.lci1.com/15-cubic-foot-refrigerator"],
      ["furrion-refrigerator-not-cooling-faq", "https://support.lci1.com/faqs/why-is-my-refrigerator-not-cooling"],
      ["furrion-refrigerator-not-cold-enough-faq", "https://support.lci1.com/faqs/why-is-my-refrigerator-not-getting-cold-enough"],
      [
        "furrion-refrigerator-compressor-cycling-faq",
        "https://support.lci1.com/faqs/why-is-my-refrigerator-compressor-turning-on-and-off-frequently",
      ],
      ["furrion-refrigerator-door-not-close-faq", "https://support.lci1.com/faqs/why-does-my-refrigerator-door-not-close"],
      [
        "furrion-refrigerator-moisture-ice-faq",
        "https://support.lci1.com/faqs/why-is-there-moisture-or-ice-inside-or-outside-my-refrigerator",
      ],
      ["furrion-refrigerator-hard-reset-faq", "https://support.lci1.com/faq/how-do-i-hard-reset-my-refrigerator"],
      ["furrion-12v-refrigerator-ventilation-faq", "https://support.lci1.com/faqs/does-my-12v-refrigerator-require-ventilation"],
      ["furrion-12v-refrigerator-service-line-faq", "https://support.lci1.com/faq/what-are-the-requirements-for-the-service-line"],
      ["furrion-refrigerant-leak-boundary-faq", "https://support.lci1.com/faqs/what-do-i-do-if-i-find-a-refrigerant-leak"],
      ["furrion-12v-hard-reset-qr", "https://lci-support-doc.s3.amazonaws.com/qr/ccd-0008369.pdf"],
      ["furrion-refrigerator-storage-qr", "https://lci-support-doc.s3.amazonaws.com/qr/ccd-0008140.pdf"],
    ]);

    for (const [sourceId, url] of expectedSources) {
      expect(supportUrls.get(sourceId), sourceId).toBe(url);
    }
    expect(corpus.sources.filter((source) => symptomOnlySourceIds.includes(source.id))).toHaveLength(symptomOnlySourceIds.length);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => symptomOnlySourceIds.includes(sourceId)))).toHaveLength(0);

    expect(symptomById.get("furrion-12v-refrigerator-not-cooling-hard-reset")?.sourceIds).toEqual(
      expect.arrayContaining([
        "furrion-refrigerators-support-index",
        "furrion-refrigerator-not-cooling-faq",
        "furrion-refrigerator-hard-reset-faq",
        "furrion-12v-hard-reset-qr",
        "furrion-refrigerator-storage-qr",
        "furrion-10-6-refrigerator",
        "furrion-french-door-refrigerator",
      ]),
    );
    expect(symptomById.get("furrion-12v-refrigerator-not-cold-enough-seals-vents-temperature")?.sourceIds).toEqual(
      expect.arrayContaining([
        "furrion-refrigerator-not-cold-enough-faq",
        "furrion-12v-refrigerator-ventilation-faq",
        "furrion-10-6-refrigerator",
        "furrion-15-refrigerator",
        "furrion-french-door-refrigerator",
      ]),
    );
    expect(symptomById.get("furrion-12v-refrigerator-compressor-cycling-low-battery-heat")?.sourceIds).toEqual(
      expect.arrayContaining(["furrion-refrigerator-compressor-cycling-faq", "furrion-10-6-refrigerator", "furrion-french-door-refrigerator"]),
    );
    expect(symptomById.get("furrion-refrigerator-door-seal-not-closing")?.sourceIds).toEqual(
      expect.arrayContaining(["furrion-refrigerator-door-not-close-faq", "furrion-10-6-refrigerator", "furrion-15-refrigerator"]),
    );
    expect(symptomById.get("furrion-refrigerator-moisture-ice-or-defrost")?.sourceIds).toEqual(
      expect.arrayContaining(["furrion-refrigerator-moisture-ice-faq", "furrion-10-6-refrigerator", "furrion-15-refrigerator"]),
    );
    expect(symptomById.get("furrion-12v-refrigerator-power-service-line-or-reset")?.sourceIds).toEqual(
      expect.arrayContaining([
        "furrion-12v-refrigerator-service-line-faq",
        "furrion-refrigerator-hard-reset-faq",
        "furrion-12v-hard-reset-qr",
        "furrion-10-6-refrigerator",
        "furrion-french-door-refrigerator",
      ]),
    );
    expect(symptomById.get("furrion-refrigerator-temperature-mode-or-lock-mode")?.sourceIds).toEqual(
      expect.arrayContaining(["furrion-refrigerators-6-14-support", "furrion-refrigerators-15-plus-support", "furrion-10-6-refrigerator", "furrion-15-refrigerator"]),
    );
    expect(symptomById.get("furrion-refrigerator-normal-noises-vibration")?.sourceIds).toEqual(
      expect.arrayContaining(["furrion-refrigerator-not-cold-enough-faq", "furrion-10-6-refrigerator", "furrion-15-refrigerator"]),
    );
    expect(symptomById.get("furrion-refrigerator-service-only-compressor-sensor-wiring")?.sourceIds).toEqual(
      expect.arrayContaining(["furrion-refrigerant-leak-boundary-faq", "furrion-12v-refrigerator-service-line-faq", "furrion-arctic-refrigerator"]),
    );

    for (const symptomId of newSymptomIds) {
      expect(symptomById.get(symptomId), symptomId).toBeDefined();
      expect(symptomById.get(symptomId)?.safeChecklist.join(" "), symptomId).not.toMatch(
        /repair as needed|bench test|connect directly to battery|replace compressor|replace board|refrigerant repair|remove refrigerator|remove rear panel|inspect wiring|inspect fuse/i,
      );
    }

    const serviceBoundary = symptomById.get("furrion-refrigerator-service-only-compressor-sensor-wiring")?.safeChecklist.join(" ");
    expect(serviceBoundary).toMatch(/qualified|Lippert|service/i);
    expect(serviceBoundary).toMatch(/do not/i);

    expect(symptomById.get("refrigerator-not-cooling")?.sourceIds).toEqual(
      expect.arrayContaining(["furrion-refrigerator-not-cooling-faq", "furrion-refrigerator-not-cold-enough-faq", "furrion-10-6-refrigerator"]),
    );
    expect(symptomById.get("airflow-or-venting")?.sourceIds).toEqual(
      expect.arrayContaining(["furrion-12v-refrigerator-ventilation-faq", "furrion-refrigerator-not-cold-enough-faq"]),
    );
    expect(symptomById.get("low-voltage")?.sourceIds).toEqual(
      expect.arrayContaining(["furrion-refrigerator-compressor-cycling-faq", "furrion-10-6-refrigerator", "furrion-french-door-refrigerator"]),
    );
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(
      expect.arrayContaining(["furrion-refrigerators-support-index", "furrion-refrigerator-storage-qr", "furrion-refrigerant-leak-boundary-faq"]),
    );

    expect([...supportUrls.values()]).not.toEqual(expect.arrayContaining([
      "https://support.lci1.com/videos/how-to-replace-the-fuse-on-a-furrion-8-cuft-refrigerator",
      "https://support.lci1.com/videos/compressor-board-replacement-on-fcr20dcafa-furrion-refrigerator",
      "https://support.lci1.com/videos/testing-compressor-on-fcr10dcgfa-furrion-refrigerator",
      "https://support.lci1.com/documents/ccd-0009381",
      "https://support.lci1.com/documents/ccd-0009268",
      "https://support.lci1.com/documents/ccd-0008570",
      "https://support.lci1.com/documents/ccd-0008248",
    ]));
  });

  it("includes official Dometic RM8 support aliases for exact owner searches", () => {
    const entryById = (id: string) => {
      const entry = corpus.entries.find((candidate) => candidate.id === id);
      expect(entry, id).toBeDefined();
      return entry!;
    };
    const codesForSource = (sourceId: string) =>
      new Set(
        corpus.entries
          .filter((entry) => entry.brand === "Dometic" && entry.sourceIds.includes(sourceId))
          .map((entry) => entry.code),
      );

    const supportUrls = new Map(corpus.sources.map((source) => [source.id, source.url]));

    expect(supportUrls.get("dometic-rm8-recurring-beep-support")).toBe(
      "https://support.dometic.com/en/rm8-refrigerators/Fault-Recurring-beep-4f70",
    );
    expect(supportUrls.get("dometic-rm8-undervoltage-internal-batteries-support")).toBe(
      "https://support.dometic.com/en/rm8-refrigerators/Fault-Undervoltage-detection-internal-batteries-9797",
    );
    expect(supportUrls.get("dometic-rm8-flame-not-ignited-internal-power-support")).toBe(
      "https://support.dometic.com/en/rm8-refrigerators/Fault-Flame-not-ignited-in-internal-power-mode-2ee0",
    );

    expect(codesForSource("dometic-rm8-recurring-beep-support")).toEqual(new Set(["Recurring beep"]));
    expect(codesForSource("dometic-rm8-undervoltage-internal-batteries-support")).toEqual(
      new Set(["Undervoltage detection (internal batteries)"]),
    );
    expect(codesForSource("dometic-rm8-gas-operation-mains-supply-support")).toEqual(
      new Set(["Gas operation despite mains supply voltage"]),
    );
    expect(codesForSource("dometic-rm8-flame-not-ignited-gas-automatic-support")).toEqual(
      new Set(["Flame not ignited in GAS/Automatic mode"]),
    );
    expect(codesForSource("dometic-rm8-ac-power-not-connected-support")).toEqual(
      new Set(["AC power not connected or AC voltage < 190 V"]),
    );
    expect(codesForSource("dometic-rm8-230v-not-available-support")).toEqual(new Set(["230V not available or voltage too low"]));
    expect(codesForSource("dometic-rm8-12v-not-available-support")).toEqual(new Set(["12V not available or voltage too low"]));
    expect(codesForSource("dometic-rm8-gas-operation-batteries-inserted-support")).toEqual(
      new Set(["Refrigerator does not function; gas operation not possible although batteries are inserted"]),
    );
    expect(codesForSource("dometic-rm8-dc-power-not-connected-support")).toEqual(new Set(["DC power not connected"]));
    expect(codesForSource("dometic-rm8-flame-not-ignited-internal-power-support")).toEqual(
      new Set(["Flame not ignited in internal power mode"]),
    );
    expect(codesForSource("dometic-rm8-230v-heating-element-support")).toEqual(new Set(["230V heating element defective"]));
    expect(codesForSource("dometic-rm8-12v-heating-element-support")).toEqual(new Set(["12V heating element defective"]));
    expect(codesForSource("dometic-rm8-flashing-acoustic-signal-support")).toEqual(new Set(["Flashing + acoustic signal 20 s"]));
    expect(codesForSource("dometic-rm8-interior-lighting-support")).toEqual(new Set(["Interior lighting is switched on"]));

    const serviceOnly = corpus.entries.find((entry) => entry.id === "dometic-rm8-230v-heating-element-service-only");
    expect(serviceOnly?.sourceIds).toEqual(["dometic-rm8-230v-heating-element-support"]);
    expect(serviceOnly?.serviceOnlyActions.join(" ")).toContain("authorized service provider");

    for (const id of [
      "dometic-rm8-12v-not-available-voltage-too-low-support-alias",
      "dometic-rm8-dc-power-not-connected-owner-check",
    ]) {
      const entry = entryById(id);
      expect(entry.ownerSafeActions.join(" ")).not.toMatch(/\bfuses?\b/i);
      expect(entry.serviceOnlyActions.join(" ")).toMatch(/\bfuses?\b/i);
    }

    for (const id of [
      "dometic-rm8-230v-heating-element-service-only",
      "dometic-rm8-12v-heating-element-service-only",
    ]) {
      const entry = entryById(id);
      expect(entry.ownerSafeActions.join(" ")).not.toMatch(/energy mode|mode switch|mode-switch/i);
      expect(entry.serviceOnlyActions.join(" ")).toContain("authorized service provider");
    }
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

  it("adds official Cummins Onan generator symptom sources without inventing code entries", () => {
    const expectedSources = new Map([
      ["onan-generator-quick-start", "https://www.cummins.com/sites/default/files/2025-08/onan-generator-quick-start-guide.pdf"],
      ["onan-rv-generator-service-faq", "https://www.cummins.com/en-na/generators/rv-generators/parts-and-maintenance"],
      ["onan-rv-generator-power-basics", "https://www.cummins.com/en-na/generators/rv-generators/power-basics"],
      ["onan-rv-generator-handbook", "https://mart.cummins.com/imagelibrary/Asset/5410860_0125.pdf.ashx"],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const newSymptomIds = [
      "onan-generator-no-start-cranking-delay",
      "onan-generator-no-output-breaker-load-management",
      "onan-generator-altitude-derating-fewer-appliances",
      "onan-generator-fuel-oil-maintenance-before-start",
      "onan-generator-exhaust-co-shutdown-service",
      "onan-generator-battery-low-cranking",
    ];

    for (const [sourceId, url] of expectedSources) {
      const source = corpus.sources.find((item) => item.id === sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const symptomId of newSymptomIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.safeChecklist.join(" "), symptomId).not.toMatch(
        /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\brefrigerant\b|\bprobe\b|\bopen (the )?(fuel|gas|electrical)|fuel line|wiring|voltage testing/i,
      );
    }

    expect(symptomById.get("onan-generator-no-start-cranking-delay")?.sourceIds).toEqual(
      expect.arrayContaining(["onan-generator-quick-start", "onan-rv-generator-service-faq", "onan-rv-generator-handbook"]),
    );
    expect(
      [
        symptomById.get("onan-generator-no-start-cranking-delay")?.summary,
        symptomById.get("onan-generator-no-start-cranking-delay")?.safeChecklist.join(" "),
      ].join(" "),
    ).toMatch(/preheat|30 seconds|20 seconds|2 minutes|over.?crank/i);

    expect(symptomById.get("onan-generator-no-output-breaker-load-management")?.sourceIds).toEqual(
      expect.arrayContaining(["onan-generator-quick-start", "onan-rv-generator-service-faq", "onan-rv-generator-power-basics", "onan-rv-generator-handbook"]),
    );
    expect(
      [
        symptomById.get("onan-generator-no-output-breaker-load-management")?.summary,
        symptomById.get("onan-generator-no-output-breaker-load-management")?.safeChecklist.join(" "),
      ].join(" "),
    ).toMatch(/breaker|too many appliances|combined wattage|qualified technician/i);

    expect(symptomById.get("onan-generator-altitude-derating-fewer-appliances")?.sourceIds).toEqual(
      expect.arrayContaining(["onan-generator-quick-start", "onan-rv-generator-handbook"]),
    );
    expect(
      [
        symptomById.get("onan-generator-altitude-derating-fewer-appliances")?.summary,
        symptomById.get("onan-generator-altitude-derating-fewer-appliances")?.safeChecklist.join(" "),
      ].join(" "),
    ).toMatch(/3\.5|1000 feet|altitude|fewer appliances/i);

    expect(symptomById.get("onan-generator-fuel-oil-maintenance-before-start")?.sourceIds).toEqual(
      expect.arrayContaining(["onan-generator-quick-start", "onan-rv-generator-service-faq", "onan-rv-generator-handbook"]),
    );
    expect(
      [
        symptomById.get("onan-generator-fuel-oil-maintenance-before-start")?.summary,
        symptomById.get("onan-generator-fuel-oil-maintenance-before-start")?.safeChecklist.join(" "),
      ].join(" "),
    ).toMatch(/fuel|engine oil|150 hours|air cleaner|dusty/i);

    expect(symptomById.get("onan-generator-exhaust-co-shutdown-service")?.sourceIds).toEqual(
      expect.arrayContaining(["onan-generator-quick-start", "onan-rv-generator-handbook"]),
    );
    expect(
      [
        symptomById.get("onan-generator-exhaust-co-shutdown-service")?.summary,
        symptomById.get("onan-generator-exhaust-co-shutdown-service")?.safeChecklist.join(" "),
      ].join(" "),
    ).toMatch(/CO detector|carbon monoxide|exhaust leak|shut down|qualified/i);

    expect(symptomById.get("onan-generator-battery-low-cranking")?.sourceIds).toEqual(
      expect.arrayContaining(["onan-generator-quick-start", "onan-rv-generator-handbook"]),
    );
    expect(
      [
        symptomById.get("onan-generator-battery-low-cranking")?.summary,
        symptomById.get("onan-generator-battery-low-cranking")?.safeChecklist.join(" "),
      ].join(" "),
    ).toMatch(/battery|600 Cold Cranking Amps|terminals|starting/i);

    const symptomIndex = buildSymptomSearchIndex(corpus);
    expect(lookupSymptomGuides(symptomIndex, "onan no start wait 2 minutes overcrank")[0]?.slug).toBe(
      "onan-generator-no-start-cranking-delay-overcrank",
    );
    expect(lookupSymptomGuides(symptomIndex, "onan no output breaker too many appliances")[0]?.slug).toBe(
      "onan-generator-no-output-breaker-load-management",
    );
    expect(lookupSymptomGuides(symptomIndex, "onan high altitude 3.5 percent fewer appliances")[0]?.slug).toBe(
      "onan-generator-altitude-derating-fewer-appliances",
    );
    expect(lookupSymptomGuides(symptomIndex, "onan carbon monoxide exhaust leak co detector")[0]?.slug).toBe(
      "onan-generator-exhaust-co-shutdown-service",
    );

    expect(symptomById.get("generator-stopped")?.sourceIds).toEqual(
      expect.arrayContaining(["onan-generator-quick-start", "onan-rv-generator-service-faq"]),
    );
    expect(symptomById.get("low-voltage")?.sourceIds).toEqual(expect.arrayContaining(["onan-generator-quick-start", "onan-rv-generator-handbook"]));
    expect(symptomById.get("airflow-or-venting")?.sourceIds).toEqual(
      expect.arrayContaining(["onan-generator-quick-start", "onan-rv-generator-handbook"]),
    );
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds official Cummins Onan spec-sheet, accessory, and winterization prep sources without inventing code entries", () => {
    const expectedSources = new Map([
      [
        "onan-rv-commercial-mobile-accessory-catalog-0080258",
        "https://mart.cummins.com/imagelibrary/data/assetfiles/0080258.pdf",
      ],
      ["onan-generator-winterization-flyer-5410842", "https://mart.cummins.com/imagelibrary/data/assetfiles/0042882.pdf"],
      ["onan-qg-4000-spec-sheet", "https://cssna-ec.cummins.com/pub/RVGenerator_QG%204000_SpecSheet.PDF"],
      ["onan-qg-5500-spec-sheet", "https://cssna-ec.cummins.com/pub/RVGenerator_QG%205500_SpecSheet.PDF"],
      ["onan-qg-7000-6500-spec-sheet", "https://cssna-ec.cummins.com/pub/RVGenerator_QG%207000_6500_SpecSheet.PDF"],
      [
        "onan-qg-7000idf-commercial-spec-sheet-2026",
        "https://www.cummins.com/sites/default/files/2026-01/qg-7000idf-commercial-spec-sheet.pdf",
      ],
    ]);
    const expectedSymptomSourceIds = new Map<string, string[]>([
      [
        "onan-generator-storage-winterization-no-start-service-prep",
        ["onan-generator-winterization-flyer-5410842", "onan-generator-quick-start", "onan-rv-generator-service-faq"],
      ],
      [
        "onan-generator-remote-panel-accessory-part-service-prep",
        ["onan-rv-commercial-mobile-accessory-catalog-0080258", "onan-rv-manual-index"],
      ],
      [
        "onan-qg-load-rating-model-spec-service-prep",
        [
          "onan-qg-4000-spec-sheet",
          "onan-qg-5500-spec-sheet",
          "onan-qg-7000-6500-spec-sheet",
          "onan-qg-7000idf-commercial-spec-sheet-2026",
          "onan-rv-generator-power-basics",
          "onan-rv-generator-handbook",
        ],
      ],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\brefrigerant\b|\bprobe\b|\bopen (the )?(fuel|gas|electrical)|fuel line|wiring|voltage testing|install.*kit|remove.*cover|measure resistance|harness testing/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, sourceIds] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(sourceIds);
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
    }

    expect(symptomById.get("onan-generator-storage-winterization-no-start-service-prep")?.safeChecklist.join(" ")).toMatch(
      /storage|winterization|last run|qualified|model|serial/i,
    );
    expect(symptomById.get("onan-generator-remote-panel-accessory-part-service-prep")?.safeChecklist.join(" ")).toMatch(
      /remote panel|display|accessory|part number|qualified/i,
    );
    expect(symptomById.get("onan-qg-load-rating-model-spec-service-prep")?.safeChecklist.join(" ")).toMatch(
      /rated watts|load|altitude|temperature|qualified/i,
    );

    expect(symptomById.get("onan-generator-no-start-cranking-delay")?.sourceIds).toContain(
      "onan-generator-winterization-flyer-5410842",
    );
    expect(symptomById.get("onan-generator-fuel-oil-maintenance-before-start")?.sourceIds).toContain(
      "onan-generator-winterization-flyer-5410842",
    );
    expect(symptomById.get("onan-generator-no-output-breaker-load-management")?.sourceIds).toEqual(
      expect.arrayContaining(["onan-qg-4000-spec-sheet", "onan-qg-5500-spec-sheet", "onan-qg-7000-6500-spec-sheet"]),
    );
    expect(symptomById.get("onan-generator-altitude-derating-fewer-appliances")?.sourceIds).toEqual(
      expect.arrayContaining([
        "onan-qg-4000-spec-sheet",
        "onan-qg-5500-spec-sheet",
        "onan-qg-7000-6500-spec-sheet",
        "onan-qg-7000idf-commercial-spec-sheet-2026",
      ]),
    );
    expect(symptomById.get("generator-stopped")?.sourceIds).toEqual(
      expect.arrayContaining(["onan-generator-winterization-flyer-5410842", "onan-rv-commercial-mobile-accessory-catalog-0080258"]),
    );
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds official Suburban, MaxxAir, and Aqua-Hot service-prep sources without inventing code entries", () => {
    const expectedSources = new Map([
      ["suburban-model-number-locator", "https://suburbanrv.com/service-support/find-model-number/"],
      ["suburban-service-center-dealer-locator", "https://suburbanrv.com/service-support/service-locator/"],
      [
        "maxxair-maxxfan-deluxe-iom-11e90001k",
        "https://library.maxxair.com/wp-content/uploads/2023/03/11e90001k_maxxfan-deluxe-install-11-2017.pdf",
      ],
      [
        "maxxair-wall-control-iom-4-5-6-key",
        "https://library.maxxair.com/wp-content/uploads/2023/03/maxxair-4-5-6-key-wall-control-installation-and-operation-manual.pdf",
      ],
      ["aquahot-250-p01-use-care-guide", "https://library.aquahot.com/wp-content/uploads/2022/04/AHE-250-P01-Use-and-Care-Guide.pdf"],
    ]);
    const expectedSymptomSourceIds = new Map<string, string[]>([
      ["suburban-model-number-service-prep", ["suburban-model-number-locator", "suburban-service-center-dealer-locator"]],
      ["maxxair-maxxfan-deluxe-control-service-prep", ["maxxair-maxxfan-deluxe-iom-11e90001k"]],
      ["maxxair-wall-control-456-service-prep", ["maxxair-wall-control-iom-4-5-6-key"]],
      ["aquahot-250-p01-use-care-service-prep", ["aquahot-250-p01-use-care-guide"]],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\bline-voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\broof\b|\bhydronic\b|\bcoolant\b|\bpropane\b|\bopen (the )?(fuel|gas|electrical|rooftop)|fuel line|install.*fan|remove.*shroud|remove.*cover|measure resistance|harness testing/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, sourceIds] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(sourceIds);
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
    }

    expect(symptomById.get("suburban-model-number-service-prep")?.safeChecklist.join(" ")).toMatch(
      /model number|serial|service locator|Suburban|qualified/i,
    );
    expect(symptomById.get("maxxair-maxxfan-deluxe-control-service-prep")?.safeChecklist.join(" ")).toMatch(
      /keypad|lid|fan speed|rain sensor|qualified/i,
    );
    expect(symptomById.get("maxxair-wall-control-456-service-prep")?.safeChecklist.join(" ")).toMatch(
      /wall control|display|fan speed|IN\/OUT|qualified/i,
    );
    expect(symptomById.get("aquahot-250-p01-use-care-service-prep")?.safeChecklist.join(" ")).toMatch(
      /winterization|storage|hot water|Aqua-Hot|qualified/i,
    );
    expect(
      [
        symptomById.get("aquahot-250-p01-use-care-service-prep")?.summary,
        symptomById.get("aquahot-250-p01-use-care-service-prep")?.safeChecklist.join(" "),
      ].join(" "),
    ).toMatch(/owner-visible|record|qualified Aqua-Hot service|do not perform/i);
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds official Cummins Energy Command status guides without inventing generator fault-code entries", () => {
    const expectedSources = new Map([
      ["onan-energy-command-30-900-0541b", "https://www.cummins.com/sites/default/files/2018-08/900-0541B-energy-command-operation.pdf"],
      ["onan-ec-ags-plus-owner-a065f574", "https://www.cummins.com/sites/default/files/2022-01/a065f574_i4_202111_issue5.pdf"],
      ["onan-ec-ags-plus-quick-start-a066j123", "https://www.cummins.com/sites/default/files/2021-11/a066j123_quick_start_guide.pdf"],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const newSymptomIds = [
      "onan-energy-command-safety-off-on-auto-disabled",
      "onan-energy-command-auto-run-low-battery",
      "onan-energy-command-service-due-reminder",
      "onan-ec-ags-plus-auto-mode-does-not-start",
      "onan-ec-ags-plus-generator-does-not-run-ac",
      "onan-ec-ags-plus-unexpected-start-stop",
    ];

    for (const [sourceId, url] of expectedSources) {
      const source = corpus.sources.find((item) => item.id === sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const symptomId of newSymptomIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds.length, symptomId).toBeGreaterThan(0);
      expect(symptom?.safeChecklist.join(" "), symptomId).not.toMatch(
        /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\brefrigerant\b|\bprobe\b|\bopen (the )?(fuel|gas|electrical)|fuel line|wiring|wire|harness continuity|replace.*gateway|voltage testing|measure resistance/i,
      );
    }

    expect(symptomById.get("onan-energy-command-safety-off-on-auto-disabled")?.sourceIds).toEqual(
      expect.arrayContaining(["onan-energy-command-30-900-0541b", "onan-ec-ags-plus-owner-a065f574"]),
    );
    expect(
      [
        symptomById.get("onan-energy-command-safety-off-on-auto-disabled")?.summary,
        symptomById.get("onan-energy-command-safety-off-on-auto-disabled")?.safeChecklist.join(" "),
      ].join(" "),
    ).toMatch(/SAFETY OFF & ON|AUTO ON|QUIET ON|safe location|confined space/i);

    expect(symptomById.get("onan-energy-command-auto-run-low-battery")?.sourceIds).toEqual(
      expect.arrayContaining(["onan-energy-command-30-900-0541b", "onan-ec-ags-plus-owner-a065f574"]),
    );
    const lowBatteryText = [
      symptomById.get("onan-energy-command-auto-run-low-battery")?.summary,
      symptomById.get("onan-energy-command-auto-run-low-battery")?.safeChecklist.join(" "),
    ].join(" ");
    expect(lowBatteryText).toMatch(/AUTO RUN LOW BAT|AUTO STOP FULL BAT|Start @ V|Stop @ V|qualified/i);
    expect(lowBatteryText).toMatch(/confined space/i);
    expect(lowBatteryText).toMatch(/disable AGS/i);

    expect(symptomById.get("onan-energy-command-service-due-reminder")?.sourceIds).toEqual(
      expect.arrayContaining(["onan-energy-command-30-900-0541b", "onan-ec-ags-plus-owner-a065f574"]),
    );
    const serviceDueText = [
      symptomById.get("onan-energy-command-service-due-reminder")?.summary,
      symptomById.get("onan-energy-command-service-due-reminder")?.safeChecklist.join(" "),
    ].join(" ");
    expect(serviceDueText).toMatch(/SERVICE IN|SERVICE DUE|ENTER to Reset|maintenance|exercise reminders|qualified/i);
    expect(serviceDueText).toMatch(/disable AGS/i);

    expect(symptomById.get("onan-ec-ags-plus-auto-mode-does-not-start")?.summary).toMatch(
      /Auto Mode|accelerometer|quiet-time|mobile-device clock/i,
    );
    expect(symptomById.get("onan-ec-ags-plus-generator-does-not-run-ac")?.summary).toMatch(
      /temperature-sensor battery|Bluetooth range|quiet-time|gateway battery/i,
    );
    expect(symptomById.get("onan-ec-ags-plus-unexpected-start-stop")?.summary).toMatch(
      /unexpected starts|unexpected.*stops|house-battery start|accelerometer/i,
    );
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
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

  it("adds official-source Lippert leveling and slide symptom guides without new code entries", () => {
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));

    expect(symptomById.get("lippert-ground-control-low-voltage-battery-leveling")?.sourceIds).toEqual(
      expect.arrayContaining(["lippert-ground-control", "lippert-ground-control-onecontrol-5th", "lippert-ground-control-tt-onecontrol"]),
    );
    expect(symptomById.get("lippert-ground-control-auto-level-excess-angle-out-of-stroke")?.sourceIds).toEqual(
      expect.arrayContaining(["lippert-ground-control", "lippert-ground-control-onecontrol-5th", "lippert-ground-control-tt-onecontrol"]),
    );
    expect(symptomById.get("lippert-in-wall-slide-obstruction-or-motor-sync")?.sourceIds).toEqual(["lippert-in-wall-slide"]);
    expect(symptomById.get("lippert-in-wall-slide-red-green-led-low-voltage-service")?.sourceIds).toEqual([
      "lippert-in-wall-slide",
    ]);

    expect(
      corpus.entries.filter((entry) =>
        [
          "lippert-ground-control-low-voltage-battery-leveling",
          "lippert-ground-control-auto-level-excess-angle-out-of-stroke",
          "lippert-in-wall-slide-obstruction-or-motor-sync",
          "lippert-in-wall-slide-red-green-led-low-voltage-service",
        ].includes(entry.slug),
      ),
    ).toEqual([]);
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
    expect(symptomById.get("furrion-furnace-will-not-light-blower-no-start")?.sourceIds).toEqual([
      "furrion-furnace-troubleshooting",
    ]);
    expect(symptomById.get("furrion-furnace-short-cycles-before-set-temperature")?.sourceIds).toEqual([
      "furrion-furnace-troubleshooting",
    ]);
    expect(symptomById.get("furrion-furnace-soot-yellow-flame-exhaust-service")?.sourceIds).toEqual([
      "furrion-furnace-troubleshooting",
    ]);
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

  it("adds official Suburban furnace and water-heater symptom support without inventing code entries", () => {
    const sourceById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const newSymptomIds = [
      "suburban-furnace-blowing-cold-air-lockout",
      "suburban-furnace-airflow-overheat-soot",
      "suburban-furnace-low-voltage-low-gas-service",
      "suburban-tank-water-heater-reset-light-lockout",
      "suburban-tank-water-heater-pt-relief-air-pocket",
      "suburban-tank-water-heater-odor-anode",
      "suburban-tank-water-heater-winterizing-drain-freeze",
      "suburban-water-heater-soot-gas-smell-service",
      "suburban-tankless-freeze-voltage-protection",
    ];

    expect(sourceById.get("suburban-rv-faqs")?.official).toBe(true);
    expect(sourceById.get("suburban-rv-faqs")?.url).toBe("https://suburbanrv.com/service-support/faqs/");
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.entries.filter((entry) => entry.sourceIds.includes("suburban-rv-faqs"))).toHaveLength(0);

    for (const symptomId of newSymptomIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.safeChecklist.join(" "), symptomId).not.toMatch(
        /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\brefrigerant\b|\bprobe\b|\bopen (the )?(fuel|gas|electrical|rooftop)/i,
      );
    }

    expect(symptomById.get("suburban-furnace-blowing-cold-air-lockout")?.sourceIds).toEqual(
      expect.arrayContaining(["suburban-furnace-guide", "suburban-rv-faqs"]),
    );
    expect(symptomById.get("suburban-furnace-airflow-overheat-soot")?.sourceIds).toEqual(
      expect.arrayContaining(["suburban-furnace-guide", "suburban-rv-faqs"]),
    );
    expect(symptomById.get("suburban-furnace-low-voltage-low-gas-service")?.safeChecklist.join(" ")).toMatch(
      /certified service technician/i,
    );
    expect(symptomById.get("suburban-tank-water-heater-reset-light-lockout")?.sourceIds).toEqual([
      "suburban-tank-water-heater",
    ]);
    expect(symptomById.get("suburban-tank-water-heater-pt-relief-air-pocket")?.sourceIds).toEqual(
      expect.arrayContaining(["suburban-tank-water-heater", "suburban-rv-faqs"]),
    );
    expect(symptomById.get("suburban-tank-water-heater-pt-relief-air-pocket")?.safeChecklist.join(" ")).not.toMatch(
      /install.*expansion|replace.*relief/i,
    );
    expect(symptomById.get("suburban-tank-water-heater-odor-anode")?.sourceIds).toEqual(
      expect.arrayContaining(["suburban-tank-water-heater", "suburban-rv-faqs"]),
    );
    expect(symptomById.get("suburban-tank-water-heater-winterizing-drain-freeze")?.sourceIds).toEqual(
      expect.arrayContaining(["suburban-tank-water-heater", "suburban-rv-faqs"]),
    );
    expect(symptomById.get("suburban-water-heater-soot-gas-smell-service")?.sourceIds).toEqual(
      expect.arrayContaining(["suburban-tank-water-heater", "suburban-st42-st60-water-heater", "suburban-rv-faqs"]),
    );
    expect(symptomById.get("suburban-water-heater-soot-gas-smell-service")?.safeChecklist.join(" ")).toMatch(
      /evacuate|qualified service/i,
    );
    expect(symptomById.get("suburban-tankless-freeze-voltage-protection")?.sourceIds).toEqual(
      expect.arrayContaining(["suburban-tankless-water-heater", "suburban-st42-st60-water-heater", "suburban-rv-faqs"]),
    );
    expect(symptomById.get("suburban-tankless-freeze-voltage-protection")?.safeChecklist.join(" ")).toMatch(/10VDC|17VDC/i);

    expect(symptomById.get("furnace-lockout")?.sourceIds).toContain("suburban-rv-faqs");
    expect(symptomById.get("furnace-stops-before-setpoint")?.sourceIds).toContain("suburban-rv-faqs");
    expect(symptomById.get("airflow-or-venting")?.sourceIds).toEqual(
      expect.arrayContaining(["suburban-rv-faqs", "suburban-tank-water-heater"]),
    );
    expect(symptomById.get("low-voltage")?.sourceIds).toEqual(
      expect.arrayContaining(["suburban-rv-faqs", "suburban-tank-water-heater", "suburban-st42-st60-water-heater"]),
    );
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(
      expect.arrayContaining(["suburban-rv-faqs", "suburban-furnace-guide", "suburban-tank-water-heater"]),
    );

    expect(corpus.entries.find((entry) => entry.id === "suburban-furnace-lockout")?.symptomIds).toEqual(
      expect.arrayContaining(["suburban-furnace-blowing-cold-air-lockout", "suburban-furnace-airflow-overheat-soot"]),
    );
    expect(corpus.entries.find((entry) => entry.id === "suburban-water-heater-reset-light")?.symptomIds).toContain(
      "suburban-tank-water-heater-reset-light-lockout",
    );
  });

  it("adds official Suburban model-specific ducting and cold-inlet symptom support without inventing code entries", () => {
    const sourceById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const newSourceIds = ["suburban-sf-vh-ducting-guide", "suburban-st42-st60-product-overview"];
    const newSymptomIds = [
      "suburban-sf-vh-duct-port-limit-cycling",
      "suburban-sf-vh-return-air-register-layout",
      "suburban-sf-vh-thermostat-premature-satisfaction",
      "suburban-st42-cold-inlet-winter-underperformance",
    ];

    expect(sourceById.get("suburban-sf-vh-ducting-guide")?.official).toBe(true);
    expect(sourceById.get("suburban-sf-vh-ducting-guide")?.url).toBe(
      "https://library.suburbanrv.com/wp-content/uploads/2023/05/Ducting-Guidance-Document-v1.pdf",
    );
    expect(sourceById.get("suburban-st42-st60-product-overview")?.official).toBe(true);
    expect(sourceById.get("suburban-st42-st60-product-overview")?.url).toBe(
      "https://suburbanrv.com/files/product_documents/Tankless%20Water%20Heater/ST%204260%20Tankless%20Water%20Heater%20Sell%20Sheet%20111522.pdf",
    );
    expect(corpus.entries).toHaveLength(expectedEntryCount);

    for (const sourceId of newSourceIds) {
      expect(corpus.entries.filter((entry) => entry.sourceIds.includes(sourceId)), sourceId).toHaveLength(0);
    }

    for (const symptomId of newSymptomIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.safeChecklist.join(" "), symptomId).not.toMatch(
        /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\brefrigerant\b|\bprobe\b|\bopen (the )?(fuel|gas|electrical|rooftop)/i,
      );
    }

    expect(symptomById.get("suburban-sf-vh-duct-port-limit-cycling")?.sourceIds).toEqual([
      "suburban-sf-vh-ducting-guide",
    ]);
    expect(symptomById.get("suburban-sf-vh-duct-port-limit-cycling")?.summary).toMatch(
      /port #?2|port #?3|port #?5|520753/i,
    );
    expect(symptomById.get("suburban-sf-vh-return-air-register-layout")?.sourceIds).toEqual([
      "suburban-sf-vh-ducting-guide",
    ]);
    expect(symptomById.get("suburban-sf-vh-return-air-register-layout")?.summary).toMatch(
      /18.?in|return air|air boosters/i,
    );
    expect(symptomById.get("suburban-sf-vh-thermostat-premature-satisfaction")?.sourceIds).toEqual([
      "suburban-sf-vh-ducting-guide",
    ]);
    expect(symptomById.get("suburban-sf-vh-thermostat-premature-satisfaction")?.safeChecklist.join(" ")).toMatch(
      /4-1\/2|inside wall|return grate|thermostat/i,
    );
    expect(symptomById.get("suburban-st42-cold-inlet-winter-underperformance")?.sourceIds).toEqual(
      expect.arrayContaining(["suburban-st42-st60-product-overview", "suburban-st42-st60-water-heater"]),
    );
    expect(symptomById.get("suburban-st42-cold-inlet-winter-underperformance")?.summary).toMatch(
      /70.?F|ST60|0\.7 GPM|1\.5 GPM/i,
    );

    expect(symptomById.get("airflow-or-venting")?.sourceIds).toContain("suburban-sf-vh-ducting-guide");
    expect(symptomById.get("furnace-stops-before-setpoint")?.sourceIds).toContain("suburban-sf-vh-ducting-guide");
    expect(symptomById.get("suburban-tankless-low-flow-temperature")?.sourceIds).toContain(
      "suburban-st42-st60-product-overview",
    );
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(
      expect.arrayContaining(["suburban-sf-vh-ducting-guide", "suburban-st42-st60-product-overview"]),
    );
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

  it("adds official Coleman-Mach rooftop AC and heat-pump symptom sources without inventing code entries", () => {
    const expectedSources = new Map([
      ["coleman-mach-faqs", "https://coleman-mach.com/service-support/faqs/"],
      ["coleman-cooling-performance-worksheet", "https://coleman-mach.com/files/CPW.pdf"],
      ["coleman-rooftop-operation-maintenance-1971-982", "https://library.coleman-mach.com/wp-content/uploads/2023/04/1971-982.pdf"],
      ["coleman-chillgrille-control-kit-1976-658", "https://library.coleman-mach.com/wp-content/uploads/2023/04/1976-658.pdf"],
      ["coleman-mach8-heat-pump-service-1976-665", "https://library.coleman-mach.com/wp-content/uploads/2023/04/1976-665.pdf"],
      ["coleman-45000-installation-1976-687", "https://library.coleman-mach.com/wp-content/uploads/2023/04/1976-687.pdf"],
      ["coleman-mach8-condensate-pump-kit-1976-681", "https://library.coleman-mach.com/wp-content/uploads/2023/04/1976-681.pdf"],
      ["coleman-warranty-refrigeration-circuit", "https://coleman-mach.com/service-support/warranty/"],
      ["coleman-46515-heat-pump-owner", "https://library.coleman-mach.com/wp-content/uploads/2023/04/1976-566.pdf"],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const newSymptomIds = [
      "coleman-rooftop-ac-not-cooling-temperature-delta",
      "coleman-rooftop-ac-freeze-up-low-airflow",
      "coleman-rooftop-ac-low-voltage-extension-cord",
      "coleman-rooftop-ac-fan-runs-no-compressor-service",
      "coleman-rooftop-ac-condensate-water-inside",
      "coleman-mach-thermostat-fan-only-no-cooling",
      "coleman-mach-heat-pump-below-45-blower-running",
    ];

    for (const [sourceId, url] of expectedSources) {
      const source = corpus.sources.find((item) => item.id === sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const symptomId of newSymptomIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.safeChecklist.join(" "), symptomId).not.toMatch(
        /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\brefrigerant\b|\bprobe\b|\bopen (the )?(fuel|gas|electrical|rooftop)/i,
      );
    }

    expect(symptomById.get("coleman-rooftop-ac-not-cooling-temperature-delta")?.sourceIds).toEqual(
      expect.arrayContaining([
        "coleman-mach-faqs",
        "coleman-cooling-performance-worksheet",
        "coleman-rooftop-operation-maintenance-1971-982",
      ]),
    );
    expect(
      [
        symptomById.get("coleman-rooftop-ac-not-cooling-temperature-delta")?.summary,
        symptomById.get("coleman-rooftop-ac-not-cooling-temperature-delta")?.safeChecklist.join(" "),
      ].join(" "),
    ).toMatch(/16-22|HIGH COOL|15-20|return air|supply register/i);

    expect(symptomById.get("coleman-rooftop-ac-freeze-up-low-airflow")?.sourceIds).toEqual(
      expect.arrayContaining([
        "coleman-mach-faqs",
        "coleman-rooftop-operation-maintenance-1971-982",
        "coleman-chillgrille-control-kit-1976-658",
        "coleman-46515-heat-pump-owner",
      ]),
    );
    expect(
      [
        symptomById.get("coleman-rooftop-ac-freeze-up-low-airflow")?.summary,
        symptomById.get("coleman-rooftop-ac-freeze-up-low-airflow")?.safeChecklist.join(" "),
      ].join(" "),
    ).toMatch(/28|55|HIGH FAN|filter|low fan/i);

    expect(symptomById.get("coleman-rooftop-ac-low-voltage-extension-cord")?.sourceIds).toEqual(
      expect.arrayContaining(["coleman-mach-faqs", "coleman-45000-installation-1976-687", "coleman-46515-heat-pump-owner"]),
    );
    expect(
      [
        symptomById.get("coleman-rooftop-ac-low-voltage-extension-cord")?.summary,
        symptomById.get("coleman-rooftop-ac-low-voltage-extension-cord")?.safeChecklist.join(" "),
      ].join(" "),
    ).toMatch(/extension cord|15.?amp|cheater|30.?amp|voltage drop/i);

    expect(symptomById.get("coleman-rooftop-ac-fan-runs-no-compressor-service")?.sourceIds).toEqual(
      expect.arrayContaining(["coleman-mach8-heat-pump-service-1976-665", "coleman-chillgrille-control-kit-1976-658", "coleman-mach-faqs"]),
    );
    expect(symptomById.get("coleman-rooftop-ac-fan-runs-no-compressor-service")?.summary).toMatch(
      /fan runs.*no compressor|freeze switch|sealed system|qualified/i,
    );

    expect(symptomById.get("coleman-rooftop-ac-condensate-water-inside")?.sourceIds).toEqual(
      expect.arrayContaining(["coleman-45000-installation-1976-687", "coleman-mach8-condensate-pump-kit-1976-681"]),
    );
    expect(symptomById.get("coleman-rooftop-ac-condensate-water-inside")?.summary).toMatch(/condensate|gasket|drain hose|water/i);

    expect(symptomById.get("coleman-mach-thermostat-fan-only-no-cooling")?.sourceIds).toEqual(
      expect.arrayContaining([
        "coleman-9330-thermostat",
        "coleman-9420-thermostat",
        "coleman-9430-thermostat",
        "coleman-6535-335-heat-pump-thermostat",
        "coleman-6536-335-heat-pump-thermostat",
      ]),
    );
    expect(symptomById.get("coleman-mach-thermostat-fan-only-no-cooling")?.summary).toMatch(/fan.?only|compressor|mode/i);

    expect(symptomById.get("coleman-mach-heat-pump-below-45-blower-running")?.sourceIds).toEqual(
      expect.arrayContaining(["coleman-mach-faqs", "coleman-46515-heat-pump-owner"]),
    );
    expect(
      [
        symptomById.get("coleman-mach-heat-pump-below-45-blower-running")?.summary,
        symptomById.get("coleman-mach-heat-pump-below-45-blower-running")?.safeChecklist.join(" "),
      ].join(" "),
    ).toMatch(/45.?F|blower|LP furnace|30.?second/i);

    expect(symptomById.get("air-conditioner-not-cooling")?.sourceIds).toEqual(
      expect.arrayContaining([
        "coleman-mach-faqs",
        "coleman-cooling-performance-worksheet",
        "coleman-rooftop-operation-maintenance-1971-982",
      ]),
    );
    expect(symptomById.get("air-conditioner-water-leak")?.sourceIds).toEqual(
      expect.arrayContaining(["coleman-45000-installation-1976-687", "coleman-mach8-condensate-pump-kit-1976-681"]),
    );
    expect(symptomById.get("airflow-or-venting")?.sourceIds).toEqual(
      expect.arrayContaining([
        "coleman-mach-faqs",
        "coleman-rooftop-operation-maintenance-1971-982",
        "coleman-chillgrille-control-kit-1976-658",
      ]),
    );
    expect(symptomById.get("low-voltage")?.sourceIds).toEqual(
      expect.arrayContaining(["coleman-mach-faqs", "coleman-45000-installation-1976-687", "coleman-46515-heat-pump-owner"]),
    );
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds official Coleman-Mach Wi-Fi thermostat and 48000 symptom sources without inventing code entries", () => {
    const expectedSources = new Map([
      ["coleman-wifi-thermostat-product-page", "https://coleman-mach.com/products/thermostats/wifi-thermostats/"],
      [
        "coleman-wifi-thermostat-iom-9420-391",
        "https://library.coleman-mach.com/wp-content/uploads/2026/04/9420-391_WIFI-THERMOSTAT_IOM_Manual.pdf",
      ],
      [
        "coleman-wifi-thermostat-compatibility-guide",
        "https://coleman-mach.com/files/wifi/CM-160274.01_WiFi%20Thermostat%20Compatibility%20Guide.pdf",
      ],
      ["coleman-48000-heat-pump-owner-1980-023", "https://library.coleman-mach.com/wp-content/uploads/2023/12/1980-023.pdf"],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const newSymptomIds = [
      "coleman-wifi-thermostat-2-4ghz-app-connection",
      "coleman-wifi-thermostat-compatibility-upgrade-check",
      "coleman-wifi-thermostat-eco-comfort-schedule-mode",
      "coleman-48000-heat-pump-high-pressure-lockout",
    ];
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\brefrigerant\b|\bprobe\b|\bopen (the )?(fuel|gas|electrical|rooftop)|wire|wiring|line-voltage|breaker panel|remove.*thermostat|replace.*control/i;

    for (const [sourceId, url] of expectedSources) {
      const source = corpus.sources.find((item) => item.id === sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const symptomId of newSymptomIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds.length, symptomId).toBeGreaterThan(0);
      expect(symptom?.safeChecklist.join(" "), symptomId).not.toMatch(unsafeOwnerActionPattern);
    }

    expect(symptomById.get("coleman-wifi-thermostat-2-4ghz-app-connection")?.sourceIds).toEqual(
      expect.arrayContaining([
        "coleman-wifi-thermostat-product-page",
        "coleman-wifi-thermostat-iom-9420-391",
        "coleman-wifi-thermostat-compatibility-guide",
      ]),
    );
    expect(
      [
        symptomById.get("coleman-wifi-thermostat-2-4ghz-app-connection")?.summary,
        symptomById.get("coleman-wifi-thermostat-2-4ghz-app-connection")?.safeChecklist.join(" "),
      ].join(" "),
    ).toMatch(/2\.4GHz|Smart Life|Tuya|local controls|qualified/i);

    expect(symptomById.get("coleman-wifi-thermostat-compatibility-upgrade-check")?.sourceIds).toEqual(
      expect.arrayContaining(["coleman-wifi-thermostat-product-page", "coleman-wifi-thermostat-compatibility-guide"]),
    );
    expect(
      [
        symptomById.get("coleman-wifi-thermostat-compatibility-upgrade-check")?.summary,
        symptomById.get("coleman-wifi-thermostat-compatibility-upgrade-check")?.safeChecklist.join(" "),
      ].join(" "),
    ).toMatch(/12VDC|24VAC|analog|Bluetooth|features may operate differently|qualified/i);

    expect(symptomById.get("coleman-wifi-thermostat-eco-comfort-schedule-mode")?.sourceIds).toEqual(
      expect.arrayContaining(["coleman-wifi-thermostat-product-page", "coleman-wifi-thermostat-compatibility-guide"]),
    );
    expect(
      [
        symptomById.get("coleman-wifi-thermostat-eco-comfort-schedule-mode")?.summary,
        symptomById.get("coleman-wifi-thermostat-eco-comfort-schedule-mode")?.safeChecklist.join(" "),
      ].join(" "),
    ).toMatch(/Eco|Comfort|Scheduling|fan speed|local thermostat/i);

    expect(symptomById.get("coleman-48000-heat-pump-high-pressure-lockout")?.sourceIds).toEqual([
      "coleman-48000-heat-pump-owner-1980-023",
    ]);
    expect(
      [
        symptomById.get("coleman-48000-heat-pump-high-pressure-lockout")?.summary,
        symptomById.get("coleman-48000-heat-pump-high-pressure-lockout")?.safeChecklist.join(" "),
      ].join(" "),
    ).toMatch(/High Pressure Switch|dirty filters|qualified technician|lockout/i);

    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds official Coleman-Mach 48000 AC owner manual and 2025 AMCAT catalog sources without inventing code entries", () => {
    const expectedSources = new Map([
      ["coleman-48000-ac-owner-1976-523", "https://library.coleman-mach.com/wp-content/uploads/2023/12/1976-523.pdf"],
      ["coleman-2025-amcat-catalog", "https://coleman-mach.com/files/catalog/CM-4040.02_2025%20AMCAT.pdf"],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const newSymptomIds = [
      "coleman-48000-ac-cool-night-evaporator-ice-up",
      "coleman-48000-ac-short-cycle-breaker-trip",
      "coleman-48000-elect-a-heat-not-furnace",
      "coleman-2025-amcat-part-model-lookup",
    ];
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\brefrigerant\b|\bprobe\b|\bopen (the )?(fuel|gas|electrical|rooftop)|wire|wiring|line-voltage|breaker panel|remove.*thermostat|replace.*control|remove.*shroud|install.*soft start/i;

    for (const [sourceId, url] of expectedSources) {
      const source = corpus.sources.find((item) => item.id === sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const symptomId of newSymptomIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds.length, symptomId).toBeGreaterThan(0);
      expect(symptom?.safeChecklist.join(" "), symptomId).not.toMatch(unsafeOwnerActionPattern);
    }

    expect(symptomById.get("coleman-48000-ac-cool-night-evaporator-ice-up")?.sourceIds).toEqual(
      expect.arrayContaining(["coleman-48000-ac-owner-1976-523"]),
    );
    expect(
      [
        symptomById.get("coleman-48000-ac-cool-night-evaporator-ice-up")?.summary,
        symptomById.get("coleman-48000-ac-cool-night-evaporator-ice-up")?.safeChecklist.join(" "),
      ].join(" "),
    ).toMatch(/below 75|evaporator|HIGH FAN|defrost|air flow/i);

    expect(symptomById.get("coleman-48000-ac-short-cycle-breaker-trip")?.sourceIds).toEqual(
      expect.arrayContaining(["coleman-48000-ac-owner-1976-523"]),
    );
    expect(
      [
        symptomById.get("coleman-48000-ac-short-cycle-breaker-trip")?.summary,
        symptomById.get("coleman-48000-ac-short-cycle-breaker-trip")?.safeChecklist.join(" "),
      ].join(" "),
    ).toMatch(/two to three minutes|short cycling|breaker|qualified|electrician/i);

    expect(symptomById.get("coleman-48000-elect-a-heat-not-furnace")?.sourceIds).toEqual(
      expect.arrayContaining(["coleman-48000-ac-owner-1976-523"]),
    );
    expect(
      [
        symptomById.get("coleman-48000-elect-a-heat-not-furnace")?.summary,
        symptomById.get("coleman-48000-elect-a-heat-not-furnace")?.safeChecklist.join(" "),
      ].join(" "),
    ).toMatch(/Elect-A-Heat|chill chaser|not a substitute for a furnace|LOW HEAT/i);

    expect(symptomById.get("coleman-2025-amcat-part-model-lookup")?.sourceIds).toEqual(
      expect.arrayContaining(["coleman-2025-amcat-catalog"]),
    );
    expect(
      [
        symptomById.get("coleman-2025-amcat-part-model-lookup")?.summary,
        symptomById.get("coleman-2025-amcat-part-model-lookup")?.safeChecklist.join(" "),
      ].join(" "),
    ).toMatch(/AMCAT|shroud|filter|soft start|model|part/i);

    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds official Coleman-Mach 48000 international and adjacent model-family sources without inventing code entries", () => {
    const expectedSources = new Map([
      [
        "coleman-48000-air-conditioners-international-library",
        "https://library.coleman-mach.com/manual/48000-series-air-conditioners-international/",
      ],
      ["coleman-47000-ac-owner-1976-617", "https://library.coleman-mach.com/wp-content/uploads/2023/12/1976-617.pdf"],
      ["coleman-47000-heat-pump-owner-1976-606", "https://library.coleman-mach.com/wp-content/uploads/2023/12/1976-606.pdf"],
      [
        "coleman-47000-international-install-1976-686",
        "https://library.coleman-mach.com/wp-content/uploads/2023/04/1976-686.pdf",
      ],
      [
        "coleman-473xx-international-owner-1976-678",
        "https://library.coleman-mach.com/wp-content/uploads/2023/04/1976-678.pdf",
      ],
      [
        "coleman-476xx-international-owner-1976-698",
        "https://library.coleman-mach.com/wp-content/uploads/2023/04/1976-698.pdf",
      ],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const newSymptomIds = [
      "coleman-48000-international-service-prep",
      "coleman-47000-ac-owner-cooling-and-power-check",
      "coleman-47000-heat-pump-freezing-aux-heat-limit",
    ];
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\brefrigerant\b|\bprobe\b|\bopen (the )?(fuel|gas|electrical|rooftop)|wire|wiring|line-voltage|breaker panel|remove.*thermostat|replace.*control|remove.*shroud|install.*soft start|route.*wiring/i;

    for (const [sourceId, url] of expectedSources) {
      const source = corpus.sources.find((item) => item.id === sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const symptomId of newSymptomIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds.length, symptomId).toBeGreaterThan(0);
      expect(symptom?.safeChecklist.join(" "), symptomId).not.toMatch(unsafeOwnerActionPattern);
    }

    expect(symptomById.get("coleman-48000-international-service-prep")?.sourceIds).toEqual(
      expect.arrayContaining([
        "coleman-48000-air-conditioners-international-library",
        "coleman-47000-international-install-1976-686",
        "coleman-473xx-international-owner-1976-678",
        "coleman-476xx-international-owner-1976-698",
      ]),
    );
    expect(
      [
        symptomById.get("coleman-48000-international-service-prep")?.summary,
        symptomById.get("coleman-48000-international-service-prep")?.safeChecklist.join(" "),
      ].join(" "),
    ).toMatch(/International|230\/240 VAC|50Hz|model and serial|qualified/i);

    expect(symptomById.get("coleman-47000-ac-owner-cooling-and-power-check")?.sourceIds).toEqual(
      expect.arrayContaining(["coleman-47000-ac-owner-1976-617"]),
    );
    expect(
      [
        symptomById.get("coleman-47000-ac-owner-cooling-and-power-check")?.summary,
        symptomById.get("coleman-47000-ac-owner-cooling-and-power-check")?.safeChecklist.join(" "),
      ].join(" "),
    ).toMatch(/47000|115 VAC|60 HZ|15 to 20|qualified technician|filter/i);

    expect(symptomById.get("coleman-47000-heat-pump-freezing-aux-heat-limit")?.sourceIds).toEqual(
      expect.arrayContaining(["coleman-47000-heat-pump-owner-1976-606"]),
    );
    expect(
      [
        symptomById.get("coleman-47000-heat-pump-freezing-aux-heat-limit")?.summary,
        symptomById.get("coleman-47000-heat-pump-freezing-aux-heat-limit")?.safeChecklist.join(" "),
      ].join(" "),
    ).toMatch(/47000|near freezing|HIGH FAN|not a substitute for a furnace|qualified technician/i);

    expect(symptomById.get("air-conditioner-not-cooling")?.sourceIds).toEqual(
      expect.arrayContaining(["coleman-47000-ac-owner-1976-617", "coleman-473xx-international-owner-1976-678"]),
    );
    expect(symptomById.get("airflow-or-venting")?.sourceIds).toEqual(
      expect.arrayContaining(["coleman-47000-ac-owner-1976-617", "coleman-47000-heat-pump-owner-1976-606"]),
    );
    expect(symptomById.get("low-voltage")?.sourceIds).toEqual(
      expect.arrayContaining(["coleman-47000-ac-owner-1976-617", "coleman-473xx-international-owner-1976-678"]),
    );
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds official Coleman-Mach 49000, 9000, and 8000 owner-safe sources without inventing code entries", () => {
    const expectedSources = new Map([
      ["coleman-49000-ac-owner-1976-542", "https://library.coleman-mach.com/wp-content/uploads/2023/04/1976-542.pdf"],
      ["coleman-49000-heat-pump-owner-1976-545", "https://library.coleman-mach.com/wp-content/uploads/2023/04/1976-545.pdf"],
      ["coleman-9000-ac-owner-1976-368", "https://library.coleman-mach.com/wp-content/uploads/2023/04/1976-368.pdf"],
      ["coleman-8000-chillgrille-1976-328", "https://library.coleman-mach.com/wp-content/uploads/2023/04/1976-328.pdf"],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const newSymptomIds = [
      "coleman-49000-ac-high-pressure-lockout",
      "coleman-49000-heat-pump-freeze-switch-low-heat",
      "coleman-9000-ac-240v-cooling-filter-check",
      "coleman-8000-chillgrille-airflow-filter-louvers",
    ];
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\brefrigerant\b|\bprobe\b|\bopen (the )?(fuel|gas|electrical|rooftop)|wire|wiring|line-voltage|breaker panel|remove.*thermostat|replace.*control|remove.*shroud|install.*soft start|route.*wiring|install.*chillgrille/i;

    for (const [sourceId, url] of expectedSources) {
      const source = corpus.sources.find((item) => item.id === sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const symptomId of newSymptomIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds.length, symptomId).toBeGreaterThan(0);
      expect(symptom?.safeChecklist.join(" "), symptomId).not.toMatch(unsafeOwnerActionPattern);
    }

    expect(symptomById.get("coleman-49000-ac-high-pressure-lockout")?.sourceIds).toEqual(
      expect.arrayContaining(["coleman-49000-ac-owner-1976-542"]),
    );
    expect(
      [
        symptomById.get("coleman-49000-ac-high-pressure-lockout")?.summary,
        symptomById.get("coleman-49000-ac-high-pressure-lockout")?.safeChecklist.join(" "),
      ].join(" "),
    ).toMatch(/49000|High Pressure Switch|dirty filters|lockout|qualified technician/i);

    expect(symptomById.get("coleman-49000-heat-pump-freeze-switch-low-heat")?.sourceIds).toEqual(
      expect.arrayContaining(["coleman-49000-heat-pump-owner-1976-545"]),
    );
    expect(
      [
        symptomById.get("coleman-49000-heat-pump-freeze-switch-low-heat")?.summary,
        symptomById.get("coleman-49000-heat-pump-freeze-switch-low-heat")?.safeChecklist.join(" "),
      ].join(" "),
    ).toMatch(/49000|freeze switch|25 to 40|10 to 20|near freezing|qualified/i);

    expect(symptomById.get("coleman-9000-ac-240v-cooling-filter-check")?.sourceIds).toEqual(
      expect.arrayContaining(["coleman-9000-ac-owner-1976-368"]),
    );
    expect(
      [
        symptomById.get("coleman-9000-ac-240v-cooling-filter-check")?.summary,
        symptomById.get("coleman-9000-ac-240v-cooling-filter-check")?.safeChecklist.join(" "),
      ].join(" "),
    ).toMatch(/9000|240 VAC|50 HZ|15 to 20|filters|accredited service/i);

    expect(symptomById.get("coleman-8000-chillgrille-airflow-filter-louvers")?.sourceIds).toEqual(
      expect.arrayContaining(["coleman-8000-chillgrille-1976-328"]),
    );
    expect(
      [
        symptomById.get("coleman-8000-chillgrille-airflow-filter-louvers")?.summary,
        symptomById.get("coleman-8000-chillgrille-airflow-filter-louvers")?.safeChecklist.join(" "),
      ].join(" "),
    ).toMatch(/8000|Chillgrille|DirectFlow|louvers|washable filter|once a month/i);

    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds official Coleman-Mach 47000 remote-controller and 473XX Rev. 1 owner-safe sources without inventing code entries", () => {
    const expectedSources = new Map([
      ["coleman-47000-remote-controller-owner-1976a662", "https://library.coleman-mach.com/wp-content/uploads/2023/04/1976A662.pdf"],
      ["coleman-473xx-international-owner-1976-671-rev1", "https://library.coleman-mach.com/wp-content/uploads/2023/04/1976-671-Rev.-1.pdf"],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const remoteSymptom = symptomById.get("coleman-47000-remote-controller-mode-led-check");
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\brefrigerant\b|\bprobe\b|\bopen (the )?(fuel|gas|electrical|rooftop)|wire|wiring|line-voltage|breaker panel|remove.*thermostat|replace.*control|remove.*shroud|install.*soft start|route.*wiring/i;

    for (const [sourceId, url] of expectedSources) {
      const source = corpus.sources.find((item) => item.id === sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    expect(remoteSymptom).toBeDefined();
    expect(remoteSymptom?.sourceIds).toEqual(["coleman-47000-remote-controller-owner-1976a662"]);
    expect(remoteSymptom?.safeChecklist.join(" ")).not.toMatch(unsafeOwnerActionPattern);
    expect([remoteSymptom?.summary, remoteSymptom?.safeChecklist.join(" ")].join(" ")).toMatch(
      /47000|remote|Follow Me|F\/C|timer|programming|ceiling LED|button|filter|qualified/i,
    );

    expect(symptomById.get("coleman-48000-international-service-prep")?.sourceIds).toEqual(
      expect.arrayContaining(["coleman-473xx-international-owner-1976-671-rev1"]),
    );
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
    expect(symptomById.get("air-conditioner-not-cooling")?.sourceIds).toEqual(
      expect.arrayContaining(["coleman-473xx-international-owner-1976-671-rev1"]),
    );
    expect(symptomById.get("airflow-or-venting")?.sourceIds).toEqual(
      expect.arrayContaining(["coleman-47000-remote-controller-owner-1976a662", "coleman-473xx-international-owner-1976-671-rev1"]),
    );
    expect(symptomById.get("low-voltage")?.sourceIds).toEqual(
      expect.arrayContaining(["coleman-473xx-international-owner-1976-671-rev1"]),
    );
  });

  it("adds post-Coleman Dometic and Furrion owner-safe support sources without inventing code entries", () => {
    const expectedSources = new Map([
      [
        "dometic-americana-not-cooling-temperature-spec-support",
        "https://support.dometic.com/en/americana-refrigerators/My-refrigerator-or-freezer-is-not-cooling-sufficiently-bc36",
      ],
      [
        "dometic-americana-not-working-level-support",
        "https://support.dometic.com/en/americana-refrigerators/My-refrigerator-is-not-working-at-all-c12f",
      ],
      [
        "dometic-americana-defrost-refrigerator-support",
        "https://support.dometic.com/en/americana-refrigerators/How-to-defrost-the-refrigerator-f342",
      ],
      [
        "dometic-americana-clean-refrigerator-vents-support",
        "https://support.dometic.com/en/americana-refrigerators/How-to-clean-the-refrigerator-695b",
      ],
      ["dometic-brisk-ac-not-cooling-fan-compressor-support", "https://support.dometic.com/en/brisk-ac/Not-Cooling-3e8e"],
      [
        "dometic-brisk-ac-frost-cooling-coil-support",
        "https://support.dometic.com/en/brisk-ac/Why-do-I-see-a-Frost-Formation-On-Cooling-Coil-57d4",
      ],
      [
        "dometic-brisk-ac-condensation-surfaces-support",
        "https://support.dometic.com/en/brisk-ac/Condensation-forms-on-ceilings-windows-or-other-surfaces-eb33",
      ],
      [
        "dometic-freshjet-ac-not-cooling-mode-selection-support",
        "https://support.dometic.com/en/freshjet-ac/My-air-conditioner-is-not-cooling-well-8f31",
      ],
      ["furrion-chill-cube-ducted-ac-user-manual", "https://support.lci1.com/documents/ccd-0008919"],
      ["furrion-chill-2-low-profile-electronic-control-manual", "https://support.lci1.com/documents/ccd-0008959"],
      ["furrion-enhanced-multizone-thermostat-e3-qr187", "https://support.lci1.com/documents/ccd-0008565"],
      ["furrion-furnace-lockout-reset-qr224", "https://support.lci1.com/documents/ccd-0011210"],
      [
        "furrion-comfort-production-label-w007",
        "https://support.lci1.com/documents/w-007-furrion-comfort-production-label-information",
      ],
    ]);
    const expectedSymptomSourceIds = new Map([
      ["dometic-americana-not-cooling-temperature-test", "dometic-americana-not-cooling-temperature-spec-support"],
      ["dometic-americana-not-working-leveling", "dometic-americana-not-working-level-support"],
      ["dometic-americana-defrost-ice-buildup", "dometic-americana-defrost-refrigerator-support"],
      ["dometic-americana-cleaning-vents-airflow", "dometic-americana-clean-refrigerator-vents-support"],
      ["dometic-brisk-ac-not-cooling-fan-compressor-triage", "dometic-brisk-ac-not-cooling-fan-compressor-support"],
      ["dometic-brisk-ac-frost-on-cooling-coil", "dometic-brisk-ac-frost-cooling-coil-support"],
      ["dometic-brisk-ac-condensation-ceiling-windows", "dometic-brisk-ac-condensation-surfaces-support"],
      ["dometic-freshjet-ac-not-cooling-mode-selection", "dometic-freshjet-ac-not-cooling-mode-selection-support"],
      ["furrion-chill-cube-filter-led-remote-mode-max-cool", "furrion-chill-cube-ducted-ac-user-manual"],
      ["furrion-chill-2-filter-icing-water-leak", "furrion-chill-2-low-profile-electronic-control-manual"],
      ["furrion-enhanced-multizone-thermostat-e3-mode-loss-app-pairing", "furrion-enhanced-multizone-thermostat-e3-qr187"],
      ["furrion-furnace-lockout-reset-after-air-in-propane-line", "furrion-furnace-lockout-reset-qr224"],
      ["furrion-ac-model-serial-label-service-call-prep", "furrion-comfort-production-label-w007"],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\brefrigerant\b|\bprobe\b|\bopen (the )?(fuel|gas|electrical|rooftop)|wire|wiring|line-voltage|breaker panel|remove.*thermostat|replace.*control|remove.*shroud|replace.*compressor|install.*controller|access.*control box/i;

    for (const [sourceId, url] of expectedSources) {
      const source = corpus.sources.find((item) => item.id === sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, sourceId] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual([sourceId]);
      expect(symptom?.safeChecklist.join(" "), symptomId).not.toMatch(unsafeOwnerActionPattern);
    }

    expect(symptomById.get("dometic-americana-not-cooling-temperature-test")?.summary).toMatch(
      /Americana|temperature|8 hours|freezer/i,
    );
    expect(symptomById.get("dometic-americana-defrost-ice-buildup")?.safeChecklist.join(" ")).toMatch(
      /Do not use sharp tools|hair dryer|heat gun/i,
    );
    expect(symptomById.get("dometic-brisk-ac-frost-on-cooling-coil")?.safeChecklist.join(" ")).toMatch(
      /filter|open.*vents|fan-only|qualified/i,
    );
    expect(symptomById.get("dometic-freshjet-ac-not-cooling-mode-selection")?.summary).toMatch(/cooling mode/i);
    expect(symptomById.get("furrion-chill-cube-filter-led-remote-mode-max-cool")?.safeChecklist.join(" ")).toMatch(
      /filter LED|Max Cool|vents/i,
    );
    expect(symptomById.get("furrion-chill-2-filter-icing-water-leak")?.safeChecklist.join(" ")).toMatch(
      /filter|icing|drainage|qualified/i,
    );
    expect(symptomById.get("furrion-enhanced-multizone-thermostat-e3-mode-loss-app-pairing")?.summary).toMatch(
      /E3|mode|app pairing/i,
    );
    expect(symptomById.get("furrion-furnace-lockout-reset-after-air-in-propane-line")?.safeChecklist.join(" ")).toMatch(
      /3 failed attempts|qualified RV service/i,
    );
    expect(symptomById.get("furrion-ac-model-serial-label-service-call-prep")?.safeChecklist.join(" ")).toMatch(
      /model|serial|label|service/i,
    );

    expect(symptomById.get("refrigerator-not-cooling")?.sourceIds).toEqual(
      expect.arrayContaining([
        "dometic-americana-not-cooling-temperature-spec-support",
        "dometic-americana-not-working-level-support",
      ]),
    );
    expect(symptomById.get("air-conditioner-not-cooling")?.sourceIds).toEqual(
      expect.arrayContaining([
        "dometic-brisk-ac-not-cooling-fan-compressor-support",
        "dometic-freshjet-ac-not-cooling-mode-selection-support",
        "furrion-chill-cube-ducted-ac-user-manual",
        "furrion-chill-2-low-profile-electronic-control-manual",
      ]),
    );
    expect(symptomById.get("airflow-or-venting")?.sourceIds).toEqual(
      expect.arrayContaining([
        "dometic-americana-clean-refrigerator-vents-support",
        "dometic-brisk-ac-frost-cooling-coil-support",
        "furrion-chill-cube-ducted-ac-user-manual",
        "furrion-chill-2-low-profile-electronic-control-manual",
      ]),
    );
    expect(symptomById.get("thermostat-communication")?.sourceIds).toContain(
      "furrion-enhanced-multizone-thermostat-e3-qr187",
    );
    expect(symptomById.get("furnace-lockout")?.sourceIds).toContain("furrion-furnace-lockout-reset-qr224");
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds post-Coleman Norcold/Thetford and Furrion service-prep support sources without inventing code entries", () => {
    const expectedSources = new Map([
      [
        "norcold-dc740-dc751-owner-install-2024",
        "https://www.thetford.com/app/uploads/2024/09/641479_DC740DC751_InstallationOwners-Manual_RevA.pdf",
      ],
      [
        "norcold-nv1090-user-manual-2025",
        "https://www.thetford.com/app/uploads/2025/11/641576_UM_NV1090_EN.pdf",
      ],
      [
        "thetford-t2095-owner-install-2025",
        "https://www.thetford.com/app/uploads/2025/08/641518A_T2095-US_OMIM_Final.pdf",
      ],
      ["norcold-1210-owner", "https://www.thetford.com/app/uploads/2024/10/OM_1210_635494E_20210902.pdf"],
      ["norcold-product-compliance-recall-info", "https://www.thetford.com/us/recall-information/"],
      [
        "norcold-de0041-ev0041-de0061-ev0061-owner",
        "https://www.thetford.com/app/uploads/2024/10/OM_DCDEEV00410061_635743D_20180326.pdf",
      ],
      ["furrion-thermostat-controller-compatibility-qr155", "https://support.lci1.com/documents/ccd-0007160"],
      ["furrion-appliances-production-label-w009", "https://support.lci1.com/documents/ccd-0007440"],
    ]);
    const expectedSymptomSourceIds = new Map<string, string[]>([
      ["norcold-dc740-dc751-cooling-low-voltage-defrost", ["norcold-dc740-dc751-owner-install-2024"]],
      ["norcold-nv1090-cooling-night-mode-defrost-storage", ["norcold-nv1090-user-manual-2025"]],
      ["thetford-t2095-cooling-door-seal-night-mode-storage", ["thetford-t2095-owner-install-2025"]],
      ["norcold-1210-defrost-door-seal-storage-service-prep", ["norcold-1210-owner"]],
      ["norcold-recall-hts-gas-valve-serial-service-prep", ["norcold-product-compliance-recall-info"]],
      [
        "norcold-de-ev-acdc-refrigerator-cooling-defrost-battery",
        ["norcold-de0041-ev0041-de0061-ev0061-owner"],
      ],
      ["furrion-thermostat-controller-compatibility-service-prep", ["furrion-thermostat-controller-compatibility-qr155"]],
      ["furrion-refrigerator-production-label-service-prep", ["furrion-appliances-production-label-w009"]],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\brefrigerant\b|\bprobe\b|\bopen (the )?(fuel|gas|electrical|rooftop)|wire|wiring|line-voltage|breaker panel|remove.*thermostat|replace.*control|remove.*shroud|replace.*compressor|install.*controller|access.*control box/i;

    for (const [sourceId, url] of expectedSources) {
      const source = corpus.sources.find((item) => item.id === sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, sourceIds] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(sourceIds);
      expect(symptom?.safeChecklist.join(" "), symptomId).not.toMatch(unsafeOwnerActionPattern);
    }

    expect(symptomById.get("norcold-dc740-dc751-cooling-low-voltage-defrost")?.safeChecklist.join(" ")).toMatch(
      /thermostat|vents|110 degrees|defrost|authorized Norcold Service Center/i,
    );
    expect(symptomById.get("norcold-nv1090-cooling-night-mode-defrost-storage")?.safeChecklist.join(" ")).toMatch(
      /night mode|86 degrees|defrost|storage|service center/i,
    );
    expect(symptomById.get("thetford-t2095-cooling-door-seal-night-mode-storage")?.safeChecklist.join(" ")).toMatch(
      /paper|seal|night mode|seasonal|service center/i,
    );
    expect(symptomById.get("norcold-1210-defrost-door-seal-storage-service-prep")?.safeChecklist.join(" ")).toMatch(
      /door seal|storage latch|authorized Norcold Service Center/i,
    );
    expect(symptomById.get("norcold-recall-hts-gas-valve-serial-service-prep")?.safeChecklist.join(" ")).toMatch(
      /serial|solid red|flashing red|trained service technician/i,
    );
    expect(symptomById.get("norcold-de-ev-acdc-refrigerator-cooling-defrost-battery")?.safeChecklist.join(" ")).toMatch(
      /AC or DC mode|defrost|battery|authorized Norcold Service Center/i,
    );
    expect(symptomById.get("furrion-thermostat-controller-compatibility-service-prep")?.safeChecklist.join(" ")).toMatch(
      /HW:V1.0|HW:V2.0|ES|furnace function/i,
    );
    expect(symptomById.get("furrion-refrigerator-production-label-service-prep")?.safeChecklist.join(" ")).toMatch(
      /lower drawer|inside.*door|back.*fridge|serial/i,
    );

    expect(symptomById.get("refrigerator-not-cooling")?.sourceIds).toEqual(
      expect.arrayContaining([
        "norcold-dc740-dc751-owner-install-2024",
        "norcold-nv1090-user-manual-2025",
        "thetford-t2095-owner-install-2025",
        "norcold-de0041-ev0041-de0061-ev0061-owner",
      ]),
    );
    expect(symptomById.get("norcold-absorption-door-alarm-seal")?.sourceIds).toEqual(
      expect.arrayContaining(["norcold-1210-owner", "thetford-t2095-owner-install-2025"]),
    );
    expect(symptomById.get("airflow-or-venting")?.sourceIds).toEqual(
      expect.arrayContaining([
        "norcold-dc740-dc751-owner-install-2024",
        "norcold-nv1090-user-manual-2025",
        "thetford-t2095-owner-install-2025",
      ]),
    );
    expect(symptomById.get("thermostat-communication")?.sourceIds).toContain(
      "furrion-thermostat-controller-compatibility-qr155",
    );
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds Furrion/Lippert service-prep gaps from official sources without inventing code entries", () => {
    const expectedSources = new Map([
      ["furrion-dishwasher-instruction-manual", "https://support.lci1.com/documents/ccd-0005580"],
      ["furrion-countertop-dishwasher-fdw18sac2-manual", "https://support.lci1.com/documents/ccd-0009140"],
      [
        "furrion-convection-microwave-air-fryer-user-manual",
        "https://support.lci1.com/documents/furrion-09-built-in-convection-microwave-oven-with-air-fryer-user-manual",
      ],
      [
        "furrion-12v-horizontal-range-hood-user-manual",
        "https://support.lci1.com/documents/furrion-12v-horizontal-rv-range-hood-user-manual-im-fha00016-v6.0",
      ],
      [
        "furrion-single-burner-induction-cooktop-user-manual",
        "https://support.lci1.com/documents/furrion-single-burner-induction-cooktop-user-manual",
      ],
      [
        "furrion-fih2zea-bg-induction-cooktop-operating-installation",
        "https://support.lci1.com/documents/furrion-fih2zea-bg-induction-cooktop-operating-and-installation-instruction",
      ],
      ["furrion-double-burner-induction-cooktop-user-manual", "https://support.lci1.com/documents/ccd-0005718"],
      ["furrion-cooking-production-label-w008", "https://support.lci1.com/documents/ccd-0007439"],
      ["furrion-gas-cooking-warranty-request-w014", "https://support.lci1.com/documents/ccd-0008245"],
      [
        "furrion-energy-production-label-w010",
        "https://support.lci1.com/documents/w-010-furrion-energy-production-label-information",
      ],
      [
        "furrion-furnace-blower-no-ignition-video",
        "https://support.lci1.com/videos/furrion-furnace-blower-turns-on-with-no-ignition",
      ],
    ]);
    const expectedSymptomSourceIds = new Map<string, string[]>([
      [
        "furrion-dishwasher-leak-drain-cycle-service-prep",
        [
          "furrion-dishwasher-instruction-manual",
          "furrion-countertop-dishwasher-fdw18sac2-manual",
          "furrion-appliances-production-label-w009",
        ],
      ],
      [
        "furrion-microwave-no-heat-sparks-turntable-service-boundary",
        ["furrion-convection-microwave-air-fryer-user-manual", "furrion-appliances-production-label-w009"],
      ],
      [
        "furrion-range-hood-fan-light-filter-venting",
        ["furrion-12v-horizontal-range-hood-user-manual", "furrion-appliances-production-label-w009"],
      ],
      [
        "furrion-induction-cooktop-cookware-overheat-service-boundary",
        [
          "furrion-single-burner-induction-cooktop-user-manual",
          "furrion-fih2zea-bg-induction-cooktop-operating-installation",
          "furrion-double-burner-induction-cooktop-user-manual",
        ],
      ],
      [
        "furrion-cooking-model-serial-warranty-service-prep",
        ["furrion-cooking-production-label-w008", "furrion-gas-cooking-warranty-request-w014", "furrion-appliances-production-label-w009"],
      ],
      [
        "furrion-water-heater-energy-label-warranty-service-prep",
        ["furrion-energy-production-label-w010", "furrion-water-heater-user-manual", "furrion-water-heater"],
      ],
      [
        "furrion-furnace-blower-runs-no-ignition-service-prep",
        ["furrion-furnace-blower-no-ignition-video", "furrion-furnace-troubleshooting"],
      ],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bmagnetron\b|\bcapacitor\b|\bgas pressure\b|\blimit switch\b|\bsail switch\b|\bcontroller replacement\b|\bfuse replacement\b|\bremove cover\b|\bharness testing\b|\bcontrol board\b|\b120\s*vac\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\bline-voltage\b|\bgas valve\b|\bburner\b|\borifice\b|\bopen (the )?(fuel|gas|electrical|rooftop)|breaker panel|remove.*thermostat|replace.*control|remove.*shroud|replace.*compressor|install.*controller|access.*control box/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, sourceIds] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(sourceIds);
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
    }

    expect(symptomById.get("furrion-dishwasher-leak-drain-cycle-service-prep")?.safeChecklist.join(" ")).toMatch(
      /leak|drain|shut.*water|qualified|model|serial/i,
    );
    expect(symptomById.get("furrion-microwave-no-heat-sparks-turntable-service-boundary")?.safeChecklist.join(" ")).toMatch(
      /do not use|unplug|turn.*off|qualified|spark|no heat/i,
    );
    expect(symptomById.get("furrion-range-hood-fan-light-filter-venting")?.safeChecklist.join(" ")).toMatch(
      /filter|fan|light|vent|turn.*off|qualified/i,
    );
    expect(symptomById.get("furrion-induction-cooktop-cookware-overheat-service-boundary")?.safeChecklist.join(" ")).toMatch(
      /cookware|induction|overheat|turn.*off|qualified/i,
    );
    expect(symptomById.get("furrion-cooking-model-serial-warranty-service-prep")?.safeChecklist.join(" ")).toMatch(
      /model|serial|production label|warranty|qualified/i,
    );
    expect(symptomById.get("furrion-water-heater-energy-label-warranty-service-prep")?.safeChecklist.join(" ")).toMatch(
      /energy label|model|serial|shut.*off|qualified/i,
    );
    expect(symptomById.get("furrion-furnace-blower-runs-no-ignition-service-prep")?.safeChecklist.join(" ")).toMatch(
      /no ignition|shut.*furnace|LP|qualified/i,
    );

    expect(symptomById.get("furnace-lockout")?.sourceIds).toContain("furrion-furnace-blower-no-ignition-video");
    expect(symptomById.get("water-heater-no-heat")?.sourceIds).toContain("furrion-energy-production-label-w010");
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
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

  it("adds official gap-scan prep sources without inventing code entries", () => {
    const expectedSources = new Map([
      ["thetford-norcold-dealer-locator", "https://www.thetford.com/us/dealer-locator/"],
      [
        "norcold-refrigerator-model-tag-faq",
        "https://www.thetford.com/us/faq/where-can-i-find-what-kind-of-model-my-refrigerator-is/",
      ],
      [
        "thetford-rv-toilet-serial-number-locations-2024",
        "https://www.thetford.com/app/uploads/2024/10/Thetford-RV-Toilets-Serial-Number-Locations.pdf",
      ],
      [
        "thetford-toilet-no-data-tag-identification-faq",
        "https://www.thetford.com/us/faq/how-do-i-identify-my-toilet-model-if-it-doesnt-have-a-data-tag/",
      ],
      ["thetford-flush-tank-travel-water-faq", "https://www.thetford.com/us/faq/should-i-travel-with-water-in-the-flush-tank/"],
      ["thetford-rv-toilet-household-cleaner-seal-safety-faq", "https://www.thetford.com/us/faq/can-i-use-household-cleaners-in-my-rv/"],
      ["lippert-slimrack-ti533-owner-quick-troubleshooting", "https://support.lci1.com/documents/ccd-0008890"],
      ["lippert-power-gear-through-frame-slideout-support", "https://support.lci1.com/power-gear-through-frame-slideout-system"],
      [
        "lippert-qr059-electronic-leveling-identification",
        "https://support.lci1.com/documents/qr-059-electronic-leveling-identification-guide",
      ],
      ["furrion-13-otr-microwave-fmsm13-user-manual", "https://support.lci1.com/documents/ccd-0010994"],
      ["furrion-heating-support-index", "https://support.lci1.com/heating"],
      ["lippert-factory-service-locator", "https://www.lippert.com/service-centers"],
      ["coleman-mach-model-number-locator", "https://coleman-mach.com/service-support/find-model-number/"],
      ["coleman-mach-service-center-dealer-locator", "https://coleman-mach.com/service-support/service-locator/"],
      ["maxxair-2025-amcat-catalog", "https://www.maxxair.com/files/catalog/MXR-4042.02_2025%20AMCAT.pdf"],
      ["maxxair-maxxfan-plus-04500-product", "https://www.maxxair.com/Products/fans/maxxfan-plus-00-04500/"],
    ]);
    const expectedSymptomSourceIds = new Map<string, string[]>([
      ["thetford-norcold-authorized-service-locator-prep", ["thetford-norcold-dealer-locator"]],
      ["norcold-refrigerator-model-label-location", ["norcold-refrigerator-model-tag-faq"]],
      [
        "thetford-rv-toilet-serial-model-label-service-prep",
        ["thetford-rv-toilet-serial-number-locations-2024", "thetford-toilet-no-data-tag-identification-faq"],
      ],
      ["thetford-cassette-toilet-flush-tank-travel-storage", ["thetford-flush-tank-travel-water-faq"]],
      ["thetford-rv-toilet-cleaning-seal-safe-maintenance", ["thetford-rv-toilet-household-cleaner-seal-safety-faq"]],
      ["lippert-slimrack-slide-stuck-service-prep", ["lippert-slimrack-ti533-owner-quick-troubleshooting"]],
      ["lippert-power-gear-through-frame-slideout-service-prep", ["lippert-power-gear-through-frame-slideout-support"]],
      ["lippert-leveling-system-identification-service-prep", ["lippert-qr059-electronic-leveling-identification"]],
      ["furrion-otr-microwave-fan-light-filter-service-prep", ["furrion-13-otr-microwave-fmsm13-user-manual"]],
      ["lippert-qualified-service-locator-prep", ["lippert-factory-service-locator"]],
      ["furrion-furnace-error-code-model-service-prep", ["furrion-heating-support-index"]],
      ["coleman-mach-model-number-service-prep", ["coleman-mach-model-number-locator", "coleman-mach-service-center-dealer-locator"]],
      ["maxxair-2025-amcat-model-feature-service-prep", ["maxxair-2025-amcat-catalog"]],
      ["maxxair-maxxfan-plus-rain-sensor-remote-service-prep", ["maxxair-maxxfan-plus-04500-product"]],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\bline-voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\bhydraulic\b|\brelay\b|\bshaft\b|\bmanual override\b|\bharness\b|\bopen (the )?(fuel|gas|electrical|rooftop)|fuel line|install.*kit|remove.*shroud|remove.*cover|measure resistance/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, sourceIds] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(sourceIds);
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
    }

    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds official Airxcel family service-prep sources without inventing code entries", () => {
    const expectedSources = new Map([
      ["airxcel-rv-owners-service-router", "https://www.airxcel.com/rv-owners/"],
      ["coleman-mach-alternate-aftermarket-model-lookup", "https://coleman-mach.com/search-alternate-model-number/"],
      ["coleman-mach-discontinued-model-replacement-lookup", "https://coleman-mach.com/search-model-number-replacement/"],
      ["maxxair-faq-control-cleaning-rain-sensor", "https://www.maxxair.com/service-support/faqs/"],
      ["maxxair-claims-model-serial-sticker", "https://www.maxxair.com/service-support/claims/"],
      [
        "aquahot-125-dn2-use-care-guide",
        "https://library.aquahot.com/wp-content/uploads/2025/03/125-DN2-Use-and-Care-Guide-5.6.24.pdf",
      ],
      ["aquahot-service-center-dealer-locator", "https://www.aquahot.com/service-help/service-locations.aspx"],
      ["suburban-warranty-service-paperwork", "https://suburbanrv.com/service-support/warranty/"],
    ]);
    const expectedSymptomSourceIds = new Map<string, string[]>([
      ["airxcel-family-brand-service-routing-prep", ["airxcel-rv-owners-service-router"]],
      ["coleman-mach-oem-alternate-model-lookup-prep", ["coleman-mach-alternate-aftermarket-model-lookup"]],
      ["coleman-mach-discontinued-ac-replacement-prep", ["coleman-mach-discontinued-model-replacement-lookup"]],
      ["maxxair-rain-sensor-remote-airflow-cleaning-behavior", ["maxxair-faq-control-cleaning-rain-sensor"]],
      ["maxxair-model-serial-sticker-claim-service-prep", ["maxxair-claims-model-serial-sticker"]],
      ["aquahot-125-dn2-use-care-winterization-service-prep", ["aquahot-125-dn2-use-care-guide"]],
      ["aquahot-authorized-service-center-locator-prep", ["aquahot-service-center-dealer-locator"]],
      ["suburban-warranty-receipt-service-paperwork-prep", ["suburban-warranty-service-paperwork"]],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\bline-voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\broof\b|\bhydronic\b|\bcoolant\b|\bdiesel\b|\bfuel\b|\bpropane\b|\bopen (the )?(fuel|gas|electrical|rooftop)|install.*fan|remove.*shroud|measure resistance|high-limit reset|pump|valve/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, sourceIds] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(sourceIds);
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
    }

    expect(symptomById.get("airxcel-family-brand-service-routing-prep")?.safeChecklist.join(" ")).toMatch(
      /Airxcel|Coleman-Mach|MaxxAir|Suburban|Aqua-Hot|service locator/i,
    );
    expect(symptomById.get("coleman-mach-oem-alternate-model-lookup-prep")?.safeChecklist.join(" ")).toMatch(
      /model number|alternate|aftermarket|qualified/i,
    );
    expect(symptomById.get("maxxair-rain-sensor-remote-airflow-cleaning-behavior")?.safeChecklist.join(" ")).toMatch(
      /rain sensor|remote|screen|normal controls/i,
    );
    expect(symptomById.get("maxxair-model-serial-sticker-claim-service-prep")?.safeChecklist.join(" ")).toMatch(
      /round bug screen|model|serial|claim/i,
    );
    expect(symptomById.get("aquahot-125-dn2-use-care-winterization-service-prep")?.safeChecklist.join(" ")).toMatch(
      /125-DN2|winterization|hot water|qualified Aqua-Hot service/i,
    );
    expect(symptomById.get("suburban-warranty-receipt-service-paperwork-prep")?.safeChecklist.join(" ")).toMatch(
      /receipt|bill of sale|warranty|qualified/i,
    );
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds official Dometic and Thetford owner-support sources without inventing code entries", () => {
    const expectedSources = new Map([
      ["dometic-refrigerator-recall", "https://www.dometic.com/en-us/lp/refrigerator-recall"],
      ["dometic-product-registration-form", "https://www.dometic.com/en-us/product-registration-form"],
      ["dometic-product-support-form", "https://www.dometic.com/en-us/support/product-support-form"],
      [
        "dometic-maintenance-service-finder",
        "https://www.dometic.com/en-us/support/maintenance-upgrade-or-service/yes",
      ],
      ["dometic-warranty-dealer-store-claim", "https://www.dometic.com/en-us/support/warranty/dealer-or-store"],
      [
        "dometic-300-310-320-gravity-flush-toilet-manual",
        "https://media.dometic.com/externalassets/dometic-320-rv-toilet_9108781896_78798.pdf",
      ],
      [
        "thetford-warranty-product-registration",
        "https://www.thetford.com/us/warranty-information/warranty-product-registration-form/",
      ],
      ["thetford-north-america-support-product-finder", "https://www.thetford.com/us/thetford-support/"],
    ]);
    const expectedSymptomSourceIds = new Map<string, string[]>([
      ["dometic-refrigerator-recall-model-serial-service-prep", ["dometic-refrigerator-recall"]],
      ["dometic-product-registration-paperwork-prep", ["dometic-product-registration-form"]],
      ["dometic-product-support-form-routing-prep", ["dometic-product-support-form"]],
      ["dometic-authorized-maintenance-service-finder-prep", ["dometic-maintenance-service-finder"]],
      ["dometic-warranty-claim-dealer-paperwork-prep", ["dometic-warranty-dealer-store-claim"]],
      ["dometic-300-310-320-toilet-cleaning-winterizing-prep", ["dometic-300-310-320-gravity-flush-toilet-manual"]],
      ["thetford-norcold-warranty-registration-paperwork-prep", ["thetford-warranty-product-registration"]],
      ["thetford-norcold-support-product-finder-routing-prep", ["thetford-north-america-support-product-finder"]],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\bline-voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\broof\b|\bhydronic\b|\bcoolant\b|\bdiesel\b|\bfuel\b|\bpropane\b|\bopen (the )?(fuel|gas|electrical|rooftop)|install.*fan|remove.*shroud|measure resistance|high-limit reset|pump|valve/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, sourceIds] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(sourceIds);
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
    }

    expect(symptomById.get("dometic-refrigerator-recall-model-serial-service-prep")?.safeChecklist.join(" ")).toMatch(
      /recall|model|serial|authorized service/i,
    );
    expect(symptomById.get("dometic-product-registration-paperwork-prep")?.safeChecklist.join(" ")).toMatch(
      /PNC|serial|invoice|registration/i,
    );
    expect(symptomById.get("dometic-300-310-320-toilet-cleaning-winterizing-prep")?.safeChecklist.join(" ")).toMatch(
      /300|310|320|cleaning|winterizing/i,
    );
    expect(symptomById.get("dometic-300-310-320-toilet-cleaning-winterizing-prep")?.safeChecklist.join(" ")).toMatch(
      /antifreeze-only/i,
    );
    expect(
      [symptomById.get("dometic-300-310-320-toilet-cleaning-winterizing-prep")?.summary, ...(symptomById.get("dometic-300-310-320-toilet-cleaning-winterizing-prep")?.safeChecklist ?? [])].join(
        " ",
      ),
    ).not.toMatch(/\bdisconnect\b|water supply line/i);
    expect(symptomById.get("thetford-norcold-warranty-registration-paperwork-prep")?.safeChecklist.join(" ")).toMatch(
      /Thetford|Norcold|serial|VIN/i,
    );
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds the official owner-safe RM8, FreshJet, warranty, claims, and registration support batch without code entries", () => {
    const expectedSources = new Map([
      [
        "dometic-rm8-clean-refrigerator-support",
        "https://support.dometic.com/en/rm8-refrigerators/How-to-clean-the-refrigerator-1256",
      ],
      [
        "dometic-rm8-defrost-refrigerator-support",
        "https://support.dometic.com/en/rm8-refrigerators/How-to-defrost-the-refrigerator-9568",
      ],
      [
        "dometic-rm8-low-outside-temperature-support",
        "https://support.dometic.com/en/rm8-refrigerators/How-to-operate-the-refrigerator-during-low-outside-temperatures-b099",
      ],
      [
        "dometic-rm8-operating-controls-support",
        "https://support.dometic.com/en/rm8-refrigerators/What-do-the-operating-controls-mean-3981",
      ],
      [
        "dometic-rm8-turn-off-support",
        "https://support.dometic.com/en/rm8-refrigerators/How-to-turn-off-the-refrigerator-54f2",
      ],
      ["dometic-freshjet-remote-control-support", "https://support.dometic.com/en/freshjet-ac/How-to-Use-the-remote-control-e323"],
      [
        "dometic-freshjet-ac-modes-support",
        "https://support.dometic.com/en/freshjet-ac/What-air-conditioner-modes-are-available-for-my-product-fff3",
      ],
      ["thetford-sanitation-warranty-statement", "https://www.thetford.com/us/warranty-information/sanitation-warranty/"],
      ["norcold-refrigeration-warranty-statement", "https://www.thetford.com/us/warranty-information/refrigeration-warranty/"],
      ["coleman-mach-claims-paperwork", "https://coleman-mach.com/service-support/claims/"],
      ["aquahot-warranty-registration", "https://www.aquahot.com/service-help/warranty-registration.aspx"],
    ]);
    const expectedSymptomSourceIds = new Map<string, string[]>([
      ["dometic-rm8-cleaning-airflow-prep", ["dometic-rm8-clean-refrigerator-support"]],
      ["dometic-rm8-defrost-ice-buildup-prep", ["dometic-rm8-defrost-refrigerator-support"]],
      ["dometic-rm8-low-outside-temperature-winter-cover-prep", ["dometic-rm8-low-outside-temperature-support"]],
      [
        "dometic-rm8-operating-controls-shutdown-prep",
        ["dometic-rm8-operating-controls-support", "dometic-rm8-turn-off-support"],
      ],
      ["dometic-freshjet-remote-mode-control-prep", ["dometic-freshjet-remote-control-support", "dometic-freshjet-ac-modes-support"]],
      ["thetford-sanitation-warranty-paperwork-prep", ["thetford-sanitation-warranty-statement"]],
      ["norcold-refrigeration-warranty-paperwork-prep", ["norcold-refrigeration-warranty-statement"]],
      ["coleman-mach-claims-paperwork-prep", ["coleman-mach-claims-paperwork"]],
      ["aquahot-warranty-registration-paperwork-prep", ["aquahot-warranty-registration"]],
    ]);
    const expectedRequiredTerms = new Map<string, string[]>([
      ["dometic-rm8-cleaning-airflow-prep", ["rm8"]],
      ["dometic-rm8-defrost-ice-buildup-prep", ["rm8"]],
      ["dometic-rm8-low-outside-temperature-winter-cover-prep", ["rm8"]],
      ["dometic-rm8-operating-controls-shutdown-prep", ["rm8"]],
      ["dometic-freshjet-remote-mode-control-prep", ["freshjet"]],
      ["thetford-sanitation-warranty-paperwork-prep", ["thetford"]],
      ["norcold-refrigeration-warranty-paperwork-prep", ["norcold"]],
      ["coleman-mach-claims-paperwork-prep", ["coleman", "mach"]],
      ["aquahot-warranty-registration-paperwork-prep", ["aqua", "aquahot"]],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\bline-voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\binternal\b|\broof\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|measure resistance/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(sourcesById.has("cummins-onan-service-bulletin-deferred")).toBe(false);
    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, sourceIds] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(sourceIds);
      expect(symptom?.searchRequiredTerms, symptomId).toEqual(expectedRequiredTerms.get(symptomId));
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
    }

    expect(lookupSymptomGuides(index, "dometic rm8 clean refrigerator drain ventilation grille")[0]?.slug).toBe(
      "dometic-rm8-cleaning-airflow-prep",
    );
    expect(lookupSymptomGuides(index, "dometic rm-8 clean refrigerator drain ventilation grille")[0]?.slug).toBe(
      "dometic-rm8-cleaning-airflow-prep",
    );
    expect(lookupSymptomGuides(index, "dometic rm8 defrost ice heat source")[0]?.slug).toBe(
      "dometic-rm8-defrost-ice-buildup-prep",
    );
    expect(lookupSymptomGuides(index, "dometic rm 8 defrost ice heat source")[0]?.slug).toBe(
      "dometic-rm8-defrost-ice-buildup-prep",
    );
    expect(lookupSymptomGuides(index, "rm8 low outside temperature winter cover snow leaves")[0]?.slug).toBe(
      "dometic-rm8-low-outside-temperature-winter-cover-prep",
    );
    expect(lookupSymptomGuides(index, "rm8 operating controls turn off battery igniter mes aes led display")[0]?.slug).toBe(
      "dometic-rm8-operating-controls-shutdown-prep",
    );
    expect(lookupSymptomGuides(index, "freshjet remote control modes cooling dehumidification battery")[0]?.slug).toBe(
      "dometic-freshjet-remote-mode-control-prep",
    );
    expect(lookupSymptomGuides(index, "fresh jet remote control modes cooling dehumidification battery")[0]?.slug).toBe(
      "dometic-freshjet-remote-mode-control-prep",
    );
    expect(lookupSymptomGuides(index, "fresh-jet remote control modes cooling dehumidification battery")[0]?.slug).toBe(
      "dometic-freshjet-remote-mode-control-prep",
    );
    expect(lookupSymptomGuides(index, "thetford sanitation toilet warranty statement paperwork")[0]?.slug).toBe(
      "thetford-sanitation-warranty-paperwork-prep",
    );
    expect(lookupSymptomGuides(index, "norcold refrigeration refrigerator warranty statement paperwork")[0]?.slug).toBe(
      "norcold-refrigeration-warranty-paperwork-prep",
    );
    expect(lookupSymptomGuides(index, "coleman mach warranty claim model serial service completion paperwork")[0]?.slug).toBe(
      "coleman-mach-claims-paperwork-prep",
    );
    expect(lookupSymptomGuides(index, "aqua hot warranty registration model serial purchase paperwork")[0]?.slug).toBe(
      "aquahot-warranty-registration-paperwork-prep",
    );
    const colemanServiceCenterSlugs = lookupSymptomGuides(index, "coleman mach service center")
      .slice(0, 5)
      .map((symptom) => symptom.slug);
    expect(colemanServiceCenterSlugs).toContain("coleman-mach-model-number-service-locator-prep");
    expect(colemanServiceCenterSlugs).not.toContain("coleman-mach-claims-paperwork-prep");
    expect(lookupSymptomGuides(index, "aqua hot no hot water")[0]?.slug).toBe(
      "aquahot-250-p01-use-care-winterization-service-prep",
    );
    expect(lookupSymptomGuides(index, "aqua hot no hot water").slice(0, 5).map((symptom) => symptom.slug)).not.toContain(
      "aquahot-warranty-registration-paperwork-prep",
    );
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds the official owner-safe Dometic, Coleman, Furrion, Thetford, MaxxAir, Suburban, and Aqua-Hot support-router batch without code entries", () => {
    const expectedSources = new Map([
      [
        "dometic-rm8-not-cooling-support",
        "https://support.dometic.com/en/rm8-refrigerators/My-refrigerator-is-not-cooling-sufficiently-f8da",
      ],
      [
        "dometic-rm8-not-working-level-support",
        "https://support.dometic.com/en/rm8-refrigerators/My-refrigerator-is-not-working-at-all-30ec",
      ],
      ["dometic-rm8-smell-ammonia-support", "https://support.dometic.com/en/rm8-refrigerators/I-smell-ammonia-317c"],
      ["dometic-rm8-smell-gas-support", "https://support.dometic.com/en/rm8-refrigerators/I-smell-gas-6fd1"],
      [
        "dometic-rm8-smell-melting-plastic-support",
        "https://support.dometic.com/en/rm8-refrigerators/I-smell-melting-plastic-e9da",
      ],
      [
        "dometic-freshjet-filter-efficiency-support",
        "https://support.dometic.com/en/freshjet-ac/What-should-I-do-to-make-sure-the-filter-on-my-rooftop-unit-is-clean-for-maximum-efficiency-2dad",
      ],
      ["dometic-freshjet-generator-power-support", "https://support.dometic.com/en/freshjet-ac/How-to-run-my-RV-AC-with-a-generator-bcde"],
      [
        "dometic-americana-food-storage-support",
        "https://support.dometic.com/en/americana-refrigerators/How-to-best-store-food-in-the-refrigerator-bd4a",
      ],
      [
        "dometic-americana-save-energy-support",
        "https://support.dometic.com/en/americana-refrigerators/How-to-save-energy-b718",
      ],
      ["coleman-45000-ac-owner-1976-711", "https://library.coleman-mach.com/wp-content/uploads/2023/12/1976-711.pdf"],
      ["coleman-46000-backwall-owner-1976-572", "https://library.coleman-mach.com/wp-content/uploads/2023/04/1976-572.pdf"],
      ["lippert-customer-service-warranty-forms", "https://support.lci1.com/customer-service-and-warranty-forms"],
      ["furrion-air-conditioning-support-index", "https://support.lci1.com/air-conditioning"],
      ["furrion-microwaves-support-index", "https://support.lci1.com/microwaves"],
      ["suburban-literature-technical-documents-router", "https://suburbanrv.com/service-support/documents/"],
      ["aquahot-product-manuals-library", "https://www.aquahot.com/Library.aspx"],
      ["aquahot-400d-use-care-guide", "https://aquahot.com/files/owners_manual/AHE-400-D02_Use_and_Care_Guide.pdf"],
      [
        "thetford-cassette-toilet-serial-identification",
        "https://www.thetford.com/us/document/cassette-toilets-serial-number-identification/",
      ],
      ["thetford-cassette-left-right-faq-2024", "https://www.thetford.com/app/uploads/2024/10/Cassette-FAQs.pdf"],
      ["maxxair-maxxfan-deluxe-product-matrix", "https://www.maxxair.com/products/fans/maxxfan-deluxe/"],
    ]);
    const expectedSymptomSourceIds = new Map<string, string[]>([
      [
        "dometic-rm8-not-cooling-level-ventilation-prep",
        ["dometic-rm8-not-cooling-support", "dometic-rm8-not-working-level-support"],
      ],
      ["dometic-rm8-ammonia-odor-shutdown-prep", ["dometic-rm8-smell-ammonia-support"]],
      ["dometic-rm8-gas-odor-shutdown-prep", ["dometic-rm8-smell-gas-support"]],
      ["dometic-rm8-melting-plastic-odor-shutdown-prep", ["dometic-rm8-smell-melting-plastic-support"]],
      ["dometic-freshjet-filter-cleaning-airflow-prep", ["dometic-freshjet-filter-efficiency-support"]],
      ["dometic-freshjet-generator-power-prep", ["dometic-freshjet-generator-power-support"]],
      ["dometic-americana-food-loading-airflow-storage", ["dometic-americana-food-storage-support"]],
      ["dometic-americana-energy-use-prep", ["dometic-americana-save-energy-support"]],
      ["coleman-45000-ac-freeze-filter-lockout-prep", ["coleman-45000-ac-owner-1976-711"]],
      ["coleman-46000-backwall-control-freeze-service-prep", ["coleman-46000-backwall-owner-1976-572"]],
      ["furrion-lippert-warranty-forms-service-prep", ["lippert-customer-service-warranty-forms"]],
      ["furrion-ac-manual-model-warranty-router", ["furrion-air-conditioning-support-index"]],
      ["furrion-microwave-manual-model-service-prep", ["furrion-microwaves-support-index"]],
      ["suburban-manual-library-service-boundary-prep", ["suburban-literature-technical-documents-router"]],
      ["aquahot-model-manual-locator-service-prep", ["aquahot-product-manuals-library"]],
      ["aquahot-400d-reporter-controls-winterization-service-prep", ["aquahot-400d-use-care-guide"]],
      ["thetford-cassette-toilet-serial-label-prep", ["thetford-cassette-toilet-serial-identification"]],
      ["thetford-cassette-left-right-model-prep", ["thetford-cassette-left-right-faq-2024"]],
      ["maxxair-maxxfan-deluxe-model-control-prep", ["maxxair-maxxfan-deluxe-product-matrix"]],
    ]);
    const expectedRequiredTerms = new Map<string, string[]>([
      ["dometic-rm8-not-cooling-level-ventilation-prep", ["rm8"]],
      ["dometic-rm8-ammonia-odor-shutdown-prep", ["rm8"]],
      ["dometic-rm8-gas-odor-shutdown-prep", ["rm8"]],
      ["dometic-rm8-melting-plastic-odor-shutdown-prep", ["rm8"]],
      ["dometic-freshjet-filter-cleaning-airflow-prep", ["freshjet"]],
      ["dometic-freshjet-generator-power-prep", ["freshjet"]],
      ["dometic-americana-food-loading-airflow-storage", ["americana"]],
      ["dometic-americana-energy-use-prep", ["americana"]],
      ["coleman-45000-ac-freeze-filter-lockout-prep", ["coleman", "45000"]],
      ["coleman-46000-backwall-control-freeze-service-prep", ["coleman", "46000"]],
      ["furrion-lippert-warranty-forms-service-prep", ["furrion", "lippert"]],
      ["furrion-ac-manual-model-warranty-router", ["furrion"]],
      ["furrion-microwave-manual-model-service-prep", ["furrion"]],
      ["suburban-manual-library-service-boundary-prep", ["suburban"]],
      ["aquahot-model-manual-locator-service-prep", ["aqua", "aquahot"]],
      ["aquahot-400d-reporter-controls-winterization-service-prep", ["400d"]],
      ["thetford-cassette-toilet-serial-label-prep", ["cassette"]],
      ["thetford-cassette-left-right-model-prep", ["cassette"]],
      ["maxxair-maxxfan-deluxe-model-control-prep", ["maxxair", "maxxfan"]],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\bline-voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\binternal\b|\broof\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|measure resistance|fuel nozzle|combustion|coolant pump/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(sourcesById.has("cummins-onan-product-guide-403")).toBe(false);
    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, sourceIds] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(sourceIds);
      expect(symptom?.searchRequiredTerms, symptomId).toEqual(expectedRequiredTerms.get(symptomId));
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
    }

    expect(lookupSymptomGuides(index, "dometic rm8 refrigerator not cooling level ventilation")[0]?.slug).toBe(
      "dometic-rm8-not-cooling-level-ventilation-prep",
    );
    expect(lookupSymptomGuides(index, "rm-8 smell ammonia yellow residue shutdown")[0]?.slug).toBe(
      "dometic-rm8-ammonia-odor-shutdown-prep",
    );
    expect(lookupSymptomGuides(index, "rm 8 smell gas shut off lp")[0]?.slug).toBe("dometic-rm8-gas-odor-shutdown-prep");
    expect(lookupSymptomGuides(index, "fresh jet filter clean low airflow maximum efficiency")[0]?.slug).toBe(
      "dometic-freshjet-filter-cleaning-airflow-prep",
    );
    expect(lookupSymptomGuides(index, "freshjet generator pure sine smartstart power prep")[0]?.slug).toBe(
      "dometic-freshjet-generator-power-prep",
    );
    expect(lookupSymptomGuides(index, "dometic americana refrigerator food storage overfilled airflow")[0]?.slug).toBe(
      "dometic-americana-food-loading-airflow-storage",
    );
    expect(lookupSymptomGuides(index, "coleman mach 45000 filter freeze high fan lockout")[0]?.slug).toBe(
      "coleman-45000-ac-freeze-filter-lockout-prep",
    );
    expect(lookupSymptomGuides(index, "furrion microwave fmcm15 turntable no heat service prep")[0]?.slug).toBe(
      "furrion-microwave-manual-model-service-prep",
    );
    expect(lookupSymptomGuides(index, "suburban literature technical documents operation manual")[0]?.slug).toBe(
      "suburban-manual-library-service-boundary-prep",
    );
    expect(lookupSymptomGuides(index, "aqua hot 400d reporter low voltage winterize")[0]?.slug).toBe(
      "aquahot-400d-reporter-controls-winterization-service-prep",
    );
    expect(lookupSymptomGuides(index, "thetford cassette toilet serial sticker c402")[0]?.slug).toBe(
      "thetford-cassette-toilet-serial-label-prep",
    );
    expect(lookupSymptomGuides(index, "thetford toilet serial")[0]?.slug).toBe(
      "thetford-rv-toilet-serial-model-label-service-prep",
    );
    expect(lookupSymptomGuides(index, "maxxair maxxfan deluxe 07000k remote thermostat")[0]?.slug).toBe(
      "maxxair-maxxfan-deluxe-model-control-prep",
    );

    expect(lookupSymptomGuides(index, "refrigerator not cooling").slice(0, 5).map((symptom) => symptom.slug)).not.toContain(
      "dometic-rm8-not-cooling-level-ventilation-prep",
    );
    expect(lookupSymptomGuides(index, "generator power").slice(0, 5).map((symptom) => symptom.slug)).not.toContain(
      "dometic-freshjet-generator-power-prep",
    );
    expect(lookupSymptomGuides(index, "microwave no heat").slice(0, 5).map((symptom) => symptom.slug)).not.toContain(
      "furrion-microwave-manual-model-service-prep",
    );
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds the official fresh gap-scan owner-safe router batch without code entries", () => {
    const expectedSources = new Map([
      ["dometic-hydro-flame-afs-afm-afl-user-manual", "https://www.dometic.com/externalassets/afm_66617.pdf"],
      [
        "dometic-brisk-fan-black-graphic-data-tag-support",
        "https://support.dometic.com/en/brisk-ac/How-to-operate-the-Fan-Black-Graphic-of-the-airconditioner-1b6b",
      ],
      [
        "dometic-brisk-auto-fan-thermostat-selector-support",
        "https://support.dometic.com/en/brisk-ac/How-to-control-AUTO-FAN-5ac7",
      ],
      [
        "dometic-freshjet-fj-fjx-mode-routing-support",
        "https://support.dometic.com/en/freshjet-ac/How-to-Control-Air-conditioning-modes-62dd",
      ],
      [
        "dometic-freshjet-remote-not-registering-support",
        "https://support.dometic.com/en/freshjet-ac/My-remote-control-does-not-register-a42",
      ],
      [
        "dometic-americana-too-cold-thermostat-support",
        "https://support.dometic.com/en/americana-refrigerators/The-refrigerator-is-too-cold-8bbe",
      ],
      [
        "dometic-water-heater-combo-operation-failure-mode-router",
        "https://support.dometic.com/en/waterheaters-combo/Water-heater-operation-failure-fe99",
      ],
      ["coleman-45000-heat-pump-owner-1980-054", "https://library.coleman-mach.com/wp-content/uploads/2023/12/1980-054.pdf"],
      [
        "maxxair-maxxfan-plus-mini-iom-11f90000k",
        "https://library.maxxair.com/wp-content/uploads/2023/03/11f90000k_maxxfanmini-maxxfan-maxxfan-plus-install-01-2018.pdf",
      ],
      [
        "maxxair-maxxfan-dome-iom-11-90056",
        "https://library.maxxair.com/wp-content/uploads/2023/03/11-90056_mxr-maxxfan-dome-iom-09-24-2019-1.pdf",
      ],
      ["suburban-2025-amcat-catalog", "https://suburbanrv.com/files/catalog/SUB-401.02_2025%20AMCAT.pdf"],
      ["aquahot-450d-use-care-guide", "https://aquahot.com/files/owners_manual/AHE-450-DE5_Use_and_Care_Guide.pdf"],
      ["aquahot-600d-use-care-guide", "https://www.aquahot.com/files/owners_manual/AHE-600-D04_Use_and_Care_Guide.pdf"],
      ["furrion-washing-machines-support", "https://support.lci1.com/washing-machines"],
      ["furrion-thermostats-support-index", "https://support.lci1.com/thermostats"],
      ["lippert-leveling-stabilization-support-router", "https://support.lci1.com/leveling-and-stabilization/"],
      ["lippert-slide-outs-support-router", "https://support.lci1.com/slide-outs/"],
      ["norcold-323-n260-3-support", "https://www.thetford.com/us/thetford-support/323-n260-3/"],
      ["norcold-n300-n302-support", "https://www.thetford.com/us/thetford-support/n300-n302/"],
      ["norcold-n305-n306-support", "https://www.thetford.com/us/thetford-support/n305-n306/"],
      ["thetford-aqua-kem-liquid-support", "https://www.thetford.com/us/thetford-support/aqua-kem-liquid/"],
      [
        "thetford-cassette-toilet-maintenance-inspiration",
        "https://www.thetford.com/int/inspiration/cassette-toilet-maintenance/",
      ],
      [
        "thetford-toilet-care-additives-faq",
        "https://www.thetford.com/int/faq/which-thetford-toilet-care-additives-do-i-need-2-2/",
      ],
      [
        "thetford-cassette-toilets-2024-spec-overview",
        "https://www.thetford.com/app/uploads/Thetford_Cassette-toilet_2024_EN.pdf",
      ],
    ]);
    const expectedSymptomSourceIds = new Map<string, string[]>([
      ["dometic-hydro-flame-furnace-operation-maintenance-safety-prep", ["dometic-hydro-flame-afs-afm-afl-user-manual"]],
      ["dometic-brisk-ac-fan-control-model-label-prep", ["dometic-brisk-fan-black-graphic-data-tag-support"]],
      ["dometic-brisk-ac-auto-fan-thermostat-identification", ["dometic-brisk-auto-fan-thermostat-selector-support"]],
      ["dometic-freshjet-fj-fjx-mode-control-model-label", ["dometic-freshjet-fj-fjx-mode-routing-support"]],
      ["dometic-freshjet-remote-does-not-register", ["dometic-freshjet-remote-not-registering-support"]],
      ["dometic-americana-refrigerator-too-cold", ["dometic-americana-too-cold-thermostat-support"]],
      [
        "dometic-atwood-combo-water-heater-gas-electric-mode-failure-prep",
        ["dometic-water-heater-combo-operation-failure-mode-router"],
      ],
      ["coleman-45000-heat-pump-model-serial-temperature-split-prep", ["coleman-45000-heat-pump-owner-1980-054"]],
      ["maxxair-maxxfan-plus-rain-sensor-remote-control-prep", ["maxxair-maxxfan-plus-mini-iom-11f90000k"]],
      ["maxxair-maxxfan-dome-model-ventilation-service-prep", ["maxxair-maxxfan-dome-iom-11-90056"]],
      [
        "suburban-2025-amcat-model-family-warranty-service-prep",
        ["suburban-2025-amcat-catalog", "suburban-service-center-dealer-locator", "suburban-warranty-service-paperwork"],
      ],
      ["aquahot-450d-hot-water-priority-service-prep", ["aquahot-450d-use-care-guide"]],
      ["aquahot-600d-reporter-network-service-prep", ["aquahot-600d-use-care-guide"]],
      ["furrion-washer-dryer-combo-leak-drain-service-prep", ["furrion-washing-machines-support"]],
      ["furrion-thermostat-manual-model-control-router", ["furrion-thermostats-support-index"]],
      ["lippert-leveling-stabilization-system-router", ["lippert-leveling-stabilization-support-router"]],
      ["lippert-slideout-system-identification-router", ["lippert-slide-outs-support-router"]],
      ["norcold-323-n260-3-discontinued-support-prep", ["norcold-323-n260-3-support"]],
      ["norcold-n300-n302-discontinued-support-prep", ["norcold-n300-n302-support"]],
      [
        "norcold-n305-n306-recall-service-prep",
        [
          "norcold-n305-n306-support",
          "norcold-product-compliance-recall-info",
          "norcold-refrigeration-warranty-statement",
          "thetford-norcold-dealer-locator",
        ],
      ],
      ["thetford-holding-tank-treatment-freeze-sensor-care", ["thetford-aqua-kem-liquid-support"]],
      ["thetford-cassette-toilet-odor-seal-maintenance", ["thetford-cassette-toilet-maintenance-inspiration"]],
      ["thetford-toilet-care-additive-selection", ["thetford-toilet-care-additives-faq"]],
      ["thetford-cassette-toilet-c220-c260-c400-model-prep", ["thetford-cassette-toilets-2024-spec-overview"]],
    ]);
    const expectedRequiredTerms = new Map<string, string[]>([
      ["dometic-hydro-flame-furnace-operation-maintenance-safety-prep", ["hydro", "afm", "afl"]],
      ["dometic-brisk-ac-fan-control-model-label-prep", ["brisk"]],
      ["dometic-brisk-ac-auto-fan-thermostat-identification", ["brisk"]],
      ["dometic-freshjet-fj-fjx-mode-control-model-label", ["freshjet"]],
      ["dometic-freshjet-remote-does-not-register", ["freshjet"]],
      ["dometic-americana-refrigerator-too-cold", ["americana"]],
      ["dometic-atwood-combo-water-heater-gas-electric-mode-failure-prep", ["atwood", "combo"]],
      ["coleman-45000-heat-pump-model-serial-temperature-split-prep", ["45000"]],
      ["maxxair-maxxfan-plus-rain-sensor-remote-control-prep", ["plus", "mini"]],
      ["maxxair-maxxfan-dome-model-ventilation-service-prep", ["dome"]],
      ["suburban-2025-amcat-model-family-warranty-service-prep", ["amcat"]],
      ["aquahot-450d-hot-water-priority-service-prep", ["450d"]],
      ["aquahot-600d-reporter-network-service-prep", ["600d"]],
      ["furrion-washer-dryer-combo-leak-drain-service-prep", ["washing", "washer"]],
      ["furrion-thermostat-manual-model-control-router", ["thermostat"]],
      ["lippert-leveling-stabilization-system-router", ["leveling", "stabilization"]],
      ["lippert-slideout-system-identification-router", ["slide", "slideout"]],
      ["norcold-323-n260-3-discontinued-support-prep", ["n260", "323"]],
      ["norcold-n300-n302-discontinued-support-prep", ["n300", "n302"]],
      ["norcold-n305-n306-recall-service-prep", ["n305", "n306"]],
      ["thetford-holding-tank-treatment-freeze-sensor-care", ["aquakem"]],
      ["thetford-cassette-toilet-odor-seal-maintenance", ["cassette"]],
      ["thetford-toilet-care-additive-selection", ["additive", "additives"]],
      ["thetford-cassette-toilet-c220-c260-c400-model-prep", ["cassette"]],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\bline-voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\binternal\b|\broof\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|measure resistance|fuel nozzle|combustion|coolant pump|manual override|hydraulic work/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(sourcesById.has("cummins-coach-care-rv-service-locations")).toBe(false);
    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, sourceIds] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(sourceIds);
      expect(symptom?.searchRequiredTerms, symptomId).toEqual(expectedRequiredTerms.get(symptomId));
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
    }

    expect(lookupSymptomGuides(index, "hydro flame afm furnace soot vent erratic cycling")[0]?.slug).toBe(
      "dometic-hydro-flame-furnace-operation-maintenance-safety-prep",
    );
    expect(lookupSymptomGuides(index, "dometic brisk fan control black graphic brisk 1 brisk 2")[0]?.slug).toBe(
      "dometic-brisk-ac-fan-control-model-label-prep",
    );
    expect(lookupSymptomGuides(index, "dometic brisk auto fan which thermostat do i have")[0]?.slug).toBe(
      "dometic-brisk-ac-auto-fan-thermostat-identification",
    );
    expect(lookupSymptomGuides(index, "freshjet remote does not register battery display")[0]?.slug).toBe(
      "dometic-freshjet-remote-does-not-register",
    );
    expect(lookupSymptomGuides(index, "atwood combo water heater works on gas not electric")[0]?.slug).toBe(
      "dometic-atwood-combo-water-heater-gas-electric-mode-failure-prep",
    );
    expect(lookupSymptomGuides(index, "coleman mach 45000 heat pump temperature split model serial")[0]?.slug).toBe(
      "coleman-45000-heat-pump-model-serial-temperature-split-prep",
    );
    expect(lookupSymptomGuides(index, "maxxfan dome 3812 bathroom fan led not working")[0]?.slug).toBe(
      "maxxair-maxxfan-dome-model-ventilation-service-prep",
    );
    expect(lookupSymptomGuides(index, "aqua hot 450d cabin heat stops when hot water is running")[0]?.slug).toBe(
      "aquahot-450d-hot-water-priority-service-prep",
    );
    expect(lookupSymptomGuides(index, "furrion washer dryer combo leaking not draining")[0]?.slug).toBe(
      "furrion-washer-dryer-combo-leak-drain-service-prep",
    );
    expect(lookupSymptomGuides(index, "which lippert slide out system in-wall slimrack through frame")[0]?.slug).toBe(
      "lippert-slideout-system-identification-router",
    );
    expect(lookupSymptomGuides(index, "norcold n305 n306 recall warranty service prep")[0]?.slug).toBe(
      "norcold-n305-n306-recall-service-prep",
    );
    expect(lookupSymptomGuides(index, "thetford aqua kem holding tank odor sensor freeze")[0]?.slug).toBe(
      "thetford-holding-tank-treatment-freeze-sensor-care",
    );
    expect(lookupSymptomGuides(index, "which thetford toilet additive blue green aqua rinse grey water")[0]?.slug).toBe(
      "thetford-toilet-care-additive-selection",
    );
    expect(lookupSymptomGuides(index, "thetford cassette toilet c220 c260 c400 model tank capacity")[0]?.slug).toBe(
      "thetford-cassette-toilet-c220-c260-c400-model-prep",
    );

    expect(lookupSymptomGuides(index, "furrion microwave no heat").slice(0, 5).map((symptom) => symptom.slug)).not.toContain(
      "furrion-thermostat-manual-model-control-router",
    );
    expect(lookupSymptomGuides(index, "maxxair maxxfan deluxe 07000k remote thermostat")[0]?.slug).toBe(
      "maxxair-maxxfan-deluxe-model-control-prep",
    );
    expect(lookupSymptomGuides(index, "thetford toilet serial")[0]?.slug).toBe(
      "thetford-rv-toilet-serial-model-label-service-prep",
    );
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds the official cross-brand support-depth batch without code entries", () => {
    const expectedSources = new Map([
      ["dometic-rebranded-atwood-routing", "https://www.dometic.com/en-us/lp/rebranded-atwood"],
      ["dometic-rv-water-heaters-current-lineup", "https://www.dometic.com/en-us/lp/rv-waterheaters"],
      ["dometic-rv-furnaces-essential-lineup", "https://www.dometic.com/en-us/lp/rv-furnaces"],
      [
        "dometic-freshjet-remote-batteries-support",
        "https://support.dometic.com/en/freshjet-ac/How-to-Replace-the-remote-control-batteries-b8f9",
      ],
      [
        "dometic-freshjet-control-panel-elements-support",
        "https://support.dometic.com/en/freshjet-ac/I-want-to-know-more-about-the-elements-on-the-control-panel-4a4d",
      ],
      [
        "dometic-americana-replacement-dimensions-support",
        "https://support.dometic.com/en/americana-refrigerators/I-need-help-with-replacement-or-dimensions-of-my-refrigerator-52b0",
      ],
      [
        "furrion-single-zone-premium-thermostat-instruction",
        "https://support.lci1.com/documents/furrion-single-zone-premium-wall-thermostat-instruction-manual",
      ],
      [
        "furrion-standard-single-zone-thermostat-quick-start",
        "https://support.lci1.com/documents/furrion-standard-single-zone-wall-thermostat-quick-start-guide",
      ],
      ["furrion-furnace-wall-thermostat-quick-start", "https://support.lci1.com/documents/ccd-0008670"],
      ["furrion-variable-speed-wall-thermostat-gen3", "https://support.lci1.com/documents/ccd-0010980"],
      ["furrion-washer-dryer-combo-instruction-manual", "https://support.lci1.com/documents/ccd-0008970"],
      ["lippert-recalls-technical-service-bulletins-router", "https://support.lci1.com/recalls-technical-service-bulletins/"],
      [
        "coleman-mach-bluetooth-thermostat-product-page",
        "https://coleman-mach.com/products/thermostats/bluetooth-thermostats/",
      ],
      [
        "coleman-mach-bluetooth-pairing-new-thermostat",
        "https://www.coleman-mach.com/files/bluetooth/pairing-a-new-thermostat.pdf",
      ],
      ["coleman-mach-soft-start-series-product", "https://coleman-mach.com/products/air-conditioners/soft-start-series/"],
      ["maxxair-warranty-information", "https://www.maxxair.com/service-support/warranty/"],
      [
        "suburban-tank-water-heater-controls-product-sheet",
        "https://suburbanrv.com/files/product_documents/Water%20Heater%20Controls/Tank%20Water%20Heater%20101121.pdf",
      ],
      ["aquahot-service-support-authorized-centers", "https://www.aquahot.com/Service-Help.aspx"],
      ["thetford-contact-us-consumer-support", "https://www.thetford.com/us/contact-us/"],
      ["norcold-n1095-support", "https://www.thetford.com/us/thetford-support/n1095/"],
      ["norcold-polar-n10-support", "https://www.thetford.com/us/thetford-support/polar-n10/"],
      ["norcold-2118-polarmax-support", "https://www.thetford.com/us/thetford-support/2118-polarmax/"],
      [
        "onan-rv-generator-dealer-directory-5600464",
        "https://www.cummins.com/sites/default/files/2022-03/rv-dealer-directory-5600464.pdf",
      ],
      ["cummins-care-support-5600280", "https://mart.cummins.com/imagelibrary/data/assetfiles/0073620.pdf"],
    ]);
    const expectedSymptomSourceIds = new Map<string, string[]>([
      ["dometic-atwood-brand-transition-support-routing", ["dometic-rebranded-atwood-routing"]],
      ["dometic-water-heater-current-model-lineup-label-prep", ["dometic-rv-water-heaters-current-lineup"]],
      ["dometic-furnace-essential-model-family-prep", ["dometic-rv-furnaces-essential-lineup"]],
      ["dometic-freshjet-remote-battery-service-prep", ["dometic-freshjet-remote-batteries-support"]],
      ["dometic-freshjet-control-panel-symbols-prep", ["dometic-freshjet-control-panel-elements-support"]],
      ["dometic-americana-replacement-dimensions-service-prep", ["dometic-americana-replacement-dimensions-support"]],
      ["furrion-premium-wall-thermostat-mode-fan-control", ["furrion-single-zone-premium-thermostat-instruction"]],
      [
        "furrion-standard-single-zone-thermostat-control-service-prep",
        ["furrion-standard-single-zone-thermostat-quick-start"],
      ],
      ["furrion-furnace-wall-thermostat-setpoint-service-prep", ["furrion-furnace-wall-thermostat-quick-start"]],
      [
        "furrion-chill-cube-variable-speed-thermostat-gear-timer-control",
        ["furrion-variable-speed-wall-thermostat-gen3"],
      ],
      ["furrion-washer-dryer-combo-cleaning-storage-error-service-prep", ["furrion-washer-dryer-combo-instruction-manual"]],
      ["lippert-furrion-recall-tsb-lookup-service-prep", ["lippert-recalls-technical-service-bulletins-router"]],
      ["coleman-bluetooth-thermostat-compatibility-service-prep", ["coleman-mach-bluetooth-thermostat-product-page"]],
      ["coleman-bluetooth-thermostat-pairing-phone-limit", ["coleman-mach-bluetooth-pairing-new-thermostat"]],
      ["coleman-soft-start-breaker-trip-generator-prep", ["coleman-mach-soft-start-series-product"]],
      ["maxxair-warranty-bill-of-sale-service-prep", ["maxxair-warranty-information"]],
      ["suburban-sw-water-heater-model-suffix-service-prep", ["suburban-tank-water-heater-controls-product-sheet"]],
      ["aquahot-authorized-mobile-service-warranty-routing", ["aquahot-service-support-authorized-centers"]],
      ["thetford-norcold-contact-us-service-routing-prep", ["thetford-contact-us-consumer-support"]],
      ["norcold-n1095-support-manual-parts-service-prep", ["norcold-n1095-support"]],
      ["norcold-polar-n10-manual-parts-service-prep", ["norcold-polar-n10-support"]],
      ["norcold-2118-polarmax-manual-parts-water-dispenser-prep", ["norcold-2118-polarmax-support"]],
      ["onan-generator-nameplate-authorized-dealer-directory-prep", ["onan-rv-generator-dealer-directory-5600464"]],
      ["cummins-care-onan-support-registration-manuals-prep", ["cummins-care-support-5600280"]],
    ]);
    const expectedRequiredTerms = new Map<string, string[]>([
      ["dometic-atwood-brand-transition-support-routing", ["atwood", "dometic"]],
      ["dometic-water-heater-current-model-lineup-label-prep", ["dometic", "wh"]],
      ["dometic-furnace-essential-model-family-prep", ["dometic", "essential"]],
      ["dometic-freshjet-remote-battery-service-prep", ["freshjet", "remote"]],
      ["dometic-freshjet-control-panel-symbols-prep", ["freshjet", "control"]],
      ["dometic-americana-replacement-dimensions-service-prep", ["americana", "dimensions"]],
      ["furrion-premium-wall-thermostat-mode-fan-control", ["furrion", "premium"]],
      ["furrion-standard-single-zone-thermostat-control-service-prep", ["furrion", "standard"]],
      ["furrion-furnace-wall-thermostat-setpoint-service-prep", ["furrion", "furnace"]],
      ["furrion-chill-cube-variable-speed-thermostat-gear-timer-control", ["furrion", "variable"]],
      ["furrion-washer-dryer-combo-cleaning-storage-error-service-prep", ["furrion", "washer"]],
      ["lippert-furrion-recall-tsb-lookup-service-prep", ["lippert", "recall"]],
      ["coleman-bluetooth-thermostat-compatibility-service-prep", ["coleman", "bluetooth"]],
      ["coleman-bluetooth-thermostat-pairing-phone-limit", ["coleman", "pairing"]],
      ["coleman-soft-start-breaker-trip-generator-prep", ["coleman", "soft"]],
      ["maxxair-warranty-bill-of-sale-service-prep", ["maxxair", "warranty"]],
      ["suburban-sw-water-heater-model-suffix-service-prep", ["suburban", "sw"]],
      ["aquahot-authorized-mobile-service-warranty-routing", ["aqua", "hot"]],
      ["thetford-norcold-contact-us-service-routing-prep", ["thetford", "contact"]],
      ["norcold-n1095-support-manual-parts-service-prep", ["n1095"]],
      ["norcold-polar-n10-manual-parts-service-prep", ["n10"]],
      ["norcold-2118-polarmax-manual-parts-water-dispenser-prep", ["2118"]],
      ["onan-generator-nameplate-authorized-dealer-directory-prep", ["onan", "dealer"]],
      ["cummins-care-onan-support-registration-manuals-prep", ["cummins", "care"]],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\bline-voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\binternal\b|\broof\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|measure resistance|fuel nozzle|combustion|coolant pump|manual override|hydraulic work/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(sourcesById.has("cummins-coach-care-rv-service-locations")).toBe(false);
    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, sourceIds] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(sourceIds);
      expect(symptom?.searchRequiredTerms, symptomId).toEqual(expectedRequiredTerms.get(symptomId));
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
    }

    expect(lookupSymptomGuides(index, "is atwood now dometic water heater furnace support")[0]?.slug).toBe(
      "dometic-atwood-brand-transition-support-routing",
    );
    expect(lookupSymptomGuides(index, "dometic wh-6ga wh-6gea wh-9gea model number water heater")[0]?.slug).toBe(
      "dometic-water-heater-current-model-lineup-label-prep",
    );
    expect(lookupSymptomGuides(index, "dometic furnace essential 12k 18k 25k 30k 35k model")[0]?.slug).toBe(
      "dometic-furnace-essential-model-family-prep",
    );
    expect(lookupSymptomGuides(index, "dometic freshjet remote batteries not working fjx fj")[0]?.slug).toBe(
      "dometic-freshjet-remote-battery-service-prep",
    );
    expect(lookupSymptomGuides(index, "dometic freshjet control panel symbols fan aa sleep air purifier")[0]?.slug).toBe(
      "dometic-freshjet-control-panel-symbols-prep",
    );
    expect(lookupSymptomGuides(index, "dometic americana replacement dimensions venting clearance")[0]?.slug).toBe(
      "dometic-americana-replacement-dimensions-service-prep",
    );
    expect(lookupSymptomGuides(index, "furrion single zone premium thermostat fan mode sleep mode")[0]?.slug).toBe(
      "furrion-premium-wall-thermostat-mode-fan-control",
    );
    expect(lookupSymptomGuides(index, "furrion standard single zone thermostat e1 e2 e3 fan mode")[0]?.slug).toBe(
      "furrion-standard-single-zone-thermostat-control-service-prep",
    );
    expect(lookupSymptomGuides(index, "furrion furnace wall thermostat set temperature will not turn on")[0]?.slug).toBe(
      "furrion-furnace-wall-thermostat-setpoint-service-prep",
    );
    expect(lookupSymptomGuides(index, "furrion facw10esvs3 variable speed thermostat gear timer turbo fan error")[0]?.slug).toBe(
      "furrion-chill-cube-variable-speed-thermostat-gear-timer-control",
    );
    expect(lookupSymptomGuides(index, "furrion washer dryer combo error code winterization filter")[0]?.slug).toBe(
      "furrion-washer-dryer-combo-cleaning-storage-error-service-prep",
    );
    expect(lookupSymptomGuides(index, "lippert furrion recall technical service bulletin lookup")[0]?.slug).toBe(
      "lippert-furrion-recall-tsb-lookup-service-prep",
    );
    expect(lookupSymptomGuides(index, "coleman mach bluetooth thermostat compatible 9430 9630")[0]?.slug).toBe(
      "coleman-bluetooth-thermostat-compatibility-service-prep",
    );
    expect(lookupSymptomGuides(index, "coleman mach rv climate app pairing 6 digit id")[0]?.slug).toBe(
      "coleman-bluetooth-thermostat-pairing-phone-limit",
    );
    expect(lookupSymptomGuides(index, "coleman mach soft start breaker trips generator")[0]?.slug).toBe(
      "coleman-soft-start-breaker-trip-generator-prep",
    );
    expect(lookupSymptomGuides(index, "maxxair warranty registration bill of sale")[0]?.slug).toBe(
      "maxxair-warranty-bill-of-sale-service-prep",
    );
    expect(lookupSymptomGuides(index, "suburban sw6de sw6d del dec model meaning")[0]?.slug).toBe(
      "suburban-sw-water-heater-model-suffix-service-prep",
    );
    expect(lookupSymptomGuides(index, "aqua hot factory authorized service center mobile warranty repair")[0]?.slug).toBe(
      "aquahot-authorized-mobile-service-warranty-routing",
    );
    expect(lookupSymptomGuides(index, "thetford contact support model serial vin technical question")[0]?.slug).toBe(
      "thetford-norcold-contact-us-service-routing-prep",
    );
    expect(lookupSymptomGuides(index, "norcold n1095 manual parts warranty service prep")[0]?.slug).toBe(
      "norcold-n1095-support-manual-parts-service-prep",
    );
    expect(lookupSymptomGuides(index, "norcold polar n10 n10lx owner manual parts list")[0]?.slug).toBe(
      "norcold-polar-n10-manual-parts-service-prep",
    );
    expect(lookupSymptomGuides(index, "norcold 2118 polarmax water dispenser manual parts service")[0]?.slug).toBe(
      "norcold-2118-polarmax-manual-parts-water-dispenser-prep",
    );
    expect(lookupSymptomGuides(index, "onan generator model spec serial number authorized service dealer")[0]?.slug).toBe(
      "onan-generator-nameplate-authorized-dealer-directory-prep",
    );
    expect(lookupSymptomGuides(index, "cummins care onan generator support registration manuals warranty")[0]?.slug).toBe(
      "cummins-care-onan-support-registration-manuals-prep",
    );

    expect(lookupSymptomGuides(index, "water heater no hot water").slice(0, 5).map((symptom) => symptom.slug)).not.toContain(
      "dometic-water-heater-current-model-lineup-label-prep",
    );
    expect(lookupSymptomGuides(index, "furnace no heat").slice(0, 5).map((symptom) => symptom.slug)).not.toContain(
      "dometic-furnace-essential-model-family-prep",
    );
    expect(lookupSymptomGuides(index, "freshjet not cooling").slice(0, 5).map((symptom) => symptom.slug)).not.toContain(
      "dometic-freshjet-control-panel-symbols-prep",
    );
    expect(lookupSymptomGuides(index, "norcold refrigerator not cooling").slice(0, 5).map((symptom) => symptom.slug)).not.toContain(
      "norcold-polar-n10-manual-parts-service-prep",
    );
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds the official manufacturer support-extension batch without code entries", () => {
    const expectedSources = new Map<string, string>([
      [
        "dometic-freshjet-heat-strip-cold-weather-support",
        "https://support.dometic.com/en/freshjet-ac/My-rooftop-unit-has-the-electric-heat-strip-option-non-heat-pump-electric-heat-option-but-when-it-gets-colder-outside-it-doesnt-seem-to-maintain-the-temperature-What-should-I-do-24ac",
      ],
      [
        "dometic-freshjet-set-temperature-model-tag-support",
        "https://support.dometic.com/en/freshjet-ac/How-to-Set-the-temperature-621b",
      ],
      [
        "dometic-ccc2-program-1-2-support",
        "https://support.dometic.com/en/brisk-ac/How-to-control-Program-1-and-2-COMFORT-CONTROL-CENTER-2-THERMOSTAT-eabf",
      ],
      [
        "dometic-connect-pro-thermostat-short-operating",
        "https://media.dometic.com/externalassets/inc1015rd_9620001471_118307.pdf",
      ],
      [
        "dometic-ibis-low-air-output-filter-support",
        "https://support.dometic.com/en/ibis-ac/My-air-conditioner-is-giving-me-low-air-output-dfd3",
      ],
      [
        "dometic-fantastic-vent-7350-product",
        "https://www.dometic.com/en-us/product/dometic-7350-fan-tastic-vent-roof-fan-9108870595",
      ],
      [
        "furrion-refrigerator-temperature-testing-video",
        "https://support.lci1.com/videos/temperature-testing-a-furrion-refrigerator",
      ],
      [
        "furrion-refrigerator-freezer-cold-fridge-warm-video",
        "https://support.lci1.com/videos/furrion-refrigerator-freezer-is-cold-but-refrigerator-is-not",
      ],
      [
        "furrion-refrigerator-identification-label-video",
        "https://support.lci1.com/videos/how-to-find-the-identification-label-on-a-furrion-refrigerator",
      ],
      ["furrion-ac-operation-video", "https://support.lci1.com/videos/furrion-air-conditioner-operation"],
      ["furrion-under-bench-ac-user-manual", "https://support.lci1.com/documents/ccd-0005748"],
      ["furrion-12-inch-cooktop-ffd-manual", "https://support.lci1.com/documents/ccd-0010262"],
      ["coleman-mach-service-support-router", "https://coleman-mach.com/service-support/default.aspx"],
      ["maxxair-rv-owners-product-service-routing", "https://www.maxxair.com/rv-owners/"],
      ["maxxair-maxxfan-mini-product-family", "https://www.maxxair.com/products/fans/maxxfan-mini/"],
      ["suburban-service-support-router", "https://suburbanrv.com/service-support/default.aspx"],
      [
        "aquahot-125-gn1-use-care-guide",
        "https://library.aquahot.com/wp-content/uploads/2022/04/AHE-125-GN1-Use-and-Care-Guide.pdf",
      ],
      [
        "aquahot-250-d02-use-care-guide",
        "https://library.aquahot.com/wp-content/uploads/2022/04/AHE-250-D02-Use-and-Care-Guide.pdf",
      ],
      ["thetford-warranty-claim-faq", "https://www.thetford.com/us/faq/what-should-i-do-if-i-have-a-warranty-claim/"],
      [
        "norcold-recall-reimbursement-faq",
        "https://www.thetford.com/us/faq/will-norcold-reimburse-me-for-a-recall-repair-paid-for-out-of-pocket/",
      ],
      [
        "norcold-fault-code-routing-faq",
        "https://www.thetford.com/us/faq/my-refrigerator-shows-a-fault-code-what-should-i-do/",
      ],
      ["norcold-n15dc-support", "https://www.thetford.com/us/thetford-support/n15dc/"],
      ["thetford-porta-potti-565e-support", "https://www.thetford.com/us/thetford-support/porta-potti-565e/"],
      ["onan-rv-lifestyle-coach-care-0043135", "https://mart.cummins.com/imagelibrary/data/assetfiles/0043135.pdf"],
    ]);
    const expectedSymptomSourceIds = new Map<string, string[]>([
      ["dometic-freshjet-heat-strip-cold-weather-prep", ["dometic-freshjet-heat-strip-cold-weather-support"]],
      ["dometic-freshjet-fj-fjx-temperature-model-label", ["dometic-freshjet-set-temperature-model-tag-support"]],
      ["dometic-ccc2-program-schedule-control-prep", ["dometic-ccc2-program-1-2-support"]],
      ["dometic-connect-pro-thermostat-control-prep", ["dometic-connect-pro-thermostat-short-operating"]],
      ["dometic-ibis-ac-low-air-output-filter-prep", ["dometic-ibis-low-air-output-filter-support"]],
      ["dometic-fantastic-vent-7350-rain-sensor-control-prep", ["dometic-fantastic-vent-7350-product"]],
      ["furrion-refrigerator-temperature-testing-service-prep", ["furrion-refrigerator-temperature-testing-video"]],
      [
        "furrion-refrigerator-freezer-cold-fridge-warm-service-prep",
        ["furrion-refrigerator-freezer-cold-fridge-warm-video"],
      ],
      ["furrion-refrigerator-identification-label-service-prep", ["furrion-refrigerator-identification-label-video"]],
      ["furrion-ac-operation-mode-control-service-prep", ["furrion-ac-operation-video"]],
      ["furrion-under-bench-ac-filter-drain-control-service-prep", ["furrion-under-bench-ac-user-manual"]],
      ["furrion-12-inch-cooktop-ffd-ignition-service-prep", ["furrion-12-inch-cooktop-ffd-manual"]],
      ["coleman-mach-support-resource-routing-prep", ["coleman-mach-service-support-router"]],
      ["maxxair-rv-owner-product-service-routing-prep", ["maxxair-rv-owners-product-service-routing"]],
      ["maxxair-maxxfan-mini-model-feature-prep", ["maxxair-maxxfan-mini-product-family"]],
      ["suburban-service-support-certified-tech-routing-prep", ["suburban-service-support-router"]],
      ["aquahot-125-gn1-lcd-fuel-service-prep", ["aquahot-125-gn1-use-care-guide"]],
      ["aquahot-250-d02-diesel-use-care-service-prep", ["aquahot-250-d02-use-care-guide"]],
      ["thetford-norcold-warranty-claim-asc-dealer-prep", ["thetford-warranty-claim-faq"]],
      ["norcold-recall-repair-reimbursement-routing", ["norcold-recall-reimbursement-faq"]],
      ["norcold-refrigerator-fault-code-record-model-prep", ["norcold-fault-code-routing-faq"]],
      [
        "norcold-n15dc-support-manual-parts-prep",
        ["norcold-n15dc-support", "norcold-n15dc-n20dc-parts-list-641044-082025"],
      ],
      ["thetford-porta-potti-565e-battery-flush-storage-prep", ["thetford-porta-potti-565e-support"]],
      ["onan-rv-generator-warranty-coach-care-service-prep", ["onan-rv-lifestyle-coach-care-0043135"]],
    ]);
    const expectedRequiredTerms = new Map<string, string[]>([
      ["dometic-freshjet-heat-strip-cold-weather-prep", ["freshjet", "heat"]],
      ["dometic-freshjet-fj-fjx-temperature-model-label", ["freshjet", "temperature"]],
      ["dometic-ccc2-program-schedule-control-prep", ["ccc2", "program"]],
      ["dometic-connect-pro-thermostat-control-prep", ["connect", "pro"]],
      ["dometic-ibis-ac-low-air-output-filter-prep", ["ibis", "air"]],
      ["dometic-fantastic-vent-7350-rain-sensor-control-prep", ["fantastic", "7350"]],
      ["furrion-refrigerator-temperature-testing-service-prep", ["furrion", "temperature"]],
      ["furrion-refrigerator-freezer-cold-fridge-warm-service-prep", ["furrion", "freezer"]],
      ["furrion-refrigerator-identification-label-service-prep", ["furrion", "label"]],
      ["furrion-ac-operation-mode-control-service-prep", ["furrion", "operation"]],
      ["furrion-under-bench-ac-filter-drain-control-service-prep", ["under", "bench"]],
      ["furrion-12-inch-cooktop-ffd-ignition-service-prep", ["furrion", "cooktop"]],
      ["coleman-mach-support-resource-routing-prep", ["colemanmach"]],
      ["maxxair-rv-owner-product-service-routing-prep", ["maxxair", "owners"]],
      ["maxxair-maxxfan-mini-model-feature-prep", ["maxxfan", "mini"]],
      ["suburban-service-support-certified-tech-routing-prep", ["suburban"]],
      ["aquahot-125-gn1-lcd-fuel-service-prep", ["125", "gn1"]],
      ["aquahot-250-d02-diesel-use-care-service-prep", ["250", "d02"]],
      ["thetford-norcold-warranty-claim-asc-dealer-prep", ["thetford", "norcold"]],
      ["norcold-recall-repair-reimbursement-routing", ["norcold"]],
      ["norcold-refrigerator-fault-code-record-model-prep", ["norcold"]],
      ["norcold-n15dc-support-manual-parts-prep", ["n15dc", "n15dc+641044", "n15dc+parts+list"]],
      ["thetford-porta-potti-565e-battery-flush-storage-prep", ["565e"]],
      ["onan-rv-generator-warranty-coach-care-service-prep", ["onan", "cummins"]],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\bline-voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\binternal\b|\broof\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|measure resistance|fuel nozzle|combustion|coolant pump|manual override|hydraulic work/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, sourceIds] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(sourceIds);
      expect(symptom?.searchRequiredTerms, symptomId).toEqual(expectedRequiredTerms.get(symptomId));
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
    }

    expect(lookupSymptomGuides(index, "dometic freshjet heat strip does not keep rv warm")[0]?.slug).toBe(
      "dometic-freshjet-heat-strip-cold-weather-prep",
    );
    expect(lookupSymptomGuides(index, "dometic freshjet fjx set temperature model number")[0]?.slug).toBe(
      "dometic-freshjet-fj-fjx-temperature-model-label",
    );
    expect(lookupSymptomGuides(index, "dometic ccc2 program 1 program 2 schedule cancel")[0]?.slug).toBe(
      "dometic-ccc2-program-schedule-control-prep",
    );
    expect(lookupSymptomGuides(index, "dometic connect pro thermostat operating manual")[0]?.slug).toBe(
      "dometic-connect-pro-thermostat-control-prep",
    );
    expect(lookupSymptomGuides(index, "dometic ibis ac low air output clean filters")[0]?.slug).toBe(
      "dometic-ibis-ac-low-air-output-filter-prep",
    );
    expect(lookupSymptomGuides(index, "dometic fantastic vent 7350 rain sensor remote")[0]?.slug).toBe(
      "dometic-fantastic-vent-7350-rain-sensor-control-prep",
    );
    expect(lookupSymptomGuides(index, "furrion refrigerator temperature testing refrigerator not cold")[0]?.slug).toBe(
      "furrion-refrigerator-temperature-testing-service-prep",
    );
    expect(lookupSymptomGuides(index, "furrion freezer cold refrigerator not cold")[0]?.slug).toBe(
      "furrion-refrigerator-freezer-cold-fridge-warm-service-prep",
    );
    expect(lookupSymptomGuides(index, "where is furrion refrigerator model serial label")[0]?.slug).toBe(
      "furrion-refrigerator-identification-label-service-prep",
    );
    expect(lookupSymptomGuides(index, "furrion air conditioner operation mode fan controls")[0]?.slug).toBe(
      "furrion-ac-operation-mode-control-service-prep",
    );
    expect(lookupSymptomGuides(index, "furrion 9k under bench air conditioner filter drain controls")[0]?.slug).toBe(
      "furrion-under-bench-ac-filter-drain-control-service-prep",
    );
    expect(lookupSymptomGuides(index, "furrion 12 inch 2 burner cooktop ffd will not light")[0]?.slug).toBe(
      "furrion-12-inch-cooktop-ffd-ignition-service-prep",
    );
    expect(lookupSymptomGuides(index, "coleman mach support service documents model number warranty")[0]?.slug).toBe(
      "coleman-mach-support-resource-routing-prep",
    );
    expect(lookupSymptomGuides(index, "maxxair rv owners service locator documentation library")[0]?.slug).toBe(
      "maxxair-rv-owner-product-service-routing-prep",
    );
    expect(lookupSymptomGuides(index, "maxxfan mini model 3801 3851 remote led service prep")[0]?.slug).toBe(
      "maxxair-maxxfan-mini-model-feature-prep",
    );
    expect(lookupSymptomGuides(index, "suburban rv appliance support certified gas technician service center")[0]?.slug).toBe(
      "suburban-service-support-certified-tech-routing-prep",
    );
    expect(lookupSymptomGuides(index, "aqua hot 125 gn1 lcd low voltage service prep")[0]?.slug).toBe(
      "aquahot-125-gn1-lcd-fuel-service-prep",
    );
    expect(lookupSymptomGuides(index, "aqua hot 250 d02 diesel hot water cabin heat service prep")[0]?.slug).toBe(
      "aquahot-250-d02-diesel-use-care-service-prep",
    );
    expect(lookupSymptomGuides(index, "thetford norcold warranty claim authorized service center")[0]?.slug).toBe(
      "thetford-norcold-warranty-claim-asc-dealer-prep",
    );
    expect(lookupSymptomGuides(index, "norcold recall repair reimbursement paid out of pocket")[0]?.slug).toBe(
      "norcold-recall-repair-reimbursement-routing",
    );
    expect(lookupSymptomGuides(index, "norcold refrigerator shows fault code what should i do")[0]?.slug).toBe(
      "norcold-refrigerator-fault-code-record-model-prep",
    );
    expect(lookupSymptomGuides(index, "norcold n15dc manual parts support night mode travel latch")[0]?.slug).toBe(
      "norcold-n15dc-support-manual-parts-prep",
    );
    expect(lookupSymptomGuides(index, "porta potti 565e electric flush batteries storage level indicator")[0]?.slug).toBe(
      "thetford-porta-potti-565e-battery-flush-storage-prep",
    );
    expect(lookupSymptomGuides(index, "onan rv generator warranty coach care service prep")[0]?.slug).toBe(
      "onan-rv-generator-warranty-coach-care-service-prep",
    );

    expect(lookupSymptomGuides(index, "freshjet not cooling").slice(0, 5).map((symptom) => symptom.slug)).not.toContain(
      "dometic-freshjet-fj-fjx-temperature-model-label",
    );
    expect(lookupSymptomGuides(index, "furrion refrigerator not cooling").slice(0, 5).map((symptom) => symptom.slug)).not.toContain(
      "furrion-refrigerator-identification-label-service-prep",
    );
    expect(lookupSymptomGuides(index, "maxxair fan not working").slice(0, 5).map((symptom) => symptom.slug)).not.toContain(
      "maxxair-rv-owner-product-service-routing-prep",
    );
    expect(lookupSymptomGuides(index, "aqua hot no hot water").slice(0, 5).map((symptom) => symptom.slug)).not.toContain(
      "aquahot-250-d02-diesel-use-care-service-prep",
    );
    expect(lookupSymptomGuides(index, "claim").map((symptom) => symptom.slug)).not.toContain(
      "thetford-norcold-warranty-claim-asc-dealer-prep",
    );
    expect(lookupSymptomGuides(index, "warranty").map((symptom) => symptom.slug)).not.toContain(
      "thetford-norcold-warranty-claim-asc-dealer-prep",
    );
    expect(lookupSymptomGuides(index, "recall").map((symptom) => symptom.slug)).not.toContain(
      "norcold-recall-repair-reimbursement-routing",
    );
    expect(lookupSymptomGuides(index, "service support").map((symptom) => symptom.slug)).not.toEqual(
      expect.arrayContaining([
        "coleman-mach-support-resource-routing-prep",
        "suburban-service-support-certified-tech-routing-prep",
      ]),
    );
    expect(lookupSymptomGuides(index, "coach care").map((symptom) => symptom.slug)).not.toContain(
      "onan-rv-generator-warranty-coach-care-service-prep",
    );
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds the official support-gap extension batch without code entries", () => {
    const expectedSources = new Map<string, string>([
      [
        "dometic-brisk-ac-maintain-data-tags-support",
        "https://support.dometic.com/en/brisk-ac/How-to-maintain-the-air-conditioner-952a",
      ],
      [
        "dometic-brisk-ac-temperature-control-support",
        "https://support.dometic.com/en/brisk-ac/How-to-control-the-temperature-fb34",
      ],
      [
        "dometic-freshjet-campsite-power-support",
        "https://support.dometic.com/en/freshjet-ac/How-to-run-my-RV-air-conditioner-on-the-campsite-cc4b",
      ],
      [
        "dometic-ibis-ac-not-cooling-mode-support",
        "https://support.dometic.com/en/ibis-ac/My-air-conditioner-is-not-cooling-well-584f",
      ],
      [
        "dometic-ibis-ac-filter-efficiency-support",
        "https://support.dometic.com/en/ibis-ac/What-should-I-do-to-make-sure-the-filter-on-my-rooftop-unit-is-clean-for-maximum-efficiency-2dad",
      ],
      ["dometic-affected-on-recall-action", "https://www.dometic.com/en-us/affected-on-recall"],
      ["furrion-vent-fans-support-router", "https://support.lci1.com/vent-fans"],
      ["furrion-ranges-support-router", "https://support.lci1.com/ranges"],
      ["furrion-ovens-support-router", "https://support.lci1.com/ovens"],
      ["furrion-power-converters-support-router", "https://support.lci1.com/power-converters"],
      ["lippert-onecontrol-wireless-support-router", "https://support.lci1.com/onecontrol-wireless-formerly-myrv"],
      ["lippert-power-gear-hydraulic-leveling-support", "https://support.lci1.com/power-gear-hydraulic-leveling-system"],
      ["coleman-underbunk-central-ac-product", "https://coleman-mach.com/products/air-conditioners/Underbunk-series/"],
      ["coleman-ceiling-assemblies-electric-heat-kits", "https://coleman-mach.com/products/ceiling-assemblies/default.aspx"],
      ["maxxair-maxxfan-pivot-product", "https://www.maxxair.com/products/fans/maxxfan-pivot/"],
      ["maxxair-maxxshades-category", "https://www.maxxair.com/Products/maxxshades/default.aspx"],
      ["suburban-tank-water-heaters-product-family", "https://suburbanrv.com/water-heating/tank-water-heaters/"],
      ["aquahot-125m-product-page", "https://www.aquahot.com/Products/RV/125m.aspx"],
      [
        "thetford-porta-potti-235-245-255-265-support",
        "https://www.thetford.com/us/thetford-support/porta-potti-234-245-255-265/",
      ],
      [
        "thetford-porta-potti-current-model-identification",
        "https://www.thetford.com/app/uploads/2024/10/Porta-Potti-Serial-Number-Identification-and-Current-Part-Numbers.pdf",
      ],
      ["thetford-aqua-magic-residence-support", "https://thetford.com/us/thetford-support/aqua-magic-residence/"],
      ["norcold-polar-n7x-support", "https://www.thetford.com/us/thetford-support/n7x/"],
      ["norcold-n6-n8-series-support", "https://thetford.com/us/thetford-support/n6-n8-series/"],
      ["onan-green-label-parts-reference-0075650", "https://mart.cummins.com/imagelibrary/data/assetfiles/0075650.pdf"],
    ]);
    const expectedSymptomSourceIds = new Map<string, string[]>([
      ["dometic-brisk-ac-maintenance-data-tag-prep", ["dometic-brisk-ac-maintain-data-tags-support"]],
      ["dometic-brisk-ac-temperature-thermostat-selector-prep", ["dometic-brisk-ac-temperature-control-support"]],
      ["dometic-freshjet-campsite-power-startup-prep", ["dometic-freshjet-campsite-power-support"]],
      ["dometic-ibis-ac-not-cooling-mode-prep", ["dometic-ibis-ac-not-cooling-mode-support"]],
      ["dometic-ibis-ac-filter-maintenance-prep", ["dometic-ibis-ac-filter-efficiency-support"]],
      ["dometic-refrigerator-recall-affected-action-prep", ["dometic-affected-on-recall-action"]],
      ["furrion-vent-fan-model-control-service-prep", ["furrion-vent-fans-support-router"]],
      ["furrion-range-model-manual-router-prep", ["furrion-ranges-support-router"]],
      ["furrion-oven-chef-collection-model-manual-router", ["furrion-ovens-support-router"]],
      ["furrion-power-converter-model-support-routing-prep", ["furrion-power-converters-support-router"]],
      ["lippert-onecontrol-wireless-app-control-state-prep", ["lippert-onecontrol-wireless-support-router"]],
      ["lippert-power-gear-hydraulic-leveling-touchpad-service-prep", ["lippert-power-gear-hydraulic-leveling-support"]],
      ["coleman-underbunk-ac-filter-model-service-prep", ["coleman-underbunk-central-ac-product"]],
      ["coleman-ceiling-assembly-control-box-part-capture", ["coleman-ceiling-assemblies-electric-heat-kits"]],
      ["maxxair-pivot-model-control-prep", ["maxxair-maxxfan-pivot-product"]],
      ["maxxair-maxxshade-vent-fan-compatibility-prep", ["maxxair-maxxshades-category"]],
      ["suburban-tank-water-heater-family-model-prep", ["suburban-tank-water-heaters-product-family"]],
      ["aquahot-125m-lcd-model-service-routing", ["aquahot-125m-product-page"]],
      ["thetford-porta-potti-235-245-255-265-storage-flush-prep", ["thetford-porta-potti-235-245-255-265-support"]],
      ["thetford-porta-potti-current-model-identification-prep", ["thetford-porta-potti-current-model-identification"]],
      ["thetford-aqua-magic-residence-model-parts-service-prep", ["thetford-aqua-magic-residence-support"]],
      [
        "norcold-polar-n7x-n8x-support-manual-parts-prep",
        ["norcold-polar-n7x-support", "norcold-n7-n8-polar-parts-list-639735-06102025"],
      ],
      ["norcold-n6-n8-series-control-storage-support-prep", ["norcold-n6-n8-series-support"]],
      ["onan-green-label-parts-model-spec-service-prep", ["onan-green-label-parts-reference-0075650"]],
    ]);
    const expectedRequiredTerms = new Map<string, string[]>([
      ["dometic-brisk-ac-maintenance-data-tag-prep", ["brisk"]],
      ["dometic-brisk-ac-temperature-thermostat-selector-prep", ["brisk"]],
      ["dometic-freshjet-campsite-power-startup-prep", ["freshjet"]],
      ["dometic-ibis-ac-not-cooling-mode-prep", ["ibis"]],
      ["dometic-ibis-ac-filter-maintenance-prep", ["ibis"]],
      ["dometic-refrigerator-recall-affected-action-prep", ["dometic"]],
      ["furrion-vent-fan-model-control-service-prep", ["electronic", "furrion"]],
      ["furrion-range-model-manual-router-prep", ["airfry", "furrion"]],
      ["furrion-oven-chef-collection-model-manual-router", ["chef", "furrion"]],
      ["furrion-power-converter-model-support-routing-prep", ["netzero", "furrion"]],
      ["lippert-onecontrol-wireless-app-control-state-prep", ["onecontrol"]],
      ["lippert-power-gear-hydraulic-leveling-touchpad-service-prep", ["powergear", "lippert", "powerlevel"]],
      ["coleman-underbunk-ac-filter-model-service-prep", ["underbunk"]],
      ["coleman-ceiling-assembly-control-box-part-capture", ["controlbox", "coleman"]],
      ["maxxair-pivot-model-control-prep", ["pivot"]],
      ["maxxair-maxxshade-vent-fan-compatibility-prep", ["maxxshade"]],
      ["suburban-tank-water-heater-family-model-prep", ["suburban"]],
      ["aquahot-125m-lcd-model-service-routing", ["125m"]],
      ["thetford-porta-potti-235-245-255-265-storage-flush-prep", ["245"]],
      ["thetford-porta-potti-current-model-identification-prep", ["565e", "thetford"]],
      ["thetford-aqua-magic-residence-model-parts-service-prep", ["residence"]],
      [
        "norcold-polar-n7x-n8x-support-manual-parts-prep",
        ["n7x", "norcold+n7+n8", "norcold+639735", "norcold+n7+n8+parts"],
      ],
      ["norcold-n6-n8-series-control-storage-support-prep", ["n6"]],
      ["onan-green-label-parts-model-spec-service-prep", ["greenlabel", "onan", "cummins"]],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\bline-voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\binternal\b|\broof\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|measure resistance|fuel nozzle|combustion|coolant pump|manual override|hydraulic work|hydraulic repair/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, sourceIds] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(sourceIds);
      expect(symptom?.searchRequiredTerms, symptomId).toEqual(expectedRequiredTerms.get(symptomId));
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
    }

    for (const symptomId of expectedSymptomSourceIds.keys()) {
      const symptom = symptomById.get(symptomId);
      for (const alias of symptom?.searchAliases ?? []) {
        expect(
          lookupSymptomGuides(index, alias)
            .slice(0, 4)
            .map((result) => result.slug),
          `${symptomId}: ${alias}`,
        ).toContain(symptom?.slug);
      }
    }

    expect(lookupSymptomGuides(index, "dometic brisk ac data tag mfg model maintenance")[0]?.slug).toBe(
      "dometic-brisk-ac-maintenance-data-tag-prep",
    );
    expect(lookupSymptomGuides(index, "dometic brisk temperature thermostat selector")[0]?.slug).toBe(
      "dometic-brisk-ac-temperature-thermostat-selector-prep",
    );
    expect(lookupSymptomGuides(index, "freshjet campsite power startup current delay fuse")[0]?.slug).toBe(
      "dometic-freshjet-campsite-power-startup-prep",
    );
    expect(lookupSymptomGuides(index, "dometic ibis cooling mode not cooling well")[0]?.slug).toBe(
      "dometic-ibis-ac-not-cooling-mode-prep",
    );
    expect(lookupSymptomGuides(index, "ibis filter return air grille maximum efficiency")[0]?.slug).toBe(
      "dometic-ibis-ac-filter-maintenance-prep",
    );
    expect(lookupSymptomGuides(index, "dometic refrigerator recall affected on recall kit rm2652")[0]?.slug).toBe(
      "dometic-refrigerator-recall-affected-action-prep",
    );
    expect(lookupSymptomGuides(index, "furrion vent fan electronic lid model support")[0]?.slug).toBe(
      "furrion-electronic-lid-vent-fan-control-prep",
    );
    expect(lookupSymptomGuides(index, "furrion range chef collection air fry manual model")[0]?.slug).toBe(
      "furrion-range-model-manual-router-prep",
    );
    expect(lookupSymptomGuides(index, "furrion oven chef collection model manual")[0]?.slug).toBe(
      "furrion-oven-chef-collection-model-manual-router",
    );
    expect(lookupSymptomGuides(index, "furrion net-zero power converter model support")[0]?.slug).toBe(
      "furrion-power-converter-model-support-routing-prep",
    );
    expect(lookupSymptomGuides(index, "lippert onecontrol wireless myrv touch panel app setup")[0]?.slug).toBe(
      "lippert-onecontrol-wireless-app-control-state-prep",
    );
    expect(lookupSymptomGuides(index, "lippert power gear hydraulic leveling touchpad owner manual")[0]?.slug).toBe(
      "lippert-power-gear-hydraulic-leveling-touchpad-service-prep",
    );
    expect(lookupSymptomGuides(index, "coleman underbunk ub11 ub15 washable filter service prep")[0]?.slug).toBe(
      "coleman-underbunk-ac-filter-model-service-prep",
    );
    expect(lookupSymptomGuides(index, "coleman ceiling assembly control box electric heat kit")[0]?.slug).toBe(
      "coleman-ceiling-assembly-control-box-part-capture",
    );
    expect(lookupSymptomGuides(index, "maxxair pivot 00-61000 directional fan control")[0]?.slug).toBe(
      "maxxair-pivot-model-control-prep",
    );
    expect(lookupSymptomGuides(index, "maxxair maxxshade plus 00-03901 vent fan compatibility")[0]?.slug).toBe(
      "maxxair-maxxshade-vent-fan-compatibility-prep",
    );
    expect(lookupSymptomGuides(index, "suburban tank water heater 6 gallon 10 gallon anode model")[0]?.slug).toBe(
      "suburban-tank-water-heater-family-model-prep",
    );
    expect(lookupSymptomGuides(index, "aquahot 125m lcd modular zones service routing")[0]?.slug).toBe(
      "aquahot-125m-lcd-model-service-routing",
    );
    expect(lookupSymptomGuides(index, "porta potti 245 bellows level indicator storage")[0]?.slug).toBe(
      "thetford-porta-potti-235-245-255-265-storage-flush-prep",
    );
    expect(lookupSymptomGuides(index, "porta potti serial current model 565e 365 345")[0]?.slug).toBe(
      "thetford-porta-potti-current-model-identification-prep",
    );
    expect(lookupSymptomGuides(index, "aqua magic residence slow close single pedal parts list")[0]?.slug).toBe(
      "thetford-aqua-magic-residence-model-parts-service-prep",
    );
    expect(lookupSymptomGuides(index, "norcold polar n7x n8x model tag parts list")[0]?.slug).toBe(
      "norcold-polar-n7x-n8x-support-manual-parts-prep",
    );
    expect(lookupSymptomGuides(index, "norcold n6 n8 series storage latches diagnostics door ajar")[0]?.slug).toBe(
      "norcold-n6-n8-series-control-storage-support-prep",
    );
    expect(lookupSymptomGuides(index, "onan green label parts model spec qg 5500")[0]?.slug).toBe(
      "onan-green-label-parts-model-spec-service-prep",
    );

    const anchoredSlugs = new Set(expectedSymptomSourceIds.keys());
    for (const query of [
      "data tag",
      "temperature control",
      "campsite power",
      "filter maintenance",
      "recall",
      "vent fan",
      "range manual",
      "oven manual",
      "power converter",
      "hydraulic leveling",
      "ceiling assembly",
      "tank water heater",
      "parts list",
      "model serial",
    ]) {
      expect(
        lookupSymptomGuides(index, query)
          .slice(0, 5)
          .map((symptom) => symptom.slug)
          .filter((slug) => anchoredSlugs.has(slug)),
        query,
      ).toEqual([]);
    }
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds the official Norcold N4000 touchscreen owner-manual error-code table", () => {
    const index = buildSearchIndex(corpus);
    const supportUrls = new Map(corpus.sources.map((source) => [source.id, source.url]));
    const entries = corpus.entries.filter((entry) => entry.sourceIds.includes("norcold-n4000-touchscreen-owner-install"));
    const entryByCode = new Map(entries.map((entry) => [entry.code, entry]));
    const serviceDirectCodes = ["1", "2", "4", "5", "8", "9", "12", "13"];
    const ownerInstructionMeanings = new Map([
      ["3", "The refrigerator does not work on gas"],
      ["6", "The refrigerator does not work on 12V"],
      ["7", "The refrigerator does not work on 12V"],
      ["10", "The refrigerator does not work on 120V"],
      ["11", "The refrigerator does not work in AUTO mode"],
      ["18", "All symbols on the control panel light up"],
    ]);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\bline-voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\binternal\b|\broof\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|measure resistance|fuel nozzle|combustion|coolant pump|manual override|hydraulic work|hydraulic repair/i;

    expect(supportUrls.get("norcold-n4000-touchscreen-owner-install")).toBe(
      "https://www.thetford.com/app/uploads/2024/09/IM_OM_BVAN_639972C_20220225.pdf",
    );
    expect(new Set(entries.map((entry) => entry.code))).toEqual(
      new Set(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "18"]),
    );

    for (const entry of entries) {
      expect(entry.modelFamilies, entry.id).toEqual(
        expect.arrayContaining(["N4000 touchscreen", "N4104", "N4141", "N4150", "N4104Axx", "N4141Axx", "N4150Axx"]),
      );
      expect(entry.symptomIds, entry.id).toEqual(expect.arrayContaining(["norcold-absorption-display-faults", "service-call-prep"]));
      expect(entry.ownerSafeActions.join(" "), entry.id).not.toMatch(unsafeOwnerActionPattern);
      expect(entry.safetyBoundary, entry.id).toMatch(/qualified Norcold service|Norcold Service Center/i);
    }

    for (const code of serviceDirectCodes) {
      expect(entryByCode.get(code)?.plainMeaning, code).toMatch(/directly contact your dealer or a Norcold Service Center/i);
      expect(entryByCode.get(code)?.ownerSafeActions.join(" "), code).toMatch(/Record the exact code/i);
      expect(entryByCode.get(code)?.serviceOnlyActions.join(" "), code).toMatch(/Norcold Service Center|qualified Norcold service/i);
      expect(entryByCode.get(code)?.symptomIds, code).not.toContain("refrigerator-lp-ignition");
    }

    for (const [code, meaning] of ownerInstructionMeanings) {
      expect(entryByCode.get(code)?.plainMeaning, code).toContain(meaning);
    }

    expect(entryByCode.get("3")?.ownerSafeActions.join(" ")).toMatch(/LP supply state|try another source/i);
    expect(entryByCode.get("6")?.ownerSafeActions.join(" ")).toMatch(/engine is running|try another source/i);
    expect(entryByCode.get("7")?.ownerSafeActions.join(" ")).toMatch(/engine is running|try another source/i);
    expect(entryByCode.get("10")?.ownerSafeActions.join(" ")).toMatch(/shore or generator power|try another source/i);
    expect(entryByCode.get("11")?.ownerSafeActions.join(" ")).toMatch(/manual source selection/i);
    expect(entryByCode.get("18")?.ownerSafeActions.join(" ")).toMatch(/Wait a few seconds/i);
    expect(entryByCode.get("18")?.ownerSafeActions.join(" ")).toMatch(/model.*selected source.*whether the code repeats/i);

    expect(lookupEntries(index, "norcold n4104 error code 3 gas")[0]?.slug).toBe("norcold-n4000-error-3-gas-source-unavailable");
    expect(lookupEntries(index, "norcold n4104 gas source")[0]?.slug).toBe("norcold-n4000-error-3-gas-source-unavailable");
    expect(lookupEntries(index, "norcold n4141 error code 10 120v")[0]?.slug).toBe(
      "norcold-n4000-error-10-ac-source-unavailable",
    );
    expect(lookupEntries(index, "norcold n4150 error code 18 all symbols")[0]?.slug).toBe(
      "norcold-n4000-error-18-startup-all-symbols-lit",
    );
    expect(lookupEntries(index, "norcold n4000 touchscreen code 11 auto mode")[0]?.slug).toBe(
      "norcold-n4000-error-11-auto-source-unavailable",
    );
  });

  it("adds the official next support-router batch without code entries", () => {
    const expectedSources = new Map<string, string>([
      ["coleman-climate-control-accessories", "https://coleman-mach.com/products/climate-control-accessories/"],
      [
        "coleman-airspace-heat-element",
        "https://coleman-mach.com/products/climate-control-accessories/air-space-heating-element/",
      ],
      ["coleman-signature-series-product-family", "https://coleman-mach.com/products/air-conditioners/signature-series/"],
      ["maxxair-products-router", "https://www.maxxair.com/products/"],
      ["maxxair-fans-product-family", "https://www.maxxair.com/products/fans/"],
      ["maxxair-maxxshade-product", "https://www.maxxair.com/products/maxxshades/maxxshade/"],
      [
        "suburban-direct-fit-tank-water-heaters",
        "https://suburbanrv.com/water-heating/tank-water-heaters/direct-fit-replacement-water-heaters/",
      ],
      ["aquahot-675d-product-page", "https://www.aquahot.com/Products/RV/675D.aspx"],
      ["aquahot-600d-675d-use-care-guide", "https://www.aquahot.com/files/owners_manual/600D04-675D04_Owners.pdf"],
      ["thetford-aqua-magic-style-plus-support", "https://www.thetford.com/us/thetford-support/aqua-magic-style-plus/"],
      [
        "thetford-aqua-magic-v-hand-flush-support",
        "https://www.thetford.com/us/thetford-support/aqua-magic-v-hand-flush/",
      ],
      ["norcold-n410-n412-n510-n512-support", "https://www.thetford.com/us/thetford-support/n410-n412-n510-n512/"],
    ]);
    const expectedSymptomSourceIds = new Map<string, string[]>([
      ["coleman-climate-control-accessories-model-prep", ["coleman-climate-control-accessories"]],
      ["coleman-airspace-heat-element-service-prep", ["coleman-airspace-heat-element"]],
      ["coleman-signature-series-model-family-prep", ["coleman-signature-series-product-family"]],
      ["maxxair-products-family-routing-prep", ["maxxair-products-router"]],
      ["maxxair-fans-family-model-prep", ["maxxair-fans-product-family"]],
      ["maxxair-maxxshade-003900-003901-prep", ["maxxair-maxxshade-product"]],
      ["suburban-direct-fit-replacement-water-heater-prep", ["suburban-direct-fit-tank-water-heaters"]],
      ["aquahot-675d-model-service-routing", ["aquahot-675d-product-page"]],
      ["aquahot-600d-675d-reporter-winterization-prep", ["aquahot-600d-675d-use-care-guide"]],
      ["thetford-aqua-magic-style-plus-model-service-prep", ["thetford-aqua-magic-style-plus-support"]],
      ["thetford-aqua-magic-v-hand-flush-model-prep", ["thetford-aqua-magic-v-hand-flush-support"]],
      ["norcold-n410-n412-n510-n512-support-prep", ["norcold-n410-n412-n510-n512-support"]],
    ]);
    const expectedRequiredTerms = new Map<string, string[]>([
      ["coleman-climate-control-accessories-model-prep", ["colemanmach"]],
      ["coleman-airspace-heat-element-service-prep", ["airspace"]],
      ["coleman-signature-series-model-family-prep", ["signature", "colemanmach"]],
      ["maxxair-products-family-routing-prep", ["maxxairproducts"]],
      ["maxxair-fans-family-model-prep", ["maxxfan"]],
      ["maxxair-maxxshade-003900-003901-prep", ["maxxshade"]],
      ["suburban-direct-fit-replacement-water-heater-prep", ["directfit"]],
      ["aquahot-675d-model-service-routing", ["675d"]],
      ["aquahot-600d-675d-reporter-winterization-prep", ["600d", "675d"]],
      ["thetford-aqua-magic-style-plus-model-service-prep", ["styleplus"]],
      ["thetford-aqua-magic-v-hand-flush-model-prep", ["handflush", "aquamagicv"]],
      ["norcold-n410-n412-n510-n512-support-prep", ["n410", "n412", "n510", "n512"]],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const allNewSourceIds = ["norcold-n4000-touchscreen-owner-install", ...newSourceIds];
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\bline-voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\binternal\b|\broof\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|measure resistance|fuel nozzle|combustion|coolant pump|manual override|hydraulic work|hydraulic repair/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, sourceIds] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(sourceIds);
      expect(symptom?.searchRequiredTerms, symptomId).toEqual(expectedRequiredTerms.get(symptomId));
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
    }

    for (const symptomId of expectedSymptomSourceIds.keys()) {
      const symptom = symptomById.get(symptomId);
      for (const alias of symptom?.searchAliases ?? []) {
        expect(
          lookupSymptomGuides(index, alias)
            .slice(0, 4)
            .map((result) => result.slug),
          `${symptomId}: ${alias}`,
        ).toContain(symptom?.slug);
      }
    }

    expect(lookupSymptomGuides(index, "coleman mach climate accessories airspace filter soft start")[0]?.slug).toBe(
      "coleman-climate-control-accessories-model-prep",
    );
    expect(lookupSymptomGuides(index, "coleman airspace heat element 37203 38203")[0]?.slug).toBe(
      "coleman-airspace-heat-element-service-prep",
    );
    expect(lookupSymptomGuides(index, "coleman mach signature series mach 3 mach 8 mach 10 mach 15")[0]?.slug).toBe(
      "coleman-signature-series-model-family-prep",
    );
    expect(lookupSymptomGuides(index, "maxxair products fans covers maxxshades")[0]?.slug).toBe(
      "maxxair-products-family-routing-prep",
    );
    expect(lookupSymptomGuides(index, "maxxair maxxfan plus deluxe low profile pivot mini dome")[0]?.slug).toBe(
      "maxxair-fans-family-model-prep",
    );
    expect(lookupSymptomGuides(index, "maxxair maxxshade 00-03900 00-03901")[0]?.slug).toBe(
      "maxxair-maxxshade-003900-003901-prep",
    );
    expect(lookupSymptomGuides(index, "suburban direct fit replacement tank water heater")[0]?.slug).toBe(
      "suburban-direct-fit-replacement-water-heater-prep",
    );
    expect(lookupSymptomGuides(index, "aqua hot 675d diesel model service routing")[0]?.slug).toBe(
      "aquahot-675d-model-service-routing",
    );
    expect(lookupSymptomGuides(index, "aqua hot 600d 675d reporter diagnosis winterization")[0]?.slug).toBe(
      "aquahot-600d-675d-reporter-winterization-prep",
    );
    expect(lookupSymptomGuides(index, "aqua magic style plus soft close pedal parts")[0]?.slug).toBe(
      "thetford-aqua-magic-style-plus-model-service-prep",
    );
    expect(lookupSymptomGuides(index, "aqua magic v hand flush one handle parts")[0]?.slug).toBe(
      "thetford-aqua-magic-v-hand-flush-model-prep",
    );
    expect(lookupSymptomGuides(index, "norcold n410 n412 n510 n512 support")[0]?.slug).toBe(
      "norcold-n410-n412-n510-n512-support-prep",
    );
    expect(lookupSymptomGuides(index, "norcold n412 support")[0]?.slug).toBe(
      "norcold-n410-n412-n510-n512-support-prep",
    );
    expect(lookupSymptomGuides(index, "norcold n510 support")[0]?.slug).toBe(
      "norcold-n410-n412-n510-n512-support-prep",
    );

    const anchoredSlugs = new Set(expectedSymptomSourceIds.keys());
    for (const query of [
      "accessories",
      "products",
      "fans",
      "shade",
      "water heater",
      "aqua hot no hot water",
      "toilet parts",
      "norcold refrigerator not cooling",
      "model serial",
      "service support",
    ]) {
      expect(
        lookupSymptomGuides(index, query)
          .slice(0, 5)
          .map((symptom) => symptom.slug)
          .filter((slug) => anchoredSlugs.has(slug)),
        query,
      ).toEqual([]);
    }
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(allNewSourceIds));
  });

  it("adds official Dometic warranty, Suburban Advantage, and Norcold support-depth guides without code entries", () => {
    const expectedSources = new Map<string, string>([
      ["dometic-warranty-form", "https://www.dometic.com/en-us/support/warranty-form"],
      [
        "dometic-ac-heat-pump-limited-warranty-62298",
        "https://www.dometic.com/globalassets/1-outdoor/out-support/out-warranty-statements/air_conditioners_-_heat_pumps_limited_two-year_warranty-_-62298.pdf",
      ],
      [
        "dometic-furnaces-limited-warranty-62293",
        "https://www.dometic.com/globalassets/1-outdoor/out-support/out-warranty-statements/furnaces_limited_two-year_warranty-_-62293.pdf",
      ],
      [
        "dometic-refrigerators-limited-warranty-62300",
        "https://www.dometic.com/globalassets/1-outdoor/out-support/out-warranty-statements/dometic_refrigerators_limited_two-year_warranty-_-62300.pdf",
      ],
      [
        "dometic-water-heaters-limited-warranty-62323",
        "https://www.dometic.com/globalassets/1-outdoor/out-support/out-warranty-statements/water_heaters_limited_two-year_warranty-_-62323.pdf",
      ],
      ["suburban-advantage-tank-water-heaters", "https://suburbanrv.com/water-heating/tank-water-heaters/advantage-water-heaters/"],
      ["norcold-n400-n400-3-n402-3-support", "https://www.thetford.com/us/thetford-support/n400-n400-3-n402-3/"],
      ["norcold-n2152r-support", "https://www.thetford.com/us/thetford-support/n2152r/"],
    ]);
    const expectedSymptomSourceIds = new Map<string, string[]>([
      ["dometic-direct-purchase-warranty-claim-prep", ["dometic-warranty-form"]],
      ["dometic-ac-heat-pump-warranty-paperwork-prep", ["dometic-ac-heat-pump-limited-warranty-62298"]],
      ["dometic-furnace-warranty-paperwork-prep", ["dometic-furnaces-limited-warranty-62293"]],
      ["dometic-refrigerator-warranty-paperwork-prep", ["dometic-refrigerators-limited-warranty-62300"]],
      ["dometic-water-heater-warranty-paperwork-prep", ["dometic-water-heaters-limited-warranty-62323"]],
      ["suburban-advantage-tank-water-heater-model-prep", ["suburban-advantage-tank-water-heaters"]],
      ["norcold-n400-n402-support-manual-parts-prep", ["norcold-n400-n400-3-n402-3-support"]],
      ["norcold-n2152r-support-manual-parts-prep", ["norcold-n2152r-support"]],
    ]);
    const expectedRequiredTerms = new Map<string, string[]>([
      ["dometic-direct-purchase-warranty-claim-prep", ["dometicwarranty"]],
      ["dometic-ac-heat-pump-warranty-paperwork-prep", ["dometicwarranty"]],
      ["dometic-furnace-warranty-paperwork-prep", ["dometicwarranty"]],
      ["dometic-refrigerator-warranty-paperwork-prep", ["dometicwarranty"]],
      ["dometic-water-heater-warranty-paperwork-prep", ["dometicwarranty"]],
      ["suburban-advantage-tank-water-heater-model-prep", ["suburbanadvantage"]],
      ["norcold-n400-n402-support-manual-parts-prep", ["n400", "n402"]],
      ["norcold-n2152r-support-manual-parts-prep", ["n2152", "n2152r"]],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\b110\s*v\b|\bline-voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\binternal\b|\broof\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|measure resistance|fuel nozzle|combustion|coolant pump|manual override|hydraulic work|hydraulic repair/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, sourceIds] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(sourceIds);
      expect(symptom?.searchRequiredTerms, symptomId).toEqual(expectedRequiredTerms.get(symptomId));
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
    }

    expect(lookupSymptomGuides(index, "dometic warranty direct purchase claim form")[0]?.slug).toBe(
      "dometic-direct-purchase-warranty-claim-prep",
    );
    expect(lookupSymptomGuides(index, "dometic warranty ac heat pump limited two year paperwork")[0]?.slug).toBe(
      "dometic-ac-heat-pump-warranty-paperwork-prep",
    );
    expect(lookupSymptomGuides(index, "dometic warranty furnace limited two year paperwork")[0]?.slug).toBe(
      "dometic-furnace-warranty-paperwork-prep",
    );
    expect(lookupSymptomGuides(index, "dometic warranty refrigerator limited two year paperwork")[0]?.slug).toBe(
      "dometic-refrigerator-warranty-paperwork-prep",
    );
    expect(lookupSymptomGuides(index, "dometic warranty water heater limited two year paperwork")[0]?.slug).toBe(
      "dometic-water-heater-warranty-paperwork-prep",
    );
    expect(lookupSymptomGuides(index, "suburban advantage tank water heater porcelain anode warranty")[0]?.slug).toBe(
      "suburban-advantage-tank-water-heater-model-prep",
    );
    expect(lookupSymptomGuides(index, "norcold n400 n402 support owner manual parts list")[0]?.slug).toBe(
      "norcold-n400-n402-support-manual-parts-prep",
    );
    expect(lookupSymptomGuides(index, "norcold n2152r support owner manual parts list")[0]?.slug).toBe(
      "norcold-n2152r-support-manual-parts-prep",
    );

    const anchoredSlugs = new Set(expectedSymptomSourceIds.keys());
    for (const query of [
      "warranty",
      "claim",
      "warranty paperwork",
      "service support",
      "water heater",
      "norcold refrigerator not cooling",
      "refrigerator parts",
      "heat pump not working",
    ]) {
      expect(
        lookupSymptomGuides(index, query)
          .slice(0, 5)
          .map((symptom) => symptom.slug)
          .filter((slug) => anchoredSlugs.has(slug)),
        query,
      ).toEqual([]);
    }
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds official Coleman, MaxxAir, Dometic Ibis, and current Thetford warranty guides without code entries", () => {
    const expectedSources = new Map<string, string>([
      [
        "dometic-ibis-inspect-maintenance-support",
        "https://support.dometic.com/en/ibis-ac/How-to-Inspectperform-maintenance-890",
      ],
      ["coleman-mach-quiet-series-product-family", "https://coleman-mach.com/products/air-conditioners/quiet-series/"],
      ["coleman-mach-powersaver-series-product-family", "https://coleman-mach.com/products/air-conditioners/powersaver-series/"],
      ["coleman-mach-roughneck-series-product-family", "https://coleman-mach.com/products/air-conditioners/roughneck-series/"],
      ["maxxair-fanmate-product-family", "https://www.maxxair.com/products/covers/fanmate/"],
      ["maxxair-fanmate-955002-product", "https://www.maxxair.com/products/covers/fanmate-00-955002"],
      [
        "norcold-refrigeration-warranty-statement-641507b",
        "https://www.thetford.com/app/uploads/2025/05/641507B_NorcoldWarrantyStatement_Consumer.pdf",
      ],
      [
        "thetford-sanitation-warranty-statement-95395a",
        "https://www.thetford.com/app/uploads/2025/05/95395A_ThetfordWarrantyStatement_Consumer.pdf",
      ],
    ]);
    const expectedSymptomSourceIds = new Map<string, string[]>([
      ["dometic-ibis-ac-maintenance-inspection-prep", ["dometic-ibis-inspect-maintenance-support"]],
      ["coleman-quiet-series-model-family-prep", ["coleman-mach-quiet-series-product-family"]],
      ["coleman-powersaver-series-model-family-prep", ["coleman-mach-powersaver-series-product-family"]],
      ["coleman-roughneck-series-model-family-prep", ["coleman-mach-roughneck-series-product-family"]],
      ["maxxair-fanmate-cover-family-prep", ["maxxair-fanmate-product-family"]],
      ["maxxair-fanmate-955002-model-prep", ["maxxair-fanmate-955002-product"]],
      ["norcold-current-refrigeration-warranty-statement-prep", ["norcold-refrigeration-warranty-statement-641507b"]],
      ["thetford-current-sanitation-warranty-statement-prep", ["thetford-sanitation-warranty-statement-95395a"]],
    ]);
    const expectedRequiredTerms = new Map<string, string[]>([
      ["dometic-ibis-ac-maintenance-inspection-prep", ["ibismaintenance"]],
      ["coleman-quiet-series-model-family-prep", ["machquiet"]],
      ["coleman-powersaver-series-model-family-prep", ["machpowersaver", "machpower"]],
      ["coleman-roughneck-series-model-family-prep", ["machroughneck"]],
      ["maxxair-fanmate-cover-family-prep", ["maxxairfanmate"]],
      ["maxxair-fanmate-955002-model-prep", ["fanmate955002", "fanmate00", "00955002"]],
      ["norcold-current-refrigeration-warranty-statement-prep", ["norcoldwarranty"]],
      ["thetford-current-sanitation-warranty-statement-prep", ["thetfordwarranty"]],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\bcontrol board\b|\b120\s*vac\b|\b110\s*v\b|\bline-voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\binternal\b|\broof\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|measure resistance|fuel nozzle|combustion|coolant pump|manual override|hydraulic work|hydraulic repair/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, sourceIds] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(sourceIds);
      expect(symptom?.searchRequiredTerms, symptomId).toEqual(expectedRequiredTerms.get(symptomId));
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
    }

    const topSlugsFor = (query: string) => lookupSymptomGuides(index, query).slice(0, 5).map((symptom) => symptom.slug);

    expect(topSlugsFor("dometic ibis maintenance inspect return air filter")).toContain(
      "dometic-ibis-ac-maintenance-inspection-prep",
    );
    expect(topSlugsFor("coleman mach quiet series model family soft start")).toContain(
      "coleman-quiet-series-model-family-prep",
    );
    expect(topSlugsFor("coleman mach powersaver low profile model prep")).toContain(
      "coleman-powersaver-series-model-family-prep",
    );
    expect(topSlugsFor("coleman mach roughneck ac model family prep")).toContain(
      "coleman-roughneck-series-model-family-prep",
    );
    expect(topSlugsFor("maxxair fanmate cover model vent rain protection")).toContain(
      "maxxair-fanmate-cover-family-prep",
    );
    expect(topSlugsFor("maxxair fanmate 955002 smoke cover model prep")).toContain(
      "maxxair-fanmate-955002-model-prep",
    );
    expect(topSlugsFor("norcold warranty refrigeration consumer statement model serial")).toContain(
      "norcold-current-refrigeration-warranty-statement-prep",
    );
    expect(topSlugsFor("thetford warranty sanitation consumer statement toilet model")).toContain(
      "thetford-current-sanitation-warranty-statement-prep",
    );

    for (const [symptomId] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      for (const alias of symptom?.searchAliases ?? []) {
        expect(topSlugsFor(alias), `${symptomId}: ${alias}`).toContain(symptom?.slug);
      }
    }

    const anchoredSlugs = new Set(expectedSymptomSourceIds.keys());
    for (const query of [
      "maintenance",
      "filter",
      "quiet air conditioner",
      "power saver",
      "fan cover",
      "warranty",
      "toilet warranty",
      "norcold refrigerator not cooling",
    ]) {
      expect(
        lookupSymptomGuides(index, query)
          .slice(0, 5)
          .map((symptom) => symptom.slug)
          .filter((slug) => anchoredSlugs.has(slug)),
        query,
      ).toEqual([]);
    }
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds official Harrier, Thetford toilet, MaxxAir, Furrion/Girard, Suburban, and Onan support guides without code entries", () => {
    const expectedSources = new Map<string, string>([
      [
        "dometic-harrier-water-entry-support",
        "https://support.dometic.com/en/harrier-ac/Water-enters-the-vehicle-237a",
      ],
      [
        "dometic-harrier-inspect-maintenance-support",
        "https://support.dometic.com/en/harrier-ac/How-to-Inspectperform-maintenance-2e32",
      ],
      [
        "dometic-harrier-cleaning-support",
        "https://support.dometic.com/en/harrier-ac/How-to-Clean-the-roof-air-conditioner-28d3",
      ],
      ["thetford-bravura-support", "https://www.thetford.com/us/thetford-support/bravura/"],
      [
        "thetford-c224-cw-cassette-toilet-support",
        "https://www.thetford.com/us/thetford-support/c224-cw-cassette-toilet/",
      ],
      ["furrion-electric-fireplaces-product-category", "https://furrion.com/collections/electric-fireplaces/"],
      ["girard-cooking-support-index", "https://support.lci1.com/girard-cooking"],
      [
        "suburban-nt-park-model-furnaces-product",
        "https://suburbanrv.com/climate-control/furnaces/nt-park-model-furnaces/default.aspx",
      ],
      ["maxxair-service-locator", "https://www.maxxair.com/service-support/service-locator/"],
      ["maxxair-return-policy-support", "https://www.maxxair.com/service-support/return-policy/"],
      [
        "onan-rv-generator-warranty-statement-pdf",
        "https://www.cummins.com/sites/default/files/2018-08/PGBU-Warranty-Statement.pdf",
      ],
    ]);
    const expectedSymptomSourceIds = new Map<string, string[]>([
      ["dometic-harrier-water-entry-service-prep", ["dometic-harrier-water-entry-support"]],
      ["dometic-harrier-maintenance-inspection-prep", ["dometic-harrier-inspect-maintenance-support"]],
      ["dometic-harrier-cleaning-prep", ["dometic-harrier-cleaning-support"]],
      ["thetford-bravura-model-support-prep", ["thetford-bravura-support"]],
      ["thetford-c224-cw-cassette-model-support-prep", ["thetford-c224-cw-cassette-toilet-support"]],
      ["furrion-fireplace-current-product-family-prep", ["furrion-electric-fireplaces-product-category"]],
      ["girard-cooking-support-router-prep", ["girard-cooking-support-index"]],
      ["suburban-nt-park-model-furnace-prep", ["suburban-nt-park-model-furnaces-product"]],
      ["maxxair-authorized-service-locator-prep", ["maxxair-service-locator"]],
      ["maxxair-return-policy-routing-prep", ["maxxair-return-policy-support"]],
      ["onan-rv-generator-warranty-statement-prep", ["onan-rv-generator-warranty-statement-pdf"]],
    ]);
    const expectedRequiredTerms = new Map<string, string[]>([
      ["dometic-harrier-water-entry-service-prep", ["harrierwater"]],
      ["dometic-harrier-maintenance-inspection-prep", ["harriermaintenance", "harrierinspect"]],
      ["dometic-harrier-cleaning-prep", ["harriercleaning", "harrierroof"]],
      ["thetford-bravura-model-support-prep", ["bravura"]],
      ["thetford-c224-cw-cassette-model-support-prep", ["c224", "c224cw"]],
      ["furrion-fireplace-current-product-family-prep", ["furrionfireplace", "greystonefireplace"]],
      ["girard-cooking-support-router-prep", ["girardcooking"]],
      ["suburban-nt-park-model-furnace-prep", ["ntpark", "suburbannt"]],
      ["maxxair-authorized-service-locator-prep", ["maxxairservice", "maxxairlocator"]],
      ["maxxair-return-policy-routing-prep", ["maxxairreturn"]],
      ["onan-rv-generator-warranty-statement-prep", ["onanwarranty", "cumminswarranty"]],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\borifice\b|\bcontrol board\b|\b120\s*vac\b|\b110\s*v\b|\bline-voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\binternal\b|\broof\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|measure resistance|fuel nozzle|combustion|coolant pump|manual override|hydraulic work|hydraulic repair/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, sourceIds] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(sourceIds);
      expect(symptom?.searchRequiredTerms, symptomId).toEqual(expectedRequiredTerms.get(symptomId));
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
    }

    const topSlugsFor = (query: string) => lookupSymptomGuides(index, query).slice(0, 5).map((symptom) => symptom.slug);

    expect(topSlugsFor("dometic harrier water enters vehicle document leak")).toContain(
      "dometic-harrier-water-entry-service-prep",
    );
    expect(topSlugsFor("dometic harrier maintenance inspect filter service prep")).toContain(
      "dometic-harrier-maintenance-inspection-prep",
    );
    expect(topSlugsFor("dometic harrier cleaning roof air conditioner support")).toContain(
      "dometic-harrier-cleaning-prep",
    );
    expect(topSlugsFor("thetford bravura toilet model support prep")).toContain("thetford-bravura-model-support-prep");
    expect(topSlugsFor("thetford c224 cw cassette toilet support prep")).toContain(
      "thetford-c224-cw-cassette-model-support-prep",
    );
    expect(topSlugsFor("furrion fireplace current product family support")).toContain(
      "furrion-fireplace-current-product-family-prep",
    );
    expect(topSlugsFor("girard cooking support index range hood microwave model")).toContain(
      "girard-cooking-support-router-prep",
    );
    expect(topSlugsFor("suburban nt park model furnace family prep")).toContain(
      "suburban-nt-park-model-furnace-prep",
    );
    expect(topSlugsFor("maxxair service locator authorized dealer fan prep")).toContain(
      "maxxair-authorized-service-locator-prep",
    );
    expect(topSlugsFor("maxxair return policy consumer support routing")).toContain(
      "maxxair-return-policy-routing-prep",
    );
    expect(topSlugsFor("cummins onan warranty statement rv generator paperwork")).toContain(
      "onan-rv-generator-warranty-statement-prep",
    );

    for (const [symptomId] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      for (const alias of symptom?.searchAliases ?? []) {
        expect(topSlugsFor(alias), `${symptomId}: ${alias}`).toContain(symptom?.slug);
      }
    }

    const anchoredSlugs = new Set(expectedSymptomSourceIds.keys());
    for (const query of [
      "water enters vehicle",
      "maintenance inspection",
      "cleaning air conditioner",
      "toilet support",
      "cassette toilet",
      "electric fireplace",
      "cooking support",
      "park model furnace",
      "service locator",
      "return policy",
      "generator warranty",
    ]) {
      expect(
        lookupSymptomGuides(index, query)
          .slice(0, 5)
          .map((symptom) => symptom.slug)
          .filter((slug) => anchoredSlugs.has(slug)),
        query,
      ).toEqual([]);
    }
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds official Dometic, Furrion/Girard, Suburban, Thetford/Norcold, Coleman, MaxxAir, Aqua-Hot, and Onan support-router guides without code entries", () => {
    const expectedSources = new Map<string, string>([
      [
        "dometic-freshjet-inspect-maintenance-support",
        "https://support.dometic.com/en/freshjet-ac/How-to-Inspectperform-maintenance-dbee",
      ],
      ["dometic-acc3100-modes-support", "https://support.dometic.com/en/ACC3100/Which-modes-are-available-4dc9"],
      ["dometic-acc3100-cleaning-support", "https://support.dometic.com/en/ACC3100/How-to-clean-the-product-82f8"],
      [
        "dometic-rooftop-ac-category",
        "https://www.dometic.com/en-us/category/rv-and-van/rv-air-conditioners/rooftop-rv-air-conditioners",
      ],
      ["furrion-range-hoods-support-index", "https://support.lci1.com/range-hoods"],
      ["furrion-dishwashers-support-index", "https://support.lci1.com/dishwashers"],
      ["furrion-cooktops-support-index", "https://support.lci1.com/cooktops"],
      ["girard-appliances-support-index", "https://support.lci1.com/girards-appliances"],
      [
        "suburban-advantage-tankless-water-heater-product",
        "https://suburbanrv.com/water-heating/tankless-water-heaters/advantage-tankless-water-heater/",
      ],
      [
        "suburban-can-slide-out-kitchen-3250ast-product",
        "https://suburbanrv.com/kitchen-galley/can-galley-appliances/3250AST/",
      ],
      ["thetford-aqua-magic-vi-support", "https://www.thetford.com/us/thetford-support/aqua-magic-vi/"],
      [
        "thetford-aqua-magic-style-ii-support",
        "https://www.thetford.com/us/thetford-support/aqua-magic-style-ii/",
      ],
      ["norcold-n10dc-support", "https://www.thetford.com/us/thetford-support/n10dc/"],
      ["norcold-nr740-support", "https://www.thetford.com/us/thetford-support/nr740/"],
      [
        "coleman-mach-signature-mach-10-product",
        "https://coleman-mach.com/products/air-conditioners/signature-series-mach-10/",
      ],
      [
        "coleman-mach-signature-mach-15-product",
        "https://coleman-mach.com/products/air-conditioners/signature-series-mach-15/",
      ],
      ["maxxair-maxxfan-low-profile-product", "https://www.maxxair.com/products/fans/maxxfan-low-profile/"],
      ["maxxair-unimaxx-vent-lid-product", "https://www.maxxair.com/products/covers/unimaxx-vent-lid/"],
      ["aquahot-125d-product", "https://www.aquahot.com/Products/RV/125D.aspx"],
      ["aquahot-175m-product", "https://www.aquahot.com/products/rv/175m.aspx"],
      ["onan-ec-ags-compatibility-chart", "https://cssna-ec.cummins.com/pub/AGSCompatiblityChart.pdf"],
    ]);
    const expectedSymptomSourceIds = new Map<string, string[]>([
      ["dometic-freshjet-inspection-maintenance-model-tag-prep", ["dometic-freshjet-inspect-maintenance-support"]],
      ["dometic-acc3100-mode-control-prep", ["dometic-acc3100-modes-support"]],
      ["dometic-acc3100-cleaning-shutdown-prep", ["dometic-acc3100-cleaning-support"]],
      ["dometic-rooftop-ac-penguin-blizzard-model-routing", ["dometic-rooftop-ac-category"]],
      ["furrion-range-hood-model-manual-router-prep", ["furrion-range-hoods-support-index"]],
      ["furrion-dishwasher-model-manual-router-prep", ["furrion-dishwashers-support-index"]],
      ["furrion-cooktop-current-model-support-router", ["furrion-cooktops-support-index"]],
      ["girard-appliance-support-router-refrigerator-tankless-prep", ["girard-appliances-support-index"]],
      ["suburban-advantage-tankless-control-freeze-prep", ["suburban-advantage-tankless-water-heater-product"]],
      ["suburban-can-slide-out-kitchen-model-product-prep", ["suburban-can-slide-out-kitchen-3250ast-product"]],
      ["thetford-aqua-magic-vi-toilet-model-flush-winterizing-prep", ["thetford-aqua-magic-vi-support"]],
      ["thetford-aqua-magic-style-ii-cleaning-leak-model-prep", ["thetford-aqua-magic-style-ii-support"]],
      ["norcold-n10dc-model-control-service-routing-prep", ["norcold-n10dc-support", "norcold-n8dc-n10dc-parts-list-640138"]],
      ["norcold-nr740-discontinued-refrigerator-model-defrost-prep", ["norcold-nr740-support"]],
      ["coleman-mach-10-model-family-lookup-prep", ["coleman-mach-signature-mach-10-product"]],
      ["coleman-mach-15-model-family-load-prep", ["coleman-mach-signature-mach-15-product"]],
      ["maxxair-maxxfan-low-profile-model-control-prep", ["maxxair-maxxfan-low-profile-product"]],
      ["maxxair-unimaxx-vent-lid-identification-prep", ["maxxair-unimaxx-vent-lid-product"]],
      ["aquahot-125d-model-control-service-prep", ["aquahot-125d-product"]],
      ["aquahot-175m-model-support-routing-prep", ["aquahot-175m-product"]],
      ["onan-ec-ags-compatibility-model-prep", ["onan-ec-ags-compatibility-chart"]],
    ]);
    const expectedRequiredTerms = new Map<string, string[]>([
      [
        "dometic-freshjet-inspection-maintenance-model-tag-prep",
        ["freshjetinspection", "freshjetinspect", "freshjetmaintenance", "freshjetservice"],
      ],
      ["dometic-acc3100-mode-control-prep", ["acc3100modes", "acc3100control", "acc3100"]],
      ["dometic-acc3100-cleaning-shutdown-prep", ["acc3100cleaning", "acc3100"]],
      ["dometic-rooftop-ac-penguin-blizzard-model-routing", ["dometicrooftop", "penguinblizzard"]],
      ["furrion-range-hood-model-manual-router-prep", ["furrion+hood", "furrion+hoods"]],
      ["furrion-dishwasher-model-manual-router-prep", ["furriondishwasher", "furriondishwashers"]],
      ["furrion-cooktop-current-model-support-router", ["furrioncooktop", "furrioncooktops"]],
      [
        "girard-appliance-support-router-refrigerator-tankless-prep",
        ["girardappliance", "girardappliances", "girardrefrigerator"],
      ],
      [
        "suburban-advantage-tankless-control-freeze-prep",
        ["suburbanadvantage", "advantagetankless", "suburbantankless", "tanklessadvantage"],
      ],
      ["suburban-can-slide-out-kitchen-model-product-prep", ["3250ast", "slideoutkitchen", "suburbancan"]],
      ["thetford-aqua-magic-vi-toilet-model-flush-winterizing-prep", ["magicvi"]],
      ["thetford-aqua-magic-style-ii-cleaning-leak-model-prep", ["styleii"]],
      ["norcold-n10dc-model-control-service-routing-prep", ["n10dc", "n10dc+640138", "n10dc+parts+list"]],
      ["norcold-nr740-discontinued-refrigerator-model-defrost-prep", ["nr740"]],
      ["coleman-mach-10-model-family-lookup-prep", ["mach10"]],
      ["coleman-mach-15-model-family-load-prep", ["mach15"]],
      ["maxxair-maxxfan-low-profile-model-control-prep", ["maxxfan+low", "maxxair+low"]],
      ["maxxair-unimaxx-vent-lid-identification-prep", ["unimaxx"]],
      ["aquahot-125d-model-control-service-prep", ["aquahot125d", "125d"]],
      ["aquahot-175m-model-support-routing-prep", ["aquahot175m", "175m"]],
      ["onan-ec-ags-compatibility-model-prep", ["ecagscompatibility", "agscompatibility", "ecags", "onanec"]],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\borifice\b|\bcontrol board\b|\b120\s*vac\b|\b110\s*v\b|\bline-voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\binternal\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|measure resistance|fuel nozzle|combustion|coolant pump|manual override|hydraulic work|hydraulic repair/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, sourceIds] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(sourceIds);
      expect(symptom?.searchRequiredTerms, symptomId).toEqual(expectedRequiredTerms.get(symptomId));
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
    }

    const topSlugsFor = (query: string) => lookupSymptomGuides(index, query).slice(0, 5).map((symptom) => symptom.slug);

    expect(topSlugsFor("dometic freshjet inspection maintenance data label service prep")).toContain(
      "dometic-freshjet-inspection-maintenance-model-tag-prep",
    );
    expect(topSlugsFor("dometic acc3100 modes auto manual sleep vent control")).toContain(
      "dometic-acc3100-mode-control-prep",
    );
    expect(topSlugsFor("dometic acc3100 cleaning shutdown product support")).toContain(
      "dometic-acc3100-cleaning-shutdown-prep",
    );
    expect(topSlugsFor("dometic rooftop ac penguin blizzard model routing")).toContain(
      "dometic-rooftop-ac-penguin-blizzard-model-routing",
    );
    expect(topSlugsFor("furrion range hood support manuals model prep")).toContain(
      "furrion-range-hood-model-manual-router-prep",
    );
    expect(topSlugsFor("furrion dishwasher support manuals model prep")).toContain(
      "furrion-dishwasher-model-manual-router-prep",
    );
    expect(topSlugsFor("furrion cooktop current model support router")).toContain(
      "furrion-cooktop-current-model-support-router",
    );
    expect(topSlugsFor("girard appliance support refrigerator tankless prep")).toContain(
      "girard-appliance-support-router-refrigerator-tankless-prep",
    );
    expect(topSlugsFor("suburban advantage tankless control freeze prep")).toContain(
      "suburban-advantage-tankless-control-freeze-prep",
    );
    expect(topSlugsFor("suburban 3250ast can slide out kitchen model")).toContain(
      "suburban-can-slide-out-kitchen-model-product-prep",
    );
    expect(topSlugsFor("thetford aqua magic vi toilet flush winterizing prep")).toContain(
      "thetford-aqua-magic-vi-toilet-model-flush-winterizing-prep",
    );
    expect(topSlugsFor("thetford aqua magic style ii toilet cleaning leak model")).toContain(
      "thetford-aqua-magic-style-ii-cleaning-leak-model-prep",
    );
    expect(topSlugsFor("norcold n10dc model control service routing prep")).toContain(
      "norcold-n10dc-model-control-service-routing-prep",
    );
    expect(topSlugsFor("norcold nr740 discontinued refrigerator defrost prep")).toContain(
      "norcold-nr740-discontinued-refrigerator-model-defrost-prep",
    );
    expect(topSlugsFor("coleman mach 10 signature series model family lookup")).toContain(
      "coleman-mach-10-model-family-lookup-prep",
    );
    expect(topSlugsFor("coleman mach 15 signature series model load prep")).toContain(
      "coleman-mach-15-model-family-load-prep",
    );
    expect(topSlugsFor("maxxair maxxfan low profile model control prep")).toContain(
      "maxxair-maxxfan-low-profile-model-control-prep",
    );
    expect(topSlugsFor("maxxair unimaxx vent lid identification prep")).toContain(
      "maxxair-unimaxx-vent-lid-identification-prep",
    );
    expect(topSlugsFor("aqua hot 125d model control service prep")).toContain(
      "aquahot-125d-model-control-service-prep",
    );
    expect(topSlugsFor("aqua hot 175m modular model support routing")).toContain(
      "aquahot-175m-model-support-routing-prep",
    );
    expect(topSlugsFor("cummins onan ec ags compatibility chart model prep")).toContain(
      "onan-ec-ags-compatibility-model-prep",
    );

    for (const [symptomId] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      for (const alias of symptom?.searchAliases ?? []) {
        expect(topSlugsFor(alias), `${symptomId}: ${alias}`).toContain(symptom?.slug);
      }
    }

    const anchoredSlugs = new Set(expectedSymptomSourceIds.keys());
    for (const query of [
      "inspection maintenance",
      "cleaning shutdown",
      "mode control",
      "model routing",
      "range hood",
      "furrion range support",
      "furrion range model support",
      "dishwasher support",
      "cooktop support",
      "tankless control",
      "slide out",
      "toilet flush",
      "service routing",
      "signature series",
      "vent lid",
      "low profile",
      "compatibility chart",
    ]) {
      expect(
        lookupSymptomGuides(index, query)
          .slice(0, 5)
          .map((symptom) => symptom.slug)
          .filter((slug) => anchoredSlugs.has(slug)),
        query,
      ).toEqual([]);
    }
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds the next official ACC3100, Furrion/Lippert, Airxcel, Thetford/Norcold, and Onan support-prep guides without code entries", () => {
    const expectedSources = new Map<string, string>([
      ["dometic-acc3100-maintenance-filter-support", "https://support.dometic.com/en/ACC3100/How-to-maintain-the-product-cc9"],
      [
        "dometic-acc3100-climate-app-pairing-support",
        "https://support.dometic.com/en/ACC3100/How-to-pair-the-ventilation-system-and-the-Dometic-Climate-App-1220",
      ],
      [
        "dometic-acc3100-outside-air-filter-replacement-support",
        "https://support.dometic.com/en/ACC3100/How-to-replace-the-outside-air-filter-98b",
      ],
      ["dometic-acc3100-reset-ventilation-system-support", "https://support.dometic.com/en/ACC3100/How-to-reset-the-ventilation-system-fc38"],
      ["dometic-acc3100-inside-air-filter-blocked-support", "https://support.dometic.com/en/ACC3100/The-inside-air-filter-is-blocked-48b6"],
      ["dometic-acc3100-outside-air-filter-blocked-support", "https://support.dometic.com/en/ACC3100/The-outside-air-filter-is-blocked-30d9"],
      ["dometic-acc3100-display-not-responding-support", "https://support.dometic.com/en/ACC3100/The-display-does-not-respond-b174"],
      ["dometic-acc3100-display-error-code-router", "https://support.dometic.com/en/ACC3100/The-display-shows-an-error-code-fad7"],
      ["furrion-brand-support-router", "https://support.lci1.com/furrion/"],
      ["furrion-appliances-support-router", "https://support.lci1.com/furrion-appliances/"],
      ["furrion-comfort-support-router", "https://support.lci1.com/comfort/"],
      ["furrion-cooking-support-router", "https://support.lci1.com/cooking/"],
      ["furrion-energy-support-router", "https://support.lci1.com/furrion-energy/"],
      ["furrion-off-grid-energy-support-index", "https://support.lci1.com/off-grid-energy"],
      ["furrion-power-distribution-support-router", "https://support.lci1.com/power-distribution/"],
      ["lippert-greystone-support-router", "https://support.lci1.com/greystone/"],
      ["coleman-mach-signature-mach-3-plus-product", "https://coleman-mach.com/products/air-conditioners/signature-series-mach-3-plus/"],
      ["coleman-mach-signature-mach-8-plus-product", "https://coleman-mach.com/products/air-conditioners/signature-series-mach-8-plus/"],
      ["coleman-mach-quiet-series-mach-3-product", "https://coleman-mach.com/products/air-conditioners/quiet-series-mach-3/"],
      ["maxxair-maxxfan-plus-product-family", "https://www.maxxair.com/Products/fans/maxxfan/"],
      ["maxxair-maxxfan-dome-product-family", "https://www.maxxair.com/products/fans/maxxfan-dome/"],
      ["suburban-air-fryers-product-family", "https://suburbanrv.com/kitchen-galley/air-fryers/"],
      [
        "suburban-propane-your-rv-safety-brochure",
        "https://suburbanrv.com/files/product_documents/LP%20Gas%20Accessories/Propane-YourRV-brochure-Smaller.pdf",
      ],
      ["aquahot-125-dn1-use-care-guide", "https://library.aquahot.com/wp-content/uploads/2022/04/AHE-125-DN1-Use-and-Care-Guide.pdf"],
      ["norcold-dc105-support", "https://www.thetford.com/us/thetford-support/dc105/"],
      [
        "norcold-dc105-owner-install-641476",
        "https://www.thetford.com/app/uploads/2024/09/641476_DC105-InstallationOwners-Manual_RevA.pdf",
      ],
      ["thetford-aqua-magic-galaxy-starlite-support", "https://www.thetford.com/us/thetford-support/aqua-magic-galaxy-starlite/"],
      [
        "thetford-tecma-silence-plus-2g-soft-close-support",
        "https://www.thetford.com/us/thetford-support/tecma-silence-plus-2g-soft-close/",
      ],
      ["onan-qg-2500-lp-kv-0981-0129", "https://www.cummins.com/sites/default/files/rv-manuals/0981-0129.pdf"],
      ["onan-qg-2800-kvc-0981-0158", "https://www.cummins.com/sites/default/files/rv-manuals/0981-0158.pdf"],
    ]);
    const expectedSymptomSourceIds = new Map<string, string[]>([
      ["dometic-acc3100-maintenance-filter-service-prep", ["dometic-acc3100-maintenance-filter-support"]],
      ["dometic-acc3100-climate-app-pairing-prep", ["dometic-acc3100-climate-app-pairing-support"]],
      ["dometic-acc3100-outside-filter-service-boundary", ["dometic-acc3100-outside-air-filter-replacement-support"]],
      ["dometic-acc3100-reset-service-prep", ["dometic-acc3100-reset-ventilation-system-support"]],
      ["dometic-acc3100-inside-filter-blocked-authorized-service", ["dometic-acc3100-inside-air-filter-blocked-support"]],
      ["dometic-acc3100-outside-filter-blocked-prep", ["dometic-acc3100-outside-air-filter-blocked-support"]],
      ["dometic-acc3100-display-not-responding-reset-prep", ["dometic-acc3100-display-not-responding-support"]],
      ["dometic-acc3100-display-error-indicator-prep", ["dometic-acc3100-display-error-code-router"]],
      ["furrion-brand-product-family-support-routing-prep", ["furrion-brand-support-router"]],
      ["furrion-appliances-dishwasher-washing-machine-router-prep", ["furrion-appliances-support-router"]],
      ["furrion-comfort-ac-water-heater-fireplace-thermostat-router", ["furrion-comfort-support-router"]],
      ["furrion-cooking-category-router-prep", ["furrion-cooking-support-router"]],
      ["furrion-energy-power-solar-router-prep", ["furrion-energy-support-router"]],
      ["furrion-off-grid-energy-model-manual-prep", ["furrion-off-grid-energy-support-index"]],
      ["furrion-power-distribution-cordset-converter-router", ["furrion-power-distribution-support-router"]],
      ["greystone-appliance-family-router-prep", ["lippert-greystone-support-router"]],
      ["coleman-mach-3-plus-model-service-prep", ["coleman-mach-signature-mach-3-plus-product"]],
      ["coleman-mach-8-plus-low-profile-service-prep", ["coleman-mach-signature-mach-8-plus-product"]],
      ["coleman-quiet-mach-3-ducted-nonducted-prep", ["coleman-mach-quiet-series-mach-3-product"]],
      ["maxxair-maxxfan-plus-model-control-prep", ["maxxair-maxxfan-plus-product-family"]],
      ["maxxair-maxxfan-dome-bath-sidewall-prep", ["maxxair-maxxfan-dome-product-family"]],
      ["suburban-air-fryer-model-power-gas-prep", ["suburban-air-fryers-product-family"]],
      ["suburban-lp-gas-safety-shutdown-prep", ["suburban-propane-your-rv-safety-brochure"]],
      ["aquahot-125-dn1-lcd-voltage-fluid-prep", ["aquahot-125-dn1-use-care-guide"]],
      ["norcold-dc105-model-cooling-service-prep", ["norcold-dc105-support"]],
      ["norcold-dc105-low-voltage-defrost-door-prep", ["norcold-dc105-owner-install-641476"]],
      ["thetford-aqua-magic-galaxy-starlite-model-service-prep", ["thetford-aqua-magic-galaxy-starlite-support"]],
      ["thetford-tecma-silence-plus-2g-controller-macerator-service-prep", ["thetford-tecma-silence-plus-2g-soft-close-support"]],
      ["onan-qg-2500-lp-kv-model-spec-service-prep", ["onan-qg-2500-lp-kv-0981-0129"]],
      ["onan-qg-2800-kvc-model-spec-service-prep", ["onan-qg-2800-kvc-0981-0158"]],
    ]);
    const expectedRequiredTerms = new Map<string, string[]>([
      ["dometic-acc3100-maintenance-filter-service-prep", ["acc3100+maintenance", "acc3100+filter"]],
      ["dometic-acc3100-climate-app-pairing-prep", ["acc3100+pairing", "acc3100+app", "acc3100+bluetooth"]],
      [
        "dometic-acc3100-outside-filter-service-boundary",
        ["acc3100+outside+filter+service", "acc3100+outside+replacement", "acc3100+replace+outside"],
      ],
      ["dometic-acc3100-reset-service-prep", ["acc3100+reset"]],
      ["dometic-acc3100-inside-filter-blocked-authorized-service", ["acc3100+inside", "acc3100+blocked"]],
      ["dometic-acc3100-outside-filter-blocked-prep", ["acc3100+outside+blocked"]],
      ["dometic-acc3100-display-not-responding-reset-prep", ["acc3100+display"]],
      ["dometic-acc3100-display-error-indicator-prep", ["acc3100+error"]],
      ["furrion-brand-product-family-support-routing-prep", ["furrion+support"]],
      ["furrion-appliances-dishwasher-washing-machine-router-prep", ["furrion+appliances"]],
      ["furrion-comfort-ac-water-heater-fireplace-thermostat-router", ["furrion+comfort"]],
      ["furrion-cooking-category-router-prep", ["furrion+cooking"]],
      ["furrion-energy-power-solar-router-prep", ["furrion+energy+power"]],
      ["furrion-off-grid-energy-model-manual-prep", ["furrion+offgrid", "furrion+solar"]],
      ["furrion-power-distribution-cordset-converter-router", ["furrion+powerdistribution"]],
      ["greystone-appliance-family-router-prep", ["greystone+support", "greystone+lippert"]],
      ["coleman-mach-3-plus-model-service-prep", ["coleman+mach3", "mach3plus", "38203"]],
      ["coleman-mach-8-plus-low-profile-service-prep", ["coleman+mach8", "mach8plus", "37203"]],
      ["coleman-quiet-mach-3-ducted-nonducted-prep", ["quiet+mach3", "382030660"]],
      ["maxxair-maxxfan-plus-model-control-prep", ["maxxfan+plus+model", "0004500k", "00a04301k"]],
      ["maxxair-maxxfan-dome-bath-sidewall-prep", ["maxxfan+dome", "maxxair+dome"]],
      ["suburban-air-fryer-model-power-gas-prep", ["suburban+airfryer", "3907a", "3910a"]],
      ["suburban-lp-gas-safety-shutdown-prep", ["suburban+propane", "propane+rv"]],
      ["aquahot-125-dn1-lcd-voltage-fluid-prep", ["125dn1", "aquahot+125dn1"]],
      ["norcold-dc105-model-cooling-service-prep", ["dc105"]],
      ["norcold-dc105-low-voltage-defrost-door-prep", ["dc105+641476", "641476"]],
      ["thetford-aqua-magic-galaxy-starlite-model-service-prep", ["galaxy+starlite"]],
      ["thetford-tecma-silence-plus-2g-controller-macerator-service-prep", ["tecma+2g", "silence+2g"]],
      ["onan-qg-2500-lp-kv-model-spec-service-prep", ["2500+kv", "09810129"]],
      ["onan-qg-2800-kvc-model-spec-service-prep", ["kvc", "09810158"]],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\borifice\b|\bcontrol board\b|\b120\s*vac\b|\b110\s*v\b|\bline-voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\binternal\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|measure resistance|fuel nozzle|combustion|coolant pump|manual override|hydraulic work|hydraulic repair/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, sourceIds] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(sourceIds);
      expect(symptom?.searchRequiredTerms, symptomId).toEqual(expectedRequiredTerms.get(symptomId));
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
    }

    const topSlugsFor = (query: string) => lookupSymptomGuides(index, query).slice(0, 5).map((symptom) => symptom.slug);

    for (const [query, slug] of [
      ["dometic acc3100 maintenance air filter blocked", "dometic-acc3100-maintenance-filter-service-prep"],
      ["dometic acc3100 climate app pairing bluetooth", "dometic-acc3100-climate-app-pairing-prep"],
      ["dometic acc3100 outside air filter service prep", "dometic-acc3100-outside-filter-service-boundary"],
      ["dometic acc3100 reset ventilation system", "dometic-acc3100-reset-service-prep"],
      ["dometic acc3100 inside filter blocked authorized service", "dometic-acc3100-inside-filter-blocked-authorized-service"],
      ["dometic acc3100 outside filter blocked prep", "dometic-acc3100-outside-filter-blocked-prep"],
      ["dometic acc3100 display does not respond reset", "dometic-acc3100-display-not-responding-reset-prep"],
      ["dometic acc3100 display shows error code indicator", "dometic-acc3100-display-error-indicator-prep"],
      ["furrion support router rv appliance product family", "furrion-brand-product-family-support-routing-prep"],
      ["furrion appliances dishwasher washing machine support", "furrion-appliances-dishwasher-washing-machine-router-prep"],
      ["furrion comfort ac water heater fireplace thermostat support", "furrion-comfort-ac-water-heater-fireplace-thermostat-router"],
      ["furrion cooking range oven microwave support", "furrion-cooking-category-router-prep"],
      ["furrion energy power solar router", "furrion-energy-power-solar-router-prep"],
      ["furrion off grid energy solar controller support", "furrion-off-grid-energy-model-manual-prep"],
      ["furrion power distribution cordset converter support", "furrion-power-distribution-cordset-converter-router"],
      ["greystone support lippert rv appliance router", "greystone-appliance-family-router-prep"],
      ["coleman mach 3 plus 38203 model service prep", "coleman-mach-3-plus-model-service-prep"],
      ["coleman mach 8 plus 37203 low profile service prep", "coleman-mach-8-plus-low-profile-service-prep"],
      ["coleman quiet series mach 3 ducted nonducted prep", "coleman-quiet-mach-3-ducted-nonducted-prep"],
      ["maxxair maxxfan plus 00 04500k model control prep", "maxxair-maxxfan-plus-model-control-prep"],
      ["maxxair maxxfan dome bathroom sidewall prep", "maxxair-maxxfan-dome-bath-sidewall-prep"],
      ["suburban air fryer 3907a model power prep", "suburban-air-fryer-model-power-gas-prep"],
      ["suburban propane your rv lp gas safety shutdown", "suburban-lp-gas-safety-shutdown-prep"],
      ["aqua hot 125 dn1 lcd voltage fluid prep", "aquahot-125-dn1-lcd-voltage-fluid-prep"],
      ["norcold dc105 support not cooling service prep", "norcold-dc105-model-cooling-service-prep"],
      ["norcold dc105 641476 manual low voltage defrost door", "norcold-dc105-low-voltage-defrost-door-prep"],
      ["thetford aqua magic galaxy starlite discontinued model", "thetford-aqua-magic-galaxy-starlite-model-service-prep"],
      ["thetford tecma silence plus 2g controller macerator", "thetford-tecma-silence-plus-2g-controller-macerator-service-prep"],
      ["onan qg 2500 lp kv 0981 0129 spec service prep", "onan-qg-2500-lp-kv-model-spec-service-prep"],
      ["onan qg 2800 kvc 0981 0158 spec service prep", "onan-qg-2800-kvc-model-spec-service-prep"],
    ] as const) {
      expect(topSlugsFor(query), query).toContain(slug);
    }

    for (const [symptomId] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      for (const alias of symptom?.searchAliases ?? []) {
        expect(topSlugsFor(alias)[0], `${symptomId}: ${alias}`).toBe(symptom?.slug);
      }
    }

    const anchoredSlugs = new Set(expectedSymptomSourceIds.keys());
    for (const query of [
      "maintenance filter",
      "climate app",
      "outside filter",
      "reset ventilation",
      "inside filter blocked",
      "display not responding",
      "error code",
      "support router",
      "comfort support",
      "cooking support",
      "energy support",
      "power distribution",
      "appliance router",
      "mach 3",
      "mach 8",
      "maxxfan plus",
      "dome fan",
      "air fryer",
      "propane safety",
      "low voltage",
      "not cooling",
      "model service prep",
    ]) {
      expect(
        lookupSymptomGuides(index, query)
          .slice(0, 5)
          .map((symptom) => symptom.slug)
          .filter((slug) => anchoredSlugs.has(slug)),
        query,
      ).toEqual([]);
    }
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds official control, model-label, storage, warranty, and parts-prep guides without code entries", () => {
    const expectedSources = new Map<string, string>([
      [
        "dometic-ccc2-system-reset-support",
        "https://support.dometic.com/en/brisk-ac/How-to-reset-the-system-COMFORT-CONTROL-CENTER-2-THERMOSTAT-10e5",
      ],
      [
        "dometic-brisk-controls-data-tag-support",
        "https://support.dometic.com/en/brisk-ac/How-to-operate-the-controls-of-the-airconditioner-7a86",
      ],
      [
        "dometic-fantastic-vent-7350-operating-manual",
        "https://media.dometic.com/externalassets/dometic-fantastic-vent-7350_78799.pdf",
      ],
      [
        "dometic-500-series-gravity-flush-toilet-manual",
        "https://media.dometic.com/externalassets/dometic-510-rv-toilet_9108552866_64829.pdf",
      ],
      [
        "dometic-fantastic-vent-3350-product",
        "https://www.dometic.com/en-us/product/dometic-3350-fan-tastic-vent-roof-fan-9108870059?v=9108870059",
      ],
      ["thetford-aqua-magic-v-pedal-flush-support", "https://www.thetford.com/us/thetford-support/aqua-magic-v-pedal-flush/"],
      ["thetford-aqua-magic-iv-pedal-flush-support", "https://www.thetford.com/us/thetford-support/aqua-magic-iv-pedal-flush/"],
      ["thetford-aria-classic-support", "https://www.thetford.com/us/thetford-support/aria-classic/"],
      ["thetford-aria-deluxe-support", "https://www.thetford.com/us/thetford-support/aria-deluxe/"],
      ["norcold-n4150-support", "https://www.thetford.com/us/thetford-support/n4150/"],
      ["norcold-n2175-support", "https://www.thetford.com/us/thetford-support/n2175/"],
      ["coleman-digital-thermostats-product", "https://coleman-mach.com/products/thermostats/digital-thermostats/"],
      ["coleman-mini-mach-operation-guide", "https://library.coleman-mach.com/wp-content/uploads/2023/04/1971-975.pdf"],
      [
        "maxxair-1-switch-wall-control-guide",
        "https://library.maxxair.com/wp-content/uploads/2023/03/maxxfan-1-switch-control-installation-and-operation-guide.pdf",
      ],
      [
        "maxxair-2-switch-wall-control-guide",
        "https://library.maxxair.com/wp-content/uploads/2023/03/maxxfan-2-switch-control-installation-and-operation-guide.pdf",
      ],
      ["suburban-sf-q-furnaces-product", "https://suburbanrv.com/climate-control/furnaces/sf-q-series-furnaces/default.aspx"],
      [
        "suburban-induction-cooktops-product",
        "https://suburbanrv.com/kitchen-galley/cooktops/induction-cooktops/default.aspx",
      ],
      ["aquahot-edge-tankless-product", "https://www.aquahot.com/Products/RV/edge-tankless-water-heater.aspx"],
      ["aquahot-250d-product-page", "https://www.aquahot.com/Products/RV/250D.aspx"],
      ["aquahot-400d-product-page", "https://www.aquahot.com/Products/RV/400D.aspx"],
      ["furrion-fcr06-storage-qr188", "https://support.lci1.com/documents/ccd-0008581"],
      ["furrion-fcr20-storage-qr189", "https://support.lci1.com/documents/ccd-0008582"],
      ["furrion-refrigerator-warranty-request-w017", "https://support.lci1.com/documents/ccd-0008248"],
      ["furrion-single-zone-controller-quick-start-ccd0006086", "https://support.lci1.com/documents/ccd-0006086"],
      [
        "furrion-enhanced-multizone-app-thermostat-ig-fcm00037",
        "https://support.lci1.com/documents/furrion-enhanced-mulitzone-app-controlled-wall-thermostat-ig-fcm00037-v1.0",
      ],
      [
        "cummins-shop-generator-info-faqs",
        "https://shop.cummins.com/SC/knowledge-hub/d-us/generators-parts-and-accessories-information-and-faqs-MCACA54ZJLHJAFRP7RPXMKSUT6CM",
      ],
      [
        "cummins-onan-hgjab-lp-maintenance-kit-a049e506",
        "https://shop.cummins.com/SC/product/cummins-onan-hgjablp-rv-generator-maintenance-kit-a049e506/01t4N0000048nUxQAI",
      ],
    ]);
    const expectedSymptomSourceIds = new Map<string, string[]>([
      ["dometic-ccc2-system-reset-zone-init-prep", ["dometic-ccc2-system-reset-support"]],
      ["dometic-brisk-ac-controls-data-tag-prep", ["dometic-brisk-controls-data-tag-support"]],
      ["dometic-fantastic-vent-7350-remote-rain-sensor-prep", ["dometic-fantastic-vent-7350-operating-manual"]],
      ["dometic-500-series-toilet-cleaning-winterizing-prep", ["dometic-500-series-gravity-flush-toilet-manual"]],
      ["dometic-fantastic-vent-3350-rain-sensor-control-prep", ["dometic-fantastic-vent-3350-product"]],
      ["thetford-aqua-magic-v-pedal-flush-model-storage-prep", ["thetford-aqua-magic-v-pedal-flush-support"]],
      [
        "thetford-aqua-magic-iv-pedal-flush-discontinued-support-prep",
        ["thetford-aqua-magic-iv-pedal-flush-support"],
      ],
      ["thetford-aria-classic-model-control-service-prep", ["thetford-aria-classic-support"]],
      ["thetford-aria-deluxe-control-service-mode-prep", ["thetford-aria-deluxe-support"]],
      ["norcold-n4150-model-hts-cooling-service-prep", ["norcold-n4150-support"]],
      ["norcold-n2175-dc-fridge-night-mode-door-alarm-prep", ["norcold-n2175-support"]],
      ["coleman-digital-thermostat-model-prep", ["coleman-digital-thermostats-product"]],
      ["coleman-mini-mach-cooling-performance-prep", ["coleman-mini-mach-operation-guide"]],
      ["maxxair-one-switch-wall-control-behavior", ["maxxair-1-switch-wall-control-guide"]],
      ["maxxair-two-switch-wall-control-behavior", ["maxxair-2-switch-wall-control-guide"]],
      ["suburban-sf-q-furnace-model-prep", ["suburban-sf-q-furnaces-product"]],
      ["suburban-induction-cooktop-pan-compatibility", ["suburban-induction-cooktops-product"]],
      ["aquahot-edge-tankless-control-prep", ["aquahot-edge-tankless-product"]],
      ["aquahot-250d-model-prep", ["aquahot-250d-product-page"]],
      ["aquahot-400d-dual-fuel-prep", ["aquahot-400d-product-page"]],
      ["furrion-fcr06dcgba-storage-reset-prep", ["furrion-fcr06-storage-qr188"]],
      ["furrion-fcr20dcafa-storage-reset-prep", ["furrion-fcr20-storage-qr189", "furrion-fcr20dcafa-storage-reset-video"]],
      ["furrion-refrigerator-warranty-request-prep", ["furrion-refrigerator-warranty-request-w017"]],
      ["furrion-ac-single-zone-controller-mode-prep", ["furrion-single-zone-controller-quick-start-ccd0006086"]],
      ["furrion-enhanced-multizone-app-control-prep", ["furrion-enhanced-multizone-app-thermostat-ig-fcm00037"]],
      ["onan-generator-serial-number-parts-lookup-prep", ["cummins-shop-generator-info-faqs"]],
      ["onan-hgjab-lp-maintenance-kit-service-prep", ["cummins-onan-hgjab-lp-maintenance-kit-a049e506"]],
    ]);
    const expectedRequiredTerms = new Map<string, string[]>([
      ["dometic-ccc2-system-reset-zone-init-prep", ["dometic+ccc2+reset", "ccc2+system+reset"]],
      ["dometic-brisk-ac-controls-data-tag-prep", ["dometic+brisk+controls", "brisk+data+tag"]],
      ["dometic-fantastic-vent-7350-remote-rain-sensor-prep", ["fantastic+7350", "7350+remote"]],
      ["dometic-500-series-toilet-cleaning-winterizing-prep", ["dometic+500+toilet", "510+rv+toilet"]],
      ["dometic-fantastic-vent-3350-rain-sensor-control-prep", ["fantastic+3350", "dometic+3350"]],
      ["thetford-aqua-magic-v-pedal-flush-model-storage-prep", ["aqua+magic+v+pedal", "aquamagic+v+pedal"]],
      ["thetford-aqua-magic-iv-pedal-flush-discontinued-support-prep", ["aqua+magic+iv+pedal", "aquamagic+iv+pedal"]],
      ["thetford-aria-classic-model-control-service-prep", ["aria+classic", "thetford+aria+classic"]],
      ["thetford-aria-deluxe-control-service-mode-prep", ["aria+deluxe", "thetford+aria+deluxe"]],
      ["norcold-n4150-model-hts-cooling-service-prep", ["n4150", "norcold+n4150"]],
      ["norcold-n2175-dc-fridge-night-mode-door-alarm-prep", ["n2175", "norcold+n2175"]],
      ["coleman-digital-thermostat-model-prep", ["coleman+digital+thermostat"]],
      ["coleman-mini-mach-cooling-performance-prep", ["mini+mach", "6727"]],
      ["maxxair-one-switch-wall-control-behavior", ["maxxfan+1+switch", "maxxair+1+switch"]],
      ["maxxair-two-switch-wall-control-behavior", ["maxxfan+2+switch", "02000k"]],
      ["suburban-sf-q-furnace-model-prep", ["suburban+sfq", "sfq+furnace"]],
      ["suburban-induction-cooktop-pan-compatibility", ["suburban+induction", "elite+induction"]],
      ["aquahot-edge-tankless-control-prep", ["aquahot+edge+tankless", "edge+tankless"]],
      ["aquahot-250d-model-prep", ["aquahot+250d", "250d"]],
      ["aquahot-400d-dual-fuel-prep", ["aquahot+400d", "400d"]],
      ["furrion-fcr06dcgba-storage-reset-prep", ["fcr06dcgba", "qr188"]],
      ["furrion-fcr20dcafa-storage-reset-prep", ["fcr20dcafa", "qr189", "fcr20dcafa+storage", "fcr20dcafa+reset"]],
      ["furrion-refrigerator-warranty-request-prep", ["w017", "furrion+refrigerator+warranty"]],
      ["furrion-ac-single-zone-controller-mode-prep", ["fac+c10sa", "fac+c10essa", "furrion+single+zone+controller"]],
      ["furrion-enhanced-multizone-app-control-prep", ["igfcm00037", "enhanced+multizone"]],
      ["onan-generator-serial-number-parts-lookup-prep", ["onan+serial+number", "generator+parts+lookup"]],
      ["onan-hgjab-lp-maintenance-kit-service-prep", ["hgjab+lp", "a049e506"]],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\borifice\b|\bcontrol board\b|\b120\s*vac\b|\b110\s*v\b|\bline-voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\binternal\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|measure resistance|fuel nozzle|combustion|coolant pump|manual override|hydraulic work|hydraulic repair/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, sourceIds] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(sourceIds);
      expect(symptom?.searchRequiredTerms, symptomId).toEqual(expectedRequiredTerms.get(symptomId));
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
    }

    const topSlugsFor = (query: string) => lookupSymptomGuides(index, query).slice(0, 5).map((symptom) => symptom.slug);

    for (const [query, slug] of [
      ["dometic ccc2 reset system zone initialization prep", "dometic-ccc2-system-reset-zone-init-prep"],
      ["dometic brisk controls data tag filter grille model", "dometic-brisk-ac-controls-data-tag-prep"],
      ["dometic fantastic vent 7350 remote rain sensor prep", "dometic-fantastic-vent-7350-remote-rain-sensor-prep"],
      ["dometic 500 series 510 rv toilet cleaning winterizing", "dometic-500-series-toilet-cleaning-winterizing-prep"],
      ["dometic fantastic vent 3350 rain sensor control prep", "dometic-fantastic-vent-3350-rain-sensor-control-prep"],
      ["thetford aqua magic v pedal flush model storage prep", "thetford-aqua-magic-v-pedal-flush-model-storage-prep"],
      ["thetford aqua magic iv pedal flush discontinued support", "thetford-aqua-magic-iv-pedal-flush-discontinued-support-prep"],
      ["thetford aria classic model control service prep", "thetford-aria-classic-model-control-service-prep"],
      ["thetford aria deluxe control service mode prep", "thetford-aria-deluxe-control-service-mode-prep"],
      ["norcold n4150 hts cooling service prep", "norcold-n4150-model-hts-cooling-service-prep"],
      ["norcold n2175 dc fridge night mode door alarm prep", "norcold-n2175-dc-fridge-night-mode-door-alarm-prep"],
      ["coleman digital thermostat model part number prep", "coleman-digital-thermostat-model-prep"],
      ["coleman mini mach 6727 cooling performance prep", "coleman-mini-mach-cooling-performance-prep"],
      ["maxxair maxxfan 1 switch wall control behavior", "maxxair-one-switch-wall-control-behavior"],
      ["maxxair maxxfan 2 switch wall control 02000k behavior", "maxxair-two-switch-wall-control-behavior"],
      ["suburban sf q furnace model prep", "suburban-sf-q-furnace-model-prep"],
      ["suburban elite induction cooktop pan compatibility", "suburban-induction-cooktop-pan-compatibility"],
      ["aqua hot edge tankless wall controller prep", "aquahot-edge-tankless-control-prep"],
      ["aqua hot 250d model diesel electric prep", "aquahot-250d-model-prep"],
      ["aqua hot 400d dual fuel model prep", "aquahot-400d-dual-fuel-prep"],
      ["furrion fcr06dcgba qr188 storage reset prep", "furrion-fcr06dcgba-storage-reset-prep"],
      ["furrion fcr20dcafa qr189 storage reset prep", "furrion-fcr20dcafa-storage-reset-prep"],
      ["furrion refrigerator warranty request w017 prep", "furrion-refrigerator-warranty-request-prep"],
      ["furrion fac c10sa single zone controller mode prep", "furrion-ac-single-zone-controller-mode-prep"],
      ["furrion enhanced multizone ig fcm00037 app control prep", "furrion-enhanced-multizone-app-control-prep"],
      ["onan generator serial number parts lookup prep", "onan-generator-serial-number-parts-lookup-prep"],
      ["onan hgjab lp maintenance kit a049e506 service prep", "onan-hgjab-lp-maintenance-kit-service-prep"],
    ] as const) {
      expect(topSlugsFor(query), query).toContain(slug);
      expect(topSlugsFor(query)[0], query).toBe(slug);
    }

    for (const [symptomId] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      for (const alias of symptom?.searchAliases ?? []) {
        expect(topSlugsFor(alias)[0], `${symptomId}: ${alias}`).toBe(symptom?.slug);
      }
    }

    const anchoredSlugs = new Set(expectedSymptomSourceIds.keys());
    for (const query of [
      "thermostat reset",
      "air conditioner controls",
      "remote rain sensor",
      "toilet winterizing",
      "fan control",
      "pedal flush",
      "service mode",
      "night mode",
      "digital thermostat",
      "wall control",
      "single zone controller",
      "furnace model",
      "induction cooktop",
      "tankless controller",
      "model prep",
      "storage reset",
      "warranty request",
      "parts lookup",
      "maintenance kit",
    ]) {
      expect(
        lookupSymptomGuides(index, query)
          .slice(0, 5)
          .map((symptom) => symptom.slug)
          .filter((slug) => anchoredSlugs.has(slug)),
        query,
      ).toEqual([]);
    }
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds official display, model, vent, thermostat, and hydronic prep guides without code entries", () => {
    const expectedSources = new Map<string, string>([
      [
        "dometic-acc3100-display-symbols-support",
        "https://support.dometic.com/en/ACC3100/What-do-the-symbols-on-the-display-mean-1694",
      ],
      [
        "dometic-acc3100-ventilation-system-not-switching-on-support",
        "https://support.dometic.com/en/ACC3100/The-ventilation-system-does-not-switch-on-6b5a",
      ],
      [
        "dometic-freshjet-roof-ac-does-not-switch-on-support",
        "https://support.dometic.com/en/freshjet-ac/My-roof-air-conditioner-does-not-switch-on-4ad6",
      ],
      [
        "dometic-freshjet-water-enters-vehicle-support",
        "https://support.dometic.com/en/freshjet-ac/Water-enters-the-vehicle-a677",
      ],
      [
        "dometic-brisk-ac-no-display-turned-on-support",
        "https://support.dometic.com/en/brisk-ac/No-display-when-Air-ConditionerHeat-Pump-is-turned-on-6175",
      ],
      [
        "dometic-ccc2-load-shed-control-support",
        "https://support.dometic.com/en/brisk-ac/How-to-control-the-Load-Shed-COMFORT-CONTROL-CENTER-2-THERMOSTAT-dffd",
      ],
      ["thetford-aria-deluxe-ii-support", "https://www.thetford.com/us/thetford-support/aria-deluxe-ii/"],
      ["thetford-aqua-magic-aurora-support", "https://www.thetford.com/us/thetford-support/aqua-magic-aurora/"],
      ["thetford-aqua-magic-style-lite-support", "https://www.thetford.com/us/thetford-support/aqua-magic-style-lite/"],
      ["norcold-n2090r-support", "https://www.thetford.com/us/thetford-support/n2090r/"],
      ["norcold-polar-nv8dc-support", "https://www.thetford.com/us/thetford-support/polar-nv8dc/"],
      ["furrion-14in-vent-fan-lid-user-manual-ccd0007282", "https://support.lci1.com/documents/ccd-0007282"],
      ["furrion-14in-vent-fan-electronic-lid-ccd0009643", "https://support.lci1.com/documents/ccd-0009643"],
      ["furrion-40a-60a-mppt-bt-app-ccd0007727", "https://support.lci1.com/documents/ccd-0007727"],
      ["furrion-solar-warranty-request-w018-ccd0008249", "https://support.lci1.com/documents/ccd-0008249"],
      [
        "furrion-13in-ducted-range-hood-imfha00131",
        "https://support.lci1.com/documents/furrion-13-12v-ducted-rv-range-hood-with-filter-user-manual-im-fha00131-v1.0",
      ],
      ["girard-10cuft-12v-fridge-ccd0005837", "https://support.lci1.com/documents/ccd-0005837"],
      ["girard-grf16dbgs-storage-qr183-ccd0008374", "https://support.lci1.com/documents/ccd-0008374"],
      ["girard-12v-range-hood-user-manual", "https://support.lci1.com/documents/girard-12v-range-hood-user-manual"],
      ["girard-gmw09ab-microwave-ccd0006006", "https://support.lci1.com/documents/ccd-0006006"],
      ["onan-qg-2800i-2500i-model-brochure-0064324", "https://mart.cummins.com/imagelibrary/data/assetfiles/0064324.pdf"],
      ["coleman-analog-thermostats-product", "https://coleman-mach.com/products/thermostats/analog-thermostats/"],
      [
        "coleman-9xxx-zone-thermostats-product",
        "https://coleman-mach.com/products/thermostats/9xxx-series-zone-thermostats-control-packages/",
      ],
      ["maxxair-maxx-ii-00933081-cover-product", "https://www.maxxair.com/products/covers/maxx-ii-00-933081/"],
      ["maxxair-maxxfan-mini-3801-product", "https://www.maxxair.com/products/fans/maxxfan-mini-3801/"],
      [
        "suburban-nt-seq-furnace-product",
        "https://suburbanrv.com/climate-control/furnaces/nt-seq-series-furnaces/nt-seq-series-furnace/",
      ],
      [
        "suburban-e-series-120v-water-heater-interior-product",
        "https://suburbanrv.com/water-heating/tank-water-heaters/e-series-120v-tank-water-heaters/interior-version/",
      ],
      ["aquahot-250-d03-use-care-guide", "https://aquahot.com/files/owners_manual/AHE-250-D03_Use_and_Care_Guide.pdf"],
      ["aquahot-250p-product-page", "https://www.aquahot.com/products/rv/250P.aspx"],
      ["aquahot-400p-product-page", "https://www.aquahot.com/products/rv/400P.aspx"],
    ]);
    const expectedSymptomSourceIds = new Map<string, string[]>([
      ["dometic-acc3100-display-symbols-prep", ["dometic-acc3100-display-symbols-support"]],
      [
        "dometic-acc3100-ventilation-not-switching-on-prep",
        ["dometic-acc3100-ventilation-system-not-switching-on-support"],
      ],
      ["dometic-freshjet-roof-ac-not-switching-on-prep", ["dometic-freshjet-roof-ac-does-not-switch-on-support"]],
      ["dometic-freshjet-water-entry-service-prep", ["dometic-freshjet-water-enters-vehicle-support"]],
      ["dometic-brisk-ac-no-display-service-prep", ["dometic-brisk-ac-no-display-turned-on-support"]],
      ["dometic-ccc2-load-shed-control-prep", ["dometic-ccc2-load-shed-control-support"]],
      ["thetford-aria-deluxe-ii-model-control-service-prep", ["thetford-aria-deluxe-ii-support"]],
      ["thetford-aqua-magic-aurora-model-service-prep", ["thetford-aqua-magic-aurora-support"]],
      ["thetford-aqua-magic-style-lite-model-storage-prep", ["thetford-aqua-magic-style-lite-support"]],
      ["norcold-n2090r-model-cooling-service-prep", ["norcold-n2090r-support"]],
      ["norcold-polar-nv8dc-model-control-service-prep", ["norcold-polar-nv8dc-support"]],
      ["furrion-14in-vent-fan-lid-control-prep", ["furrion-14in-vent-fan-lid-user-manual-ccd0007282"]],
      ["furrion-electronic-lid-vent-fan-control-prep", ["furrion-14in-vent-fan-electronic-lid-ccd0009643"]],
      ["furrion-mppt-bt-app-status-prep", ["furrion-40a-60a-mppt-bt-app-ccd0007727"]],
      ["furrion-solar-warranty-paperwork-prep", ["furrion-solar-warranty-request-w018-ccd0008249"]],
      ["furrion-13in-ducted-range-hood-filter-prep", ["furrion-13in-ducted-range-hood-imfha00131"]],
      ["girard-10cuft-refrigerator-service-prep", ["girard-10cuft-12v-fridge-ccd0005837"]],
      ["girard-grf16dbgs-refrigerator-storage-prep", ["girard-grf16dbgs-storage-qr183-ccd0008374"]],
      ["girard-12v-range-hood-control-prep", ["girard-12v-range-hood-user-manual"]],
      ["girard-gmw09ab-microwave-service-prep", ["girard-gmw09ab-microwave-ccd0006006"]],
      ["onan-qg-2800i-2500i-model-label-prep", ["onan-qg-2800i-2500i-model-brochure-0064324"]],
      ["coleman-analog-thermostat-part-number-prep", ["coleman-analog-thermostats-product"]],
      ["coleman-9xxx-zone-thermostat-control-package-prep", ["coleman-9xxx-zone-thermostats-product"]],
      ["maxxair-maxx-ii-00933081-cover-prep", ["maxxair-maxx-ii-00933081-cover-product"]],
      ["maxxair-maxxfan-mini-3801-control-prep", ["maxxair-maxxfan-mini-3801-product"]],
      ["suburban-nt-seq-furnace-model-service-prep", ["suburban-nt-seq-furnace-product"]],
      ["suburban-e-series-120v-water-heater-prep", ["suburban-e-series-120v-water-heater-interior-product"]],
      ["aquahot-250-d03-lcd-winterization-service-prep", ["aquahot-250-d03-use-care-guide"]],
      ["aquahot-250p-propane-model-service-prep", ["aquahot-250p-product-page"]],
      ["aquahot-400p-propane-electric-service-prep", ["aquahot-400p-product-page"]],
    ]);
    const expectedRequiredTerms = new Map<string, string[]>([
      ["dometic-acc3100-display-symbols-prep", ["acc3100+symbols", "acc3100+display+mean"]],
      ["dometic-acc3100-ventilation-not-switching-on-prep", ["acc3100+switch+on", "acc3100+ventilation"]],
      ["dometic-freshjet-roof-ac-not-switching-on-prep", ["freshjet+switch+on", "freshjet+power"]],
      ["dometic-freshjet-water-entry-service-prep", ["freshjet+water+enters", "freshjet+leak"]],
      ["dometic-brisk-ac-no-display-service-prep", ["brisk+no+display", "dometic+brisk+display"]],
      ["dometic-ccc2-load-shed-control-prep", ["ccc2+load+shed", "comfort+control+center+2+load+shed"]],
      ["thetford-aria-deluxe-ii-model-control-service-prep", ["aria+deluxe+ii", "thetford+aria+deluxe+ii"]],
      ["thetford-aqua-magic-aurora-model-service-prep", ["aqua+magic+aurora", "thetford+aurora"]],
      ["thetford-aqua-magic-style-lite-model-storage-prep", ["aqua+magic+style+lite", "style+lite+toilet"]],
      ["norcold-n2090r-model-cooling-service-prep", ["n2090r", "norcold+n2090r"]],
      ["norcold-polar-nv8dc-model-control-service-prep", ["polar+nv8dc", "norcold+nv8dc"]],
      ["furrion-14in-vent-fan-lid-control-prep", ["furrion+14+vent", "ccd0007282"]],
      ["furrion-electronic-lid-vent-fan-control-prep", ["furrion+electronic+lid", "ccd0009643"]],
      ["furrion-mppt-bt-app-status-prep", ["furrion+mppt", "ccd0007727"]],
      ["furrion-solar-warranty-paperwork-prep", ["w018", "furrion+solar+warranty"]],
      ["furrion-13in-ducted-range-hood-filter-prep", ["furrion+13+range+hood", "imfha00131"]],
      ["girard-10cuft-refrigerator-service-prep", ["girard+10+refrigerator", "ccd0005837"]],
      ["girard-grf16dbgs-refrigerator-storage-prep", ["grf16dbgs", "qr183"]],
      ["girard-12v-range-hood-control-prep", ["girard+12v+range+hood", "imfha00122"]],
      ["girard-gmw09ab-microwave-service-prep", ["gmw09ab", "girard+microwave"]],
      ["onan-qg-2800i-2500i-model-label-prep", ["qg+2800i", "2500i+lp", "0064324"]],
      ["coleman-analog-thermostat-part-number-prep", ["coleman+analog", "7330+thermostat"]],
      ["coleman-9xxx-zone-thermostat-control-package-prep", ["9xxx+zone", "9330a3341"]],
      ["maxxair-maxx-ii-00933081-cover-prep", ["00+933081", "maxxair+ii"]],
      ["maxxair-maxxfan-mini-3801-control-prep", ["00+03801", "maxxfan+mini"]],
      ["suburban-nt-seq-furnace-model-service-prep", ["nt+seq", "nt16seq", "2503abk"]],
      ["suburban-e-series-120v-water-heater-prep", ["sw7ecn", "e+series+120v"]],
      ["aquahot-250-d03-lcd-winterization-service-prep", ["250+d03", "ahe+250+d03"]],
      ["aquahot-250p-propane-model-service-prep", ["250p+propane", "aquahot+250p"]],
      ["aquahot-400p-propane-electric-service-prep", ["400p+propane", "aquahot+400p"]],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\borifice\b|\bcontrol board\b|\b120\s*vac\b|\b110\s*v\b|\bline-voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\binternal\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|measure resistance|fuel nozzle|combustion|coolant pump|manual override|hydraulic work|hydraulic repair/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, sourceIds] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(sourceIds);
      expect(symptom?.searchRequiredTerms, symptomId).toEqual(expectedRequiredTerms.get(symptomId));
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
    }

    const topSlugsFor = (query: string) => lookupSymptomGuides(index, query).slice(0, 5).map((symptom) => symptom.slug);

    for (const [query, slug] of [
      ["dometic acc3100 display symbols mean icon ventilation", "dometic-acc3100-display-symbols-prep"],
      ["dometic acc3100 ventilation does not switch on power", "dometic-acc3100-ventilation-not-switching-on-prep"],
      ["dometic freshjet roof ac does not switch on power", "dometic-freshjet-roof-ac-not-switching-on-prep"],
      ["dometic freshjet water enters vehicle leak service prep", "dometic-freshjet-water-entry-service-prep"],
      ["dometic brisk no display when air conditioner heat pump turned on", "dometic-brisk-ac-no-display-service-prep"],
      ["dometic ccc2 load shed comfort control center 2", "dometic-ccc2-load-shed-control-prep"],
      ["thetford aria deluxe ii model control service prep", "thetford-aria-deluxe-ii-model-control-service-prep"],
      ["thetford aqua magic aurora model service prep", "thetford-aqua-magic-aurora-model-service-prep"],
      ["thetford aqua magic style lite toilet model storage prep", "thetford-aqua-magic-style-lite-model-storage-prep"],
      ["norcold n2090r model cooling service prep", "norcold-n2090r-model-cooling-service-prep"],
      ["norcold polar nv8dc model control service prep", "norcold-polar-nv8dc-model-control-service-prep"],
      ["furrion 14 vent fan lid ccd0007282 control prep", "furrion-14in-vent-fan-lid-control-prep"],
      ["furrion electronic lid vent fan ccd0009643 control prep", "furrion-electronic-lid-vent-fan-control-prep"],
      ["furrion mppt bt app ccd0007727 status prep", "furrion-mppt-bt-app-status-prep"],
      ["furrion solar warranty request w018 prep", "furrion-solar-warranty-paperwork-prep"],
      ["furrion 13 range hood imfha00131 filter prep", "furrion-13in-ducted-range-hood-filter-prep"],
      ["girard 10 refrigerator ccd0005837 service prep", "girard-10cuft-refrigerator-service-prep"],
      ["girard grf16dbgs qr183 proper storage prep", "girard-grf16dbgs-refrigerator-storage-prep"],
      ["girard 12v range hood imfha00122 control prep", "girard-12v-range-hood-control-prep"],
      ["girard gmw09ab microwave service prep", "girard-gmw09ab-microwave-service-prep"],
      ["onan qg 2800i 2500i lp 0064324 model label prep", "onan-qg-2800i-2500i-model-label-prep"],
      ["coleman analog 7330 thermostat part number prep", "coleman-analog-thermostat-part-number-prep"],
      ["coleman 9xxx zone 9330a3341 control package prep", "coleman-9xxx-zone-thermostat-control-package-prep"],
      ["maxxair maxx ii 00 933081 cover prep", "maxxair-maxx-ii-00933081-cover-prep"],
      ["maxxair maxxfan mini 00 03801 control prep", "maxxair-maxxfan-mini-3801-control-prep"],
      ["suburban nt seq nt16seq 2503abk furnace service prep", "suburban-nt-seq-furnace-model-service-prep"],
      ["suburban sw7ecn e series 120v water heater prep", "suburban-e-series-120v-water-heater-prep"],
      ["aqua hot 250 d03 ahe 250 d03 lcd winterization service prep", "aquahot-250-d03-lcd-winterization-service-prep"],
      ["aqua hot 250p propane model service prep", "aquahot-250p-propane-model-service-prep"],
      ["aqua hot 400p propane electric service prep", "aquahot-400p-propane-electric-service-prep"],
    ] as const) {
      expect(topSlugsFor(query), query).toContain(slug);
      expect(topSlugsFor(query)[0], query).toBe(slug);
    }

    for (const [symptomId] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      for (const alias of symptom?.searchAliases ?? []) {
        expect(topSlugsFor(alias)[0], `${symptomId}: ${alias}`).toBe(symptom?.slug);
      }
    }

    const anchoredSlugs = new Set(expectedSymptomSourceIds.keys());
    for (const query of [
      "display symbols",
      "does not switch on",
      "roof ac water leak",
      "load shed",
      "aqua magic toilet",
      "refrigerator cooling",
      "vent fan lid",
      "solar warranty",
      "range hood",
      "microwave service",
      "thermostat part number",
      "zone thermostat",
      "vent cover",
      "water heater prep",
      "propane service",
      "hydronic heating",
    ]) {
      expect(
        lookupSymptomGuides(index, query)
          .slice(0, 5)
          .map((symptom) => symptom.slug)
          .filter((slug) => anchoredSlugs.has(slug)),
        query,
      ).toEqual([]);
    }
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds official toilet, control, locator, warranty, and service prep guides without code entries", () => {
    const expectedSources = new Map<string, string>([
      [
        "dometic-masterflush-8100-8500-8600-8700-8900-operating",
        "https://media.dometic.com/externalassets/dometic-masterflush-8500_9600006448_64582.pdf",
      ],
      [
        "dometic-acc3100-storage-mode-support",
        "https://support.dometic.com/en/ACC3100/How-to-activate-and-deactivate-the-STORAGE-mode-9367",
      ],
      ["dometic-freshjet-timer-control-support", "https://support.dometic.com/en/freshjet-ac/How-to-Set-the-timer-2168"],
      [
        "dometic-harrier-air-nozzles-support",
        "https://support.dometic.com/en/harrier-ac/How-to-Adjust-the-air-nozzles-17a",
      ],
      ["thetford-tecma-silence-plus-2g-support", "https://www.thetford.com/us/thetford-support/tecma-silence-plus-2g/"],
      [
        "thetford-electra-magic-model-80-rv-support",
        "https://www.thetford.com/us/thetford-support/electra-magic-model-80-rv/",
      ],
      [
        "thetford-aqua-magic-iv-hand-flush-support",
        "https://www.thetford.com/us/thetford-support/aqua-magic-iv-hand-flush/",
      ],
      ["thetford-c223-cs-cassette-toilet-support", "https://www.thetford.com/us/thetford-support/c223-cs-cassette-toilet/"],
      ["norcold-2117-support", "https://www.thetford.com/us/thetford-support/2117-2/"],
      [
        "norcold-dc0788-de0788-ev0788-support",
        "https://www.thetford.com/us/thetford-support/dc0788-de0788-ev0788/",
      ],
      ["airxcel-service-center-dealer-locator", "https://www.airxcel.com/service-locator/"],
      ["coleman-mach-products-router", "https://coleman-mach.com/products/"],
      ["coleman-mach-conversion-kits-router", "https://coleman-mach.com/products/conversion-kits/"],
      [
        "maxxair-mini-wall-control-iom-11a90030z",
        "https://library.maxxair.com/wp-content/uploads/2023/03/11a90030z_mxfan-mini-plus-mini-deluxe-with-wall-control-iom-08-2019.pdf",
      ],
      [
        "maxxair-fanmate-755-855-955-iom",
        "https://library.maxxair.com/wp-content/uploads/2023/03/10a11955z_fanmate-assy-install-for-755-855-955-models-legal-rev-a-11-2015.pdf",
      ],
      [
        "maxxair-maxxshade-3900-3901-iom",
        "https://library.maxxair.com/wp-content/uploads/2023/03/10-03911z_maxxshade-iom-05-2018.pdf",
      ],
      ["suburban-sf-fq-furnaces-product", "https://suburbanrv.com/climate-control/furnaces/sf-fq-series-furnaces/"],
      ["suburban-ranges-product-family", "https://suburbanrv.com/kitchen-galley/ranges/"],
      [
        "suburban-water-heater-anode-rod-product",
        "https://suburbanrv.com/water-heating/tank-water-heaters/tank-water-heater-accessories/replacement-anode-rod/",
      ],
      ["aquahot-wave40-product", "https://www.aquahot.com/products/rv/wave40.aspx"],
      ["furrion-fcr10dcgta-storage-qr190", "https://support.lci1.com/documents/ccd-0008583"],
      ["furrion-fcr11dc-storage-qr191", "https://support.lci1.com/documents/ccd-0008584"],
      ["furrion-warranty-manual-ccd0004843", "https://support.lci1.com/documents/ccd-0004843"],
      ["lippert-w022-submit-warranty-claim", "https://support.lci1.com/documents/ccd-0009742"],
      ["furrion-ac-warranty-request-w013", "https://support.lci1.com/documents/ccd-0008244"],
      ["furrion-furnace-warranty-checklist-w023", "https://support.lci1.com/documents/ccd-0011145"],
      ["lippert-qualified-tech-map", "https://support.lci1.com/qualified-tech-map"],
      [
        "girard-15-6-12v-refrigerator-manual",
        "https://support.lci1.com/documents/girard-15-cu-ft-12v-side-by-side",
      ],
      [
        "furrion-rchef-electric-oven-manual",
        "https://support.lci1.com/documents/furrion-rchef-collection-electric-oven-user-manual",
      ],
      [
        "onan-qg4000-shop-gsn-product-page",
        "https://shop.cummins.com/SC/product/onan-qg-4000-gasoline-rv-generator-with-30a-breaker-a055e867/01t4N0000048pf4QAA",
      ],
    ]);
    const expectedSymptomSourceIds = new Map<string, string[]>([
      ["dometic-masterflush-flush-mode-storage-prep", ["dometic-masterflush-8100-8500-8600-8700-8900-operating"]],
      ["dometic-acc3100-storage-mode-service-prep", ["dometic-acc3100-storage-mode-support"]],
      ["dometic-freshjet-timer-control-prep", ["dometic-freshjet-timer-control-support"]],
      ["dometic-harrier-air-nozzle-control-prep", ["dometic-harrier-air-nozzles-support"]],
      ["thetford-tecma-silence-plus-2g-control-service-prep", ["thetford-tecma-silence-plus-2g-support"]],
      ["thetford-electra-magic-model-80-rv-service-prep", ["thetford-electra-magic-model-80-rv-support"]],
      ["thetford-aqua-magic-iv-hand-flush-model-service-prep", ["thetford-aqua-magic-iv-hand-flush-support"]],
      ["thetford-c223-cs-cassette-toilet-model-service-prep", ["thetford-c223-cs-cassette-toilet-support"]],
      ["norcold-2117-support-manual-parts-prep", ["norcold-2117-support"]],
      ["norcold-dc0788-de0788-ev0788-model-cooling-prep", ["norcold-dc0788-de0788-ev0788-support"]],
      ["airxcel-family-service-locator-prep", ["airxcel-service-center-dealer-locator"]],
      ["coleman-mach-product-family-router-prep", ["coleman-mach-products-router"]],
      ["coleman-mach-conversion-kit-compatibility-prep", ["coleman-mach-conversion-kits-router"]],
      ["maxxair-mini-plus-deluxe-wall-control-prep", ["maxxair-mini-wall-control-iom-11a90030z"]],
      ["maxxair-fanmate-cover-ezclip-model-prep", ["maxxair-fanmate-755-855-955-iom"]],
      ["maxxair-maxxshade-fan-shade-service-prep", ["maxxair-maxxshade-3900-3901-iom"]],
      ["suburban-sf-fq-furnace-model-service-prep", ["suburban-sf-fq-furnaces-product"]],
      ["suburban-elite-range-model-prep", ["suburban-ranges-product-family"]],
      ["suburban-water-heater-anode-rod-service-prep", ["suburban-water-heater-anode-rod-product"]],
      ["aquahot-wave40-model-control-service-prep", ["aquahot-wave40-product"]],
      ["furrion-fcr10dcgta-storage-reset-prep", ["furrion-fcr10dcgta-storage-qr190"]],
      ["furrion-fcr11dc-storage-reset-prep", ["furrion-fcr11dc-storage-qr191"]],
      ["furrion-product-warranty-model-serial-prep", ["furrion-warranty-manual-ccd0004843"]],
      ["lippert-furrion-submit-warranty-claim-prep", ["lippert-w022-submit-warranty-claim"]],
      ["furrion-ac-warranty-model-controller-prep", ["furrion-ac-warranty-request-w013"]],
      ["furrion-furnace-warranty-checklist-prep", ["furrion-furnace-warranty-checklist-w023"]],
      ["lippert-qualified-technician-service-routing-prep", ["lippert-qualified-tech-map"]],
      ["girard-15-6-12v-refrigerator-control-storage-prep", ["girard-15-6-12v-refrigerator-manual"]],
      ["furrion-rchef-electric-oven-control-service-prep", ["furrion-rchef-electric-oven-manual"]],
      ["onan-qg4000-gsn-model-warranty-prep", ["onan-qg4000-shop-gsn-product-page"]],
    ]);
    const expectedRequiredTerms = new Map<string, string[]>([
      ["dometic-masterflush-flush-mode-storage-prep", ["masterflush+8500", "dometic+masterflush"]],
      ["dometic-acc3100-storage-mode-service-prep", ["acc3100+storage", "acc3100+mode"]],
      ["dometic-freshjet-timer-control-prep", ["freshjet+timer", "dometic+timer"]],
      ["dometic-harrier-air-nozzle-control-prep", ["harrier+nozzle", "harrier+air"]],
      ["thetford-tecma-silence-plus-2g-control-service-prep", ["tecma+silence+plus+2g"]],
      ["thetford-electra-magic-model-80-rv-service-prep", ["electra+magic+80", "model+80+rv"]],
      ["thetford-aqua-magic-iv-hand-flush-model-service-prep", ["aqua+magic+iv+hand", "iv+hand+flush"]],
      ["thetford-c223-cs-cassette-toilet-model-service-prep", ["c223+cs", "c223+toilet"]],
      ["norcold-2117-support-manual-parts-prep", ["norcold+2117", "2117+parts"]],
      ["norcold-dc0788-de0788-ev0788-model-cooling-prep", ["dc0788", "de0788", "ev0788"]],
      ["airxcel-family-service-locator-prep", ["airxcel+service+locator", "locator+airxcel"]],
      ["coleman-mach-product-family-router-prep", ["coleman+mach+products", "coleman+documentation"]],
      ["coleman-mach-conversion-kit-compatibility-prep", ["coleman+conversion+kits", "air+vantage", "carrier+conversions"]],
      ["maxxair-mini-plus-deluxe-wall-control-prep", ["11a90030z", "mini+wall+control", "3852+wall"]],
      ["maxxair-fanmate-cover-ezclip-model-prep", ["fanmate+755", "fanmate+855", "fanmate+955", "10a11955z"]],
      ["maxxair-maxxshade-fan-shade-service-prep", ["maxxshade+3900", "maxxshade+3901", "10+03911z"]],
      ["suburban-sf-fq-furnace-model-service-prep", ["sf+fq", "suburban+sf+fq"]],
      ["suburban-elite-range-model-prep", ["suburban+elite+range", "17+elite", "22+elite"]],
      ["suburban-water-heater-anode-rod-service-prep", ["suburban+anode+rod", "233514", "233516"]],
      ["aquahot-wave40-model-control-service-prep", ["wave40", "wave+40"]],
      ["furrion-fcr10dcgta-storage-reset-prep", ["fcr10dcgta", "qr190", "ccd0008583"]],
      ["furrion-fcr11dc-storage-reset-prep", ["fcr11dc", "qr191", "ccd0008584"]],
      ["furrion-product-warranty-model-serial-prep", ["furrion+warranty+manual", "ccd0004843"]],
      ["lippert-furrion-submit-warranty-claim-prep", ["w022", "w022+warranty+claim", "ccd0009742"]],
      ["furrion-ac-warranty-model-controller-prep", ["w013", "furrion+ac+warranty", "ccd0008244"]],
      ["furrion-furnace-warranty-checklist-prep", ["w023", "furrion+furnace+warranty", "ccd0011145"]],
      ["lippert-qualified-technician-service-routing-prep", ["qualified+tech+map", "lippert+qualified"]],
      ["girard-15-6-12v-refrigerator-control-storage-prep", ["girard+15+6", "ccd0005727", "fha00121"]],
      ["furrion-rchef-electric-oven-control-service-prep", ["rchef+electric+oven", "ccd0005576", "fha00005"]],
      ["onan-qg4000-gsn-model-warranty-prep", ["a055e867", "4kyfa+6747", "qg+4000"]],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\borifice\b|\bcontrol board\b|\b120\s*vac\b|\b110\s*v\b|\bline-voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\binternal\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|measure resistance|fuel nozzle|combustion|coolant pump|manual override|hydraulic work|hydraulic repair/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, sourceIds] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(sourceIds);
      expect(symptom?.searchRequiredTerms, symptomId).toEqual(expectedRequiredTerms.get(symptomId));
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
    }

    const topSlugsFor = (query: string) => lookupSymptomGuides(index, query).slice(0, 5).map((symptom) => symptom.slug);

    for (const [query, slug] of [
      ["dometic masterflush 8500 flush mode storage prep", "dometic-masterflush-flush-mode-storage-prep"],
      ["dometic acc3100 storage mode service prep", "dometic-acc3100-storage-mode-service-prep"],
      ["dometic freshjet set timer remote control prep", "dometic-freshjet-timer-control-prep"],
      ["dometic harrier adjust air nozzles airflow", "dometic-harrier-air-nozzle-control-prep"],
      ["thetford tecma silence plus 2g owner manual", "thetford-tecma-silence-plus-2g-control-service-prep"],
      ["thetford electra magic model 80 rv service prep", "thetford-electra-magic-model-80-rv-service-prep"],
      ["thetford aqua magic iv hand flush parts", "thetford-aqua-magic-iv-hand-flush-model-service-prep"],
      ["thetford c223 cs cassette toilet owner manual", "thetford-c223-cs-cassette-toilet-model-service-prep"],
      ["norcold 2117 owner manual parts list", "norcold-2117-support-manual-parts-prep"],
      ["norcold dc0788 de0788 ev0788 cooling prep", "norcold-dc0788-de0788-ev0788-model-cooling-prep"],
      ["airxcel service center dealer locator rv brands", "airxcel-family-service-locator-prep"],
      ["coleman mach products air conditioners thermostats documentation", "coleman-mach-product-family-router-prep"],
      ["coleman mach conversion kits air vantage carrier conversions", "coleman-mach-conversion-kit-compatibility-prep"],
      ["maxxair 11a90030z mini plus deluxe wall control", "maxxair-mini-plus-deluxe-wall-control-prep"],
      ["maxxair fanmate 755 855 955 ezclip model prep", "maxxair-fanmate-cover-ezclip-model-prep"],
      ["maxxair maxxshade 3900 3901 fan shade service prep", "maxxair-maxxshade-fan-shade-service-prep"],
      ["suburban sf fq furnace model service prep", "suburban-sf-fq-furnace-model-service-prep"],
      ["suburban elite range 17 22 model prep", "suburban-elite-range-model-prep"],
      ["suburban anode rod 233514 233516 water heater prep", "suburban-water-heater-anode-rod-service-prep"],
      ["aqua hot wave40 wave 40 wifi controls service prep", "aquahot-wave40-model-control-service-prep"],
      ["furrion fcr10dcgta qr190 storage reset prep", "furrion-fcr10dcgta-storage-reset-prep"],
      ["furrion fcr11dc qr191 storage reset prep", "furrion-fcr11dc-storage-reset-prep"],
      ["furrion warranty manual ccd0004843 model serial", "furrion-product-warranty-model-serial-prep"],
      ["lippert w022 warranty claim ccd0009742 prep", "lippert-furrion-submit-warranty-claim-prep"],
      ["furrion ac warranty request w013 adb controller prep", "furrion-ac-warranty-model-controller-prep"],
      ["furrion furnace warranty checklist w023 model serial", "furrion-furnace-warranty-checklist-prep"],
      ["lippert qualified tech map service routing", "lippert-qualified-technician-service-routing-prep"],
      ["girard 15 6 12v refrigerator ccd0005727 storage prep", "girard-15-6-12v-refrigerator-control-storage-prep"],
      ["furrion rchef electric oven ccd0005576 control prep", "furrion-rchef-electric-oven-control-service-prep"],
      ["onan qg 4000 a055e867 4kyfa 6747 gsn warranty prep", "onan-qg4000-gsn-model-warranty-prep"],
    ] as const) {
      expect(topSlugsFor(query), query).toContain(slug);
      expect(topSlugsFor(query)[0], query).toBe(slug);
    }

    for (const [symptomId] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      for (const alias of symptom?.searchAliases ?? []) {
        expect(topSlugsFor(alias)[0], `${symptomId}: ${alias}`).toBe(symptom?.slug);
      }
    }

    const anchoredSlugs = new Set(expectedSymptomSourceIds.keys());
    for (const query of [
      "storage mode",
      "set timer",
      "air nozzles",
      "owner manual",
      "parts list",
      "service locator",
      "conversion kit",
      "wall control",
      "furnace model",
      "range model",
      "warranty request",
      "service routing",
      "electric oven",
      "generator warranty",
      "hand flush",
      "conversion kits",
      "anode rod",
      "water heater anode rod",
      "warranty claim",
    ]) {
      expect(
        lookupSymptomGuides(index, query)
          .slice(0, 5)
          .map((symptom) => symptom.slug)
          .filter((slug) => anchoredSlugs.has(slug)),
        query,
      ).toEqual([]);
    }
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds the next official model, control, warranty, and service-prep batch without code entries", () => {
    const expectedSources = new Map<string, string>([
      ["dometic-acc3100-select-mode-support", "https://support.dometic.com/en/ACC3100/How-to-select-the-mode-fe4c"],
      [
        "dometic-acc3100-climate-app-use-support",
        "https://support.dometic.com/en/ACC3100/How-to-use-the-the-Dometic-Climate-App-65c5",
      ],
      [
        "dometic-acc3100-software-update-support",
        "https://support.dometic.com/en/ACC3100/How-to-update-the-ventilation-system-software-4ee1",
      ],
      [
        "dometic-ccc2-auto-changeover-support",
        "https://support.dometic.com/en/brisk-ac/How-to-control-AUTO-Auto-Change-Over-Mode-COMFORT-CONTROL-CENTER-2-THERMOSTAT-cce4",
      ],
      [
        "dometic-rm10-turn-off-refrigerator-support",
        "https://support.dometic.com/en/rm10-refrigerators/How-to-turn-off-the-refrigerator-bb42",
      ],
      [
        "dometic-rm8-food-storage-support",
        "https://support.dometic.com/en/rm8-refrigerators/How-to-best-store-food-in-the-refrigerator-1432",
      ],
      [
        "dometic-rua-clean-maintain-refrigerator-support",
        "https://support.dometic.com/en/rua-refrigerator/How-to-clean-and-maintain-the-refrigerator-47a9",
      ],
      [
        "dometic-fantastic-vent-2250-product",
        "https://www.dometic.com/en-us/product/dometic-2250-fan-tastic-vent-roof-fan-9108869049",
      ],
      [
        "dometic-1450-vent-roof-fan-product",
        "https://www.dometic.com/en-us/product/dometic-1450-vent-roof-fan-9600008500",
      ],
      [
        "dometic-fantastic-vent-fans-seven-year-warranty-62311",
        "https://www.dometic.com/globalassets/1-outdoor/out-support/out-warranty-statements/fantastic_vent_fans_limited_seven-year_warranty-_-62311.pdf",
      ],
      ["norcold-n20dc-support", "https://www.thetford.com/us/thetford-support/n20dc/"],
      ["norcold-n8dc-support", "https://www.thetford.com/us/thetford-support/n8dc/"],
      ["norcold-polar-nv10dc-support", "https://www.thetford.com/us/thetford-support/polar-nv10dc/"],
      ["norcold-n180-3-support", "https://www.thetford.com/us/thetford-support/n180-3/"],
      ["norcold-n4104-support", "https://www.thetford.com/us/thetford-support/n4104/"],
      ["norcold-de105-support", "https://www.thetford.com/us/thetford-support/de105/"],
      ["thetford-c403l-cassette-toilet-support", "https://www.thetford.com/us/thetford-support/c403l-cassette-toilet/"],
      ["thetford-c223-s-cassette-toilet-support", "https://www.thetford.com/us/thetford-support/c223-s-cassette-toilet/"],
      ["furrion-12v-range-hood-user-manual-ccd0005505", "https://support.lci1.com/documents/ccd-0005505"],
      ["furrion-13in-sloped-rangehood-manual-ccd0008551", "https://support.lci1.com/documents/ccd-0008551"],
      ["furrion-vent-fan-manual-lid-aftermarket-ccd0008554", "https://support.lci1.com/documents/ccd-0008554"],
      ["furrion-vent-fan-electronic-lid-kit-ccd0010788", "https://support.lci1.com/documents/ccd-0010788"],
      [
        "furrion-w012-8-10-refrigerator-warranty-form-ccd0008130",
        "https://support.lci1.com/documents/ccd-0008130",
      ],
      ["furrion-w015-general-warranty-request-form-ccd0008246", "https://support.lci1.com/documents/ccd-0008246"],
      [
        "lippert-onecontrol-wireless-qr061",
        "https://support.lci1.com/documents/qr-061-connecting-to-onecontrol-using-wireless",
      ],
      [
        "lippert-onecontrol-app-setup-qr077",
        "https://support.lci1.com/documents/qr-077-onecontrolreg-application-setup",
      ],
      ["coleman-mach-12v-wall-thermostat-manual", "https://library.coleman-mach.com/manual/12-vdc-wall-thermostat/"],
      ["coleman-46000-underbunk-owner-1976-583", "https://library.coleman-mach.com/wp-content/uploads/2023/04/1976-583.pdf"],
      ["maxxair-original-vent-cover-product", "https://www.maxxair.com/Products/covers/maxxair/"],
      [
        "suburban-tankless-control-center-product",
        "https://suburbanrv.com/water-heating/tankless-water-heaters/advantage-tankless-water-heater-control/",
      ],
    ]);
    const expectedSymptomSourceIds = new Map<string, string[]>([
      ["dometic-acc3100-mode-sequence-prep", ["dometic-acc3100-select-mode-support"]],
      ["dometic-acc3100-climate-app-use-prep", ["dometic-acc3100-climate-app-use-support"]],
      ["dometic-acc3100-software-update-prep", ["dometic-acc3100-software-update-support"]],
      ["dometic-ccc2-auto-changeover-behavior-prep", ["dometic-ccc2-auto-changeover-support"]],
      ["dometic-rm10-shutdown-control-prep", ["dometic-rm10-turn-off-refrigerator-support"]],
      ["dometic-rm8-food-storage-airflow-prep", ["dometic-rm8-food-storage-support"]],
      ["dometic-rua-cleaning-maintenance-prep", ["dometic-rua-clean-maintain-refrigerator-support"]],
      ["dometic-fantastic-vent-2250-model-control-prep", ["dometic-fantastic-vent-2250-product"]],
      ["dometic-1450-vent-model-control-prep", ["dometic-1450-vent-roof-fan-product"]],
      ["dometic-fantastic-vent-warranty-paperwork-prep", ["dometic-fantastic-vent-fans-seven-year-warranty-62311"]],
      ["norcold-n20dc-manual-parts-service-prep", ["norcold-n20dc-support", "norcold-n15dc-n20dc-parts-list-641044-082025"]],
      ["norcold-n8dc-manual-parts-service-prep", ["norcold-n8dc-support", "norcold-n8dc-n10dc-parts-list-640138"]],
      ["norcold-polar-nv10dc-model-control-service-prep", ["norcold-polar-nv10dc-support"]],
      ["norcold-n180-3-discontinued-storage-parts-prep", ["norcold-n180-3-support"]],
      ["norcold-n4104-model-manual-parts-prep", ["norcold-n4104-support"]],
      ["norcold-de105-acdc-refrigerator-service-prep", ["norcold-de105-support"]],
      ["thetford-c403l-cassette-model-service-prep", ["thetford-c403l-cassette-toilet-support"]],
      ["thetford-c223-s-cassette-model-service-prep", ["thetford-c223-s-cassette-toilet-support"]],
      ["furrion-12v-range-hood-filter-model-prep", ["furrion-12v-range-hood-user-manual-ccd0005505"]],
      ["furrion-13in-sloped-rangehood-model-prep", ["furrion-13in-sloped-rangehood-manual-ccd0008551"]],
      ["furrion-14in-vent-fan-manual-lid-model-prep", ["furrion-vent-fan-manual-lid-aftermarket-ccd0008554"]],
      ["furrion-14in-vent-fan-electronic-lid-kit-prep", ["furrion-vent-fan-electronic-lid-kit-ccd0010788"]],
      ["furrion-8-10-refrigerator-warranty-paperwork-prep", ["furrion-w012-8-10-refrigerator-warranty-form-ccd0008130"]],
      ["furrion-general-warranty-request-paperwork-prep", ["furrion-w015-general-warranty-request-form-ccd0008246"]],
      ["lippert-onecontrol-wireless-connection-prep", ["lippert-onecontrol-wireless-qr061"]],
      ["lippert-onecontrol-application-setup-prep", ["lippert-onecontrol-app-setup-qr077"]],
      ["coleman-mach-12v-wall-thermostat-control-prep", ["coleman-mach-12v-wall-thermostat-manual"]],
      ["coleman-mach-46000-underbunk-control-service-prep", ["coleman-46000-underbunk-owner-1976-583"]],
      ["maxxair-original-vent-cover-compatibility-prep", ["maxxair-original-vent-cover-product"]],
      ["suburban-tankless-control-center-model-prep", ["suburban-tankless-control-center-product"]],
    ]);
    const expectedRequiredTerms = new Map<string, string[]>([
      ["dometic-acc3100-mode-sequence-prep", ["acc3100+select", "acc3100+turbo", "acc3100+sleep"]],
      ["dometic-acc3100-climate-app-use-prep", ["acc3100+climate+app"]],
      ["dometic-acc3100-software-update-prep", ["acc3100+software", "acc3100+update", "ventilation+software"]],
      ["dometic-ccc2-auto-changeover-behavior-prep", ["ccc2+auto+change", "ccc2+change+over"]],
      ["dometic-rm10-shutdown-control-prep", ["rm10+turn+off", "rm10+shutdown"]],
      ["dometic-rm8-food-storage-airflow-prep", ["rm8+food", "rm8+airflow", "rm8+storage"]],
      ["dometic-rua-cleaning-maintenance-prep", ["rua+clean", "rua+maintain", "rua+maintenance"]],
      ["dometic-fantastic-vent-2250-model-control-prep", ["fantastic+2250", "2250+vent"]],
      ["dometic-1450-vent-model-control-prep", ["dometic+1450", "1450+vent", "9600008500"]],
      ["dometic-fantastic-vent-warranty-paperwork-prep", ["fantastic+seven+year", "fantastic+warranty", "62311"]],
      ["norcold-n20dc-manual-parts-service-prep", ["n20dc", "n20dc+manual", "n20dc+641044", "n20dc+parts+list"]],
      ["norcold-n8dc-manual-parts-service-prep", ["n8dc", "n8dc+manual", "n8dc+640138", "n8dc+parts+list"]],
      ["norcold-polar-nv10dc-model-control-service-prep", ["nv10dc", "polar+nv10dc"]],
      ["norcold-n180-3-discontinued-storage-parts-prep", ["n180+3", "n180", "discontinued+storage"]],
      ["norcold-n4104-model-manual-parts-prep", ["n4104"]],
      ["norcold-de105-acdc-refrigerator-service-prep", ["de105"]],
      ["thetford-c403l-cassette-model-service-prep", ["c403l"]],
      ["thetford-c223-s-cassette-model-service-prep", ["c223+s", "c223s"]],
      ["furrion-12v-range-hood-filter-model-prep", ["ccd0005505", "12v+range+hood"]],
      ["furrion-13in-sloped-rangehood-model-prep", ["ccd0008551", "13+sloped+rangehood"]],
      ["furrion-14in-vent-fan-manual-lid-model-prep", ["ccd0008554", "furrion+manual+lid"]],
      ["furrion-14in-vent-fan-electronic-lid-kit-prep", ["ccd0010788", "furrion+electronic+lid"]],
      ["furrion-8-10-refrigerator-warranty-paperwork-prep", ["ccd0008130", "w012", "8+10+refrigerator"]],
      ["furrion-general-warranty-request-paperwork-prep", ["ccd0008246", "w015", "furrion+general+warranty"]],
      ["lippert-onecontrol-wireless-connection-prep", ["qr061", "onecontrol+wireless"]],
      ["lippert-onecontrol-application-setup-prep", ["qr077", "onecontrol+application"]],
      ["coleman-mach-12v-wall-thermostat-control-prep", ["12+vdc+wall", "coleman+thermostat"]],
      ["coleman-mach-46000-underbunk-control-service-prep", ["46000+underbunk", "1976+583"]],
      ["maxxair-original-vent-cover-compatibility-prep", ["maxxair+original", "vent+cover+compatibility"]],
      ["suburban-tankless-control-center-model-prep", ["suburban+tankless+control", "suburban+digital+control"]],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const newSlugs = new Set(expectedSymptomSourceIds.keys());
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|\bburner\b|\borifice\b|\bcontrol board\b|\b120\s*vac\b|\b110\s*v\b|\bline-voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\binternal\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|measure resistance|fuel nozzle|combustion|coolant pump|manual override|hydraulic work|hydraulic repair/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, sourceIds] of expectedSymptomSourceIds) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.id, symptomId).toBe(symptomId);
      expect(symptom?.slug, symptomId).toBe(symptomId);
      expect(symptom?.sourceIds, symptomId).toEqual(sourceIds);
      expect(symptom?.searchRequiredTerms, symptomId).toEqual(expectedRequiredTerms.get(symptomId));
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
    }

    const topSlugsFor = (query: string) => lookupSymptomGuides(index, query).slice(0, 5).map((symptom) => symptom.slug);

    for (const [query, slug] of [
      ["dometic acc3100 select mode turbo sleep auto manual", "dometic-acc3100-mode-sequence-prep"],
      ["dometic acc3100 climate app use vent control", "dometic-acc3100-climate-app-use-prep"],
      ["dometic acc3100 ventilation system software update app", "dometic-acc3100-software-update-prep"],
      ["dometic ccc2 auto change over mode thermostat heat cool", "dometic-ccc2-auto-changeover-behavior-prep"],
      ["dometic rm10 turn off refrigerator shutdown control", "dometic-rm10-shutdown-control-prep"],
      ["dometic rm8 food storage airflow cooling prep", "dometic-rm8-food-storage-airflow-prep"],
      ["dometic rua clean maintain refrigerator service prep", "dometic-rua-cleaning-maintenance-prep"],
      ["dometic fantastic vent 2250 model control prep", "dometic-fantastic-vent-2250-model-control-prep"],
      ["dometic 1450 vent roof fan model control prep", "dometic-1450-vent-model-control-prep"],
      ["dometic fantastic vent seven year warranty paperwork prep", "dometic-fantastic-vent-warranty-paperwork-prep"],
      ["norcold n20dc manual parts service prep", "norcold-n20dc-manual-parts-service-prep"],
      ["norcold n8dc manual parts service prep", "norcold-n8dc-manual-parts-service-prep"],
      ["norcold polar nv10dc model control service prep", "norcold-polar-nv10dc-model-control-service-prep"],
      ["norcold n180.3 discontinued storage parts prep", "norcold-n180-3-discontinued-storage-parts-prep"],
      ["norcold n4104 model manual parts prep", "norcold-n4104-model-manual-parts-prep"],
      ["norcold de105 ac dc refrigerator service prep", "norcold-de105-acdc-refrigerator-service-prep"],
      ["thetford c403l cassette toilet model service prep", "thetford-c403l-cassette-model-service-prep"],
      ["thetford c223-s cassette toilet model service prep", "thetford-c223-s-cassette-model-service-prep"],
      ["furrion 12v range hood ccd0005505 filter model prep", "furrion-12v-range-hood-filter-model-prep"],
      ["furrion 13 inch sloped rangehood ccd0008551 model prep", "furrion-13in-sloped-rangehood-model-prep"],
      ["furrion 14 inch vent fan manual lid ccd0008554 model prep", "furrion-14in-vent-fan-manual-lid-model-prep"],
      ["furrion electronic lid vent fan kit ccd0010788 prep", "furrion-14in-vent-fan-electronic-lid-kit-prep"],
      ["furrion w012 8 10 refrigerator warranty ccd0008130 prep", "furrion-8-10-refrigerator-warranty-paperwork-prep"],
      ["furrion w015 general warranty request ccd0008246 prep", "furrion-general-warranty-request-paperwork-prep"],
      ["lippert onecontrol wireless qr061 connection prep", "lippert-onecontrol-wireless-connection-prep"],
      ["lippert onecontrol application setup qr077 prep", "lippert-onecontrol-application-setup-prep"],
      ["coleman mach 12 vdc wall thermostat control prep", "coleman-mach-12v-wall-thermostat-control-prep"],
      ["coleman mach 46000 underbunk control service prep", "coleman-mach-46000-underbunk-control-service-prep"],
      ["maxxair original vent cover compatibility prep", "maxxair-original-vent-cover-compatibility-prep"],
      ["suburban tankless digital control center model prep", "suburban-tankless-control-center-model-prep"],
    ] as const) {
      expect(topSlugsFor(query)[0], query).toBe(slug);
    }

    for (const query of [
      "mode",
      "app",
      "software update",
      "warranty",
      "owner manual",
      "service prep",
      "vent cover",
      "thermostat",
      "wireless connection",
      "tankless control",
      "range hood",
      "cassette toilet",
      "change over",
      "manual lid",
      "electronic lid",
      "general warranty request",
      "digital control center",
    ]) {
      expect(
        topSlugsFor(query).filter((slug) => newSlugs.has(slug)),
        query,
      ).toEqual([]);
    }
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds official CFX, Porta Potti, Greystone, Furrion microwave, and hydronic prep guides without code entries", () => {
    const expectedSources = new Map<string, string>([
      ["dometic-cfx3-35-product", "https://www.dometic.com/en-us/product/dometic-cfx3-35-9600024617"],
      ["dometic-cfx3-operating-manual", "https://www.dometic.com/externalassets/dometic-cfx3-45_9600024618_77453.pdf"],
      ["dometic-cfx5-45-product", "https://www.dometic.com/en-us/product/cfx5-45-electric-cooler-97000050755"],
      ["dometic-cfx5-operating-manual", "https://www.dometic.com/externalassets/dometic-cfx5-25-electric-cooler_9620015957_119335.pdf"],
      ["dometic-crx-pro-65-operating-manual", "https://media.dometic.com/externalassets/dometic-crx-pro-65_83815.pdf"],
      [
        "dometic-975-portable-toilet-product",
        "https://www.dometic.com/en-us/product/dometic-975-portable-toilet-with-mounting-brackets-9108552686?v=9108552685",
      ],
      [
        "dometic-970-series-portable-toilet-operating-manual",
        "https://www.dometic.com/externalassets/dometic-972-portable-toilet_9108552682_114646.pdf?ref=-170932578",
      ],
      ["thetford-porta-potti-365-support", "https://thetford.com/us/thetford-support/porta-potti-365/"],
      ["thetford-porta-potti-565-quick-start", "https://www.thetford.com/app/uploads/2025/01/QSG_Porta-Potti-565_EN_92122-0119.pdf"],
      ["thetford-aqua-magic-style-plus-owner-manual-42088f", "https://www.thetford.com/app/uploads/2024/07/42088F_AM6-OM.pdf"],
      ["greystone-24-slide-in-range-manual-ccd0007534", "https://support.lci1.com/documents/ccd-0007534"],
      ["greystone-17-2in1-range-ffd-manual-ccd0008338", "https://support.lci1.com/documents/ccd-0008338"],
      ["greystone-17-2in1-digital-range-manual-ccd0006126", "https://support.lci1.com/documents/ccd-0006126"],
      ["greystone-17-21-digital-range-manual-ccd0009625", "https://support.lci1.com/documents/ccd-0009625"],
      ["greystone-17-21-gas-range-manual-ccd0007530", "https://support.lci1.com/documents/ccd-0007530"],
      ["greystone-21-freestanding-digital-range-manual-ccd0008340", "https://support.lci1.com/documents/ccd-0008340"],
      ["greystone-17-inch-griddle-manual-ccd0007536", "https://support.lci1.com/documents/ccd-0007536"],
      ["greystone-2-burner-cooktop-bifold-manual-ccd0008143", "https://support.lci1.com/documents/ccd-0008143"],
      ["greystone-double-induction-hob-manual-ccd0008385", "https://support.lci1.com/documents/ccd-0008385"],
      ["greystone-cooktop-mwo-combo-manual-ccd0008348", "https://support.lci1.com/documents/ccd-0008348"],
      ["furrion-09-built-in-microwave-manual", "https://support.lci1.com/documents/furrion-09-built-in-mircrowave-oven-user-manual"],
      ["furrion-09-countertop-microwave-manual", "https://support.lci1.com/documents/furrion-09-countertop-microwave-oven"],
      [
        "furrion-15-otr-convection-microwave-user-manual",
        "https://support.lci1.com/documents/furrion-ort-convention-microwave-oven-user-manual",
      ],
      ["furrion-16-17-otr-nonconvection-user-manual-ccd0006073", "https://support.lci1.com/documents/ccd-0006073"],
      ["furrion-17-otr-air-fry-microwave-user-manual-ccd0010982", "https://support.lci1.com/documents/ccd-0010982"],
      ["aquahot-125-d02-use-care-guide", "https://library.aquahot.com/wp-content/uploads/2025/03/AHM-125-D02-Use-and-Care-Guide-5.6.24.pdf"],
      ["maxxair-maxxfan-deluxe-07500k-product", "https://www.maxxair.com/Products/fans/maxxfan-deluxe-00-07500K/"],
    ]);
    const expectedSymptoms = new Map<string, { sourceIds: string[]; requiredTerms: string[]; query: string }>([
      ["dometic-cfx3-35-model-app-prep", { sourceIds: ["dometic-cfx3-35-product"], requiredTerms: ["cfx3+35", "9600024617", "cfx335"], query: "dometic cfx3 35 9600024617 app prep" }],
      ["dometic-cfx3-battery-protection-storage-prep", { sourceIds: ["dometic-cfx3-operating-manual"], requiredTerms: ["cfx3+battery+protection", "cfx3+storage"], query: "dometic cfx3 battery protection storage prep" }],
      ["dometic-cfx5-45-app-power-prep", { sourceIds: ["dometic-cfx5-45-product"], requiredTerms: ["cfx5+45", "97000050755", "cfx545"], query: "dometic cfx5 45 97000050755 app power prep" }],
      ["dometic-cfx5-reset-battery-monitor-prep", { sourceIds: ["dometic-cfx5-operating-manual"], requiredTerms: ["cfx5+battery+monitor", "cfx5+reset"], query: "dometic cfx5 battery monitor reset prep" }],
      ["dometic-crx-pro-65-freezer-compartment-storage-prep", { sourceIds: ["dometic-crx-pro-65-operating-manual"], requiredTerms: ["crx+pro+65", "crx+0065t"], query: "dometic crx pro 65 crx 0065t freezer storage prep" }],
      ["dometic-975-portable-toilet-mounting-model-prep", { sourceIds: ["dometic-975-portable-toilet-product"], requiredTerms: ["dometic+975", "9108552686"], query: "dometic 975 9108552686 portable toilet mounting prep" }],
      ["dometic-970-series-portable-toilet-cleaning-storage-prep", { sourceIds: ["dometic-970-series-portable-toilet-operating-manual"], requiredTerms: ["970+portable+toilet", "975msd", "9108552682"], query: "dometic 970 portable toilet 975msd cleaning storage prep" }],
      ["thetford-porta-potti-365-level-indicator-storage-prep", { sourceIds: ["thetford-porta-potti-365-support"], requiredTerms: ["porta+potti+365", "365+level+indicator"], query: "thetford porta potti 365 level indicator storage prep" }],
      ["thetford-porta-potti-565-quick-start-electric-flush-prep", { sourceIds: ["thetford-porta-potti-565-quick-start"], requiredTerms: ["porta+potti+565", "565e+electric"], query: "thetford porta potti 565e electric flush quick start" }],
      ["thetford-aqua-magic-style-plus-cleaning-serial-prep", { sourceIds: ["thetford-aqua-magic-style-plus-owner-manual-42088f"], requiredTerms: ["style+plus", "42088f", "aqua+magic+style+plus"], query: "thetford aqua magic style plus 42088f serial cleaning prep" }],
      ["greystone-24-slide-in-range-service-prep", { sourceIds: ["greystone-24-slide-in-range-manual-ccd0007534"], requiredTerms: ["greystone+24+slide", "ccd0007534"], query: "greystone 24 slide in range ccd0007534 service prep" }],
      ["greystone-17-2in1-range-ffd-service-prep", { sourceIds: ["greystone-17-2in1-range-ffd-manual-ccd0008338"], requiredTerms: ["greystone+17+2in1+ffd", "ccd0008338"], query: "greystone 17 2in1 ffd range ccd0008338 prep" }],
      ["greystone-17-2in1-digital-range-control-prep", { sourceIds: ["greystone-17-2in1-digital-range-manual-ccd0006126"], requiredTerms: ["greystone+17+2in1+digital", "ccd0006126"], query: "greystone 17 2in1 digital range ccd0006126 control" }],
      ["greystone-17-21-digital-range-knob-control-prep", { sourceIds: ["greystone-17-21-digital-range-manual-ccd0009625"], requiredTerms: ["greystone+17+21+digital", "ccd0009625"], query: "greystone 17 21 digital range ccd0009625 knob control" }],
      ["greystone-17-21-gas-range-model-service-prep", { sourceIds: ["greystone-17-21-gas-range-manual-ccd0007530"], requiredTerms: ["greystone+17+21+gas+range", "ccd0007530"], query: "greystone 17 21 gas range ccd0007530 model service" }],
      ["greystone-21-freestanding-digital-range-drawer-prep", { sourceIds: ["greystone-21-freestanding-digital-range-manual-ccd0008340"], requiredTerms: ["greystone+21+freestanding+digital", "ccd0008340"], query: "greystone 21 freestanding digital range ccd0008340 drawer" }],
      ["greystone-17-inch-griddle-grease-storage-prep", { sourceIds: ["greystone-17-inch-griddle-manual-ccd0007536"], requiredTerms: ["greystone+17+griddle", "ccd0007536"], query: "greystone 17 inch griddle ccd0007536 grease storage" }],
      ["greystone-2-burner-cooktop-bifold-glass-prep", { sourceIds: ["greystone-2-burner-cooktop-bifold-manual-ccd0008143"], requiredTerms: ["greystone+2+burner+bifold", "ccd0008143"], query: "greystone 2 burner bifold glass ccd0008143 cooktop prep" }],
      ["greystone-double-induction-hob-cookware-prep", { sourceIds: ["greystone-double-induction-hob-manual-ccd0008385"], requiredTerms: ["greystone+double+induction", "ccd0008385"], query: "greystone double induction hob ccd0008385 cookware" }],
      ["greystone-cooktop-mwo-combo-service-prep", { sourceIds: ["greystone-cooktop-mwo-combo-manual-ccd0008348"], requiredTerms: ["greystone+cooktop+mwo", "ccd0008348"], query: "greystone cooktop mwo combo ccd0008348 service prep" }],
      ["furrion-09-built-in-microwave-service-prep", { sourceIds: ["furrion-09-built-in-microwave-manual"], requiredTerms: ["furrion+09+built+in", "imfha00116"], query: "furrion 09 built in microwave imfha00116 service prep" }],
      ["furrion-09-countertop-microwave-service-prep", { sourceIds: ["furrion-09-countertop-microwave-manual"], requiredTerms: ["furrion+09+countertop", "imfha00053"], query: "furrion 09 countertop microwave imfha00053 service prep" }],
      ["furrion-15-otr-convection-microwave-service-prep", { sourceIds: ["furrion-15-otr-convection-microwave-user-manual"], requiredTerms: ["furrion+15+otr+convection", "imfha00133"], query: "furrion 15 otr convection microwave imfha00133 service prep" }],
      ["furrion-16-17-otr-nonconvection-microwave-service-prep", { sourceIds: ["furrion-16-17-otr-nonconvection-user-manual-ccd0006073"], requiredTerms: ["furrion+16+17+otr", "ccd0006073"], query: "furrion 16 17 otr nonconvection microwave ccd0006073 prep" }],
      ["furrion-17-otr-air-fry-microwave-service-prep", { sourceIds: ["furrion-17-otr-air-fry-microwave-user-manual-ccd0010982"], requiredTerms: ["furrion+17+otr+air+fry", "ccd0010982"], query: "furrion 17 otr air fry microwave ccd0010982 prep" }],
      ["aquahot-125-d02-lcd-altitude-winterization-prep", { sourceIds: ["aquahot-125-d02-use-care-guide"], requiredTerms: ["125+d02", "ahm+125d", "5+6+24"], query: "aqua hot 125 d02 ahm 125d lcd altitude winterization" }],
      ["maxxair-maxxfan-deluxe-07500k-remote-thermostat-prep", { sourceIds: ["maxxair-maxxfan-deluxe-07500k-product"], requiredTerms: ["00+07500k", "maxxfan+deluxe+remote"], query: "maxxair maxxfan deluxe 00 07500k remote thermostat prep" }],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const newSlugs = new Set(expectedSymptoms.keys());
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|burner\s+(repair|work|service|port|assembly)|\borifice\b|\bcontrol board\b|\b120\s*vac\b|\b110\s*v\b|\bline-voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|remove.*toilet|replace.*valve|measure resistance|fuel nozzle|combustion|coolant pump|manual override|hydraulic work|hydraulic repair/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, expected] of expectedSymptoms) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(expected.sourceIds);
      expect(symptom?.searchRequiredTerms, symptomId).toEqual(expected.requiredTerms);
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
      expect(lookupSymptomGuides(index, expected.query)[0]?.slug, expected.query).toBe(symptomId);
    }

    for (const query of [
      "app setup",
      "battery protection",
      "owner manual",
      "portable toilet",
      "toilet",
      "range service",
      "gas range",
      "range hood",
      "microwave service",
      "microwave",
      "induction cooktop",
      "griddle storage",
      "griddle",
      "digital control",
      "control center",
      "manual lid",
      "service prep",
      "warranty",
      "freeze protection",
      "thermostat",
      "remote thermostat",
      "cooler",
      "winterization",
    ]) {
      expect(
        lookupSymptomGuides(index, query)
          .slice(0, 5)
          .map((symptom) => symptom.slug)
          .filter((slug) => newSlugs.has(slug)),
        query,
      ).toEqual([]);
    }
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds the Thetford, MaxxAir, Suburban, Aqua-Hot, Furrion, and Onan official-source gap-scan prep batch without code entries", () => {
    const expectedSources = new Map<string, string>([
      ["thetford-porta-potti-135-support", "https://www.thetford.com/us/thetford-support/porta-potti-135/"],
      ["thetford-porta-potti-335-support", "https://www.thetford.com/us/thetford-support/porta-potti-335/"],
      ["thetford-c220-series-support", "https://www.thetford.com/en/thetford-service-and-support/c220-series/"],
      ["thetford-c500-series-support", "https://www.thetford.com/en/thetford-service-and-support/c500-series/"],
      ["thetford-c260-user-manual-router", "https://www.thetford.com/en/document/um-c260/"],
      ["thetford-twusch-2025-compatibility-pdf", "https://www.thetford.com/app/uploads/2025/05/Thetford_Twusch_2025_EN.pdf"],
      ["maxxair-maxxfan-pivot-0061000-product", "https://www.maxxair.com/Products/fans/maxxfan-pivot-00-61000/"],
      ["maxxair-maxxfan-low-profile-04301m-product", "https://www.maxxair.com/products/fans/maxxfan-low-profile-00-04301M.aspx"],
      ["maxxair-maxxfan-low-profile-04401m-product", "https://www.maxxair.com/products/fans/maxxfan-low-profile-00-04401M.aspx"],
      ["maxxair-maxxfan-mini-deluxe-3807-product", "https://www.maxxair.com/Products/fans/maxxfan-mini-3807/"],
      ["maxxair-maxxfan-mini-deluxe-3857-product", "https://www.maxxair.com/Products/fans/maxxfan-mini-3857/"],
      ["maxxair-maxxfan-mini-plus-3851-product", "https://www.maxxair.com/Products/fans/maxxfan-mini-3851/"],
      ["maxxair-maxxfan-deluxe-05301k-product", "https://www.maxxair.com/products/fans/maxxfan-deluxe-00-05301K/"],
      ["maxxair-maxxfan-deluxe-06401k-product", "https://www.maxxair.com/products/fans/maxxfan-deluxe-00-06401K/"],
      ["maxxair-maxxfan-plus-04751ks-product", "https://www.maxxair.com/products/fans/maxxfan-plus-00-04751KS/"],
      ["maxxair-maxxfan-dome-03812b-product", "https://www.maxxair.com/products/fans/maxxfan-dome-00-03812B/"],
      ["maxxair-maxxfan-dome-plus-03810b-product", "https://www.maxxair.com/products/fans/maxxfan-dome-plus-00-03810B/"],
      [
        "suburban-saw6d-direct-fit-water-heater-product",
        "https://suburbanrv.com/water-heating/tank-water-heaters/direct-fit-replacement-water-heaters/advantage-direct-fit-water-heater/",
      ],
      ["suburban-23-elite-griddle-product", "https://suburbanrv.com/kitchen-galley/griddles/23-elite-series-griddle/"],
      ["suburban-23-griddle-bottle-adapter-product", "https://suburbanrv.com/kitchen-galley/griddles/23-gas-griddle-with-bottle-adapter/"],
      ["suburban-17-elite-plus-range-product", "https://suburbanrv.com/kitchen-galley/ranges/17-elite-series-plus-range/"],
      ["suburban-22-elite-plus-range-product", "https://suburbanrv.com/kitchen-galley/ranges/22-elite-series-plus-range/"],
      ["suburban-3-burner-slide-in-cooktop-product", "https://suburbanrv.com/kitchen-galley/cooktops/slide-in-cooktops/3-burner-slide-in-cooktop/"],
      [
        "suburban-double-element-induction-cooktop-product",
        "https://suburbanrv.com/kitchen-galley/cooktops/induction-cooktops/double-element-induction-cooktop/",
      ],
      ["aquahot-125g-product-page", "https://www.aquahot.com/products/rv/125G.aspx"],
      ["aquahot-200-series-use-care-guide", "https://www.aquahot.com/files/owners_manual/200-Series-UseandCare.pdf"],
      ["lippert-furrion-chill-ac-compatibility-page", "https://www.lippert.com/rv-camping/collections/furrion-rv-air-conditioners/compatibility"],
      ["furrion-chill-adb-manual-single-zone-control-product", "https://www.lippert.com/air-distribution-box-with-manual-single-zone-control-white-2021123818"],
      ["onan-qg4000i-owner-guide-0056746", "https://mart.cummins.com/imagelibrary/data/assetfiles/0056746.pdf"],
      ["onan-qd3200-spec-sheet-0058692", "https://mart.cummins.com/imagelibrary/data/assetfiles/0058692.pdf"],
    ]);
    const expectedSymptoms = new Map<string, { sourceIds: string[]; requiredTerms: string[]; query: string }>([
      [
        "thetford-porta-potti-135-bellows-storage-prep",
        {
          sourceIds: ["thetford-porta-potti-135-support"],
          requiredTerms: ["porta+potti+135", "bellows"],
          query: "thetford porta potti 135 bellows storage prep",
        },
      ],
      [
        "thetford-porta-potti-335-piston-pump-level-prep",
        {
          sourceIds: ["thetford-porta-potti-335-support"],
          requiredTerms: ["porta+potti+335", "piston+pump"],
          query: "thetford porta potti 335 piston pump level prep",
        },
      ],
      [
        "thetford-c220-cassette-toilet-model-manual-prep",
        {
          sourceIds: ["thetford-c220-series-support"],
          requiredTerms: ["c220"],
          query: "thetford c220 cassette toilet model manual prep",
        },
      ],
      [
        "thetford-c500-cassette-toilet-model-manual-prep",
        {
          sourceIds: ["thetford-c500-series-support"],
          requiredTerms: ["c500"],
          query: "thetford c500 cassette toilet model manual prep",
        },
      ],
      [
        "thetford-c260-user-manual-model-prep",
        {
          sourceIds: ["thetford-c260-user-manual-router"],
          requiredTerms: ["um+c260", "c260"],
          query: "thetford c260 user manual model prep",
        },
      ],
      [
        "thetford-twusch-compatibility-model-prep",
        {
          sourceIds: ["thetford-twusch-2025-compatibility-pdf"],
          requiredTerms: ["twusch+2025", "compatibility"],
          query: "thetford twusch 2025 compatibility model prep",
        },
      ],
      [
        "maxxair-maxxfan-pivot-0061000-keypad-prep",
        {
          sourceIds: ["maxxair-maxxfan-pivot-0061000-product"],
          requiredTerms: ["00+61000", "pivot"],
          query: "maxxair maxxfan pivot 00 61000 keypad prep",
        },
      ],
      [
        "maxxair-maxxfan-low-profile-04301m-model-prep",
        {
          sourceIds: ["maxxair-maxxfan-low-profile-04301m-product"],
          requiredTerms: ["00+04301m", "low+profile"],
          query: "maxxair maxxfan low profile 00 04301m model prep",
        },
      ],
      [
        "maxxair-maxxfan-low-profile-04401m-model-prep",
        {
          sourceIds: ["maxxair-maxxfan-low-profile-04401m-product"],
          requiredTerms: ["00+04401m", "low+profile"],
          query: "maxxair maxxfan low profile 00 04401m model prep",
        },
      ],
      [
        "maxxair-maxxfan-mini-deluxe-3807-remote-prep",
        {
          sourceIds: ["maxxair-maxxfan-mini-deluxe-3807-product"],
          requiredTerms: ["00+03807", "mini+deluxe"],
          query: "maxxair maxxfan mini deluxe 00 03807 remote prep",
        },
      ],
      [
        "maxxair-maxxfan-mini-deluxe-3857-remote-prep",
        {
          sourceIds: ["maxxair-maxxfan-mini-deluxe-3857-product"],
          requiredTerms: ["00+03857", "mini+deluxe"],
          query: "maxxair maxxfan mini deluxe 00 03857 remote prep",
        },
      ],
      [
        "maxxair-maxxfan-mini-plus-3851-model-prep",
        {
          sourceIds: ["maxxair-maxxfan-mini-plus-3851-product"],
          requiredTerms: ["mini+plus"],
          query: "maxxair maxxfan mini plus 00 03851 model prep",
        },
      ],
      [
        "maxxair-maxxfan-deluxe-05301k-exhaust-prep",
        {
          sourceIds: ["maxxair-maxxfan-deluxe-05301k-product"],
          requiredTerms: ["00+05301k", "deluxe"],
          query: "maxxair maxxfan deluxe 00 05301k exhaust prep",
        },
      ],
      [
        "maxxair-maxxfan-deluxe-06401k-exhaust-prep",
        {
          sourceIds: ["maxxair-maxxfan-deluxe-06401k-product"],
          requiredTerms: ["00+06401k", "deluxe"],
          query: "maxxair maxxfan deluxe 00 06401k exhaust prep",
        },
      ],
      [
        "maxxair-maxxfan-plus-04751ks-thermostat-prep",
        {
          sourceIds: ["maxxair-maxxfan-plus-04751ks-product"],
          requiredTerms: ["00+04751ks", "thermostat"],
          query: "maxxair maxxfan plus 00 04751ks thermostat prep",
        },
      ],
      [
        "maxxair-maxxfan-dome-03812b-model-prep",
        {
          sourceIds: ["maxxair-maxxfan-dome-03812b-product"],
          requiredTerms: ["00+03812b"],
          query: "maxxair maxxfan dome 00 03812b model prep",
        },
      ],
      [
        "maxxair-maxxfan-dome-plus-03810b-model-prep",
        {
          sourceIds: ["maxxair-maxxfan-dome-plus-03810b-product"],
          requiredTerms: ["00+03810b"],
          query: "maxxair maxxfan dome plus 00 03810b model prep",
        },
      ],
      [
        "suburban-saw6d-direct-fit-water-heater-prep",
        {
          sourceIds: ["suburban-saw6d-direct-fit-water-heater-product"],
          requiredTerms: ["saw6d", "direct+fit"],
          query: "suburban saw6d direct fit water heater prep",
        },
      ],
      [
        "suburban-23-elite-griddle-flare-storage-prep",
        {
          sourceIds: ["suburban-23-elite-griddle-product"],
          requiredTerms: ["23+elite+griddle", "3061a"],
          query: "suburban 3061a 23 elite griddle flare storage prep",
        },
      ],
      [
        "suburban-23-griddle-bottle-adapter-storage-prep",
        {
          sourceIds: ["suburban-23-griddle-bottle-adapter-product"],
          requiredTerms: ["23+gas+griddle", "4063a"],
          query: "suburban 4063a 23 gas griddle bottle adapter storage prep",
        },
      ],
      [
        "suburban-17-elite-plus-range-model-prep",
        {
          sourceIds: ["suburban-17-elite-plus-range-product"],
          requiredTerms: ["17+elite+plus"],
          query: "suburban 17 elite plus range model prep",
        },
      ],
      [
        "suburban-22-elite-plus-range-model-prep",
        {
          sourceIds: ["suburban-22-elite-plus-range-product"],
          requiredTerms: ["22+elite+plus"],
          query: "suburban 22 elite plus range model prep",
        },
      ],
      [
        "suburban-3-burner-slide-in-cooktop-flame-prep",
        {
          sourceIds: ["suburban-3-burner-slide-in-cooktop-product"],
          requiredTerms: ["3+burner+slide+in"],
          query: "suburban 3 burner slide in cooktop flame prep",
        },
      ],
      [
        "suburban-double-element-induction-cooktop-control-prep",
        {
          sourceIds: ["suburban-double-element-induction-cooktop-product"],
          requiredTerms: ["double+element+induction"],
          query: "suburban double element induction cooktop control prep",
        },
      ],
      [
        "aquahot-125g-gasoline-model-service-prep",
        {
          sourceIds: ["aquahot-125g-product-page"],
          requiredTerms: ["125g", "gasoline"],
          query: "aqua hot 125g gasoline model service prep",
        },
      ],
      [
        "aquahot-200-series-fluid-winterization-prep",
        {
          sourceIds: ["aquahot-200-series-use-care-guide"],
          requiredTerms: ["200+series", "use+and+care"],
          query: "aqua hot 200 series fluid winterization prep",
        },
      ],
      [
        "furrion-chill-ac-compatibility-control-prep",
        {
          sourceIds: ["lippert-furrion-chill-ac-compatibility-page"],
          requiredTerms: ["furrion+rv+air+conditioners", "compatibility"],
          query: "furrion chill ac compatibility control prep",
        },
      ],
      [
        "furrion-chill-adb-manual-single-zone-control-prep",
        {
          sourceIds: ["furrion-chill-adb-manual-single-zone-control-product"],
          requiredTerms: ["2021123818", "manual+single+zone"],
          query: "furrion chill adb manual single zone control 2021123818 prep",
        },
      ],
      [
        "onan-qg4000i-owner-guide-load-prep",
        {
          sourceIds: ["onan-qg4000i-owner-guide-0056746"],
          requiredTerms: ["qg+4000i", "0056746"],
          query: "onan qg4000i owner guide load 0056746 prep",
        },
      ],
      [
        "onan-qd3200-spec-sheet-model-prep",
        {
          sourceIds: ["onan-qd3200-spec-sheet-0058692"],
          requiredTerms: ["qd+3200", "0058692"],
          query: "onan qd3200 spec sheet model 0058692 prep",
        },
      ],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const newSlugs = new Set(expectedSymptoms.keys());
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|burner\s+(repair|work|service|port|assembly)|\borifice\b|\bcontrol board\b|\b120\s*vac\b|\b110\s*v\b|\bline-voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|remove.*toilet|replace.*valve|measure resistance|fuel nozzle|combustion|coolant pump|manual override|hydraulic work|hydraulic repair|macerator|internal plumbing/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, expected] of expectedSymptoms) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(expected.sourceIds);
      expect(symptom?.searchRequiredTerms, symptomId).toEqual(expected.requiredTerms);
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
      expect(lookupSymptomGuides(index, expected.query)[0]?.slug, expected.query).toBe(symptomId);
    }

    for (const query of [
      "warranty",
      "service prep",
      "owner manual",
      "model number",
      "control center",
      "microwave",
      "gas range",
      "refrigerator",
      "toilet",
      "fan",
      "furnace",
      "manual control",
      "generator",
      "hydronic",
      "remote",
      "thermostat",
      "storage",
      "recall",
      "single zone",
      "griddle",
      "gas oven",
      "manual library",
      "water heater",
      "cooktop",
      "air conditioner",
      "portable toilet",
      "cassette toilet",
    ]) {
      expect(
        lookupSymptomGuides(index, query)
          .slice(0, 5)
          .map((symptom) => symptom.slug)
          .filter((slug) => newSlugs.has(slug)),
        query,
      ).toEqual([]);
    }
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds the official Dometic Norcold Thetford Coleman Lippert Furrion Suburban Aqua-Hot and Onan prep batch without code entries", () => {
    const expectedSources = new Map<string, string>([
      ["dometic-find-a-dealer", "https://www.dometic.com/en-us/support/find-a-dealer"],
      ["dometic-contact-us-rv-van-support", "https://www.dometic.com/en-us/support/contact-us"],
      ["dometic-rv-van-toilets-category", "https://www.dometic.com/en-us/category/rv-and-van/toilets"],
      ["dometic-masterflush-7120-operating", "https://media.dometic.com/externalassets/dometic-masterflush-7120_9610007270_111263.pdf"],
      [
        "dometic-masterflush-8700-series-product-info",
        "https://media.dometic.com/externalassets/dometic-masterflush-8740_9600012036_113325.pdf?ref=-456850054",
      ],
      ["dometic-cfx5-series-landing", "https://www.dometic.com/en-us/lp/cfx5"],
      ["norcold-n1152-support", "https://www.thetford.com/us/thetford-support/n1152/"],
      ["norcold-n4141-support", "https://www.thetford.com/us/thetford-support/n4141/"],
      ["norcold-nr751-support", "https://www.thetford.com/us/thetford-support/nr751/"],
      ["norcold-lp-gas-refrigerators-product-group", "https://www.thetford.com/us/product-group/lp-gas-refrigerators/"],
      ["thetford-t2000-series-compressor-support", "https://www.thetford.com/en/thetford-service-and-support/t2000-series-compressor-refrigerator/"],
      ["thetford-t1000-series-compressor-support", "https://www.thetford.com/en/thetford-service-and-support/t1000-series-compressor-refrigerator/"],
      ["thetford-c2-cassette-toilet-support", "https://www.thetford.com/us/thetford-support/c2-cassette-toilet/"],
      ["thetford-c4-cassette-toilet-support", "https://www.thetford.com/us/thetford-support/c4-cassette-toilet/"],
      ["thetford-campa-potti-mt-support", "https://www.thetford.com/us/thetford-support/campa-potti-mt/"],
      ["coleman-mach-air-conditioners-router", "https://coleman-mach.com/products/air-conditioners/default.aspx"],
      ["coleman-mach-thermostats-router", "https://coleman-mach.com/products/thermostats/default.aspx"],
      ["coleman-mach-document-library", "https://library.coleman-mach.com/"],
      ["coleman-mach-specialty-units-product", "https://coleman-mach.com/products/air-conditioners/specialty-units/"],
      ["lippert-support-document-library", "https://support.lci1.com/documents/"],
      ["lippert-find-a-dealer-locator", "https://www.lippert.com/find-a-dealer"],
      ["furrion-20cuft-refrigerator-manual-ccd0005599", "https://support.lci1.com/documents/ccd-0005599"],
      ["furrion-20-6-side-by-side-refrigerator-manual-ccd0009671", "https://support.lci1.com/documents/ccd-0009671"],
      ["furrion-fcr10dcgfa-storage-qr192", "https://support.lci1.com/documents/ccd-0008585"],
      ["furrion-furnace-v2-manual-ccd0009365", "https://support.lci1.com/documents/ccd-0009365"],
      ["greystone-17-21-digital-range-ffd-spec-ccd0008655", "https://support.lci1.com/documents/ccd-0008655"],
      ["suburban-drop-in-2-burner-product", "https://suburbanrv.com/kitchen-galley/cooktops/drop-in-cooktops/drop-in-2-burner/"],
      ["maxxair-original-maxxfan-00a04301k-product", "https://www.maxxair.com/Products/fans/maxxfan-00A04301K/"],
      ["aquahot-175-product-page", "https://www.aquahot.com/products/rv/175.aspx"],
      [
        "onan-qg6500-lp-shop-product",
        "https://shop.cummins.com/SC/product/onan-qg-6500-lp-vapor-rv-generator-with-30a-breakers-a063b875/01t4N0000048nhAQAQ",
      ],
    ]);
    const expectedSymptoms = new Map<string, { sourceIds: string[]; requiredTerms: string[]; query: string }>([
      ["dometic-service-provider-prep", { sourceIds: ["dometic-find-a-dealer"], requiredTerms: ["dometic+dealer"], query: "dometic find a dealer service provider prep" }],
      ["dometic-rv-van-support-contact-prep", { sourceIds: ["dometic-contact-us-rv-van-support"], requiredTerms: ["dometic+contact"], query: "dometic rv van support contact prep" }],
      ["dometic-toilet-family-model-prep", { sourceIds: ["dometic-rv-van-toilets-category"], requiredTerms: ["dometic+toilets"], query: "dometic rv van toilets family model prep" }],
      ["dometic-masterflush-7100-control-prep", { sourceIds: ["dometic-masterflush-7120-operating"], requiredTerms: ["masterflush+7120", "9610007270"], query: "dometic masterflush 7120 9610007270 control prep" }],
      ["dometic-masterflush-8700-wall-switch-prep", { sourceIds: ["dometic-masterflush-8700-series-product-info"], requiredTerms: ["masterflush+8740", "9600012036"], query: "dometic masterflush 8740 9600012036 wall switch prep" }],
      ["dometic-cfx5-app-power-prep", { sourceIds: ["dometic-cfx5-series-landing"], requiredTerms: ["dometic+cfx5"], query: "dometic cfx5 app power prep" }],
      ["norcold-n1152-dc-fridge-service-prep", { sourceIds: ["norcold-n1152-support"], requiredTerms: ["n1152"], query: "norcold n1152 dc fridge service prep" }],
      ["norcold-n4141-model-control-prep", { sourceIds: ["norcold-n4141-support"], requiredTerms: ["n4141"], query: "norcold n4141 model control prep" }],
      ["norcold-nr751-acdc-fridge-service-prep", { sourceIds: ["norcold-nr751-support"], requiredTerms: ["nr751"], query: "norcold nr751 ac dc fridge service prep" }],
      ["norcold-lp-gas-fridge-family-prep", { sourceIds: ["norcold-lp-gas-refrigerators-product-group"], requiredTerms: ["norcold+lp+gas+refrigerators"], query: "norcold lp gas refrigerators family prep" }],
      ["thetford-t2000-warning-code-prep", { sourceIds: ["thetford-t2000-series-compressor-support"], requiredTerms: ["t2000+warning+code"], query: "thetford t2000 warning code prep" }],
      ["thetford-t1000-compressor-fridge-storage-prep", { sourceIds: ["thetford-t1000-series-compressor-support"], requiredTerms: ["t1000+compressor+refrigerator"], query: "thetford t1000 compressor refrigerator storage prep" }],
      ["thetford-c2-cassette-toilet-model-prep", { sourceIds: ["thetford-c2-cassette-toilet-support"], requiredTerms: ["thetford+c2+cassette"], query: "thetford c2 cassette toilet model prep" }],
      ["thetford-c4-cassette-toilet-model-prep", { sourceIds: ["thetford-c4-cassette-toilet-support"], requiredTerms: ["thetford+c4+cassette"], query: "thetford c4 cassette toilet model prep" }],
      ["thetford-campa-potti-mt-storage-service-prep", { sourceIds: ["thetford-campa-potti-mt-support"], requiredTerms: ["thetford+campa+potti+mt"], query: "thetford campa potti mt storage service prep" }],
      ["coleman-mach-ac-family-model-prep", { sourceIds: ["coleman-mach-air-conditioners-router"], requiredTerms: ["coleman+mach+air+conditioners"], query: "coleman mach air conditioners family model prep" }],
      ["coleman-mach-thermostat-family-control-prep", { sourceIds: ["coleman-mach-thermostats-router"], requiredTerms: ["coleman+mach+thermostats"], query: "coleman mach thermostats family control prep" }],
      ["coleman-mach-document-library-model-manual-prep", { sourceIds: ["coleman-mach-document-library"], requiredTerms: ["coleman+mach+document+library"], query: "coleman mach document library model manual prep" }],
      ["coleman-mach-specialty-units-model-prep", { sourceIds: ["coleman-mach-specialty-units-product"], requiredTerms: ["coleman+mach+specialty+units"], query: "coleman mach specialty units model prep" }],
      ["lippert-document-library-source-prep", { sourceIds: ["lippert-support-document-library"], requiredTerms: ["lippert+document"], query: "lippert document library source prep" }],
      ["lippert-dealer-locator-service-routing-prep", { sourceIds: ["lippert-find-a-dealer-locator"], requiredTerms: ["lippert+find+a+dealer"], query: "lippert find a dealer service routing prep" }],
      ["furrion-20cuft-refrigerator-model-storage-prep", { sourceIds: ["furrion-20cuft-refrigerator-manual-ccd0005599"], requiredTerms: ["furrion+20+cu+ft", "ccd+0005599"], query: "furrion 20 cu ft refrigerator ccd 0005599 model storage prep" }],
      ["furrion-20-6-side-by-side-refrigerator-service-prep", { sourceIds: ["furrion-20-6-side-by-side-refrigerator-manual-ccd0009671"], requiredTerms: ["furrion+20+6", "ccd+0009671"], query: "furrion 20.6 side by side refrigerator ccd 0009671 service prep" }],
      [
        "furrion-fcr10dcgfa-storage-reset-prep",
        {
          sourceIds: ["furrion-fcr10dcgfa-storage-qr192", "furrion-fcr10dcgfa-storage-reset-video"],
          requiredTerms: ["fcr10dc", "qr+192", "fcr10dcgfa+proper+storage", "fcr10dcgfa+reset"],
          query: "furrion fcr10dc gfa qr 192 storage reset prep",
        },
      ],
      ["furrion-furnace-v2-model-shutdown-service-prep", { sourceIds: ["furrion-furnace-v2-manual-ccd0009365"], requiredTerms: ["furrion+furnace+v2", "ccd+0009365"], query: "furrion furnace v2 ccd 0009365 model shutdown service prep" }],
      ["greystone-17-21-digital-range-ffd-model-prep", { sourceIds: ["greystone-17-21-digital-range-ffd-spec-ccd0008655"], requiredTerms: ["greystone+digital+range", "ccd+0008655"], query: "greystone 17 21 digital range ffd ccd 0008655 model prep" }],
      ["suburban-drop-in-2-burner-model-service-prep", { sourceIds: ["suburban-drop-in-2-burner-product"], requiredTerms: ["suburban+drop+in+2+burner"], query: "suburban drop in 2 burner cooktop model service prep" }],
      ["maxxair-original-maxxfan-00a04301k-control-prep", { sourceIds: ["maxxair-original-maxxfan-00a04301k-product"], requiredTerms: ["00a04301k", "maxxair+original+maxxfan"], query: "maxxair original maxxfan 00a04301k control prep" }],
      ["aquahot-175-controller-service-prep", { sourceIds: ["aquahot-175-product-page"], requiredTerms: ["aqua+hot+175"], query: "aqua hot 175 controller service prep" }],
      ["onan-qg6500-lp-gsn-warranty-prep", { sourceIds: ["onan-qg6500-lp-shop-product"], requiredTerms: ["qg+6500", "a063b875"], query: "onan qg 6500 lp a063b875 gsn warranty prep" }],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const newSlugs = new Set(expectedSymptoms.keys());
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|burner\s+(repair|work|service|port|assembly)|\borifice\b|\bcontrol[- ]board\b|\b120\s*vac\b|\b110\s*v\b|\bline[- ]voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|remove.*toilet|replace.*valve|measure resistance|fuel nozzle|combustion|coolant pump|manual override|hydraulic work|hydraulic repair|macerator|internal plumbing|seal removal|compressor repair|pump service/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, expected] of expectedSymptoms) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(expected.sourceIds);
      expect(symptom?.searchRequiredTerms, symptomId).toEqual(expected.requiredTerms);
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
      expect(lookupSymptomGuides(index, expected.query)[0]?.slug, expected.query).toBe(symptomId);
    }

    for (const query of [
      "warranty",
      "service prep",
      "owner manual",
      "model number",
      "control center",
      "gas range",
      "refrigerator",
      "toilet",
      "fan",
      "furnace",
      "manual control",
      "generator",
      "hydronic",
      "remote",
      "thermostat",
      "storage",
      "recall",
      "single zone",
      "gas oven",
      "manual library",
      "water heater",
      "cooktop",
      "air conditioner",
      "portable toilet",
      "cassette toilet",
      "dealer locator",
      "find dealer",
      "find a dealer",
      "contact us",
      "documents",
      "document library",
      "toilets",
      "air conditioners",
      "thermostats",
      "specialty units",
      "20 cu ft",
      "20.6 refrigerator",
      "furnace v2",
      "digital range",
      "drop in 2 burner",
      "175",
    ]) {
      expect(
        lookupSymptomGuides(index, query)
          .slice(0, 5)
          .map((symptom) => symptom.slug)
          .filter((slug) => newSlugs.has(slug)),
        query,
      ).toEqual([]);
    }
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds the official Dometic Thetford Norcold Coleman MaxxAir Suburban Aqua-Hot Furrion Greystone Girard and Onan prep batch without code entries", () => {
    const expectedSources = new Map<string, string>([
      ["dometic-fa25-fantastic-vent-drydock-model-control-prep", "https://www.dometic.com/en-us/lp/rv-ventfans-essential"],
      ["dometic-fa75-fantastic-vent-complete-control-prep", "https://www.dometic.com/en-us/lp/rv-ventfans-complete"],
      ["dometic-fa95-fantastic-vent-platinum-control-prep", "https://www.dometic.com/en-us/lp/rv-ventfans-platinum"],
      ["dometic-400-401-essential-toilet-model-fit-prep", "https://www.dometic.com/en-us/lp/rv-toilets-essential"],
      ["dometic-410-411-complete-toilet-model-fit-prep", "https://www.dometic.com/en-us/lp/rv-toilets-complete"],
      ["thetford-porta-potti-320-550-storage-maintenance-prep", "https://www.thetford.com/us/thetford-support/porta-potti-320-345-365-550/"],
      ["thetford-porta-potti-555-735-flush-storage-prep", "https://www.thetford.com/us/thetford-support/porta-potti-555-565-735/"],
      ["thetford-porta-potti-260b-model-storage-prep", "https://www.thetford.com/us/thetford-support/porta-potti-260b/"],
      ["thetford-porta-potti-465-msd-electric-flush-prep", "https://www.thetford.com/us/thetford-support/porta-potti-465-465-msd/"],
      ["norcold-polar-n8x-hts-service-routing-prep", "https://www.thetford.com/us/thetford-support/n8x/"],
      ["coleman-mach-quiet-mach-10-model-control-prep", "https://coleman-mach.com/products/air-conditioners/quiet-series-mach-10/"],
      ["coleman-mach-quiet-mach-15-model-service-prep", "https://coleman-mach.com/products/air-conditioners/quiet-series-mach-15/"],
      ["coleman-mach-soft-start-kit-breaker-trip-prep", "https://coleman-mach.com/products/climate-control-accessories/soft-start-kit/"],
      ["coleman-mach-parkpac-36413-012-service-prep", "https://coleman-mach.com/products/air-conditioners/specialty-units-parkpac-air-conditioner/"],
      ["maxxair-00a04401k-original-maxxfan-control-prep", "https://www.maxxair.com/products/fans/maxxfan-00A04401K/"],
      ["maxxair-00a04501k-original-maxxfan-model-prep", "https://www.maxxair.com/products/fans/maxxfan-00A04501K/"],
      ["maxxair-00-04050k-maxxfan-plus-control-prep", "https://www.maxxair.com/products/fans/maxxfan-plus-00-04050K/"],
      ["suburban-2938abk-drop-in-3-burner-service-prep", "https://suburbanrv.com/kitchen-galley/cooktops/drop-in-cooktops/drop-in-3-burner/"],
      ["suburban-3907a-air-fryer-power-service-prep", "https://suburbanrv.com/kitchen-galley/air-fryers/17-air-fryer-black/"],
      ["aquahot-450d-model-energy-source-prep", "https://www.aquahot.com/products/rv/450D.aspx"],
      ["aquahot-600d-model-energy-source-prep", "https://www.aquahot.com/products/rv/600D.aspx"],
      ["furrion-furnace-v1-model-control-service-prep", "https://support.lci1.com/documents/ccd-0006025"],
      ["furrion-furnace-e1-error-service-prep", "https://support.lci1.com/videos/e1-error-code-on-furrion-furnace"],
      ["furrion-furnace-e4-error-service-prep", "https://support.lci1.com/videos/e4-error-code-on-furrion-furnace"],
      ["furrion-fho23sacrv-range-hood-filter-control-prep", "https://support.lci1.com/documents/ccd-0010314"],
      ["greystone-09-microwave-control-label-service-prep", "https://support.lci1.com/documents/ccd-0008905"],
      ["greystone-16-1000w-microwave-control-service-prep", "https://support.lci1.com/documents/ccd-0009770"],
      ["greystone-electric-fireplace-model-control-routing", "https://support.lci1.com/greystone-fireplaces"],
      ["girard-tankless-e0-error-service-prep", "https://support.lci1.com/videos/e0-error-code-on-girard-tankless-water-heater"],
      ["girard-tankless-e9-error-service-prep", "https://support.lci1.com/videos/e9-error-code-on-girard-tankless-water-heater"],
      ["onan-rv-generator-accessory-compatibility-service-prep", "https://mart.cummins.com/imagelibrary/data/assetfiles/0058349.pdf"],
      ["onan-p2500i-led-display-storage-service-prep", "https://www.cummins.com/sites/default/files/2025-04/p2500i-owners-manual.pdf"],
    ]);
    const expectedSymptoms = new Map<string, { sourceIds: string[]; requiredTerms: string[]; query: string }>(
      Array.from(expectedSources.keys()).map((id) => [
        id,
        {
          sourceIds: [id],
          requiredTerms: {
            "dometic-fa25-fantastic-vent-drydock-model-control-prep": ["fa25", "fan+tastic+vent+drydock"],
            "dometic-fa75-fantastic-vent-complete-control-prep": ["fa75", "fantastic+vent+complete"],
            "dometic-fa95-fantastic-vent-platinum-control-prep": ["fa95", "fantastic+vent+platinum"],
            "dometic-400-401-essential-toilet-model-fit-prep": ["dometic+400", "dometic+401", "essential+toilet"],
            "dometic-410-411-complete-toilet-model-fit-prep": ["dometic+410", "dometic+411", "complete+toilet"],
            "thetford-porta-potti-320-550-storage-maintenance-prep": ["porta+potti+320", "porta+potti+550"],
            "thetford-porta-potti-555-735-flush-storage-prep": ["porta+potti+555", "porta+potti+735"],
            "thetford-porta-potti-260b-model-storage-prep": ["porta+potti+260b"],
            "thetford-porta-potti-465-msd-electric-flush-prep": ["porta+potti+465", "465+msd"],
            "norcold-polar-n8x-hts-service-routing-prep": ["polar+n8x", "n8x+hts"],
            "coleman-mach-quiet-mach-10-model-control-prep": [
              "quiet+mach+10",
              "35003+0794",
              "35203+0754",
              "35203+0993",
            ],
            "coleman-mach-quiet-mach-15-model-service-prep": [
              "quiet+mach+15",
              "38204+0660",
              "38204+0690",
              "38209+0660",
            ],
            "coleman-mach-soft-start-kit-breaker-trip-prep": ["soft+start+kit", "1497+3601"],
            "coleman-mach-parkpac-36413-012-service-prep": ["parkpac", "36413+012"],
            "maxxair-00a04401k-original-maxxfan-control-prep": ["00a04401k", "original+maxxfan"],
            "maxxair-00a04501k-original-maxxfan-model-prep": ["00a04501k", "original+maxxfan"],
            "maxxair-00-04050k-maxxfan-plus-control-prep": ["00+04050k", "maxxfan+plus"],
            "suburban-2938abk-drop-in-3-burner-service-prep": ["2938abk", "triple+burner+propane+drop+in"],
            "suburban-3907a-air-fryer-power-service-prep": ["3907a+17", "17+air+fryer", "3907a+black+glass"],
            "aquahot-450d-model-energy-source-prep": ["450d", "ahe+450"],
            "aquahot-600d-model-energy-source-prep": ["600d", "ahe+600"],
            "furrion-furnace-v1-model-control-service-prep": ["im+fha00127", "furrion+furnace+v1"],
            "furrion-furnace-e1-error-service-prep": ["furrion+furnace+e1"],
            "furrion-furnace-e4-error-service-prep": ["furrion+furnace+e4"],
            "furrion-fho23sacrv-range-hood-filter-control-prep": ["fho23sacrv"],
            "greystone-09-microwave-control-label-service-prep": [
              "greystone+0+9+microwave",
              "greystone+09+microwave",
              "ccd+0008905",
            ],
            "greystone-16-1000w-microwave-control-service-prep": [
              "greystone+1+6+microwave",
              "greystone+16+microwave",
              "ccd+0009770",
            ],
            "greystone-electric-fireplace-model-control-routing": ["greystone+fireplace", "60+inch+electric"],
            "girard-tankless-e0-error-service-prep": ["girard+tankless+e0"],
            "girard-tankless-e9-error-service-prep": ["girard+tankless+e9"],
            "onan-rv-generator-accessory-compatibility-service-prep": ["f+0832e", "0058349"],
            "onan-p2500i-led-display-storage-service-prep": ["p2500i", "a062r850"],
          }[id] ?? [],
          query: {
            "dometic-fa25-fantastic-vent-drydock-model-control-prep": "dometic fa25 fan tastic vent drydock model control prep",
            "dometic-fa75-fantastic-vent-complete-control-prep": "dometic fa75 fan tastic vent complete drydock smart control prep",
            "dometic-fa95-fantastic-vent-platinum-control-prep": "dometic fa95 fan tastic vent platinum drydock feature prep",
            "dometic-400-401-essential-toilet-model-fit-prep": "dometic 400 401 essential toilet model fit prep",
            "dometic-410-411-complete-toilet-model-fit-prep": "dometic 410 411 complete toilet warranty prep",
            "thetford-porta-potti-320-550-storage-maintenance-prep": "thetford porta potti 320 550 storage maintenance prep",
            "thetford-porta-potti-555-735-flush-storage-prep": "thetford porta potti 555 735 flush storage prep",
            "thetford-porta-potti-260b-model-storage-prep": "thetford porta potti 260b model storage prep",
            "thetford-porta-potti-465-msd-electric-flush-prep": "thetford porta potti 465 msd electric flush service prep",
            "norcold-polar-n8x-hts-service-routing-prep": "norcold polar n8x hts service routing prep",
            "coleman-mach-quiet-mach-10-model-control-prep": "coleman mach quiet mach 10 35003 0794 model control prep",
            "coleman-mach-quiet-mach-15-model-service-prep": "coleman mach quiet mach 15 38204 0660 service prep",
            "coleman-mach-soft-start-kit-breaker-trip-prep": "coleman mach soft start kit 1497 3601 breaker trip prep",
            "coleman-mach-parkpac-36413-012-service-prep": "coleman mach parkpac 36413 012 service prep",
            "maxxair-00a04401k-original-maxxfan-control-prep": "maxxair 00a04401k original maxxfan smoke 4 speed control prep",
            "maxxair-00a04501k-original-maxxfan-model-prep": "maxxair 00a04501k original maxxfan black 4 speed model prep",
            "maxxair-00-04050k-maxxfan-plus-control-prep": "maxxair 00 04050k maxxfan plus 10 speed smoke control prep",
            "suburban-2938abk-drop-in-3-burner-service-prep": "suburban 2938abk triple burner propane drop in cooktop service prep",
            "suburban-3907a-air-fryer-power-service-prep": "suburban 3907a 17 air fryer black glass power service prep",
            "aquahot-450d-model-energy-source-prep": "aqua hot 450d ahe 450 tribridhot diesel energy source prep",
            "aquahot-600d-model-energy-source-prep": "aqua hot 600d ahe 600 diesel 600 series energy source prep",
            "furrion-furnace-v1-model-control-service-prep": "furrion furnace 20k 30k 35k im fha00127 model thermostat service prep",
            "furrion-furnace-e1-error-service-prep": "furrion furnace e1 error code service prep",
            "furrion-furnace-e4-error-service-prep": "furrion furnace e4 error code service prep",
            "furrion-fho23sacrv-range-hood-filter-control-prep": "furrion fho23sacrv range hood 12v filter control prep",
            "greystone-09-microwave-control-label-service-prep": "greystone 0.9 microwave ccd 0008905 control label prep",
            "greystone-16-1000w-microwave-control-service-prep": "greystone 1.6 1000 watt microwave ccd 0009770 controls service prep",
            "greystone-electric-fireplace-model-control-routing": "greystone fireplace 26 inch 60 inch electric support routing",
            "girard-tankless-e0-error-service-prep": "girard tankless water heater e0 service prep",
            "girard-tankless-e9-error-service-prep": "girard tankless water heater e9 service prep",
            "onan-rv-generator-accessory-compatibility-service-prep": "cummins onan rv accessories f 0832e 0058349 breaker compatibility prep",
            "onan-p2500i-led-display-storage-service-prep": "onan p2500i a062r850 led display owner manual storage service prep",
          }[id] ?? id,
        },
      ]),
    );
    const newSourceIds = Array.from(expectedSources.keys());
    const newSlugs = new Set(expectedSymptoms.keys());
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|burner\s+(repair|work|service|port|assembly)|\borifice\b|\bcontrol[- ]board\b|\b120\s*vac\b|\b110\s*v\b|\bline[- ]voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|remove.*toilet|replace.*valve|measure resistance|fuel nozzle|combustion|coolant pump|manual override|hydraulic work|hydraulic repair|macerator|internal plumbing|seal removal|compressor repair|pump service|magnetron|capacitor|door switch/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, expected] of expectedSymptoms) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(expected.sourceIds);
      expect(symptom?.searchRequiredTerms, symptomId).toEqual(expected.requiredTerms);
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
      expect(lookupSymptomGuides(index, expected.query)[0]?.slug, expected.query).toBe(symptomId);
    }

    for (const [query, slug] of [
      ["dometic 400 toilet", "dometic-400-401-essential-toilet-model-fit-prep"],
      ["dometic 411 toilet", "dometic-410-411-complete-toilet-model-fit-prep"],
      ["coleman mach 35203 0754", "coleman-mach-quiet-mach-10-model-control-prep"],
      ["coleman mach 38209 0660", "coleman-mach-quiet-mach-15-model-service-prep"],
      ["suburban 3907a 17 air fryer black glass", "suburban-3907a-air-fryer-power-service-prep"],
      ["greystone 09 microwave control model label service prep", "greystone-09-microwave-control-label-service-prep"],
      ["greystone 16 microwave 1000 watt control service prep", "greystone-16-1000w-microwave-control-service-prep"],
    ]) {
      expect(lookupSymptomGuides(index, query)[0]?.slug, query).toBe(slug);
    }

    for (const query of [
      "warranty",
      "service prep",
      "owner manual",
      "model number",
      "control center",
      "toilet",
      "fan",
      "furnace",
      "manual control",
      "generator",
      "hydronic",
      "remote",
      "thermostat",
      "storage",
      "recall",
      "water heater",
      "cooktop",
      "air conditioner",
      "microwave",
      "fireplace",
      "range hood",
      "error code",
      "breaker trip",
      "electric flush",
      "diesel",
      "black glass",
    ]) {
      expect(
        lookupSymptomGuides(index, query)
          .slice(0, 5)
          .map((symptom) => symptom.slug)
          .filter((slug) => newSlugs.has(slug)),
        query,
      ).toEqual([]);
    }
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds the official CFX5 Thetford Norcold Coleman Suburban Aqua-Hot Furrion Greystone Girard MaxxAir and Onan prep batch without code entries", () => {
    const expectedSources = new Map<string, string>([
      ["dometic-cfx5-alert-voltage-low-service-prep", "https://support.dometic.com/en/cfx5-coolers/ALERT-Voltage-low-6276"],
      ["dometic-cfx5-warning-33-compressor-start-fail", "https://support.dometic.com/en/cfx5-coolers/WARNING-33-Compressor-start-fail-96cf"],
      [
        "dometic-cfx5-app-authentication-connection-prep",
        "https://support.dometic.com/en/cfx5-coolers/Authentication-problem-message-when-trying-to-connect-to-my-cooler-7e57",
      ],
      ["dometic-cfx5-battery-drain-protection-prep", "https://support.dometic.com/en/cfx5-coolers/Flattening-batteries-2b61"],
      [
        "dometic-freshjet-constant-shutoff-service-prep",
        "https://support.dometic.com/en/freshjet-ac/My-roof-air-conditioner-constantly-switches-itself-off-7ab7",
      ],
      ["thetford-campa-potti-xg-storage-level-prep", "https://www.thetford.com/us/thetford-support/campa-potti-xg/"],
      ["thetford-porta-potti-155-bellows-storage-prep", "https://www.thetford.com/us/thetford-support/porta-potti-155-155sl/"],
      ["thetford-c250-cassette-model-label-service-prep", "https://www.thetford.com/en/thetford-service-and-support/c250-series/"],
      ["thetford-c260-electric-ventilator-filter-prep", "https://www.thetford.com/en/accessory/electric-ventilator-c260/"],
      ["norcold-dc740-model-label-cooling-service-prep", "https://www.thetford.com/us/thetford-support/dc740/"],
      ["norcold-dc751-model-label-cooling-service-prep", "https://www.thetford.com/us/thetford-support/dc751/"],
      [
        "norcold-de-ev-acdc-refrigerator-service-prep",
        "https://www.thetford.com/us/thetford-support/de0041-ev0041-de0061-ev0061/",
      ],
      ["maxxair-maxxfan-plus-04002k-control-model-prep", "https://www.maxxair.com/products/fans/maxxfan-plus-00-04002K/"],
      ["maxxair-maxxfan-deluxe-05100k-thermostat-control-prep", "https://www.maxxair.com/products/fans/maxxfan-deluxe-00-05100K/"],
      ["maxxair-maxx-i-00933066-cover-fit-service-prep", "https://www.maxxair.com/products/covers/maxx-i-00-933066/"],
      ["maxxair-maxx-ii-00933083-cover-fit-service-prep", "https://www.maxxair.com/Products/covers/maxx-ii-00-933083/"],
      ["coleman-bluetooth-ceiling-assembly-app-control-prep", "https://coleman-mach.com/products/ceiling-assemblies/bluetooth/"],
      ["coleman-deluxe-chillgrille-filter-control-prep", "https://coleman-mach.com/products/ceiling-assemblies/deluxe-chillgrille/"],
      ["coleman-electric-heat-strip-mode-service-prep", "https://coleman-mach.com/products/ceiling-assemblies/electric-heat-strips/"],
      ["suburban-17-elite-range-model-flame-prep", "https://suburbanrv.com/kitchen-galley/ranges/17-elite-series-range/"],
      ["suburban-22-air-fryer-power-control-prep", "https://suburbanrv.com/kitchen-galley/air-fryers/22-air-fryer-black/"],
      [
        "suburban-st42-tankless-model-control-prep",
        "https://suburbanrv.com/water-heating/tankless-water-heaters/st-water-heaters/st42-water-heater/",
      ],
      [
        "suburban-4-gallon-dsi-water-heater-prep",
        "https://suburbanrv.com/water-heating/tank-water-heaters/advantage-water-heaters/4-gallon-tank/",
      ],
      [
        "suburban-single-induction-cookware-power-prep",
        "https://suburbanrv.com/kitchen-galley/cooktops/induction-cooktops/single-element-induction-cooktop/",
      ],
      ["aquahot-faq-antifreeze-ltco-service-prep", "https://www.aquahot.com/faqs.aspx"],
      ["aquahot-annual-service-kit-model-prep", "https://www.aquahot.com/products/rv/annual-service-kits.aspx"],
      ["aquahot-glenwood-floor-control-prep", "https://www.aquahot.com/products/rv/glenwood-flooring-system.aspx"],
      ["furrion-15-convection-microwave-control-prep", "https://support.lci1.com/documents/ccd-0009356"],
      ["furrion-17-range-air-fry-control-prep", "https://support.lci1.com/documents/ccd-0010484"],
      ["greystone-26-fireplace-control-prep", "https://support.lci1.com/documents/ccd-0007546"],
      ["greystone-25-combo-griddle-storage-prep", "https://support.lci1.com/documents/ccd-0009781"],
      ["greystone-double-induction-hob-power-prep", "https://support.lci1.com/documents/ccd-0009481"],
      [
        "girard-tankless-e1-e2-service-prep",
        "https://support.lci1.com/videos/e1-and-e2-error-code-on-girard-tankless-water-heater",
      ],
      ["onan-rv-generator-gsn-model-family-prep", "https://shop.cummins.com/SC/category/brands/onan/onan-rv-generators/0ZG4N0000004G2hWAE"],
    ]);
    const expectedSymptoms = new Map<string, { sourceIds: string[]; requiredTerms: string[]; query: string }>(
      Array.from(expectedSources.keys()).map((id) => [
        id,
        {
          sourceIds: [id],
          requiredTerms: {
            "dometic-cfx5-alert-voltage-low-service-prep": ["cfx5+voltage+low", "alert+voltage+low"],
            "dometic-cfx5-warning-33-compressor-start-fail": ["cfx5+warning+33", "compressor+start+fail"],
            "dometic-cfx5-app-authentication-connection-prep": ["cfx5+authentication", "cfx5+app+connect"],
            "dometic-cfx5-battery-drain-protection-prep": ["cfx5+flattening+batteries", "battery+protection"],
            "dometic-freshjet-constant-shutoff-service-prep": ["freshjet+constantly+switches", "roof+air+conditioner+switches+off"],
            "thetford-campa-potti-xg-storage-level-prep": ["campa+potti+xg"],
            "thetford-porta-potti-155-bellows-storage-prep": ["porta+potti+155", "155sl"],
            "thetford-c250-cassette-model-label-service-prep": ["c250", "c250+series"],
            "thetford-c260-electric-ventilator-filter-prep": ["c260+electric+ventilator"],
            "norcold-dc740-model-label-cooling-service-prep": ["dc740"],
            "norcold-dc751-model-label-cooling-service-prep": ["dc751"],
            "norcold-de-ev-acdc-refrigerator-service-prep": ["de0041+ev0041", "de0061+ev0061"],
            "maxxair-maxxfan-plus-04002k-control-model-prep": ["00+04002k", "04002k"],
            "maxxair-maxxfan-deluxe-05100k-thermostat-control-prep": ["00+05100k", "05100k"],
            "maxxair-maxx-i-00933066-cover-fit-service-prep": ["00+933066", "maxx+i"],
            "maxxair-maxx-ii-00933083-cover-fit-service-prep": ["00+933083", "maxx+ii"],
            "coleman-bluetooth-ceiling-assembly-app-control-prep": ["bluetooth+ceiling+assembly"],
            "coleman-deluxe-chillgrille-filter-control-prep": ["deluxe+chillgrille"],
            "coleman-electric-heat-strip-mode-service-prep": ["electric+heat+strips"],
            "suburban-17-elite-range-model-flame-prep": ["17+elite+series+range"],
            "suburban-22-air-fryer-power-control-prep": ["22+air+fryer", "22+black+glass"],
            "suburban-st42-tankless-model-control-prep": ["st42+water+heater"],
            "suburban-4-gallon-dsi-water-heater-prep": ["4+gallon+dsi"],
            "suburban-single-induction-cookware-power-prep": ["single+element+induction"],
            "aquahot-faq-antifreeze-ltco-service-prep": ["aquahot+faq+ltco", "antifreeze+ltco"],
            "aquahot-annual-service-kit-model-prep": ["annual+service+kits"],
            "aquahot-glenwood-floor-control-prep": ["glenwood+flooring"],
            "furrion-15-convection-microwave-control-prep": ["ccd+0009356", "fmcm15aa"],
            "furrion-17-range-air-fry-control-prep": ["ccd+0010484", "air+fry+oven"],
            "greystone-26-fireplace-control-prep": ["ccd+0007546", "26+fireplace"],
            "greystone-25-combo-griddle-storage-prep": ["ccd+0009781", "25+combo+griddle"],
            "greystone-double-induction-hob-power-prep": ["ccd+0009481", "double+induction+hob"],
            "girard-tankless-e1-e2-service-prep": ["girard+tankless+e1+e2"],
            "onan-rv-generator-gsn-model-family-prep": ["onan+rv+generators+category", "gsn+model+family"],
          }[id] ?? [],
          query: {
            "dometic-cfx5-alert-voltage-low-service-prep": "dometic cfx5 alert voltage low battery protection prep",
            "dometic-cfx5-warning-33-compressor-start-fail": "dometic cfx5 warning 33 compressor start fail service prep",
            "dometic-cfx5-app-authentication-connection-prep": "dometic cfx5 authentication problem app connect cooler prep",
            "dometic-cfx5-battery-drain-protection-prep": "dometic cfx5 flattening batteries battery protection prep",
            "dometic-freshjet-constant-shutoff-service-prep": "dometic freshjet roof air conditioner constantly switches itself off prep",
            "thetford-campa-potti-xg-storage-level-prep": "thetford campa potti xg tank level storage prep",
            "thetford-porta-potti-155-bellows-storage-prep": "thetford porta potti 155 155sl bellows pump storage prep",
            "thetford-c250-cassette-model-label-service-prep": "thetford c250 cassette toilet data badge model label service prep",
            "thetford-c260-electric-ventilator-filter-prep": "thetford c260 electric ventilator filter odor prep",
            "norcold-dc740-model-label-cooling-service-prep": "norcold dc740 model serial cooling service prep",
            "norcold-dc751-model-label-cooling-service-prep": "norcold dc751 model label cooling service prep",
            "norcold-de-ev-acdc-refrigerator-service-prep": "norcold de0041 ev0041 de0061 ev0061 ac dc refrigerator service prep",
            "maxxair-maxxfan-plus-04002k-control-model-prep": "maxxair maxxfan plus 00 04002k control model prep",
            "maxxair-maxxfan-deluxe-05100k-thermostat-control-prep": "maxxair maxxfan deluxe 00 05100k thermostat control prep",
            "maxxair-maxx-i-00933066-cover-fit-service-prep": "maxxair maxx i 00 933066 cover fit service prep",
            "maxxair-maxx-ii-00933083-cover-fit-service-prep": "maxxair maxx ii 00 933083 smoke cover fit prep",
            "coleman-bluetooth-ceiling-assembly-app-control-prep": "coleman mach bluetooth ceiling assembly app control prep",
            "coleman-deluxe-chillgrille-filter-control-prep": "coleman mach deluxe chillgrille filter control prep",
            "coleman-electric-heat-strip-mode-service-prep": "coleman mach electric heat strips mode service prep",
            "suburban-17-elite-range-model-flame-prep": "suburban 17 elite series range black panel flame prep",
            "suburban-22-air-fryer-power-control-prep": "suburban 22 air fryer black glass power control prep",
            "suburban-st42-tankless-model-control-prep": "suburban st42 tankless water heater model control prep",
            "suburban-4-gallon-dsi-water-heater-prep": "suburban 4 gallon dsi water heater switch light prep",
            "suburban-single-induction-cookware-power-prep": "suburban single element induction cooktop cookware power prep",
            "aquahot-faq-antifreeze-ltco-service-prep": "aqua hot faq antifreeze ltco model service prep",
            "aquahot-annual-service-kit-model-prep": "aqua hot annual service kits model part prep",
            "aquahot-glenwood-floor-control-prep": "aqua hot glenwood flooring system touchscreen control prep",
            "furrion-15-convection-microwave-control-prep": "furrion fmcm15aa 1.5 convection microwave ccd 0009356 control prep",
            "furrion-17-range-air-fry-control-prep": "furrion 17 inch 2 burner range air fry oven ccd 0010484 control prep",
            "greystone-26-fireplace-control-prep": "greystone 26 inch electric flat fireplace ccd 0007546 remote control prep",
            "greystone-25-combo-griddle-storage-prep": "greystone 25 combo griddle ccd 0009781 storage prep",
            "greystone-double-induction-hob-power-prep": "greystone double induction hob ccd 0009481 power cookware prep",
            "girard-tankless-e1-e2-service-prep": "girard tankless water heater e1 e2 error code service prep",
            "onan-rv-generator-gsn-model-family-prep": "cummins onan rv generators category gsn model family prep",
          }[id] ?? id,
        },
      ]),
    );
    const newSourceIds = Array.from(expectedSources.keys());
    const newSlugs = new Set(expectedSymptoms.keys());
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|burner\s+(repair|work|service|port|assembly)|\borifice\b|\bcontrol[- ]board\b|\b120\s*vac\b|\b110\s*v\b|\bline[- ]voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|remove.*toilet|replace.*valve|measure resistance|fuel nozzle|combustion|coolant pump|manual override|hydraulic work|hydraulic repair|macerator|internal plumbing|seal removal|compressor repair|pump service|magnetron|capacitor|door switch|roof climbing/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, expected] of expectedSymptoms) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(expected.sourceIds);
      expect(symptom?.searchRequiredTerms, symptomId).toEqual(expected.requiredTerms);
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
      expect(lookupSymptomGuides(index, expected.query)[0]?.slug, expected.query).toBe(symptomId);
    }

    for (const query of [
      "voltage low",
      "compressor",
      "app",
      "battery",
      "storage",
      "service prep",
      "owner manual",
      "model number",
      "control",
      "toilet",
      "refrigerator",
      "fan",
      "ceiling assembly",
      "water heater",
      "air fryer",
      "black glass",
      "induction",
      "fireplace",
      "microwave",
      "generator",
    ]) {
      expect(
        lookupSymptomGuides(index, query)
          .slice(0, 5)
          .map((symptom) => symptom.slug)
          .filter((slug) => newSlugs.has(slug)),
        query,
      ).toEqual([]);
    }
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });

  it("adds the next official CFX5 toilet refrigerator cover HVAC hydronic TV cooking microwave Girard and Onan support prep batch without code entries", () => {
    const expectedSources = new Map<string, string>([
      [
        "dometic-cfx5-recommended-temperature-support",
        "https://support.dometic.com/en/cfx5-coolers/What-are-the-recommended-temperatures-for-refrigerating-and-freezing-9aa",
      ],
      [
        "dometic-cfx5-lid-direction-support",
        "https://support.dometic.com/en/cfx5-coolers/Can-I-reverse-the-lid-direction-on-the-CFX5-8911",
      ],
      [
        "dometic-cfx5-power-draw-runtime-support",
        "https://support.dometic.com/en/cfx5-coolers/How-do-I-calculate-how-much-power-a-CFX5-will-draw-6bf6",
      ],
      ["dometic-cfx5-bluetooth-connection-support", "https://support.dometic.com/en/cfx5-coolers/My-cooler-wont-connect-to-bluetooth-6963"],
      [
        "dometic-cfx5-service-provider-routing-support",
        "https://support.dometic.com/en/cfx5-coolers/Where-can-I-find-the-nearest-service-provider-bb4c",
      ],
      ["thetford-permanent-toilets-model-family-page", "https://www.thetford.com/us/portable-and-rv-toilets/permanent-toilets/"],
      ["thetford-portable-toilets-model-family-page", "https://www.thetford.com/us/portable-and-rv-toilets/portable-toilets/"],
      ["thetford-cassette-toilets-model-family-page", "https://www.thetford.com/us/portable-and-rv-toilets/cassette-toilets/"],
      [
        "thetford-aqua-magic-vi-dimensions-2025",
        "https://www.thetford.com/app/uploads/2025/02/Thetford-Aqua-Magic-VI-RV-Toilet-Dimensions.pdf",
      ],
      ["norcold-nv1090-support-page", "https://www.thetford.com/us/thetford-support/nv1090/"],
      ["thetford-t2095-support-page", "https://www.thetford.com/us/thetford-support/t2095/"],
      ["norcold-dc-refrigerators-product-group", "https://www.thetford.com/us/product-group/dc-refrigerators/"],
      ["norcold-refrigerator-warranty-faq", "https://www.thetford.com/us/faq/what-is-the-warranty-for-my-refrigerator/"],
      ["maxxair-maxxshade-plus-product", "https://www.maxxair.com/products/maxxshades/maxxshade-plus/"],
      ["maxxair-covers-product-family", "https://www.maxxair.com/Products/covers/"],
      ["maxxair-unimaxx-00335002-product", "https://www.maxxair.com/products/covers/unimaxx-00-335002/"],
      ["maxxair-maxxair-ii-cover-family", "https://www.maxxair.com/Products/covers/maxxair-2/"],
      [
        "maxxair-unimaxx-lid-installation-guide-10b335015z",
        "https://library.maxxair.com/wp-content/uploads/2023/03/10b335015z_unimaxx-universal-roof-vent-lid-installation-08-26-2019.pdf",
      ],
      ["coleman-iwave-air-purifier-accessory-prep", "https://coleman-mach.com/products/climate-control-accessories/iwave-m-air-purifier"],
      ["coleman-thermostat-controlled-ceiling-assembly", "https://coleman-mach.com/products/ceiling-assemblies/thermostat-controlled/"],
      [
        "coleman-8xxx-zone-thermostats-repair-parts",
        "https://coleman-mach.com/products/thermostats/8xxx-series-zone-thermostats-control-packages/",
      ],
      ["coleman-air-vantage-conversion-kit", "https://coleman-mach.com/products/conversion-kits/air-vantage/"],
      ["suburban-rv-one-combo-heater-product", "https://suburbanrv.com/rv-one/"],
      ["suburban-120v-electric-wall-heater-product", "https://suburbanrv.com/climate-control/wall-heaters/120v-electric-wall-heater/"],
      [
        "suburban-d-de-water-heater-control-switch",
        "https://suburbanrv.com/water-heating/tank-water-heaters/tank-water-heater-controls/tank-water-heater-control-d-de/",
      ],
      ["suburban-furnace-core-replacement-modules", "https://suburbanrv.com/climate-control/furnaces/furnace-core-replacement-modules/"],
      ["aquahot-gen1-lpg-use-care-guide", "https://library.aquahot.com/wp-content/uploads/2023/05/GEN1-NA-LPG-User-Manual-3.13.23.pdf"],
      ["aquahot-gen1-gasoline-use-care-guide", "https://library.aquahot.com/wp-content/uploads/2023/05/GEN1-NA-GAS-User-Manual-3.13.23.pdf"],
      ["aquahot-contact-technical-service", "https://www.aquahot.com/contact.aspx"],
      ["furrion-tvs-support-index", "https://support.lci1.com/furrion-tvs/"],
      ["greystone-ranges-support-index", "https://support.lci1.com/greystone-ranges"],
      ["greystone-cooktops-griddles-support-index", "https://support.lci1.com/greystone-cooktops-griddles"],
      ["greystone-microwaves-support-index", "https://support.lci1.com/greystone-microwaves"],
      ["girard-other-products-support-index", "https://support.lci1.com/gp-llc-other-products"],
      ["onan-p2500i-shop-product", "https://shop.cummins.com/SC/product/onan-p2500i-inverter-generator-epa-a074z433/01tUz00000CiVu1IAF"],
      ["onan-p2500i-maintenance-kit-shop", "https://shop.cummins.com/SC/product/onan-p2500i-maintenance-kit-a058u946/01t4N0000048ZZcQAM"],
      ["onan-p9500df-owner-manual-2025", "https://www.cummins.com/sites/default/files/2025-04/p9500df-owners-manual.pdf"],
      ["onan-p5000idf-efi-spec-sheet-2025", "https://www.cummins.com/sites/default/files/2025-04/p5000idf-efi-spec-sheet.pdf"],
    ]);
    const expectedSymptoms = new Map<string, { sourceIds: string[]; requiredTerms: string[]; query: string }>([
      [
        "dometic-cfx5-temperature-settings-service-prep",
        {
          sourceIds: ["dometic-cfx5-recommended-temperature-support"],
          requiredTerms: ["cfx5+recommended+temperatures", "refrigerating+freezing", "cfx5+temperature"],
          query: "dometic cfx5 recommended temperatures refrigerating freezing prep",
        },
      ],
      [
        "dometic-cfx5-lid-direction-model-prep",
        {
          sourceIds: ["dometic-cfx5-lid-direction-support"],
          requiredTerms: ["cfx5+lid+direction", "reverse+lid"],
          query: "dometic cfx5 reverse lid direction model prep",
        },
      ],
      [
        "dometic-cfx5-battery-runtime-power-prep",
        {
          sourceIds: ["dometic-cfx5-power-draw-runtime-support"],
          requiredTerms: ["cfx5+power+draw", "battery+runtime"],
          query: "dometic cfx5 power draw battery runtime prep",
        },
      ],
      [
        "dometic-cfx5-app-bluetooth-control-prep",
        {
          sourceIds: ["dometic-cfx5-bluetooth-connection-support"],
          requiredTerms: ["cfx5+bluetooth", "cooler+connect"],
          query: "dometic cfx5 bluetooth cooler connect app prep",
        },
      ],
      [
        "dometic-cfx5-service-provider-warranty-prep",
        {
          sourceIds: ["dometic-cfx5-service-provider-routing-support"],
          requiredTerms: ["cfx5+service+provider"],
          query: "dometic cfx5 nearest service provider warranty prep",
        },
      ],
      [
        "thetford-permanent-toilet-model-fit-prep",
        {
          sourceIds: ["thetford-permanent-toilets-model-family-page"],
          requiredTerms: ["permanent+toilets", "thetford+permanent"],
          query: "thetford permanent toilets model fit prep",
        },
      ],
      [
        "thetford-porta-potti-model-storage-prep",
        {
          sourceIds: ["thetford-portable-toilets-model-family-page"],
          requiredTerms: ["portable+toilets", "porta+potti"],
          query: "thetford portable toilets porta potti storage prep",
        },
      ],
      [
        "thetford-cassette-toilet-model-tank-prep",
        {
          sourceIds: ["thetford-cassette-toilets-model-family-page"],
          requiredTerms: ["cassette+toilets", "cassette+tank"],
          query: "thetford cassette toilets tank model prep",
        },
      ],
      [
        "thetford-aqua-magic-vi-dimensions-model-prep",
        {
          sourceIds: ["thetford-aqua-magic-vi-dimensions-2025"],
          requiredTerms: ["aqua+magic+vi", "dimensions"],
          query: "thetford aqua magic vi dimensions model prep",
        },
      ],
      [
        "norcold-nv1090-service-model-prep",
        {
          sourceIds: ["norcold-nv1090-support-page"],
          requiredTerms: ["nv1090"],
          query: "norcold nv1090 support model control prep",
        },
      ],
      [
        "thetford-t2095-control-model-prep",
        {
          sourceIds: ["thetford-t2095-support-page"],
          requiredTerms: ["t2095"],
          query: "thetford t2095 drawer refrigerator control prep",
        },
      ],
      [
        "norcold-dc-refrigerator-family-model-prep",
        {
          sourceIds: ["norcold-dc-refrigerators-product-group"],
          requiredTerms: ["dc+refrigerators", "norcold+dc"],
          query: "norcold dc refrigerators product group model prep",
        },
      ],
      [
        "norcold-refrigerator-warranty-paperwork-prep",
        {
          sourceIds: ["norcold-refrigerator-warranty-faq"],
          requiredTerms: ["refrigerator+warranty", "norcold+warranty"],
          query: "norcold refrigerator warranty faq paperwork prep",
        },
      ],
      [
        "maxxair-maxxshade-plus-led-fit-prep",
        {
          sourceIds: ["maxxair-maxxshade-plus-product"],
          requiredTerms: ["maxxshade+plus"],
          query: "maxxair maxxshade plus led fit control prep",
        },
      ],
      [
        "maxxair-cover-family-fit-prep",
        {
          sourceIds: ["maxxair-covers-product-family"],
          requiredTerms: ["maxxair+covers", "covers+family"],
          query: "maxxair covers product family fit prep",
        },
      ],
      [
        "maxxair-unimaxx-vent-lid-fit-prep",
        {
          sourceIds: ["maxxair-unimaxx-00335002-product"],
          requiredTerms: ["00+335002", "unimaxx"],
          query: "maxxair unimaxx 00 335002 vent lid fit prep",
        },
      ],
      [
        "maxxair-ii-cover-fit-service-prep",
        {
          sourceIds: ["maxxair-maxxair-ii-cover-family"],
          requiredTerms: ["maxxair+2", "maxxair+ii+cover"],
          query: "maxxair ii cover family fit service prep",
        },
      ],
      [
        "maxxair-unimaxx-lid-hardware-service-prep",
        {
          sourceIds: ["maxxair-unimaxx-lid-installation-guide-10b335015z"],
          requiredTerms: ["10b335015z", "unimaxx+lid"],
          query: "maxxair 10b335015z unimaxx lid hardware service prep",
        },
      ],
      [
        "coleman-iwave-air-purifier-accessory-prep",
        {
          sourceIds: ["coleman-iwave-air-purifier-accessory-prep"],
          requiredTerms: ["iwave+m", "air+purifier"],
          query: "coleman mach iwave m air purifier accessory prep",
        },
      ],
      [
        "coleman-thermostat-controlled-ceiling-assembly-prep",
        {
          sourceIds: ["coleman-thermostat-controlled-ceiling-assembly"],
          requiredTerms: ["thermostat+controlled+ceiling"],
          query: "coleman mach thermostat controlled ceiling assembly prep",
        },
      ],
      [
        "coleman-8xxx-zone-thermostat-replacement-prep",
        {
          sourceIds: ["coleman-8xxx-zone-thermostats-repair-parts"],
          requiredTerms: ["8xxx+zone", "thermostats+control+packages"],
          query: "coleman mach 8xxx zone thermostats control packages prep",
        },
      ],
      [
        "coleman-air-vantage-ct-thermostat-prep",
        {
          sourceIds: ["coleman-air-vantage-conversion-kit"],
          requiredTerms: ["air+vantage", "ct+thermostat"],
          query: "coleman air vantage conversion kit ct thermostat prep",
        },
      ],
      [
        "suburban-rv-one-combo-heater-service-prep",
        {
          sourceIds: ["suburban-rv-one-combo-heater-product"],
          requiredTerms: ["rv+one", "combo+heater"],
          query: "suburban rv one combo heater water furnace service prep",
        },
      ],
      [
        "suburban-electric-wall-heater-control-prep",
        {
          sourceIds: ["suburban-120v-electric-wall-heater-product"],
          requiredTerms: ["120v+electric+wall+heater", "120v+wall+heater"],
          query: "suburban 120v electric wall heater control prep",
        },
      ],
      [
        "suburban-d-de-water-heater-switch-prep",
        {
          sourceIds: ["suburban-d-de-water-heater-control-switch"],
          requiredTerms: ["d+de+water+heater", "control+d+de"],
          query: "suburban d de water heater control switch prep",
        },
      ],
      [
        "suburban-furnace-core-module-service-prep",
        {
          sourceIds: ["suburban-furnace-core-replacement-modules"],
          requiredTerms: ["furnace+core+replacement", "core+module"],
          query: "suburban furnace core replacement modules service prep",
        },
      ],
      [
        "aquahot-gen1-lpg-lcd-storage-prep",
        {
          sourceIds: ["aquahot-gen1-lpg-use-care-guide"],
          requiredTerms: ["gen1+lpg", "lcd+storage"],
          query: "aqua hot gen1 lpg lcd storage prep",
        },
      ],
      [
        "aquahot-gen1-gasoline-lcd-storage-prep",
        {
          sourceIds: ["aquahot-gen1-gasoline-use-care-guide"],
          requiredTerms: ["gen1+gasoline", "lcd+storage"],
          query: "aqua hot gen1 gasoline lcd storage prep",
        },
      ],
      [
        "aquahot-technical-service-contact-prep",
        {
          sourceIds: ["aquahot-contact-technical-service"],
          requiredTerms: ["aqua+hot+contact", "technical+service"],
          query: "aqua hot contact technical service prep",
        },
      ],
      [
        "furrion-tv-model-warranty-prep",
        {
          sourceIds: ["furrion-tvs-support-index"],
          requiredTerms: ["furrion+tvs", "tv+support"],
          query: "furrion tvs support model warranty prep",
        },
      ],
      [
        "greystone-range-manual-model-label-prep",
        {
          sourceIds: ["greystone-ranges-support-index"],
          requiredTerms: ["greystone+ranges", "range+manual", "greystone+range"],
          query: "greystone ranges support manual model label prep",
        },
      ],
      [
        "greystone-cooktop-griddle-manual-storage-prep",
        {
          sourceIds: ["greystone-cooktops-griddles-support-index"],
          requiredTerms: ["greystone+cooktops+griddles", "griddle+storage"],
          query: "greystone cooktops griddles manual storage prep",
        },
      ],
      [
        "greystone-microwave-model-control-prep",
        {
          sourceIds: ["greystone-microwaves-support-index"],
          requiredTerms: ["greystone+microwaves", "microwave+model", "greystone+microwave"],
          query: "greystone microwaves support model control prep",
        },
      ],
      [
        "girard-tankless-warranty-source-prep",
        {
          sourceIds: ["girard-other-products-support-index"],
          requiredTerms: ["gp+llc+other+products", "girard+tankless"],
          query: "girard gp llc other products tankless warranty source prep",
        },
      ],
      [
        "onan-p2500i-model-gsn-prep",
        {
          sourceIds: ["onan-p2500i-shop-product"],
          requiredTerms: ["p2500i", "a074z433"],
          query: "onan p2500i a074z433 model gsn prep",
        },
      ],
      [
        "onan-p2500i-maintenance-kit-prep",
        {
          sourceIds: ["onan-p2500i-maintenance-kit-shop"],
          requiredTerms: ["p2500i+maintenance+kit", "a058u946"],
          query: "onan p2500i maintenance kit a058u946 prep",
        },
      ],
      [
        "onan-p9500df-vft-fuel-storage-prep",
        {
          sourceIds: ["onan-p9500df-owner-manual-2025"],
          requiredTerms: ["p9500df", "vft+storage"],
          query: "onan p9500df vft fuel storage prep",
        },
      ],
      [
        "onan-p5000idf-efi-vft-co-prep",
        {
          sourceIds: ["onan-p5000idf-efi-spec-sheet-2025"],
          requiredTerms: ["p5000idf+efi", "vft+co", "p5000idf"],
          query: "onan p5000idf efi vft co prep",
        },
      ],
    ]);
    const newSourceIds = Array.from(expectedSources.keys());
    const newSlugs = new Set(expectedSymptoms.keys());
    const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
    const symptomById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));
    const index = buildSymptomSearchIndex(corpus);
    const summary = summarizeCorpus(corpus);
    const unsafeOwnerActionPattern =
      /\bbypass\b|\bjump(er)?\b|\bgas valve\b|burner\s+(repair|work|service|port|assembly)|\borifice\b|\bcontrol[- ]board\b|\b120\s*vac\b|\b110\s*v\b|\bline[- ]voltage\b|\brefrigerant\b|\bprobe\b|\bwiring\b|\bsupply line\b|\bopen (the )?(fuel|gas|electrical|rooftop)|remove.*shroud|remove.*cover|remove.*toilet|replace.*valve|measure resistance|fuel nozzle|combustion|coolant pump|manual override|hydraulic work|hydraulic repair|macerator|internal plumbing|seal removal|compressor repair|pump service|magnetron|capacitor|door switch|roof climbing/i;

    for (const [sourceId, url] of expectedSources) {
      const source = sourcesById.get(sourceId);
      expect(source?.official, sourceId).toBe(true);
      expect(source?.url, sourceId).toBe(url);
    }

    expect(corpus.sources).toHaveLength(expectedSourceCount);
    expect(corpus.entries).toHaveLength(expectedEntryCount);
    expect(corpus.symptoms).toHaveLength(expectedSymptomCount);
    expect(summary.indexablePages).toBe(expectedEntryCount + expectedSymptomCount + 1);
    expect(corpus.entries.filter((entry) => entry.sourceIds.some((sourceId) => newSourceIds.includes(sourceId)))).toHaveLength(0);

    for (const [symptomId, expected] of expectedSymptoms) {
      const symptom = symptomById.get(symptomId);
      expect(symptom, symptomId).toBeDefined();
      expect(symptom?.sourceIds, symptomId).toEqual(expected.sourceIds);
      expect(symptom?.searchRequiredTerms, symptomId).toEqual(expected.requiredTerms);
      expect([symptom?.summary, ...(symptom?.safeChecklist ?? [])].join(" "), symptomId).not.toMatch(
        unsafeOwnerActionPattern,
      );
      expect(lookupSymptomGuides(index, expected.query)[0]?.slug, expected.query).toBe(symptomId);
    }

    for (const [query, slug] of [
      ["dometic cfx5 temperature", "dometic-cfx5-temperature-settings-service-prep"],
      ["suburban 120v wall heater", "suburban-electric-wall-heater-control-prep"],
      ["greystone range", "greystone-range-manual-model-label-prep"],
      ["greystone microwave", "greystone-microwave-model-control-prep"],
      ["onan p5000idf", "onan-p5000idf-efi-vft-co-prep"],
    ]) {
      expect(lookupSymptomGuides(index, query)[0]?.slug, query).toBe(slug);
    }

    for (const query of [
      "temperature",
      "power",
      "bluetooth",
      "service provider",
      "toilet",
      "portable toilet",
      "cassette",
      "refrigerator",
      "warranty",
      "cover",
      "lid",
      "ceiling assembly",
      "thermostat",
      "wall heater",
      "water heater",
      "furnace",
      "hydronic",
      "contact",
      "tv",
      "range",
      "griddle",
      "microwave",
      "generator",
      "maintenance kit",
      "fuel",
    ]) {
      expect(
        lookupSymptomGuides(index, query)
          .slice(0, 5)
          .map((symptom) => symptom.slug)
          .filter((slug) => newSlugs.has(slug)),
        query,
      ).toEqual([]);
    }
    expect(symptomById.get("service-call-prep")?.sourceIds).toEqual(expect.arrayContaining(newSourceIds));
  });
});
