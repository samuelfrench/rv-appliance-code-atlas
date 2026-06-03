import { expect, test } from "@playwright/test";

test("mobile lookup finds a sourced Norcold fault code and opens its detail page", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "RV Appliance Code Atlas" })).toBeVisible();
  await page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" }).fill("norcold n7 no fl");
  const polarNoFl = page.locator('a[href="/codes/norcold-polar-no-fl/"]');
  await expect(polarNoFl).toBeVisible();
  await polarNoFl.click();
  await expect(page.getByRole("heading", { name: /Norcold no FL/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Official source" })).toBeVisible();
  await expect(page.getByText("Do not hand-light")).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("exact code searches rank the matching code card before symptom guides", async ({ page }) => {
  await page.goto("/");
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });
  const firstResult = page.locator('section[aria-label="Lookup results"] a').first();

  await searchbox.fill("norcold no co");
  await expect(firstResult).toHaveAttribute("href", "/codes/norcold-1200-no-co/");

  await searchbox.fill("suburban furnace lock out");
  await expect(firstResult).toHaveAttribute("href", "/codes/suburban-furnace-lock-out/");

  await searchbox.fill("suburban furnace lockout");
  await expect(firstResult).toHaveAttribute("href", "/codes/suburban-furnace-lock-out/");

  await searchbox.fill("suburban water heater reset light");
  await expect(firstResult).toHaveAttribute("href", "/codes/suburban-water-heater-reset-light/");

  await searchbox.fill("furrion 10.6 e3 compressor");
  await expect(firstResult).toHaveAttribute("href", "/codes/furrion-10-6-refrigerator-e3/");

  await searchbox.fill("furrion 15 fd");
  await expect(firstResult).toHaveAttribute("href", "/codes/furrion-15-refrigerator-fd/");
});

test("symptom guide and checklist surfaces service-call prep without checkout", async ({ page }) => {
  await page.goto("/symptoms/rv-appliance-service-call-checklist/");

  await expect(page.getByRole("heading", { name: "Pre-service checklist for RV appliance calls" })).toBeVisible();
  await expect(page.getByText("Brand, model, serial number.")).toBeVisible();
  await expect(page.getByText("Checkout enabled")).toHaveCount(0);
  await expect(page.getByText("Ad slots disabled until traffic data supports them.")).toBeVisible();
});

test("lookup surfaces RM10 symptom-only support pages", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" }).fill("rm10 gas smell");
  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const gasSmell = lookupResults.locator('a[href="/symptoms/dometic-rm10-gas-smell/"]');
  await expect(gasSmell).toBeVisible();
  await gasSmell.click();

  await expect(page.getByRole("heading", { name: "Dometic RM10 gas smell" })).toBeVisible();
  await expect(page.getByText("Do not operate electrical equipment")).toBeVisible();
});

test("lookup surfaces Dometic 10-series symptom aliases", async ({ page }) => {
  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("rmd10 gas smell");
  await expect(lookupResults.locator('a[href="/symptoms/dometic-rm10-gas-smell/"]')).toBeVisible();

  await searchbox.fill("rml10 defrost ice");
  await expect(lookupResults.locator('a[href="/symptoms/dometic-rm10-defrost-evaporator-ice-buildup/"]')).toBeVisible();

  await searchbox.fill("rms10 internal batteries");
  await expect(lookupResults.locator('a[href="/symptoms/dometic-rm10-internal-battery-packs/"]')).toBeVisible();
});

test("lookup surfaces Dometic RUA/RUC symptom support pages", async ({ page }) => {
  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("rua not cooling lower temperature");
  await expect(
    lookupResults.locator('a[href="/symptoms/dometic-rua-ruc-not-cooling-temperature-and-ventilation/"]'),
  ).toBeVisible();

  await searchbox.fill("rua 12v battery management");
  await expect(
    lookupResults.locator('a[href="/symptoms/dometic-rua-ruc-first-use-ventilation-battery-management/"]'),
  ).toBeVisible();

  await searchbox.fill("ruc no display");
  await expect(lookupResults.locator('a[href="/symptoms/dometic-ruc-display-or-power-not-on/"]')).toBeVisible();

  await searchbox.fill("ruc compressor high ambient");
  await expect(
    lookupResults.locator('a[href="/symptoms/dometic-ruc-compressor-voltage-or-high-ambient/"]'),
  ).toBeVisible();

  await searchbox.fill("ruc too cold warmest setting");
  await expect(lookupResults.locator('a[href="/symptoms/dometic-ruc-too-cold-temperature-setting/"]')).toBeVisible();
});

