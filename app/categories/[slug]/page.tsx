import { unstable_noStore } from "next/cache";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCategories,
  getCategoryBySlug,
  getCoursesPublished,
  getSubCategoriesPublicByParent,
  getTeacherIdsExcludedFromPublicCourseLists,
} from "@/lib/db";
import { BrowseImageCard } from "@/components/BrowseImageCard";
import { TeacherCoursesSearch, type TeacherCourseListItem } from "@/app/courses/TeacherCoursesSearch";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: Promise<{ slug: string }> };

export default async function CategoryPage({ params }: Props) {
  unstable_noStore();
  const { slug } = await params;
  const categorySlug = String(slug ?? "").trim();
  if (!categorySlug) notFound();
  const candidateSlugs = Array.from(
    new Set([
      categorySlug,
      (() => {
        try {
          return decodeURIComponent(categorySlug);
        } catch {
          return "";
        }
      })(),
      (() => {
        try {
          return decodeURIComponent(decodeURIComponent(categorySlug));
        } catch {
          return "";
        }
      })(),
      categorySlug.replace(/\//g, "-"),
    ].map((s) => s.trim()).filter(Boolean)),
  );

  let courses: Awaited<ReturnType<typeof getCoursesPublished>> = [];
  let category: Awaited<ReturnType<typeof getCategoryBySlug>> = null;
  try {
    for (const cand of candidateSlugs) {
      category = await getCategoryBySlug(cand);
      if (category) break;
    }
  } catch {
    category = null;
  }
  try {
    courses = await getCoursesPublished(true);
  } catch {
    courses = [];
  }

  if (!category) {
    try {
      const all = await getCategories();
      const lowerCandidates = new Set(candidateSlugs.map((s) => s.toLowerCase()));
      category =
        all.find((c) => lowerCandidates.has(String(c.slug ?? "").trim().toLowerCase())) ??
        null;
    } catch {
      category = null;
    }
  }
  if (!category) notFound();

  const categoryId = String(category.id ?? "").trim();
  const subCategories = categoryId
    ? await getSubCategoriesPublicByParent({ categoryId, parentSubCategoryId: null }).catch(() => [])
    : [];

  const hideTeacherCreators = await getTeacherIdsExcludedFromPublicCourseLists();
  const filteredCourses = courses
    .filter((c) => (c as { category?: { slug?: string } }).category?.slug === categorySlug)
    .filter((c) => {
      if (hideTeacherCreators.size === 0) return true;
      const row = c as { createdById?: string | null; created_by_id?: string | null };
      const creator = row.createdById ?? row.created_by_id ?? null;
      return !creator || !hideTeacherCreators.has(creator);
    });

  const title =
    String((category as { nameAr?: unknown }).nameAr ?? (category as { name_ar?: unknown }).name_ar ?? category.name ?? "").trim() ||
    "قسم";
  const description = String((category as { description?: unknown }).description ?? "").trim() || null;

  return (
    <div className="mx-auto min-w-0 max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-[var(--color-foreground)]">{title}</h1>
        <p className="mt-2 text-[var(--color-muted)]">
          {description || `تصفح الأقسام الفرعية والدورات المتاحة داخل قسم ${title}`}
        </p>
      </div>

      {subCategories.length > 0 ? (
        <section className="mb-12">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">الأقسام الفرعية</h2>
            <Link href="/courses" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
              عرض جميع الدورات
            </Link>
          </div>
          <div className="grid w-full min-w-0 gap-2 [grid-template-columns:repeat(2,minmax(0,1fr))] sm:gap-4 lg:[grid-template-columns:repeat(4,minmax(0,1fr))]">
            {subCategories.map((sc) => {
              const scTitle =
                String((sc as { nameAr?: unknown }).nameAr ?? (sc as { name_ar?: unknown }).name_ar ?? sc.name ?? "").trim() ||
                "قسم فرعي";
              const scSlug = String((sc as { slug?: unknown }).slug ?? "").trim();
              const scImage =
                (sc as { imageUrl?: string | null }).imageUrl ??
                (sc as { image_url?: string | null }).image_url ??
                null;
              const scDesc = String((sc as { description?: unknown }).description ?? "").trim() || null;
              const href = scSlug ? `/courses?subcategory=${encodeURIComponent(scSlug)}` : `/courses?category=${encodeURIComponent(categorySlug)}`;
              return (
                <BrowseImageCard
                  key={String((sc as { id?: unknown }).id ?? scSlug ?? scTitle)}
                  href={href}
                  title={scTitle}
                  imageUrl={scImage}
                  subtitle={scDesc}
                />
              );
            })}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-5 text-xl font-semibold text-[var(--color-foreground)]">الدورات داخل القسم</h2>
        {filteredCourses.length > 0 ? (
          <TeacherCoursesSearch
            courses={filteredCourses as TeacherCourseListItem[]}
            groupByCategory
            groupBySubcategory
          />
        ) : (
          <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 p-12 text-center">
            <p className="text-[var(--color-muted)]">لا توجد دورات في هذا القسم حالياً.</p>
          </div>
        )}
      </section>
    </div>
  );
}

