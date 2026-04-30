import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { CategoriesManager } from "./CategoriesManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardCategoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER") {
    redirect("/dashboard");
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--color-foreground)]">إدارة الأقسام والأقسام الفرعية</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          إنشاء / تعديل / حذف الأقسام الرئيسية والأقسام الفرعية (مع الصور والترتيب).
        </p>
      </div>
      <CategoriesManager />
    </div>
  );
}

