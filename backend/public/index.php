<?php

define('LARAVEL_START', microtime(true));

if (file_exists($maintenance = __DIR__ . '/../storage/framework/maintenance.php')) {
    require $maintenance;
}

if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    require __DIR__ . '/../vendor/autoload.php';
    (require_once __DIR__ . '/../bootstrap/app.php')
        ->handleRequest(\Illuminate\Http\Request::capture());
    exit;
}

// اجرای مستقیم با هسته SQLite بدون نیاز به SSH و Composer روی هاست اشتراکی سی‌پنل
if (file_exists(__DIR__ . '/../bootstrap/cpanel_sqlite_kernel.php')) {
    require_once __DIR__ . '/../bootstrap/cpanel_sqlite_kernel.php';
    $kernel = new \Nodehi\CpanelSqliteKernel\Kernel(__DIR__);
    $kernel->handle();
    exit;
}
