"""Owning proof/pin boundaries plus the real shared runner against a local fixture."""
import hashlib
from functools import partial
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler
from http.server import ThreadingHTTPServer
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import threading
import unittest

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


consumer = module('rv_browser_consumer', HERE / 'run.py')


class AcceptanceTests(unittest.TestCase):
    def test_contract_matches_built_indexable_pages_and_real_links(self):
        class Document(HTMLParser):
            def __init__(self, path):
                super().__init__()
                self.heading = ''
                self.in_heading = False
                self.links = []
                self.robots = None
                self.feed(path.read_text())
            def handle_starttag(self, tag, attrs):
                attrs = dict(attrs)
                if tag == 'h1': self.in_heading = True
                if tag == 'a': self.links.append(attrs.get('href'))
                if tag == 'meta' and attrs.get('name') == 'robots': self.robots = attrs.get('content')
            def handle_endtag(self, tag):
                if tag == 'h1': self.in_heading = False
            def handle_data(self, data):
                if self.in_heading: self.heading += data
        dist = ROOT / 'dist'
        self.assertTrue((dist / 'sitemap.xml').is_file(), 'Build the existing site with SEO_OFFLINE=1 before these checks')
        sitemap = (dist / 'sitemap.xml').read_text()
        self.assertEqual(sitemap.count('<loc>'), 74, 'This adoption must not broaden the indexable scope')
        contract = json.loads((HERE / 'contract.json').read_text())
        for flow in contract['flows']:
            previous = None
            for page in [flow['start'], *flow['steps']]:
                document = Document(dist / page['path'].strip('/') / 'index.html')
                self.assertEqual(document.heading, page['heading'])
                self.assertEqual(document.robots, 'index,follow')
                self.assertIn('https://rvappliancefaultcodes.com' + page['path'], sitemap)
                if previous:
                    self.assertIn(page['path'], previous.links)
                previous = document

    def test_tooling_paths_do_not_trigger_application_deployment(self):
        deploy = (ROOT / '.github/workflows/deploy.yml').read_text()
        ignored = deploy.split('    paths-ignore:', 1)[1].split('  workflow_dispatch:', 1)[0]
        for path in ('scripts/browser-acceptance/**', '.github/workflows/browser-acceptance.yml', '.github/workflows/deploy.yml'):
            self.assertIn("- '" + path + "'", ignored)
        workflow = (ROOT / '.github/workflows/browser-acceptance.yml').read_text()
        self.assertIn('npm run test:browser', workflow)
        self.assertIn('SEO_OFFLINE', workflow)
        self.assertNotIn('flyctl', workflow)

    def test_pin_rejects_changed_engine_and_wrong_checkout(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            env = {k: v for k, v in os.environ.items() if not k.startswith('GIT_')}
            def git(*args):
                return subprocess.check_output(['git', '-C', str(root), *args], env=env, text=True, stderr=subprocess.DEVNULL).strip()
            git('init')
            (root / 'browser').mkdir()
            for name in consumer.ENGINE_FILES:
                (root / name).write_text('# fixture\n')
            git('add', 'browser')
            git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'fixture')
            pin = {'revision': git('rev-parse', 'HEAD'), 'files': {name: consumer.digest(root / name) for name in consumer.ENGINE_FILES}}
            self.assertEqual(consumer.checked_engine(root, pin), root / 'browser/content_acceptance.py')
            with self.assertRaisesRegex(ValueError, 'pinned revision'):
                consumer.checked_engine(root, {**pin, 'revision': '0' * 40})
            (root / 'browser/content_acceptance.py').write_text('# changed\n')
            with self.assertRaisesRegex(ValueError, 'bytes differ'):
                consumer.checked_engine(root, pin)

    def test_invalid_source_sha_fails_before_engine_or_browser(self):
        result = subprocess.run([sys.executable, str(HERE / 'run.py'), '--engine-root', '/nonexistent',
                                 '--base-url', 'https://rvappliancefaultcodes.com', '--expected-revision', 'unknown',
                                 '--output-dir', '/nonexistent/fixture-output'], capture_output=True, text=True)
        self.assertEqual(result.returncode, 2)
        self.assertIn('Full expected source revision', json.loads(result.stdout)['error'])

    @unittest.skipUnless(os.environ.get('RV_ACCEPTANCE_ENGINE_ROOT'), 'Local shared-engine check: hosted CI cannot read the private canonical repository')
    def test_real_engine_against_actual_built_static_pages(self):
        class Handler(SimpleHTTPRequestHandler):
            def log_message(self, *_args):
                pass
        server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(ROOT / 'dist')))
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with tempfile.TemporaryDirectory(prefix='rv-browser-fixture-') as directory:
                output = Path(directory) / 'acceptance'
                command = [sys.executable, str(HERE / 'run.py'), '--engine-root', os.environ['RV_ACCEPTANCE_ENGINE_ROOT'],
                           '--base-url', f'http://127.0.0.1:{server.server_port}', '--canonical-origin', 'https://rvappliancefaultcodes.com',
                           '--expected-revision', 'a' * 40, '--output-dir', str(output)]
                if executable := os.environ.get('RV_ACCEPTANCE_BROWSER'):
                    command += ['--browser-executable', executable]
                result = subprocess.run(command, capture_output=True, text=True, timeout=180)
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                summary = json.loads(result.stdout)
                receipt = json.loads((output / 'receipt.json').read_text())
                self.assertEqual(summary['status'], 'passed')
                self.assertFalse(summary['currentServingRevisionVerified'])
                self.assertFalse(receipt['revisionVerified'])
                self.assertEqual(len(receipt['flows']), 4)
                self.assertEqual(summary['browserReceiptSha256'], hashlib.sha256((output / 'receipt.json').read_bytes()).hexdigest())
        finally:
            server.shutdown()
            server.server_close()
            thread.join()


if __name__ == '__main__':
    unittest.main()
