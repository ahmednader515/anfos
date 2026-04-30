import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  deleteSubCategory,
  getSubCategoryById,
  subCategoryIsManageableOnDashboard,
  subCategoryParentIsValid,
  updateSubCategory,
} from "@/lib/db";

/** حذف قسم فرعي — نفس قواعد الحذف للأقسام */
export async function DELETE(
  _request: Request,
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
  if (!id?.trim()) {
    return NextResponse.json({ error: "معرّف القسم الفرعي مطلوب" }, { status: 400 });
  }

  const allowed = await subCategoryIsManageableOnDashboard(id, session.user.id, role);
  if (!allowed) {
    return NextResponse.json({ error: "لا يمكن حذف هذا القسم الفرعي" }, { status: 403 });
  }

  try {
    await deleteSubCategory(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("API subcategories [id] DELETE:", e);
    return NextResponse.json({ error: "فشل حذف القسم الفرعي" }, { status: 500 });
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
  if (!id?.trim()) {
    return NextResponse.json({ error: "معرّف القسم الفرعي مطلوب" }, { status: 400 });
  }

  const allowed = await subCategoryIsManageableOnDashboard(id, session.user.id, role);
  if (!allowed) {
    return NextResponse.json({ error: "لا يمكن تعديل هذا القسم الفرعي" }, { status: 403 });
  }

  let body: { name?: string; nameAr?: string | null; slug?: string; description?: string | null; imageUrl?: string | null; order?: number; parentId?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  try {
    if (body.parentId !== undefined) {
      const child = await getSubCategoryById(id);
      if (!child) return NextResponse.json({ error: "القسم الفرعي غير موجود" }, { status: 404 });
      const categoryId = String((child as { categoryId?: unknown }).categoryId ?? (child as { category_id?: unknown }).category_id ?? "");
      const parentId = body.parentId?.trim() || null;
      if (parentId) {
        const allowedParent = await subCategoryIsManageableOnDashboard(parentId, session.user.id, role);
        if (!allowedParent) return NextResponse.json({ error: "القسم الأب غير مسموح" }, { status: 400 });
        const parent = await getSubCategoryById(parentId);
        if (!parent) return NextResponse.json({ error: "القسم الأب غير موجود" }, { status: 400 });
        const parentCatId = String((parent as { categoryId?: unknown }).categoryId ?? (parent as { category_id?: unknown }).category_id ?? "");
        if (parentCatId !== categoryId) return NextResponse.json({ error: "القسم الأب لا يتبع نفس القسم الرئيسي" }, { status: 400 });
        const valid = await subCategoryParentIsValid({ childId: id, parentId, categoryId });
        if (!valid) return NextResponse.json({ error: "تعيين الأب غير صالح (حلقة/اختلاف قسم)" }, { status: 400 });
      }
    }

    await updateSubCategory(id, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.nameAr !== undefined ? { name_ar: body.nameAr } : {}),
      ...(body.slug !== undefined ? { slug: body.slug } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.imageUrl !== undefined ? { image_url: body.imageUrl } : {}),
      ...(body.parentId !== undefined ? { parent_subcategory_id: body.parentId } : {}),
      ...(body.order !== undefined ? { order: body.order } : {}),
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("API subcategories [id] PATCH:", e);
    return NextResponse.json({ error: "فشل تعديل القسم الفرعي" }, { status: 500 });
  }
}

