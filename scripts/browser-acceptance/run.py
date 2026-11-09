#!/usr/bin/env python3
"""Run RV Atlas's pinned browser contract; current serving identity stays external."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys

HERE = Path(__file__).resolve().parent
REPOSITORY = HERE.parents[1]
ENGINE_FILES = {'browser/content_acceptance.py', 'browser/requirements.txt'}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def checked_engine(root, pin):
    if not re.fullmatch(r'[0-9a-f]{40}', pin['revision']) or set(pin['files']) != ENGINE_FILES:
        raise ValueError('Invalid pinned canonical engine contract')
    env = {key: value for key, value in os.environ.items() if not key.startswith('GIT_')}
    head = subprocess.check_output(['git', '-C', str(root), 'rev-parse', 'HEAD'], text=True, env=env, timeout=10).strip()
    if head != pin['revision']:
        raise ValueError('Canonical engine checkout is not the pinned revision')
    for name, expected in pin['files'].items():
        if digest(root / name) != expected:
            raise ValueError(f'Canonical engine bytes differ: {name}')
    return root / 'browser/content_acceptance.py'


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--engine-root', type=Path, required=True)
    parser.add_argument('--base-url', required=True)
    parser.add_argument('--expected-revision', required=True)
    parser.add_argument('--output-dir', type=Path, required=True)
    parser.add_argument('--canonical-origin')
    parser.add_argument('--browser-executable')
    args = parser.parse_args(argv)
    os.umask(0o077)
    result = {'schemaVersion': 1, 'kind': 'rv-atlas-content-acceptance', 'status': 'failed',
              'expectedRevision': args.expected_revision, 'baseUrl': args.base_url,
              'currentServingRevisionVerified': False}
    try:
        if not re.fullmatch(r'[0-9a-f]{40}', args.expected_revision):
            raise ValueError('Full expected source revision required')
        output, engine_root = args.output_dir.resolve(), args.engine_root.resolve()
        if not args.output_dir.is_absolute() or output.exists() or output.is_relative_to(REPOSITORY) or output.is_relative_to(engine_root):
            raise ValueError('Output must be a fresh absolute private directory outside both repositories')
        pin = json.loads((HERE / 'engine.json').read_text())
        engine = checked_engine(engine_root, pin)
        command = [sys.executable, str(engine), '--contract', str(HERE / 'contract.json'), '--base-url', args.base_url,
                   '--expected-revision', args.expected_revision, '--engine-revision', pin['revision'], '--output-dir', str(output)]
        for name in ('canonical_origin', 'browser_executable'):
            if getattr(args, name):
                command += ['--' + name.replace('_', '-'), getattr(args, name)]
        completed = subprocess.run(command, text=True, capture_output=True, timeout=600)
        receipt_path = output / 'receipt.json'
        if receipt_path.exists():
            receipt = json.loads(receipt_path.read_text())
            result.update(browserReceipt=str(receipt_path), browserReceiptSha256=digest(receipt_path),
                          browserStatus=receipt.get('status'), engineRevision=pin['revision'])
        else:
            receipt = {}
        if completed.returncode == 0 and receipt.get('status') == 'passed' and receipt.get('revisionVerified') is False:
            result['status'] = 'passed'
        else:
            result['error'] = receipt.get('error') or completed.stdout[-2000:] or completed.stderr[-2000:] or 'Canonical browser acceptance failed'
        if output.is_dir():
            (output / 'consumer.json').write_text(json.dumps(result, indent=2) + '\n')
        print(json.dumps(result))
        return 0 if result['status'] == 'passed' else 1
    except (OSError, ValueError, KeyError, subprocess.SubprocessError) as error:
        result.update(failureKind='configuration', error=f'{type(error).__name__}: {error}'[:2000])
        print(json.dumps(result))
        return 2


if __name__ == '__main__':
    sys.exit(main())
