"use client";

import { Fragment, useMemo, useState } from "react";
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

function SubCategoryDividerRow({ title, depth = 0 }: { title: string; depth?: number }) {
  return (
    <tr>
      <td colSpan={6} className="p-0">
        <div className="border-y border-[var(--color-border)] bg-[var(--color-background)]/40 px-4 py-2">
          <div className="flex items-center gap-3">
            <span
              className="text-sm font-semibold text-[var(--color-foreground)]"
              style={{ marginInlineStart: `${Math.max(0, depth) * 14}px` }}
            >
              {title}
            </span>
            <div className="h-px flex-1 bg-[var(--color-border)]/60" aria-hidden />
          </div>
        </div>
      </td>
    </tr>
  );
}

function subcategoryLabel(sc: CourseRow["subcategory"]): string {
  if (!sc) return "بدون قسم فرعي";
  const ar = (sc.nameAr ?? null)?.trim();
  if (ar) return ar;
  const n = sc.name?.trim();
  return n || "بدون قسم فرعي";
}

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
    <tr className="border-b border-[var(--color-border)] last:border-0">
      <td className="p-3">
        <div className="flex items-center gap-3">
          {c.imageUrl && (
            <img src={c.imageUrl} alt="" className="h-12 w-20 rounded object-cover" />
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

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => {
      const title = (c.titleAr ?? c.title ?? "").toLowerCase();
      const titleEn = (c.title ?? "").toLowerCase();
      return title.includes(q) || titleEn.includes(q);
    });
  }, [courses, searchQuery]);

  const byCategory = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, { title: string; courses: CourseRow[] }>();
    const noCatKey = "__none__";
    for (const c of filteredCourses) {
      const key = c.category ? c.category.id : noCatKey;
      if (!map.has(key)) {
        order.push(key);
        map.set(key, {
          title: c.category ? (c.category.nameAr ?? c.category.name) : "بدون قسم",
          courses: [],
        });
      }
      map.get(key)!.courses.push(c);
    }
    return order.map((key) => ({
      key,
      title: map.get(key)!.title,
      courses: map.get(key)!.courses,
    }));
  }, [filteredCourses]);

  const groupedByCategoryAndSub = useMemo(() => {
    const metaMap = new Map<string, SubCategoryMeta>(Object.entries(subCategoryMeta).map(([k, v]) => [k, v]));

    const buildTreeOrder = (categoryId: string) => {
      const byParent = new Map<string, string[]>();
      for (const m of metaMap.values()) {
        if (m.categoryId !== categoryId) continue;
        const p = m.parentId || "__root__";
        if (!byParent.has(p)) byParent.set(p, []);
        byParent.get(p)!.push(m.id);
      }
      for (const [p, ids] of byParent.entries()) {
        ids.sort((a, b) => (metaMap.get(a)?.label ?? "").localeCompare(metaMap.get(b)?.label ?? "", "ar"));
        byParent.set(p, ids);
      }
      const order: Array<{ id: string; depth: number; title: string }> = [];
      const walk = (parentKey: string, depth: number) => {
        const ids = byParent.get(parentKey) ?? [];
        for (const id of ids) {
          const m = metaMap.get(id);
          if (!m) continue;
          order.push({ id, depth, title: m.label });
          walk(id, depth + 1);
        }
      };
      walk("__root__", 0);
      return order;
    };

    return byCategory.map((section) => {
      // group courses by subcategory id (or none)
      const coursesBySub = new Map<string, CourseRow[]>();
      for (const c of section.courses) {
        const key = c.subcategory?.id?.trim() || "__no_sub__";
        if (!coursesBySub.has(key)) coursesBySub.set(key, []);
        coursesBySub.get(key)!.push(c);
      }

      // render full tree + also show "no subcategory" group if exists
      const categoryId = section.key === "__none__" ? "" : section.key;
      const tree = categoryId ? buildTreeOrder(categoryId) : [];

      const rows: Array<{ kind: "divider"; key: string; title: string; depth: number } | { kind: "course"; course: CourseRow }> = [];

      for (const node of tree) {
        rows.push({ kind: "divider", key: node.id, title: node.title, depth: node.depth });
        const nodeCourses = coursesBySub.get(node.id) ?? [];
        for (const c of nodeCourses) rows.push({ kind: "course", course: c });
      }

      const noSubCourses = coursesBySub.get("__no_sub__") ?? [];
      if (noSubCourses.length > 0) {
        rows.push({ kind: "divider", key: "__no_sub__", title: "بدون قسم فرعي", depth: 0 });
        for (const c of noSubCourses) rows.push({ kind: "course", course: c });
      }

      // If no tree nodes at all, keep previous behavior
      if (rows.length === 0) {
        const title = "بدون قسم فرعي";
        const depth = 0;
        rows.push({ kind: "divider", key: "__no_sub__", title, depth });
        for (const c of section.courses) rows.push({ kind: "course", course: c });
      }

      return { ...section, rows };
    });
  }, [byCategory, subCategoryMeta]);

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
        {searchQuery.trim() && (
          <span className="text-sm text-[var(--color-muted)]">
            {filteredCourses.length} من {courses.length}
          </span>
        )}
      </div>
      {filteredCourses.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
          <p className="text-[var(--color-muted)]">لا توجد دورات تطابق البحث.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedByCategoryAndSub.map(({ key, title, rows }) => (
            <div
              key={key}
              className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]"
            >
              <div className="border-b border-[var(--color-border)] bg-[var(--color-background)]/50 px-4 py-3">
                <h3 className="text-base font-semibold text-[var(--color-foreground)]">
                  {title}
                </h3>
                <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                  {rows.filter((r) => r.kind === "course").length} دورة
                </p>
              </div>
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
                  {rows.map((r) =>
                    r.kind === "divider" ? (
                      <SubCategoryDividerRow key={`d-${r.key}`} title={r.title} depth={r.depth} />
                    ) : (
                      <CourseTableRow
                        key={r.course.id}
                        c={r.course}
                        deletingId={deletingId}
                        confirmDelete={confirmDelete}
                        onDelete={handleDelete}
                      />
                    ),
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
