<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentGateway;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    public function publicSettings(): JsonResponse
    {
        $settings = Setting::where('is_public', true)->pluck('value', 'key');

        return response()->json([
            'ok' => true,
            'settings' => [
                'store_name' => $settings['store_name'] ?? 'فروشگاه لوازم خانگی نودهی',
                'brand_name' => $settings['brand_name'] ?? ($settings['site.brandName'] ?? 'نودهی'),
                'tagline' => $settings['tagline'] ?? ($settings['site.tagline'] ?? 'لوازم خانگی اصیل'),
                'logo_url' => $settings['logo_url'] ?? ($settings['site.logoUrl'] ?? ''),
                'primary_color' => $settings['primary_color'] ?? ($settings['site.primaryColor'] ?? '#0F2A43'),
                'secondary_color' => $settings['secondary_color'] ?? ($settings['site.secondaryColor'] ?? '#12B5A5'),
                'accent_color' => $settings['accent_color'] ?? ($settings['site.accentColor'] ?? '#FF6B35'),
                'hero_slides' => $settings['hero_slides'] ?? ($settings['pages.hero.slides'] ?? ''),
                'phone' => $settings['phone'] ?? '۰۲۱-۹۱۰۰۰۰۰۰',
                'mobile' => $settings['mobile'] ?? '۰۹۱۲۰۰۰۰۰۰۰',
                'email' => $settings['email'] ?? 'info@nodehi.ir',
                'address' => $settings['address'] ?? 'تهران، خیابان ولیعصر، پلاک ۱۲۳، طبقه سوم',
                'free_shipping_threshold' => (int) ($settings['free_shipping_threshold'] ?? 5000000),
                'working_hours' => $settings['working_hours'] ?? 'شنبه تا پنجشنبه، ۹ صبح تا ۹ شب',
            ],
        ]);
    }

    public function paymentMethods(): JsonResponse
    {
        $gateways = PaymentGateway::where('is_active', true)
            ->orderBy('order')
            ->get(['id', 'name', 'title', 'driver']);

        if ($gateways->isEmpty()) {
            $gateways = [
                ['id' => 'zarinpal', 'name' => 'zarinpal', 'title' => 'پرداخت آنلاین زرین‌پال (کلیه کارت‌های شتاب)', 'driver' => 'zarinpal'],
                ['id' => 'snappay', 'name' => 'snappay', 'title' => 'پرداخت اقساطی اسنپ‌پی (۴ قسط ماهانه بدون بهره)', 'driver' => 'snappay'],
                ['id' => 'card_to_card', 'name' => 'card_to_card', 'title' => 'کارت به کارت با تأیید فیش', 'driver' => 'offline'],
            ];
        }

        return response()->json([
            'ok' => true,
            'methods' => $gateways,
        ]);
    }

    public function health(): JsonResponse
    {
        $catalogSize = Product::where('is_active', true)->count();

        return response()->json([
            'ok' => true,
            'status' => 'healthy',
            'service' => 'Nodehi Laravel Backend',
            'version' => '1.0.0',
            'php' => PHP_VERSION,
            'catalogSize' => $catalogSize,
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
