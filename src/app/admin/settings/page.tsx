import type { Metadata } from 'next'
import Link from 'next/link'
import { AppearanceStudio } from '@/components/admin/appearance-studio'
import { SettingsForm } from '@/components/admin/settings-form'
import { buildMetadata } from '@/lib/seo'
import { getStaffUser, isAdminRole } from '@/lib/server/admin'
import { getSettingFields, isEncryptionEnabled, SETTING_GROUP_LABELS } from '@/lib/server/settings'

export const metadata: Metadata = buildMetadata({
  title: 'تنظیمات سایت، لوگو، رنگ و اسلایدشو',
  description: 'مدیریت لوگو، رنگ بصری اصلی سایت، عکس‌های اسلایدشو صفحه اصلی، نوار اعلان و اطلاعات تماس.',
  path: '/admin/settings',
  noIndex: true,
})

/**
 * تنظیمات عمومی سایت، هویت بصری (لوگو و رنگ‌ها) و اسلایدشو صفحه اصلی.
 */
export default async function AdminSettingsPage() {
  const [staff, generalFieldsRaw, pageFieldsRaw, encryptionEnabled] = await Promise.all([
    getStaffUser(),
    getSettingFields('general'),
    getSettingFields('pages'),
    isEncryptionEnabled(),
  ])

  const canEdit = Boolean(staff)

  // فیلدهایی که در استودیو طراحی ظاهر مدیریت می‌شوند از فرم متنی پایین حذف می‌شوند تا تکرار نشوند
  const studioKeys = new Set([
    'site.brandName',
    'site.tagline',
    'site.logoUrl',
    'site.primaryColor',
    'site.secondaryColor',
    'site.accentColor',
    'pages.hero.slides',
  ])
  const generalFields = generalFieldsRaw.filter((f) => !studioKeys.has(f.key))
  const pageFields = pageFieldsRaw.filter((f) => !studioKeys.has(f.key))

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-lg font-extrabold text-ink">تنظیمات سایت، لوگو، رنگ و اسلایدشو</h1>
        <p className="mt-2 text-sm leading-7 text-ink-muted">
          از این بخش می‌توانید لوگوی سایت، رنگ بصری اصلی، عکس‌ها و متن‌های اسلایدشو صفحه اصلی و اطلاعات تماس را بدون نیاز به تغییر کد مدیریت کنید.
        </p>
      </header>

      {canEdit ? <AppearanceStudio /> : null}

      {/* دسترسی سریع به تنظیمات حساس — کلیدهای اعتبارنامه اینجا نیستند */}
      <section className="rounded-2xl border border-surface-border bg-white p-5">
        <h2 className="text-sm font-bold text-ink">تنظیمات حساس در صفحه‌های جداگانه</h2>
        <p className="mt-1.5 text-xs leading-6 text-ink-muted">
          کلیدهای API و اعتبارنامه‌ها عمداً از این صفحه جدا شده‌اند و تنها مدیر کل به آن‌ها دسترسی دارد.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/sms"
            className="rounded-xl border border-surface-border px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.04]"
          >
            <span className="block text-xs font-bold text-ink">سرویس پیامک</span>
            <span className="mt-1 block text-[11px] text-ink-subtle">کلید API، قالب‌ها و لاگ ارسال</span>
          </Link>
          <Link
            href="/admin/payments"
            className="rounded-xl border border-surface-border px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.04]"
          >
            <span className="block text-xs font-bold text-ink">درگاه‌های پرداخت</span>
            <span className="mt-1 block text-[11px] text-ink-subtle">فعال‌سازی، حالت آزمایشی و شناسه پذیرنده</span>
          </Link>
          <Link
            href="/admin/automation"
            className="rounded-xl border border-surface-border px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.04]"
          >
            <span className="block text-xs font-bold text-ink">اتوماسیون</span>
            <span className="mt-1 block text-[11px] text-ink-subtle">وبهوک، رویدادها و لاگ ارسال</span>
          </Link>
          <Link
            href="/admin/integrations"
            className="rounded-xl border border-surface-border px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.04]"
          >
            <span className="block text-xs font-bold text-ink">یکپارچه‌سازی‌ها</span>
            <span className="mt-1 block text-[11px] text-ink-subtle">اسنپ‌پی، دیجی‌کالا و ترب — پیش‌فرض خاموش</span>
          </Link>
        </div>
      </section>

      {canEdit ? (
        <>
          <SettingsForm
            group="general"
            title={SETTING_GROUP_LABELS.general}
            description="اطلاعات تماس و آستانه‌های عملیاتی. تلفن و ایمیل پشتیبانی در پیامک‌ها و ایمیل‌های اطلاع‌رسانی استفاده می‌شوند."
            fields={generalFields}
            encryptionEnabled={encryptionEnabled}
          />

          <SettingsForm
            group="pages"
            title={SETTING_GROUP_LABELS.pages}
            description="متن نوار اعلان بالای سایت و حالت تعمیرات. حالت تعمیرات سایت را نمی‌بندد؛ فقط نوار هشدار نشان می‌دهد."
            fields={pageFields}
            encryptionEnabled={encryptionEnabled}
          />
        </>
      ) : (
        <p className="rounded-2xl border border-surface-border bg-white p-5 text-xs text-ink-muted">
          شما اجازه ویرایش تنظیمات را ندارید. نقش حسابدار فقط گزارش‌ها را می‌بیند.
        </p>
      )}

      {!isAdminRole(staff?.role ?? '') ? (
        <p className="text-[11px] leading-5 text-ink-subtle">
          نکته: تنظیمات پیامک، اتوماسیون و یکپارچه‌سازی‌ها تنها برای مدیر کل قابل تغییر است.
        </p>
      ) : null}
    </div>
  )
}
