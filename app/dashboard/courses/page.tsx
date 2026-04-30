import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getCoursesWithCounts, getCoursesWithCountsForCreator, getSubCategoriesForDashboard } from "@/lib/db";
import { CoursesManageList } from "./CoursesManageList";

export default async function DashboardCoursesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER") {
    redirect("/dashboard");
  }

  const courses =
    role === "TEACHER"
      ? await getCoursesWithCountsForCreator(session.user.id)
      : await getCoursesWithCounts();

  const subcats = await getSubCategoriesForDashboard(session.user.id, role, null, undefined).catch(() => []);
  const subMap = new Map<
    string,
    { id: string; parentId: string | null; label: string; categoryId: string }
  >(
    subcats.map((r) => {
      const row = r as unknown as Record<string, unknown>;
      const id = String(row.id ?? "");
      const parentId = row.parentSubcategoryId
        ? String(row.parentSubcategoryId)
        : row.parent_subcategory_id
          ? String(row.parent_subcategory_id)
          : null;
      const categoryId = String(row.categoryId ?? row.category_id ?? "").trim();
      const label =
        String(row.nameAr ?? row.name_ar ?? row.name ?? "").trim() || "قسم فرعي";
      return [id, { id, parentId, label, categoryId }];
    }),
  );

  function computeSubPath(subId: string): { path: string; depth: number } {
    const parts: string[] = [];
    let cur: string | null = subId;
    let depth = 0;
    let guard = 0;
    while (cur && guard < 50) {
      const n = subMap.get(cur);
      if (!n) break;
      parts.push(n.label);
      cur = n.parentId;
      guard++;
    }
    parts.reverse();
    depth = Math.max(0, parts.length - 1);
    return { path: parts.join(" / "), depth };
  }

  const coursesPlain = courses.map((c) => {
    const row = c as Record<string, unknown>;
    const cat = row.category as { id: string; name: string; nameAr?: string | null; slug: string } | null | undefined;
    const sc = row.subcategory as { id: string; name: string; nameAr?: string | null; slug: string; categoryId: string } | null | undefined;
    const rawImg = row.imageUrl ?? row.image_url;
    const imageUrl: string | null = rawImg !== null && rawImg !== undefined && typeof rawImg === "string" ? rawImg : null;
    const subId = sc?.id ? String(sc.id) : "";
    const subMeta = subId ? computeSubPath(subId) : null;
    return {
      id: String(row.id ?? ""),
      title: String(row.title ?? ""),
      titleAr: String(row.titleAr ?? row.title_ar ?? ""),
      slug: String(row.slug ?? ""),
      isPublished: Boolean(row.isPublished ?? row.is_published ?? false),
      price: Number(row.price ?? 0),
      imageUrl,
      lessonsCount: Number(row.lessonsCount ?? 0),
      enrollmentsCount: Number(row.enrollmentsCount ?? 0),
      category: cat
        ? { id: cat.id, name: cat.name, nameAr: cat.nameAr ?? null }
        : null,
      subcategory: sc
        ? { id: sc.id, name: sc.name, nameAr: sc.nameAr ?? null }
        : null,
      subcategoryPath: subMeta?.path ?? null,
      subcategoryDepth: subMeta?.depth ?? 0,
    };
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-[var(--color-foreground)]">
          {role === "TEACHER" ? "كورساتي" : "إدارة الكورسات"}
        </h2>
        <Link
          href="/dashboard/courses/new"
          className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
        >
          + إنشاء دورة جديدة
        </Link>
      </div>
      <CoursesManageList
        courses={coursesPlain}
        subCategoryMeta={Object.fromEntries([...subMap.entries()])}
      />
    </div>
  );
}
