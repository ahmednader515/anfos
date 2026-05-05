import type { HomepageBelowFoldSectionKey } from "@/lib/types";

export const HOMEPAGE_BELOW_FOLD_SECTION_ORDER_DEFAULT: HomepageBelowFoldSectionKey[] = [
  "platformDetails",
  "teachers",
  "subscriptions",
  "categories",
  "store",
  "reviews",
  "news",
  "cta",
];

const SECTION_KEY_SET = new Set<HomepageBelowFoldSectionKey>(
  HOMEPAGE_BELOW_FOLD_SECTION_ORDER_DEFAULT,
);

function isHomepageSectionKey(value: unknown): value is HomepageBelowFoldSectionKey {
  return typeof value === "string" && SECTION_KEY_SET.has(value as HomepageBelowFoldSectionKey);
}

export function normalizeHomepageBelowFoldSectionsOrder(input: unknown): HomepageBelowFoldSectionKey[] {
  const parsed: unknown = (() => {
    if (Array.isArray(input)) return input;
    if (typeof input === "string" && input.trim()) {
      try {
        return JSON.parse(input);
      } catch {
        return [];
      }
    }
    return [];
  })();

  const out: HomepageBelowFoldSectionKey[] = [];
  const seen = new Set<HomepageBelowFoldSectionKey>();
  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      if (!isHomepageSectionKey(item)) continue;
      if (seen.has(item)) continue;
      seen.add(item);
      out.push(item);
    }
  }
  for (const key of HOMEPAGE_BELOW_FOLD_SECTION_ORDER_DEFAULT) {
    if (!seen.has(key)) out.push(key);
  }
  return out;
}

export function serializeHomepageBelowFoldSectionsOrder(input: unknown): string {
  return JSON.stringify(normalizeHomepageBelowFoldSectionsOrder(input));
}

