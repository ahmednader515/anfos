"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type {
  HomepageSetting,
  HeroBgPreset,
  PlatformDetailsItem,
  PlatformDetailsPresetIcon,
  PlatformNewsItem,
} from "@/lib/types";
import { HERO_BG_PRESET_GRADIENTS, normalizeHeroHex } from "@/lib/hero-bg";
import {
  DEFAULT_PLATFORM_DETAILS_ITEMS,
  PLATFORM_DETAILS_PRESET_ICON_OPTIONS,
  parsePlatformDetailsItems,
} from "@/lib/platform-details";
import { parsePlatformNewsItems, PLATFORM_NEWS_MAX_ITEMS } from "@/lib/platform-news";

const HERO_BG_PRESET_META: { id: HeroBgPreset; label: string }[] = [
  { id: "navy", label: "أزرق داكن (افتراضي)" },
  { id: "indigo", label: "نيلي" },
  { id: "purple", label: "بنفسجي" },
  { id: "teal", label: "تركواز" },
  { id: "forest", label: "أخضر غامق" },
  { id: "slate", label: "رمادي أزرق" },
  { id: "crimson", label: "أحمر قرنفلي" },
  { id: "rose", label: "وردي داكن" },
  { id: "sunset", label: "برتقالي غروب" },
  { id: "sky", label: "سماوي" },
  { id: "cyan", label: "فيروزي" },
  { id: "stone", label: "رمادي دافئ" },
  { id: "midnight", label: "ليلي" },
  { id: "wine", label: "خمري" },
];

type HeroTemplate = "classic" | "image_slider" | "coming_soon";
type SliderImageKey =
  | "heroSliderImage1"
  | "heroSliderImage2"
  | "heroSliderImage3"
  | "heroSliderImage4"
  | "heroSliderImage5";
type SliderCourseIdKey =
  | "heroSliderCourseId1"
  | "heroSliderCourseId2"
  | "heroSliderCourseId3"
  | "heroSliderCourseId4"
  | "heroSliderCourseId5";

type PublishedCourseOption = {
  id: string;
  slug: string;
  title: string;
  titleAr: string | null;
};

const SLIDER_IMAGE_FIELDS: Array<{
  idx: 1 | 2 | 3 | 4 | 5;
  key: SliderImageKey;
  courseIdKey: SliderCourseIdKey;
}> = [
  { idx: 1, key: "heroSliderImage1", courseIdKey: "heroSliderCourseId1" },
  { idx: 2, key: "heroSliderImage2", courseIdKey: "heroSliderCourseId2" },
  { idx: 3, key: "heroSliderImage3", courseIdKey: "heroSliderCourseId3" },
  { idx: 4, key: "heroSliderImage4", courseIdKey: "heroSliderCourseId4" },
  { idx: 5, key: "heroSliderImage5", courseIdKey: "heroSliderCourseId5" },
];

function initialHeroBgCustom(settings: HomepageSetting): {
  useCustom: boolean;
  from: string;
  to: string;
} {
  const a = normalizeHeroHex(settings.heroBgCustomFrom ?? "");
  const b = normalizeHeroHex(settings.heroBgCustomTo ?? "");
  if (a && b) return { useCustom: true, from: a, to: b };
  const preset = String(settings.heroBgPreset ?? "navy");
  const g = HERO_BG_PRESET_GRADIENTS[preset] ?? HERO_BG_PRESET_GRADIENTS.navy;
  return { useCustom: false, from: g.from, to: g.to };
}

