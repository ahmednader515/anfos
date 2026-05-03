import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createCategory, findCategoryByNameForDashboard, getCategoriesForDashboard } from "@/lib/db";

/** أقسام لوحة الدورات — المدرب يرى أقسامه فقط؛ الأدمن/المساعد يرون أقسام المنصة والأدمن */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    const role = session.user.role;
    if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    const categories = await getCategoriesForDashboard(session.user.id, role);
    return NextResponse.json(categories);
  } catch (error) {
    console.error("API categories:", error);
    return NextResponse.json(
      { error: "فشل جلب التصنيفات" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  let body: { name?: string; nameAr?: string | null; slug?: string; description?: string | null; imageUrl?: string | null; order?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "اسم القسم مطلوب" }, { status: 400 });

  const existing = await findCategoryByNameForDashboard(name, session.user.id, role);
  if (existing) return NextResponse.json(existing);

  const baseSlug =
    (body.slug?.trim() || name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u0600-\u06FF-]+/g, "") || "cat");
  const uniqueSlug = `${baseSlug}-${Date.now()}`;

  try {
    const row = await createCategory({
      name,
      name_ar: body.nameAr?.trim() || body.nameAr === "" ? body.nameAr : name,
      slug: uniqueSlug,
      description: body.description?.trim() || null,
      image_url: body.imageUrl?.trim() || null,
      order: typeof body.order === "number" && Number.isFinite(body.order) ? body.order : 0,
      created_by_id: role === "TEACHER" ? session.user.id : null,
    });
    return NextResponse.json(row);
  } catch (e) {
    console.error("API categories POST:", e);
    return NextResponse.json({ error: "فشل إنشاء القسم" }, { status: 500 });
  }
}
