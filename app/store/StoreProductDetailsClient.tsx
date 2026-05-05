"use client";

import Link from "next/link";
import { useState } from "react";
import type { StoreProduct } from "@/lib/types";

export function StoreProductDetailsClient({
  product,
  isSubscribed,
  isLoggedIn,
  initiallyOwned,
}: {
  product: StoreProduct;
  isSubscribed: boolean;
  isLoggedIn: boolean;
  initiallyOwned: boolean;
}) {
  const [owned, setOwned] = useState(initiallyOwned);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canAccess = isSubscribed || owned;
  const canDownload = canAccess && !!product.pdfUrl;

  async function buy() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/store/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "فشل الشراء");
      setOwned(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الشراء");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link href="/store" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
            الرجوع إلى المتجر
          </Link>
        </div>

        <div className="grid gap-6 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] sm:p-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)]">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex min-h-[280px] items-center justify-center bg-[var(--color-primary)]/10 text-[var(--color-muted)]">
                لا توجد صورة
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">{product.title}</h1>

            <div className="mt-3 flex items-center gap-2">
              {isSubscribed ? (
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-500">
                  مجاني ضمن اشتراكك
                </span>
              ) : owned ? (
                <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-400">
                  تم الشراء بنجاح
                </span>
              ) : (
                <span className="text-lg font-extrabold text-[var(--color-primary)]">
                  {Number(product.price).toFixed(2)} ج.م
                </span>
              )}
            </div>

            <p className="mt-5 whitespace-pre-line text-sm leading-7 text-[var(--color-muted)] sm:text-base">
              {product.description || "لا يوجد وصف لهذا المنتج حالياً."}
            </p>

            {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}

            <div className="mt-6">
              {canDownload ? (
                <a
                  href={product.pdfUrl ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
                >
                  تحميل PDF
                </a>
              ) : canAccess ? (
                <span className="text-sm text-[var(--color-muted)]">الملف غير متاح حالياً</span>
              ) : isLoggedIn ? (
                <button
                  onClick={() => void buy()}
                  disabled={loading}
                  className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
                >
                  {loading ? "جاري الشراء..." : "شراء المنتج"}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
                >
                  تسجيل الدخول للشراء
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

