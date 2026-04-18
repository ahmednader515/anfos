import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import {
  getUserById,
  getAccessibleCoursesForUser,
  countUsersByRole,
  countCourses,
  getAllQuizAttemptsForAdmin,
  getTotalPlatformEarnings,
  getCoursesWithCountsForCreator,
  getSubscriptionsFeatureEnabled,
  listActiveSubscriptionPlansPublic,
  listStudentStorePurchases,
  userHasActivePlatformSubscription,
  getLatestPlatformSubscriptionExpiry,
} from "@/lib/db";
import { MyCoursesSection } from "./MyCoursesSection";
import { ActivateCodeSection } from "./ActivateCodeSection";
import { StudentSubscriptionsPanel } from "./StudentSubscriptionsPanel";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";
  const isAssistant = session.user.role === "ASSISTANT_ADMIN";
  const isStudent = session.user.role === "STUDENT";
  const isTeacher = session.user.role === "TEACHER";

  if (isTeacher) {
    const myCourses = await getCoursesWithCountsForCreator(session.user.id).catch(() => []);
    const publishedCount = myCourses.filter((c) => {
      const row = c as Record<string, unknown>;
      return Boolean(row.isPublished ?? row.is_published ?? false);
    }).length;

    return (
      <div className="space-y-8">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">مرحباً، {session.user.name}</h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            لوحة المدرس: أدر كورساتك، تابع الطلاب المسجلين فيها، والواجبات والبث والأكواد من القائمة أعلاه.
          </p>
        </div>
        <div>
          <h2 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">اختصارات</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/dashboard/courses"
              className="flex min-h-[160px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
            >
              <h3 className="font-semibold text-[var(--color-foreground)]">كورساتي</h3>
              <p className="mt-1 text-2xl font-bold text-[var(--color-primary)]">{myCourses.length}</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">منشور: {publishedCount}</p>
            </Link>
            <Link
              href="/dashboard/profile"
              className="flex min-h-[160px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
            >
              <h3 className="font-semibold text-[var(--color-foreground)]">تعديل الملف الشخصي</h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">الاسم، كلمة المرور، الصورة والمادة الظاهرة للطلاب</p>
            </Link>
            <Link
              href="/dashboard/statistics"
              className="flex min-h-[160px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
            >
              <h3 className="font-semibold text-[var(--color-foreground)]">إحصائيات الطلاب</h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">درجات الاختبارات والتسجيلات في كورساتك</p>
            </Link>
            <Link
              href="/dashboard/messages"
              className="flex min-h-[160px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
            >
              <h3 className="font-semibold text-[var(--color-foreground)]">تواصل مع الطلاب</h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">طلاب اشتركوا في كورساتك</p>
            </Link>
            <Link
              href="/dashboard/homework"
              className="flex min-h-[160px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
            >
              <h3 className="font-semibold text-[var(--color-foreground)]">استلام الواجبات</h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">تسليمات كورساتك</p>
            </Link>
            <Link
              href="/dashboard/live-streams"
              className="flex min-h-[160px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
            >
              <h3 className="font-semibold text-[var(--color-foreground)]">البثوث المباشرة</h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">ربط Zoom أو Meet بكورساتك</p>
            </Link>
            <Link
              href="/dashboard/codes"
              className="flex min-h-[160px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
            >
              <h3 className="font-semibold text-[var(--color-foreground)]">أكواد التفعيل</h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">لكورساتك فقط</p>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isStudent) {
    const user = await getUserById(session.user.id);
    const enrolledCourses = user ? await getAccessibleCoursesForUser(session.user.id) : [];
    const balance = user ? Number(user.balance) : 0;

    let subscriptionsFeature = false;
    let subscriptionPlansForStudent: Awaited<ReturnType<typeof listActiveSubscriptionPlansPublic>> = [];
    let studentHasActiveSub = false;
    let studentSubExpiresIso: string | null = null;
    let storePurchases: Awaited<ReturnType<typeof listStudentStorePurchases>> = [];
    try {
      subscriptionsFeature = await getSubscriptionsFeatureEnabled();
      if (subscriptionsFeature) {
        subscriptionPlansForStudent = await listActiveSubscriptionPlansPublic();
        studentHasActiveSub = await userHasActivePlatformSubscription(session.user.id);
        const exp = studentHasActiveSub ? await getLatestPlatformSubscriptionExpiry(session.user.id) : null;
        studentSubExpiresIso = exp ? exp.toISOString() : null;
      }
      storePurchases = await listStudentStorePurchases(session.user.id).catch(() => []);
    } catch {
      subscriptionsFeature = false;
    }

    return (
      <div className="space-y-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              مرحباً، {session.user.name}
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-[var(--color-muted)]">رصيدك الحالي:</span>
                <span className="text-2xl font-bold text-[var(--color-primary)]">
                  {Number(balance).toFixed(2)} ج.م
                </span>
              </div>
              <Link
                href="/dashboard/add-balance"
                className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)]"
              >
                إضافة رصيد
              </Link>
            </div>
          </div>
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
            <h2 className="mb-2 text-lg font-semibold text-[var(--color-foreground)]">
              الكورسات المتاحة
            </h2>
            <p className="mb-4 text-sm text-[var(--color-muted)]">
              تصفح جميع الدورات وسجّل في ما يناسبك
            </p>
            <Link
              href="/courses"
              className="inline-flex rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)]"
            >
              عرض الكورسات
            </Link>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <ActivateCodeSection />
          <Link
            href="/dashboard/messages"
            className="flex flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] text-center transition hover:border-[var(--color-primary)]/30"
          >
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">الرسائل الواردة</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              عرض الرسائل والمحادثات من الإدارة أو المدرس
            </p>
            <span className="mt-4 inline-flex w-fit rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-5 py-2.5 text-base font-medium text-white transition hover:bg-[var(--color-primary-hover)]">
              فتح الرسائل
            </span>
          </Link>
        </div>

        {subscriptionsFeature ? (
          <StudentSubscriptionsPanel
            plans={subscriptionPlansForStudent}
            hasActivePlatformSubscription={studentHasActiveSub}
            activePlatformSubscriptionExpiresAtIso={studentSubExpiresIso}
          />
        ) : null}

        {storePurchases.length > 0 ? (
          <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">مشترياتي من متجر المنصة</h2>
              <Link href="/store" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
                الانتقال للمتجر
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {storePurchases.map((item) => (
                <article key={item.purchaseId} className="overflow-hidden rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)]">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="h-32 w-full object-cover" />
                  ) : (
                    <div className="h-32 w-full bg-[var(--color-primary)]/10" />
                  )}
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{item.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--color-muted)]">{item.description}</p>
                    {item.pdfUrl ? (
                      <a
                        href={item.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-3 py-2 text-xs font-medium text-white hover:bg-[var(--color-primary-hover)]"
                      >
                        تحميل الملف
                      </a>
                    ) : (
                      <p className="mt-3 text-xs text-[var(--color-muted)]">لا يوجد ملف PDF لهذا المنتج.</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <MyCoursesSection courses={enrolledCourses} />
      </div>
    );
  }

  // أدمن أو مساعد أدمن
  const [studentsCount, coursesCount, quizAttempts, totalEarnings] = await Promise.all([
    countUsersByRole("STUDENT"),
    countCourses(),
    getAllQuizAttemptsForAdmin().catch(() => []),
    getTotalPlatformEarnings(),
  ]);

  return (
    <div className="space-y-8">
      {/* قسم: كورسات المنصة */}
      {(isAdmin || isAssistant) && (
        <>
          <div>
            <h2 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">كورسات المنصة</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {isAdmin && (
                <Link
                  href="/dashboard/courses"
                  className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
                >
                  <h3 className="font-semibold text-[var(--color-foreground)]">إدارة الكورسات</h3>
                  <p className="mt-1 text-3xl font-bold text-[var(--color-primary)]">{coursesCount}</p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">تعديل أو حذف الدورات · إنشاء دورة جديدة</p>
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/dashboard/courses/new"
                  className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
                >
                  <h3 className="font-semibold text-[var(--color-foreground)]">إنشاء كورس</h3>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">إضافة دورة جديدة بالمحتوى والحصص والاختبارات</p>
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/dashboard/live-streams"
                  className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
                >
                  <h3 className="font-semibold text-[var(--color-foreground)]">البثوث المباشرة</h3>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">إضافة بث عبر Zoom أو Google Meet وربطه بكورس على المنصة</p>
                </Link>
              )}
              <Link
                href="/dashboard/codes"
                className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
              >
                <h3 className="font-semibold text-[var(--color-foreground)]">إنشاء الأكواد</h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">إنشاء أكواد تفعيل مجانية لدورة وتوزيعها على الطلاب</p>
              </Link>
            </div>
            {isAdmin ? (
              <div className="mt-5 rounded-[var(--radius-card)] border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  يمكنك تعديل طرق الدفع التي تظهر عند الطالب من الضغط{" "}
                  <Link href="/dashboard/settings/add-balance" className="font-semibold underline">
                    هنا
                  </Link>
                  .
                </p>
              </div>
            ) : null}
          </div>
          <hr className="border-[var(--color-border)]" />
        </>
      )}

      {/* قسم: إدارة الطلاب */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">إدارة الطلاب</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/students"
            className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
          >
            <h3 className="font-semibold text-[var(--color-foreground)]">{isAdmin ? "الطلاب والحسابات" : "الطلاب"}</h3>
            <p className="mt-1 text-3xl font-bold text-[var(--color-primary)]">{studentsCount}</p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">إدارة الطلاب، تعديل الحسابات، إضافة الأرصدة</p>
          </Link>
          <Link
            href="/dashboard/statistics"
            className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
          >
            <h3 className="font-semibold text-[var(--color-foreground)]">إحصائيات الطلاب</h3>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <span className="text-2xl font-bold text-[var(--color-primary)]">{totalEarnings.toFixed(2)}</span>
              <span className="text-sm text-[var(--color-muted)]">ج.م أرباح</span>
            </div>
            <p className="mt-2 text-sm text-[var(--color-muted)]">عرض التفاصيل والدرجات وإجمالي الأرباح</p>
          </Link>
          {(isAdmin || isAssistant) && (
            <>
              <Link
                href="/dashboard/homework"
                className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
              >
                <h3 className="font-semibold text-[var(--color-foreground)]">استلام واجبات الطلاب</h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">عرض تسليمات الواجبات والبحث باسم الطالب</p>
              </Link>
              <Link
                href="/dashboard/messages"
                className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
              >
                <h3 className="font-semibold text-[var(--color-foreground)]">تواصل خاص مع الطلبة</h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">محادثة مع طالب، إرسال رسائل أو صور أو ملفات</p>
              </Link>
            </>
          )}
        </div>
      </div>

      {(isAdmin || isAssistant) && (
        <div className="rounded-[var(--radius-card)] border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            يمكنك إضافة رصيد لحسابات الطلاب وتعديل أسمائهم وكلمات المرور من صفحة{" "}
            <Link href="/dashboard/students" className="font-medium underline">
              الطلاب
            </Link>
            .
          </p>
        </div>
      )}

      {/* قسم: تعديل تصميم المنصة */}
      {isAdmin && (
        <>
          <hr className="border-[var(--color-border)]" />
          <div>
            <h2 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">تعديل تصميم المنصة</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <Link
                href="/dashboard/settings/homepage"
                className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
              >
                <h3 className="font-semibold text-[var(--color-foreground)]">إعدادات الصفحة الرئيسية</h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">صورة المدرس واسم المنصة والعنوان والشعار</p>
              </Link>
              <Link
                href="/dashboard/reviews"
                className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
              >
                <h3 className="font-semibold text-[var(--color-foreground)]">تعليقات الطلاب</h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">إدارة تعليقات الطلاب المعروضة في الصفحة الرئيسية (إضافة / تعديل / حذف)</p>
              </Link>
            </div>
          </div>

          <hr className="border-[var(--color-border)]" />

          {/* قسم: تحويل المنصة إلى أكاديمية متعددة المدرسين */}
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)] sm:text-xl">
              تحويل المنصة الشخصية إلى أكاديمية تضم عدداً من المدرسين وإمكانية إنشاء اشتراكات للمحتوى المعروض
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--color-muted)]">
              من هنا تفعّل عرض المدرسين على الموقع، وتنشئ حسابات مدرسين لكل منهم دوراته الظاهرة في بطاقته، لتتحول المنصة من مسار شخصي واحد إلى أكاديمية يعلّم فيها عدة مدرسين.               كما يمكنك من الأسفل ضبط اشتراكات المنصة (أسبوعية أو شهرية أو سنوية) ليصل الطلاب لجميع الكورسات المدفوعة المنشورة ضمن مدة الاشتراك، ومتابعة الطلاب المشتركين وتعديل أو حذف سجلات اشتراكهم.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/dashboard/teachers"
                className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-primary)]/25 bg-[var(--color-background)] p-6 text-center transition hover:border-[var(--color-primary)]/50 hover:shadow-[var(--shadow-card)]"
              >
                <h3 className="font-semibold text-[var(--color-foreground)]">تعدد المدرسين</h3>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  تفعيل أو إيقاف قسم «اختر المدرسين»، وإنشاء حسابات مدرسين وتعديلها (الاسم، البريد أو الهاتف، المادة، الصورة، كلمة المرور)
                </p>
              </Link>
              <Link
                href="/dashboard/subscriptions"
                className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-primary)]/25 bg-[var(--color-background)] p-6 text-center transition hover:border-[var(--color-primary)]/50 hover:shadow-[var(--shadow-card)]"
              >
                <h3 className="font-semibold text-[var(--color-foreground)]">إنشاء اشتراكات المنصة</h3>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  تفعيل قسم الاشتراكات في الصفحة الرئيسية، وإنشاء باقات أسبوعية أو شهرية أو سنوية، وربطها بالوصول لجميع الكورسات المدفوعة المنشورة
                </p>
              </Link>
              <Link
                href="/dashboard/subscription-students"
                className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-primary)]/25 bg-[var(--color-background)] p-6 text-center transition hover:border-[var(--color-primary)]/50 hover:shadow-[var(--shadow-card)]"
              >
                <h3 className="font-semibold text-[var(--color-foreground)]">إدارة الطلاب المشتركين</h3>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  قائمة من اشترك في باقات المنصة والمبالغ المدفوعة، مع إمكانية تعديل تاريخ انتهاء الاشتراك أو حذف السجل
                </p>
              </Link>
              <Link
                href="/dashboard/store"
                className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-primary)]/25 bg-[var(--color-background)] p-6 text-center transition hover:border-[var(--color-primary)]/50 hover:shadow-[var(--shadow-card)]"
              >
                <h3 className="font-semibold text-[var(--color-foreground)]">متجر المنصة</h3>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  تفعيل أو إيقاف قسم متجر المنصة، وإضافة منتجات رقمية مثل الملازم وكتب PDF (اسم، وصف، سعر، صورة، ملف PDF).
                </p>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
