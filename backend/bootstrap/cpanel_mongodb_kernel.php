<?php
/**
 * هستهٔ اجرای بک‌اند Laravel ۱۲ با دیتابیس سندگرای MongoDB / NoSQL Document Store
 * ویژه هاست اشتراکی سی‌پنل پارس‌پک (بدون نیاز به دسترسی SSH، ترمینال یا نصب پکیج)
 */

declare(strict_types=1);

namespace Nodehi\CpanelMongoKernel;

require_once __DIR__ . '/../app/Services/MongoDocumentStore.php';

use App\Services\MongoDocumentStore;
use Throwable;

class Kernel
{
    private MongoDocumentStore $store;
    private string $publicDir;

    public function __construct(string $publicDir)
    {
        $this->publicDir = rtrim($publicDir, '/\\');

        $candidateDirs = [
            $this->publicDir . '/../backend/database/mongodb',
            $this->publicDir . '/backend/database/mongodb',
            $this->publicDir . '/database/mongodb',
            dirname(__DIR__) . '/database/mongodb',
        ];

        $mongoDir = null;
        foreach ($candidateDirs as $dir) {
            if (is_dir($dir) && file_exists($dir . '/products.json')) {
                $mongoDir = $dir;
                break;
            }
        }

        if (!$mongoDir) {
            $mongoDir = is_dir($this->publicDir . '/../backend/database')
                ? $this->publicDir . '/../backend/database/mongodb'
                : $this->publicDir . '/database/mongodb';
            if (!is_dir($mongoDir)) {
                @mkdir($mongoDir, 0755, true);
            }
        }

        $this->store = new MongoDocumentStore($mongoDir);
    }

    public function getStore(): MongoDocumentStore
    {
        return $this->store;
    }

    public function handle(): void
    {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

        if ($method === 'OPTIONS') {
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept');
            http_response_code(204);
            exit;
        }

        if (strpos($uri, '/api/') === 0 || $uri === '/api') {
            $this->handleApi($method, $uri);
            return;
        }

        $indexHtml = $this->publicDir . '/index.html';
        if (file_exists($indexHtml)) {
            header('Content-Type: text/html; charset=utf-8');
            readfile($indexHtml);
            exit;
        }

        $this->json([
            'name' => 'Nodehi Store API (Laravel + MongoDB NoSQL Document Store)',
            'status' => 'running',
        ]);
    }