test("lookup surfaces Norcold and Thetford symptom support pages", async ({ page }) => {
  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("norcold not cooling vents level");
  await expect(
    lookupResults.locator('a[href="/symptoms/norcold-absorption-refrigerator-not-cooling-level-ventilation/"]'),
  ).toBeVisible();

  await searchbox.fill("norcold hts solid red do not bypass");
  await expect(
    lookupResults.locator('a[href="/symptoms/norcold-high-temperature-sensor-stopped-operating-service-only/"]'),
  ).toBeVisible();

  await searchbox.fill("norcold dc compressor not cooling low battery voltage");
  await expect(
    lookupResults.locator('a[href="/symptoms/norcold-dc-compressor-refrigerator-cooling-voltage/"]'),
  ).toBeVisible();

  await searchbox.fill("norcold n2090 drip tray condensation water");
  await expect(lookupResults.locator('a[href="/symptoms/norcold-n2000-condensation-drip-tray/"]')).toBeVisible();
});

test("lookup surfaces Thetford RV toilet symptom support pages", async ({ page }) => {
  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("thetford toilet bowl will not hold water lip seal");
  await expect(
    lookupResults.locator('a[href="/symptoms/thetford-rv-toilet-bowl-water-does-not-hold-seal/"]'),
  ).toBeVisible();

  await searchbox.fill("aqua magic weak flush no water pedal");
  await expect(
    lookupResults.locator('a[href="/symptoms/thetford-rv-toilet-no-flush-or-poor-flush-water-supply/"]'),
  ).toBeVisible();

  await searchbox.fill("thetford toilet leak behind base water valve");
  await expect(
    lookupResults.locator('a[href="/symptoms/thetford-rv-toilet-leak-behind-or-around-base/"]'),
  ).toBeVisible();

  await searchbox.fill("thetford rv toilet winterize freeze damage leak");
  const winterizing = lookupResults.locator('a[href="/symptoms/thetford-rv-toilet-winterizing-freeze-damage/"]');
  await expect(winterizing).toBeVisible();

  await winterizing.click();
  await expect(page.getByRole("heading", { name: "Thetford RV toilet winterizing and freeze-damage risk" })).toBeVisible();
  await expect(page.getByText(/Do not operate a toilet that leaked after freezing/i)).toBeVisible();
});

test("lookup surfaces Furrion refrigerator symptom support pages", async ({ page }) => {
  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("furrion refrigerator not cooling hard reset");
  await expect(lookupResults.locator('a[href="/symptoms/furrion-12v-refrigerator-not-cooling-hard-reset/"]')).toBeVisible();

  await searchbox.fill("furrion compressor turns on and off low battery heat");
  await expect(
    lookupResults.locator('a[href="/symptoms/furrion-12v-refrigerator-compressor-cycling-low-battery-heat/"]'),
  ).toBeVisible();

  await searchbox.fill("furrion refrigerator door won't close seal");
  await expect(lookupResults.locator('a[href="/symptoms/furrion-refrigerator-door-seal-not-closing/"]')).toBeVisible();

  await searchbox.fill("furrion moisture ice inside outside refrigerator");
  await expect(lookupResults.locator('a[href="/symptoms/furrion-refrigerator-moisture-ice-or-defrost/"]')).toBeVisible();

  await searchbox.fill("furrion compressor board fan refrigerant service only");
  await expect(
    lookupResults.locator('a[href="/symptoms/furrion-refrigerator-service-only-compressor-sensor-wiring/"]'),
  ).toBeVisible();
});

