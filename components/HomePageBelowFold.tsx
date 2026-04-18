import Link from "next/link";
import type { Session } from "next-auth";
import {
  getCategories,
  getCoursesPublished,
  getReviews,
  listActiveSubscriptionPlansPublic,
  listStoreProductsPublic,
  listTeachersForHomepage,
  selectTeachersForHomepagePreview,
  userHasActivePlatformSubscription,
  getLatestPlatformSubscriptionExpiry,
} from "@/lib/db";
import type { HomepageSetting } from "@/lib/types";
import { CourseCard } from "@/components/CourseCard";
import { HomeTeachersSection } from "@/components/HomeTeachersSection";
import { HomeSubscriptionsSection } from "@/components/HomeSubscriptionsSection";
import { HomeStoreSection } from "@/components/HomeStoreSection";
import { HomePlatformDetailsSection } from "@/components/HomePlatformDetailsSection";
import { parsePlatformDetailsItems } from "@/lib/platform-details";
import { parsePlatformNewsItems } from "@/lib/platform-news";
import { HomePlatformNewsSlider } from "@/components/HomePlatformNewsSlider";

type CourseWithCategory = Awaited<ReturnType<typeof getCoursesPublished>>[number];

export async function HomePageBelowFold({
  homepageSettings,
  session,
}: {
  homepageSettings: HomepageSetting;
  session: Session | null;
}) {
  let courses: CourseWithCategory[] = [];
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let reviews: Awaited<ReturnType<typeof getReviews>> = [];
  let teachersForHome: Awaited<ReturnType<typeof listTeachersForHomepage>> = [];
  let subscriptionPlansHome: Awaited<ReturnType<typeof listActiveSubscriptionPlansPublic>> = [];
  let storeProductsHome: Awaited<ReturnType<typeof listStoreProductsPublic>> = [];

  if (homepageSettings.teachersEnabled) {
    try {
      teachersForHome = await listTeachersForHomepage();
    } catch {
      /* جدول أو أعمدة غير جاهزة */
    }
  }
  if (homepageSettings.subscriptionsEnabled) {
    try {
      subscriptionPlansHome = await listActiveSubscriptionPlansPublic();
    } catch {
      /* جداول الاشتراك غير جاهزة */
    }
  }
  if (homepageSettings.storeEnabled) {
    try {
      storeProductsHome = await listStoreProductsPublic();
    } catch {
      /* جداول المتجر غير جاهزة */
    }
  }

  let studentPlatformSubscription: { active: boolean; expiresAtIso: string | null } | null = null;
  if (
    homepageSettings.subscriptionsEnabled &&
    session?.user?.role === "STUDENT" &&
    session.user.id
  ) {
    try {
      const active = await userHasActivePlatformSubscription(session.user.id);
      const exp = active ? await getLatestPlatformSubscriptionExpiry(session.user.id) : null;
      studentPlatformSubscription = {
        active,
        expiresAtIso: exp ? exp.toISOString() : null,
      };
    } catch {
      studentPlatformSubscription = { active: false, expiresAtIso: null };
    }
  }

  try {
    [courses, categories] = await Promise.all([getCoursesPublished(true), getCategories()]);
  } catch {
    // لا قاعدة بيانات أو غير متصلة
  }

  if (homepageSettings.teachersEnabled && teachersForHome.length > 0) {
    const teacherAccountIds = new Set(teachersForHome.map((t) => t.id));
    courses = courses.filter((c) => {
      const creator =
        (c as { createdById?: string | null }).createdById ??
        (c as { created_by_id?: string | null }).created_by_id ??
        null;
      return !creator || !teacherAccountIds.has(creator);
    });
  }

  try {
    reviews = await getReviews();
  } catch {
    /* جدول التعليقات غير موجود */
  }

  const platformNewsSlides = parsePlatformNewsItems(homepageSettings.platformNewsItems);
  const showPlatformNewsSection =
    Boolean(homepageSettings.platformNewsEnabled) && platformNewsSlides.length > 0;

  const teachersHomePreview =
    teachersForHome.length > 0
      ? selectTeachersForHomepagePreview(teachersForHome, 4).map(({ homepageOrder, ...row }) => {
          void homepageOrder;
          return row;
        })
      : [];

  const categoryIdToCourses = new Map<string, CourseWithCategory[]>();
  const uncategorized: CourseWithCategory[] = [];
  for (const c of courses) {
    const catId = (c as { category?: { id?: string } }).category?.id;
    if (catId) {
      if (!categoryIdToCourses.has(catId)) categoryIdToCourses.set(catId, []);
      categoryIdToCourses.get(catId)!.push(c);
    } else {
      uncategorized.push(c);
    }
  }

  const sections: { title: string; slug?: string; courses: CourseWithCategory[] }[] = [];
  for (const cat of categories) {
    const list = categoryIdToCourses.get(cat.id);
    if (list?.length) {
      sections.push({
        title: (cat as { nameAr?: string | null }).nameAr ?? cat.name,
        slug: cat.slug,
        courses: list,
      });
    }
  }
  if (uncategorized.length > 0) {
    sections.push({ title: "دورات أخرى", courses: uncategorized });
  }

  const platformDetailsItems = parsePlatformDetailsItems(homepageSettings.platformDetailsItems);

  return (
    <>
      {homepageSettings.platformDetailsEnabled && platformDetailsItems.length > 0 ? (
        <HomePlatformDetailsSection
          title={homepageSettings.platformDetailsTitle?.trim() || "“قلم” الحل المثالي!"}
          subtitle={homepageSettings.platformDetailsSubtitle?.trim() || null}
          backgroundColor={homepageSettings.platformDetailsBackgroundColor?.trim() || null}
          items={platformDetailsItems}
        />
      ) : null}

      {homepageSettings.teachersEnabled ? (
        <HomeTeachersSection enabled initialTeachers={teachersHomePreview} />
      ) : null}

      {homepageSettings.teachersEnabled && homepageSettings.subscriptionsEnabled ? (
        <div className="h-12 sm:h-16 md:h-24" aria-hidden />
      ) : null}

      {homepageSettings.subscriptionsEnabled ? (
        <HomeSubscriptionsSection
          enabled
          plans={subscriptionPlansHome}
          isStudent={session?.user?.role === "STUDENT"}
          isLoggedIn={!!session}
          studentPlatformSubscription={studentPlatformSubscription}
        />
      ) : null}

      {sections.length > 0
        ? sections.map((section, idx) => (
            <section
              key={section.slug ?? `uncategorized-${idx}`}
              className="bg-white dark:bg-[var(--color-background)] mx-auto max-w-6xl px-4 py-16 sm:px-6"
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[var(--color-foreground)]">{section.title}</h2>
                  <p className="mt-1 text-[var(--color-muted)]">
                    {section.slug ? `دورات قسم ${section.title}` : "دورات بدون تصنيف"}
                  </p>
                </div>
                <Link
                  href={section.slug ? `/courses?category=${encodeURIComponent(section.slug)}` : "/courses"}
                  className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                  عرض الكل ←
                </Link>
              </div>

              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {section.courses.slice(0, 6).map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
              {section.courses.length > 6 && (
                <div className="mt-6 text-center">
                  <Link
                    href={section.slug ? `/courses?category=${encodeURIComponent(section.slug)}` : "/courses"}
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                  >
                    عرض كل دورات القسم ({section.courses.length})
                  </Link>
                </div>
              )}
            </section>
          ))
        : null}

      {homepageSettings.storeEnabled && storeProductsHome.length > 0 ? (
        <HomeStoreSection
          productsCount={storeProductsHome.length}
          sectionTitle={homepageSettings.storeSectionTitle?.trim() || "متجر المنصة"}
          sectionDescription={
            homepageSettings.storeSectionDescription?.trim() ||
            "مرحبًا بك في متجر المنصة الذي يضم ملازم وكتب في غاية الأهمية. اختر ما يناسبك من المواد الرقمية التعليمية واستفد من محتوى مُنظّم يدعم رحلتك الدراسية."
          }
        />
      ) : null}

      <section className="reviews-section border-t border-[var(--color-border)] bg-[var(--color-reviews-bg)] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-[var(--color-foreground)]">
            {homepageSettings.reviewsSectionTitle?.trim() || "ماذا يقول الطلاب"}
          </h2>
          <p className="mt-1 text-[var(--color-muted)]">
            {homepageSettings.reviewsSectionSubtitle?.trim() || "تجارب حقيقية من طلاب المنصة"}
          </p>
          {reviews.length > 0 ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r) => {
                const letter =
                  (r.avatarLetter && r.avatarLetter.trim()) || (r.authorName.trim()[0] ?? "؟");
                return (
                  <div
                    key={r.id}
                    className="flex gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-reviews-avatar)] text-lg font-semibold text-[var(--color-muted)]">
                      {letter}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--color-primary)]">{r.authorName}</p>
                      {r.authorTitle ? (
                        <p className="mt-0.5 text-xs text-[var(--color-muted)]">{r.authorTitle}</p>
                      ) : null}
                      <p className="mt-3 text-[var(--color-foreground)]">{r.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-10 text-center text-[var(--color-muted)]">لا توجد تعليقات حتى الآن.</p>
          )}
        </div>
      </section>

      {showPlatformNewsSection ? (
        <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-6 text-2xl font-bold text-[var(--color-foreground)]">
              {homepageSettings.platformNewsSectionTitle?.trim() || "أخبار المنصة"}
            </h2>
            <HomePlatformNewsSlider items={platformNewsSlides} />
          </div>
        </section>
      ) : null}

      <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] p-8 sm:p-12">
            <div className="text-center">
              <p className="inline-flex items-center rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-4 py-1 text-xs font-semibold text-[var(--color-primary)] sm:text-sm">
                {homepageSettings.ctaBadgeText?.trim() || "انطلاقة تعليمية أقوى"}
              </p>
              <h2 className="mt-4 text-3xl font-extrabold text-[var(--color-foreground)] sm:text-4xl">
                {homepageSettings.ctaTitle?.trim() || "جاهز تحوّل حلمك لنتيجة حقيقية؟"}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--color-muted)] sm:text-base">
                {homepageSettings.ctaDescription?.trim() ||
                  "ابدأ الآن بخطوة واثقة: محتوى منظم، شرح واضح، وتمارين عملية تساعدك تثبّت المعلومة بسرعة. كل درس تقطعه اليوم يقرّبك من مستواك اللي تستحقه بكرة."}
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/70 px-3 py-1 text-xs text-[var(--color-muted)]">
                  شرح مبسّط
                </span>
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/70 px-3 py-1 text-xs text-[var(--color-muted)]">
                  متابعة مستمرة
                </span>
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/70 px-3 py-1 text-xs text-[var(--color-muted)]">
                  نتائج ملموسة
                </span>
              </div>

              <Link
                href="/#home-next-section"
                className="mt-8 inline-flex items-center justify-center rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-8 py-3 text-base font-bold text-white transition hover:scale-[1.02] hover:bg-[var(--color-primary-hover)]"
              >
                {homepageSettings.ctaButtonText?.trim() || "ابدأ رحلتك الآن"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {homepageSettings.facebookUrl?.trim() ? (
        <a
          href={homepageSettings.facebookUrl.trim()}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-24 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-lg transition hover:scale-110 hover:shadow-xl"
          aria-label="صفحتنا على فيسبوك"
        >
          <svg className="h-9 w-9" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </a>
      ) : null}
      {homepageSettings.whatsappUrl?.trim() ? (
        <a
          href={homepageSettings.whatsappUrl.trim()}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-110 hover:shadow-xl"
          aria-label="تواصل عبر واتساب"
        >
          <svg className="h-9 w-9" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      ) : null}
    </>
  );
}

export function HomePageBelowFoldFallback() {
  return (
    <div className="min-h-[40vh] animate-pulse bg-[var(--color-surface)]" aria-busy="true" aria-label="جاري تحميل المحتوى">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-16 sm:px-6">
        <div className="h-8 w-48 rounded bg-[var(--color-border)]" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-[var(--radius-card)] bg-[var(--color-border)]/60" />
          ))}
        </div>
      </div>
    </div>
  );
}
