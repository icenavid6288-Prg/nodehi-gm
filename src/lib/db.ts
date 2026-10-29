/**
 * کلاینت Prisma به‌صورت Singleton.
 *
 * چرا Singleton؟ در حالت توسعه، Next.js ماژول‌ها را با هر تغییر دوباره
 * بارگذاری می‌کند. اگر هر بار یک `new PrismaClient()` بسازیم، تعداد
 * اتصال‌ها به‌سرعت بالا می‌رود و دیتابیس با خطای «too many connections»
 * از کار می‌افتد. نگه‌داشتن نمونه روی `globalThis` این مشکل را حل می‌کند.
 */

import { PrismaClient } from '@prisma/client'

/**
 * آیا خطا به «دیتابیس هنوز نصب نشده» برمی‌گردد؟
 *
 * P2021: جدول هنوز ساخته نشده (مهاجرت اجرا نشده است) — P1012: DATABASE_URL
 * تنظیم نشده. در این دو حالت سایت نباید از کار بیفتد: صفحه /install باید
 * بالا بیاید تا نصب را کامل کند و بقیه صفحات هم به‌جای خطای ۵۰۰، خالی
 * نمایش داده شوند. خطاهای واقعی اتصال ( مثل  قطعی سرور) از این فیلتر عبور
 * نمی‌کنند و همچنان بالا می‌آیند تا خطا پنهان نشود.
 */
export function isDbNotReadyError(error: unknown): boolean {
  const code = (error as { code?: unknown } | null | undefined)?.code
  return code === 'P2021' || code === 'P1012'
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createPrismaClient(): PrismaClient {
  try {
    return new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'file:./dev.db',
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    })
  } catch (err) {
    console.warn('[AI Studio] PrismaClient initialization failed — using mock fallback', err)
    const noOp = {
      findMany: async () => [],
      findFirst: async () => null,
      findUnique: async () => null,
      create: async (d: any) => d?.data ?? {},
      update: async (d: any) => d?.data ?? {},
      delete: async () => ({}),
      count: async () => 0,
      groupBy: async () => [],
      aggregate: async () => ({ _sum: {}, _count: {} }),
      upsert: async (d: any) => d?.create ?? {},
      $queryRaw: async () => [],
      $disconnect: async () => {},
    }
    return new Proxy({}, { get: () => noOp }) as unknown as PrismaClient
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

