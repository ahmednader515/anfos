"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-sm text-[var(--color-primary)] hover:underline"
      aria-label="نسخ الرقم"
    >
      {copied ? "تم النسخ" : "نسخ"}
    </button>
  );
}