test("lookup surfaces Furrion furnace symptom support pages", async ({ page }) => {
  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("furrion furnace will not light blower does not turn on low 12v");
  await expect(
    lookupResults.locator('a[href="/symptoms/furrion-furnace-will-not-light-blower-no-start/"]'),
  ).toBeVisible();

  await searchbox.fill("furrion furnace shuts off before desired temperature vents covered");
  await expect(
    lookupResults.locator('a[href="/symptoms/furrion-furnace-short-cycles-before-set-temperature/"]'),
  ).toBeVisible();

  await searchbox.fill("furrion furnace soot yellow flame exhaust service");
  const sootService = lookupResults.locator('a[href="/symptoms/furrion-furnace-soot-yellow-flame-exhaust-service/"]');
  await expect(sootService).toBeVisible();
  await sootService.click();

  await expect(page.getByRole("heading", { name: "Furrion furnace soot, yellow flame, or blocked exhaust" })).toBeVisible();
  await expect(page.getByText(/shut the furnace down/i)).toBeVisible();
});

test("lookup surfaces Furrion fireplace and range support pages", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("furrion fireplace ee thermostat sensor");
  await expect(lookupResults.locator('a[href="/codes/furrion-electric-fireplace-ee-thermostat-sensor/"]')).toBeVisible();

  await searchbox.fill("furrion fireplace 88 overheat protection");
  await expect(lookupResults.locator('a[href="/codes/furrion-electric-fireplace-88-overheat-protection/"]')).toBeVisible();

  await searchbox.fill("furrion fireplace red led blinking blower motor proximity");
  await expect(lookupResults.locator('a[href="/symptoms/furrion-electric-fireplace-red-led-proximity-cutoff/"]')).toBeVisible();

  await searchbox.fill("furrion range surface burners do not light ffd hold knob");
  await expect(lookupResults.locator('a[href="/symptoms/furrion-range-cooktop-burners-do-not-light-ffd/"]')).toBeVisible();

  await searchbox.fill("furrion range smell gas carbon monoxide space heater");
  const gasBoundary = lookupResults.locator('a[href="/symptoms/furrion-range-gas-odor-carbon-monoxide-boundary/"]');
  await expect(gasBoundary).toBeVisible();
  await gasBoundary.click();

  await expect(page.getByRole("heading", { name: "Furrion range gas odor and carbon monoxide boundary" })).toBeVisible();
  await expect(page.getByText(/Never use the range or oven as a heat source/i)).toBeVisible();
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces Lippert leveling and slide symptom support pages", async ({ page }) => {
  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("lippert ground control low voltage battery under load");
  await expect(
    lookupResults.locator('a[href="/symptoms/lippert-ground-control-low-voltage-battery-leveling/"]'),
  ).toBeVisible();

  await searchbox.fill("lippert ground control auto level fail out of stroke relocate trailer");
  await expect(
    lookupResults.locator('a[href="/symptoms/lippert-ground-control-auto-level-excess-angle-out-of-stroke/"]'),
  ).toBeVisible();

  await searchbox.fill("lippert in wall slide obstruction synchronize motors hold switch");
  await expect(lookupResults.locator('a[href="/symptoms/lippert-in-wall-slide-obstruction-or-motor-sync/"]')).toBeVisible();

  await searchbox.fill("lippert in wall slide red led green led low battery motor 1");
  const slideLed = lookupResults.locator('a[href="/symptoms/lippert-in-wall-slide-red-green-led-low-voltage-service/"]');
  await expect(slideLed).toBeVisible();
  await slideLed.click();

  await expect(page.getByRole("heading", { name: "Lippert In-Wall slide red or green LED fault" })).toBeVisible();
  await expect(page.getByText(/Do not jump the controller/i)).toBeVisible();
});

