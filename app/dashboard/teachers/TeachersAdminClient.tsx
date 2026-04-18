"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type TeacherRow = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  avatarUrl: string | null;
  phone: string | null;
  homepageOrder: number | null;
};

type ApiTeacher = {
  id: string;
  name: string;
  email: string;
  student_number?: string | null;
  teacher_subject?: string | null;
  teacher_avatar_url?: string | null;
  teacher_homepage_order?: number | null;
};

function normalizeHomepageOrder(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < 1 || n > 4) return null;
  return Math.floor(n);
}

function slotsFromTeachers(list: TeacherRow[]): [string, string, string, string] {
  const s: [string, string, string, string] = ["", "", "", ""];
  for (const t of list) {
    if (t.homepageOrder != null && t.homepageOrder >= 1 && t.homepageOrder <= 4) {
      s[t.homepageOrder - 1] = t.id;
    }
  }
  return s;
}

function mapApiToRows(list: ApiTeacher[]): TeacherRow[] {
  return list.map((t) => ({
    id: t.id,
    name: t.name,
    email: t.email,
    subject: t.teacher_subject ?? null,
    avatarUrl: t.teacher_avatar_url ?? null,
    phone: t.student_number ?? null,
    homepageOrder: normalizeHomepageOrder(t.teacher_homepage_order),
  }));
}

