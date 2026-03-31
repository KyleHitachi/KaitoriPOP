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
  const title = escapeSvgText(card.nameEn || card.nameJp || "MTG Card");
  const subtitle = escapeSvgText(card.set || "BUYLIST");
  const detail = escapeSvgText(card.lang || "EN");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 700">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#d4b15a"/>
          <stop offset="38%" stop-color="#b58d38"/>
          <stop offset="100%" stop-color="#2a241b"/>
        </linearGradient>
        <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="rgba(255,255,255,0.34)"/>
          <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
        </linearGradient>
      </defs>
      <rect width="500" height="700" fill="url(#bg)"/>
      <rect x="26" y="26" width="448" height="648" rx="22" fill="none" stroke="rgba(255,245,220,0.48)" stroke-width="2"/>
      <path d="M0 0 L500 0 L500 240 Q260 340 0 220 Z" fill="rgba(255,255,255,0.08)"/>
      <circle cx="396" cy="126" r="92" fill="rgba(255,255,255,0.08)"/>
      <circle cx="396" cy="126" r="64" fill="rgba(255,255,255,0.06)"/>
      <rect x="48" y="86" width="404" height="18" rx="9" fill="rgba(255,255,255,0.16)"/>
      <rect x="48" y="126" width="264" height="14" rx="7" fill="rgba(255,255,255,0.12)"/>
      <rect x="48" y="156" width="224" height="14" rx="7" fill="rgba(255,255,255,0.12)"/>
      <text x="48" y="510" fill="#fffdf7" font-size="34" font-family="Segoe UI, Arial, sans-serif" font-weight="800" letter-spacing="1.8">${subtitle}</text>
      <text x="48" y="550" fill="rgba(255,255,255,0.92)" font-size="17" font-family="Segoe UI, Arial, sans-serif" font-weight="700" letter-spacing="5">${detail}</text>
      <text x="48" y="610" fill="#1e1a13" font-size="30" font-family="Segoe UI, Arial, sans-serif" font-weight="900">NO IMAGE</text>
      <text x="48" y="648" fill="rgba(24,20,14,0.88)" font-size="22" font-family="Segoe UI, Arial, sans-serif" font-weight="700">${title}</text>
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

