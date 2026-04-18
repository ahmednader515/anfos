"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { StoreProduct } from "@/lib/types";

type AdminPurchaseRow = {
  purchaseId: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  productId: string;
  productTitle: string;
  pricePaid: number;
  createdAt: string;
};

type SalesStats = {
  purchasesCount: number;
  buyersCount: number;
  soldProductsCount: number;
  revenue: number;
  totalCost: number;
  totalProfit: number;
  profitMarginPercent: number | null;
  byProduct: {
    productId: string;
    productTitle: string;
    unitsSold: number;
    revenue: number;
    costTotal: number;
    profit: number;
  }[];
};

export function StoreAdminClient({
  initialEnabled,
  initialHomeStoreTitle,
  initialHomeStoreDescription,
  initialProducts,
  initialPurchases,
  initialStats,
}: {
  initialEnabled: boolean;
  initialHomeStoreTitle: string;
  initialHomeStoreDescription: string;
  initialProducts: StoreProduct[];
  initialPurchases: AdminPurchaseRow[];
  initialStats: SalesStats;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [products, setProducts] = useState(initialProducts);
  const [purchases, setPurchases] = useState(initialPurchases);
  const [stats, setStats] = useState(initialStats);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [searchStudent, setSearchStudent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCostPrice, setEditCostPrice] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editPdfUrl, setEditPdfUrl] = useState("");
  const [editImageUploading, setEditImageUploading] = useState(false);
  const [editImageError, setEditImageError] = useState("");
  const [homeStoreTitle, setHomeStoreTitle] = useState(initialHomeStoreTitle);
  const [homeStoreDescription, setHomeStoreDescription] = useState(initialHomeStoreDescription);
  const [homeCopySaving, setHomeCopySaving] = useState(false);

  useEffect(() => {
    setHomeStoreTitle(initialHomeStoreTitle);
    setHomeStoreDescription(initialHomeStoreDescription);
  }, [initialHomeStoreTitle, initialHomeStoreDescription]);

  const reload = useCallback(async () => {
    const res = await fetch("/api/dashboard/store-products", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { products?: StoreProduct[] };
    if (data.products) setProducts(data.products);
  }, []);

  const reloadPurchases = useCallback(async () => {
    const res = await fetch("/api/dashboard/store-purchases", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { purchases?: AdminPurchaseRow[]; stats?: SalesStats };
    if (data.purchases) setPurchases(data.purchases);
    if (data.stats) setStats(data.stats);
  }, []);

  async function patchEnabled(next: boolean) {
    setLoading(true);
    setError("");
    const res = await fetch("/api/dashboard/settings/store-enabled", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "فشل التحديث");
    setEnabled(next);
    setSuccess(next ? "تم تفعيل متجر المنصة" : "تم إيقاف متجر المنصة");
    router.refresh();
  }

  async function saveHomeStoreCopy(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const t = homeStoreTitle.trim();
    if (!t) {
      setError("أدخل عنوانًا لقسم المتجر في الصفحة الرئيسية");
      return;
    }
    setHomeCopySaving(true);
    const res = await fetch("/api/dashboard/settings/store-home-section", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: t,
        description: homeStoreDescription.trim(),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setHomeCopySaving(false);
    if (!res.ok) return setError(data.error ?? "فشل حفظ النصوص");
    setSuccess("تم حفظ عنوان ووصف قسم المتجر في الصفحة الرئيسية");
    router.refresh();
  }

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const p = Number(price);
    const cRaw = costPrice.trim() === "" ? 0 : Number(costPrice);
    if (!title.trim() || !Number.isFinite(p) || p < 0) {
      setError("أدخل اسم المنتج وسعرًا صحيحًا");
      return;
    }
    if (!Number.isFinite(cRaw) || cRaw < 0) {
      setError("أدخل تكلفة وحدة صحيحة أو اتركها فارغة (تُحسب كصفر)");
      return;
    }
    if (!pdfUrl.trim()) {
      setError("رابط ملف PDF إجباري");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/dashboard/store-products", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        price: p,
        costPrice: cRaw,
        imageUrl: imageUrl.trim() || null,
        pdfUrl: pdfUrl.trim() || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "فشل إنشاء المنتج");
    setSuccess("تم إنشاء المنتج");
    setTitle("");
    setDescription("");
    setPrice("");
    setCostPrice("");
    setImageUrl("");
    setPdfUrl("");
    await reload();
    router.refresh();
  }

  async function onImageFile(file: File | undefined) {
    if (!file) return;
    setImageError("");
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) setImageUrl(data.url);
      else setImageError(data.error ?? "فشل رفع الصورة");
    } catch {
      setImageError("فشل الاتصال بالخادم");
    } finally {
      setImageUploading(false);
    }
  }

  function startEdit(row: StoreProduct) {
    setError("");
    setSuccess("");
    setEditingId(row.id);
    setEditTitle(row.title);
    setEditDescription(row.description ?? "");
    setEditPrice(String(Number(row.price)));
    setEditCostPrice(String(Number(row.costPrice ?? 0)));
    setEditImageUrl(row.imageUrl ?? "");
    setEditPdfUrl(row.pdfUrl ?? "");
    setEditImageError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setEditPrice("");
    setEditCostPrice("");
    setEditImageUrl("");
    setEditPdfUrl("");
    setEditImageError("");
  }

  async function onEditImageFile(file: File | undefined) {
    if (!file) return;
    setEditImageError("");
    setEditImageUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) setEditImageUrl(data.url);
      else setEditImageError(data.error ?? "فشل رفع الصورة");
    } catch {
      setEditImageError("فشل الاتصال بالخادم");
    } finally {
      setEditImageUploading(false);
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setError("");
    setSuccess("");
    const p = Number(editPrice);
    const ec = editCostPrice.trim() === "" ? 0 : Number(editCostPrice);
    if (!editTitle.trim() || !Number.isFinite(p) || p < 0) {
      setError("أدخل اسم المنتج وسعرًا صحيحًا");
      return;
    }
    if (!Number.isFinite(ec) || ec < 0) {
      setError("أدخل تكلفة وحدة صحيحة أو اتركها فارغة (تُحسب كصفر)");
      return;
    }
    if (!editPdfUrl.trim()) {
      setError("رابط ملف PDF إجباري");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/dashboard/store-products/${encodeURIComponent(editingId)}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle.trim(),
        description: editDescription.trim(),
        price: p,
        costPrice: ec,
        imageUrl: editImageUrl.trim() || null,
        pdfUrl: editPdfUrl.trim() || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "فشل تعديل المنتج");
    setSuccess("تم تحديث المنتج");
    cancelEdit();
    await reload();
    router.refresh();
  }

  async function toggleActive(row: StoreProduct, next: boolean) {
    const res = await fetch(`/api/dashboard/store-products/${encodeURIComponent(row.id)}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: next }),
    });
    if (!res.ok) return;
    await reload();
    router.refresh();
  }

  async function removeRow(row: StoreProduct) {
    if (!window.confirm(`حذف المنتج «${row.title}»؟`)) return;
    const res = await fetch(`/api/dashboard/store-products/${encodeURIComponent(row.id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) return;
    await reload();
    await reloadPurchases();
    router.refresh();
  }

  async function removePurchase(row: AdminPurchaseRow) {
    if (!window.confirm(`إزالة المنتج «${row.productTitle}» من مشتريات الطالب ${row.studentName}؟`)) return;
    const res = await fetch(`/api/dashboard/store-purchases/${encodeURIComponent(row.purchaseId)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) return;
    await reloadPurchases();
    setSuccess("تم حذف المنتج من مشتريات الطالب");
    router.refresh();
  }

  const filteredPurchases = purchases.filter((r) =>
    `${r.studentName} ${r.studentEmail}`.toLowerCase().includes(searchStudent.trim().toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="text-xl font-bold text-[var(--color-foreground)]">متجر المنصة</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          إضافة ملازم وكتب PDF وبيعها للطلاب. النصوص التالية تظهر في بطاقة المتجر على الصفحة الرئيسية عند تفعيل المتجر ووجود منتجات.
        </p>
        <form onSubmit={(e) => void saveHomeStoreCopy(e)} className="mt-5 space-y-3 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
          <p className="text-sm font-semibold text-[var(--color-foreground)]">الظهور في الصفحة الرئيسية</p>
          <input
            value={homeStoreTitle}
            onChange={(e) => setHomeStoreTitle(e.target.value)}
            placeholder="عنوان قسم المتجر"
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          />
          <textarea
            value={homeStoreDescription}
            onChange={(e) => setHomeStoreDescription(e.target.value)}
            placeholder="وصف قسم المتجر"
            rows={4}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={homeCopySaving}
            className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {homeCopySaving ? "جاري الحفظ..." : "حفظ العنوان والوصف للرئيسية"}
          </button>
        </form>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button disabled={loading || enabled} onClick={() => void patchEnabled(true)} className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">تفعيل الميزة</button>
          <button disabled={loading || !enabled} onClick={() => void patchEnabled(false)} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium">إيقاف الميزة</button>
          <span className="text-sm text-[var(--color-muted)]">الحالة: {enabled ? "مفعلة" : "متوقفة"}</span>
        </div>
      </div>

      {error ? <div className="rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="rounded-[var(--radius-btn)] bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">{success}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-xs text-[var(--color-muted)]">إجمالي عمليات الشراء</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-foreground)]">{stats.purchasesCount}</p>
        </div>
        <div className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-xs text-[var(--color-muted)]">عدد الطلاب المشترين</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-foreground)]">{stats.buyersCount}</p>
        </div>
        <div className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-xs text-[var(--color-muted)]">المنتجات المباعة</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-foreground)]">{stats.soldProductsCount}</p>
        </div>
        <div className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-xs text-[var(--color-muted)]">إجمالي إيراد المتجر</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-primary)]">{stats.revenue.toFixed(2)} ج.م</p>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="text-lg font-semibold text-[var(--color-foreground)]">أرباح منتجات المتجر</h3>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          يُحسب الربح من الفرق بين السعر المدفوع فعليًا وتكلفة الوحدة المسجّلة لكل منتج. اشتراكات الطلاب النشطة تُسجّل غالبًا بسعر مدفوع 0.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
            <p className="text-xs text-[var(--color-muted)]">إجمالي تكلفة الوحدات المباعة</p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-foreground)]">{stats.totalCost.toFixed(2)} ج.م</p>
          </div>
          <div className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
            <p className="text-xs text-[var(--color-muted)]">إجمالي الربح التقديري</p>
            <p className="mt-1 text-2xl font-bold text-emerald-500">{stats.totalProfit.toFixed(2)} ج.م</p>
          </div>
          <div className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
            <p className="text-xs text-[var(--color-muted)]">هامش الربح على الإيراد</p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-foreground)]">
              {stats.profitMarginPercent === null ? "—" : `${stats.profitMarginPercent.toFixed(1)}%`}
            </p>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-right text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-muted)]">
                <th className="px-3 py-2 font-medium">المنتج</th>
                <th className="px-3 py-2 font-medium">القطع المباعة</th>
                <th className="px-3 py-2 font-medium">إيراد</th>
                <th className="px-3 py-2 font-medium">تكلفة</th>
                <th className="px-3 py-2 font-medium">ربح</th>
              </tr>
            </thead>
            <tbody>
              {stats.byProduct.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[var(--color-muted)]">
                    لا مبيعات بعد — أو لم تُسجَّل تكاليف للمنتجات.
                  </td>
                </tr>
              ) : (
                stats.byProduct.map((row) => (
                  <tr key={row.productId} className="border-b border-[var(--color-border)]/60">
                    <td className="px-3 py-2 font-medium text-[var(--color-foreground)]">{row.productTitle}</td>
                    <td className="px-3 py-2">{row.unitsSold}</td>
                    <td className="px-3 py-2">{row.revenue.toFixed(2)} ج.م</td>
                    <td className="px-3 py-2 text-[var(--color-muted)]">{row.costTotal.toFixed(2)} ج.م</td>
                    <td className="px-3 py-2 font-medium text-emerald-600">{row.profit.toFixed(2)} ج.م</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={(e) => void createProduct(e)} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-3">
        <h3 className="text-lg font-semibold text-[var(--color-foreground)]">إضافة منتج جديد</h3>
        <div>
          {imageUrl ? (
            <div className="mb-2 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="h-16 w-16 rounded object-cover border border-[var(--color-border)]" />
              <button type="button" onClick={() => setImageUrl("")} className="text-xs text-red-500 underline">إزالة الصورة</button>
            </div>
          ) : null}
          <label className="inline-flex cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-border)]/50">
            {imageUploading ? "جاري رفع الصورة..." : "رفع صورة المنتج"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={imageUploading}
              onChange={(e) => {
                void onImageFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {imageError ? <p className="mt-1 text-xs text-red-500">{imageError}</p> : null}
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="اسم المنتج (ملزمة/كتاب)" className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف المنتج" rows={3} className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
        <div>
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="سعر المنتج بالجنيه"
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <p className="mt-1 text-xs text-[var(--color-muted)]">يُقبل أرقام فقط، والسعر بالجنيه المصري.</p>
        </div>
        <div>
          <input
            type="number"
            min="0"
            step="0.01"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            placeholder="تكلفة الوحدة (اختياري — للإحصائيات)"
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <p className="mt-1 text-xs text-[var(--color-muted)]">تُستخدم في حساب الربح لكل عملية بيع (تكلفة الطباعة/التوزيع وغيرها).</p>
        </div>
        <input
          required
          value={pdfUrl}
          onChange={(e) => setPdfUrl(e.target.value)}
          placeholder="رابط ملف PDF (إجباري)"
          className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
        />
        <button disabled={loading} className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm text-white disabled:opacity-50">{loading ? "جاري..." : "حفظ المنتج"}</button>
      </form>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="text-lg font-semibold text-[var(--color-foreground)]">منتجات المتجر</h3>
        {editingId ? (
          <form onSubmit={(e) => void saveEdit(e)} className="mt-4 space-y-3 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
            <h4 className="text-sm font-semibold text-[var(--color-foreground)]">تعديل المنتج</h4>
            <div>
              {editImageUrl ? (
                <div className="mb-2 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={editImageUrl} alt="" className="h-16 w-16 rounded object-cover border border-[var(--color-border)]" />
                  <button type="button" onClick={() => setEditImageUrl("")} className="text-xs text-red-500 underline">إزالة الصورة</button>
                </div>
              ) : null}
              <label className="inline-flex cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-border)]/50">
                {editImageUploading ? "جاري رفع الصورة..." : "رفع صورة جديدة"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={editImageUploading}
                  onChange={(e) => {
                    void onEditImageFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
              {editImageError ? <p className="mt-1 text-xs text-red-500">{editImageError}</p> : null}
            </div>
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="اسم المنتج" className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2" />
            <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="وصف المنتج" rows={3} className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2" />
            <input
              type="number"
              min="0"
              step="0.01"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              placeholder="سعر المنتج بالجنيه"
              className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={editCostPrice}
              onChange={(e) => setEditCostPrice(e.target.value)}
              placeholder="تكلفة الوحدة (للإحصائيات)"
              className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
            />
            <input
              required
              value={editPdfUrl}
              onChange={(e) => setEditPdfUrl(e.target.value)}
              placeholder="رابط ملف PDF"
              className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
            />
            <div className="flex items-center gap-3">
              <button disabled={loading} className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm text-white disabled:opacity-50">{loading ? "جاري..." : "حفظ التعديل"}</button>
              <button type="button" disabled={loading} onClick={cancelEdit} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm">إلغاء</button>
            </div>
          </form>
        ) : null}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] p-4">
              <p className="font-semibold">{p.title}</p>
              <p className="mt-1 text-sm text-[var(--color-muted)] line-clamp-2">{p.description}</p>
              <p className="mt-2 text-sm">{Number(p.price).toFixed(2)} ج.م</p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">تكلفة الوحدة: {Number(p.costPrice ?? 0).toFixed(2)} ج.م</p>
              <div className="mt-3 flex gap-3 text-sm">
                <button onClick={() => startEdit(p)} className="underline text-amber-500">تعديل</button>
                <button onClick={() => void toggleActive(p, !p.isActive)} className="underline text-[var(--color-primary)]">{p.isActive ? "إخفاء" : "تفعيل"}</button>
                <button onClick={() => void removeRow(p)} className="underline text-red-500">حذف</button>
              </div>
            </div>
          ))}
          {products.length === 0 ? <p className="text-sm text-[var(--color-muted)]">لا توجد منتجات بعد.</p> : null}
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-[var(--color-foreground)]">الطلاب الذين اشتروا من المتجر</h3>
          <input
            value={searchStudent}
            onChange={(e) => setSearchStudent(e.target.value)}
            placeholder="ابحث عن الطالب بالاسم أو البريد..."
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm sm:max-w-sm"
          />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-right text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-muted)]">
                <th className="px-3 py-2 font-medium">الطالب</th>
                <th className="px-3 py-2 font-medium">البريد</th>
                <th className="px-3 py-2 font-medium">المنتج</th>
                <th className="px-3 py-2 font-medium">السعر المدفوع</th>
                <th className="px-3 py-2 font-medium">الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-muted)]">لا توجد نتائج.</td>
                </tr>
              ) : (
                filteredPurchases.map((row) => (
                  <tr key={row.purchaseId} className="border-b border-[var(--color-border)]/60">
                    <td className="px-3 py-2">{row.studentName}</td>
                    <td className="px-3 py-2 text-[var(--color-muted)]">{row.studentEmail}</td>
                    <td className="px-3 py-2">{row.productTitle}</td>
                    <td className="px-3 py-2">{row.pricePaid.toFixed(2)} ج.م</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => void removePurchase(row)}
                        className="rounded-[var(--radius-btn)] border border-red-500/40 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-500/10"
                      >
                        إزالة المنتج من الطالب
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
