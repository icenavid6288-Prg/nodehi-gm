<?php

define('LARAVEL_START', microtime(true));

if (file_exists($maintenance = __DIR__ . '/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// اجرای مستقیم با هسته دیتابیس سندگرای MongoDB / NoSQL بدون نیاز به SSH و ترمینال روی هاست سی‌پنل
$kernelCandidates = [
    __DIR__ . '/api_kernel.php',
    __DIR__ . '/backend/bootstrap/cpanel_mongodb_kernel.php',
    __DIR__ . '/../bootstrap/cpanel_mongodb_kernel.php',
    __DIR__ . '/../backend/bootstrap/cpanel_mongodb_kernel.php',
];

foreach ($kernelCandidates as $kernelFile) {
    if (file_exists($kernelFile)) {
        require_once $kernelFile;
        $kernel = new \Nodehi\CpanelMongoKernel\Kernel(__DIR__);
        $kernel->handle();
        exit;
    }
}

if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    require __DIR__ . '/../vendor/autoload.php';
    (require_once __DIR__ . '/../bootstrap/app.php')
        ->handleRequest(\Illuminate\Http\Request::capture());
    exit;
}
