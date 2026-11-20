#!/usr/bin/env node
// Release gates for the one runtime image the Deploy workflow builds, tests and publishes by digest.
//   static  <htmlRoot> <redirectMap>            files copied out of the image (docker cp)
//   runtime <baseURL> <htmlRoot> <redirectMap>  the image's nginx (or the live site after deploy)
// Every failure is printed and exits 1, so the workflow stops before publishing.
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const ORIGIN = "https://rvappliancefaultcodes.com";
const REQUIRED_FILES = ["index.html", "404.html", "sitemap.xml", "robots.txt", "feed.xml"];
const SITE_TITLE = "RV Appliance Code Atlas";

export function parseRedirectMap(text) {
  const entries = [];
  text.split("\n").forEach((raw, index) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;
    const match = line.match(/^"([^"\s]+)"\s+"([^"\s]+)";$/);
    if (!match) throw new Error(`redirect map line ${index + 1} is not \`"from" "to";\`: ${line}`);
    entries.push({ from: match[1], to: match[2] });
  });
  return entries;
}

export function sitemapPaths(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => {
    const url = new URL(match[1].trim());
    if (url.origin !== ORIGIN) throw new Error(`sitemap URL outside ${ORIGIN}: ${url.href}`);
    return url.pathname;
  });
}

// Mirrors nginx `try_files $uri $uri/ =404` with `index index.html`.
export function pageFile(root, urlPath) {
  const base = path.resolve(root);
  const target = path.resolve(base, `.${decodeURIComponent(urlPath)}`);
  if (target !== base && !target.startsWith(`${base}${path.sep}`)) return null;
  if (!urlPath.endsWith("/") && fs.existsSync(target) && fs.statSync(target).isFile()) return target;
  const index = path.join(target, "index.html");
  return fs.existsSync(index) ? index : null;
}

export function checkStatic(root, mapText) {
  const errors = [];
  for (const file of REQUIRED_FILES) {
    if (!fs.existsSync(path.join(root, file))) errors.push(`missing ${file}`);
  }
  if (errors.length) return errors;
  if (!fs.readFileSync(path.join(root, "index.html"), "utf8").includes(SITE_TITLE)) {
    errors.push(`index.html does not contain "${SITE_TITLE}"`);
  }

  const pages = sitemapPaths(fs.readFileSync(path.join(root, "sitemap.xml"), "utf8"));
  if (pages.length === 0) errors.push("sitemap.xml lists no URLs");
  if (new Set(pages).size !== pages.length) errors.push("sitemap.xml lists a URL twice");
  for (const page of pages) {
    if (!pageFile(root, page)) errors.push(`sitemap URL has no page: ${page}`);
  }

  const redirects = parseRedirectMap(mapText);
  if (redirects.length === 0) errors.push("redirect map is empty");
  const sources = new Set(redirects.map((entry) => entry.from));
  const html = new Map();
  for (const { from, to } of redirects) {
    if (!from.startsWith("/") || !to.startsWith("/")) {
      errors.push(`redirect is not site-relative: ${from} -> ${to}`);
      continue;
    }
    // The map is evaluated before try_files, so a source that is also a page would hide it.
    if (pageFile(root, from)) errors.push(`redirect source shadows an existing page: ${from}`);
    const [targetPath, fragment] = to.split("#");
    if (sources.has(targetPath)) errors.push(`redirect chain: ${from} -> ${to}`);
    const file = pageFile(root, targetPath);
    if (!file) {
      errors.push(`redirect target has no page: ${from} -> ${to}`);
      continue;
    }
    if (fragment) {
      if (!html.has(file)) html.set(file, fs.readFileSync(file, "utf8"));
      if (!html.get(file).includes(`id="${fragment}"`)) errors.push(`redirect target anchor missing: ${from} -> ${to}`);
    }
  }
  return errors;
}

export function request(baseURL, urlPath, headers = {}) {
  const url = new URL(urlPath, baseURL);
  const client = url.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = client.request(
      url,
      { method: "GET", headers: { "user-agent": "rv-release-check", ...headers }, timeout: 15_000 },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () =>
          resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString("utf8") }),
        );
      },
    );
    req.on("timeout", () => req.destroy(new Error(`timeout: ${url.href}`)));
    req.on("error", reject);
    req.end();
  });
}

