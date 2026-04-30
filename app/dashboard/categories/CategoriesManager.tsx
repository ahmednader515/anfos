"use client";

import { useEffect, useMemo, useState } from "react";

type CategoryRow = {
  id: string;
  name: string;
  nameAr?: string | null;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  order?: number;
};

type SubCategoryRow = {
  id: string;
  categoryId: string;
  parentId?: string | null;
  name: string;
  nameAr?: string | null;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  order?: number;
};

function normalizeCat(row: Record<string, unknown>): CategoryRow {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    nameAr: (row.nameAr ?? row.name_ar ?? null) as string | null,
    slug: String(row.slug ?? ""),
    description: (row.description ?? null) as string | null,
    imageUrl: (row.imageUrl ?? row.image_url ?? null) as string | null,
    order: typeof row.order === "number" ? row.order : typeof row["order"] === "number" ? (row["order"] as number) : 0,
  };
}

function normalizeSub(row: Record<string, unknown>): SubCategoryRow {
  return {
    id: String(row.id ?? ""),
    categoryId: String(row.categoryId ?? row.category_id ?? ""),
    parentId: (row.parentId ?? row.parent_subcategory_id ?? null) as string | null,
    name: String(row.name ?? ""),
    nameAr: (row.nameAr ?? row.name_ar ?? null) as string | null,
    slug: String(row.slug ?? ""),
    description: (row.description ?? null) as string | null,
    imageUrl: (row.imageUrl ?? row.image_url ?? null) as string | null,
    order: typeof row.order === "number" ? row.order : typeof row["order"] === "number" ? (row["order"] as number) : 0,
  };
}

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.set("file", file);
  const res = await fetch("/api/upload/image", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) {
    const msg = data?.missing?.length ? `${data.error} ${data.missing.join(", ")}` : (data.error || "فشل رفع الصورة");
    throw new Error(msg);
  }
  return String(data.url);
}

