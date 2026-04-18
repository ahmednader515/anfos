import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { getServerSession } from "next-auth";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SessionProvider } from "@/components/SessionProvider";
import { StoreSplashProvider } from "@/components/StoreSplashProvider";
import { InspectGuard } from "@/components/InspectGuard";
import { ForceLogoutGuard } from "@/components/ForceLogoutGuard";
import { authOptions } from "@/lib/auth";
import {
  getHomepageSettings,
  userHasActivePlatformSubscription,
  getLatestPlatformSubscriptionExpiry,
} from "@/lib/db";
import { normalizeHeroHex } from "@/lib/hero-bg";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const DEFAULT_TITLE = "منصتي التعليمية | دورات وتعلم أونلاين";
const DEFAULT_DESCRIPTION = "منصة تعليمية حديثة لدورات البرمجة والتصميم والتطوير";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getHomepageSettings();
    const title = settings.pageTitle?.trim() || DEFAULT_TITLE;
    return { title, description: DEFAULT_DESCRIPTION };
  } catch {
    return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION };
  }
}

const DEFAULT_FOOTER_TITLE = "منصتي التعليمية";
const DEFAULT_FOOTER_TAGLINE = "تعلم بأسلوب حديث ومنهجية واضحة";
const DEFAULT_FOOTER_COPYRIGHT = "منصتي التعليمية. جميع الحقوق محفوظة.";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let platformName: string | null = null;
  let headerLogoUrl: string | null = null;
  let platformPrimaryColor: string | null = null;
  let footerTitle = DEFAULT_FOOTER_TITLE;
  let footerTagline = DEFAULT_FOOTER_TAGLINE;
  let footerCopyright = DEFAULT_FOOTER_COPYRIGHT;
  try {
    const settings = await getHomepageSettings();
    platformName = settings.platformName;
    headerLogoUrl = settings.headerLogoUrl ?? null;
    platformPrimaryColor = normalizeHeroHex(String(settings.primaryColor ?? "")) ?? null;
    if (settings.footerTitle?.trim()) footerTitle = settings.footerTitle.trim();
    if (settings.footerTagline?.trim()) footerTagline = settings.footerTagline.trim();
    if (settings.footerCopyright?.trim()) footerCopyright = settings.footerCopyright.trim();
  } catch {
    // استخدام الافتراضي في الهيدر والفوتر
  }

  let platformSubscriptionExpiryLabel: string | null = null;
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role === "STUDENT" && session.user.id) {
      const active = await userHasActivePlatformSubscription(session.user.id);
      if (active) {
        const exp = await getLatestPlatformSubscriptionExpiry(session.user.id);
        if (exp) {
          platformSubscriptionExpiryLabel = new Intl.DateTimeFormat("ar-EG", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(exp);
        } else {
          platformSubscriptionExpiryLabel = "نشط";
        }
      }
    }
  } catch {
    platformSubscriptionExpiryLabel = null;
  }

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem("theme");document.documentElement.classList.add(t==="light"?"light":"dark");})();`,
          }}
        />
        {platformPrimaryColor ? (
          <style
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: `:root{--platform-primary:${platformPrimaryColor};}`,
            }}
          />
        ) : null}
        </head>
      <body className={`${outfit.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <NextTopLoader
          color={platformPrimaryColor ?? "#0d9488"}
          height={3}
          showSpinner={false}
          easing="ease"
          speed={300}
          shadow="0 0 10px rgba(13,148,136,0.4)"
        />
        <SessionProvider>
          <StoreSplashProvider>
          <InspectGuard />
          <ForceLogoutGuard />
          <Header
            platformName={platformName}
            headerLogoUrl={headerLogoUrl}
            platformSubscriptionExpiryLabel={platformSubscriptionExpiryLabel}
          />
          <main className="flex-1">{children}</main>
          <Footer footerTitle={footerTitle} footerTagline={footerTagline} footerCopyright={footerCopyright} />
          </StoreSplashProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
