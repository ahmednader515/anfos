"use client";

import { useEffect, useRef, useState } from "react";

export function RevealOnScroll({
  children,
  className = "",
  delayMs = 0,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) obs.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [once]);

  return (
    <div
      ref={ref}
      className={[
        "transition-all duration-700 ease-out will-change-[opacity,transform]",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        delayMs ? `[transition-delay:${delayMs}ms]` : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

