import { Card } from "./types";

export type ThemeId = "classic" | "mtg" | "fab" | "lorcana";
export type GameId = "mtg" | "fab" | "lorcana";
// "classic" overlays prices on the card art; "editorial" shows each card
// whole with its prices in a caption underneath.
export type BoardLayout = "classic" | "editorial";

export interface Theme {
  id: ThemeId;
  label: string;
  game: GameId;
  layout: BoardLayout;
  defaultTitle: string;
  defaultSubtitle: string;
  // Google Fonts families (css2 "family=" values) the theme's type needs.
  fontFamilies: string[];
  // Overrides of the renderer's CSS variables (see html-renderer :root).
  vars: Record<string, string>;
}

const JP_GOTHIC = '"fot-udkakugoc80-pro", "BIZ UDPGothic", "Yu Gothic", "Meiryo", sans-serif';

// Each official theme follows its game's official site, sampled 2026-11:
// - MTG (magic.wizards.com): black / slate #182024, brand red #ea3601 and
//   orange #ff6000, condensed heavy uppercase headings (Gotham Narrow 800).
// - FaB (fabtcg.com): ember black #120600, gold #DAB45F, dark gold #423115,
//   blood #91160D, parchment text #F9E6C5, heavy uppercase serif (Tiller 900).
// - Lorcana (disneylorcana.com / takaratomy.co.jp): midnight #05063A /
//   #080C3C, amber #D89E47, gold gradient #A58849→#B59957, parchment
//   #E2D0B1, brown ink #43280B, Barlow Condensed and M PLUS Rounded 1c.
// The official typefaces are licensed, so the closest open fonts stand in.
export const THEMES: Record<ThemeId, Theme> = {
  classic: {
    id: "classic",
    label: "クラシック（従来の配色）",
    game: "mtg",
    layout: "classic",
    defaultTitle: "MTG 買取表",
    defaultSubtitle: "モダン・レガシー",
    fontFamilies: [],
    vars: {},
  },
  mtg: {
    id: "mtg",
    label: "MTG（公式トンマナ）",
    game: "mtg",
    layout: "editorial",
    defaultTitle: "MTG 買取表",
    defaultSubtitle: "モダン・レガシー",
    fontFamilies: ["Barlow+Semi+Condensed:wght@700;800"],
    vars: {
      "--accent": "#ea3601",
      "--accent-2": "#ff6000",
      "--muted": "#c2c2c2",
      "--panel-bg": "#0c0f11",
      "--panel-image":
        "linear-gradient(180deg, #182024 0%, #10161a 55%, #0c0f11 100%)",
      "--panel-size": "100% 100%",
      "--hdr-bg": "#000000",
      "--hdr-border": "3px solid #ea3601",
      "--hdr-shadow": "0 14px 28px rgba(0, 0, 0, 0.45)",
      "--title-ink": "#ffffff",
      "--title-font": `"Barlow Semi Condensed", ${JP_GOTHIC}`,
      "--title-weight": "800",
      "--title-transform": "uppercase",
      "--title-tracking": "-0.01em",
      "--kicker-font": `"Barlow Semi Condensed", ${JP_GOTHIC}`,
      "--cta-bg": "linear-gradient(180deg, #ff4a14 0%, #ea3601 100%)",
      "--cta-border": "#ff6000",
      "--cta-main": "#ffffff",
      "--cta-sub": "rgba(255, 255, 255, 0.92)",
      "--cta-shadow": "0 10px 24px rgba(234, 54, 1, 0.35)",
      "--row-line": "#ea3601",
      "--frame-bg": "linear-gradient(180deg, #4a545a 0%, #262e33 50%, #11171a 100%)",
      "--frame-p9-bg": "linear-gradient(180deg, #ff7a3d 0%, #ea3601 50%, #7a1c00 100%)",
      "--frame-shadow": "0 10px 24px rgba(0, 0, 0, 0.5)",
      "--frame-inner-border": "rgba(0, 0, 0, 0.8)",
      "--frame-inner-bg": "#182024",
      "--chip-bg": "#ffffff",
      "--chip-ink": "#000000",
      "--chip-border": "rgba(0, 0, 0, 0.35)",
      "--set-bg": "rgba(255, 255, 255, 0.94)",
      "--set-ink": "#182024",
      "--set-border": "rgba(0, 0, 0, 0.3)",
      "--footer-ink": "#c2c2c2",
      "--placeholder-bg": "#182024",
      "--placeholder-ink": "#ffffff",
      "--placeholder-border": "rgba(255, 255, 255, 0.3)",
    },
  },
  fab: {
    id: "fab",
    label: "FaB（公式トンマナ）",
    game: "fab",
    layout: "editorial",
    defaultTitle: "FaB 買取表",
    defaultSubtitle: "Flesh and Blood",
    fontFamilies: ["Cinzel:wght@700;900", "Shippori+Mincho+B1:wght@700;800"],
    vars: {
      "--accent": "#DAB45F",
      "--accent-2": "#91160D",
      "--muted": "#DAB45F",
      "--panel-bg": "#120600",
      "--panel-image":
        "radial-gradient(ellipse at 50% 0%, rgba(218, 180, 95, 0.16) 0%, transparent 55%), linear-gradient(180deg, #1e120d 0%, #120600 100%)",
      "--panel-size": "100% 100%",
      "--hdr-bg": "linear-gradient(180deg, #141414 0%, rgba(20, 20, 20, 0.85) 100%)",
      "--hdr-border": "2px solid #DAB45F",
      "--hdr-shadow": "0 14px 30px rgba(0, 0, 0, 0.55)",
      "--title-ink": "#F9E6C5",
      "--title-font": '"Cinzel", "Shippori Mincho B1", "Yu Mincho", serif',
      "--title-weight": "900",
      "--title-transform": "uppercase",
      "--title-tracking": "0.01em",
      "--kicker-font": '"Cinzel", "Shippori Mincho B1", "Yu Mincho", serif',
      "--cta-bg": "linear-gradient(180deg, #91160D 0%, #4f0b05 100%)",
      "--cta-border": "#DAB45F",
      "--cta-main": "#F9E6C5",
      "--cta-sub": "rgba(249, 230, 197, 0.88)",
      "--cta-shadow": "0 10px 26px rgba(145, 22, 13, 0.4)",
      "--row-line": "#DAB45F",
      "--frame-bg": "linear-gradient(180deg, #f3d891 0%, #DAB45F 40%, #423115 100%)",
      "--frame-p9-bg": "linear-gradient(180deg, #f3d891 0%, #DAB45F 40%, #91160D 100%)",
      "--frame-shadow": "0 12px 26px rgba(0, 0, 0, 0.6)",
      "--frame-inner-border": "rgba(66, 49, 21, 0.9)",
      "--frame-inner-bg": "#1e120d",
      "--chip-bg": "linear-gradient(180deg, #F9E6C5 0%, #DAB45F 100%)",
      "--chip-ink": "#120600",
      "--chip-border": "rgba(66, 49, 21, 0.8)",
      "--set-bg": "rgba(18, 6, 0, 0.88)",
      "--set-ink": "#DAB45F",
      "--set-border": "rgba(218, 180, 95, 0.7)",
      "--footer-ink": "rgba(249, 230, 197, 0.78)",
      "--placeholder-bg": "#1e120d",
      "--placeholder-ink": "#DAB45F",
      "--placeholder-border": "rgba(218, 180, 95, 0.6)",
    },
  },
  lorcana: {
    id: "lorcana",
    label: "ロルカナ（公式トンマナ）",
    game: "lorcana",
    layout: "editorial",
    defaultTitle: "ロルカナ 買取表",
    defaultSubtitle: "Disney Lorcana",
    fontFamilies: ["Barlow+Condensed:wght@600;700", "M+PLUS+Rounded+1c:wght@800"],
    vars: {
      "--accent": "#D89E47",
      "--accent-2": "#E2D0B1",
      "--muted": "#E2D0B1",
      "--panel-bg": "#05063A",
      "--panel-image":
        "radial-gradient(ellipse at 50% -10%, rgba(22, 61, 111, 0.85) 0%, transparent 60%), linear-gradient(180deg, #080C3C 0%, #05063A 100%)",
      "--panel-size": "100% 100%",
      "--hdr-bg": "linear-gradient(180deg, #0b1150 0%, #080C3C 100%)",
      "--hdr-border": "3px solid #D89E47",
      "--hdr-shadow": "0 14px 30px rgba(0, 0, 20, 0.5)",
      "--title-ink": "#ffffff",
      "--title-font": '"Barlow Condensed", "M PLUS Rounded 1c", sans-serif',
      "--title-weight": "700",
      "--title-transform": "uppercase",
      "--title-tracking": "0.01em",
      "--kicker-font": '"Barlow Condensed", "M PLUS Rounded 1c", sans-serif',
      "--cta-bg": "linear-gradient(180deg, #e2b765 0%, #D89E47 45%, #A58849 100%)",
      "--cta-border": "#E2D0B1",
      "--cta-main": "#43280B",
      "--cta-sub": "rgba(67, 40, 11, 0.86)",
      "--cta-shadow": "0 10px 26px rgba(216, 158, 71, 0.35)",
      "--row-line": "#D89E47",
      "--frame-bg": "linear-gradient(180deg, #f0d08a 0%, #D89E47 45%, #6b4f22 100%)",
      "--frame-p9-bg": "linear-gradient(180deg, #fff1c9 0%, #D89E47 45%, #A58849 100%)",
      "--frame-shadow": "0 12px 26px rgba(0, 0, 20, 0.55)",
      "--frame-inner-border": "rgba(67, 40, 11, 0.85)",
      "--frame-inner-bg": "#163D6F",
      "--chip-bg": "linear-gradient(180deg, #f3e6cf 0%, #E2D0B1 100%)",
      "--chip-ink": "#43280B",
      "--chip-border": "rgba(67, 40, 11, 0.55)",
      "--set-bg": "linear-gradient(180deg, #f3e6cf 0%, #E2D0B1 100%)",
      "--set-ink": "#43280B",
      "--set-border": "rgba(67, 40, 11, 0.5)",
      "--footer-ink": "#E2D0B1",
      "--placeholder-bg": "#163D6F",
      "--placeholder-ink": "#E2D0B1",
      "--placeholder-border": "rgba(216, 158, 71, 0.6)",
    },
  },
};

