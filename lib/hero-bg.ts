/**
 * خلفية هيرو الصفحة الرئيسية — تدرجات جاهزة + ألوان مخصّصة (hex).
 */

export const HERO_BG_PRESET_GRADIENTS: Record<string, { from: string; to: string }> = {
  navy: { from: "#14162E", to: "#1E2145" },
  indigo: { from: "#1e1b4b", to: "#312e81" },
  purple: { from: "#2e1065", to: "#4c1d95" },
  teal: { from: "#134e4a", to: "#0f766e" },
  forest: { from: "#14532d", to: "#166534" },
  slate: { from: "#0f172a", to: "#1e293b" },
  crimson: { from: "#450a0a", to: "#7f1d1d" },
  rose: { from: "#4c0519", to: "#9f1239" },
  sunset: { from: "#431407", to: "#c2410c" },
  sky: { from: "#0c4a6e", to: "#0369a1" },
  cyan: { from: "#083344", to: "#0e7490" },
  stone: { from: "#1c1917", to: "#44403c" },
  midnight: { from: "#020617", to: "#1e293b" },
  wine: { from: "#2e0b1f", to: "#581c3f" },
};

const HEX6 = /^#[0-9A-Fa-f]{6}$/;

/** يقبل #RRGGBB أو #RGB */
export function normalizeHeroHex(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  if (HEX6.test(s)) return s.toLowerCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(s)) {
    const r = s[1];
    const g = s[2];
    const b = s[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

export function resolveHeroBgGradient(settings: {
  heroBgPreset?: string | null;
  heroBgCustomFrom?: string | null;
  heroBgCustomTo?: string | null;
}): { from: string; to: string } {
  const nf = normalizeHeroHex(String(settings.heroBgCustomFrom ?? ""));
  const nt = normalizeHeroHex(String(settings.heroBgCustomTo ?? ""));
  if (nf && nt) return { from: nf, to: nt };
  const key = settings.heroBgPreset?.trim() ?? "";
  if (key && HERO_BG_PRESET_GRADIENTS[key]) return HERO_BG_PRESET_GRADIENTS[key];
  return HERO_BG_PRESET_GRADIENTS.navy;
}