test("lookup surfaces Suburban furnace and water-heater symptom support pages", async ({ page }) => {
  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("suburban furnace blowing cold air limit switch");
  await expect(
    lookupResults.locator('a[href="/symptoms/suburban-furnace-blowing-cold-air-lockout-limit-switch/"]'),
  ).toBeVisible();

  await searchbox.fill("suburban furnace close register overheating soot vent");
  await expect(
    lookupResults.locator('a[href="/symptoms/suburban-furnace-airflow-overheat-soot-register-return-air/"]'),
  ).toBeVisible();

  await searchbox.fill("suburban furnace low gas low voltage service technician");
  await expect(
    lookupResults.locator('a[href="/symptoms/suburban-furnace-low-voltage-low-gas-service-only/"]'),
  ).toBeVisible();

  await searchbox.fill("suburban tank water heater reset light lockout");
  await expect(lookupResults.locator('a[href="/symptoms/suburban-tank-water-heater-reset-light-lockout/"]')).toBeVisible();

  await searchbox.fill("suburban water heater pt relief dripping air pocket");
  await expect(
    lookupResults.locator('a[href="/symptoms/suburban-tank-water-heater-pt-relief-drip-air-pocket/"]'),
  ).toBeVisible();

  await searchbox.fill("suburban water heater rotten egg odor anode");
  await expect(lookupResults.locator('a[href="/symptoms/suburban-tank-water-heater-odor-anode/"]')).toBeVisible();

  await searchbox.fill("suburban tank water heater drain winterize freezing");
  await expect(
    lookupResults.locator('a[href="/symptoms/suburban-tank-water-heater-winterizing-drain-freeze/"]'),
  ).toBeVisible();

  await searchbox.fill("suburban water heater soot gas smell service");
  await expect(lookupResults.locator('a[href="/symptoms/suburban-water-heater-soot-gas-smell-service-only/"]')).toBeVisible();

  await searchbox.fill("suburban tankless low voltage freeze protection 10v 17v");
  await expect(
    lookupResults.locator('a[href="/symptoms/suburban-tankless-freeze-voltage-protection/"]'),
  ).toBeVisible();
});

test("lookup surfaces Suburban model-specific ducting and ST42 cold-inlet support pages", async ({ page }) => {
  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("suburban sf-vh duct port 5 limit temperature");
  await expect(
    lookupResults.locator('a[href="/symptoms/suburban-sf-vh-furnace-duct-port-limit-cycling/"]'),
  ).toBeVisible();

  await searchbox.fill("suburban sf-vh return air 18 register");
  await expect(lookupResults.locator('a[href="/symptoms/suburban-sf-vh-return-air-register-layout/"]')).toBeVisible();

  await searchbox.fill("suburban thermostat too high satisfied prematurely");
  await expect(
    lookupResults.locator('a[href="/symptoms/suburban-sf-vh-thermostat-too-high-premature-satisfaction/"]'),
  ).toBeVisible();

  await searchbox.fill("suburban st42 cold inlet below 70 winter not hot enough");
  await expect(
    lookupResults.locator('a[href="/symptoms/suburban-st42-cold-inlet-winter-underperformance/"]'),
  ).toBeVisible();
});

test("lookup surfaces Coleman-Mach rooftop AC and heat-pump symptom support pages", async ({ page }) => {
  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("coleman mach ac not cooling 16 22 degree temperature split");
  await expect(
    lookupResults.locator('a[href="/symptoms/coleman-mach-rooftop-ac-not-cooling-temperature-delta/"]'),
  ).toBeVisible();

  await searchbox.fill("coleman mach ac freeze up high fan dirty filter");
  await expect(lookupResults.locator('a[href="/symptoms/coleman-mach-rooftop-ac-freeze-up-low-airflow/"]')).toBeVisible();

  await searchbox.fill("coleman mach low voltage extension cord cheater plug");
  await expect(lookupResults.locator('a[href="/symptoms/coleman-mach-rooftop-ac-low-voltage-extension-cord/"]')).toBeVisible();

  await searchbox.fill("coleman mach fan runs no compressor freeze switch");
  await expect(
    lookupResults.locator('a[href="/symptoms/coleman-mach-rooftop-ac-fan-runs-no-compressor-service/"]'),
  ).toBeVisible();

  await searchbox.fill("coleman mach water leak inside condensate drain hose");
  await expect(lookupResults.locator('a[href="/symptoms/coleman-mach-rooftop-ac-condensate-water-inside/"]')).toBeVisible();

  await searchbox.fill("coleman mach thermostat fan only no cooling");
  await expect(lookupResults.locator('a[href="/symptoms/coleman-mach-thermostat-fan-only-no-cooling/"]')).toBeVisible();

  await searchbox.fill("coleman mach heat pump below 45 blower running");
  await expect(lookupResults.locator('a[href="/symptoms/coleman-mach-heat-pump-below-45-blower-running/"]')).toBeVisible();
});

