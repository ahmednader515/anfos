-- إضافة عمود رابط يوتيوب لجدول إعدادات الصفحة الرئيسية
-- شغّله من لوحة Neon → SQL Editor إذا جدول HomepageSetting موجود مسبقاً وبدون هذا العمود

ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS youtube_url TEXT;

UPDATE "HomepageSetting"
SET
  youtube_url = COALESCE(youtube_url, ''),
  updated_at = NOW()
WHERE id = 'default';

