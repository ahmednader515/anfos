import { unstable_noStore } from "next/cache";
import { getCoursesPublished, getTeacherIdsExcludedFromPublicCourseLists, getUserById } from "@/lib/db";
import { redirect } from "next/navigation";
import { TeacherCoursesSearch, type TeacherCourseListItem } from "./TeacherCoursesSearch";

/** عدم تخزين الصفحة مؤقتاً — الكورسات الجديدة والمحذوفة تظهر فوراً */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "الدورات | منصتي التعليمية",
  description: "تصفح جميع الدورات المتاحة والبدء في التعلم",
};

type Props = { searchParams: Promise<{ category?: string; teacher?: string }> };

export default async function CoursesPage({ searchParams }: Props) {
  unstable_noStore();
  const { category: categorySlug, teacher: teacherId } = await searchParams;
  let courses: Awaited<ReturnType<typeof getCoursesPublished>> = [];
  try {
    courses = await getCoursesPublished(true);
  } catch {
    // DB not connected
  }

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

  let filtered =
    categorySlug?.trim()
      ? courses.filter((c) => (c as { category?: { slug?: string } }).category?.slug === categorySlug.trim())
      : courses;

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
    categorySlug && filtered.length > 0
      ? ((filtered[0] as { category?: { nameAr?: string; name?: string } }).category?.nameAr ??
         (filtered[0] as { category?: { name?: string } }).category?.name)
      : null;

  const pageTitle = teacherName
    ? `دورات ${teacherName}`
    : categoryName
      ? `دورات قسم ${categoryName}`
      : "جميع الدورات";

  const pageSubtitle = teacherName
    ? "الدورات المنشورة التي يقدّمها هذا المدرس على المنصة"
    : categoryName
      ? `دورات القسم المحدد فقط`
      : "اختر الدورة المناسبة وابدأ التعلم خطوة بخطوة";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-[var(--color-foreground)]">{pageTitle}</h1>
        <p className="mt-2 text-[var(--color-muted)]">{pageSubtitle}</p>
      </div>

      {filtered.length > 0 ? (
        <TeacherCoursesSearch
          courses={filtered as TeacherCourseListItem[]}
          groupByCategory={!!tid}
        />
      ) : (
        <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 p-12 text-center">
          <p className="text-[var(--color-muted)]">
            {tid
              ? "لا توجد دورات منشورة لهذا المدرس حالياً."
              : categorySlug?.trim()
                ? "لا توجد دورات في هذا القسم حالياً."
                : "لا توجد دورات منشورة حالياً. تأكد من إعداد قاعدة البيانات وتشغيل البذرة (seed)."}
          </p>
        </div>
      )}
    </div>
  );
}
