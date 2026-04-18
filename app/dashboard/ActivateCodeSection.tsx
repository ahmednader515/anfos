"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ActivateCodeSection() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setMessage({ type: "error", text: "أدخل كود التفعيل" });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/activate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "فشل تفعيل الكود" });
        return;
      }
      setMessage({ type: "success", text: data.message ?? "تم تفعيل الكود والتسجيل في الدورة بنجاح" });
      setCode("");
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "حدث خطأ أثناء التفعيل" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
      <h2 className="mb-2 text-lg font-semibold text-[var(--color-foreground)]">
        تفعيل كود
      </h2>
      <p className="mb-4 text-sm text-[var(--color-muted)]">
        إذا حصلت على كود تفعيل مجاني لدورة، أدخله هنا للحصول على الدورة دون شراء.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="أدخل كود التفعيل"
          className="min-w-[180px] rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 text-sm font-mono placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
        >
          {loading ? "جاري التفعيل..." : "تفعيل الكود"}
        </button>
      </form>
      {message && (
        <p
          className={`mt-3 text-sm ${message.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