    private function handleApi(string $method, string $uri): void
    {
        $path = '/' . trim(substr($uri, 4), '/');
        $body = $this->getJsonBody();

        try {
            // 1. Health
            if ($method === 'GET' && $path === '/health') {
                $products = $this->store->readCollection('products');
                $activeCount = count(array_filter($products, fn($p) => !empty($p['is_active'])));
                $this->json([
                    'ok' => true,
                    'status' => 'healthy',
                    'service' => 'Nodehi Laravel 12 Backend (MongoDB / NoSQL Document Store)',
                    'version' => '1.0.0',
                    'php' => PHP_VERSION,
                    'database' => $this->store->getDriverMode(),
                    'catalogSize' => $activeCount,
                    'timestamp' => date('c'),
                ]);
            }

            // 2. Install status & setup
            if ($path === '/install') {
                $products = $this->store->readCollection('products');
                $users = $this->store->readCollection('users');
                $adminUser = null;
                foreach ($users as $u) {
                    if (($u['role'] ?? '') === 'SUPER_ADMIN' || ($u['role'] ?? '') === 'ADMIN') {
                        $adminUser = $u;
                        break;
                    }
                }
                if ($method === 'GET') {
                    $this->json([
                        'ok' => true,
                        'installed' => count($products) > 0 && $adminUser !== null,
                        'databaseConfigured' => true,
                        'databaseEngine' => 'MongoDB / NoSQL Document Store',
                        'adminExists' => $adminUser !== null,
                        'catalogSeeded' => count($products) > 0,
                        'adminPhone' => $adminUser['phone'] ?? '09120000000',
                        'catalogSize' => count($products),
                        'installerScript' => '/install.php',
                    ]);
                }
                if ($method === 'POST') {
                    $adminPhone = preg_replace('/[^0-9]/', '', (string) ($body['adminPhone'] ?? $body['phone'] ?? '09120000000'));
                    $adminName = trim((string) ($body['adminName'] ?? $body['name'] ?? 'مدیر فروشگاه نودهی'));
                    $storeName = trim((string) ($body['storeName'] ?? ''));

                    if (!preg_match('/^09[0-9]{9}$/', $adminPhone)) {
                        $this->json(['ok' => false, 'error' => ['code' => 'invalid_phone', 'message' => 'شماره موبایل مدیر باید ۱۱ رقم و با 09 شروع شود.']], 422);
                    }

                    if ($adminUser) {
                        $this->store->updateOne('users', ['id' => $adminUser['id']], [
                            '$set' => ['name' => $adminName, 'phone' => $adminPhone],
                        ]);
                    } else {
                        $this->store->insertOne('users', [
                            'name' => $adminName,
                            'phone' => $adminPhone,
                            'email' => 'admin@nodehi.ir',
                            'role' => 'SUPER_ADMIN',
                            'phone_verified_at' => date('Y-m-d H:i:s'),
                        ]);
                    }

                    if ($storeName !== '') {
                        $this->store->updateOne('settings', ['key' => 'store_name'], [
                            '$set' => ['value' => $storeName, 'group' => 'general', 'is_public' => true],
                        ], true);
                    }

                    $this->json([
                        'ok' => true,
                        'installed' => true,
                        'adminPhone' => $adminPhone,
                        'message' => 'مشخصات مدیر کل و تنظیمات اولیه با موفقیت در دیتابیس MongoDB ذخیره شد.',
                    ]);
                }
            }

            // 3. Public settings
            if ($method === 'GET' && $path === '/settings/public') {
                $rows = $this->store->readCollection('settings');
                $map = [];
                foreach ($rows as $r) {
                    if (!empty($r['is_public']) || !isset($r['is_public'])) {
                        $map[$r['key']] = $r['value'];
                    }
                }
                $this->json([
                    'ok' => true,
                    'settings' => [
                        'store_name' => $map['store_name'] ?? 'فروشگاه لوازم خانگی نودهی',
                        'brand_name' => $map['brand_name'] ?? 'نودهی',
                        'tagline' => $map['tagline'] ?? 'لوازم خانگی اصیل',
                        'logo_url' => $map['logo_url'] ?? '',
                        'primary_color' => $map['primary_color'] ?? '#0F2A43',
                        'secondary_color' => $map['secondary_color'] ?? '#12B5A5',
                        'accent_color' => $map['accent_color'] ?? '#FF6B35',
                        'hero_slides' => $map['hero_slides'] ?? '',
                        'phone' => $map['phone'] ?? '۰۲۱-۹۱۰۰۰۰۰۰',
                        'mobile' => $map['mobile'] ?? '۰۹۱۲۰۰۰۰۰۰۰',
                        'email' => $map['email'] ?? 'info@nodehi.ir',
                        'address' => $map['address'] ?? 'تهران، خیابان ولیعصر، پلاک ۱۲۳، طبقه سوم',
                        'free_shipping_threshold' => (int) ($map['free_shipping_threshold'] ?? 5000000),
                        'working_hours' => $map['working_hours'] ?? 'شنبه تا پنجشنبه، ۹ صبح تا ۹ شب',
                    ],
                ]);
            }

            // 4. Payment methods
            if ($method === 'GET' && $path === '/payments/methods') {
                $methods = array_values(array_filter(
                    $this->store->readCollection('payment_gateways'),
                    fn($m) => !empty($m['is_active'])
                ));
                if (empty($methods)) {
                    $methods = [
                        ['id' => 'zarinpal', 'name' => 'zarinpal', 'title' => 'پرداخت آنلاین زرین‌پال (کلیه کارت‌های شتاب)', 'driver' => 'zarinpal'],
                        ['id' => 'snappay', 'name' => 'snappay', 'title' => 'پرداخت اقساطی اسنپ‌پی (۴ قسط ماهانه بدون بهره)', 'driver' => 'snappay'],
                        ['id' => 'card_to_card', 'name' => 'card_to_card', 'title' => 'کارت به کارت با تأیید فیش', 'driver' => 'offline'],
                    ];
                }
                $this->json(['ok' => true, 'methods' => $methods]);
            }

            // 5. Categories
            if ($method === 'GET' && $path === '/categories') {
                $categories = $this->store->readCollection('categories');
                $products = $this->store->readCollection('products');
                foreach ($categories as &$cat) {
                    $cat['products_count'] = count(array_filter(
                        $products,
                        fn($p) => !empty($p['is_active']) && ((int) ($p['category_id'] ?? 0) === (int) $cat['id'] || ($p['category_slug'] ?? '') === $cat['slug'])
                    ));
                }
                $this->json(['ok' => true, 'categories' => $categories]);
            }

            if ($method === 'GET' && preg_match('#^/categories/([^/]+)$#', $path, $m)) {
                $slug = urldecode($m[1]);
                $cat = $this->store->findOne('categories', ['slug' => $slug]);
                if (!$cat) {
                    $this->json(['ok' => false, 'error' => ['code' => 'not_found', 'message' => 'دسته‌بندی یافت نشد']], 404);
                }
                $this->json(['ok' => true, 'category' => $cat]);
            }

            // 6. Brands
            if ($method === 'GET' && $path === '/brands') {
                $brands = $this->store->readCollection('brands');
                $products = $this->store->readCollection('products');
                foreach ($brands as &$b) {
                    $b['products_count'] = count(array_filter(
                        $products,
                        fn($p) => !empty($p['is_active']) && ((int) ($p['brand_id'] ?? 0) === (int) $b['id'] || ($p['brand_slug'] ?? '') === $b['slug'])
                    ));
                }
                $this->json(['ok' => true, 'brands' => $brands]);
            }

            if ($method === 'GET' && preg_match('#^/brands/([^/]+)$#', $path, $m)) {
                $slug = urldecode($m[1]);
                $brand = $this->store->findOne('brands', ['slug' => $slug]);
                if (!$brand) {
                    $this->json(['ok' => false, 'error' => ['code' => 'not_found', 'message' => 'برند یافت نشد']], 404);
                }
                $this->json(['ok' => true, 'brand' => $brand]);
            }

            // 7. Products list
            if ($method === 'GET' && $path === '/products') {
                $products = $this->enrichProducts($this->store->readCollection('products'));
                $q = trim((string) ($_GET['q'] ?? ''));
                $catSlug = trim((string) ($_GET['category'] ?? ''));
                $brandSlug = trim((string) ($_GET['brand'] ?? ''));
                $sort = trim((string) ($_GET['sort'] ?? 'newest'));
                $minPrice = isset($_GET['minPrice']) && $_GET['minPrice'] !== '' ? (int) $_GET['minPrice'] : null;
                $maxPrice = isset($_GET['maxPrice']) && $_GET['maxPrice'] !== '' ? (int) $_GET['maxPrice'] : null;
                $inverter = ($_GET['inverter'] ?? '') === '1';
                $installment = ($_GET['installment'] ?? '') === '1';
                $ready = ($_GET['ready'] ?? '') === '1';
                $instock = ($_GET['instock'] ?? '') === '1';
                $discounted = ($_GET['discounted'] ?? '') === '1';

                $filtered = array_values(array_filter($products, function (array $p) use (
                    $q, $catSlug, $brandSlug, $minPrice, $maxPrice, $inverter, $installment, $ready, $instock, $discounted
                ) {
                    if (empty($p['is_active'])) return false;
                    if ($q !== '') {
                        $hay = mb_strtolower(($p['name'] ?? '') . ' ' . ($p['name_en'] ?? '') . ' ' . ($p['short_description'] ?? '') . ' ' . ($p['brand']['name_fa'] ?? ''));
                        if (mb_strpos($hay, mb_strtolower($q)) === false) return false;
                    }
                    if ($catSlug !== '' && ($p['category']['slug'] ?? '') !== $catSlug) return false;
                    if ($brandSlug !== '' && ($p['brand']['slug'] ?? '') !== $brandSlug) return false;
                    if ($minPrice !== null && (int) $p['price'] < $minPrice) return false;
                    if ($maxPrice !== null && (int) $p['price'] > $maxPrice) return false;
                    if ($inverter && empty($p['is_inverter'])) return false;
                    if ($installment && empty($p['has_installment'])) return false;
                    if ($ready && empty($p['is_ready_to_ship'])) return false;
                    if ($instock && (int) ($p['stock'] ?? 0) <= 0) return false;
                    if ($discounted && (empty($p['compare_price']) || (int) $p['compare_price'] <= (int) $p['price'])) return false;
                    return true;
                }));

                usort($filtered, function (array $a, array $b) use ($sort) {
                    if ($sort === 'price-asc') return ((int) $a['price']) <=> ((int) $b['price']);
                    if ($sort === 'price-desc') return ((int) $b['price']) <=> ((int) $a['price']);
                    if ($sort === 'popular') return ((int) ($b['sales_count'] ?? 0)) <=> ((int) ($a['sales_count'] ?? 0));
                    if ($sort === 'rating') return ((float) ($b['rating_cache'] ?? 0)) <=> ((float) ($a['rating_cache'] ?? 0));
                    return ((int) $b['id']) <=> ((int) $a['id']);
                });

                $page = max(1, (int) ($_GET['page'] ?? 1));
                $perPage = max(1, min(48, (int) ($_GET['perPage'] ?? 12)));
                $total = count($filtered);
                $lastPage = max(1, (int) ceil($total / $perPage));
                $paged = array_slice($filtered, ($page - 1) * $perPage, $perPage);

                $this->json([
                    'ok' => true,
                    'products' => $paged,
                    'pagination' => [
                        'total' => $total,
                        'page' => $page,
                        'perPage' => $perPage,
                        'lastPage' => $lastPage,
                    ],
                ]);
            }

            // 8. Product detail
            if ($method === 'GET' && preg_match('#^/products/([^/]+)$#', $path, $m)) {
                $slug = urldecode($m[1]);
                $products = $this->enrichProducts($this->store->readCollection('products'));
                $product = null;
                foreach ($products as $p) {
                    if ($p['slug'] === $slug || (string) $p['id'] === $slug) {
                        $product = $p;
                        break;
                    }
                }
                if (!$product) {
                    $this->json(['ok' => false, 'error' => ['code' => 'not_found', 'message' => 'محصول یافت نشد']], 404);
                }
                $related = array_slice(array_values(array_filter(
                    $products,
                    fn($p) => $p['id'] !== $product['id'] && ($p['category_id'] ?? 0) === ($product['category_id'] ?? -1)
                )), 0, 4);
                $reviews = array_values(array_filter(
                    $this->store->readCollection('reviews'),
                    fn($r) => (int) ($r['product_id'] ?? 0) === (int) $product['id'] && ($r['status'] ?? 'APPROVED') === 'APPROVED'
                ));
                $this->json([
                    'ok' => true,
                    'product' => $product,
                    'related' => $related,
                    'reviews' => $reviews,
                ]);
            }

            // 9. Submit product review
            if ($method === 'POST' && preg_match('#^/products/([^/]+)/reviews$#', $path, $m)) {
                $slug = urldecode($m[1]);
                $product = $this->store->findOne('products', ['slug' => $slug]);
                if (!$product) {
                    $this->json(['ok' => false, 'error' => ['message' => 'محصول یافت نشد']], 404);
                }
                $review = $this->store->insertOne('reviews', [
                    'product_id' => (int) $product['id'],
                    'author_name' => trim((string) ($body['author_name'] ?? 'کاربر نودهی')),
                    'rating' => max(1, min(5, (int) ($body['rating'] ?? 5))),
                    'title' => trim((string) ($body['title'] ?? '')),
                    'comment' => trim((string) ($body['comment'] ?? '')),
                    'status' => 'APPROVED',
                    'is_verified_purchase' => true,
                ]);
                $this->json(['ok' => true, 'message' => 'دیدگاه شما با موفقیت ثبت شد.', 'review' => $review]);
            }

            // 10. Search
            if ($method === 'GET' && $path === '/search') {
                $q = mb_strtolower(trim((string) ($_GET['q'] ?? '')));
                $products = $this->enrichProducts($this->store->readCollection('products'));
                $matchedProducts = $q === '' ? [] : array_slice(array_values(array_filter(
                    $products,
                    fn($p) => mb_strpos(mb_strtolower(($p['name'] ?? '') . ' ' . ($p['name_en'] ?? '')), $q) !== false
                )), 0, 8);
                $categories = array_values(array_filter(
                    $this->store->readCollection('categories'),
                    fn($c) => $q !== '' && mb_strpos(mb_strtolower(($c['name_fa'] ?? '') . ' ' . ($c['name'] ?? '')), $q) !== false
                ));
                $brands = array_values(array_filter(
                    $this->store->readCollection('brands'),
                    fn($b) => $q !== '' && mb_strpos(mb_strtolower(($b['name_fa'] ?? '') . ' ' . ($b['name'] ?? '')), $q) !== false
                ));
                $this->json(['ok' => true, 'products' => $matchedProducts, 'categories' => $categories, 'brands' => $brands]);
            }

            // 11. Validate Coupon & Checkout
            if ($method === 'POST' && $path === '/checkout/validate-coupon') {
                $code = strtoupper(trim((string) ($body['code'] ?? '')));
                $subtotal = (int) ($body['subtotal'] ?? 0);
                $coupon = $this->store->findOne('coupons', ['code' => $code]);
                if (!$coupon || empty($coupon['is_active'])) {
                    $this->json(['ok' => false, 'error' => ['message' => 'کد تخفیف معتبر نیست یا منقضی شده است.']], 422);
                }
                if (!empty($coupon['min_order_amount']) && $subtotal < (int) $coupon['min_order_amount']) {
                    $this->json(['ok' => false, 'error' => ['message' => 'حداقل مبلغ سفارش برای این کد تخفیف رعایت نشده است.']], 422);
                }
                $discount = ($coupon['type'] ?? 'PERCENT') === 'PERCENT'
                    ? (int) round(($subtotal * (int) $coupon['value']) / 100)
                    : (int) $coupon['value'];
                if (!empty($coupon['max_discount_amount'])) {
                    $discount = min($discount, (int) $coupon['max_discount_amount']);
                }
                $this->json(['ok' => true, 'discount' => $discount, 'coupon' => $coupon]);
            }

            if ($method === 'POST' && $path === '/checkout') {
                $items = is_array($body['items'] ?? null) ? $body['items'] : [];
                if (empty($items)) {
                    $this->json(['ok' => false, 'error' => ['message' => 'سبد خرید خالی است.']], 422);
                }
                $subtotal = 0;
                $orderItems = [];
                foreach ($items as $it) {
                    $price = (int) ($it['price'] ?? 0);
                    $qty = max(1, (int) ($it['quantity'] ?? 1));
                    $lineTotal = $price * $qty;
                    $subtotal += $lineTotal;
                    $orderItems[] = [
                        'product_id' => $it['product_id'] ?? ($it['id'] ?? null),
                        'product_name' => $it['name'] ?? 'کالای نودهی',
                        'product_slug' => $it['slug'] ?? '',
                        'thumbnail' => $it['thumbnail'] ?? '/icon.svg',
                        'price' => $price,
                        'quantity' => $qty,
                        'total' => $lineTotal,
                        'color' => $it['color'] ?? null,
                    ];
                }
                $shippingCost = $subtotal >= 5000000 ? 0 : 150000;
                $discount = (int) ($body['discount'] ?? 0);
                $total = max(0, $subtotal - $discount + $shippingCost);
                $orderNumber = 'ORD-' . date('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));

                $user = $this->getAuthenticatedUser();
                $order = $this->store->insertOne('orders', [
                    'order_number' => $orderNumber,
                    'user_id' => $user['id'] ?? null,
                    'customer_name' => trim((string) ($body['customer_name'] ?? 'مشتری نودهی')),
                    'phone' => trim((string) ($body['phone'] ?? '')),
                    'province' => trim((string) ($body['province'] ?? 'تهران')),
                    'city' => trim((string) ($body['city'] ?? 'تهران')),
                    'address' => trim((string) ($body['address'] ?? '')),
                    'postal_code' => trim((string) ($body['postal_code'] ?? '')),
                    'subtotal' => $subtotal,
                    'discount' => $discount,
                    'shipping_cost' => $shippingCost,
                    'total' => $total,
                    'status' => 'PROCESSING',
                    'payment_status' => 'PAID',
                    'payment_method' => $body['payment_method'] ?? 'zarinpal',
                    'notes' => $body['notes'] ?? '',
                    'items' => $orderItems,
                ]);

                $this->json([
                    'ok' => true,
                    'order_number' => $orderNumber,
                    'total' => $total,
                    'order' => $order,
                    'payment_url' => '/track?order=' . urlencode($orderNumber) . '&phone=' . urlencode((string) ($body['phone'] ?? '')),
                ]);
            }

            if ($method === 'POST' && $path === '/orders/track') {
                $orderNumber = trim((string) ($body['order_number'] ?? ''));
                $phone = trim((string) ($body['phone'] ?? ''));
                $order = $this->store->findOne('orders', ['order_number' => $orderNumber]);
                if (!$order || ($phone !== '' && ($order['phone'] ?? '') !== $phone)) {
                    $this->json(['ok' => false, 'error' => ['message' => 'سفارشی با این مشخصات یافت نشد.']], 404);
                }
                $this->json(['ok' => true, 'order' => $order]);
            }

            // 12. Auth (OTP)
            if ($method === 'POST' && $path === '/auth/otp/request') {
                $phone = preg_replace('/[^0-9]/', '', (string) ($body['phone'] ?? ''));
                if (!preg_match('/^09[0-9]{9}$/', $phone)) {
                    $this->json(['ok' => false, 'error' => ['message' => 'شماره موبایل معتبر نیست.']], 422);
                }
                $code = '12345';
                $this->store->insertOne('otp_codes', [
                    'phone' => $phone,
                    'code' => $code,
                    'expires_at' => date('Y-m-d H:i:s', time() + 300),
                ]);
                $this->json([
                    'ok' => true,
                    'devCode' => $code,
                    'message' => 'کد تأیید ارسال شد (کد آزمایشی: 12345)',
                ]);
            }

            if ($method === 'POST' && $path === '/auth/otp/verify') {
                $phone = preg_replace('/[^0-9]/', '', (string) ($body['phone'] ?? ''));
                $code = trim((string) ($body['code'] ?? ''));
                if ($code === '') {
                    $this->json(['ok' => false, 'error' => ['message' => 'کد تأیید الزامی است.']], 422);
                }
                $user = $this->store->findOne('users', ['phone' => $phone]);
                if (!$user) {
                    $role = ($phone === '09120000000') ? 'SUPER_ADMIN' : 'USER';
                    $user = $this->store->insertOne('users', [
                        'name' => $role === 'SUPER_ADMIN' ? 'مدیر فروشگاه نودهی' : 'کاربر نودهی',
                        'phone' => $phone,
                        'role' => $role,
                        'phone_verified_at' => date('Y-m-d H:i:s'),
                    ]);
                }
                $token = bin2hex(random_bytes(24));
                $this->store->insertOne('auth_sessions', [
                    'user_id' => $user['id'],
                    'token' => $token,
                    'expires_at' => date('Y-m-d H:i:s', time() + 86400 * 30),
                ]);
                $this->json(['ok' => true, 'token' => $token, 'user' => $user]);
            }

            if ($method === 'GET' && $path === '/auth/session') {
                $user = $this->getAuthenticatedUser();
                $this->json(['ok' => true, 'user' => $user]);
            }

            if ($method === 'POST' && $path === '/auth/logout') {
                $this->json(['ok' => true]);
            }

            // 13. Account Addresses & Orders
            if ($path === '/account/addresses') {
                $user = $this->getAuthenticatedUser();
                if (!$user) {
                    $this->json(['ok' => false, 'error' => ['message' => 'لطفاً وارد حساب شوید']], 401);
                }
                if ($method === 'GET') {
                    $list = $this->store->find('addresses', ['user_id' => $user['id']]);
                    $this->json(['ok' => true, 'addresses' => $list]);
                }
                if ($method === 'POST') {
                    $addr = $this->store->insertOne('addresses', [
                        'user_id' => $user['id'],
                        'title' => $body['title'] ?? 'منزل',
                        'recipient_name' => $body['recipient_name'] ?? $user['name'],
                        'phone' => $body['phone'] ?? $user['phone'],
                        'province' => $body['province'] ?? 'تهران',
                        'city' => $body['city'] ?? 'تهران',
                        'address' => $body['address'] ?? '',
                        'postal_code' => $body['postal_code'] ?? '',
                    ]);
                    $this->json(['ok' => true, 'address' => $addr]);
                }
            }

            if ($method === 'DELETE' && preg_match('#^/account/addresses/(\d+)$#', $path, $m)) {
                $this->store->deleteOne('addresses', ['id' => (int) $m[1]]);
                $this->json(['ok' => true]);
            }

            if ($method === 'GET' && $path === '/account/orders') {
                $user = $this->getAuthenticatedUser();
                $orders = $user
                    ? $this->store->find('orders', ['phone' => $user['phone']])
                    : [];
                $this->json(['ok' => true, 'orders' => $orders, 'pagination' => ['total' => count($orders)]]);
            }

            // 14. Content (Articles, FAQs, Legal, Loyalty)
            if ($method === 'GET' && $path === '/articles') {
                $articles = $this->store->readCollection('articles');
                $categories = $this->store->readCollection('article_categories');
                $this->json(['ok' => true, 'articles' => $articles, 'categories' => $categories]);
            }

            if ($method === 'GET' && preg_match('#^/articles/([^/]+)$#', $path, $m)) {
                $slug = urldecode($m[1]);
                $article = $this->store->findOne('articles', ['slug' => $slug]);
                if (!$article) {
                    $all = $this->store->readCollection('articles');
                    $article = $all[0] ?? null;
                }
                $this->json([
                    'ok' => true,
                    'article' => $article,
                    'relatedArticles' => array_slice($this->store->readCollection('articles'), 0, 2),
                    'relatedProducts' => array_slice($this->enrichProducts($this->store->readCollection('products')), 0, 4),
                ]);
            }

            if ($method === 'GET' && $path === '/faqs') {
                $cats = $this->store->readCollection('faq_categories');
                $faqs = $this->store->readCollection('faqs');
                foreach ($cats as &$c) {
                    $c['faqs'] = array_values(array_filter($faqs, fn($f) => (int) ($f['category_id'] ?? 0) === (int) $c['id']));
                }
                $this->json(['ok' => true, 'categories' => $cats]);
            }

            if ($method === 'GET' && preg_match('#^/legal/([^/]+)$#', $path, $m)) {
                $slug = urldecode($m[1]);
                $page = $this->store->findOne('legal_pages', ['slug' => $slug]);
                $this->json(['ok' => true, 'page' => $page]);
            }

            if ($method === 'GET' && $path === '/loyalty') {
                $this->json([
                    'ok' => true,
                    'tiers' => $this->store->readCollection('loyalty_tiers'),
                    'installments' => $this->store->readCollection('loyalty_installments'),
                    'steps' => $this->store->readCollection('loyalty_steps'),
                ]);
            }

            // 15. Contact & Stock Alerts
            if ($method === 'POST' && $path === '/contact') {
                $this->store->insertOne('contact_messages', [
                    'name' => $body['name'] ?? '',
                    'phone' => $body['phone'] ?? '',
                    'email' => $body['email'] ?? '',
                    'subject' => $body['subject'] ?? '',
                    'message' => $body['message'] ?? '',
                    'status' => 'NEW',
                ]);
                $this->json(['ok' => true, 'message' => 'پیام شما با موفقیت ثبت شد.']);
            }

            if ($method === 'POST' && $path === '/stock-alerts') {
                $this->store->insertOne('stock_alerts', [
                    'product_id' => $body['product_id'] ?? 0,
                    'phone' => $body['phone'] ?? '',
                    'is_notified' => false,
                ]);
                $this->json(['ok' => true, 'message' => 'درخواست اطلاع‌رسانی ثبت شد.']);
            }

            // 16. Admin Endpoints
            if ($method === 'GET' && $path === '/admin/dashboard') {
                $orders = $this->store->readCollection('orders');
                $products = $this->store->readCollection('products');
                $users = $this->store->readCollection('users');
                $revenue = array_reduce($orders, fn($sum, $o) => $sum + (int) ($o['total'] ?? 0), 0);
                $pending = count(array_filter($orders, fn($o) => ($o['status'] ?? '') === 'PENDING'));
                $outOfStock = count(array_filter($products, fn($p) => (int) ($p['stock'] ?? 0) <= 0));

                $this->json([
                    'ok' => true,
                    'stats' => [
                        'totalOrders' => count($orders),
                        'totalRevenue' => $revenue,
                        'pendingOrders' => $pending,
                        'totalProducts' => count($products),
                        'outOfStock' => $outOfStock,
                        'totalUsers' => count($users),
                    ],
                    'recentOrders' => array_slice($orders, 0, 10),
                ]);
            }

            if ($method === 'GET' && $path === '/admin/orders') {
                $orders = $this->store->readCollection('orders');
                $this->json([
                    'ok' => true,
                    'orders' => $orders,
                    'pagination' => ['total' => count($orders), 'page' => 1, 'lastPage' => 1],
                ]);
            }

            if ($method === 'PUT' && preg_match('#^/admin/orders/(\d+)$#', $path, $m)) {
                $id = (int) $m[1];
                $updated = $this->store->updateOne('orders', ['id' => $id], [
                    '$set' => [
                        'status' => $body['status'] ?? 'PROCESSING',
                        'tracking_code' => $body['tracking_code'] ?? null,
                    ],
                ]);
                $this->json(['ok' => true, 'order' => $updated]);
            }

            if ($method === 'POST' && $path === '/admin/settings') {
                $values = is_array($body['values'] ?? null) ? $body['values'] : $body;
                foreach ($values as $key => $val) {
                    if (!is_string($key)) continue;
                    $strVal = is_array($val) ? json_encode($val, JSON_UNESCAPED_UNICODE) : (string) $val;
                    $this->store->updateOne('settings', ['key' => $key], [
                        '$set' => [
                            'key' => $key,
                            'value' => $strVal,
                            'group' => $key === 'hero_slides' ? 'pages' : 'general',
                            'is_public' => true,
                        ],
                    ], true);
                }
                $this->json([
                    'ok' => true,
                    'message' => 'تنظیمات با موفقیت در دیتابیس MongoDB ذخیره شد.',
                ]);
            }

            $this->json(['ok' => false, 'error' => ['code' => 'not_found', 'message' => 'مسیر API یافت نشد: ' . $path]], 404);
        } catch (Throwable $e) {
            $this->json(['ok' => false, 'error' => ['code' => 'server_error', 'message' => $e->getMessage()]], 500);
        }
    }

    /**
     * @param array<int, array<string, mixed>> $products
     * @return array<int, array<string, mixed>>
     */
    private function enrichProducts(array $products): array
    {
        $categories = $this->store->readCollection('categories');
        $brands = $this->store->readCollection('brands');
        $catMap = [];
        foreach ($categories as $c) {
            $catMap[(int) $c['id']] = $c;
        }
        $brandMap = [];
        foreach ($brands as $b) {
            $brandMap[(int) $b['id']] = $b;
        }

        foreach ($products as &$p) {
            $p['category'] = $catMap[(int) ($p['category_id'] ?? 1)] ?? ($categories[0] ?? null);
            $p['brand'] = $brandMap[(int) ($p['brand_id'] ?? 1)] ?? ($brands[0] ?? null);
        }
        return $products;
    }

    private function getAuthenticatedUser(): ?array
    {
        $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/Bearer\s+(.+)/i', $auth, $m)) {
            $token = trim($m[1]);
            $session = $this->store->findOne('auth_sessions', ['token' => $token]);
            if ($session) {
                return $this->store->findOne('users', ['id' => $session['user_id']]);
            }
        }
        return null;
    }

    private function getJsonBody(): array
    {
        $raw = file_get_contents('php://input');
        if (!$raw) return [];
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    private function json(array $payload, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
