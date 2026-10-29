<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\PaymentGateway;
use App\Models\Product;
use App\Models\Review;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class StoreSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Admin & Demo User
        $admin = User::firstOrCreate(
            ['phone' => '09120000000'],
            [
                'name' => 'مدیر فروشگاه نودهی',
                'email' => 'admin@nodehi.ir',
                'role' => 'SUPER_ADMIN',
                'phone_verified_at' => now(),
            ]
        );

        $iconEmojis = [
            'refrigerator' => '❄️',
            'washer' => '🧺',
            'dishwasher' => '🍽️',
            'tv' => '📺',
            'air-conditioner' => '💨',
            'vacuum' => '🧹',
            'oven' => '🍳',
            'small-appliance' => '☕',
        ];

        // 2. Categories
        $categoriesData = $this->loadJson('categories.json');
        $catMap = [];
        if ($categoriesData) {
            foreach ($categoriesData as $idx => $cat) {
                $slug = $cat['slug'];
                $created = Category::updateOrCreate(
                    ['slug' => $slug],
                    [
                        'name' => $cat['nameEn'] ?? $cat['name'],
                        'name_fa' => $cat['name_fa'] ?? $cat['name'],
                        'description' => $cat['description'] ?? null,
                        'icon' => $iconEmojis[$slug] ?? ($cat['icon'] ?? '📦'),
                        'image' => $cat['image'] ?? "/images/products/{$slug}.svg",
                        'order' => $cat['order'] ?? $idx,
                    ]
                );
                $catMap[$slug] = $created->id;
            }
        }

        // 3. Brands
        $brandsData = $this->loadJson('brands.json');
        $brandMap = [];
        if ($brandsData) {
            foreach ($brandsData as $idx => $b) {
                $created = Brand::updateOrCreate(
                    ['slug' => $b['slug']],
                    [
                        'name' => $b['nameEn'] ?? $b['name'],
                        'name_fa' => $b['name_fa'] ?? $b['name'],
                        'logo' => $b['logo'] ?? null,
                        'country' => $b['country'] ?? $b['origin'] ?? null,
                        'description' => $b['description'] ?? null,
                        'order' => $b['order'] ?? $idx,
                    ]
                );
                $brandMap[$b['slug']] = $created->id;
            }
        }

        // 4. Products
        $productsData = $this->loadJson('products.json');
        if ($productsData) {
            foreach ($productsData as $idx => $p) {
                $catSlug = $p['categorySlug'] ?? $p['category'] ?? '';
                $brandSlug = $p['brandSlug'] ?? $p['brand'] ?? '';
                $catId = $catMap[$catSlug] ?? Category::first()?->id;
                $brandId = $brandMap[$brandSlug] ?? Brand::first()?->id;

                if (!$catId || !$brandId) {
                    continue;
                }

                $attrs = $p['attributes'] ?? [];
                $rawSpecs = $p['specs'] ?? [];
                $specsMap = [];
                if (is_array($rawSpecs)) {
                    foreach ($rawSpecs as $k => $v) {
                        if (is_array($v) && isset($v['label'], $v['value'])) {
                            $specsMap[$v['label']] = $v['value'];
                        } elseif (is_string($k)) {
                            $specsMap[$k] = $v;
                        }
                    }
                }

                $colors = $p['colors'] ?? (!empty($attrs['color']) ? [$attrs['color'], 'سفید', 'نقره‌ای'] : ['نقره‌ای', 'سفید']);
                $warrantyMonths = $attrs['warrantyMonths'] ?? 24;
                $warrantyText = $p['warranty'] ?? "{$warrantyMonths} ماه گارانتی معتبر شرکتی";
                $defaultThumb = "/images/products/{$catSlug}.svg";
                $images = !empty($p['images']) ? $p['images'] : [$defaultThumb];

                $prod = Product::updateOrCreate(
                    ['slug' => $p['slug']],
                    [
                        'name' => $p['name'],
                        'name_en' => $p['name_en'] ?? $p['nameEn'] ?? strtoupper(str_replace('-', ' ', $p['slug'])),
                        'sku' => $p['sku'] ?? ('NDH-' . (1001 + $idx)),
                        'category_id' => $catId,
                        'brand_id' => $brandId,
                        'price' => $p['price'],
                        'compare_price' => $p['compare_price'] ?? $p['compareAtPrice'] ?? $p['comparePrice'] ?? null,
                        'stock' => $p['stock'] ?? 10,
                        'thumbnail' => $p['thumbnail'] ?? $images[0] ?? $defaultThumb,
                        'images' => $images,
                        'short_description' => $p['short_description'] ?? $p['shortDescription'] ?? null,
                        'description' => $p['description'] ?? null,
                        'specs' => $specsMap,
                        'features' => $p['features'] ?? $p['highlights'] ?? [],
                        'colors' => array_values(array_unique($colors)),
                        'tags' => $p['tags'] ?? [],
                        'energy_grade' => $p['energy_grade'] ?? $attrs['energyRating'] ?? 'A++',
                        'warranty' => $warrantyText,
                        'is_inverter' => (bool) ($p['is_inverter'] ?? $attrs['inverter'] ?? false),
                        'has_installment' => (bool) ($p['has_installment'] ?? $attrs['installmentAvailable'] ?? true),
                        'is_ready_to_ship' => (bool) ($p['is_ready_to_ship'] ?? $attrs['readyToShip'] ?? true),
                        'is_active' => true,
                        'rating_cache' => $p['rating'] ?? 4.8,
                        'reviews_count_cache' => $p['reviewCount'] ?? $p['reviewsCount'] ?? 5,
                    ]
                );

                if ($prod->wasRecentlyCreated) {
                    Review::create([
                        'product_id' => $prod->id,
                        'user_id' => null,
                        'author_name' => 'رضا احمدی',
                        'rating' => 5,
                        'title' => 'کیفیت عالی و ارسال به موقع',
                        'comment' => 'محصول کاملاً اصل با برچسب اصالت کالا و گارانتی معتبر تحویل داده شد. پشتیبانی نودهی هم بسیار محترم و پاسخگو بودند.',
                        'status' => 'APPROVED',
                        'is_verified_purchase' => true,
                    ]);
                }
            }
        }

        // 5. Coupons
        $coupons = [
            ['code' => 'NODEHI10', 'type' => 'PERCENT', 'value' => 10, 'min_order_amount' => 5000000, 'max_discount_amount' => 5000000],
            ['code' => 'WELCOME15', 'type' => 'PERCENT', 'value' => 15, 'min_order_amount' => 10000000, 'max_discount_amount' => 7500000],
            ['code' => 'NOWRUZ20', 'type' => 'PERCENT', 'value' => 20, 'min_order_amount' => 20000000, 'max_discount_amount' => 10000000],
            ['code' => 'NODEHI1403', 'type' => 'PERCENT', 'value' => 10, 'min_order_amount' => 1000000, 'max_discount_amount' => 5000000],
            ['code' => 'FIRST50', 'type' => 'FIXED', 'value' => 200000, 'min_order_amount' => 2000000, 'max_discount_amount' => null],
        ];
        foreach ($coupons as $c) {
            Coupon::updateOrCreate(
                ['code' => $c['code']],
                [
                    'type' => $c['type'],
                    'value' => $c['value'],
                    'min_order_amount' => $c['min_order_amount'],
                    'max_discount_amount' => $c['max_discount_amount'],
                    'usage_limit' => 1000,
                    'is_active' => true,
                ]
            );
        }

        // 6. Payment Gateways
        $gateways = [
            ['name' => 'zarinpal', 'title' => 'پرداخت آنلاین زرین‌پال (کلیه کارت‌های شتاب)', 'driver' => 'zarinpal', 'order' => 1],
            ['name' => 'snappay', 'title' => 'پرداخت اقساطی اسنپ‌پی (۴ قسط ماهانه بدون بهره)', 'driver' => 'snappay', 'order' => 2],
            ['name' => 'card_to_card', 'title' => 'کارت به کارت با تأیید فیش', 'driver' => 'offline', 'order' => 3],
        ];
        foreach ($gateways as $gw) {
            PaymentGateway::updateOrCreate(['name' => $gw['name']], $gw + ['is_active' => true]);
        }

        // 7. Settings
        Setting::set('store_name', 'فروشگاه لوازم خانگی نودهی', 'general', true);
        Setting::set('phone', '۰۲۱-۹۱۰۰۰۰۰۰', 'general', true);
        Setting::set('mobile', '۰۹۱۲۰۰۰۰۰۰۰', 'general', true);
        Setting::set('email', 'info@nodehi.ir', 'general', true);
        Setting::set('address', 'تهران، خیابان ولیعصر، پلاک ۱۲۳، طبقه سوم', 'general', true);
        Setting::set('free_shipping_threshold', 5000000, 'shipping', true);
        Setting::set('working_hours', 'شنبه تا پنجشنبه، ۹ صبح تا ۹ شب', 'general', true);
    }

    private function loadJson(string $fileName): ?array
    {
        $paths = [
            database_path('seeders/data/' . $fileName),
            base_path('../prisma/seed-data/' . $fileName),
            base_path('database/seeders/data/' . $fileName),
        ];

        foreach ($paths as $path) {
            if (File::exists($path)) {
                return json_decode(File::get($path), true);
            }
        }

        return null;
    }
}
