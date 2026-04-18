"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-password-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrPhone: emailOrPhone.trim(),
          oldPassword: oldPassword || undefined,
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "فشل إرسال الطلب");
        setLoading(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center px-4 py-12">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
            تم إرسال الطلب
          </h1>
          <div className="mt-4 rounded-[var(--radius-btn)] border border-green-200 bg-green-50/50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
            تم إرسال طلب تغيير كلمة المرور إلى الأدمن. وفي غضون ساعات سيتم تغيير البيانات. شكراً على الانتظار.
          </div>
          <Link
            href="/login"
            className="mt-6 block w-full rounded-[var(--radius-btn)] bg-[var(--color-primary)] py-2.5 text-center font-medium text-white hover:bg-[var(--color-primary-hover)]"
          >
            العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          نسيان كلمة المرور / طلب تغيير البيانات
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          أدخل البريد الإلكتروني أو رقم الهاتف المسجّل وكلمة المرور الجديدة. سيتم إرسال الطلب للأدمن لتنفيذه خلال ساعات.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="emailOrPhone" className="block text-sm font-medium text-[var(--color-foreground)]">
              البريد الإلكتروني أو رقم الهاتف
            </label>
            <input
              id="emailOrPhone"
              type="text"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              required
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              placeholder="example@email.com أو 01xxxxxxxxx"
            />
          </div>
          <div>
            <label htmlFor="oldPassword" className="block text-sm font-medium text-[var(--color-foreground)]">
              كلمة المرور الحالية (اختياري — إن تذكرتها)
            </label>
            <input
              id="oldPassword"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              placeholder="لإظهارها للأدمن إن أدخلتها"
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-[var(--color-foreground)]">
              كلمة المرور الجديدة
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              placeholder="6 أحرف على الأقل"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[var(--radius-btn)] bg-[var(--color-primary)] py-2.5 font-medium text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {loading ? "جاري الإرسال..." : "إرسال الطلب"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          <Link href="/login" className="font-medium text-[var(--color-primary)] hover:underline">
            ← العودة لتسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
