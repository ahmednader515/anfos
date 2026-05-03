import { redirect } from "next/navigation";
import { unstable_noStore } from "next/cache";
import { getTeachersFeatureEnabled, listTeachersForHomepage } from "@/lib/db";
import { TeachersBrowseClient } from "./TeachersBrowseClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "اختر المدربين | منصتي التعليمية",
  description: "تصفح مدربي المنصة والدورات المتاحة لكل مدرب",
};

export default async function TeachersPage() {
  unstable_noStore();
  const enabled = await getTeachersFeatureEnabled();
  if (!enabled) {
    redirect("/");
  }
  const teachers = await listTeachersForHomepage().catch(() => []);

  return <TeachersBrowseClient initialTeachers={teachers} />;
}
