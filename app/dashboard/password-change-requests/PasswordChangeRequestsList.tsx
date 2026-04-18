"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

/** تنسيق التاريخ بشكل ثابت لتجنب اختلاف الهيدريشن بين السيرفر والعميل */
function formatRequestDate(date: Date | string): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${y}/${m}/${day} ${h}:${min}:${s}`;
}

type RequestRow = {
  id: string;
  userId: string;
  newPasswordHash: string;
  requestedIdentifier: string | null;
  requestedOldPassword: string | null;
  requestedNewPasswordPlain: string | null;
  status: string;
  createdAt: Date;
  processedAt: Date | null;
  processedById: string | null;
  userEmail: string;
  userName: string;
};

export function PasswordChangeRequestsList({
  initialRequests,
  isAdmin,
  isStaff = true,
}: {
  initialRequests: RequestRow[];
  isAdmin: boolean;
  isStaff?: boolean;
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState<RequestRow[]>(initialRequests);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setRequests(initialRequests);
  }, [initialRequests]);

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) => {
      const id = (r.requestedIdentifier ?? "").toLowerCase();
      const email = (r.userEmail ?? "").toLowerCase();
      return id.includes(q) || email.includes(q);
    });
  }, [requests, searchQuery]);

  async function handleComplete(id: string) {
    setCompletingId(id);
    try {
      const res = await fetch(`/api/dashboard/password-change-requests/${encodeURIComponent(id)}/complete`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "فشل تنفيذ الطلب");
        return;
      }
      router.refresh();
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "completed" as const } : r
        )
      );
    } finally {
      setCompletingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف هذا الطلب؟ لن يتم تطبيق تغيير كلمة المرور.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/dashboard/password-change-requests/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "فشل حذف الطلب");
        return;
      }
      router.refresh();
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  const pending = filteredRequests.filter((r) => r.status === "pending");
  const completed = filteredRequests.filter((r) => r.status === "completed");

  if (requests.length === 0) {
    return (
      <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-[var(--color-muted)]">
        لا توجد طلبات حتى الآن.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="pcr-search" className="sr-only">
          بحث بالبريد أو رقم الهاتف
        </label>
        <input
          id="pcr-search"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="بحث بالبريد الإلكتروني أو رقم الهاتف..."
          className="min-w-[220px] max-w-md flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
        {searchQuery.trim() && (
          <span className="text-sm text-[var(--color-muted)]">
            {filteredRequests.length} من {requests.length}
          </span>
        )}
      </div>
      {filteredRequests.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-[var(--color-muted)]">
          لا توجد طلبات تطابق البحث.
        </div>
      ) : (
    <>
      {pending.length > 0 && (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="border-b border-[var(--color-border)] bg-[var(--color-background)]/50 px-4 py-3">
            <h3 className="font-semibold text-[var(--color-foreground)]">طلبات قيد الانتظار ({pending.length})</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]/30">
                <th className="p-2 text-right font-medium text-[var(--color-foreground)]">البريد أو الرقم الذي أدخله المستخدم</th>
                <th className="p-2 text-right font-medium text-[var(--color-foreground)]">اسم المستخدم</th>
                <th className="p-2 text-right font-medium text-[var(--color-foreground)]">البريد المسجّل في الحساب</th>
                <th className="p-2 text-right font-medium text-[var(--color-foreground)]">كلمة المرور القديمة</th>
                <th className="p-2 text-right font-medium text-[var(--color-foreground)]">كلمة المرور الجديدة المطلوبة</th>
                <th className="p-2 text-right font-medium text-[var(--color-foreground)]">تاريخ الطلب</th>
                {isStaff && (
                  <th className="p-2 text-right font-medium text-[var(--color-foreground)]">إجراء</th>
                )}
              </tr>
            </thead>
            <tbody>
              {pending.map((r) => (
                <tr key={r.id} className="border-b border-[var(--color-border)]">
                  <td className="p-2 text-[var(--color-foreground)]">{r.requestedIdentifier ?? "—"}</td>
                  <td className="p-2 text-[var(--color-foreground)]">{r.userName}</td>
                  <td className="p-2 text-[var(--color-muted)]">{r.userEmail}</td>
                  <td className="p-2 font-mono text-sm text-[var(--color-foreground)]">{r.requestedOldPassword ?? "—"}</td>
                  <td className="p-2 font-mono text-sm text-[var(--color-foreground)]">{r.requestedNewPasswordPlain ?? "—"}</td>
                  <td className="p-2 text-[var(--color-muted)]">
                    {formatRequestDate(r.createdAt)}
                  </td>
                  {isStaff && (
                    <td className="p-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleComplete(r.id)}
                            disabled={completingId !== null || deletingId !== null}
                            className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                          >
                            {completingId === r.id ? "جاري التنفيذ..." : "تنفيذ (تطبيق كلمة المرور الجديدة)"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(r.id)}
                          disabled={deletingId !== null || completingId !== null}
                          className="rounded-[var(--radius-btn)] border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-500/20 disabled:opacity-50"
                        >
                          {deletingId === r.id ? "جاري الحذف..." : "حذف"}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {completed.length > 0 && (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="border-b border-[var(--color-border)] bg-[var(--color-background)]/50 px-4 py-3">
            <h3 className="font-semibold text-[var(--color-foreground)]">طلبات منفذة ({completed.length})</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]/30">
                <th className="p-2 text-right font-medium text-[var(--color-foreground)]">البريد أو الرقم الذي أدخله المستخدم</th>
                <th className="p-2 text-right font-medium text-[var(--color-foreground)]">اسم المستخدم</th>
                <th className="p-2 text-right font-medium text-[var(--color-foreground)]">البريد المسجّل في الحساب</th>
                <th className="p-2 text-right font-medium text-[var(--color-foreground)]">كلمة المرور القديمة</th>
                <th className="p-2 text-right font-medium text-[var(--color-foreground)]">كلمة المرور الجديدة المطلوبة</th>
                <th className="p-2 text-right font-medium text-[var(--color-foreground)]">تاريخ الطلب</th>
                <th className="p-2 text-right font-medium text-[var(--color-foreground)]">الحالة</th>
                {isStaff && (
                  <th className="p-2 text-right font-medium text-[var(--color-foreground)]">إجراء</th>
                )}
              </tr>
            </thead>
            <tbody>
              {completed.map((r) => (
                <tr key={r.id} className="border-b border-[var(--color-border)]">
                  <td className="p-2 text-[var(--color-foreground)]">{r.requestedIdentifier ?? "—"}</td>
                  <td className="p-2 text-[var(--color-foreground)]">{r.userName}</td>
                  <td className="p-2 text-[var(--color-muted)]">{r.userEmail}</td>
                  <td className="p-2 font-mono text-sm text-[var(--color-foreground)]">{r.requestedOldPassword ?? "—"}</td>
                  <td className="p-2 font-mono text-sm text-[var(--color-foreground)]">{r.requestedNewPasswordPlain ?? "—"}</td>
                  <td className="p-2 text-[var(--color-muted)]">
                    {formatRequestDate(r.createdAt)}
                  </td>
                  <td className="p-2 text-[var(--color-success)]">تم التنفيذ</td>
                  {isStaff && (
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        disabled={deletingId !== null}
                        className="rounded-[var(--radius-btn)] border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-500/20 disabled:opacity-50"
                      >
                        {deletingId === r.id ? "جاري الحذف..." : "حذف"}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
      )}
    </div>
  );
}
