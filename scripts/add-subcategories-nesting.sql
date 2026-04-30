-- تفعيل الأقسام الفرعية داخل الأقسام الفرعية (شجرة غير محدودة)
-- شغّله من لوحة Neon → SQL Editor إذا قاعدة البيانات موجودة مسبقاً

ALTER TABLE "SubCategory"
  ADD COLUMN IF NOT EXISTS parent_subcategory_id TEXT REFERENCES "SubCategory"(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "SubCategory_parent_id_idx" ON "SubCategory"(parent_subcategory_id);

