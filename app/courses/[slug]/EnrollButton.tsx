"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function EnrollButton({
  courseId,
  coursePrice,
  userBalance,
}: {
  courseId: string;
  coursePrice: number;
  userBalance: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeMessage, setCodeMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  const hasEnoughBalance = coursePrice === 0 || userBalance >= coursePrice;

  async function handleClick() {
    if (!hasEnoughBalance) {
      setError(`رصيدك غير كافٍ. سعر الدورة: ${coursePrice.toFixed(2)} ج.م، رصيدك: ${userBalance.toFixed(2)} ج.م`);
      return;
    }
    setError("");
    setLoading(true);
    const res = await fetch(`/api/enroll?courseId=${encodeURIComponent(courseId)}`, {
      method: "POST",
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "فشل التسجيل في الدورة");
      return;
    }
    router.refresh();
  }

  async function handleActivateCode(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setCodeMessage({ type: "error", text: "أدخل كود التفعيل" });
      return;
    }
    setCodeMessage(null);
    setCodeLoading(true);
    try {
      const res = await fetch("/api/activate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCodeMessage({ type: "error", text: data.error ?? "فشل تفعيل الكود" });
        return;
      }
      setCodeMessage({ type: "success", text: data.message ?? "تم تفعيل الكود بنجاح" });
      setCode("");
      router.refresh();
    } catch {
      setCodeMessage({ type: "error", text: "حدث خطأ أثناء التفعيل" });
    } finally {
      setCodeLoading(false);
    }
  }

  return (
    <div className="mt-6">
      {coursePrice > 0 && (
        <div className="mb-4 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-muted)]">سعر الدورة:</span>
            <span className="text-lg font-semibold text-[var(--color-foreground)]">
              {coursePrice.toFixed(2)} ج.م
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-[var(--color-muted)]">رصيدك الحالي:</span>
            <span className={`text-lg font-semibold ${hasEnoughBalance ? "text-[var(--color-success)]" : "text-red-600"}`}>
              {userBalance.toFixed(2)} ج.م
            </span>
          </div>
          {!hasEnoughBalance && (
            <p className="mt-2 text-sm text-red-600">
              تحتاج {((coursePrice - userBalance).toFixed(2))} ج.م إضافية.{" "}
              <Link href="/dashboard" className="font-medium underline">شحن الرصيد</Link>
            </p>
          )}
        </div>
      )}

      <div className="mb-4 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)]/50 p-4">
        <p className="mb-3 text-sm font-medium text-[var(--color-foreground)]">لديك كود تفعيل؟</p>
        <form onSubmit={handleActivateCode} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="أدخل كود التفعيل"
            className="min-w-[160px] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm font-mono placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            disabled={codeLoading}
          />
          <button
            type="submit"
            disabled={codeLoading}
            className="rounded-[var(--radius-btn)] border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-4 py-2 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 disabled:opacity-50"
          >
            {codeLoading ? "جاري التفعيل..." : "تفعيل الكود"}
          </button>
        </form>
        {codeMessage && (
          <p className={`mt-2 text-sm ${codeMessage.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {codeMessage.text}
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-[var(--radius-btn)] bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={loading || !hasEnoughBalance}
        className="w-full rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-6 py-3 font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? "جاري التسجيل..."
          : coursePrice > 0
          ? `شراء الدورة (${coursePrice.toFixed(2)} ج.م)`
          : "التسجيل في الدورة (مجاناً)"}
      </button>
    </div>
  );
}
