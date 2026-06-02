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

  await page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" }).fill("norcold no co");
  const firstResult = page.locator('section[aria-label="Lookup results"] a.entry-card').first();
  await expect(firstResult).toHaveAttribute("href", "/codes/norcold-1200-no-co/");

  await page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" }).fill("furrion 10.6 e3 compressor");
  await expect(firstResult).toHaveAttribute("href", "/codes/furrion-10-6-refrigerator-e3/");

  await page.getByRole("searchbox", { name: "Search by brand, model, code, or symptom" }).fill("furrion 15 fd");
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
