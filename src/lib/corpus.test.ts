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

const expectedEntryCount = 850;
const expectedSourceCount = 403;
const expectedSymptomCount = 242;

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
    ]);

    for (const query of ["fan not working", "lid not opening", "leaking", "cabin heat not working"]) {
      expect(
        lookupSymptomGuides(index, query)
          .slice(0, 5)
          .map((symptom) => symptom.slug)
          .filter((slug) => brandSpecificSlugs.has(slug)),
        query,
      ).toEqual([]);
    }
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
});
