<?php
/**
 * User: Ben
 * Email: benhuang1024@gmail.com
 * Date: 2019-08-03
 * Time: 12:30
 */

namespace App;

use Exception;
use function GuzzleHttp\Promise\unwrap;
use Noodlehaus\Config;
use Symfony\Component\Panther\Client;
use Symfony\Component\DomCrawler\Crawler;

/**
 * Class Main
 * @package App
 */
class Main
{
    /**
     * @var
     */
    protected $config;

    /**
     * Main constructor.
     */
    public function __construct()
    {
        $this->config = Config::load(__DIR__ . '/../config/app.php');
    }

    /**
     * @return null
     */
    public function run()
    {
        try {
            if (isCli()) {
                echo 'action' . PHP_EOL;
            }
            set_time_limit(1800);
            ini_set("max_execution_time", -1);
            ini_set('memory_limit', '512M');
            $this->initializeResponsePath();
            $client = Client::createChromeClient();
            foreach ($this->config['wait_capture_urls'] as $capture_name => $capture_url) {
                $crawler_response = $client->request('GET', $capture_url);
                $file_name = RESPONSE_RESOURCES_VIEWS . $capture_name . '.blade.php';
                file_put_contents($file_name, $crawler_response->html());
                if (true === $this->config['is_impersonate_rank']) {
                    sleep(random_int(0, 2));
                }
            }
            if (true === $this->config['is_deep_clone']) {
                $this->deepCloneResource($this->config['is_laravel_resource']);
            }
            echo '成功,资源存储在 response 中,<br/>';
            $t2 = microtime(true);
            echo '耗时' . round($t2 - $t1, 3) . '秒';
        } catch (Exception $exception) {
            echo $exception->getCode() . ', message:' . $exception->getMessage();
        }
    }

    public function initializeResponsePath(): void
    {
        exec('rm -rf response');
        exec('cp -a response_temp response');
    }

    public function deepCloneResource($is_laravel_resource)
    {
        $file_names = scandir(RESPONSE_RESOURCES_VIEWS);
        foreach ($file_names as $file_name) {
            if (! in_array($file_name, ['.', '..'])) {
                $blade_file = RESPONSE_RESOURCES_VIEWS . $file_name;
                $html_node = file_get_contents($blade_file);
                $Crawler = new Crawler($html_node, $this->base_uri);
                preg_match_all('/<script.*?src\s*=\s*[\"|\'](.*?)[\"|\'].*?>\s*?<\/script>/i', $html_node, $js);
                preg_match_all('/<link.*?href\s*=\s*[\"|\'](.*?)[\"|\'].*?>/i', $html_node, $css);
                foreach ($css[0] as $key => $value) {
                    if (false === strstr($value, 'stylesheet')) {
                        unset($css[1][$key]);
                    }
                }
                $this->wait_replace_imgs = getImages($Crawler, $this->base_uri, $this->wait_replace_imgs);
                $wait_replace_js = getScriptOrCss($js[1], 'js');
                $wait_replace_css = getScriptOrCss(array_values($css[1]), 'css');

                $replace_resources = copyResource([$this->wait_replace_imgs, $wait_replace_js, $wait_replace_css]);
                $html_node = str_replace(['="https:', '="http:',], '="', $html_node);
                foreach ($replace_resources as $url => $file_path) {
                    $url = str_replace(['https:', 'http:',], '', $url);
                    $file_path = str_replace(
                        ['response/resources/', 'response/storage/app/public/'],
                        '',
                        $file_path);
                    if ($is_laravel_resource) {
                        $file_path = "{{ asset('" . $file_path . "') }}";
                    }
                    $html_node = str_replace($url, $file_path, $html_node);
                }
                file_put_contents($blade_file, $html_node);
            }
        }
    }

    public function getScriptOrCss($data, $type)
    {
        $wait_replace_arr = [];
        foreach ($data as $j) {
            $wait_replace_arr[$j] = createResourcePath($j, $type);
        }
        return $wait_replace_arr;
    }

    public function copyResource($url_paths)
    {
        $Client = new \GuzzleHttp\Client();
        $replace_resources = $promises = [];
        foreach ($url_paths as $url_path) {
            foreach ($url_path as $url => $file_path) {
                $promises[$file_path] = $Client->getAsync($url, ['save_to' => $file_path]);
                $replace_resources[$url] = $file_path;
            }
        }
        GuzzleHttp\Promise\unwrap($promises);
        return $replace_resources;
    }

    public function createDir($path, $i = 0)
    {
        if (50 > $i && $path && ! file_exists($path)) {
            $i++;
            createDir(dirname($path), $i);
            if (! is_dir($path) && ! mkdir($path, 0777) && ! is_dir($path)) {
                echo $path . PHP_EOL;
            }
        }
    }

    public function createResourcePath($file_path, $type)
    {
        $parse_url = parse_url($file_path);
        switch ($type) {
            case 'img':
            case 'image':
                $type = 'images';
                $file_path = STORAGE_APP . "{$type}" . $parse_url['path'];
                break;
            case 'js':
            case 'css':
                $file_path = RESPONSE_RESOURCES . "{$type}" . $parse_url['path'];
                break;
        }
        createDir(dirname($file_path));
        return $file_path;
    }

    public function getImages(\Symfony\Component\DomCrawler\Crawler $Crawler, string $base_uri, array $wait_replace_imgs): array
    {
        $images = $Crawler->filter('img')->images();
        foreach ($images as $image) {
            $img_uri = $image->getUri();
            if ($img_uri && $base_uri !== $img_uri) {
                $wait_replace_imgs[$img_uri] = createResourcePath($img_uri, 'img');
            }
        }
        return $wait_replace_imgs;
    }

    public function isCli()
    {
        return preg_match("/cli/i", php_sapi_name()) ? true : false;
    }

}