# Cornerstone

克隆大师基类

#### Action
用于 clone 的项目基础

推荐使用于 Ubuntu 或 Mac 环境下且以安装 Chrome 浏览器

PHP 版本 7.1 以上

1.配置待克隆项目
```php
// 待克隆 urls
$config['wait_capture_urls']  => [
        'index' => 'https://www.bilibili.com',
        //'list'   => 'https://www.bilibili.com/v/dance/',
        //'detail' => 'https://www.bilibili.com/video/av50530804/'
    ]
    
// 启用深克隆，进行本地化资源
$config['is_deep_clone'] = true 

// 本地化资源类型（图片，js，css）
$config['deep_clone_resource_type'] =  [
        'images',
        'js',
        'css',
    ],
    
// 声明资源类型为 laravel，进行模版内容替换(TODO)
$config['is_laravel_resource'] = true
```

2.配置基础 Uri
```php
$base_uri = ''
```

3.运行方式（直接运行 /index.php）
```
php index.php

or

php -S localhost:8000
chrome open localhost:8000
```

4.在运行结束后，复制 response 至 Laravel 或其它项目中即可

 -图片资源在项目中需做软链 php artisan storage:link


<hr>
Tips:  

如果进程卡死，请释放端口 9515
```
lsof -i:9515
kill PID
```


#### Todo
支持 DedeCMS
