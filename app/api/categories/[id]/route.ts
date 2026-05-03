import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { categoryIsManageableOnDashboard, deleteCategory, updateCategory } from "@/lib/db";

/** حذف قسم — الأدمن/المساعد: أقسام المنصة وأقسام الأدمن فقط؛ المدرب: أقسامه فقط. الدورات المرتبطة تصبح بدون قسم */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "معرّف القسم مطلوب" }, { status: 400 });
  }

  const allowed = await categoryIsManageableOnDashboard(id, session.user.id, role);
  if (!allowed) {
    return NextResponse.json({ error: "لا يمكن حذف هذا القسم" }, { status: 403 });
  }

  try {
    await deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("API categories [id] DELETE:", e);
    return NextResponse.json({ error: "فشل حذف القسم" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  if (!id?.trim()) return NextResponse.json({ error: "معرّف القسم مطلوب" }, { status: 400 });

  const allowed = await categoryIsManageableOnDashboard(id, session.user.id, role);
  if (!allowed) return NextResponse.json({ error: "لا يمكن تعديل هذا القسم" }, { status: 403 });

  let body: { name?: string; nameAr?: string | null; slug?: string; description?: string | null; imageUrl?: string | null; order?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  try {
    await updateCategory(id, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.nameAr !== undefined ? { name_ar: body.nameAr } : {}),
      ...(body.slug !== undefined ? { slug: body.slug } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.imageUrl !== undefined ? { image_url: body.imageUrl } : {}),
      ...(body.order !== undefined ? { order: body.order } : {}),
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("API categories [id] PATCH:", e);
    return NextResponse.json({ error: "فشل تعديل القسم" }, { status: 500 });
  }
}
