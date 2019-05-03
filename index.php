<?php
require __DIR__ . '/vendor/autoload.php';

const RESPONSE_RESOURCES_VIEWS = 'response/resources/views/';

global $base_uri, $wait_replace_img;

$wait_replace_img = [];
$base_uri = 'https://www.bilibili.com';

function initializeResponsePath(): void
{
    exec('rm -rf response');
    exec('cp -a response_temp response');
}

function createImagePath($image_path)
{
    return $image_path;
}

function deepCloneResource()
{
    global $base_uri, $wait_replace_img;
    $file_names = scandir(RESPONSE_RESOURCES_VIEWS);
    foreach ($file_names as $file_name) {
        if (!in_array($file_name, ['.', '..'])) {
            $html_node = file_get_contents(RESPONSE_RESOURCES_VIEWS . $file_name);
            $Crawler = new \Symfony\Component\DomCrawler\Crawler($html_node, $base_uri);
            $images = $Crawler->filter('img')->images();
            foreach ($images as $image) {
                $img_uri = $image->getUri();
                if ($base_uri !== $img_uri) {
                    $wait_replace_img[$img_uri] = createImagePath($img_uri);
                }
            }
            var_dump($wait_replace_img);
            die();
        }
    }
}

deepCloneResource();
die();

try {
    $config = [
        'wait_capture_urls'        => [
            'index'  => 'https://www.bilibili.com',
            'list'   => 'https://www.bilibili.com/v/dance/',
            'detail' => 'https://www.bilibili.com/video/av50530804/'
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
