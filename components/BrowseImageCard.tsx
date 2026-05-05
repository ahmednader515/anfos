"use client";

import Link from "next/link";

export function BrowseImageCard({
  href,
  title,
  imageUrl,
  subtitle,
}: {
  href: string;
  title: string;
  imageUrl?: string | null;
  subtitle?: string | null;
}) {
  return (
    <Link
      href={href}
      className="group relative block min-w-0 max-w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]"
    >
      <div className="aspect-[3/4] w-full bg-black/5 lg:aspect-[16/10]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-primary-light)]/30">
            <span className="text-4xl opacity-65" aria-hidden>
              📚
            </span>
          </div>
        )}
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/80 via-black/35 to-transparent"
        aria-hidden
      />

      <div className="absolute inset-x-0 bottom-0 z-10 p-3 sm:p-3.5">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-extrabold text-white drop-shadow sm:text-lg">{title}</p>
            {subtitle?.trim() ? (
              <p className="mt-0.5 truncate text-xs text-white/90 sm:text-sm">{subtitle}</p>
            ) : null}
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/25 bg-black/15 text-2xl font-extrabold leading-none text-white drop-shadow transition group-hover:bg-black/30">
            ›
          </span>
        </div>
      </div>
    </Link>
  );
}

