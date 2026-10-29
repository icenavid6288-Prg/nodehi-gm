# راهنمای جامع استقرار فروشگاه نودهی بر روی هاست PHP (cPanel / DirectAdmin)

این پروژه با درخواست شما به طور کامل به معماری استاندارد **Laravel 12 (بک‌اند PHP)** و **React 18 + TypeScript + Vite (فرانت‌اند SPA)** تبدیل شده است تا بتوانید آن را بدون نیاز به سرور Node.js، بر روی هر هاست اشتراکی لینوکس (مانند هاست‌های ایرانی cPanel یا DirectAdmin با PHP 8.2+) به سادگی میزبانی فرمایید.

---

## ۱. ساختار پوشه‌ها برای هاست اشتراکی

در هاست‌های اشتراکی، فایل‌های قابل دسترس برای عموم داخل `public_html` قرار دارند و فایل‌های حساس امنیتی بک‌اند باید خارج از دسترس مستقیم وب باشند:

```text
/home/username/
├── backend/                     <-- سورس کامل لاراول (امن و خارج از وب)
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── routes/
│   ├── storage/
│   ├── .env
│   ├── artisan
│   └── composer.json
│
└── public_html/                 <-- پوشه عمومی وب‌سایت
    ├── assets/                  <-- فایل‌های جاوااسکریپت و استایل بیلدشده React
    ├── icon.svg
    ├── index.html
    ├── index.php                <-- ورودی لاراول
    └── .htaccess                <-- تنظیمات Rewrite آپاچی/لایت‌اسپید
```

---

## ۲. مراحل نصب و راه‌اندازی قدم‌به‌قدم

### گام اول: آماده‌سازی دیتابیس در cPanel
1. وارد کنترل پنل cPanel هاست خود شوید.
2. به بخش **MySQL Databases** بروید.
3. یک دیتابیس جدید بسازید (مثال: `myuser_nodehi`).
4. یک کاربر دیتابیس جدید با رمز عبور قوی بسازید (مثال: `myuser_dbuser`).
5. در بخش **Add User to Database**، کاربر را به دیتابیس متصل کرده و تیک گزینه **ALL PRIVILEGES** را بزنید و ذخیره کنید.

---

### گام دوم: آپلود فایل‌ها به هاست
1. دستور ساخت زیپ را در کامپیوتر خود اجرا کنید:
   ```bash
   node scripts/pack-host.mjs
   ```
   فایل `nodehi-laravel-host.zip` تولید می‌شود.
2. در File Manager هاست خود:
   - پوشه `backend` را در مسیر ریشه کاربری (کنار `public_html`) استخراج (Extract) کنید.
   - محتویات پوشه `public_html` فایل زیپ را مستقیماً داخل پوشه `public_html` هاست استخراج کنید.

---

### گام سوم: تنظیم فایل پیکربندی `.env`
1. داخل پوشه `backend/` فایل `.env.example` را به `.env` تغییر نام دهید (Rename).
2. مقادیر دیتابیس را ویرایش کنید:
   ```ini
   APP_NAME="فروشگاه نودهی"
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://yourdomain.ir

   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=myuser_nodehi
   DB_USERNAME=myuser_dbuser
   DB_PASSWORD=YourStrongPassword
   ```

---

### گام چهارم: اجرای دستورات لاراول
در منوی cPanel به بخش **Terminal** بروید (یا از طریق SSH متصل شوید):

```bash
# رفتن به پوشه بک‌اند
cd ~/backend

# تولید کلید امنیتی لاراول
php artisan key:generate

# ایجاد جدول‌ها و بارگذاری ۲۳ کالای پیش‌فرض، دسته‌ها، برندها و تنظیمات
php artisan migrate --seed --force

# بهینه‌سازی کش برای سرعت فوق‌العاده
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

> **نکته:** نسخه PHP هاست را از بخش **MultiPHP Manager** در cPanel روی **PHP 8.2** یا **PHP 8.3** تنظیم نمایید.

---

## ۳. ورود به پنل مدیریت فروشگاه

پس از اجرای سیدر، حساب کاربری مدیر کل به شرح زیر در دسترس است:
- **شماره موبایل مدیر:** `09120000000`
- در صفحه `/login` شماره بالا را وارد کرده و با کد تأیید وارد شوید.
- در منوی کاربری بالا، گزینه **«پنل مدیریت فروشگاه»** فعال شده و به مسیر `/admin` دسترسی خواهید داشت.

---

## ۴. اتصال درگاه پرداخت زرین‌پال یا اسنپ‌پی

در فایل `backend/.env` می‌توانید اطلاعات درگاه تجاری خود را وارد نمایید:
```ini
# زرین‌پال
ZARINPAL_MERCHANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ZARINPAL_SANDBOX=false

# اسنپ‌پی (اقساطی)
SNAPPAY_CLIENT_ID=your_id
SNAPPAY_CLIENT_SECRET=your_secret
```

فروشگاه شما اکنون به طور کامل با فرانت‌اند سریع و مدرن React و بک‌اند مقاوم و پرسرعت Laravel بر روی هاست اشتراکی آماده سرویس‌دهی است!
