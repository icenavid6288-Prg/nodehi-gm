#!/usr/bin/env node
/**
 * آماده‌سازی پوشهٔ داده و دیتابیس SQLite پیش از اجرای سرور یا بیلد.
 */

import { existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const dataDir = join(root, 'data')
const envFile = join(root, '.env')
const dbFile = join(root, 'prisma', 'dev.db')
const nextDir = join(root, '.next')
const isDev = process.argv.includes('--dev')

try {
  mkdirSync(dataDir, { recursive: true })

  // ۱) اطمینان از وجود فایل .env
  if (!existsSync(envFile)) {
    writeFileSync(
      envFile,
      'DATABASE_URL="file:./dev.db"\nNEXT_PUBLIC_SITE_URL="http://localhost:3000"\n',
      'utf8',
    )
  }

  // ۲) اگر در حالت dev هستیم و خروجی بیلد تولیدی در .next مانده، پاک شود تا تداخل نکند
  if (isDev && existsSync(join(nextDir, 'BUILD_ID'))) {
    rmSync(nextDir, { recursive: true, force: true })
    console.log('  ✓ پوشه بیلد قبلی (.next) برای اجرای روان سرور توسعه پاک شد')
  }

  // ۳) اطمینان از مقداردهی دیتابیس SQLite
  const dbNeedsInit = !existsSync(dbFile) || statSync(dbFile).size < 4096
  if (dbNeedsInit) {
    console.log('  ▸ در حال ساخت جدول‌ها و بارگذاری داده‌های اولیه دیتابیس...')
    execSync('npx prisma db push --skip-generate', { cwd: root, stdio: 'inherit' })
    execSync('node prisma/seed.mjs', { cwd: root, stdio: 'inherit' })
  }

  console.log(`  ✓ دیتابیس و داده‌ها آماده است`)
} catch (error) {
  console.error(`  ⚠ هشدار در آماده‌سازی اولیه: ${error.message}`)
}
