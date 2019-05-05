# Cornerstone

#### Action
用于 clone 的项目基础

1.配置待克隆项目
```php
$config['wait_capture_urls']  // 待克隆 urls
$config['is_deep_clone']  // 启用深克隆，进行本地化资源
$config['deep_clone_resource_type']  // 本地化资源类型（图片，js，css）
$config['is_laravel_resource'] // 声明资源类型为 laravel，进行模版内容替换
```

2.配置基础 Uri
```php
$base_uri = ''
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