export function TeachersAdminClient({
  initialEnabled,
  initialTeachers,
}: {
  initialEnabled: boolean;
  initialTeachers: TeacherRow[];
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [teachers, setTeachers] = useState(initialTeachers);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [subject, setSubject] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [createImageUploading, setCreateImageUploading] = useState(false);
  const [createImageError, setCreateImageError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editImageUploading, setEditImageUploading] = useState(false);
  const [editImageError, setEditImageError] = useState("");

  const [featuredSlots, setFeaturedSlots] = useState<[string, string, string, string]>(() =>
    slotsFromTeachers(initialTeachers),
  );
  const [featuredSaveLoading, setFeaturedSaveLoading] = useState(false);

  useEffect(() => {
    setFeaturedSlots(slotsFromTeachers(teachers));
  }, [teachers]);

  const reloadTeachers = useCallback(async () => {
    const listRes = await fetch("/api/dashboard/teachers", { credentials: "include" });
    if (!listRes.ok) return;
    const data = (await listRes.json()) as { teachers?: ApiTeacher[] };
    if (data.teachers) setTeachers(mapApiToRows(data.teachers));
  }, []);

  async function patchEnabled(next: boolean) {
    setError("");
    setToggleLoading(true);
    const res = await fetch("/api/dashboard/settings/teachers-enabled", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    });
    const data = await res.json().catch(() => ({}));
    setToggleLoading(false);
    if (!res.ok) {
      setError(data.error ?? "فشل التحديث");
      return;
    }
    setEnabled(next);
    if (!next) setTeachers([]);
    setSuccess(next ? "تم تفعيل عرض المدرسين وإنشاء الحسابات" : "تم إيقاف الميزة — اختفى رابط «اختر المدرسين» من الموقع");
    router.refresh();
  }

  async function createTeacher(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setFormLoading(true);
    const res = await fetch("/api/dashboard/teachers", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        teacherSubject: subject.trim() || null,
        teacherAvatarUrl: avatarUrl.trim() || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setFormLoading(false);
    if (!res.ok) {
      setError(data.error ?? "فشل إنشاء الحساب");
      return;
    }
    setSuccess("تم إنشاء حساب المدرس");
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setSubject("");
    setAvatarUrl("");
    setCreateImageError("");
    await reloadTeachers();
    router.refresh();
  }

  function openEdit(t: TeacherRow) {
    setError("");
    setSuccess("");
    setEditingId(t.id);
    setEditName(t.name);
    setEditEmail(t.email);
    setEditPhone(t.phone ?? "");
    setEditPassword("");
    setEditSubject(t.subject ?? "");
    setEditAvatarUrl(t.avatarUrl ?? "");
    setEditImageError("");
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditingId(null);
    setEditPassword("");
    setEditLoading(false);
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setError("");
    setSuccess("");
    setEditLoading(true);
    const body: Record<string, unknown> = {
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      teacherSubject: editSubject.trim() || null,
      teacherAvatarUrl: editAvatarUrl.trim() || null,
    };
    if (editPassword.trim()) body.password = editPassword.trim();
    const res = await fetch(`/api/dashboard/teachers/${encodeURIComponent(editingId)}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setEditLoading(false);
    if (!res.ok) {
      setError(data.error ?? "فشل التحديث");
      return;
    }
    setSuccess("تم تحديث بيانات المدرس");
    closeEdit();
    await reloadTeachers();
    router.refresh();
  }

  async function removeTeacher(t: TeacherRow) {
    const ok = window.confirm(
      `حذف حساب المدرس «${t.name}» نهائياً؟ لا يمكن التراجع. الدورات التي أنشأها قد تبقى على المنصة دون مالك إن كان إعداد قاعدة البيانات يضبط ذلك.`,
    );
    if (!ok) return;
    setError("");
    setSuccess("");
    const res = await fetch(`/api/dashboard/teachers/${encodeURIComponent(t.id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "فشل الحذف");
      return;
    }
    setSuccess("تم حذف حساب المدرس");
    if (editingId === t.id) closeEdit();
    await reloadTeachers();
    router.refresh();
  }

  async function onAvatarFile(
    file: File | undefined,
    which: "create" | "edit",
  ) {
    if (!file) return;
    const setUploading = which === "create" ? setCreateImageUploading : setEditImageUploading;
    const setErr = which === "create" ? setCreateImageError : setEditImageError;
    const setUrl = which === "create" ? setAvatarUrl : setEditAvatarUrl;
    setErr("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) setUrl(data.url);
      else {
        const msg = data.missing?.length ? `${data.error} ${data.missing.join(", ")}` : data.error || "فشل الرفع";
        setErr(msg);
      }
    } catch {
      setErr("فشل الاتصال بالخادم");
    } finally {
      setUploading(false);
    }
  }

  function onFeaturedSlotChange(index: number, newId: string) {
    setFeaturedSlots((prev) => {
      const next: [string, string, string, string] = [...prev] as [string, string, string, string];
      if (newId) {
        for (let j = 0; j < 4; j++) {
          if (j !== index && next[j] === newId) next[j] = "";
        }
      }
      next[index] = newId;
      return next;
    });
  }

  async function saveFeaturedHomepageOrder() {
    setError("");
    setSuccess("");
    setFeaturedSaveLoading(true);
    const orderedTeacherIds = featuredSlots.map((id) => id.trim()).filter(Boolean);
    const res = await fetch("/api/dashboard/teachers/homepage-featured", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedTeacherIds }),
    });
    const data = await res.json().catch(() => ({}));
    setFeaturedSaveLoading(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "فشل الحفظ");
      return;
    }
    setSuccess("تم حفظ مدرسي الصفحة الرئيسية والترتيب");
    await reloadTeachers();
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">تعدد المدرسين على المنصة</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          عند التفعيل يظهر في الموقع قسم «اختر المدرسين»، ويُسمح لك بإنشاء حسابات برتبة مدرس. عند الإيقاف يختفي القسم ولا يمكن إنشاء مدرسين جدد حتى إعادة التفعيل.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            type="button"
            disabled={toggleLoading || enabled}
            onClick={() => patchEnabled(true)}
            className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            تفعيل الميزة
          </button>
          <button
            type="button"
            disabled={toggleLoading || !enabled}
            onClick={() => patchEnabled(false)}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-border)]/40 disabled:opacity-50"
          >
            إيقاف الميزة
          </button>
          <span className="text-sm text-[var(--color-muted)]">الحالة: {enabled ? "مفعّلة" : "غير مفعّلة"}</span>
        </div>
      </div>

      {error ? (
        <div className="rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-[var(--radius-btn)] bg-[var(--color-primary)]/10 px-3 py-2 text-sm text-[var(--color-primary)]">{success}</div>
      ) : null}

      {enabled ? (
        <>
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">إنشاء حساب مدرس</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              البريد أو رقم الهاتف (10 أرقام على الأقل) لتسجيل الدخول كما في الطلاب. كلمة المرور تسلّم للمدرس بشكل آمن خارج المنصة. يمكنك ضبط المادة والصورة كما في تعديل الملف الشخصي للمدرس (اختياري).
            </p>
            <form onSubmit={createTeacher} className="mt-4 grid max-w-2xl gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[var(--color-foreground)]">اسم المدرس</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]">البريد الإلكتروني</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]">رقم الهاتف (اختياري)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
                />
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  لتسجيل الدخول بالهاتف مع البريد: 10 أرقام على الأقل (أرقام فقط بعد إزالة المسافات).
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[var(--color-foreground)]">المادة أو التخصص (اختياري)</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={500}
                  placeholder="مثال: أستاذ الفيزياء — الثانوية العامة"
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
                />
              </div>
              <div className="sm:col-span-2">
                <span className="block text-sm font-medium text-[var(--color-foreground)]">صورة الملف الظاهر للطلاب (اختياري)</span>
                <p className="mt-1 text-xs text-[var(--color-muted)]">اتركها فارغة إن لم ترد رفع صورة الآن؛ يمكن للمدرس تعديلها لاحقاً من ملفه الشخصي.</p>
                {avatarUrl ? (
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatarUrl} alt="" className="h-20 w-20 rounded-full border border-[var(--color-border)] object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarUrl("");
                        setCreateImageError("");
                      }}
                      className="text-sm text-red-600 hover:underline dark:text-red-400"
                    >
                      إزالة الصورة
                    </button>
                  </div>
                ) : null}
                <div className="mt-2">
                  <label className="inline-flex cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--color-border)]/50">
                    {createImageUploading ? "جاري الرفع…" : "رفع صورة"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      disabled={createImageUploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        void onAvatarFile(f, "create");
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                {createImageError ? (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{createImageError}</p>
                ) : null}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[var(--color-foreground)]">كلمة المرور</label>
                <input
                  required
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                >
                  {formLoading ? "جاري الإنشاء…" : "إنشاء الحساب"}
                </button>
              </div>
            </form>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-[var(--color-foreground)]">المدرسون الحاليون</h2>

            {teachers.length > 0 ? (
              <div
                className="mb-6 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]"
                dir="rtl"
              >
                <h3 className="text-base font-semibold text-[var(--color-foreground)]">
                  من يظهر في الصفحة الرئيسية؟
                </h3>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  حدّد حتى أربعة مدرسين وترتيب بطاقات قسم «اختر المدرسين». الموضع 1 يظهر أولاً (يمين الواجهة العربية).
                  إن تركت كل الخانات فارغة وحفظت، تُعرض أول أربعة أبجدياً. إن اخترت أقل من أربعة، يُكمّل تلقائياً
                  ببقية المدرسين أبجدياً حتى أربع بطاقات.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i}>
                      <label className="block text-sm font-medium text-[var(--color-foreground)]">
                        البطاقة {i + 1} في الرئيسية
                      </label>
                      <select
                        value={featuredSlots[i]}
                        onChange={(e) => onFeaturedSlotChange(i, e.target.value)}
                        className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
                      >
                        <option value="">— بدون اختيار —</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    disabled={featuredSaveLoading}
                    onClick={() => void saveFeaturedHomepageOrder()}
                    className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                  >
                    {featuredSaveLoading ? "جاري الحفظ…" : "حفظ الظهور في الرئيسية"}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)]">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                  <tr>
                    <th className="px-3 py-3 text-start font-medium w-16">الصورة</th>
                    <th className="px-4 py-3 text-start font-medium">الاسم</th>
                    <th className="px-4 py-3 text-start font-medium">البريد</th>
                    <th className="px-4 py-3 text-start font-medium">المادة</th>
                    <th className="px-4 py-3 text-start font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-muted)]">
                        لا يوجد مدرسون بعد.
                      </td>
                    </tr>
                  ) : (
                    teachers.map((t) => (
                      <tr key={t.id} className="border-b border-[var(--color-border)]/60">
                        <td className="px-3 py-2">
                          {t.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={t.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-[var(--color-border)]" />
                          ) : (
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-border)]/50 text-xs text-[var(--color-muted)]">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium">{t.name}</td>
                        <td className="px-4 py-3 text-[var(--color-muted)]">{t.email}</td>
                        <td className="px-4 py-3 text-[var(--color-muted)]">{t.subject ?? "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(t)}
                              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-1 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-border)]/40"
                            >
                              تعديل
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeTeacher(t)}
                              className="rounded-[var(--radius-btn)] border border-red-500/40 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-500/10 dark:text-red-400"
                            >
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {editOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal
          aria-labelledby="edit-teacher-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEdit();
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="edit-teacher-title" className="text-lg font-semibold text-[var(--color-foreground)]">
              تعديل بيانات المدرس
            </h3>
            <form onSubmit={(e) => void submitEdit(e)} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]">الاسم</label>
                <input
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]">البريد الإلكتروني</label>
                <input
                  required
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]">رقم الهاتف (لتسجيل الدخول)</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
                />
                <p className="mt-1 text-xs text-[var(--color-muted)]">10 أرقام على الأقل لتفعيل الدخول بالهاتف؛ اترك أقل من ذلك لإلغاء ربط الهاتف.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]">كلمة مرور جديدة (اختياري)</label>
                <input
                  type="password"
                  minLength={6}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="اتركها فارغة إن لم تتغير"
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]">المادة أو التخصص</label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  maxLength={500}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
                />
              </div>
              <div>
                <span className="block text-sm font-medium text-[var(--color-foreground)]">صورة الملف الظاهر للطلاب</span>
                {editAvatarUrl ? (
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={editAvatarUrl} alt="" className="h-20 w-20 rounded-full border border-[var(--color-border)] object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setEditAvatarUrl("");
                        setEditImageError("");
                      }}
                      className="text-sm text-red-600 hover:underline dark:text-red-400"
                    >
                      إزالة الصورة
                    </button>
                  </div>
                ) : null}
                <div className="mt-2">
                  <label className="inline-flex cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--color-border)]/50">
                    {editImageUploading ? "جاري الرفع…" : "رفع صورة"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      disabled={editImageUploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        void onAvatarFile(f, "edit");
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                {editImageError ? (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{editImageError}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="submit"
                  disabled={editLoading}
                  className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                >
                  {editLoading ? "جاري الحفظ…" : "حفظ التعديلات"}
                </button>
                <button
                  type="button"
                  onClick={closeEdit}
                  className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-border)]/40"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
