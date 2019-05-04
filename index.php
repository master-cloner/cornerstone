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

function createDir($path, $i = 0)
{
    if (50 > $i && $path && !file_exists($path)) {
        $i++;
        createDir(dirname($path), $i);
        if (!is_dir($path) && !mkdir($path, 0777) && !is_dir($path)) {
            echo $path . PHP_EOL;
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
            $replace_resources[$url] = $file_path;
        }
    }
    $results = GuzzleHttp\Promise\unwrap($promises);

    return $replace_resources;
}

function deepCloneResource()
{
    global $base_uri, $wait_replace_imgs;
    $file_names = scandir(RESPONSE_RESOURCES_VIEWS);
    foreach ($file_names as $file_name) {
        if (!in_array($file_name, ['.', '..'])) {
            $blade_file = RESPONSE_RESOURCES_VIEWS . $file_name;
            $html_node = file_get_contents($blade_file);
            $Crawler = new \Symfony\Component\DomCrawler\Crawler($html_node, $base_uri);
            preg_match_all('/<script.*?src\s*=\s*[\"|\'](.*?)[\"|\'].*?>\s*?<\/script>/i', $html_node, $js);
            preg_match_all('/<link.*?href\s*=\s*[\"|\'](.*?)[\"|\'].*?>/i', $html_node, $css);
            foreach ($css[0] as $key => $value) {
                if (false === strstr($value, 'stylesheet')) {
                    unset($css[1][$key]);
                }
            }
            $wait_replace_imgs = getImages($Crawler, $base_uri, $wait_replace_imgs);
            $wait_replace_js = getScriptOrCss($js[1], 'js');
            $wait_replace_css = getScriptOrCss(array_values($css[1]), 'css');

            $replace_resources = copyResource([$wait_replace_imgs, $wait_replace_js, $wait_replace_css]);
            $html_node = str_replace(['="https:', '="http:',], '="', $html_node);
            foreach ($replace_resources as $url => $file_path) {
                $url = str_replace(['https:', 'http:',], '', $url);
                $file_path = str_replace('response/resources/', '', $file_path);
                $html_node = str_replace($url, $file_path, $html_node);
            }
            file_put_contents($blade_file, $html_node);
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

function getScriptOrCss($data, $type)
{
    $wait_replace_arr = [];
    foreach ($data as $j) {
        $wait_replace_arr[$j] = createResourcePath($j, $type);
    }
    return $wait_replace_arr;
}

$t1 = microtime(true);

try {
    set_time_limit(1800);
    ini_set("max_execution_time", 1800);
    ini_set('memory_limit', '512M');

    $config = [
        'wait_capture_urls'        => [
            'index' => 'https://www.bilibili.com',
            //            'list'   => 'https://www.bilibili.com/v/dance/',
            //            'detail' => 'https://www.bilibili.com/video/av50530804/'
        ],
        'is_impersonate_rank'      => false,
        'is_deep_clone'            => true,
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
    echo '成功,资源存储在 response 中,' . PHP_EOL;
    $t2 = microtime(true);
    echo '耗时' . round($t2 - $t1, 3) . '秒';
} catch (Exception $exception) {
    echo $exception->getCode() . ', message:' . $exception->getMessage();
}
