<?php
/**
 * اسکریپت نصب گرافیکی و بررسی سلامت هاست سی‌پنل پارس‌پک (بدون نیاز به SSH و ترمینال)
 * ویژه فروشگاه اینترنتی نودهی — نسخه React + TypeScript و Laravel (دیتابیس ساده SQLite)
 *
 * نحوه استفاده:
 * کافیست بعد از آپلود فایل‌ها در public_html، آدرس زیر را در مرورگر باز کنید:
 * https://your-domain.ir/install.php
 */

declare(strict_types=1);

header('Content-Type: text/html; charset=utf-8');

// ۱. بارگذاری هسته SQLite در صورت نیاز برای اطمینان از وجود جداول و داده‌های اولیه
$kernelPaths = [
    __DIR__ . '/api_kernel.php',
    __DIR__ . '/../backend/bootstrap/cpanel_sqlite_kernel.php',
    __DIR__ . '/backend/bootstrap/cpanel_sqlite_kernel.php',
    dirname(__DIR__) . '/bootstrap/cpanel_sqlite_kernel.php',
];

foreach ($kernelPaths as $kp) {
    if (file_exists($kp)) {
        require_once $kp;
        try {
            new \Nodehi\CpanelSqliteKernel\Kernel(__DIR__);
        } catch (\Throwable $e) {
            // در ادامه خطا بررسی و نمایش داده می‌شود
        }
        break;
    }
}

// ۲. پیدا کردن تمامی مسیرهای دیتابیس SQLite (هم در public_html/database و هم در ../backend/database)
$candidateDbFiles = [
    __DIR__ . '/database/database.sqlite',
    __DIR__ . '/../backend/database/database.sqlite',
    __DIR__ . '/backend/database/database.sqlite',
    dirname(__DIR__) . '/database/database.sqlite',
];

$activeDbFiles = [];
foreach ($candidateDbFiles as $file) {
    $realDir = dirname($file);
    if (is_dir($realDir)) {
        @chmod($realDir, 0755);
    }
    if (file_exists($file)) {
        @chmod($file, 0664);
        $rp = realpath($file) ?: $file;
        if (!in_array($rp, $activeDbFiles, true)) {
            $activeDbFiles[] = $rp;
        }
    }
}

$primaryDb = $activeDbFiles[0] ?? (__DIR__ . '/database/database.sqlite');
$primaryDbDir = dirname($primaryDb);
if (!is_dir($primaryDbDir)) {
    @mkdir($primaryDbDir, 0755, true);
}

$lockFile = $primaryDbDir . '/installed.lock';
$message = null;
$error = null;

// ۳. عملیات حذف خودکار فایل install.php برای امنیت پس از نصب
if (($_GET['action'] ?? '') === 'delete_installer' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    @file_put_contents($lockFile, date('c'));
    if (@unlink(__FILE__)) {
        header('Location: /?installed=1');
        exit;
    } else {
        $error = 'حذف خودکار فایل install.php توسط محدودیت دسترسی هاست انجام نشد. لطفاً از طریق File Manager سی‌پنل فایل install.php را حذف نمایید.';
    }
}

// ۴. اتصال به دیتابیس SQLite و خواندن مقادیر فعلی
$pdo = null;
$dbStats = [
    'products' => 0,
    'categories' => 0,
    'brands' => 0,
    'coupons' => 0,
    'admin_phone' => '09120000000',
    'admin_name' => 'مدیر فروشگاه نودهی',
    'store_name' => 'فروشگاه لوازم خانگی نودهی',
    'phone' => '۰۲۱-۹۱۰۰۰۰۰۰',
    'mobile' => '۰۹۱۲۰۰۰۰۰۰۰',
    'address' => 'تهران، خیابان ولیعصر، پلاک ۱۲۳، طبقه سوم',
    'zarinpal_merchant' => '',
    'sms_api_key' => '',
];

