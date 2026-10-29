/**
 * ساخت بستهٔ کامل استقرار هاست سی‌پنل پارس‌پک (React + TypeScript + Laravel 12 + MongoDB / NoSQL Document Store)
 * بدون هیچ‌گونه وابستگی به Next.js یا Prisma و بدون نیاز به ترمینال و SSH روی هاست
 */

import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedMongoCollections } from './seed-mongodb.mjs';
import { createZip } from './zip.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

console.log('۱) آماده‌سازی کالکشن‌های دیتابیس سندگرای MongoDB / NoSQL...');
const mongoDir = seedMongoCollections({ forceReset: false });

console.log('۲) همگام‌سازی کدهای فرانت‌اند (src -> frontend/src)...');
if (existsSync(join(root, 'src'))) {
  mkdirSync(join(root, 'frontend', 'src'), { recursive: true });
  cpSync(join(root, 'src'), join(root, 'frontend', 'src'), { recursive: true });
}

console.log('۳) آماده‌سازی خروجی کامپایل‌شده در ریشه پروژه و پوشه dist-host/public_html...');
const distSpa = join(root, 'dist');
const distHost = join(root, 'dist-host');
const distPublic = join(distHost, 'public_html');
const distBackend = join(distHost, 'backend');

rmSync(distPublic, { recursive: true, force: true });
mkdirSync(distPublic, { recursive: true });
mkdirSync(distBackend, { recursive: true });

if (existsSync(distSpa)) {
  cpSync(distSpa, distPublic, { recursive: true });

  // قرار دادن فایل HTML کامپایل‌شده در spa.html (هم در ریشه و هم در distPublic)
  const compiledHtml = join(distSpa, 'index.html');
  if (existsSync(compiledHtml)) {
    copyFileSync(compiledHtml, join(distPublic, 'spa.html'));
    copyFileSync(compiledHtml, join(root, 'spa.html'));
  }

  // کپی باندل‌های کامپایل‌شده assets و تصاویر در ریشه پروژه تا کلون مستقیم گیت‌هاب در public_html هم بدون صفحه سفید کار کند
  const distAssets = join(distSpa, 'assets');
  if (existsSync(distAssets)) {
    rmSync(join(root, 'assets'), { recursive: true, force: true });
    mkdirSync(join(root, 'assets'), { recursive: true });
    cpSync(distAssets, join(root, 'assets'), { recursive: true });
  }

  if (existsSync(join(root, 'public', 'images'))) {
    mkdirSync(join(root, 'images'), { recursive: true });
    cpSync(join(root, 'public', 'images'), join(root, 'images'), { recursive: true });
  }
  for (const pubFile of ['icon.svg', 'og-default.svg']) {
    if (existsSync(join(root, 'public', pubFile))) {
      copyFileSync(join(root, 'public', pubFile), join(root, pubFile));
    }
  }
}

// کپی فایل‌های ورودی Laravel و اسکریپت نصب گرافیکی در public_html و در ریشه پروژه
const backendPublicFiles = ['index.php', 'install.php', '.htaccess', 'robots.txt', 'favicon.ico'];
for (const f of backendPublicFiles) {
  const src = join(root, 'backend', 'public', f);
  if (existsSync(src)) {
    copyFileSync(src, join(distPublic, f));
    copyFileSync(src, join(root, f));
  }
}

// کپی هسته MongoDB / NoSQL و کالکشن‌های دیتابیس در هر سه مسیر (ریشه، backend و public_html)
rmSync(distBackend, { recursive: true, force: true });
cpSync(join(root, 'backend'), distBackend, { recursive: true });
cpSync(join(root, 'backend'), join(distPublic, 'backend'), { recursive: true });

const dbHtaccess = `<IfModule mod_authz_core.c>\n    Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n    Order deny,allow\n    Deny from all\n</IfModule>\n`;

// در dist-host/public_html/database/mongodb
mkdirSync(join(distPublic, 'database', 'mongodb'), { recursive: true });
cpSync(mongoDir, join(distPublic, 'database', 'mongodb'), { recursive: true });
writeFileSync(join(distPublic, 'database', '.htaccess'), dbHtaccess, 'utf8');

// در ریشه پروژه /database/mongodb
mkdirSync(join(root, 'database', 'mongodb'), { recursive: true });
cpSync(mongoDir, join(root, 'database', 'mongodb'), { recursive: true });
writeFileSync(join(root, 'database', '.htaccess'), dbHtaccess, 'utf8');

// کپی هسته اجرایی در ریشه و distPublic
const kernelSrc = join(root, 'backend', 'bootstrap', 'cpanel_mongodb_kernel.php');
const storeSrc = join(root, 'backend', 'app', 'Services', 'MongoDocumentStore.php');

copyFileSync(kernelSrc, join(distPublic, 'api_kernel.php'));
copyFileSync(storeSrc, join(distPublic, 'MongoDocumentStore.php'));
copyFileSync(kernelSrc, join(root, 'api_kernel.php'));
copyFileSync(storeSrc, join(root, 'MongoDocumentStore.php'));

console.log('۴) ساخت فایل زیپ آماده آپلود مستقیم در public_html سی‌پنل پارس‌پک...');
const zipRoot = join(root, 'nodehi-cpanel-mongodb.zip');
const zipPublic = join(root, 'public', 'nodehi-cpanel-mongodb.zip');

rmSync(join(distPublic, 'nodehi-cpanel-mongodb.zip'), { force: true });

// زیپ کردن مستقیم محتویات distPublic تا کاربر با Extract در public_html مستقیماً فایل‌ها را در ریشه داشته باشد
const archive = createZip(distPublic, zipRoot);
mkdirSync(join(root, 'public'), { recursive: true });
copyFileSync(zipRoot, zipPublic);

console.log(
  `✓ بسته آماده آپلود در سی‌پنل ساخته شد: ${archive.files} فایل (${(archive.bytes / 1024).toFixed(1)} کیلوبایت)`
);
