// Fail-closed contract for the release path: one frontend build, checks on that image, deploy by digest.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

// Comment lines are dropped so documentation cannot satisfy or break a check.
const workflow = fs
  .readFileSync(new URL("../../../.github/workflows/deploy.yml", import.meta.url), "utf8")
  .split("\n")
  .filter((line) => !line.trim().startsWith("#"))
  .join("\n");
const dockerfile = fs.readFileSync(new URL("../../../Dockerfile", import.meta.url), "utf8");
const count = (text, pattern) => (text.match(pattern) ?? []).length;

test("the frontend is built exactly once, inside the Dockerfile", () => {
  assert.equal(count(dockerfile, /npm run build/g), 1);
  assert.equal(count(workflow, /npm run build|vite build|generate-static/g), 0);
  assert.equal(count(workflow, /docker build /g), 1);
});

test("unique source gates still run on the host before the image is built", () => {
  for (const gate of ["npm ci", "npm run validate:corpus", "npm run seo:self-check", "npm run test:unit"]) {
    assert.ok(workflow.indexOf(gate) > 0 && workflow.indexOf(gate) < workflow.indexOf("docker build "), gate);
  }
});

test("checks run on the built image before it is published and deployed by digest", () => {
  const order = [
    "node --test scripts/release/__tests__/",
    "docker build ",
    "check-release.mjs static",
    "check-release.mjs runtime http://127.0.0.1:8080",
    "docker push",
    "docker pull --quiet \"$image\"",
    "docker buildx imagetools inspect --raw \"$image\"",
    "flyctl deploy --app \"$FLY_APP\" --image \"$image\"",
    "jq -e --arg d \"$digest\" --arg p \"$platform\"",
    "check-release.mjs runtime https://rvappliancefaultcodes.com",
  ];
  const positions = order.map((step) => workflow.indexOf(step));
  positions.forEach((position, index) => assert.ok(position > 0, `missing: ${order[index]}`));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions, "release steps out of order");
  assert.match(workflow, /image="registry\.fly\.io\/\$FLY_APP@\$digest"/);
  assert.equal(count(workflow, /flyctl deploy/g), 1);
  assert.doesNotMatch(workflow, /--remote-only|--local-only|--build-only/);
});

test("release rules and secret scope are unchanged", () => {
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /set -euo pipefail/);
  assert.equal(count(workflow, /secrets\.FLY_API_TOKEN/g), 1);
  assert.ok(workflow.indexOf("secrets.FLY_API_TOKEN") > workflow.indexOf("check-release.mjs runtime http://"));
  assert.match(dockerfile, /EXPOSE 8080/);
});
