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

test("lookup surfaces Coleman-Mach Wi-Fi thermostat and 48000 support pages", async ({ page }) => {
  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("coleman mach wifi thermostat 2.4ghz smart life tuya app not connecting");
  await expect(
    lookupResults.locator('a[href="/symptoms/coleman-mach-wifi-thermostat-2-4ghz-app-connection/"]'),
  ).toBeVisible();

  await searchbox.fill("coleman mach wifi thermostat compatibility 12vdc analog bluetooth upgrade");
  await expect(
    lookupResults.locator('a[href="/symptoms/coleman-mach-wifi-thermostat-compatibility-upgrade-check/"]'),
  ).toBeVisible();

  await searchbox.fill("coleman mach wifi thermostat eco comfort scheduling modes fan speed");
  await expect(
    lookupResults.locator('a[href="/symptoms/coleman-mach-wifi-thermostat-eco-comfort-schedule-mode/"]'),
  ).toBeVisible();

  await searchbox.fill("coleman mach 48000 heat pump high pressure switch lockout dirty filters");
  await expect(
    lookupResults.locator('a[href="/symptoms/coleman-mach-48000-heat-pump-high-pressure-lockout/"]'),
  ).toBeVisible();
});

test("lookup surfaces Coleman-Mach 48000 AC owner-manual and 2025 catalog support pages", async ({ page }) => {
  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("coleman mach 48000 ac cool night below 75 evaporator coil iced up high fan");
  await expect(
    lookupResults.locator('a[href="/symptoms/coleman-mach-48000-ac-cool-night-evaporator-ice-up/"]'),
  ).toBeVisible();

  await searchbox.fill("coleman mach 48000 air conditioner short cycle breaker trips wait 2 minutes");
  await expect(
    lookupResults.locator('a[href="/symptoms/coleman-mach-48000-ac-short-cycle-breaker-trip/"]'),
  ).toBeVisible();

  await searchbox.fill("coleman mach 48000 elect-a-heat not enough heat chill chaser not furnace");
  await expect(
    lookupResults.locator('a[href="/symptoms/coleman-mach-48000-elect-a-heat-not-furnace/"]'),
  ).toBeVisible();

  await searchbox.fill("coleman mach 2025 amcat catalog shroud filter soft start part lookup");
  const catalogGuide = lookupResults.locator('a[href="/symptoms/coleman-mach-2025-amcat-part-model-lookup/"]');
  await expect(catalogGuide).toBeVisible();

  await catalogGuide.click();
  await expect(page.getByRole("heading", { name: "Coleman-Mach 2025 AMCAT catalog model and part lookup" })).toBeVisible();
});

test("lookup surfaces Coleman-Mach 48000 international and 47000 model-family support pages", async ({ page }) => {
  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("coleman mach 48000 international 230 240 vac 50hz model serial qualified installer");
  await expect(
    lookupResults.locator('a[href="/symptoms/coleman-mach-48000-international-service-prep/"]'),
  ).toBeVisible();

  await searchbox.fill("coleman mach 47000 ac 115 vac 60 hz 15 to 20 degree filter qualified technician");
  await expect(
    lookupResults.locator('a[href="/symptoms/coleman-mach-47000-ac-owner-cooling-and-power-check/"]'),
  ).toBeVisible();

  await searchbox.fill("coleman mach 47000 heat pump near freezing high fan auxiliary heat not furnace");
  const heatPumpGuide = lookupResults.locator(
    'a[href="/symptoms/coleman-mach-47000-heat-pump-freezing-aux-heat-limit/"]',
  );
  await expect(heatPumpGuide).toBeVisible();

  await heatPumpGuide.click();
  await expect(page.getByRole("heading", { name: "Coleman-Mach 47000 heat pump freezing and auxiliary heat limits" })).toBeVisible();
});

test("lookup surfaces Coleman-Mach 49000, 9000, and 8000 model-family support pages", async ({ page }) => {
  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("coleman mach 49000 ac high pressure switch lockout dirty filters qualified technician");
  await expect(
    lookupResults.locator('a[href="/symptoms/coleman-mach-49000-ac-high-pressure-lockout/"]'),
  ).toBeVisible();

  await searchbox.fill("coleman mach 49000 heat pump freeze switch near freezing 25 to 40 10 to 20");
  await expect(
    lookupResults.locator('a[href="/symptoms/coleman-mach-49000-heat-pump-freeze-switch-low-heat/"]'),
  ).toBeVisible();

  await searchbox.fill("coleman mach 9000 240 vac 50 hz 15 to 20 filters accredited service");
  await expect(
    lookupResults.locator('a[href="/symptoms/coleman-mach-9000-ac-240v-cooling-filter-check/"]'),
  ).toBeVisible();

  await searchbox.fill("coleman mach 8000 chillgrille directflow louvers washable filter once a month");
  const chillgrilleGuide = lookupResults.locator(
    'a[href="/symptoms/coleman-mach-8000-chillgrille-airflow-filter-louvers/"]',
  );
  await expect(chillgrilleGuide).toBeVisible();

  await chillgrilleGuide.click();
  await expect(page.getByRole("heading", { name: "Coleman-Mach 8000 Chillgrille airflow and filter check" })).toBeVisible();
});

