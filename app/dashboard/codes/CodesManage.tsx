"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

type CodeRow = {
  id: string;
  courseId: string;
  code: string;
  createdAt: string;
  usedAt: string | null;
  usedByUserId: string | null;
  courseTitle?: string;
  courseTitleAr?: string;
  lessonCount?: number | null;
  quizCount?: number | null;
};

export function CodesManage({ courseOptions }: { courseOptions: { id: string; title: string }[] }) {
  const router = useRouter();
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterCourseId, setFilterCourseId] = useState<string>("");
  const [searchCode, setSearchCode] = useState("");
  const [generating, setGenerating] = useState(false);
  const [createCourseId, setCreateCourseId] = useState("");
  const [createCount, setCreateCount] = useState(5);
  const [courseLessons, setCourseLessons] = useState<Array<{ id: string; title: string; titleAr: string | null; order: number }>>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [selectedLessonIds, setSelectedLessonIds] = useState<Set<string>>(new Set());
  const [courseQuizzes, setCourseQuizzes] = useState<Array<{ id: string; title: string }>>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [selectedQuizIds, setSelectedQuizIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [confirmDeleteIds, setConfirmDeleteIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copySuccess, setCopySuccess] = useState(false);

  // آخر دفعة أكواد تم إنشاؤها (الأحدث زمناً) نعتبرها "جديدة" وكل ما قبلها "قديم"
  const latestCreatedAtMs = useMemo(() => {
    if (!codes.length) return null;
    let max = 0;
    for (const c of codes) {
      const t = new Date(c.createdAt).getTime();
      if (Number.isFinite(t) && t > max) max = t;
    }
    return max || null;
  }, [codes]);

  function isNewestBatch(createdAt: string): boolean {
    if (!latestCreatedAtMs) return false;
    const t = new Date(createdAt).getTime();
    if (!Number.isFinite(t)) return false;
    // نسمح بهامش ثانيتين حتى تُحسب نفس الدفعة معاً حتى لو كان هناك فروق بسيطة في الوقت بين الأكواد
    return Math.abs(latestCreatedAtMs - t) <= 2000;
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  const filteredCodes = useMemo(() => {
    const q = searchCode.trim().toLowerCase();
    if (!q) return codes;
    return codes.filter((c) => (c.code ?? "").toLowerCase().includes(q));
  }, [codes, searchCode]);

  function toggleSelectAll() {
    if (selectedIds.size === filteredCodes.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredCodes.map((c) => c.id)));
  }

  function load() {
    setLoading(true);
    setError("");
    const url = filterCourseId
      ? `/api/dashboard/codes?courseId=${encodeURIComponent(filterCourseId)}`
      : "/api/dashboard/codes";
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("فشل جلب الأكواد");
        return res.json();
      })
      .then((data) => setCodes(Array.isArray(data) ? data : []))
      .catch((e) => setError(e instanceof Error ? e.message : "حدث خطأ"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [filterCourseId]);

  useEffect(() => {
    const cid = createCourseId.trim();
    if (!cid) {
      setCourseLessons([]);
      setSelectedLessonIds(new Set());
      setCourseQuizzes([]);
      setSelectedQuizIds(new Set());
      return;
    }
    setLessonsLoading(true);
    fetch(`/api/dashboard/courses/${encodeURIComponent(cid)}/lessons`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "فشل جلب الحصص");
        return data;
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setCourseLessons(list);
        // تنظيف أي اختيارات قديمة غير موجودة
        setSelectedLessonIds((prev) => {
          const allowed = new Set(list.map((l: { id: string }) => l.id));
          const next = new Set<string>();
          prev.forEach((id) => { if (allowed.has(id)) next.add(id); });
          return next;
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "فشل جلب الحصص"))
      .finally(() => setLessonsLoading(false));
  }, [createCourseId]);

  useEffect(() => {
    const cid = createCourseId.trim();
    if (!cid) {
      setCourseQuizzes([]);
      setSelectedQuizIds(new Set());
      return;
    }
    setQuizzesLoading(true);
    fetch(`/api/dashboard/courses/${encodeURIComponent(cid)}/quizzes`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "فشل جلب الاختبارات");
        return data;
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setCourseQuizzes(list);
        setSelectedQuizIds((prev) => {
          const allowed = new Set(list.map((q: { id: string }) => q.id));
          const next = new Set<string>();
          prev.forEach((id) => { if (allowed.has(id)) next.add(id); });
          return next;
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "فشل جلب الاختبارات"))
      .finally(() => setQuizzesLoading(false));
  }, [createCourseId]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!createCourseId.trim()) {
      setError("اختر الدورة");
      return;
    }
    const count = Math.min(500, Math.max(1, createCount));
    setGenerating(true);
    try {
      const res = await fetch("/api/dashboard/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: createCourseId.trim(),
          count,
          lessonIds: selectedLessonIds.size > 0 ? Array.from(selectedLessonIds) : undefined,
          quizIds: selectedQuizIds.size > 0 ? Array.from(selectedQuizIds) : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "فشل إنشاء الأكواد");
      setCreateCount(5);
      setSelectedLessonIds(new Set());
      setSelectedQuizIds(new Set());
      router.refresh();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل إنشاء الأكواد");
    } finally {
      setGenerating(false);
    }
  }

  function copyAllUnused() {
    const unused = filteredCodes.filter((c) => !c.usedAt);
    const text = unused.map((c) => c.code).join("\n");
    if (!text) {
      setError("لا توجد أكواد غير مستخدمة للنسخ");
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => {
        setCopySuccess(true);
        setError("");
        setTimeout(() => setCopySuccess(false), 2000);
      },
      () => setError("فشل النسخ")
    );
  }

  function copyAll() {
    const text = filteredCodes.map((c) => c.code).join("\n");
    if (!text) {
      setError("لا توجد أكواد للنسخ");
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => {
        setCopySuccess(true);
        setError("");
        setTimeout(() => setCopySuccess(false), 2000);
      },
      () => setError("فشل النسخ")
    );
  }

  function handleDelete(id: string) {
    if (confirmDeleteIds.has(id)) {
      setDeletingIds((prev) => new Set(prev).add(id));
      fetch("/api/dashboard/codes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      })
        .then((res) => res.json().catch(() => ({})))
        .then((data) => {
          if (data.error) throw new Error(data.error);
          setConfirmDeleteIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          router.refresh();
          load();
        })
        .catch((e) => alert(e instanceof Error ? e.message : "فشل الحذف"))
        .finally(() => setDeletingIds((prev) => { const s = new Set(prev); s.delete(id); return s; }));
      return;
    }
    setConfirmDeleteIds((prev) => new Set(prev).add(id));
  }

  function handleBulkDelete(ids: string[]) {
    if (ids.length === 0) return;
    if (!confirm(`حذف ${ids.length} كود نهائياً؟`)) return;
    setDeletingIds((prev) => new Set([...prev, ...ids]));
    fetch("/api/dashboard/codes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setConfirmDeleteIds(new Set());
        router.refresh();
        load();
      })
      .catch((e) => alert(e instanceof Error ? e.message : "فشل الحذف"))
      .finally(() => setDeletingIds((prev) => { const s = new Set(prev); ids.forEach((id) => s.delete(id)); return s; }));
  }

  const unusedCodes = filteredCodes.filter((c) => !c.usedAt);
  const selectedForBulkDelete = selectedIds.size > 0 ? Array.from(selectedIds) : [];

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
      {copySuccess && (
        <div className="rounded-[var(--radius-btn)] bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">
          تم نسخ الأكواد إلى الحافظة
        </div>
      )}

      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">إنشاء أكواد جديدة</h3>
        <form onSubmit={handleGenerate} className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">الدورة</label>
            <select
              value={createCourseId}
              onChange={(e) => setCreateCourseId(e.target.value)}
              className="mt-1 min-w-[200px] rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            >
              <option value="">— اختر الدورة —</option>
              {courseOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[260px]">
            <label className="block text-sm font-medium text-[var(--color-foreground)]">
              نطاق الكود (اختياري)
            </label>
            <div className="mt-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-2 text-sm">
              {!createCourseId ? (
                <span className="text-[var(--color-muted)]">اختر دورة أولاً لعرض المحتوى.</span>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-[var(--color-muted)]">
                    اتركه بدون تحديد لفتح <span className="font-semibold">الدورة كاملة</span>. أو اختر حصصاً/اختبارات لفتح <span className="font-semibold">محتوى محدد</span> فقط.
                  </p>

                  {/* الحصص */}
                  <div>
                    <p className="mb-1 text-xs font-semibold text-[var(--color-foreground)]">الحصص</p>
                    {lessonsLoading ? (
                      <span className="text-[var(--color-muted)]">جاري تحميل الحصص...</span>
                    ) : courseLessons.length === 0 ? (
                      <span className="text-[var(--color-muted)]">لا توجد حصص في هذه الدورة.</span>
                    ) : (
                      <>
                        <div className="max-h-32 space-y-1 overflow-auto pr-1">
                          {courseLessons.map((l) => {
                            const title = l.titleAr ?? l.title;
                            const checked = selectedLessonIds.has(l.id);
                            return (
                              <label key={l.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-[var(--color-border)]/30">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    setSelectedLessonIds((prev) => {
                                      const next = new Set(prev);
                                      if (e.target.checked) next.add(l.id);
                                      else next.delete(l.id);
                                      return next;
                                    });
                                  }}
                                  className="rounded border-[var(--color-border)]"
                                />
                                <span className="truncate" title={title}>{title}</span>
                              </label>
                            );
                          })}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedLessonIds(new Set(courseLessons.map((l) => l.id)))}
                            className="rounded border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-border)]/30"
                          >
                            تحديد كل الحصص
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedLessonIds(new Set())}
                            className="rounded border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-border)]/30"
                          >
                            مسح التحديد
                          </button>
                          {selectedLessonIds.size > 0 && (
                            <span className="text-xs text-[var(--color-muted)]">
                              محدد {selectedLessonIds.size} حصة
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* الاختبارات */}
                  <div>
                    <p className="mb-1 text-xs font-semibold text-[var(--color-foreground)]">الاختبارات</p>
                    {quizzesLoading ? (
                      <span className="text-[var(--color-muted)]">جاري تحميل الاختبارات...</span>
                    ) : courseQuizzes.length === 0 ? (
                      <span className="text-[var(--color-muted)]">لا توجد اختبارات في هذه الدورة.</span>
                    ) : (
                      <>
                        <div className="max-h-32 space-y-1 overflow-auto pr-1">
                          {courseQuizzes.map((q) => {
                            const checked = selectedQuizIds.has(q.id);
                            return (
                              <label key={q.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-[var(--color-border)]/30">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    setSelectedQuizIds((prev) => {
                                      const next = new Set(prev);
                                      if (e.target.checked) next.add(q.id);
                                      else next.delete(q.id);
                                      return next;
                                    });
                                  }}
                                  className="rounded border-[var(--color-border)]"
                                />
                                <span className="truncate" title={q.title}>{q.title}</span>
                              </label>
                            );
                          })}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedQuizIds(new Set(courseQuizzes.map((q) => q.id)))}
                            className="rounded border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-border)]/30"
                          >
                            تحديد كل الاختبارات
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedQuizIds(new Set())}
                            className="rounded border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-border)]/30"
                          >
                            مسح التحديد
                          </button>
                          {selectedQuizIds.size > 0 && (
                            <span className="text-xs text-[var(--color-muted)]">
                              محدد {selectedQuizIds.size} اختبار
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">عدد الأكواد (1–500)</label>
            <input
              type="number"
              min={1}
              max={500}
              value={createCount}
              onChange={(e) => setCreateCount(Number(e.target.value) || 1)}
              className="mt-1 w-24 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={generating}
            className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {generating ? "جاري الإنشاء..." : "إنشاء الأكواد"}
          </button>
        </form>
      </section>

      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-background)]/50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
              قائمة الأكواد ({filteredCodes.length}{searchCode.trim() ? ` من ${codes.length}` : ""})
            </h3>
            <input
              type="search"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="بحث عن الكود..."
              className="min-w-[160px] max-w-[220px] rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-sm placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            <select
              value={filterCourseId}
              onChange={(e) => setFilterCourseId(e.target.value)}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-sm"
            >
              <option value="">كل الدورات</option>
              {courseOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={copyAllUnused}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--color-background)]"
            >
              نسخ الأكواد غير المستخدمة ({unusedCodes.length})
            </button>
            <button
              type="button"
              onClick={copyAll}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--color-background)]"
            >
              نسخ كل الأكواد
            </button>
            {selectedForBulkDelete.length > 0 && (
              <button
                type="button"
                onClick={() => handleBulkDelete(selectedForBulkDelete)}
                className="rounded-[var(--radius-btn)] bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              >
                حذف المحدد ({selectedForBulkDelete.length})
              </button>
            )}
          </div>
        </div>
        {codes.length === 0 ? (
          <p className="p-8 text-center text-[var(--color-muted)]">لا توجد أكواد. أنشئ أكواداً من النموذج أعلاه.</p>
        ) : filteredCodes.length === 0 ? (
          <p className="p-8 text-center text-[var(--color-muted)]">لا توجد أكواد تطابق البحث.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]/30">
                  <th className="p-2 text-right">
                    <input
                      type="checkbox"
                      checked={filteredCodes.length > 0 && selectedIds.size === filteredCodes.length}
                      onChange={toggleSelectAll}
                      className="rounded border-[var(--color-border)]"
                    />
                  </th>
                  <th className="p-2 text-right font-medium text-[var(--color-foreground)]">الدورة</th>
                  <th className="p-2 text-right font-medium text-[var(--color-foreground)]">الكود</th>
                  <th className="p-2 text-right font-medium text-[var(--color-foreground)]">النطاق</th>
                  <th className="p-2 text-right font-medium text-[var(--color-foreground)]">التاريخ</th>
                  <th className="p-2 text-right font-medium text-[var(--color-foreground)]">الحالة</th>
                  <th className="p-2 text-right font-medium text-[var(--color-foreground)]">قديم/جديد</th>
                  <th className="p-2 text-right font-medium text-[var(--color-foreground)]">حذف</th>
                </tr>
              </thead>
              <tbody>
                {filteredCodes.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--color-border)]">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleSelect(row.id)}
                        className="rounded border-[var(--color-border)]"
                      />
                    </td>
                    <td className="p-2 text-[var(--color-foreground)]">
                      {row.courseTitleAr ?? row.courseTitle ?? row.courseId}
                    </td>
                    <td className="p-2 font-mono text-[var(--color-foreground)]">{row.code}</td>
                    <td className="p-2 text-[var(--color-muted)]">
                      {(() => {
                        const lc = row.lessonCount ?? 0;
                        const qc = row.quizCount ?? 0;
                        if (lc === 0 && qc === 0) return "الدورة كاملة";
                        if (lc > 0 && qc > 0) return `حصص (${lc}) + اختبارات (${qc})`;
                        if (lc > 0) return `حصص محددة (${lc})`;
                        return `اختبارات محددة (${qc})`;
                      })()}
                    </td>
                    <td className="p-2 text-[var(--color-muted)]">
                      {row.createdAt ? new Date(row.createdAt).toLocaleDateString("ar-EG") : "—"}
                    </td>
                    <td className="p-2">
                      {row.usedAt ? (
                        <span className="text-amber-600 dark:text-amber-400">مستخدم</span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400">غير مستخدم</span>
                      )}
                    </td>
                    <td className="p-2">
                      {isNewestBatch(row.createdAt) ? (
                        <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800 dark:bg-green-900/40 dark:text-green-300">جديد</span>
                      ) : (
                        <span className="rounded bg-[var(--color-muted)]/20 px-1.5 py-0.5 text-xs text-[var(--color-muted)]">قديم</span>
                      )}
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        disabled={deletingIds.has(row.id)}
                        className={
                          confirmDeleteIds.has(row.id)
                            ? "font-medium text-red-600 hover:underline"
                            : "text-red-600 hover:underline disabled:opacity-50"
                        }
                      >
                        {deletingIds.has(row.id) ? "جاري الحذف..." : confirmDeleteIds.has(row.id) ? "اضغط مرة أخرى للحذف" : "حذف"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
