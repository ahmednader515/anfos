import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { MessagesView } from "./MessagesView";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isStaff =
    session.user.role === "ADMIN" ||
    session.user.role === "ASSISTANT_ADMIN" ||
    session.user.role === "TEACHER";
  const isStudent = session.user.role === "STUDENT";
  if (!isStaff && !isStudent) redirect("/dashboard");

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-[var(--color-foreground)]">
        {isStaff ? "تواصل خاص مع الطلبة" : "الرسائل الواردة"}
      </h2>
      <p className="mb-6 text-sm text-[var(--color-muted)]">
        {isStaff
          ? session.user.role === "TEACHER"
            ? "الطلاب المسجّلون في كورساتك: اختر طالباً لفتح محادثة وإرسال رسائل أو ملفات."
            : "اختر طالباً لفتح محادثة معه وإرسال رسائل أو صور أو ملفات."
          : "المحادثات التي بدأها الإدارة معك. يمكنك الرد بنص أو صور أو ملفات."}
      </p>
      <MessagesView
        isStaff={isStaff}
        userId={session.user.id}
        userName={session.user.name ?? ""}
      />
    </div>
  );
}
