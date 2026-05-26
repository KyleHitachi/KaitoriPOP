"use client";

import type { CSSProperties } from "react";
import { Card } from "@/lib/types";
import { buildCardPlaceholderDataUrl, resolveCardImageSrc } from "@/lib/card-image";
import { resolveFoilBadgeStyle, resolveSpecialFoilBadge } from "@/lib/foil-badge";
import { resolveRarityBadgeStyle } from "@/lib/rarity-badge";
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
  PRICE_DUAL_SIZE,
  PRICE_FONT_STACK,
  PRICE_LANG_SIZE,
  PRICE_OVERRIDE_SIZE,
  PRICE_SINGLE_SIZE,
  PRICE_YEN_SCALE,
  SET_BADGE_FONT_SIZE,
  SET_BADGE_PAD_X,
  SET_BADGE_PAD_Y,
  SET_BADGE_RADIUS,
} from "@/lib/layout-tokens";

interface Props {
  card: Card;
  showCardNames?: boolean;
  showExpansionName?: boolean;
  showRarityBadge?: boolean;
  showCondition?: boolean;
  isP9Row?: boolean;
  isLotus?: boolean;
  onClick?: () => void;
}

const YEN = "\u5186";

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

function buildCardTitle(card: Card): string {
  return [card.nameJp, card.nameEn].filter(Boolean).join(" / ");
}

function buildPriceLabelStyle(label: string): CSSProperties {
  const normalized = label.trim().toUpperCase();
  if (normalized !== "RF" && normalized !== "CF") {
    return { fontSize: `${PRICE_LANG_SIZE}px` };
  }

  const foilStyle = resolveFoilBadgeStyle(normalized === "RF" ? "rainbow" : "silver");
  return {
    alignItems: "center",
    background: foilStyle.background,
    border: foilStyle.border,
    borderRadius: "5px",
    boxShadow: foilStyle.shadow,
    color: foilStyle.textColor,
    display: "inline-flex",
    fontSize: `${PRICE_LANG_SIZE}px`,
    fontWeight: 900,
    justifyContent: "center",
    minWidth: "24px",
    opacity: 1,
    padding: "1px 4px",
  };
}