function renderPresetIcon(icon: PlatformDetailsPresetIcon, className: string) {
  const common = { className, fill: "none", stroke: "currentColor", strokeWidth: 1.8 } as const;
  switch (icon) {
    case "book":
      return <svg viewBox="0 0 24 24" {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z" /><path d="M4 5.5V21" /></svg>;
    case "pencil":
      return <svg viewBox="0 0 24 24" {...common}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4z" /></svg>;
    case "bulb":
      return <svg viewBox="0 0 24 24" {...common}><path d="M9 18h6" /><path d="M10 22h4" /><path d="M8 14a6 6 0 1 1 8 0c-1 1-1.5 2-1.5 3h-5C9.5 16 9 15 8 14z" /></svg>;
    case "users":
      return <svg viewBox="0 0 24 24" {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="3.5" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a3.5 3.5 0 0 1 0 6.75" /></svg>;
    case "rocket":
      return <svg viewBox="0 0 24 24" {...common}><path d="M5 15c-1 0-2.5 0-3 1.5S1 20 1 20s2-.5 3.5-1S6 17 6 16" /><path d="M14 10 4 20" /><path d="M12 2s5 0 8 3 3 8 3 8-4 1-8-3-3-8-3-8z" /></svg>;
    case "target":
      return <svg viewBox="0 0 24 24" {...common}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1.5" /></svg>;
    case "certificate":
      return <svg viewBox="0 0 24 24" {...common}><path d="M7 4h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-4l-3 3v-3H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /><circle cx="12" cy="9" r="2.5" /></svg>;
    case "chat":
    default:
      return <svg viewBox="0 0 24 24" {...common}><path d="M21 12a8 8 0 0 1-8 8H6l-3 3v-8a8 8 0 1 1 18-3z" /></svg>;
  }
}

export function HomepageSettingsForm({
  initialSettings,
  publishedCourses,
}: {
  initialSettings: HomepageSetting;
  publishedCourses: PublishedCourseOption[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const initialHeroBg = initialHeroBgCustom(initialSettings);
  const [form, setForm] = useState({
    heroTemplate: ((initialSettings.heroTemplate as HeroTemplate) || "classic") as HeroTemplate,
    teacherImageUrl: initialSettings.teacherImageUrl ?? "",
    heroTitle: initialSettings.heroTitle ?? "",
    heroSlogan: initialSettings.heroSlogan ?? "",
    platformName: initialSettings.platformName ?? "",
    headerLogoUrl: initialSettings.headerLogoUrl ?? "",
    primaryColor: initialSettings.primaryColor ?? "",
    pageTitle: initialSettings.pageTitle ?? "",
    whatsappUrl: initialSettings.whatsappUrl ?? "",
    facebookUrl: initialSettings.facebookUrl ?? "",
    heroBgPreset: (initialSettings.heroBgPreset as HeroBgPreset) || "navy",
    heroBgUseCustom: initialHeroBg.useCustom,
    heroBgCustomFrom: initialHeroBg.from,
    heroBgCustomTo: initialHeroBg.to,
    heroFloatImage1: initialSettings.heroFloatImage1 ?? "",
    heroFloatImage2: initialSettings.heroFloatImage2 ?? "",
    heroFloatImage3: initialSettings.heroFloatImage3 ?? "",
    heroSliderImage1: initialSettings.heroSliderImage1 ?? "",
    heroSliderImage2: initialSettings.heroSliderImage2 ?? "",
    heroSliderImage3: initialSettings.heroSliderImage3 ?? "",
    heroSliderImage4: initialSettings.heroSliderImage4 ?? "",
    heroSliderImage5: initialSettings.heroSliderImage5 ?? "",
    heroSliderCourseId1: initialSettings.heroSliderCourseId1 ?? "",
    heroSliderCourseId2: initialSettings.heroSliderCourseId2 ?? "",
    heroSliderCourseId3: initialSettings.heroSliderCourseId3 ?? "",
    heroSliderCourseId4: initialSettings.heroSliderCourseId4 ?? "",
    heroSliderCourseId5: initialSettings.heroSliderCourseId5 ?? "",
    heroSliderIntervalSeconds: String(
      Math.min(20, Math.max(2, Math.round((initialSettings.heroSliderIntervalMs ?? 5000) / 1000))),
    ),
    hero3Title: initialSettings.hero3Title ?? "",
    hero3Subtitle: initialSettings.hero3Subtitle ?? "",
    hero3PhoneImageUrl: initialSettings.hero3PhoneImageUrl ?? "",
    hero3PhoneBgColor: initialSettings.hero3PhoneBgColor ?? "#FACC15",
    hero3StoreBadge1ImageUrl: initialSettings.hero3StoreBadge1ImageUrl ?? "",
    hero3StoreBadge1Link: initialSettings.hero3StoreBadge1Link ?? "",
    hero3StoreBadge2ImageUrl: initialSettings.hero3StoreBadge2ImageUrl ?? "",
    hero3StoreBadge2Link: initialSettings.hero3StoreBadge2Link ?? "",
    footerTitle: initialSettings.footerTitle ?? "",
    footerTagline: initialSettings.footerTagline ?? "",
    footerCopyright: initialSettings.footerCopyright ?? "",
    reviewsSectionTitle: initialSettings.reviewsSectionTitle ?? "",
    reviewsSectionSubtitle: initialSettings.reviewsSectionSubtitle ?? "",
    ctaBadgeText: initialSettings.ctaBadgeText ?? "",
    ctaTitle: initialSettings.ctaTitle ?? "",
    ctaDescription: initialSettings.ctaDescription ?? "",
    ctaButtonText: initialSettings.ctaButtonText ?? "",
    platformDetailsEnabled: Boolean(initialSettings.platformDetailsEnabled ?? false),
    platformDetailsTitle: initialSettings.platformDetailsTitle ?? "",
    platformDetailsSubtitle: initialSettings.platformDetailsSubtitle ?? "",
    platformDetailsBackgroundColor: initialSettings.platformDetailsBackgroundColor ?? "",
    platformNewsEnabled: Boolean(initialSettings.platformNewsEnabled ?? false),
    platformNewsSectionTitle: initialSettings.platformNewsSectionTitle ?? "",
  });
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState("");
  const [floatImageUploading, setFloatImageUploading] = useState<1 | 2 | 3 | null>(null);
  const [sliderImageUploading, setSliderImageUploading] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [hero3Uploading, setHero3Uploading] = useState<"phone" | "badge1" | "badge2" | null>(null);
  const [platformItemUploading, setPlatformItemUploading] = useState<string | null>(null);
  const [platformDetailsItems, setPlatformDetailsItems] = useState<PlatformDetailsItem[]>(
    parsePlatformDetailsItems(initialSettings.platformDetailsItems),
  );
  const [platformNewsItems, setPlatformNewsItems] = useState<PlatformNewsItem[]>(
    parsePlatformNewsItems(initialSettings.platformNewsItems),
  );
  const [platformNewsUploading, setPlatformNewsUploading] = useState<string | null>(null);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(t);
  }, [success]);

  useEffect(() => {
    const ic = initialHeroBgCustom(initialSettings);
    setForm((f) => ({
      ...f,
      heroBgPreset: (initialSettings.heroBgPreset as HeroBgPreset) || "navy",
      heroBgUseCustom: ic.useCustom,
      heroBgCustomFrom: ic.from,
      heroBgCustomTo: ic.to,
    }));
  }, [
    initialSettings.heroBgPreset,
    initialSettings.heroBgCustomFrom,
    initialSettings.heroBgCustomTo,
  ]);

  useEffect(() => {
    setPlatformDetailsItems(parsePlatformDetailsItems(initialSettings.platformDetailsItems));
  }, [initialSettings.platformDetailsItems]);

  useEffect(() => {
    setPlatformNewsItems(parsePlatformNewsItems(initialSettings.platformNewsItems));
  }, [initialSettings.platformNewsItems]);

  useEffect(() => {
    setForm((f) => ({
      ...f,
      platformNewsSectionTitle: initialSettings.platformNewsSectionTitle ?? "",
    }));
  }, [initialSettings.platformNewsSectionTitle]);

  useEffect(() => {
    setForm((f) => ({
      ...f,
      heroSliderCourseId1: initialSettings.heroSliderCourseId1 ?? "",
      heroSliderCourseId2: initialSettings.heroSliderCourseId2 ?? "",
      heroSliderCourseId3: initialSettings.heroSliderCourseId3 ?? "",
      heroSliderCourseId4: initialSettings.heroSliderCourseId4 ?? "",
      heroSliderCourseId5: initialSettings.heroSliderCourseId5 ?? "",
    }));
  }, [
    initialSettings.heroSliderCourseId1,
    initialSettings.heroSliderCourseId2,
    initialSettings.heroSliderCourseId3,
    initialSettings.heroSliderCourseId4,
    initialSettings.heroSliderCourseId5,
  ]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const customFromNorm = normalizeHeroHex(form.heroBgCustomFrom);
      const customToNorm = normalizeHeroHex(form.heroBgCustomTo);
      if (form.heroBgUseCustom && (!customFromNorm || !customToNorm)) {
        throw new Error("أدخل لون أعلى وأسفل التدرج بصيغة #RRGGBB أو انتقل إلى التدرجات الجاهزة");
      }
      const primaryNorm = form.primaryColor.trim()
        ? normalizeHeroHex(form.primaryColor.trim())
        : null;
      if (form.primaryColor.trim() && !primaryNorm) {
        throw new Error("لون المنصة الأساسي يجب أن يكون بصيغة #RRGGBB (مثال: #0ea5e9)");
      }
      const intervalSecondsRaw = Number(form.heroSliderIntervalSeconds.trim());
      if (!Number.isFinite(intervalSecondsRaw) || intervalSecondsRaw < 2 || intervalSecondsRaw > 20) {
        throw new Error("مدة تبديل صور السلايدر يجب أن تكون رقمًا بين 2 و 20 ثانية");
      }
      const hero3PhoneBgNorm = form.hero3PhoneBgColor.trim()
        ? normalizeHeroHex(form.hero3PhoneBgColor.trim())
        : null;
      if (form.hero3PhoneBgColor.trim() && !hero3PhoneBgNorm) {
        throw new Error("لون خلفية الهاتف في القالب الثالث يجب أن يكون بصيغة #RRGGBB");
      }
      if (platformDetailsItems.length > 4) {
        throw new Error("الحد الأقصى لبطاقات قسم تفاصيل المنصة هو 4 بطاقات");
      }
      if (
        platformDetailsItems.some(
          (item) =>
            !item.title.trim() ||
            !item.description.trim() ||
            (item.iconType === "upload" && !item.customIconUrl?.trim()),
        )
      ) {
        throw new Error("أكمل بيانات بطاقات قسم تفاصيل المنصة (العنوان/الوصف/الأيقونة)");
      }
      const platformDetailsBgNorm = form.platformDetailsBackgroundColor.trim()
        ? normalizeHeroHex(form.platformDetailsBackgroundColor.trim())
        : null;
      if (form.platformDetailsBackgroundColor.trim() && !platformDetailsBgNorm) {
        throw new Error("لون خلفية قسم تفاصيل المنصة يجب أن يكون بصيغة #RRGGBB");
      }
      if (platformNewsItems.length > PLATFORM_NEWS_MAX_ITEMS) {
        throw new Error(`الحد الأقصى لأخبار المنصة هو ${PLATFORM_NEWS_MAX_ITEMS}`);
      }
      if (
        platformNewsItems.some(
          (item) =>
            (item.imageUrl.trim() && !item.description.trim()) ||
            (!item.imageUrl.trim() && item.description.trim()),
        )
      ) {
        throw new Error("أكمل صورة ووصف كل خبر، أو امسح الحقول غير المكتملة");
      }
      const heroTemplate: HeroTemplate =
        form.heroTemplate === "classic" ||
        form.heroTemplate === "image_slider" ||
        form.heroTemplate === "coming_soon"
          ? form.heroTemplate
          : "classic";
      const res = await fetch("/api/dashboard/settings/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroTemplate,
          teacherImageUrl: form.teacherImageUrl.trim() || null,
          heroTitle: form.heroTitle.trim() || null,
          heroSlogan: form.heroSlogan.trim() || null,
          platformName: form.platformName.trim() || null,
          headerLogoUrl: form.headerLogoUrl.trim() || null,
          primaryColor: primaryNorm,
          pageTitle: form.pageTitle.trim() || null,
          whatsappUrl: form.whatsappUrl.trim() || null,
          facebookUrl: form.facebookUrl.trim() || null,
          heroBgPreset: form.heroBgPreset || null,
          heroBgCustomFrom: form.heroBgUseCustom ? customFromNorm : null,
          heroBgCustomTo: form.heroBgUseCustom ? customToNorm : null,
          heroFloatImage1: form.heroFloatImage1.trim() || null,
          heroFloatImage2: form.heroFloatImage2.trim() || null,
          heroFloatImage3: form.heroFloatImage3.trim() || null,
          heroSliderImage1: form.heroSliderImage1.trim() || null,
          heroSliderImage2: form.heroSliderImage2.trim() || null,
          heroSliderImage3: form.heroSliderImage3.trim() || null,
          heroSliderImage4: form.heroSliderImage4.trim() || null,
          heroSliderImage5: form.heroSliderImage5.trim() || null,
          heroSliderCourseId1: form.heroSliderCourseId1.trim() || null,
          heroSliderCourseId2: form.heroSliderCourseId2.trim() || null,
          heroSliderCourseId3: form.heroSliderCourseId3.trim() || null,
          heroSliderCourseId4: form.heroSliderCourseId4.trim() || null,
          heroSliderCourseId5: form.heroSliderCourseId5.trim() || null,
          heroSliderIntervalSeconds: Math.round(intervalSecondsRaw),
          hero3Title: form.hero3Title.trim() || null,
          hero3Subtitle: form.hero3Subtitle.trim() || null,
          hero3PhoneImageUrl: form.hero3PhoneImageUrl.trim() || null,
          hero3PhoneBgColor: hero3PhoneBgNorm,
          hero3StoreBadge1ImageUrl: form.hero3StoreBadge1ImageUrl.trim() || null,
          hero3StoreBadge1Link: form.hero3StoreBadge1Link.trim() || null,
          hero3StoreBadge2ImageUrl: form.hero3StoreBadge2ImageUrl.trim() || null,
          hero3StoreBadge2Link: form.hero3StoreBadge2Link.trim() || null,
          footerTitle: form.footerTitle.trim() || null,
          footerTagline: form.footerTagline.trim() || null,
          footerCopyright: form.footerCopyright.trim() || null,
          reviewsSectionTitle: form.reviewsSectionTitle.trim() || null,
          reviewsSectionSubtitle: form.reviewsSectionSubtitle.trim() || null,
          ctaBadgeText: form.ctaBadgeText.trim() || null,
          ctaTitle: form.ctaTitle.trim() || null,
          ctaDescription: form.ctaDescription.trim() || null,
          ctaButtonText: form.ctaButtonText.trim() || null,
          platformDetailsEnabled: form.platformDetailsEnabled,
          platformDetailsTitle: form.platformDetailsTitle.trim() || null,
          platformDetailsSubtitle: form.platformDetailsSubtitle.trim() || null,
          platformDetailsBackgroundColor: platformDetailsBgNorm,
          platformDetailsItems,
          platformNewsEnabled: form.platformNewsEnabled,
          platformNewsSectionTitle: form.platformNewsSectionTitle.trim() || null,
          platformNewsItems: platformNewsItems.filter(
            (item) => item.imageUrl.trim() && item.description.trim(),
          ),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "فشل الحفظ");
      setSuccess("تم حفظ التغييرات");
      router.refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  }

  const canAddPlatformDetailItem = platformDetailsItems.length < 4;
  const canAddPlatformNewsItem = platformNewsItems.length < PLATFORM_NEWS_MAX_ITEMS;

  function addPlatformNewsItem() {
    if (!canAddPlatformNewsItem) return;
    setPlatformNewsItems((prev) => [
      ...prev,
      { id: `platform-news-${Date.now()}`, imageUrl: "", description: "" },
    ]);
  }

  function addPlatformDetailsItem() {
    if (!canAddPlatformDetailItem) return;
    setPlatformDetailsItems((prev) => [
      ...prev,
      {
        id: `platform-detail-${Date.now()}`,
        title: "",
        description: "",
        iconType: "preset",
        presetIcon: "chat",
        customIconUrl: null,
      },
    ]);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-6">
      {saving ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 backdrop-blur-[2px]">
          <div className="w-[min(92vw,22rem)] rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-center shadow-[var(--shadow-hover)]">
            <p className="text-sm font-semibold text-[var(--color-foreground)]">جاري حفظ التعديلات...</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">يرجى الانتظار لحظات</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="loading-dot h-2.5 w-2.5 rounded-full bg-[var(--color-primary)] [animation-delay:-0.32s]" />
              <span className="loading-dot h-2.5 w-2.5 rounded-full bg-[var(--color-primary)] [animation-delay:-0.16s]" />
              <span className="loading-dot h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
            </div>
          </div>
        </div>
      ) : null}
      {error && (
        <div className="rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-[var(--radius-btn)] bg-emerald-500/15 px-3 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          {success}
        </div>
      )}

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-2 text-lg font-semibold text-[var(--color-foreground)]">تغيير التصميم العام</h3>
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          اختر قالب عرض مقدمة الصفحة الرئيسية (الجزء الكبير في أول الصفحة).
        </p>

        <div className="space-y-2">
          <label className="flex cursor-pointer items-start gap-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-3">
            <input
              type="radio"
              name="heroTemplate"
              className="mt-1 accent-[var(--color-primary)]"
              checked={form.heroTemplate === "classic"}
              onChange={() => setForm((f) => ({ ...f, heroTemplate: "classic" }))}
            />
            <span>
              <span className="block text-sm font-semibold text-[var(--color-foreground)]">القالب الأول (الحالي)</span>
              <span className="text-xs text-[var(--color-muted)]">النجوم + صورة المدرس + النصوص الحالية</span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-3">
            <input
              type="radio"
              name="heroTemplate"
              className="mt-1 accent-[var(--color-primary)]"
              checked={form.heroTemplate === "image_slider"}
              onChange={() => setForm((f) => ({ ...f, heroTemplate: "image_slider" }))}
            />
            <span>
              <span className="block text-sm font-semibold text-[var(--color-foreground)]">القالب الثاني (صورة كبيرة/سلايدر)</span>
              <span className="text-xs text-[var(--color-muted)]">صورة كبيرة في البداية مع تبديل تلقائي + تنقّل يدوي</span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-3">
            <input
              type="radio"
              name="heroTemplate"
              className="mt-1 accent-[var(--color-primary)]"
              checked={form.heroTemplate === "coming_soon"}
              onChange={() => setForm((f) => ({ ...f, heroTemplate: "coming_soon" }))}
            />
            <span>
              <span className="block text-sm font-semibold text-[var(--color-foreground)]">القالب الثالث (واجهة التطبيق)</span>
              <span className="text-xs text-[var(--color-muted)]">عنوان كبير + نص فرعي + هاتف + شارات تحميل التطبيق</span>
            </span>
          </label>
        </div>

        {form.heroTemplate === "coming_soon" ? (
          <div className="mt-4 space-y-4 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)]">عنوان القالب الثالث</label>
              <input
                type="text"
                value={form.hero3Title}
                onChange={(e) => setForm((f) => ({ ...f, hero3Title: e.target.value }))}
                maxLength={300}
                placeholder="المنصة الشاملة رقم 1"
                className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)]">النص الفرعي</label>
              <input
                type="text"
                value={form.hero3Subtitle}
                onChange={(e) => setForm((f) => ({ ...f, hero3Subtitle: e.target.value }))}
                maxLength={600}
                placeholder="انضم لأكثر من مليون طالب مع الخطة"
                className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)]">صورة الهاتف</label>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {form.hero3PhoneImageUrl ? (
                  <img
                    src={form.hero3PhoneImageUrl}
                    alt="معاينة صورة الهاتف"
                    className="h-14 w-12 rounded border border-[var(--color-border)] object-cover"
                  />
                ) : null}
                <input
                  type="text"
                  value={form.hero3PhoneImageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, hero3PhoneImageUrl: e.target.value }))}
                  placeholder="رابط صورة الهاتف"
                  className="min-w-[180px] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                />
                <label className="shrink-0 cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-2 text-sm font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/20 disabled:opacity-50">
                  {hero3Uploading === "phone" ? "جاري الرفع..." : "رفع صورة الهاتف"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    disabled={hero3Uploading !== null}
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setHero3Uploading("phone");
                      try {
                        const fd = new FormData();
                        fd.set("file", f);
                        const res = await fetch("/api/upload/image", { method: "POST", body: fd });
                        const data = await res.json().catch(() => ({}));
                        if (res.ok && data.url) {
                          setForm((prev) => ({ ...prev, hero3PhoneImageUrl: data.url }));
                        }
                      } finally {
                        setHero3Uploading(null);
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, hero3PhoneImageUrl: "" }))}
                  className="shrink-0 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs font-semibold text-[var(--color-foreground)] transition hover:bg-[var(--color-border)]/40"
                >
                  حذف صورة الهاتف
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)]">لون الخلفية خلف الهاتف</label>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <input
                  type="color"
                  value={normalizeHeroHex(form.hero3PhoneBgColor) ?? "#facc15"}
                  onChange={(e) => setForm((f) => ({ ...f, hero3PhoneBgColor: e.target.value }))}
                  className="h-10 w-14 cursor-pointer rounded border border-[var(--color-border)] bg-transparent p-0.5"
                />
                <input
                  type="text"
                  value={form.hero3PhoneBgColor}
                  onChange={(e) => setForm((f) => ({ ...f, hero3PhoneBgColor: e.target.value }))}
                  placeholder="#FACC15"
                  className="min-w-[180px] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-mono text-sm"
                />
              </div>
            </div>
            {[
              { id: "1", imageKey: "hero3StoreBadge1ImageUrl", linkKey: "hero3StoreBadge1Link", uploading: "badge1" as const, label: "شارة التحميل الأولى" },
              { id: "2", imageKey: "hero3StoreBadge2ImageUrl", linkKey: "hero3StoreBadge2Link", uploading: "badge2" as const, label: "شارة التحميل الثانية" },
            ].map((badge) => {
              const imageValue = form[badge.imageKey as "hero3StoreBadge1ImageUrl" | "hero3StoreBadge2ImageUrl"];
              const linkValue = form[badge.linkKey as "hero3StoreBadge1Link" | "hero3StoreBadge2Link"];
              return (
                <div key={badge.id} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                  <p className="mb-2 text-xs font-semibold text-[var(--color-muted)]">{badge.label}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {imageValue ? (
                      <img
                        src={imageValue}
                        alt={`معاينة ${badge.label}`}
                        className="h-10 rounded border border-[var(--color-border)] object-contain bg-black/10 px-2"
                      />
                    ) : null}
                    <input
                      type="text"
                      value={imageValue}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [badge.imageKey]: e.target.value }))
                      }
                      placeholder={`رابط صورة ${badge.label}`}
                      className="min-w-[180px] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                    />
                    <label className="shrink-0 cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-2 text-xs font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/20 disabled:opacity-50">
                      {hero3Uploading === badge.uploading ? "جاري الرفع..." : "رفع الشارة"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        disabled={hero3Uploading !== null}
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setHero3Uploading(badge.uploading);
                          try {
                            const fd = new FormData();
                            fd.set("file", f);
                            const res = await fetch("/api/upload/image", { method: "POST", body: fd });
                            const data = await res.json().catch(() => ({}));
                            if (res.ok && data.url) {
                              setForm((prev) => ({ ...prev, [badge.imageKey]: data.url }));
                            }
                          } finally {
                            setHero3Uploading(null);
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          [badge.imageKey]: "",
                          [badge.linkKey]: "",
                        }))
                      }
                      className="shrink-0 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs font-semibold text-[var(--color-foreground)] transition hover:bg-[var(--color-border)]/40"
                    >
                      حذف الشارة
                    </button>
                  </div>
                  <input
                    type="url"
                    value={linkValue}
                    onChange={(e) => setForm((f) => ({ ...f, [badge.linkKey]: e.target.value }))}
                    placeholder={`رابط ${badge.label}`}
                    className="mt-2 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                  />
                </div>
              );
            })}
          </div>
        ) : null}

        {form.heroTemplate === "image_slider" ? (
          <div className="mt-4 space-y-4 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
            <p className="text-sm text-[var(--color-muted)]">
              أضف من 1 إلى 5 صور. عند إضافة أكثر من صورة، سيعمل التبديل التلقائي بينها.
            </p>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)]">مدة التبديل التلقائي (ثواني)</label>
              <input
                type="number"
                min={2}
                max={20}
                step={1}
                value={form.heroSliderIntervalSeconds}
                onChange={(e) => setForm((f) => ({ ...f, heroSliderIntervalSeconds: e.target.value }))}
                className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
              />
            </div>
            {SLIDER_IMAGE_FIELDS.map(({ idx, key, courseIdKey }) => {
              const current = form[key];
              const courseIdValue = form[courseIdKey];
              return (
                <div key={idx}>
                  <label className="block text-sm font-medium text-[var(--color-foreground)]">صورة السلايدر {idx}</label>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {current ? (
                      <img
                        src={current}
                        alt={`معاينة صورة السلايدر ${idx}`}
                        className="h-12 w-16 rounded border border-[var(--color-border)] object-cover"
                      />
                    ) : null}
                    <input
                      type="text"
                      value={current}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder="رابط الصورة أو ارفع من الزر"
                      className="min-w-[180px] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                    />
                    <label className="shrink-0 cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-2 text-sm font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/20 disabled:opacity-50">
                      {sliderImageUploading === idx ? "جاري الرفع..." : `رفع ${idx}`}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        disabled={sliderImageUploading !== null}
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setSliderImageUploading(idx as 1 | 2 | 3 | 4 | 5);
                          try {
                            const fd = new FormData();
                            fd.set("file", f);
                            const res = await fetch("/api/upload/image", { method: "POST", body: fd });
                            const data = await res.json().catch(() => ({}));
                            if (res.ok && data.url) {
                              setForm((prev) => ({ ...prev, [key]: data.url }));
                            }
                          } finally {
                            setSliderImageUploading(null);
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>
                  </div>
                  <label className="mt-2 block text-sm font-medium text-[var(--color-foreground)]">
                    ربط بالضغط على الصورة (كورس منشور)
                  </label>
                  <select
                    value={courseIdValue}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [courseIdKey]: e.target.value }))
                    }
                    className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                  >
                    <option value="">— بدون ربط —</option>
                    {publishedCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {(c.titleAr ?? c.title).trim() || c.slug}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">صورة المدرس</h3>
        <p className="mb-3 text-sm text-[var(--color-muted)]">
          تظهر في الصفحة الرئيسية بجانب العنوان. يمكنك رفع صورة أو إدخال رابط صورة.
        </p>
        {form.teacherImageUrl ? (
          <div className="mb-3">
            <img
              src={form.teacherImageUrl}
              alt="معاينة"
              className="h-32 w-40 rounded-[var(--radius-btn)] border border-[var(--color-border)] object-cover"
            />
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--color-border)]/50">
            {imageUploading ? "جاري الرفع..." : "اختر صورة للرفع"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={imageUploading}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setImageUploadError("");
                setImageUploading(true);
                try {
                  const fd = new FormData();
                  fd.set("file", f);
                  const res = await fetch("/api/upload/image", { method: "POST", body: fd });
                  const data = await res.json().catch(() => ({}));
                  if (res.ok && data.url) {
                    setForm((prev) => ({ ...prev, teacherImageUrl: data.url }));
                  } else {
                    setImageUploadError(data.error ?? "فشل الرفع");
                  }
                } catch {
                  setImageUploadError("فشل الاتصال");
                } finally {
                  setImageUploading(false);
                  e.target.value = "";
                }
              }}
            />
          </label>
        </div>
        {imageUploadError && <p className="mt-1 text-sm text-red-600">{imageUploadError}</p>}
        <input
          type="text"
          value={form.teacherImageUrl}
          onChange={(e) => { setForm((f) => ({ ...f, teacherImageUrl: e.target.value })); setImageUploadError(""); }}
          placeholder="/instructor.png أو رابط صورة"
          className="mt-2 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
        />

        <div className="mt-6">
          <h4 className="mb-2 text-sm font-semibold text-[var(--color-foreground)]">لون خلفية الهيرو (وراء صورة المدرس)</h4>
          <p className="mb-3 text-sm text-[var(--color-muted)]">
            اختر تدرجاً جاهزاً، أو لونين مخصّصين (منتقي الألوان + كود hex) ليظهرا في الصفحة الرئيسية خلف صورة المدرس والعنوان.
          </p>
          <div className="mb-4 flex flex-wrap gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-foreground)]">
              <input
                type="radio"
                name="heroBgMode"
                className="accent-[var(--color-primary)]"
                checked={!form.heroBgUseCustom}
                onChange={() =>
                  setForm((f) => {
                    const g =
                      HERO_BG_PRESET_GRADIENTS[f.heroBgPreset] ?? HERO_BG_PRESET_GRADIENTS.navy;
                    return { ...f, heroBgUseCustom: false, heroBgCustomFrom: g.from, heroBgCustomTo: g.to };
                  })
                }
              />
              تدرجات جاهزة
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-foreground)]">
              <input
                type="radio"
                name="heroBgMode"
                className="accent-[var(--color-primary)]"
                checked={form.heroBgUseCustom}
                onChange={() => setForm((f) => ({ ...f, heroBgUseCustom: true }))}
              />
              تدرج مخصّص (منتقي ألوان)
            </label>
          </div>

          {!form.heroBgUseCustom ? (
            <div className="flex flex-wrap gap-3">
              {HERO_BG_PRESET_META.map((opt) => {
                const grad = HERO_BG_PRESET_GRADIENTS[opt.id];
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        heroBgPreset: opt.id,
                        heroBgCustomFrom: grad.from,
                        heroBgCustomTo: grad.to,
                      }))
                    }
                    className={`flex flex-col items-center gap-1 rounded-[var(--radius-btn)] border-2 p-2 transition ${
                      form.heroBgPreset === opt.id
                        ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30"
                        : "border-[var(--color-border)] hover:border-[var(--color-muted)]"
                    }`}
                    title={opt.label}
                  >
                    <span
                      className="h-10 w-14 rounded border border-white/20"
                      style={{
                        background: `linear-gradient(180deg, ${grad.from} 0%, ${grad.to} 100%)`,
                      }}
                    />
                    <span className="max-w-[7rem] text-center text-xs font-medium text-[var(--color-foreground)]">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
              <p className="text-sm text-[var(--color-muted)]">
                اختر لون أعلى التدرج ولون أسفله. يمكنك استخدام المربع الملون أو كتابة الكود مثل{" "}
                <code className="rounded bg-[var(--color-border)]/40 px-1">#14162E</code>.
              </p>
              <div
                className="h-14 w-full max-w-md rounded border border-[var(--color-border)]"
                style={{
                  background: `linear-gradient(180deg, ${normalizeHeroHex(form.heroBgCustomFrom) ?? "#14162E"} 0%, ${normalizeHeroHex(form.heroBgCustomTo) ?? "#1E2145"} 100%)`,
                }}
                aria-hidden
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="mb-1 block text-xs font-medium text-[var(--color-muted)]">لون أعلى التدرج</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="color"
                      value={normalizeHeroHex(form.heroBgCustomFrom) ?? "#14162e"}
                      onChange={(e) => setForm((f) => ({ ...f, heroBgCustomFrom: e.target.value }))}
                      className="h-10 w-14 cursor-pointer rounded border border-[var(--color-border)] bg-transparent p-0.5"
                      aria-label="لون أعلى التدرج"
                    />
                    <input
                      type="text"
                      value={form.heroBgCustomFrom}
                      onChange={(e) => setForm((f) => ({ ...f, heroBgCustomFrom: e.target.value }))}
                      placeholder="#14162E"
                      className="min-w-0 flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-2 font-mono text-sm"
                    />
                  </div>
                </div>
                <div>
                  <span className="mb-1 block text-xs font-medium text-[var(--color-muted)]">لون أسفل التدرج</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="color"
                      value={normalizeHeroHex(form.heroBgCustomTo) ?? "#1e2145"}
                      onChange={(e) => setForm((f) => ({ ...f, heroBgCustomTo: e.target.value }))}
                      className="h-10 w-14 cursor-pointer rounded border border-[var(--color-border)] bg-transparent p-0.5"
                      aria-label="لون أسفل التدرج"
                    />
                    <input
                      type="text"
                      value={form.heroBgCustomTo}
                      onChange={(e) => setForm((f) => ({ ...f, heroBgCustomTo: e.target.value }))}
                      placeholder="#1E2145"
                      className="min-w-0 flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-2 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-2 text-lg font-semibold text-[var(--color-foreground)]">لون المنصة الأساسي</h3>
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          هذا اللون يُستخدم في عناوين الأقسام والأزرار والروابط. اتركه فارغاً لاستخدام اللون الافتراضي.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="color"
            value={normalizeHeroHex(form.primaryColor) ?? "#0ea5e9"}
            onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
            className="h-10 w-14 cursor-pointer rounded border border-[var(--color-border)] bg-transparent p-0.5"
            aria-label="لون المنصة الأساسي"
          />
          <input
            type="text"
            value={form.primaryColor}
            onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
            placeholder="#0ea5e9"
            className="min-w-[180px] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-sm text-[var(--color-foreground)]"
          />
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, primaryColor: "" }))}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] transition hover:bg-[var(--color-border)]/50"
          >
            رجوع للافتراضي
          </button>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-3 text-lg font-semibold text-[var(--color-foreground)]">لوجو الهيدر</h3>
        <p className="mb-3 text-sm text-[var(--color-muted)]">
          يظهر أعلى الموقع بجانب اسم المنصة. اتركه فارغاً لإظهار الاسم فقط.
        </p>
        {form.headerLogoUrl ? (
          <div className="mb-3 flex items-center gap-3">
            <img
              src={form.headerLogoUrl}
              alt="معاينة اللوجو"
              className="h-10 w-10 rounded-[10px] border border-[var(--color-border)] object-contain bg-[var(--color-background)] p-1"
            />
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, headerLogoUrl: "" }))}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] transition hover:bg-[var(--color-border)]/50"
            >
              حذف اللوجو
            </button>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--color-border)]/50">
            {logoUploading ? "جاري الرفع..." : "رفع لوجو"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={logoUploading}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setLogoUploadError("");
                setLogoUploading(true);
                try {
                  const fd = new FormData();
                  fd.set("file", f);
                  const res = await fetch("/api/upload/image", { method: "POST", body: fd });
                  const data = await res.json().catch(() => ({}));
                  if (res.ok && data.url) {
                    setForm((prev) => ({ ...prev, headerLogoUrl: data.url }));
                  } else {
                    setLogoUploadError(data.error ?? "فشل الرفع");
                  }
                } catch {
                  setLogoUploadError("فشل الاتصال");
                } finally {
                  setLogoUploading(false);
                  e.target.value = "";
                }
              }}
            />
          </label>
        </div>
        {logoUploadError ? (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{logoUploadError}</p>
        ) : null}
        <input
          type="text"
          value={form.headerLogoUrl}
          onChange={(e) => {
            setForm((f) => ({ ...f, headerLogoUrl: e.target.value }));
            setLogoUploadError("");
          }}
          placeholder="رابط لوجو أو ارفعه من الزر"
          className="mt-2 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-2 text-lg font-semibold text-[var(--color-foreground)]">الصور الصغيرة العائمة حول صورة المدرس</h3>
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          تظهر هذه الصور بجانب صورة المدرس في الصفحة الرئيسية. يمكنك إدخال رابط لكل صورة أو ترك الحقل فارغاً لاستخدام الافتراضي.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">صورة عائمة ١ (يسار أعلى)</label>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {form.heroFloatImage1 ? (
                <img src={form.heroFloatImage1} alt="" className="h-10 w-10 rounded object-cover border border-[var(--color-border)]" />
              ) : null}
              <input
                type="text"
                value={form.heroFloatImage1}
                onChange={(e) => setForm((f) => ({ ...f, heroFloatImage1: e.target.value }))}
                placeholder="/images/ruler.png أو رابط"
                className="min-w-[180px] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              />
              <label className="shrink-0 cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-2 text-sm font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/20 disabled:opacity-50">
                {floatImageUploading === 1 ? "جاري الرفع..." : "إضافة صورة"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={floatImageUploading !== null}
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setFloatImageUploading(1);
                    try {
                      const fd = new FormData();
                      fd.set("file", f);
                      const res = await fetch("/api/upload/image", { method: "POST", body: fd });
                      const data = await res.json().catch(() => ({}));
                      if (res.ok && data.url) setForm((prev) => ({ ...prev, heroFloatImage1: data.url }));
                    } finally {
                      setFloatImageUploading(null);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">صورة عائمة ٢ (يمين أسفل)</label>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {form.heroFloatImage2 ? (
                <img src={form.heroFloatImage2} alt="" className="h-10 w-10 rounded object-cover border border-[var(--color-border)]" />
              ) : null}
              <input
                type="text"
                value={form.heroFloatImage2}
                onChange={(e) => setForm((f) => ({ ...f, heroFloatImage2: e.target.value }))}
                placeholder="/images/notebook.png أو رابط"
                className="min-w-[180px] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              />
              <label className="shrink-0 cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-2 text-sm font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/20 disabled:opacity-50">
                {floatImageUploading === 2 ? "جاري الرفع..." : "إضافة صورة"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={floatImageUploading !== null}
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setFloatImageUploading(2);
                    try {
                      const fd = new FormData();
                      fd.set("file", f);
                      const res = await fetch("/api/upload/image", { method: "POST", body: fd });
                      const data = await res.json().catch(() => ({}));
                      if (res.ok && data.url) setForm((prev) => ({ ...prev, heroFloatImage2: data.url }));
                    } finally {
                      setFloatImageUploading(null);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">صورة عائمة ٣ (أسفل يسار)</label>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {form.heroFloatImage3 ? (
                <img src={form.heroFloatImage3} alt="" className="h-10 w-10 rounded object-cover border border-[var(--color-border)]" />
              ) : null}
              <input
                type="text"
                value={form.heroFloatImage3}
                onChange={(e) => setForm((f) => ({ ...f, heroFloatImage3: e.target.value }))}
                placeholder="/images/pencil.png أو رابط"
                className="min-w-[180px] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              />
              <label className="shrink-0 cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-2 text-sm font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/20 disabled:opacity-50">
                {floatImageUploading === 3 ? "جاري الرفع..." : "إضافة صورة"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={floatImageUploading !== null}
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setFloatImageUploading(3);
                    try {
                      const fd = new FormData();
                      fd.set("file", f);
                      const res = await fetch("/api/upload/image", { method: "POST", body: fd });
                      const data = await res.json().catch(() => ({}));
                      if (res.ok && data.url) setForm((prev) => ({ ...prev, heroFloatImage3: data.url }));
                    } finally {
                      setFloatImageUploading(null);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">نصوص الصفحة الرئيسية</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">اسم المنصة (أعلى اليمين في الموقع)</label>
            <input
              type="text"
              value={form.platformName}
              onChange={(e) => setForm((f) => ({ ...f, platformName: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              placeholder="منصة أستاذ عصام محي"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">العنوان الرئيسي (في الهيرو)</label>
            <input
              type="text"
              value={form.heroTitle}
              onChange={(e) => setForm((f) => ({ ...f, heroTitle: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              placeholder="أستاذ / عصام محي"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">الشعار (تحت العنوان)</label>
            <input
              type="text"
              value={form.heroSlogan}
              onChange={(e) => setForm((f) => ({ ...f, heroSlogan: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              placeholder="ادرسها... يمكن تفهم المعلومة صح!"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">عنوان التبويب (المظهر في تاب المتصفح)</label>
            <input
              type="text"
              value={form.pageTitle}
              onChange={(e) => setForm((f) => ({ ...f, pageTitle: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              placeholder="منصتي التعليمية | دورات وتعلم أونلاين"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">عنوان الفوتر (أسفل الموقع)</label>
            <input
              type="text"
              value={form.footerTitle}
              onChange={(e) => setForm((f) => ({ ...f, footerTitle: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              placeholder="منصتي التعليمية"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">وصف الفوتر (تحت العنوان)</label>
            <input
              type="text"
              value={form.footerTagline}
              onChange={(e) => setForm((f) => ({ ...f, footerTagline: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              placeholder="تعلم بأسلوب حديث ومنهجية واضحة"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">نص حقوق النشر (أسفل الصفحة)</label>
            <input
              type="text"
              value={form.footerCopyright}
              onChange={(e) => setForm((f) => ({ ...f, footerCopyright: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              placeholder="منصتي التعليمية. جميع الحقوق محفوظة."
            />
            <p className="mt-1 text-xs text-[var(--color-muted)]">يُعرض كـ: © السنة الحالية ثم النص أعلاه.</p>
          </div>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">قسم تفاصيل المنصة</h3>
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          عند التفعيل يظهر هذا القسم بعد الهيرو مباشرة في الصفحة الرئيسية.
        </p>
        <label className="mb-4 flex items-center gap-2 text-sm font-medium text-[var(--color-foreground)]">
          <input
            type="checkbox"
            className="accent-[var(--color-primary)]"
            checked={form.platformDetailsEnabled}
            onChange={(e) => setForm((f) => ({ ...f, platformDetailsEnabled: e.target.checked }))}
          />
          تفعيل قسم تفاصيل المنصة
        </label>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">عنوان القسم</label>
            <input
              type="text"
              value={form.platformDetailsTitle}
              onChange={(e) => setForm((f) => ({ ...f, platformDetailsTitle: e.target.value }))}
              maxLength={240}
              placeholder="“قلم” الحل المثالي!"
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">وصف القسم</label>
            <textarea
              value={form.platformDetailsSubtitle}
              onChange={(e) => setForm((f) => ({ ...f, platformDetailsSubtitle: e.target.value }))}
              rows={2}
              maxLength={500}
              placeholder="تعرف على أهم ما يميز المنصة"
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">لون خلفية القسم</label>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              اتركه فارغًا لاستخدام الخلفية الافتراضية.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <input
                type="color"
                value={normalizeHeroHex(form.platformDetailsBackgroundColor) ?? "#ffffff"}
                onChange={(e) => setForm((f) => ({ ...f, platformDetailsBackgroundColor: e.target.value }))}
                className="h-10 w-14 cursor-pointer rounded border border-[var(--color-border)] bg-transparent p-0.5"
                aria-label="لون خلفية قسم تفاصيل المنصة"
              />
              <input
                type="text"
                value={form.platformDetailsBackgroundColor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, platformDetailsBackgroundColor: e.target.value }))
                }
                placeholder="#F5F7FB"
                className="min-w-[180px] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, platformDetailsBackgroundColor: "" }))}
                className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs font-medium text-[var(--color-foreground)]"
              >
                افتراضي
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-[var(--color-foreground)]">بطاقات القسم (حتى 4)</h4>
            <button
              type="button"
              onClick={addPlatformDetailsItem}
              disabled={!canAddPlatformDetailItem}
              className="rounded-[var(--radius-btn)] border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-2 text-xs font-semibold text-[var(--color-primary)] disabled:opacity-50"
            >
              إضافة بطاقة
            </button>
          </div>
          <div className="space-y-3">
            {platformDetailsItems.map((item, idx) => (
              <div
                key={item.id}
                className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-[var(--color-muted)]">بطاقة #{idx + 1}</p>
                  <button
                    type="button"
                    onClick={() =>
                      setPlatformDetailsItems((prev) => prev.filter((entry) => entry.id !== item.id))
                    }
                    className="rounded-[var(--radius-btn)] border border-red-500/40 px-2 py-1 text-xs font-semibold text-red-600 dark:text-red-400"
                  >
                    حذف
                  </button>
                </div>
                <div className="grid gap-3">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) =>
                      setPlatformDetailsItems((prev) =>
                        prev.map((entry) =>
                          entry.id === item.id ? { ...entry, title: e.target.value } : entry,
                        ),
                      )
                    }
                    maxLength={120}
                    placeholder="عنوان البطاقة"
                    className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                  />
                  <textarea
                    value={item.description}
                    onChange={(e) =>
                      setPlatformDetailsItems((prev) =>
                        prev.map((entry) =>
                          entry.id === item.id ? { ...entry, description: e.target.value } : entry,
                        ),
                      )
                    }
                    rows={2}
                    maxLength={400}
                    placeholder="وصف البطاقة"
                    className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                  />
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-[var(--color-foreground)]">
                      <input
                        type="radio"
                        name={`platform-icon-type-${item.id}`}
                        checked={item.iconType === "preset"}
                        onChange={() =>
                          setPlatformDetailsItems((prev) =>
                            prev.map((entry) =>
                              entry.id === item.id ? { ...entry, iconType: "preset" } : entry,
                            ),
                          )
                        }
                      />
                      أيقونة جاهزة
                    </label>
                    <label className="flex items-center gap-2 text-xs text-[var(--color-foreground)]">
                      <input
                        type="radio"
                        name={`platform-icon-type-${item.id}`}
                        checked={item.iconType === "upload"}
                        onChange={() =>
                          setPlatformDetailsItems((prev) =>
                            prev.map((entry) =>
                              entry.id === item.id ? { ...entry, iconType: "upload" } : entry,
                            ),
                          )
                        }
                      />
                      أيقونة مرفوعة
                    </label>
                  </div>
                  {item.iconType === "preset" ? (
                    <div className="grid grid-cols-4 gap-2">
                      {PLATFORM_DETAILS_PRESET_ICON_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setPlatformDetailsItems((prev) =>
                              prev.map((entry) =>
                                entry.id === item.id ? { ...entry, presetIcon: opt.id } : entry,
                              ),
                            )
                          }
                          title={opt.label}
                          className={`flex h-12 items-center justify-center rounded-[var(--radius-btn)] border ${
                            item.presetIcon === opt.id
                              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                              : "border-[var(--color-border)] text-[var(--color-muted)]"
                          }`}
                        >
                          {renderPresetIcon(opt.id, "h-5 w-5")}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={item.customIconUrl ?? ""}
                          onChange={(e) =>
                            setPlatformDetailsItems((prev) =>
                              prev.map((entry) =>
                                entry.id === item.id
                                  ? { ...entry, customIconUrl: e.target.value || null }
                                  : entry,
                              ),
                            )
                          }
                          placeholder="رابط الأيقونة"
                          className="min-w-[180px] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                        />
                        <label className="cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-2 text-xs font-semibold text-[var(--color-primary)]">
                          {platformItemUploading === item.id ? "جاري الرفع..." : "رفع أيقونة"}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                            className="hidden"
                            disabled={platformItemUploading !== null}
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              setPlatformItemUploading(item.id);
                              try {
                                const fd = new FormData();
                                fd.set("file", f);
                                const res = await fetch("/api/upload/image", { method: "POST", body: fd });
                                const data = await res.json().catch(() => ({}));
                                if (res.ok && data.url) {
                                  setPlatformDetailsItems((prev) =>
                                    prev.map((entry) =>
                                      entry.id === item.id ? { ...entry, customIconUrl: data.url } : entry,
                                    ),
                                  );
                                }
                              } finally {
                                setPlatformItemUploading(null);
                                e.target.value = "";
                              }
                            }}
                          />
                        </label>
                      </div>
                      {item.customIconUrl ? (
                        <img
                          src={item.customIconUrl}
                          alt="معاينة الأيقونة"
                          className="h-10 w-10 rounded border border-[var(--color-border)] object-contain p-1"
                        />
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPlatformDetailsItems([...DEFAULT_PLATFORM_DETAILS_ITEMS])}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs font-medium text-[var(--color-foreground)]"
          >
            استرجاع البطاقات الافتراضية
          </button>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">قسم تعليقات الطلاب (الصفحة الرئيسية)</h3>
        <p className="mb-3 text-sm text-[var(--color-muted)]">
          العنوان والوصف فوق بطاقات التعليقات في الصفحة الرئيسية. اترك الحقل فارغاً لاستخدام النص الافتراضي.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">عنوان القسم</label>
            <input
              type="text"
              value={form.reviewsSectionTitle}
              onChange={(e) => setForm((f) => ({ ...f, reviewsSectionTitle: e.target.value }))}
              maxLength={400}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
              placeholder="ماذا يقول الطلاب"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">الوصف تحت العنوان</label>
            <input
              type="text"
              value={form.reviewsSectionSubtitle}
              onChange={(e) => setForm((f) => ({ ...f, reviewsSectionSubtitle: e.target.value }))}
              maxLength={400}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
              placeholder="تجارب حقيقية من طلاب المنصة"
            />
          </div>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">الجزء الإخباري في المنصة</h3>
        <p className="mb-3 text-sm text-[var(--color-muted)]">
          يظهر هذا القسم في الصفحة الرئيسية أسفل «ماذا يقول الطلاب» عند التفعيل. يمكنك إضافة عدة أخبار؛ التبديل
          التلقائي كل 5 ثوانٍ عند وجود أكثر من خبر.
        </p>
        <div className="mb-4 flex items-center gap-3">
          <input
            type="checkbox"
            id="platformNewsEnabled"
            checked={form.platformNewsEnabled}
            onChange={(e) => setForm((f) => ({ ...f, platformNewsEnabled: e.target.checked }))}
            className="h-4 w-4 rounded border-[var(--color-border)]"
          />
          <label htmlFor="platformNewsEnabled" className="text-sm font-medium text-[var(--color-foreground)]">
            تفعيل عرض قسم الأخبار
          </label>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--color-foreground)]">عنوان القسم</label>
          <input
            type="text"
            value={form.platformNewsSectionTitle}
            onChange={(e) => setForm((f) => ({ ...f, platformNewsSectionTitle: e.target.value }))}
            maxLength={240}
            className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
            placeholder="أخبار المنصة"
          />
          <p className="mt-1 text-xs text-[var(--color-muted)]">اتركه فارغاً لاستخدام العنوان الافتراضي «أخبار المنصة».</p>
        </div>
        <div className="space-y-4">
          {platformNewsItems.map((item, idx) => (
            <div
              key={item.id}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-[var(--color-foreground)]">خبر {idx + 1}</span>
                <button
                  type="button"
                  onClick={() =>
                    setPlatformNewsItems((prev) => prev.filter((entry) => entry.id !== item.id))
                  }
                  className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                >
                  حذف
                </button>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="shrink-0">
                  <label className="block text-xs text-[var(--color-muted)]">صورة الخبر</label>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-2 text-xs font-semibold text-[var(--color-primary)]">
                      {platformNewsUploading === item.id ? "جاري الرفع..." : "رفع صورة"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        disabled={platformNewsUploading !== null}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setPlatformNewsUploading(item.id);
                          try {
                            const fd = new FormData();
                            fd.set("file", file);
                            const res = await fetch("/api/upload/image", { method: "POST", body: fd });
                            const data = await res.json().catch(() => ({}));
                            if (res.ok && data.url) {
                              setPlatformNewsItems((prev) =>
                                prev.map((entry) =>
                                  entry.id === item.id ? { ...entry, imageUrl: data.url } : entry,
                                ),
                              );
                            }
                          } finally {
                            setPlatformNewsUploading(null);
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>
                  </div>
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="mt-2 h-24 max-w-[200px] rounded border border-[var(--color-border)] object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <label className="block text-xs text-[var(--color-muted)]">وصف الحدث</label>
                  <textarea
                    value={item.description}
                    onChange={(e) =>
                      setPlatformNewsItems((prev) =>
                        prev.map((entry) =>
                          entry.id === item.id ? { ...entry, description: e.target.value } : entry,
                        ),
                      )
                    }
                    maxLength={1000}
                    rows={3}
                    className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)]"
                    placeholder="نص يظهر فوق الصورة في الصفحة الرئيسية"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addPlatformNewsItem}
            disabled={!canAddPlatformNewsItem}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] disabled:opacity-50"
          >
            إضافة خبر {canAddPlatformNewsItem ? `(${platformNewsItems.length}/${PLATFORM_NEWS_MAX_ITEMS})` : ""}
          </button>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">قسم الانطلاقة التعليمية (CTA)</h3>
        <p className="mb-3 text-sm text-[var(--color-muted)]">
          هذا القسم يظهر قرب أسفل الصفحة الرئيسية فوق الفوتر.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">نص الشارة الصغيرة</label>
            <input
              type="text"
              value={form.ctaBadgeText}
              onChange={(e) => setForm((f) => ({ ...f, ctaBadgeText: e.target.value }))}
              maxLength={120}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
              placeholder="انطلاقة تعليمية أقوى"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">العنوان الرئيسي</label>
            <input
              type="text"
              value={form.ctaTitle}
              onChange={(e) => setForm((f) => ({ ...f, ctaTitle: e.target.value }))}
              maxLength={300}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
              placeholder="جاهز تحوّل حلمك لنتيجة حقيقية؟"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">الوصف</label>
            <textarea
              value={form.ctaDescription}
              onChange={(e) => setForm((f) => ({ ...f, ctaDescription: e.target.value }))}
              maxLength={2000}
              rows={4}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
              placeholder="ابدأ الآن بخطوة واثقة..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">نص الزر</label>
            <input
              type="text"
              value={form.ctaButtonText}
              onChange={(e) => setForm((f) => ({ ...f, ctaButtonText: e.target.value }))}
              maxLength={120}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
              placeholder="ابدأ رحلتك الآن"
            />
          </div>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">روابط التواصل (الصفحة الرئيسية)</h3>
        <p className="mb-3 text-sm text-[var(--color-muted)]">
          رابط واحد لواتساب ورابط واحد لفيسبوك فقط (أزرار ثابتة أسفل يمين الصفحة). اترك الحقل فارغاً لإخفاء الزر من الصفحة.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">رابط واتساب</label>
            <input
              type="url"
              value={form.whatsappUrl}
              onChange={(e) => setForm((f) => ({ ...f, whatsappUrl: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              placeholder="https://wa.me/966553612356"
            />
            <p className="mt-1 text-xs text-[var(--color-muted)]">فارغ = عدم عرض زر واتساب.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">رابط فيسبوك</label>
            <input
              type="url"
              value={form.facebookUrl}
              onChange={(e) => setForm((f) => ({ ...f, facebookUrl: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              placeholder="https://www.facebook.com/..."
            />
            <p className="mt-1 text-xs text-[var(--color-muted)]">فارغ = عدم عرض زر فيسبوك.</p>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-6 py-2 font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
      >
        {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
      </button>
    </form>
  );
}
