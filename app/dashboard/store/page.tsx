import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  getStoreFeatureEnabled,
  getHomepageSettings,
  listStoreProductsAll,
  listStorePurchasesForAdmin,
  getStoreSalesStats,
} from "@/lib/db";
import { StoreAdminClient } from "./StoreAdminClient";

export default async function StoreDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const [enabled, homepage] = await Promise.all([
    getStoreFeatureEnabled(),
    getHomepageSettings().catch(() => null),
  ]);
  const [products, purchases, stats] = await Promise.all([
    listStoreProductsAll().catch(() => []),
    listStorePurchasesForAdmin().catch(() => []),
    getStoreSalesStats().catch(() => ({
      purchasesCount: 0,
      buyersCount: 0,
      soldProductsCount: 0,
      revenue: 0,
      totalCost: 0,
      totalProfit: 0,
      profitMarginPercent: null,
      byProduct: [],
    })),
  ]);

  const initialHomeStoreTitle = homepage?.storeSectionTitle?.trim() || "متجر المنصة";
  const initialHomeStoreDescription =
    homepage?.storeSectionDescription?.trim() ||
    "مرحبًا بك في متجر المنصة الذي يضم ملازم وكتب في غاية الأهمية. اختر ما يناسبك من المواد الرقمية التعليمية واستفد من محتوى مُنظّم يدعم رحلتك الدراسية.";

  return (
    <StoreAdminClient
      initialEnabled={enabled}
      initialHomeStoreTitle={initialHomeStoreTitle}
      initialHomeStoreDescription={initialHomeStoreDescription}
      initialProducts={products}
      initialPurchases={purchases}
      initialStats={stats}
    />
  );
}
