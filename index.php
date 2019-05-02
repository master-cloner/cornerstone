<?php
require __DIR__ . '/vendor/autoload.php'; // Composer's autoloader

function initializeResponsePath(): void
{
    exec('rm -rf response');
    exec('cp -a response_temp response');
}

function deepCloneResource()
{

}


try {
    $config = [
        'wait_capture_urls'        => [
            'index'  => 'https://www.bilibili.com',
            'list'   => 'https://www.bilibili.com/v/dance/',
            'detail' => 'https://www.bilibili.com/video/av50530804/'
        ],
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
        $crawler = $client->request('GET', $capture_url);
        $file_name = 'response/resources/views/' . $capture_name . '.blade.php';
        file_put_contents($file_name, $crawler->html());
    }
    if (true === $config['is_deep_clone']) {
        deepCloneResource();
    }
    echo 'success,you need clone response blade files';
} catch (Exception $exception) {
    echo $exception->getCode() . $exception->getMessage();
}
