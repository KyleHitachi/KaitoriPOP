export type FoilTone = "gold" | "silver" | "rainbow";

export interface FoilBadge {
  label: string;
  tone: FoilTone;
  displayLines?: string[];
}

export interface FoilBadgeStyle {
  border: string;
  background: string;
  textBackground: string;
  textColor: string;
  shadow: string;
}

const SPECIAL_FOILS: Array<{
  label: string;
  displayLines?: string[];
  tone: FoilTone;
  patterns: string[];
}> = [
  {
    label: "CF",
    tone: "silver",
    patterns: [
      "cf",
      "cold foil",
      "coldfoil",
      "\u30b3\u30fc\u30eb\u30c9\u30d5\u30a9\u30a4\u30eb",
    ],
  },
  {
    label: "RF",
    tone: "rainbow",
    patterns: [
      "rf",
      "rainbow foil",
      "rainbowfoil",
      "\u30ec\u30a4\u30f3\u30dc\u30fc\u30d5\u30a9\u30a4\u30eb",
    ],
  },
  {
    label: "\u30b7\u30eb\u30d0\u30fc\u30b9\u30af\u30ed\u30fc\u30ebFoil",
    displayLines: ["\u30b7\u30eb\u30d0\u30fc\u30b9\u30af\u30ed\u30fc\u30eb", "Foil"],
    tone: "silver",
    patterns: [
      "\u30b7\u30eb\u30d0\u30fc\u30b9\u30af\u30ed\u30fc\u30ebfoil",
      "\u30b7\u30eb\u30d0\u30fc\u30b9\u30af\u30ed\u30fc\u30eb foil",
      "silver scroll foil",
      "silverscrollfoil",
    ],
  },
  {
    label: "\u30b5\u30fc\u30b8Foil",
    displayLines: ["\u30b5\u30fc\u30b8", "Foil"],
    tone: "rainbow",
    patterns: [
      "\u30b5\u30fc\u30b8foil",
      "\u30b5\u30fc\u30b8 foil",
      "surge foil",
      "surgefoil",
    ],
  },
  {
    label: "\u30ae\u30e3\u30e9\u30af\u30b7\u30fcFoil",
    displayLines: ["\u30ae\u30e3\u30e9\u30af\u30b7\u30fc", "Foil"],
    tone: "rainbow",
    patterns: [
      "\u30ae\u30e3\u30e9\u30af\u30b7\u30fcfoil",
      "\u30ae\u30e3\u30e9\u30af\u30b7\u30fc foil",
      "galaxy foil",
      "galaxyfoil",
    ],
  },
];

const FOIL_STYLES: Record<FoilTone, FoilBadgeStyle> = {
  gold: {
    border: "2px solid rgba(233, 204, 122, 0.46)",
    background:
      "linear-gradient(180deg, rgba(17, 15, 10, 0.78), rgba(36, 28, 13, 0.72))",
    textBackground:
      "linear-gradient(180deg, #fff2bf 0%, #d6ae58 35%, #fff7da 55%, #b9892f 78%, #f2d27e 100%)",
    textColor: "#f5d98c",
    shadow:
      "0 0 18px rgba(201,166,85,0.24), inset 0 0 12px rgba(168,134,58,0.12)",
  },
  silver: {
    border: "2px solid rgba(230, 235, 240, 0.6)",
    background:
      "linear-gradient(180deg, rgba(21, 24, 28, 0.82), rgba(75, 82, 90, 0.76))",
    textBackground:
      "linear-gradient(180deg, #ffffff 0%, #b8c3ce 38%, #f7f9fc 58%, #8995a3 100%)",
    textColor: "#edf3f8",
    shadow:
      "0 0 18px rgba(214,224,233,0.26), inset 0 0 12px rgba(255,255,255,0.12)",
  },
  rainbow: {
    border: "2px solid rgba(255, 255, 255, 0.62)",
    background:
      "linear-gradient(135deg, rgba(54, 24, 92, 0.86), rgba(12, 93, 111, 0.78), rgba(139, 45, 96, 0.82))",
    textBackground:
      "linear-gradient(90deg, #ff6b9d 0%, #ffd166 24%, #8af0a4 48%, #66d9ff 72%, #c99bff 100%)",
    textColor: "#f6ddff",
    shadow:
      "0 0 20px rgba(122,205,255,0.34), inset 0 0 14px rgba(255,255,255,0.16)",
  },
};

function normalizeFoilText(value: string): string {
  return value.trim().replace(/[\s\u3000_\-・]+/g, " ").toLowerCase();
}

function compactFoilText(value: string): string {
  return normalizeFoilText(value).replace(/\s+/g, "");
}

export function resolveSpecialFoilBadge(values: string[]): FoilBadge | null {
  const normalizedValues = values.flatMap((value) => [
    normalizeFoilText(value),
    compactFoilText(value),
  ]);

  for (const foil of SPECIAL_FOILS) {
    if (
      foil.patterns.some((pattern) => {
        const normalizedPattern = normalizeFoilText(pattern);
        const compactPattern = compactFoilText(pattern);
        return normalizedValues.some((value) => {
          if (compactPattern.length <= 2) {
            const tokenPattern = new RegExp(`(^|\\s)${normalizedPattern}(\\s|$)`);
            return (
              value === normalizedPattern ||
              value === compactPattern ||
              tokenPattern.test(value)
            );
          }
          return value.includes(normalizedPattern) || value.includes(compactPattern);
        });
      })
    ) {
      return {
        label: foil.label,
        tone: foil.tone,
        displayLines: foil.displayLines,
      };
    }
  }

  return null;
}

export function resolveFoilBadgeStyle(tone: FoilTone = "gold"): FoilBadgeStyle {
  return FOIL_STYLES[tone];
}
