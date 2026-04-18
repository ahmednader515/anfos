import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { HomeworkSubmissionsList } from "./HomeworkSubmissionsList";

export default async function DashboardHomeworkPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const isStaff = session.user.role === "ADMIN" || session.user.role === "ASSISTANT_ADMIN";
  const isTeacher = session.user.role === "TEACHER";
  if (!isStaff && !isTeacher) redirect("/dashboard");

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-foreground)]">
        استلام واجبات الطلاب
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {isTeacher
          ? "عرض تسليمات الواجبات من طلابك في دوراتك فقط. ابحث باسم الطالب لتصفية النتائج."
          : "عرض تسليمات الواجبات من الطلاب حسب الدورة واسم الطالب. يمكنك البحث باسم الطالب لتصفية النتائج."}
      </p>
      <HomeworkSubmissionsList allowDeleteAll={isStaff} />
    </div>
  );
}