try {
    if (extension_loaded('pdo_sqlite')) {
        $pdo = new PDO('sqlite:' . $primaryDb, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);

        // ثبت و ذخیره فرم تنظیمات اولیه و شماره مدیر
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['form_action'] ?? '') === 'save_setup') {
            $storeName = trim((string) ($_POST['store_name'] ?? 'فروشگاه لوازم خانگی نودهی'));
            $adminName = trim((string) ($_POST['admin_name'] ?? 'مدیر فروشگاه نودهی'));
            $adminPhone = preg_replace('/[^0-9]/', '', (string) ($_POST['admin_phone'] ?? '09120000000'));
            $supportPhone = trim((string) ($_POST['phone'] ?? '۰۲۱-۹۱۰۰۰۰۰۰'));
            $address = trim((string) ($_POST['address'] ?? ''));
            $zarinpalMerchant = trim((string) ($_POST['zarinpal_merchant'] ?? ''));
            $smsApiKey = trim((string) ($_POST['sms_api_key'] ?? ''));

            if (!preg_match('/^09[0-9]{9}$/', $adminPhone)) {
                $error = 'شماره موبایل مدیر باید ۱۱ رقم و با 09 شروع شود (مثال: 09120000000).';
            } else {
                $now = date('Y-m-d H:i:s');

                // اعمال تغییرات روی تمامی فایل‌های دیتابیس SQLite موجود در هاست
                foreach ($activeDbFiles as $dbTarget) {
                    @chmod(dirname($dbTarget), 0755);
                    @chmod($dbTarget, 0664);
                    $targetPdo = new PDO('sqlite:' . $dbTarget, null, null, [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    ]);

                    // به‌روزرسانی یا ساخت کاربر مدیر کل (SUPER_ADMIN)
                    $existingAdmin = $targetPdo->query("SELECT id FROM users WHERE role = 'SUPER_ADMIN' ORDER BY id ASC LIMIT 1")->fetchColumn();
                    if ($existingAdmin) {
                        $stmt = $targetPdo->prepare("UPDATE users SET name = :name, phone = :phone, updated_at = :now WHERE id = :id");
                        $stmt->execute([':name' => $adminName, ':phone' => $adminPhone, ':now' => $now, ':id' => $existingAdmin]);
                    } else {
                        $stmt = $targetPdo->prepare("INSERT INTO users (name, phone, email, role, phone_verified_at, created_at, updated_at) VALUES (:name, :phone, 'admin@nodehi.ir', 'SUPER_ADMIN', :now, :now, :now)");
                        $stmt->execute([':name' => $adminName, ':phone' => $adminPhone, ':now' => $now]);
                    }

                    // ذخیره تنظیمات فروشگاه در جدول settings
                    $settingsToSave = [
                        ['store_name', $storeName, 'general', 1],
                        ['phone', $supportPhone, 'general', 1],
                        ['mobile', $adminPhone, 'general', 1],
                        ['address', $address, 'general', 1],
                        ['zarinpal_merchant', $zarinpalMerchant, 'payment', 0],
                        ['sms_api_key', $smsApiKey, 'sms', 0],
                    ];

                    foreach ($settingsToSave as [$sKey, $sVal, $sGroup, $sPub]) {
                        $exists = $targetPdo->prepare("SELECT id FROM settings WHERE key = :k LIMIT 1");
                        $exists->execute([':k' => $sKey]);
                        if ($exists->fetchColumn()) {
                            $upd = $targetPdo->prepare("UPDATE settings SET value = :v, updated_at = :now WHERE key = :k");
                            $upd->execute([':v' => $sVal, ':now' => $now, ':k' => $sKey]);
                        } else {
                            $ins = $targetPdo->prepare("INSERT INTO settings (key, value, \"group\", is_public, created_at, updated_at) VALUES (:k, :v, :g, :p, :now, :now)");
                            $ins->execute([':k' => $sKey, ':v' => $sVal, ':g' => $sGroup, ':p' => $sPub, ':now' => $now]);
                        }
                    }
                }

                @file_put_contents($lockFile, date('c'));
                $message = 'تنظیمات فروشگاه، سطوح دسترسی لینوکس و حساب مدیر کل با موفقیت در دیتابیس SQLite ذخیره شد!';
            }
        }

        // خواندن آمار فعلی از دیتابیس
        $dbStats['products'] = (int) $pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();
        $dbStats['categories'] = (int) $pdo->query("SELECT COUNT(*) FROM categories")->fetchColumn();
        $dbStats['brands'] = (int) $pdo->query("SELECT COUNT(*) FROM brands")->fetchColumn();
        $dbStats['coupons'] = (int) $pdo->query("SELECT COUNT(*) FROM coupons")->fetchColumn();

        $adminRow = $pdo->query("SELECT name, phone FROM users WHERE role = 'SUPER_ADMIN' ORDER BY id ASC LIMIT 1")->fetch();
        if ($adminRow) {
            $dbStats['admin_name'] = $adminRow['name'];
            $dbStats['admin_phone'] = $adminRow['phone'];
        }

        $sRows = $pdo->query("SELECT key, value FROM settings")->fetchAll();
        foreach ($sRows as $sr) {
            if (isset($dbStats[$sr['key']])) {
                $dbStats[$sr['key']] = (string) $sr['value'];
            }
        }
    }
} catch (\Throwable $e) {
    $error = 'خطا در ارتباط با دیتابیس SQLite: ' . $e->getMessage();
}

