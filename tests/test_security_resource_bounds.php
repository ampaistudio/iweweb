<?php
declare(strict_types=1);
require __DIR__ . '/../api/core/auth/AuthController.php';
require __DIR__ . '/../api/core/reviews/ReviewsController.php';
function check($value, $message) { if (!$value) throw new Exception($message); }
class Reply extends Exception {}
$body = []; $reply = null;
function getRequestBody() { return $GLOBALS['body']; }
function jsonError($message, $status = 400) { $GLOBALS['reply'] = $status; throw new Reply(); }
function jsonSuccess($data = null, $message = '') { $GLOBALS['reply'] = $data; if (empty($GLOBALS['reviewMode'])) throw new Reply(); }
$base = sys_get_temp_dir() . '/iwe-security-' . bin2hex(random_bytes(6));
mkdir($base, 0700);
$_SERVER['DOCUMENT_ROOT'] = dirname(__DIR__);
$_SERVER['REMOTE_ADDR'] = '192.0.2.1';
$pdo = new PDO('sqlite::memory:');
try {
    foreach (['login' => ['login-ip',50,900], 'forgotPassword' => ['forgot-ip',20,3600], 'resetPassword' => ['reset-ip',30,900]] as $method => [$scope,$limit,$window]) {
        $dir = $base . '/' . $method;
        putenv('IWE_AUTH_RATE_DIR=' . $dir);
        $limiter = new AuthRateLimiter();
        for ($i=0;$i<$limit;$i++) $limiter->consume($scope,'192.0.2.1',$limit,$window);
        $controller = new AuthController($pdo, []);
        for ($i=0;$i<5;$i++) {
            $body = ['email'=>"rotating$i@example.test",'password'=>'test-password','token'=>"token$i"];
            try { $controller->$method(); } catch (Reply $e) {}
            check($reply === ($method === 'forgotPassword' ? null : 429), 'Denied response changed');
        }
        check(count(glob($dir . '/*.json')) === 1, "$method allocated rejected identity");
    }
    putenv('IWE_AUTH_RATE_DIR=' . $base . '/valid');
    session_save_path($base); session_start();
    $pdo->exec('CREATE TABLE users (id INTEGER, email TEXT, password_hash TEXT, display_name TEXT, role TEXT, must_change_password INTEGER, created_at TEXT)');
    $stmt=$pdo->prepare('INSERT INTO users VALUES (1, ?, ?, ?, ?, 0, ?)');
    $stmt->execute(['valid@example.test',password_hash('test-password',PASSWORD_DEFAULT),'Test','admin','2026-01-01']);
    $body=['email'=>'valid@example.test','password'=>'test-password'];
    try {(new AuthController($pdo,[]))->login();} catch(Reply $e) {}
    check($reply['user']['id']==1 && !isset($reply['user']['password_hash']) && $_SESSION['user_id']==1,'Valid login broken');
    session_destroy();
    $dir = $base . '/capacity'; $limiter = new AuthRateLimiter($dir);
    for ($i=0;$i<2048;$i++) file_put_contents($dir.'/'.hash('sha256','seed'.$i).'.json', json_encode(['started'=>time(),'count'=>1,'expires'=>time()+900]));
    check(!$limiter->consume('login','new',2,900), 'Capacity bypass');
    $file = glob($dir.'/*.json')[0]; file_put_contents($file, json_encode(['started'=>1,'count'=>1,'expires'=>2]));
    check($limiter->consume('login','new',2,900), 'TTL did not free slot');
    check($limiter->consume('login','new',2,900), 'Existing live counter denied at capacity');
    check(!$limiter->consume('login','new',2,900), 'Limit reset at capacity');
    check(count(glob($dir.'/*.json'))===2048, 'File bound exceeded');

    class FakeReviewsStream {
        public $context; private string $data=''; private int $pos=0;
        public static ?string $log=null;
        public static int $calls=0; public static string $response='{"result":{"reviews":[]},"data":[]}';
        public function stream_open($path,$mode,$options,&$opened_path) { self::$calls++; if(self::$log) file_put_contents(self::$log, "call\n", FILE_APPEND | LOCK_EX); $this->data=self::$response; return true; }
        public function stream_read($count) { $out=substr($this->data,$this->pos,$count); $this->pos+=strlen($out); return $out; }
        public function stream_eof() { return $this->pos>=strlen($this->data); }
        public function stream_stat() { return []; }
    }
    stream_wrapper_unregister('https'); stream_wrapper_register('https',FakeReviewsStream::class);
    $cacheDir=$base.'/reviews'; putenv('IWE_REVIEWS_CACHE_DIR='.$cacheDir);
    $cfg=['google_places'=>['api_key'=>'fake','place_id'=>'fake'], 'tripadvisor'=>['api_key'=>'fake','location_id'=>'fake']];
    $reviewMode=true;
    $controller=new ReviewsController($pdo,$cfg);
    foreach (['getGoogleReviews','getTripAdvisorReviews'] as $method) {
        for($i=0;$i<3;$i++) { try{$controller->$method();}catch(Reply $e){} }
        check($reply['reviews']===[] && $reply['is_configured']===true,'Payload changed');
    }
    check(FakeReviewsStream::$calls===2,'Repeated requests hit upstream');
    $cache=new ReviewsCache(); $ctx=stream_context_create([]);
    check($cache->fetch('google','https://changed.test',$ctx)===null,'Config change served stale identity');
    check(FakeReviewsStream::$calls===2,'Config change bypassed global budget');
    $path=$cacheDir.'/google.json'; $state=json_decode(file_get_contents($path),true); $state['next_attempt']=0; file_put_contents($path,json_encode($state));
    FakeReviewsStream::$response='broken';
    check($cache->fetch('google','https://changed.test',$ctx)===null,'Malformed response accepted');
    $cache->fetch('google','https://changed.test',$ctx);
    check(FakeReviewsStream::$calls===3,'Failure retried without backoff');
    $state=json_decode(file_get_contents($path),true);$state['next_attempt']=0;file_put_contents($path,json_encode($state));
    FakeReviewsStream::$response=str_repeat('x',1048578);
    check($cache->fetch('google','https://changed.test',$ctx)===null,'Oversize response accepted');
    putenv('IWE_REVIEWS_CACHE_DIR=' . __FILE__);
    try { $controller->getGoogleReviews(); } catch(Reply $e){}
    check(FakeReviewsStream::$calls===4,'Storage failure invoked upstream');
    check($reply['reviews']===[],'Storage failure broke fallback');
    if (function_exists('pcntl_fork')) {
        // Several workers race for the last slot; live counters cannot be evicted.
        unlink(glob($dir.'/*.json')[0]);
        $children=[];
        for($i=0;$i<4;$i++) {
            $pid=pcntl_fork(); check($pid!==-1,'fork failed');
            if($pid===0) { (new AuthRateLimiter($dir))->consume('race',(string)$i,2,900); exit(0); }
            $children[]=$pid;
        }
        foreach($children as $pid) { pcntl_waitpid($pid,$status); check(pcntl_wexitstatus($status)===0,'Child failed'); }
        check(count(glob($dir.'/*.json'))===2048,'Concurrent capacity bypass');
        putenv('IWE_REVIEWS_CACHE_DIR='.$cacheDir);
        $state=json_decode(file_get_contents($path),true);$state['next_attempt']=0;file_put_contents($path,json_encode($state));
        FakeReviewsStream::$response='{"result":{"reviews":[]}}';
        FakeReviewsStream::$log=$base.'/calls.log';
        $children=[];
        for($i=0;$i<4;$i++) {
            $pid=pcntl_fork(); check($pid!==-1,'fork failed');
            if($pid===0) { (new ReviewsCache())->fetch('google','https://changed.test',$ctx); exit(0); }
            $children[]=$pid;
        }
        foreach($children as $pid) { pcntl_waitpid($pid,$status); check(pcntl_wexitstatus($status)===0,'Child failed'); }
        check(count(file(FakeReviewsStream::$log))===1,'Concurrent upstream stampede');
        echo "PASS concurrent admission and concurrent refresh deduplication\n";
    } else { throw new Exception('pcntl required for concurrent regression checks'); }
    stream_wrapper_restore('https');
    echo "PASS all auth routes reject without allocation; TTL/cap/live keys; reviews cache, empty results, config isolation, failure backoff, size bound, unavailable storage\n";
} finally {
    putenv('IWE_AUTH_RATE_DIR'); putenv('IWE_REVIEWS_CACHE_DIR');
    $it=new RecursiveIteratorIterator(new RecursiveDirectoryIterator($base,FilesystemIterator::SKIP_DOTS),RecursiveIteratorIterator::CHILD_FIRST);
    foreach($it as $f) { if($f->isDir()) rmdir($f->getPathname()); else unlink($f->getPathname()); }
    rmdir($base);
}
