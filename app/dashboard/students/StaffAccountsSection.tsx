"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UserRow = { id: string; name: string | null; email: string | null; role: string };

const roleLabel: Record<string, string> = {
  ADMIN: "أدمن",
  ASSISTANT_ADMIN: "مساعد أدمن",
  STUDENT: "طالب",
};

const ROLES = [
  { value: "ADMIN", label: "أدمن" },
  { value: "ASSISTANT_ADMIN", label: "مساعد أدمن" },
  { value: "STUDENT", label: "طالب" },
] as const;

export function StaffAccountsSection({
  admins,
  assistantAdmins,
}: {
  admins: UserRow[];
  assistantAdmins: UserRow[];
}) {
  const router = useRouter();
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const staff = [
    ...admins.map((u) => ({ ...u, roleLabel: roleLabel[u.role] ?? u.role })),
    ...assistantAdmins.map((u) => ({ ...u, roleLabel: roleLabel[u.role] ?? u.role })),
  ];

  function openEdit(u: UserRow) {
    setEditUser(u);
    setEditName(u.name ?? "");
    setEditEmail(u.email ?? "");
    setEditRole(u.role);
    setEditPassword("");
    setError("");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setError("");
    setLoading(true);
    const body: { name?: string; email?: string; role?: string; password?: string } = {
      name: editName.trim(),
      email: editEmail.trim(),
      role: editRole,
    };
    if (editPassword.trim().length >= 6) body.password = editPassword.trim();

    const res = await fetch(`/api/dashboard/students/${editUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "فشل التحديث");
      return;
    }
    setEditUser(null);
    router.refresh();
  }

  if (staff.length === 0) return null;

  return (
    <section className="mb-8 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
        حسابات الأدمن ومساعدي الأدمن
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="pb-2 pr-3 font-medium text-[var(--color-foreground)]">الاسم</th>
              <th className="pb-2 pr-3 font-medium text-[var(--color-foreground)]">البريد الإلكتروني</th>
              <th className="pb-2 pr-3 font-medium text-[var(--color-foreground)]">الرتبة</th>
              <th className="pb-2 font-medium text-[var(--color-foreground)]">تعديل</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((u) => (
              <tr key={u.id} className="border-b border-[var(--color-border)]/50 last:border-0">
                <td className="py-2 pr-3 text-[var(--color-foreground)]">{u.name ?? "—"}</td>
                <td className="py-2 pr-3 text-[var(--color-muted)]">{u.email ?? "—"}</td>
                <td className="py-2 pr-3 text-[var(--color-foreground)]">{u.roleLabel}</td>
                <td className="py-2">
                  <button
                    type="button"
                    onClick={() => openEdit(u)}
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                  >
                    تعديل
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
              تعديل بيانات الحساب — {roleLabel[editUser.role] ?? editUser.role}
            </h3>
            <form onSubmit={handleSave} className="mt-4 space-y-3">
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]">الاسم</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]">الرتبة</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]">
                  كلمة مرور جديدة (اختياري)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="اتركه فارغاً للإبقاء على كلمة المرور الحالية"
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setEditUser(null); setError(""); }}
                  className="flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] py-2 text-sm font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-[var(--radius-btn)] bg-[var(--color-primary)] py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {loading ? "جاري الحفظ..." : "حفظ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
