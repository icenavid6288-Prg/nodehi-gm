<?php
/**
 * اسکریپت نصب گرافیکی و بررسی سلامت هاست سی‌پنل پارس‌پک (بدون نیاز به SSH و ترمینال)
 * ویژه فروشگاه اینترنتی نودهی — نسخه React + TypeScript و Laravel (دیتابیس سندگرای MongoDB / NoSQL)
 *
 * نحوه استفاده:
 * کافیست بعد از آپلود فایل‌ها در public_html، آدرس زیر را در مرورگر باز کنید:
 * https://your-domain.ir/install.php
 */

declare(strict_types=1);

header('Content-Type: text/html; charset=utf-8');

$servicePaths = [
    __DIR__ . '/../backend/app/Services/MongoDocumentStore.php',
    __DIR__ . '/backend/app/Services/MongoDocumentStore.php',
    dirname(__DIR__) . '/app/Services/MongoDocumentStore.php',
    __DIR__ . '/MongoDocumentStore.php',
];

foreach ($servicePaths as $sp) {
    if (file_exists($sp)) {
        require_once $sp;
        break;
    }
}

$candidateMongoDirs = [
    __DIR__ . '/database/mongodb',
    __DIR__ . '/../backend/database/mongodb',
    __DIR__ . '/backend/database/mongodb',
    dirname(__DIR__) . '/database/mongodb',
];

$activeMongoDirs = [];
foreach ($candidateMongoDirs as $dir) {
    if (is_dir($dir)) {
        @chmod($dir, 0755);
        $rp = realpath($dir) ?: $dir;
        if (!in_array($rp, $activeMongoDirs, true)) {
            $activeMongoDirs[] = $rp;
        }
    }
}

$primaryMongoDir = $activeMongoDirs[0] ?? (__DIR__ . '/database/mongodb');
if (!is_dir($primaryMongoDir)) {
    @mkdir($primaryMongoDir, 0755, true);
    $activeMongoDirs[] = $primaryMongoDir;
}

$lockFile = $primaryMongoDir . '/installed.lock';
$message = null;
$error = null;

if (($_GET['action'] ?? '') === 'delete_installer' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    @file_put_contents($lockFile, date('c'));
    if (@unlink(__FILE__)) {
        header('Location: /?installed=1');
        exit;
    } else {
        $error = 'حذف خودکار فایل install.php توسط محدودیت دسترسی هاست انجام نشد. لطفاً از طریق File Manager سی‌پنل فایل install.php را حذف نمایید.';
    }
}

$store = class_exists('\App\Services\MongoDocumentStore')
    ? new \App\Services\MongoDocumentStore($primaryMongoDir)
    : null;

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
    'mongodb_uri' => 'mongodb://127.0.0.1:27017/nodehi_store',
    'zarinpal_merchant' => '',
    'sms_api_key' => '',
];

