<?php
/**
 * Одноразовый распаковщик деплой-пакета calk.kz (заливается scripts/deploy-fast.sh,
 * самоудаляется). Хост без SSH → дельта невозможна, поэтому: один zip по FTP +
 * этот скрипт по HTTPS. Токен одноразовый, вшивается хэшем при генерации.
 */
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

const TOKEN_HASH = '__TOKEN_HASH__';
const ZIP_NAME = '__ZIP_NAME__';
const KEEP_PREFIXES = ['app-updates/']; // никогда не трогаем (OTA)
const MAX_AGE_SEC = 900;

$fail = function (int $code, string $msg): never {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg]);
    exit;
};

// просрочен — самоуничтожение (защита от забытого экстрактора)
if (time() - (int)filemtime(__FILE__) > MAX_AGE_SEC) {
    @unlink(__DIR__ . '/' . ZIP_NAME);
    @unlink(__FILE__);
    $fail(410, 'expired');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') $fail(405, 'POST only');
$token = (string)($_POST['token'] ?? '');
if ($token === '' || !hash_equals(TOKEN_HASH, hash('sha256', $token))) $fail(403, 'bad token');

$root = __DIR__;
$zipPath = $root . '/' . ZIP_NAME;
if (!is_file($zipPath)) $fail(400, 'zip not found');
if (!class_exists('ZipArchive')) $fail(500, 'ZipArchive missing');

set_time_limit(300);
$zip = new ZipArchive();
if ($zip->open($zipPath) !== true) $fail(500, 'zip open failed');

// список путей пакета — он же «что должно остаться»
$manifest = [];
for ($i = 0; $i < $zip->numFiles; $i++) {
    $name = $zip->getNameIndex($i);
    if ($name === false || str_contains($name, '..')) continue;
    $manifest[rtrim($name, '/')] = true;
}
if (!isset($manifest['index.html'])) { $zip->close(); $fail(400, 'no index.html in package — refuse'); }

if (!$zip->extractTo($root)) { $zip->close(); $fail(500, 'extract failed'); }
$extracted = $zip->numFiles;
$zip->close();

// удаление файлов, которых нет в пакете (аналог mirror --delete)
$self = basename(__FILE__);
$deleted = 0;
$it = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS),
    RecursiveIteratorIterator::CHILD_FIRST
);
foreach ($it as $item) {
    $rel = str_replace('\\', '/', substr($item->getPathname(), strlen($root) + 1));
    foreach (KEEP_PREFIXES as $keep) {
        if ($rel === rtrim($keep, '/') || str_starts_with($rel, $keep)) continue 2;
    }
    if ($rel === $self || $rel === ZIP_NAME) continue;
    if ($item->isDir()) {
        if (!isset($manifest[$rel])) @rmdir($item->getPathname()); // удалится только пустая
    } elseif (!isset($manifest[$rel])) {
        if (@unlink($item->getPathname())) $deleted++;
    }
}

@unlink($zipPath);
@unlink(__FILE__);
echo json_encode(['ok' => true, 'extracted' => $extracted, 'deleted_stale' => $deleted]);
