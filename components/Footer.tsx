import Link from "next/link";

const DEFAULT_FOOTER_TITLE = "منصتي التعليمية";
const DEFAULT_FOOTER_TAGLINE = "تعلم بأسلوب حديث ومنهجية واضحة";
const DEFAULT_FOOTER_COPYRIGHT = "منصتي التعليمية. جميع الحقوق محفوظة.";

export function Footer({
  footerTitle = DEFAULT_FOOTER_TITLE,
  footerTagline = DEFAULT_FOOTER_TAGLINE,
  footerCopyright = DEFAULT_FOOTER_COPYRIGHT,
}: {
  footerTitle?: string;
  footerTagline?: string;
  footerCopyright?: string;
}) {
  const year = new Date().getFullYear();
  const copyrightText = footerCopyright?.trim() || DEFAULT_FOOTER_COPYRIGHT;
  return (
    <footer className="footer-black border-t border-neutral-800 bg-black mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-white">
              {footerTitle?.trim() || DEFAULT_FOOTER_TITLE}
            </p>
            <p className="mt-1 text-sm text-neutral-400">
              {footerTagline?.trim() || DEFAULT_FOOTER_TAGLINE}
            </p>
          </div>
          <div className="flex gap-6">
            <Link
              href="/"
              className="text-sm text-neutral-400 transition hover:text-white"
            >
              الرئيسية
            </Link>
            <Link
              href="/courses"
              className="text-sm text-neutral-400 transition hover:text-white"
            >
              الدورات
            </Link>
          </div>
        </div>
        <p className="mt-8 border-t border-neutral-800 pt-8 text-center text-sm text-neutral-500">
          © {year} {copyrightText}
        </p>
      </div>
    </footer>
  );
}
