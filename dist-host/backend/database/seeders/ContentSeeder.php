<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\ArticleCategory;
use App\Models\Faq;
use App\Models\FaqCategory;
use App\Models\LegalPage;
use App\Models\LoyaltyInstallment;
use App\Models\LoyaltyStep;
use App\Models\LoyaltyTier;
use Illuminate\Database\Seeder;

class ContentSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Article Categories & Articles
        $guideCat = ArticleCategory::firstOrCreate(
            ['slug' => 'buying-guides'],
            ['name' => 'راهنمای خرید', 'description' => 'راهنماهای تخصصی انتخاب و خرید لوازم خانگی']
        );
        $techCat = ArticleCategory::firstOrCreate(
            ['slug' => 'tech-reviews'],
            ['name' => 'بررسی فناوری', 'description' => 'بررسی مشخصات فنی و فناوری‌های روز لوازم خانگی']
        );

        Article::firstOrCreate(
            ['slug' => 'refrigerator-buying-guide'],
            [
                'title' => 'راهنمای جامع خرید یخچال فریزر و ساید بای ساید',
                'category_id' => $guideCat->id,
                'author' => 'تیم فنی نودهی',
                'read_time' => '۸ دقیقه',
                'date' => '۱۴۰۳/۰۷/۱۰',
                'excerpt' => 'بررسی نکات کلیدی پیش از خرید یخچال: ظرفیت متناسب، موتور اینورتر خطی، مصرف انرژی و سیستم بدون برفک نوفراست.',
                'content' => "خرید یخچال یکی از مهم‌ترین خریدهای هر خانه‌ای است. در این مقاله به بررسی تفاوت‌های ساید‌بای‌ساید، دوقلو و در فرانسوی پرداخته و نکات مهم مصرف انرژی را شرح می‌دهیم...",
                'cover_image' => 'https://picsum.photos/seed/fridge/800/450',
                'tags' => ['یخچال', 'راهنمای خرید', 'لوازم خانگی', 'اینورتر'],
                'is_published' => true,
            ]
        );

        Article::firstOrCreate(
            ['slug' => 'washing-machine-inverter-benefits'],
            [
                'title' => 'چرا باید لباسشویی با موتور Direct Drive اینورتر بخریم؟',
                'category_id' => $techCat->id,
                'author' => 'تیم فنی نودهی',
                'read_time' => '۶ دقیقه',
                'date' => '۱۴۰۳/۰۷/۰۵',
                'excerpt' => 'مزایای موتورهای بدون تسمه دایرکت درایو: لرزش کمتر، صدای فوق‌العاده پایین و ۱۰ سال ضمانت موتور.',
                'content' => "موتورهای اینورتر بدون تسمه انقلابی در آرامش خانه ایجاد کرده‌اند. کاهش اصطکاک داخلی نه تنها طول عمر دستگاه را دو برابر می‌کند، بلکه مصرف برق را تا ۴۰ درصد کاهش می‌دهد...",
                'cover_image' => 'https://picsum.photos/seed/washer/800/450',
                'tags' => ['ماشین لباسشویی', 'اینورتر', 'مصرف انرژی'],
                'is_published' => true,
            ]
        );

        // 2. FAQ Categories & FAQs
        $faqShop = FaqCategory::firstOrCreate(
            ['slug' => 'shopping'],
            ['name' => 'خرید و ثبت سفارش', 'icon' => 'shopping-cart', 'order' => 1]
        );
        $faqShipping = FaqCategory::firstOrCreate(
            ['slug' => 'shipping'],
            ['name' => 'ارسال و تحویل', 'icon' => 'truck', 'order' => 2]
        );
        $faqWarranty = FaqCategory::firstOrCreate(
            ['slug' => 'warranty'],
            ['name' => 'گارانتی و اصالت', 'icon' => 'shield-check', 'order' => 3]
        );

        Faq::firstOrCreate(
            ['question' => 'آیا کالاهای نودهی دارای ضمانت اصالت و گارانتی معتبر هستند؟'],
            [
                'category_id' => $faqWarranty->id,
                'answer' => 'بله، تمامی محصولات عرضه شده در فروشگاه اینترنتی نودهی دارای برچسب اصالت کالا و گارانتی رسمی شرکت‌های معتبر بازرگانی و تولیدی (مانند گلدیران، سام‌سرویس، بوش سرویس و ...) هستند.',
                'order' => 1,
            ]
        );

        Faq::firstOrCreate(
            ['question' => 'ارسال سفارش‌ها به چه صورت و در چه بازه زمانی انجام می‌شود؟'],
            [
                'category_id' => $faqShipping->id,
                'answer' => 'در شهر تهران سفارش‌ها توسط ناوگان اختصاصی نودهی ظرف ۲۴ ساعت تحویل و نصب می‌گردند. برای سایر استان‌ها از طریق باربری‌های معتبر تخصصی با بسته‌بندی ایمن ۲ الی ۳ روز کاری زمان می‌برد.',
                'order' => 1,
            ]
        );

        // 3. Legal Pages
        LegalPage::updateOrCreate(
            ['slug' => 'terms'],
            [
                'title' => 'قوانین و شرایط استفاده از خدمات نودهی',
                'effective_date' => '۱۴۰۳/۰۱/۰۱',
                'sections' => [
                    ['title' => 'ماده ۱: شرایط عمومی', 'body' => 'ثبت سفارش در نودهی به منزله پذیرش کامل قوانین تجارت الکترونیک جمهوری اسلامی ایران است.'],
                    ['title' => 'ماده ۲: ثبت و ارسال سفارش', 'body' => 'روزهای کاری به معنی روز شنبه تا پنج‌شنبه هر هفته، به استثنای تعطیلات عمومی در ایران است.'],
                    ['title' => 'ماده ۳: خسارت در هنگام حمل و نقل', 'body' => 'فروشگاه نودهی همواره نهایت تلاش خود را می‌کند تا کلیه سفارش‌ها در نهایت صحت و بدون آسیب به دست مشتریان برسد.'],
                ],
            ]
        );

        LegalPage::updateOrCreate(
            ['slug' => 'privacy'],
            [
                'title' => 'حریم خصوصی و امنیت اطلاعات کاربران',
                'effective_date' => '۱۴۰۳/۰۱/۰۱',
                'sections' => [
                    ['title' => 'امنیت اطلاعات شخصی', 'body' => 'فروشگاه نودهی به اطلاعات خصوصی اشخاصى که از خدمات سایت استفاده میکنند احترام گذاشته و از آن محافظت میکند.'],
                    ['title' => 'ارتباطات الکترونیکی', 'body' => 'هنگامی که شما از سرویس‌ها و خدمات نودهی استفاده می‌کنید یا سفارش اینترنتی خود را ثبت می‌کنید، این ارتباطات به صورت الکترونیکی انجام می‌شود.'],
                ],
            ]
        );

        // 4. Loyalty & Installments
        LoyaltyTier::firstOrCreate(['name' => 'برنزی'], ['min_points' => 0, 'cashback_percent' => 1, 'color' => '#CD7F32']);
        LoyaltyTier::firstOrCreate(['name' => 'نقره‌ای'], ['min_points' => 500, 'cashback_percent' => 2, 'free_shipping' => true, 'color' => '#C0C0C0']);
        LoyaltyTier::firstOrCreate(['name' => 'طلایی'], ['min_points' => 2000, 'cashback_percent' => 3, 'free_shipping' => true, 'exclusive_discounts' => true, 'priority_support' => true, 'color' => '#FFD700']);

        LoyaltyInstallment::firstOrCreate(
            ['provider' => 'اسنپ‌پی'],
            [
                'title' => 'پرداخت اقساطی ۴ ماهه بدون چک و ضامن',
                'months' => 4,
                'prepayment_percent' => 25,
                'interest_rate' => 0,
                'max_amount' => 50000000,
                'requirements' => ['اعتبارسنجی آنلاین فوری', 'بدون نیاز به چک یا ضامن', 'پرداخت قسط اول در لحظه خرید'],
                'is_active' => true,
                'order' => 1,
            ]
        );

        LoyaltyStep::firstOrCreate(['step_number' => 1], ['title' => 'انتخاب کالا', 'description' => 'کالای مورد نظر خود را به سبد خرید اضافه کنید.']);
        LoyaltyStep::firstOrCreate(['step_number' => 2], ['title' => 'انتخاب روش اقساطی', 'description' => 'در مرحله پرداخت، درگاه اقساطی اسنپ‌پی یا طرف قرارداد را برگزینید.']);
        LoyaltyStep::firstOrCreate(['step_number' => 3], ['title' => 'تحویل کالا', 'description' => 'سفارش خود را تحویل بگیرید و اقساط ماهانه را پرداخت نمایید.']);
    }
}
