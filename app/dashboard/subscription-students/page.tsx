import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { listUserPlatformSubscriptionsForAdmin } from "@/lib/db";
import { SubscriptionStudentsClient, type SubscriptionStudentRow } from "./SubscriptionStudentsClient";

export default async function SubscriptionStudentsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  let rows: SubscriptionStudentRow[] = [];
  let totalSubscriptionsRevenue = 0;
  try {
    const list = await listUserPlatformSubscriptionsForAdmin();
    rows = list.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.userName,
      userEmail: r.userEmail,
      planId: r.planId,
      planName: r.planName,
      pricePaid: r.pricePaid,
      expiresAtIso: r.expiresAtIso,
      createdAtIso: r.createdAtIso,
      isActive: r.isActive,
    }));
    totalSubscriptionsRevenue = rows.reduce((sum, r) => sum + Number(r.pricePaid || 0), 0);
  } catch {
    rows = [];
    totalSubscriptionsRevenue = 0;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          ← العودة للوحة التحكم
        </Link>
        <h2 className="mt-4 text-xl font-bold text-[var(--color-foreground)]">إدارة الطلاب المشتركين</h2>
        <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted)]">
          عرض من اشترك في باقات المنصة، وتعديل تاريخ انتهاء الاشتراك، أو حذف السجل (يُلغي الوصول الفوري عند الحذف أو عند
          جعل التاريخ في الماضي).
        </p>
      </div>
      <SubscriptionStudentsClient initialRows={rows} totalRevenue={totalSubscriptionsRevenue} />
    </div>
  );
}
