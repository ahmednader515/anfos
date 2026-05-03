import { unstable_noStore } from "next/cache";
import {
  getCoursesPublished,
  getSubCategoriesPublicByParent,
  getSubCategoryBySlug,
  getTeacherIdsExcludedFromPublicCourseLists,
  getUserById,
} from "@/lib/db";
import { redirect } from "next/navigation";
import { TeacherCoursesSearch, type TeacherCourseListItem } from "./TeacherCoursesSearch";
import Link from "next/link";

/** عدم تخزين الصفحة مؤقتاً — الكورسات الجديدة والمحذوفة تظهر فوراً */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "الدورات | منصتي التعليمية",
  description: "تصفح جميع الدورات المتاحة والبدء في التعلم",
};

type Props = { searchParams: Promise<{ category?: string; subcategory?: string; teacher?: string }> };

export default async function CoursesPage({ searchParams }: Props) {
  unstable_noStore();
  const { category: categorySlug, subcategory: subcategorySlug, teacher: teacherId } = await searchParams;
  let courses: Awaited<ReturnType<typeof getCoursesPublished>> = [];
  try {
    courses = await getCoursesPublished(true);
  } catch {
    // DB not connected
  }

  const selectedSub = subcategorySlug?.trim() ? await getSubCategoryBySlug(subcategorySlug.trim()).catch(() => null) : null;
  const selectedSubId = selectedSub ? String((selectedSub as { id?: unknown }).id ?? "") : "";
  const selectedSubCategoryId = selectedSub
    ? String((selectedSub as { categoryId?: unknown }).categoryId ?? (selectedSub as { category_id?: unknown }).category_id ?? "")
    : "";
  const childSubCategories = selectedSubId
    ? await getSubCategoriesPublicByParent({ categoryId: selectedSubCategoryId, parentSubCategoryId: selectedSubId }).catch(() => [])
    : [];

  const hideTeacherCreators = await getTeacherIdsExcludedFromPublicCourseLists();

  let teacherName: string | null = null;
  const tid = teacherId?.trim();
  if (tid) {
    const u = await getUserById(tid).catch(() => null);
    if (!u || u.role !== "TEACHER") {
      redirect("/courses");
    }
    teacherName = u.name ?? null;
  }

  let filtered = courses;
  if (subcategorySlug?.trim()) {
    filtered = filtered.filter(
      (c) => (c as { subcategory?: { slug?: string } }).subcategory?.slug === subcategorySlug.trim(),
    );
  } else if (categorySlug?.trim()) {
    filtered = filtered.filter(
      (c) => (c as { category?: { slug?: string } }).category?.slug === categorySlug.trim(),
    );
  }

  if (tid) {
    filtered = filtered.filter((c) => {
      const row = c as { createdById?: string | null; created_by_id?: string | null };
      const creator = row.createdById ?? row.created_by_id ?? null;
      return creator === tid;
    });
  } else if (hideTeacherCreators.size > 0) {
    filtered = filtered.filter((c) => {
      const row = c as { createdById?: string | null; created_by_id?: string | null };
      const creator = row.createdById ?? row.created_by_id ?? null;
      return !creator || !hideTeacherCreators.has(creator);
    });
  }

  const categoryName =
    !subcategorySlug && categorySlug && filtered.length > 0
      ? ((filtered[0] as { category?: { nameAr?: string; name?: string } }).category?.nameAr ??
         (filtered[0] as { category?: { name?: string } }).category?.name)
      : null;
  const subcategoryName =
    subcategorySlug && filtered.length > 0
      ? ((filtered[0] as { subcategory?: { nameAr?: string; name?: string } }).subcategory?.nameAr ??
         (filtered[0] as { subcategory?: { name?: string } }).subcategory?.name)
      : null;

  const pageTitle = teacherName
    ? `دورات ${teacherName}`
    : subcategoryName
      ? `دورات قسم فرعي ${subcategoryName}`
    : categoryName
      ? `دورات قسم ${categoryName}`
      : "جميع الدورات";

  const pageSubtitle = teacherName
    ? "الدورات المنشورة التي يقدّمها هذا المدرب على المنصة"
    : subcategoryName
      ? `دورات القسم الفرعي المحدد فقط`
    : categoryName
      ? `دورات القسم المحدد فقط`
      : "اختر الدورة المناسبة وابدأ التعلم خطوة بخطوة";

  return (
    <div className="mx-auto min-w-0 max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-[var(--color-foreground)]">{pageTitle}</h1>
        <p className="mt-2 text-[var(--color-muted)]">{pageSubtitle}</p>
      </div>

      {subcategorySlug?.trim() && childSubCategories.length > 0 ? (
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">الأقسام الفرعية</h2>
          <div className="grid w-full min-w-0 gap-3 [grid-template-columns:repeat(2,minmax(0,1fr))] sm:gap-4 lg:[grid-template-columns:repeat(4,minmax(0,1fr))]">
            {childSubCategories.slice(0, 12).map((sc) => {
              const title = String((sc as { nameAr?: unknown }).nameAr ?? (sc as { name_ar?: unknown }).name_ar ?? sc.name ?? "").trim();
              const scSlug = String((sc as { slug?: unknown }).slug ?? "").trim();
              const img =
                (sc as { imageUrl?: string | null }).imageUrl ??
                (sc as { image_url?: string | null }).image_url ??
                null;
              const href = scSlug ? `/courses?subcategory=${encodeURIComponent(scSlug)}` : "/courses";
              return (
                <Link
                  key={String((sc as { id?: unknown }).id ?? "")}
                  href={href}
                  className="group relative block min-w-0 max-w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-hover)]"
                >
                  <div className="aspect-[16/10] w-full bg-black/5">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt=""
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-primary-light)]/30">
                        <span className="text-4xl opacity-60">📚</span>
                      </div>
                    )}
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-emerald-900/80 via-emerald-900/35 to-transparent" aria-hidden />
                  <div className="absolute inset-x-0 bottom-0 z-10 p-3">
                    <div className="flex items-end justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-extrabold text-white drop-shadow sm:text-base">
                        {title}
                      </p>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/25 bg-black/10 text-lg font-bold leading-none text-white drop-shadow transition group-hover:bg-black/20">
                        ←
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {filtered.length > 0 ? (
        <TeacherCoursesSearch
          courses={filtered as TeacherCourseListItem[]}
          groupByCategory={!!tid || !!categorySlug?.trim() || !!subcategorySlug?.trim()}
          groupBySubcategory={!tid && !subcategorySlug?.trim() && !!categorySlug?.trim()}
        />
      ) : (
        <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 p-12 text-center">
          <p className="text-[var(--color-muted)]">
            {tid
              ? "لا توجد دورات منشورة لهذا المدرب حالياً."
              : subcategorySlug?.trim()
                ? "لا توجد دورات في هذا القسم الفرعي حالياً."
                : categorySlug?.trim()
                ? "لا توجد دورات في هذا القسم حالياً."
                : "لا توجد دورات منشورة حالياً. تأكد من إعداد قاعدة البيانات وتشغيل البذرة (seed)."}
          </p>
        </div>
      )}
    </div>
  );
}
