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

test("lookup surfaces N4000 touchscreen codes and next support-router pages", async ({ page }) => {
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
    ["norcold n4104 error code 3 gas", "/codes/norcold-n4000-error-3-gas-source-unavailable/"],
    ["norcold n4141 error code 10 120v", "/codes/norcold-n4000-error-10-ac-source-unavailable/"],
    ["norcold n4150 error code 18 all symbols", "/codes/norcold-n4000-error-18-startup-all-symbols-lit/"],
    ["coleman airspace heat element 37203 38203", "/symptoms/coleman-airspace-heat-element-service-prep/"],
    ["coleman mach signature series mach 3 mach 8 mach 10 mach 15", "/symptoms/coleman-signature-series-model-family-prep/"],
    ["maxxair products fans covers maxxshades", "/symptoms/maxxair-products-family-routing-prep/"],
    ["maxxair maxxshade 00-03900 00-03901", "/symptoms/maxxair-maxxshade-003900-003901-prep/"],
    ["suburban direct fit replacement tank water heater", "/symptoms/suburban-direct-fit-replacement-water-heater-prep/"],
    ["aqua hot 600d 675d reporter diagnosis winterization", "/symptoms/aquahot-600d-675d-reporter-winterization-prep/"],
    ["aqua magic style plus soft close pedal parts", "/symptoms/thetford-aqua-magic-style-plus-model-service-prep/"],
    ["aqua magic v hand flush one handle parts", "/symptoms/thetford-aqua-magic-v-hand-flush-model-prep/"],
    ["norcold n410 n412 n510 n512 support", "/symptoms/norcold-n410-n412-n510-n512-support-prep/"],
    ["norcold n412 support", "/symptoms/norcold-n410-n412-n510-n512-support-prep/"],
    ["norcold n510 support", "/symptoms/norcold-n410-n412-n510-n512-support-prep/"],
  ] as const;

  for (const [query, href] of cases) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toBeVisible();
  }

  for (const [query, href] of [
    ["accessories", "/symptoms/coleman-climate-control-accessories-model-prep/"],
    ["products", "/symptoms/maxxair-products-family-routing-prep/"],
    ["aqua hot no hot water", "/symptoms/aquahot-600d-675d-reporter-winterization-prep/"],
    ["toilet parts", "/symptoms/thetford-aqua-magic-style-plus-model-service-prep/"],
    ["norcold refrigerator not cooling", "/symptoms/norcold-n410-n412-n510-n512-support-prep/"],
  ] as const) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toHaveCount(0);
  }

  await searchbox.fill("norcold n4141 error code 10 120v");
  const n4000Code10 = lookupResults.locator('a[href="/codes/norcold-n4000-error-10-ac-source-unavailable/"]');
  await expect(n4000Code10).toBeVisible();
  await n4000Code10.click();
  await expect(page.getByRole("heading", { name: "Norcold 10" })).toBeVisible();
  await expect(page.getByText(/The refrigerator does not work on 120V/i)).toBeVisible();
  await expect(page.getByText(/Do not hand-light/i)).toBeVisible();

  await page.goto("/");
  await page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" }).fill("aqua magic v hand flush one handle parts");
  const aquaMagicV = page
    .locator('section[aria-label="Lookup results"]')
    .locator('a[href="/symptoms/thetford-aqua-magic-v-hand-flush-model-prep/"]');
  await expect(aquaMagicV).toBeVisible();
  await aquaMagicV.click();
  await expect(page.getByRole("heading", { name: "Thetford Aqua-Magic V hand-flush model prep" })).toBeVisible();
  await expect(page.getByText(/Record whether the toilet is the hand-flush model/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces Dometic warranty, Suburban Advantage, and Norcold support-depth guides", async ({ page }) => {
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
    ["dometic warranty direct purchase claim form", "/symptoms/dometic-direct-purchase-warranty-claim-prep/"],
    ["dometic warranty ac heat pump limited two year paperwork", "/symptoms/dometic-ac-heat-pump-warranty-paperwork-prep/"],
    ["dometic warranty furnace limited two year paperwork", "/symptoms/dometic-furnace-warranty-paperwork-prep/"],
    ["dometic warranty refrigerator limited two year paperwork", "/symptoms/dometic-refrigerator-warranty-paperwork-prep/"],
    ["dometic warranty water heater limited two year paperwork", "/symptoms/dometic-water-heater-warranty-paperwork-prep/"],
    ["suburban advantage tank water heater porcelain anode warranty", "/symptoms/suburban-advantage-tank-water-heater-model-prep/"],
    ["norcold n400 n402 support owner manual parts list", "/symptoms/norcold-n400-n402-support-manual-parts-prep/"],
    ["norcold n2152r support owner manual parts list", "/symptoms/norcold-n2152r-support-manual-parts-prep/"],
  ] as const;

  for (const [query, href] of cases) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toBeVisible();
  }

  for (const [query, href] of [
    ["warranty", "/symptoms/dometic-direct-purchase-warranty-claim-prep/"],
    ["claim", "/symptoms/dometic-direct-purchase-warranty-claim-prep/"],
    ["water heater", "/symptoms/suburban-advantage-tank-water-heater-model-prep/"],
    ["norcold refrigerator not cooling", "/symptoms/norcold-n400-n402-support-manual-parts-prep/"],
    ["heat pump not working", "/symptoms/dometic-ac-heat-pump-warranty-paperwork-prep/"],
  ] as const) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toHaveCount(0);
  }

  await searchbox.fill("dometic warranty refrigerator limited two year paperwork");
  const refrigeratorWarranty = lookupResults.locator(
    'a[href="/symptoms/dometic-refrigerator-warranty-paperwork-prep/"]',
  );
  await expect(refrigeratorWarranty).toBeVisible();
  await refrigeratorWarranty.click();
  await expect(page.getByRole("heading", { name: "Dometic refrigerator warranty paperwork prep" })).toBeVisible();
  await expect(page.getByText(/Record model, serial number, purchase date/i)).toBeVisible();

  await page.goto("/");
  await searchbox.fill("norcold n2152r support owner manual parts list");
  const n2152 = lookupResults.locator('a[href="/symptoms/norcold-n2152r-support-manual-parts-prep/"]');
  await expect(n2152).toBeVisible();
  await n2152.click();
  await expect(page.getByRole("heading", { name: "Norcold N2152R support prep" })).toBeVisible();
  await expect(page.getByText(/Record N2152R model and serial details/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces Coleman, MaxxAir, Dometic Ibis, and current warranty statement guides", async ({ page }) => {
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
    ["dometic ibis maintenance inspect return air filter", "/symptoms/dometic-ibis-ac-maintenance-inspection-prep/"],
    ["dometic ibis maintenance ac filter model service prep", "/symptoms/dometic-ibis-ac-maintenance-inspection-prep/"],
    ["coleman mach quiet series model family soft start", "/symptoms/coleman-quiet-series-model-family-prep/"],
    ["coleman mach powersaver low profile model prep", "/symptoms/coleman-powersaver-series-model-family-prep/"],
    ["coleman mach power saver model label support", "/symptoms/coleman-powersaver-series-model-family-prep/"],
    ["coleman mach roughneck ac model family prep", "/symptoms/coleman-roughneck-series-model-family-prep/"],
    ["maxxair fanmate cover model vent rain protection", "/symptoms/maxxair-fanmate-cover-family-prep/"],
    ["maxxair fanmate 955002 smoke cover model prep", "/symptoms/maxxair-fanmate-955002-model-prep/"],
    ["maxxair fanmate 00-955002 cover support", "/symptoms/maxxair-fanmate-955002-model-prep/"],
    [
      "norcold warranty refrigeration consumer statement model serial",
      "/symptoms/norcold-current-refrigeration-warranty-statement-prep/",
    ],
    [
      "norcold warranty refrigerator claim paperwork prep",
      "/symptoms/norcold-current-refrigeration-warranty-statement-prep/",
    ],
    [
      "thetford warranty sanitation consumer statement toilet model",
      "/symptoms/thetford-current-sanitation-warranty-statement-prep/",
    ],
    [
      "thetford warranty toilet model serial purchase date",
      "/symptoms/thetford-current-sanitation-warranty-statement-prep/",
    ],
  ] as const;

  for (const [query, href] of cases) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toBeVisible();
  }

  for (const [query, href] of [
    ["maintenance", "/symptoms/dometic-ibis-ac-maintenance-inspection-prep/"],
    ["filter", "/symptoms/dometic-ibis-ac-maintenance-inspection-prep/"],
    ["quiet air conditioner", "/symptoms/coleman-quiet-series-model-family-prep/"],
    ["power saver", "/symptoms/coleman-powersaver-series-model-family-prep/"],
    ["fan cover", "/symptoms/maxxair-fanmate-cover-family-prep/"],
    ["warranty", "/symptoms/norcold-current-refrigeration-warranty-statement-prep/"],
    ["toilet warranty", "/symptoms/thetford-current-sanitation-warranty-statement-prep/"],
    ["norcold refrigerator not cooling", "/symptoms/norcold-current-refrigeration-warranty-statement-prep/"],
  ] as const) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toHaveCount(0);
  }

  await searchbox.fill("coleman mach quiet series model family soft start");
  const quietSeries = lookupResults.locator('a[href="/symptoms/coleman-quiet-series-model-family-prep/"]');
  await expect(quietSeries).toBeVisible();
  await quietSeries.click();
  await expect(page.getByRole("heading", { name: "Coleman-Mach Quiet Series model-family prep" })).toBeVisible();
  await expect(page.getByText(/Record the Quiet Series model family/i)).toBeVisible();

  await page.goto("/");
  await searchbox.fill("maxxair fanmate 955002 smoke cover model prep");
  const fanmate955002 = lookupResults.locator('a[href="/symptoms/maxxair-fanmate-955002-model-prep/"]');
  await expect(fanmate955002).toBeVisible();
  await fanmate955002.click();
  await expect(page.getByRole("heading", { name: "MaxxAir FanMate 00-955002 model prep" })).toBeVisible();
  await expect(page.getByText(/Record FanMate 00-955002/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces Harrier, toilet, MaxxAir, Furrion/Girard, Suburban, and Onan support guides", async ({
  page,
}) => {
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
    ["dometic harrier water enters vehicle document leak", "/symptoms/dometic-harrier-water-entry-service-prep/"],
    [
      "dometic harrier maintenance inspect filter service prep",
      "/symptoms/dometic-harrier-maintenance-inspection-prep/",
    ],
    ["dometic harrier cleaning roof air conditioner support", "/symptoms/dometic-harrier-cleaning-prep/"],
    ["thetford bravura toilet model support prep", "/symptoms/thetford-bravura-model-support-prep/"],
    ["thetford c224 cw cassette toilet support prep", "/symptoms/thetford-c224-cw-cassette-model-support-prep/"],
    ["furrion fireplace current product family support", "/symptoms/furrion-fireplace-current-product-family-prep/"],
    ["girard cooking support index range hood microwave model", "/symptoms/girard-cooking-support-router-prep/"],
    ["suburban nt park model furnace family prep", "/symptoms/suburban-nt-park-model-furnace-prep/"],
    ["maxxair service locator authorized dealer fan prep", "/symptoms/maxxair-authorized-service-locator-prep/"],
    ["maxxair return policy consumer support routing", "/symptoms/maxxair-return-policy-routing-prep/"],
    ["cummins onan warranty statement rv generator paperwork", "/symptoms/onan-rv-generator-warranty-statement-prep/"],
  ] as const;

  for (const [query, href] of cases) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toBeVisible();
  }

  for (const [query, href] of [
    ["water enters vehicle", "/symptoms/dometic-harrier-water-entry-service-prep/"],
    ["maintenance inspection", "/symptoms/dometic-harrier-maintenance-inspection-prep/"],
    ["cleaning air conditioner", "/symptoms/dometic-harrier-cleaning-prep/"],
    ["toilet support", "/symptoms/thetford-bravura-model-support-prep/"],
    ["cassette toilet", "/symptoms/thetford-c224-cw-cassette-model-support-prep/"],
    ["electric fireplace", "/symptoms/furrion-fireplace-current-product-family-prep/"],
    ["cooking support", "/symptoms/girard-cooking-support-router-prep/"],
    ["park model furnace", "/symptoms/suburban-nt-park-model-furnace-prep/"],
    ["service locator", "/symptoms/maxxair-authorized-service-locator-prep/"],
    ["return policy", "/symptoms/maxxair-return-policy-routing-prep/"],
    ["generator warranty", "/symptoms/onan-rv-generator-warranty-statement-prep/"],
  ] as const) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toHaveCount(0);
  }

  await searchbox.fill("dometic harrier water enters vehicle document leak");
  const harrierWater = lookupResults.locator('a[href="/symptoms/dometic-harrier-water-entry-service-prep/"]');
  await expect(harrierWater).toBeVisible();
  await harrierWater.click();
  await expect(page.getByRole("heading", { name: "Dometic Harrier water-entry service prep" })).toBeVisible();
  await expect(page.getByText(/Record the Harrier model/i)).toBeVisible();

  await page.goto("/");
  await searchbox.fill("cummins onan warranty statement rv generator paperwork");
  const onanWarranty = lookupResults.locator('a[href="/symptoms/onan-rv-generator-warranty-statement-prep/"]');
  await expect(onanWarranty).toBeVisible();
  await onanWarranty.click();
  await expect(page.getByRole("heading", { name: "Onan RV generator warranty statement prep" })).toBeVisible();
  await expect(page.getByText(/Record the generator model/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces the next official support-router batch without generic hijacks", async ({ page }) => {
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
    [
      "dometic freshjet inspection maintenance data label service prep",
      "/symptoms/dometic-freshjet-inspection-maintenance-model-tag-prep/",
    ],
    ["dometic acc3100 modes auto manual sleep vent control", "/symptoms/dometic-acc3100-mode-control-prep/"],
    ["dometic acc3100 cleaning shutdown product support", "/symptoms/dometic-acc3100-cleaning-shutdown-prep/"],
    ["dometic rooftop ac penguin blizzard model routing", "/symptoms/dometic-rooftop-ac-penguin-blizzard-model-routing/"],
    ["furrion range hood support manuals model prep", "/symptoms/furrion-range-hood-model-manual-router-prep/"],
    ["furrion dishwasher support manuals model prep", "/symptoms/furrion-dishwasher-model-manual-router-prep/"],
    ["furrion cooktop current model support router", "/symptoms/furrion-cooktop-current-model-support-router/"],
    [
      "girard appliance support refrigerator tankless prep",
      "/symptoms/girard-appliance-support-router-refrigerator-tankless-prep/",
    ],
    ["suburban advantage tankless control freeze prep", "/symptoms/suburban-advantage-tankless-control-freeze-prep/"],
    ["suburban 3250ast can slide out kitchen model", "/symptoms/suburban-can-slide-out-kitchen-model-product-prep/"],
    [
      "thetford aqua magic vi toilet flush winterizing prep",
      "/symptoms/thetford-aqua-magic-vi-toilet-model-flush-winterizing-prep/",
    ],
    [
      "thetford aqua magic style ii toilet cleaning leak model",
      "/symptoms/thetford-aqua-magic-style-ii-cleaning-leak-model-prep/",
    ],
    ["norcold n10dc model control service routing prep", "/symptoms/norcold-n10dc-model-control-service-routing-prep/"],
    [
      "norcold nr740 discontinued refrigerator defrost prep",
      "/symptoms/norcold-nr740-discontinued-refrigerator-model-defrost-prep/",
    ],
    ["coleman mach 10 signature series model family lookup", "/symptoms/coleman-mach-10-model-family-lookup-prep/"],
    ["coleman mach 15 signature series model load prep", "/symptoms/coleman-mach-15-model-family-load-prep/"],
    ["maxxair maxxfan low profile model control prep", "/symptoms/maxxair-maxxfan-low-profile-model-control-prep/"],
    ["maxxair unimaxx vent lid identification prep", "/symptoms/maxxair-unimaxx-vent-lid-identification-prep/"],
    ["aqua hot 125d model control service prep", "/symptoms/aquahot-125d-model-control-service-prep/"],
    ["aqua hot 175m modular model support routing", "/symptoms/aquahot-175m-model-support-routing-prep/"],
    ["cummins onan ec ags compatibility chart model prep", "/symptoms/onan-ec-ags-compatibility-model-prep/"],
  ] as const;

  for (const [query, href] of cases) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toBeVisible();
  }

  for (const [query, href] of [
    ["inspection maintenance", "/symptoms/dometic-freshjet-inspection-maintenance-model-tag-prep/"],
    ["cleaning shutdown", "/symptoms/dometic-acc3100-cleaning-shutdown-prep/"],
    ["mode control", "/symptoms/dometic-acc3100-mode-control-prep/"],
    ["model routing", "/symptoms/dometic-rooftop-ac-penguin-blizzard-model-routing/"],
    ["range hood", "/symptoms/furrion-range-hood-model-manual-router-prep/"],
    ["furrion range support", "/symptoms/furrion-range-hood-model-manual-router-prep/"],
    ["furrion range model support", "/symptoms/furrion-range-hood-model-manual-router-prep/"],
    ["dishwasher support", "/symptoms/furrion-dishwasher-model-manual-router-prep/"],
    ["cooktop support", "/symptoms/furrion-cooktop-current-model-support-router/"],
    ["tankless control", "/symptoms/suburban-advantage-tankless-control-freeze-prep/"],
    ["slide out", "/symptoms/suburban-can-slide-out-kitchen-model-product-prep/"],
    ["toilet flush", "/symptoms/thetford-aqua-magic-vi-toilet-model-flush-winterizing-prep/"],
    ["service routing", "/symptoms/norcold-n10dc-model-control-service-routing-prep/"],
    ["signature series", "/symptoms/coleman-mach-10-model-family-lookup-prep/"],
    ["vent lid", "/symptoms/maxxair-unimaxx-vent-lid-identification-prep/"],
    ["low profile", "/symptoms/maxxair-maxxfan-low-profile-model-control-prep/"],
    ["compatibility chart", "/symptoms/onan-ec-ags-compatibility-model-prep/"],
  ] as const) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toHaveCount(0);
  }

  await searchbox.fill("dometic acc3100 modes auto manual sleep vent control");
  const acc3100Modes = lookupResults.locator('a[href="/symptoms/dometic-acc3100-mode-control-prep/"]');
  await expect(acc3100Modes).toBeVisible();
  await acc3100Modes.click();
  await expect(page.getByRole("heading", { name: "Dometic ACC3100 roof-vent mode control prep" })).toBeVisible();
  await expect(page.getByText(/Record the ACC3100 model/i)).toBeVisible();

  await page.goto("/");
  await searchbox.fill("cummins onan ec ags compatibility chart model prep");
  const agsCompatibility = lookupResults.locator('a[href="/symptoms/onan-ec-ags-compatibility-model-prep/"]');
  await expect(agsCompatibility).toBeVisible();
  await agsCompatibility.click();
  await expect(page.getByRole("heading", { name: "Onan EC-AGS+ compatibility model prep" })).toBeVisible();
  await expect(page.getByText(/Record the EC-AGS/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces ACC3100 and brand-router prep batch without generic hijacks", async ({ page }) => {
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
    ["dometic acc3100 maintenance air filter blocked", "/symptoms/dometic-acc3100-maintenance-filter-service-prep/"],
    ["dometic acc3100 climate app pairing bluetooth", "/symptoms/dometic-acc3100-climate-app-pairing-prep/"],
    ["dometic acc3100 outside air filter service prep", "/symptoms/dometic-acc3100-outside-filter-service-boundary/"],
    ["dometic acc3100 reset ventilation system", "/symptoms/dometic-acc3100-reset-service-prep/"],
    [
      "dometic acc3100 inside filter blocked authorized service",
      "/symptoms/dometic-acc3100-inside-filter-blocked-authorized-service/",
    ],
    ["dometic acc3100 outside filter blocked prep", "/symptoms/dometic-acc3100-outside-filter-blocked-prep/"],
    [
      "dometic acc3100 display does not respond reset",
      "/symptoms/dometic-acc3100-display-not-responding-reset-prep/",
    ],
    ["dometic acc3100 display shows error code indicator", "/symptoms/dometic-acc3100-display-error-indicator-prep/"],
    ["furrion support router rv appliance product family", "/symptoms/furrion-brand-product-family-support-routing-prep/"],
    [
      "furrion appliances dishwasher washing machine support",
      "/symptoms/furrion-appliances-dishwasher-washing-machine-router-prep/",
    ],
    [
      "furrion comfort ac water heater fireplace thermostat support",
      "/symptoms/furrion-comfort-ac-water-heater-fireplace-thermostat-router/",
    ],
    ["furrion cooking range oven microwave support", "/symptoms/furrion-cooking-category-router-prep/"],
    ["furrion energy power solar router", "/symptoms/furrion-energy-power-solar-router-prep/"],
    ["furrion off grid energy solar controller support", "/symptoms/furrion-off-grid-energy-model-manual-prep/"],
    [
      "furrion power distribution cordset converter support",
      "/symptoms/furrion-power-distribution-cordset-converter-router/",
    ],
    ["greystone support lippert rv appliance router", "/symptoms/greystone-appliance-family-router-prep/"],
    ["coleman mach 3 plus 38203 model service prep", "/symptoms/coleman-mach-3-plus-model-service-prep/"],
    ["coleman mach 8 plus 37203 low profile service prep", "/symptoms/coleman-mach-8-plus-low-profile-service-prep/"],
    ["coleman quiet series mach 3 ducted nonducted prep", "/symptoms/coleman-quiet-mach-3-ducted-nonducted-prep/"],
    ["maxxair maxxfan plus 00 04500k model control prep", "/symptoms/maxxair-maxxfan-plus-model-control-prep/"],
    ["maxxair maxxfan dome bathroom sidewall prep", "/symptoms/maxxair-maxxfan-dome-bath-sidewall-prep/"],
    ["suburban air fryer 3907a model power prep", "/symptoms/suburban-air-fryer-model-power-gas-prep/"],
    ["suburban propane your rv lp gas safety shutdown", "/symptoms/suburban-lp-gas-safety-shutdown-prep/"],
    ["aqua hot 125 dn1 lcd voltage fluid prep", "/symptoms/aquahot-125-dn1-lcd-voltage-fluid-prep/"],
    ["norcold dc105 support not cooling service prep", "/symptoms/norcold-dc105-model-cooling-service-prep/"],
    ["norcold dc105 641476 manual low voltage defrost door", "/symptoms/norcold-dc105-low-voltage-defrost-door-prep/"],
    [
      "thetford aqua magic galaxy starlite discontinued model",
      "/symptoms/thetford-aqua-magic-galaxy-starlite-model-service-prep/",
    ],
    [
      "thetford tecma silence plus 2g controller macerator",
      "/symptoms/thetford-tecma-silence-plus-2g-controller-macerator-service-prep/",
    ],
    ["onan qg 2500 lp kv 0981 0129 spec service prep", "/symptoms/onan-qg-2500-lp-kv-model-spec-service-prep/"],
    ["onan qg 2800 kvc 0981 0158 spec service prep", "/symptoms/onan-qg-2800-kvc-model-spec-service-prep/"],
  ] as const;

  for (const [query, href] of cases) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toBeVisible();
    await expect(lookupResults.locator('a[href^="/symptoms/"]').first(), query).toHaveAttribute("href", href);
  }

  for (const [query, href] of [
    ["maintenance filter", "/symptoms/dometic-acc3100-maintenance-filter-service-prep/"],
    ["climate app", "/symptoms/dometic-acc3100-climate-app-pairing-prep/"],
    ["outside filter", "/symptoms/dometic-acc3100-outside-filter-service-boundary/"],
    ["reset ventilation", "/symptoms/dometic-acc3100-reset-service-prep/"],
    ["inside filter blocked", "/symptoms/dometic-acc3100-inside-filter-blocked-authorized-service/"],
    ["display not responding", "/symptoms/dometic-acc3100-display-not-responding-reset-prep/"],
    ["error code", "/symptoms/dometic-acc3100-display-error-indicator-prep/"],
    ["support router", "/symptoms/furrion-brand-product-family-support-routing-prep/"],
    ["comfort support", "/symptoms/furrion-comfort-ac-water-heater-fireplace-thermostat-router/"],
    ["cooking support", "/symptoms/furrion-cooking-category-router-prep/"],
    ["energy support", "/symptoms/furrion-energy-power-solar-router-prep/"],
    ["power distribution", "/symptoms/furrion-power-distribution-cordset-converter-router/"],
    ["appliance router", "/symptoms/greystone-appliance-family-router-prep/"],
    ["mach 3", "/symptoms/coleman-mach-3-plus-model-service-prep/"],
    ["mach 8", "/symptoms/coleman-mach-8-plus-low-profile-service-prep/"],
    ["maxxfan plus", "/symptoms/maxxair-maxxfan-plus-model-control-prep/"],
    ["dome fan", "/symptoms/maxxair-maxxfan-dome-bath-sidewall-prep/"],
    ["air fryer", "/symptoms/suburban-air-fryer-model-power-gas-prep/"],
    ["propane safety", "/symptoms/suburban-lp-gas-safety-shutdown-prep/"],
    ["low voltage", "/symptoms/norcold-dc105-low-voltage-defrost-door-prep/"],
    ["not cooling", "/symptoms/norcold-dc105-model-cooling-service-prep/"],
    ["model service prep", "/symptoms/onan-qg-2500-lp-kv-model-spec-service-prep/"],
  ] as const) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toHaveCount(0);
  }

  await searchbox.fill("dometic acc3100 display shows error code indicator");
  const acc3100Error = lookupResults.locator('a[href="/symptoms/dometic-acc3100-display-error-indicator-prep/"]');
  await expect(acc3100Error).toBeVisible();
  await acc3100Error.click();
  await expect(page.getByRole("heading", { name: "Dometic ACC3100 display error indicator prep" })).toBeVisible();
  await expect(page.getByText(/Record the ACC3100 model/i)).toBeVisible();

  await page.goto("/");
  await searchbox.fill("onan qg 2500 lp kv 0981 0129 spec service prep");
  const qg2500 = lookupResults.locator('a[href="/symptoms/onan-qg-2500-lp-kv-model-spec-service-prep/"]');
  await expect(qg2500).toBeVisible();
  await qg2500.click();
  await expect(page.getByRole("heading", { name: "Onan QG 2500 LP KV model spec prep" })).toBeVisible();
  await expect(page.getByText(/Record the QG 2500 LP KV model/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces control, model-label, storage, warranty, and parts-prep batch without generic hijacks", async ({
  page,
}) => {
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
    ["dometic ccc2 reset system zone initialization prep", "/symptoms/dometic-ccc2-system-reset-zone-init-prep/"],
    ["dometic brisk controls data tag filter grille model", "/symptoms/dometic-brisk-ac-controls-data-tag-prep/"],
    [
      "dometic fantastic vent 7350 remote rain sensor prep",
      "/symptoms/dometic-fantastic-vent-7350-remote-rain-sensor-prep/",
    ],
    ["dometic 500 series 510 rv toilet cleaning winterizing", "/symptoms/dometic-500-series-toilet-cleaning-winterizing-prep/"],
    [
      "dometic fantastic vent 3350 rain sensor control prep",
      "/symptoms/dometic-fantastic-vent-3350-rain-sensor-control-prep/",
    ],
    [
      "thetford aqua magic v pedal flush model storage prep",
      "/symptoms/thetford-aqua-magic-v-pedal-flush-model-storage-prep/",
    ],
    [
      "thetford aqua magic iv pedal flush discontinued support",
      "/symptoms/thetford-aqua-magic-iv-pedal-flush-discontinued-support-prep/",
    ],
    ["thetford aria classic model control service prep", "/symptoms/thetford-aria-classic-model-control-service-prep/"],
    ["thetford aria deluxe control service mode prep", "/symptoms/thetford-aria-deluxe-control-service-mode-prep/"],
    ["norcold n4150 hts cooling service prep", "/symptoms/norcold-n4150-model-hts-cooling-service-prep/"],
    [
      "norcold n2175 dc fridge night mode door alarm prep",
      "/symptoms/norcold-n2175-dc-fridge-night-mode-door-alarm-prep/",
    ],
    ["coleman digital thermostat model part number prep", "/symptoms/coleman-digital-thermostat-model-prep/"],
    ["coleman mini mach 6727 cooling performance prep", "/symptoms/coleman-mini-mach-cooling-performance-prep/"],
    ["maxxair maxxfan 1 switch wall control behavior", "/symptoms/maxxair-one-switch-wall-control-behavior/"],
    [
      "maxxair maxxfan 2 switch wall control 02000k behavior",
      "/symptoms/maxxair-two-switch-wall-control-behavior/",
    ],
    ["suburban sf q furnace model prep", "/symptoms/suburban-sf-q-furnace-model-prep/"],
    ["suburban elite induction cooktop pan compatibility", "/symptoms/suburban-induction-cooktop-pan-compatibility/"],
    ["aqua hot edge tankless wall controller prep", "/symptoms/aquahot-edge-tankless-control-prep/"],
    ["aqua hot 250d model diesel electric prep", "/symptoms/aquahot-250d-model-prep/"],
    ["aqua hot 400d dual fuel model prep", "/symptoms/aquahot-400d-dual-fuel-prep/"],
    ["furrion fcr06dcgba qr188 storage reset prep", "/symptoms/furrion-fcr06dcgba-storage-reset-prep/"],
    ["furrion fcr20dcafa qr189 storage reset prep", "/symptoms/furrion-fcr20dcafa-storage-reset-prep/"],
    ["furrion refrigerator warranty request w017 prep", "/symptoms/furrion-refrigerator-warranty-request-prep/"],
    ["furrion fac c10sa single zone controller mode prep", "/symptoms/furrion-ac-single-zone-controller-mode-prep/"],
    [
      "furrion enhanced multizone ig fcm00037 app control prep",
      "/symptoms/furrion-enhanced-multizone-app-control-prep/",
    ],
    ["onan generator serial number parts lookup prep", "/symptoms/onan-generator-serial-number-parts-lookup-prep/"],
    ["onan hgjab lp maintenance kit a049e506 service prep", "/symptoms/onan-hgjab-lp-maintenance-kit-service-prep/"],
  ] as const;

  for (const [query, href] of cases) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toBeVisible();
    await expect(lookupResults.locator('a[href^="/symptoms/"]').first(), query).toHaveAttribute("href", href);
  }

  for (const [query, href] of [
    ["thermostat reset", "/symptoms/dometic-ccc2-system-reset-zone-init-prep/"],
    ["air conditioner controls", "/symptoms/dometic-brisk-ac-controls-data-tag-prep/"],
    ["remote rain sensor", "/symptoms/dometic-fantastic-vent-7350-remote-rain-sensor-prep/"],
    ["toilet winterizing", "/symptoms/dometic-500-series-toilet-cleaning-winterizing-prep/"],
    ["fan control", "/symptoms/dometic-fantastic-vent-3350-rain-sensor-control-prep/"],
    ["pedal flush", "/symptoms/thetford-aqua-magic-v-pedal-flush-model-storage-prep/"],
    ["service mode", "/symptoms/thetford-aria-deluxe-control-service-mode-prep/"],
    ["night mode", "/symptoms/norcold-n2175-dc-fridge-night-mode-door-alarm-prep/"],
    ["digital thermostat", "/symptoms/coleman-digital-thermostat-model-prep/"],
    ["wall control", "/symptoms/maxxair-one-switch-wall-control-behavior/"],
    ["single zone controller", "/symptoms/furrion-ac-single-zone-controller-mode-prep/"],
    ["furnace model", "/symptoms/suburban-sf-q-furnace-model-prep/"],
    ["induction cooktop", "/symptoms/suburban-induction-cooktop-pan-compatibility/"],
    ["tankless controller", "/symptoms/aquahot-edge-tankless-control-prep/"],
    ["model prep", "/symptoms/aquahot-250d-model-prep/"],
    ["storage reset", "/symptoms/furrion-fcr06dcgba-storage-reset-prep/"],
    ["warranty request", "/symptoms/furrion-refrigerator-warranty-request-prep/"],
    ["parts lookup", "/symptoms/onan-generator-serial-number-parts-lookup-prep/"],
    ["maintenance kit", "/symptoms/onan-hgjab-lp-maintenance-kit-service-prep/"],
  ] as const) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toHaveCount(0);
  }

  await searchbox.fill("dometic ccc2 reset system zone initialization prep");
  const ccc2Reset = lookupResults.locator('a[href="/symptoms/dometic-ccc2-system-reset-zone-init-prep/"]');
  await expect(ccc2Reset).toBeVisible();
  await ccc2Reset.click();
  await expect(page.getByRole("heading", { name: "Dometic CCC2 system reset and zone initialization prep" })).toBeVisible();
  await expect(page.getByText(/Record the CCC2 thermostat model/i)).toBeVisible();

  await page.goto("/");
  await searchbox.fill("onan hgjab lp maintenance kit a049e506 service prep");
  const onanKit = lookupResults.locator('a[href="/symptoms/onan-hgjab-lp-maintenance-kit-service-prep/"]');
  await expect(onanKit).toBeVisible();
  await onanKit.click();
  await expect(page.getByRole("heading", { name: "Onan HGJAB-LP maintenance kit service prep" })).toBeVisible();
  await expect(page.getByText(/Record the HGJAB-LP generator model/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces display, model, vent, thermostat, and hydronic prep batch without generic hijacks", async ({
  page,
}) => {
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
    ["dometic acc3100 display symbols mean icon ventilation", "/symptoms/dometic-acc3100-display-symbols-prep/"],
    [
      "dometic acc3100 ventilation does not switch on power",
      "/symptoms/dometic-acc3100-ventilation-not-switching-on-prep/",
    ],
    [
      "dometic freshjet roof ac does not switch on power",
      "/symptoms/dometic-freshjet-roof-ac-not-switching-on-prep/",
    ],
    ["dometic freshjet water enters vehicle leak service prep", "/symptoms/dometic-freshjet-water-entry-service-prep/"],
    [
      "dometic brisk no display when air conditioner heat pump turned on",
      "/symptoms/dometic-brisk-ac-no-display-service-prep/",
    ],
    ["dometic ccc2 load shed comfort control center 2", "/symptoms/dometic-ccc2-load-shed-control-prep/"],
    [
      "thetford aria deluxe ii model control service prep",
      "/symptoms/thetford-aria-deluxe-ii-model-control-service-prep/",
    ],
    [
      "thetford aqua magic aurora model service prep",
      "/symptoms/thetford-aqua-magic-aurora-model-service-prep/",
    ],
    [
      "thetford aqua magic style lite toilet model storage prep",
      "/symptoms/thetford-aqua-magic-style-lite-model-storage-prep/",
    ],
    ["norcold n2090r model cooling service prep", "/symptoms/norcold-n2090r-model-cooling-service-prep/"],
    ["norcold polar nv8dc model control service prep", "/symptoms/norcold-polar-nv8dc-model-control-service-prep/"],
    ["furrion 14 vent fan lid ccd0007282 control prep", "/symptoms/furrion-14in-vent-fan-lid-control-prep/"],
    [
      "furrion electronic lid vent fan ccd0009643 control prep",
      "/symptoms/furrion-electronic-lid-vent-fan-control-prep/",
    ],
    ["furrion mppt bt app ccd0007727 status prep", "/symptoms/furrion-mppt-bt-app-status-prep/"],
    ["furrion solar warranty request w018 prep", "/symptoms/furrion-solar-warranty-paperwork-prep/"],
    ["furrion 13 range hood imfha00131 filter prep", "/symptoms/furrion-13in-ducted-range-hood-filter-prep/"],
    ["girard 10 refrigerator ccd0005837 service prep", "/symptoms/girard-10cuft-refrigerator-service-prep/"],
    ["girard grf16dbgs qr183 proper storage prep", "/symptoms/girard-grf16dbgs-refrigerator-storage-prep/"],
    ["girard 12v range hood imfha00122 control prep", "/symptoms/girard-12v-range-hood-control-prep/"],
    ["girard gmw09ab microwave service prep", "/symptoms/girard-gmw09ab-microwave-service-prep/"],
    ["onan qg 2800i 2500i lp 0064324 model label prep", "/symptoms/onan-qg-2800i-2500i-model-label-prep/"],
    ["coleman analog 7330 thermostat part number prep", "/symptoms/coleman-analog-thermostat-part-number-prep/"],
    [
      "coleman 9xxx zone 9330a3341 control package prep",
      "/symptoms/coleman-9xxx-zone-thermostat-control-package-prep/",
    ],
    ["maxxair maxx ii 00 933081 cover prep", "/symptoms/maxxair-maxx-ii-00933081-cover-prep/"],
    ["maxxair maxxfan mini 00 03801 control prep", "/symptoms/maxxair-maxxfan-mini-3801-control-prep/"],
    [
      "suburban nt seq nt16seq 2503abk furnace service prep",
      "/symptoms/suburban-nt-seq-furnace-model-service-prep/",
    ],
    ["suburban sw7ecn e series 120v water heater prep", "/symptoms/suburban-e-series-120v-water-heater-prep/"],
    [
      "aqua hot 250 d03 ahe 250 d03 lcd winterization service prep",
      "/symptoms/aquahot-250-d03-lcd-winterization-service-prep/",
    ],
    ["aqua hot 250p propane model service prep", "/symptoms/aquahot-250p-propane-model-service-prep/"],
    ["aqua hot 400p propane electric service prep", "/symptoms/aquahot-400p-propane-electric-service-prep/"],
  ] as const;

  for (const [query, href] of cases) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toBeVisible();
    await expect(lookupResults.locator('a[href^="/symptoms/"]').first(), query).toHaveAttribute("href", href);
  }

  for (const [query, href] of [
    ["display symbols", "/symptoms/dometic-acc3100-display-symbols-prep/"],
    ["does not switch on", "/symptoms/dometic-acc3100-ventilation-not-switching-on-prep/"],
    ["roof ac water leak", "/symptoms/dometic-freshjet-water-entry-service-prep/"],
    ["load shed", "/symptoms/dometic-ccc2-load-shed-control-prep/"],
    ["aqua magic toilet", "/symptoms/thetford-aqua-magic-aurora-model-service-prep/"],
    ["refrigerator cooling", "/symptoms/norcold-n2090r-model-cooling-service-prep/"],
    ["vent fan lid", "/symptoms/furrion-14in-vent-fan-lid-control-prep/"],
    ["solar warranty", "/symptoms/furrion-solar-warranty-paperwork-prep/"],
    ["range hood", "/symptoms/furrion-13in-ducted-range-hood-filter-prep/"],
    ["microwave service", "/symptoms/girard-gmw09ab-microwave-service-prep/"],
    ["thermostat part number", "/symptoms/coleman-analog-thermostat-part-number-prep/"],
    ["zone thermostat", "/symptoms/coleman-9xxx-zone-thermostat-control-package-prep/"],
    ["vent cover", "/symptoms/maxxair-maxx-ii-00933081-cover-prep/"],
    ["water heater prep", "/symptoms/suburban-e-series-120v-water-heater-prep/"],
    ["propane service", "/symptoms/aquahot-250p-propane-model-service-prep/"],
    ["hydronic heating", "/symptoms/aquahot-400p-propane-electric-service-prep/"],
  ] as const) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toHaveCount(0);
  }

  await searchbox.fill("dometic freshjet water enters vehicle leak service prep");
  const freshjetLeak = lookupResults.locator('a[href="/symptoms/dometic-freshjet-water-entry-service-prep/"]');
  await expect(freshjetLeak).toBeVisible();
  await freshjetLeak.click();
  await expect(page.getByRole("heading", { name: "Dometic FreshJet water-entry service prep" })).toBeVisible();
  await expect(page.getByText(/Record the FreshJet model/i)).toBeVisible();

  await page.goto("/");
  await searchbox.fill("aqua hot 250 d03 ahe 250 d03 lcd winterization service prep");
  const aquaHot250D03 = lookupResults.locator('a[href="/symptoms/aquahot-250-d03-lcd-winterization-service-prep/"]');
  await expect(aquaHot250D03).toBeVisible();
  await aquaHot250D03.click();
  await expect(page.getByRole("heading", { name: "Aqua-Hot 250-D03 LCD and winterization service prep" })).toBeVisible();
  await expect(page.getByText(/Record the Aqua-Hot AHE-250-D03 model/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces toilet, control, locator, warranty, and service prep batch without generic hijacks", async ({
  page,
}) => {
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
    ["dometic masterflush 8500 flush mode storage prep", "/symptoms/dometic-masterflush-flush-mode-storage-prep/"],
    ["dometic acc3100 storage mode service prep", "/symptoms/dometic-acc3100-storage-mode-service-prep/"],
    ["dometic freshjet set timer remote control prep", "/symptoms/dometic-freshjet-timer-control-prep/"],
    ["dometic harrier adjust air nozzles airflow", "/symptoms/dometic-harrier-air-nozzle-control-prep/"],
    [
      "thetford tecma silence plus 2g owner manual",
      "/symptoms/thetford-tecma-silence-plus-2g-control-service-prep/",
    ],
    [
      "thetford electra magic model 80 rv service prep",
      "/symptoms/thetford-electra-magic-model-80-rv-service-prep/",
    ],
    [
      "thetford aqua magic iv hand flush parts",
      "/symptoms/thetford-aqua-magic-iv-hand-flush-model-service-prep/",
    ],
    [
      "thetford c223 cs cassette toilet owner manual",
      "/symptoms/thetford-c223-cs-cassette-toilet-model-service-prep/",
    ],
    ["norcold 2117 owner manual parts list", "/symptoms/norcold-2117-support-manual-parts-prep/"],
    [
      "norcold dc0788 de0788 ev0788 cooling prep",
      "/symptoms/norcold-dc0788-de0788-ev0788-model-cooling-prep/",
    ],
    ["airxcel service center dealer locator rv brands", "/symptoms/airxcel-family-service-locator-prep/"],
    [
      "coleman mach products air conditioners thermostats documentation",
      "/symptoms/coleman-mach-product-family-router-prep/",
    ],
    [
      "coleman mach conversion kits air vantage carrier conversions",
      "/symptoms/coleman-mach-conversion-kit-compatibility-prep/",
    ],
    [
      "maxxair 11a90030z mini plus deluxe wall control",
      "/symptoms/maxxair-mini-plus-deluxe-wall-control-prep/",
    ],
    ["maxxair fanmate 755 855 955 ezclip model prep", "/symptoms/maxxair-fanmate-cover-ezclip-model-prep/"],
    ["maxxair maxxshade 3900 3901 fan shade service prep", "/symptoms/maxxair-maxxshade-fan-shade-service-prep/"],
    ["suburban sf fq furnace model service prep", "/symptoms/suburban-sf-fq-furnace-model-service-prep/"],
    ["suburban elite range 17 22 model prep", "/symptoms/suburban-elite-range-model-prep/"],
    [
      "suburban anode rod 233514 233516 water heater prep",
      "/symptoms/suburban-water-heater-anode-rod-service-prep/",
    ],
    ["aqua hot wave40 wave 40 wifi controls service prep", "/symptoms/aquahot-wave40-model-control-service-prep/"],
    ["furrion fcr10dcgta qr190 storage reset prep", "/symptoms/furrion-fcr10dcgta-storage-reset-prep/"],
    ["furrion fcr11dc qr191 storage reset prep", "/symptoms/furrion-fcr11dc-storage-reset-prep/"],
    ["furrion warranty manual ccd0004843 model serial", "/symptoms/furrion-product-warranty-model-serial-prep/"],
    ["lippert w022 warranty claim ccd0009742 prep", "/symptoms/lippert-furrion-submit-warranty-claim-prep/"],
    ["furrion ac warranty request w013 adb controller prep", "/symptoms/furrion-ac-warranty-model-controller-prep/"],
    [
      "furrion furnace warranty checklist w023 model serial",
      "/symptoms/furrion-furnace-warranty-checklist-prep/",
    ],
    ["lippert qualified tech map service routing", "/symptoms/lippert-qualified-technician-service-routing-prep/"],
    [
      "girard 15 6 12v refrigerator ccd0005727 storage prep",
      "/symptoms/girard-15-6-12v-refrigerator-control-storage-prep/",
    ],
    ["furrion rchef electric oven ccd0005576 control prep", "/symptoms/furrion-rchef-electric-oven-control-service-prep/"],
    ["onan qg 4000 a055e867 4kyfa 6747 gsn warranty prep", "/symptoms/onan-qg4000-gsn-model-warranty-prep/"],
  ] as const;

  for (const [query, href] of cases) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toBeVisible();
    await expect(lookupResults.locator('a[href^="/symptoms/"]').first(), query).toHaveAttribute("href", href);
  }

  for (const [query, href] of [
    ["storage mode", "/symptoms/dometic-acc3100-storage-mode-service-prep/"],
    ["set timer", "/symptoms/dometic-freshjet-timer-control-prep/"],
    ["air nozzles", "/symptoms/dometic-harrier-air-nozzle-control-prep/"],
    ["owner manual", "/symptoms/thetford-tecma-silence-plus-2g-control-service-prep/"],
    ["parts list", "/symptoms/norcold-2117-support-manual-parts-prep/"],
    ["service locator", "/symptoms/airxcel-family-service-locator-prep/"],
    ["conversion kit", "/symptoms/coleman-mach-conversion-kit-compatibility-prep/"],
    ["wall control", "/symptoms/maxxair-mini-plus-deluxe-wall-control-prep/"],
    ["furnace model", "/symptoms/suburban-sf-fq-furnace-model-service-prep/"],
    ["range model", "/symptoms/suburban-elite-range-model-prep/"],
    ["warranty request", "/symptoms/furrion-ac-warranty-model-controller-prep/"],
    ["service routing", "/symptoms/lippert-qualified-technician-service-routing-prep/"],
    ["electric oven", "/symptoms/furrion-rchef-electric-oven-control-service-prep/"],
    ["generator warranty", "/symptoms/onan-qg4000-gsn-model-warranty-prep/"],
    ["hand flush", "/symptoms/thetford-aqua-magic-iv-hand-flush-model-service-prep/"],
    ["conversion kits", "/symptoms/coleman-mach-conversion-kit-compatibility-prep/"],
    ["anode rod", "/symptoms/suburban-water-heater-anode-rod-service-prep/"],
    ["water heater anode rod", "/symptoms/suburban-water-heater-anode-rod-service-prep/"],
    ["warranty claim", "/symptoms/lippert-furrion-submit-warranty-claim-prep/"],
  ] as const) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toHaveCount(0);
  }

  await searchbox.fill("dometic masterflush 8500 flush mode storage prep");
  const masterflush = lookupResults.locator('a[href="/symptoms/dometic-masterflush-flush-mode-storage-prep/"]');
  await expect(masterflush).toBeVisible();
  await masterflush.click();
  await expect(page.getByRole("heading", { name: "Dometic MasterFlush flush-mode and storage prep" })).toBeVisible();
  await expect(page.getByText(/Record the MasterFlush model/i)).toBeVisible();

  await page.goto("/");
  await searchbox.fill("furrion furnace warranty checklist w023 model serial");
  const furnaceWarranty = lookupResults.locator('a[href="/symptoms/furrion-furnace-warranty-checklist-prep/"]');
  await expect(furnaceWarranty).toBeVisible();
  await furnaceWarranty.click();
  await expect(page.getByRole("heading", { name: "Furrion furnace warranty checklist prep" })).toBeVisible();
  await expect(page.getByText(/Shut the furnace off/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces the next model, control, warranty, and service-prep batch", async ({ page }) => {
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
    ["dometic acc3100 select mode turbo sleep auto manual", "/symptoms/dometic-acc3100-mode-sequence-prep/"],
    [
      "dometic acc3100 ventilation system software update app",
      "/symptoms/dometic-acc3100-software-update-prep/",
    ],
    [
      "dometic ccc2 auto change over mode thermostat heat cool",
      "/symptoms/dometic-ccc2-auto-changeover-behavior-prep/",
    ],
    ["norcold n20dc manual parts service prep", "/symptoms/norcold-n20dc-manual-parts-service-prep/"],
    [
      "thetford c403l cassette toilet model service prep",
      "/symptoms/thetford-c403l-cassette-model-service-prep/",
    ],
    [
      "furrion 12v range hood ccd0005505 filter model prep",
      "/symptoms/furrion-12v-range-hood-filter-model-prep/",
    ],
    [
      "furrion electronic lid vent fan kit ccd0010788 prep",
      "/symptoms/furrion-14in-vent-fan-electronic-lid-kit-prep/",
    ],
    ["lippert onecontrol wireless qr061 connection prep", "/symptoms/lippert-onecontrol-wireless-connection-prep/"],
    [
      "coleman mach 12 vdc wall thermostat control prep",
      "/symptoms/coleman-mach-12v-wall-thermostat-control-prep/",
    ],
    [
      "suburban tankless digital control center model prep",
      "/symptoms/suburban-tankless-control-center-model-prep/",
    ],
  ] as const;

  for (const [query, href] of cases) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toBeVisible();
    await expect(lookupResults.locator('a[href^="/symptoms/"]').first(), query).toHaveAttribute("href", href);
  }

  await searchbox.fill("dometic ccc2 auto change over mode thermostat heat cool");
  const autoChangeover = lookupResults.locator(
    'a[href="/symptoms/dometic-ccc2-auto-changeover-behavior-prep/"]',
  );
  await expect(autoChangeover).toBeVisible();
  await autoChangeover.click();
  await expect(page.getByRole("heading", { name: "Dometic CCC2 auto change-over behavior prep" })).toBeVisible();
  await expect(page.getByText(/qualified RV HVAC service/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces the CFX Porta Potti Greystone Furrion microwave and hydronic prep batch", async ({ page }) => {
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
    ["dometic cfx3 35 9600024617 app prep", "/symptoms/dometic-cfx3-35-model-app-prep/"],
    [
      "dometic crx pro 65 crx 0065t freezer storage prep",
      "/symptoms/dometic-crx-pro-65-freezer-compartment-storage-prep/",
    ],
    [
      "thetford porta potti 365 level indicator storage prep",
      "/symptoms/thetford-porta-potti-365-level-indicator-storage-prep/",
    ],
    [
      "greystone 24 slide in range ccd0007534 service prep",
      "/symptoms/greystone-24-slide-in-range-service-prep/",
    ],
    [
      "greystone double induction hob ccd0008385 cookware",
      "/symptoms/greystone-double-induction-hob-cookware-prep/",
    ],
    [
      "furrion 15 otr convection microwave imfha00133 service prep",
      "/symptoms/furrion-15-otr-convection-microwave-service-prep/",
    ],
    [
      "furrion 17 otr air fry microwave ccd0010982 prep",
      "/symptoms/furrion-17-otr-air-fry-microwave-service-prep/",
    ],
    [
      "aqua hot 125 d02 ahm 125d lcd altitude winterization",
      "/symptoms/aquahot-125-d02-lcd-altitude-winterization-prep/",
    ],
    [
      "maxxair maxxfan deluxe 00 07500k remote thermostat prep",
      "/symptoms/maxxair-maxxfan-deluxe-07500k-remote-thermostat-prep/",
    ],
  ] as const;

  for (const [query, href] of cases) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toBeVisible();
    await expect(lookupResults.locator('a[href^="/symptoms/"]').first(), query).toHaveAttribute("href", href);
  }

  await searchbox.fill("dometic cfx3 35 9600024617 app prep");
  const cfx3 = lookupResults.locator('a[href="/symptoms/dometic-cfx3-35-model-app-prep/"]');
  await expect(cfx3).toBeVisible();
  await cfx3.click();
  await expect(page.getByRole("heading", { name: "Dometic CFX3 35 model and app prep" })).toBeVisible();
  await expect(page.getByText(/Record the CFX3 35 model/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces the Thetford MaxxAir Suburban Aqua-Hot Furrion Onan gap-scan prep batch without generic hijacks", async ({
  page,
}) => {
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
    [
      "thetford porta potti 135 bellows storage prep",
      "/symptoms/thetford-porta-potti-135-bellows-storage-prep/",
    ],
    [
      "thetford c500 cassette toilet model manual prep",
      "/symptoms/thetford-c500-cassette-toilet-model-manual-prep/",
    ],
    [
      "maxxair maxxfan pivot 00 61000 keypad prep",
      "/symptoms/maxxair-maxxfan-pivot-0061000-keypad-prep/",
    ],
    [
      "maxxair maxxfan plus 00 04751ks thermostat prep",
      "/symptoms/maxxair-maxxfan-plus-04751ks-thermostat-prep/",
    ],
    ["suburban saw6d direct fit water heater prep", "/symptoms/suburban-saw6d-direct-fit-water-heater-prep/"],
    ["suburban 4063a 23 gas griddle bottle adapter storage prep", "/symptoms/suburban-23-griddle-bottle-adapter-storage-prep/"],
    ["suburban double element induction cooktop control prep", "/symptoms/suburban-double-element-induction-cooktop-control-prep/"],
    ["aqua hot 200 series fluid winterization prep", "/symptoms/aquahot-200-series-fluid-winterization-prep/"],
    [
      "furrion chill adb manual single zone control 2021123818 prep",
      "/symptoms/furrion-chill-adb-manual-single-zone-control-prep/",
    ],
    ["onan qd3200 spec sheet model 0058692 prep", "/symptoms/onan-qd3200-spec-sheet-model-prep/"],
  ] as const;

  for (const [query, href] of cases) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toBeVisible();
    await expect(lookupResults.locator('a[href^="/symptoms/"]').first(), query).toHaveAttribute("href", href);
  }

  for (const query of [
    "warranty",
    "service prep",
    "owner manual",
    "model number",
    "gas range",
    "toilet",
    "portable toilet",
    "cassette toilet",
    "fan",
    "furnace",
    "generator",
    "hydronic",
    "remote",
    "thermostat",
    "storage",
    "recall",
    "water heater",
    "cooktop",
    "air conditioner",
  ]) {
    await searchbox.fill(query);
    for (const [, href] of cases) {
      await expect(lookupResults.locator(`a[href="${href}"]`), `${query} -> ${href}`).toHaveCount(0);
    }
  }

  await searchbox.fill("thetford porta potti 135 bellows storage prep");
  const portaPotti = lookupResults.locator('a[href="/symptoms/thetford-porta-potti-135-bellows-storage-prep/"]');
  await expect(portaPotti).toBeVisible();
  await portaPotti.click();
  await expect(page.getByRole("heading", { name: "Thetford Porta Potti 135 bellows storage prep" })).toBeVisible();
  await expect(page.getByText(/Record the Porta Potti 135 model/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces Dometic Norcold Thetford Coleman Lippert Furrion Suburban Aqua-Hot Onan prep batch without generic hijacks", async ({
  page,
}) => {
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
    [
      "dometic masterflush 7120 9610007270 control prep",
      "/symptoms/dometic-masterflush-7100-control-prep/",
    ],
    ["norcold n4141 model control prep", "/symptoms/norcold-n4141-model-control-prep/"],
    ["thetford t2000 warning code prep", "/symptoms/thetford-t2000-warning-code-prep/"],
    ["thetford c4 cassette toilet model prep", "/symptoms/thetford-c4-cassette-toilet-model-prep/"],
    [
      "coleman mach document library model manual prep",
      "/symptoms/coleman-mach-document-library-model-manual-prep/",
    ],
    ["lippert find a dealer service routing prep", "/symptoms/lippert-dealer-locator-service-routing-prep/"],
    [
      "furrion 20.6 side by side refrigerator ccd 0009671 service prep",
      "/symptoms/furrion-20-6-side-by-side-refrigerator-service-prep/",
    ],
    [
      "suburban drop in 2 burner cooktop model service prep",
      "/symptoms/suburban-drop-in-2-burner-model-service-prep/",
    ],
    ["aqua hot 175 controller service prep", "/symptoms/aquahot-175-controller-service-prep/"],
    ["onan qg 6500 lp a063b875 gsn warranty prep", "/symptoms/onan-qg6500-lp-gsn-warranty-prep/"],
  ] as const;

  for (const [query, href] of cases) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toBeVisible();
    await expect(lookupResults.locator('a[href^="/symptoms/"]').first(), query).toHaveAttribute("href", href);
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
    await searchbox.fill(query);
    for (const [, href] of cases) {
      await expect(lookupResults.locator(`a[href="${href}"]`), `${query} -> ${href}`).toHaveCount(0);
    }
  }

  await searchbox.fill("dometic masterflush 7120 9610007270 control prep");
  const masterflush = lookupResults.locator('a[href="/symptoms/dometic-masterflush-7100-control-prep/"]');
  await expect(masterflush).toBeVisible();
  await masterflush.click();
  await expect(page.getByRole("heading", { name: "Dometic MasterFlush 7100 control prep" })).toBeVisible();
  await expect(page.getByText(/Record the MasterFlush 7120 model/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces Dometic Thetford Coleman MaxxAir Suburban Aqua-Hot Furrion Greystone Girard Onan source-only prep batch without generic hijacks", async ({
  page,
}) => {
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
    ["dometic fa25 fan tastic vent drydock model control prep", "/symptoms/dometic-fa25-fantastic-vent-drydock-model-control-prep/"],
    ["thetford porta potti 465 msd electric flush service prep", "/symptoms/thetford-porta-potti-465-msd-electric-flush-prep/"],
    ["coleman mach soft start kit 1497 3601 breaker trip prep", "/symptoms/coleman-mach-soft-start-kit-breaker-trip-prep/"],
    ["maxxair 00a04401k original maxxfan smoke 4 speed control prep", "/symptoms/maxxair-00a04401k-original-maxxfan-control-prep/"],
    ["suburban 2938abk triple burner propane drop in cooktop service prep", "/symptoms/suburban-2938abk-drop-in-3-burner-service-prep/"],
    ["aqua hot 450d ahe 450 tribridhot diesel energy source prep", "/symptoms/aquahot-450d-model-energy-source-prep/"],
    ["furrion furnace e1 error code service prep", "/symptoms/furrion-furnace-e1-error-service-prep/"],
    ["greystone 1.6 1000 watt microwave ccd 0009770 controls service prep", "/symptoms/greystone-16-1000w-microwave-control-service-prep/"],
    ["greystone 09 microwave control model label service prep", "/symptoms/greystone-09-microwave-control-label-service-prep/"],
    ["greystone 16 microwave 1000 watt control service prep", "/symptoms/greystone-16-1000w-microwave-control-service-prep/"],
    ["girard tankless water heater e9 service prep", "/symptoms/girard-tankless-e9-error-service-prep/"],
    ["onan p2500i a062r850 led display owner manual storage service prep", "/symptoms/onan-p2500i-led-display-storage-service-prep/"],
    ["dometic 400 toilet", "/symptoms/dometic-400-401-essential-toilet-model-fit-prep/"],
    ["coleman mach 35203 0754", "/symptoms/coleman-mach-quiet-mach-10-model-control-prep/"],
    ["suburban 3907a 17 air fryer black glass", "/symptoms/suburban-3907a-air-fryer-power-service-prep/"],
  ] as const;

  for (const [query, href] of cases) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toBeVisible();
    await expect(lookupResults.locator('a[href^="/symptoms/"]').first(), query).toHaveAttribute("href", href);
  }

  for (const query of [
    "service prep",
    "owner manual",
    "toilet",
    "fan",
    "furnace",
    "generator",
    "hydronic",
    "water heater",
    "cooktop",
    "air conditioner",
    "microwave",
    "error code",
    "breaker trip",
    "diesel",
  ]) {
    await searchbox.fill(query);
    for (const [, href] of cases) {
      await expect(lookupResults.locator(`a[href="${href}"]`), `${query} -> ${href}`).toHaveCount(0);
    }
  }

  await searchbox.fill("onan p2500i a062r850 led display owner manual storage service prep");
  const p2500i = lookupResults.locator('a[href="/symptoms/onan-p2500i-led-display-storage-service-prep/"]');
  await expect(p2500i).toBeVisible();
  await p2500i.click();
  await expect(page.getByRole("heading", { name: "Onan P2500i LED Display, Storage, and Service Prep" })).toBeVisible();
  await expect(page.getByText(/Record the P2500i model/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces CFX5 Thetford Norcold Coleman Suburban Aqua-Hot Furrion Greystone Girard MaxxAir and Onan prep batch without generic hijacks", async ({
  page,
}) => {
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
    ["dometic cfx5 alert voltage low battery protection prep", "/symptoms/dometic-cfx5-alert-voltage-low-service-prep/"],
    ["dometic cfx5 warning 33 compressor start fail service prep", "/symptoms/dometic-cfx5-warning-33-compressor-start-fail/"],
    ["dometic cfx5 authentication problem app connect cooler prep", "/symptoms/dometic-cfx5-app-authentication-connection-prep/"],
    ["dometic cfx5 flattening batteries battery protection prep", "/symptoms/dometic-cfx5-battery-drain-protection-prep/"],
    ["dometic freshjet roof air conditioner constantly switches itself off prep", "/symptoms/dometic-freshjet-constant-shutoff-service-prep/"],
    ["thetford campa potti xg tank level storage prep", "/symptoms/thetford-campa-potti-xg-storage-level-prep/"],
    ["thetford porta potti 155 155sl bellows pump storage prep", "/symptoms/thetford-porta-potti-155-bellows-storage-prep/"],
    ["thetford c250 cassette toilet data badge model label service prep", "/symptoms/thetford-c250-cassette-model-label-service-prep/"],
    ["thetford c260 electric ventilator filter odor prep", "/symptoms/thetford-c260-electric-ventilator-filter-prep/"],
    ["norcold dc740 model serial cooling service prep", "/symptoms/norcold-dc740-model-label-cooling-service-prep/"],
    ["norcold dc751 model label cooling service prep", "/symptoms/norcold-dc751-model-label-cooling-service-prep/"],
    ["norcold de0041 ev0041 de0061 ev0061 ac dc refrigerator service prep", "/symptoms/norcold-de-ev-acdc-refrigerator-service-prep/"],
    ["maxxair maxxfan plus 00 04002k control model prep", "/symptoms/maxxair-maxxfan-plus-04002k-control-model-prep/"],
    ["maxxair maxxfan deluxe 00 05100k thermostat control prep", "/symptoms/maxxair-maxxfan-deluxe-05100k-thermostat-control-prep/"],
    ["maxxair maxx i 00 933066 cover fit service prep", "/symptoms/maxxair-maxx-i-00933066-cover-fit-service-prep/"],
    ["maxxair maxx ii 00 933083 smoke cover fit prep", "/symptoms/maxxair-maxx-ii-00933083-cover-fit-service-prep/"],
    ["coleman mach bluetooth ceiling assembly app control prep", "/symptoms/coleman-bluetooth-ceiling-assembly-app-control-prep/"],
    ["coleman mach deluxe chillgrille filter control prep", "/symptoms/coleman-deluxe-chillgrille-filter-control-prep/"],
    ["coleman mach electric heat strips mode service prep", "/symptoms/coleman-electric-heat-strip-mode-service-prep/"],
    ["suburban 17 elite series range black panel flame prep", "/symptoms/suburban-17-elite-range-model-flame-prep/"],
    ["suburban 22 air fryer black glass power control prep", "/symptoms/suburban-22-air-fryer-power-control-prep/"],
    ["suburban st42 tankless water heater model control prep", "/symptoms/suburban-st42-tankless-model-control-prep/"],
    ["suburban 4 gallon dsi water heater switch light prep", "/symptoms/suburban-4-gallon-dsi-water-heater-prep/"],
    ["suburban single element induction cooktop cookware power prep", "/symptoms/suburban-single-induction-cookware-power-prep/"],
    ["aqua hot faq antifreeze ltco model service prep", "/symptoms/aquahot-faq-antifreeze-ltco-service-prep/"],
    ["aqua hot annual service kits model part prep", "/symptoms/aquahot-annual-service-kit-model-prep/"],
    ["aqua hot glenwood flooring system touchscreen control prep", "/symptoms/aquahot-glenwood-floor-control-prep/"],
    ["furrion fmcm15aa 1.5 convection microwave ccd 0009356 control prep", "/symptoms/furrion-15-convection-microwave-control-prep/"],
    ["furrion 17 inch 2 burner range air fry oven ccd 0010484 control prep", "/symptoms/furrion-17-range-air-fry-control-prep/"],
    ["greystone 26 inch electric flat fireplace ccd 0007546 remote control prep", "/symptoms/greystone-26-fireplace-control-prep/"],
    ["greystone 25 combo griddle ccd 0009781 storage prep", "/symptoms/greystone-25-combo-griddle-storage-prep/"],
    ["greystone double induction hob ccd 0009481 power cookware prep", "/symptoms/greystone-double-induction-hob-power-prep/"],
    ["girard tankless water heater e1 e2 error code service prep", "/symptoms/girard-tankless-e1-e2-service-prep/"],
    ["cummins onan rv generators category gsn model family prep", "/symptoms/onan-rv-generator-gsn-model-family-prep/"],
  ] as const;

  for (const [query, href] of cases) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toBeVisible();
    await expect(lookupResults.locator('a[href^="/symptoms/"]').first(), query).toHaveAttribute("href", href);
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
    await searchbox.fill(query);
    for (const [, href] of cases) {
      await expect(lookupResults.locator(`a[href="${href}"]`), `${query} -> ${href}`).toHaveCount(0);
    }
  }

  await searchbox.fill("dometic cfx5 warning 33 compressor start fail service prep");
  const cfx5 = lookupResults.locator('a[href="/symptoms/dometic-cfx5-warning-33-compressor-start-fail/"]');
  await expect(cfx5).toBeVisible();
  await cfx5.click();
  await expect(page.getByRole("heading", { name: "Dometic CFX5 Warning 33 Compressor Start Fail Prep" })).toBeVisible();
  await expect(page.getByText(/Record the CFX5 model/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces the next CFX5 Thetford Norcold MaxxAir Coleman Suburban Aqua-Hot Furrion Greystone Girard and Onan support batch without generic hijacks", async ({
  page,
}) => {
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
    ["dometic cfx5 recommended temperatures refrigerating freezing prep", "/symptoms/dometic-cfx5-temperature-settings-service-prep/"],
    ["dometic cfx5 reverse lid direction model prep", "/symptoms/dometic-cfx5-lid-direction-model-prep/"],
    ["dometic cfx5 power draw battery runtime prep", "/symptoms/dometic-cfx5-battery-runtime-power-prep/"],
    ["dometic cfx5 bluetooth cooler connect app prep", "/symptoms/dometic-cfx5-app-bluetooth-control-prep/"],
    ["dometic cfx5 nearest service provider warranty prep", "/symptoms/dometic-cfx5-service-provider-warranty-prep/"],
    ["thetford permanent toilets model fit prep", "/symptoms/thetford-permanent-toilet-model-fit-prep/"],
    ["thetford portable toilets porta potti storage prep", "/symptoms/thetford-porta-potti-model-storage-prep/"],
    ["thetford cassette toilets tank model prep", "/symptoms/thetford-cassette-toilet-model-tank-prep/"],
    ["thetford aqua magic vi dimensions model prep", "/symptoms/thetford-aqua-magic-vi-dimensions-model-prep/"],
    ["norcold nv1090 support model control prep", "/symptoms/norcold-nv1090-service-model-prep/"],
    ["thetford t2095 drawer refrigerator control prep", "/symptoms/thetford-t2095-control-model-prep/"],
    ["norcold dc refrigerators product group model prep", "/symptoms/norcold-dc-refrigerator-family-model-prep/"],
    ["norcold refrigerator warranty faq paperwork prep", "/symptoms/norcold-refrigerator-warranty-paperwork-prep/"],
    ["maxxair maxxshade plus led fit control prep", "/symptoms/maxxair-maxxshade-plus-led-fit-prep/"],
    ["maxxair covers product family fit prep", "/symptoms/maxxair-cover-family-fit-prep/"],
    ["maxxair unimaxx 00 335002 vent lid fit prep", "/symptoms/maxxair-unimaxx-vent-lid-fit-prep/"],
    ["maxxair ii cover family fit service prep", "/symptoms/maxxair-ii-cover-fit-service-prep/"],
    ["maxxair 10b335015z unimaxx lid hardware service prep", "/symptoms/maxxair-unimaxx-lid-hardware-service-prep/"],
    ["coleman mach iwave m air purifier accessory prep", "/symptoms/coleman-iwave-air-purifier-accessory-prep/"],
    ["coleman mach thermostat controlled ceiling assembly prep", "/symptoms/coleman-thermostat-controlled-ceiling-assembly-prep/"],
    ["coleman mach 8xxx zone thermostats control packages prep", "/symptoms/coleman-8xxx-zone-thermostat-replacement-prep/"],
    ["coleman air vantage conversion kit ct thermostat prep", "/symptoms/coleman-air-vantage-ct-thermostat-prep/"],
    ["suburban rv one combo heater water furnace service prep", "/symptoms/suburban-rv-one-combo-heater-service-prep/"],
    ["suburban 120v electric wall heater control prep", "/symptoms/suburban-electric-wall-heater-control-prep/"],
    ["suburban d de water heater control switch prep", "/symptoms/suburban-d-de-water-heater-switch-prep/"],
    ["suburban furnace core replacement modules service prep", "/symptoms/suburban-furnace-core-module-service-prep/"],
    ["aqua hot gen1 lpg lcd storage prep", "/symptoms/aquahot-gen1-lpg-lcd-storage-prep/"],
    ["aqua hot gen1 gasoline lcd storage prep", "/symptoms/aquahot-gen1-gasoline-lcd-storage-prep/"],
    ["aqua hot contact technical service prep", "/symptoms/aquahot-technical-service-contact-prep/"],
    ["furrion tvs support model warranty prep", "/symptoms/furrion-tv-model-warranty-prep/"],
    ["greystone ranges support manual model label prep", "/symptoms/greystone-range-manual-model-label-prep/"],
    ["greystone cooktops griddles manual storage prep", "/symptoms/greystone-cooktop-griddle-manual-storage-prep/"],
    ["greystone microwaves support model control prep", "/symptoms/greystone-microwave-model-control-prep/"],
    ["girard gp llc other products tankless warranty source prep", "/symptoms/girard-tankless-warranty-source-prep/"],
    ["onan p2500i a074z433 model gsn prep", "/symptoms/onan-p2500i-model-gsn-prep/"],
    ["onan p2500i maintenance kit a058u946 prep", "/symptoms/onan-p2500i-maintenance-kit-prep/"],
    ["onan p9500df vft fuel storage prep", "/symptoms/onan-p9500df-vft-fuel-storage-prep/"],
    ["onan p5000idf efi vft co prep", "/symptoms/onan-p5000idf-efi-vft-co-prep/"],
    ["dometic cfx5 temperature", "/symptoms/dometic-cfx5-temperature-settings-service-prep/"],
    ["suburban 120v wall heater", "/symptoms/suburban-electric-wall-heater-control-prep/"],
    ["greystone range", "/symptoms/greystone-range-manual-model-label-prep/"],
    ["greystone microwave", "/symptoms/greystone-microwave-model-control-prep/"],
    ["onan p5000idf", "/symptoms/onan-p5000idf-efi-vft-co-prep/"],
  ] as const;

  for (const [query, href] of cases) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toBeVisible();
    await expect(lookupResults.locator('a[href^="/symptoms/"]').first(), query).toHaveAttribute("href", href);
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
    await searchbox.fill(query);
    for (const [, href] of cases) {
      await expect(lookupResults.locator(`a[href="${href}"]`), `${query} -> ${href}`).toHaveCount(0);
    }
  }

  await searchbox.fill("dometic cfx5 power draw battery runtime prep");
  const cfx5Power = lookupResults.locator('a[href="/symptoms/dometic-cfx5-battery-runtime-power-prep/"]');
  await expect(cfx5Power).toBeVisible();
  await cfx5Power.click();
  await expect(page.getByRole("heading", { name: "Dometic CFX5 Battery Runtime and Power Prep" })).toBeVisible();
  await expect(page.getByText(/Record the CFX5 model/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces the next official Dometic cooler HVAC Thetford Norcold Coleman MaxxAir Suburban Aqua-Hot Furrion Greystone Girard and Onan batch", async ({
  page,
}) => {
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
    ["dometic cfx5 warranty statement prep", "/symptoms/dometic-cfx5-warranty-statement-prep/"],
    ["dometic cfx5 stand on cooler weight prep", "/symptoms/dometic-cfx5-standing-load-prep/"],
    ["dometic cfx5 battery protection system prep", "/symptoms/dometic-cfx5-battery-protection-system-prep/"],
    ["dometic cfx5 power type dc ac prep", "/symptoms/dometic-cfx5-power-type-prep/"],
    ["dometic cfx5 power cord parts prep", "/symptoms/dometic-cfx5-power-cord-parts-prep/"],
    ["dometic cfx5 product registration prep", "/symptoms/dometic-cfx5-product-registration-prep/"],
    ["dometic cfx5 solar power prep", "/symptoms/dometic-cfx5-solar-power-prep/"],
    ["dometic cfx3 solar power prep", "/symptoms/dometic-cfx3-solar-power-prep/"],
    ["dometic cfx3 warranty statement prep", "/symptoms/dometic-cfx3-warranty-statement-prep/"],
    ["dometic cfx3 product registration prep", "/symptoms/dometic-cfx3-product-registration-prep/"],
    ["dometic cfx3 power cord parts prep", "/symptoms/dometic-cfx3-power-cord-parts-prep/"],
    ["dometic cff cooling range prep", "/symptoms/dometic-cff-cooling-range-prep/"],
    ["dometic cff20 technical data prep", "/symptoms/dometic-cff20-technical-data-prep/"],
    ["dometic cff food freezing too cold prep", "/symptoms/dometic-cff-too-cold-freezing-prep/"],
    ["dometic cfx2 use cooler prep", "/symptoms/dometic-cfx2-use-cooler-prep/"],
    ["dometic cfx2 set temperature prep", "/symptoms/dometic-cfx2-temperature-setting-prep/"],
    ["dometic cfx2 not cooling prep", "/symptoms/dometic-cfx2-not-cooling-prep/"],
    ["furrion fmam11aa air fry microwave control prep", "/symptoms/furrion-fmam11aa-air-fry-microwave-control-prep/"],
    ["furrion furnace e2 error service prep", "/symptoms/furrion-furnace-e2-error-service-prep/"],
    ["furrion furnace e3 e6 error service prep", "/symptoms/furrion-furnace-e3-e6-error-service-prep/"],
    ["girard tankless e3 support video service prep", "/symptoms/girard-tankless-e3-video-service-prep/"],
    ["greystone cf rvhob12 cooktop flame prep", "/symptoms/greystone-cf-rvhob12-cooktop-flame-prep/"],
    ["greystone single induction hob cookware power prep", "/symptoms/greystone-single-induction-hob-power-cookware-prep/"],
    ["onan p4500i overload led service prep", "/symptoms/onan-p4500i-overload-led-service-prep/"],
    ["onan p4500idf fuel display service prep", "/symptoms/onan-p4500idf-fuel-display-service-prep/"],
    ["dometic cfx5 alert lid open greater 3 min prep", "/symptoms/dometic-cfx5-lid-open-alert-prep/"],
    ["dometic freshjet low air output prep", "/symptoms/dometic-freshjet-low-air-output-prep/"],
    ["dometic freshjet roof air conditioner does not switch off prep", "/symptoms/dometic-freshjet-does-not-switch-off-prep/"],
    ["dometic brisk ac maintain air filter prep", "/symptoms/dometic-brisk-air-filter-maintenance-prep/"],
    ["dometic brisk rv air conditioner campsite operation prep", "/symptoms/dometic-brisk-campsite-power-operation-prep/"],
    ["dometic harrier remote control does not register prep", "/symptoms/dometic-harrier-remote-not-registering-prep/"],
    ["norcold 1200 series thetford support prep", "/symptoms/norcold-1200-series-support-prep/"],
    ["norcold 1210 ultraline thetford support prep", "/symptoms/norcold-1210-ultraline-support-prep/"],
    ["norcold n3000 series thetford support prep", "/symptoms/norcold-n3000-series-us-support-prep/"],
    ["norcold ac lp refrigerator how level prep", "/symptoms/norcold-ac-lp-refrigerator-level-prep/"],
    ["norcold refrigerator not cooling thetford faq prep", "/symptoms/norcold-refrigerator-not-cooling-faq-prep/"],
    ["thetford toilet flush does not work faq prep", "/symptoms/thetford-toilet-flush-not-working-faq-prep/"],
    ["coleman mach merv6 replacement air filters prep", "/symptoms/coleman-mach-merv6-filter-access-prep/"],
    ["coleman mach chillgrille ezreach filter prep", "/symptoms/coleman-mach-chillgrille-filter-control-prep/"],
    ["coleman mach carrier conversion rooftop adapter kit prep", "/symptoms/coleman-mach-carrier-conversion-service-prep/"],
    ["maxxair technical service videos library prep", "/symptoms/maxxair-official-video-support-prep/"],
    ["maxxfan mini deluxe 10a03893z control prep", "/symptoms/maxxair-mini-deluxe-control-prep/"],
    ["skymaxx skymaxx plus iom 11b90014 maxxair prep", "/symptoms/maxxair-skymaxx-model-control-prep/"],
    ["suburban sw6d 5238a 6 gallon tank water heater prep", "/symptoms/suburban-sw6d-water-heater-model-prep/"],
    ["suburban sw10d 5242a 10 gallon tank water heater prep", "/symptoms/suburban-sw10d-water-heater-model-prep/"],
    ["suburban st60 5382a tankless water heater control prep", "/symptoms/suburban-st60-tankless-control-prep/"],
    ["aqua hot ahe 375 p02 owner manual prep", "/symptoms/aquahot-375-p02-owner-manual-prep/"],
    ["aqua hot 525 d rev a owner manual prep", "/symptoms/aquahot-525-d-owner-manual-prep/"],
    ["aqua hot gen1 na diesel gasoline user manual prep", "/symptoms/aquahot-gen1-diesel-gasoline-user-prep/"],
    ["dometic cfx5 battery protection", "/symptoms/dometic-cfx5-battery-protection-system-prep/"],
    ["dometic cfx2 not cooling", "/symptoms/dometic-cfx2-not-cooling-prep/"],
    ["furrion furnace e2", "/symptoms/furrion-furnace-e2-error-service-prep/"],
    ["girard tankless e3 support video", "/symptoms/girard-tankless-e3-video-service-prep/"],
    ["greystone induction hob cookware", "/symptoms/greystone-single-induction-hob-power-cookware-prep/"],
    ["suburban sw10d", "/symptoms/suburban-sw10d-water-heater-model-prep/"],
    ["aqua hot 525 d", "/symptoms/aquahot-525-d-owner-manual-prep/"],
    ["onan p4500idf", "/symptoms/onan-p4500idf-fuel-display-service-prep/"],
  ] as const;

  for (const [query, href] of cases) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toBeVisible();
    await expect(lookupResults.locator('a[href^="/symptoms/"]').first(), query).toHaveAttribute("href", href);
  }

  for (const query of [
    "warranty",
    "registration",
    "power",
    "solar",
    "battery protection",
    "standing",
    "temperature",
    "not cooling",
    "microwave",
    "furnace",
    "tankless",
    "cooktop",
    "induction",
    "induction hob",
    "generator",
    "overload",
    "fuel display",
    "filter",
    "merv6 filter",
    "carrier",
    "conversion",
    "owner manual",
    "service video",
    "water heater",
    "hydronic",
    "mini deluxe",
    "ac lp refrigerator level",
  ]) {
    await searchbox.fill(query);
    for (const [, href] of cases) {
      await expect(lookupResults.locator(`a[href="${href}"]`), `${query} -> ${href}`).toHaveCount(0);
    }
  }

  await searchbox.fill("furrion fmam11aa air fry microwave control prep");
  const microwave = lookupResults.locator('a[href="/symptoms/furrion-fmam11aa-air-fry-microwave-control-prep/"]');
  await expect(microwave).toBeVisible();
  await microwave.click();
  await expect(page.getByRole("heading", { name: "Furrion FMAM11AA Air-Fry Microwave Control Prep" })).toBeVisible();
  await expect(page.getByText(/Record the FMAM11AA model/i)).toBeVisible();

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