export const THEME_ORDER: ThemeId[] = ["mtg", "fab", "lorcana", "classic"];

export function resolveTheme(themeId: ThemeId | undefined): Theme {
  // Boards saved before themes existed keep the look they were made with.
  return THEMES[themeId ?? "classic"] ?? THEMES.classic;
}

export function buildThemeFontLink(theme: Theme): string {
  if (theme.fontFamilies.length === 0) return "";
  const families = theme.fontFamilies.map((family) => `family=${family}`).join("&");
  return `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${families}&display=swap" />`;
}

export function buildThemeVarsCss(theme: Theme): string {
  const entries = Object.entries(theme.vars);
  if (entries.length === 0) return "";
  return `:root {\n${entries.map(([name, value]) => `  ${name}: ${value};`).join("\n")}\n}`;
}

const LORCANA_RARITIES = new Set([
  "enchanted",
  "legendary",
  "super rare",
  "superrare",
  "iconic",
  "epic",
  "エンチャンテッド",
  "レジェンダリー",
  "スーパーレア",
  "アイコニック",
  "エピック",
]);

function isFabPriceLabel(label: string | undefined): boolean {
  return ["NF", "RF", "CF"].includes(label?.trim().toUpperCase() ?? "");
}

// Guesses the game from an imported sheet: FaB price columns (NF/RF/CF),
// Lorcana rarities or category names, otherwise MTG.
export function detectGame(sheetName: string, cards: Card[]): GameId {
  if (cards.some((card) => isFabPriceLabel(card.priceJpLabel) || isFabPriceLabel(card.priceEnLabel))) {
    return "fab";
  }
  const lorcanaText = /lorcana|ロルカナ/i;
  if (
    lorcanaText.test(sheetName) ||
    cards.some(
      (card) =>
        lorcanaText.test(card.category) ||
        LORCANA_RARITIES.has(card.rarity.trim().toLowerCase())
    )
  ) {
    return "lorcana";
  }
  if (/fab|flesh/i.test(sheetName)) return "fab";
  return "mtg";
}

// Words the title highlight recognises at the start of a title.
export const TITLE_HIGHLIGHT_PATTERN = /^(MTG|FaB|FAB|Flesh and Blood|ロルカナ|Lorcana)/;
