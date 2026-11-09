import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyMigration, missingLines, splitSections } from '../migrate-monolith.mjs';

test('migration preserves a headingless preamble, completed history and the exact open checkbox', () => {
  const open = '- [ ] Router advisory remains unresolved.';
  const old = `# TODO\n\n## Security\n\n- [x] Earlier repair shipped.\n${open}\n\n## Complete\n\n- [x] Release verified.\n`;
  const sections = splitSections(old);
  const { files, archive, mappingDoc } = applyMigration({
    sections,
    metas: [
      { heading: null, disposition: 'archive' },
      {
        heading: '## Security', disposition: 'file', slug: 'router-advisory',
        title: 'Router advisory', status: 'next', area: 'security', due: null,
        updated: '2026-11-08', owner: 'agent', brief: 'Unresolved', refs: [],
        summary: [], archiveRanges: [[1, 3]],
      },
      { heading: '## Complete', disposition: 'archive' },
    ],
    baseRev: 'original',
    archiveBase: '',
  });
  const task = files.get('docs/todo/security/router-advisory.md');
  assert.ok(task.includes(open));
  assert.equal((task.match(/^- \[ \]/gm) ?? []).length, 1);
  assert.equal((archive.match(/^- \[ \]/gm) ?? []).length, 0);
  assert.ok(archive.includes('# TODO\n'));
  assert.ok(archive.includes('- [x] Earlier repair shipped.\n'));
  assert.ok(archive.includes('## Complete\n\n- [x] Release verified.\n'));
  assert.ok(mappingDoc.includes('Preamble'));
  assert.deepEqual(missingLines(old, [...files.values(), archive]), []);
});
