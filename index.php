<?php
require __DIR__ . '/vendor/autoload.php';

const RESPONSE_RESOURCES = 'response/resources/';
const RESPONSE_RESOURCES_VIEWS = 'response/resources/views/';

global $base_uri, $wait_replace_imgs;

$base_uri = 'https://www.bilibili.com';
$wait_replace_imgs = [];

function initializeResponsePath(): void
{
    exec('rm -rf response');
    exec('cp -a response_temp response');
}

function createDir($path)
{
    if (!file_exists($path)) {
        createDir(dirname($path));
        if (!is_dir($path) && !mkdir($path, 0777) && !is_dir($path)) {
        }
    }
}

function createResourcePath($image_path, $type)
{
    $parse_url = parse_url($image_path);
    $file_path = RESPONSE_RESOURCES . "{$type}" . $parse_url['path'];
    createDir(dirname($file_path));
    return $file_path;
}

function copyResource($url_paths)
{
    $Client = new GuzzleHttp\Client();
    $promises = [];
    foreach ($url_paths as $url_path) {
        foreach ($url_path as $url => $file_path) {
            $promises[$file_path] = $Client->getAsync($url, ['save_to' => $file_path]);
        }
    }
    $results = GuzzleHttp\Promise\unwrap($promises);
    return $results;
}

function deepCloneResource()
{
    global $base_uri, $wait_replace_imgs;
    $file_names = scandir(RESPONSE_RESOURCES_VIEWS);
    foreach ($file_names as $file_name) {
        if (!in_array($file_name, ['.', '..'])) {
            $html_node = file_get_contents(RESPONSE_RESOURCES_VIEWS . $file_name);
            $Crawler = new \Symfony\Component\DomCrawler\Crawler($html_node, $base_uri);
            $wait_replace_imgs = getImages($Crawler, $base_uri, $wait_replace_imgs);
            $html = $Crawler->html();
            preg_match_all('/<script.*?src\s*=\s*[\"|\'](.*?)[\"|\'].*?>\s*?<\/script>/i', $html, $js);
            $wait_replace_js = getScript($js[1]);
            copyResource([$wait_replace_imgs, $wait_replace_js]);
            die();
        }
    }
}

/**
 * @param \Symfony\Component\DomCrawler\Crawler $Crawler
 * @param string                                $base_uri
 * @param array                                 $wait_replace_imgs
 *
 * @return array
 */
function getImages(\Symfony\Component\DomCrawler\Crawler $Crawler, string $base_uri, array $wait_replace_imgs): array
{
    $images = $Crawler->filter('img')->images();
    foreach ($images as $image) {
        $img_uri = $image->getUri();
        if ($base_uri !== $img_uri) {
            $wait_replace_imgs[$img_uri] = createResourcePath($img_uri, 'img');
        }
    }
    return $wait_replace_imgs;
}

function getScript($js)
{
    $wait_replace_js = [];
    foreach ($js as $j) {
        $wait_replace_js[$j] = createResourcePath($j, 'js');
    }
    return $wait_replace_js;
}


deepCloneResource();
die();

try {
    $config = [
        'wait_capture_urls'        => [
            'index' => 'https://www.bilibili.com',
            //            'list'   => 'https://www.bilibili.com/v/dance/',
            //            'detail' => 'https://www.bilibili.com/video/av50530804/'
        ],
        'is_impersonate_rank'      => false,
        'is_deep_clone'            => false,
        'deep_clone_resource_type' => [
            'image',
            'js',
            'css',
        ],
    ];

    initializeResponsePath();
    $client = \Symfony\Component\Panther\Client::createChromeClient();
    foreach ($config['wait_capture_urls'] as $capture_name => $capture_url) {
        $crawler_response = $client->request('GET', $capture_url);
        $file_name = RESPONSE_RESOURCES_VIEWS . $capture_name . '.blade.php';
        file_put_contents($file_name, $crawler_response->html());
        if (true === $config['is_impersonate_rank']) {
            sleep(mt_rand(0, 2));
        }
    }
    if (true === $config['is_deep_clone']) {
        deepCloneResource();
    }
    echo 'success,you need clone response blade files';
} catch (Exception $exception) {
    echo $exception->getCode() . $exception->getMessage();
}
