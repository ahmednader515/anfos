"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CONCURRENT_SESSION_ERROR } from "@/lib/auth-constants";
import LoginBackground from "./LoginBackground";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [concurrentSession, setConcurrentSession] = useState(false);
  const [forceLogoutLoading, setForceLogoutLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const reasonElsewhere = searchParams.get("reason") === "session_ended_elsewhere";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setConcurrentSession(false);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error === CONCURRENT_SESSION_ERROR) {
        setConcurrentSession(true);
        setLoading(false);
        return;
      }
      if (res?.error) {
        setError("البريد/رقم الهاتف أو كلمة المرور غير صحيحة");
        setLoading(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleForceLogoutOther(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setForceLogoutLoading(true);
    try {
      const r = await fetch("/api/auth/force-logout-other", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(data.error ?? "فشل تسجيل الخروج من الجهاز الآخر");
        return;
      }
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError("فشل تسجيل الدخول بعد تسجيل الخروج من الجهاز الآخر");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } finally {
      setForceLogoutLoading(false);
    }
  }

  if (concurrentSession) {
    return (
      <div className="relative mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-none flex-col overflow-hidden bg-black">
        <LoginBackground />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-black/55" />
        <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-md rounded-[var(--radius-card)] border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-800 dark:bg-amber-900/20 sm:p-8">
          <h1 className="text-xl font-bold text-amber-800 dark:text-amber-200">
            الحساب مفتوح على جهاز آخر
          </h1>
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
            تم تسجيل الدخول بهذا الحساب من جهاز أو متصفح آخر. لتسجيل الدخول من هذا الجهاز، اضغط أدناه لتسجيل الخروج من الجهاز الآخر ثم سيتم دخولك هنا.
          </p>
          <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
            إذا تشك أن الحساب مخترق، ننصحك بتغيير كلمة المرور وبيانات الحساب من صفحة &quot;تعديل بيانات الحساب&quot; بعد تسجيل الدخول.
          </p>
          {error && (
            <div className="mt-4 rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          <form onSubmit={handleForceLogoutOther} className="mt-6">
            <button
              type="submit"
              disabled={forceLogoutLoading}
              className="w-full rounded-[var(--radius-btn)] bg-[var(--color-primary)] py-2.5 font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
            >
              {forceLogoutLoading ? "جاري التنفيذ..." : "تسجيل الخروج من الجهاز الآخر والدخول من هنا"}
            </button>
          </form>
          <button
            type="button"
            onClick={() => setConcurrentSession(false)}
            className="mt-4 w-full text-sm text-[var(--color-muted)] hover:underline"
          >
            إلغاء والعودة لتسجيل الدخول
          </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-none flex-col overflow-hidden bg-black">
      <LoginBackground />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-black/55" />
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          تسجيل الدخول
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          أدخل بياناتك للوصول إلى حسابك
        </p>
        {reasonElsewhere && (
          <div className="mt-4 rounded-[var(--radius-btn)] border border-amber-200 bg-amber-50/50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            تم تسجيل خروجك لأن الحساب فُتح من جهاز آخر. سجّل الدخول مرة أخرى من هنا إذا رغبت.
          </div>
        )}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[var(--color-foreground)]"
            >
              البريد الإلكتروني أو رقم الهاتف
            </label>
            <input
              id="email"
              type="text"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              placeholder="example@email.com أو 01xxxxxxxxx"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[var(--color-foreground)]"
            >
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
            <p className="mt-1.5 text-xs text-[var(--color-muted)]">
              <Link href="/login/forgot-password" className="text-[var(--color-primary)] hover:underline">
                نسيان كلمة المرور؟
              </Link>
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[var(--radius-btn)] bg-[var(--color-primary)] py-2.5 font-medium text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {loading ? "جاري الدخول..." : "تسجيل الدخول"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          ليس لديك حساب؟{" "}
          <Link
            href="/register"
            className="font-medium text-[var(--color-primary)] hover:underline"
          >
            إنشاء حساب
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="relative mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-none flex-col overflow-hidden bg-black">
        <LoginBackground />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-black/55" />
        <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-md rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
            <div className="h-8 w-48 animate-pulse rounded bg-[var(--color-border)]" />
            <div className="mt-4 h-4 w-full animate-pulse rounded bg-[var(--color-border)]" />
            <div className="mt-4 h-4 w-full animate-pulse rounded bg-[var(--color-border)]" />
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
