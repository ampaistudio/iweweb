"""Local HTTP regression: synthetic files only, no database/provider/hosting access."""
import argparse, http.client, json, os, pathlib, shutil, socket, subprocess, tempfile, time
REPO = pathlib.Path(__file__).resolve().parents[1]

def port():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]

def run(base, baseline=False):
    root=base/'site'; root.mkdir()
    def put(name, value):
        p=root/name; p.parent.mkdir(parents=True,exist_ok=True); p.write_text(value)
    for name in ['index.php','router.php','.htaccess','api/.htaccess','scripts/local-dev-router.php']:
        put(name,(REPO/name).read_text())
    if (REPO/'api/core/PublicFilePolicy.php').exists():
        put('api/core/PublicFilePolicy.php',(REPO/'api/core/PublicFilePolicy.php').read_text())
    put('api/config/config.php', "<?php return ['app'=>['panel_slug'=>'control','panel_dir'=>'admin-panel']];")
    put('api/index.php', '<?php header("Content-Type: application/json"); echo "API_OK";')
    put('index.html','PUBLIC_HOME'); put('robots.txt','PUBLIC_ROBOTS')
    put('assets/app.js','PUBLIC_JS');put('api/uploads/photo.webp','PUBLIC_IMAGE');put('api/uploads/clip.mp4','0123456789')
    put('admin-panel/dist/index.html','<head></head>PANEL_OK');put('admin-panel/dist/assets/app.js','PANEL_JS')
    private=['.git/config','.env','api/migrations/seed.sql','api/storage/cache/test.json','api/config/config.php.bak',
             'api/core/source.txt','tests/probe.txt','src/probe.ts','scripts/probe.py','content/probe.json',
             'package-lock.json','api/uploads/probe.php','api/uploads/probe.html','assets/probe.js.map',
             'admin-panel/dist-secret/secret.txt']
    for name in private: put(name,'PRIVATE_CANARY')
    put('assets/private.txt','PRIVATE_CANARY')
    (root/'assets/escape.js').symlink_to(root/'api/migrations/seed.sql')
    put('assets/secret.env','PRIVATE_CANARY')
    put('assets/.private/secret.js','PRIVATE_CANARY')
    put('api/uploads/secret.env','PRIVATE_CANARY')
    (root/'assets/public.js').symlink_to(root/'assets/secret.env')
    (root/'assets/hidden.js').symlink_to(root/'assets/.private/secret.js')
    (root/'api/uploads/public.webp').symlink_to(root/'api/uploads/secret.env')
    denied=['/assets/public.js','/assets/hidden.js','/api/uploads/public.webp']+['/'+p for p in private]+['/api/%6digrations/seed.sql','/%2egit/config',
        '/control/../dist-secret/secret.txt','/control/%2e%2e/dist-secret/secret.txt','/api/uploads/%2e%2e/migrations/seed.sql']
    modes=['php','php-api','apache'] if not baseline else ['php','apache']
    for mode in modes:
        listen=port(); log=open(base/(mode+'.log'),'w+'); fpm=None
        if mode in ('php','php-api'): command=['php','-S',f'127.0.0.1:{listen}','-t',str(root),str(root/('router.php' if mode=='php' else 'scripts/local-dev-router.php'))]
        else:
            conf=base/'httpd.conf'
            mods=['mpm_prefork','authz_core','unixd','rewrite','dir','mime','access_compat','proxy','proxy_fcgi']
            fpm_port=port()
            fpm_conf=base/'fpm.conf'
            fpm_conf.write_text(f'[global]\nerror_log = {base}/fpm-error.log\n[fixture]\nlisten = 127.0.0.1:{fpm_port}\npm = static\npm.max_children = 2\ncatch_workers_output = yes\n')
            fpm=subprocess.Popen(['php-fpm','-F','-y',str(fpm_conf)],stdout=log,stderr=log)
            for _ in range(60):
                try:
                    with socket.create_connection(('127.0.0.1',fpm_port),timeout=.1): pass
                    break
                except OSError: time.sleep(.05)
            config=f'ServerRoot "{base}"\nListen 127.0.0.1:{listen}\nServerName localhost\nPidFile "{base}/httpd.pid"\n'
            config+=''.join(f'LoadModule {m}_module /usr/libexec/apache2/mod_{m}.so\n' for m in mods)
            config+=f'DocumentRoot "{root}"\nErrorLog "{base}/apache-error.log"\nTypesConfig /dev/null\nDirectoryIndex index.php\n<Directory "{root}">\nAllowOverride All\nRequire all granted\nOptions FollowSymLinks\n</Directory>\n'
            config+=f'Mutex file:{base} default\n'
            config+=f'<FilesMatch \"\\.php$\">\nSetHandler \"proxy:fcgi://127.0.0.1:{fpm_port}\"\n</FilesMatch>\n'
            conf.write_text(config)
            subprocess.run(['/usr/sbin/httpd','-t','-f',str(conf)],check=True,capture_output=True)
            command=['/usr/sbin/httpd','-X','-f',str(conf)]
        proc=subprocess.Popen(command,stdout=log,stderr=log)
        def get(path, headers=None, method='GET'):
            c=http.client.HTTPConnection('127.0.0.1',listen,timeout=4);c.request(method,path,headers=headers or {});r=c.getresponse();data=r.read().decode(errors='replace');c.close();return r.status,data
        try:
            for _ in range(60):
                try: get('/robots.txt');break
                except OSError: time.sleep(.05)
            if baseline:
                status,body=get('/api/migrations/seed.sql')
                assert status==200 and 'PRIVATE_CANARY' in body,(mode,status,body)
                print(mode,'BASELINE exposure reproduced: synthetic migration SQL HTTP 200')
                continue
            for path in denied:
                status,body=get(path)
                assert (status in (400,403,404) or (mode=='apache' and path.startswith('/control/')) or (mode=='php-api' and body=='API_OK')) and 'PRIVATE_CANARY' not in body,(mode,path,status,body[:100])
            for path,expected in [('/robots.txt','PUBLIC_ROBOTS'),('/assets/app.js','PUBLIC_JS'),('/api/uploads/photo.webp','PUBLIC_IMAGE')]:
                if mode=='php-api' and not path.startswith('/api/'): continue
                status,body=get(path);assert status==200 and (expected in body),(mode,path,status,body)
            if mode in ('php','apache'):
                for path,expected in [('/','PUBLIC_HOME'),('/tour/example','PUBLIC_HOME'),('/control/login','PANEL_OK'),('/control/assets/app.js','PANEL_JS'),('/api/activities','API_OK'),('/api/activities/example','API_OK')]:
                    if mode=='php-api' and not path.startswith('/api/'): continue
                status,body=get(path);assert status==200 and expected in body,(path,status,body)
                status,body=get('/assets/escape.js');assert status in (403,404) and 'PRIVATE_CANARY' not in body
            if mode=='php-api':
                status,body=get('/api/activities/example'); assert status==200 and body=='API_OK'
                print(mode,'PASS',len(denied),'private paths non-disclosing; media/API preserved')
                continue
            status,body=get('/api/uploads/clip.mp4',{'Range':'bytes=2-5'}); assert status==206 and body=='2345',(mode,status,body)
            status,body=get('/api/uploads/clip.mp4',{'Range':'bytes=-3'}); assert status==206 and body=='789',(mode,status,body)
            status,body=get('/api/uploads/clip.mp4',{'Range':'bytes=99-'}); assert status==416,(mode,status,body)
            status,body=get('/api/uploads/clip.mp4',method='HEAD'); assert status==200 and body=='',(mode,status,body)
            print(mode,'PASS',len(denied),'private/encoded paths denied; legitimate public resources preserved')
        except Exception:
            log.flush(); log.seek(0); print(log.read())
            for diagnostic in ['apache-error.log','fpm-error.log']:
                if (base/diagnostic).exists(): print((base/diagnostic).read_text())
            raise
        finally:
            proc.terminate()
            try:proc.wait(timeout=5)
            except subprocess.TimeoutExpired:proc.kill();proc.wait()
            if fpm is not None:
                fpm.terminate(); fpm.wait(timeout=5)
            log.close()

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--baseline',action='store_true');parser.add_argument('--workspace');args=parser.parse_args()
    with tempfile.TemporaryDirectory(prefix='iwe-routing-',dir=args.workspace) as temp:run(pathlib.Path(temp),args.baseline)
