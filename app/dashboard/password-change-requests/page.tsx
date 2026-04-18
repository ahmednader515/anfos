import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getPasswordChangeRequests } from "@/lib/db";
import { PasswordChangeRequestsList } from "./PasswordChangeRequestsList";

export default async function DashboardPasswordChangeRequestsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN") redirect("/dashboard");

  let requests: Awaited<ReturnType<typeof getPasswordChangeRequests>> = [];
  try {
    requests = await getPasswordChangeRequests();
  } catch {
    // جدول غير موجود أو خطأ — نعرض قائمة فارغة
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-foreground)]">
        طلبات تغيير بيانات حسابات المستخدمين
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        الطلبات التي أرسلها المستخدمون من صفحة «نسيان كلمة المرور». تنفيذ الطلب (تطبيق كلمة المرور الجديدة) للأدمن فقط.
      </p>
      <PasswordChangeRequestsList initialRequests={requests} isAdmin={role === "ADMIN"} isStaff />
    </div>
  );
}
