"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type StreamRow = {
  id: string;
  title: string;
  titleAr: string;
  provider: string;
  meetingUrl: string;
  scheduledAt: unknown;
  course?: { id: string; title: string; slug: string };
};

export function LiveStreamsList({ streams }: { streams: StreamRow[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatDate = (d: unknown) => {
    if (!d) return "—";
    const date = typeof d === "string" ? new Date(d) : d as Date;
    return new Intl.DateTimeFormat("ar-EG", { dateStyle: "short", timeStyle: "short" }).format(date);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذا البث المباشر؟")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/live-streams/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
      else alert("فشل الحذف");
    } finally {
      setDeletingId(null);
    }
  };

  if (streams.length === 0) {
    return (
      <p className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-[var(--color-muted)]">
        لا توجد بثوث مباشرة. أضف بثاً من الرابط أعلاه.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="w-full text-right text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]">
            <th className="p-3 font-semibold text-[var(--color-foreground)]">العنوان</th>
            <th className="p-3 font-semibold text-[var(--color-foreground)]">نوع البث</th>
            <th className="p-3 font-semibold text-[var(--color-foreground)]">الكورس</th>
            <th className="p-3 font-semibold text-[var(--color-foreground)]">الموعد</th>
            <th className="p-3 font-semibold text-[var(--color-foreground)]">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {streams.map((s) => (
            <tr key={s.id} className="border-b border-[var(--color-border)] last:border-0">
              <td className="p-3">{s.titleAr || s.title}</td>
              <td className="p-3">{s.provider === "zoom" ? "Zoom" : "Google Meet"}</td>
              <td className="p-3">{s.course?.title ?? "—"}</td>
              <td className="p-3">{formatDate(s.scheduledAt)}</td>
              <td className="p-3">
                <Link
                  href={`/dashboard/live-streams/${s.id}/edit`}
                  className="ml-2 text-[var(--color-primary)] hover:underline"
                >
                  تعديل
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(s.id)}
                  disabled={deletingId === s.id}
                  className="text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                >
                  {deletingId === s.id ? "جاري..." : "حذف"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
