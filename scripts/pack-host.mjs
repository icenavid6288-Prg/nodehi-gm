#!/usr/bin/env node
/**
 * ساخت بسته کامل استقرار برای هاست اشتراکی لینوکس (cPanel / DirectAdmin).
 *
 *   node scripts/pack-host.mjs
 *
 * خروجی:
 *   nodehi-laravel-host.zip
 *
 * محتویات بسته:
 *   ۱) backend/ : سورس کامل لاراول ۱۲ با کلیه مدل‌ها، کنترلرها، مایگریشن‌ها و سیدرها
 *   ۲) public_html/ : خروجی بیلد React SPA همراه با index.php و .htaccess لاراول
 *   ۳) راهنمای استقرار قدم‌به‌قدم به زبان فارسی
 */

import { existsSync, mkdirSync, cpSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { createZip } from './zip.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(root, 'dist-host');
const zipFile = join(root, 'nodehi-laravel-host.zip');

console.log('🚀 شروع آماده‌سازی بسته استقرار لاراول و ری‌اکت...');

try {
  // 1. پاکسازی پوشه موقت قبلی
  if (existsSync(distDir)) {
    rmSync(distDir, { recursive: true, force: true });
  }
  mkdirSync(distDir, { recursive: true });

  // 2. بیلد فرانت‌اند
  console.log('📦 در حال بیلد فرانت‌اند React با Vite...');
  execSync('npm --prefix frontend run build', { cwd: root, stdio: 'inherit' });

  // 3. کپی سورس لاراول به distDir/backend
  console.log('📁 کپی سورس لاراول...');
  const backendTarget = join(distDir, 'backend');
  mkdirSync(backendTarget, { recursive: true });
  cpSync(join(root, 'backend'), backendTarget, {
    recursive: true,
    filter: (src) => !src.includes('node_modules') && !src.includes('vendor') && !src.includes('.git'),
  });

  // 4. کپی خروجی بیلد فرانت‌اند به public_html
  console.log('🌐 آماده‌سازی پوشه public_html برای هاست...');
  const publicTarget = join(distDir, 'public_html');
  mkdirSync(publicTarget, { recursive: true });
  cpSync(join(root, 'frontend', 'dist'), publicTarget, { recursive: true });

  // کپی index.php لاراول به public_html با مسیر تنظیم‌شده
  const indexPhpContent = `<?php
/**
 * ورودی اصلی وب‌سایت نودهی روی هاست اشتراکی cPanel
 */
use Illuminate\\Http\\Request;

define('LARAVEL_START', microtime(true));

// بارگذاری فایل اتولود لاراول از پوشه backend (کنار public_html)
if (file_exists(__DIR__ . '/../backend/vendor/autoload.php')) {
    require __DIR__ . '/../backend/vendor/autoload.php';
} elseif (file_exists(__DIR__ . '/backend/vendor/autoload.php')) {
    require __DIR__ . '/backend/vendor/autoload.php';
}

// بارگذاری اپلیکیشن
if (file_exists(__DIR__ . '/../backend/bootstrap/app.php')) {
    (require_once __DIR__ . '/../backend/bootstrap/app.php')->handleRequest(Request::capture());
} elseif (file_exists(__DIR__ . '/backend/bootstrap/app.php')) {
    (require_once __DIR__ . '/backend/bootstrap/app.php')->handleRequest(Request::capture());
}
`;
  writeFileSync(join(publicTarget, 'index.php'), indexPhpContent, 'utf8');

  // کپی htaccess
  cpSync(join(root, 'backend', 'public', '.htaccess'), join(publicTarget, '.htaccess'));

  // 5. ایجاد فایل راهنما در ریشه بسته
  const readmeContent = `# راهنمای استقرار فروشگاه نودهی روی هاست اشتراکی (cPanel / DirectAdmin)

این بسته شامل دو بخش اصلی است:

۱. پوشه \`backend/\`:
   این پوشه را در ریشه هاست خود (خارج از public_html) قرار دهید:
   /home/username/backend/

۲. پوشه \`public_html/\`:
   محتویات این پوشه (فایل‌های بیلد React، index.php و .htaccess) را مستقیماً داخل پوشه public_html هاست کپی کنید.

۳. دیتابیس MySQL:
   - در cPanel یک دیتابیس MySQL بسازید (مثلاً \`username_nodehi\`).
   - یک کاربر و رمز عبور برای دیتابیس تعریف کرده و به دیتابیس متصل کنید (All Privileges).
   - فایل \`backend/.env.example\` را به \`backend/.env\` تغییر نام داده و اطلاعات دیتابیس را وارد نمایید.

۴. دستورات لاراول (از طریق ترمینال cPanel یا SSH):
   cd backend
   composer install --no-dev --optimize-autoloader
   php artisan key:generate
   php artisan migrate --seed

سایت شما با ظاهر مدرن React و بک‌اند امن و قدرتمند Laravel روی هاست آماده بهره‌برداری است!
`;
  writeFileSync(join(distDir, 'راهنمای_استقرار.txt'), readmeContent, 'utf8');

  // 6. ایجاد فایل زیپ
  console.log('🗜️ در حال فشرده‌سازی در فایل زیپ...');
  await createZip(distDir, zipFile);

  console.log(`\n✅ بسته استقرار با موفقیت ساخته شد: ${zipFile}`);
} catch (err) {
  console.error('❌ خطا در ساخت بسته استقرار:', err);
  process.exit(1);
}