export function CategoriesManager() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategoryRow[]>([]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const [createCat, setCreateCat] = useState({ name: "", nameAr: "", order: 0, imageUrl: "" });
  const [createSub, setCreateSub] = useState({ name: "", nameAr: "", order: 0, imageUrl: "", parentId: "" });

  const [busyId, setBusyId] = useState<string | null>(null);
  const [imageBusy, setImageBusy] = useState<string | null>(null);

  const filteredSubs = useMemo(() => {
    const cid = selectedCategoryId.trim();
    if (!cid) return [];
    return subcategories.filter((s) => s.categoryId === cid);
  }, [subcategories, selectedCategoryId]);

  const subTree = useMemo(() => {
    const list = filteredSubs;
    const byParent = new Map<string, SubCategoryRow[]>();
    for (const s of list) {
      const key = s.parentId?.trim() || "__root__";
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(s);
    }
    for (const [k, arr] of byParent.entries()) {
      arr.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      byParent.set(k, arr);
    }
    const out: Array<{ node: SubCategoryRow; depth: number }> = [];
    const walk = (parentKey: string, depth: number) => {
      const children = byParent.get(parentKey) ?? [];
      for (const child of children) {
        out.push({ node: child, depth });
        walk(child.id, depth + 1);
      }
    };
    walk("__root__", 0);
    return out;
  }, [filteredSubs]);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const catsRes = await fetch("/api/categories");
      const cats = await catsRes.json().catch(() => ({}));
      if (!catsRes.ok) {
        const msg = (cats as { error?: unknown })?.error;
        throw new Error(typeof msg === "string" ? msg : "فشل تحميل الأقسام");
      }
      const catsArr = Array.isArray(cats) ? cats.map((r) => normalizeCat(r as Record<string, unknown>)) : [];
      setCategories(catsArr);
      if (!selectedCategoryId && catsArr.length) setSelectedCategoryId(catsArr[0].id);

      // load subcategories for selected category (or first category)
      const cid = (selectedCategoryId || catsArr[0]?.id || "").trim();
      if (cid) {
        const subsRes = await fetch(`/api/subcategories?categoryId=${encodeURIComponent(cid)}`);
        const subs = await subsRes.json().catch(() => ({}));
        if (!subsRes.ok) {
          const msg = (subs as { error?: unknown })?.error;
          throw new Error(typeof msg === "string" ? msg : "فشل تحميل الأقسام الفرعية");
        }
        setSubcategories(Array.isArray(subs) ? subs.map((r) => normalizeSub(r as Record<string, unknown>)) : []);
      } else {
        setSubcategories([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }

  async function loadSubcatsFor(categoryId: string) {
    const cid = categoryId.trim();
    if (!cid) {
      setSubcategories([]);
      return;
    }
    const res = await fetch(`/api/subcategories?categoryId=${encodeURIComponent(cid)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = (data as { error?: unknown })?.error;
      setError(typeof msg === "string" ? msg : "فشل تحميل الأقسام الفرعية");
      setSubcategories([]);
      return;
    }
    setSubcategories(Array.isArray(data) ? data.map((r) => normalizeSub(r as Record<string, unknown>)) : []);
  }

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedCategoryId.trim()) return;
    void loadSubcatsFor(selectedCategoryId);
  }, [selectedCategoryId]);

  async function handleCreateCategory() {
    const name = createCat.name.trim();
    if (!name) return;
    setBusyId("create-cat");
    setError("");
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          nameAr: createCat.nameAr.trim() || null,
          order: Number(createCat.order) || 0,
          imageUrl: createCat.imageUrl.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل إنشاء القسم");
      const newCat = normalizeCat(data as Record<string, unknown>);
      setCategories((prev) => [newCat, ...prev]);
      setSelectedCategoryId(newCat.id);
      setCreateCat({ name: "", nameAr: "", order: 0, imageUrl: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل إنشاء القسم");
    } finally {
      setBusyId(null);
    }
  }

  async function handleUpdateCategory(id: string, patch: Partial<CategoryRow>) {
    setBusyId(`cat-${id}`);
    setError("");
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(patch.name !== undefined ? { name: patch.name } : {}),
          ...(patch.nameAr !== undefined ? { nameAr: patch.nameAr } : {}),
          ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
          ...(patch.description !== undefined ? { description: patch.description } : {}),
          ...(patch.imageUrl !== undefined ? { imageUrl: patch.imageUrl } : {}),
          ...(patch.order !== undefined ? { order: patch.order } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل تعديل القسم");
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل تعديل القسم");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("حذف هذا القسم؟ سيتم إلغاء ربطه من الدورات.")) return;
    setBusyId(`cat-del-${id}`);
    setError("");
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل حذف القسم");
      setCategories((prev) => prev.filter((c) => c.id !== id));
      if (selectedCategoryId === id) {
        const next = categories.find((c) => c.id !== id)?.id || "";
        setSelectedCategoryId(next);
      }
      setSubcategories([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل حذف القسم");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreateSubCategory() {
    const cid = selectedCategoryId.trim();
    const name = createSub.name.trim();
    if (!cid || !name) return;
    setBusyId("create-sub");
    setError("");
    try {
      const res = await fetch("/api/subcategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          categoryId: cid,
          imageUrl: createSub.imageUrl.trim() || null,
          parentId: createSub.parentId.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل إنشاء القسم الفرعي");
      const newSub = normalizeSub(data as Record<string, unknown>);
      setSubcategories((prev) => [newSub, ...prev]);
      setCreateSub({ name: "", nameAr: "", order: 0, imageUrl: "", parentId: "" });
      await loadSubcatsFor(cid);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل إنشاء القسم الفرعي");
    } finally {
      setBusyId(null);
    }
  }

  async function handleUpdateSubCategory(id: string, patch: Partial<SubCategoryRow>) {
    setBusyId(`sub-${id}`);
    setError("");
    try {
      const res = await fetch(`/api/subcategories/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(patch.name !== undefined ? { name: patch.name } : {}),
          ...(patch.nameAr !== undefined ? { nameAr: patch.nameAr } : {}),
          ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
          ...(patch.description !== undefined ? { description: patch.description } : {}),
          ...(patch.imageUrl !== undefined ? { imageUrl: patch.imageUrl } : {}),
          ...(patch.parentId !== undefined ? { parentId: patch.parentId } : {}),
          ...(patch.order !== undefined ? { order: patch.order } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل تعديل القسم الفرعي");
      setSubcategories((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل تعديل القسم الفرعي");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteSubCategory(id: string) {
    if (!confirm("حذف هذا القسم الفرعي؟ سيتم إلغاء ربطه من الدورات.")) return;
    setBusyId(`sub-del-${id}`);
    setError("");
    try {
      const res = await fetch(`/api/subcategories/${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل حذف القسم الفرعي");
      setSubcategories((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل حذف القسم الفرعي");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">الأقسام</h3>
            <p className="mt-1 text-sm text-[var(--color-muted)]">أنشئ قسمًا ثم اختره لإدارة أقسامه الفرعية.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadAll()}
            disabled={loading}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-[var(--color-background)] disabled:opacity-50"
          >
            تحديث
          </button>
        </div>

        {error ? (
          <div className="mb-4 rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        ) : null}

        <div className="mb-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-background)]/40 p-4">
          <p className="text-sm font-semibold text-[var(--color-foreground)]">إضافة قسم جديد</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              value={createCat.name}
              onChange={(e) => setCreateCat((s) => ({ ...s, name: e.target.value }))}
              placeholder="اسم القسم *"
              className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
            />
            <input
              value={createCat.nameAr}
              onChange={(e) => setCreateCat((s) => ({ ...s, nameAr: e.target.value }))}
              placeholder="اسم عربي (اختياري)"
              className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={createCat.order}
              onChange={(e) => setCreateCat((s) => ({ ...s, order: Number(e.target.value) }))}
              placeholder="ترتيب"
              className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <input
                value={createCat.imageUrl}
                onChange={(e) => setCreateCat((s) => ({ ...s, imageUrl: e.target.value }))}
                placeholder="صورة (رابط اختياري)"
                className="min-w-[180px] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <label className="cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm hover:bg-[var(--color-border)]/40">
              {imageBusy === "create-cat" ? "جاري الرفع..." : "رفع صورة"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={imageBusy === "create-cat"}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setImageBusy("create-cat");
                  setError("");
                  try {
                    const url = await uploadImage(f);
                    setCreateCat((s) => ({ ...s, imageUrl: url }));
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "فشل رفع الصورة");
                  } finally {
                    setImageBusy(null);
                    e.target.value = "";
                  }
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => void handleCreateCategory()}
              disabled={busyId === "create-cat" || !createCat.name.trim()}
              className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
            >
              {busyId === "create-cat" ? "جاري الإنشاء..." : "إنشاء"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-background)]/30 p-6 text-center text-[var(--color-muted)]">
            جاري التحميل...
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((c) => {
              const active = selectedCategoryId === c.id;
              return (
                <div
                  key={c.id}
                  className={`rounded-[var(--radius-card)] border p-4 ${
                    active ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-[var(--color-border)] bg-[var(--color-background)]/20"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryId(c.id)}
                      className="text-right text-sm font-semibold text-[var(--color-foreground)] hover:underline"
                    >
                      {c.nameAr?.trim() || c.name}
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleDeleteCategory(c.id)}
                        disabled={busyId === `cat-del-${c.id}`}
                        className="rounded border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-500/15 disabled:opacity-50"
                      >
                        {busyId === `cat-del-${c.id}` ? "..." : "حذف"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleUpdateCategory(c.id, c)}
                        disabled={busyId === `cat-${c.id}`}
                        className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs font-medium hover:bg-[var(--color-border)]/40 disabled:opacity-50"
                      >
                        {busyId === `cat-${c.id}` ? "..." : "حفظ"}
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input
                      value={c.name}
                      onChange={(e) => setCategories((prev) => prev.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)))}
                      className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                      placeholder="الاسم"
                    />
                    <input
                      value={c.nameAr ?? ""}
                      onChange={(e) => setCategories((prev) => prev.map((x) => (x.id === c.id ? { ...x, nameAr: e.target.value } : x)))}
                      className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                      placeholder="الاسم العربي"
                    />
                    <input
                      value={c.slug}
                      onChange={(e) => setCategories((prev) => prev.map((x) => (x.id === c.id ? { ...x, slug: e.target.value } : x)))}
                      className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                      placeholder="slug"
                    />
                    <input
                      type="number"
                      value={c.order ?? 0}
                      onChange={(e) => setCategories((prev) => prev.map((x) => (x.id === c.id ? { ...x, order: Number(e.target.value) } : x)))}
                      className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                      placeholder="ترتيب"
                    />
                    <input
                      value={c.imageUrl ?? ""}
                      onChange={(e) => setCategories((prev) => prev.map((x) => (x.id === c.id ? { ...x, imageUrl: e.target.value } : x)))}
                      className="sm:col-span-2 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                      placeholder="رابط الصورة"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <label className="cursor-pointer text-xs text-[var(--color-primary)] hover:underline">
                      {imageBusy === `cat-${c.id}` ? "جاري الرفع..." : "رفع/تغيير صورة"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={imageBusy === `cat-${c.id}`}
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setImageBusy(`cat-${c.id}`);
                          setError("");
                          try {
                            const url = await uploadImage(f);
                            setCategories((prev) => prev.map((x) => (x.id === c.id ? { ...x, imageUrl: url } : x)));
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "فشل رفع الصورة");
                          } finally {
                            setImageBusy(null);
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imageUrl} alt="" className="h-10 w-16 rounded object-cover border border-[var(--color-border)]" />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-foreground)]">الأقسام الفرعية</h3>
          <p className="mt-1 text-sm text-[var(--color-muted)]">اختر قسمًا لإدارة الأقسام الفرعية التابعة له.</p>
        </div>

        <div className="mb-4">
          <label className="block text-xs text-[var(--color-muted)]">القسم الرئيسي</label>
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          >
            <option value="">اختر قسمًا</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameAr?.trim() || c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-background)]/40 p-4">
          <p className="text-sm font-semibold text-[var(--color-foreground)]">إضافة قسم فرعي جديد</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              value={createSub.name}
              onChange={(e) => setCreateSub((s) => ({ ...s, name: e.target.value }))}
              placeholder="اسم القسم الفرعي *"
              className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
              disabled={!selectedCategoryId.trim()}
            />
            <input
              value={createSub.nameAr}
              onChange={(e) => setCreateSub((s) => ({ ...s, nameAr: e.target.value }))}
              placeholder="اسم عربي (اختياري)"
              className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
              disabled={!selectedCategoryId.trim()}
            />
            <input
              type="number"
              value={createSub.order}
              onChange={(e) => setCreateSub((s) => ({ ...s, order: Number(e.target.value) }))}
              placeholder="ترتيب"
              className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
              disabled={!selectedCategoryId.trim()}
            />
            <input
              value={createSub.imageUrl}
              onChange={(e) => setCreateSub((s) => ({ ...s, imageUrl: e.target.value }))}
              placeholder="صورة (رابط اختياري)"
              className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
              disabled={!selectedCategoryId.trim()}
            />
            <select
              value={createSub.parentId}
              onChange={(e) => setCreateSub((s) => ({ ...s, parentId: e.target.value }))}
              className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm disabled:opacity-60"
              disabled={!selectedCategoryId.trim()}
            >
              <option value="">بدون أب (مستوى أول)</option>
              {subTree.map(({ node, depth }) => (
                <option key={node.id} value={node.id}>
                  {"— ".repeat(depth)}{node.nameAr?.trim() || node.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <label className="cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm hover:bg-[var(--color-border)]/40">
              {imageBusy === "create-sub" ? "جاري الرفع..." : "رفع صورة"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={imageBusy === "create-sub" || !selectedCategoryId.trim()}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setImageBusy("create-sub");
                  setError("");
                  try {
                    const url = await uploadImage(f);
                    setCreateSub((s) => ({ ...s, imageUrl: url }));
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "فشل رفع الصورة");
                  } finally {
                    setImageBusy(null);
                    e.target.value = "";
                  }
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => void handleCreateSubCategory()}
              disabled={busyId === "create-sub" || !selectedCategoryId.trim() || !createSub.name.trim()}
              className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
            >
              {busyId === "create-sub" ? "جاري الإنشاء..." : "إنشاء"}
            </button>
          </div>
        </div>

        {!selectedCategoryId.trim() ? (
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-background)]/30 p-6 text-center text-[var(--color-muted)]">
            اختر قسمًا لعرض الأقسام الفرعية.
          </div>
        ) : filteredSubs.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-background)]/30 p-6 text-center text-[var(--color-muted)]">
            لا توجد أقسام فرعية لهذا القسم.
          </div>
        ) : (
          <div className="space-y-3">
            {subTree.map(({ node: s, depth }) => (
              <div
                key={s.id}
                className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-background)]/20 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-[var(--color-foreground)]">
                    <span style={{ marginInlineStart: `${depth * 14}px` }}>
                      {s.nameAr?.trim() || s.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleDeleteSubCategory(s.id)}
                      disabled={busyId === `sub-del-${s.id}`}
                      className="rounded border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-500/15 disabled:opacity-50"
                    >
                      {busyId === `sub-del-${s.id}` ? "..." : "حذف"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleUpdateSubCategory(s.id, s)}
                      disabled={busyId === `sub-${s.id}`}
                      className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs font-medium hover:bg-[var(--color-border)]/40 disabled:opacity-50"
                    >
                      {busyId === `sub-${s.id}` ? "..." : "حفظ"}
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input
                    value={s.name}
                    onChange={(e) => setSubcategories((prev) => prev.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)))}
                    className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                    placeholder="الاسم"
                  />
                  <input
                    value={s.nameAr ?? ""}
                    onChange={(e) => setSubcategories((prev) => prev.map((x) => (x.id === s.id ? { ...x, nameAr: e.target.value } : x)))}
                    className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                    placeholder="الاسم العربي"
                  />
                  <input
                    value={s.slug}
                    onChange={(e) => setSubcategories((prev) => prev.map((x) => (x.id === s.id ? { ...x, slug: e.target.value } : x)))}
                    className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                    placeholder="slug"
                  />
                  <input
                    type="number"
                    value={s.order ?? 0}
                    onChange={(e) => setSubcategories((prev) => prev.map((x) => (x.id === s.id ? { ...x, order: Number(e.target.value) } : x)))}
                    className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                    placeholder="ترتيب"
                  />
                  <input
                    value={s.imageUrl ?? ""}
                    onChange={(e) => setSubcategories((prev) => prev.map((x) => (x.id === s.id ? { ...x, imageUrl: e.target.value } : x)))}
                    className="sm:col-span-2 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                    placeholder="رابط الصورة"
                  />
                  <select
                    value={s.parentId ?? ""}
                    onChange={(e) =>
                      setSubcategories((prev) =>
                        prev.map((x) => (x.id === s.id ? { ...x, parentId: e.target.value } : x))
                      )
                    }
                    className="sm:col-span-2 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                  >
                    <option value="">بدون أب (مستوى أول)</option>
                    {subTree
                      .filter(({ node }) => node.id !== s.id)
                      .map(({ node, depth }) => (
                        <option key={node.id} value={node.id}>
                          {"— ".repeat(depth)}{node.nameAr?.trim() || node.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <label className="cursor-pointer text-xs text-[var(--color-primary)] hover:underline">
                    {imageBusy === `sub-${s.id}` ? "جاري الرفع..." : "رفع/تغيير صورة"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={imageBusy === `sub-${s.id}`}
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setImageBusy(`sub-${s.id}`);
                        setError("");
                        try {
                          const url = await uploadImage(f);
                          setSubcategories((prev) => prev.map((x) => (x.id === s.id ? { ...x, imageUrl: url } : x)));
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "فشل رفع الصورة");
                        } finally {
                          setImageBusy(null);
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>
                  {s.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.imageUrl} alt="" className="h-10 w-16 rounded object-cover border border-[var(--color-border)]" />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

