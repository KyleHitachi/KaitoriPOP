import { Card } from "./types";

export type ThemeId = "classic" | "mtg" | "fab" | "lorcana";
export type GameId = "mtg" | "fab" | "lorcana";
// Both layouts frame each card and lay its prices over the text box.
// "editorial" lines the price band up across the row and keeps tags off
// the art; "classic" is the original board, kept as it was.
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

// Game themes keep the classic board (light ground, metal frames, centred
// heading) and take their accents, type and band colour from each game's
// official site, sampled 2026-11:
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
    label: "MTG",
    game: "mtg",
    layout: "editorial",
    defaultTitle: "MTG 買取表",
    defaultSubtitle: "モダン・レガシー",
    fontFamilies: ["Barlow+Semi+Condensed:wght@600;700;800"],
    vars: {
      "--accent": "#ea3601",
      "--accent-2": "#182024",
      "--muted": "#6d7275",
      "--panel-bg": "#f2efe9",
      "--panel-image": "linear-gradient(180deg, #f7f5f0 0%, #ebe7df 100%)",
      "--panel-size": "100% 100%",
      "--hdr-bg": "transparent",
      "--hdr-border": "1px solid rgba(24, 32, 36, 0.14)",
      "--hdr-shadow": "none",
      "--title-ink": "#182024",
      "--title-font": `"Barlow Semi Condensed", ${JP_GOTHIC}`,
      "--title-weight": "800",
      "--title-transform": "uppercase",
      "--title-tracking": "-0.01em",
      "--kicker-font": `"Barlow Semi Condensed", ${JP_GOTHIC}`,
      "--cta-main": "#ea3601",
      "--cta-sub": "#4a5256",
      "--row-line": "#ea3601",
      "--frame-bg": "linear-gradient(180deg, #e9c86f 0%, #b9892f 48%, #72501f 100%)",
      "--frame-p9-bg": "linear-gradient(180deg, #ff8a4c 0%, #ea3601 50%, #7a1c00 100%)",
      "--frame-shadow": "0 10px 22px rgba(24, 32, 36, 0.22)",
      "--frame-inner-border": "rgba(60, 40, 12, 0.7)",
      "--frame-inner-bg": "#182024",
      "--band": "#0c0f11",
      "--band-ink": "#ffffff",
      "--footer-ink": "#4a5256",
      "--placeholder-bg": "#ffffff",
      "--placeholder-ink": "#182024",
      "--placeholder-border": "rgba(24, 32, 36, 0.2)",
    },
  },
  fab: {
    id: "fab",
    label: "FaB",
    game: "fab",
    layout: "editorial",
    defaultTitle: "FaB 買取表",
    defaultSubtitle: "Flesh and Blood",
    fontFamilies: ["Cinzel:wght@700;900", "Shippori+Mincho+B1:wght@700;800"],
    vars: {
      "--accent": "#91160D",
      "--accent-2": "#8a6a2c",
      "--muted": "#8a6a2c",
      "--panel-bg": "#f5e9d2",
      "--panel-image": "linear-gradient(180deg, #faf2e2 0%, #eedcbb 100%)",
      "--panel-size": "100% 100%",
      "--hdr-bg": "transparent",
      "--hdr-border": "1px solid rgba(66, 49, 21, 0.22)",
      "--hdr-shadow": "none",
      "--title-ink": "#120600",
      "--title-font": '"Cinzel", "Shippori Mincho B1", "Yu Mincho", serif',
      "--title-weight": "900",
      "--title-transform": "uppercase",
      "--title-tracking": "0.01em",
      "--kicker-font": '"Cinzel", "Shippori Mincho B1", "Yu Mincho", serif',
      // Cinzel figures run wide; keep seven-digit prices clear of the label.
      "--price-size": "24px",
      "--cta-main": "#91160D",
      "--cta-sub": "#5a4320",
      "--row-line": "#DAB45F",
      "--frame-bg": "linear-gradient(180deg, #f3d891 0%, #DAB45F 42%, #6b4f1e 100%)",
      "--frame-p9-bg": "linear-gradient(180deg, #f3d891 0%, #DAB45F 40%, #91160D 100%)",
      "--frame-shadow": "0 10px 22px rgba(66, 40, 10, 0.24)",
      "--frame-inner-border": "rgba(66, 49, 21, 0.85)",
      "--frame-inner-bg": "#1e120d",
      "--band": "#140700",
      "--band-ink": "#F9E6C5",
      "--footer-ink": "#5a4320",
      "--placeholder-bg": "#fff8ea",
      "--placeholder-ink": "#423115",
      "--placeholder-border": "rgba(66, 49, 21, 0.25)",
    },
  },
  lorcana: {
    id: "lorcana",
    label: "ロルカナ",
    game: "lorcana",
    layout: "editorial",
    defaultTitle: "ロルカナ 買取表",
    defaultSubtitle: "Disney Lorcana",
    fontFamilies: ["Barlow+Condensed:wght@600;700", "M+PLUS+Rounded+1c:wght@800"],
    vars: {
      "--accent": "#B97F2C",
      "--accent-2": "#163D6F",
      "--muted": "#6e6047",
      "--panel-bg": "#f3ecdf",
      "--panel-image": "linear-gradient(180deg, #f8f3ea 0%, #e8dcc6 100%)",
      "--panel-size": "100% 100%",
      "--hdr-bg": "transparent",
      "--hdr-border": "1px solid rgba(5, 6, 58, 0.16)",
      "--hdr-shadow": "none",
      "--title-ink": "#05063A",
      "--title-font": '"Barlow Condensed", "M PLUS Rounded 1c", sans-serif',
      "--title-weight": "700",
      "--title-transform": "uppercase",
      "--title-tracking": "0.01em",
      "--kicker-font": '"Barlow Condensed", "M PLUS Rounded 1c", sans-serif',
      "--cta-main": "#05063A",
      "--cta-sub": "#6e6047",
      "--row-line": "#D89E47",
      "--frame-bg": "linear-gradient(180deg, #f0d08a 0%, #D89E47 45%, #6b4f22 100%)",
      "--frame-p9-bg": "linear-gradient(180deg, #fff1c9 0%, #D89E47 45%, #A58849 100%)",
      "--frame-shadow": "0 10px 22px rgba(5, 6, 58, 0.2)",
      "--frame-inner-border": "rgba(67, 40, 11, 0.8)",
      "--frame-inner-bg": "#163D6F",
      "--band": "#05063A",
      "--band-ink": "#ffffff",
      "--footer-ink": "#4d4636",
      "--placeholder-bg": "#fffaf1",
      "--placeholder-ink": "#05063A",
      "--placeholder-border": "rgba(5, 6, 58, 0.2)",
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
