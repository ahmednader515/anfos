"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HomepageSetting } from "@/lib/types";

export function AddBalanceSettingsForm({ initialSettings }: { initialSettings: HomepageSetting }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    addBalanceTitle: initialSettings.addBalanceTitle ?? "",
    addBalanceSubtitle: initialSettings.addBalanceSubtitle ?? "",
    addBalanceMethodTitle: initialSettings.addBalanceMethodTitle ?? "",
    addBalanceTransferInstruction: initialSettings.addBalanceTransferInstruction ?? "",
    addBalanceWalletNumber: initialSettings.addBalanceWalletNumber ?? "",
    addBalanceConfirmationNote: initialSettings.addBalanceConfirmationNote ?? "",
    addBalanceWhatsappNumber: initialSettings.addBalanceWhatsappNumber ?? "",
    addBalanceWhatsappButtonText: initialSettings.addBalanceWhatsappButtonText ?? "",
    addBalanceWaitingNote: initialSettings.addBalanceWaitingNote ?? "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/dashboard/settings/add-balance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "فشل الحفظ");
      setSuccess("تم حفظ إعدادات صفحة إضافة الرصيد بنجاح");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-3xl space-y-6">
      {error ? (
        <div className="rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-[var(--radius-btn)] bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
          {success}
        </div>
      ) : null}

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">تعديل نصوص وبيانات صفحة إضافة الرصيد</h3>
        <div className="space-y-4">
          <input
            value={form.addBalanceTitle}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceTitle: e.target.value }))}
            placeholder="عنوان الصفحة (مثال: إضافة رصيد)"
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <input
            value={form.addBalanceSubtitle}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceSubtitle: e.target.value }))}
            placeholder="وصف أعلى الصفحة"
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <input
            value={form.addBalanceMethodTitle}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceMethodTitle: e.target.value }))}
            placeholder="عنوان وسيلة الدفع (مثال: فودافون كاش)"
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <textarea
            value={form.addBalanceTransferInstruction}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceTransferInstruction: e.target.value }))}
            placeholder="نص التعليمات قبل رقم التحويل"
            rows={2}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <input
            value={form.addBalanceWalletNumber}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceWalletNumber: e.target.value }))}
            placeholder="رقم التحويل/المحفظة"
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <textarea
            value={form.addBalanceConfirmationNote}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceConfirmationNote: e.target.value }))}
            placeholder="جملة إرسال صورة التأكيد"
            rows={2}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <input
            value={form.addBalanceWhatsappNumber}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceWhatsappNumber: e.target.value }))}
            placeholder="رقم الواتساب (مثال: 9665...)"
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <input
            value={form.addBalanceWhatsappButtonText}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceWhatsappButtonText: e.target.value }))}
            placeholder="نص زر الواتساب"
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <textarea
            value={form.addBalanceWaitingNote}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceWaitingNote: e.target.value }))}
            placeholder="ملاحظة انتظار إضافة الرصيد"
            rows={3}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-6 py-2 font-medium text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
      >
        {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
      </button>
    </form>
  );
}
