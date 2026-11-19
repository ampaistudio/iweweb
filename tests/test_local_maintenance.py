import json
from pathlib import Path
import runpy
import tempfile
import unittest
from unittest.mock import patch

worker = runpy.run_path(str(Path(__file__).resolve().parents[1] / 'scripts/local-maintenance.py'))
cycle = worker['cycle']


class LocalReleaseTests(unittest.TestCase):
    def test_versions(self):
        choose = worker['next_version']
        versions = ['1.0.2', '1.1.5', '1.1.9', '1.2.0-beta.1', '2.0.0']
        self.assertEqual(choose('1.0.1', '2.0.0', versions), '1.0.2')
        self.assertEqual(choose('1.0.2', '2.0.0', versions), '1.1.9')
        self.assertIsNone(choose('1.1.9', '2.0.0', versions))
        self.assertIsNone(choose('0.1.0', '0.1.1', ['0.1.1']))

    def test_failed_post_activation_restores_previous_release(self):
        with tempfile.TemporaryDirectory() as tmp:
            directory = Path(tmp).resolve()
            previous = directory / 'release-old'
            def fake_snapshot(work=None):
                if work:
                    for app in worker['APPS']:
                        (work / app).mkdir(parents=True, exist_ok=True)
                return 'fingerprint'
            for app in worker['APPS']:
                (previous / app).mkdir(parents=True, exist_ok=True)
                for name in worker['MANIFESTS']:
                    (previous / app / name).write_text('{}')
            (previous / 'source').write_text('fingerprint')
            worker['switch'](directory / 'active', previous)
            def fail_check(active):
                self.assertNotEqual(active.resolve(), previous)
                raise ValueError('fallo de prueba')
            with patch.dict(cycle.__globals__, snapshot=fake_snapshot, direct=lambda app: {},
                            choose=lambda work, registry: ((Path('.'), {'lib':'1.0.2'}), 0),
                            prepare=lambda *args: None, browser_checks=fail_check):
                with self.assertRaisesRegex(ValueError, 'fallo de prueba'):
                    cycle(directory, lambda message: None)
            self.assertEqual((directory / 'active').resolve(), previous)
            self.assertEqual(list(directory.glob('release-*')), [previous])

    def test_interrupted_first_activation_recovers_baseline(self):
        with tempfile.TemporaryDirectory() as tmp:
            directory = Path(tmp).resolve()
            release = directory / 'release-new'
            release.mkdir()
            worker['switch'](directory / 'active', release)
            (directory / 'rollback.json').write_text(json.dumps(None))
            worker['recover'](directory)
            self.assertFalse((directory / 'active').is_symlink())


if __name__ == '__main__':
    unittest.main()
