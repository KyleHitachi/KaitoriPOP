import {
  Card,
  SheetConfig,
  GRID_COLS,
  GRID_ROWS,
  HIGH_END_SHEET_NAMES,
} from "./types";
import { buildCardPlaceholderDataUrl, resolveCardImageSrc } from "./card-image";
import {
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

function buildSetLabel(card: Card): string {
  if (card.setLabelOverride) return card.setLabelOverride;
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

function buildPriceHtml(card: Card): string {
  if (card.priceOverride) {
    return `<div class="price-block price-block-override">
      <div class="price-override-label">Override</div>
      <div class="price price-override-value">${escapeHtml(card.priceOverride)}</div>
    </div>`;
  }

  if (card.priceJp !== null && card.priceEn !== null) {
    return `<div class="price-block price-block-dual">
      <div class="price-dual-line">
        <span class="price-lang">JP</span>
        <span class="price-amount">${formatPrice(card.priceJp)}<span class="yen">${YEN_HTML}</span></span>
      </div>
      <div class="price-dual-line">
        <span class="price-lang">EN</span>
        <span class="price-amount">${formatPrice(card.priceEn)}<span class="yen">${YEN_HTML}</span></span>
      </div>
    </div>`;
  }

  const price = card.priceJp ?? card.priceEn;
  if (price !== null) {
    return `<div class="price-block">
      <div class="price">${formatPrice(price)}<span class="yen">${YEN_HTML}</span></div>
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
    updatedAtText: string;
  }
): string {
  const foil = card.foilOverride ?? card.foil;
  const imgSrc = resolveCardImageSrc(card);
  const fallbackSrc = buildCardPlaceholderDataUrl(card);
  const cellClasses = ["cell", options.isLotus ? "cell-lotus" : ""]
    .filter(Boolean)
    .join(" ");
  const frameClasses = ["frame", options.isP9Row ? "frame-p9" : ""]
    .filter(Boolean)
    .join(" ");
  const titleEn = escapeHtml(card.nameEn || card.nameJp);
  const titleJp = escapeHtml(card.nameJp || card.nameEn);

  return `
    <div class="${cellClasses}">
      <div class="${frameClasses}">
        <div class="frame-inner">
          <img src="${escapeHtml(imgSrc)}" alt="${titleEn}" loading="lazy" onerror="this.onerror=null;this.src='${escapeHtml(fallbackSrc)}';" />
          <div class="frame-top-glow"></div>
          ${options.updatedAtText ? `<div class="updated-at">${escapeHtml(options.updatedAtText)}</div>` : ""}
          <div class="condition-chip">${escapeHtml(card.condition)}</div>
          ${
            foil
              ? '<div class="foil-badge"><span>FOIL</span></div>'
              : ""
          }
          <div class="bot">
            <div class="bot-inner">
              <div class="set">${escapeHtml(buildSetLabel(card))}</div>
              <div class="content ${options.showCardNames ? "content-with-names" : ""}">
                ${
                  options.showCardNames
                    ? `<div class="name-block">
                  <div class="name-en">${titleEn}</div>
                  <div class="name-jp">${titleJp}</div>
                </div>`
                    : ""
                }
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

const SVG_PATTERN =
  'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\'%3E%3Crect width=\'120\' height=\'120\' fill=\'%23c8c4be\'/%3E%3Cpath d=\'M60 0L120 60L60 120L0 60Z\' fill=\'%23c5c1bb\' /%3E%3Cpath d=\'M60 10L110 60L60 110L10 60Z\' fill=\'none\' stroke=\'%23cac6c0\' stroke-width=\'0.5\' /%3E%3C/svg%3E")';

export function renderBuylistHtml(config: SheetConfig): string {
  const sortedCards = getSortedCards(config);
  const rows: string[] = [];

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
            showCardNames: config.showCardNames,
            updatedAtText: config.updatedAtText,
          })
        );
      } else {
        cells.push('<div class="cell cell-empty"></div>');
      }
    }

    rows.push(`<div class="row ${isP9Row ? "row-p9" : ""}">${cells.join("")}</div>`);
  }

  const logoGgHtml = config.logoGg
    ? `<img src="${escapeHtml(config.logoGg)}" alt="GG Logo" class="logo-gg" />`
    : '<div class="logo-gg logo-placeholder">GG</div>';
  const logoMtgHtml = config.logoMtg
    ? `<img src="${escapeHtml(config.logoMtg)}" alt="MTG Logo" class="logo-mtg" />`
    : '<div class="logo-mtg logo-placeholder">MTG</div>';
  const footerHtml = buildFooterHtml(config.footerText);

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=1920" />
<style>
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
:root {
  --red-title: #d50000;
  --gold-light: #d7bc73;
  --gold-mid: #a8863a;
  --gold-dark: #6e5528;
  --gold-border: #6b5528;
  --black-deep: #1a1714;
  --bg-warm: #c8c4be;
  --white: #ffffff;
  --white-90: rgba(255, 255, 255, 0.92);
  --text-footer: #2a2520;
}
body {
  font-family: "Segoe UI", "Hiragino Sans", "Yu Gothic UI", sans-serif;
  font-feature-settings: "tnum" 1;
  -webkit-font-smoothing: antialiased;
}
.panel {
  width: ${PREVIEW_CANVAS_WIDTH}px;
  background: var(--bg-warm);
  background-image: ${SVG_PATTERN};
  background-size: 120px 120px;
  overflow: hidden;
}
.hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 18px 36px 14px;
}
.hdr-logos {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}
.logo-gg { height: 80px; }
.logo-mtg { height: 50px; }
.logo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #333;
  color: #fff;
  border-radius: 8px;
  font-weight: 900;
  font-size: 24px;
}
.logo-gg.logo-placeholder { width: 80px; height: 80px; }
.logo-mtg.logo-placeholder { width: 100px; height: 50px; }
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
  margin-top: 8px;
  border-radius: 999px;
  background: var(--red-title);
}
.title-copy {
  min-width: 0;
  text-align: left;
}
.title-kicker {
  margin-bottom: 10px;
  color: #6b6660;
  font-family: ${KICKER_FONT_STACK};
  font-size: ${TITLE_KICKER_SIZE}px;
  font-weight: 600;
  letter-spacing: 0.34em;
  text-transform: uppercase;
}
.title-text {
  font-family: ${TITLE_FONT_STACK};
  font-weight: 800;
  font-size: ${TITLE_FONT_SIZE}px;
  line-height: 1;
  letter-spacing: ${TITLE_TRACKING};
  color: #1f1f1f;
}
.title-rule {
  width: ${TITLE_RULE_WIDTH}px;
  height: ${TITLE_RULE_HEIGHT}px;
  margin-top: 16px;
  border-radius: 999px;
  background: var(--red-title);
}
.hdr-cta {
  flex-shrink: 0;
  min-width: ${CTA_MIN_WIDTH}px;
  border: ${CTA_BORDER_WIDTH}px solid var(--gold-mid);
  border-radius: ${CTA_RADIUS}px;
  background: var(--black-deep);
  padding: 14px 28px;
  text-align: center;
}
.hdr-cta .cta-main {
  color: var(--gold-light);
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
  height: 3px;
  margin: 0 36px 12px;
  background: linear-gradient(90deg, transparent, var(--gold-light) 15%, var(--gold-mid) 50%, var(--gold-light) 85%, transparent);
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
  color: var(--gold-mid);
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
  background: linear-gradient(180deg, var(--gold-light) 0%, var(--gold-mid) 38%, var(--gold-dark) 100%);
  box-shadow: 0 12px 28px rgba(39, 23, 8, 0.22);
}
.cell-lotus .frame {
  box-shadow: 0 20px 42px rgba(201, 166, 85, 0.28), 0 12px 28px rgba(39, 23, 8, 0.28);
}
.frame-inner {
  position: relative;
  aspect-ratio: 5 / 7;
  overflow: hidden;
  border-radius: 6px;
  border: 1px solid var(--gold-border);
}
.frame-inner img {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.95) contrast(1.03);
}
.frame-top-glow {
  position: absolute;
  inset: 0 0 auto 0;
  height: 64px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.1), transparent);
}
.updated-at {
  position: absolute;
  right: 8px;
  bottom: 8px;
  z-index: 4;
  max-width: 72%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: ${UPDATED_AT_RADIUS}px;
  padding: ${UPDATED_AT_PAD_Y}px ${UPDATED_AT_PAD_X}px;
  background: rgba(0, 0, 0, 0.58);
  color: rgba(255, 255, 255, 0.92);
  font-size: ${UPDATED_AT_FONT_SIZE}px;
  font-weight: 600;
  backdrop-filter: blur(1px);
}
.condition-chip {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 4;
  border-radius: ${CONDITION_CHIP_RADIUS}px;
  padding: ${CONDITION_CHIP_PAD_Y}px ${CONDITION_CHIP_PAD_X}px;
  color: #4c2208;
  font-weight: 900;
  font-size: ${CONDITION_CHIP_FONT_SIZE}px;
  box-shadow: ${CONDITION_CHIP_SHADOW};
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: linear-gradient(135deg, #fff8ef 0%, #fff0bf 52%, #f1ca72 100%);
}
.foil-badge {
  position: absolute;
  top: 44%;
  left: 50%;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 78%;
  transform: translate(-50%, -50%);
  border-radius: 12px;
  padding: 6px 0;
  border: 2px solid rgba(233, 204, 122, 0.46);
  background: linear-gradient(180deg, rgba(17, 15, 10, 0.78), rgba(36, 28, 13, 0.72));
  box-shadow: 0 0 18px rgba(201, 166, 85, 0.24), inset 0 0 12px rgba(168, 134, 58, 0.12);
}
.foil-badge span {
  font-size: 17px;
  font-weight: 900;
  letter-spacing: 0.32em;
  background: linear-gradient(180deg, #fff2bf 0%, #d6ae58 35%, #fff7da 55%, #b9892f 78%, #f2d27e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.bot {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: ${config.showCardNames ? CARD_OVERLAY_HEIGHT_WITH_NAMES : CARD_OVERLAY_HEIGHT_NO_NAMES};
  background: linear-gradient(to bottom, rgba(20, 18, 14, 0) 0%, rgba(20, 18, 14, 0.48) 12%, rgba(20, 18, 14, 0.86) 38%, rgba(20, 18, 14, 0.96) 100%);
}
.bot-inner {
  position: relative;
  display: flex;
  height: 100%;
  flex-direction: column;
  padding: 7px 7px 7px;
}
.set {
  position: absolute;
  top: 7px;
  left: 7px;
  display: inline-block;
  border-radius: ${SET_BADGE_RADIUS}px;
  padding: ${SET_BADGE_PAD_Y}px ${SET_BADGE_PAD_X}px;
  color: var(--white);
  font-weight: 800;
  font-size: ${SET_BADGE_FONT_SIZE}px;
  line-height: 1.2;
  background: linear-gradient(180deg, #a32222, #7a1414);
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
.price-block-override .price-override-label {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(253, 230, 138, 0.8);
}
.price {
  line-height: 1.05;
  font-size: ${PRICE_SINGLE_SIZE}px;
  font-weight: 900;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.7);
}
.price-override-value {
  font-size: ${PRICE_OVERRIDE_SIZE}px;
}
.price-block-dual {
  line-height: 1.14;
}
.price-dual-line {
  font-size: ${PRICE_DUAL_SIZE}px;
  font-weight: 900;
}
.price-lang {
  margin-right: 4px;
  font-size: ${PRICE_LANG_SIZE}px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
}
.price-amount {
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
          <div class="title-text">${escapeHtml(config.title)}</div>
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
</div>
</body>
</html>`;
}
