import type { PlatformDetailsItem, PlatformDetailsPresetIcon } from "./types";

export const PLATFORM_DETAILS_PRESET_ICON_OPTIONS: Array<{
  id: PlatformDetailsPresetIcon;
  label: string;
}> = [
  { id: "chat", label: "تواصل" },
  { id: "bulb", label: "إبداع" },
  { id: "pencil", label: "كتابة" },
  { id: "book", label: "تعليم" },
  { id: "users", label: "فريق" },
  { id: "rocket", label: "انطلاقة" },
  { id: "target", label: "أهداف" },
  { id: "certificate", label: "شهادة" },
];

export const DEFAULT_PLATFORM_DETAILS_ITEMS: PlatformDetailsItem[] = [
  {
    id: "platform-detail-1",
    title: "فصول افتراضية فورية",
    description: "تصميم الفصول والمعلومات خلال الفصول الافتراضية.",
    iconType: "preset",
    presetIcon: "book",
    customIconUrl: null,
  },
  {
    id: "platform-detail-2",
    title: "محتوى جذاب في دقائق",
    description: "تصميم وإنشاء المحتوى التعليمي بشكل سريع ومميز.",
    iconType: "preset",
    presetIcon: "pencil",
    customIconUrl: null,
  },
  {
    id: "platform-detail-3",
    title: "أنشطة وفعاليات رائعة",
    description: "تجذب الطلاب وتنشئ تفاعلهم بعد أو داخل الصف الدراسي.",
    iconType: "preset",
    presetIcon: "bulb",
    customIconUrl: null,
  },
  {
    id: "platform-detail-4",
    title: "تواصل فعال",
    description: "أدوات للتواصل والتعاون الفعال بين كل أطراف العملية التعليمية.",
    iconType: "preset",
    presetIcon: "chat",
    customIconUrl: null,
  },
];

export function parsePlatformDetailsItems(raw: string | null | undefined): PlatformDetailsItem[] {
  if (!raw || !String(raw).trim()) return [...DEFAULT_PLATFORM_DETAILS_ITEMS];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_PLATFORM_DETAILS_ITEMS];
    const clean = parsed
      .filter((x): x is Record<string, unknown> => x && typeof x === "object")
      .map((item, idx) => {
        const preset = PLATFORM_DETAILS_PRESET_ICON_OPTIONS.some((o) => o.id === item.presetIcon)
          ? (item.presetIcon as PlatformDetailsPresetIcon)
          : "chat";
        const title = String(item.title ?? "").trim();
        const description = String(item.description ?? "").trim();
        if (!title || !description) return null;
        const customIcon = String(item.customIconUrl ?? "").trim();
        return {
          id: String(item.id ?? `platform-detail-${idx + 1}`).trim() || `platform-detail-${idx + 1}`,
          title: title.slice(0, 120),
          description: description.slice(0, 400),
          iconType: item.iconType === "upload" ? "upload" : "preset",
          presetIcon: preset,
          customIconUrl: customIcon ? customIcon.slice(0, 4000) : null,
        } satisfies PlatformDetailsItem;
      })
      .filter((x): x is PlatformDetailsItem => !!x)
      .slice(0, 4);
    return clean.length > 0 ? clean : [...DEFAULT_PLATFORM_DETAILS_ITEMS];
  } catch {
    return [...DEFAULT_PLATFORM_DETAILS_ITEMS];
  }
}
