<?php
require __DIR__ . '/vendor/autoload.php';

global $base_uri, $wait_replace_imgs;
$base_uri = 'https://www.v2ex.com';
$t1 = microtime(true);
try {
    set_time_limit(1800);
    ini_set("max_execution_time", 1800);
    ini_set('memory_limit', '512M');
    $html_node = file_get_contents($base_uri);
    $crawler = new  \Symfony\Component\DomCrawler\Crawler($html_node, $base_uri);
    $links = $crawler->filter('a')->links();
    foreach ($links as $link) {
        $temp_links[] = $link->getUri();
    }
    file_put_contents('links.txt', json_encode($temp_links));
    echo 'success<br/>';
    $t2 = microtime(true);
    echo 'time consuming ' . round($t2 - $t1, 3) . ' s' . PHP_EOL;
} catch (Exception $exception) {
    echo $exception->getCode() . ', message:' . $exception->getMessage();
}
