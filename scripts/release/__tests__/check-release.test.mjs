import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { checkRuntime, checkStatic, parseRedirectMap, sampleRedirects } from "../check-release.mjs";

const TITLE = "<title>RV Appliance Code Atlas</title>";

function fixture(extra = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "rv-release-test-"));
  const files = {
    "index.html": TITLE,
    "404.html": TITLE,
    "robots.txt": "User-agent: *\n",
    "feed.xml": "<rss/>",
    "sitemap.xml":
      "<urlset><url><loc>https://rvappliancefaultcodes.com/</loc></url><url><loc>https://rvappliancefaultcodes.com/models/a/</loc></url></urlset>",
    "models/a/index.html": `${TITLE}<section id="code-e1"></section>`,
    ...extra,
  };
  for (const [name, body] of Object.entries(files)) {
    if (body === null) continue;
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.writeFileSync(path.join(root, name), body);
  }
  return root;
}

const GOOD_MAP = '"/codes/a-e1/" "/models/a/#code-e1";\n"/codes/a-e1" "/models/a/#code-e1";\n';

test("a complete artifact passes the static check", () => {
  assert.deepEqual(checkStatic(fixture(), GOOD_MAP), []);
});

test("static check fails closed on missing files, pages, targets, anchors, shadows and chains", () => {
  assert.deepEqual(checkStatic(fixture({ "404.html": null }), GOOD_MAP), ["missing 404.html"]);
  assert.deepEqual(checkStatic(fixture({ "models/a/index.html": null }), "").sort(), [
    "redirect map is empty",
    "sitemap URL has no page: /models/a/",
  ]);
  assert.match(checkStatic(fixture(), '"/codes/x/" "/models/missing/";')[0], /redirect target has no page/);
  assert.match(checkStatic(fixture(), '"/codes/x/" "/models/a/#code-zz";')[0], /anchor missing/);
  assert.match(checkStatic(fixture(), '"/models/a/" "/";')[0], /shadows an existing page/);
  assert.match(checkStatic(fixture(), '"/old/" "/codes/x/";\n"/codes/x/" "/";').join("\n"), /redirect chain/);
});

test("malformed redirect map lines are rejected, not skipped", () => {
  assert.throws(() => parseRedirectMap('"/a/" /b/;'), /line 1/);
  assert.deepEqual(parseRedirectMap('# comment\n\n"/a/" "/b/";'), [{ from: "/a/", to: "/b/" }]);
});

test("redirect sample spans the whole map and keeps the last entry", () => {
  const entries = Array.from({ length: 1057 }, (_, index) => ({ from: `/f${index}/`, to: "/" }));
  const sample = sampleRedirects(entries);
  assert.ok(sample.length >= 25 && sample.length <= 27);
  assert.equal(sample[0], entries[0]);
  assert.equal(sample.at(-1), entries.at(-1));
});

test("runtime check passes a correct server and reports a wrong redirect", async (t) => {
  const root = fixture();
  let redirectTarget = "/models/a/#code-e1";
  const server = http.createServer((req, res) => {
    if (req.headers.host === "www.rvappliancefaultcodes.com") {
      res.writeHead(301, { location: "https://rvappliancefaultcodes.com/" }).end();
    } else if (req.url.startsWith("/codes/")) {
      res.writeHead(301, { location: `https://rvappliancefaultcodes.com${redirectTarget}` }).end();
    } else if (req.url === "/sitemap.xml") {
      res.writeHead(200, { "content-type": "text/xml" }).end("<urlset/>");
    } else if (req.url === "/robots.txt") {
      res.writeHead(200, { "content-type": "text/plain" }).end("ok");
    } else if (req.url === "/" || req.url === "/models/a/") {
      res.writeHead(200, { "content-type": "text/html", "x-content-type-options": "nosniff" }).end(TITLE);
    } else {
      res.writeHead(404, { "content-type": "text/html" }).end(TITLE);
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;

  assert.deepEqual((await checkRuntime(base, root, GOOD_MAP)).errors, []);
  redirectTarget = "/";
  const { errors } = await checkRuntime(base, root, GOOD_MAP);
  assert.equal(errors.length, 2);
  assert.match(errors[0], /Location https:\/\/rvappliancefaultcodes.com\/, expected/);
});
