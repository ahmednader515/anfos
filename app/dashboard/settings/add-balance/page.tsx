import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getHomepageSettings } from "@/lib/db";
import { AddBalanceSettingsForm } from "./AddBalanceSettingsForm";

export default async function DashboardAddBalanceSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const settings = await getHomepageSettings();

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-foreground)]">تعديل طرق الدفع في صفحة إضافة الرصيد</h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        من هنا يمكنك تعديل كل ما يظهر للطالب في صفحة إضافة الرصيد: الرقم الذي يحوّل عليه، النصوص، ورقم واتساب استقبال صورة التأكيد.
      </p>
      <AddBalanceSettingsForm initialSettings={settings} />
    </div>
  );
}