// ۵. بررسی پیش‌نیازهای سرور سی‌پنل پارس‌پک
$checks = [
    [
        'title' => 'نسخه PHP سرور (حداقل 8.1)',
        'ok' => version_compare(PHP_VERSION, '8.1.0', '>='),
        'detail' => 'PHP ' . PHP_VERSION,
    ],
    [
        'title' => 'اکستنشن دیتابیس PDO SQLite',
        'ok' => extension_loaded('pdo_sqlite'),
        'detail' => extension_loaded('pdo_sqlite') ? 'فعال (بدون نیاز به MySQL)' : 'غیرفعال — از بخش Select PHP Version در سی‌پنل تیک pdo_sqlite را بزنید',
    ],
    [
        'title' => 'اکستنشن‌های JSON و MBString',
        'ok' => extension_loaded('json') && extension_loaded('mbstring'),
        'detail' => 'فعال و آماده پردازش فارسی',
    ],
    [
        'title' => 'دسترسی نوشتن پوشه دیتابیس (chmod 0755)',
        'ok' => is_dir($primaryDbDir) && is_writable($primaryDbDir),
        'detail' => is_writable($primaryDbDir) ? 'قابل نوشتن (مناسب برای فایل ژورنال SQLite)' : 'غیرقابل نوشتن — دسترسی پوشه database را روی 755 بگذارید',
    ],
    [
        'title' => 'فایل دیتابیس آماده (database.sqlite)',
        'ok' => file_exists($primaryDb) && is_writable($primaryDb) && $dbStats['products'] > 0,
        'detail' => file_exists($primaryDb)
            ? sprintf('متصل و قابل نوشتن (%d محصول، %d دسته‌بندی، %d برند)', $dbStats['products'], $dbStats['categories'], $dbStats['brands'])
            : 'فایل دیتابیس یافت نشد',
    ],
    [
        'title' => 'فایل مسیریابی آپاچی (.htaccess)',
        'ok' => file_exists(__DIR__ . '/.htaccess'),
        'detail' => file_exists(__DIR__ . '/.htaccess') ? 'موجود در public_html' : 'فایل .htaccess یافت نشد (Show Hidden Files را در سی‌پنل فعال کنید)',
    ],
];

