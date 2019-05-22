<?php
return [
    'base_uri'                 => 'https://www.bilibili.com',
    'wait_capture_urls'        => [
        'index' => 'https://www.bilibili.com',
        //'list'   => 'https://www.bilibili.com/v/dance/',
        //'detail' => 'https://www.bilibili.com/video/av50530804/'
    ],
    'is_impersonate_rank'      => false,
    'is_deep_clone'            => true,
    'is_laravel_resource'      => true,
    'deep_clone_resource_type' => [
        'images',
        'js',
        'css',
    ]
];