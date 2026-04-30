-- إضافة أعمدة بيانات التواصل (هاتف + بريد) لجدول إعدادات الصفحة الرئيسية
-- شغّله من لوحة Neon → SQL Editor إذا جدول HomepageSetting موجود مسبقاً وبدون هذه الأعمدة

ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS footer_contact_phone TEXT;
ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS footer_contact_email TEXT;

-- قيم افتراضية اختيارية (يمكن تعديلها من لوحة الإعدادات)
UPDATE "HomepageSetting"
SET
  footer_contact_phone = COALESCE(footer_contact_phone, ''),
  footer_contact_email = COALESCE(footer_contact_email, ''),
  updated_at = NOW()
WHERE id = 'default';