$allChecksPassed = true;
foreach ($checks as $c) {
    if (!$c['ok']) {
        $allChecksPassed = false;
    }
}
$isInstalled = file_exists($lockFile);
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow" />
    <title>نصب‌کننده خودکار فروشگاه نودهی | ویژه هاست سی‌پنل پارس‌پک (SQLite)</title>
    <style>
        :root {
            --bg: #f8fafc;
            --card: #ffffff;
            --border: #e2e8f0;
            --text: #0f172a;
            --muted: #475569;
            --primary: #e11d48;
            --primary-hover: #be123c;
            --success: #059669;
            --success-bg: #ecfdf5;
            --danger: #dc2626;
            --danger-bg: #fef2f2;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: Tahoma, 'Vazirmatn', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.75;
            padding: 32px 16px 64px;
        }
        .container {
            max-width: 760px;
            margin: 0 auto;
        }
        .header-card {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #fff;
            border-radius: 20px;
            padding: 28px 32px;
            margin-bottom: 24px;
            box-shadow: 0 12px 30px -10px rgba(15, 23, 42, 0.25);
        }
        .badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.14);
            color: #fda4af;
            font-size: 12px;
            font-weight: bold;
            padding: 4px 12px;
            border-radius: 999px;
            margin-bottom: 10px;
        }
        .header-card h1 {
            font-size: 22px;
            margin-bottom: 8px;
        }
        .header-card p {
            color: #cbd5e1;
            font-size: 14px;
        }
        .card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 18px;
            padding: 24px 28px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
        }
        .card h2 {
            font-size: 17px;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .alert {
            padding: 14px 18px;
            border-radius: 14px;
            margin-bottom: 20px;
            font-size: 14px;
            font-weight: bold;
        }
        .alert-success {
            background: var(--success-bg);
            color: var(--success);
            border: 1px solid #a7f3d0;
        }
        .alert-error {
            background: var(--danger-bg);
            color: var(--danger);
            border: 1px solid #fecaca;
        }
        .check-list {
            list-style: none;
            display: grid;
            gap: 12px;
        }
        .check-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            border-radius: 12px;
            background: #f8fafc;
            border: 1px solid var(--border);
            font-size: 13.5px;
        }
        .check-status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-weight: bold;
            font-size: 12.5px;
            padding: 3px 10px;
            border-radius: 999px;
        }
        .status-ok { background: var(--success-bg); color: var(--success); }
        .status-fail { background: var(--danger-bg); color: var(--danger); }
        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        @media (max-width: 640px) {
            .form-grid { grid-template-columns: 1fr; }
        }
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .form-group.full {
            grid-column: 1 / -1;
        }
        label {
            font-size: 13px;
            font-weight: bold;
            color: var(--text);
        }
        input[type="text"] {
            width: 100%;
            padding: 11px 14px;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            font-family: inherit;
            font-size: 14px;
            color: var(--text);
            background: #fff;
            transition: border-color 0.15s;
        }
        input[type="text"]:focus {
            outline: none;
            border-color: var(--primary);
        }
        .ltr-input {
            direction: ltr;
            text-align: left;
            font-family: monospace;
        }
        .hint {
            font-size: 11.5px;
            color: var(--muted);
        }
        .btn-row {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 22px;
        }
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 12px 24px;
            border-radius: 12px;
            font-family: inherit;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            text-decoration: none;
            border: none;
            transition: all 0.15s;
        }
        .btn-primary {
            background: var(--primary);
            color: #fff;
        }
        .btn-primary:hover {
            background: var(--primary-hover);
        }
        .btn-outline {
            background: #fff;
            color: var(--text);
            border: 1px solid #cbd5e1;
        }
        .btn-outline:hover {
            background: #f1f5f9;
        }
        .btn-danger {
            background: #fee2e2;
            color: #b91c1c;
            border: 1px solid #fecaca;
        }
        .btn-danger:hover {
            background: #fecaca;
        }
        .stats-bar {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-top: 16px;
        }
        @media (max-width: 640px) {
            .stats-bar { grid-template-columns: repeat(2, 1fr); }
        }
        .stat-box {
            background: #f8fafc;
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 12px;
            text-align: center;
        }
        .stat-box strong {
            display: block;
            font-size: 20px;
            color: var(--primary);
        }
        .stat-box span {
            font-size: 12px;
            color: var(--muted);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header-card">
            <span class="badge">ویژه هاست اشتراکی سی‌پنل پارس‌پک • بدون نیاز به SSH و ترمینال</span>
            <h1>نصب‌کننده گرافیکی فروشگاه نودهی (نسخه React + Laravel SQLite)</h1>
            <p>
                دیتابیس سادهٔ SQLite از پیش ساخته و با محصولات پر شده است. این صفحه دسترسی‌های لینوکس هاست شما را تنظیم می‌کند و به شما امکان می‌دهد شماره موبایل مدیر کل و مشخصات فروشگاه را بدون نیاز به ترمینال یا phpMyAdmin شخصی‌سازی کنید.
            </p>
        </div>

        <?php if ($message): ?>
            <div class="alert alert-success">✓ <?= htmlspecialchars($message, ENT_QUOTES, 'UTF-8') ?></div>
        <?php endif; ?>

        <?php if ($error): ?>
            <div class="alert alert-error">⚠️ <?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
        <?php endif; ?>

        <div class="card">
            <h2>
                <span>۱. بررسی خودکار پیش‌نیازهای هاست و دیتابیس SQLite</span>
                <span class="check-status <?= $allChecksPassed ? 'status-ok' : 'status-fail' ?>">
                    <?= $allChecksPassed ? '✓ تمامی پیش‌نیازها آماده است' : 'نیاز به بررسی' ?>
                </span>
            </h2>
            <ul class="check-list">
                <?php foreach ($checks as $check): ?>
                    <li class="check-item">
                        <span><strong><?= htmlspecialchars($check['title'], ENT_QUOTES, 'UTF-8') ?></strong></span>
                        <span class="check-status <?= $check['ok'] ? 'status-ok' : 'status-fail' ?>">
                            <?= $check['ok'] ? '✓ ' : '✗ ' ?>
                            <?= htmlspecialchars($check['detail'], ENT_QUOTES, 'UTF-8') ?>
                        </span>
                    </li>
                <?php endforeach; ?>
            </ul>

            <div class="stats-bar">
                <div class="stat-box">
                    <strong><?= (int) $dbStats['products'] ?></strong>
                    <span>محصول آماده در دیتابیس</span>
                </div>
                <div class="stat-box">
                    <strong><?= (int) $dbStats['categories'] ?></strong>
                    <span>دسته‌بندی کالا</span>
                </div>
                <div class="stat-box">
                    <strong><?= (int) $dbStats['brands'] ?></strong>
                    <span>برند معتبر</span>
                </div>
                <div class="stat-box">
                    <strong><?= (int) $dbStats['coupons'] ?></strong>
                    <span>کد تخفیف فعال</span>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>
                <span>۲. تنظیم شماره موبایل مدیر کل و مشخصات فروشگاه</span>
                <?php if ($isInstalled): ?>
                    <span class="check-status status-ok">✓ نصب و پیکربندی شده</span>
                <?php endif; ?>
            </h2>
            <form method="post" action="install.php">
                <input type="hidden" name="form_action" value="save_setup" />
                <div class="form-grid">
                    <div class="form-group">
                        <label for="store_name">نام فروشگاه</label>
                        <input type="text" id="store_name" name="store_name" value="<?= htmlspecialchars($dbStats['store_name'], ENT_QUOTES, 'UTF-8') ?>" required />
                    </div>
                    <div class="form-group">
                        <label for="admin_name">نام و نام خانوادگی مدیر کل</label>
                        <input type="text" id="admin_name" name="admin_name" value="<?= htmlspecialchars($dbStats['admin_name'], ENT_QUOTES, 'UTF-8') ?>" required />
                    </div>
                    <div class="form-group">
                        <label for="admin_phone">شماره موبایل مدیر کل (برای ورود به پنل /admin)</label>
                        <input type="text" id="admin_phone" name="admin_phone" class="ltr-input" value="<?= htmlspecialchars($dbStats['admin_phone'], ENT_QUOTES, 'UTF-8') ?>" placeholder="09120000000" required />
                        <span class="hint">در صفحه ورود (/login) با این شماره وارد شوید تا به پنل مدیریت دسترسی کامل داشته باشید.</span>
                    </div>
                    <div class="form-group">
                        <label for="phone">تلفن پشتیبانی فروشگاه</label>
                        <input type="text" id="phone" name="phone" value="<?= htmlspecialchars($dbStats['phone'], ENT_QUOTES, 'UTF-8') ?>" />
                    </div>
                    <div class="form-group full">
                        <label for="address">آدرس پستی فروشگاه</label>
                        <input type="text" id="address" name="address" value="<?= htmlspecialchars($dbStats['address'], ENT_QUOTES, 'UTF-8') ?>" />
                    </div>
                    <div class="form-group">
                        <label for="zarinpal_merchant">مرچنت کد زرین‌پال (اختیاری)</label>
                        <input type="text" id="zarinpal_merchant" name="zarinpal_merchant" class="ltr-input" value="<?= htmlspecialchars($dbStats['zarinpal_merchant'], ENT_QUOTES, 'UTF-8') ?>" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                        <span class="hint">در صورت خالی بودن، درگاه آزمایشی (دمو) به صورت خودکار فعال است.</span>
                    </div>
                    <div class="form-group">
                        <label for="sms_api_key">کلید API پنل پیامک (اختیاری)</label>
                        <input type="text" id="sms_api_key" name="sms_api_key" class="ltr-input" value="<?= htmlspecialchars($dbStats['sms_api_key'], ENT_QUOTES, 'UTF-8') ?>" placeholder="SMS_API_KEY" />
                        <span class="hint">در حالت آزمایشی، کد تأیید ۵ رقمی مستقیماً روی صفحه ورود نمایش داده می‌شود.</span>
                    </div>
                </div>

                <div class="btn-row">
                    <button type="submit" class="btn btn-primary">ذخیره تنظیمات و تکمیل نصب در SQLite</button>
                    <a href="/" class="btn btn-outline">مشاهده صفحه اصلی فروشگاه</a>
                    <a href="/login" class="btn btn-outline">ورود به حساب مدیریت (/login)</a>
                </div>
            </form>
        </div>

        <div class="card">
            <h2>
                <span>۳. امنیت پس از نصب (حذف اسکریپت نصب‌کننده)</span>
            </h2>
            <p style="font-size: 13.5px; color: var(--muted); margin-bottom: 14px;">
                پس از اینکه شماره موبایل مدیر کل و نام فروشگاه خود را ذخیره کردید، برای جلوگیری از دسترسی سایر افراد به این صفحه، روی دکمه زیر کلیک کنید تا فایل <code>install.php</code> به صورت خودکار از روی هاست شما پاک شود (سایت بدون این فایل کاملاً کار می‌کند).
            </p>
            <form method="post" action="install.php?action=delete_installer" onsubmit="return confirm('آیا از حذف فایل install.php پس از اتمام نصب اطمینان دارید؟');">
                <button type="submit" class="btn btn-danger">حذف امن فایل install.php و ورود به سایت</button>
            </form>
        </div>
    </div>
</body>
</html>
