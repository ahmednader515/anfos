-- إضافة الأقسام الفرعية + ربطها بالكورسات
-- شغّله من لوحة Neon → SQL Editor إذا قاعدة البيانات موجودة مسبقاً

CREATE TABLE IF NOT EXISTS "SubCategory" (
  id            TEXT PRIMARY KEY,
  category_id   TEXT NOT NULL REFERENCES "Category"(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  name_ar       TEXT,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT,
  image_url     TEXT,
  "order"       INT NOT NULL DEFAULT 0,
  created_by_id TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "SubCategory_category_id_idx" ON "SubCategory"(category_id);
CREATE INDEX IF NOT EXISTS "SubCategory_created_by_id_idx" ON "SubCategory"(created_by_id);

ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS subcategory_id TEXT REFERENCES "SubCategory"(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "Course_subcategory_id_idx" ON "Course"(subcategory_id);

