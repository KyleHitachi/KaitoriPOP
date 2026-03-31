"use client";

import { Card } from "@/lib/types";
import { buildCardPlaceholderDataUrl, resolveCardImageSrc } from "@/lib/card-image";
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
  PRICE_LANG_SIZE,
  PRICE_OVERRIDE_SIZE,
  PRICE_SINGLE_SIZE,
  PRICE_YEN_SCALE,
  SET_BADGE_FONT_SIZE,
  SET_BADGE_PAD_X,
  SET_BADGE_PAD_Y,
  SET_BADGE_RADIUS,
  UPDATED_AT_FONT_SIZE,
  UPDATED_AT_PAD_X,
  UPDATED_AT_PAD_Y,
  UPDATED_AT_RADIUS,
} from "@/lib/layout-tokens";

interface Props {
  card: Card;
  showCardNames?: boolean;
  isP9Row?: boolean;
  isLotus?: boolean;
  updatedAtText?: string;
  onClick?: () => void;
}

const YEN = "\u5186";

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

export default function CardCell({
  card,
  showCardNames = false,
  isP9Row,
  isLotus,
  updatedAtText = "",
  onClick,
}: Props) {
  const foil = card.foilOverride ?? card.foil;
  const fallbackSrc = buildCardPlaceholderDataUrl(card);
  const imgSrc = resolveCardImageSrc(card);
  const singlePrice = card.priceJp ?? card.priceEn;

  return (
    <div
      className={`group relative flex-1 cursor-pointer ${isLotus ? "cell-lotus-preview" : ""}`}
      onClick={onClick}
      title={`${card.nameJp} / ${card.nameEn}`}
    >
      <div
        className={`overflow-hidden rounded-[9px] p-[3px] transition-transform duration-200 group-hover:-translate-y-[2px] ${
          isP9Row
            ? "shadow-[0_18px_40px_rgba(39,23,8,0.28)]"
            : "shadow-[0_12px_28px_rgba(39,23,8,0.22)]"
        }`}
        style={{
          background:
            "linear-gradient(180deg, #d7bc73 0%, #a8863a 38%, #6e5528 100%)",
        }}
      >
        <div
          className="relative aspect-[5/7] overflow-hidden rounded-[6px]"
          style={{ border: "1px solid #6b5528" }}
        >
          <img
            src={imgSrc}
            alt={card.nameEn}
            className="absolute inset-0 block h-full w-full object-cover transition duration-300 group-hover:scale-[1.015]"
            style={{ filter: "saturate(0.95) contrast(1.03)" }}
            loading="lazy"
            onError={(event) => {
              const target = event.currentTarget;
              if (target.src !== fallbackSrc) {
                target.src = fallbackSrc;
              }
            }}
          />

          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 via-black/10 to-transparent" />

          {updatedAtText && (
            <div
              className="absolute bottom-[8px] right-[8px] z-[4] max-w-[72%] truncate border border-white/20 bg-black/58 font-semibold text-white/92 backdrop-blur-[1px]"
              style={{
                borderRadius: `${UPDATED_AT_RADIUS}px`,
                padding: `${UPDATED_AT_PAD_Y}px ${UPDATED_AT_PAD_X}px`,
                fontSize: `${UPDATED_AT_FONT_SIZE}px`,
              }}
            >
              {updatedAtText}
            </div>
          )}

          <div
            className="absolute left-[6px] top-[6px] z-[4] border border-white/80 font-black text-[#4c2208]"
            style={{
              background:
                "linear-gradient(135deg, #fff8ef 0%, #fff0bf 52%, #f1ca72 100%)",
              boxShadow: CONDITION_CHIP_SHADOW,
              borderRadius: `${CONDITION_CHIP_RADIUS}px`,
              padding: `${CONDITION_CHIP_PAD_Y}px ${CONDITION_CHIP_PAD_X}px`,
              fontSize: `${CONDITION_CHIP_FONT_SIZE}px`,
            }}
          >
            {card.condition}
          </div>

          {foil && (
            <div
              className="absolute left-1/2 top-[44%] z-[5] flex w-[78%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[12px] py-1.5"
              style={{
                background:
                  "linear-gradient(180deg, rgba(17, 15, 10, 0.78), rgba(36, 28, 13, 0.72))",
                border: "2px solid rgba(233, 204, 122, 0.46)",
                boxShadow:
                  "0 0 18px rgba(201,166,85,0.24), inset 0 0 12px rgba(168,134,58,0.12)",
              }}
            >
              <span
                className="text-[17px] font-black tracking-[0.32em]"
                style={{
                  background:
                    "linear-gradient(180deg, #fff2bf 0%, #d6ae58 35%, #fff7da 55%, #b9892f 78%, #f2d27e 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                FOIL
              </span>
            </div>
          )}

          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: showCardNames
                ? CARD_OVERLAY_HEIGHT_WITH_NAMES
                : CARD_OVERLAY_HEIGHT_NO_NAMES,
              background:
                "linear-gradient(to bottom, rgba(20,18,14,0) 0%, rgba(20,18,14,0.48) 12%, rgba(20,18,14,0.86) 38%, rgba(20,18,14,0.96) 100%)",
            }}
          >
            <div className="relative flex h-full flex-col px-[7px] pb-[7px] pt-[7px]">
              <div
                className="absolute left-[7px] top-[7px] font-extrabold leading-tight text-white shadow-sm"
                style={{
                  background: "linear-gradient(180deg, #a32222, #7a1414)",
                  borderRadius: `${SET_BADGE_RADIUS}px`,
                  padding: `${SET_BADGE_PAD_Y}px ${SET_BADGE_PAD_X}px`,
                  fontSize: `${SET_BADGE_FONT_SIZE}px`,
                }}
              >
                {buildSetLabel(card)}
              </div>

              <div
                className="flex flex-1 flex-col justify-center"
                style={{
                  paddingTop: showCardNames
                    ? `${CARD_CONTENT_TOP_WITH_NAMES}px`
                    : `${CARD_CONTENT_TOP}px`,
                }}
              >
                {showCardNames && (
                  <div style={{ marginBottom: `${CARD_NAME_BLOCK_MARGIN}px` }}>
                    <div className="line-clamp-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/58">
                      {card.nameEn || card.nameJp}
                    </div>
                    <div className="line-clamp-1 text-[11px] font-semibold text-white/90">
                      {card.nameJp}
                    </div>
                  </div>
                )}

                {card.priceOverride ? (
                  <div className="text-center text-white">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-amber-200/80">
                      Override
                    </div>
                    <div
                      className="font-black leading-tight drop-shadow-lg"
                      style={{ fontSize: `${PRICE_OVERRIDE_SIZE}px` }}
                    >
                      {card.priceOverride}
                    </div>
                  </div>
                ) : card.priceJp !== null && card.priceEn !== null ? (
                  <div className="text-center text-white leading-[1.16]">
                    <div>
                      <span
                        className="opacity-55"
                        style={{ fontSize: `${PRICE_LANG_SIZE}px` }}
                      >
                        JP
                      </span>{" "}
                      <span
                        className="font-black"
                        style={{ fontSize: `${PRICE_DUAL_SIZE}px` }}
                      >
                        {formatPrice(card.priceJp)}
                        <span style={{ fontSize: `${PRICE_DUAL_SIZE * PRICE_YEN_SCALE}px` }}>{YEN}</span>
                      </span>
                    </div>
                    <div>
                      <span
                        className="opacity-55"
                        style={{ fontSize: `${PRICE_LANG_SIZE}px` }}
                      >
                        EN
                      </span>{" "}
                      <span
                        className="font-black"
                        style={{ fontSize: `${PRICE_DUAL_SIZE}px` }}
                      >
                        {formatPrice(card.priceEn)}
                        <span style={{ fontSize: `${PRICE_DUAL_SIZE * PRICE_YEN_SCALE}px` }}>{YEN}</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-white">
                    <div
                      className="font-black leading-none drop-shadow-lg"
                      style={{ fontSize: `${PRICE_SINGLE_SIZE}px` }}
                    >
                      {formatPrice(singlePrice ?? 0)}
                      <span style={{ fontSize: `${PRICE_SINGLE_SIZE * PRICE_YEN_SCALE}px` }}>{YEN}</span>
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