test("lookup surfaces Dometic CCC2 thermostat symptom support pages", async ({ page }) => {
  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("dometic ccc2 fan only no cooling cool mode zone setpoint");
  await expect(lookupResults.locator('a[href="/symptoms/dometic-ccc2-fan-only-no-cooling-mode-zone/"]')).toBeVisible();

  await searchbox.fill("ccc2 hourglass compressor delay 2 minutes no start");
  await expect(lookupResults.locator('a[href="/symptoms/dometic-ccc2-hourglass-compressor-delay/"]')).toBeVisible();

  await searchbox.fill("ccc2 hp defrost auxiliary heat below 30 degrees");
  await expect(lookupResults.locator('a[href="/symptoms/dometic-ccc2-heat-pump-defrost-auxiliary-heat/"]')).toBeVisible();

  await searchbox.fill("ccc2 filter icon inside temp f c reset fan runtime");
  await expect(lookupResults.locator('a[href="/symptoms/dometic-ccc2-filter-icon-clean-reset/"]')).toBeVisible();

  await searchbox.fill("dometic ccc2 hot weather high fan cooling shade windows");
  const hotWeather = lookupResults.locator('a[href="/symptoms/dometic-ccc2-hot-weather-cooling-performance/"]');
  await expect(hotWeather).toBeVisible();

  await hotWeather.click();
  await expect(page.getByRole("heading", { name: "Dometic CCC2 hot-weather cooling performance" })).toBeVisible();
  await expect(page.getByText(/Operation on High Fan\/Cooling mode/i)).toBeVisible();
});

test("lookup surfaces Dometic Single Zone LCD thermostat codes and symptom pages", async ({ page }) => {
  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("dometic single zone e1 communication module board");
  await expect(lookupResults.locator('a[href="/codes/dometic-single-zone-lcd-e1/"]')).toBeVisible();

  await searchbox.fill("dometic 3313193 e5 freeze sensor");
  await expect(lookupResults.locator('a[href="/codes/dometic-single-zone-lcd-e5/"]')).toBeVisible();

  await searchbox.fill("single zone lcd compressor time delay 2 minutes");
  await expect(lookupResults.locator('a[href="/symptoms/dometic-single-zone-compressor-time-delay/"]')).toBeVisible();

  await searchbox.fill("dometic single zone heat pump defrost cold air registers 25 minutes");
  await expect(lookupResults.locator('a[href="/symptoms/dometic-single-zone-heat-pump-defrost-cold-air/"]')).toBeVisible();

  await searchbox.fill("dometic single zone filter every 2 weeks hot weather cooling");
  const filterMaintenance = lookupResults.locator(
    'a[href="/symptoms/dometic-single-zone-hot-weather-filter-maintenance/"]',
  );
  await expect(filterMaintenance).toBeVisible();

  await filterMaintenance.click();
  await expect(page.getByRole("heading", { name: "Dometic Single Zone LCD hot-weather filter maintenance" })).toBeVisible();
  await expect(page.getByText(/minimum of every 2 weeks/i)).toBeVisible();
});

