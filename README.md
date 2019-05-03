# Cornerstone

用于 clone 的项目基础

1.配置待克隆项目
```php
$config['wait_capture_urls']  // 待克隆 urls
$config['is_deep_clone']  // 启用深克隆，进行本地化资源
$config['deep_clone_resource_type']  // 本地化资源类型（图片，js，css）
```
2.配置基础 Uri
```php
$base_uri = ''
$base_uri = ''
```

2.运行方式（直接运行 /index.php）
```
php index.php

or

php -S localhost:8000
chrome open localhost:8000
```

3.在运行结束后，复制 response 至 Laravel 项目中即可

<hr>
Tips:  

如果进程卡死，请释放端口 9515
```
lsof -i:9515
kill PID
```
