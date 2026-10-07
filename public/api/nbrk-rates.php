<?php
/**
 * Официальные курсы НБРК для калькуляторов (сейчас — таможня посылок).
 *
 * RSS НБРК (nationalbank.kz/rss/get_rates.cfm) не отдаёт CORS-заголовков, и браузер
 * не может читать его со страницы. Этот скрипт забирает RSS на сервере и отдаёт
 * JSON того же происхождения: {"source", "date": "YYYY-MM-DD", "rates": {"USD": 453.65, …}}.
 * Курс — за 1 единицу валюты (RSS даёт за <quant> единиц).
 *
 * Кэш — файл во временном каталоге на 30 минут; если НБРК не ответил, отдаём
 * последний удачный ответ с "stale": true. Входных параметров нет.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('X-Robots-Tag: noindex');

date_default_timezone_set('Asia/Almaty');

const CACHE_TTL = 1800;
const CODES = ['USD', 'EUR', 'RUB', 'CNY', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'KGS', 'UZS', 'TRY', 'AED'];

$cacheDir = is_writable(sys_get_temp_dir()) ? sys_get_temp_dir() : null;
$cacheFile = $cacheDir ? $cacheDir . '/calk_kz_nbrk_rates.json' : null;

function respond(string $json, int $maxAge): void
{
    header('Cache-Control: public, max-age=' . $maxAge);
    echo $json;
    exit;
}

function fetch_rss(string $url): ?string
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 8,
            CURLOPT_USERAGENT => 'calk.kz rates proxy',
        ]);
        $body = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return ($body !== false && $code === 200) ? (string) $body : null;
    }
    $ctx = stream_context_create(['http' => ['timeout' => 8, 'user_agent' => 'calk.kz rates proxy']]);
    $body = @file_get_contents($url, false, $ctx);
    return $body === false ? null : $body;
}

/** @return array{date: string, rates: array<string, float>}|null */
function parse_rss(string $xml): ?array
{
    if (!preg_match('~<date>(\d{2})\.(\d{2})\.(\d{4})</date>~', $xml, $d)) {
        return null;
    }
    $rates = [];
    preg_match_all('~<item>(.*?)</item>~s', $xml, $items);
    foreach ($items[1] as $item) {
        if (!preg_match('~<title>([A-Z]{3})</title>~', $item, $t)
            || !preg_match('~<description>([\d.]+)</description>~', $item, $v)) {
            continue;
        }
        $quant = preg_match('~<quant>(\d+)</quant>~', $item, $q) ? max(1, (int) $q[1]) : 1;
        $rate = (float) $v[1] / $quant;
        if (in_array($t[1], CODES, true) && $rate > 0) {
            $rates[$t[1]] = round($rate, 6);
        }
    }
    if (!isset($rates['USD'], $rates['EUR'])) {
        return null;
    }
    return ['date' => "{$d[3]}-{$d[2]}-{$d[1]}", 'rates' => $rates];
}

if ($cacheFile && is_file($cacheFile) && time() - filemtime($cacheFile) < CACHE_TTL) {
    respond((string) file_get_contents($cacheFile), 900);
}

$xml = fetch_rss('https://nationalbank.kz/rss/get_rates.cfm?fdate=' . date('d.m.Y'));
$parsed = $xml !== null ? parse_rss($xml) : null;

if ($parsed !== null) {
    $json = json_encode(['source' => 'nationalbank.kz'] + $parsed, JSON_UNESCAPED_SLASHES);
    if ($cacheFile) {
        $tmp = $cacheFile . '.' . getmypid();
        if (@file_put_contents($tmp, $json) !== false) {
            @rename($tmp, $cacheFile);
        }
    }
    respond($json, 900);
}

if ($cacheFile && is_file($cacheFile)) {
    $stale = json_decode((string) file_get_contents($cacheFile), true);
    if (is_array($stale)) {
        respond((string) json_encode($stale + ['stale' => true], JSON_UNESCAPED_SLASHES), 300);
    }
}

http_response_code(502);
respond('{"error":"nbrk_unavailable"}', 60);
