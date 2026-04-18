import { notFound } from "next/navigation";
import Link from "next/link";
import { unstable_noStore } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getCourseWithContent,
  getEnrollment,
  getAllowedLessonIdsForUserCourse,
  getAllowedQuizIdsForUserCourse,
  getUserById,
  getLiveStreamsByCourseId,
  getHomepageSettings,
  hasFullCourseAccessAsStudent,
  userHasActivePlatformSubscriptionForPaidCourse,
  getLatestPlatformSubscriptionExpiry,
} from "@/lib/db";
import { EnrollButton } from "./EnrollButton";

type Props = { params: Promise<{ slug: string }> };

/** عدم التخزين المؤقت — دائماً التحقق من وجود الدورة (تجنب 404 للدورات المحذوفة) */
export const dynamic = "force-dynamic";
export const revalidate = 0;

function isCourseId(segment: string): boolean {
  return /^c[a-z0-9]{24}$/i.test(segment);
}

function decodeSlug(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** توحيد الـ slug في الروابط (إزالة الشرطات الزائدة) ليتطابق مع صفحة الاختبار على Vercel */
function normalizeSlugForUrl(s: string | null | undefined): string {
  if (!s || !s.trim()) return "";
  return s.trim().replace(/-+$/, "").replace(/^-+/, "");
}

export async function generateMetadata({ params }: Props) {
  const { slug: segment } = await params;
  unstable_noStore();
  const decoded = decodeSlug(segment);
  const data = await getCourseWithContent(decoded);
  const course = data?.course;
  if (!course) return { title: "دورة غير موجودة" };
  return {
    title: `${(course as { titleAr?: string; title?: string }).titleAr ?? course.title} | منصتي التعليمية`,
    description: (course as { shortDesc?: string; description?: string }).shortDesc ?? (course as { description?: string }).description,
  };
}

export default async function CoursePage({ params }: Props) {
  unstable_noStore();
  const { slug: segment } = await params;
  const decoded = decodeSlug(segment);
  const session = await getServerSession(authOptions);
  let data: Awaited<ReturnType<typeof getCourseWithContent>> = null;
  let isEnrolled = false;
  let allowedLessonIds: string[] = [];
  let allowedQuizIds: string[] = [];
  let userBalance = 0;
  let hasFullStudentAccess = false;
  let paidCourseCoveredBySubscription = false;
  let subscriptionExpiresAt: Date | null = null;
  try {
    data = await getCourseWithContent(decoded);
    if (data?.course && session?.user?.id && session.user.role === "STUDENT") {
      const [en, user, lessons, quizzes, fullAccess, subPaid] = await Promise.all([
        getEnrollment(session.user.id, data.course.id),
        getUserById(session.user.id),
        getAllowedLessonIdsForUserCourse(session.user.id, data.course.id),
        getAllowedQuizIdsForUserCourse(session.user.id, data.course.id),
        hasFullCourseAccessAsStudent(session.user.id, data.course.id),
        userHasActivePlatformSubscriptionForPaidCourse(session.user.id, data.course.id),
      ]);
      isEnrolled = !!en;
      if (!isEnrolled) {
        allowedLessonIds = lessons;
        allowedQuizIds = quizzes;
      }
      userBalance = Number(user?.balance) || 0;
      hasFullStudentAccess = fullAccess;
      paidCourseCoveredBySubscription = subPaid && !isEnrolled;
      if (paidCourseCoveredBySubscription) {
        subscriptionExpiresAt = await getLatestPlatformSubscriptionExpiry(session.user.id);
      }
    }
  } catch {
    notFound();
  }
  if (!data?.course) notFound();

  const course = {
    ...data.course,
    lessons: data.lessons,
    quizzes: data.quizzes,
  };
  const title = (course as { titleAr?: string; title: string }).titleAr ?? course.title;
  const categoryName = (course.category as { nameAr?: string; name?: string })?.nameAr ?? (course.category as { name?: string })?.name;
  const canEnroll =
    session?.user?.role === "STUDENT" && !isEnrolled && !paidCourseCoveredBySubscription;
  const hasPartialAccess = allowedLessonIds.length > 0 || allowedQuizIds.length > 0;
  const isStaff = session?.user?.role === "ADMIN" || session?.user?.role === "ASSISTANT_ADMIN";
  const canAccessContent =
    isStaff || hasPartialAccess || (session?.user?.role === "STUDENT" && hasFullStudentAccess);
  const canAccessQuizzes = isStaff || (session?.user?.role === "STUDENT" && hasFullStudentAccess);
  const coursePrice = Number((course as Record<string, unknown>).price) || 0;

  const liveStreams = canAccessContent ? await getLiveStreamsByCourseId(course.id) : [];
  const homepageSettings = await getHomepageSettings();
  const formatStreamDate = (d: Date | string) => {
    const date = typeof d === "string" ? new Date(d) : d;
    return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(date);
  };

  const isGuest = !session;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Link
        href="/courses"
        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        ← العودة للدورات
      </Link>

      {isGuest && (
        <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-4 py-3 sm:px-5 sm:py-4">
          <p className="text-sm font-medium text-[var(--color-foreground)] sm:text-base">
            سجّل الدخول أو أنشئ حساباً لمشاهدة محتوى الدورة والتسجيل فيها.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(`/courses/${decodeURIComponent(segment)}`)}`}
              className="inline-flex rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] transition hover:bg-[var(--color-border)]/50"
            >
              تسجيل الدخول
            </Link>
            <Link
              href={`/register?callbackUrl=${encodeURIComponent(`/courses/${decodeURIComponent(segment)}`)}`}
              className="inline-flex rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)]"
            >
              إنشاء حساب
            </Link>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* قسم المدرس */}
        <aside className="order-2 lg:order-1">
          <div className="sticky top-24 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <img
                  src={homepageSettings.teacherImageUrl?.trim() || "/instructor.png"}
                  alt={homepageSettings.heroTitle?.trim() || "المدرس"}
                  className="h-32 w-32 border-2 border-black border-dotted object-cover"
                />
                <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full border-4 border-[var(--color-surface)] bg-[var(--color-success)]" />
                <img
                  src={homepageSettings.heroFloatImage1 || "/images/ruler.png"}
                  alt=""
                  className="float-icon float-icon-1 absolute -left-8 top-0 h-9 w-9 object-contain drop-shadow sm:-left-9 sm:h-10 sm:w-10"
                  aria-hidden
                />
                <img
                  src={homepageSettings.heroFloatImage2 || "/images/notebook.png"}
                  alt=""
                  className="float-icon float-icon-2 absolute -right-8 bottom-2 h-9 w-9 object-contain drop-shadow sm:-right-9 sm:h-10 sm:w-10"
                  aria-hidden
                />
                <img
                  src={homepageSettings.heroFloatImage3 || "/images/pencil.png"}
                  alt=""
                  className="float-icon float-icon-3 absolute -bottom-2 left-1 h-8 w-8 object-contain drop-shadow sm:left-2 sm:h-9 sm:w-9"
                  aria-hidden
                />
              </div>
              <div className="mt-2 w-full border-t border-[var(--color-border)] pt-4">
                <p className="text-sm text-[var(--color-muted)]">
                  {homepageSettings.heroSlogan?.trim() ||
                    "ابدأ التعلم اليوم واصنع مستقبلك خطوة بخطوة."}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* محتوى الكورس */}
        <article className="order-1 lg:order-2">
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
          <div className="aspect-video w-full bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-primary-light)]/30 flex items-center justify-center overflow-hidden">
            {(course as Record<string, unknown>).imageUrl ?? (course as Record<string, unknown>).image_url ? (
              <img
                src={String((course as Record<string, unknown>).imageUrl ?? (course as Record<string, unknown>).image_url)}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-6xl opacity-50">📚</span>
            )}
          </div>
          <div className="p-6 sm:p-8">
            {categoryName && (
              <span className="text-sm font-medium text-[var(--color-primary)]">
                {categoryName}
              </span>
            )}
            <h1 className="mt-2 text-3xl font-bold text-[var(--color-foreground)]">
              {title}
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              {coursePrice > 0 && (
                <span className="rounded-full bg-[var(--color-primary-light)] px-3 py-1 text-sm font-semibold text-[var(--color-primary)]">
                  {coursePrice.toFixed(2)} ج.م
                </span>
              )}
              {(course as Record<string, unknown>).duration ? (
                <span className="rounded-full bg-[var(--color-primary-light)] px-3 py-1 text-sm text-[var(--color-primary)]">
                  ⏱ {(course as Record<string, unknown>).duration as string}
                </span>
              ) : null}
              {(course as Record<string, unknown>).level ? (
                <span className="rounded-full bg-[var(--color-border)] px-3 py-1 text-sm text-[var(--color-muted)]">
                  {(course as Record<string, unknown>).level === "beginner" && "مبتدئ"}
                  {(course as Record<string, unknown>).level === "intermediate" && "متوسط"}
                  {(course as Record<string, unknown>).level === "advanced" && "متقدم"}
                </span>
              ) : null}
            </div>
            <div className="mt-6 prose-custom text-[var(--color-foreground)]">
              <p>{(course as Record<string, unknown>).description as string}</p>
            </div>

            {liveStreams.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
                  البثوث المباشرة
                </h2>
                <ul className="mt-4 space-y-3">
                  {(liveStreams as unknown as Record<string, unknown>[]).map((ls) => (
                    <li
                      key={String(ls.id)}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4"
                    >
                      <div>
                        <span className="font-medium text-[var(--color-foreground)]">
                          {String(ls.title_ar ?? ls.titleAr ?? ls.title ?? "")}
                        </span>
                        <span className="mr-2 text-sm text-[var(--color-muted)]">
                          {ls.provider === "google_meet" ? "Google Meet" : "Zoom"} — {formatStreamDate((ls.scheduled_at ?? ls.scheduledAt) as string | Date || new Date())}
                        </span>
                      </div>
                      <a
                        href={String(ls.meeting_url ?? ls.meetingUrl ?? "#")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
                      >
                        انضم للبث
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {canEnroll && (
              <EnrollButton
                courseId={course.id}
                coursePrice={coursePrice}
                userBalance={userBalance}
              />
            )}
            {isEnrolled && (
              <p className="mt-4 rounded-[var(--radius-btn)] bg-[var(--color-primary-light)]/50 px-4 py-2 text-sm text-[var(--color-primary)]">
                ✓ أنت مسجّل في هذه الدورة. <Link href="/dashboard" className="font-medium underline">لوحة التحكم</Link>
              </p>
            )}

            {paidCourseCoveredBySubscription && subscriptionExpiresAt && (
              <p className="mt-4 rounded-[var(--radius-btn)] border border-teal-500/40 bg-teal-500/10 px-4 py-2 text-sm text-teal-900 dark:text-teal-100">
                تشاهد هذه الدورة ضمن{" "}
                <span className="font-semibold">اشتراك المنصة</span> حتى{" "}
                {new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(subscriptionExpiresAt)}.
              </p>
            )}

            {hasPartialAccess && !isEnrolled && !hasFullStudentAccess && (
              <div className="mt-6 rounded-[var(--radius-card)] border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                هذا الكورس متاح لك عبر كود يفتح محتوى محدد (حصص/اختبارات) داخل الدورة.
              </div>
            )}

            {course.lessons.length > 0 && (
              <div className="mt-10">
                <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
                  محتوى الدورة ({course.lessons.length} حصص)
                </h2>
                <ul className="mt-4 space-y-2">
                  {(hasPartialAccess && !isEnrolled && !isStaff
                    ? course.lessons.filter((l) => allowedLessonIds.includes(String((l as Record<string, unknown>).id ?? l.id)))
                    : course.lessons
                  ).map((lesson, i) => {
                    const lessonClassName = `flex items-center gap-3 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-3 ${canAccessContent ? "transition hover:border-[var(--color-primary)]/30" : ""}`;
                    const content = (
                      <>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-sm font-medium text-[var(--color-primary)]">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-[var(--color-foreground)]">
                            {String((lesson as Record<string, unknown>).titleAr ?? (lesson as Record<string, unknown>).title ?? "")}
                          </span>
                          {(lesson as Record<string, unknown>).duration ? (
                            <span className="mr-2 text-sm text-[var(--color-muted)]">
                              • {String((lesson as Record<string, unknown>).duration)} دقيقة
                            </span>
                          ) : null}
                          {(lesson as Record<string, unknown>).videoUrl && canAccessContent ? (
                            <span className="mr-2 text-xs text-[var(--color-primary)]">▶ فيديو</span>
                          ) : null}
                        </div>
                      </>
                    );
                    const courseSlugOrId = String((course as Record<string, unknown>).slug ?? "").trim() || String((course as Record<string, unknown>).id ?? course.id);
                    const lessonSlugOrId = (lesson as Record<string, unknown>).slug && String((lesson as Record<string, unknown>).slug).trim()
                      ? encodeURIComponent(String((lesson as Record<string, unknown>).slug).trim())
                      : String((lesson as Record<string, unknown>).id ?? lesson.id);
                    return (
                      <li key={String(lesson.id)}>
                        {canAccessContent ? (
                          <Link
                            href={`/courses/${courseSlugOrId}/lessons/${lessonSlugOrId}`}
                            className={lessonClassName}
                          >
                            {content}
                          </Link>
                        ) : (
                          <div className={lessonClassName}>
                            {content}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {course.quizzes && course.quizzes.length > 0 && (
              <div className="mt-10">
                <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
                  الاختبارات ({course.quizzes.length})
                </h2>
                <ul className="mt-4 space-y-2">
                  {course.quizzes.map((quiz, i) => {
                    const q = quiz as Record<string, unknown> & { _count?: { questions?: number } };
                    const questionsCount = q._count?.questions ?? 0;
                    return (
                    <li key={String(q.id)}>
                      {canAccessQuizzes ? (
                        <Link
                          href={`/courses/${encodeURIComponent(normalizeSlugForUrl(String((course as Record<string, unknown>).slug ?? "")) || String((course as Record<string, unknown>).id ?? course.id))}/quizzes/${String(q.id)}`}
                          className="flex items-center justify-between rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 transition hover:border-[var(--color-primary)]/30"
                        >
                          <span className="font-medium text-[var(--color-foreground)]">{String(q.title ?? "")}</span>
                          <span className="text-sm text-[var(--color-muted)]">{questionsCount} سؤال</span>
                        </Link>
                      ) : (
                        <div className="flex items-center justify-between rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 opacity-75">
                          <span className="font-medium text-[var(--color-foreground)]">{String(q.title ?? "")}</span>
                          <span className="text-sm text-[var(--color-muted)]">{questionsCount} سؤال</span>
                        </div>
                      )}
                    </li>
                  );})}
                </ul>
              </div>
            )}
          </div>
        </div>
        </article>
      </div>
    </div>
  );
}