test("lookup surfaces the next official source gap batch without generic hijacks", async ({ page }) => {
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
    ["dometic cfx2 orange power led", "/symptoms/dometic-cfx2-orange-power-led-prep/"],
    ["dometic cfx3 warning 34", "/symptoms/dometic-cfx3-warning-34-service-prep/"],
    ["thetford t1000e 693095", "/symptoms/thetford-t1000e-user-manual-control-prep/"],
    ["coleman mach 8430 1976 657", "/symptoms/coleman-chillgrille-8430-straight-through-control-prep/"],
    ["maxxair 00 03810w dome plus", "/symptoms/maxxair-dome-plus-03810w-led-control-prep/"],
    ["suburban sw12d 5246a", "/symptoms/suburban-sw12d-12-gallon-model-prep/"],
    ["aqua hot edge ah 1041 02", "/symptoms/aquahot-edge-tankless-controller-prep/"],
    ["furrion furnace e7", "/symptoms/furrion-furnace-e7-error-service-prep/"],
    ["girard tankless e8", "/symptoms/girard-tankless-e8-service-prep/"],
    ["onan p9500df efi", "/symptoms/onan-p9500df-efi-vft-co-fuel-prep/"],
  ] as const;

  for (const [query, href] of cases) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toBeVisible();
    await expect(lookupResults.locator('a[href^="/symptoms/"]').first(), query).toHaveAttribute("href", href);
  }

  for (const query of [
    "display",
    "bluetooth led",
    "battery monitor",
    "orange power led",
    "defrost cooler",
    "warning code",
    "flush panel",
    "cassette",
    "chillgrille",
    "dome plus",
    "fanmate",
    "water heater",
    "door version",
    "control center",
    "air fryer",
    "tankless controller",
    "furnace e7",
    "tankless e4",
    "quiet adb",
    "thermostat adapter",
    "range oven",
    "electric oven",
    "mini rangehood",
    "efi generator",
  ]) {
    await searchbox.fill(query);
    for (const [, href] of cases) {
      await expect(lookupResults.locator(`a[href="${href}"]`), `${query} -> ${href}`).toHaveCount(0);
    }
  }

  await searchbox.fill("dometic cfx2 orange power led");
  const cfx2 = lookupResults.locator('a[href="/symptoms/dometic-cfx2-orange-power-led-prep/"]');
  await expect(cfx2).toBeVisible();
  await cfx2.click();
  await expect(page.getByRole("heading", { name: "Dometic CFX2 Orange Power LED Prep" })).toBeVisible();
  await expect(page.getByText(/Record the CFX2 model/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces the official source continuation batch without generic hijacks", async ({ page }) => {
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
    ["dometic cfx3 warning xx display", "/symptoms/dometic-cfx3-warning-xx-service-prep/"],
    ["dometic cfx3 defrost storage", "/symptoms/dometic-cfx3-defrost-storage-prep/"],
    ["dometic brisk thermostat control panel", "/symptoms/dometic-brisk-thermostat-control-identification-prep/"],
    ["dometic harrier remote batteries", "/symptoms/dometic-harrier-remote-battery-prep/"],
    ["coleman 7330 wall thermostat", "/symptoms/coleman-7330-wall-thermostat-model-state-prep/"],
    ["coleman 7330d3371 7330d3381 thermostat", "/symptoms/coleman-7330d-digital-thermostat-face-prep/"],
    ["maxxair mini maxfan mini plus", "/symptoms/maxxair-mini-model-control-service-prep/"],
    ["suburban slide in cooktops", "/symptoms/suburban-slide-in-cooktops-model-prep/"],
    ["aqua hot 250p owner manual", "/symptoms/aquahot-250p-owner-manual-service-prep/"],
    ["norcold n2175 parts list 641001", "/symptoms/norcold-n2175-parts-list-model-prep/"],
  ] as const;

  for (const [query, href] of cases) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toBeVisible();
    await expect(lookupResults.locator('a[href^="/symptoms/"]').first(), query).toHaveAttribute("href", href);
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
    await searchbox.fill(query);
    for (const [, href] of cases) {
      await expect(lookupResults.locator(`a[href="${href}"]`), `${query} -> ${href}`).toHaveCount(0);
    }
  }

  await searchbox.fill("dometic cfx3 warning xx display");
  const warningRouter = lookupResults.locator('a[href="/symptoms/dometic-cfx3-warning-xx-service-prep/"]');
  await expect(warningRouter).toBeVisible();
  await warningRouter.click();
  await expect(page.getByRole("heading", { name: "Dometic CFX3 Warning XX Service Prep" })).toBeVisible();
  await expect(page.getByText(/Record the CFX3 model/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces the official source control-router batch without generic hijacks", async ({ page }) => {
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
    ["dometic harrier set temperature 895b", "/symptoms/dometic-harrier-set-temperature-control-prep/"],
    ["dometic harrier fan setting manually", "/symptoms/dometic-harrier-fan-setting-control-prep/"],
    ["dometic ibis roof air conditioner does not switch on dc8e", "/symptoms/dometic-ibis-roof-ac-does-not-switch-on-service-prep/"],
    ["dometic brisk zone control 517a", "/symptoms/dometic-brisk-zone-control-prep/"],
    ["dometic cfx2 display brightness 3715", "/symptoms/dometic-cfx2-display-brightness-control-prep/"],
    ["norcold thetford refrigeration model router", "/symptoms/norcold-thetford-refrigeration-model-router-prep/"],
    ["thetford all products product range", "/symptoms/thetford-us-product-range-router-prep/"],
    ["coleman 8330 331 335 multiple zone thermostat", "/symptoms/coleman-8330-multiple-zone-thermostat-prep/"],
    ["maxxair skymaxx 97550 97510", "/symptoms/maxxair-skymaxx-97550-97510-prep/"],
    ["greystone 60 built in electric fireplace ccd 0009757", "/symptoms/greystone-60-fireplace-control-prep/"],
  ] as const;

  for (const [query, href] of cases) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toBeVisible();
    await expect(lookupResults.locator('a[href^="/symptoms/"]').first(), query).toHaveAttribute("href", href);
  }

  for (const query of [
    "set temperature",
    "fan setting",
    "does not switch on",
    "zone control",
    "display brightness",
    "product range",
    "thermostat",
    "maxxshade",
    "skymaxx",
    "fireplace",
  ]) {
    await searchbox.fill(query);
    for (const [, href] of cases) {
      await expect(lookupResults.locator(`a[href="${href}"]`), `${query} -> ${href}`).toHaveCount(0);
    }
  }

  await searchbox.fill("dometic harrier set temperature 895b");
  const harrier = lookupResults.locator('a[href="/symptoms/dometic-harrier-set-temperature-control-prep/"]');
  await expect(harrier).toBeVisible();
  await harrier.click();
  await expect(page.getByRole("heading", { name: "Dometic Harrier Set Temperature Control Prep" })).toBeVisible();
  await expect(page.getByText(/Record the Harrier model/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("lookup surfaces the official source scout batch without generic hijacks", async ({ page }) => {
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
    ["coleman mach rv owners documentation video library", "/symptoms/coleman-mach-rv-owners-support-routing-prep/"],
    ["suburban tankless water heaters freeze protection control center", "/symptoms/suburban-tankless-water-heaters-control-freeze-prep/"],
    ["maxxfan plus 4000ki 4500ki 355mm 12 volt dc", "/symptoms/maxxair-international-maxxfan-plus-opening-power-prep/"],
    ["aqua hot 125 g02 lcd winterizing low voltage shutdown", "/symptoms/aquahot-125-g02-lcd-winterization-prep/"],
    ["fcr20dcafa warm middle beam automatic defrost", "/symptoms/furrion-fcr20dcafa-warm-middle-beam-defrost-prep/"],
    ["furrion air distribution box filter cleaning adb", "/symptoms/furrion-adb-filter-cleaning-prep/"],
    ["onan gsn rv generators maintenance kits prep", "/symptoms/onan-shop-brand-category-gsn-prep/"],
    ["cfx2 connect cooler ac power supply battery", "/symptoms/dometic-cfx2-connect-power-router-prep/"],
    ["norcold n20dc 641044 parts list", "/symptoms/norcold-n20dc-manual-parts-service-prep/"],
    ["norcold n10dc 640138 parts list", "/symptoms/norcold-n10dc-model-control-service-routing-prep/"],
    ["thetford porta potti 565 200458 user manual", "/symptoms/thetford-porta-potti-565-user-manual-prep/"],
  ] as const;
  const protectedHrefs = [
    "/symptoms/coleman-mach-rv-owners-support-routing-prep/",
    "/symptoms/coleman-mach-video-library-service-prep/",
    "/symptoms/coleman-mach-contact-technical-support-prep/",
    "/symptoms/airxcel-contact-brand-routing-prep/",
    "/symptoms/suburban-video-library-prep/",
    "/symptoms/suburban-water-heating-family-router-prep/",
    "/symptoms/suburban-tankless-water-heaters-control-freeze-prep/",
    "/symptoms/suburban-st-tankless-digital-control-prep/",
    "/symptoms/suburban-tank-water-heater-accessories-prep/",
    "/symptoms/maxxair-maxxfan-plus-family-model-prep/",
    "/symptoms/maxxair-maxxfan-plus-international-library-prep/",
    "/symptoms/maxxair-maxxfan-plus-international-4000ki-prep/",
    "/symptoms/maxxair-maxxfan-plus-international-serial-prep/",
    "/symptoms/maxxair-international-maxxfan-plus-opening-power-prep/",
    "/symptoms/aquahot-125-g02-lcd-winterization-prep/",
    "/symptoms/aquahot-125d-125g-contact-routing-prep/",
    "/symptoms/aquahot-rv-products-model-family-router-prep/",
    "/symptoms/aquahot-125g-antifreeze-service-boundary-prep/",
    "/symptoms/furrion-fcr20dcafa-warm-middle-beam-defrost-prep/",
    "/symptoms/furrion-fcr10dcgfa-lockout-look-prep/",
    "/symptoms/furrion-fcr10dcgfa-storage-reset-prep/",
    "/symptoms/furrion-fcr20dcafa-storage-reset-prep/",
    "/symptoms/furrion-adb-filter-cleaning-prep/",
    "/symptoms/furrion-adb-replacement-service-prep/",
    "/symptoms/furrion-tankless-introduction-model-control-prep/",
    "/symptoms/onan-shop-brand-category-gsn-prep/",
    "/symptoms/onan-generator-type-load-planning-prep/",
    "/symptoms/onan-rv-generator-road-maintenance-prep/",
    "/symptoms/onan-portable-generator-camping-load-prep/",
    "/symptoms/dometic-cfx2-switch-off-storage-prep/",
    "/symptoms/dometic-cfx2-connect-power-router-prep/",
    "/symptoms/dometic-cfx2-temperature-unit-control-prep/",
    "/symptoms/dometic-harrier-constant-switch-off-service-prep/",
    "/symptoms/dometic-cfx2-passive-electric-expectations-prep/",
    "/symptoms/norcold-polar-n7x-n8x-support-manual-parts-prep/",
    "/symptoms/norcold-n15dc-support-manual-parts-prep/",
    "/symptoms/norcold-n20dc-manual-parts-service-prep/",
    "/symptoms/norcold-n8dc-manual-parts-service-prep/",
    "/symptoms/norcold-n10dc-model-control-service-routing-prep/",
    "/symptoms/thetford-porta-potti-565-user-manual-prep/",
  ] as const;

  for (const [query, href] of cases) {
    await searchbox.fill(query);
    await expect(lookupResults.locator(`a[href="${href}"]`), query).toBeVisible();
    await expect(lookupResults.locator('a[href^="/symptoms/"]').first(), query).toHaveAttribute("href", href);
  }

  for (const query of [
    "rv owners",
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
    "filter cleaning",
    "reset furrion",
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
  ]) {
    await searchbox.fill(query);
    for (const href of protectedHrefs) {
      await expect(lookupResults.locator(`a[href="${href}"]`), `${query} -> ${href}`).toHaveCount(0);
    }
  }

  await searchbox.fill("coleman mach rv owners documentation video library");
  const ownerRouter = lookupResults.locator('a[href="/symptoms/coleman-mach-rv-owners-support-routing-prep/"]');
  await expect(ownerRouter).toBeVisible();
  await ownerRouter.click();
  await expect(page.getByRole("heading", { name: "Coleman-Mach RV Owners Support Routing Prep" })).toBeVisible();
  await expect(page.getByText(/Record the Coleman-Mach model/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});
