<?php
/**
 * ورودی اصلی وب‌سایت نودهی روی هاست اشتراکی سی‌پنل پارس‌پک (بدون نیاز به SSH و ترمینال)
 * پشتیبانی خودکار از دیتابیس ساده SQLite (فایل database.sqlite از پیش ساخته‌شده)
 */

define('LARAVEL_START', microtime(true));

// ۱. اگر پوشه vendor لاراول موجود باشد، از هسته کامل لاراول با دیتابیس SQLite استفاده می‌شود
$autoloadPaths = [
    __DIR__ . '/../backend/vendor/autoload.php',
    __DIR__ . '/backend/vendor/autoload.php',
    __DIR__ . '/vendor/autoload.php',
];

$loadedVendor = false;
foreach ($autoloadPaths as $autoload) {
    if (file_exists($autoload)) {
        require $autoload;
        $loadedVendor = true;
        break;
    }
}

if ($loadedVendor) {
    $appPaths = [
        __DIR__ . '/../backend/bootstrap/app.php',
        __DIR__ . '/backend/bootstrap/app.php',
        __DIR__ . '/bootstrap/app.php',
    ];
    foreach ($appPaths as $appFile) {
        if (file_exists($appFile)) {
            (require_once $appFile)->handleRequest(\Illuminate\Http\Request::capture());
            exit;
        }
    }
}

// ۲. حالت بدون نیاز به SSH و ترمینال (ویژه هاست اشتراکی سی‌پنل پارس‌پک بدون نیاز به اجرای composer)
// اتصال مستقیم به دیتابیس آماده SQLite (database.sqlite) و پاسخ‌دهی کامل به API و React SPA
$kernelPaths = [
    __DIR__ . '/../backend/bootstrap/cpanel_sqlite_kernel.php',
    __DIR__ . '/backend/bootstrap/cpanel_sqlite_kernel.php',
    __DIR__ . '/api_kernel.php',
];

foreach ($kernelPaths as $kernelFile) {
    if (file_exists($kernelFile)) {
        require_once $kernelFile;
        $kernel = new \Nodehi\CpanelSqliteKernel\Kernel(__DIR__);
        $kernel->handle();
        exit;
    }
}

http_response_code(500);
header('Content-Type: text/plain; charset=utf-8');
echo 'فایل هسته بک‌اند یافت نشد. لطفاً محتویات بسته را به طور کامل آپلود نمایید.';