test("lookup surfaces Dometic Bluetooth CT thermostat codes and symptom pages", async ({ page }) => {
  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("dometic bluetooth ct 3316420 e1 communication");
  await expect(lookupResults.locator('a[href="/codes/dometic-bluetooth-ct-e1/"]')).toBeVisible();

  await searchbox.fill("dometic bluetooth thermostat e5 freeze sensor");
  await expect(lookupResults.locator('a[href="/codes/dometic-bluetooth-ct-e5/"]')).toBeVisible();

  await searchbox.fill("dometic bluetooth ct app pairing 2 digit pin off mode");
  await expect(lookupResults.locator('a[href="/symptoms/dometic-bluetooth-ct-pairing-mobile-device/"]')).toBeVisible();

  await searchbox.fill("bluetooth ct heat pump defrost cold air 25 minutes");
  await expect(lookupResults.locator('a[href="/symptoms/dometic-bluetooth-ct-heat-pump-defrost-cold-air/"]')).toBeVisible();

  await searchbox.fill("bluetooth ct filter every 2 weeks hot weather heat gain");
  const filterMaintenance = lookupResults.locator(
    'a[href="/symptoms/dometic-bluetooth-ct-hot-weather-filter-maintenance/"]',
  );
  await expect(filterMaintenance).toBeVisible();

  await filterMaintenance.click();
  await expect(page.getByRole("heading", { name: "Dometic Bluetooth CT hot-weather filter maintenance" })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: /minimum of every 2 weeks/i })).toBeVisible();
});

test("lookup surfaces Dometic FreshJet FJX codes and symptom pages", async ({ page }) => {
  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("dometic freshjet fjx p1 under voltage campsite");
  await expect(lookupResults.locator('a[href="/codes/dometic-freshjet-fjx-p1-under-voltage-protection/"]')).toBeVisible();

  await searchbox.fill("freshjet fjx e9 compressor ipm module");
  await expect(lookupResults.locator('a[href="/codes/dometic-freshjet-fjx-e9-compressor-drive-ipm-module-fault/"]')).toBeVisible();

  await searchbox.fill("freshjet low air output leaves ventilation grilles");
  await expect(lookupResults.locator('a[href="/symptoms/dometic-freshjet-fjx-low-air-output-filter-vents/"]')).toBeVisible();

  await searchbox.fill("freshjet water enters vehicle drainage openings");
  await expect(lookupResults.locator('a[href="/symptoms/dometic-freshjet-fjx-water-enters-vehicle-drainage/"]')).toBeVisible();

  await searchbox.fill("freshjet under voltage campsite management sufficient power");
  const voltageSymptom = lookupResults.locator(
    'a[href="/symptoms/dometic-freshjet-fjx-voltage-protection-campsite-power/"]',
  );
  await expect(voltageSymptom).toBeVisible();

  await voltageSymptom.click();
  await expect(page.getByRole("heading", { name: "Dometic FreshJet FJX voltage protection and campsite power" })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: /Ask campsite management/i })).toBeVisible();
});

test("lookup surfaces Dometic DF furnace operating-manual symptom pages", async ({ page }) => {
  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("dometic df furnace blower turns on will not light thermostat heat lp air");
  await expect(lookupResults.locator('a[href="/symptoms/dometic-df-furnace-blower-runs-will-not-light/"]')).toBeVisible();

  await searchbox.fill("dometic df furnace shuts off before desired temperature vents blocked");
  await expect(
    lookupResults.locator('a[href="/symptoms/dometic-df-furnace-shuts-off-before-temperature-vents/"]'),
  ).toBeVisible();

  await searchbox.fill("dometic df furnace soot exhaust vent carbon monoxide snow obstruction");
  await expect(
    lookupResults.locator('a[href="/symptoms/dometic-df-furnace-soot-exhaust-vent-carbon-monoxide/"]'),
  ).toBeVisible();

  await searchbox.fill("dometic df furnace initial smoke first firing 5 10 minutes gas odor");
  await expect(lookupResults.locator('a[href="/symptoms/dometic-df-furnace-initial-smoke-or-gas-odor/"]')).toBeVisible();

  await searchbox.fill("dometic df furnace monthly annual maintenance qualified rv service technician");
  const maintenance = lookupResults.locator('a[href="/symptoms/dometic-df-furnace-maintenance-service-boundary/"]');
  await expect(maintenance).toBeVisible();

  await maintenance.click();
  await expect(page.getByRole("heading", { name: "Dometic DF furnace maintenance and service boundary" })).toBeVisible();
  await expect(page.getByText(/annual maintenance of the device must be performed by a qualified RV service technician/i)).toBeVisible();
});

