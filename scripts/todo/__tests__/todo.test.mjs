// node --test scripts/todo/__tests__/todo.test.mjs
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, test } from 'node:test';
import { run as build } from '../build.mjs';
import { isIsoDate, loadTasks, parseFrontmatter, serializeFrontmatter } from '../lib.mjs';
import { run as query } from '../query.mjs';

const HEADING = '## Known non-blocking failures — check here BEFORE diagnosing a red suite';
let root;

function task(overrides = {}) {
  return {
    title: 'A task',
    status: 'next',
    area: 'ci',
    due: null,
    updated: '2026-10-02',
    owner: 'agent',
    brief: 'do the thing',
    refs: [],
    test: null,
    ...overrides,
  };
}

function write(rel, data, body = '- **What:** x\n- **Why:** y\n- **Next:** z\n') {
  const full = path.join(root, rel);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, typeof data === 'string' ? data + body : serializeFrontmatter(data) + '\n' + body);
}

function quiet(fn) {
  const { log, error } = console;
  const lines = [];
  console.log = (...a) => lines.push(a.join(' '));
  console.error = (...a) => lines.push(a.join(' '));
  try {
    return { code: fn(), lines };
  } finally {
    console.log = log;
    console.error = error;
  }
}

const runBuild = (...args) => quiet(() => build([...args, '--root', root]));
function runQuery(...args) {
  const out = [];
  const { code } = quiet(() => query([...args, '--root', root], (l) => out.push(l)));
  return { code, out };
}

