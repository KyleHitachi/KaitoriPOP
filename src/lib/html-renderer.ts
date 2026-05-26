import {
  Card,
  SheetConfig,
  GRID_COLS,
  GRID_ROWS,
  DEFAULT_TITLE_SUBTITLE,
  HIGH_END_SHEET_NAMES,
} from "./types";
import { buildCardPlaceholderDataUrl, resolveCardImageSrc } from "./card-image";
import { resolveFoilBadgeStyle, resolveSpecialFoilBadge } from "./foil-badge";
import { resolveRarityBadgeStyle } from "./rarity-badge";
import {
  BODY_FONT_STACK,
  CARD_CONTENT_TOP,
  CARD_CONTENT_TOP_WITH_NAMES,
  CARD_NAME_BLOCK_MARGIN,
  CARD_OVERLAY_HEIGHT_NO_NAMES,
  CARD_OVERLAY_HEIGHT_WITH_NAMES,
  CONDITION_CHIP_FONT_SIZE,
  CONDITION_CHIP_PAD_X,
  CONDITION_CHIP_PAD_Y,
  CONDITION_CHIP_RADIUS,
  CONDITION_CHIP_SHADOW,
  CTA_BORDER_WIDTH,
  CTA_MIN_WIDTH,
  CTA_RADIUS,
  GRID_GAP,
  GRID_SIDE_PADDING,
  KICKER_FONT_STACK,
  PREVIEW_CANVAS_WIDTH,
  PRICE_DUAL_SIZE,
  PRICE_FONT_STACK,
  PRICE_LANG_SIZE,
  PRICE_OVERRIDE_SIZE,
  PRICE_SINGLE_SIZE,
  PRICE_YEN_SCALE,
  ROW_LABEL_GAP,
  SET_BADGE_FONT_SIZE,
  SET_BADGE_PAD_X,
  SET_BADGE_PAD_Y,
  SET_BADGE_RADIUS,
  TITLE_BAR_HEIGHT,
  TITLE_BAR_WIDTH,
  TITLE_FONT_SIZE,
  TITLE_FONT_STACK,
  TITLE_KICKER_SIZE,
  TITLE_RULE_HEIGHT,
  TITLE_RULE_WIDTH,
  TITLE_SHELL_WIDTH,
  TITLE_SUBTITLE_SIZE,
  TITLE_TRACKING,
  UPDATED_AT_FONT_SIZE,
  UPDATED_AT_PAD_X,
  UPDATED_AT_PAD_Y,
  UPDATED_AT_RADIUS,
} from "./layout-tokens";
import { getSortedCards } from "./sort-engine";

const YEN_HTML = "&#20870;";

function formatPrice(price: number): string {
  return price.toLocaleString("ja-JP");
}

function isFabCard(card: Card): boolean {
  return [card.priceJpLabel, card.priceEnLabel].some((label) =>
    ["NF", "RF", "CF"].includes(label?.trim().toUpperCase() ?? "")
  );
}

function isFabPriceLabel(label: string | undefined): label is string {
  return ["NF", "RF", "CF"].includes(label?.trim().toUpperCase() ?? "");
}

function buildSinglePriceLabel(card: Card): string | null {
  if (!isFabCard(card)) return null;
  if (isFabPriceLabel(card.foilLabel)) return card.foilLabel;
  if (card.priceJp !== null && card.priceEn === null && isFabPriceLabel(card.priceJpLabel)) {
    return card.priceJpLabel;
  }
  if (card.priceEn !== null && card.priceJp === null && isFabPriceLabel(card.priceEnLabel)) {
    return card.priceEnLabel;
  }
  if (isFabPriceLabel(card.priceJpLabel)) return card.priceJpLabel;
  if (isFabPriceLabel(card.priceEnLabel)) return card.priceEnLabel;
  return null;
}

