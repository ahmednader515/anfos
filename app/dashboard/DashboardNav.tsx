"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const baseClass =
  "rounded-[var(--radius-btn)] border px-4 py-2 text-sm font-medium transition";
const inactiveClass =
  "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-border)]/50";
const activeClass =
  "border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-primary)]";

function NavLink({
  href,
  children,
  exact = false,
}: {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
    >
      {children}
    </Link>
  );
}

export function DashboardNav({
  isAdmin,
  isAssistant,
  isTeacher,
}: {
  isAdmin: boolean;
  isAssistant: boolean;
  isTeacher: boolean;
}) {
  const isStaff = isAdmin || isAssistant;

  if (isTeacher) {
    return (
      <>
        <NavLink href="/dashboard/courses">إدارة كورساتي</NavLink>
        <NavLink href="/dashboard/courses/new" exact>
          إنشاء دورة
        </NavLink>
        <NavLink href="/dashboard/statistics">إحصائيات الطلاب</NavLink>
        <NavLink href="/dashboard/codes">إنشاء الأكواد</NavLink>
        <NavLink href="/dashboard/homework">واجبات الطلاب</NavLink>
        <NavLink href="/dashboard/messages">تواصل مع طلابي</NavLink>
        <NavLink href="/dashboard/live-streams">البثوث المباشرة</NavLink>
      </>
    );
  }

  if (!isStaff) {
    return (
      <>
        <NavLink href="/dashboard/messages">
          الرسائل الواردة
        </NavLink>
        <Link
          href="/courses"
          className={`${baseClass} ${inactiveClass}`}
        >
          الكورسات المتاحة
        </Link>
      </>
    );
  }

  return (
    <>
      <NavLink href="/dashboard/students">
        {isAdmin ? "الطلاب والحسابات" : "الطلاب"}
      </NavLink>
      <NavLink href="/dashboard/statistics">
        إحصائيات الطلاب
      </NavLink>
      {(isAdmin || isAssistant) && (
        <NavLink href="/dashboard/password-change-requests">
          طلبات تغيير بيانات الحسابات
        </NavLink>
      )}
      {(isAdmin || isAssistant) && (
        <NavLink href="/dashboard/codes">
          إنشاء الأكواد
        </NavLink>
      )}
      {(isAdmin || isAssistant) && (
        <NavLink href="/dashboard/homework">
          واجبات الطلاب
        </NavLink>
      )}
      {(isAdmin || isAssistant) && (
        <NavLink href="/dashboard/messages">
          تواصل خاص مع الطلبة
        </NavLink>
      )}
      {isAdmin && (
        <>
          <NavLink href="/dashboard/courses">
            إدارة الكورسات
          </NavLink>
          <NavLink href="/dashboard/courses/new" exact>
            إنشاء دورة
          </NavLink>
          <NavLink href="/dashboard/reviews">
            تعليقات الطلاب
          </NavLink>
          <NavLink href="/dashboard/settings/homepage">
            إعدادات الصفحة الرئيسية
          </NavLink>
          <NavLink href="/dashboard/settings/add-balance">
            تعديل طرق الدفع للطالب
          </NavLink>
          <NavLink href="/dashboard/live-streams">
            البثوث المباشرة
          </NavLink>
          <NavLink href="/dashboard/teachers">تعدد المدرسين</NavLink>
          <NavLink href="/dashboard/subscriptions">إنشاء اشتراكات المنصة</NavLink>
          <NavLink href="/dashboard/subscription-students">الطلاب المشتركين</NavLink>
          <NavLink href="/dashboard/store">متجر المنصة</NavLink>
        </>
      )}
    </>
  );
}