test("lookup surfaces Coleman-Mach 47000 remote-controller support page", async ({ page }) => {
  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("coleman mach 47000 remote controller follow me f c ceiling led button filter");
  const remoteGuide = lookupResults.locator(
    'a[href="/symptoms/coleman-mach-47000-remote-controller-mode-led-check/"]',
  );
  await expect(remoteGuide).toBeVisible();

  await remoteGuide.click();
  await expect(page.getByRole("heading", { name: "Coleman-Mach 47000 remote-controller mode and LED check" })).toBeVisible();
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

test("lookup surfaces post-Coleman Dometic and Furrion support pages", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("dometic americana refrigerator not cooling temperature test");
  await expect(lookupResults.locator('a[href="/symptoms/dometic-americana-not-cooling-temperature-test/"]')).toBeVisible();

  await searchbox.fill("dometic americana defrost ice sharp tool");
  await expect(lookupResults.locator('a[href="/symptoms/dometic-americana-defrost-ice-buildup/"]')).toBeVisible();

  await searchbox.fill("brisk ac frost cooling coil filter fan only");
  await expect(lookupResults.locator('a[href="/symptoms/dometic-brisk-ac-frost-on-cooling-coil/"]')).toBeVisible();

  await searchbox.fill("freshjet not cooling cooling mode");
  await expect(lookupResults.locator('a[href="/symptoms/dometic-freshjet-ac-not-cooling-mode-selection/"]')).toBeVisible();

  await searchbox.fill("furrion chill cube filter led clean reset");
  await expect(
    lookupResults.locator('a[href="/symptoms/furrion-chill-cube-filter-led-remote-mode-max-cool/"]'),
  ).toBeVisible();

  await searchbox.fill("furrion chill 2 low profile water enters vehicle drain");
  await expect(lookupResults.locator('a[href="/symptoms/furrion-chill-2-filter-icing-water-leak/"]')).toBeVisible();

  await searchbox.fill("furrion enhanced multizone e3 mode function lost app pairing");
  await expect(
    lookupResults.locator('a[href="/symptoms/furrion-enhanced-multizone-thermostat-e3-mode-loss-app-pairing/"]'),
  ).toBeVisible();

  await searchbox.fill("furrion furnace lockout reset blower stops 60 seconds");
  await expect(
    lookupResults.locator('a[href="/symptoms/furrion-furnace-lockout-reset-after-air-in-propane-line/"]'),
  ).toBeVisible();

  await searchbox.fill("dometic americana defrost ice sharp tool");
  const americanaDefrost = lookupResults.locator('a[href="/symptoms/dometic-americana-defrost-ice-buildup/"]');
  await expect(americanaDefrost).toBeVisible();
  await americanaDefrost.click();
  await expect(page.getByRole("heading", { name: "Dometic Americana defrost ice buildup" })).toBeVisible();
  await expect(page.getByText(/Do not use sharp tools/i)).toBeVisible();

  await page.goto("/");
  await searchbox.fill("furrion furnace lockout reset blower stops 60 seconds");
  const lockoutReset = lookupResults.locator('a[href="/symptoms/furrion-furnace-lockout-reset-after-air-in-propane-line/"]');
  await expect(lockoutReset).toBeVisible();
  await lockoutReset.click();
  await expect(page.getByRole("heading", { name: "Furrion furnace lockout reset after air in propane line" })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: /After 3 failed attempts/i })).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces post-Coleman Norcold and Furrion service-prep support pages", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("norcold dc740 not cooling low voltage defrost fuse");
  const dc740 = lookupResults.locator('a[href="/symptoms/norcold-dc740-dc751-not-cooling-low-voltage-defrost/"]');
  await expect(dc740).toBeVisible();

  await searchbox.fill("norcold nv1090 night mode defrost storage vents");
  await expect(lookupResults.locator('a[href="/symptoms/norcold-nv1090-cooling-night-mode-defrost-storage/"]')).toBeVisible();

  await searchbox.fill("thetford t2095 door seal night mode storage defrost");
  await expect(
    lookupResults.locator('a[href="/symptoms/thetford-t2095-cooling-door-seal-night-mode-storage/"]'),
  ).toBeVisible();

  await searchbox.fill("norcold 1200 recall hts solid red serial service prep");
  const recallPrep = lookupResults.locator('a[href="/symptoms/norcold-recall-hts-gas-valve-serial-service-prep/"]');
  await expect(recallPrep).toBeVisible();

  await searchbox.fill("furrion thermostat controller compatibility hw v2 furnace missing");
  const compatibilityPrep = lookupResults.locator(
    'a[href="/symptoms/furrion-thermostat-controller-compatibility-service-prep/"]',
  );
  await expect(compatibilityPrep).toBeVisible();

  await searchbox.fill("norcold dc740 not cooling low voltage defrost fuse");
  await expect(dc740).toBeVisible();
  await dc740.click();
  await expect(page.getByRole("heading", { name: "Norcold DC740/DC751 not cooling, low voltage, or defrost checks" })).toBeVisible();
  await expect(page.getByText(/authorized Norcold Service Center/i)).toBeVisible();

  await page.goto("/");
  await searchbox.fill("norcold 1200 recall hts solid red serial service prep");
  await recallPrep.click();
  await expect(page.getByRole("heading", { name: "Norcold recall serial and HTS service-call prep" })).toBeVisible();
  await expect(page.getByText(/trained service technician/i)).toBeVisible();

  await page.goto("/");
  await searchbox.fill("furrion thermostat controller compatibility hw v2 furnace missing");
  await compatibilityPrep.click();
  await expect(page.getByRole("heading", { name: "Furrion thermostat and controller compatibility service prep" })).toBeVisible();
  await expect(page.getByText(/HW:V1.0/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces Furrion/Lippert service-prep gaps", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("furrion dishwasher leak drain cycle countertop manual");
  await expect(
    lookupResults.locator('a[href="/symptoms/furrion-dishwasher-leak-drain-cycle-service-prep/"]'),
  ).toBeVisible();

  await searchbox.fill("furrion convection microwave no heat sparks turntable qualified service");
  const microwaveBoundary = lookupResults.locator(
    'a[href="/symptoms/furrion-microwave-no-heat-sparks-turntable-service-boundary/"]',
  );
  await expect(microwaveBoundary).toBeVisible();

  await searchbox.fill("furrion range hood fan light filter venting");
  await expect(
    lookupResults.locator('a[href="/symptoms/furrion-range-hood-fan-light-filter-venting/"]'),
  ).toBeVisible();

  await searchbox.fill("furrion induction cooktop cookware overheats double burner");
  await expect(
    lookupResults.locator('a[href="/symptoms/furrion-induction-cooktop-cookware-overheat-service-boundary/"]'),
  ).toBeVisible();

  await searchbox.fill("furrion cooking production label warranty model serial w014");
  await expect(
    lookupResults.locator('a[href="/symptoms/furrion-cooking-model-serial-warranty-service-prep/"]'),
  ).toBeVisible();

  await searchbox.fill("furrion water heater energy production label warranty service");
  await expect(
    lookupResults.locator('a[href="/symptoms/furrion-water-heater-energy-label-warranty-service-prep/"]'),
  ).toBeVisible();

  await searchbox.fill("furrion furnace blower runs no ignition");
  const furnaceBoundary = lookupResults.locator(
    'a[href="/symptoms/furrion-furnace-blower-runs-no-ignition-service-prep/"]',
  );
  await expect(furnaceBoundary).toBeVisible();

  await searchbox.fill("furrion convection microwave no heat sparks turntable qualified service");
  await microwaveBoundary.click();
  await expect(
    page.getByRole("heading", { name: "Furrion microwave no heat, sparks, or turntable service boundary" }),
  ).toBeVisible();
  await expect(page.getByText(/qualified service|qualified technician/i)).toBeVisible();
  await expect(page.getByText(/Do not use the microwave if/i)).toBeVisible();

  await page.goto("/");
  await searchbox.fill("furrion furnace blower runs no ignition");
  await furnaceBoundary.click();
  await expect(page.getByRole("heading", { name: "Furrion furnace blower runs with no ignition service prep" })).toBeVisible();
  await expect(page.getByText(/Use qualified RV service for repeated no ignition/i)).toBeVisible();
  await expect(page.getByText(/Shut the furnace off from the thermostat/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
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

test("lookup surfaces Cummins Onan spec-sheet and winterization service-prep pages", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("onan winterization flyer no start after storage stale fuel");
  const winterPrep = lookupResults.locator(
    'a[href="/symptoms/onan-generator-storage-winterization-no-start-service-prep/"]',
  );
  await expect(winterPrep).toBeVisible();

  await searchbox.fill("onan remote panel display accessory catalog 6646901 part number");
  const accessoryPrep = lookupResults.locator(
    'a[href="/symptoms/onan-generator-remote-panel-accessory-part-service-prep/"]',
  );
  await expect(accessoryPrep).toBeVisible();

  await searchbox.fill("onan qg 5500 will run one or two air conditioners load rating");
  const loadPrep = lookupResults.locator('a[href="/symptoms/onan-qg-load-rating-model-spec-service-prep/"]');
  await expect(loadPrep).toBeVisible();

  await searchbox.fill("onan qg 7000idf dual fuel low oil shutdown derating prep");
  await expect(loadPrep).toBeVisible();

  await searchbox.fill("onan winterization flyer no start after storage stale fuel");
  await expect(winterPrep).toBeVisible();
  await winterPrep.click();
  await expect(page.getByRole("heading", { name: "Onan generator storage, winterization, or no-start after sitting" })).toBeVisible();
  await expect(page.getByText(/storage or winterization/i)).toBeVisible();
  await expect(page.getByText(/qualified Cummins Onan service/i)).toBeVisible();

  await page.goto("/");
  await searchbox.fill("onan qg 5500 will run one or two air conditioners load rating");
  await loadPrep.click();
  await expect(page.getByRole("heading", { name: "Onan QG 4000/5500/7000 load rating and model-spec service prep" })).toBeVisible();
  await expect(page.getByText(/Record exact model\/spec, fuel type, rated watts/i)).toBeVisible();
  await expect(page.getByText(/qualified generator service/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces Suburban, MaxxAir, and Aqua-Hot service-prep pages", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("suburban model number locator service center dealer");
  const suburbanPrep = lookupResults.locator('a[href="/symptoms/suburban-model-number-service-locator-prep/"]');
  await expect(suburbanPrep).toBeVisible();

  await searchbox.fill("maxxfan deluxe lid fan beeps remote wall control service prep");
  const maxxfanPrep = lookupResults.locator(
    'a[href="/symptoms/maxxair-maxxfan-deluxe-lid-fan-control-service-prep/"]',
  );
  await expect(maxxfanPrep).toBeVisible();

  await searchbox.fill("maxxair 4 5 6 key wall control fan not responding");
  const wallControlPrep = lookupResults.locator('a[href="/symptoms/maxxair-4-5-6-key-wall-control-service-prep/"]');
  await expect(wallControlPrep).toBeVisible();

  await searchbox.fill("aqua hot 250-p01 use care winterization service prep");
  const aquaHotPrep = lookupResults.locator(
    'a[href="/symptoms/aquahot-250-p01-use-care-winterization-service-prep/"]',
  );
  await expect(aquaHotPrep).toBeVisible();

  await searchbox.fill("suburban model number locator service center dealer");
  await suburbanPrep.click();
  await expect(page.getByRole("heading", { name: "Suburban model number and service-locator prep" })).toBeVisible();
  await expect(page.getByText(/Record the Suburban model number, serial number/i)).toBeVisible();
  await expect(page.getByText(/Use the Suburban service locator to identify an authorized service center/i)).toBeVisible();

  await page.goto("/");
  await searchbox.fill("maxxfan deluxe lid fan beeps remote wall control service prep");
  await maxxfanPrep.click();
  await expect(page.getByRole("heading", { name: "MaxxAir MaxxFan Deluxe lid, fan, or control service prep" })).toBeVisible();
  await expect(page.getByText(/Record keypad or remote behavior/i)).toBeVisible();
  await expect(page.getByText(/qualified RV ventilation service/i)).toBeVisible();

  await page.goto("/");
  await searchbox.fill("aqua hot 250-p01 use care winterization service prep");
  await aquaHotPrep.click();
  await expect(page.getByRole("heading", { name: "Aqua-Hot 250-P01 use, care, or winterization service prep" })).toBeVisible();
  await expect(page.getByText(/Record storage or winterization history/i)).toBeVisible();
  await expect(page.getByText(/qualified Aqua-Hot service/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces Airxcel family service-prep pages", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("airxcel dealer service center locator coleman mach maxxair suburban aquahot");
  const airxcelPrep = lookupResults.locator('a[href="/symptoms/airxcel-family-brand-service-routing-prep/"]');
  await expect(airxcelPrep).toBeVisible();

  await searchbox.fill("coleman mach discontinued ac replacement pre 2012");
  const discontinuedPrep = lookupResults.locator('a[href="/symptoms/coleman-mach-discontinued-ac-replacement-prep/"]');
  await expect(discontinuedPrep).toBeVisible();

  await searchbox.fill("maxxair rain sensor disable remote line of sight screen cleaning");
  const maxxairFaqPrep = lookupResults.locator(
    'a[href="/symptoms/maxxair-rain-sensor-remote-airflow-cleaning-behavior/"]',
  );
  await expect(maxxairFaqPrep).toBeVisible();

  await searchbox.fill("aqua hot 125-dn2 no hot water cabin heat winterizing");
  const aquahot125Prep = lookupResults.locator(
    'a[href="/symptoms/aquahot-125-dn2-use-care-winterization-service-prep/"]',
  );
  await expect(aquahot125Prep).toBeVisible();

  await searchbox.fill("airxcel dealer service center locator coleman mach maxxair suburban aquahot");
  await airxcelPrep.click();
  await expect(page.getByRole("heading", { name: "Airxcel family brand and service-locator routing prep" })).toBeVisible();
  await expect(
    page.getByText("Identify which Airxcel family brand is involved: Coleman-Mach, MaxxAir, Suburban, or Aqua-Hot."),
  ).toBeVisible();

  await page.goto("/");
  await searchbox.fill("maxxair rain sensor disable remote line of sight screen cleaning");
  await maxxairFaqPrep.click();
  await expect(page.getByRole("heading", { name: "MaxxAir rain sensor, remote, airflow, and cleaning behavior" })).toBeVisible();
  await expect(page.getByText(/Record rain-sensor behavior/i)).toBeVisible();

  await page.goto("/");
  await searchbox.fill("aqua hot 125-dn2 no hot water cabin heat winterizing");
  await aquahot125Prep.click();
  await expect(
    page.getByRole("heading", { name: "Aqua-Hot 125-DN2 hot water, cabin heat, winterization, and service prep" }),
  ).toBeVisible();
  await expect(page.getByText(/qualified Aqua-Hot service/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces Dometic and Thetford owner-support pages", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("dometic refrigerator recall model serial service prep");
  const recallPrep = lookupResults.locator(
    'a[href="/symptoms/dometic-refrigerator-recall-model-serial-service-prep/"]',
  );
  await expect(recallPrep).toBeVisible();

  await searchbox.fill("dometic product support form rv van refrigerator air conditioner");
  const supportPrep = lookupResults.locator('a[href="/symptoms/dometic-product-support-form-routing-prep/"]');
  await expect(supportPrep).toBeVisible();

  await searchbox.fill("dometic product registration pnc serial invoice");
  const productRegistrationPrep = lookupResults.locator(
    'a[href="/symptoms/dometic-product-registration-paperwork-prep/"]',
  );
  await expect(productRegistrationPrep).toBeVisible();

  await searchbox.fill("dometic authorized maintenance service provider locator");
  const serviceFinderPrep = lookupResults.locator(
    'a[href="/symptoms/dometic-authorized-maintenance-service-finder-prep/"]',
  );
  await expect(serviceFinderPrep).toBeVisible();

  await searchbox.fill("dometic warranty dealer form traveling service");
  const warrantyPrep = lookupResults.locator('a[href="/symptoms/dometic-warranty-claim-dealer-paperwork-prep/"]');
  await expect(warrantyPrep).toBeVisible();

  await searchbox.fill("dometic 310 toilet winterizing cleaning flush behavior");
  const toiletPrep = lookupResults.locator(
    'a[href="/symptoms/dometic-300-310-320-toilet-cleaning-winterizing-prep/"]',
  );
  await expect(toiletPrep).toBeVisible();

  await searchbox.fill("thetford warranty registration norcold refrigerator serial purchase vin");
  const registrationPrep = lookupResults.locator(
    'a[href="/symptoms/thetford-norcold-warranty-registration-paperwork-prep/"]',
  );
  await expect(registrationPrep).toBeVisible();

  await searchbox.fill("thetford support product finder norcold cassette rv sanitation");
  const productFinderPrep = lookupResults.locator(
    'a[href="/symptoms/thetford-norcold-support-product-finder-routing-prep/"]',
  );
  await expect(productFinderPrep).toBeVisible();

  await searchbox.fill("dometic refrigerator recall model serial service prep");
  await recallPrep.click();
  await expect(page.getByRole("heading", { name: "Dometic refrigerator recall model and serial service prep" })).toBeVisible();
  await expect(page.getByText(/Record the refrigerator model, serial, and product number/i)).toBeVisible();

  await page.goto("/");
  await searchbox.fill("dometic product support form rv van refrigerator air conditioner");
  await supportPrep.click();
  await expect(page.getByRole("heading", { name: "Dometic product-support form routing prep" })).toBeVisible();
  await expect(page.getByText(/Record the product family, model, serial, product number/i)).toBeVisible();

  await page.goto("/");
  await searchbox.fill("dometic product registration pnc serial invoice");
  await productRegistrationPrep.click();
  await expect(page.getByRole("heading", { name: "Dometic product-registration paperwork prep" })).toBeVisible();
  await expect(page.getByText(/Record product family, model, SKU, PNC, serial number/i)).toBeVisible();

  await page.goto("/");
  await searchbox.fill("dometic authorized maintenance service provider locator");
  await serviceFinderPrep.click();
  await expect(
    page.getByRole("heading", { name: "Dometic authorized maintenance and service-finder prep" }),
  ).toBeVisible();
  await expect(page.getByText(/Use the official Dometic maintenance and service finder/i)).toBeVisible();

  await page.goto("/");
  await searchbox.fill("dometic warranty dealer form traveling service");
  await warrantyPrep.click();
  await expect(page.getByRole("heading", { name: "Dometic warranty-claim dealer paperwork prep" })).toBeVisible();
  await expect(page.getByText(/Record product family, model, serial, product number/i)).toBeVisible();

  await page.goto("/");
  await searchbox.fill("dometic 310 toilet winterizing cleaning flush behavior");
  await toiletPrep.click();
  await expect(
    page.getByRole("heading", { name: "Dometic 300, 310, and 320 toilet cleaning and winterizing prep" }),
  ).toBeVisible();
  await expect(page.getByText(/Record whether the unit is a Dometic 300, 310, or 320/i)).toBeVisible();
  await expect(page.getByText(/antifreeze-only winterizing prep/i)).toBeVisible();

  await page.goto("/");
  await searchbox.fill("thetford warranty registration norcold refrigerator serial purchase vin");
  await registrationPrep.click();
  await expect(
    page.getByRole("heading", { name: "Thetford and Norcold warranty-registration paperwork prep" }),
  ).toBeVisible();
  await expect(page.getByText(/Record Thetford or Norcold model and serial details/i)).toBeVisible();

  await page.goto("/");
  await searchbox.fill("thetford support product finder norcold cassette rv sanitation");
  await productFinderPrep.click();
  await expect(
    page.getByRole("heading", { name: "Thetford and Norcold support product-finder routing prep" }),
  ).toBeVisible();
  await expect(page.getByText(/Identify whether the question is Norcold refrigeration/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces Cummins Energy Command AGS status and app support pages", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });

  await searchbox.fill("ec30 safety off and on auto gen disabled after moving rv");
  await expect(lookupResults.locator('a[href="/symptoms/onan-energy-command-safety-off-on-auto-disabled/"]')).toBeVisible();

  await searchbox.fill("energy command auto run low bat auto stop full bat");
  await expect(lookupResults.locator('a[href="/symptoms/onan-energy-command-auto-run-low-battery/"]')).toBeVisible();

  await searchbox.fill("ec ags plus generator does not start in auto mode accelerometer fault");
  await expect(lookupResults.locator('a[href="/symptoms/onan-ec-ags-plus-auto-mode-does-not-start/"]')).toBeVisible();

  await searchbox.fill("ec-ags+ generator does not run ac temperature sensor bluetooth quiet time");
  const acGuide = lookupResults.locator('a[href="/symptoms/onan-ec-ags-plus-generator-does-not-run-ac/"]');
  await expect(acGuide).toBeVisible();

  await acGuide.click();
  await expect(page.getByRole("heading", { name: "Onan EC-AGS+ generator does not run A/C" })).toBeVisible();
  await expect(page.getByText(/Do not enable AGS indoors or in a confined space/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces official owner-safe RM8, FreshJet, warranty, claims, and registration prep pages", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });
  const cases = [
    ["dometic rm8 clean refrigerator drain ventilation grille", "/symptoms/dometic-rm8-cleaning-airflow-prep/"],
    ["dometic rm-8 clean refrigerator drain ventilation grille", "/symptoms/dometic-rm8-cleaning-airflow-prep/"],
    ["dometic rm8 defrost ice heat source", "/symptoms/dometic-rm8-defrost-ice-buildup-prep/"],
    ["dometic rm 8 defrost ice heat source", "/symptoms/dometic-rm8-defrost-ice-buildup-prep/"],
    ["rm8 low outside temperature winter cover snow leaves", "/symptoms/dometic-rm8-low-outside-temperature-winter-cover-prep/"],
    [
      "rm8 operating controls turn off battery igniter mes aes led display",
      "/symptoms/dometic-rm8-operating-controls-shutdown-prep/",
    ],
    ["freshjet remote control modes cooling dehumidification battery", "/symptoms/dometic-freshjet-remote-mode-control-prep/"],
    ["fresh jet remote control modes cooling dehumidification battery", "/symptoms/dometic-freshjet-remote-mode-control-prep/"],
    ["thetford sanitation toilet warranty statement paperwork", "/symptoms/thetford-sanitation-warranty-paperwork-prep/"],
    ["norcold refrigeration refrigerator warranty statement paperwork", "/symptoms/norcold-refrigeration-warranty-paperwork-prep/"],
    ["coleman mach warranty claim model serial service completion paperwork", "/symptoms/coleman-mach-claims-paperwork-prep/"],
    ["aqua hot warranty registration model serial purchase paperwork", "/symptoms/aquahot-warranty-registration-paperwork-prep/"],
  ] as const;

  for (const [query, href] of cases) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toBeVisible();
  }

  async function openGuide(query: string, href: string) {
    await page.goto("/");
    await page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" }).fill(query);
    const link = page.locator('section[aria-label="Lookup results"]').locator(`a[href="${href}"]`);
    await expect(link).toBeVisible();
    await link.click();
  }

  await openGuide("dometic rm8 clean refrigerator drain ventilation grille", "/symptoms/dometic-rm8-cleaning-airflow-prep/");
  await expect(page.getByRole("heading", { name: "Dometic RM8 cleaning, drain, and airflow prep" })).toBeVisible();
  await expect(page.getByText(/Keep the condensation-water drain channel free of deposits/i)).toBeVisible();

  await openGuide("dometic rm8 defrost ice heat source", "/symptoms/dometic-rm8-defrost-ice-buildup-prep/");
  await expect(page.getByRole("heading", { name: "Dometic RM8 defrost and ice-buildup prep" })).toBeVisible();
  await expect(page.getByText(/Do not force ice loose or accelerate defrosting with a heat source/i)).toBeVisible();

  await openGuide("rm8 operating controls turn off battery igniter mes aes led display", "/symptoms/dometic-rm8-operating-controls-shutdown-prep/");
  await expect(page.getByRole("heading", { name: "Dometic RM8 operating controls and shutdown prep" })).toBeVisible();
  await expect(page.getByText(/Record which RM8 control type is installed/i)).toBeVisible();

  await openGuide("freshjet remote control modes cooling dehumidification battery", "/symptoms/dometic-freshjet-remote-mode-control-prep/");
  await expect(page.getByRole("heading", { name: "Dometic FreshJet remote and mode-control prep" })).toBeVisible();
  await expect(page.getByText(/Record remote display state, battery status, selected mode, fan speed, and set temperature/i)).toBeVisible();

  await openGuide("coleman mach warranty claim model serial service completion paperwork", "/symptoms/coleman-mach-claims-paperwork-prep/");
  await expect(page.getByRole("heading", { name: "Coleman-Mach claims paperwork prep" })).toBeVisible();
  await expect(page.getByText(/Do not treat claim paperwork as warranty approval/i)).toBeVisible();

  await openGuide("aqua hot warranty registration model serial purchase paperwork", "/symptoms/aquahot-warranty-registration-paperwork-prep/");
  await expect(page.getByRole("heading", { name: "Aqua-Hot warranty-registration paperwork prep" })).toBeVisible();
  await expect(page.getByText(/Do not post serial, VIN, or purchase paperwork publicly/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces the official Dometic Coleman Furrion Aqua-Hot Thetford and MaxxAir router batch", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });
  const cases = [
    ["dometic rm8 refrigerator not cooling level ventilation", "/symptoms/dometic-rm8-not-cooling-level-ventilation-prep/"],
    ["rm-8 smell ammonia yellow residue shutdown", "/symptoms/dometic-rm8-ammonia-odor-shutdown-prep/"],
    ["rm 8 smell gas shut off lp", "/symptoms/dometic-rm8-gas-odor-shutdown-prep/"],
    ["fresh jet filter clean low airflow maximum efficiency", "/symptoms/dometic-freshjet-filter-cleaning-airflow-prep/"],
    ["freshjet generator pure sine smartstart power prep", "/symptoms/dometic-freshjet-generator-power-prep/"],
    ["dometic americana refrigerator food storage overfilled airflow", "/symptoms/dometic-americana-food-loading-airflow-storage/"],
    ["coleman mach 45000 filter freeze high fan lockout", "/symptoms/coleman-45000-ac-freeze-filter-lockout-prep/"],
    ["coleman 46000 backwall freeze switch heat filter", "/symptoms/coleman-46000-backwall-control-freeze-service-prep/"],
    ["furrion warranty form lippert w-013 w-017", "/symptoms/furrion-lippert-warranty-forms-service-prep/"],
    ["furrion air conditioning chill r32 low profile adb controller", "/symptoms/furrion-ac-manual-model-warranty-router/"],
    ["furrion microwave fmcm15 turntable no heat service prep", "/symptoms/furrion-microwave-manual-model-service-prep/"],
    ["suburban literature technical documents operation manual", "/symptoms/suburban-manual-library-service-boundary-prep/"],
    ["aqua hot manual library 400d 600d owner manual", "/symptoms/aquahot-model-manual-locator-service-prep/"],
    ["aqua hot 400d reporter low voltage winterize", "/symptoms/aquahot-400d-reporter-controls-winterization-service-prep/"],
    ["thetford cassette toilet serial sticker c402", "/symptoms/thetford-cassette-toilet-serial-label-prep/"],
    ["thetford cassette left hand right hand c223 c224", "/symptoms/thetford-cassette-left-right-model-prep/"],
    ["maxxair maxxfan deluxe 07000k remote thermostat", "/symptoms/maxxair-maxxfan-deluxe-model-control-prep/"],
  ] as const;

  for (const [query, href] of cases) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toBeVisible();
  }

  async function openGuide(query: string, href: string) {
    await page.goto("/");
    await page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" }).fill(query);
    const link = page.locator('section[aria-label="Lookup results"]').locator(`a[href="${href}"]`);
    await expect(link).toBeVisible();
    await link.click();
  }

  await openGuide("rm-8 smell ammonia yellow residue shutdown", "/symptoms/dometic-rm8-ammonia-odor-shutdown-prep/");
  await expect(page.getByRole("heading", { name: "Dometic RM8 ammonia odor shutdown prep" })).toBeVisible();
  await expect(page.getByText(/Shut the refrigerator down and move people away from the odor/i)).toBeVisible();

  await openGuide("freshjet generator pure sine smartstart power prep", "/symptoms/dometic-freshjet-generator-power-prep/");
  await expect(page.getByRole("heading", { name: "Dometic FreshJet generator power prep" })).toBeVisible();
  await expect(page.getByText(/Keep generator, transfer, and AC power equipment work with qualified service/i)).toBeVisible();

  await openGuide("furrion microwave fmcm15 turntable no heat service prep", "/symptoms/furrion-microwave-manual-model-service-prep/");
  await expect(page.getByRole("heading", { name: "Furrion microwave manual and service-prep router" })).toBeVisible();
  await expect(page.getByText(/Keep microwave service with qualified technicians/i)).toBeVisible();

  await page.goto("/");
  await searchbox.fill("refrigerator not cooling");
  await expect(lookupResults.locator('a[href="/symptoms/dometic-rm8-not-cooling-level-ventilation-prep/"]')).toHaveCount(0);
  await searchbox.fill("microwave no heat");
  await expect(lookupResults.locator('a[href="/symptoms/furrion-microwave-manual-model-service-prep/"]')).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces the fresh official gap-scan service-prep pages", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });
  const cases = [
    ["hydro flame afm furnace soot vent erratic cycling", "/symptoms/dometic-hydro-flame-furnace-operation-maintenance-safety-prep/"],
    ["freshjet remote does not register battery display", "/symptoms/dometic-freshjet-remote-does-not-register/"],
    [
      "atwood combo water heater works on gas not electric",
      "/symptoms/dometic-atwood-combo-water-heater-gas-electric-mode-failure-prep/",
    ],
    ["maxxfan dome 3812 bathroom fan led not working", "/symptoms/maxxair-maxxfan-dome-model-ventilation-service-prep/"],
    ["aqua hot 450d cabin heat stops when hot water is running", "/symptoms/aquahot-450d-hot-water-priority-service-prep/"],
    ["furrion washer dryer combo leaking not draining", "/symptoms/furrion-washer-dryer-combo-leak-drain-service-prep/"],
    ["which lippert slide out system in-wall slimrack through frame", "/symptoms/lippert-slideout-system-identification-router/"],
    ["norcold n305 n306 recall warranty service prep", "/symptoms/norcold-n305-n306-recall-service-prep/"],
    ["which thetford toilet additive blue green aqua rinse grey water", "/symptoms/thetford-toilet-care-additive-selection/"],
    [
      "thetford cassette toilet c220 c260 c400 model tank capacity",
      "/symptoms/thetford-cassette-toilet-c220-c260-c400-model-prep/",
    ],
  ] as const;

  for (const [query, href] of cases) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toBeVisible();
  }

  await searchbox.fill("maxxair maxxfan deluxe 07000k remote thermostat");
  await expect(lookupResults.locator('a[href="/symptoms/maxxair-maxxfan-deluxe-model-control-prep/"]')).toBeVisible();

  await searchbox.fill("thetford toilet serial");
  await expect(lookupResults.locator('a[href="/symptoms/thetford-rv-toilet-serial-model-label-service-prep/"]')).toBeVisible();

  async function openGuide(query: string, href: string) {
    await page.goto("/");
    await page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" }).fill(query);
    const link = page.locator('section[aria-label="Lookup results"]').locator(`a[href="${href}"]`);
    await expect(link).toBeVisible();
    await link.click();
  }

  await openGuide(
    "atwood combo water heater works on gas not electric",
    "/symptoms/dometic-atwood-combo-water-heater-gas-electric-mode-failure-prep/",
  );
  await expect(
    page.getByRole("heading", { name: "Dometic/Atwood combo water heater gas/electric mode failure prep" }),
  ).toBeVisible();
  await expect(page.getByText(/Shut the water heater down/i)).toBeVisible();
  await expect(page.getByText(/qualified RV water-heater service/i)).toBeVisible();

  await openGuide(
    "thetford cassette toilet c220 c260 c400 model tank capacity",
    "/symptoms/thetford-cassette-toilet-c220-c260-c400-model-prep/",
  );
  await expect(page.getByRole("heading", { name: "Thetford cassette toilet C220/C260/C400 model prep" })).toBeVisible();
  await expect(page.getByText(/Do not use the overview as retrofit/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces the cross-brand support-depth service-prep pages", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });
  const cases = [
    ["is atwood now dometic water heater furnace support", "/symptoms/dometic-atwood-brand-transition-support-routing/"],
    [
      "dometic freshjet control panel symbols fan aa sleep air purifier",
      "/symptoms/dometic-freshjet-control-panel-symbols-prep/",
    ],
    [
      "furrion standard single zone thermostat e1 e2 e3 fan mode",
      "/symptoms/furrion-standard-single-zone-thermostat-control-service-prep/",
    ],
    [
      "furrion washer dryer combo error code winterization filter",
      "/symptoms/furrion-washer-dryer-combo-cleaning-storage-error-service-prep/",
    ],
    ["lippert furrion recall technical service bulletin lookup", "/symptoms/lippert-furrion-recall-tsb-lookup-service-prep/"],
    ["coleman mach rv climate app pairing 6 digit id", "/symptoms/coleman-bluetooth-thermostat-pairing-phone-limit/"],
    ["maxxair warranty registration bill of sale", "/symptoms/maxxair-warranty-bill-of-sale-service-prep/"],
    ["suburban sw6de sw6d del dec model meaning", "/symptoms/suburban-sw-water-heater-model-suffix-service-prep/"],
    [
      "aqua hot factory authorized service center mobile warranty repair",
      "/symptoms/aquahot-authorized-mobile-service-warranty-routing/",
    ],
    ["norcold polar n10 n10lx owner manual parts list", "/symptoms/norcold-polar-n10-manual-parts-service-prep/"],
    [
      "onan generator model spec serial number authorized service dealer",
      "/symptoms/onan-generator-nameplate-authorized-dealer-directory-prep/",
    ],
    ["cummins care onan generator support registration manuals warranty", "/symptoms/cummins-care-onan-support-registration-manuals-prep/"],
  ] as const;

  for (const [query, href] of cases) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toBeVisible();
  }

  await searchbox.fill("water heater no hot water");
  await expect(lookupResults.locator('a[href="/symptoms/dometic-water-heater-current-model-lineup-label-prep/"]')).toHaveCount(0);

  await searchbox.fill("norcold refrigerator not cooling");
  await expect(lookupResults.locator('a[href="/symptoms/norcold-polar-n10-manual-parts-service-prep/"]')).toHaveCount(0);

  async function openGuide(query: string, href: string) {
    await page.goto("/");
    await page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" }).fill(query);
    const link = page.locator('section[aria-label="Lookup results"]').locator(`a[href="${href}"]`);
    await expect(link).toBeVisible();
    await link.click();
  }

  await openGuide("is atwood now dometic water heater furnace support", "/symptoms/dometic-atwood-brand-transition-support-routing/");
  await expect(page.getByRole("heading", { name: "Dometic/Atwood brand-transition support routing" })).toBeVisible();
  await expect(page.getByText(/Use the Dometic transition page/i)).toBeVisible();

  await openGuide(
    "onan generator model spec serial number authorized service dealer",
    "/symptoms/onan-generator-nameplate-authorized-dealer-directory-prep/",
  );
  await expect(page.getByRole("heading", { name: "Onan generator nameplate and authorized dealer directory prep" })).toBeVisible();
  await expect(page.getByText(/Record the generator model, spec, and serial/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces the manufacturer support-extension service-prep pages", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });
  const cases = [
    ["dometic freshjet heat strip does not keep rv warm", "/symptoms/dometic-freshjet-heat-strip-cold-weather-prep/"],
    [
      "dometic ccc2 program 1 program 2 schedule cancel",
      "/symptoms/dometic-ccc2-program-schedule-control-prep/",
    ],
    ["dometic ibis ac low air output clean filters", "/symptoms/dometic-ibis-ac-low-air-output-filter-prep/"],
    [
      "dometic fantastic vent 7350 rain sensor remote",
      "/symptoms/dometic-fantastic-vent-7350-rain-sensor-control-prep/",
    ],
    [
      "furrion refrigerator temperature testing refrigerator not cold",
      "/symptoms/furrion-refrigerator-temperature-testing-service-prep/",
    ],
    [
      "furrion freezer cold refrigerator not cold",
      "/symptoms/furrion-refrigerator-freezer-cold-fridge-warm-service-prep/",
    ],
    ["furrion air conditioner operation mode fan controls", "/symptoms/furrion-ac-operation-mode-control-service-prep/"],
    [
      "furrion 9k under bench air conditioner filter drain controls",
      "/symptoms/furrion-under-bench-ac-filter-drain-control-service-prep/",
    ],
    ["coleman mach support service documents model number warranty", "/symptoms/coleman-mach-support-resource-routing-prep/"],
    ["maxxair rv owners service locator documentation library", "/symptoms/maxxair-rv-owner-product-service-routing-prep/"],
    ["suburban rv appliance support certified gas technician service center", "/symptoms/suburban-service-support-certified-tech-routing-prep/"],
    ["aqua hot 125 gn1 lcd low voltage service prep", "/symptoms/aquahot-125-gn1-lcd-fuel-service-prep/"],
    ["thetford norcold warranty claim authorized service center", "/symptoms/thetford-norcold-warranty-claim-asc-dealer-prep/"],
    ["norcold refrigerator shows fault code what should i do", "/symptoms/norcold-refrigerator-fault-code-record-model-prep/"],
    ["porta potti 565e electric flush batteries storage level indicator", "/symptoms/thetford-porta-potti-565e-battery-flush-storage-prep/"],
    ["onan rv generator warranty coach care service prep", "/symptoms/onan-rv-generator-warranty-coach-care-service-prep/"],
  ] as const;

  for (const [query, href] of cases) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toBeVisible();
  }

  await searchbox.fill("freshjet not cooling");
  await expect(lookupResults.locator('a[href="/symptoms/dometic-freshjet-fj-fjx-temperature-model-label/"]')).toHaveCount(0);

  await searchbox.fill("maxxair fan not working");
  await expect(lookupResults.locator('a[href="/symptoms/maxxair-rv-owner-product-service-routing-prep/"]')).toHaveCount(0);

  await searchbox.fill("claim");
  await expect(lookupResults.locator('a[href="/symptoms/thetford-norcold-warranty-claim-asc-dealer-prep/"]')).toHaveCount(0);

  await searchbox.fill("warranty");
  await expect(lookupResults.locator('a[href="/symptoms/thetford-norcold-warranty-claim-asc-dealer-prep/"]')).toHaveCount(0);

  await searchbox.fill("recall");
  await expect(lookupResults.locator('a[href="/symptoms/norcold-recall-repair-reimbursement-routing/"]')).toHaveCount(0);

  await searchbox.fill("service support");
  await expect(lookupResults.locator('a[href="/symptoms/coleman-mach-support-resource-routing-prep/"]')).toHaveCount(0);
  await expect(lookupResults.locator('a[href="/symptoms/suburban-service-support-certified-tech-routing-prep/"]')).toHaveCount(0);

  await searchbox.fill("coach care");
  await expect(lookupResults.locator('a[href="/symptoms/onan-rv-generator-warranty-coach-care-service-prep/"]')).toHaveCount(0);

  async function openGuide(query: string, href: string) {
    await page.goto("/");
    await page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" }).fill(query);
    const link = page.locator('section[aria-label="Lookup results"]').locator(`a[href="${href}"]`);
    await expect(link).toBeVisible();
    await link.click();
  }

  await openGuide(
    "dometic freshjet heat strip does not keep rv warm",
    "/symptoms/dometic-freshjet-heat-strip-cold-weather-prep/",
  );
  await expect(page.getByRole("heading", { name: "Dometic FreshJet heat-strip cold-weather prep" })).toBeVisible();
  await expect(page.getByText(/Record the outside temperature, thermostat setting, mode, fan setting/i)).toBeVisible();

  await openGuide(
    "norcold refrigerator shows fault code what should i do",
    "/symptoms/norcold-refrigerator-fault-code-record-model-prep/",
  );
  await expect(page.getByRole("heading", { name: "Norcold refrigerator fault-code record and model prep" })).toBeVisible();
  await expect(page.getByText(/Record the exact fault code, model, serial number, power source/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces support-gap extension pages without generic hijacks", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");

  const lookupResults = page.locator('section[aria-label="Lookup results"]');
  const searchbox = page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" });
  const cases = [
    ["dometic brisk ac data tag mfg model maintenance", "/symptoms/dometic-brisk-ac-maintenance-data-tag-prep/"],
    ["freshjet campsite power startup current delay fuse", "/symptoms/dometic-freshjet-campsite-power-startup-prep/"],
    ["furrion net-zero power converter model support", "/symptoms/furrion-power-converter-model-support-routing-prep/"],
    [
      "lippert power gear hydraulic leveling touchpad owner manual",
      "/symptoms/lippert-power-gear-hydraulic-leveling-touchpad-service-prep/",
    ],
    ["coleman underbunk ub11 ub15 washable filter service prep", "/symptoms/coleman-underbunk-ac-filter-model-service-prep/"],
    ["maxxair pivot 00-61000 directional fan control", "/symptoms/maxxair-pivot-model-control-prep/"],
    ["porta potti 245 bellows level indicator storage", "/symptoms/thetford-porta-potti-235-245-255-265-storage-flush-prep/"],
    ["onan green label parts model spec qg 5500", "/symptoms/onan-green-label-parts-model-spec-service-prep/"],
  ] as const;

  for (const [query, href] of cases) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toBeVisible();
  }

  await searchbox.fill("power converter");
  await expect(lookupResults.locator('a[href="/symptoms/furrion-power-converter-model-support-routing-prep/"]')).toHaveCount(0);

  await searchbox.fill("hydraulic leveling");
  await expect(lookupResults.locator('a[href="/symptoms/lippert-power-gear-hydraulic-leveling-touchpad-service-prep/"]')).toHaveCount(0);

  await searchbox.fill("parts list");
  await expect(lookupResults.locator('a[href="/symptoms/norcold-polar-n7x-n8x-support-manual-parts-prep/"]')).toHaveCount(0);

  await searchbox.fill("dometic brisk ac data tag mfg model maintenance");
  const dataTag = lookupResults.locator('a[href="/symptoms/dometic-brisk-ac-maintenance-data-tag-prep/"]');
  await expect(dataTag).toBeVisible();
  await dataTag.click();
  await expect(page.getByRole("heading", { name: "Dometic Brisk AC maintenance data-tag prep" })).toBeVisible();
  await expect(page.getByText(/Use the accessible inside data tag/i)).toBeVisible();

  await page.goto("/");
  await page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" }).fill("onan green label parts model spec qg 5500");
  const onanGreenLabel = page
    .locator('section[aria-label="Lookup results"]')
    .locator('a[href="/symptoms/onan-green-label-parts-model-spec-service-prep/"]');
  await expect(onanGreenLabel).toBeVisible();
  await onanGreenLabel.click();
  await expect(page.getByRole("heading", { name: "Onan Green Label parts model/spec service prep" })).toBeVisible();
  await expect(page.getByText(/Record generator model, spec letter, serial number, hour meter/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
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
