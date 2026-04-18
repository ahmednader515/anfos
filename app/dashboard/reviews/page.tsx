import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ReviewsManage } from "./ReviewsManage";

export default async function DashboardReviewsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-foreground)]">
        إدارة تعليقات الطلاب
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        التعليقات تظهر في قسم «ماذا يقول الطلاب» في الصفحة الرئيسية. يمكنك إضافة تعليقات جديدة أو تعديل أو حذف الموجودة.
      </p>
      <ReviewsManage />
    </div>
  );
}
