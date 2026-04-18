"use client";

import Link from "next/link";
import { useState, useMemo } from "react";

type Attempt = {
  userId: string;
  quizId: string;
  userName: string | null;
  userEmail: string | null;
  courseTitle: string | null;
  quizTitle: string | null;
  score: number;
  totalQuestions: number;
  createdAt: string;
};

type CourseInfo = { title: string; titleAr: string | null };

type EnrollmentInfo = { course: CourseInfo };

type StudentWithDetails = {
  student: { id: string; name: string | null; email: string | null };
  enrollments: EnrollmentInfo[];
  userAttempts: Attempt[];
};

type Props = {
  studentsCount: number;
  totalEnrollments: number;
  attemptsCount: number;
  totalEarnings: number;
  attempts: Attempt[];
  studentsWithDetails: StudentWithDetails[];
  /** نص يُلحق بعنوان الصفحة، مثال: «(كورساتك)» للمدرس */
  titleSuffix?: string;
};

const formatDate = (d: Date | string) =>
  new Intl.DateTimeFormat("ar-EG", { dateStyle: "short", timeStyle: "short" }).format(
    typeof d === "string" ? new Date(d) : d
  );

export default function StatisticsContent({
  studentsCount,
  totalEnrollments,
  attemptsCount,
  totalEarnings,
  attempts,
  studentsWithDetails,
  titleSuffix = "",
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const trimmed = searchQuery.trim().toLowerCase();

  const filteredAttempts = useMemo(() => {
    if (!trimmed) return attempts;
    return attempts.filter((a) => {
      const name = (a.userName ?? "").toLowerCase();
      const email = (a.userEmail ?? "").toLowerCase();
      return name.includes(trimmed) || email.includes(trimmed);
    });
  }, [attempts, trimmed]);

  const filteredStudentsWithDetails = useMemo(() => {
    if (!trimmed) return studentsWithDetails;
    return studentsWithDetails.filter((swd) => {
      const name = (swd.student.name ?? "").toLowerCase();
      const email = (swd.student.email ?? "").toLowerCase();
      return name.includes(trimmed) || email.includes(trimmed);
    });
  }, [studentsWithDetails, trimmed]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-[var(--color-foreground)]">
          إحصائيات الطلاب{titleSuffix ? ` ${titleSuffix}` : ""}
        </h2>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          ← لوحة التحكم
        </Link>
      </div>

      {/* بحث بالاسم */}
      <div className="mb-6">
        <label htmlFor="student-search" className="mb-2 block text-sm font-medium text-[var(--color-foreground)]">
          البحث عن طالب
        </label>
        <input
          id="student-search"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="اسم الطالب أو البريد الإلكتروني..."
          className="w-full max-w-md rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          dir="rtl"
        />
        {trimmed && (
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            عرض {filteredStudentsWithDetails.length} طالب، {filteredAttempts.length} محاولة اختبار
          </p>
        )}
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-sm text-[var(--color-muted)]">عدد الطلاب</p>
          <p className="text-2xl font-bold text-[var(--color-foreground)]">{studentsCount}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-sm text-[var(--color-muted)]">إجمالي التسجيلات في الكورسات</p>
          <p className="text-2xl font-bold text-[var(--color-foreground)]">{totalEnrollments}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-sm text-[var(--color-muted)]">محاولات الاختبارات</p>
          <p className="text-2xl font-bold text-[var(--color-foreground)]">{attemptsCount}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-primary)]/30 bg-[var(--color-primary-light)]/20 p-4">
          <p className="text-sm text-[var(--color-muted)]">إجمالي أرباح المنصة</p>
          <p className="text-2xl font-bold text-[var(--color-primary)]">{totalEarnings.toFixed(2)} ج.م</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">من رصيد مدفوع من الطلاب للتسجيل في الكورسات</p>
        </div>
      </div>

      <section className="mb-8 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
          درجات الاختبارات
        </h3>
        {filteredAttempts.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            {trimmed ? "لا توجد نتائج تطابق البحث." : "لا توجد محاولات مسجّلة حتى الآن."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="pb-2 text-right font-medium text-[var(--color-foreground)]">الطالب</th>
                  <th className="pb-2 text-right font-medium text-[var(--color-foreground)]">البريد</th>
                  <th className="pb-2 text-right font-medium text-[var(--color-foreground)]">الكورس</th>
                  <th className="pb-2 text-right font-medium text-[var(--color-foreground)]">الاختبار</th>
                  <th className="pb-2 text-right font-medium text-[var(--color-foreground)]">النتيجة</th>
                  <th className="pb-2 text-right font-medium text-[var(--color-foreground)]">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttempts.map((a) => (
                  <tr key={`${a.userId}-${a.quizId}-${a.createdAt}`} className="border-b border-[var(--color-border)]/50">
                    <td className="py-2 text-[var(--color-foreground)]">{a.userName}</td>
                    <td className="py-2 text-[var(--color-muted)]">{a.userEmail}</td>
                    <td className="py-2 text-[var(--color-foreground)]">{a.courseTitle}</td>
                    <td className="py-2 text-[var(--color-foreground)]">{a.quizTitle}</td>
                    <td className="py-2 text-[var(--color-foreground)]">
                      {a.score} / {a.totalQuestions}
                    </td>
                    <td className="py-2 text-[var(--color-muted)]">{formatDate(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
          الطلاب والتسجيلات
        </h3>
        {filteredStudentsWithDetails.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            {trimmed ? "لا توجد نتائج تطابق البحث." : "لا يوجد طلاب مسجّلون."}
          </p>
        ) : (
          <ul className="space-y-4">
            {filteredStudentsWithDetails.map(({ student: s, enrollments, userAttempts }) => (
              <li
                key={s.id}
                className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-[var(--color-foreground)]">{s.name}</p>
                    <p className="text-sm text-[var(--color-muted)]">{s.email}</p>
                  </div>
                  <div className="flex gap-3 text-sm text-[var(--color-muted)]">
                    <span>مسجّل في {enrollments.length} كورس</span>
                    <span>محاولات اختبارات: {userAttempts.length}</span>
                  </div>
                </div>
                {enrollments.length > 0 && (
                  <p className="mt-2 text-sm text-[var(--color-foreground)]">
                    الكورسات: {enrollments.map((e) => e.course.titleAr ?? e.course.title).join("، ")}
                  </p>
                )}
                {userAttempts.length > 0 && (
                  <div className="mt-2 text-xs text-[var(--color-muted)]">
                    آخر النتائج:{" "}
                    {userAttempts.slice(0, 3).map((a) => `${a.quizTitle} (${a.score}/${a.totalQuestions})`).join(" — ")}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
