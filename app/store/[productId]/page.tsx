import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  getHomepageSettings,
  getLatestPlatformSubscriptionExpiry,
  getStoreProductPublicById,
  listStudentStorePurchases,
  userHasActivePlatformSubscription,
} from "@/lib/db";
import { StoreProductDetailsClient } from "../StoreProductDetailsClient";

type Props = {
  params: Promise<{ productId: string }>;
};

export default async function StoreProductPage({ params }: Props) {
  const { productId } = await params;
  const pid = String(productId ?? "").trim();
  if (!pid) notFound();

  const settings = await getHomepageSettings().catch(() => null);
  if (!settings?.storeEnabled) notFound();

  const product = await getStoreProductPublicById(pid);
  if (!product) notFound();

  const session = await getServerSession(authOptions);
  let isSubscribed = false;
  let initiallyOwned = false;
  if (session?.user?.role === "STUDENT" && session.user.id) {
    const active = await userHasActivePlatformSubscription(session.user.id).catch(() => false);
    if (active) {
      const exp = await getLatestPlatformSubscriptionExpiry(session.user.id).catch(() => null);
      isSubscribed = !!exp;
    }
    const purchases = await listStudentStorePurchases(session.user.id).catch(() => []);
    initiallyOwned = purchases.some((p) => p.productId === pid);
  }

  return (
    <StoreProductDetailsClient
      product={product}
      isSubscribed={isSubscribed}
      isLoggedIn={!!session}
      initiallyOwned={initiallyOwned}
    />
  );
}