test("lookup surfaces Suburban cooking and wall-heater symptom pages", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("suburban range cooktop gas odor propane bottle");
  await expect(lookupResults.locator('a[href="/symptoms/suburban-range-cooktop-gas-odor/"]')).toBeVisible();

  await searchbox.fill("suburban cooktop burner extinguishes wait five minutes relight");
  await expect(lookupResults.locator('a[href="/symptoms/suburban-range-cooktop-burner-lighting-blowout/"]')).toBeVisible();

  await searchbox.fill("suburban cooktop yellow flame burners not igniting properly gas valve difficult to turn");
  await expect(lookupResults.locator('a[href="/symptoms/suburban-range-cooktop-abnormal-flame-service/"]')).toBeVisible();

  await searchbox.fill("suburban range oven pilot cover oven vent carbon monoxide foil");
  await expect(
    lookupResults.locator('a[href="/symptoms/suburban-range-oven-pilot-vent-carbon-monoxide/"]'),
  ).toBeVisible();

  await searchbox.fill("suburban griddle ignition 5 seconds wait 5 minutes grease fire storage");
  await expect(lookupResults.locator('a[href="/symptoms/suburban-griddle-ignition-grease-storage/"]')).toBeVisible();

  await searchbox.fill("suburban griddle flame check venturi insects valve not smooth rv service");
  await expect(lookupResults.locator('a[href="/symptoms/suburban-griddle-flame-venturi-service/"]')).toBeVisible();

  await searchbox.fill("suburban electric wall heater thermostat switch light high limit blocked air inlet outlet");
  const wallHeater = lookupResults.locator('a[href="/symptoms/suburban-electric-wall-heater-thermostat-high-limit-shutdown/"]');
  await expect(wallHeater).toBeVisible();

  await wallHeater.click();
  await expect(page.getByRole("heading", { name: "Suburban electric wall heater thermostat and high-limit shutdown" })).toBeVisible();
  await expect(page.getByText(/cannot be completely turned off by use of the thermostat knob alone/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces Cummins Onan generator symptom support pages", async ({ page }) => {
  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("onan no start wait 2 minutes overcrank");
  await expect(lookupResults.locator('a[href="/symptoms/onan-generator-no-start-cranking-delay-overcrank/"]')).toBeVisible();

  await searchbox.fill("onan no output breaker too many appliances");
  await expect(lookupResults.locator('a[href="/symptoms/onan-generator-no-output-breaker-load-management/"]')).toBeVisible();

  await searchbox.fill("onan high altitude 3.5 percent fewer appliances");
  await expect(lookupResults.locator('a[href="/symptoms/onan-generator-altitude-derating-fewer-appliances/"]')).toBeVisible();

  await searchbox.fill("onan oil fuel air cleaner dusty 150 hours");
  await expect(lookupResults.locator('a[href="/symptoms/onan-generator-fuel-oil-maintenance-before-start/"]')).toBeVisible();

  await searchbox.fill("onan carbon monoxide exhaust leak co detector");
  await expect(lookupResults.locator('a[href="/symptoms/onan-generator-exhaust-co-shutdown-service/"]')).toBeVisible();
});

test("part capture panel persists owner-entered model and part notes locally", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("textbox", { name: "Brand", exact: true }).fill("Furrion");
  await page.getByRole("textbox", { name: "Model number", exact: true }).fill("FACW12ESPA-BL");
  await page.getByRole("textbox", { name: "Part or board number", exact: true }).fill("control box label unreadable");
  await page.getByRole("button", { name: "Save capture" }).click();
  await page.reload();

  await expect(page.getByRole("textbox", { name: "Brand", exact: true })).toHaveValue("Furrion");
  await expect(page.getByRole("textbox", { name: "Model number", exact: true })).toHaveValue("FACW12ESPA-BL");
  await expect(page.getByRole("textbox", { name: "Part or board number", exact: true })).toHaveValue("control box label unreadable");
});
