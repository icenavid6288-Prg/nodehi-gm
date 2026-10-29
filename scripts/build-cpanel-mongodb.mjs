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

console.log('۲) همگام‌سازی خروجی بیلد React + TypeScript با پوشه استقرار سی‌پنل (dist-host)...');
const distSpa = join(root, 'dist');
const distHost = join(root, 'dist-host');
const distPublic = join(distHost, 'public_html');
const distBackend = join(distHost, 'backend');

mkdirSync(distPublic, { recursive: true });
mkdirSync(distBackend, { recursive: true });

if (existsSync(distSpa)) {
  cpSync(distSpa, distPublic, { recursive: true });
}

// کپی فایل‌های ورودی Laravel و اسکریپت نصب گرافیکی در public_html
const backendPublicFiles = ['index.php', 'install.php', '.htaccess', 'robots.txt', 'favicon.ico'];
for (const f of backendPublicFiles) {
  const src = join(root, 'backend', 'public', f);
  if (existsSync(src)) {
    copyFileSync(src, join(distPublic, f));
  }
}

// کپی هسته MongoDB / NoSQL و کالکشن‌های دیتابیس در هر دو مسیر backend و public_html
rmSync(distBackend, { recursive: true, force: true });
cpSync(join(root, 'backend'), distBackend, { recursive: true });

mkdirSync(join(distPublic, 'database', 'mongodb'), { recursive: true });
cpSync(mongoDir, join(distPublic, 'database', 'mongodb'), { recursive: true });
writeFileSync(
  join(distPublic, 'database', '.htaccess'),
  `<IfModule mod_authz_core.c>\n    Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n    Order deny,allow\n    Deny from all\n</IfModule>\n`,
  'utf8'
);

copyFileSync(
  join(root, 'backend', 'bootstrap', 'cpanel_mongodb_kernel.php'),
  join(distPublic, 'api_kernel.php')
);
copyFileSync(
  join(root, 'backend', 'app', 'Services', 'MongoDocumentStore.php'),
  join(distPublic, 'MongoDocumentStore.php')
);

console.log('۳) ساخت فایل زیپ آماده آپلود در سی‌پنل پارس‌پک...');
const zipRoot = join(root, 'nodehi-cpanel-mongodb.zip');
const zipPublic = join(root, 'public', 'nodehi-cpanel-mongodb.zip');
const archive = createZip(distHost, zipRoot);
mkdirSync(join(root, 'public'), { recursive: true });
copyFileSync(zipRoot, zipPublic);

console.log(
  `✓ بسته آماده آپلود در سی‌پنل ساخته شد: ${archive.files} فایل (${(archive.bytes / 1024).toFixed(1)} کیلوبایت)`
);
