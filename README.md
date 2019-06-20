# Cornerstone

克隆大师基类

#### Action
用于 MasterCloner clone 项目页面资源的基础类库

##### 推荐使用于 Ubuntu 或 Mac 环境下且以安装 Chrome 浏览器

##### PHP 版本 7.1 以上

#### 效果如下


1.配置待克隆项目

```php
// 配置基础 Uri (必须)
$base_uri = 'https://www.bilibili.com'

// 待克隆 urls
$config['wait_capture_urls']  => [
        'index' => 'https://www.bilibili.com',  // (必须)
        //'list'   => 'https://www.bilibili.com/v/dance/',
        //'detail' => 'https://www.bilibili.com/video/av50530804/'
    ]
// 启用深克隆，进行本地化资源
$config['is_deep_clone'] = true 
// 启用 CDN 克隆，进行 CDN 资源本地化（TODO）
$config['is_cdn_clone'] = true
// 本地化资源类型（图片，js，css）
$config['deep_clone_resource_type'] =  [
        'images',
        'js',
        'css',
    ],
    
// 声明资源类型为 laravel，进行模版内容替换(TODO)
$config['is_laravel_resource'] = true
```



2.运行

cli 运行方式
```
php index.php

// 超链接
php links.php
```

fpm 运行方式
```
php -S localhost:8000
chrome open localhost:8000
```

3.在运行结束后，复制 response 至 Laravel 或其它项目中即可


<hr>
Tips:  

如果进程卡死，请释放端口 9515
```
lsof -i:9515
kill PID
```


#### Todo
提取配置抽象成类

CDN 等资源本地化