try {
    if ($store) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['form_action'] ?? '') === 'save_setup') {
            $storeName = trim((string) ($_POST['store_name'] ?? 'فروشگاه لوازم خانگی نودهی'));
            $adminName = trim((string) ($_POST['admin_name'] ?? 'مدیر فروشگاه نودهی'));
            $adminPhone = preg_replace('/[^0-9]/', '', (string) ($_POST['admin_phone'] ?? '09120000000'));
            $supportPhone = trim((string) ($_POST['phone'] ?? '۰۲۱-۹۱۰۰۰۰۰۰'));
            $address = trim((string) ($_POST['address'] ?? ''));
            $mongoUri = trim((string) ($_POST['mongodb_uri'] ?? ''));
            $zarinpalMerchant = trim((string) ($_POST['zarinpal_merchant'] ?? ''));
            $smsApiKey = trim((string) ($_POST['sms_api_key'] ?? ''));

            if (!preg_match('/^09[0-9]{9}$/', $adminPhone)) {
                $error = 'شماره موبایل مدیر باید ۱۱ رقم و با 09 شروع شود (مثال: 09120000000).';
            } else {
                foreach ($activeMongoDirs as $targetDir) {
                    $targetStore = new \App\Services\MongoDocumentStore($targetDir);
                    $adminDoc = $targetStore->findOne('users', ['role' => 'SUPER_ADMIN']);
                    if ($adminDoc) {
                        $targetStore->updateOne('users', ['id' => $adminDoc['id']], [
                            '$set' => ['name' => $adminName, 'phone' => $adminPhone],
                        ]);
                    } else {
                        $targetStore->insertOne('users', [
                            'name' => $adminName,
                            'phone' => $adminPhone,
                            'email' => 'admin@nodehi.ir',
                            'role' => 'SUPER_ADMIN',
                            'phone_verified_at' => date('Y-m-d H:i:s'),
                        ]);
                    }

                    $settingsToSave = [
                        ['store_name', $storeName, 'general', true],
                        ['phone', $supportPhone, 'general', true],
                        ['mobile', $adminPhone, 'general', true],
                        ['address', $address, 'general', true],
                        ['mongodb_uri', $mongoUri, 'database', false],
                        ['zarinpal_merchant', $zarinpalMerchant, 'payment', false],
                        ['sms_api_key', $smsApiKey, 'sms', false],
                    ];

                    foreach ($settingsToSave as [$sKey, $sVal, $sGroup, $sPub]) {
                        $targetStore->updateOne('settings', ['key' => $sKey], [
                            '$set' => [
                                'key' => $sKey,
                                'value' => $sVal,
                                'group' => $sGroup,
                                'is_public' => $sPub,
                            ],
                        ], true);
                    }
                }

                @file_put_contents($lockFile, date('c'));
                $message = 'تنظیمات فروشگاه و حساب مدیر کل با موفقیت در کالکشن‌های دیتابیس MongoDB / NoSQL ذخیره شد!';
            }
        }

        $dbStats['products'] = $store->countDocuments('products');
        $dbStats['categories'] = $store->countDocuments('categories');
        $dbStats['brands'] = $store->countDocuments('brands');
        $dbStats['coupons'] = $store->countDocuments('coupons');

        $adminDoc = $store->findOne('users', ['role' => 'SUPER_ADMIN']);
        if ($adminDoc) {
            $dbStats['admin_name'] = (string) ($adminDoc['name'] ?? $dbStats['admin_name']);
            $dbStats['admin_phone'] = (string) ($adminDoc['phone'] ?? $dbStats['admin_phone']);
        }

        foreach ($store->readCollection('settings') as $sr) {
            $k = (string) ($sr['key'] ?? '');
            if ($k !== '' && array_key_exists($k, $dbStats)) {
                $dbStats[$k] = (string) ($sr['value'] ?? '');
            }
        }
    }
} catch (\Throwable $e) {
    $error = 'خطا در ارتباط با دیتابیس سندگرای MongoDB: ' . $e->getMessage();
}

