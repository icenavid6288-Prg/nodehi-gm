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

// اجرای مستقیم با هسته دیتابیس سندگرای MongoDB / NoSQL بدون نیاز به SSH و ترمینال روی هاست سی‌پنل
if (file_exists(__DIR__ . '/../bootstrap/cpanel_mongodb_kernel.php')) {
    require_once __DIR__ . '/../bootstrap/cpanel_mongodb_kernel.php';
    $kernel = new \Nodehi\CpanelMongoKernel\Kernel(__DIR__);
    $kernel->handle();
    exit;
}

if (file_exists(__DIR__ . '/api_kernel.php')) {
    require_once __DIR__ . '/api_kernel.php';
    $kernel = new \Nodehi\CpanelMongoKernel\Kernel(__DIR__);
    $kernel->handle();
    exit;
}
