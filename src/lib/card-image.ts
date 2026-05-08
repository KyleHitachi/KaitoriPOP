import { GOODGAME_LOGO_DATA_URL } from "./goodgame-logo";
import { Card } from "./types";

function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildCardPlaceholderDataUrl(card: Card): string {
  const title = escapeSvgText(card.nameEn || card.nameJp || "No image");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 700">
      <title>${title}</title>
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#030303"/>
          <stop offset="48%" stop-color="#0d0d0f"/>
          <stop offset="100%" stop-color="#020202"/>
        </linearGradient>
        <linearGradient id="edge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(255,255,255,0.18)"/>
          <stop offset="100%" stop-color="rgba(255,255,255,0.04)"/>
        </linearGradient>
        <filter id="logoShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="18" stdDeviation="14" flood-color="#000000" flood-opacity="0.65"/>
        </filter>
      </defs>
      <rect width="500" height="700" fill="url(#bg)"/>
      <rect x="20" y="20" width="460" height="660" rx="24" fill="none" stroke="url(#edge)" stroke-width="2"/>
      <path d="M-28 116 C104 52 248 62 532 12 L532 184 C318 206 150 234 -28 322 Z" fill="rgba(255,255,255,0.035)"/>
      <path d="M-24 548 C130 492 302 508 524 426 L524 700 L-24 700 Z" fill="rgba(237,0,22,0.075)"/>
      <g filter="url(#logoShadow)">
        <image
          href="${GOODGAME_LOGO_DATA_URL}"
          x="42"
          y="112"
          width="416"
          height="314"
          preserveAspectRatio="xMidYMid meet"
        />
      </g>
      <text x="250" y="486" text-anchor="middle" fill="rgba(255,255,255,0.52)" font-size="15" font-family="Segoe UI, Arial, sans-serif" font-weight="700" letter-spacing="4">CARD IMAGE PENDING</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function resolveCardImageSrc(card: Card): string {
  if (card.imageData) return card.imageData;

  const url = (card.imageUrl || "").trim();
  if (!url) return buildCardPlaceholderDataUrl(card);
  if (/^https?:\/\/example\.com\//i.test(url)) {
    return buildCardPlaceholderDataUrl(card);
  }

  return url;
}