$checks = [
    [
        'title' => 'نسخه PHP سرور (حداقل 8.1)',
        'ok' => version_compare(PHP_VERSION, '8.1.0', '>='),
        'detail' => 'PHP ' . PHP_VERSION,
    ],
    [
        'title' => 'موتور دیتابیس سندگرای MongoDB / NoSQL Document Store',
        'ok' => $store !== null,
        'detail' => extension_loaded('mongodb')
            ? 'درایور رسمی MongoDB + مخزن اسناد NoSQL فعال'
            : 'موتور توکار اسناد MongoDB / NoSQL فعال (بدون نیاز به نصب در ترمینال)',
    ],
    [
        'title' => 'اکستنشن‌های JSON و MBString',
        'ok' => extension_loaded('json') && extension_loaded('mbstring'),
        'detail' => 'فعال و آماده پردازش اسناد BSON/JSON فارسی',
    ],
    [
        'title' => 'دسترسی نوشتن پوشه کالکشن‌های دیتابیس (database/mongodb)',
        'ok' => is_dir($primaryMongoDir) && is_writable($primaryMongoDir),
        'detail' => is_writable($primaryMongoDir) ? 'قابل نوشتن (chmod 0755)' : 'غیرقابل نوشتن — دسترسی پوشه database/mongodb را روی 755 بگذارید',
    ],
    [
        'title' => 'کالکشن‌های آماده محصولات و تنظیمات (products.json و ...)',
        'ok' => $dbStats['products'] > 0,
        'detail' => sprintf('%d سند محصول، %d دسته‌بندی، %d برند با ObjectId آماده', $dbStats['products'], $dbStats['categories'], $dbStats['brands']),
    ],
    [
        'title' => 'فایل مسیریابی آپاچی (.htaccess)',
        'ok' => file_exists(__DIR__ . '/.htaccess'),
        'detail' => file_exists(__DIR__ . '/.htaccess') ? 'موجود در public_html' : 'فایل .htaccess یافت نشد',
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
    <title>نصب‌کننده خودکار فروشگاه نودهی | React + TypeScript & Laravel (MongoDB / NoSQL)</title>
    <style>
        :root {
            --bg: #f8fafc;
            --card: #ffffff;
            --border: #e2e8f0;
            --text: #0f172a;
            --muted: #475569;
            --primary: #0f2a43;
            --primary-hover: #12b5a5;
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
        .container { max-width: 780px; margin: 0 auto; }
        .header-card {
            background: linear-gradient(135deg, #0f2a43 0%, #12b5a5 100%);
            color: #fff;
            border-radius: 20px;
            padding: 28px 32px;
            margin-bottom: 24px;
            box-shadow: 0 12px 30px -10px rgba(15, 42, 67, 0.25);
        }
        .badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.18);
            color: #ffffff;
            font-size: 12px;
            font-weight: bold;
            padding: 4px 12px;
            border-radius: 999px;
            margin-bottom: 10px;
        }
        .header-card h1 { font-size: 21px; margin-bottom: 8px; }
        .header-card p { color: #e2e8f0; font-size: 13.5px; }
        .card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 18px;
            padding: 24px 28px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
        }
        .card h2 {
            font-size: 16.5px;
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
        .alert-success { background: var(--success-bg); color: var(--success); border: 1px solid #a7f3d0; }
        .alert-error { background: var(--danger-bg); color: var(--danger); border: 1px solid #fecaca; }
        .check-list { list-style: none; display: grid; gap: 10px; }
        .check-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 11px 16px;
            border-radius: 12px;
            background: #f8fafc;
            border: 1px solid var(--border);
            font-size: 13px;
        }
        .check-status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-weight: bold;
            font-size: 12px;
            padding: 3px 10px;
            border-radius: 999px;
        }
        .status-ok { background: var(--success-bg); color: var(--success); }
        .status-fail { background: var(--danger-bg); color: var(--danger); }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full { grid-column: 1 / -1; }
        label { font-size: 13px; font-weight: bold; color: var(--text); }
        input[type="text"] {
            width: 100%;
            padding: 11px 14px;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            font-family: inherit;
            font-size: 14px;
            color: var(--text);
            background: #fff;
        }
        .ltr-input { direction: ltr; text-align: left; font-family: monospace; }
        .hint { font-size: 11.5px; color: var(--muted); }
        .btn-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 22px; }
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
        }
        .btn-primary { background: var(--primary); color: #fff; }
        .btn-outline { background: #fff; color: var(--text); border: 1px solid #cbd5e1; }
        .btn-danger { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
        .stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 16px; }
        @media (max-width: 640px) { .stats-bar { grid-template-columns: repeat(2, 1fr); } }
        .stat-box {
            background: #f8fafc;
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 12px;
            text-align: center;
        }
        .stat-box strong { display: block; font-size: 20px; color: var(--primary); }
        .stat-box span { font-size: 12px; color: var(--muted); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header-card">
            <span class="badge">React + TypeScript & Laravel 12 • دیتابیس سندگرای MongoDB / NoSQL بدون نیاز به ترمینال</span>
            <h1>نصب‌کننده گرافیکی فروشگاه نودهی (نسخه خالص React و Laravel)</h1>
            <p>
                این پروژه کاملاً بدون Next.js و بدون Prisma طراحی شده است و با دیتابیس سندگرای MongoDB / NoSQL Document Store کار می‌کند تا روی هاست سی‌پنل پارس‌پک بدون هیچ نیازی به SSH یا ترمینال اجرا شود.
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
                <span>۱. بررسی خودکار کالکشن‌های دیتابیس MongoDB / NoSQL</span>
                <span class="check-status <?= $allChecksPassed ? 'status-ok' : 'status-fail' ?>">
                    <?= $allChecksPassed ? '✓ آماده بهره‌برداری' : 'نیاز به بررسی' ?>
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
                    <span>سند محصول (Products)</span>
                </div>
                <div class="stat-box">
                    <strong><?= (int) $dbStats['categories'] ?></strong>
                    <span>سند دسته‌بندی</span>
                </div>
                <div class="stat-box">
                    <strong><?= (int) $dbStats['brands'] ?></strong>
                    <span>سند برند</span>
                </div>
                <div class="stat-box">
                    <strong><?= (int) $dbStats['coupons'] ?></strong>
                    <span>کد تخفیف فعال</span>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>
                <span>۲. تنظیم شماره موبایل مدیر کل و اتصال MongoDB</span>
                <?php if ($isInstalled): ?>
                    <span class="check-status status-ok">✓ پیکربندی شده</span>
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
                        <span class="hint">در صفحه ورود (/login) با این شماره وارد شوید تا به پنل مدیریت و استودیو طراحی دسترسی داشته باشید.</span>
                    </div>
                    <div class="form-group">
                        <label for="phone">تلفن پشتیبانی فروشگاه</label>
                        <input type="text" id="phone" name="phone" value="<?= htmlspecialchars($dbStats['phone'], ENT_QUOTES, 'UTF-8') ?>" />
                    </div>
                    <div class="form-group full">
                        <label for="mongodb_uri">رشته اتصال سرور MongoDB خارجی (اختیاری — پیش‌فرض: موتور سندگرای توکار بدون نیاز به ترمینال)</label>
                        <input type="text" id="mongodb_uri" name="mongodb_uri" class="ltr-input" value="<?= htmlspecialchars($dbStats['mongodb_uri'], ENT_QUOTES, 'UTF-8') ?>" placeholder="mongodb://127.0.0.1:27017/nodehi_store" />
                        <span class="hint">روی هاست اشتراکی سی‌پنل که دسترسی ترمینال ندارد، موتور سندگرای توکار (database/mongodb/*.json) به صورت خودکار فعال است.</span>
                    </div>
                    <div class="form-group full">
                        <label for="address">آدرس پستی فروشگاه</label>
                        <input type="text" id="address" name="address" value="<?= htmlspecialchars($dbStats['address'], ENT_QUOTES, 'UTF-8') ?>" />
                    </div>
                </div>

                <div class="btn-row">
                    <button type="submit" class="btn btn-primary">ذخیره تنظیمات در دیتابیس MongoDB</button>
                    <a href="/" class="btn btn-outline">مشاهده صفحه اصلی فروشگاه</a>
                    <a href="/login" class="btn btn-outline">ورود به حساب مدیریت (/login)</a>
                </div>
            </form>
        </div>

        <div class="card">
            <h2><span>۳. امنیت پس از نصب (حذف install.php)</span></h2>
            <form method="post" action="install.php?action=delete_installer" onsubmit="return confirm('آیا از حذف فایل install.php پس از اتمام نصب اطمینان دارید؟');">
                <button type="submit" class="btn btn-danger">حذف امن فایل install.php و ورود به سایت</button>
            </form>
        </div>
    </div>
</body>
</html>
