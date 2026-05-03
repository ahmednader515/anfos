"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type CourseRow = {
  id: string;
  title: string;
  titleAr: string | null;
  slug: string;
  isPublished: boolean;
  price: number;
  imageUrl: string | null;
  lessonsCount: number;
  enrollmentsCount: number;
  category: { id: string; name: string; nameAr?: string | null } | null;
  subcategory?: { id: string; name: string; nameAr?: string | null } | null;
  subcategoryPath?: string | null;
  subcategoryDepth?: number;
};

type SubCategoryMeta = { id: string; parentId: string | null; label: string; categoryId: string };

type StatusFilter = "all" | "published" | "draft";
const NO_CATEGORY_KEY = "__none__";
const NO_SUBCATEGORY_KEY = "__no_sub__";

function CourseTableRow({
  c,
  deletingId,
  confirmDelete,
  onDelete,
}: {
  c: CourseRow;
  deletingId: string | null;
  confirmDelete: string | null;
  onDelete: (id: string) => void;
}) {
  return (
    <tr className="border-b border-[var(--color-border)]/70 last:border-0">
      <td className="p-3">
        <div className="flex items-center gap-3">
          {c.imageUrl && (
            <img src={c.imageUrl} alt="" className="h-12 w-20 rounded-[var(--radius-btn)] object-cover" />
          )}
          <span className="font-medium text-[var(--color-foreground)]">
            {c.titleAr ?? c.title}
          </span>
        </div>
      </td>
      <td className="p-3 text-[var(--color-muted)]">{c.lessonsCount}</td>
      <td className="p-3 text-[var(--color-muted)]">{c.enrollmentsCount}</td>
      <td className="p-3">{c.price.toFixed(2)} ج.م</td>
      <td className="p-3">
        <span
          className={
            c.isPublished
              ? "text-[var(--color-success)]"
              : "text-[var(--color-muted)]"
          }
        >
          {c.isPublished ? "منشورة" : "غير منشورة"}
        </span>
      </td>
      <td className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/courses/${c.id}/edit`}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--color-background)]"
          >
            تعديل
          </Link>
          <button
            type="button"
            onClick={() => onDelete(c.id)}
            disabled={deletingId !== null}
            className={
              confirmDelete === c.id
                ? "rounded-[var(--radius-btn)] bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                : "rounded-[var(--radius-btn)] border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
            }
          >
            {deletingId === c.id
              ? "جاري الحذف..."
              : confirmDelete === c.id
                ? "اضغط مرة أخرى للحذف"
                : "حذف"}
          </button>
        </div>
      </td>
    </tr>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold text-white"
          : "rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-muted)] transition hover:bg-[var(--color-background)]"
      }
    >
      {children}
    </button>
  );
}

export function CoursesManageList({
  courses,
  subCategoryMeta,
}: {
  courses: CourseRow[];
  subCategoryMeta: Record<string, SubCategoryMeta>;
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("all");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());

  const categoryOptions = useMemo(() => {
    const map = new Map<string, { id: string; label: string; count: number }>();
    for (const c of courses) {
      const id = c.category?.id ?? NO_CATEGORY_KEY;
      const label = c.category ? (c.category.nameAr ?? c.category.name) : "بدون قسم";
      const prev = map.get(id);
      map.set(id, { id, label, count: (prev?.count ?? 0) + 1 });
    }
    return [...map.values()];
  }, [courses]);

  const subcategoryOptions = useMemo(() => {
    if (selectedCategoryId === "all") return [];
    const map = new Map<string, { id: string; label: string; count: number }>();
    for (const c of courses) {
      const catId = c.category?.id ?? NO_CATEGORY_KEY;
      if (catId !== selectedCategoryId) continue;
      const id = c.subcategory?.id ?? NO_SUBCATEGORY_KEY;
      const label = c.subcategory ? (c.subcategory.nameAr ?? c.subcategory.name) : "بدون قسم فرعي";
      const prev = map.get(id);
      map.set(id, { id, label, count: (prev?.count ?? 0) + 1 });
    }
    return [...map.values()];
  }, [courses, selectedCategoryId]);

  useEffect(() => {
    if (selectedCategoryId === "all") {
      setSelectedSubcategoryId("all");
      return;
    }
    const exists = subcategoryOptions.some((opt) => opt.id === selectedSubcategoryId);
    if (!exists) setSelectedSubcategoryId("all");
  }, [selectedCategoryId, selectedSubcategoryId, subcategoryOptions]);

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return courses.filter((c) => {
      const titleAr = (c.titleAr ?? "").toLowerCase();
      const titleEn = (c.title ?? "").toLowerCase();
      const textMatch = !q || titleAr.includes(q) || titleEn.includes(q);
      if (!textMatch) return false;

      const catId = c.category?.id ?? NO_CATEGORY_KEY;
      if (selectedCategoryId !== "all" && catId !== selectedCategoryId) return false;

      const subId = c.subcategory?.id ?? NO_SUBCATEGORY_KEY;
      if (selectedSubcategoryId !== "all" && subId !== selectedSubcategoryId) return false;

      if (selectedStatus === "published" && !c.isPublished) return false;
      if (selectedStatus === "draft" && c.isPublished) return false;

      return true;
    });
  }, [courses, searchQuery, selectedCategoryId, selectedSubcategoryId, selectedStatus]);

  const groupedByCategoryAndSub = useMemo(() => {
    const byCategory = new Map<
      string,
      {
        key: string;
        title: string;
        courses: CourseRow[];
        subGroups: Map<string, { key: string; title: string; depth: number; courses: CourseRow[] }>;
      }
    >();

    const orderedCategoryKeys: string[] = [];
    for (const c of filteredCourses) {
      const catKey = c.category?.id ?? NO_CATEGORY_KEY;
      if (!byCategory.has(catKey)) {
        orderedCategoryKeys.push(catKey);
        byCategory.set(catKey, {
          key: catKey,
          title: c.category ? (c.category.nameAr ?? c.category.name) : "بدون قسم",
          courses: [],
          subGroups: new Map(),
        });
      }
      const cat = byCategory.get(catKey)!;
      cat.courses.push(c);
      const subKey = c.subcategory?.id ?? NO_SUBCATEGORY_KEY;
      if (!cat.subGroups.has(subKey)) {
        cat.subGroups.set(subKey, {
          key: subKey,
          title: c.subcategory ? (c.subcategory.nameAr ?? c.subcategory.name) : "بدون قسم فرعي",
          depth: c.subcategoryDepth ?? 0,
          courses: [],
        });
      }
      cat.subGroups.get(subKey)!.courses.push(c);
    }

    const metaMap = new Map<string, SubCategoryMeta>(Object.entries(subCategoryMeta).map(([k, v]) => [k, v]));
    const treeOrderByCategory = new Map<string, Array<{ key: string; depth: number; title: string }>>();
    for (const categoryKey of orderedCategoryKeys) {
      if (categoryKey === NO_CATEGORY_KEY) continue;
      const byParent = new Map<string, string[]>();
      for (const m of metaMap.values()) {
        if (m.categoryId !== categoryKey) continue;
        const p = m.parentId || "__root__";
        if (!byParent.has(p)) byParent.set(p, []);
        byParent.get(p)!.push(m.id);
      }
      for (const [p, ids] of byParent.entries()) {
        ids.sort((a, b) => (metaMap.get(a)?.label ?? "").localeCompare(metaMap.get(b)?.label ?? "", "ar"));
        byParent.set(p, ids);
      }
      const order: Array<{ key: string; depth: number; title: string }> = [];
      const walk = (parentKey: string, depth: number) => {
        const ids = byParent.get(parentKey) ?? [];
        for (const id of ids) {
          const m = metaMap.get(id);
          if (!m) continue;
          order.push({ key: id, depth, title: m.label });
          walk(id, depth + 1);
        }
      };
      walk("__root__", 0);
      treeOrderByCategory.set(categoryKey, order);
    }

    return orderedCategoryKeys.map((categoryKey) => {
      const cat = byCategory.get(categoryKey)!;
      const orderedGroups: Array<{ key: string; title: string; depth: number; courses: CourseRow[] }> = [];
      const treeOrder = treeOrderByCategory.get(categoryKey) ?? [];
      const seen = new Set<string>();

      for (const node of treeOrder) {
        const g = cat.subGroups.get(node.key);
        if (!g) continue;
        orderedGroups.push({ ...g, depth: node.depth, title: node.title || g.title });
        seen.add(node.key);
      }

      for (const [subKey, g] of cat.subGroups.entries()) {
        if (seen.has(subKey)) continue;
        if (subKey === NO_SUBCATEGORY_KEY) continue;
        orderedGroups.push(g);
      }

      const noSub = cat.subGroups.get(NO_SUBCATEGORY_KEY);
      if (noSub) orderedGroups.push(noSub);

      return {
        key: cat.key,
        title: cat.title,
        courseCount: cat.courses.length,
        groups: orderedGroups,
      };
    });
  }, [filteredCourses, subCategoryMeta]);

  useEffect(() => {
    if (groupedByCategoryAndSub.length === 0) return;
    setExpandedCategories((prev) => {
      if (prev.size > 0) return prev;
      return new Set([groupedByCategoryAndSub[0].key]);
    });
  }, [groupedByCategoryAndSub]);

  useEffect(() => {
    if (groupedByCategoryAndSub.length === 0) return;
    setExpandedSubcategories((prev) => {
      if (prev.size > 0) return prev;
      const initial = new Set<string>();
      for (const category of groupedByCategoryAndSub) {
        const first = category.groups[0];
        if (first) initial.add(`${category.key}:${first.key}`);
      }
      return initial;
    });
  }, [groupedByCategoryAndSub]);

  const totalFiltered = filteredCourses.length;

  async function handleDelete(id: string) {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    setDeletingId(id);
    const res = await fetch(`/api/dashboard/courses/${id}`, { method: "DELETE" });
    setDeletingId(null);
    setConfirmDelete(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "فشل حذف الدورة");
      return;
    }
    router.refresh();
  }

  if (courses.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
        <p className="text-[var(--color-muted)]">
          لا توجد دورات.{" "}
          <Link href="/dashboard/courses/new" className="text-[var(--color-primary)] hover:underline">
            إنشاء دورة جديدة
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="course-search" className="sr-only">
            بحث عن اسم الكورس
          </label>
          <input
            id="course-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث عن اسم الكورس..."
            className="min-w-[220px] max-w-md flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategoryId("all");
              setSelectedSubcategoryId("all");
              setSelectedStatus("all");
            }}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-muted)] hover:bg-[var(--color-background)]"
          >
            مسح الفلاتر
          </button>
          <span className="text-sm text-[var(--color-muted)]">
            {totalFiltered} من {courses.length}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[var(--color-muted)]">القسم:</span>
            <FilterChip active={selectedCategoryId === "all"} onClick={() => setSelectedCategoryId("all")}>
              الكل
            </FilterChip>
            {categoryOptions.map((cat) => (
              <FilterChip
                key={cat.id}
                active={selectedCategoryId === cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
              >
                {cat.label} ({cat.count})
              </FilterChip>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[var(--color-muted)]">القسم الفرعي:</span>
            <FilterChip active={selectedSubcategoryId === "all"} onClick={() => setSelectedSubcategoryId("all")}>
              الكل
            </FilterChip>
            {selectedCategoryId === "all" ? (
              <span className="text-xs text-[var(--color-muted)]">
                اختر قسمًا أولاً لعرض أقسامه الفرعية
              </span>
            ) : (
              subcategoryOptions.map((sub) => (
                <FilterChip
                  key={sub.id}
                  active={selectedSubcategoryId === sub.id}
                  onClick={() => setSelectedSubcategoryId(sub.id)}
                >
                  {sub.label} ({sub.count})
                </FilterChip>
              ))
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[var(--color-muted)]">الحالة:</span>
            <FilterChip active={selectedStatus === "all"} onClick={() => setSelectedStatus("all")}>
              الكل
            </FilterChip>
            <FilterChip active={selectedStatus === "published"} onClick={() => setSelectedStatus("published")}>
              منشورة
            </FilterChip>
            <FilterChip active={selectedStatus === "draft"} onClick={() => setSelectedStatus("draft")}>
              غير منشورة
            </FilterChip>
          </div>
        </div>
      </div>

      {totalFiltered === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
          <p className="text-[var(--color-muted)]">لا توجد دورات تطابق البحث.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedByCategoryAndSub.map((category) => {
            const isCategoryExpanded = expandedCategories.has(category.key);
            return (
            <div
              key={category.key}
              className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]"
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedCategories((prev) => {
                    const next = new Set(prev);
                    if (next.has(category.key)) next.delete(category.key);
                    else next.add(category.key);
                    return next;
                  })
                }
                className="flex w-full items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-background)]/50 px-4 py-3 text-right"
                aria-expanded={isCategoryExpanded}
              >
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-foreground)]">{category.title}</h3>
                  <p className="mt-0.5 text-sm text-[var(--color-muted)]">{category.courseCount} دورة</p>
                </div>
                <span className="text-lg text-[var(--color-muted)]">{isCategoryExpanded ? "▾" : "▸"}</span>
              </button>

              {isCategoryExpanded && (
                <div className="space-y-4 p-3">
                  {category.groups.map((group) => {
                    const groupKey = `${category.key}:${group.key}`;
                    const isSubExpanded = expandedSubcategories.has(groupKey);
                    return (
                      <section
                        key={groupKey}
                        className="overflow-hidden rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)]/35"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedSubcategories((prev) => {
                              const next = new Set(prev);
                              if (next.has(groupKey)) next.delete(groupKey);
                              else next.add(groupKey);
                              return next;
                            })
                          }
                          className="flex w-full items-center justify-between gap-3 border-b border-[var(--color-border)]/80 px-3 py-2 text-right"
                          aria-expanded={isSubExpanded}
                        >
                          <div
                            className="flex min-w-0 items-center gap-2"
                            style={{ marginInlineStart: `${Math.max(0, group.depth) * 12}px` }}
                          >
                            <span className="text-sm font-semibold text-[var(--color-foreground)]">{group.title}</span>
                            <span className="text-xs text-[var(--color-muted)]">({group.courses.length})</span>
                          </div>
                          <span className="text-sm text-[var(--color-muted)]">{isSubExpanded ? "▾" : "▸"}</span>
                        </button>
                        {isSubExpanded && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-right">
                              <thead>
                                <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]/30">
                                  <th className="p-3 text-sm font-semibold text-[var(--color-foreground)]">الدورة</th>
                                  <th className="p-3 text-sm font-semibold text-[var(--color-foreground)]">الحصص</th>
                                  <th className="p-3 text-sm font-semibold text-[var(--color-foreground)]">المسجلون</th>
                                  <th className="p-3 text-sm font-semibold text-[var(--color-foreground)]">السعر</th>
                                  <th className="p-3 text-sm font-semibold text-[var(--color-foreground)]">الحالة</th>
                                  <th className="p-3 text-sm font-semibold text-[var(--color-foreground)]">إجراءات</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.courses.map((course) => (
                                  <CourseTableRow
                                    key={course.id}
                                    c={course}
                                    deletingId={deletingId}
                                    confirmDelete={confirmDelete}
                                    onDelete={handleDelete}
                                  />
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
              )}
            </div>
          );})}
        </div>
      )}
    </div>
  );
}