beforeEach(() => {
  root = mkdtempSync(path.join(os.tmpdir(), 'todo-test-'));
  mkdirSync(path.join(root, 'docs/todo'), { recursive: true });
  writeFileSync(path.join(root, 'docs/todo/README.md'), '# rules — not a task\n');
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

// ---- frontmatter ----

test('review-evidence reports are not tasks', () => {
  write('docs/todo/ci/real.md', task({ title: 'Real' }));
  write('docs/todo/review-evidence/ux-plugins-2026-10-27/ios.md', '# Lane report\n');
  write('docs/todo/review-evidence/ux-plugins-2026-10-27/ios/SUMMARY.md', '# Summary\n');
  const { code } = runBuild();
  assert.equal(code, 0);
  assert.equal(loadTasks(root).length, 1);
  assert.ok(existsSync(path.join(root, 'docs/todo/review-evidence/ux-plugins-2026-10-27/ios.md')));
});

test('guide-review evidence ledger remains in place and is not a task', () => {
  write('docs/todo/content/guide-review-2026-10.md', task({ area: 'content' }));
  write('docs/todo/content/guide-review-2026-10/ledger.md', '# Ranked inventory\n');
  assert.equal(loadTasks(root).length, 1);
  assert.equal(runBuild().code, 0);
  assert.equal(runBuild('--check').code, 0);
  assert.ok(existsSync(path.join(root, 'docs/todo/content/guide-review-2026-10/ledger.md')));
});

test('frontmatter round-trips through serialize and parse', () => {
  const data = task({ title: 'Quotes "and" colons: ok — dash', refs: ['abc1234', 'TODO-archive.md#x'], test: 'a > b' });
  const { data: parsed, errors } = parseFrontmatter(serializeFrontmatter(data) + 'body\n');
  assert.deepEqual(errors, []);
  assert.deepEqual(parsed, data);
});

test('frontmatter accepts the hand-written YAML subset', () => {
  const text = [
    '---',
    'title: Bare title with words',
    "brief: 'it''s single quoted'",
    'due: ~',
    'refs: [abc, "d,e", \'f\']',
    'test:',
    'extra:',
    '  - one',
    '  - "two"',
    '---',
    'body',
  ].join('\n');
  const { data, errors, body } = parseFrontmatter(text);
  assert.deepEqual(errors, []);
  assert.equal(data.title, 'Bare title with words');
  assert.equal(data.brief, "it's single quoted");
  assert.equal(data.due, null);
  assert.deepEqual(data.refs, ['abc', 'd,e', 'f']);
  assert.equal(data.test, null);
  assert.deepEqual(data.extra, ['one', 'two']);
  assert.equal(body, 'body');
});

test('frontmatter reports missing, unterminated and unparseable blocks', () => {
  assert.match(parseFrontmatter('no block\n').errors[0], /missing frontmatter/);
  assert.match(parseFrontmatter('---\ntitle: x\n').errors[0], /unterminated/);
  const { errors } = parseFrontmatter('---\ntitle: x\ntitle: y\nnot yaml at all\n---\n');
  assert.equal(errors.length, 2);
});

test('isIsoDate rejects impossible dates', () => {
  assert.equal(isIsoDate('2026-10-02'), true);
  assert.equal(isIsoDate('2026-02-30'), false);
  assert.equal(isIsoDate('2026-10-2'), false);
  assert.equal(isIsoDate('10/02/2026'), false);
});

// ---- build ----

test('build writes TODO.md sections in order, sorts scheduled by due and omits done', () => {
  write('docs/todo/ci/later.md', task({ title: 'Later read', status: 'scheduled', due: '2026-11-01' }));
  write('docs/todo/ci/sooner.md', task({ title: 'Sooner read', status: 'scheduled', due: '2026-10-03' }));
  write('docs/todo/ads/ask-sam.md', task({ title: 'Ask Sam', status: 'waiting-sam', owner: 'sam', area: 'ads' }));
  write('docs/todo/ci/flaky.md', task({ title: 'Flaky test', status: 'known-failure', test: 'Foo.test.tsx "bar"' }));
  write('docs/todo/done/ci/old.md', task({ title: 'Old finished thing', status: 'done' }));
  const { code } = runBuild();
  assert.equal(code, 0);
  const todo = readFileSync(path.join(root, 'TODO.md'), 'utf8');
  const headings = todo.split('\n').filter((l) => l.startsWith('## '));
  assert.deepEqual(headings, ['## Now', '## Waiting on Sam', '## Scheduled (by due date)', '## Next', '## Ideas', HEADING]);
  assert.ok(todo.indexOf('Sooner read') < todo.indexOf('Later read'));
  assert.ok(!todo.includes('Old finished thing'));
  assert.match(todo, /- \[ \] Sooner read — do the thing · due 2026-10-03 · _ci_ · \[details\]\(docs\/todo\/ci\/sooner\.md\)/);
  assert.match(todo, /Flaky test — do the thing · test `Foo\.test\.tsx "bar"`/);
  assert.match(todo, /4 open tasks · 1 done/);
  const index = JSON.parse(readFileSync(path.join(root, 'docs/todo/index.json'), 'utf8'));
  assert.equal(index.length, 5);
  assert.deepEqual(index.map((r) => r.path), [...index.map((r) => r.path)].sort());
  assert.equal(index.find((r) => r.slug === 'old').status, 'done');
});

test('build output is deterministic and --check passes right after a build', () => {
  write('docs/todo/ci/a.md', task());
  runBuild();
  const first = readFileSync(path.join(root, 'TODO.md'), 'utf8');
  runBuild();
  assert.equal(readFileSync(path.join(root, 'TODO.md'), 'utf8'), first);
  assert.equal(runBuild('--check').code, 0);
});

test('--check fails on a hand-edited TODO.md and on a stale index.json', () => {
  write('docs/todo/ci/a.md', task());
  runBuild();
  writeFileSync(path.join(root, 'TODO.md'), readFileSync(path.join(root, 'TODO.md'), 'utf8') + '- [ ] hand-added line\n');
  let r = runBuild('--check');
  assert.equal(r.code, 1);
  assert.match(r.lines.join('\n'), /TODO\.md is stale/);
  runBuild();
  write('docs/todo/ci/b.md', task({ title: 'B' }));
  r = runBuild('--check');
  assert.equal(r.code, 1);
  assert.match(r.lines.join('\n'), /index\.json is stale/);
});

for (const [name, data, pattern] of [
  ['a missing field', (() => { const d = task(); delete d.owner; return serializeFrontmatter({ ...d, owner: 'agent' }).replace('owner: agent\n', ''); })(), /missing field "owner"/],
  ['an unknown status', task({ status: 'pending' }), /unknown status "pending"/],
  ['an unknown area', task({ area: 'misc' }), /unknown area "misc"/],
  ['a malformed due date', task({ due: '2026-9-30' }), /due "2026-9-30" is not a valid/],
  ['an impossible due date', task({ due: '2026-02-30' }), /due "2026-02-30" is not a valid/],
  ['scheduled without due', task({ status: 'scheduled' }), /needs a due date/],
  ['known-failure without test', task({ status: 'known-failure' }), /needs the exact failing test/],
  ['an unknown field', serializeFrontmatter(task()).replace('---\n', '---\nstauts: now\n'), /unknown field "stauts"/],
]) {
  test(`--check fails on ${name} and build refuses to write`, () => {
    write('docs/todo/ci/bad.md', data);
    const r = runBuild('--check');
    assert.equal(r.code, 1);
    assert.match(r.lines.join('\n'), pattern);
    assert.equal(runBuild().code, 1);
    assert.equal(existsSync(path.join(root, 'TODO.md')), false);
  });
}

test('--check fails on a non-kebab file name and on duplicate slugs', () => {
  write('docs/todo/ci/Bad_Name.md', task());
  write('docs/todo/ci/same.md', task());
  write('docs/todo/done/ci/same.md', task({ status: 'done' }));
  const out = runBuild('--check').lines.join('\n');
  assert.match(out, /not a kebab-case slug/);
  assert.match(out, /slug "same" is also used by/);
});

test('--check fails when a done task sits outside docs/todo/done/', () => {
  write('docs/todo/ci/finished.md', task({ status: 'done' }));
  const r = runBuild('--check');
  assert.equal(r.code, 1);
  assert.match(r.lines.join('\n'), /misfiled .* docs\/todo\/done\/ci\/finished\.md/);
});

test('build moves done files into done/<area>/, reopened files back, and re-areaed files across', () => {
  write('docs/todo/ci/finished.md', task({ status: 'done' }));
  write('docs/todo/done/ci/reopened.md', task({ status: 'next' }));
  write('docs/todo/ci/moved-area.md', task({ area: 'seo' }));
  assert.equal(runBuild().code, 0);
  assert.ok(existsSync(path.join(root, 'docs/todo/done/ci/finished.md')));
  assert.ok(!existsSync(path.join(root, 'docs/todo/ci/finished.md')));
  assert.ok(existsSync(path.join(root, 'docs/todo/ci/reopened.md')));
  assert.ok(existsSync(path.join(root, 'docs/todo/seo/moved-area.md')));
  assert.equal(runBuild('--check').code, 0);
});

test('--archive-done moves files without writing TODO.md', () => {
  write('docs/todo/ci/finished.md', task({ status: 'done' }));
  assert.equal(runBuild('--archive-done').code, 0);
  assert.ok(existsSync(path.join(root, 'docs/todo/done/ci/finished.md')));
  assert.equal(existsSync(path.join(root, 'TODO.md')), false);
});

test('top-level docs such as README.md are not task files', () => {
  write('docs/todo/ci/a.md', task());
  runBuild();
  const index = JSON.parse(readFileSync(path.join(root, 'docs/todo/index.json'), 'utf8'));
  assert.deepEqual(index.map((r) => r.path), ['docs/todo/ci/a.md']);
});

// ---- query ----

function seed() {
  write('docs/todo/ci/flaky-shop-finder.md', task({ title: 'Shop finder flake', status: 'known-failure', test: 'CityGuide.shopFinder.test.tsx "restores filters"' }));
  write('docs/todo/ads/mediavine-read.md', task({ title: 'Mediavine read', status: 'scheduled', area: 'ads', due: '2026-10-03' }));
  write('docs/todo/ads/sam-call.md', task({ title: 'Sam decides', status: 'waiting-sam', area: 'ads', owner: 'sam', due: '2026-10-20' }));
  write('docs/todo/seo/backlinks.md', task({ title: 'Backlinks', area: 'seo' }), '- **What:** the Boise inbound link has a trailing period\n');
  write('docs/todo/done/ci/old.md', task({ title: 'Old', status: 'done' }));
}

test('query prints path — title — status — due, sorted by due with undated last', () => {
  seed();
  const { code, out } = runQuery();
  assert.equal(code, 0);
  assert.deepEqual(out, [
    'docs/todo/ads/mediavine-read.md — Mediavine read — scheduled — 2026-10-03',
    'docs/todo/ads/sam-call.md — Sam decides — waiting-sam — 2026-10-20',
    'docs/todo/ci/flaky-shop-finder.md — Shop finder flake — known-failure — -',
    'docs/todo/seo/backlinks.md — Backlinks — next — -',
  ]);
});

test('query filters by status (comma list), area, owner and due-before', () => {
  seed();
  assert.equal(runQuery('--status', 'scheduled,waiting-sam').out.length, 2);
  assert.equal(runQuery('--status', 'done').out.length, 1);
  assert.equal(runQuery('--all').out.length, 5);
  assert.deepEqual(runQuery('--area', 'seo').out, ['docs/todo/seo/backlinks.md — Backlinks — next — -']);
  assert.equal(runQuery('--owner', 'sam').out.length, 1);
  assert.equal(runQuery('--due-before', '2026-10-03').out.length, 1, 'due-before is inclusive and skips undated tasks');
  assert.equal(runQuery('--due-before', '2026-10-31').out.length, 2);
});

test('query --test and --grep match substrings case-insensitively, including the body', () => {
  seed();
  assert.deepEqual(runQuery('--test', 'shopfinder').out, ['docs/todo/ci/flaky-shop-finder.md — Shop finder flake — known-failure — -']);
  assert.deepEqual(runQuery('--grep', 'BOISE').out, ['docs/todo/seo/backlinks.md — Backlinks — next — -']);
  const json = JSON.parse(runQuery('--grep', 'mediavine', '--json').out[0]);
  assert.equal(json[0].path, 'docs/todo/ads/mediavine-read.md');
  assert.equal(json[0].due, '2026-10-03');
});

test('query rejects a malformed --due-before and unknown flags', () => {
  assert.equal(runQuery('--due-before', '10/03').code, 2);
  assert.equal(runQuery('--bogus').code, 2);
});

test('loadTasks attaches validation errors per file without throwing', () => {
  write('docs/todo/ci/broken.md', 'not frontmatter\n', '');
  const [t] = loadTasks(root);
  assert.match(t.errors[0], /missing frontmatter/);
});
