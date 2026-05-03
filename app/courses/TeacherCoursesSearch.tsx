"use client";

import { useMemo, useState } from "react";
import { CourseCard } from "@/components/CourseCard";

type CategoryShape = {
  slug?: string;
  name?: string;
  nameAr?: string | null;
  name_ar?: string | null;
} | null;

type SubCategoryShape = {
  slug?: string;
  name?: string;
  nameAr?: string | null;
  name_ar?: string | null;
} | null;

export type TeacherCourseListItem = {
  id: string;
  title: string;
  titleAr?: string | null;
  title_ar?: string | null;
  slug?: string | null;
  shortDesc?: string | null;
  short_desc?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  price?: unknown;
  duration?: string | null;
  level?: string | null;
  category?: CategoryShape;
  subcategory?: SubCategoryShape;
};

function normalizeSearch(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function categoryLabel(cat: CategoryShape): string {
  if (!cat) return "بدون تصنيف";
  const ar = (cat.nameAr ?? cat.name_ar)?.trim();
  if (ar) return ar;
  const n = cat.name?.trim();
  if (n) return n;
  return "بدون تصنيف";
}

function subCategoryLabel(sc: SubCategoryShape): string {
  if (!sc) return "بدون قسم فرعي";
  const ar = (sc.nameAr ?? sc.name_ar)?.trim();
  if (ar) return ar;
  const n = sc.name?.trim();
  if (n) return n;
  return "بدون قسم فرعي";
}

function toCourseCardProps(c: TeacherCourseListItem) {
  const cat = c.category;
  return {
    id: c.id,
    title: c.title,
    titleAr: c.titleAr ?? c.title_ar ?? null,
    slug: c.slug ?? null,
    shortDesc: c.shortDesc ?? c.short_desc ?? null,
    imageUrl: c.imageUrl ?? c.image_url ?? null,
    price: c.price as number | string | { toNumber?: () => number } | undefined,
    duration: c.duration ?? null,
    level: c.level ?? null,
    category: cat
      ? {
          name: cat.name ?? "",
          nameAr: cat.nameAr ?? cat.name_ar ?? null,
        }
      : null,
  };
}

function groupCoursesByCategory(courses: TeacherCourseListItem[]) {
  const map = new Map<string, { label: string; courses: TeacherCourseListItem[] }>();
  const order: string[] = [];
  for (const course of courses) {
    const cat = course.category ?? null;
    const key = cat?.slug?.trim() || "__uncategorized__";
    const label = categoryLabel(cat);
    let entry = map.get(key);
    if (!entry) {
      entry = { label, courses: [] };
      map.set(key, entry);
      order.push(key);
    }
    entry.courses.push(course);
  }
  return order.map((slugKey) => {
    const { label, courses: groupCourses } = map.get(slugKey)!;
    return { slugKey, label, courses: groupCourses };
  });
}

function groupCoursesBySubCategory(courses: TeacherCourseListItem[]) {
  const map = new Map<string, { label: string; courses: TeacherCourseListItem[] }>();
  const order: string[] = [];
  for (const course of courses) {
    const sc = course.subcategory ?? null;
    const key = sc?.slug?.trim() || "__no_subcategory__";
    const label = subCategoryLabel(sc);
    let entry = map.get(key);
    if (!entry) {
      entry = { label, courses: [] };
      map.set(key, entry);
      order.push(key);
    }
    entry.courses.push(course);
  }
  return order.map((slugKey) => {
    const { label, courses: groupCourses } = map.get(slugKey)!;
    return { slugKey, label, courses: groupCourses };
  });
}

/** مطابقة نص البحث مع اسم الدورة أو الوصف القصير أو القسم (اسم / معرّف slug) */
export function courseMatchesSearchQuery(course: TeacherCourseListItem, rawQuery: string) {
  const q = normalizeSearch(rawQuery);
  if (!q) return true;
  const titleAr = (course.titleAr ?? course.title_ar ?? "").toLowerCase();
  const title = (course.title ?? "").toLowerCase();
  const short = (course.shortDesc ?? course.short_desc ?? "").toLowerCase();
  const slug = (course.slug ?? "").toLowerCase();
  const cat = course.category;
  const catAr = (cat?.nameAr ?? cat?.name_ar ?? "").toLowerCase();
  const catName = (cat?.name ?? "").toLowerCase();
  const catSlug = (cat?.slug ?? "").toLowerCase();
  return (
    titleAr.includes(q) ||
    title.includes(q) ||
    short.includes(q) ||
    slug.includes(q) ||
    catAr.includes(q) ||
    catName.includes(q) ||
    catSlug.includes(q)
  );
}

export function TeacherCoursesSearch({
  courses,
  /** عند false: شبكة واحدة (مثل «جميع الدورات») مع نفس شريط البحث */
  groupByCategory = true,
  /** تجميع مرئي حسب القسم الفرعي (بدلاً من القسم الرئيسي) */
  groupBySubcategory = false,
}: {
  courses: TeacherCourseListItem[];
  groupByCategory?: boolean;
  groupBySubcategory?: boolean;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => courses.filter((c) => courseMatchesSearchQuery(c, query)),
    [courses, query],
  );

  const groups = useMemo(() => {
    if (groupBySubcategory) return groupCoursesBySubCategory(filtered);
    return groupCoursesByCategory(filtered);
  }, [filtered, groupBySubcategory]);

  const inputId = groupByCategory ? "teacher-courses-search" : "all-courses-search";

  return (
    <>
      <div className="mb-8">
        <label htmlFor={inputId} className="sr-only">
          {groupByCategory ? "بحث في دورات المدرب" : "بحث في الدورات"}
        </label>
        <input
          id={inputId}
          type="search"
          dir="rtl"
          autoComplete="off"
          placeholder="ابحث باسم الدورة أو القسم…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-xl rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-foreground)] shadow-[var(--shadow-card)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/25"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 p-12 text-center">
          <p className="text-[var(--color-muted)]">
            {normalizeSearch(query)
              ? "لا توجد نتائج تطابق بحثك. جرّب اسم دورة أو قسم آخر."
              : "لا توجد دورات لعرضها."}
          </p>
        </div>
      ) : groupByCategory ? (
        <div className="space-y-12">
          {groups.map((group) => (
            <section key={group.slugKey}>
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-[var(--color-foreground)]">{group.label}</h2>
                <div className="h-px flex-1 bg-[var(--color-border)]/70" aria-hidden />
              </div>
              <div className="grid w-full min-w-0 gap-2 [grid-template-columns:repeat(2,minmax(0,1fr))] sm:gap-4 lg:[grid-template-columns:repeat(4,minmax(0,1fr))]">
                {group.courses.map((course) => (
                  <CourseCard key={course.id} course={toCourseCardProps(course)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid w-full min-w-0 gap-2 [grid-template-columns:repeat(2,minmax(0,1fr))] sm:gap-4 lg:[grid-template-columns:repeat(4,minmax(0,1fr))]">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={toCourseCardProps(course)} />
          ))}
        </div>
      )}
    </>
  );
}
