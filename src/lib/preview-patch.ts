import { THEMES, THEME_ORDER, buildThemeFontLink } from "./themes";

// Updates the preview frame in place instead of replacing its body, so card
// images that did not change keep their decoded pixels (no blank flash),
// cards that moved can glide to their new slot, and fonts stay loaded.

const CARD_KEY = "data-card-id";
const EASE = "cubic-bezier(0.22, 0.61, 0.24, 1)";

function cardKey(node: Node): string | null {
  return node.nodeType === Node.ELEMENT_NODE ? (node as Element).getAttribute(CARD_KEY) : null;
}

function sameKind(current: Node, next: Node): boolean {
  if (current.nodeType !== next.nodeType) return false;
  if (current.nodeType !== Node.ELEMENT_NODE) return true;
  return (current as Element).tagName === (next as Element).tagName;
}

function syncAttributes(current: Element, next: Element): void {
  // An image that already fell back to its placeholder keeps it while the
  // board still asks for the same (broken) source.
  const fellBackFrom = current.tagName === "IMG" ? current.getAttribute("data-fallback") : null;
  const keepFallback = fellBackFrom !== null && fellBackFrom === next.getAttribute("src");

  for (const { name } of Array.from(current.attributes)) {
    if (keepFallback && (name === "src" || name === "data-fallback")) continue;
    if (!next.hasAttribute(name)) current.removeAttribute(name);
  }
  for (const { name, value } of Array.from(next.attributes)) {
    if (keepFallback && name === "src") continue;
    if (current.getAttribute(name) !== value) current.setAttribute(name, value);
  }
}

function morphNode(current: Node, next: Node, pool: Map<string, Element>): void {
  if (current.nodeType !== Node.ELEMENT_NODE) {
    if (current.nodeValue !== next.nodeValue) current.nodeValue = next.nodeValue;
    return;
  }
  syncAttributes(current as Element, next as Element);
  morphChildren(current, next, pool);
}

function morphChildren(parent: Node, nextParent: Node, pool: Map<string, Element>): void {
  const doc = parent.ownerDocument as Document;
  let cursor = parent.firstChild;

  for (const nextChild of Array.from(nextParent.childNodes)) {
    const key = cardKey(nextChild);
    let match: Node | null = null;
    if (key) {
      match = pool.get(key) ?? null;
      pool.delete(key);
    } else if (cursor && !cardKey(cursor) && sameKind(cursor, nextChild)) {
      match = cursor;
    }

    if (!match) {
      parent.insertBefore(doc.importNode(nextChild, true), cursor);
      continue;
    }
    if (match === cursor) {
      cursor = cursor.nextSibling;
    } else {
      // Keyed cards move across rows; moving keeps the node (and its image).
      parent.insertBefore(match, cursor);
    }
    morphNode(match, nextChild, pool);
  }

  while (cursor) {
    const following = cursor.nextSibling;
    parent.removeChild(cursor);
    cursor = following;
  }
}

function syncHead(doc: Document, next: Document): void {
  // Match our stylesheet by its marker, not by position: Adobe Fonts
  // inserts its own <style> into the head after the first load.
  const nextStyle = next.head.querySelector("style[data-buylist-style]");
  const currentStyle = doc.head.querySelector("style[data-buylist-style]");
  if (nextStyle && currentStyle && currentStyle.textContent !== nextStyle.textContent) {
    currentStyle.textContent = nextStyle.textContent;
  }

  // Font stylesheets are only ever added, so switching back to a theme never
  // has to load its fonts again.
  const currentHrefs = new Set(
    Array.from(doc.head.querySelectorAll<HTMLLinkElement>("link[rel=stylesheet]")).map(
      (link) => link.href
    )
  );
  next.head.querySelectorAll<HTMLLinkElement>("link[rel=stylesheet]").forEach((link) => {
    if (!currentHrefs.has(link.href)) doc.head.appendChild(doc.importNode(link, true));
  });
}

// Loads every theme's fonts into the frame up front, so a theme switch shows
// the new type at once instead of swapping it in a moment later.
export function preloadThemeFonts(doc: Document): void {
  const parser = doc.createElement("div");
  parser.innerHTML = THEME_ORDER.map((id) => buildThemeFontLink(THEMES[id])).join("");
  const currentHrefs = new Set(
    Array.from(doc.head.querySelectorAll<HTMLLinkElement>("link[rel=stylesheet]")).map(
      (link) => link.href
    )
  );
  parser.querySelectorAll<HTMLLinkElement>("link").forEach((link) => {
    if (!currentHrefs.has(link.href)) doc.head.appendChild(link);
  });
}

function prefersReducedMotion(doc: Document): boolean {
  return doc.defaultView?.matchMedia("(prefers-reduced-motion: reduce)").matches ?? false;
}

function measureCards(doc: Document): Map<string, DOMRect> {
  const rects = new Map<string, DOMRect>();
  doc.querySelectorAll(`[${CARD_KEY}]`).forEach((element) => {
    rects.set(element.getAttribute(CARD_KEY) as string, element.getBoundingClientRect());
  });
  return rects;
}

// The board may be scaled to fit its canvas; translations happen in the
// board's own (unscaled) coordinates.
function boardScale(doc: Document): number {
  const panel = doc.querySelector<HTMLElement>(".panel");
  if (!panel || panel.offsetWidth === 0) return 1;
  return panel.getBoundingClientRect().width / panel.offsetWidth || 1;
}

export function patchDocument(doc: Document, html: string, relayout?: () => void): void {
  const next = new DOMParser().parseFromString(html, "text/html");
  const animate = !prefersReducedMotion(doc);
  const before = animate ? measureCards(doc) : new Map<string, DOMRect>();

  syncHead(doc, next);
  const pool = new Map<string, Element>();
  doc.querySelectorAll(`[${CARD_KEY}]`).forEach((element) => {
    pool.set(element.getAttribute(CARD_KEY) as string, element);
  });
  morphChildren(doc.body, next.body, pool);
  relayout?.();

  if (!animate) return;
  const scale = boardScale(doc);
  let entering = 0;
  doc.querySelectorAll<HTMLElement>(`[${CARD_KEY}]`).forEach((element) => {
    const key = element.getAttribute(CARD_KEY) as string;
    const from = before.get(key);
    if (!from) {
      // A card new to this board (another sheet, a swapped-in card) fades in.
      element.animate(
        [
          { opacity: 0, transform: "translateY(6px)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: 280, delay: Math.min(entering++ * 12, 240), easing: EASE, fill: "backwards" }
      );
      return;
    }
    const to = element.getBoundingClientRect();
    const dx = (from.left - to.left) / scale;
    const dy = (from.top - to.top) / scale;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
    element.animate(
      [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
      { duration: 420, easing: EASE }
    );
  });
}
