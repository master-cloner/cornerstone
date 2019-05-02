<?php
require __DIR__ . '/vendor/autoload.php'; // Composer's autoloader

$client = \Symfony\Component\Panther\Client::createChromeClient();
$crawler = $client->request('GET', 'https://api-platform.com'); // Yes, this website is 100% in JavaScript

$link = $crawler->selectLink('Support')->link();
$crawler = $client->click($link);

// Wait for an element to be rendered
$client->waitFor('.support');

echo $crawler->filter('.support')->text();
//$client->takeScreenshot('screen.png'); // Yeah, screenshot!