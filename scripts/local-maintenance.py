"""Local-only dependency release worker. Run with Python 3; --once processes a cycle."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from contextlib import ExitStack, contextmanager
from functools import partial
import fcntl
import hashlib
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import re
import shutil
import sqlite3
import subprocess
import tempfile
import threading
import time
from urllib.parse import quote, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
APPS = (Path('.'), Path('admin-panel'))
MANIFESTS = ('package.json', 'package-lock.json')
VERSION = re.compile(r'(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)')
DAY = 86400


def inputs():
    for app in APPS:
        for name in (*MANIFESTS, 'index.html', 'tsconfig.json', 'vite.config.ts', 'public', 'src'):
            path = ROOT / app / name
            if path.is_dir():
                yield from sorted(p for p in path.rglob('*') if p.is_file())
            elif path.is_file():
                yield path
    yield ROOT / 'scripts/check-hardcoding.mjs'


def snapshot(target=None):
    digest = hashlib.sha256()
    for path in inputs():
        relative = path.relative_to(ROOT)
        data = path.read_bytes()
        digest.update(relative.as_posix().encode() + b'\0' + hashlib.sha256(data).digest())
        if target:
            dest = target / relative
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
    return digest.hexdigest()


def read(path):
    return json.loads(path.read_text())


def direct(app):
    manifest = read(app / 'package.json')
    packages = read(app / 'package-lock.json')['packages']
    names = manifest.get('dependencies', {}) | manifest.get('devDependencies', {})
    return {n: packages['node_modules/' + n]['version'] for n in names}


def releases(name):
    url = 'https://registry.npmjs.org/' + quote(name, safe='')
    with urlopen(Request(url, headers={'Accept': 'application/vnd.npm.install-v1+json'}), timeout=25) as response:
        doc = json.load(response)
    latest = doc['dist-tags']['latest']
    return latest, [v for v, meta in doc['versions'].items() if not meta.get('deprecated')]


def parts(value):
    match = VERSION.fullmatch(value)
    return tuple(map(int, match.groups())) if match else None


def next_version(current, latest, available):
    base, ceiling = parts(current), parts(latest)
    if not base or not ceiling or not base[0]:
        return None
    eligible = sorted(v for item in available if (v := parts(item))
                      and base < v <= ceiling and v[0] == base[0])
    if eligible:
        nearest = eligible[0][1]
        return '.'.join(map(str, max(v for v in eligible if v[1] == nearest)))
    return None


def family(name):
    if name.startswith('@tiptap/'):
        return 'tiptap'
    if name in ('react', 'react-dom', '@types/react', '@types/react-dom'):
        return 'react'
    if name in ('vite', '@vitejs/plugin-react', 'vite-plugin-singlefile', 'tailwindcss', '@tailwindcss/vite'):
        return 'vite-tailwind'
    return name


def audit(app):
    result = subprocess.run(['npm', 'audit', '--package-lock-only', '--json'], cwd=app,
                            capture_output=True, text=True, timeout=90)
    data = json.loads(result.stdout)
    if result.returncode not in (0, 1) or 'vulnerabilities' not in data or 'error' in data:
        raise ValueError('Registro de avisos de seguridad no disponible.')
    return {name for name, issue in data['vulnerabilities'].items()
            if issue['severity'] in ('high', 'critical')}


def choose(work, registry):
    groups = {}
    deferred = 0
    for app in APPS:
        for name, current in direct(work / app).items():
            latest, versions = registry[name]
            target = next_version(current, latest, versions)
            if target:
                groups.setdefault((app, family(name)), {})[name] = target
            elif current != latest:
                deferred += 1
    if not groups:
        return None, deferred
    advisories = {app: audit(work / app) for app in APPS}
    key = min(groups, key=lambda k: (-len(groups[k].keys() & advisories[k[0]]),
                                     len(groups[k]), str(k[0]), k[1]))
    return (key[0], groups[key]), deferred


class Preview(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = urlsplit(self.path).path
        if not Path(path).suffix and not path.startswith('/api/'):
            self.path = '/index.html'
        super().do_GET()

    def log_message(self, *args):
        pass


@contextmanager
def preview(root):
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Preview, directory=str(root)))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield 'http://127.0.0.1:' + str(server.server_port)
    finally:
        server.shutdown()
        server.server_close()
        thread.join()


def run(args, cwd, env=None):
    print('>', *args, flush=True)
    subprocess.run(args, cwd=cwd, env=env, check=True, timeout=240, stdin=subprocess.DEVNULL)


def browser_checks(release):
    with ExitStack() as stack:
        web, panel = [stack.enter_context(preview(release / a / 'dist')) for a in APPS]
        env = dict(os.environ, IWE_TEST_WEB_URL=web, IWE_TEST_PANEL_URL=panel)
        for script in ('test_site_recovery_browser.mjs', 'test_editorial_browser.mjs'):
            run(['node', 'tests/' + script], ROOT, env)


def prepare(work, release, app, changes, fingerprint):
    before = direct(work / app)
    manifest = read(work / app / 'package.json')
    for name, target in changes.items():
        section = 'dependencies' if name in manifest['dependencies'] else 'devDependencies'
        manifest[section][name] = target
    (work / app / 'package.json').write_text(json.dumps(manifest, indent=2) + '\n')
    run(['npm', 'install', '--package-lock-only', '--strict-peer-deps', '--ignore-scripts', '--no-audit'], work / app)
    if direct(work / app) != before | changes:
        raise ValueError('El resolvedor cambió dependencias directas fuera de la tanda.')
    for a in APPS:
        directory = work / a
        run(['npm', 'ci', '--strict-peer-deps', '--ignore-scripts', '--no-audit'], directory)
        issues = audit(directory)
        if issues:
            raise ValueError('Avisos altos o críticos en la tanda de prueba (' + str(len(issues)) +
                             '): ' + ', '.join(sorted(issues)))
        run([str(directory / 'node_modules/.bin/tsc'), '--noEmit'], directory)
        run(['npm', 'run', 'build'], directory)
        dest = release / a
        dest.mkdir(parents=True, exist_ok=True)
        shutil.copytree(directory / 'dist', dest / 'dist')
        for name in MANIFESTS:
            shutil.copy2(directory / name, dest / name)
    (release / 'source').write_text(fingerprint)
    browser_checks(release)


def switch(link, target):
    temp = link.with_suffix('.next')
    temp.unlink(missing_ok=True)
    temp.symlink_to(target, target_is_directory=True)
    os.replace(temp, link)


def recover(directory):
    journal = directory / 'rollback.json'
    if journal.exists():
        previous = read(journal)
        if previous:
            switch(directory / 'active', previous)
        else:
            (directory / 'active').unlink(missing_ok=True)
        journal.unlink()


def cycle(directory, report):
    link = directory / 'active'
    registry = {}
    for _ in range(64):
        with tempfile.TemporaryDirectory(dir=directory) as temp:
            work = Path(temp)
            fingerprint = snapshot(work)
            if link.exists():
                if (link / 'source').read_text() != fingerprint:
                    raise ValueError('La copia de trabajo cambió desde la última versión de mantenimiento.')
                for app in APPS:
                    for name in MANIFESTS:
                        shutil.copy2(link / app / name, work / app / name)
            if not registry:
                names = sorted(set().union(*(direct(work / a) for a in APPS)))
                with ThreadPoolExecutor(max_workers=4) as pool:
                    registry = dict(zip(names, pool.map(releases, names)))
            batch, deferred = choose(work, registry)
            if not batch:
                remaining = set().union(*(audit(work / a) for a in APPS))
                if remaining:
                    raise ValueError('Quedan avisos altos o críticos: ' + ', '.join(sorted(remaining)))
                return f'Ciclo completo. Cambios fuera de la política automática: {deferred}.'
            app, changes = batch
            report('Probando ' + ('web' if app == APPS[0] else 'dashboard') + ' · ' +
                   ', '.join(n + ' ' + v for n, v in changes.items()))
            release = Path(tempfile.mkdtemp(prefix='release-', dir=directory))
            try:
                prepare(work, release, app, changes, fingerprint)
                if snapshot() != fingerprint:
                    raise ValueError('Las fuentes cambiaron durante las pruebas.')
                previous = str(link.resolve()) if link.exists() else None
                pending = directory / 'rollback.tmp'
                pending.write_text(json.dumps(previous))
                os.replace(pending, directory / 'rollback.json')
                switch(link, release)
                browser_checks(link)
                (directory / 'rollback.json').unlink()
            except BaseException:
                recover(directory)
                shutil.rmtree(release)
                raise
            for path in directory.glob('release-*'):
                if path != release and str(path) != previous:
                    shutil.rmtree(path)
    return 'Límite del ciclo alcanzado. El próximo ciclo recalculará los pendientes.'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--once', action='store_true')
    args = parser.parse_args()
    os.umask(0o077)
    output = subprocess.check_output(['php', '-r', 'require "api/core/health/LocalMaintenance.php"; echo LocalMaintenance::directory();'], cwd=ROOT)
    directory = Path(os.fsdecode(output))
    with (directory / 'worker.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        recover(directory)
        db = sqlite3.connect(directory / 'state.sqlite', isolation_level=None)
        db.execute('CREATE TABLE IF NOT EXISTS control(id INTEGER PRIMARY KEY, automatic INTEGER, requested INTEGER, running INTEGER, heartbeat INTEGER, last_run INTEGER, message TEXT)')
        db.execute("INSERT OR IGNORE INTO control VALUES(1,0,0,0,0,0,'Listo para actualizar.')")
        db.execute("UPDATE control SET running=0, message='Ciclo interrumpido. Se conservó la última versión validada.' WHERE running=1")
        def report(message):
            db.execute('UPDATE control SET message=?', (message,))
        def heartbeat():
            with sqlite3.connect(directory / 'state.sqlite', isolation_level=None) as pulse:
                while True:
                    pulse.execute('UPDATE control SET heartbeat=?', (int(time.time()),))
                    time.sleep(10)
        threading.Thread(target=heartbeat, daemon=True).start()
        while True:
            now = int(time.time())
            claimed = db.execute("""UPDATE control SET requested=0,running=1,last_run=?,message='Evaluando versiones…'
                WHERE id=1 AND (requested=1 OR ? OR (automatic=1 AND last_run<=?))""",
                (now, args.once, now-DAY)).rowcount
            if claimed:
                try:
                    message = cycle(directory, report)
                    result = 0
                except Exception as exc:
                    print(exc, flush=True)
                    message = 'Ciclo detenido. ' + str(exc)[:200]
                    result = 1
                db.execute('UPDATE control SET running=0,message=?', (message,))
                if args.once:
                    db.execute('UPDATE control SET heartbeat=0')
                    return result
            time.sleep(3)


if __name__ == '__main__':
    raise SystemExit(main())
