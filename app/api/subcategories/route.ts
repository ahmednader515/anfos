import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  categoryIsManageableOnDashboard,
  createSubCategory,
  findSubCategoryByNameForDashboard,
  getSubCategoriesForDashboard,
  getSubCategoryById,
  subCategoryParentIsValid,
  subCategoryIsManageableOnDashboard,
} from "@/lib/db";

/** أقسام فرعية لوحة الدورات — نفس قواعد الملكية للأقسام */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    const role = session.user.role;
    if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const hasParent = searchParams.has("parentId");
    const parentId = hasParent ? searchParams.get("parentId") : undefined;
    const subcats = await getSubCategoriesForDashboard(session.user.id, role, categoryId, parentId);
    return NextResponse.json(subcats);
  } catch (error) {
    console.error("API subcategories GET:", error);
    return NextResponse.json({ error: "فشل جلب الأقسام الفرعية" }, { status: 500 });
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

  let body: { name?: string; categoryId?: string; imageUrl?: string | null; parentId?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const name = body.name?.trim();
  const categoryId = body.categoryId?.trim();
  if (!name || !categoryId) {
    return NextResponse.json({ error: "الاسم والقسم الرئيسي مطلوبان" }, { status: 400 });
  }

  const ok = await categoryIsManageableOnDashboard(categoryId, session.user.id, role);
  if (!ok) {
    return NextResponse.json({ error: "القسم الرئيسي غير صالح أو غير مسموح" }, { status: 400 });
  }

  try {
    const existing = await findSubCategoryByNameForDashboard(name, categoryId, session.user.id, role);
    if (existing) return NextResponse.json(existing);

    let parentId: string | null = body.parentId?.trim() || null;
    if (parentId) {
      const manageable = await subCategoryIsManageableOnDashboard(parentId, session.user.id, role);
      if (!manageable) return NextResponse.json({ error: "القسم الأب غير مسموح" }, { status: 400 });
      const parent = await getSubCategoryById(parentId);
      if (!parent) return NextResponse.json({ error: "القسم الأب غير موجود" }, { status: 400 });
      const parentCatId = String((parent as { categoryId?: unknown }).categoryId ?? (parent as { category_id?: unknown }).category_id ?? "");
      if (parentCatId !== categoryId) return NextResponse.json({ error: "القسم الأب لا يتبع نفس القسم الرئيسي" }, { status: 400 });
      const valid = await subCategoryParentIsValid({ parentId, categoryId });
      if (!valid) return NextResponse.json({ error: "تعيين الأب غير صالح" }, { status: 400 });
    }

    const baseSlug =
      name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u0600-\u06FF-]+/g, "") || "subcat";
    const uniqueSlug = `${baseSlug}-${Date.now()}`;
    const row = await createSubCategory({
      category_id: categoryId,
      ...(parentId ? { parent_subcategory_id: parentId } : {}),
      name,
      name_ar: name,
      slug: uniqueSlug,
      image_url: body.imageUrl?.trim() || null,
      created_by_id: role === "TEACHER" ? session.user.id : null,
    });
    return NextResponse.json(row);
  } catch (e) {
    console.error("API subcategories POST:", e);
    return NextResponse.json({ error: "فشل إنشاء القسم الفرعي" }, { status: 500 });
  }
}

