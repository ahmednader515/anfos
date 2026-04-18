"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type ReviewRow = {
  id: string;
  text: string;
  authorName: string;
  authorTitle: string | null;
  avatarLetter: string | null;
  order: number;
};

export function ReviewsManage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [form, setForm] = useState({ text: "", authorName: "", authorTitle: "", avatarLetter: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ text: "", authorName: "", authorTitle: "", avatarLetter: "" });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard/reviews");
      if (!res.ok) throw new Error("فشل جلب التعليقات");
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.text.trim() || !form.authorName.trim()) {
      setError("نص التعليق واسم الكاتب مطلوبان");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: form.text.trim(),
          authorName: form.authorName.trim(),
          authorTitle: form.authorTitle.trim() || null,
          avatarLetter: form.avatarLetter.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "فشل الإضافة");
      setForm({ text: "", authorName: "", authorTitle: "", avatarLetter: "" });
      router.refresh();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الإضافة");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(r: ReviewRow) {
    setEditingId(r.id);
    setEditForm({
      text: r.text,
      authorName: r.authorName,
      authorTitle: r.authorTitle ?? "",
      avatarLetter: r.avatarLetter ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setError("");
    if (!editForm.text.trim() || !editForm.authorName.trim()) {
      setError("نص التعليق واسم الكاتب مطلوبان");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/reviews/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: editForm.text.trim(),
          authorName: editForm.authorName.trim(),
          authorTitle: editForm.authorTitle.trim() || null,
          avatarLetter: editForm.avatarLetter.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "فشل التحديث");
      setEditingId(null);
      router.refresh();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل التحديث");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/dashboard/reviews/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "فشل الحذف");
      setConfirmDelete(null);
      router.refresh();
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "فشل الحذف");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-[var(--color-muted)]">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {error && (
        <div className="rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">إضافة تعليق جديد</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">نص التعليق *</label>
            <textarea
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              placeholder="الدورة كانت واضحة جداً..."
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)]">اسم الكاتب *</label>
              <input
                type="text"
                value={form.authorName}
                onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))}
                className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                placeholder="أحمد م."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)]">وصف (اختياري)</label>
              <input
                type="text"
                value={form.authorTitle}
                onChange={(e) => setForm((f) => ({ ...f, authorTitle: e.target.value }))}
                className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                placeholder="طالب — دورة البرمجة"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">حرف الصورة الرمزية (اختياري)</label>
            <input
              type="text"
              maxLength={1}
              value={form.avatarLetter}
              onChange={(e) => setForm((f) => ({ ...f, avatarLetter: e.target.value }))}
              className="mt-1 w-14 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-2 text-center text-lg"
              placeholder="أ"
            />
            <p className="mt-1 text-xs text-[var(--color-muted)]">حرف واحد يظهر في الدائرة بجانب التعليق (إن تركت فارغاً يُؤخذ أول حرف من الاسم)</p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {saving ? "جاري الإضافة..." : "إضافة التعليق"}
          </button>
        </form>
      </section>

      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <h3 className="border-b border-[var(--color-border)] bg-[var(--color-background)]/50 px-4 py-3 text-lg font-semibold text-[var(--color-foreground)]">
          التعليقات الحالية ({reviews.length})
        </h3>
        {reviews.length === 0 ? (
          <p className="p-8 text-center text-[var(--color-muted)]">لا توجد تعليقات. أضف تعليقاً من النموذج أعلاه.</p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {reviews.map((r) => (
              <li key={r.id} className="p-4">
                {editingId === r.id ? (
                  <form onSubmit={handleUpdate} className="space-y-3">
                    <textarea
                      value={editForm.text}
                      onChange={(e) => setEditForm((f) => ({ ...f, text: e.target.value }))}
                      rows={2}
                      className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                      required
                    />
                    <div className="flex flex-wrap gap-3">
                      <input
                        type="text"
                        value={editForm.authorName}
                        onChange={(e) => setEditForm((f) => ({ ...f, authorName: e.target.value }))}
                        placeholder="اسم الكاتب"
                        className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-sm"
                        required
                      />
                      <input
                        type="text"
                        value={editForm.authorTitle}
                        onChange={(e) => setEditForm((f) => ({ ...f, authorTitle: e.target.value }))}
                        placeholder="وصف"
                        className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-sm"
                      />
                      <input
                        type="text"
                        maxLength={1}
                        value={editForm.avatarLetter}
                        onChange={(e) => setEditForm((f) => ({ ...f, avatarLetter: e.target.value }))}
                        placeholder="حرف"
                        className="w-10 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1.5 text-center text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={saving} className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
                        حفظ
                      </button>
                      <button type="button" onClick={cancelEdit} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium">
                        إلغاء
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="text-[var(--color-foreground)]">{r.text}</p>
                    <p className="mt-2 text-sm text-[var(--color-muted)]">
                      {r.authorName}
                      {r.authorTitle ? ` — ${r.authorTitle}` : ""}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={() => startEdit(r)} className="text-sm text-[var(--color-primary)] hover:underline">
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        disabled={deletingId !== null}
                        className={
                          confirmDelete === r.id
                            ? "text-sm font-medium text-red-600 hover:underline"
                            : "text-sm text-red-600 hover:underline disabled:opacity-50"
                        }
                      >
                        {deletingId === r.id ? "جاري الحذف..." : confirmDelete === r.id ? "اضغط مرة أخرى للحذف" : "حذف"}
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
