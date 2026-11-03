export type RarityTone = "gold" | "silver" | "bronze" | "white" | "rainbow";

export interface RarityBadgeStyle {
  tone: RarityTone;
  border: string;
  background: string;
  textBackground: string;
  textColor?: string;
  shadow: string;
}

const RARITY_TONES: Record<string, RarityTone> = {
  promo: "gold",
  "プロモ": "gold",
  iconic: "gold",
  "アイコニック": "gold",
  enchanted: "rainbow",
  "エンチャンテッド": "rainbow",
  legendary: "gold",
  "レジェンダリー": "gold",
  "superrare": "silver",
  "super rare": "silver",
  "スーパーレア": "silver",
  rare: "bronze",
  "レア": "bronze",
  uncommon: "silver",
  "アンコモン": "silver",
  common: "white",
  "コモン": "white",
};

const BADGE_STYLES: Record<RarityTone, RarityBadgeStyle> = {
  gold: {
    tone: "gold",
    border: "2px solid rgba(239, 210, 121, 0.62)",
    background:
      "linear-gradient(180deg, rgba(33, 25, 9, 0.86), rgba(83, 55, 10, 0.78))",
    textBackground:
      "linear-gradient(180deg, #fff7cf 0%, #d8a83f 38%, #fff0a8 58%, #a9711b 100%)",
    shadow:
      "0 0 18px rgba(216,168,63,0.3), inset 0 0 12px rgba(216,168,63,0.16)",
  },
  silver: {
    tone: "silver",
    border: "2px solid rgba(230, 235, 240, 0.56)",
    background:
      "linear-gradient(180deg, rgba(19, 23, 28, 0.84), rgba(62, 69, 77, 0.76))",
    textBackground:
      "linear-gradient(180deg, #ffffff 0%, #bfc8d2 40%, #f6f8fb 60%, #8e99a6 100%)",
    shadow:
      "0 0 18px rgba(214,224,233,0.24), inset 0 0 12px rgba(255,255,255,0.1)",
  },
  bronze: {
    tone: "bronze",
    border: "2px solid rgba(205, 138, 82, 0.58)",
    background:
      "linear-gradient(180deg, rgba(36, 20, 10, 0.86), rgba(91, 46, 20, 0.78))",
    textBackground:
      "linear-gradient(180deg, #ffe3c0 0%, #c77a3b 42%, #ffd0a0 60%, #8d4a23 100%)",
    shadow:
      "0 0 18px rgba(199,122,59,0.26), inset 0 0 12px rgba(199,122,59,0.13)",
  },
  white: {
    tone: "white",
    border: "2px solid rgba(255, 255, 255, 0.62)",
    background:
      "linear-gradient(180deg, rgba(28, 28, 28, 0.8), rgba(72, 72, 72, 0.72))",
    textBackground: "none",
    textColor: "#ffffff",
    shadow:
      "0 0 18px rgba(255,255,255,0.2), inset 0 0 12px rgba(255,255,255,0.08)",
  },
  rainbow: {
    tone: "rainbow",
    border: "2px solid rgba(255, 255, 255, 0.58)",
    background:
      "linear-gradient(135deg, rgba(42, 18, 77, 0.86), rgba(20, 82, 99, 0.78), rgba(113, 42, 84, 0.8))",
    textBackground:
      "linear-gradient(90deg, #ff6b9d 0%, #ffd166 25%, #8af0a4 48%, #66d9ff 72%, #c99bff 100%)",
    shadow:
      "0 0 20px rgba(122,205,255,0.3), inset 0 0 14px rgba(255,255,255,0.14)",
  },
};

function normalizeRarity(value: string): string {
  return value.trim().replace(/[\s　_\-]+/g, " ").toLowerCase();
}

export function resolveRarityBadgeStyle(rarity: string): RarityBadgeStyle {
  const normalized = normalizeRarity(rarity);
  const compact = normalized.replace(/\s+/g, "");
  const tone = RARITY_TONES[normalized] ?? RARITY_TONES[compact] ?? "gold";
  return BADGE_STYLES[tone];
}