// Every 1/25th of the map plus its last entry: covers the whole map without 1,000+ requests.
export function sampleRedirects(entries, count = 25) {
  if (entries.length === 0) return [];
  const step = Math.max(1, Math.ceil(entries.length / count));
  const sample = entries.filter((_, index) => index % step === 0);
  const last = entries[entries.length - 1];
  return sample.includes(last) ? sample : [...sample, last];
}

async function waitForServer(baseURL, seconds = 30) {
  const deadline = Date.now() + seconds * 1000;
  for (;;) {
    try {
      return await request(baseURL, "/");
    } catch (error) {
      if (Date.now() > deadline) throw new Error(`no response from ${baseURL} within ${seconds}s: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

export async function checkRuntime(baseURL, root, mapText) {
  const errors = [];
  const expect = (condition, message) => condition || errors.push(message);

  const home = await waitForServer(baseURL);
  expect(home.status === 200, `GET / returned ${home.status}`);
  expect(home.body.includes(SITE_TITLE), `GET / body lacks "${SITE_TITLE}"`);
  expect(home.headers["x-content-type-options"] === "nosniff", "GET / lacks X-Content-Type-Options: nosniff");

  const pages = sitemapPaths(fs.readFileSync(path.join(root, "sitemap.xml"), "utf8"));
  for (const page of pages) {
    const res = await request(baseURL, page);
    expect(res.status === 200, `GET ${page} returned ${res.status}`);
    expect(String(res.headers["content-type"]).startsWith("text/html"), `GET ${page} content-type ${res.headers["content-type"]}`);
  }
  for (const [file, type] of [["/sitemap.xml", "xml"], ["/robots.txt", "text/plain"]]) {
    const res = await request(baseURL, file);
    expect(res.status === 200, `GET ${file} returned ${res.status}`);
    expect(String(res.headers["content-type"]).includes(type), `GET ${file} content-type ${res.headers["content-type"]}`);
  }

  const redirects = sampleRedirects(parseRedirectMap(mapText));
  for (const { from, to } of redirects) {
    const res = await request(baseURL, from);
    expect(res.status === 301, `GET ${from} returned ${res.status}, expected 301`);
    expect(res.headers.location === `${ORIGIN}${to}`, `GET ${from} Location ${res.headers.location}, expected ${ORIGIN}${to}`);
  }

  const missing = await request(baseURL, "/__release-check-missing__/");
  expect(missing.status === 404, `unknown path returned ${missing.status}, expected 404`);
  expect(missing.body.includes(SITE_TITLE), "404 response is not the site's 404.html");

  const www = await request(baseURL, "/", { host: "www.rvappliancefaultcodes.com" });
  expect(www.status === 301 && www.headers.location === `${ORIGIN}/`, `www host returned ${www.status} ${www.headers.location}`);

  return { errors, checked: { pages: pages.length, redirects: redirects.length } };
}

async function main([mode, ...args]) {
  if (mode === "static" && args.length === 2) {
    const [root, mapFile] = args;
    const errors = checkStatic(root, fs.readFileSync(mapFile, "utf8"));
    const redirects = parseRedirectMap(fs.readFileSync(mapFile, "utf8")).length;
    return report(errors, `static output OK: ${REQUIRED_FILES.length} required files, sitemap pages and ${redirects} redirect targets resolve`);
  }
  if (mode === "runtime" && args.length === 3) {
    const [baseURL, root, mapFile] = args;
    const { errors, checked } = await checkRuntime(baseURL, root, fs.readFileSync(mapFile, "utf8"));
    return report(errors, `runtime OK at ${baseURL}: home, ${checked.pages} sitemap pages, sitemap/robots, ${checked.redirects} sampled 301s, 404, www redirect`);
  }
  console.error("usage: check-release.mjs static <htmlRoot> <redirectMap> | runtime <baseURL> <htmlRoot> <redirectMap>");
  return 2;
}

function report(errors, okMessage) {
  if (errors.length) {
    for (const error of errors) console.error(`FAIL ${error}`);
    console.error(`${errors.length} release check failure(s)`);
    return 1;
  }
  console.log(okMessage);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (error) => {
      console.error(`FAIL ${error.message}`);
      process.exit(1);
    },
  );
}
