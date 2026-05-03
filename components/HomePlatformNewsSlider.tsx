"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PlatformNewsItem } from "@/lib/types";

const AUTO_MS = 7000;

export function HomePlatformNewsSlider({ items }: { items: PlatformNewsItem[] }) {
  const slides = useMemo(
    () =>
      items
        .map((s) => ({
          id: s.id,
          src: String(s.imageUrl).trim(),
          text: String(s.description).trim(),
        }))
        .filter((s) => Boolean(s.src) && Boolean(s.text)),
    [items],
  );
  const [active, setActive] = useState(0);
  const canSlide = slides.length > 1;
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const textRef = useRef<HTMLParagraphElement | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setActive(0);
  }, [slides.length]);

  useEffect(() => {
    setExpanded(false);
    setCanExpand(false);
  }, [active]);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    // Measure after paint.
    const raf = window.requestAnimationFrame(() => {
      setCanExpand(el.scrollHeight - el.clientHeight > 1);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [active, slides.length]);

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const scheduleNext = () => {
    clearTimer();
    if (!canSlide || isHovering) return;
    timerRef.current = window.setTimeout(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, AUTO_MS);
  };

  useEffect(() => {
    scheduleNext();
    return () => clearTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSlide, slides.length, isHovering, active]);

  if (slides.length === 0) return null;

  const goPrev = () => {
    setActive((prev) => (prev - 1 + slides.length) % slides.length);
    scheduleNext();
  };
  const goNext = () => {
    setActive((prev) => (prev + 1) % slides.length);
    scheduleNext();
  };

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onFocusCapture={() => setIsHovering(true)}
      onBlurCapture={() => setIsHovering(false)}
    >
      <div className="relative aspect-[16/9] w-full min-h-[200px] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-black/5 shadow-[var(--shadow-card)] sm:min-h-[280px]">
        {slides.map((slide, idx) => (
          <img
            key={slide.id}
            src={slide.src}
            alt=""
            className={`absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-500 ease-out ${
              idx === active ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={idx !== active}
          />
        ))}

        {canSlide ? (
          <>
            <button
              type="button"
              aria-label="الخبر السابق"
              onClick={goPrev}
              className="absolute left-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-black/55 text-2xl font-bold leading-none text-white shadow-[0_12px_28px_rgba(0,0,0,0.55)] backdrop-blur transition hover:bg-black/70 hover:scale-[1.04] active:scale-[0.98]"
            >
              <span aria-hidden className="-translate-x-[1px]">
                ›
              </span>
            </button>
            <button
              type="button"
              aria-label="الخبر التالي"
              onClick={goNext}
              className="absolute right-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-black/55 text-2xl font-bold leading-none text-white shadow-[0_12px_28px_rgba(0,0,0,0.55)] backdrop-blur transition hover:bg-black/70 hover:scale-[1.04] active:scale-[0.98]"
            >
              <span aria-hidden className="translate-x-[1px]">
                ‹
              </span>
            </button>
          </>
        ) : null}

        {canSlide ? (
          <div
            className="absolute bottom-3 left-3 z-30 flex items-center gap-1.5"
            role="tablist"
            aria-label="مؤشرات الأخبار"
          >
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={idx === active}
                aria-label={`الخبر ${idx + 1}`}
                onClick={() => {
                  setActive(idx);
                  scheduleNext();
                }}
                className={`rounded-full transition ${
                  idx === active
                    ? "h-2.5 w-2.5 bg-white"
                    : "h-1.5 w-1.5 bg-white/40 hover:bg-white/65"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="relative z-10 -mt-6 px-3 sm:-mt-8 sm:px-6">
        <div className="min-w-0 max-w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-5 shadow-[var(--shadow-card)] sm:px-6 sm:py-6">
          {slides.map((slide, idx) => {
            const show = idx === active;
            if (!show) return null;
            return (
              <div key={slide.id} className="relative min-w-0 max-w-full">
                <p
                  ref={textRef}
                  className={[
                    "min-w-0 max-w-full whitespace-normal break-words text-pretty [overflow-wrap:anywhere] text-base font-bold leading-relaxed text-[var(--color-foreground)] sm:text-lg text-center",
                    expanded
                      ? ""
                      : [
                          // Show 2 full lines + a faded hint of line 3 (like the reference)
                          "[-webkit-box-orient:vertical] [display:-webkit-box] [-webkit-line-clamp:3] overflow-hidden",
                          "[mask-image:linear-gradient(to_bottom,black_0%,black_68%,transparent_100%)]",
                          "[-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_68%,transparent_100%)]",
                        ].join(" "),
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {slide.text}
                </p>

                {!expanded && canExpand ? (
                  <>
                    <div className="mt-3 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setExpanded(true)}
                        className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-110"
                      >
                        قراءة المزيد
                      </button>
                    </div>
                  </>
                ) : expanded && canExpand ? (
                  <div className="mt-3 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setExpanded(false)}
                      className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-110"
                    >
                      قراءة أقل
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