function buildSetLabel(card: Card): string {
  if (card.setLabelOverride) return card.setLabelOverride;
  const primaryLang = card.lang.includes("/") ? card.lang.split("/")[0] : card.lang;
  if (isFabCard(card)) return `${primaryLang || "EN"} / ${card.set}`;
  if (card.lang === "JP/EN" || card.lang === "JP") return card.set;
  if (card.lang.includes("/")) {
    return `${card.lang.split("/")[0]} / ${card.set}`;
  }
  return `EN / ${card.set}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildTitleHtml(title: string): string {
  if (!title.startsWith("MTG")) return escapeHtml(title);

  return `<span class="title-highlight">MTG</span>${escapeHtml(title.slice(3))}`;
}

function buildTitleSubtitleHtml(subtitle: string): string {
  return subtitle
    .split(/([・/／])/)
    .map((part, index) => {
      const className = /[・/／]/.test(part)
        ? "subtitle-separator"
        : index % 4 === 0
          ? "subtitle-red"
          : "subtitle-gold";
      return `<span class="${className}">${escapeHtml(part)}</span>`;
    })
    .join("");
}

function buildPriceLabelHtml(label: string): string {
  const normalized = label.trim().toUpperCase();
  const className =
    normalized === "RF" || normalized === "CF"
      ? `price-lang price-label-${normalized.toLowerCase()}`
      : "price-lang";
  return `<span class="${className}">${escapeHtml(label)}</span>`;
}

function buildPriceHtml(card: Card): string {
  if (card.priceOverride) {
    const priceLabel = buildSinglePriceLabel(card);

    return `<div class="price-block price-block-override">
      <div class="price-line-single">
        ${priceLabel ? buildPriceLabelHtml(priceLabel) : ""}
        <span class="price price-override-value">${escapeHtml(card.priceOverride)}</span>
      </div>
    </div>`;
  }

  if (card.priceJp !== null && card.priceEn !== null) {
    const priceJpLabel = card.priceJpLabel ?? "JP";
    const priceEnLabel = card.priceEnLabel ?? "EN";

    return `<div class="price-block price-block-dual">
      <div class="price-dual-line">
        ${buildPriceLabelHtml(priceJpLabel)}
        <span class="price-amount">${formatPrice(card.priceJp)}<span class="yen">${YEN_HTML}</span></span>
      </div>
      <div class="price-dual-line">
        ${buildPriceLabelHtml(priceEnLabel)}
        <span class="price-amount">${formatPrice(card.priceEn)}<span class="yen">${YEN_HTML}</span></span>
      </div>
    </div>`;
  }

  const price = card.priceJp ?? card.priceEn;
  if (price !== null) {
    const priceLabel = buildSinglePriceLabel(card);

    return `<div class="price-block">
      <div class="price-line-single">
        ${priceLabel ? buildPriceLabelHtml(priceLabel) : ""}
        <span class="price">${formatPrice(price)}<span class="yen">${YEN_HTML}</span></span>
      </div>
    </div>`;
  }

  return `<div class="price-block"><div class="price">-</div></div>`;
}

function buildCardHtml(
  card: Card,
  options: {
    isP9Row: boolean;
    isLotus: boolean;
    showCardNames: boolean;
    showExpansionName: boolean;
    showRarityBadge: boolean;
    showCondition: boolean;
  }
): string {
  const foil = card.foilOverride ?? card.foil;
  const foilBadge = foil
    ? resolveSpecialFoilBadge([card.foilLabel ?? ""]) ?? {
        label: card.foilLabel ?? "FOIL",
        tone: "gold" as const,
      }
    : null;
  const foilBadgeLines = foilBadge?.displayLines ?? (foilBadge ? [foilBadge.label] : []);
  const foilStyle = resolveFoilBadgeStyle(foilBadge?.tone);
  const foilBadgeTextHtml =
    foilBadgeLines.length > 1
      ? foilBadgeLines
          .map(
            (line, index) =>
              `<span class="foil-badge-line${index === 1 ? " foil-badge-line-sub" : ""}" style="color:${foilStyle.textColor};">${escapeHtml(line)}</span>`
          )
          .join("")
      : `<span class="foil-badge-standard" style="color:${foilStyle.textColor};">${escapeHtml(foilBadge?.label ?? "")}</span>`;
  const rarity = (card.rarityOverride ?? card.rarity).trim();
  const rarityStyle = rarity ? resolveRarityBadgeStyle(rarity) : null;
  const imgSrc = resolveCardImageSrc(card);
  const fallbackSrc = buildCardPlaceholderDataUrl(card);
  const cellClasses = ["cell", options.isLotus ? "cell-lotus" : ""]
    .filter(Boolean)
    .join(" ");
  const frameClasses = ["frame", options.isP9Row ? "frame-p9" : ""]
    .filter(Boolean)
    .join(" ");
  const titleEn = escapeHtml(card.nameEn);
  const titleJp = escapeHtml(card.nameJp);
  const imageAlt = escapeHtml(card.nameEn || card.nameJp || "Card image");
  const nameBlockHtml =
    options.showCardNames && (card.nameEn || card.nameJp)
      ? `<div class="name-block">
                  ${card.nameEn ? `<div class="name-en">${titleEn}</div>` : ""}
                  ${card.nameJp ? `<div class="name-jp">${titleJp}</div>` : ""}
                </div>`
      : "";

  return `
    <div class="${cellClasses}">
      <div class="${frameClasses}">
        <div class="frame-inner">
          <img src="${escapeHtml(imgSrc)}" alt="${imageAlt}" loading="lazy" onerror="this.onerror=null;this.src='${escapeHtml(fallbackSrc)}';" />
          <div class="frame-top-glow"></div>
          ${options.showCondition ? `<div class="condition-chip">${escapeHtml(card.condition)}</div>` : ""}
          ${
            foil || (options.showRarityBadge && rarity && rarityStyle)
              ? `<div class="badge-stack">
                ${
                  foilBadge
                    ? `<div class="foil-badge" style="background:${foilStyle.background};border:${foilStyle.border};box-shadow:${foilStyle.shadow};">${foilBadgeLines.length > 1 ? `<div class="foil-badge-special">${foilBadgeTextHtml}</div>` : foilBadgeTextHtml}</div>`
                    : ""
                }
                ${
                  options.showRarityBadge && rarity && rarityStyle
                    ? `<div class="rarity-badge" style="background:${rarityStyle.background};border:${rarityStyle.border};box-shadow:${rarityStyle.shadow};"><span style="background:${rarityStyle.textBackground};color:${rarityStyle.textColor ?? "inherit"};${rarityStyle.textBackground === "none" ? "" : "-webkit-background-clip:text;-webkit-text-fill-color:transparent;"}">${escapeHtml(rarity)}</span></div>`
                    : ""
                }
              </div>`
              : ""
          }
          <div class="bot">
            <div class="bot-inner">
              ${options.showExpansionName ? `<div class="set">${escapeHtml(buildSetLabel(card))}</div>` : ""}
              <div class="content ${options.showCardNames ? "content-with-names" : ""}">
                ${nameBlockHtml}
                ${buildPriceHtml(card)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function buildRowLabelHtml(label: { text: string; visible: boolean }): string {
  if (!label.visible) return "";
  return `<div class="row-label">
    <span class="row-label-text">${escapeHtml(label.text)}</span>
    <span class="row-label-line"></span>
  </div>`;
}

function buildFooterHtml(footerText: string): string {
  return escapeHtml(footerText).replace(/\*/g, '<span class="footer-note">*</span>');
}

const PANEL_PATTERN =
  "linear-gradient(135deg, rgba(121,96,53,0.05) 0 1px, transparent 1px 52px), linear-gradient(90deg, rgba(255,255,255,0.45), transparent 42%, rgba(153,118,54,0.08)), linear-gradient(180deg, #f4efe4 0%, #e7dfce 100%)";

export function renderBuylistHtml(config: SheetConfig): string {
  const sortedCards = getSortedCards(config);
  const rows: string[] = [];
  const showCardNames = config.showCardNames ?? false;
  const showExpansionName = config.showExpansionName ?? true;
  const showRarityBadge = config.showRarityBadge ?? false;
  const showCondition = config.showCondition ?? true;
  const logoGgHeight = config.logoGgHeight ?? 96;
  const logoMtgHeight = config.logoMtgHeight ?? 64;
  const titleSubtitle =
    config.showTitleSubtitle ?? true
      ? config.titleSubtitle ?? DEFAULT_TITLE_SUBTITLE
      : "";

  for (let row = 0; row < GRID_ROWS; row++) {
    const rowLabel = config.rowLabels.find((label) => label.row === row);
    if (rowLabel) {
      rows.push(buildRowLabelHtml(rowLabel));
    }

    const isP9Row = HIGH_END_SHEET_NAMES.includes(config.sheetName) && row === 0;
    const cells: string[] = [];

    for (let col = 0; col < GRID_COLS; col++) {
      const index = row * GRID_COLS + col;
      if (index < sortedCards.length) {
        cells.push(
          buildCardHtml(sortedCards[index], {
            isP9Row,
            isLotus: isP9Row && col === 0,
            showCardNames,
            showExpansionName,
            showRarityBadge,
            showCondition,
          })
        );
      } else {
        cells.push('<div class="cell cell-empty"></div>');
      }
    }

    rows.push(`<div class="row ${isP9Row ? "row-p9" : ""}">${cells.join("")}</div>`);
  }

  const logoGgHtml = config.logoGg
    ? `<img src="${escapeHtml(config.logoGg)}" alt="Logo" class="logo-gg" />`
    : '<div class="logo-gg logo-placeholder">ロゴ</div>';
  const logoMtgHtml = config.logoMtg
    ? `<img src="${escapeHtml(config.logoMtg)}" alt="Title Logo" class="logo-mtg" />`
    : '<div class="logo-mtg logo-placeholder">タイトル</div>';
  const footerHtml = buildFooterHtml(config.footerText);
  const titleSubtitleHtml = titleSubtitle
    ? `<div class="title-subtitle">${buildTitleSubtitleHtml(titleSubtitle)}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=1920" />
<script>
  (function(d){var config={kitId:'fok1xnt',scriptTimeout:8000,async:true,active:function(){window.__typekitStatus='active';},inactive:function(){window.__typekitStatus='inactive';}},h=d.documentElement,t=setTimeout(function(){h.className=h.className.replace(/\\bwf-loading\\b/g,"")+" wf-inactive";window.__typekitStatus='timeout';},config.scriptTimeout),tk=d.createElement("script"),f=false,s=d.getElementsByTagName("script")[0],a;window.__typekitStatus='loading';h.className+=" wf-loading";tk.src="https://use.typekit.net/"+config.kitId+".js";tk.async=true;tk.onerror=function(){window.__typekitStatus='script-error';};tk.onload=tk.onreadystatechange=function(){a=this.readyState;if(f||a&&a!="complete"&&a!="loaded")return;f=true;clearTimeout(t);try{Typekit.load(config)}catch(e){window.__typekitStatus='load-error';}};s.parentNode.insertBefore(tk,s)})(document);
</script>
<style>
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
:root {
  --red-title: #b82020;
  --gold-light: #e9c86f;
  --gold-mid: #c5a64a;
  --gold-dark: #6e5528;
  --gold-border: rgba(88, 62, 22, 0.72);
  --black-deep: #1a1714;
  --bg-warm: #f1eadc;
  --white: #ffffff;
  --white-90: rgba(255, 255, 255, 0.92);
  --text-footer: #3f3931;
}
body {
  font-family: ${BODY_FONT_STACK};
  font-feature-settings: "tnum" 1;
  -webkit-font-smoothing: antialiased;
}
.panel {
  position: relative;
  width: ${PREVIEW_CANVAS_WIDTH}px;
  background: var(--bg-warm);
  background-image: ${PANEL_PATTERN};
  background-size: 52px 52px, 100% 100%, 100% 100%;
  overflow: hidden;
}
.hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 12px 36px 10px;
  border-bottom: 1px solid rgba(197, 166, 74, 0.7);
  background: linear-gradient(90deg, rgba(255, 250, 240, 0.96), rgba(243, 234, 216, 0.96), rgba(255, 250, 240, 0.96));
  box-shadow: 0 12px 26px rgba(83, 58, 20, 0.12);
}
.hdr-logos {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}
.logo-gg { height: ${logoGgHeight}px; }
.logo-mtg { height: ${logoMtgHeight}px; }
.logo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(185, 149, 59, 0.55);
  background: #fff8e6;
  color: #4b3211;
  border-radius: 8px;
  font-weight: 900;
  font-size: 22px;
}
.logo-gg.logo-placeholder {
  width: ${logoGgHeight}px;
  height: ${logoGgHeight}px;
  font-size: ${Math.max(18, Math.round(logoGgHeight * 0.27))}px;
}
.logo-mtg.logo-placeholder {
  width: ${Math.round(logoMtgHeight * 2.25)}px;
  height: ${logoMtgHeight}px;
  font-size: ${Math.max(16, Math.round(logoMtgHeight * 0.34))}px;
}
.title {
  flex: 1;
  display: flex;
  justify-content: center;
}
.title-shell {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  width: min(100%, ${TITLE_SHELL_WIDTH}px);
}
.title-bar {
  width: ${TITLE_BAR_WIDTH}px;
  height: ${TITLE_BAR_HEIGHT}px;
  margin-top: 6px;
  border-radius: 999px;
  background: var(--red-title);
}
.title-copy {
  min-width: 0;
  text-align: left;
}
.title-kicker {
  margin-bottom: 6px;
  color: #8a6b2f;
  font-family: ${KICKER_FONT_STACK};
  font-size: ${TITLE_KICKER_SIZE}px;
  font-weight: 600;
  letter-spacing: 0.34em;
  text-transform: uppercase;
}
.title-line {
  display: flex;
  align-items: flex-end;
  gap: 20px;
}
.title-text {
  white-space: nowrap;
  font-family: ${TITLE_FONT_STACK};
  font-weight: 700;
  font-size: ${TITLE_FONT_SIZE}px;
  line-height: 1;
  letter-spacing: ${TITLE_TRACKING};
  color: #22201d;
}
.title-highlight,
.subtitle-red {
  color: var(--red-title);
}
.title-subtitle {
  margin-bottom: 11px;
  white-space: nowrap;
  border-left: 3px solid var(--red-title);
  padding-left: 16px;
  font-family: ${KICKER_FONT_STACK};
  font-size: ${TITLE_SUBTITLE_SIZE}px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.14em;
}
.subtitle-gold,
.subtitle-separator {
  color: #8a6b2f;
}
.title-rule {
  width: ${TITLE_RULE_WIDTH}px;
  height: ${TITLE_RULE_HEIGHT}px;
  margin-top: 12px;
  border-radius: 999px;
  background: var(--red-title);
}
.hdr-cta {
  flex-shrink: 0;
  min-width: ${CTA_MIN_WIDTH}px;
  border: ${CTA_BORDER_WIDTH}px solid var(--gold-mid);
  border-radius: ${CTA_RADIUS}px;
  background: #1e1b18;
  padding: 14px 28px;
  text-align: center;
  box-shadow: 0 8px 22px rgba(62, 42, 14, 0.22);
}
.hdr-cta .cta-main {
  color: #f1d27a;
  font-weight: 900;
  font-size: 24px;
  letter-spacing: 1px;
}
.hdr-cta .cta-sub {
  margin-top: 4px;
  color: var(--white-90);
  font-weight: 500;
  font-size: 16px;
}
.hdr-divider {
  height: 12px;
  margin: 0;
  background: transparent;
}
.grid {
  padding: 0 ${GRID_SIDE_PADDING}px 8px;
}
.row {
  display: flex;
  gap: ${GRID_GAP}px;
  margin-bottom: 8px;
  justify-content: center;
}
.row-p9 .frame {
  box-shadow: 0 18px 40px rgba(39, 23, 8, 0.28);
}
.row-p9 .frame-p9 {
  transform: translateY(-1px);
}
.row-label {
  display: flex;
  align-items: center;
  gap: ${ROW_LABEL_GAP}px;
  padding: 2px 10px 6px;
}
.row-label-text {
  white-space: nowrap;
  color: #8a6b2f;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 2px;
  text-transform: uppercase;
}
.row-label-line {
  flex: 1;
  height: 1px;
  opacity: 0.35;
  background: linear-gradient(90deg, var(--gold-mid) 0%, transparent 100%);
}
.cell {
  flex: 1;
  max-width: calc((1920px - 56px - 64px) / 9);
}
.cell-empty {
  visibility: hidden;
}
.frame {
  overflow: hidden;
  border-radius: 9px;
  padding: 3px;
  background: linear-gradient(180deg, #e9c86f 0%, #b9892f 48%, #72501f 100%);
  box-shadow: 0 10px 24px rgba(72, 52, 24, 0.2);
}
.cell-lotus .frame {
  box-shadow: 0 16px 34px rgba(72, 52, 24, 0.28);
}
.frame-inner {
  position: relative;
  aspect-ratio: 5 / 7;
  overflow: hidden;
  border-radius: 6px;
  border: 1px solid var(--gold-border);
  background: #f5f0e4;
}
.frame-inner img {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(1.02) contrast(1.04);
}
.frame-top-glow {
  position: absolute;
  inset: 0 0 auto 0;
  height: 64px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.28), rgba(0, 0, 0, 0.08), transparent);
}
.updated-at-global {
  position: absolute;
  right: 36px;
  bottom: 16px;
  z-index: 20;
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: ${UPDATED_AT_RADIUS}px;
  padding: ${UPDATED_AT_PAD_Y * 2}px ${UPDATED_AT_PAD_X * 2}px;
  background: rgba(0, 0, 0, 0.6);
  color: rgba(255, 255, 255, 0.95);
  font-size: ${UPDATED_AT_FONT_SIZE * 2}px;
  font-weight: 600;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(1px);
}
.condition-chip {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 4;
  border-radius: ${CONDITION_CHIP_RADIUS}px;
  padding: ${CONDITION_CHIP_PAD_Y}px ${CONDITION_CHIP_PAD_X}px;
  color: #3c2b14;
  font-weight: 900;
  font-size: ${CONDITION_CHIP_FONT_SIZE}px;
  box-shadow: ${CONDITION_CHIP_SHADOW};
  border: 1px solid rgba(111, 82, 28, 0.55);
  background: linear-gradient(135deg, rgba(255, 251, 232, 0.96), rgba(232, 205, 130, 0.94));
  backdrop-filter: blur(1px);
}
.badge-stack {
  position: absolute;
  top: 46%;
  left: 50%;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 80%;
  transform: translate(-50%, -50%);
}
.foil-badge,
.rarity-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  padding: 6px 0;
}
.foil-badge {
  border: 2px solid rgba(233, 204, 122, 0.46);
  background: linear-gradient(180deg, rgba(17, 15, 10, 0.78), rgba(36, 28, 13, 0.72));
  box-shadow: 0 0 18px rgba(201, 166, 85, 0.24), inset 0 0 12px rgba(168, 134, 58, 0.12);
}
.foil-badge-line {
  font-weight: 900;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.42);
}
.foil-badge-standard {
  display: inline-block;
  font-size: 17px;
  font-weight: 900;
  letter-spacing: 0.14em;
  line-height: 1.1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.42);
}
.foil-badge .foil-badge-special {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.02;
}
.foil-badge-line {
  display: block;
  font-size: 13px;
  letter-spacing: 0.02em;
}
.foil-badge-line-sub {
  font-size: 15px;
}
.rarity-badge span {
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.bot {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: ${showCardNames ? CARD_OVERLAY_HEIGHT_WITH_NAMES : CARD_OVERLAY_HEIGHT_NO_NAMES};
  background: linear-gradient(to bottom, rgba(4, 4, 3, 0) 0%, rgba(4, 4, 3, 0.46) 18%, rgba(4, 4, 3, 0.9) 48%, rgba(4, 4, 3, 0.98) 100%);
}
.bot-inner {
  position: relative;
  display: flex;
  height: 100%;
  flex-direction: column;
  padding: 7px 7px 7px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.set {
  position: absolute;
  top: 7px;
  left: 7px;
  display: inline-block;
  border-radius: ${SET_BADGE_RADIUS}px;
  padding: ${SET_BADGE_PAD_Y}px ${SET_BADGE_PAD_X}px;
  color: #3a2b16;
  font-weight: 800;
  font-size: ${SET_BADGE_FONT_SIZE}px;
  line-height: 1.2;
  border: 1px solid rgba(90, 65, 24, 0.42);
  background: linear-gradient(180deg, rgba(255, 248, 220, 0.94), rgba(216, 183, 102, 0.9));
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
.content {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  padding-top: ${CARD_CONTENT_TOP}px;
}
.content-with-names {
  padding-top: ${CARD_CONTENT_TOP_WITH_NAMES}px;
}
.name-block {
  margin-bottom: ${CARD_NAME_BLOCK_MARGIN}px;
  color: var(--white);
}
.name-en {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.58);
}
.name-jp {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}
.price-block {
  text-align: center;
  color: var(--white);
}
.price {
  white-space: nowrap;
  font-family: ${PRICE_FONT_STACK};
  line-height: 1.05;
  font-size: ${PRICE_SINGLE_SIZE}px;
  font-weight: 900;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.85);
}
.price-override-value {
  font-size: ${PRICE_OVERRIDE_SIZE}px;
}
.price-block-dual {
  line-height: 1.14;
}
.price-line-single {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
}
.price-line-single .price-lang {
  margin-right: 0;
}
.price-dual-line {
  font-family: ${PRICE_FONT_STACK};
  font-size: ${PRICE_DUAL_SIZE}px;
  font-weight: 900;
}
.price-lang {
  margin-right: 4px;
  font-size: ${PRICE_LANG_SIZE}px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
}
.price-label-rf,
.price-label-cf {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  border-radius: 5px;
  padding: 1px 4px;
  font-weight: 900;
  color: #f6ddff;
  opacity: 1;
}
.price-label-rf {
  border: 1px solid rgba(255, 255, 255, 0.62);
  background: linear-gradient(135deg, rgba(54, 24, 92, 0.86), rgba(12, 93, 111, 0.78), rgba(139, 45, 96, 0.82));
  box-shadow: 0 0 12px rgba(122, 205, 255, 0.25), inset 0 0 8px rgba(255, 255, 255, 0.12);
}
.price-label-cf {
  border: 1px solid rgba(230, 235, 240, 0.6);
  background: linear-gradient(180deg, rgba(21, 24, 28, 0.82), rgba(75, 82, 90, 0.76));
  color: #edf3f8;
  box-shadow: 0 0 12px rgba(214, 224, 233, 0.22), inset 0 0 8px rgba(255, 255, 255, 0.1);
}
.price-amount {
  white-space: nowrap;
  font-weight: 900;
}
.yen {
  font-size: ${PRICE_YEN_SCALE}em;
}
.ftr {
  padding: 10px 36px 16px;
  text-align: center;
}
.ftr p {
  color: var(--text-footer);
  font-weight: 700;
  font-size: 19px;
}
.footer-note {
  color: var(--red-title);
}
</style>
</head>
<body>
<div class="panel">
  <div class="hdr">
    <div class="hdr-logos">
      ${logoGgHtml}
      ${logoMtgHtml}
    </div>
    <div class="title">
      <div class="title-shell">
        <span class="title-bar"></span>
        <div class="title-copy">
          <div class="title-kicker">BUYLIST BOARD</div>
          <div class="title-line">
            <div class="title-text">${buildTitleHtml(config.title)}</div>
            ${titleSubtitleHtml}
          </div>
          <div class="title-rule"></div>
        </div>
      </div>
    </div>
    <div class="hdr-cta">
      <div class="cta-main">${escapeHtml(config.ctaMain)}</div>
      <div class="cta-sub">${escapeHtml(config.ctaSub)}</div>
    </div>
  </div>
  <div class="hdr-divider"></div>
  <div class="grid">
    ${rows.join("\n    ")}
  </div>
  <div class="ftr">
    <p>${footerHtml}</p>
  </div>
  ${config.updatedAtText ? `<div class="updated-at-global">${escapeHtml(config.updatedAtText)}</div>` : ""}
</div>
</body>
</html>`;
}