export default function CardCell({
  card,
  showCardNames = false,
  showExpansionName = true,
  showRarityBadge = false,
  showCondition = true,
  isP9Row,
  isLotus,
  onClick,
}: Props) {
  const foil = card.foilOverride ?? card.foil;
  const foilBadge = foil
    ? resolveSpecialFoilBadge([card.foilLabel ?? ""]) ?? {
        label: card.foilLabel ?? "FOIL",
        tone: "gold" as const,
      }
    : null;
  const foilBadgeLines = foilBadge?.displayLines ?? (foilBadge ? [foilBadge.label] : []);
  const hasSpecialFoilLines = foilBadgeLines.length > 1;
  const foilStyle = resolveFoilBadgeStyle(foilBadge?.tone);
  const rarity = (card.rarityOverride ?? card.rarity).trim();
  const rarityStyle = rarity ? resolveRarityBadgeStyle(rarity) : null;
  const fallbackSrc = buildCardPlaceholderDataUrl(card);
  const imgSrc = resolveCardImageSrc(card);
  const singlePrice = card.priceJp ?? card.priceEn;
  const priceJpLabel = card.priceJpLabel ?? "JP";
  const priceEnLabel = card.priceEnLabel ?? "EN";
  const singlePriceLabel = buildSinglePriceLabel(card);
  const hasVisibleName = Boolean(card.nameEn || card.nameJp);

  return (
    <div
      className={`group relative flex-1 cursor-pointer select-none ${isLotus ? "cell-lotus-preview" : ""}`}
      onClick={onClick}
      title={buildCardTitle(card)}
    >
      <div
        className={`overflow-hidden rounded-[9px] p-[3px] transition-transform duration-200 group-hover:-translate-y-[2px] ${
          isP9Row
            ? "shadow-[0_16px_34px_rgba(72,52,24,0.28)]"
            : "shadow-[0_10px_24px_rgba(72,52,24,0.2)]"
        }`}
        style={{
          background:
            "linear-gradient(180deg, #e9c86f 0%, #b9892f 48%, #72501f 100%)",
        }}
      >
        <div
          className="relative aspect-[5/7] overflow-hidden rounded-[6px]"
          style={{
            border: "1px solid rgba(88, 62, 22, 0.72)",
            background: "#f5f0e4",
          }}
        >
          <img
            src={imgSrc}
            alt={card.nameEn || card.nameJp || "Card image"}
            draggable={false}
            className="absolute inset-0 block h-full w-full object-cover transition duration-300 group-hover:scale-[1.015]"
            style={{ filter: "saturate(1.02) contrast(1.04)" }}
            loading="lazy"
            onError={(event) => {
              const target = event.currentTarget;
              if (target.src !== fallbackSrc) {
                target.src = fallbackSrc;
              }
            }}
          />

          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/28 via-black/8 to-transparent" />

          {showCondition && (
            <div
              className="absolute left-[6px] top-[6px] z-[4] border font-black text-[#3c2b14] backdrop-blur-[1px]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255, 251, 232, 0.96), rgba(232, 205, 130, 0.94))",
                boxShadow: CONDITION_CHIP_SHADOW,
                borderColor: "rgba(111, 82, 28, 0.55)",
                borderRadius: `${CONDITION_CHIP_RADIUS}px`,
                padding: `${CONDITION_CHIP_PAD_Y}px ${CONDITION_CHIP_PAD_X}px`,
                fontSize: `${CONDITION_CHIP_FONT_SIZE}px`,
              }}
            >
              {card.condition}
            </div>
          )}

          {(foil || (showRarityBadge && rarity && rarityStyle)) && (
            <div className="absolute left-1/2 top-[46%] z-[5] flex w-[80%] -translate-x-1/2 -translate-y-1/2 flex-col gap-1">
              {foil && (
                <div
                  className="flex items-center justify-center rounded-[12px] py-1.5"
                  style={{
                    background: foilStyle.background,
                    border: foilStyle.border,
                    boxShadow: foilStyle.shadow,
                  }}
                >
                  {hasSpecialFoilLines ? (
                    <div
                      className="flex flex-col items-center justify-center font-black"
                      style={{ lineHeight: 1.02 }}
                    >
                      {foilBadgeLines.map((line, index) => (
                        <span
                          key={`${line}-${index}`}
                          className="block"
                          style={{
                            background: foilStyle.textBackground,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            fontSize: index === 1 ? "15px" : "13px",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {line}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span
                      className="text-[17px] font-black"
                      style={{
                        background: foilStyle.textBackground,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        letterSpacing: "0.14em",
                      }}
                    >
                      {foilBadge?.label}
                    </span>
                  )}
                </div>
              )}
              {showRarityBadge && rarity && rarityStyle && (
                <div
                  className="flex items-center justify-center rounded-[12px] py-1.5"
                  style={{
                    background: rarityStyle.background,
                    border: rarityStyle.border,
                    boxShadow: rarityStyle.shadow,
                  }}
                >
                  <span
                    className="text-[15px] font-black uppercase tracking-[0.16em]"
                    style={{
                      background: rarityStyle.textBackground,
                      color: rarityStyle.textColor,
                      WebkitBackgroundClip:
                        rarityStyle.textBackground === "none" ? undefined : "text",
                      WebkitTextFillColor:
                        rarityStyle.textBackground === "none" ? undefined : "transparent",
                    }}
                  >
                    {rarity}
                  </span>
                </div>
              )}
            </div>
          )}

          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: showCardNames
                ? CARD_OVERLAY_HEIGHT_WITH_NAMES
                : CARD_OVERLAY_HEIGHT_NO_NAMES,
              background:
                "linear-gradient(to bottom, rgba(4,4,3,0) 0%, rgba(4,4,3,0.46) 18%, rgba(4,4,3,0.9) 48%, rgba(4,4,3,0.98) 100%)",
            }}
          >
            <div className="relative flex h-full flex-col border-t border-white/15 px-[7px] pb-[7px] pt-[7px]">
              {showExpansionName && (
                <div
                  className="absolute left-[7px] top-[7px] font-extrabold leading-tight text-white shadow-sm"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,248,220,0.94), rgba(216,183,102,0.9))",
                    border: "1px solid rgba(90, 65, 24, 0.42)",
                    color: "#3a2b16",
                    borderRadius: `${SET_BADGE_RADIUS}px`,
                    padding: `${SET_BADGE_PAD_Y}px ${SET_BADGE_PAD_X}px`,
                    fontSize: `${SET_BADGE_FONT_SIZE}px`,
                  }}
                >
                  {buildSetLabel(card)}
                </div>
              )}

              <div
                className="flex flex-1 flex-col justify-center"
                style={{
                  paddingTop: showCardNames
                    ? `${CARD_CONTENT_TOP_WITH_NAMES}px`
                    : `${CARD_CONTENT_TOP}px`,
                }}
              >
                {showCardNames && hasVisibleName && (
                  <div style={{ marginBottom: `${CARD_NAME_BLOCK_MARGIN}px` }}>
                    {card.nameEn && (
                      <div className="line-clamp-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/58">
                        {card.nameEn}
                      </div>
                    )}
                    {card.nameJp && (
                      <div className="line-clamp-1 text-[11px] font-semibold text-white/90">
                        {card.nameJp}
                      </div>
                    )}
                  </div>
                )}

                {card.priceOverride ? (
                  <div className="text-center text-white">
                    <div className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                      {singlePriceLabel && (
                        <span
                          className="opacity-70"
                          style={buildPriceLabelStyle(singlePriceLabel)}
                        >
                          {singlePriceLabel}
                        </span>
                      )}
                      <span
                        className="font-black leading-tight drop-shadow-lg"
                        style={{
                          fontFamily: PRICE_FONT_STACK,
                          fontSize: `${PRICE_OVERRIDE_SIZE}px`,
                        }}
                      >
                        {card.priceOverride}
                      </span>
                    </div>
                  </div>
                ) : card.priceJp !== null && card.priceEn !== null ? (
                  <div className="text-center text-white leading-[1.16]">
                    <div>
                      <span
                        className="opacity-70"
                        style={buildPriceLabelStyle(priceJpLabel)}
                      >
                        {priceJpLabel}
                      </span>{" "}
                      <span
                        className="whitespace-nowrap font-black drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]"
                        style={{
                          fontFamily: PRICE_FONT_STACK,
                          fontSize: `${PRICE_DUAL_SIZE}px`,
                        }}
                      >
                        {formatPrice(card.priceJp)}
                        <span style={{ fontSize: `${PRICE_DUAL_SIZE * PRICE_YEN_SCALE}px` }}>{YEN}</span>
                      </span>
                    </div>
                    <div>
                      <span
                        className="opacity-70"
                        style={buildPriceLabelStyle(priceEnLabel)}
                      >
                        {priceEnLabel}
                      </span>{" "}
                      <span
                        className="whitespace-nowrap font-black drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]"
                        style={{
                          fontFamily: PRICE_FONT_STACK,
                          fontSize: `${PRICE_DUAL_SIZE}px`,
                        }}
                      >
                        {formatPrice(card.priceEn)}
                        <span style={{ fontSize: `${PRICE_DUAL_SIZE * PRICE_YEN_SCALE}px` }}>{YEN}</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-white">
                    <div className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                      {singlePriceLabel && (
                        <span
                          className="opacity-70"
                          style={buildPriceLabelStyle(singlePriceLabel)}
                        >
                          {singlePriceLabel}
                        </span>
                      )}
                      <span
                        className="font-black leading-none drop-shadow-lg"
                        style={{
                          fontFamily: PRICE_FONT_STACK,
                          fontSize: `${PRICE_SINGLE_SIZE}px`,
                        }}
                      >
                        {formatPrice(singlePrice ?? 0)}
                        <span style={{ fontSize: `${PRICE_SINGLE_SIZE * PRICE_YEN_SCALE}px` }}>{YEN}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
