import Link from "next/link";

const DEFAULT_FOOTER_TITLE = "منصتي التعليمية";
const DEFAULT_FOOTER_TAGLINE = "تعلم بأسلوب حديث ومنهجية واضحة";
const DEFAULT_FOOTER_COPYRIGHT = "منصتي التعليمية. جميع الحقوق محفوظة.";

export function Footer({
  footerTitle = DEFAULT_FOOTER_TITLE,
  footerTagline = DEFAULT_FOOTER_TAGLINE,
  footerCopyright = DEFAULT_FOOTER_COPYRIGHT,
  footerContactPhone,
  footerContactEmail,
}: {
  footerTitle?: string;
  footerTagline?: string;
  footerCopyright?: string;
  footerContactPhone?: string | null;
  footerContactEmail?: string | null;
}) {
  const year = new Date().getFullYear();
  const copyrightText = footerCopyright?.trim() || DEFAULT_FOOTER_COPYRIGHT;
  const phone = footerContactPhone?.trim() || "";
  const email = footerContactEmail?.trim() || "";
  const showContact = Boolean(phone || email);
  return (
    <footer className="footer-black border-t border-neutral-800 bg-black mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:grid sm:grid-cols-2 sm:items-start sm:gap-6">
          <div className="sm:col-span-1">
            <p className="text-lg font-semibold text-white">
              {footerTitle?.trim() || DEFAULT_FOOTER_TITLE}
            </p>
            <p className="mt-1 text-sm text-neutral-400">
              {footerTagline?.trim() || DEFAULT_FOOTER_TAGLINE}
            </p>
            {showContact ? (
              <div className="mt-4 flex max-w-md flex-col items-start gap-2 text-sm">
                {phone ? (
                  <a
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                    className="inline-flex w-fit items-center gap-2 rounded-lg border border-neutral-800/70 px-3 py-2 text-neutral-200 transition hover:border-neutral-700 hover:text-white"
                  >
                    <span className="text-neutral-400" aria-hidden>
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.11 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.86.3 1.7.54 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.11a2 2 0 0 1 2.11-.45c.8.24 1.64.42 2.5.54A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </span>
                    {phone}
                  </a>
                ) : null}
                {email ? (
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex w-fit items-center gap-2 rounded-lg border border-neutral-800/70 px-3 py-2 text-neutral-200 transition hover:border-neutral-700 hover:text-white"
                  >
                    <span className="text-neutral-400" aria-hidden>
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                        <path d="m22 7-10 7L2 7" />
                      </svg>
                    </span>
                    {email}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="sm:col-span-1 sm:flex sm:justify-end">
            <div className="flex flex-wrap gap-x-6 gap-y-2 sm:flex-col sm:items-start sm:gap-3 sm:pt-1">
              <Link href="/" className="text-sm text-neutral-400 transition hover:text-white">
                الرئيسية
              </Link>
              <Link href="/courses" className="text-sm text-neutral-400 transition hover:text-white">
                الدورات
              </Link>
            </div>
          </div>
        </div>
        <p className="mt-8 border-t border-neutral-800 pt-8 text-center text-sm text-neutral-500">
          © {year} {copyrightText}
        </p>
      </div>
    </footer>
  );
}
